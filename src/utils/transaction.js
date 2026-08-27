/**
 * transaction.js
 * Core Stellar transaction building and signing utilities.
 *
 * This module is the single source of truth for constructing,
 * signing, and preparing Stellar payment transactions in stellar-box.
 *
 * SDK primitives used:
 *   - TransactionBuilder  — assembles operations into a transaction envelope
 *   - Operation.payment   — the payment operation (XLM native transfer)
 *   - Asset.native()      — the native XLM asset
 *   - Networks.TESTNET    — network passphrase for Testnet
 *   - Memo                — optional memo attachment
 *   - TransactionBuilder.fromXDR — deserialise a signed XDR envelope
 *
 * Freighter API:
 *   - signTransaction     — requests user approval + signature via Freighter popup
 */
import {
  TransactionBuilder,
  Operation,
  Asset,
  Networks,
  Memo,
  BASE_FEE,
} from '@stellar/stellar-sdk';
import { signTransaction } from '@stellar/freighter-api';
import { horizonServer } from './horizon';

/* ── Constants ────────────────────────────────────────────── */

/**
 * Default transaction timeout in seconds.
 * Stellar transactions expire if not submitted within this window.
 * 3 minutes gives enough time for the Freighter popup + submission.
 */
export const TX_TIMEOUT_SECONDS = 180;

/**
 * Maximum fee per operation in stroops (1 XLM = 10_000_000 stroops).
 * We set a ceiling of 10× BASE_FEE to gracefully handle fee bumps
 * during network congestion without overpaying.
 */
export const MAX_FEE_STROOPS = String(Number(BASE_FEE) * 10); // "1000"

/* ── Main builder ─────────────────────────────────────────── */

/**
 * buildPaymentTransaction({ sourcePublicKey, destinationPublicKey, amount, memo })
 *
 * Constructs a signed-ready Stellar payment transaction envelope.
 * The transaction is NOT yet signed — Freighter handles signing in Step 8.
 *
 * Steps performed:
 *  1. Load the source account from Horizon (gets current sequence number)
 *  2. Fetch the network's recommended base fee from Horizon fee stats
 *  3. Build a TransactionBuilder with:
 *       - Source account + sequence number
 *       - Fee: max(recommendedFee, MAX_FEE_STROOPS)
 *       - Network passphrase: Networks.TESTNET
 *       - Timeout: TX_TIMEOUT_SECONDS seconds
 *  4. Add Operation.payment:
 *       - destination: destinationPublicKey
 *       - asset: Asset.native() (XLM)
 *       - amount: string representation with up to 7 decimal places
 *  5. Optionally attach a Memo.text if memo is provided
 *  6. Call .build() → returns an unsigned Transaction object
 *
 * @param {object} params
 * @param {string}        params.sourcePublicKey       - Sender's Stellar G... address
 * @param {string}        params.destinationPublicKey  - Recipient's Stellar G... address
 * @param {string|number} params.amount                - XLM amount to send (decimal string)
 * @param {string}        [params.memo]                - Optional text memo (max 28 bytes)
 *
 * @returns {Promise<Transaction>} Unsigned Stellar Transaction object
 * @throws  {Error} If account load fails or parameters are invalid
 */
export async function buildPaymentTransaction({
  sourcePublicKey,
  destinationPublicKey,
  amount,
  memo = '',
}) {
  /* ── Guard ── */
  if (!sourcePublicKey)      throw new Error('buildPaymentTransaction: sourcePublicKey is required.');
  if (!destinationPublicKey) throw new Error('buildPaymentTransaction: destinationPublicKey is required.');
  if (!amount || Number(amount) <= 0) throw new Error('buildPaymentTransaction: amount must be positive.');

  /* ── Step 1: Load source account (fetches current sequence number) ── */
  const sourceAccount = await horizonServer.loadAccount(sourcePublicKey);

  /* ── Step 2: Fetch recommended fee from Horizon ── */
  let recommendedFee;
  try {
    const feeStats = await horizonServer.feeStats();
    // Use the 90th-percentile fee for reliable inclusion
    recommendedFee = feeStats?.fee_charged?.p90 ?? MAX_FEE_STROOPS;
  } catch {
    // Fall back to our ceiling if fee stats are unavailable
    recommendedFee = MAX_FEE_STROOPS;
  }

  // Never pay more than our ceiling, and never pay less than the Stellar BASE_FEE
  const effectiveFee = String(
    Math.min(
      Math.max(Number(recommendedFee), Number(BASE_FEE)),
      Number(MAX_FEE_STROOPS)
    )
  );

  /* ── Step 3: Normalise the amount to a 7-decimal string ── */
  // Stellar SDK requires the amount to have at most 7 decimal places
  const amountStr = Number(amount).toFixed(7);

  /* ── Step 4: Build the transaction ── */
  const builder = new TransactionBuilder(sourceAccount, {
    fee:            effectiveFee,
    networkPassphrase: Networks.TESTNET,
  });

  // Add the payment operation
  builder.addOperation(
    Operation.payment({
      destination: destinationPublicKey,
      asset:       Asset.native(),   // XLM (native asset)
      amount:      amountStr,
    })
  );

  /* ── Step 5: Attach optional memo ── */
  if (memo && memo.trim()) {
    // Stellar text memos are limited to 28 bytes; truncate safely
    const memoText = memo.trim().slice(0, 28);
    builder.addMemo(Memo.text(memoText));
  }

  /* ── Step 6: Set timeout and build ── */
  const transaction = builder
    .setTimeout(TX_TIMEOUT_SECONDS)
    .build();

  return transaction;
}

/* ── Helpers ──────────────────────────────────────────────── */

/**
 * transactionToXDR(transaction)
 * Serialize a Transaction object to its base64-encoded XDR envelope string.
 * This is the format Freighter expects for signing.
 *
 * @param {Transaction} transaction
 * @returns {string} base64 XDR
 */
export function transactionToXDR(transaction) {
  return transaction.toEnvelope().toXDR('base64');
}

/**
 * xdrToTransaction(xdr)
 * Deserialise a base64 XDR envelope string back into a Transaction object.
 * Used after Freighter returns a signed XDR so we can submit it to Horizon.
 *
 * @param {string} xdr - base64 XDR envelope
 * @returns {Transaction}
 */
export function xdrToTransaction(xdr) {
  return TransactionBuilder.fromXDR(xdr, Networks.TESTNET);
}

/**
 * signPaymentTransaction({ xdr, accountToSign })
 * Requests the user's Freighter wallet to sign the given XDR envelope.
 *
 * How Freighter signing works:
 *  1. Calls signTransaction(xdr, options) from @stellar/freighter-api
 *  2. Freighter opens a browser popup showing the transaction details
 *  3. User reviews and clicks "Approve" or "Reject"
 *  4. On approval: Freighter returns a signed XDR string
 *  5. On rejection or error: throws an Error
 *
 * @param {object} params
 * @param {string} params.xdr             - Unsigned transaction XDR (base64)
 * @param {string} [params.accountToSign] - Public key that must sign (optional guard)
 *
 * @returns {Promise<string>} Signed transaction XDR (base64)
 * @throws  {Error} If user rejects or Freighter is unavailable
 */
export async function signPaymentTransaction({ xdr, accountToSign }) {
  if (!xdr) throw new Error('signPaymentTransaction: xdr is required.');

  const signResult = await signTransaction(xdr, {
    networkPassphrase: Networks.TESTNET,
    ...(accountToSign ? { accountToSign } : {}),
  });

  // The freighter-api v2+ returns { signedTxXdr, signerAddress } or throws
  // Handle both the legacy string return and the new object return shape
  if (signResult?.error) {
    throw new Error(signResult.error);
  }

  const signedXdr = signResult?.signedTxXdr ?? signResult;

  if (!signedXdr || typeof signedXdr !== 'string') {
    throw new Error('Freighter did not return a signed XDR. Was the transaction rejected?');
  }

  return signedXdr;
}

/**
 * getTxExplorerUrl(txHash)
 * Returns a Stellar Expert link to inspect the submitted transaction.
 *
 * @param {string} txHash - Transaction hash (hex)
 * @returns {string} URL
 */
export function getTxExplorerUrl(txHash) {
  return `https://stellar.expert/explorer/testnet/tx/${txHash}`;
}

/**
 * getFeeInXLM(feeStroops)
 * Convert a stroop fee amount to a human-readable XLM string.
 *
 * @param {string|number} feeStroops
 * @returns {string} e.g. "0.0001000"
 */
export function getFeeInXLM(feeStroops) {
  return (Number(feeStroops) / 1e7).toFixed(7);
}

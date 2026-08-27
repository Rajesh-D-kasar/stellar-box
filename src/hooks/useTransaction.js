/**
 * useTransaction.js
 * Custom hook — owns the full transaction lifecycle state machine.
 *
 * State machine:
 *
 *   IDLE
 *     │ execute(fields) called
 *     ▼
 *   BUILDING ────────────────────────────────── error ──► ERROR
 *     │ TransactionBuilder + Operation.payment built
 *     ▼
 *   AWAITING_SIGNATURE ──────────────────────── user rejects / error ──► ERROR
 *     │ Freighter signTransaction() approved
 *     ▼
 *   SUBMITTING ──────────────────────────────── error ──► ERROR
 *     │ horizonServer.submitTransaction() accepted
 *     ▼
 *   SUCCESS
 */
import { useState, useCallback } from 'react';
import {
  buildPaymentTransaction,
  signPaymentTransaction,
  xdrToTransaction,
  transactionToXDR,
  getTxExplorerUrl,
  getFeeInXLM,
} from '../utils/transaction';
import { horizonServer } from '../utils/horizon';

/* ── Status enum ─────────────────────────────────────────── */
export const TX_STATUS = Object.freeze({
  IDLE:               'idle',
  BUILDING:           'building',           // loadAccount + feeStats + build
  AWAITING_SIGNATURE: 'awaiting_signature', // Freighter popup open — waiting for user
  SUBMITTING:         'submitting',         // submitTransaction to Horizon in progress
  SUCCESS:            'success',            // transaction confirmed on-chain
  ERROR:              'error',              // any phase failed
});

/* ── Friendly Freighter error message map ─────────────────── */
const FREIGHTER_ERROR_MAP = {
  'User declined access': 'You declined the signature request in Freighter.',
  'Transaction declined': 'You declined to sign the transaction in Freighter.',
  'Request was cancelled': 'The signature request was cancelled.',
};

function friendlyFreighterError(raw) {
  for (const [key, msg] of Object.entries(FREIGHTER_ERROR_MAP)) {
    if (raw?.includes(key)) return msg;
  }
  return raw ?? 'Freighter signing failed.';
}

/* ── Hook ─────────────────────────────────────────────────── */
export function useTransaction() {
  const [status,      setStatus]      = useState(TX_STATUS.IDLE);
  const [transaction, setTransaction] = useState(null);  // built Transaction object
  const [txXDR,       setTxXDR]       = useState(null);  // unsigned base64 XDR
  const [signedXDR,   setSignedXDR]   = useState(null);  // signed base64 XDR
  const [txHash,      setTxHash]      = useState(null);  // submitted transaction hash
  const [fee,         setFee]         = useState(null);  // human-readable XLM fee
  const [error,       setError]       = useState(null);

  /* ── Helpers ── */
  const reset = useCallback(() => {
    setStatus(TX_STATUS.IDLE);
    setTransaction(null);
    setTxXDR(null);
    setSignedXDR(null);
    setTxHash(null);
    setFee(null);
    setError(null);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
    if (status === TX_STATUS.ERROR) setStatus(TX_STATUS.IDLE);
  }, [status]);

  /**
   * execute({ sourcePublicKey, recipient, amount, memo })
   *
   * Runs the full 3-phase payment lifecycle:
   *   Phase 1 — BUILD:     TransactionBuilder + Operation.payment
   *   Phase 2 — SIGN:      Freighter signTransaction() popup
   *   Phase 3 — SUBMIT:    horizonServer.submitTransaction()
   */
  const execute = useCallback(async ({
    sourcePublicKey,
    recipient,
    amount,
    memo = '',
  }) => {
    reset();

    /* ══════════════════════════════════════════════════════════
       PHASE 1 — BUILD
       Constructs the unsigned transaction envelope with correct
       sequence number, fee, network passphrase, and timeout.
    ══════════════════════════════════════════════════════════ */
    setStatus(TX_STATUS.BUILDING);
    let builtTx;
    let unsignedXdr;
    try {
      builtTx = await buildPaymentTransaction({
        sourcePublicKey,
        destinationPublicKey: recipient,
        amount,
        memo,
      });
      unsignedXdr = transactionToXDR(builtTx);

      setTransaction(builtTx);
      setTxXDR(unsignedXdr);
      setFee(getFeeInXLM(builtTx.fee));

      console.info('[stellar-box] ✅ Phase 1 complete — transaction built.');
      console.info('  Fee:', getFeeInXLM(builtTx.fee), 'XLM');
      console.info('  Sequence:', builtTx.sequence);

    } catch (err) {
      const msg = err?.message ?? 'Failed to build transaction.';
      console.error('[stellar-box] ❌ Build error:', msg);
      setError(msg);
      setStatus(TX_STATUS.ERROR);
      return;
    }

    /* ══════════════════════════════════════════════════════════
       PHASE 2 — SIGN
       Sends the unsigned XDR to Freighter. The user sees a popup
       with full transaction details (amount, recipient, fee) and
       must click "Approve" to produce a signed XDR.

       Key: networkPassphrase: Networks.TESTNET must match the
       passphrase used during build, otherwise Freighter rejects.
    ══════════════════════════════════════════════════════════ */
    setStatus(TX_STATUS.AWAITING_SIGNATURE);
    let signedXdr;
    try {
      console.info('[stellar-box] 🔑 Phase 2 — requesting Freighter signature…');

      signedXdr = await signPaymentTransaction({
        xdr:            unsignedXdr,
        accountToSign:  sourcePublicKey,  // ensures correct account signs
      });

      setSignedXDR(signedXdr);
      console.info('[stellar-box] ✅ Phase 2 complete — transaction signed by Freighter.');

    } catch (err) {
      const msg = friendlyFreighterError(err?.message);
      console.error('[stellar-box] ❌ Signature error:', msg);
      setError(msg);
      setStatus(TX_STATUS.ERROR);
      return;
    }

    /* ══════════════════════════════════════════════════════════
       PHASE 3 — SUBMIT
       Deserialise the signed XDR back into a Transaction object,
       then broadcast it to Horizon. On success, store the tx hash.
    ══════════════════════════════════════════════════════════ */
    setStatus(TX_STATUS.SUBMITTING);
    try {
      console.info('[stellar-box] 📡 Phase 3 — submitting to Horizon Testnet…');

      // Deserialise signed XDR → Transaction object
      const signedTx = xdrToTransaction(signedXdr);

      // Submit to Horizon
      const result = await horizonServer.submitTransaction(signedTx);

      setTxHash(result.hash);
      setStatus(TX_STATUS.SUCCESS);

      console.info('[stellar-box] 🎉 Phase 3 complete — transaction submitted!');
      console.info('  Hash:', result.hash);
      console.info('  Ledger:', result.ledger);

    } catch (err) {
      // Horizon returns structured error details in err.response?.data
      const horizonDetail =
        err?.response?.data?.extras?.result_codes?.transaction ??
        err?.response?.data?.extras?.result_codes?.operations?.[0];

      const msg = horizonDetail
        ? `Horizon rejected the transaction: ${horizonDetail}`
        : (err?.message ?? 'Failed to submit transaction to Horizon.');

      console.error('[stellar-box] ❌ Submit error:', msg);
      setError(msg);
      setStatus(TX_STATUS.ERROR);
    }
  }, [reset]);

  /* ── Derived ── */
  const isLoading =
    status === TX_STATUS.BUILDING   ||
    status === TX_STATUS.SUBMITTING;

  const isAwaitingSignature = status === TX_STATUS.AWAITING_SIGNATURE;

  const explorerUrl = txHash ? getTxExplorerUrl(txHash) : null;

  return {
    // State
    status,
    transaction,
    txXDR,
    signedXDR,
    txHash,
    fee,
    error,
    // Derived
    isLoading,
    isAwaitingSignature,
    explorerUrl,
    // Actions
    execute,
    reset,
    clearError,
  };
}

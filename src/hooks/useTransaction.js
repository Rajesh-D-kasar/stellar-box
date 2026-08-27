/**
 * useTransaction.js
 * Custom hook — owns the full transaction lifecycle state machine.
 *
 * State machine:
 *
 *   IDLE
 *     │ execute(fields) called
 *     ▼
 *   BUILDING ── error ──► ERROR
 *     │ transaction built
 *     ▼
 *   AWAITING_SIGNATURE ── user rejects / error ──► ERROR
 *     │ Freighter signing integrated (Step 8)
 *     ▼
 *   SUBMITTING ── error ──► ERROR
 *     │ Horizon accepts
 *     ▼
 *   SUCCESS
 *
 * This hook handles BUILDING in Step 7.
 * AWAITING_SIGNATURE and SUBMITTING are stubbed — Step 8 fills them in.
 */
import { useState, useCallback } from 'react';
import {
  buildPaymentTransaction,
  transactionToXDR,
  getTxExplorerUrl,
  getFeeInXLM,
} from '../utils/transaction';

/* ── Status enum ─────────────────────────────────────────── */
export const TX_STATUS = Object.freeze({
  IDLE:               'idle',
  BUILDING:           'building',           // loadAccount + feeStats + build
  AWAITING_SIGNATURE: 'awaiting_signature', // Freighter popup open (Step 8)
  SUBMITTING:         'submitting',         // submitTransaction in progress (Step 8)
  SUCCESS:            'success',
  ERROR:              'error',
});

/* ── Hook ─────────────────────────────────────────────────── */
export function useTransaction() {
  const [status,      setStatus]      = useState(TX_STATUS.IDLE);
  const [transaction, setTransaction] = useState(null);  // built Transaction object
  const [txXDR,       setTxXDR]       = useState(null);  // base64 XDR for Freighter
  const [txHash,      setTxHash]      = useState(null);  // submitted tx hash
  const [fee,         setFee]         = useState(null);  // human-readable XLM fee
  const [error,       setError]       = useState(null);

  /* ── Helpers ── */
  const reset = useCallback(() => {
    setStatus(TX_STATUS.IDLE);
    setTransaction(null);
    setTxXDR(null);
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
   * Phase 1 (Step 7): Build the transaction
   *   → loadAccount, feeStats, TransactionBuilder, Operation.payment
   *
   * Phase 2 (Step 8 stub): Sign + Submit
   *   → signTransaction (Freighter), submitTransaction (Horizon)
   */
  const execute = useCallback(async ({
    sourcePublicKey,
    recipient,
    amount,
    memo = '',
  }) => {
    reset();

    /* ──────────────────────────────────────────────────────────
       PHASE 1 — BUILD
       ────────────────────────────────────────────────────────── */
    setStatus(TX_STATUS.BUILDING);
    let builtTx;
    try {
      builtTx = await buildPaymentTransaction({
        sourcePublicKey,
        destinationPublicKey: recipient,
        amount,
        memo,
      });

      const xdr = transactionToXDR(builtTx);

      setTransaction(builtTx);
      setTxXDR(xdr);
      setFee(getFeeInXLM(builtTx.fee));

      console.info('[stellar-box] Transaction built successfully.');
      console.info('  XDR:', xdr);
      console.info('  Fee:', getFeeInXLM(builtTx.fee), 'XLM');
      console.info('  Sequence:', builtTx.sequence);
      console.info('  Timeout:', `${builtTx.timeBounds?.maxTime} (unix)`);

    } catch (err) {
      const msg = err?.message ?? 'Failed to build transaction.';
      console.error('[stellar-box] Transaction build error:', msg);
      setError(msg);
      setStatus(TX_STATUS.ERROR);
      return;
    }

    /* ──────────────────────────────────────────────────────────
       PHASE 2 — SIGN (Step 8 stub)
       ────────────────────────────────────────────────────────── */
    setStatus(TX_STATUS.AWAITING_SIGNATURE);
    // TODO Step 8: const signedXDR = await signTransaction(txXDR, { networkPassphrase: Networks.TESTNET });

    /* ──────────────────────────────────────────────────────────
       PHASE 3 — SUBMIT (Step 8 stub)
       ────────────────────────────────────────────────────────── */
    // setStatus(TX_STATUS.SUBMITTING);
    // TODO Step 8: const result = await horizonServer.submitTransaction(signedTx);
    // setTxHash(result.hash);
    // setStatus(TX_STATUS.SUCCESS);

    // For Step 7 — park at AWAITING_SIGNATURE so UI can display the built tx
    console.info(
      '[stellar-box] Transaction ready for signing. ' +
      'Freighter signing integration will be added in Step 8.'
    );
  }, [reset]);

  /* ── Derived ── */
  const isLoading =
    status === TX_STATUS.BUILDING ||
    status === TX_STATUS.SUBMITTING;

  const explorerUrl = txHash ? getTxExplorerUrl(txHash) : null;

  return {
    // State
    status,
    transaction,
    txXDR,
    txHash,
    fee,
    error,
    // Derived
    isLoading,
    explorerUrl,
    // Actions
    execute,
    reset,
    clearError,
  };
}

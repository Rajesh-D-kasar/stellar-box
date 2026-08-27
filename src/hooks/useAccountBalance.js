/**
 * useAccountBalance.js
 * Custom hook — fetches and manages XLM + token balances for a Stellar account.
 *
 * Responsibilities:
 *  - Auto-fetch when publicKey changes (wallet connect/disconnect)
 *  - Expose BALANCE_STATUS enum for precise UI state rendering
 *  - Manual refetch via refresh()
 *  - 30-second auto-polling while wallet is connected
 *  - Clean abort on unmount / publicKey change
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchAccountBalances, parseAllBalances } from '../utils/horizon';

/* ── Status enum ─────────────────────────────────────────── */
export const BALANCE_STATUS = Object.freeze({
  IDLE:     'idle',     // no publicKey provided
  LOADING:  'loading',  // fetch in progress
  SUCCESS:  'success',  // balances loaded
  ERROR:    'error',    // fetch failed
});

const POLL_INTERVAL_MS = 30_000; // re-fetch every 30 s while connected

/* ── Hook ─────────────────────────────────────────────────── */
export function useAccountBalance(publicKey) {
  const [status,   setStatus]   = useState(BALANCE_STATUS.IDLE);
  const [balances, setBalances] = useState([]); // parsed balance objects
  const [xlm,      setXlm]      = useState(null); // native XLM string
  const [error,    setError]    = useState(null);
  const [lastFetched, setLastFetched] = useState(null); // Date

  // Keep a ref so the interval callback always sees the latest publicKey
  const publicKeyRef = useRef(publicKey);
  publicKeyRef.current = publicKey;

  /* ── Core fetch function ── */
  const doFetch = useCallback(async (key, signal) => {
    if (!key) return;
    setStatus(BALANCE_STATUS.LOADING);
    setError(null);

    try {
      const rawBalances = await fetchAccountBalances(key);

      // Abort guard — don't update state if the component unmounted
      // or the publicKey changed while we were fetching
      if (signal?.aborted) return;

      const parsed  = parseAllBalances(rawBalances);
      const nativeB = parsed.find((b) => b.isNative);

      setBalances(parsed);
      setXlm(nativeB?.balance ?? '0.0000000');
      setLastFetched(new Date());
      setStatus(BALANCE_STATUS.SUCCESS);
    } catch (err) {
      if (signal?.aborted) return;
      setError(err?.message ?? 'Failed to fetch account balances.');
      setStatus(BALANCE_STATUS.ERROR);
    }
  }, []);

  /* ── Effect: fetch on publicKey change + polling ── */
  useEffect(() => {
    if (!publicKey) {
      // Wallet disconnected — reset to idle
      setStatus(BALANCE_STATUS.IDLE);
      setBalances([]);
      setXlm(null);
      setError(null);
      return;
    }

    const abortController = new AbortController();

    // Initial fetch immediately
    doFetch(publicKey, abortController.signal);

    // Poll every 30 s
    const intervalId = setInterval(() => {
      doFetch(publicKeyRef.current, abortController.signal);
    }, POLL_INTERVAL_MS);

    return () => {
      abortController.abort();
      clearInterval(intervalId);
    };
  }, [publicKey, doFetch]);

  /** Manual refresh — exposed to UI */
  const refresh = useCallback(() => {
    doFetch(publicKeyRef.current, null);
  }, [doFetch]);

  return {
    status,
    balances,   // all token balances (parsed)
    xlm,        // native XLM balance string
    error,
    lastFetched,
    refresh,
    // Derived
    isLoading: status === BALANCE_STATUS.LOADING,
    isSuccess: status === BALANCE_STATUS.SUCCESS,
    hasError:  status === BALANCE_STATUS.ERROR,
  };
}

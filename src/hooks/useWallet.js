/**
 * useWallet.js
 * Custom hook — full Freighter wallet lifecycle management.
 *
 * Responsibilities:
 *  - Detect whether Freighter extension is installed
 *  - Re-hydrate session on mount (if user was previously connected)
 *  - connect()     → requestAccess() + getAddress()
 *  - disconnect()  → clear local state
 *  - Expose typed status enum so UI can render distinct states
 */
import { useState, useCallback, useEffect } from 'react';
import {
  isConnected,
  isAllowed,
  requestAccess,
  getAddress,
} from '@stellar/freighter-api';

/* ── Status enum ─────────────────────────────────────────── */
export const WALLET_STATUS = Object.freeze({
  IDLE:        'idle',        // initial / unknown
  CHECKING:    'checking',   // probing Freighter on mount
  NOT_INSTALLED: 'not_installed', // extension not found
  DISCONNECTED: 'disconnected',  // installed but no active session
  CONNECTING:  'connecting', // requestAccess in progress
  CONNECTED:   'connected',  // public key available
  ERROR:       'error',      // last action failed
});

/* ── Hook ─────────────────────────────────────────────────── */
export function useWallet() {
  const [status,    setStatus]    = useState(WALLET_STATUS.IDLE);
  const [publicKey, setPublicKey] = useState(null);
  const [error,     setError]     = useState(null);

  /* ── Helpers ── */
  const clearError = () => setError(null);

  /**
   * Probe Freighter on mount:
   *  1. isConnected() → detects extension presence
   *  2. isAllowed()   → checks existing session authorization
   *  3. getAddress()  → re-hydrate public key if already authorized
   */
  useEffect(() => {
    let cancelled = false;

    async function probe() {
      setStatus(WALLET_STATUS.CHECKING);
      try {
        // Step 1 — is the extension installed?
        const connResult = await isConnected();

        if (!connResult?.isConnected) {
          if (!cancelled) setStatus(WALLET_STATUS.NOT_INSTALLED);
          return;
        }

        // Step 2 — does the user have an existing authorized session?
        const allowedResult = await isAllowed();

        if (!allowedResult?.isAllowed) {
          if (!cancelled) setStatus(WALLET_STATUS.DISCONNECTED);
          return;
        }

        // Step 3 — re-hydrate the public key
        const addrResult = await getAddress();
        if (!cancelled) {
          if (addrResult?.address) {
            setPublicKey(addrResult.address);
            setStatus(WALLET_STATUS.CONNECTED);
          } else {
            setStatus(WALLET_STATUS.DISCONNECTED);
          }
        }
      } catch {
        // Freighter threw (e.g. extension loading) — treat as disconnected
        if (!cancelled) setStatus(WALLET_STATUS.DISCONNECTED);
      }
    }

    probe();
    return () => { cancelled = true; };
  }, []);

  /**
   * connect()
   * Calls requestAccess() to prompt the Freighter popup,
   * then calls getAddress() to retrieve the active public key.
   */
  const connect = useCallback(async () => {
    clearError();
    setStatus(WALLET_STATUS.CONNECTING);
    try {
      // Prompt Freighter authorization popup
      const accessResult = await requestAccess();
      if (accessResult?.error) throw new Error(accessResult.error);

      // Retrieve the authorized public key
      const addrResult = await getAddress();
      if (addrResult?.error)   throw new Error(addrResult.error);
      if (!addrResult?.address) throw new Error('No address returned by Freighter.');

      setPublicKey(addrResult.address);
      setStatus(WALLET_STATUS.CONNECTED);
    } catch (err) {
      setError(err?.message ?? 'Wallet connection failed.');
      setStatus(WALLET_STATUS.ERROR);
    }
  }, []);

  /**
   * disconnect()
   * Clears local state. Freighter has no JS-side logout API,
   * so we simply forget the public key on our end.
   */
  const disconnect = useCallback(() => {
    setPublicKey(null);
    setError(null);
    setStatus(WALLET_STATUS.DISCONNECTED);
  }, []);

  /* ── Derived booleans (convenience) ── */
  const isFreighterInstalled = status !== WALLET_STATUS.NOT_INSTALLED
                            && status !== WALLET_STATUS.IDLE
                            && status !== WALLET_STATUS.CHECKING;

  const isWalletConnected    = status === WALLET_STATUS.CONNECTED;
  const isConnecting         = status === WALLET_STATUS.CONNECTING
                            || status === WALLET_STATUS.CHECKING;

  return {
    // State
    status,
    publicKey,
    error,
    // Derived
    isFreighterInstalled,
    isWalletConnected,
    isConnecting,
    // Actions
    connect,
    disconnect,
    clearError,
  };
}

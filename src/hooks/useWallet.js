/**
 * useWallet.js
 * Custom hook — manages Freighter wallet connection state.
 * Uses @stellar/freighter-api (installed in Step 2).
 */
import { useState, useCallback, useEffect } from 'react';
import {
  isConnected,
  getAddress,
  requestAccess,
} from '@stellar/freighter-api';

export function useWallet() {
  const [publicKey, setPublicKey] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);

  /** Re-hydrate wallet from Freighter on mount (if already authorized). */
  useEffect(() => {
    async function rehydrate() {
      try {
        const connected = await isConnected();
        if (connected?.isConnected) {
          const result = await getAddress();
          if (result?.address) setPublicKey(result.address);
        }
      } catch {
        // Freighter not installed or not authorized yet — silently ignore.
      }
    }
    rehydrate();
  }, []);

  const connect = useCallback(async () => {
    setIsConnecting(true);
    setError(null);
    try {
      const accessResult = await requestAccess();
      if (accessResult?.error) throw new Error(accessResult.error);
      const addressResult = await getAddress();
      if (addressResult?.error) throw new Error(addressResult.error);
      setPublicKey(addressResult.address);
    } catch (err) {
      setError(err?.message ?? 'Failed to connect wallet');
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    setPublicKey(null);
    setError(null);
  }, []);

  const isConnectedState = Boolean(publicKey);

  return { publicKey, isConnectedState, isConnecting, error, connect, disconnect };
}

/**
 * useWallet.js
 * Custom hook — manages Freighter wallet connection state.
 * Freighter SDK will be integrated in a later step.
 */
import { useState, useCallback } from 'react';

export function useWallet() {
  const [publicKey, setPublicKey] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);

  const connect = useCallback(async () => {
    setIsConnecting(true);
    setError(null);
    try {
      // TODO: integrate @stellar/freighter-api
      // const { publicKey } = await requestAccess();
      // setPublicKey(publicKey);
      console.warn('Wallet connection: Freighter SDK not yet integrated.');
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

  return { publicKey, isConnecting, error, connect, disconnect };
}

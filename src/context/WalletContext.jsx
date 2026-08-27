/**
 * WalletContext.jsx
 * React context — exposes full wallet state to the component tree.
 * Consumers use `useWalletContext()` — never instantiate useWallet() directly.
 */
import { createContext, useContext } from 'react';
import { useWallet } from '../hooks/useWallet';

const WalletContext = createContext(null);

/**
 * WalletProvider
 * Wrap your app (or subtree) with this to make wallet state available.
 */
export function WalletProvider({ children }) {
  const wallet = useWallet();
  return (
    <WalletContext.Provider value={wallet}>
      {children}
    </WalletContext.Provider>
  );
}

/**
 * useWalletContext()
 * Convenience hook — throws a descriptive error if used outside the provider.
 *
 * Returns:
 *  { status, publicKey, error,
 *    isFreighterInstalled, isWalletConnected, isConnecting,
 *    connect, disconnect, clearError }
 */
export function useWalletContext() {
  const ctx = useContext(WalletContext);
  if (!ctx) {
    throw new Error(
      'useWalletContext() must be called inside <WalletProvider>. ' +
      'Make sure your component is a descendant of WalletProvider in App.jsx.'
    );
  }
  return ctx;
}

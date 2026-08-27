/**
 * WalletContext.jsx
 * React context — provides wallet state globally across the component tree.
 */
import { createContext, useContext } from 'react';
import { useWallet } from '../hooks/useWallet';

const WalletContext = createContext(null);

export function WalletProvider({ children }) {
  const wallet = useWallet();
  return (
    <WalletContext.Provider value={wallet}>
      {children}
    </WalletContext.Provider>
  );
}

/** Convenience hook to consume the wallet context. */
export function useWalletContext() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error('useWalletContext must be used inside <WalletProvider>');
  return ctx;
}

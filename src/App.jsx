/**
 * App.jsx
 * Root application component — wires up providers, layout, and pages.
 */
import { WalletProvider } from './context/WalletContext';
import { Navbar, Header, BalanceDashboard, TransferForm } from './components';

export default function App() {
  /**
   * Placeholder — Step 7 will replace this with the actual
   * transaction building + signing + submission logic.
   */
  function handleTransferSubmit(fields) {
    console.log('[stellar-box] Transfer form submitted:', fields);
    // TODO Step 7: build transaction, sign with Freighter, submit to Horizon
  }

  return (
    <WalletProvider>
      {/* Sticky top navigation with live wallet connect widget */}
      <Navbar />

      {/* Full-width page header — "Stellar Box - dApp" */}
      <Header />

      {/* Main dashboard content */}
      <main id="main-content">
        {/* XLM balance card + token list */}
        <BalanceDashboard />

        {/* Divider */}
        <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)', margin: '0 auto', maxWidth: '760px' }} />

        {/* XLM transfer form with live validation */}
        <TransferForm onSubmit={handleTransferSubmit} />
      </main>
    </WalletProvider>
  );
}

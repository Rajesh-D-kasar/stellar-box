/**
 * App.jsx
 * Root application component — wires up providers, layout, and pages.
 */
import { WalletProvider }                      from './context/WalletContext';
import { useWalletContext }                    from './context/WalletContext';
import { useTransaction }                      from './hooks/useTransaction';
import {
  Navbar,
  Header,
  BalanceDashboard,
  TransferForm,
  TransactionStatus,
} from './components';

/* ── Inner shell (needs WalletProvider context) ── */
function AppShell() {
  const { publicKey } = useWalletContext();

  const {
    status, transaction, txXDR, fee, txHash, explorerUrl, error,
    execute, reset, clearError,
  } = useTransaction();

  /**
   * handleTransferSubmit({ recipient, amount })
   * Called by TransferForm when the user clicks "Review & Send"
   * and the form passes validation.
   *
   * Step 7: builds the transaction (loadAccount → feeStats → TransactionBuilder)
   * Step 8: will sign (Freighter) and submit (Horizon)
   */
  async function handleTransferSubmit({ recipient, amount }) {
    await execute({
      sourcePublicKey: publicKey,
      recipient,
      amount,
    });
  }

  return (
    <>
      {/* Sticky top navigation with live wallet connect widget */}
      <Navbar />

      {/* Full-width page header — "Stellar Box - dApp" */}
      <Header />

      {/* Main dashboard content */}
      <main id="main-content" className="dashboard-container">
        {/* XLM balance card + token list */}
        <BalanceDashboard />

        {/* Divider */}
        <hr style={{
          border: 'none',
          borderTop: '1px solid var(--color-border)',
          width: '100%',
          maxWidth: '760px',
          margin: '0 auto',
        }} />

        {/* XLM transfer form — locked until wallet is connected */}
        <TransferForm onSubmit={handleTransferSubmit} />

        {/* Transaction lifecycle status card */}
        <TransactionStatus
          status={status}
          transaction={transaction}
          txXDR={txXDR}
          fee={fee}
          txHash={txHash}
          explorerUrl={explorerUrl}
          error={error}
          onReset={reset}
          onClearError={clearError}
        />
      </main>
    </>
  );
}

/* ── Root with WalletProvider ── */
export default function App() {
  return (
    <WalletProvider>
      <AppShell />
    </WalletProvider>
  );
}

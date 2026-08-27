/**
 * App.jsx
 * Root application component — wires up providers, layout, and pages.
 */
import { WalletProvider } from './context/WalletContext';
import { Navbar, Header, BalanceDashboard } from './components';

export default function App() {
  return (
    <WalletProvider>
      {/* Sticky top navigation with live wallet connect widget */}
      <Navbar />

      {/* Full-width page header — "Stellar Box - dApp" */}
      <Header />

      {/* Main dashboard — XLM balance fetched from Horizon Testnet */}
      <main id="main-content">
        <BalanceDashboard />
      </main>
    </WalletProvider>
  );
}

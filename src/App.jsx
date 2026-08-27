/**
 * App.jsx
 * Root application component — wires up providers, layout, and pages.
 */
import { WalletProvider } from './context/WalletContext';
import { Navbar, Header } from './components';

export default function App() {
  return (
    <WalletProvider>
      {/* Sticky top navigation */}
      <Navbar />

      {/* Full-width page header — "Stellar Box - dApp" */}
      <Header />

      {/* Page content will be mounted here in future steps */}
      <main id="main-content" />
    </WalletProvider>
  );
}

/**
 * App.jsx
 * Root application component — wires up providers and routing.
 */
import { WalletProvider } from './context/WalletContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';

export default function App() {
  return (
    <WalletProvider>
      <Navbar />
      <Home />
    </WalletProvider>
  );
}

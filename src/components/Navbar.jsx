/**
 * Navbar.jsx
 * Top navigation bar — branding + live WalletConnect widget.
 */
import WalletConnect from './WalletConnect';
import styles from './Navbar.module.css';

export default function Navbar() {
  return (
    <header className={styles.navbar} role="banner">
      {/* Brand */}
      <div className={styles.brand}>
        <span className={styles.logo} aria-hidden="true">✦</span>
        <span className={styles.name}>stellar-box</span>
      </div>

      {/* Nav links */}
      <nav className={styles.nav} aria-label="Primary navigation">
        <a href="#home">Home</a>
        <a href="#about">About</a>
      </nav>

      {/* Live wallet widget */}
      <div className={styles.walletSlot}>
        <WalletConnect />
      </div>
    </header>
  );
}

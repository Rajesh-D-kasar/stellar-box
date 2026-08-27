/**
 * Navbar.jsx
 * Top navigation bar — branding + wallet connect button placeholder.
 */
import styles from './Navbar.module.css';

export default function Navbar() {
  return (
    <header className={styles.navbar}>
      <div className={styles.brand}>
        <span className={styles.logo}>✦</span>
        <span className={styles.name}>stellar-box</span>
      </div>
      <nav className={styles.nav}>
        <a href="#home">Home</a>
        <a href="#about">About</a>
        <button className={styles.connectBtn} disabled>
          Connect Wallet
        </button>
      </nav>
    </header>
  );
}

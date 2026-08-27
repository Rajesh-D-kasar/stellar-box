/**
 * Home.jsx
 * Landing page for stellar-box.
 */
import styles from './Home.module.css';

export default function Home() {
  return (
    <main className={styles.hero}>
      <div className={styles.glow} aria-hidden="true" />
      <h1 className={styles.title}>
        stellar<span className={styles.accent}>-box</span>
      </h1>
      <p className={styles.subtitle}>
        A lightweight Stellar dApp toolkit — built on Vite + React.
      </p>
      <div className={styles.badges}>
        <span className={styles.badge}>Stellar Testnet</span>
        <span className={styles.badge}>Freighter Wallet</span>
        <span className={styles.badge}>React 19</span>
      </div>
    </main>
  );
}

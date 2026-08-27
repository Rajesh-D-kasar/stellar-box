/**
 * WalletConnect.jsx
 * Self-contained wallet connection UI component.
 *
 * Renders one of four states driven by WALLET_STATUS:
 *  1. CHECKING   → skeleton pulse
 *  2. NOT_INSTALLED → "Install Freighter" prompt with link
 *  3. DISCONNECTED / ERROR → "Connect Wallet" button
 *  4. CONNECTED  → shortened address pill + "Disconnect" button
 *
 * Uses useWalletContext() — must be inside <WalletProvider>.
 */
import { WALLET_STATUS } from '../hooks/useWallet';
import { useWalletContext } from '../context/WalletContext';
import { shortenAddress } from '../utils/stellar';
import styles from './WalletConnect.module.css';

const FREIGHTER_URL = 'https://www.freighter.app/';

export default function WalletConnect() {
  const {
    status,
    publicKey,
    error,
    isConnecting,
    connect,
    disconnect,
    clearError,
  } = useWalletContext();

  /* ── 1. Checking / probing Freighter ── */
  if (status === WALLET_STATUS.IDLE || status === WALLET_STATUS.CHECKING) {
    return (
      <div className={styles.skeleton} aria-label="Checking wallet…" aria-busy="true" />
    );
  }

  /* ── 2. Freighter extension not installed ── */
  if (status === WALLET_STATUS.NOT_INSTALLED) {
    return (
      <a
        className={`${styles.btn} ${styles.btnInstall}`}
        href={FREIGHTER_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Install Freighter wallet extension"
      >
        <span className={styles.icon}>🔌</span>
        Install Freighter
      </a>
    );
  }

  /* ── 3. Connected ── */
  if (status === WALLET_STATUS.CONNECTED && publicKey) {
    return (
      <div className={styles.connectedGroup} role="group" aria-label="Wallet connected">
        {/* Address pill */}
        <div className={styles.addressPill} title={publicKey} aria-label={`Connected: ${publicKey}`}>
          <span className={styles.dot} aria-hidden="true" />
          <span className={styles.address}>{shortenAddress(publicKey, 5)}</span>
        </div>

        {/* Disconnect button */}
        <button
          className={`${styles.btn} ${styles.btnDisconnect}`}
          onClick={disconnect}
          aria-label="Disconnect wallet"
        >
          Disconnect
        </button>
      </div>
    );
  }

  /* ── 4. Disconnected / Error → show Connect button ── */
  return (
    <div className={styles.connectGroup}>
      {/* Inline error banner */}
      {error && (
        <div className={styles.errorBanner} role="alert">
          <span>{error}</span>
          <button
            className={styles.errorDismiss}
            onClick={clearError}
            aria-label="Dismiss error"
          >
            ✕
          </button>
        </div>
      )}

      <button
        id="wallet-connect-btn"
        className={`${styles.btn} ${styles.btnConnect}`}
        onClick={connect}
        disabled={isConnecting}
        aria-label={isConnecting ? 'Connecting to Freighter…' : 'Connect Freighter wallet'}
        aria-busy={isConnecting}
      >
        {isConnecting ? (
          <>
            <span className={styles.spinner} aria-hidden="true" />
            Connecting…
          </>
        ) : (
          <>
            <span className={styles.icon}>✦</span>
            Connect Wallet
          </>
        )}
      </button>
    </div>
  );
}

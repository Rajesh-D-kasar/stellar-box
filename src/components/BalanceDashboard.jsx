/**
 * BalanceDashboard.jsx
 * Displays the connected wallet's XLM balance and all token balances.
 *
 * States:
 *  - No wallet connected  → prompt card
 *  - Loading              → skeleton shimmer
 *  - Error                → error card with retry
 *  - Success              → XLM hero card + token list
 */
import { useWalletContext }    from '../context/WalletContext';
import { useAccountBalance, BALANCE_STATUS } from '../hooks/useAccountBalance';
import { shortenAddress }      from '../utils/stellar';
import { formatNumber, formatDate } from '../utils/format';
import styles from './BalanceDashboard.module.css';

/* ── Stellar Expert explorer base URL ── */
const EXPLORER_BASE = 'https://stellar.expert/explorer/testnet/account/';

export default function BalanceDashboard() {
  const { publicKey, isWalletConnected } = useWalletContext();
  const { status, xlm, balances, error, lastFetched, refresh, isLoading } =
    useAccountBalance(isWalletConnected ? publicKey : null);

  /* ── 1. Wallet not connected ── */
  if (!isWalletConnected) {
    return (
      <section className={styles.dashboard} aria-label="Balance dashboard">
        <div className={styles.promptCard}>
          <span className={styles.promptIcon} aria-hidden="true">🔗</span>
          <h2 className={styles.promptTitle}>Connect your wallet</h2>
          <p className={styles.promptText}>
            Connect your Freighter wallet using the button above to view your
            XLM balance and account details.
          </p>
        </div>
      </section>
    );
  }

  /* ── 2. Loading / initial fetch ── */
  if (status === BALANCE_STATUS.IDLE || status === BALANCE_STATUS.LOADING) {
    return (
      <section className={styles.dashboard} aria-label="Loading balances" aria-busy="true">
        <SkeletonCard />
        <SkeletonCard narrow />
      </section>
    );
  }

  /* ── 3. Error state ── */
  if (status === BALANCE_STATUS.ERROR) {
    return (
      <section className={styles.dashboard} aria-label="Balance dashboard">
        <div className={styles.errorCard} role="alert">
          <span className={styles.errorIcon} aria-hidden="true">⚠️</span>
          <div>
            <p className={styles.errorTitle}>Failed to fetch balances</p>
            <p className={styles.errorMsg}>{error}</p>
          </div>
          <button
            className={styles.retryBtn}
            onClick={refresh}
            aria-label="Retry fetching balances"
          >
            Retry
          </button>
        </div>
      </section>
    );
  }

  /* ── 4. Success ── */
  const nonNativeBalances = balances.filter((b) => !b.isNative);
  const xlmFormatted = formatNumber(xlm, 7);

  return (
    <section className={styles.dashboard} aria-label="Balance dashboard">

      {/* ── XLM Hero Card ── */}
      <div className={styles.xlmCard} aria-label={`XLM Balance: ${xlmFormatted}`}>
        {/* Refresh + last-fetched */}
        <div className={styles.cardHeader}>
          <span className={styles.assetLabel}>
            <span className={styles.nativeDot} aria-hidden="true" />
            Native Asset
          </span>
          <div className={styles.refreshRow}>
            {lastFetched && (
              <span className={styles.lastFetched}>
                Updated {formatDate(lastFetched)}
              </span>
            )}
            <button
              className={styles.refreshBtn}
              onClick={refresh}
              disabled={isLoading}
              aria-label="Refresh balance"
              title="Refresh"
            >
              <span
                className={`${styles.refreshIcon} ${isLoading ? styles.spinning : ''}`}
                aria-hidden="true"
              >
                ↻
              </span>
            </button>
          </div>
        </div>

        {/* Big XLM number */}
        <div className={styles.xlmRow}>
          <span className={styles.xlmAmount}>{xlmFormatted}</span>
          <span className={styles.xlmTicker}>XLM</span>
        </div>

        {/* Account address */}
        <a
          className={styles.accountLink}
          href={`${EXPLORER_BASE}${publicKey}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`View account ${publicKey} on Stellar Expert`}
          title={publicKey}
        >
          <span className={styles.accountIcon} aria-hidden="true">🔗</span>
          {shortenAddress(publicKey, 8)}
          <span className={styles.externalArrow} aria-hidden="true">↗</span>
        </a>
      </div>

      {/* ── Token Balances (non-native) ── */}
      {nonNativeBalances.length > 0 && (
        <div className={styles.tokenCard} aria-label="Token balances">
          <h3 className={styles.tokenTitle}>Other Assets</h3>
          <ul className={styles.tokenList}>
            {nonNativeBalances.map((b) => (
              <li key={`${b.code}-${b.issuer}`} className={styles.tokenRow}>
                <div className={styles.tokenInfo}>
                  <span className={styles.tokenCode}>{b.code}</span>
                  {b.issuer && (
                    <span className={styles.tokenIssuer}>
                      {shortenAddress(b.issuer, 6)}
                    </span>
                  )}
                </div>
                <span className={styles.tokenBalance}>
                  {formatNumber(b.balance, 7)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ── Horizon info bar ── */}
      <div className={styles.infoBar}>
        <span>⚡ Live data from</span>
        <a
          href="https://horizon-testnet.stellar.org"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.horizonLink}
        >
          horizon-testnet.stellar.org
        </a>
        <span className={styles.pollNote}>· auto-refreshes every 30 s</span>
      </div>
    </section>
  );
}

/* ── Skeleton sub-component ── */
function SkeletonCard({ narrow = false }) {
  return (
    <div className={`${styles.skeletonCard} ${narrow ? styles.skeletonNarrow : ''}`}>
      <div className={styles.skeletonLine} style={{ width: '40%', height: '14px' }} />
      <div className={styles.skeletonLine} style={{ width: '70%', height: '52px', marginTop: '1rem' }} />
      <div className={styles.skeletonLine} style={{ width: '55%', height: '14px', marginTop: '1rem' }} />
    </div>
  );
}

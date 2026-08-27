/**
 * TransactionStatus.jsx
 * Displays the current transaction lifecycle status.
 *
 * Renders one of:
 *  BUILDING           → spinner with "Building transaction…"
 *  AWAITING_SIGNATURE → built-tx details card (XDR, fee, sequence) + sign prompt
 *  SUBMITTING         → spinner with "Submitting to network…"
 *  SUCCESS            → green success card with explorer link
 *  ERROR              → red error card with retry option
 *  IDLE               → null (nothing to show)
 */
import { TX_STATUS } from '../hooks/useTransaction';
import styles from './TransactionStatus.module.css';

/**
 * @param {object} props
 * @param {string}      props.status       - TX_STATUS value
 * @param {object|null} props.transaction  - Built Transaction object (or null)
 * @param {string|null} props.txXDR        - Base64 XDR envelope string
 * @param {string|null} props.fee          - Human-readable fee in XLM
 * @param {string|null} props.txHash       - Submitted transaction hash
 * @param {string|null} props.explorerUrl  - Stellar Expert link
 * @param {string|null} props.error        - Error message
 * @param {function}    props.onReset      - Called when user clicks "New Transfer"
 * @param {function}    props.onClearError - Called when user dismisses error
 */
export default function TransactionStatus({
  status,
  transaction,
  txXDR,
  fee,
  txHash,
  explorerUrl,
  error,
  onReset,
  onClearError,
}) {
  if (status === TX_STATUS.IDLE) return null;

  /* ── Building ── */
  if (status === TX_STATUS.BUILDING) {
    return (
      <StatusCard variant="info" aria-live="polite" aria-busy="true">
        <div className={styles.loadingRow}>
          <span className={styles.spinner} aria-hidden="true" />
          <div>
            <p className={styles.loadTitle}>Building transaction…</p>
            <p className={styles.loadSub}>
              Loading account sequence number and fetching live fee from Horizon.
            </p>
          </div>
        </div>
      </StatusCard>
    );
  }

  /* ── Awaiting signature — show full built-tx details ── */
  if (status === TX_STATUS.AWAITING_SIGNATURE) {
    const seq      = transaction?.sequence        ?? '—';
    const timeout  = transaction?.timeBounds?.maxTime
      ? new Date(Number(transaction.timeBounds.maxTime) * 1000).toLocaleTimeString()
      : '—';

    return (
      <StatusCard variant="built" aria-live="polite">
        {/* Header */}
        <div className={styles.builtHeader}>
          <span className={styles.builtIcon} aria-hidden="true">✅</span>
          <div>
            <p className={styles.builtTitle}>Transaction built successfully</p>
            <p className={styles.builtSub}>
              Ready for Freighter signing — Step 8 will complete the flow.
            </p>
          </div>
        </div>

        {/* Metadata grid */}
        <dl className={styles.metaGrid}>
          <MetaRow label="Network"      value="Stellar Testnet" />
          <MetaRow label="Fee"          value={fee ? `${fee} XLM` : '—'} mono />
          <MetaRow label="Sequence"     value={seq}             mono />
          <MetaRow label="Expires at"   value={timeout} />
          <MetaRow label="Operations"   value="1 (Payment)" />
          <MetaRow label="Asset"        value="XLM (native)" />
        </dl>

        {/* XDR preview (collapsible) */}
        {txXDR && (
          <details className={styles.xdrDetails}>
            <summary className={styles.xdrSummary}>
              <span>View XDR Envelope</span>
              <span className={styles.xdrBadge}>base64</span>
            </summary>
            <div className={styles.xdrBox}>
              <code className={styles.xdrCode}>{txXDR}</code>
              <button
                className={styles.copyBtn}
                onClick={() => navigator.clipboard.writeText(txXDR)}
                aria-label="Copy XDR to clipboard"
                type="button"
              >
                Copy
              </button>
            </div>
          </details>
        )}

        {/* Step 8 notice */}
        <div className={styles.nextStepBanner}>
          <span aria-hidden="true">🔑</span>
          Freighter wallet signing will be integrated in Step 8.
        </div>

        {/* Reset */}
        <button
          className={styles.resetBtn}
          onClick={onReset}
          type="button"
          aria-label="Cancel and start a new transfer"
        >
          ← Cancel
        </button>
      </StatusCard>
    );
  }

  /* ── Submitting ── */
  if (status === TX_STATUS.SUBMITTING) {
    return (
      <StatusCard variant="info" aria-live="polite" aria-busy="true">
        <div className={styles.loadingRow}>
          <span className={styles.spinner} aria-hidden="true" />
          <div>
            <p className={styles.loadTitle}>Submitting to Stellar network…</p>
            <p className={styles.loadSub}>Broadcasting signed transaction to Horizon Testnet.</p>
          </div>
        </div>
      </StatusCard>
    );
  }

  /* ── Success ── */
  if (status === TX_STATUS.SUCCESS) {
    return (
      <StatusCard variant="success" aria-live="polite">
        <div className={styles.successRow}>
          <span className={styles.successIcon} aria-hidden="true">🎉</span>
          <div>
            <p className={styles.successTitle}>Transaction submitted!</p>
            {txHash && (
              <p className={styles.successHash}>
                Hash: <code className={styles.mono}>{txHash.slice(0, 16)}…</code>
              </p>
            )}
          </div>
        </div>
        {explorerUrl && (
          <a
            href={explorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.explorerLink}
            aria-label="View transaction on Stellar Expert"
          >
            View on Stellar Expert ↗
          </a>
        )}
        <button
          className={styles.resetBtn}
          onClick={onReset}
          type="button"
          aria-label="Start a new transfer"
        >
          New Transfer
        </button>
      </StatusCard>
    );
  }

  /* ── Error ── */
  if (status === TX_STATUS.ERROR) {
    return (
      <StatusCard variant="error" aria-live="assertive">
        <div className={styles.errorRow}>
          <span className={styles.errorIcon} aria-hidden="true">⚠️</span>
          <div>
            <p className={styles.errorTitle}>Transaction failed</p>
            <p className={styles.errorMsg}>{error}</p>
          </div>
        </div>
        <div className={styles.errorActions}>
          <button
            className={`${styles.resetBtn} ${styles.resetBtnError}`}
            onClick={onClearError}
            type="button"
            aria-label="Dismiss error and try again"
          >
            Try Again
          </button>
          <button
            className={styles.resetBtn}
            onClick={onReset}
            type="button"
            aria-label="Cancel and start a new transfer"
          >
            Cancel
          </button>
        </div>
      </StatusCard>
    );
  }

  return null;
}

/* ── Card wrapper sub-component ── */
function StatusCard({ variant = 'info', children, ...rest }) {
  return (
    <div
      className={`${styles.card} ${styles[`card_${variant}`]}`}
      {...rest}
    >
      {children}
    </div>
  );
}

/* ── Metadata row sub-component ── */
function MetaRow({ label, value, mono = false }) {
  return (
    <>
      <dt className={styles.metaLabel}>{label}</dt>
      <dd className={`${styles.metaValue} ${mono ? styles.mono : ''}`}>{value}</dd>
    </>
  );
}

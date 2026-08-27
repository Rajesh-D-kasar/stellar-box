/**
 * Header.jsx
 * Full-width page header / hero layout component.
 * Displays the app title, subtitle, network badge and a live status bar.
 */
import styles from './Header.module.css';

const NETWORK_BADGE = 'Testnet';
const STELLAR_HORIZON = 'https://horizon-testnet.stellar.org';

export default function Header() {
  return (
    <section className={styles.header} id="home" aria-label="Application header">

      {/* Decorative grid + glow layer */}
      <div className={styles.gridBg}  aria-hidden="true" />
      <div className={styles.glowTop} aria-hidden="true" />

      {/* ── Hero content ── */}
      <div className={styles.content}>

        {/* Network pill */}
        <div className={styles.networkPill}>
          <span className={styles.pulseDot} aria-hidden="true" />
          <span>Stellar {NETWORK_BADGE}</span>
        </div>

        {/* App title */}
        <h1 className={styles.title}>
          Stellar Box
          <span className={styles.separator}> — </span>
          <span className={styles.accent}>dApp</span>
        </h1>

        {/* Tagline */}
        <p className={styles.tagline}>
          A developer-friendly toolkit for building on the{' '}
          <span className={styles.highlightWord}>Stellar network</span>.
          Connect your wallet, explore transactions, and send payments — all in one place.
        </p>

        {/* Quick-link stat bar */}
        <div className={styles.statsBar} role="list">
          <StatChip icon="⚡" label="Fast Finality" value="3–5 s" />
          <StatChip icon="💸" label="Tx Fee"        value="0.00001 XLM" />
          <StatChip icon="🌐" label="Network"       value={NETWORK_BADGE} />
          <StatChip icon="🔗" label="Horizon"
            value="horizon-testnet.stellar.org"
            href={STELLAR_HORIZON}
          />
        </div>
      </div>

      {/* ── Bottom wave divider ── */}
      <div className={styles.wave} aria-hidden="true">
        <svg viewBox="0 0 1440 56" preserveAspectRatio="none">
          <path
            d="M0,28 C360,56 1080,0 1440,28 L1440,56 L0,56 Z"
            fill="var(--color-bg)"
          />
        </svg>
      </div>
    </section>
  );
}

/* ── Sub-component ── */
function StatChip({ icon, label, value, href }) {
  const content = (
    <>
      <span className={styles.chipIcon}>{icon}</span>
      <span className={styles.chipLabel}>{label}</span>
      <span className={styles.chipValue}>{value}</span>
    </>
  );

  return href ? (
    <a
      className={styles.chip}
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      role="listitem"
      title={`Open ${label}`}
    >
      {content}
    </a>
  ) : (
    <div className={styles.chip} role="listitem">{content}</div>
  );
}

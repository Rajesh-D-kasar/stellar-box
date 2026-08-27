/**
 * TransferForm.jsx
 * XLM payment form — recipient address + amount inputs with live validation.
 *
 * States:
 *  - Wallet not connected  → locked overlay prompt
 *  - Connected, idle       → active form with validation
 *  - Submit-ready          → send button enabled + preview row
 *
 * Does NOT submit the transaction itself — it calls props.onSubmit(fields)
 * so the parent can layer in signing logic (Step 7).
 */
import { useWalletContext }     from '../context/WalletContext';
import { useAccountBalance }    from '../hooks/useAccountBalance';
import { useTransferForm }      from '../hooks/useTransferForm';
import { formatNumber }         from '../utils/format';
import { BASE_RESERVE_XLM, MIN_XLM_AMOUNT } from '../utils/validation';
import styles from './TransferForm.module.css';

/**
 * @param {{ onSubmit?: function }} props
 *   onSubmit(fields) is called with { recipient, amount } when form is valid.
 */
export default function TransferForm({ onSubmit }) {
  const { publicKey, isWalletConnected } = useWalletContext();
  const { xlm } = useAccountBalance(isWalletConnected ? publicKey : null);

  const {
    fields,
    errors,
    isSubmitReady,
    handleChange,
    handleBlur,
    handleSubmit,
    reset,
    setAmount,
  } = useTransferForm({ senderPublicKey: publicKey, xlmBalance: xlm });

  /* Max sendable amount = balance - base reserve, floored to 7 dp */
  const maxSendable = xlm
    ? Math.max(0, Number(xlm) - BASE_RESERVE_XLM).toFixed(7)
    : '0.0000000';

  const handleMaxClick = () => setAmount(maxSendable);

  const onFormSubmit = handleSubmit((validFields) => {
    onSubmit?.(validFields);
  });

  /* ── Render ── */
  return (
    <section className={styles.section} aria-label="Send XLM transfer form">

      {/* Section header */}
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>
          <span className={styles.titleIcon} aria-hidden="true">↗</span>
          Send XLM
        </h2>
        <p className={styles.sectionSub}>
          Transfer XLM on the Stellar Testnet instantly with near-zero fees.
        </p>
      </div>

      {/* Card */}
      <div className={`${styles.card} ${!isWalletConnected ? styles.cardLocked : ''}`}>

        {/* Wallet not connected — locked overlay */}
        {!isWalletConnected && (
          <div className={styles.lockedOverlay} aria-live="polite">
            <span className={styles.lockIcon} aria-hidden="true">🔒</span>
            <p className={styles.lockText}>Connect your wallet to send XLM</p>
          </div>
        )}

        {/* Form */}
        <form
          className={styles.form}
          onSubmit={onFormSubmit}
          noValidate
          aria-label="XLM transfer form"
        >
          {/* ── Recipient field ── */}
          <div className={styles.fieldGroup}>
            <label className={styles.label} htmlFor="recipient">
              Recipient Address
              <span className={styles.required} aria-hidden="true"> *</span>
            </label>
            <div className={`${styles.inputWrap} ${
              errors.recipient ? styles.inputError :
              fields.recipient && !errors.recipient ? styles.inputValid : ''
            }`}>
              <span className={styles.inputIcon} aria-hidden="true">👤</span>
              <input
                id="recipient"
                name="recipient"
                type="text"
                className={styles.input}
                placeholder="G... (56-character Stellar public key)"
                value={fields.recipient}
                onChange={handleChange}
                onBlur={handleBlur}
                disabled={!isWalletConnected}
                autoComplete="off"
                spellCheck={false}
                maxLength={56}
                aria-required="true"
                aria-invalid={Boolean(errors.recipient)}
                aria-describedby={errors.recipient ? 'recipient-error' : undefined}
              />
              {/* Inline validation icon */}
              {fields.recipient && (
                <span
                  className={`${styles.statusIcon} ${errors.recipient ? styles.iconError : styles.iconValid}`}
                  aria-hidden="true"
                >
                  {errors.recipient ? '✕' : '✓'}
                </span>
              )}
            </div>
            {/* Character counter */}
            <div className={styles.fieldMeta}>
              {errors.recipient ? (
                <span id="recipient-error" className={styles.errorMsg} role="alert">
                  {errors.recipient}
                </span>
              ) : (
                <span className={styles.hint}>
                  Stellar public keys start with G and are exactly 56 characters.
                </span>
              )}
              <span className={`${styles.charCount} ${fields.recipient.length === 56 ? styles.charCountFull : ''}`}>
                {fields.recipient.length}/56
              </span>
            </div>
          </div>

          {/* ── Amount field ── */}
          <div className={styles.fieldGroup}>
            <div className={styles.labelRow}>
              <label className={styles.label} htmlFor="amount">
                Amount
                <span className={styles.required} aria-hidden="true"> *</span>
              </label>
              {/* Available balance + Max button */}
              {isWalletConnected && xlm && (
                <div className={styles.balanceHint}>
                  <span className={styles.balanceLabel}>Available:</span>
                  <span className={styles.balanceValue}>{formatNumber(xlm, 7)} XLM</span>
                  <button
                    type="button"
                    className={styles.maxBtn}
                    onClick={handleMaxClick}
                    disabled={!isWalletConnected || Number(maxSendable) <= 0}
                    aria-label={`Set maximum sendable amount: ${maxSendable} XLM`}
                  >
                    MAX
                  </button>
                </div>
              )}
            </div>

            <div className={`${styles.inputWrap} ${
              errors.amount ? styles.inputError :
              fields.amount && !errors.amount ? styles.inputValid : ''
            }`}>
              <span className={styles.inputIcon} aria-hidden="true">✦</span>
              <input
                id="amount"
                name="amount"
                type="number"
                className={styles.input}
                placeholder={`Min ${MIN_XLM_AMOUNT} XLM`}
                value={fields.amount}
                onChange={handleChange}
                onBlur={handleBlur}
                disabled={!isWalletConnected}
                min={MIN_XLM_AMOUNT}
                step="any"
                aria-required="true"
                aria-invalid={Boolean(errors.amount)}
                aria-describedby={errors.amount ? 'amount-error' : 'amount-hint'}
              />
              <span className={styles.inputSuffix}>XLM</span>
            </div>

            <div className={styles.fieldMeta}>
              {errors.amount ? (
                <span id="amount-error" className={styles.errorMsg} role="alert">
                  {errors.amount}
                </span>
              ) : (
                <span id="amount-hint" className={styles.hint}>
                  Fee: ~0.00001 XLM · Reserve: {BASE_RESERVE_XLM} XLM stays in account.
                </span>
              )}
            </div>
          </div>

          {/* ── Submit preview row (only when form is valid) ── */}
          {isSubmitReady && (
            <div className={styles.previewRow} aria-live="polite">
              <span className={styles.previewLabel}>You are sending</span>
              <span className={styles.previewAmount}>{formatNumber(fields.amount, 7)} XLM</span>
              <span className={styles.previewArrow} aria-hidden="true">→</span>
              <span className={styles.previewRecipient}>
                {fields.recipient.slice(0, 6)}...{fields.recipient.slice(-6)}
              </span>
            </div>
          )}

          {/* ── Action buttons ── */}
          <div className={styles.actions}>
            <button
              type="button"
              className={styles.resetBtn}
              onClick={reset}
              disabled={!isWalletConnected}
              aria-label="Clear form"
            >
              Clear
            </button>
            <button
              id="send-xlm-btn"
              type="submit"
              className={`${styles.submitBtn} ${isSubmitReady ? styles.submitReady : ''}`}
              disabled={!isWalletConnected}
              aria-label={
                !isWalletConnected
                  ? 'Connect wallet to send'
                  : isSubmitReady
                  ? `Send ${fields.amount} XLM`
                  : 'Fill in valid recipient and amount'
              }
            >
              <span className={styles.submitIcon} aria-hidden="true">↗</span>
              Review &amp; Send
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}

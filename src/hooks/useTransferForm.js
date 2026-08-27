/**
 * useTransferForm.js
 * Custom hook — manages the full state machine for the XLM transfer form.
 *
 * Features:
 *  - Controlled field state (recipient, amount)
 *  - "Touched" tracking — errors only show after a field is blurred or submit is attempted
 *  - Real-time validation via validateTransferForm()
 *  - Balance-aware validation when xlmBalance is provided
 *  - isSubmitReady guard — true only when no errors exist and fields are non-empty
 *  - reset() — clears everything back to initial state
 */
import { useState, useCallback, useMemo } from 'react';
import { validateTransferForm } from '../utils/validation';

const INITIAL_FIELDS = { recipient: '', amount: '' };
const INITIAL_TOUCHED = { recipient: false, amount: false };

/**
 * @param {object} options
 * @param {string|null} options.senderPublicKey  - Connected wallet address
 * @param {string|null} options.xlmBalance       - Current XLM balance (for sufficiency check)
 */
export function useTransferForm({ senderPublicKey = null, xlmBalance = null } = {}) {
  const [fields,  setFields]  = useState(INITIAL_FIELDS);
  const [touched, setTouched] = useState(INITIAL_TOUCHED);
  const [submitAttempted, setSubmitAttempted] = useState(false);

  /* ── Run full validation on every render (cheap pure function) ── */
  const allErrors = useMemo(
    () =>
      validateTransferForm({
        recipient:       fields.recipient,
        amount:          fields.amount,
        senderPublicKey,
        xlmBalance,
      }),
    [fields.recipient, fields.amount, senderPublicKey, xlmBalance]
  );

  /**
   * Visible errors — only shown for fields that have been touched
   * OR after the user attempted to submit.
   */
  const visibleErrors = useMemo(() => {
    const show = {};
    for (const field of Object.keys(INITIAL_TOUCHED)) {
      if (touched[field] || submitAttempted) {
        show[field] = allErrors[field]; // undefined = no error
      }
    }
    return show;
  }, [allErrors, touched, submitAttempted]);

  /** True when there are no validation errors at all. */
  const isFormValid = Object.keys(allErrors).length === 0;

  /** True when the form is valid AND both fields are non-empty. */
  const isSubmitReady =
    isFormValid &&
    fields.recipient.trim() !== '' &&
    fields.amount !== '';

  /* ── Field change handler ── */
  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFields((prev) => ({ ...prev, [name]: value }));
  }, []);

  /* ── Blur handler (marks field as touched to reveal its error) ── */
  const handleBlur = useCallback((e) => {
    const { name } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
  }, []);

  /**
   * handleSubmit(onValid)
   * Marks all fields as touched (to reveal any hidden errors),
   * then calls `onValid(fields)` if the form passes validation.
   *
   * @param {function} onValid - callback(fields) invoked when form is clean
   * @returns {function} React onSubmit handler
   */
  const handleSubmit = useCallback(
    (onValid) => (e) => {
      e.preventDefault();
      setSubmitAttempted(true);
      setTouched({ recipient: true, amount: true });

      if (isFormValid) {
        onValid({ recipient: fields.recipient.trim(), amount: fields.amount });
      }
    },
    [isFormValid, fields]
  );

  /** Reset to blank initial state. */
  const reset = useCallback(() => {
    setFields(INITIAL_FIELDS);
    setTouched(INITIAL_TOUCHED);
    setSubmitAttempted(false);
  }, []);

  /** Set the amount field programmatically (e.g. "Max" button). */
  const setAmount = useCallback((value) => {
    setFields((prev) => ({ ...prev, amount: String(value) }));
  }, []);

  return {
    // Field values (use as value prop on inputs)
    fields,
    // Per-field error strings (undefined = no error)
    errors: visibleErrors,
    // All errors regardless of touch state (for debugging / submit guard)
    allErrors,
    // Derived state
    isFormValid,
    isSubmitReady,
    // Handlers
    handleChange,
    handleBlur,
    handleSubmit,
    reset,
    setAmount,
  };
}

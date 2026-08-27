/**
 * validation.js
 * Pure validation functions for Stellar transaction form inputs.
 * No side-effects — easy to unit-test independently.
 */
import { StrKey } from '@stellar/stellar-sdk';

/* ── Constants ────────────────────────────────────────────── */

/** Minimum sendable amount (one stroop expressed in XLM). */
export const MIN_XLM_AMOUNT = 0.0000001;

/** Practical maximum for a single send (not a protocol limit). */
export const MAX_XLM_AMOUNT = 100_000_000;

/** Minimum XLM that must remain in any Stellar account (base reserve). */
export const BASE_RESERVE_XLM = 1;

/* ── Individual validators ────────────────────────────────── */

/**
 * isValidStellarAddress(value)
 * Returns true if `value` is a valid Stellar Ed25519 public key (G...).
 * Uses the SDK's StrKey.isValidEd25519PublicKey for canonical validation.
 *
 * @param {string} value
 * @returns {boolean}
 */
export function isValidStellarAddress(value) {
  if (!value || typeof value !== 'string') return false;
  return StrKey.isValidEd25519PublicKey(value.trim());
}

/**
 * isValidAmount(value)
 * Returns true if `value` is a positive finite number within allowed range.
 *
 * @param {string|number} value
 * @returns {boolean}
 */
export function isValidAmount(value) {
  if (value === '' || value === null || value === undefined) return false;
  const num = Number(value);
  return (
    !isNaN(num) &&
    isFinite(num) &&
    num >= MIN_XLM_AMOUNT &&
    num <= MAX_XLM_AMOUNT
  );
}

/**
 * hasSufficientBalance(amount, xlmBalance)
 * Returns true if the user has enough XLM to cover the amount + base reserve.
 *
 * @param {string|number} amount      - Amount to send
 * @param {string|number} xlmBalance  - Available balance from Horizon
 * @returns {boolean}
 */
export function hasSufficientBalance(amount, xlmBalance) {
  const send      = Number(amount);
  const available = Number(xlmBalance);
  if (isNaN(send) || isNaN(available)) return false;
  // Must keep BASE_RESERVE_XLM in account after the send
  return available - send >= BASE_RESERVE_XLM;
}

/**
 * isSelfSend(recipient, senderPublicKey)
 * Returns true if the user is trying to send to themselves.
 *
 * @param {string} recipient
 * @param {string} senderPublicKey
 * @returns {boolean}
 */
export function isSelfSend(recipient, senderPublicKey) {
  if (!recipient || !senderPublicKey) return false;
  return recipient.trim() === senderPublicKey.trim();
}

/* ── Composite validator ──────────────────────────────────── */

/**
 * validateTransferForm({ recipient, amount, senderPublicKey, xlmBalance })
 * Runs all field validators and returns a structured errors object.
 * An empty errors object means the form is valid and ready to submit.
 *
 * @param {object} fields
 * @returns {{ recipient?: string, amount?: string }} errors map
 */
export function validateTransferForm({ recipient, amount, senderPublicKey, xlmBalance }) {
  const errors = {};

  /* ── Recipient ── */
  if (!recipient || recipient.trim() === '') {
    errors.recipient = 'Recipient address is required.';
  } else if (!isValidStellarAddress(recipient)) {
    errors.recipient = 'Not a valid Stellar public key (must start with G and be 56 characters).';
  } else if (isSelfSend(recipient, senderPublicKey)) {
    errors.recipient = 'You cannot send XLM to your own address.';
  }

  /* ── Amount ── */
  if (amount === '' || amount === null || amount === undefined) {
    errors.amount = 'Amount is required.';
  } else if (!isValidAmount(amount)) {
    const num = Number(amount);
    if (isNaN(num) || !isFinite(num)) {
      errors.amount = 'Please enter a valid number.';
    } else if (num <= 0) {
      errors.amount = 'Amount must be greater than 0.';
    } else if (num < MIN_XLM_AMOUNT) {
      errors.amount = `Minimum amount is ${MIN_XLM_AMOUNT} XLM (1 stroop).`;
    } else {
      errors.amount = `Maximum amount is ${MAX_XLM_AMOUNT.toLocaleString()} XLM.`;
    }
  } else if (xlmBalance !== null && xlmBalance !== undefined) {
    if (!hasSufficientBalance(amount, xlmBalance)) {
      errors.amount = `Insufficient balance. You need at least ${BASE_RESERVE_XLM} XLM remaining after the send.`;
    }
  }

  return errors;
}

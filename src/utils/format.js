/**
 * format.js
 * General-purpose formatting utilities used across the UI.
 */

/**
 * Format a number with up to `decimals` decimal places, trimming trailing zeros.
 * @param {number|string} value
 * @param {number} decimals
 * @returns {string}
 */
export function formatNumber(value, decimals = 2) {
  const num = Number(value);
  if (isNaN(num)) return '—';
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  }).format(num);
}

/**
 * Format a UTC timestamp into a readable local date/time string.
 * @param {string|number|Date} timestamp
 * @returns {string}
 */
export function formatDate(timestamp) {
  if (!timestamp) return '—';
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(timestamp));
}

/**
 * Clamp a value between min and max.
 * @param {number} value
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

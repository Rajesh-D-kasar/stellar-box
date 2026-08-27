/**
 * stellar.js
 * Utility helpers for interacting with the Stellar network.
 * Expand this file as SDK methods are integrated.
 */

// Network passphrase constants
export const NETWORKS = {
  TESTNET: 'Test SDF Network ; September 2015',
  MAINNET: 'Public Global Stellar Network ; September 2015',
};

// Horizon server URLs
export const HORIZON_URLS = {
  TESTNET: 'https://horizon-testnet.stellar.org',
  MAINNET: 'https://horizon.stellar.org',
};

/**
 * Shorten a Stellar public key for display.
 * e.g. GABC...XYZ
 * @param {string} address - Full Stellar public key
 * @param {number} chars   - Characters to keep on each side
 * @returns {string}
 */
export function shortenAddress(address, chars = 4) {
  if (!address || address.length < chars * 2 + 3) return address ?? '';
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

/**
 * Convert stroops (smallest Stellar unit) to XLM.
 * @param {number|string} stroops
 * @returns {string} XLM amount with 7 decimal places
 */
export function stroopsToXLM(stroops) {
  return (Number(stroops) / 1e7).toFixed(7);
}

/**
 * Convert XLM to stroops.
 * @param {number|string} xlm
 * @returns {number}
 */
export function xlmToStroops(xlm) {
  return Math.round(Number(xlm) * 1e7);
}

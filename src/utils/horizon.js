/**
 * horizon.js
 * Horizon server setup and account data fetching utilities.
 *
 * Single source of truth for all Horizon interactions in stellar-box.
 * Uses @stellar/stellar-sdk's Horizon.Server class.
 */
import { Horizon } from '@stellar/stellar-sdk';
import { HORIZON_URLS } from './stellar';

/* ── Singleton Horizon server instance (Testnet) ────────────
 *
 * Re-use one instance across the app — avoids creating a new
 * HTTP client on every render/call.
 * ─────────────────────────────────────────────────────────── */
export const horizonServer = new Horizon.Server(HORIZON_URLS.TESTNET, {
  allowHttp: false, // enforce HTTPS
});

/**
 * fetchAccountBalances(publicKey)
 * Load the full account record from Horizon and return its balances array.
 *
 * @param {string} publicKey - Stellar G... public key
 * @returns {Promise<Array>} Horizon balance objects
 * @throws  if the account is not found or Horizon is unreachable
 */
export async function fetchAccountBalances(publicKey) {
  if (!publicKey) throw new Error('fetchAccountBalances: publicKey is required.');

  const account = await horizonServer.loadAccount(publicKey);
  return account.balances; // Array of { asset_type, balance, asset_code?, asset_issuer? }
}

/**
 * getNativeXLMBalance(publicKey)
 * Convenience wrapper — returns only the native XLM balance as a string.
 *
 * @param {string} publicKey
 * @returns {Promise<string>} e.g. "9876.5432100"
 */
export async function getNativeXLMBalance(publicKey) {
  const balances = await fetchAccountBalances(publicKey);

  const native = balances.find((b) => b.asset_type === 'native');
  if (!native) throw new Error('Native XLM balance not found in account record.');

  return native.balance; // already a decimal string from Horizon
}

/**
 * parseAllBalances(balancesArray)
 * Normalize the raw Horizon balances array into a clean, UI-friendly shape.
 *
 * @param {Array} balancesArray
 * @returns {Array<{ code: string, issuer: string|null, balance: string, isNative: boolean }>}
 */
export function parseAllBalances(balancesArray = []) {
  return balancesArray.map((b) => ({
    code:      b.asset_type === 'native' ? 'XLM' : (b.asset_code ?? 'UNKNOWN'),
    issuer:    b.asset_issuer ?? null,
    balance:   b.balance,
    isNative:  b.asset_type === 'native',
  }));
}

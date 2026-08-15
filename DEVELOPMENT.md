# Development checklist

Before opening a pull request:

1. Run `npm run check`.
2. Run `cargo test` from `contract/` if the contract has changed.
3. Test a wallet connection, Friendbot error state, and payment validation on Testnet.
4. Confirm no UI copy claims that a local prototype action happened on-chain.

Never commit wallet keys, `.env` files, build output, or Rust target directories.

# Stellar Box

Stellar Box is a React + Vite crowdfunding experience for the **Stellar Testnet**. It lets a visitor connect a Freighter or Albedo wallet, request test XLM through Friendbot, and sign and submit a real Testnet XLM payment to the campaign address.

> This is a Testnet-only project. Do not use a wallet that holds real funds.

## What works on-chain

- Connect a Freighter or Albedo Stellar wallet.
- Read the connected account's Testnet XLM balance from Horizon.
- Fund an unfunded Testnet account with Friendbot.
- Build, sign, submit, and display the result of an XLM payment on Stellar Testnet.
- Open the submitted transaction in Stellar Expert Testnet.

## Demo-only areas

The following parts demonstrate the intended campaign experience locally in the browser. They do **not** call the Soroban contract, release funds, or persist data on-chain:

- DAO milestone voting and release indicators
- Donor-tier, analytics, and activity displays
- Dynamic-NFT notifications
- Campaign copy assistant

The `contract/` folder contains separately tested, experimental Soroban contract logic; the frontend payment flow does not invoke it yet.

## Quick start

### Prerequisites

- Node.js 20 or later
- npm
- Optional: Rust (only needed for the Soroban contract tests)
- A Freighter extension or Albedo wallet configured for Stellar Testnet

### Run the frontend

```bash
npm ci
npm run dev
```

Open the local URL printed by Vite, connect a Testnet wallet, and use **Refill Testnet XLM** if the account has no Testnet balance.

### Verify the project

```bash
# Frontend linting and production build
npm run check

# Soroban contract tests
cd contract
cargo test
```

## Project structure

```text
src/App.jsx                  App state, wallet connection, and payment flow
src/App.css                  Component styling and responsive layout
src/index.css                Global styles
contract/src/lib.rs          Experimental Soroban contract
contract/src/test.rs         Soroban contract test suite
.github/workflows/ci.yml     Frontend and contract CI checks
```

## Technology

- React 19 and Vite
- Stellar Wallets Kit, Freighter API, and Stellar SDK
- Stellar Testnet Horizon and Friendbot
- Soroban SDK for the experimental contract

## Safety notes

- Never commit a seed phrase, secret key, or `.env` file.
- Testnet XLM has no monetary value, but wallet signatures should still be reviewed carefully.
- The campaign address is defined in `src/App.jsx`; inspect the transaction details in your wallet before signing.

## CI

GitHub Actions runs frontend build and lint checks plus the Soroban contract tests on pushes and pull requests targeting `main` or `master`.

## Reference

The UI direction was inspired by the [Stellar Frontend Challenge starter](https://github.com/Halfgork/stellar-frontend-challenge), with an independent layout and implementation.

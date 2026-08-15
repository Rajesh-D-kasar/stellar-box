# Stellar Box

A responsive Stellar Testnet campaign interface built with React and Vite. It supports Stellar wallet connections, live Testnet XLM balance checks, Friendbot funding, signing and submitting a Testnet XLM payment, and a clear transaction receipt.

## Important scope

- Payments are sent only on Stellar Testnet.
- The community voting, supporter tiers, analytics, and activity sections are UI prototypes. They do not submit a Soroban contract call or release funds.
- The campaign copy helper runs locally in the browser and does not call Gemini or any other AI service.

This distinction is intentional: the interface never presents a demo feature as an on-chain result.

## Run locally

```bash
npm install
npm run dev
```

Open the local URL shown by Vite. Install Freighter or use Albedo to connect a Testnet wallet. If the wallet has no balance, use the in-app Friendbot action to request test XLM.

## Quality checks

```bash
npm run check
```

This runs ESLint followed by a production build. The same checks run in GitHub Actions.

## Project structure

```text
src/App.jsx      Application state, wallet flow, payments, and UI
src/App.css      Responsive visual design
src/index.css    Global page styles
contract/        Experimental Soroban contract work (not used by the UI payment flow)
```

## Technology

- React 19 and Vite
- Stellar Wallets Kit, Freighter API, and Stellar SDK
- Stellar Testnet Horizon and Friendbot

## Reference

The project follows the UI-focused direction of the [Stellar Frontend Challenge starter](https://github.com/Halfgork/stellar-frontend-challenge). The application has its own layout and implementation.

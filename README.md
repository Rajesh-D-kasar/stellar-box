# ✦ stellar-box

> A lightweight Stellar dApp toolkit — built with **Vite + React**.

[![Stellar](https://img.shields.io/badge/Stellar-Testnet-7c5cbf?style=flat-square&logo=stellar)](https://stellar.org)
[![Vite](https://img.shields.io/badge/Vite-8.x-646cff?style=flat-square&logo=vite)](https://vite.dev)
[![React](https://img.shields.io/badge/React-19-61dafb?style=flat-square&logo=react)](https://react.dev)
[![License](https://img.shields.io/badge/License-MIT-4fcfaf?style=flat-square)](LICENSE)

---

## ✅ Progress / Feature Checklist

- [x] **Step 1:** Initialize Vite + React project (`stellar-box`)
- [x] **Step 2:** Install Stellar SDKs (`@stellar/stellar-sdk`, `@stellar/freighter-api`)
- [x] **Step 3:** Scaffold UI layouts (`Header`, `Navbar`)
- [x] **Step 4:** Freighter Wallet connection logic (`WalletContext`, `WalletConnect`)
- [x] **Step 5:** Horizon Testnet polling & XLM Balance display (`BalanceDashboard`)
- [x] **Step 6:** Real-time form validation & Transfer inputs (`TransferForm`)
- [x] **Step 7:** Build Payment Transaction Object (`useTransaction.js`, `TransactionBuilder`)
- [x] **Step 8:** Freighter XDR Signature UI (`signTransaction`, `TransactionStatus`)
- [x] **Step 9:** Horizon Network Submission (`submitTransaction`)
- [x] **Step 10:** Block Explorer Redirection (Stellar Expert `txHash` link)
- [x] **Step 11:** UI/UX Polish (Dark/Light mode, Glassmorphism, CSS Variables)
- [x] **Step 12:** Codebase Modularization & Refactoring
- [x] **Step 13:** Production Build Verification (`dist` checks)
- [x] **Step 14 & 15:** Deployment Setup (`gh-pages`, `package.json` scripts)

---

## 🗂 Project Structure

```text
src/
├── components/          # Reusable UI components
│   ├── BalanceDashboard.jsx  # Fetches and displays native XLM balance
│   ├── Header.jsx            # Application header layout
│   ├── Navbar.jsx            # Top navigation and wallet connect button container
│   ├── TransactionStatus.jsx # Real-time visual state machine for building/signing/submitting
│   ├── TransferForm.jsx      # Input fields and validation logic for destination & amount
│   ├── WalletConnect.jsx     # Freighter connect/disconnect interactive button
│   └── index.js              # Barrel exports
├── hooks/               # Custom React hooks
│   ├── useAccountBalance.js  # Polls Horizon for XLM asset balances
│   └── useTransaction.js     # Orchestrates the 3-phase build->sign->submit lifecycle
├── context/             # React context providers
│   └── WalletContext.jsx     # Global provider for Freighter connection state
├── utils/               # Stellar helpers & formatters
│   ├── horizon.js            # Horizon.Server singleton configuration
│   ├── transaction.js        # TransactionBuilder, Freighter API wrappers, XDR codecs
│   ├── validation.js         # Ed25519 public key & numeric amount validators
│   └── index.js              # Barrel exports
└── styles/              # CSS Modules & global styling
    ├── global.css            # Dark/light mode variables, grid layouts, scrollbars
    └── *.module.css          # Scoped component styles
```

---

## 🚀 Technical Instructions

### Local Development
```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build
```

### GitHub Pages Deployment
1. Create a remote GitHub repository.
2. Link your local project:
   ```bash
   git remote add origin https://github.com/yourusername/stellar-box.git
   git push -u origin main
   ```
3. Deploy to the `gh-pages` branch:
   ```bash
   npm run deploy
   ```

---

## 📄 License
MIT © stellar-box contributors

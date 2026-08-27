# ✦ stellar-box

> A lightweight Stellar dApp toolkit — built with **Vite + React**.

[![Stellar](https://img.shields.io/badge/Stellar-Testnet-7c5cbf?style=flat-square&logo=stellar)](https://stellar.org)
[![Vite](https://img.shields.io/badge/Vite-8.x-646cff?style=flat-square&logo=vite)](https://vite.dev)
[![React](https://img.shields.io/badge/React-19-61dafb?style=flat-square&logo=react)](https://react.dev)
[![License](https://img.shields.io/badge/License-MIT-4fcfaf?style=flat-square)](LICENSE)

---

## 🌟 Project Showcase & Demo

This repository represents the completed **stellar-box** tutorial dApp. 

### 🌐 Live Demo
You can test the fully functional deployment here: 
**[Launch Stellar Box dApp 🚀](https://Rajesh-D-kasar.github.io/stellar-box/)**

### 📦 v1.0.0 Release
To view the source code at the exact moment of the final stable completion, check out the [v1.0.0 Release](https://github.com/Rajesh-D-kasar/stellar-box/releases/tag/v1.0.0) on GitHub.

**To test the app yourself:**
1. Install the [Freighter browser extension](https://www.freighter.app/).
2. Switch Freighter to the **Testnet** network.
3. Use the [Stellar Laboratory Friendbot](https://laboratory.stellar.org/#account-creator?network=test) to fund your account with test XLM.
4. Open the live demo, connect your wallet, and try sending a payment!

---

## 📜 Development Timeline & Milestone Log

### Phase 1: Foundation & Setup
- [x] **Step 1:** Initialize Vite + React project (`stellar-box`)
- [x] **Step 2:** Install Stellar SDKs (`@stellar/stellar-sdk`, `@stellar/freighter-api`)
- [x] **Step 3:** Scaffold UI layouts (`Header`, `Navbar`)
- [x] **Step 4:** Freighter Wallet connection logic (`WalletContext`, `WalletConnect`)
- [x] **Step 5:** Horizon Testnet polling & XLM Balance display (`BalanceDashboard`)

### Phase 2: Transaction Engine
- [x] **Step 6:** Real-time form validation & Transfer inputs (`TransferForm`)
- [x] **Step 7:** Build Payment Transaction Object (`useTransaction.js`, `TransactionBuilder`)
- [x] **Step 8:** Freighter XDR Signature UI (`signTransaction`, `TransactionStatus`)
- [x] **Step 9:** Horizon Network Submission (`submitTransaction`)
- [x] **Step 10:** Block Explorer Redirection (Stellar Expert `txHash` link)

### Phase 3: Polish & Deployment
- [x] **Step 11:** UI/UX Polish (Dark/Light mode, Glassmorphism, CSS Variables)
- [x] **Step 12:** Codebase Modularization & Refactoring
- [x] **Step 13:** Production Build Verification (`dist` checks)
- [x] **Step 14:** Link Remote Repository & Force Push History
- [x] **Step 15:** Deployment Setup (`gh-pages`, `npm run deploy`)

### Phase 4: Release & Open Source
- [x] **Step 16:** Final Code Sweep & Sync Documentation
- [x] **Step 17:** Official Release Tagging (`v1.0.0`)
- [x] **Step 18:** Health Check & Live Deployment Verification
- [x] **Step 19:** Open Source Docs (`CONTRIBUTING.md`, Issue Templates, `LICENSE`)
- [x] **Step 20:** Portfolio Showcase Updates & Cache Cleanup
- [x] **Step 21:** Final Milestone Synchronization & Wrap-up

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

# Stellar-Box 🚀 — Level 2 Crowdfunding dApp

**Stellar-Box** has been upgraded to **Level 2** for the **Rise In Stellar Challenge**. It is a modern decentralized Crowdfunding "Donation Box" application built with React, Vite, Soroban Smart Contract (Rust), and `@creit.tech/stellar-wallets-kit`.

---

## 🌟 Level 2 Features

1. **Multi-Wallet Integration**: Built-in support for multiple Stellar wallets via `StellarWalletsKit` (Freighter, Albedo, xBull, Lobstr) with a custom modal selector.
2. **Soroban Smart Contract**: Rust-based Crowdfunding smart contract located in `contract/src/lib.rs` with `init`, `donate`, and total balance view functions.
3. **Soroban Donation Flow**: Invoke donation payments with customizable preset XLM amounts (5 XLM, 10 XLM, 25 XLM, 50 XLM) and live progress bar tracking against the campaign target goal (500 XLM).
4. **Explicit Error Handling**: Dedicated UI toast notifications and alerts handling 3 critical edge cases:
   - **Case 1: Wallet Not Found** (Missing browser extension or provider).
   - **Case 2: User Rejected Transaction** (User cancelled connection or transaction signing).
   - **Case 3: Insufficient Balance** (Donor account has fewer XLM than the donation amount).
5. **Real-Time Transaction Status**: Live pending indicators, transaction hashes, and direct links to the **Stellar Expert Testnet Explorer**.

---

## 📄 Soroban Smart Contract

The Soroban smart contract is written in Rust under `contract/`:

- **Path**: [`contract/src/lib.rs`](file:///c:/Users/ASUS/stellar-box/contract/src/lib.rs)
- **Functions**:
  - `init(env, target_amount)`: Initializes campaign target.
  - `donate(env, donor, amount)`: Accepts donation in XLM, requires donor authentication, and updates total donations.
  - `get_total(env)`: Returns current total collected donations.
  - `get_target(env)`: Returns campaign goal target.

### 📌 Deployed Contract Address Placeholder
```text
CDUMMYCROWDFUNDINGDAPPSTELLARLEVEL2DUMMYADDRESS
```

---

## 📜 Level 2 Submission Details

### 📌 Transaction Hash Placeholder
```text
4a91f3b2c8e1d5a7b3c2d1e0f9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0
```

---

## 📸 Rise In Submission Screenshots

*(Place your Level 2 screenshots in the paths below)*

### 1. Multi-Wallet Options Modal
![Wallet Options Modal](docs/screenshots/wallet-options-modal.png)

### 2. Wallet Connected & Crowdfunding Dashboard
![Wallet Connected Dashboard](docs/screenshots/wallet-connected-dashboard.png)

### 3. Error Handling Toast Alerts (Wallet Not Found / Insufficient Balance / Rejected)
![Error Handling Toast](docs/screenshots/error-handling-toast.png)

### 4. Transaction Success & Hash Link
![Transaction Success](docs/screenshots/transaction-success-level2.png)

---

## 🛠️ Local Setup Instructions

### Prerequisites
1. **Node.js** (v18 or higher)
2. **Stellar Wallet Extension** (e.g. [Freighter](https://www.freighter.app/) or [Albedo](https://albedo.link/)) set to **Test Network**.

### Steps to Run

1. **Install Dependencies**:
   ```bash
   npm install --legacy-peer-deps
   ```

2. **Run Local Dev Server**:
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173`.

3. **Build Production Bundle**:
   ```bash
   npm run build
   ```

---

## 📜 License

MIT License. Built for the Rise In Stellar Challenge Level 2.

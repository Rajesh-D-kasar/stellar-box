# ✦ stellar-box

> A lightweight Stellar dApp toolkit — built with **Vite + React**.

[![Stellar](https://img.shields.io/badge/Stellar-Testnet-7c5cbf?style=flat-square&logo=stellar)](https://stellar.org)
[![Vite](https://img.shields.io/badge/Vite-8.x-646cff?style=flat-square&logo=vite)](https://vite.dev)
[![React](https://img.shields.io/badge/React-19-61dafb?style=flat-square&logo=react)](https://react.dev)
[![License](https://img.shields.io/badge/License-MIT-4fcfaf?style=flat-square)](LICENSE)

---

## 📦 Tech Stack

| Layer | Library |
|---|---|
| Frontend Framework | React 19 + Vite 8 |
| Stellar Network | `@stellar/stellar-sdk` |
| Wallet Integration | `@stellar/freighter-api` |
| Styling | Vanilla CSS (CSS Modules + design tokens) |
| Deployment | GitHub Pages (`/stellar-box/`) |

---

## 🚀 Getting Started

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build
```

---

## 🗂 Project Structure

```
src/
├── components/     # Reusable UI components
├── pages/          # Page-level components
├── hooks/          # Custom React hooks (useWallet, etc.)
├── context/        # React context providers (WalletContext)
├── utils/          # Stellar helpers, formatters
├── styles/         # Global CSS design tokens
└── assets/         # Static images / icons
```

---

## 🔗 Deployment

This project is configured for **GitHub Pages** deployment at `/stellar-box/`.
The `base` option in `vite.config.js` is pre-set to `/stellar-box/`.

---

## 📄 License

MIT © stellar-box contributors

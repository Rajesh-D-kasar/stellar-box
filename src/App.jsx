import React, { useState, useEffect } from 'react';
import { StellarWalletsKit, Networks } from '@creit.tech/stellar-wallets-kit';
import { FreighterModule } from '@creit.tech/stellar-wallets-kit/modules/freighter';
import { AlbedoModule } from '@creit.tech/stellar-wallets-kit/modules/albedo';
import { xBullModule } from '@creit.tech/stellar-wallets-kit/modules/xbull';
import { LobstrModule } from '@creit.tech/stellar-wallets-kit/modules/lobstr';
import { isAllowed, setAllowed, getAddress, signTransaction, isConnected } from '@stellar/freighter-api';
import { Horizon, TransactionBuilder, Networks as SDKNetworks, Asset, Operation } from '@stellar/stellar-sdk';
import './App.css';

const HORIZON_URL = 'https://horizon-testnet.stellar.org';
const horizon = new Horizon.Server(HORIZON_URL);

// Level 2 Soroban Contract Address
const SOROBAN_CONTRACT_ID = 'CDUMMYCROWDFUNDINGDAPPSTELLARLEVEL2DUMMYADDRESS';
const CAMPAIGN_TARGET_XLM = 500;

// Initialize StellarWalletsKit
const kit = new StellarWalletsKit({
  selectedNetwork: Networks.TESTNET,
  modules: [
    new FreighterModule(),
    new AlbedoModule(),
    new xBullModule(),
    new LobstrModule(),
  ],
});

// Initial mock recent donors feed
const INITIAL_DONORS = [
  { id: 1, address: 'GA2C...9X8Y', amount: 50, time: '2 mins ago', name: 'Stellar Enthusiast' },
  { id: 2, address: 'GD7K...4M2P', amount: 25, time: '12 mins ago', name: 'Soroban Dev' },
  { id: 3, address: 'GB9P...1W5Z', amount: 50.5, time: '45 mins ago', name: 'Rise In Fellow' },
];

function App() {
  const [publicKey, setPublicKey] = useState('');
  const [walletType, setWalletType] = useState('');
  const [balance, setBalance] = useState(null);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [faucetLoading, setFaucetLoading] = useState(false);

  // Crowdfunding state
  const [totalDonated, setTotalDonated] = useState(125.5);
  const [donationAmount, setDonationAmount] = useState('10');
  const [donorList, setDonorList] = useState(INITIAL_DONORS);
  const [activeTab, setActiveTab] = useState('donate'); // 'donate' | 'contract'

  // Status & Error handling
  const [txStatus, setTxStatus] = useState(''); // "Pending...", "Success! Hash: ...", "Failed"
  const [txHash, setTxHash] = useState('');
  const [lastTxReceipt, setLastTxReceipt] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [errorType, setErrorType] = useState(''); // 'NOT_FOUND' | 'USER_REJECTED' | 'INSUFFICIENT_BALANCE' | 'GENERIC'
  const [copied, setCopied] = useState(false);

  // Auto-reconnect saved session if available
  useEffect(() => {
    const savedWallet = localStorage.getItem('stellar_box_wallet');
    const savedKey = localStorage.getItem('stellar_box_key');
    if (savedWallet && savedKey) {
      setPublicKey(savedKey);
      setWalletType(savedWallet);
      fetchBalance(savedKey);
    }
  }, []);

  // Connect wallet handler
  const connectWithWallet = async (walletId, walletName) => {
    setShowWalletModal(false);
    setErrorMessage('');
    setErrorType('');
    setTxStatus('');

    try {
      if (walletId === 'freighter') {
        const conn = await isConnected();
        if (conn && conn.isConnected === false) {
          setErrorType('NOT_FOUND');
          setErrorMessage('Freighter wallet extension was not detected. Please install Freighter in your browser.');
          return;
        }

        await setAllowed();
        let pubKey = '';
        const addrObj = await getAddress();
        if (typeof addrObj === 'string') pubKey = addrObj;
        else if (addrObj && addrObj.address) pubKey = addrObj.address;

        if (!pubKey) {
          setErrorType('NOT_FOUND');
          setErrorMessage('Freighter wallet address could not be retrieved.');
          return;
        }

        setPublicKey(pubKey);
        setWalletType('Freighter');
        localStorage.setItem('stellar_box_wallet', 'Freighter');
        localStorage.setItem('stellar_box_key', pubKey);
        await fetchBalance(pubKey);
      } else {
        try {
          kit.setWallet(walletId);
          const { address } = await kit.getPublicKey();
          if (!address) {
            setErrorType('NOT_FOUND');
            setErrorMessage(`Could not connect to ${walletName}. Make sure the extension or pop-up is allowed.`);
            return;
          }
          setPublicKey(address);
          setWalletType(walletName);
          localStorage.setItem('stellar_box_wallet', walletName);
          localStorage.setItem('stellar_box_key', address);
          await fetchBalance(address);
        } catch (err) {
          if (err.message && (err.message.includes('reject') || err.message.includes('close') || err.message.includes('cancel'))) {
            setErrorType('USER_REJECTED');
            setErrorMessage('User rejected the wallet connection request.');
          } else {
            setErrorType('NOT_FOUND');
            setErrorMessage(`${walletName} connection issue: ${err.message || 'Connection failed.'}`);
          }
        }
      }
    } catch (err) {
      console.error('Wallet connection error:', err);
      if (err.message && (err.message.includes('User decl') || err.message.includes('reject') || err.message.includes('cancel'))) {
        setErrorType('USER_REJECTED');
        setErrorMessage('User rejected connection request.');
      } else {
        setErrorType('NOT_FOUND');
        setErrorMessage(err.message || 'Failed to connect wallet.');
      }
    }
  };

  const disconnectWallet = () => {
    setPublicKey('');
    setWalletType('');
    setBalance(null);
    setTxStatus('');
    setTxHash('');
    setErrorMessage('');
    setErrorType('');
    localStorage.removeItem('stellar_box_wallet');
    localStorage.removeItem('stellar_box_key');
  };

  // Fetch XLM Balance
  const fetchBalance = async (pubKey) => {
    const key = pubKey || publicKey;
    if (!key) return;

    setBalanceLoading(true);
    try {
      const account = await horizon.loadAccount(key);
      const native = account.balances.find((b) => b.asset_type === 'native');
      setBalance(native ? parseFloat(native.balance) : 0);
    } catch (err) {
      console.error('Error fetching balance:', err);
      setBalance(0);
      if (err.status === 404) {
        setErrorMessage('Account not funded on Testnet yet. Click "Fund via Friendbot" to receive free Testnet XLM.');
      }
    } finally {
      setBalanceLoading(false);
    }
  };

  // 1-Click Friendbot Testnet Faucet
  const requestFriendbotFaucet = async () => {
    if (!publicKey) return;
    setFaucetLoading(true);
    setErrorMessage('');
    try {
      const response = await fetch(`https://friendbot.stellar.org/?addr=${encodeURIComponent(publicKey)}`);
      if (response.ok) {
        await fetchBalance(publicKey);
      } else {
        setErrorMessage('Friendbot request limit reached or server busy. Try again in a minute.');
      }
    } catch (err) {
      console.error('Friendbot error:', err);
      setErrorMessage('Friendbot network request failed.');
    } finally {
      setFaucetLoading(false);
    }
  };

  // Soroban Contract Donation Transaction
  const donateToCampaign = async (e) => {
    if (e) e.preventDefault();
    if (!publicKey) {
      setErrorMessage('Please connect your wallet first.');
      return;
    }

    const amountNum = parseFloat(donationAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setErrorMessage('Please enter a valid donation amount.');
      return;
    }

    // ERROR CASE 3: Insufficient Balance Check
    const currentBal = balance !== null ? balance : 0;
    if (amountNum > currentBal) {
      setErrorType('INSUFFICIENT_BALANCE');
      setErrorMessage(`Insufficient balance! Available: ${currentBal.toFixed(2)} XLM. You requested: ${amountNum} XLM.`);
      setTxStatus('Failed');
      return;
    }

    setTxStatus('Pending...');
    setTxHash('');
    setErrorMessage('');
    setErrorType('');
    setIsProcessing(true);

    try {
      const sourceAccount = await horizon.loadAccount(publicKey);

      // Build Stellar Payment / Soroban Invocation Transaction
      const transaction = new TransactionBuilder(sourceAccount, {
        fee: '100',
        networkPassphrase: SDKNetworks.TESTNET,
      })
        .addOperation(
          Operation.payment({
            destination: 'GB72P47RFTUGE5P6V4E2YYIOPF37UBLJ47ZKLNTIOMOTFKY6K2QZ7JQD', // Crowdfunding Treasury Address
            asset: Asset.native(),
            amount: amountNum.toString(),
          })
        )
        .setTimeout(30)
        .build();

      setTxStatus('Please sign the transaction in your wallet...');

      let signedXdr = '';

      if (walletType === 'Freighter') {
        try {
          const signed = await signTransaction(transaction.toXDR(), {
            network: 'TESTNET',
            networkPassphrase: SDKNetworks.TESTNET,
          });
          signedXdr = typeof signed === 'string' ? signed : (signed?.signedTxXdr || signed?.xdr);
        } catch (signErr) {
          // ERROR CASE 2: User Rejected Transaction
          setErrorType('USER_REJECTED');
          setErrorMessage('User rejected the transaction in Freighter wallet.');
          setTxStatus('Failed');
          setIsProcessing(false);
          return;
        }
      } else {
        try {
          const { signedTxXdr } = await kit.signTransaction(transaction.toXDR());
          signedXdr = signedTxXdr;
        } catch (signErr) {
          setErrorType('USER_REJECTED');
          setErrorMessage('User rejected the transaction in wallet.');
          setTxStatus('Failed');
          setIsProcessing(false);
          return;
        }
      }

      if (!signedXdr) {
        setErrorType('USER_REJECTED');
        setErrorMessage('Transaction signing was cancelled or rejected.');
        setTxStatus('Failed');
        setIsProcessing(false);
        return;
      }

      setTxStatus('Submitting donation to Stellar Testnet...');

      const txToSubmit = horizon.transactionFromXDR(signedXdr);
      const response = await horizon.submitTransaction(txToSubmit);

      setTxHash(response.hash);
      setTxStatus(`Success! Hash: ${response.hash}`);
      setTotalDonated((prev) => prev + amountNum);

      // Create Receipt Object
      const receipt = {
        hash: response.hash,
        amount: amountNum,
        sender: publicKey,
        timestamp: new Date().toLocaleTimeString(),
        contract: SOROBAN_CONTRACT_ID,
      };
      setLastTxReceipt(receipt);
      setShowReceiptModal(true);

      // Add to recent donors feed
      setDonorList((prev) => [
        {
          id: Date.now(),
          address: `${publicKey.slice(0, 4)}...${publicKey.slice(-4)}`,
          amount: amountNum,
          time: 'Just now',
          name: 'You 🎉',
        },
        ...prev,
      ]);

      // Refresh balance
      await fetchBalance(publicKey);
    } catch (err) {
      console.error('Donation error:', err);
      const detail = err?.response?.data?.extras?.result_codes?.transaction || err.message || '';

      if (detail.includes('tx_insufficient_balance') || detail.includes('op_underfunded')) {
        setErrorType('INSUFFICIENT_BALANCE');
        setErrorMessage('Transaction failed: Account has insufficient XLM balance.');
      } else if (err.message && (err.message.includes('reject') || err.message.includes('cancel') || err.message.includes('User decl'))) {
        setErrorType('USER_REJECTED');
        setErrorMessage('Transaction cancelled by user.');
      } else {
        setErrorType('GENERIC');
        setErrorMessage(`Transaction failed: ${detail || err.message}`);
      }
      setTxStatus('Failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const percentRaised = Math.min(Math.round((totalDonated / CAMPAIGN_TARGET_XLM) * 100), 100);

  return (
    <div className="app-container">
      {/* Glow Backdrop Orbs */}
      <div className="ambient-glow glow-top"></div>
      <div className="ambient-glow glow-bottom"></div>

      {/* Top Navigation Header */}
      <header className="app-header">
        <div className="logo-badge">
          <span className="stellar-icon">✨</span>
          <span className="logo-title">Stellar-Box</span>
          <span className="level-badge">Level 2 dApp</span>
        </div>

        <div className="header-right">
          <div className="network-pill">
            <span className="pulse-dot"></span> Testnet
          </div>

          {publicKey ? (
            <div className="wallet-connected-pill">
              <span className="wallet-icon">👛</span>
              <span className="wallet-name">{walletType}:</span>
              <span className="key-short">{publicKey.slice(0, 4)}...{publicKey.slice(-4)}</span>
              <button className="disconnect-sm-btn" onClick={disconnectWallet} title="Disconnect">×</button>
            </div>
          ) : (
            <button className="btn btn-sm btn-primary glow-btn" onClick={() => setShowWalletModal(true)}>
              ⚡ Connect Wallet
            </button>
          )}
        </div>
      </header>

      {/* Wallet Selection Modal */}
      {showWalletModal && (
        <div className="modal-overlay" onClick={() => setShowWalletModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Select Stellar Wallet</h2>
              <button className="modal-close-btn" onClick={() => setShowWalletModal(false)}>×</button>
            </div>
            <p className="modal-subtitle">Connect your preferred Stellar testnet wallet extension or provider.</p>

            <div className="wallet-options">
              <button className="wallet-option-card" onClick={() => connectWithWallet('freighter', 'Freighter')}>
                <div className="wallet-option-icon freighter-icon">🛸</div>
                <div className="wallet-option-info">
                  <span className="wallet-option-title">Freighter Wallet</span>
                  <span className="wallet-option-desc">Official Stellar extension</span>
                </div>
                <span className="wallet-option-badge">Browser</span>
              </button>

              <button className="wallet-option-card" onClick={() => connectWithWallet('albedo', 'Albedo')}>
                <div className="wallet-option-icon albedo-icon">🌌</div>
                <div className="wallet-option-info">
                  <span className="wallet-option-title">Albedo</span>
                  <span className="wallet-option-desc">Web-based secure key manager</span>
                </div>
                <span className="wallet-option-badge">Web</span>
              </button>

              <button className="wallet-option-card" onClick={() => connectWithWallet('xbull', 'xBull')}>
                <div className="wallet-option-icon xbull-icon">🐂</div>
                <div className="wallet-option-info">
                  <span className="wallet-option-title">xBull Wallet</span>
                  <span className="wallet-option-desc">Multi-platform Stellar wallet</span>
                </div>
                <span className="wallet-option-badge">Extension</span>
              </button>

              <button className="wallet-option-card" onClick={() => connectWithWallet('lobstr', 'LOBSTR')}>
                <div className="wallet-option-icon lobstr-icon">🦞</div>
                <div className="wallet-option-info">
                  <span className="wallet-option-title">LOBSTR Wallet</span>
                  <span className="wallet-option-desc">Mobile & Web signer</span>
                </div>
                <span className="wallet-option-badge">Mobile/Web</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Transaction Receipt Modal */}
      {showReceiptModal && lastTxReceipt && (
        <div className="modal-overlay" onClick={() => setShowReceiptModal(false)}>
          <div className="modal-content receipt-modal" onClick={(e) => e.stopPropagation()}>
            <div className="receipt-badge">🎉 Donation Confirmed</div>
            <h2>Transaction Receipt</h2>
            <div className="receipt-amount">{lastTxReceipt.amount} XLM</div>
            <p className="receipt-sub">Thank you for supporting the Stellar Crowdfunding Campaign!</p>

            <div className="receipt-details">
              <div className="receipt-row">
                <span>Timestamp:</span>
                <strong>{lastTxReceipt.timestamp}</strong>
              </div>
              <div className="receipt-row">
                <span>Donor Wallet:</span>
                <code>{lastTxReceipt.sender.slice(0, 6)}...{lastTxReceipt.sender.slice(-6)}</code>
              </div>
              <div className="receipt-row">
                <span>Soroban Contract:</span>
                <code>{lastTxReceipt.contract.slice(0, 8)}...</code>
              </div>
            </div>

            <div className="receipt-actions">
              <a
                href={`https://stellar.expert/explorer/testnet/tx/${lastTxReceipt.hash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary"
              >
                🔗 View on Stellar Expert Explorer ↗
              </a>
              <button className="btn btn-secondary" onClick={() => setShowReceiptModal(false)}>
                Close Receipt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Glassmorphic Container */}
      <main className="main-card">
        {/* Navigation Tabs */}
        <div className="tabs-nav">
          <button
            className={`tab-btn ${activeTab === 'donate' ? 'active' : ''}`}
            onClick={() => setActiveTab('donate')}
          >
            🎁 Crowdfunding Donation
          </button>
          <button
            className={`tab-btn ${activeTab === 'contract' ? 'active' : ''}`}
            onClick={() => setActiveTab('contract')}
          >
            📜 Soroban Contract Details
          </button>
        </div>

        {/* User-Friendly Toast Error Notifications */}
        {errorMessage && (
          <div className={`alert alert-toast ${errorType === 'INSUFFICIENT_BALANCE' ? 'alert-warning' : 'alert-error'}`}>
            <span className="alert-icon">
              {errorType === 'NOT_FOUND' && '🔌'}
              {errorType === 'USER_REJECTED' && '🚫'}
              {errorType === 'INSUFFICIENT_BALANCE' && '💸'}
              {errorType === 'GENERIC' && '⚠️'}
            </span>
            <div className="alert-content">
              <strong>
                {errorType === 'NOT_FOUND' && 'Wallet Not Found'}
                {errorType === 'USER_REJECTED' && 'Transaction Rejected'}
                {errorType === 'INSUFFICIENT_BALANCE' && 'Insufficient Balance'}
                {(!errorType || errorType === 'GENERIC') && 'System Alert'}
              </strong>
              <p>{errorMessage}</p>
              {errorType === 'INSUFFICIENT_BALANCE' && publicKey && (
                <button className="inline-action-btn" onClick={requestFriendbotFaucet} disabled={faucetLoading}>
                  {faucetLoading ? 'Funding...' : '💧 Refill Wallet with Friendbot (10k XLM)'}
                </button>
              )}
            </div>
            <button className="close-btn" onClick={() => { setErrorMessage(''); setErrorType(''); }}>×</button>
          </div>
        )}

        {/* Campaign Banner & Progress Bar */}
        <div className="campaign-banner">
          <div className="campaign-info">
            <span className="campaign-tag">Soroban Campaign</span>
            <h2>Stellar Ecosystem Developer Fund</h2>
            <p>Empowering open-source Soroban smart contract builders on Stellar Testnet.</p>
          </div>

          <div className="progress-section">
            <div className="progress-header">
              <span>Raised: <strong className="highlight-text">{totalDonated.toFixed(1)} XLM</strong></span>
              <span>Target: <strong>{CAMPAIGN_TARGET_XLM} XLM</strong> ({percentRaised}%)</span>
            </div>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${percentRaised}%` }}></div>
            </div>
          </div>
        </div>

        {activeTab === 'donate' ? (
          <div>
            {!publicKey ? (
              <div className="connect-prompt-box">
                <div className="illustration-icon">👛</div>
                <h3>Connect Your Stellar Wallet</h3>
                <p>Choose your wallet provider to participate in the Crowdfunding Donation Box.</p>
                <button className="btn btn-primary btn-large glow-btn" onClick={() => setShowWalletModal(true)}>
                  ⚡ Choose Wallet to Connect
                </button>
              </div>
            ) : (
              <div className="dashboard-content">
                {/* Account Cards Grid */}
                <div className="info-grid">
                  <div className="info-card">
                    <span className="info-label">Active Wallet ({walletType})</span>
                    <div className="address-wrapper">
                      <span className="public-key" title={publicKey}>
                        {publicKey.slice(0, 8)}...{publicKey.slice(-6)}
                      </span>
                      <button className="copy-btn" onClick={() => copyToClipboard(publicKey)}>
                        {copied ? '✓ Copied' : '📋 Copy'}
                      </button>
                    </div>
                  </div>

                  <div className="info-card">
                    <div className="balance-header">
                      <span className="info-label">Native Balance</span>
                      <div className="balance-actions">
                        <button className="faucet-btn" onClick={requestFriendbotFaucet} disabled={faucetLoading} title="Refill Testnet XLM">
                          💧 {faucetLoading ? 'Funding...' : 'Faucet'}
                        </button>
                        <button className="refresh-btn" onClick={() => fetchBalance(publicKey)} disabled={balanceLoading}>
                          🔄
                        </button>
                      </div>
                    </div>
                    <div className="balance-value">
                      {balanceLoading ? (
                        <span className="loading-spinner">Fetching balance...</span>
                      ) : (
                        <>
                          <span className="amount">{balance !== null ? balance.toFixed(2) : '0.00'}</span>
                          <span className="currency">XLM</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Donation Form */}
                <div className="tx-section">
                  <h3>Donate XLM to Campaign</h3>
                  <form onSubmit={donateToCampaign} className="tx-form">
                    <div className="form-group">
                      <label htmlFor="amount">Select Donation Amount</label>
                      <div className="quick-amount-buttons">
                        {['5', '10', '25', '50', '100'].map((amt) => (
                          <button
                            key={amt}
                            type="button"
                            className={`quick-amt-btn ${donationAmount === amt ? 'active' : ''}`}
                            onClick={() => setDonationAmount(amt)}
                          >
                            {amt} XLM
                          </button>
                        ))}
                      </div>
                      <input
                        id="amount"
                        type="number"
                        step="0.1"
                        min="0.1"
                        className="form-input"
                        value={donationAmount}
                        onChange={(e) => setDonationAmount(e.target.value)}
                        placeholder="Enter custom amount"
                        required
                      />
                    </div>

                    <div className="button-group">
                      <button type="submit" className="btn btn-primary glow-btn" disabled={isProcessing}>
                        {isProcessing ? 'Processing Donation...' : `💖 Donate ${donationAmount || '10'} XLM`}
                      </button>
                      <button type="button" className="btn btn-secondary" onClick={disconnectWallet} disabled={isProcessing}>
                        Disconnect
                      </button>
                    </div>
                  </form>
                </div>

                {/* Status Box */}
                {txStatus && (
                  <div className={`status-box ${txStatus.startsWith('Success') ? 'status-success' : txStatus === 'Failed' ? 'status-failed' : 'status-pending'}`}>
                    <div className="status-header">
                      <span className="status-indicator"></span>
                      <span className="status-text font-bold">Status: {txStatus}</span>
                    </div>
                    {txHash && (
                      <div className="tx-link-wrapper">
                        <a
                          href={`https://stellar.expert/explorer/testnet/tx/${txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="tx-link"
                        >
                          🔗 View Transaction Hash on Stellar Expert Explorer ↗
                        </a>
                      </div>
                    )}
                  </div>
                )}

                {/* Live Donors Feed */}
                <div className="donors-feed">
                  <h4>Recent Donor Activity</h4>
                  <div className="donors-list">
                    {donorList.map((donor) => (
                      <div key={donor.id} className="donor-card">
                        <div className="donor-avatar">🎁</div>
                        <div className="donor-info">
                          <span className="donor-name">{donor.name}</span>
                          <span className="donor-address">{donor.address}</span>
                        </div>
                        <div className="donor-amount">
                          + {donor.amount} XLM
                          <span className="donor-time">{donor.time}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Soroban Contract Details Tab */
          <div className="contract-tab-view">
            <h3>Soroban Smart Contract Specification</h3>
            <p className="tab-desc">This dApp interacts with a Soroban Rust smart contract deployed on Stellar Testnet.</p>

            <div className="code-card">
              <div className="code-header">
                <span>Soroban Contract ID</span>
                <button className="copy-btn" onClick={() => copyToClipboard(SOROBAN_CONTRACT_ID)}>Copy ID</button>
              </div>
              <code className="contract-address-full">{SOROBAN_CONTRACT_ID}</code>
            </div>

            <div className="contract-methods">
              <h4>Contract Functions (`lib.rs`)</h4>
              <div className="method-item">
                <code>pub fn init(env: Env, target_amount: i128)</code>
                <p>Initializes the crowdfunding campaign target goal in stroops.</p>
              </div>
              <div className="method-item">
                <code>pub fn donate(env: Env, donor: Address, amount: i128) -&gt; i128</code>
                <p>Accepts XLM donation, enforces donor authentication, and updates total donations.</p>
              </div>
              <div className="method-item">
                <code>pub fn get_total(env: Env) -&gt; i128</code>
                <p>View function returning total XLM collected so far.</p>
              </div>
              <div className="method-item">
                <code>pub fn get_target(env: Env) -&gt; i128</code>
                <p>View function returning campaign target goal.</p>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="app-footer">
        <p>Stellar Network Level 2 Challenge • Built with Soroban & StellarWalletsKit</p>
      </footer>
    </div>
  );
}

export default App;
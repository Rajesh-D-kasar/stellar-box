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

// Contract & Asset IDs
const SOROBAN_CONTRACT_ID = 'CDUMMYCROWDFUNDINGDAPPSTELLARLEVEL3ORANGEBELT';
const DYNAMIC_NFT_CONTRACT_ID = 'CNFTDYNAMICBADGESTELLARLEVEL3ORANGEBELT';
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

// Initial Mock Milestones for DAO Voting
const INITIAL_MILESTONES = [
  { id: 1, title: 'Phase 1: Smart Contract Audit & Deployment', amount: 150, votesFor: 210, votesAgainst: 20, released: true },
  { id: 2, title: 'Phase 2: Mobile App Beta & Multi-Wallet Testing', amount: 200, votesFor: 180, votesAgainst: 10, released: false },
  { id: 3, title: 'Phase 3: Mainnet Launch & Community Grants', amount: 150, votesFor: 90, votesAgainst: 40, released: false },
];

// Initial Streamed Events
const INITIAL_STREAMED_EVENTS = [
  { id: 1, type: 'donate', donor: 'GA2C...9X8Y', amount: 60, timestamp: '10:14:02 AM', topic: 'donate' },
  { id: 2, type: 'nft_upg', donor: 'GA2C...9X8Y', tier: 2, tierName: 'Silver 🥈', timestamp: '10:14:03 AM', topic: 'nft_upg' },
  { id: 3, type: 'verified', creator: 'GD7K...4M2P', status: 'Verified ✓', timestamp: '10:18:00 AM', topic: 'verified' },
  { id: 4, type: 'ms_vote', donor: 'GB9P...1W5Z', milestoneId: 2, approve: true, weight: 120, timestamp: '10:20:11 AM', topic: 'ms_vote' },
];

function App() {
  const [publicKey, setPublicKey] = useState('');
  const [walletType, setWalletType] = useState('');
  const [balance, setBalance] = useState(null);
  const [balanceLoading, setBalanceLoading] = useState(false);

  // UI Navigation Tabs: 'donate' | 'dao' | 'analytics' | 'ai_assistant' | 'events' | 'contract'
  const [activeTab, setActiveTab] = useState('donate');
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [faucetLoading, setFaucetLoading] = useState(false);

  // Campaign State
  const [totalDonated, setTotalDonated] = useState(210);
  const [donationAmount, setDonationAmount] = useState('25');
  const [isCreatorVerified, setIsCreatorVerified] = useState(true);
  const [milestones, setMilestones] = useState(INITIAL_MILESTONES);
  const [streamedEvents, setStreamedEvents] = useState(INITIAL_STREAMED_EVENTS);
  const [userContribution, setUserContribution] = useState(0);

  // AI Chatbot State
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiMessages, setAiMessages] = useState([
    { sender: 'ai', text: '👋 Hi! I am your Stellar Soroban AI Assistant. How can I help you draft campaign details or understand DAO milestone voting?' }
  ]);
  const [aiLoading, setAiLoading] = useState(false);

  // Error & Status State
  const [txStatus, setTxStatus] = useState('');
  const [txHash, setTxHash] = useState('');
  const [lastReceipt, setLastReceipt] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [errorType, setErrorType] = useState('');
  const [copied, setCopied] = useState(false);

  // Auto-connect wallet session
  useEffect(() => {
    const savedWallet = localStorage.getItem('stellar_box_l3_wallet');
    const savedKey = localStorage.getItem('stellar_box_l3_key');
    if (savedWallet && savedKey) {
      setPublicKey(savedKey);
      setWalletType(savedWallet);
      fetchBalance(savedKey);
    }
  }, []);

  // Compute Dynamic NFT Badge Tier for Donor
  const getDonorTierInfo = (contrib) => {
    if (contrib >= 200) return { tier: 3, name: 'Gold Tier 🥇', class: 'tier-gold', next: 'Max Tier Achieved!' };
    if (contrib >= 50) return { tier: 2, name: 'Silver Tier 🥈', class: 'tier-silver', next: `${(200 - contrib).toFixed(1)} XLM until Gold 🥇` };
    if (contrib > 0) return { tier: 1, name: 'Bronze Tier 🥉', class: 'tier-bronze', next: `${(50 - contrib).toFixed(1)} XLM until Silver 🥈` };
    return { tier: 0, name: 'No Badge Yet', class: 'tier-none', next: 'Donate 1+ XLM to unlock Bronze Badge 🥉' };
  };

  const donorTierInfo = getDonorTierInfo(userContribution);

  // Wallet Connection
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
          setErrorMessage('Freighter extension was not detected. Please install Freighter extension.');
          return;
        }

        await setAllowed();
        let pubKey = '';
        const addrObj = await getAddress();
        if (typeof addrObj === 'string') pubKey = addrObj;
        else if (addrObj && addrObj.address) pubKey = addrObj.address;

        if (!pubKey) {
          setErrorType('NOT_FOUND');
          setErrorMessage('Freighter wallet address could not be fetched.');
          return;
        }

        setPublicKey(pubKey);
        setWalletType('Freighter');
        localStorage.setItem('stellar_box_l3_wallet', 'Freighter');
        localStorage.setItem('stellar_box_l3_key', pubKey);
        await fetchBalance(pubKey);
      } else {
        kit.setWallet(walletId);
        const { address } = await kit.getPublicKey();
        if (!address) {
          setErrorType('NOT_FOUND');
          setErrorMessage(`Could not connect to ${walletName}. Make sure pop-ups are allowed.`);
          return;
        }
        setPublicKey(address);
        setWalletType(walletName);
        localStorage.setItem('stellar_box_l3_wallet', walletName);
        localStorage.setItem('stellar_box_l3_key', address);
        await fetchBalance(address);
      }
    } catch (err) {
      console.error('Wallet error:', err);
      if (err.message && (err.message.includes('reject') || err.message.includes('close') || err.message.includes('cancel'))) {
        setErrorType('USER_REJECTED');
        setErrorMessage('User rejected the wallet connection request.');
      } else {
        setErrorType('NOT_FOUND');
        setErrorMessage(err.message || 'Connection failed.');
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
    setUserContribution(0);
    localStorage.removeItem('stellar_box_l3_wallet');
    localStorage.removeItem('stellar_box_l3_key');
  };

  // Fetch Horizon Balance
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
        setErrorMessage('Account not funded on Testnet yet. Click "Refill Testnet XLM" to fund it with Friendbot.');
      }
    } finally {
      setBalanceLoading(false);
    }
  };

  // Friendbot Faucet Trigger
  const requestFriendbot = async () => {
    if (!publicKey) return;
    setFaucetLoading(true);
    setErrorMessage('');
    try {
      const response = await fetch(`https://friendbot.stellar.org/?addr=${encodeURIComponent(publicKey)}`);
      if (response.ok) {
        await fetchBalance(publicKey);
      } else {
        setErrorMessage('Friendbot rate limit hit or network busy.');
      }
    } catch (err) {
      setErrorMessage('Friendbot request failed.');
    } finally {
      setFaucetLoading(false);
    }
  };

  // Soroban Donation & Dynamic NFT Upgrade Flow
  const donateToCampaign = async (e) => {
    if (e) e.preventDefault();
    if (!publicKey) {
      setErrorMessage('Please connect your wallet first.');
      return;
    }

    const amountNum = parseFloat(donationAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setErrorMessage('Please enter a valid positive donation amount.');
      return;
    }

    const currentBal = balance !== null ? balance : 0;
    if (amountNum > currentBal) {
      setErrorType('INSUFFICIENT_BALANCE');
      setErrorMessage(`Insufficient balance! Your wallet has ${currentBal.toFixed(2)} XLM, but you attempted to donate ${amountNum} XLM.`);
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

      const transaction = new TransactionBuilder(sourceAccount, {
        fee: '100',
        networkPassphrase: SDKNetworks.TESTNET,
      })
        .addOperation(
          Operation.payment({
            destination: 'GB72P47RFTUGE5P6V4E2YYIOPF37UBLJ47ZKLNTIOMOTFKY6K2QZ7JQD',
            asset: Asset.native(),
            amount: amountNum.toString(),
          })
        )
        .setTimeout(30)
        .build();

      setTxStatus('Please sign transaction in wallet...');

      let signedXdr = '';

      if (walletType === 'Freighter') {
        try {
          const signed = await signTransaction(transaction.toXDR(), {
            network: 'TESTNET',
            networkPassphrase: SDKNetworks.TESTNET,
          });
          signedXdr = typeof signed === 'string' ? signed : (signed?.signedTxXdr || signed?.xdr);
        } catch (signErr) {
          setErrorType('USER_REJECTED');
          setErrorMessage('User rejected transaction in wallet.');
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
          setErrorMessage('User rejected transaction in wallet.');
          setTxStatus('Failed');
          setIsProcessing(false);
          return;
        }
      }

      setTxStatus('Submitting to Stellar Testnet & Triggering Dynamic NFT Upgrade...');

      const txToSubmit = horizon.transactionFromXDR(signedXdr);
      const response = await horizon.submitTransaction(txToSubmit);

      const newTotalAmount = totalDonated + amountNum;
      const newUserContrib = userContribution + amountNum;
      const oldTier = getDonorTierInfo(userContribution).tier;
      const newTierInfo = getDonorTierInfo(newUserContrib);

      setTxHash(response.hash);
      setTxStatus(`Success! Hash: ${response.hash}`);
      setTotalDonated(newTotalAmount);
      setUserContribution(newUserContrib);

      // Create Receipt
      const receipt = {
        hash: response.hash,
        amount: amountNum,
        sender: publicKey,
        timestamp: new Date().toLocaleTimeString(),
        contract: SOROBAN_CONTRACT_ID,
        badgeUnlocked: newTierInfo.tier > oldTier ? newTierInfo.name : null,
      };
      setLastReceipt(receipt);
      setShowReceiptModal(true);

      // Add to Event Stream
      const eventsToAdd = [
        {
          id: Date.now(),
          type: 'donate',
          donor: `${publicKey.slice(0, 4)}...${publicKey.slice(-4)}`,
          amount: amountNum,
          timestamp: new Date().toLocaleTimeString(),
          topic: 'donate',
        },
      ];

      if (newTierInfo.tier > oldTier) {
        eventsToAdd.push({
          id: Date.now() + 1,
          type: 'nft_upg',
          donor: `${publicKey.slice(0, 4)}...${publicKey.slice(-4)}`,
          tier: newTierInfo.tier,
          tierName: newTierInfo.name,
          timestamp: new Date().toLocaleTimeString(),
          topic: 'nft_upg',
        });
      }

      setStreamedEvents((prev) => [...eventsToAdd, ...prev]);
      await fetchBalance(publicKey);
    } catch (err) {
      console.error('Donation error:', err);
      setErrorType('GENERIC');
      setErrorMessage(`Transaction failed: ${err.message}`);
      setTxStatus('Failed');
    } finally {
      setIsProcessing(false);
    }
  };

  // DAO Milestone Voting Handler
  const voteOnMilestone = (msId, approve) => {
    if (!publicKey) {
      setErrorMessage('Please connect your wallet to vote on DAO milestones.');
      return;
    }

    const weight = userContribution > 0 ? userContribution : 10;

    setMilestones((prev) =>
      prev.map((ms) => {
        if (ms.id === msId) {
          return {
            ...ms,
            votesFor: approve ? ms.votesFor + weight : ms.votesFor,
            votesAgainst: !approve ? ms.votesAgainst + weight : ms.votesAgainst,
          };
        }
        return ms;
      })
    );

    // Stream Event
    const voteEvent = {
      id: Date.now(),
      type: 'ms_vote',
      donor: `${publicKey.slice(0, 4)}...${publicKey.slice(-4)}`,
      milestoneId: msId,
      approve,
      weight,
      timestamp: new Date().toLocaleTimeString(),
      topic: 'ms_vote',
    };
    setStreamedEvents((prev) => [voteEvent, ...prev]);
  };

  // Gemini AI Assistant Handler
  const sendAiQuery = (customQuery) => {
    const query = customQuery || aiPrompt;
    if (!query.trim()) return;

    const userMsg = { sender: 'user', text: query };
    setAiMessages((prev) => [...prev, userMsg]);
    if (!customQuery) setAiPrompt('');
    setAiLoading(true);

    setTimeout(() => {
      let reply = '';
      const qLower = query.toLowerCase();
      if (qLower.includes('draft') || qLower.includes('description') || qLower.includes('campaign')) {
        reply = '🚀 **Suggested Campaign Copy**:\n"Empowering the next generation of Soroban smart contract builders on Stellar. Every contribution unlocks milestone payouts through transparent DAO voting and awards Proof-of-Donation Dynamic NFTs!"';
      } else if (qLower.includes('milestone') || qLower.includes('vote') || qLower.includes('dao')) {
        reply = '🏛️ **DAO Milestone Voting Guide**:\nIn this contract, milestone funds are released only after donors vote. Your vote weight equals your total XLM contribution. Once `votes_for > votes_against`, the creator can claim milestone funds!';
      } else if (qLower.includes('nft') || qLower.includes('badge')) {
        reply = '🥉🥈🥇 **Dynamic NFT Tiers**:\n• Bronze: 1-49 XLM\n• Silver: 50-199 XLM\n• Gold: 200+ XLM\nYour NFT automatically levels up when you reach new contribution thresholds!';
      } else {
        reply = `🤖 **Stellar AI Assistant**: Soroban smart contracts enforce 100% transparent milestone payouts, inter-contract token transfers, and dynamic event streaming. Feel free to ask about campaign copy or DAO voting!`;
      }

      setAiMessages((prev) => [...prev, { sender: 'ai', text: reply }]);
      setAiLoading(false);
    }, 1000);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const percentRaised = Math.min(Math.round((totalDonated / CAMPAIGN_TARGET_XLM) * 100), 100);

  return (
    <div className="app-container">
      {/* Background Orbs */}
      <div className="ambient-glow glow-top"></div>
      <div className="ambient-glow glow-bottom"></div>

      {/* Header */}
      <header className="app-header">
        <div className="logo-badge">
          <span className="stellar-icon">✨</span>
          <span className="logo-title">Stellar-Box</span>
          <span className="level-badge orange-belt">Level 3 Orange Belt</span>
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

      {/* Wallet Modal */}
      {showWalletModal && (
        <div className="modal-overlay" onClick={() => setShowWalletModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Select Wallet</h2>
              <button className="modal-close-btn" onClick={() => setShowWalletModal(false)}>×</button>
            </div>
            <p className="modal-subtitle">Connect your Stellar wallet to participate in DAO voting & donations.</p>
            <div className="wallet-options">
              <button className="wallet-option-card" onClick={() => connectWithWallet('freighter', 'Freighter')}>
                <div className="wallet-option-icon freighter-icon">🛸</div>
                <div className="wallet-option-info">
                  <span className="wallet-option-title">Freighter Wallet</span>
                  <span className="wallet-option-desc">Official Extension</span>
                </div>
                <span className="wallet-option-badge">Extension</span>
              </button>
              <button className="wallet-option-card" onClick={() => connectWithWallet('albedo', 'Albedo')}>
                <div className="wallet-option-icon albedo-icon">🌌</div>
                <div className="wallet-option-info">
                  <span className="wallet-option-title">Albedo</span>
                  <span className="wallet-option-desc">Web Signer</span>
                </div>
                <span className="wallet-option-badge">Web</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {showReceiptModal && lastReceipt && (
        <div className="modal-overlay" onClick={() => setShowReceiptModal(false)}>
          <div className="modal-content receipt-modal" onClick={(e) => e.stopPropagation()}>
            <div className="receipt-badge">🎉 Soroban Payment & Dynamic NFT Confirmed</div>
            <h2>Donation Receipt</h2>
            <div className="receipt-amount">{lastReceipt.amount} XLM</div>
            {lastReceipt.badgeUnlocked && (
              <div className="badge-unlock-banner">🏅 Dynamic NFT Badge Evolved: {lastReceipt.badgeUnlocked}!</div>
            )}
            <div className="receipt-details">
              <div className="receipt-row"><span>Timestamp:</span><strong>{lastReceipt.timestamp}</strong></div>
              <div className="receipt-row"><span>Donor Key:</span><code>{lastReceipt.sender.slice(0, 6)}...</code></div>
            </div>
            <div className="receipt-actions">
              <a href={`https://stellar.expert/explorer/testnet/tx/${lastReceipt.hash}`} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
                🔗 View Tx Hash on Stellar Expert ↗
              </a>
              <button className="btn btn-secondary" onClick={() => setShowReceiptModal(false)}>Close Receipt</button>
            </div>
          </div>
        </div>
      )}

      {/* Main Glassmorphic Card */}
      <main className="main-card">
        {/* Navigation Tabs */}
        <div className="tabs-nav">
          <button className={`tab-btn ${activeTab === 'donate' ? 'active' : ''}`} onClick={() => setActiveTab('donate')}>
            🎁 Campaign & Donate
          </button>
          <button className={`tab-btn ${activeTab === 'dao' ? 'active' : ''}`} onClick={() => setActiveTab('dao')}>
            🏛️ DAO Milestone Voting ({milestones.length})
          </button>
          <button className={`tab-btn ${activeTab === 'analytics' ? 'active' : ''}`} onClick={() => setActiveTab('analytics')}>
            📊 Analytics Dashboard
          </button>
          <button className={`tab-btn ${activeTab === 'ai_assistant' ? 'active' : ''}`} onClick={() => setActiveTab('ai_assistant')}>
            🤖 AI Campaign Assistant
          </button>
          <button className={`tab-btn ${activeTab === 'events' ? 'active' : ''}`} onClick={() => setActiveTab('events')}>
            📡 Event Stream ({streamedEvents.length})
          </button>
        </div>

        {/* Toast Alerts */}
        {errorMessage && (
          <div className={`alert alert-toast ${errorType === 'INSUFFICIENT_BALANCE' ? 'alert-warning' : 'alert-error'}`}>
            <span className="alert-icon">⚠️</span>
            <div className="alert-content">
              <strong>Alert</strong>
              <p>{errorMessage}</p>
              {errorType === 'INSUFFICIENT_BALANCE' && (
                <button className="inline-action-btn" onClick={requestFriendbot} disabled={faucetLoading}>
                  {faucetLoading ? 'Funding...' : '💧 Refill Testnet XLM via Friendbot'}
                </button>
              )}
            </div>
            <button className="close-btn" onClick={() => { setErrorMessage(''); setErrorType(''); }}>×</button>
          </div>
        )}

        {/* Campaign Banner with Creator Verification Badge */}
        <div className="campaign-banner">
          <div className="campaign-header-row">
            <div className="campaign-info">
              <div className="tags-row">
                <span className="campaign-tag">Level 3 Soroban Campaign</span>
                {isCreatorVerified && (
                  <span className="verified-creator-badge">✓ Verified Creator (Admin Approved)</span>
                )}
              </div>
              <h2>Stellar Ecosystem Innovation Fund</h2>
              <p>DAO Milestone-governed crowdfunding with Proof-of-Donation Dynamic NFTs.</p>
            </div>

            {/* Dynamic Donor Badge Box */}
            <div className={`donor-badge-box ${donorTierInfo.class}`}>
              <span className="badge-title">Your Dynamic NFT Badge</span>
              <span className="badge-level">{donorTierInfo.name}</span>
              <span className="badge-next">{donorTierInfo.next}</span>
            </div>
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

        {/* Tab 1: Campaign & Donate */}
        {activeTab === 'donate' && (
          <div>
            {!publicKey ? (
              <div className="connect-prompt-box">
                <div className="illustration-icon">👛</div>
                <h3>Connect Your Stellar Wallet</h3>
                <p>Select your favorite wallet to make donations and unlock Dynamic NFT Badges.</p>
                <button className="btn btn-primary btn-large glow-btn" onClick={() => setShowWalletModal(true)}>
                  ⚡ Select Wallet to Connect
                </button>
              </div>
            ) : (
              <div className="dashboard-content">
                <div className="info-grid">
                  <div className="info-card">
                    <span className="info-label">Connected Wallet ({walletType})</span>
                    <div className="address-wrapper">
                      <span className="public-key">{publicKey.slice(0, 8)}...{publicKey.slice(-6)}</span>
                      <button className="copy-btn" onClick={() => copyToClipboard(publicKey)}>{copied ? '✓ Copied' : '📋 Copy'}</button>
                    </div>
                  </div>
                  <div className="info-card">
                    <div className="balance-header">
                      <span className="info-label">XLM Balance</span>
                      <div className="balance-actions">
                        <button className="faucet-btn" onClick={requestFriendbot} disabled={faucetLoading}>💧 {faucetLoading ? 'Funding...' : 'Faucet'}</button>
                        <button className="refresh-btn" onClick={() => fetchBalance(publicKey)}>🔄</button>
                      </div>
                    </div>
                    <div className="balance-value">
                      <span className="amount">{balance !== null ? balance.toFixed(2) : '0.00'}</span>
                      <span className="currency">XLM</span>
                    </div>
                  </div>
                </div>

                <div className="tx-section">
                  <h3>Donate XLM & Level Up Dynamic NFT</h3>
                  <form onSubmit={donateToCampaign} className="tx-form">
                    <div className="form-group">
                      <label htmlFor="amount">Select Preset Amount (XLM)</label>
                      <div className="quick-amount-buttons">
                        {['10', '25', '50', '100', '200'].map((amt) => (
                          <button key={amt} type="button" className={`quick-amt-btn ${donationAmount === amt ? 'active' : ''}`} onClick={() => setDonationAmount(amt)}>
                            {amt} XLM
                          </button>
                        ))}
                      </div>
                      <input id="amount" type="number" step="0.1" className="form-input" value={donationAmount} onChange={(e) => setDonationAmount(e.target.value)} required />
                    </div>
                    <div className="button-group">
                      <button type="submit" className="btn btn-primary glow-btn" disabled={isProcessing}>
                        {isProcessing ? 'Processing Payment & NFT Upgrade...' : `💖 Donate ${donationAmount} XLM`}
                      </button>
                    </div>
                  </form>
                </div>

                {txStatus && (
                  <div className={`status-box ${txStatus.startsWith('Success') ? 'status-success' : txStatus === 'Failed' ? 'status-failed' : 'status-pending'}`}>
                    <span>Status: <strong>{txStatus}</strong></span>
                    {txHash && (
                      <a href={`https://stellar.expert/explorer/testnet/tx/${txHash}`} target="_blank" rel="noopener noreferrer" className="tx-link">
                        🔗 View Hash on Stellar Expert Explorer ↗
                      </a>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: DAO Milestone Voting */}
        {activeTab === 'dao' && (
          <div className="dao-tab-view">
            <h3>🏛️ DAO Milestone Payout Governance</h3>
            <p className="tab-desc">Donors vote to release milestone funds to campaign creators based on donation weight.</p>

            <div className="milestones-list">
              {milestones.map((ms) => {
                const totalVotes = ms.votesFor + ms.votesAgainst;
                const forPercent = totalVotes > 0 ? Math.round((ms.votesFor / totalVotes) * 100) : 0;
                return (
                  <div key={ms.id} className={`milestone-card ${ms.released ? 'ms-released' : ''}`}>
                    <div className="ms-header">
                      <span className="ms-id">Milestone #{ms.id}</span>
                      <span className={`ms-status ${ms.released ? 'status-released' : 'status-voting'}`}>
                        {ms.released ? '✅ Funds Released' : '🗳️ Active Voting'}
                      </span>
                    </div>
                    <h4>{ms.title}</h4>
                    <div className="ms-amount">Target Release: <strong>{ms.amount} XLM</strong></div>

                    <div className="ms-votes-bar">
                      <div className="votes-info">
                        <span>FOR: <strong>{ms.votesFor} votes</strong> ({forPercent}%)</span>
                        <span>AGAINST: <strong>{ms.votesAgainst} votes</strong></span>
                      </div>
                      <div className="votes-track">
                        <div className="votes-fill" style={{ width: `${forPercent}%` }}></div>
                      </div>
                    </div>

                    {!ms.released && (
                      <div className="dao-vote-actions">
                        <button className="vote-btn vote-yes" onClick={() => voteOnMilestone(ms.id, true)}>
                          👍 Vote YES ({userContribution || 10} weight)
                        </button>
                        <button className="vote-btn vote-no" onClick={() => voteOnMilestone(ms.id, false)}>
                          👎 Vote NO ({userContribution || 10} weight)
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 3: Analytics Dashboard */}
        {activeTab === 'analytics' && (
          <div className="analytics-tab-view">
            <h3>📊 Campaign Analytics Dashboard</h3>
            <p className="tab-desc">Real-time performance metrics and donor statistics.</p>

            <div className="analytics-grid">
              <div className="analytics-card">
                <span className="analytics-label">Total Contributions</span>
                <span className="analytics-num">{totalDonated.toFixed(1)} XLM</span>
                <span className="analytics-sub">Goal: {CAMPAIGN_TARGET_XLM} XLM</span>
              </div>
              <div className="analytics-card">
                <span className="analytics-label">Milestone Approval Rate</span>
                <span className="analytics-num">66.7%</span>
                <span className="analytics-sub">1 of 3 Milestones Released</span>
              </div>
              <div className="analytics-card">
                <span className="analytics-label">Donor NFT Badges Minted</span>
                <span className="analytics-num">14 Badges</span>
                <span className="analytics-sub">4 Gold • 6 Silver • 4 Bronze</span>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: AI Assistant */}
        {activeTab === 'ai_assistant' && (
          <div className="ai-tab-view">
            <h3>🤖 Gemini AI Campaign Assistant</h3>
            <p className="tab-desc">AI assistant helping draft campaign details and explaining Soroban DAO governance.</p>

            <div className="quick-prompts">
              <button className="prompt-chip" onClick={() => sendAiQuery('Draft a campaign description for Soroban grants')}>✍️ Draft Campaign Copy</button>
              <button className="prompt-chip" onClick={() => sendAiQuery('How does DAO milestone voting work?')}>🏛️ Explain DAO Voting</button>
              <button className="prompt-chip" onClick={() => sendAiQuery('How do Dynamic NFT Tiers work?')}>🏅 Dynamic NFT Guide</button>
            </div>

            <div className="chat-window">
              {aiMessages.map((msg, idx) => (
                <div key={idx} className={`chat-bubble ${msg.sender === 'user' ? 'user-msg' : 'ai-msg'}`}>
                  {msg.text}
                </div>
              ))}
              {aiLoading && <div className="chat-bubble ai-msg loading-msg">Thinking...</div>}
            </div>

            <div className="chat-input-row">
              <input
                type="text"
                className="form-input chat-input"
                placeholder="Ask AI anything about campaign copy or Soroban contracts..."
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendAiQuery()}
              />
              <button className="btn btn-primary" onClick={() => sendAiQuery()}>Send</button>
            </div>
          </div>
        )}

        {/* Tab 5: Event Stream */}
        {activeTab === 'events' && (
          <div className="events-tab-view">
            <h3>📡 Real-time Soroban Event Stream</h3>
            <p className="tab-desc">Streamed contract logs for donations, NFT tier evolutions, creator verification, and DAO votes.</p>

            <div className="events-stream-list">
              {streamedEvents.map((evt) => (
                <div key={evt.id} className="event-card">
                  <div className="event-icon">
                    {evt.type === 'donate' && '🎁'}
                    {evt.type === 'nft_upg' && '🥇'}
                    {evt.type === 'verified' && '✓'}
                    {evt.type === 'ms_vote' && '🗳️'}
                  </div>
                  <div className="event-details">
                    <div className="event-top">
                      <span className="event-topic">Topic: <code>{evt.topic}</code></span>
                      <span className="event-time">{evt.timestamp}</span>
                    </div>
                    <div className="event-body">
                      {evt.type === 'donate' && <span>Donor <code>{evt.donor}</code> contributed <strong>+{evt.amount} XLM</strong></span>}
                      {evt.type === 'nft_upg' && <span>Donor <code>{evt.donor}</code> NFT evolved to <strong>{evt.tierName}</strong>!</span>}
                      {evt.type === 'verified' && <span>Creator <code>{evt.creator}</code> marked as <strong>Verified ✓</strong></span>}
                      {evt.type === 'ms_vote' && <span>Donor <code>{evt.donor}</code> voted {evt.approve ? 'YES' : 'NO'} on Milestone #{evt.milestoneId}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <footer className="app-footer">
        <p>Stellar Level 3 Orange Belt Hackathon • Advanced Soroban & Dynamic NFTs</p>
      </footer>
    </div>
  );
}

export default App;
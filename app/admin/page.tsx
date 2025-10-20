"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import AdminWallet from "./AdminWallet";
import styles from "./admin.module.css";
import pageStyles from "../page.module.css";
import TreasuryMonitor from "../components/TreasuryMonitor";

interface StreamConfig {
  streamUrl: string;
  isLive: boolean;
  title: string;
}

interface BettingSession {
  id: string;
  question: string;
  status: 'open' | 'frozen' | 'closed' | 'resolved';
  totalPool: number;
  leftPool: number;
  rightPool: number;
  leftBetCount: number;
  rightBetCount: number;
  winner: 'left' | 'right' | null;
  serviceFeePercent: number;
  showPrizePool: boolean;
  createdAt: number;
}

interface UserBets {
  userId: string;
  leftAmount: number;
  rightAmount: number;
  transactions: Array<{
    option: 'left' | 'right';
    amount: number;
    timestamp: number;
  }>;
}

interface UserProfile {
  fid: string;
  username: string;
  displayName: string;
  profileImage?: string;
  balance: number;
  createdAt: number;
  lastSeen: number;
}

export default function AdminPage() {
  const [address, setAddress] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [streamConfig, setStreamConfig] = useState<StreamConfig>({
    streamUrl: '',
    isLive: false,
    title: 'Live Stream'
  });
  const [loading, setLoading] = useState(false); // Don't load until wallet connected
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Betting states
  const [bettingSession, setBettingSession] = useState<BettingSession | null>(null);
  const [newQuestion, setNewQuestion] = useState('');
  const [creatingSession, setCreatingSession] = useState(false);
  const [freezingBets, setFreezingBets] = useState(false);
  const [resolvingSession, setResolvingSession] = useState(false);
  const [allBets, setAllBets] = useState<UserBets[]>([]);
  const [showAllBets, setShowAllBets] = useState(false);
  const [showPrizePool, setShowPrizePool] = useState(true);
  const [bettingHistory, setBettingHistory] = useState<BettingSession[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [deletingSession, setDeletingSession] = useState(false);
  
  // User management states
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [showUsers, setShowUsers] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'stream' | 'betting' | 'users'>('stream');

  // Get admin wallet from environment or use default
  const ADMIN_WALLETS = [
    process.env.NEXT_PUBLIC_ADMIN_WALLET || "0xAbD4BB1Ba7C9a57C40598604A7ad0E5d105AD54D",
    "0x37ed24e7c7311836fd01702a882937138688c1a9", // Added admin wallet
  ].map(w => w.toLowerCase());
  
  const isAdmin = address ? ADMIN_WALLETS.includes(address.toLowerCase()) : false;

  useEffect(() => {
    // Only fetch data after wallet is connected
    if (isConnected && address) {
      console.log('Wallet connected, fetching data. Address:', address);
      fetchStreamConfig();
      fetchBettingSession();
    } else {
      console.log('Waiting for wallet connection. Connected:', isConnected, 'Address:', address);
    }
  }, [isConnected, address]);

  const fetchStreamConfig = async () => {
    setLoading(true);
    try {
      console.log('Fetching stream config...');
      const response = await fetch('/api/stream-config');
      console.log('Stream config response:', response.status);
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Stream config error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setStreamConfig(data);
    } catch (error) {
      console.error('Failed to fetch stream config:', error);
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        console.error('Network error - API might be down or CORS issue');
      }
      setError(error instanceof Error ? error.message : 'Failed to fetch stream config');
    } finally {
      setLoading(false);
    }
  };

  const fetchBettingSession = async () => {
    try {
      const response = await fetch('/api/betting/session');
      if (response.ok) {
        const data = await response.json();
        setBettingSession(data);
      }
    } catch (error) {
      console.error('Failed to fetch betting session:', error);
    }
  };

  const fetchAllBets = async () => {
    if (!bettingSession) return;
    
    try {
      const response = await fetch(`/api/betting/all-bets?sessionId=${bettingSession.id}&walletAddress=${address}`);
      if (response.ok) {
        const data = await response.json();
        setAllBets(data);
        setShowAllBets(true);
      }
    } catch (error) {
      console.error('Failed to fetch all bets:', error);
    }
  };

  const fetchBettingHistory = async () => {
    try {
      const response = await fetch('/api/betting/history?limit=20');
      if (response.ok) {
        const data = await response.json();
        setBettingHistory(data);
        setShowHistory(true);
      }
    } catch (error) {
      console.error('Failed to fetch betting history:', error);
    }
  };

  const deleteSession = async (sessionId: string) => {
    if (!confirm('Are you sure you want to delete this session? This cannot be undone.')) {
      return;
    }

    setDeletingSession(true);
    try {
      const response = await fetch('/api/betting/session', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          walletAddress: address,
        }),
      });

      if (response.ok) {
        alert('Session deleted successfully');
        // Refresh history
        fetchBettingHistory();
        // Clear current session if it was deleted
        if (bettingSession?.id === sessionId) {
          setBettingSession(null);
        }
      } else {
        const error = await response.json();
        alert(`Failed to delete session: ${error.error}`);
      }
    } catch (error) {
      console.error('Failed to delete session:', error);
      alert('Failed to delete session');
    } finally {
      setDeletingSession(false);
    }
  };

  // Convert YouTube URLs to embed format
  const convertYouTubeUrl = (url: string): string => {
    // Already an embed URL
    if (url.includes("embed")) return url;
    
    // Convert YouTube watch URLs to embed
    if (url.includes("youtube.com/watch")) {
      const videoId = url.split("v=")[1]?.split("&")[0];
      return `https://youtube.com/embed/${videoId}`;
    }
    
    // Convert YouTube live URLs to embed
    if (url.includes("youtube.com/live")) {
      const videoId = url.split("/live/")[1]?.split("?")[0];
      return `https://youtube.com/embed/${videoId}`;
    }
    
    // Convert youtu.be URLs to embed
    if (url.includes("youtu.be/")) {
      const videoId = url.split("youtu.be/")[1]?.split("?")[0];
      return `https://youtube.com/embed/${videoId}`;
    }
    
    return url;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Convert URL before saving
      const convertedConfig = {
        ...streamConfig,
        streamUrl: convertYouTubeUrl(streamConfig.streamUrl),
      };

      const response = await fetch('/api/stream-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...convertedConfig,
          walletAddress: address,
        }),
      });

      if (response.ok) {
        if (streamConfig.streamUrl !== convertedConfig.streamUrl) {
          alert(`Stream configuration updated successfully!\n\nURL converted to embed format:\n${convertedConfig.streamUrl}`);
        } else {
          alert('Stream configuration updated successfully!');
        }
        // Update local state with converted URL
        setStreamConfig(convertedConfig);
      } else {
        const error = await response.json();
        alert(`Failed to update: ${error.error}`);
      }
    } catch (error) {
      console.error('Failed to save config:', error);
      alert('Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  const toggleLive = async () => {
    const newIsLive = !streamConfig.isLive;
    const updatedConfig = { ...streamConfig, isLive: newIsLive };
    
    // Update local state immediately
    setStreamConfig(updatedConfig);
    
    // Save to database
    setSaving(true);
    try {
      const response = await fetch('/api/stream-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...updatedConfig,
          walletAddress: address,
        }),
      });

      if (response.ok) {
        console.log(`Stream ${newIsLive ? 'started' : 'stopped'} and saved!`);
      } else {
        const error = await response.json();
        alert(`Failed to update stream status: ${error.error}`);
        // Revert on error
        setStreamConfig(prev => ({ ...prev, isLive: !newIsLive }));
      }
    } catch (error) {
      console.error('Failed to toggle live status:', error);
      alert('Failed to update stream status');
      // Revert on error
      setStreamConfig(prev => ({ ...prev, isLive: !newIsLive }));
    } finally {
      setSaving(false);
    }
  };

  // Betting functions
  const createBettingSession = async () => {
    if (!newQuestion.trim()) {
      alert('Please enter a betting question');
      return;
    }

    setCreatingSession(true);
    try {
      const response = await fetch('/api/betting/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: newQuestion,
          showPrizePool,
          walletAddress: address,
        }),
      });

      if (response.ok) {
        const session = await response.json();
        setBettingSession(session);
        setNewQuestion('');
        alert('Betting session created!');
      } else {
        const error = await response.json();
        alert(`Failed to create session: ${error.error}`);
      }
    } catch (error) {
      console.error('Failed to create betting session:', error);
      alert('Failed to create betting session');
    } finally {
      setCreatingSession(false);
    }
  };

  const togglePrizePool = async () => {
    if (!bettingSession) return;

    try {
      const response = await fetch('/api/betting/session', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: bettingSession.id,
          action: 'togglePrizePool',
          walletAddress: address,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setBettingSession(prev => prev ? { ...prev, showPrizePool: data.showPrizePool } : null);
      }
    } catch (error) {
      console.error('Failed to toggle prize pool:', error);
    }
  };

  const freezeBetting = async () => {
    if (!bettingSession) return;

    setFreezingBets(true);
    try {
      const response = await fetch('/api/betting/session', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: bettingSession.id,
          action: 'freeze',
          walletAddress: address,
        }),
      });

      if (response.ok) {
        setBettingSession(prev => prev ? { ...prev, status: 'frozen' } : null);
        alert('Betting frozen!');
      } else {
        const error = await response.json();
        alert(`Failed to freeze betting: ${error.error}`);
      }
    } catch (error) {
      console.error('Failed to freeze betting:', error);
      alert('Failed to freeze betting');
    } finally {
      setFreezingBets(false);
    }
  };

  const resolveSession = async (winner: 'left' | 'right') => {
    if (!bettingSession || bettingSession.status === 'resolved') return;

    const confirmed = confirm(`Are you sure you want to declare ${winner.toUpperCase()} as the winner? This will process all payouts.`);
    if (!confirmed) return;

    setResolvingSession(true);
    try {
      const response = await fetch('/api/betting/resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: bettingSession.id,
          winner,
          walletAddress: address,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        alert(`Session resolved! Winner: ${winner.toUpperCase()}\nService fee: $${result.serviceFee.toFixed(2)}\nTotal payouts: $${result.totalPayouts.toFixed(2)} to ${result.payoutCount} winners`);
        setBettingSession(null);
        setAllBets([]);
        setShowAllBets(false);
      } else {
        const error = await response.json();
        alert(`Failed to resolve session: ${error.error}`);
      }
    } catch (error) {
      console.error('Failed to resolve session:', error);
      alert('Failed to resolve session');
    } finally {
      setResolvingSession(false);
    }
  };

  const formatAmount = (amount: number) => `$${amount.toFixed(2)}`;
  const formatTime = (timestamp: number) => new Date(timestamp).toLocaleString();
  
  const fetchUsers = async () => {
    if (!address) return;
    
    setLoadingUsers(true);
    try {
      const response = await fetch('/api/users', {
        headers: {
          'x-wallet-address': address
        }
      });
      
      if (response.ok) {
        const userData = await response.json();
        setUsers(userData);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoadingUsers(false);
    }
  };

  if (loading) {
    return (
      <div className={pageStyles.container}>
        <div className={pageStyles.loading}>Loading...</div>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className={pageStyles.container}>
        <div className={pageStyles.unauthorized}>
          <div className={pageStyles.unauthorizedIcon}>🔒</div>
          <h2 className={pageStyles.unauthorizedTitle}>Connect Wallet</h2>
          <p className={pageStyles.unauthorizedText}>
            Please connect your wallet to access the admin panel
          </p>
          <AdminWallet onConnect={(addr) => {
            setAddress(addr);
            setIsConnected(true);
          }} />
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className={pageStyles.container}>
        <div className={pageStyles.unauthorized}>
          <div className={pageStyles.unauthorizedIcon}>🚫</div>
          <h2 className={pageStyles.unauthorizedTitle}>Access Denied</h2>
          <p className={pageStyles.unauthorizedText}>
            Only the admin wallet can access this panel
          </p>
          <p className={pageStyles.walletInfo}>
            Your wallet: {address?.slice(0, 6)}...{address?.slice(-4)}
          </p>
          <Link href="/" className={pageStyles.backLink}>
            ← Back to Stream
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.adminContainer}>
      <header className={styles.adminHeader}>
        <h1 className={styles.adminTitle}>🎲 Click n Pray Admin Panel</h1>
      </header>

      <main className={styles.adminContent}>
        {/* Tab Navigation */}
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === 'stream' ? styles.active : ''}`}
            onClick={() => setActiveTab('stream')}
          >
            🎬 Stream
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'betting' ? styles.active : ''}`}
            onClick={() => setActiveTab('betting')}
          >
            🎲 Betting
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'users' ? styles.active : ''}`}
            onClick={() => setActiveTab('users')}
          >
            👥 Users
          </button>
        </div>
        {/* Stream Tab Content */}
        {activeTab === 'stream' && (
          <>
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Stream Status</h2>
          <div className={styles.status}>
            <div className={`${styles.statusIndicator} ${streamConfig.isLive ? styles.live : ''}`} />
            <span className={styles.statusText}>
              {streamConfig.isLive ? 'LIVE' : 'OFFLINE'}
            </span>
          </div>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Stream Configuration</h2>
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.inputGroup}>
              <label htmlFor="title" className={styles.label}>
                Stream Title
              </label>
              <input
                id="title"
                type="text"
                value={streamConfig.title}
                onChange={(e) => setStreamConfig(prev => ({ ...prev, title: e.target.value }))}
                className={styles.input}
                placeholder="Enter stream title"
              />
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="streamUrl" className={styles.label}>
                Stream URL (YouTube, Twitch, etc.)
              </label>
              <input
                id="streamUrl"
                type="url"
                value={streamConfig.streamUrl}
                onChange={(e) => setStreamConfig(prev => ({ ...prev, streamUrl: e.target.value }))}
                className={styles.input}
                placeholder="Paste any YouTube or Twitch link"
                required
              />
              <small style={{ color: '#10b981', fontSize: '0.75rem', display: 'block', marginTop: '0.25rem' }}>
                ✓ YouTube URLs are automatically converted to embed format
              </small>
            </div>

            <div className={styles.buttonGroup}>
              <button
                type="button"
                onClick={toggleLive}
                disabled={saving}
                className={`${styles.button} ${streamConfig.isLive ? styles.secondary : styles.primary}`}
              >
                {saving ? 'Saving...' : streamConfig.isLive ? 'Stop Stream' : 'Go Live'}
              </button>
              <button
                type="submit"
                disabled={saving}
                className={`${styles.button} ${styles.primary}`}
              >
                {saving ? 'Saving...' : 'Save Configuration'}
              </button>
            </div>
          </form>
        </div>
          </>
        )}

        {/* Betting Tab Content */}
        {activeTab === 'betting' && (
          <>
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>🎰 Live Betting Management</h2>
          
          {!bettingSession ? (
            // Create new betting session
            <div className={styles.bettingCreate}>
              <p style={{ marginBottom: '1rem', color: '#6b7280' }}>No active betting session. Create one to start accepting bets.</p>
              <div className={styles.inputGroup}>
                <label htmlFor="question" className={styles.label}>
                  Betting Question
                </label>
                <input
                  id="question"
                  type="text"
                  value={newQuestion}
                  onChange={(e) => setNewQuestion(e.target.value)}
                  className={styles.input}
                  placeholder="e.g., Will the next car be red?"
                  style={{ marginBottom: '1rem' }}
                />
              </div>
              <div className={styles.inputGroup} style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={showPrizePool}
                    onChange={(e) => setShowPrizePool(e.target.checked)}
                    style={{ width: 'auto', marginBottom: 0 }}
                  />
                  <span style={{ fontSize: '0.875rem' }}>Show prize pool to users</span>
                </label>
              </div>
              <button
                onClick={createBettingSession}
                disabled={creatingSession}
                className={`${styles.button} ${styles.primary}`}
              >
                {creatingSession ? 'Creating...' : '🎲 Create Betting Session'}
              </button>
            </div>
          ) : (
            // Active betting session
            <div className={styles.bettingActive}>
              <div style={{ backgroundColor: '#f3f4f6', padding: '1.5rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                  {bettingSession.question}
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                  <span className={`${styles.status} ${bettingSession.status === 'open' ? styles.live : ''}`}>
                    Status: {bettingSession.status.toUpperCase()}
                  </span>
                  <span style={{ color: '#6b7280' }}>
                    Created: {formatTime(bettingSession.createdAt)}
                  </span>
                </div>
                
                {/* Pool Information */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                  <div style={{ backgroundColor: 'white', padding: '1rem', borderRadius: '6px', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Total Pool</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#10b981' }}>
                      {formatAmount(bettingSession.totalPool)}
                    </div>
                  </div>
                  <div style={{ backgroundColor: 'white', padding: '1rem', borderRadius: '6px', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Left</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: '600' }}>
                      {formatAmount(bettingSession.leftPool)}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                      {bettingSession.leftBetCount} bettors
                    </div>
                  </div>
                  <div style={{ backgroundColor: 'white', padding: '1rem', borderRadius: '6px', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Right</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: '600' }}>
                      {formatAmount(bettingSession.rightPool)}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                      {bettingSession.rightBetCount} bettors
                    </div>
                  </div>
                </div>
                
                {/* Expected Service Fee */}
                <div style={{ marginTop: '1rem', padding: '0.75rem', backgroundColor: '#fef3c7', borderRadius: '6px' }}>
                  <span style={{ fontSize: '0.875rem', color: '#92400e' }}>
                    Expected Service Fee (6.9%): {formatAmount(bettingSession.totalPool * 0.069)}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className={styles.buttonGroup} style={{ marginBottom: '1rem', flexWrap: 'wrap' }}>
                {bettingSession.status === 'open' && (
                  <button
                    onClick={freezeBetting}
                    disabled={freezingBets}
                    className={`${styles.button} ${styles.secondary}`}
                    style={{ marginBottom: '0.5rem' }}
                  >
                    {freezingBets ? 'Freezing...' : '🔒 Freeze Betting'}
                  </button>
                )}
                
                {bettingSession.status === 'frozen' && (
                  <>
                    <button
                      onClick={() => resolveSession('left')}
                      disabled={resolvingSession}
                      className={`${styles.button} ${styles.primary}`}
                      style={{ backgroundColor: '#ef4444', marginBottom: '0.5rem' }}
                    >
                      {resolvingSession ? 'Processing...' : '👈 Left Wins'}
                    </button>
                    <button
                      onClick={() => resolveSession('right')}
                      disabled={resolvingSession}
                      className={`${styles.button} ${styles.primary}`}
                      style={{ backgroundColor: '#3b82f6', marginBottom: '0.5rem' }}
                    >
                      {resolvingSession ? 'Processing...' : 'Right Wins 👉'}
                    </button>
                  </>
                )}
                
                <button
                  onClick={togglePrizePool}
                  className={`${styles.button} ${styles.secondary}`}
                  style={{ marginBottom: '0.5rem' }}
                >
                  {bettingSession.showPrizePool ? '🙈 Hide' : '👁️ Show'} Prize Pool
                </button>
                
                <button
                  onClick={fetchAllBets}
                  className={`${styles.button} ${styles.secondary}`}
                  style={{ marginBottom: '0.5rem' }}
                >
                  📊 {showAllBets ? 'Hide' : 'Show'} All Bets
                </button>
                
                <button
                  onClick={fetchBettingHistory}
                  className={`${styles.button} ${styles.secondary}`}
                  style={{ marginBottom: '0.5rem' }}
                >
                  📜 {showHistory ? 'Hide' : 'Show'} History
                </button>
                
                {/* Show create new session button if resolved */}
                {bettingSession.status === 'resolved' && (
                  <button
                    onClick={() => {
                      setNewQuestion('');
                      setBettingSession(null);
                    }}
                    className={`${styles.button} ${styles.primary}`}
                    style={{ marginBottom: '0.5rem' }}
                  >
                    ➕ Create New Session
                  </button>
                )}
                
                {/* Delete Session Button - Always show */}
                <button
                  onClick={() => deleteSession(bettingSession.id)}
                  className={`${styles.button}`}
                  style={{ backgroundColor: '#dc2626', color: 'white', marginBottom: '0.5rem' }}
                >
                  🗑️ Delete Session
                </button>
              </div>

              {/* All Bets Display */}
              {showAllBets && allBets.length > 0 && (
                <div style={{ marginTop: '1.5rem', maxHeight: '400px', overflowY: 'auto' }}>
                  <h4 style={{ marginBottom: '1rem' }}>All Bets ({allBets.length} users)</h4>
                  <table style={{ width: '100%', fontSize: '0.875rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid #e5e5e5' }}>
                        <th style={{ padding: '0.5rem', textAlign: 'left' }}>User ID</th>
                        <th style={{ padding: '0.5rem', textAlign: 'right' }}>Left</th>
                        <th style={{ padding: '0.5rem', textAlign: 'right' }}>Right</th>
                        <th style={{ padding: '0.5rem', textAlign: 'right' }}>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allBets.map((bet) => (
                        <tr key={bet.userId} style={{ borderBottom: '1px solid #f3f4f6' }}>
                          <td style={{ padding: '0.5rem' }}>{bet.userId}</td>
                          <td style={{ padding: '0.5rem', textAlign: 'right' }}>
                            {formatAmount(bet.leftAmount)}
                          </td>
                          <td style={{ padding: '0.5rem', textAlign: 'right' }}>
                            {formatAmount(bet.rightAmount)}
                          </td>
                          <td style={{ padding: '0.5rem', textAlign: 'right', fontWeight: '600' }}>
                            {formatAmount(bet.leftAmount + bet.rightAmount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Betting History */}
              {showHistory && bettingHistory.length > 0 && (
                <div style={{ marginTop: '1.5rem' }}>
                  <h4 style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Betting History ({bettingHistory.length} sessions)</span>
                    <button
                      onClick={() => setShowHistory(false)}
                      style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', background: '#e5e5e5', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                    >
                      Close
                    </button>
                  </h4>
                  <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                    {bettingHistory.map((session) => (
                      <div
                        key={session.id}
                        style={{
                          background: '#f9fafb',
                          border: '1px solid #e5e5e5',
                          borderRadius: '8px',
                          padding: '1rem',
                          marginBottom: '0.75rem'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
                          <div>
                            <h5 style={{ margin: 0, fontSize: '1rem', fontWeight: '600' }}>{session.question}</h5>
                            <small style={{ color: '#6b7280' }}>
                              Created: {formatTime(session.createdAt)} | Status: {session.status}
                            </small>
                          </div>
                          {session.status === 'resolved' && (
                            <button
                              onClick={() => deleteSession(session.id)}
                              disabled={deletingSession}
                              className={`${styles.button} ${styles.secondary}`}
                              style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', background: '#ef4444', color: 'white' }}
                            >
                              {deletingSession ? '...' : '🗑️ Delete'}
                            </button>
                          )}
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', fontSize: '0.875rem' }}>
                          <div>
                            <span style={{ color: '#6b7280' }}>Total Pool: </span>
                            <strong>{formatAmount(session.totalPool)}</strong>
                          </div>
                          <div>
                            <span style={{ color: '#6b7280' }}>Left: </span>
                            <strong style={{ color: session.winner === 'left' ? '#10b981' : '#6b7280' }}>
                              {formatAmount(session.leftPool)}
                            </strong>
                          </div>
                          <div>
                            <span style={{ color: '#6b7280' }}>Right: </span>
                            <strong style={{ color: session.winner === 'right' ? '#10b981' : '#6b7280' }}>
                              {formatAmount(session.rightPool)}
                            </strong>
                          </div>
                        </div>
                        {session.winner && (
                          <div style={{ marginTop: '0.5rem', fontSize: '0.875rem' }}>
                            <span style={{ color: '#6b7280' }}>Winner: </span>
                            <strong style={{ color: '#10b981' }}>{session.winner.toUpperCase()}</strong>
                            <span style={{ color: '#6b7280' }}> | Service Fee: </span>
                            <strong>{formatAmount(session.totalPool * 0.069)}</strong>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
          </>
        )}

        {/* Users Tab Content */}
        {activeTab === 'users' && (
          <>
        <div className={styles.section}>
              <h2 className={styles.sectionTitle}>👥 User Management</h2>
              
              {/* Search Box */}
              <input
                type="text"
                placeholder="Search by name or FID..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className={styles.searchBox}
              />
          
          {/* Load Users Button */}
          {!showUsers && (
            <button
              onClick={() => {
                fetchUsers();
                setShowUsers(true);
              }}
              disabled={loadingUsers}
              className={`${styles.button} ${styles.primary}`}
              style={{ marginTop: '1rem' }}
            >
              {loadingUsers ? 'Loading...' : 'Load Users'}
            </button>
          )}
          
          {/* Users Grid */}
          {showUsers && (
            <>
              <div className={styles.stats} style={{ marginTop: '1rem' }}>
                <div className={styles.statCard}>
                  <div className={styles.statLabel}>Total Users</div>
                  <div className={styles.statValue}>{users.length}</div>
                </div>
                <div className={styles.statCard}>
                  <div className={styles.statLabel}>Total Balance</div>
                  <div className={styles.statValue}>
                    ${users.reduce((sum, user) => sum + user.balance, 0).toFixed(2)}
                  </div>
                </div>
              </div>

              <div className={styles.usersGrid}>
                {users
                  .filter(user => {
                    const search = userSearch.toLowerCase();
                    return user.displayName.toLowerCase().includes(search) ||
                           user.username.toLowerCase().includes(search) ||
                           user.fid.includes(search);
                  })
                  .map((user) => (
                    <div key={user.fid} className={styles.userCard}>
                      {user.profileImage && (
                        <Image 
                          src={user.profileImage} 
                          alt={user.displayName}
                          width={60}
                          height={60}
                          className={styles.userAvatar}
                        />
                      )}
                      <div className={styles.userInfo}>
                        <h3 className={styles.userName}>
                          {user.username ? `${user.username}.base.eth` : user.displayName}
                        </h3>
                        <p className={styles.userFid}>FID: {user.fid}</p>
                        <p className={styles.userBalance}>{formatAmount(user.balance)}</p>
                        <div className={styles.userStats}>
                          <span>Joined: {formatTime(user.createdAt)}</span>
                        </div>
                        <Link 
                          href={`/profile/${user.fid}`} 
                          className={`${styles.button} ${styles.secondary}`} 
                          style={{ marginTop: '0.5rem', display: 'inline-block', padding: '0.5rem 1rem' }}
                        >
                          View Profile →
                        </Link>
                      </div>
                    </div>
                  ))}
              </div>
              
              {users.length === 0 && (
                <div className={styles.emptyState}>
                  <p>No users found</p>
                </div>
              )}
              
              {users.filter(u => {
                const search = userSearch.toLowerCase();
                return u.displayName.toLowerCase().includes(search) ||
                       u.username.toLowerCase().includes(search) ||
                       u.fid.includes(search);
              }).length === 0 && users.length > 0 && (
                <div className={styles.emptyState}>
                  <p>No users match your search</p>
                </div>
              )}
            </>
          )}
        </div>
          </>
        )}

        {/* Treasury Monitor - Show in betting tab */}
        {activeTab === 'betting' && (
          <>
            <TreasuryMonitor />
            <div className={styles.section} style={{ marginTop: '2rem' }}>
          <h2 className={styles.sectionTitle}>Betting Instructions</h2>
          <ol style={{ fontSize: '0.875rem', color: '#6b7280', lineHeight: '1.8' }}>
            <li>Create a betting session with a clear question (e.g., &quot;Will the next person wear glasses?&quot;)</li>
            <li>Users can bet multiple times on either option (left or right)</li>
            <li><strong>Limits:</strong> Max $10 per user per round, max $100 per button total</li>
            <li>Monitor the total pool and bet distribution in real-time</li>
            <li>When ready, freeze betting to prevent new bets</li>
            <li>After the event occurs, declare the winner</li>
            <li><strong>Payouts:</strong> Winners get 2x their bet minus 6.9% service fee</li>
            <li>Losers get nothing - their bets go to the house</li>
          </ol>
        </div>
          </>
        )}
      </main>
    </div>
  );
}
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

const COLORS = [
  { name: 'RED', value: '#FF0000', emoji: '🔴' },
  { name: 'BLUE', value: '#0000FF', emoji: '🔵' },
  { name: 'GREEN', value: '#00FF00', emoji: '🟢' },
  { name: 'YELLOW', value: '#FFFF00', emoji: '🟡' },
  { name: 'ORANGE', value: '#FF8800', emoji: '🟠' },
  { name: 'PURPLE', value: '#8800FF', emoji: '🟣' },
  { name: 'WHITE', value: '#FFFFFF', emoji: '⚪' },
  { name: 'BLACK', value: '#000000', emoji: '⚫' },
];

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<'stream' | 'betting' | 'users'>('stream');
  const [streamUrl, setStreamUrl] = useState('https://www.youtube.com/live/aeFydtug4-w?si=oI3I894G2-Iw6OSj');
  const [isStreamLive, setIsStreamLive] = useState(true);
  const [question, setQuestion] = useState('WHO WILL WIN?');
  const [numOptions, setNumOptions] = useState(2);
  const [options, setOptions] = useState([
    { name: 'TRUMP', color: '#FF0000', multiplier: 2 },
    { name: 'KAMALA', color: '#0000FF', multiplier: 2 }
  ]);
  const [isBettingOpen, setIsBettingOpen] = useState(true);
  const [users, setUsers] = useState<Array<{
    uid: string;
    username?: string;
    displayName?: string;
    profileImage?: string;
    fid?: string;
    walletAddress?: string;
    source?: string;
    balance?: number;
    totalBets?: number;
    totalWon?: number;
    isBanned?: boolean;
  }>>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Update options array when number changes
  useEffect(() => {
    if (options.length < numOptions) {
      // Add more options
      const newOptions = [...options];
      while (newOptions.length < numOptions) {
        newOptions.push({ 
          name: `OPTION ${newOptions.length + 1}`, 
          color: COLORS[newOptions.length % COLORS.length].value,
          multiplier: numOptions // Default multiplier based on number of players
        });
      }
      setOptions(newOptions);
    } else if (options.length > numOptions) {
      // Remove options
      setOptions(options.slice(0, numOptions));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [numOptions]);

  // Load current config
  useEffect(() => {
    loadConfig();
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const res = await fetch('/api/v2/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const toggleUserBan = async (uid: string, currentBanStatus: boolean) => {
    try {
      const res = await fetch('/api/v2/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid, isBanned: !currentBanStatus })
      });
      
      if (res.ok) {
        // Update local state
        setUsers(users.map(u => 
          u.uid === uid ? { ...u, isBanned: !currentBanStatus } : u
        ));
        setMessage(`User ${!currentBanStatus ? 'banned' : 'unbanned'} successfully`);
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (error) {
      console.error('Error toggling ban:', error);
      setMessage('Failed to update ban status');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const loadConfig = async () => {
    try {
      const [streamRes, bettingRes] = await Promise.all([
        fetch('/api/v2/stream'),
        fetch('/api/v2/betting')
      ]);
      
      if (streamRes.ok) {
        const streamData = await streamRes.json();
        if (streamData.url) setStreamUrl(streamData.url);
        setIsStreamLive(streamData.isLive ?? true);
      }

      if (bettingRes.ok) {
        const bettingData = await bettingRes.json();
        if (bettingData.question) setQuestion(bettingData.question);
        if (bettingData.options) {
          setNumOptions(bettingData.options.length);
          setOptions(bettingData.options);
        }
        setIsBettingOpen(bettingData.isBettingOpen ?? true);
      }
    } catch (error) {
      console.error('Error loading config:', error);
    }
  };

  const updateStreamConfig = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v2/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: streamUrl, isLive: isStreamLive })
      });

      if (res.ok) {
        setMessage('✅ Stream updated!');
        setTimeout(() => setMessage(''), 3000);
      }
    } catch {
      setMessage('❌ Failed to update stream');
    }
    setLoading(false);
  };

  const updateBettingRound = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v2/betting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, options, isBettingOpen })
      });

      if (res.ok) {
        setMessage('✅ Betting round updated!');
        setTimeout(() => setMessage(''), 3000);
      }
    } catch {
      setMessage('❌ Failed to update betting round');
    }
    setLoading(false);
  };

  const toggleBetting = async () => {
    const newState = !isBettingOpen;
    setIsBettingOpen(newState);
    setLoading(true);
    
    try {
      const res = await fetch('/api/v2/betting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, options, isBettingOpen: newState })
      });
      
      if (res.ok) {
        setMessage(newState ? '✅ Betting opened!' : '🔒 Betting closed!');
        setTimeout(() => setMessage(''), 3000);
      }
    } catch {
      setMessage('❌ Failed to toggle betting');
    }
    setLoading(false);
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#000',
      color: '#00FF00',
      fontFamily: 'monospace',
      padding: '24px'
    }}>
      {/* Header */}
      <div style={{
        border: '3px solid #00FF00',
        padding: '16px',
        marginBottom: '24px',
        textAlign: 'center'
      }}>
        <h1 style={{ fontSize: '24px', margin: 0 }}>CLICK N PRAY ADMIN PANEL</h1>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: '12px',
        marginBottom: '24px'
      }}>
        <button
          onClick={() => setActiveTab('stream')}
          style={{
            flex: 1,
            padding: '12px',
            backgroundColor: activeTab === 'stream' ? '#00FF00' : '#000',
            color: activeTab === 'stream' ? '#000' : '#00FF00',
            border: '3px solid #00FF00',
            fontFamily: 'monospace',
            fontSize: '14px',
            fontWeight: 'bold',
            cursor: 'pointer',
            textTransform: 'uppercase'
          }}
        >
          STREAM
        </button>

        <button
          onClick={() => setActiveTab('betting')}
          style={{
            flex: 1,
            padding: '12px',
            backgroundColor: activeTab === 'betting' ? '#00FF00' : '#000',
            color: activeTab === 'betting' ? '#000' : '#00FF00',
            border: '3px solid #00FF00',
            fontFamily: 'monospace',
            fontSize: '14px',
            fontWeight: 'bold',
            cursor: 'pointer',
            textTransform: 'uppercase'
          }}
        >
          BETTING
        </button>

        <button
          onClick={() => {
            setActiveTab('users');
            loadUsers();
          }}
          style={{
            flex: 1,
            padding: '12px',
            backgroundColor: activeTab === 'users' ? '#00FF00' : '#000',
            color: activeTab === 'users' ? '#000' : '#00FF00',
            border: '3px solid #00FF00',
            fontFamily: 'monospace',
            fontSize: '14px',
            fontWeight: 'bold',
            cursor: 'pointer',
            textTransform: 'uppercase'
          }}
        >
          USERS
        </button>
      </div>

      {/* Message */}
      {message && (
        <div style={{
          border: '2px solid #00FF00',
          padding: '12px',
          marginBottom: '24px',
          textAlign: 'center',
          backgroundColor: '#001100'
        }}>
          {message}
        </div>
      )}

      {/* Stream Control Tab */}
      {activeTab === 'stream' && (
      <div style={{
        border: '3px solid #00FF00',
        padding: '20px',
        marginBottom: '24px'
      }}>
        <h2 style={{ marginTop: 0, borderBottom: '2px solid #00FF00', paddingBottom: '8px' }}>
          ─ STREAM CONTROL ─
        </h2>

        <label style={{ display: 'block', marginBottom: '8px' }}>Live Stream URL:</label>
        <input
          type="text"
          value={streamUrl}
          onChange={(e) => setStreamUrl(e.target.value)}
          style={{
            width: '100%',
            padding: '12px',
            backgroundColor: '#000',
            border: '2px solid #00FF00',
            color: '#00FF00',
            fontFamily: 'monospace',
            fontSize: '14px',
            marginBottom: '16px',
            boxSizing: 'border-box'
          }}
        />

        <div style={{ marginBottom: '16px' }}>
          <label style={{ marginRight: '16px' }}>Stream Status:</label>
          <button
            onClick={() => setIsStreamLive(true)}
            style={{
              padding: '8px 16px',
              backgroundColor: isStreamLive ? '#00FF00' : '#000',
              color: isStreamLive ? '#000' : '#00FF00',
              border: '2px solid #00FF00',
              fontFamily: 'monospace',
              cursor: 'pointer',
              marginRight: '8px'
            }}
          >
            {isStreamLive ? '⬤' : '○'} ON
          </button>
          <button
            onClick={() => setIsStreamLive(false)}
            style={{
              padding: '8px 16px',
              backgroundColor: !isStreamLive ? '#00FF00' : '#000',
              color: !isStreamLive ? '#000' : '#00FF00',
              border: '2px solid #00FF00',
              fontFamily: 'monospace',
              cursor: 'pointer'
            }}
          >
            {!isStreamLive ? '⬤' : '○'} OFF
          </button>
        </div>

        <button
          onClick={updateStreamConfig}
          disabled={loading}
          style={{
            padding: '12px 24px',
            backgroundColor: '#00FF00',
            color: '#000',
            border: '3px solid #00FF00',
            fontFamily: 'monospace',
            fontSize: '14px',
            cursor: 'pointer',
            fontWeight: 'bold',
            marginRight: '12px'
          }}
        >
          UPDATE STREAM
        </button>

        <Link href="/v2" target="_blank">
          <button style={{
            padding: '12px 24px',
            backgroundColor: '#000',
            color: '#00FF00',
            border: '3px solid #00FF00',
            fontFamily: 'monospace',
            fontSize: '14px',
            cursor: 'pointer'
          }}>
            VIEW LIVE STREAM →
          </button>
        </Link>
      </div>
      )}

      {/* Betting Round Setup Tab */}
      {activeTab === 'betting' && (
      <div style={{
        border: '3px solid #00FF00',
        padding: '20px'
      }}>
        <h2 style={{ marginTop: 0, borderBottom: '2px solid #00FF00', paddingBottom: '8px' }}>
          ─ BETTING ROUND SETUP ─
        </h2>

        <label style={{ display: 'block', marginBottom: '8px' }}>Question:</label>
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value.toUpperCase())}
          style={{
            width: '100%',
            padding: '12px',
            backgroundColor: '#000',
            border: '2px solid #00FF00',
            color: '#00FF00',
            fontFamily: 'monospace',
            fontSize: '16px',
            marginBottom: '16px',
            boxSizing: 'border-box',
            textTransform: 'uppercase'
          }}
        />

        <label style={{ display: 'block', marginBottom: '8px' }}>Number of Options:</label>
        <select
          value={numOptions}
          onChange={(e) => setNumOptions(Number(e.target.value))}
          style={{
            padding: '12px',
            backgroundColor: '#000',
            border: '2px solid #00FF00',
            color: '#00FF00',
            fontFamily: 'monospace',
            fontSize: '14px',
            marginBottom: '24px',
            cursor: 'pointer'
          }}
        >
          {[2, 3, 4, 5, 6, 7, 8].map(num => (
            <option key={num} value={num}>{num}</option>
          ))}
        </select>

        {/* Options */}
        {options.map((option, index) => (
          <div key={index} style={{
            border: '2px solid #00FF00',
            padding: '16px',
            marginBottom: '16px',
            backgroundColor: '#001100'
          }}>
            <h3 style={{ margin: '0 0 12px 0' }}>═ OPTION {index + 1} ═</h3>
            
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px' }}>Name:</label>
            <input
              type="text"
              value={option.name}
              onChange={(e) => {
                const newOptions = [...options];
                newOptions[index].name = e.target.value.toUpperCase();
                setOptions(newOptions);
              }}
              style={{
                width: '100%',
                padding: '10px',
                backgroundColor: '#000',
                border: '2px solid #00FF00',
                color: '#00FF00',
                fontFamily: 'monospace',
                marginBottom: '12px',
                boxSizing: 'border-box',
                textTransform: 'uppercase'
              }}
            />

            <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px' }}>Color:</label>
            <select
              value={option.color}
              onChange={(e) => {
                const newOptions = [...options];
                newOptions[index].color = e.target.value;
                setOptions(newOptions);
              }}
              style={{
                width: '100%',
                padding: '10px',
                backgroundColor: '#000',
                border: '2px solid #00FF00',
                color: '#00FF00',
                fontFamily: 'monospace',
                cursor: 'pointer',
                boxSizing: 'border-box'
              }}
            >
              {COLORS.map(color => (
                <option key={color.value} value={color.value}>
                  {color.emoji} {color.name}
                </option>
              ))}
            </select>

            <label style={{ display: 'block', marginBottom: '4px', marginTop: '12px', fontSize: '12px' }}>Multiplier (e.g., 2 = 2x):</label>
            <input
              type="number"
              value={option.multiplier || numOptions}
              onChange={(e) => {
                const newOptions = [...options];
                newOptions[index].multiplier = parseFloat(e.target.value) || numOptions;
                setOptions(newOptions);
              }}
              min="1"
              step="0.1"
              style={{
                width: '100%',
                padding: '10px',
                backgroundColor: '#000',
                border: '2px solid #00FF00',
                color: '#00FF00',
                fontFamily: 'monospace',
                boxSizing: 'border-box'
              }}
            />

            {/* Preview */}
            <div style={{
              marginTop: '12px',
              padding: '12px',
              backgroundColor: option.color,
              color: option.color === '#FFFFFF' || option.color === '#FFFF00' ? '#000' : '#fff',
              border: '2px solid #00FF00',
              textAlign: 'center',
              fontWeight: 'bold'
            }}>
              <div>{option.name || `OPTION ${index + 1}`}</div>
              <div style={{ fontSize: '11px', marginTop: '4px' }}>Wins {option.multiplier || numOptions}x</div>
            </div>
          </div>
        ))}

        <button
          onClick={updateBettingRound}
          disabled={loading}
          style={{
            width: '100%',
            padding: '16px',
            backgroundColor: '#00FF00',
            color: '#000',
            border: '3px solid #00FF00',
            fontFamily: 'monospace',
            fontSize: '16px',
            cursor: 'pointer',
            fontWeight: 'bold',
            marginTop: '8px'
          }}
        >
          {loading ? 'UPDATING...' : 'UPDATE BETTING ROUND'}
        </button>

        <button
          onClick={toggleBetting}
          disabled={loading}
          style={{
            width: '100%',
            padding: '16px',
            backgroundColor: isBettingOpen ? '#FF0000' : '#00FF00',
            color: isBettingOpen ? '#FFF' : '#000',
            border: `3px solid ${isBettingOpen ? '#FF0000' : '#00FF00'}`,
            fontFamily: 'monospace',
            fontSize: '16px',
            cursor: 'pointer',
            fontWeight: 'bold',
            marginTop: '8px'
          }}
        >
          {loading ? 'UPDATING...' : isBettingOpen ? '🔒 STOP BETTING' : '🎲 START BETTING'}
        </button>
      </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div style={{
          border: '3px solid #00FF00',
          padding: '20px'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px',
            borderBottom: '2px solid #00FF00',
            paddingBottom: '8px'
          }}>
            <h2 style={{ margin: 0 }}>─ USERS ({users.length}) ─</h2>
            <button
              onClick={loadUsers}
              style={{
                padding: '8px 16px',
                backgroundColor: '#000',
                border: '2px solid #00FF00',
                color: '#00FF00',
                fontFamily: 'monospace',
                fontSize: '12px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              🔄 REFRESH
            </button>
          </div>

          {/* Users Table */}
          <div style={{
            maxHeight: '600px',
            overflowY: 'auto',
            border: '2px solid #00FF00',
            borderRadius: '4px'
          }}>
            {users.length === 0 ? (
              <div style={{
                padding: '32px',
                textAlign: 'center',
                color: '#006600'
              }}>
                NO USERS YET
              </div>
            ) : (
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontFamily: 'monospace',
                fontSize: '11px'
              }}>
                <thead>
                  <tr style={{
                    backgroundColor: '#001100',
                    borderBottom: '2px solid #00FF00'
                  }}>
                    <th style={{ padding: '10px', textAlign: 'left' }}>PFP</th>
                    <th style={{ padding: '10px', textAlign: 'left' }}>USERNAME</th>
                    <th style={{ padding: '10px', textAlign: 'left' }}>UID</th>
                    <th style={{ padding: '10px', textAlign: 'left' }}>SOURCE</th>
                    <th style={{ padding: '10px', textAlign: 'right' }}>BALANCE</th>
                    <th style={{ padding: '10px', textAlign: 'right' }}>BETS</th>
                    <th style={{ padding: '10px', textAlign: 'right' }}>WON</th>
                    <th style={{ padding: '10px', textAlign: 'center' }}>ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u, idx) => (
                    <tr
                      key={u.uid}
                      style={{
                        borderBottom: '1px solid #003300',
                        backgroundColor: idx % 2 === 0 ? '#000' : '#000a00'
                      }}
                    >
                      <td style={{ padding: '10px' }}>
                        <img
                          src={u.profileImage || 'https://api.dicebear.com/7.x/identicon/png?seed=default'}
                          alt="pfp"
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '4px',
                            border: '2px solid #00FF00',
                            objectFit: 'cover'
                          }}
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://api.dicebear.com/7.x/identicon/png?seed=default';
                          }}
                        />
                      </td>
                      <td style={{ padding: '10px' }}>
                        <div style={{ color: '#00FF00', fontWeight: 'bold' }}>
                          {u.displayName || u.username || 'Anonymous'}
                        </div>
                        {u.fid && (
                          <div style={{ color: '#006600', fontSize: '9px' }}>
                            FID: {u.fid}
                          </div>
                        )}
                        {u.walletAddress && (
                          <div style={{ color: '#006600', fontSize: '9px' }}>
                            {u.walletAddress.slice(0, 6)}...{u.walletAddress.slice(-4)}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '10px', fontSize: '9px', color: '#006600' }}>
                        {u.uid.slice(0, 20)}...
                      </td>
                      <td style={{ padding: '10px' }}>
                        <span style={{
                          padding: '4px 8px',
                          backgroundColor: u.source === 'base_app' ? '#001100' : '#110000',
                          border: `2px solid ${u.source === 'base_app' ? '#00FF00' : '#FF00FF'}`,
                          borderRadius: '4px',
                          fontSize: '9px',
                          color: u.source === 'base_app' ? '#00FF00' : '#FF00FF',
                          fontWeight: 'bold'
                        }}>
                          {u.source === 'base_app' ? 'BASE APP' : 'BROWSER'}
                        </span>
                      </td>
                      <td style={{ padding: '10px', textAlign: 'right', color: '#00FF00', fontWeight: 'bold' }}>
                        ${(u.balance || 0).toFixed(2)}
                      </td>
                      <td style={{ padding: '10px', textAlign: 'right', color: '#006600' }}>
                        {u.totalBets || 0}
                      </td>
                      <td style={{ padding: '10px', textAlign: 'right', color: '#006600' }}>
                        ${(u.totalWon || 0).toFixed(2)}
                      </td>
                      <td style={{ padding: '10px', textAlign: 'center' }}>
                        <button
                          onClick={() => toggleUserBan(u.uid, u.isBanned || false)}
                          style={{
                            padding: '4px 12px',
                            backgroundColor: u.isBanned ? '#FF0000' : '#000',
                            color: u.isBanned ? '#FFF' : '#00FF00',
                            border: `2px solid ${u.isBanned ? '#FF0000' : '#00FF00'}`,
                            fontFamily: 'monospace',
                            fontSize: '10px',
                            cursor: 'pointer',
                            fontWeight: 'bold'
                          }}
                        >
                          {u.isBanned ? '🚫 UNBAN' : '✓ BAN'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* User Stats Summary */}
          {users.length > 0 && (
            <div style={{
              marginTop: '16px',
              padding: '16px',
              backgroundColor: '#001100',
              border: '2px solid #00FF00',
              borderRadius: '4px',
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '16px',
              textAlign: 'center'
            }}>
              <div>
                <div style={{ fontSize: '10px', color: '#006600', marginBottom: '4px' }}>TOTAL USERS</div>
                <div style={{ fontSize: '24px', color: '#00FF00', fontWeight: 'bold' }}>{users.length}</div>
              </div>
              <div>
                <div style={{ fontSize: '10px', color: '#006600', marginBottom: '4px' }}>BASE APP</div>
                <div style={{ fontSize: '24px', color: '#00FF00', fontWeight: 'bold' }}>
                  {users.filter((u) => u.source === 'base_app').length}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '10px', color: '#006600', marginBottom: '4px' }}>BROWSER</div>
                <div style={{ fontSize: '24px', color: '#00FF00', fontWeight: 'bold' }}>
                  {users.filter((u) => u.source === 'browser_wallet').length}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}


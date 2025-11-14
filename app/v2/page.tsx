'use client';

import { useState, useEffect, useRef } from 'react';
import { useWalletConnect } from './hooks/useWalletConnect';

interface BettingOption {
  name: string;
  color: string;
  multiplier: number;
}

interface BettingRound {
  question: string;
  options: BettingOption[];
  isBettingOpen: boolean;
}

interface Comment {
  id: number;
  username: string;
  message: string;
  profileImage?: string;
  timestamp: number;
}

export default function V2Page() {
  const { user, connect, connectWithWallet, disconnect, isLoading, isConnected } = useWalletConnect();
  const [streamUrl, setStreamUrl] = useState('https://www.youtube.com/live/aeFydtug4-w?si=oI3I894G2-Iw6OSj');
  const [isMuted, setIsMuted] = useState(true);
  const [isStreamLive, setIsStreamLive] = useState(true);
  const [bettingRound, setBettingRound] = useState<BettingRound>({
    question: 'WHO WILL WIN?',
    options: [],
    isBettingOpen: true
  });
  const [betStats, setBetStats] = useState<{ totalBets: number[], betCount: number[] }>({
    totalBets: [],
    betCount: []
  });
  const [isDashboardOpen, setIsDashboardOpen] = useState(true);
  const [isBalanceModalOpen, setIsBalanceModalOpen] = useState(false);
  const [showWalletSelect, setShowWalletSelect] = useState(false);
  const [showDisconnect, setShowDisconnect] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [betAmount, setBetAmount] = useState('');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoadingChat, setIsLoadingChat] = useState(false);
  const [userBalance, setUserBalance] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const commentsRef = useRef<HTMLDivElement>(null);

  const handleConnect = async () => {
    const result = await connect();
    if (result && 'needWalletSelection' in result && result.needWalletSelection) {
      setShowWalletSelect(true);
    }
  };

  const handleWalletSelect = async (walletType: string) => {
    await connectWithWallet(walletType);
    setShowWalletSelect(false);
  };

  // Fetch user balance when connected
  useEffect(() => {
    if (user?.uid) {
      fetchUserBalance();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid]);

  const fetchUserBalance = async () => {
    if (!user?.uid) return;
    try {
      const res = await fetch(`/api/v2/users/${user.uid}/balance`);
      if (res.ok) {
        const data = await res.json();
        setUserBalance(data.balance || 0);
      }
    } catch (error) {
      console.error('Error fetching balance:', error);
    }
  };

  // Get video ID from URL
  const getVideoId = (url: string) => {
    try {
      const urlObj = new URL(url);
      if (urlObj.pathname.includes('/live/')) {
        return urlObj.pathname.split('/live/')[1];
      }
      return urlObj.searchParams.get('v') || '';
    } catch {
      return '';
    }
  };

  const videoId = getVideoId(streamUrl);

  // Get embed URL
  const getEmbedUrl = () => {
    if (!videoId) return '';
    
    // Show controls so users can click YouTube's play button
    return `https://www.youtube.com/embed/${videoId}?` +
      'autoplay=0&' + // No autoplay, user must click
      'mute=0&' + // Start unmuted
      'controls=1&' + // Always show controls
      'modestbranding=1&' +
      'rel=0&' +
      'showinfo=0&' +
      'playsinline=1&' +
      'enablejsapi=1&' +
      'origin=' + (typeof window !== 'undefined' ? encodeURIComponent(window.location.origin) : '');
  };

  // Load stream config and betting round
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const [streamRes, bettingRes, betsRes, chatRes] = await Promise.all([
          fetch('/api/v2/stream'),
          fetch('/api/v2/betting'),
          fetch('/api/v2/betting/bets'),
          fetch('/api/v2/chat')
        ]);
        
        if (streamRes.ok) {
          const streamData = await streamRes.json();
          if (streamData.url) setStreamUrl(streamData.url);
          setIsStreamLive(streamData.isLive ?? true);
        }

        if (bettingRes.ok) {
          const bettingData = await bettingRes.json();
          setBettingRound(bettingData);
        }

        if (betsRes.ok) {
          const statsData = await betsRes.json();
          setBetStats(statsData);
        }

        if (chatRes.ok) {
          const chatData = await chatRes.json();
          if (chatData.messages) {
            setComments(chatData.messages.map((msg: { 
              id: string; 
              username: string; 
              displayName?: string; 
              profileImage?: string; 
              message: string; 
              timestamp: number 
            }) => ({
              id: msg.timestamp, // Use timestamp as numeric id
              username: msg.displayName || msg.username || 'Anonymous',
              profileImage: msg.profileImage,
              message: msg.message,
              timestamp: msg.timestamp
            })));
          }
        }
      } catch (error) {
        console.error('Error loading config:', error);
      }
    };

    loadConfig();
    // Poll for updates - more frequently for chat
    const interval = setInterval(loadConfig, 2000);
    return () => clearInterval(interval);
  }, []);

  const toggleMute = () => {
    setIsMuted(!isMuted);
    // Use postMessage to control mute without reloading
    if (iframeRef.current && iframeRef.current.contentWindow) {
      const message = {
        event: 'command',
        func: isMuted ? 'unMute' : 'mute',
        args: []
      };
      iframeRef.current.contentWindow.postMessage(JSON.stringify(message), 'https://www.youtube.com');
    }
  };



  // Get button height based on number of options (to keep footer same size)
  const getButtonHeight = (count: number) => {
    if (count === 2) return '60px';
    if (count === 3) return '60px';
    if (count === 4) return '50px';
    if (count === 5 || count === 6) return '50px';
    if (count === 7 || count === 8) return '45px';
    return '60px';
  };

  // Get font size based on number of options
  const getFontSize = (count: number) => {
    if (count <= 3) return '16px';
    if (count <= 6) return '14px';
    return '12px';
  };


  const placeBet = async () => {
    if (!user || selectedOption === null || !betAmount) return;

    const amount = parseFloat(betAmount);
    if (isNaN(amount) || amount <= 0) {
      alert('Please enter a valid bet amount');
      return;
    }

    if (amount > userBalance) {
      alert('Insufficient balance');
      return;
    }

    try {
      const res = await fetch('/api/v2/betting/bets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.uid,
          optionIndex: selectedOption,
          amount
        })
      });

      const data = await res.json();
      
      if (res.ok) {
        // Update local balance
        setUserBalance(data.newBalance);
        // Clear selection
        setSelectedOption(null);
        setBetAmount('');
        // Reload bet stats
        const statsRes = await fetch('/api/v2/betting/bets');
        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setBetStats(statsData);
        }
      } else {
        if (res.status === 403) {
          alert('You are banned from betting');
        } else {
          alert(data.error || 'Failed to place bet');
        }
      }
    } catch (error) {
      console.error('Error placing bet:', error);
      alert('Failed to place bet');
    }
  };

  return (
    <div style={{ 
      position: 'fixed',
      top: 0,
      left: 0,
      height: '100vh',
      width: '100vw',
      backgroundColor: '#000',
      overflow: 'hidden',
      touchAction: 'none', // Prevent touch scrolling
      userSelect: 'none', // Prevent text selection
      WebkitUserSelect: 'none',
      WebkitTouchCallout: 'none',
      WebkitOverflowScrolling: 'touch'
    }}>
      {/* FULL SCREEN Stream */}
      <div style={{ 
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#000'
      }}>
        <div style={{
          width: '100%',
          height: '100%',
          maxWidth: 'min(100vw, calc(100vh * 9 / 16))',
          maxHeight: 'calc(100vw * 16 / 9)',
          position: 'relative',
          backgroundColor: '#000'
        }}>
          {/* YouTube iframe with controls always visible */}
          <iframe
            ref={iframeRef}
            src={getEmbedUrl()}
            style={{
              width: '100%',
              height: '100%',
              border: 'none'
            }}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      </div>

      {/* TOP OVERLAY - Click n Pray Branding */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        padding: '12px 16px',
        backgroundColor: '#000',
        borderBottom: '1px solid #222',
        zIndex: 20
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          {/* Left: Live indicator + Mute button stacked */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            alignItems: 'flex-start',
            minWidth: '120px'
          }}>
            {/* Live indicator */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              paddingLeft: '4px'
            }}>
              <span style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: isStreamLive ? '#ef4444' : '#666',
                animation: isStreamLive ? 'pulse 2s infinite' : 'none',
                boxShadow: isStreamLive ? '0 0 8px #ef4444' : 'none'
              }} />
              <span style={{
                fontSize: '10px',
                fontWeight: 'bold',
                fontFamily: 'monospace',
                color: isStreamLive ? '#ef4444' : '#666',
                letterSpacing: '1px'
              }}>
                {isStreamLive ? 'LIVE' : 'OFF'}
              </span>
            </div>

            {/* Mute button */}
            <button
              onClick={toggleMute}
              style={{
                width: '40px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'transparent',
                border: 'none',
                color: '#fff',
                cursor: 'pointer',
                fontSize: '20px',
                pointerEvents: 'auto',
                padding: 0
              }}
            >
              {isMuted ? '🔇' : '🔊'}
            </button>
          </div>
          
          {/* Center: Logo */}
          <img 
            src="/cliclogo2.png" 
            alt="Click N Pray" 
            style={{
              height: '96px',
              objectFit: 'contain'
            }}
          />

          {/* Right: User profile + Balance stacked */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            alignItems: 'flex-end',
            minWidth: '120px'
          }}>
            {isConnected ? (
              <>
                {/* Username - Clickable */}
                <button
                  onClick={() => setIsBalanceModalOpen(true)}
                  style={{
                    paddingRight: '4px',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    pointerEvents: 'auto'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.opacity = '0.7';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.opacity = '1';
                  }}
                >
                  <span style={{
                    fontSize: '10px',
                    fontWeight: 'bold',
                    fontFamily: 'monospace',
                    color: '#ccc',
                    maxWidth: '120px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    display: 'block',
                    textAlign: 'right'
                  }}>
                    {user?.username || 'Guest'}
                  </span>
                </button>

                {/* Balance button */}
                <button
                  onClick={() => setIsBalanceModalOpen(true)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '4px 8px',
                    backgroundColor: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    fontFamily: 'monospace',
                    fontSize: '10px',
                    fontWeight: 'bold',
                    color: '#666',
                    transition: 'all 0.2s',
                    pointerEvents: 'auto'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = '#999';
                    e.currentTarget.style.transform = 'scale(1.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = '#666';
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  <span>${userBalance.toFixed(2)}</span>
                  <span style={{ fontSize: '12px' }}>+</span>
                </button>
              </>
            ) : (
              /* Connect button when not connected */
              <button
                onClick={handleConnect}
                disabled={isLoading}
                style={{
                  padding: '6px 12px',
                  backgroundColor: '#8b5cf6',
                  border: 'none',
                  borderRadius: '6px',
                  color: '#fff',
                  fontFamily: 'monospace',
                  fontSize: '10px',
                  fontWeight: 'bold',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  pointerEvents: 'auto',
                  opacity: isLoading ? 0.5 : 1
                }}
              >
                {isLoading ? 'CONNECTING...' : 'CONNECT'}
              </button>
            )}
          </div>
        </div>
      </div>


      {/* BOTTOM OVERLAY - Betting Dashboard */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#000',
        borderTop: '1px solid #222',
        zIndex: 20,
        pointerEvents: 'auto'
      }}>
        {/* Betting Dashboard */}
        <div style={{ 
          padding: '16px',
          maxWidth: '600px',
          margin: '0 auto',
          width: '100%'
        }}>
          {/* Toggle header */}
          <button
            onClick={() => {
              const newState = !isDashboardOpen;
              setIsDashboardOpen(newState);
              // Close bet UI when dashboard collapses
              if (!newState) {
                setSelectedOption(null);
                setBetAmount('');
              }
            }}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: '#111',
              border: '2px solid #333',
              color: '#fff',
              fontFamily: 'monospace',
              fontSize: '14px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: isDashboardOpen ? '12px' : 0
            }}
          >
            <span>{isDashboardOpen ? '▼' : '▶'} {bettingRound.question}</span>
            <span style={{ fontSize: '11px', color: bettingRound.isBettingOpen ? '#00ff00' : '#ff0000' }}>
              {bettingRound.isBettingOpen ? 'OPEN' : 'CLOSED'}
            </span>
          </button>

          {/* Betting grid */}
          {isDashboardOpen && bettingRound.options.length > 0 && (
            <div 
              style={{
                display: 'grid',
                gridTemplateColumns: 
                  bettingRound.options.length === 2 ? 'repeat(2, 1fr)' :
                  bettingRound.options.length === 3 ? 'repeat(3, 1fr)' :
                  bettingRound.options.length === 4 ? 'repeat(2, 1fr)' :
                  bettingRound.options.length <= 6 ? 'repeat(3, 1fr)' :
                  'repeat(4, 1fr)',
                gap: '8px',
                width: '100%'
              }}
            >
              {bettingRound.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => {
                    if (bettingRound.isBettingOpen) {
                      // Toggle: if same option clicked, deselect it
                      setSelectedOption(selectedOption === index ? null : index);
                      setBetAmount('');
                    }
                  }}
                  disabled={!bettingRound.isBettingOpen}
                  style={{
                    height: bettingRound.isBettingOpen ? getButtonHeight(bettingRound.options.length) : '40px',
                    width: '100%',
                    backgroundColor: option.color,
                    color: option.color === '#FFFFFF' || option.color === '#FFFF00' ? '#000' : '#fff',
                    border: selectedOption === index ? '3px solid #8b5cf6' : '3px solid #fff',
                    fontFamily: 'monospace',
                    fontSize: bettingRound.isBettingOpen ? getFontSize(bettingRound.options.length) : '12px',
                    fontWeight: 'bold',
                    cursor: bettingRound.isBettingOpen ? 'pointer' : 'not-allowed',
                    opacity: bettingRound.isBettingOpen ? 1 : 0.7,
                    textAlign: 'center',
                    transition: 'transform 0.1s',
                    boxShadow: selectedOption === index ? '0 4px 0 rgba(139, 92, 246, 0.5)' : '0 4px 0 rgba(255,255,255,0.3)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '4px',
                    wordBreak: 'break-word',
                    lineHeight: '1.2'
                  }}
                  onMouseDown={(e) => {
                    if (bettingRound.isBettingOpen) {
                      e.currentTarget.style.transform = 'translateY(2px)';
                      e.currentTarget.style.boxShadow = selectedOption === index ? '0 2px 0 rgba(139, 92, 246, 0.5)' : '0 2px 0 rgba(255,255,255,0.3)';
                    }
                  }}
                  onMouseUp={(e) => {
                    if (bettingRound.isBettingOpen) {
                      e.currentTarget.style.transform = '';
                      e.currentTarget.style.boxShadow = selectedOption === index ? '0 4px 0 rgba(139, 92, 246, 0.5)' : '0 4px 0 rgba(255,255,255,0.3)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = '';
                    e.currentTarget.style.boxShadow = selectedOption === index ? '0 4px 0 rgba(139, 92, 246, 0.5)' : '0 4px 0 rgba(255,255,255,0.3)';
                  }}
                  onTouchStart={(e) => {
                    if (bettingRound.isBettingOpen) {
                      e.currentTarget.style.transform = 'translateY(2px)';
                      e.currentTarget.style.boxShadow = selectedOption === index ? '0 2px 0 rgba(139, 92, 246, 0.5)' : '0 2px 0 rgba(255,255,255,0.3)';
                    }
                  }}
                  onTouchEnd={(e) => {
                    if (bettingRound.isBettingOpen) {
                      e.currentTarget.style.transform = '';
                      e.currentTarget.style.boxShadow = selectedOption === index ? '0 4px 0 rgba(139, 92, 246, 0.5)' : '0 4px 0 rgba(255,255,255,0.3)';
                    }
                  }}
                >
                  <div style={{ fontSize: bettingRound.isBettingOpen ? 'inherit' : '10px', marginBottom: '2px' }}>{option.name}</div>
                  {betStats.totalBets[index] !== undefined && betStats.totalBets[index] > 0 && (
                    <div style={{ fontSize: '10px', opacity: 0.8 }}>
                      ${betStats.totalBets[index].toFixed(0)}
                    </div>
                  )}
                  {!bettingRound.isBettingOpen && option.multiplier && (
                    <div style={{ fontSize: '9px', opacity: 0.6 }}>
                      {option.multiplier}x
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Bet Amount UI - Shows when option selected and betting is open - COMPACT */}
          {isDashboardOpen && selectedOption !== null && bettingRound.options[selectedOption] && bettingRound.isBettingOpen && (
            <div style={{
              marginTop: '8px',
              padding: '8px',
              backgroundColor: '#111',
              border: '2px solid #8b5cf6',
              borderRadius: '6px',
              animation: 'slideDown 0.3s ease-out'
            }}>
              {/* Row 1: Presets + Input */}
              <div style={{
                display: 'flex',
                gap: '6px',
                marginBottom: '6px'
              }}>
                <button
                  onClick={() => setBetAmount((userBalance * 0.25).toFixed(2))}
                  style={{
                    padding: '8px',
                    backgroundColor: '#000',
                    border: '2px solid #8b5cf6',
                    borderRadius: '4px',
                    color: '#8b5cf6',
                    fontFamily: 'monospace',
                    fontSize: '10px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    flex: '0 0 auto',
                    minWidth: '45px'
                  }}
                >
                  25%
                </button>

                <button
                  onClick={() => setBetAmount((userBalance * 0.5).toFixed(2))}
                  style={{
                    padding: '8px',
                    backgroundColor: '#000',
                    border: '2px solid #8b5cf6',
                    borderRadius: '4px',
                    color: '#8b5cf6',
                    fontFamily: 'monospace',
                    fontSize: '10px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    flex: '0 0 auto',
                    minWidth: '45px'
                  }}
                >
                  50%
                </button>

                <button
                  onClick={() => setBetAmount(userBalance.toFixed(2))}
                  style={{
                    padding: '8px',
                    backgroundColor: '#000',
                    border: '2px solid #8b5cf6',
                    borderRadius: '4px',
                    color: '#8b5cf6',
                    fontFamily: 'monospace',
                    fontSize: '10px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    flex: '0 0 auto',
                    minWidth: '45px'
                  }}
                >
                  MAX
                </button>

                <input
                  type="number"
                  value={betAmount}
                  onChange={(e) => setBetAmount(e.target.value)}
                  placeholder="$"
                  style={{
                    flex: 1,
                    padding: '8px',
                    backgroundColor: '#000',
                    border: '2px solid #8b5cf6',
                    borderRadius: '4px',
                    color: '#8b5cf6',
                    fontFamily: 'monospace',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    textAlign: 'center',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Row 2: Submit button */}
              <button
                onClick={placeBet}
                disabled={!betAmount || parseFloat(betAmount) <= 0 || parseFloat(betAmount) > userBalance}
                style={{
                  width: '100%',
                  padding: '10px',
                  backgroundColor: betAmount && parseFloat(betAmount) > 0 ? '#8b5cf6' : '#333',
                  border: 'none',
                  borderRadius: '4px',
                  color: betAmount && parseFloat(betAmount) > 0 ? '#000' : '#666',
                  fontFamily: 'monospace',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  cursor: betAmount && parseFloat(betAmount) > 0 ? 'pointer' : 'not-allowed',
                  transition: 'all 0.2s',
                  textTransform: 'uppercase',
                  letterSpacing: '1px'
                }}
              >
                BET ${betAmount || '0.00'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Balance Modal */}
      {isBalanceModalOpen && (
        <div
          onClick={() => setIsBalanceModalOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.95)',
            backdropFilter: 'blur(8px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            animation: 'fadeIn 0.2s ease-out'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: '#000',
              border: '4px solid #8b5cf6',
              borderRadius: '8px',
              maxWidth: '400px',
              width: '100%',
              boxShadow: '0 0 20px rgba(139, 92, 246, 0.3)',
              animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
          >
            {/* Header */}
            <div style={{
              padding: '16px',
              borderBottom: '3px solid #8b5cf6',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h2 style={{
                margin: 0,
                fontFamily: 'monospace',
                fontSize: '18px',
                color: '#8b5cf6',
                fontWeight: 'bold',
                letterSpacing: '2px'
              }}>
                ═══ WALLET ═══
              </h2>
              <button
                onClick={() => setIsBalanceModalOpen(false)}
                style={{
                  background: 'transparent',
                  border: '2px solid #8b5cf6',
                  color: '#8b5cf6',
                  width: '32px',
                  height: '32px',
                  cursor: 'pointer',
                  fontFamily: 'monospace',
                  fontSize: '18px',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#8b5cf6';
                  e.currentTarget.style.color = '#000';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = '#8b5cf6';
                }}
              >
                ×
              </button>
            </div>

            {/* Balance Display */}
            <div style={{
              padding: '32px 16px',
              textAlign: 'center',
              borderBottom: '3px solid #8b5cf6'
            }}>
              <div style={{
                fontFamily: 'monospace',
                fontSize: '12px',
                color: '#8b5cf6',
                marginBottom: '8px',
                letterSpacing: '1px'
              }}>
                BALANCE
              </div>
              <div style={{
                fontFamily: 'monospace',
                fontSize: '48px',
                color: '#8b5cf6',
                fontWeight: 'bold',
                textShadow: '0 0 10px rgba(139, 92, 246, 0.5)',
                letterSpacing: '2px'
              }}>
                ${userBalance.toFixed(2)}
              </div>
              <div style={{
                fontFamily: 'monospace',
                fontSize: '10px',
                color: '#6b46c1',
                marginTop: '8px',
                letterSpacing: '1px'
              }}>
                USD
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{
              padding: '16px',
              display: 'flex',
              gap: '12px'
            }}>
              {/* Deposit Button */}
              <button
                style={{
                  flex: 1,
                  padding: '16px',
                  backgroundColor: '#8b5cf6',
                  border: '3px solid #8b5cf6',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontFamily: 'monospace',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  color: '#000',
                  transition: 'all 0.2s',
                  boxShadow: '0 4px 0 #6b46c1',
                  textTransform: 'uppercase',
                  letterSpacing: '1px'
                }}
                onMouseDown={(e) => {
                  e.currentTarget.style.transform = 'translateY(2px)';
                  e.currentTarget.style.boxShadow = '0 2px 0 #6b46c1';
                }}
                onMouseUp={(e) => {
                  e.currentTarget.style.transform = '';
                  e.currentTarget.style.boxShadow = '0 4px 0 #6b46c1';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = '';
                  e.currentTarget.style.boxShadow = '0 4px 0 #6b46c1';
                }}
              >
                ↓ DEPOSIT
              </button>

              {/* Withdraw Button */}
              <button
                style={{
                  flex: 1,
                  padding: '16px',
                  backgroundColor: '#000',
                  border: '3px solid #8b5cf6',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontFamily: 'monospace',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  color: '#8b5cf6',
                  transition: 'all 0.2s',
                  boxShadow: '0 4px 0 #6b46c1',
                  textTransform: 'uppercase',
                  letterSpacing: '1px'
                }}
                onMouseDown={(e) => {
                  e.currentTarget.style.transform = 'translateY(2px)';
                  e.currentTarget.style.boxShadow = '0 2px 0 #6b46c1';
                }}
                onMouseUp={(e) => {
                  e.currentTarget.style.transform = '';
                  e.currentTarget.style.boxShadow = '0 4px 0 #6b46c1';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = '';
                  e.currentTarget.style.boxShadow = '0 4px 0 #6b46c1';
                }}
              >
                ↑ WITHDRAW
              </button>
            </div>

            {/* User Info Footer */}
            <div style={{
              padding: '12px 16px',
              borderTop: '3px solid #8b5cf6',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '4px',
                backgroundColor: '#111',
                border: '2px solid #8b5cf6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px',
                overflow: 'hidden'
              }}>
                {user?.profileImage ? (
                  <img src={user.profileImage} alt="pfp" style={{ width: '100%', height: '100%', borderRadius: '2px', objectFit: 'cover' }} />
                ) : (
                  '👤'
                )}
              </div>
              <div style={{
                flex: 1,
                fontFamily: 'monospace',
                fontSize: '12px',
                color: '#8b5cf6',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {user?.displayName || user?.username || 'Guest'}
              </div>
              
              {/* Connected/Disconnect button */}
              {!showDisconnect ? (
                <button
                  onClick={() => setShowDisconnect(true)}
                  style={{
                    fontSize: '10px',
                    fontFamily: 'monospace',
                    color: '#6b46c1',
                    border: '2px solid #6b46c1',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    background: 'transparent',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#6b46c1';
                    e.currentTarget.style.color = '#fff';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = '#6b46c1';
                  }}
                >
                  CONNECTED
                </button>
              ) : (
                <button
                  onClick={() => {
                    disconnect();
                    setIsBalanceModalOpen(false);
                    setShowDisconnect(false);
                  }}
                  style={{
                    fontSize: '10px',
                    fontFamily: 'monospace',
                    color: '#fff',
                    border: '2px solid #ef4444',
                    backgroundColor: '#ef4444',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#dc2626';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#ef4444';
                  }}
                >
                  DISCONNECT
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Wallet Selection Modal */}
      {showWalletSelect && (
        <div
          onClick={() => setShowWalletSelect(false)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.95)',
            backdropFilter: 'blur(8px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            animation: 'fadeIn 0.2s ease-out'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: '#000',
              border: '4px solid #8b5cf6',
              borderRadius: '8px',
              maxWidth: '400px',
              width: '100%',
              boxShadow: '0 0 20px rgba(139, 92, 246, 0.3)',
              animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
          >
            {/* Header */}
            <div style={{
              padding: '16px',
              borderBottom: '3px solid #8b5cf6',
              textAlign: 'center'
            }}>
              <h2 style={{
                margin: 0,
                fontFamily: 'monospace',
                fontSize: '18px',
                color: '#8b5cf6',
                fontWeight: 'bold',
                letterSpacing: '2px'
              }}>
                SELECT WALLET
              </h2>
            </div>

            {/* Wallet Options */}
            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* MetaMask */}
              <button
                onClick={() => handleWalletSelect('metamask')}
                disabled={isLoading}
                style={{
                  padding: '16px',
                  backgroundColor: '#000',
                  border: '3px solid #8b5cf6',
                  borderRadius: '6px',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  fontFamily: 'monospace',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  color: '#8b5cf6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '12px',
                  transition: 'all 0.2s',
                  opacity: isLoading ? 0.5 : 1
                }}
                onMouseEnter={(e) => {
                  if (!isLoading) {
                    e.currentTarget.style.backgroundColor = '#8b5cf6';
                    e.currentTarget.style.color = '#000';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#000';
                  e.currentTarget.style.color = '#8b5cf6';
                }}
              >
                🦊 METAMASK
              </button>

              {/* Rainbow */}
              <button
                onClick={() => handleWalletSelect('rainbow')}
                disabled={isLoading}
                style={{
                  padding: '16px',
                  backgroundColor: '#000',
                  border: '3px solid #8b5cf6',
                  borderRadius: '6px',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  fontFamily: 'monospace',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  color: '#8b5cf6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '12px',
                  transition: 'all 0.2s',
                  opacity: isLoading ? 0.5 : 1
                }}
                onMouseEnter={(e) => {
                  if (!isLoading) {
                    e.currentTarget.style.backgroundColor = '#8b5cf6';
                    e.currentTarget.style.color = '#000';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#000';
                  e.currentTarget.style.color = '#8b5cf6';
                }}
              >
                🌈 RAINBOW
              </button>

              {/* Phantom */}
              <button
                onClick={() => handleWalletSelect('phantom')}
                disabled={isLoading}
                style={{
                  padding: '16px',
                  backgroundColor: '#000',
                  border: '3px solid #8b5cf6',
                  borderRadius: '6px',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  fontFamily: 'monospace',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  color: '#8b5cf6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '12px',
                  transition: 'all 0.2s',
                  opacity: isLoading ? 0.5 : 1
                }}
                onMouseEnter={(e) => {
                  if (!isLoading) {
                    e.currentTarget.style.backgroundColor = '#8b5cf6';
                    e.currentTarget.style.color = '#000';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#000';
                  e.currentTarget.style.color = '#8b5cf6';
                }}
              >
                👻 PHANTOM
              </button>

              {/* Cancel */}
              <button
                onClick={() => setShowWalletSelect(false)}
                style={{
                  padding: '12px',
                  backgroundColor: 'transparent',
                  border: '2px solid #666',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontFamily: 'monospace',
                  fontSize: '12px',
                  color: '#666',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#999';
                  e.currentTarget.style.color = '#999';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#666';
                  e.currentTarget.style.color = '#666';
                }}
              >
                CANCEL
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Comments Overlay - Moves with betting dashboard */}
      <div
        ref={commentsRef}
        className="comments-overlay"
        style={{
          position: 'fixed',
          bottom: isDashboardOpen ? (selectedOption !== null ? '220px' : '170px') : '80px',
          left: '12px',
          width: '280px',
          maxWidth: 'calc(100vw - 100px)',
          maxHeight: '35vh',
          pointerEvents: 'none',
          zIndex: 15,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          gap: '6px',
          overflowY: 'hidden',
          overflowX: 'hidden',
          paddingBottom: '10px',
          transition: 'bottom 0.3s ease'
        }}
      >
        {comments.slice(-5).map((comment, index, arr) => (
          <div
            key={comment.id}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '6px',
              pointerEvents: 'none',
              animation: 'commentSlideUp 0.4s ease-out',
              transformOrigin: 'bottom left',
              width: 'fit-content',
              maxWidth: '100%',
              opacity: index === arr.length - 1 ? 1 :
                       index === arr.length - 2 ? 0.8 :
                       index === arr.length - 3 ? 0.6 :
                       index === arr.length - 4 ? 0.4 : 0.2
            }}
          >
            <img
              src={comment.profileImage || '/logo.png'}
              alt={comment.username}
              style={{
                width: '30px',
                height: '30px',
                borderRadius: '50%',
                border: '2px solid #8b5cf6',
                flexShrink: 0,
                objectFit: 'cover'
              }}
            />
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '1px',
              fontFamily: 'monospace',
              fontSize: '10px',
              color: '#fff',
              minWidth: 0
            }}>
              <span style={{
                fontWeight: 'bold',
                color: '#fff',
                fontSize: '9px',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                textShadow: '0 0 4px #000, 0 0 4px #000, 0 0 4px #000, 1px 1px 2px #000, -1px -1px 2px #000'
              }}>
                {comment.username}
              </span>
              <span style={{
                wordWrap: 'break-word',
                wordBreak: 'break-word',
                whiteSpace: 'pre-wrap',
                lineHeight: '1.2',
                fontSize: '9px',
                color: '#fff',
                textShadow: '0 0 4px #000, 0 0 4px #000, 0 0 4px #000, 1px 1px 2px #000, -1px -1px 2px #000'
              }}>
                {comment.message}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Chat Icon Button - Simple with glow */}
      {!isChatOpen && (
        <button
          onClick={() => setIsChatOpen(true)}
          style={{
            position: 'fixed',
            right: '20px',
            bottom: isDashboardOpen ? (selectedOption !== null ? '220px' : '170px') : '80px',
            background: 'transparent',
            border: 'none',
            color: '#8b5cf6',
            fontSize: '32px',
            cursor: 'pointer',
            filter: 'drop-shadow(0 0 8px rgba(139, 92, 246, 0.6))',
            zIndex: 25,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'bottom 0.3s ease, filter 0.2s',
            pointerEvents: 'auto',
            padding: 0
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.filter = 'drop-shadow(0 0 12px rgba(139, 92, 246, 0.9))';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.filter = 'drop-shadow(0 0 8px rgba(139, 92, 246, 0.6))';
          }}
        >
          💬
        </button>
      )}

      {/* Chat Input Panel - Minimal */}
      {isChatOpen && (
        <div style={{
          position: 'fixed',
          right: '16px',
          bottom: '50%', // Position higher on screen
          transform: 'translateY(50%)',
          width: '260px',
          backgroundColor: '#111',
          border: '2px solid #8b5cf6',
          borderRadius: '8px',
          zIndex: 25,
          boxShadow: '0 0 16px rgba(139, 92, 246, 0.4)',
          animation: 'slideUp 0.3s ease-out',
          pointerEvents: 'auto',
          padding: '8px'
        }}>
          {/* Input with send icon inside */}
          <div style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center'
          }}>
            <input
              type="text"
              value={chatMessage}
              onChange={(e) => setChatMessage(e.target.value)}
              placeholder="Type message..."
              maxLength={100}
              autoFocus
              style={{
                width: '100%',
                padding: '10px 40px 10px 12px',
                backgroundColor: '#000',
                border: '2px solid #8b5cf6',
                borderRadius: '6px',
                color: '#fff',
                fontFamily: 'monospace',
                fontSize: '12px',
                outline: 'none',
                boxSizing: 'border-box'
              }}
              onKeyPress={async (e) => {
                  if (e.key === 'Enter' && chatMessage.trim() && !isLoadingChat) {
                    setIsLoadingChat(true);
                    try {
                      const res = await fetch('/api/v2/chat', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          userId: user?.uid || 'guest',
                          username: user?.username || 'Guest',
                          displayName: user?.displayName,
                          profileImage: user?.profileImage,
                          message: chatMessage
                        })
                      });
                      
                      if (res.ok) {
                        setChatMessage('');
                        setIsChatOpen(false);
                        // Reload messages
                        const chatRes = await fetch('/api/v2/chat');
                        if (chatRes.ok) {
                          const chatData = await chatRes.json();
                          if (chatData.messages) {
                        setComments(chatData.messages.map((msg: { 
                          id: string; 
                          username: string; 
                          displayName?: string; 
                          profileImage?: string; 
                          message: string; 
                          timestamp: number 
                        }) => ({
                          id: msg.timestamp, // Use timestamp as numeric id
                          username: msg.displayName || msg.username || 'Anonymous',
                          profileImage: msg.profileImage,
                          message: msg.message,
                          timestamp: msg.timestamp
                        })));
                          }
                        }
                      } else if (res.status === 403) {
                        alert('You are banned from chatting');
                      }
                    } catch (error) {
                      console.error('Error sending message:', error);
                    } finally {
                      setIsLoadingChat(false);
                    }
                  }
              }}
            />
            {/* Send icon inside input */}
            <button
              onClick={async () => {
                if (chatMessage.trim() && !isLoadingChat) {
                  setIsLoadingChat(true);
                  try {
                    const res = await fetch('/api/v2/chat', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        userId: user?.uid || 'guest',
                        username: user?.username || 'Guest',
                        displayName: user?.displayName,
                        profileImage: user?.profileImage,
                        message: chatMessage
                      })
                    });
                    
                    if (res.ok) {
                      setChatMessage('');
                      setIsChatOpen(false);
                      // Reload messages
                      const chatRes = await fetch('/api/v2/chat');
                      if (chatRes.ok) {
                        const chatData = await chatRes.json();
                        if (chatData.messages) {
                          setComments(chatData.messages.map((msg: { 
                            id: string; 
                            username: string; 
                            displayName?: string; 
                            profileImage?: string; 
                            message: string; 
                            timestamp: number 
                          }) => ({
                            id: msg.timestamp, // Use timestamp as numeric id
                            username: msg.displayName || msg.username || 'Anonymous',
                            profileImage: msg.profileImage,
                            message: msg.message,
                            timestamp: msg.timestamp
                          })));
                        }
                      } else if (res.status === 403) {
                        alert('You are banned from chatting');
                      }
                    }
                  } catch (error) {
                    console.error('Error sending message:', error);
                  } finally {
                    setIsLoadingChat(false);
                  }
                }
              }}
              disabled={!chatMessage.trim() || isLoadingChat}
              style={{
                position: 'absolute',
                right: '6px',
                background: 'transparent',
                border: 'none',
                color: chatMessage.trim() ? '#8b5cf6' : '#444',
                fontSize: '18px',
                cursor: chatMessage.trim() ? 'pointer' : 'not-allowed',
                padding: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              ➤
            </button>
          </div>
        </div>
      )}

      <style jsx global>{`
        .comments-overlay {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .comments-overlay::-webkit-scrollbar {
          display: none;
        }
      `}</style>
      
      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        @keyframes slideDown {
          from {
            transform: translateY(-20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        @keyframes commentSlideUp {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.9);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        @keyframes subtlePulse {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.05);
          }
        }
      `}</style>
    </div>
  );
}

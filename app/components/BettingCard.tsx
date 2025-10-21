"use client";
import { useState, useEffect, useCallback } from "react";
import styles from "./BettingCard.module.css";

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
  showPrizePool?: boolean;
  serviceFeePercent?: number;
}

interface UserBets {
  leftAmount: number;
  rightAmount: number;
}

interface BettingCardProps {
  userId: string;
  userBalance: number;
  onBalanceUpdate: (newBalance: number) => void;
  onToggleCollapse?: (isCollapsed: boolean) => void;
  isCollapsed?: boolean;
}

export default function BettingCard({ userId, userBalance, onBalanceUpdate, onToggleCollapse, isCollapsed: controlledCollapsed }: BettingCardProps) {
  const [session, setSession] = useState<BettingSession | null>(null);
  const [userBets, setUserBets] = useState<UserBets>({ leftAmount: 0, rightAmount: 0 });
  const [betting, setBetting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState("");
  const [showResult, setShowResult] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);
  const [processedSessionId, setProcessedSessionId] = useState<string | null>(null);
  const [resultPayout, setResultPayout] = useState<number>(0);
  const [savedUserBets, setSavedUserBets] = useState<UserBets>({ leftAmount: 0, rightAmount: 0 });
  const [localCollapsed, setLocalCollapsed] = useState(false);
  
  // Use controlled state if provided, otherwise use local state
  const isCollapsed = controlledCollapsed !== undefined ? controlledCollapsed : localCollapsed;
  
  const setIsCollapsed = (collapsed: boolean) => {
    if (controlledCollapsed === undefined) {
      setLocalCollapsed(collapsed);
    }
    onToggleCollapse?.(collapsed);
  };
  const [expandedButton, setExpandedButton] = useState<'left' | 'right' | null>(null);

  // Fetch current session and user bets
  const fetchSessionData = useCallback(async () => {
    try {
      // Get current session
      const sessionResponse = await fetch('/api/betting/session');
      if (sessionResponse.ok) {
        const sessionData = await sessionResponse.json();
        setSession(sessionData);
        
        // Get user's bets for this session
        if (sessionData?.id) {
          const betsResponse = await fetch(`/api/betting/session?sessionId=${sessionData.id}&userId=${userId}`);
          if (betsResponse.ok) {
            const betsData = await betsResponse.json();
            setUserBets(betsData.userBets || { leftAmount: 0, rightAmount: 0 });
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch betting data:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchSessionData();
    const interval = setInterval(fetchSessionData, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
  }, [fetchSessionData]);

  // Remove footer height measurement since we're using overlay approach
  useEffect(() => {
    // Clean up any old CSS variable
    document.documentElement.style.removeProperty('--betting-footer-height');
  }, []);

  // Check for resolved sessions
  useEffect(() => {
    console.log('🎰 Checking for resolved session:', {
      session: session?.id,
      status: session?.status,
      winner: session?.winner,
      userBets,
      processedSessionId
    });
    
    if (!session || !session.winner || session.status !== 'resolved') return;
    if (processedSessionId === session.id) return; // Already processed
    
    // IMPORTANT: When a session is resolved, we need to check if there WERE bets
    // The current userBets might already be reset for the new session
    // So we need to fetch the historical bets for this resolved session
    
    const checkResolvedSession = async () => {
      try {
        // Fetch user's bets for the resolved session specifically
        console.log('🎰 Fetching bets for resolved session:', session.id, 'userId:', userId);
        const betsResponse = await fetch(`/api/betting/session?sessionId=${session.id}&userId=${userId}`);
        console.log('🎰 Bets API response status:', betsResponse.status);
        
        if (betsResponse.ok) {
          const betsData = await betsResponse.json();
          console.log('🎰 Full bets API response:', betsData);
          const resolvedSessionBets = betsData.userBets || { leftAmount: 0, rightAmount: 0 };
          
          console.log('🎰 Resolved session bets:', resolvedSessionBets);
          console.log('🎰 Bets detail - Left:', resolvedSessionBets.leftAmount, 'Right:', resolvedSessionBets.rightAmount);
          
          // Check if user had bets in this resolved session
          const userBetTotal = resolvedSessionBets.leftAmount + resolvedSessionBets.rightAmount;
          
          if (userBetTotal === 0) {
            console.log('🎰 No bets in resolved session, skipping overlay');
            setProcessedSessionId(session.id);
            return;
          }
          
          // Calculate if user won
          const userBetOnWinner = session.winner === 'left' ? resolvedSessionBets.leftAmount : resolvedSessionBets.rightAmount;
          
          if (userBetOnWinner > 0) {
            // Calculate payout if user won - simple 2x minus service fee
            const serviceFeePercent = session.serviceFeePercent || 6.9;
            const grossPayout = userBetOnWinner * 2;
            const serviceFee = grossPayout * (serviceFeePercent / 100);
            const netPayout = grossPayout - serviceFee;
            setResultPayout(netPayout);
          } else {
            setResultPayout(0);
          }
          
          // Save the resolved session bets for display
          setSavedUserBets(resolvedSessionBets);
          
          // Show result
          console.log('🎰 Showing result overlay!');
          setShowResult(true);
          setFadeOut(false);
          setProcessedSessionId(session.id);
          
          // Start fade-out after 5 seconds
          setTimeout(() => {
            console.log('🎰 Starting fade out');
            setFadeOut(true);
            
            // Hide completely after fade-out animation
            setTimeout(() => {
              console.log('🎰 Hiding overlay');
              setShowResult(false);
              setFadeOut(false);
            }, 500);
          }, 5000);
        }
      } catch (error) {
        console.error('Failed to fetch resolved session bets:', error);
      }
    };
    
    checkResolvedSession();
  }, [session, processedSessionId, userId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleBet = async (option: 'left' | 'right') => {
    if (!session || !amount || betting) return;
    
    const betAmount = parseFloat(amount);
    if (isNaN(betAmount) || betAmount <= 0 || betAmount > userBalance) {
      alert('Invalid bet amount');
      return;
    }

    // Check bet limits
    const currentBetOnOption = option === 'left' ? userBets.leftAmount : userBets.rightAmount;
    if (currentBetOnOption + betAmount > 10) {
      alert(`Maximum $10 per user per side. You can bet $${(10 - currentBetOnOption).toFixed(2)} more on this option.`);
      return;
    }

    // Check button limit
    const currentPoolForOption = option === 'left' ? session.leftPool : session.rightPool;
    if (currentPoolForOption + betAmount > 100) {
      alert(`This option can only accept $${(100 - currentPoolForOption).toFixed(2)} more in total bets.`);
      return;
    }

    setBetting(true);
    try {
      const response = await fetch('/api/betting/place', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          sessionId: session.id,
          option,
          amount: betAmount,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        
        // Update local state
        setUserBets(prev => ({
          ...prev,
          [option === 'left' ? 'leftAmount' : 'rightAmount']: prev[option === 'left' ? 'leftAmount' : 'rightAmount'] + betAmount,
        }));
        
        // Update balance
        onBalanceUpdate(result.newBalance);
        
        // Clear amount and close expanded section
        setAmount("");
        setExpandedButton(null);
        
        // Refresh session data
        fetchSessionData();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to place bet');
      }
    } catch (error) {
      console.error('Betting error:', error);
      alert('Failed to place bet');
    } finally {
      setBetting(false);
    }
  };

  const handlePresetAmount = (percentage: number) => {
    const maxBet = Math.min(userBalance, 10);
    const presetAmount = (maxBet * percentage / 100).toFixed(2);
    setAmount(presetAmount);
  };

  const formatAmount = (amount: number) => {
    return `$${amount.toFixed(2)}`;
  };

  if (loading) {
    return (
      <div className={styles.bettingCard}>
        <div className={styles.loading}>Loading betting session...</div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className={styles.bettingCard}>
        <div className={styles.noSession}>No active betting session</div>
      </div>
    );
  }

  const canBet = session.status === 'open' && userBalance > 0;
  const showPrizePool = session.showPrizePool !== false;

  return (
    <>
      {/* Floating toggle button removed - now in CollapsedFooter */}
      
      <div className={`${styles.bettingCard} ${isCollapsed ? styles.collapsed : ''}`}>
        <div className={styles.header}>
        <div className={styles.headerContent}>
          <h3 className={styles.question}>{session.question}</h3>
          <div className={styles.status}>
            {session.status === 'frozen' ? (
              <span className={styles.frozen}>🔒 Betting Frozen</span>
            ) : session.status === 'open' ? (
              <span className={styles.live}>🟣 Live Betting</span>
            ) : session.status === 'resolved' ? (
              <span className={styles.resolved}>✅ Resolved</span>
            ) : (
              <span className={styles.closed}>🔒 Closed</span>
            )}
          </div>
        </div>
        <button 
          className={styles.toggleButton}
          onClick={() => {
            console.log('Toggle clicked, current state:', isCollapsed);
            const newState = !isCollapsed;
            setIsCollapsed(newState);
            onToggleCollapse?.(newState);
          }}
          aria-label={isCollapsed ? "Expand betting section" : "Collapse betting section"}
          title={isCollapsed ? "Click to expand" : "Click to collapse"}
        >
          {isCollapsed ? '▲' : '▼'}
        </button>
      </div>

      {!isCollapsed && (
        <div className={styles.content}>
          {/* Prize Pool Display */}
          {showPrizePool && (
            <div className={styles.prizePoolSection}>
              <div className={styles.totalPrize}>
                <span className={styles.moneyEmoji}>💰</span>
                <span className={styles.prizeAmount}>{formatAmount(session.totalPool)}</span>
              </div>
              <div className={styles.sidePools}>
                <div className={styles.leftPool}>
                  <span className={styles.poolAmount}>{formatAmount(session.leftPool)}</span>
                  <span className={styles.poolLabel}>X</span>
                </div>
                <div className={styles.rightPool}>
                  <span className={styles.poolAmount}>{formatAmount(session.rightPool)}</span>
                  <span className={styles.poolLabel}>O</span>
                </div>
              </div>
            </div>
          )}

          {/* Betting Buttons */}
          {session.status === 'open' && userId && (
            <div className={styles.bettingButtons}>
              {/* Left (X) Button */}
              <div className={styles.buttonContainer}>
                <button
                  onClick={() => setExpandedButton(expandedButton === 'left' ? null : 'left')}
                  disabled={!canBet || betting}
                  className={`${styles.mainButton} ${styles.leftButton} ${expandedButton === 'left' ? styles.expanded : ''}`}
                >
                  <span className={styles.buttonSymbol}>X</span>
                  {userBets.leftAmount > 0 && (
                    <span className={styles.userBetAmount}>{formatAmount(userBets.leftAmount)}</span>
                  )}
                </button>
                
                {expandedButton === 'left' && (
                  <div className={`${styles.expandedSection} ${styles.leftExpanded}`}>
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="Amount"
                      min="0.01"
                      max={Math.min(userBalance, 10).toString()}
                      step="0.01"
                      className={styles.amountInput}
                      disabled={betting}
                    />
                    <div className={styles.presetButtons}>
                      <button onClick={() => handlePresetAmount(10)} className={styles.presetButton}>10%</button>
                      <button onClick={() => handlePresetAmount(25)} className={styles.presetButton}>25%</button>
                      <button onClick={() => handlePresetAmount(50)} className={styles.presetButton}>50%</button>
                      <button onClick={() => setAmount(Math.min(userBalance, 10).toFixed(2))} className={styles.presetButton}>MAX</button>
                    </div>
                    <button 
                      onClick={() => handleBet('left')}
                      disabled={!amount || parseFloat(amount) <= 0 || betting}
                      className={styles.confirmButton}
                    >
                      BET X
                    </button>
                  </div>
                )}
              </div>

              {/* Right (O) Button */}
              <div className={styles.buttonContainer}>
                <button
                  onClick={() => setExpandedButton(expandedButton === 'right' ? null : 'right')}
                  disabled={!canBet || betting}
                  className={`${styles.mainButton} ${styles.rightButton} ${expandedButton === 'right' ? styles.expanded : ''}`}
                >
                  <span className={styles.buttonSymbol}>O</span>
                  {userBets.rightAmount > 0 && (
                    <span className={styles.userBetAmount}>{formatAmount(userBets.rightAmount)}</span>
                  )}
                </button>
                
                {expandedButton === 'right' && (
                  <div className={`${styles.expandedSection} ${styles.rightExpanded}`}>
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="Amount"
                      min="0.01"
                      max={Math.min(userBalance, 10).toString()}
                      step="0.01"
                      className={styles.amountInput}
                      disabled={betting}
                    />
                    <div className={styles.presetButtons}>
                      <button onClick={() => handlePresetAmount(10)} className={styles.presetButton}>10%</button>
                      <button onClick={() => handlePresetAmount(25)} className={styles.presetButton}>25%</button>
                      <button onClick={() => handlePresetAmount(50)} className={styles.presetButton}>50%</button>
                      <button onClick={() => setAmount(Math.min(userBalance, 10).toFixed(2))} className={styles.presetButton}>MAX</button>
                    </div>
                    <button 
                      onClick={() => handleBet('right')}
                      disabled={!amount || parseFloat(amount) <= 0 || betting}
                      className={styles.confirmButton}
                    >
                      BET O
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* User's Total Bets */}
          {userId && (userBets.leftAmount > 0 || userBets.rightAmount > 0) && (
            <div className={styles.userTotalBets}>
              <span className={styles.totalBetsLabel}>Your Total:</span>
              <span className={styles.totalBetsAmount}>{formatAmount(userBets.leftAmount + userBets.rightAmount)}</span>
            </div>
          )}
          
          {/* Status Messages */}
          {!userId && session.status === 'open' && (
            <div className={styles.loginPrompt}>
              Please sign in to place bets
            </div>
          )}
          
          {userId && userBalance <= 0 && session.status === 'open' && (
            <div className={styles.noBalance}>
              ⚠️ No balance to bet. Please deposit funds.
            </div>
          )}
          
          {session.status === 'closed' && (
            <div className={styles.closedMessage}>
              🔒 Betting is closed for this session
            </div>
          )}
          
          {session.status === 'resolved' && session.winner && (
            <div className={styles.resolvedMessage}>
              Winner: <span className={`${session.winner === 'left' ? styles.leftWinner : styles.rightWinner}`}>
                {session.winner === 'left' ? 'X' : 'O'}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Result Overlay */}
      {showResult && (
        <div 
          className={`${styles.resultOverlay} ${fadeOut ? styles.fadeOut : ''}`} 
          onClick={() => {
            setFadeOut(true);
            setTimeout(() => {
              setShowResult(false);
              setFadeOut(false);
            }, 500);
          }}
        >
          <div 
            className={`${styles.resultContent} ${resultPayout > 0 ? styles.win : styles.lose}`}
            onClick={(e) => e.stopPropagation()}
          >
            {resultPayout > 0 ? (
              <>
                <h2 className={styles.winTitle}>
                  <span className={styles.emoji}>🤑</span>
                  <span>YOU WON!</span>
                  <span className={styles.emoji}>🤑</span>
                </h2>
                <div className={styles.resultAmount}>
                  <div>Your Bet: {formatAmount(session.winner === 'left' ? savedUserBets.leftAmount : savedUserBets.rightAmount)}</div>
                  <div className={styles.payoutAmount}>{formatAmount(resultPayout)}</div>
                </div>
                <div className={styles.receipt}>
                  <div className={styles.receiptTitle}>Betting Round #{session.id}</div>
                  <div className={styles.receiptRow}>
                    <span className={styles.receiptLabel}>Winning Bet</span>
                    <span className={styles.receiptValue}>{formatAmount(session.winner === 'left' ? savedUserBets.leftAmount : savedUserBets.rightAmount)}</span>
                  </div>
                  <div className={styles.receiptRow}>
                    <span className={styles.receiptLabel}>2x Payout</span>
                    <span className={styles.receiptValue}>{formatAmount((session.winner === 'left' ? savedUserBets.leftAmount : savedUserBets.rightAmount) * 2)}</span>
                  </div>
                  <div className={styles.receiptRow}>
                    <span className={styles.receiptLabel}>Service Fee (6.9%)</span>
                    <span className={styles.receiptValue}>-{formatAmount((session.winner === 'left' ? savedUserBets.leftAmount : savedUserBets.rightAmount) * 2 * 0.069)}</span>
                  </div>
                  <div className={styles.receiptDivider} />
                  <div className={styles.receiptRow}>
                    <span className={styles.receiptLabel}>Total Payout</span>
                    <span className={`${styles.receiptValue} ${styles.receiptTotal}`}>{formatAmount(resultPayout)}</span>
                  </div>
                </div>
              </>
            ) : (
              <>
                <h2 className={styles.loseTitle}>
                  <span className={styles.emoji}>💀</span>
                  <span>YOU LOST</span>
                  <span className={styles.emoji}>💀</span>
                </h2>
                <div className={styles.receipt} style={{ borderColor: '#ff0040' }}>
                  <div className={styles.receiptTitle}>Betting Round #{session.id}</div>
                  <div className={styles.receiptRow}>
                    <span className={styles.receiptLabel} style={{ color: '#ff0040' }}>X BET</span>
                    <span className={styles.receiptValue} style={{ color: '#ff0040' }}>{formatAmount(savedUserBets.leftAmount)}</span>
                  </div>
                  <div className={styles.receiptRow}>
                    <span className={styles.receiptLabel} style={{ color: '#ff0040' }}>O BET</span>
                    <span className={styles.receiptValue} style={{ color: '#ff0040' }}>{formatAmount(savedUserBets.rightAmount)}</span>
                  </div>
                  <div className={styles.receiptDivider} style={{ borderColor: '#ff0040' }} />
                  <div className={styles.receiptRow}>
                    <span className={styles.receiptLabel} style={{ color: '#ff0040' }}>TOTAL LOST</span>
                    <span className={`${styles.receiptValue} ${styles.receiptTotal}`} style={{ color: '#ff0040' }}>
                      -{formatAmount(savedUserBets.leftAmount + savedUserBets.rightAmount)}
                    </span>
                  </div>
                  <div style={{ marginTop: '2rem', textAlign: 'center', fontSize: '1.2rem', color: '#ff0040' }}>
                    Better luck next time! 🎲
                  </div>
                </div>
              </>
            )}
            <button 
              className={styles.resultButton}
              onClick={() => {
                setFadeOut(true);
                setTimeout(() => {
                  setShowResult(false);
                  setFadeOut(false);
                }, 500);
              }}
            >
              Continue
            </button>
          </div>
        </div>
      )}
    </div>
    </>
  );
}
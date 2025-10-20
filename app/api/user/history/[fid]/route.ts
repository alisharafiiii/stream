import { NextRequest, NextResponse } from 'next/server';
import { redis, REDIS_KEYS, BettingSession, UserProfile, UserBets } from '@/lib/redis';

interface Transaction {
  type: 'deposit' | 'withdrawal' | 'bet' | 'payout';
  amount: number;
  timestamp: number;
  transactionHash?: string;
  status: string;
  details?: {
    side?: 'left' | 'right';
    sessionId?: string;
    won?: boolean;
    serviceFee?: number;
  };
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ fid: string }> }
) {
  try {
    const { fid } = await context.params;
    console.log('[Transaction History] Fetching for FID:', fid);
    const transactions: Transaction[] = [];
    
    // Get user profile to check balance
    const userProfile = await redis.get<UserProfile>(REDIS_KEYS.USER_PROFILE(fid));
    if (!userProfile) {
      return NextResponse.json({ transactions: [], count: 0 });
    }
    
    // Get deposits
    // For now, check if there's a deposit history
    const deposits = await redis.lrange(`user:deposits:${fid}`, 0, -1);
    for (const deposit of deposits) {
      try {
        // Upstash Redis automatically deserializes JSON, so deposit is already an object
        const depositObj = typeof deposit === 'string' ? JSON.parse(deposit) : deposit;
        transactions.push({
          type: 'deposit',
          amount: depositObj.amount,
          timestamp: depositObj.timestamp,
          transactionHash: depositObj.transactionHash,
          status: depositObj.status || 'completed'
        });
      } catch {
        // Skip invalid entries
      }
    }
    
    // Get withdrawals
    const withdrawalKey = REDIS_KEYS.USER_WITHDRAWALS(fid);
    console.log('[Transaction History] Checking withdrawals at key:', withdrawalKey);
    const withdrawals = await redis.lrange(withdrawalKey, 0, -1);
    console.log('[Transaction History] Found withdrawals:', withdrawals.length);
    for (const withdrawal of withdrawals) {
      try {
        // Upstash Redis automatically deserializes JSON
        const withdrawalObj = typeof withdrawal === 'string' ? JSON.parse(withdrawal) : withdrawal;
        transactions.push({
          type: 'withdrawal',
          amount: withdrawalObj.amount,
          timestamp: withdrawalObj.timestamp,
          transactionHash: withdrawalObj.transactionHash,
          status: withdrawalObj.status || 'completed'
        });
      } catch (error) {
        console.log('[Transaction History] Error parsing withdrawal:', error, withdrawal);
        // Skip invalid entries
      }
    }
    
    // Get current session first
    const currentSessionId = await redis.get<string>(REDIS_KEYS.BETTING_CURRENT());
    console.log('[Transaction History] Current session ID:', currentSessionId);
    if (currentSessionId) {
      const currentSession = await redis.get<BettingSession>(REDIS_KEYS.BETTING_SESSION(currentSessionId));
      console.log('[Transaction History] Current session:', currentSession);
      if (currentSession) {
        const userBets = await redis.get<UserBets>(REDIS_KEYS.BETTING_USER_BETS(currentSession.id, fid));
        console.log('[Transaction History] User bets in current session:', userBets);
        if (userBets) {
          // Add current session bets to transactions
          if (userBets.transactions && userBets.transactions.length > 0) {
            for (const tx of userBets.transactions) {
              transactions.push({
                type: 'bet',
                amount: tx.amount,
                timestamp: tx.timestamp || Date.now(),
                status: 'pending',
                details: {
                  side: tx.option,
                  sessionId: currentSession.id
                }
              });
            }
          }
        }
      }
    }
    
    // Get betting history
    const sessionIds = await redis.lrange(REDIS_KEYS.BETTING_HISTORY(), 0, -1);
    console.log('[Transaction History] Historical session IDs:', sessionIds);
    
    for (const sessionId of sessionIds) {
      const session = await redis.get<BettingSession>(REDIS_KEYS.BETTING_SESSION(sessionId));
      if (!session) continue;
      
      // Check if user participated in this session
      const userBetsKey = REDIS_KEYS.BETTING_USER_BETS(session.id, fid);
      const userBets = await redis.get<UserBets>(userBetsKey);
      
      if (userBets) {
        // Add bet transactions from individual transactions or aggregate
        if (userBets.transactions && userBets.transactions.length > 0) {
          // Use individual transactions if available
          for (const tx of userBets.transactions) {
            transactions.push({
              type: 'bet',
              amount: tx.amount,
              timestamp: tx.timestamp || session.createdAt,
              status: 'completed',
              details: {
                side: tx.option,
                sessionId: session.id
              }
            });
          }
        } else {
          // Fallback to aggregate amounts
          if (userBets.leftAmount > 0) {
            transactions.push({
              type: 'bet',
              amount: userBets.leftAmount,
              timestamp: session.createdAt,
              status: 'completed',
              details: {
                side: 'left',
                sessionId: session.id
              }
            });
          }
          
          if (userBets.rightAmount > 0) {
            transactions.push({
              type: 'bet',
              amount: userBets.rightAmount,
              timestamp: session.createdAt,
              status: 'completed',
              details: {
                side: 'right',
                sessionId: session.id
              }
            });
          }
        }
        
        // Add payout if session was resolved
        if (session.status === 'resolved' && session.winner) {
          const wonSide = session.winner;
          const userWonAmount = wonSide === 'left' ? userBets.leftAmount : userBets.rightAmount;
          const userLostAmount = wonSide === 'left' ? userBets.rightAmount : userBets.leftAmount;
          
          if (userWonAmount > 0) {
            // Calculate payout - simple 2x minus service fee
            const grossPayout = userWonAmount * 2;
            const serviceFee = grossPayout * ((session.serviceFeePercent || 6.9) / 100);
            const payout = grossPayout - serviceFee;
            
            transactions.push({
              type: 'payout',
              amount: payout,
              timestamp: session.resolvedAt || session.createdAt,
              status: 'completed',
              details: {
                sessionId: session.id,
                won: true,
                serviceFee: serviceFee
              }
            });
          } else if (userLostAmount > 0) {
            // User lost
            transactions.push({
              type: 'payout',
              amount: 0,
              timestamp: session.resolvedAt || session.createdAt,
              status: 'completed',
              details: {
                sessionId: session.id,
                won: false
              }
            });
          }
        }
      }
    }
    
    // Sort transactions by timestamp (newest first)
    transactions.sort((a, b) => b.timestamp - a.timestamp);
    
    console.log('[Transaction History] Total transactions found:', transactions.length);
    console.log('[Transaction History] Transaction types:', transactions.map(t => t.type));
    
    return NextResponse.json({
      transactions,
      count: transactions.length
    });
    
  } catch (error) {
    console.error('[API/user/history] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : '';
    console.error('[API/user/history] Error details:', { errorMessage, errorStack });
    return NextResponse.json(
      { 
        error: 'Failed to fetch transaction history',
        details: errorMessage 
      },
      { status: 500 }
    );
  }
}

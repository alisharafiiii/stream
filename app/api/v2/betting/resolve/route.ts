import { NextResponse } from 'next/server';
import { redis } from '@/lib/redis';

const ROUND_KEY = 'v2:betting:round';
const BETS_LIST_KEY = 'v2:bets:all';
const BET_KEY_PREFIX = 'v2:bet:';
const USER_KEY_PREFIX = 'v2:user:';
const PLATFORM_FEE_PERCENT = 5; // 5% platform fee

interface BettingRound {
  question: string;
  options: Array<{
    name: string;
    color: string;
    multiplier: number;
  }>;
  isBettingOpen: boolean;
  winnerIndex?: number;
  resolvedAt?: number;
}

interface Bet {
  userId: string;
  optionIndex: string;
  amount: string;
  timestamp: string;
}

interface Payout {
  userId: string;
  betAmount: number;
  multiplier: number;
  grossPayout: number;
  platformFee: number;
  netPayout: number;
}

// POST - Resolve betting round with winner
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { winnerIndex } = body;

    if (winnerIndex === undefined || winnerIndex < 0) {
      return NextResponse.json({ error: 'Invalid winner index' }, { status: 400 });
    }

    // Get current betting round
    const round = await redis.get(ROUND_KEY) as BettingRound | null;
    
    if (!round) {
      return NextResponse.json({ error: 'No active betting round' }, { status: 404 });
    }

    if (round.winnerIndex !== undefined) {
      return NextResponse.json({ error: 'Round already resolved' }, { status: 400 });
    }

    if (round.isBettingOpen) {
      return NextResponse.json({ error: 'Betting must be closed first' }, { status: 400 });
    }

    if (winnerIndex >= round.options.length) {
      return NextResponse.json({ error: 'Invalid winner index' }, { status: 400 });
    }

    // Get all bets
    const betIds = await redis.smembers(BETS_LIST_KEY) || [];
    const winnerBets: Array<{ betId: string; bet: Bet }> = [];
    const allBets: Array<{ betId: string; bet: Bet }> = [];

    // Find winning bets
    for (const betId of betIds) {
      const bet = await redis.hgetall(BET_KEY_PREFIX + betId) as Bet | null;
      if (bet && bet.optionIndex !== undefined && bet.userId && bet.amount) {
        allBets.push({ betId, bet });
        if (parseInt(bet.optionIndex) === winnerIndex) {
          winnerBets.push({ betId, bet });
        }
      }
    }

    // Calculate and distribute payouts
    const payouts: Payout[] = [];
    let totalPlatformFees = 0;

    for (const { betId, bet } of winnerBets) {
      const betAmount = parseFloat(bet.amount);
      const multiplier = round.options[winnerIndex].multiplier || 2;
      const grossPayout = betAmount * multiplier;
      const platformFee = grossPayout * (PLATFORM_FEE_PERCENT / 100);
      const netPayout = grossPayout - platformFee;

      // Update user balance
      const userKey = `${USER_KEY_PREFIX}${bet.userId}`;
      const userData = await redis.hgetall(userKey) as Record<string, string> | null;
      
      if (userData) {
        const currentBalance = parseFloat(userData.balance || '0');
        const newBalance = currentBalance + netPayout;
        
        await redis.hset(userKey, {
          balance: newBalance,
          lastWin: netPayout,
          lastWinAt: Date.now(),
          totalWon: parseFloat(userData.totalWon || '0') + netPayout
        });

        payouts.push({
          userId: bet.userId,
          betAmount,
          multiplier,
          grossPayout,
          platformFee,
          netPayout
        });
      }

      // Mark bet as paid
      await redis.hset(BET_KEY_PREFIX + betId, {
        paid: true,
        paidAmount: netPayout,
        paidAt: Date.now()
      });

      totalPlatformFees += platformFee;
    }

    // Update round with winner
    await redis.set(ROUND_KEY, {
      ...round,
      winnerIndex,
      resolvedAt: Date.now()
    });

    // Move round to history
    const historyKey = `v2:betting:history:${Date.now()}`;
    await redis.set(historyKey, {
      ...round,
      winnerIndex,
      resolvedAt: Date.now(),
      totalBets: allBets.length,
      winningBets: winnerBets.length,
      totalPlatformFees,
      payouts
    });

    // Clean up bets (move to history)
    for (const { betId } of allBets) {
      await redis.del(BET_KEY_PREFIX + betId);
    }
    await redis.del(BETS_LIST_KEY);

    return NextResponse.json({ 
      success: true, 
      winnerIndex,
      winnerOption: round.options[winnerIndex],
      totalPayouts: payouts.length,
      totalPlatformFees,
      payouts: payouts.slice(0, 10) // Return first 10 for preview
    });
  } catch (error) {
    console.error('Error resolving betting round:', error);
    return NextResponse.json(
      { error: 'Failed to resolve betting round' },
      { status: 500 }
    );
  }
}

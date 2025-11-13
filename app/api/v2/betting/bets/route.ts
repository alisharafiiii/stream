import { NextResponse } from 'next/server';
import { redis } from '@/lib/redis';

const BETS_KEY_PREFIX = 'v2:betting:bets:';
const ROUND_STATS_KEY = 'v2:betting:round:stats';

interface Bet {
  userId: string;
  optionIndex: number;
  amount: number;
  timestamp: number;
}

interface RoundStats {
  totalBets: number[];  // Total bet amount for each option
  betCount: number[];   // Number of bets for each option
}

// GET bets statistics for current round
export async function GET() {
  try {
    const stats = await redis.get<RoundStats>(ROUND_STATS_KEY);
    
    if (!stats) {
      // Return empty stats
      return NextResponse.json({
        totalBets: [],
        betCount: []
      });
    }

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching bet stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bet stats' },
      { status: 500 }
    );
  }
}

// POST place a new bet
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, optionIndex, amount } = body;

    if (!userId || optionIndex === undefined || !amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid bet data' },
        { status: 400 }
      );
    }

    // Check if betting is open
    const bettingRound = await redis.get('v2:betting:round');
    if (bettingRound && typeof bettingRound === 'object' && 'isBettingOpen' in bettingRound && !bettingRound.isBettingOpen) {
      return NextResponse.json(
        { error: 'Betting is closed' },
        { status: 400 }
      );
    }

    // Check user balance
    const user = await redis.get(`v2:user:${userId}`);
    if (!user || typeof user !== 'object' || !('balance' in user)) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const currentBalance = (user as { balance?: number }).balance || 0;
    if (currentBalance < amount) {
      return NextResponse.json(
        { error: 'Insufficient balance' },
        { status: 400 }
      );
    }

    // Create the bet
    const bet: Bet = {
      userId,
      optionIndex,
      amount,
      timestamp: Date.now()
    };

    // Save bet
    const betId = `${Date.now()}_${userId}`;
    await redis.set(`${BETS_KEY_PREFIX}${betId}`, bet);

    // Update user balance
    await redis.set(`v2:user:${userId}`, {
      ...user,
      balance: currentBalance - amount
    });

    // Update round stats
    const stats = await redis.get<RoundStats>(ROUND_STATS_KEY) || { totalBets: [], betCount: [] };
    
    // Initialize arrays if needed
    while (stats.totalBets.length <= optionIndex) {
      stats.totalBets.push(0);
      stats.betCount.push(0);
    }
    
    stats.totalBets[optionIndex] += amount;
    stats.betCount[optionIndex] += 1;
    
    await redis.set(ROUND_STATS_KEY, stats);

    return NextResponse.json({ 
      success: true, 
      bet,
      newBalance: currentBalance - amount
    });
  } catch (error) {
    console.error('Error placing bet:', error);
    return NextResponse.json(
      { error: 'Failed to place bet' },
      { status: 500 }
    );
  }
}

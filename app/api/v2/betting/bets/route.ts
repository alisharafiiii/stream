import { NextResponse } from 'next/server';
import { redis } from '@/lib/redis';

const BET_KEY_PREFIX = 'v2:bet:';
const BETS_LIST_KEY = 'v2:bets:all';

// GET bets statistics for current round
export async function GET() {
  try {
    // Get current betting round to know how many options we have
    const bettingRound = await redis.get('v2:betting:round');
    if (!bettingRound || typeof bettingRound !== 'object' || !('options' in bettingRound)) {
      return NextResponse.json({
        totalBets: [],
        betCount: []
      });
    }

    const options = (bettingRound as { options: unknown[] }).options;
    const numOptions = options.length;

    // Get all bet IDs
    const allBets = await redis.smembers(BETS_LIST_KEY) || [];
    
    // Initialize stats arrays
    const totalBets = Array(numOptions).fill(0);
    const betCount = Array(numOptions).fill(0);

    // Calculate stats from individual bets
    for (const betId of allBets) {
      const bet = await redis.hgetall(BET_KEY_PREFIX + betId) as Record<string, string> | null;
      if (bet && bet.amount && bet.optionIndex !== undefined) {
        const amount = parseFloat(bet.amount);
        const index = parseInt(bet.optionIndex);
        if (!isNaN(amount) && !isNaN(index) && index < numOptions) {
          totalBets[index] += amount;
          betCount[index]++;
        }
      }
    }

    return NextResponse.json({ totalBets, betCount });
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

    // Check user and balance
    const userData = await redis.hgetall(`v2:user:${userId}`) as Record<string, string> | null;
    if (!userData || !userData.uid) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if user is banned
    console.log(`Ban status for betting user ${userId}: ${userData.isBanned}`);
    if (userData.isBanned === 'true') {
      console.log(`User ${userId} is banned from betting`);
      return NextResponse.json(
        { error: 'You are banned from betting' },
        { status: 403 }
      );
    }

    const currentBalance = parseFloat(userData.balance || '0');
    if (currentBalance < amount) {
      return NextResponse.json(
        { error: 'Insufficient balance' },
        { status: 400 }
      );
    }

    // Create the bet
    const betId = `${Date.now()}_${userId}`;
    
    // Save bet using hset for consistency
    await redis.hset(BET_KEY_PREFIX + betId, {
      userId,
      optionIndex,
      amount,
      timestamp: Date.now()
    });

    // Add bet ID to the list
    await redis.sadd(BETS_LIST_KEY, betId);

    // Update user balance and total bets
    const newBalance = currentBalance - amount;
    const currentTotalBets = parseFloat(userData.totalBets || '0');
    
    await redis.hset(`v2:user:${userId}`, {
      balance: newBalance,
      totalBets: currentTotalBets + amount,
      lastActive: Date.now()
    });

    return NextResponse.json({ 
      success: true, 
      bet: {
        userId,
        optionIndex,
        amount,
        timestamp: Date.now()
      },
      newBalance: newBalance
    });
  } catch (error) {
    console.error('Error placing bet:', error);
    return NextResponse.json(
      { error: 'Failed to place bet' },
      { status: 500 }
    );
  }
}

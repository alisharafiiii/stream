import { NextRequest, NextResponse } from 'next/server';
import { redis, REDIS_KEYS, UserProfile } from '@/lib/redis';

// POST to record a deposit
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, amount, transactionHash } = body;
    
    if (!userId || !amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid deposit data' },
        { status: 400 }
      );
    }
    
    // Get user profile
    const userProfile = await redis.get<UserProfile>(REDIS_KEYS.USER_PROFILE(userId));
    if (!userProfile) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Update user balance
    userProfile.balance += amount;
    userProfile.lastSeen = Date.now();
    await redis.set(REDIS_KEYS.USER_PROFILE(userId), userProfile);
    
    // Record deposit transaction
    const deposit = {
      type: 'deposit',
      amount,
      timestamp: Date.now(),
      transactionHash: transactionHash || null,
      status: 'completed'
    };
    
    await redis.lpush(`user:deposits:${userId}`, JSON.stringify(deposit));
    
    return NextResponse.json({
      success: true,
      newBalance: userProfile.balance,
      deposit
    });
    
  } catch (error) {
    console.error('[API/deposit] Error:', error);
    return NextResponse.json(
      { error: 'Failed to process deposit' },
      { status: 500 }
    );
  }
}

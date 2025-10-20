import { NextRequest, NextResponse } from 'next/server'
import { redis, REDIS_KEYS, UserProfile } from '@/lib/redis'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { fid, amount } = body
    
    if (!fid || !amount || amount <= 0) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }
    
    // Get user profile
    const userProfile = await redis.get<UserProfile>(REDIS_KEYS.USER_PROFILE(fid))
    
    if (!userProfile) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    
    if (userProfile.balance < amount) {
      return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 })
    }
    
    // Deduct amount from balance
    userProfile.balance -= amount
    userProfile.lastSeen = Date.now()
    
    // Save updated profile
    await redis.set(REDIS_KEYS.USER_PROFILE(fid), userProfile)
    
    // In a real app, you would:
    // 1. Create a blockchain transaction
    // 2. Send funds to user's wallet
    // 3. Store transaction history
    
    // Simulate transaction hash for demo
    const transactionHash = `0x${Math.random().toString(16).substr(2, 64)}`;
    
    // Store withdrawal record (in real app, this would be in a transactions table)
    await redis.lpush(
      REDIS_KEYS.USER_WITHDRAWALS(fid),
      JSON.stringify({
        amount,
        transactionHash,
        timestamp: Date.now(),
        status: 'pending' // Would update to 'confirmed' after blockchain confirmation
      })
    );
    
    return NextResponse.json({
      success: true,
      newBalance: userProfile.balance,
      transactionHash,
      message: 'Withdrawal initiated successfully'
    })
  } catch (error) {
    console.error('[API/withdraw] Error:', error)
    return NextResponse.json({ error: 'Failed to process withdrawal' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { redis, REDIS_KEYS, UserProfile } from '@/lib/redis'
import { checkRateLimit, validateOrigin, logSuspiciousActivity } from '@/lib/security-middleware'

// This endpoint is for DEMO withdrawals only - not real money
export async function POST(request: NextRequest) {
  // Security: Validate origin
  if (!validateOrigin(request)) {
    return NextResponse.json({ error: 'Unauthorized origin' }, { status: 403 })
  }
  try {
    const body = await request.json()
    const { fid, amount } = body
    
    if (!fid || !amount || amount <= 0) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }
    
    // Security: Prevent guest users from withdrawing
    if (fid.startsWith('guest_') || fid.startsWith('browser_')) {
      await logSuspiciousActivity(request, 'guest_withdrawal_attempt', { fid, amount })
      return NextResponse.json({ error: 'Guest users cannot withdraw funds' }, { status: 403 })
    }
    
    // Security: Check rate limit
    const rateLimit = await checkRateLimit(request, 'withdraw', fid)
    if (!rateLimit.allowed) {
      await logSuspiciousActivity(request, 'rate_limit_exceeded', { fid, endpoint: 'withdraw' })
      return NextResponse.json({ 
        error: 'Too many withdrawal attempts. Please try again later.',
        retryAfter: rateLimit.resetIn 
      }, { status: 429 })
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
    
    // DEMO MODE: Simulate transaction hash
    // IMPORTANT: This endpoint does NOT send real money
    const transactionHash = `demo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
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

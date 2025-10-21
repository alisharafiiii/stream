import { NextRequest, NextResponse } from 'next/server'
import { BettingService } from '@/lib/betting-service'
import { redis, REDIS_KEYS, UserProfile } from '@/lib/redis'
import { validateOrigin, logSuspiciousActivity } from '@/lib/security-middleware'
import { isAdminWallet } from '@/lib/admin-auth'

// POST resolve betting session and process payouts (admin only)
export async function POST(request: NextRequest) {
  // Security: Validate origin
  if (!validateOrigin(request)) {
    return NextResponse.json({ error: 'Unauthorized origin' }, { status: 403 })
  }
  
  try {
    const body = await request.json()
    const { sessionId, winner, walletAddress } = body
    
    // Verify admin wallet using centralized check
    if (!walletAddress || !isAdminWallet(walletAddress)) {
      await logSuspiciousActivity(request, 'unauthorized_admin_attempt', { walletAddress, endpoint: 'betting/resolve' })
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }
    
    if (!sessionId || !winner) {
      return NextResponse.json({ error: 'Session ID and winner required' }, { status: 400 })
    }
    
    if (winner !== 'left' && winner !== 'right') {
      return NextResponse.json({ error: 'Invalid winner option' }, { status: 400 })
    }
    
    // Resolve the session and get payouts
    const { payouts, serviceFee } = await BettingService.resolveSession(sessionId, winner)
    
    // Process payouts - add winnings to user balances
    const payoutResults = []
    for (const payout of payouts) {
      const userProfile = await redis.get<UserProfile>(REDIS_KEYS.USER_PROFILE(payout.userId))
      if (userProfile) {
        userProfile.balance += payout.amount
        await redis.set(REDIS_KEYS.USER_PROFILE(payout.userId), userProfile)
        
        payoutResults.push({
          userId: payout.userId,
          amount: payout.amount,
          newBalance: userProfile.balance
        })
      }
    }
    
    return NextResponse.json({
      success: true,
      winner,
      serviceFee,
      totalPayouts: payouts.reduce((sum, p) => sum + p.amount, 0),
      payoutCount: payouts.length,
      payouts: payoutResults
    })
  } catch (error) {
    console.error('[Betting API] Error resolving session:', error)
    return NextResponse.json({ error: 'Failed to resolve session' }, { status: 500 })
  }
}

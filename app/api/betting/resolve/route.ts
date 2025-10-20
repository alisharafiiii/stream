import { NextRequest, NextResponse } from 'next/server'
import { BettingService } from '@/lib/betting-service'
import { redis, REDIS_KEYS, UserProfile } from '@/lib/redis'

// POST resolve betting session and process payouts (admin only)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { sessionId, winner, walletAddress } = body
    
    // Verify admin wallet
    const ADMIN_WALLETS = ['0xAbD4BB1Ba7C9a57C40598604A7ad0E5d105AD54D', '0x37ed24e7c7311836fd01702a882937138688c1a9']
    if (!walletAddress || !ADMIN_WALLETS.includes(walletAddress.toLowerCase())) {
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

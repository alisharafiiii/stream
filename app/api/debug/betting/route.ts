import { NextRequest, NextResponse } from 'next/server'
import { redis, REDIS_KEYS, UserProfile } from '@/lib/redis'
import { BettingService } from '@/lib/betting-service'

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId')
    
    // Get current session
    const currentSession = await BettingService.getCurrentSession()
    
    // Get user profile if userId provided
    let userProfile: UserProfile | null = null
    let userBets = null
    if (userId) {
      userProfile = await redis.get<UserProfile>(REDIS_KEYS.USER_PROFILE(userId))
      if (currentSession) {
        userBets = await BettingService.getUserBets(currentSession.id, userId)
      }
    }
    
    // Get Redis connection status
    await redis.set('test:connection', { test: true, timestamp: Date.now() })
    const testRead = await redis.get('test:connection')
    
    return NextResponse.json({
      status: 'ok',
      redisConnected: !!testRead,
      currentSession,
      userProfile,
      userBets,
      debug: {
        userId,
        sessionExists: !!currentSession,
        sessionStatus: currentSession?.status,
        userExists: !!userProfile,
        userBalance: userProfile?.balance
      }
    })
  } catch (error) {
    console.error('[Debug API] Error:', error)
    return NextResponse.json({ 
      error: 'Debug check failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

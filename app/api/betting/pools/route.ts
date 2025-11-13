import { NextRequest, NextResponse } from 'next/server'
// import { BettingService } from '@/lib/betting-service' // Unused
import { redis, REDIS_KEYS } from '@/lib/redis'

// GET betting pool data for a session
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')
    const userId = searchParams.get('userId')
    
    if (!sessionId || !userId) {
      return NextResponse.json({ 
        error: 'Session ID and User ID are required' 
      }, { status: 400 })
    }
    
    // Get session data
    const sessionKey = REDIS_KEYS.BETTING_SESSION(sessionId)
    const session = await redis.get(sessionKey)
    
    if (!session) {
      return NextResponse.json({ 
        error: 'Session not found' 
      }, { status: 404 })
    }
    
    // Get all bets for this session
    const allBetsKey = REDIS_KEYS.BETTING_SESSION_BETS(sessionId)
    const allBets = await redis.smembers(allBetsKey)
    
    let leftPool = 0
    let rightPool = 0
    let userLeftBets = 0
    let userRightBets = 0
    
    // Calculate pool totals and user bets
    for (const betId of allBets) {
      const bet = await redis.get(betId) as { amount?: number; option?: string; userId?: string } | null;
      if (bet && typeof bet === 'object' && typeof bet.amount === 'number' && typeof bet.option === 'string') {
        if (bet.option === 'left') {
          leftPool += bet.amount
        } else if (bet.option === 'right') {
          rightPool += bet.amount
        }
        
        // Track user's bets
        if (bet.userId === userId) {
          if (bet.option === 'left') {
            userLeftBets += bet.amount
          } else if (bet.option === 'right') {
            userRightBets += bet.amount
          }
        }
      }
    }
    
    const totalPool = leftPool + rightPool
    
    return NextResponse.json({
      totalPool,
      leftPool,
      rightPool,
      userBets: {
        left: userLeftBets,
        right: userRightBets
      }
    })
  } catch (error) {
    console.error('[Betting Pools API] Error:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch pool data' 
    }, { status: 500 })
  }
}

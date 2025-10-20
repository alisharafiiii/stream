import { NextRequest, NextResponse } from 'next/server'
import { BettingService } from '@/lib/betting-service'
import { redis, REDIS_KEYS, UserProfile } from '@/lib/redis'

// POST place a bet
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { sessionId, userId, option, amount } = body
    
    // Validate input
    if (!sessionId || !userId || !option || !amount) {
      return NextResponse.json({ 
        error: 'Session ID, user ID, option, and amount are required' 
      }, { status: 400 })
    }
    
    if (option !== 'left' && option !== 'right') {
      return NextResponse.json({ error: 'Invalid option' }, { status: 400 })
    }
    
    if (amount <= 0) {
      return NextResponse.json({ error: 'Amount must be positive' }, { status: 400 })
    }
    
    // Check user balance
    const userProfile = await redis.get<UserProfile>(REDIS_KEYS.USER_PROFILE(userId))
    if (!userProfile) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    
    if (userProfile.balance < amount) {
      return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 })
    }
    
    // Place the bet
    const result = await BettingService.placeBet(sessionId, userId, option, amount)
    
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }
    
    // Deduct from user balance
    userProfile.balance -= amount
    userProfile.lastSeen = Date.now()
    await redis.set(REDIS_KEYS.USER_PROFILE(userId), userProfile)
    
    // Get updated session info to return
    const session = await BettingService.getCurrentSession()
    
    // Get user's total bets for this session
    const userBets = await BettingService.getUserBets(sessionId, userId)
    
    return NextResponse.json({ 
      success: true,
      session,
      userBets,
      newBalance: userProfile.balance
    })
  } catch (error) {
    console.error('[Betting API] Error placing bet:', error)
    return NextResponse.json({ error: 'Failed to place bet' }, { status: 500 })
  }
}

// GET user's bets for current session
export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId')
    const sessionId = request.nextUrl.searchParams.get('sessionId')
    
    if (!userId || !sessionId) {
      return NextResponse.json({ error: 'User ID and session ID required' }, { status: 400 })
    }
    
    const userBets = await BettingService.getUserBets(sessionId, userId)
    
    return NextResponse.json(userBets || {
      userId,
      sessionId,
      leftAmount: 0,
      rightAmount: 0,
      transactions: []
    })
  } catch (error) {
    console.error('[Betting API] Error getting user bets:', error)
    return NextResponse.json({ error: 'Failed to get user bets' }, { status: 500 })
  }
}

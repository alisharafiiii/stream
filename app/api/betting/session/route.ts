import { NextRequest, NextResponse } from 'next/server'
import { BettingService } from '@/lib/betting-service'
import { isAdminWallet } from '@/lib/admin-auth'

// GET current betting session or specific session with user bets
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')
    const userId = searchParams.get('userId')
    
    // If sessionId and userId provided, get user's bets for that specific session
    if (sessionId && userId) {
      const userBets = await BettingService.getUserBets(sessionId, userId)
      return NextResponse.json({ 
        sessionId,
        userBets: userBets || { leftAmount: 0, rightAmount: 0 }
      })
    }
    
    // Otherwise get current session
    const session = await BettingService.getCurrentSession()
    
    if (!session) {
      return NextResponse.json({ message: 'No active betting session' }, { status: 404 })
    }
    
    return NextResponse.json(session)
  } catch (error) {
    console.error('[Betting API] Error getting session:', error)
    return NextResponse.json({ error: 'Failed to get session' }, { status: 500 })
  }
}

// POST create new betting session (admin only)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { question, showPrizePool = true, walletAddress } = body
    
    // Verify admin wallet
    if (!isAdminWallet(walletAddress)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }
    
    if (!question) {
      return NextResponse.json({ error: 'Question is required' }, { status: 400 })
    }
    
    // Check if there's already an active session
    const currentSession = await BettingService.getCurrentSession()
    if (currentSession && currentSession.status !== 'resolved') {
      return NextResponse.json({ 
        error: 'There is already an active betting session. Please resolve it first.' 
      }, { status: 400 })
    }
    
    const session = await BettingService.createSession(question, showPrizePool)
    
    return NextResponse.json(session)
  } catch (error) {
    console.error('[Betting API] Error creating session:', error)
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 })
  }
}

// PUT update session status (freeze/unfreeze) - admin only
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { sessionId, action, walletAddress } = body
    
    // Verify admin wallet
    if (!isAdminWallet(walletAddress)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }
    
    if (!sessionId || !action) {
      return NextResponse.json({ error: 'Session ID and action required' }, { status: 400 })
    }
    
    if (action === 'freeze') {
      const success = await BettingService.freezeBetting(sessionId)
      if (!success) {
        return NextResponse.json({ error: 'Failed to freeze session' }, { status: 400 })
      }
      
      return NextResponse.json({ success: true, message: 'Betting frozen' })
    }
    
    if (action === 'togglePrizePool') {
      const showPrizePool = await BettingService.togglePrizePool(sessionId)
      return NextResponse.json({ success: true, showPrizePool })
    }
    
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('[Betting API] Error updating session:', error)
    return NextResponse.json({ error: 'Failed to update session' }, { status: 500 })
  }
}

// DELETE betting session (admin only)
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { sessionId, walletAddress } = body
    
    // Verify admin wallet
    if (!isAdminWallet(walletAddress)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }
    
    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 })
    }
    
    const success = await BettingService.deleteSession(sessionId)
    if (!success) {
      return NextResponse.json({ error: 'Failed to delete session' }, { status: 400 })
    }
    
    return NextResponse.json({ success: true, message: 'Session deleted' })
  } catch (error) {
    console.error('[Betting API] Error deleting session:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to delete session' 
    }, { status: 500 })
  }
}

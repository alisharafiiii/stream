import { NextRequest, NextResponse } from 'next/server'
import { BettingService } from '@/lib/betting-service'

// GET all bets for a session (admin only)
export async function GET(request: NextRequest) {
  try {
    const sessionId = request.nextUrl.searchParams.get('sessionId')
    const walletAddress = request.nextUrl.searchParams.get('walletAddress')
    
    // Verify admin wallet
    const ADMIN_WALLET = process.env.ADMIN_WALLET || '0xAbD4BB1Ba7C9a57C40598604A7ad0E5d105AD54D'
    if (walletAddress?.toLowerCase() !== ADMIN_WALLET.toLowerCase()) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }
    
    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 })
    }
    
    const allBets = await BettingService.getAllSessionBets(sessionId)
    
    return NextResponse.json(allBets)
  } catch (error) {
    console.error('[Betting API] Error getting all bets:', error)
    return NextResponse.json({ error: 'Failed to get bets' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { BettingService } from '@/lib/betting-service'

// GET betting history
export async function GET(request: NextRequest) {
  try {
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '10')
    
    const history = await BettingService.getBettingHistory(limit)
    
    return NextResponse.json(history)
  } catch (error) {
    console.error('[Betting API] Error getting history:', error)
    return NextResponse.json({ error: 'Failed to get betting history' }, { status: 500 })
  }
}

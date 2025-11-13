import { NextRequest, NextResponse } from 'next/server';
import { BettingService } from '@/lib/betting-service';

// POST resolve game session and distribute payouts
// GET endpoint for fetching payout info for a user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const userId = searchParams.get('userId');

    if (!sessionId || !userId) {
      return NextResponse.json({ 
        error: 'Session ID and user ID are required' 
      }, { status: 400 });
    }

    // Get session data
    const session = await BettingService.getSession(sessionId);
    if (!session || !session.resolvedPayouts) {
      return NextResponse.json({ 
        error: 'Session not resolved or not found' 
      }, { status: 404 });
    }

    // Find user's payout
    const userPayout = session.resolvedPayouts.find((p: { userId: string }) => p.userId === userId);

    return NextResponse.json({
      sessionId,
      winner: session.winner,
      userPayout: userPayout || null,
    });
  } catch (error) {
    console.error('[Game Resolve API] Error getting payout:', error);
    return NextResponse.json({ 
      error: 'Failed to get payout info' 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, winner } = body;
    
    // Validate input
    if (!sessionId || !winner) {
      console.error('❌ Resolve failed: Missing sessionId or winner');
      return NextResponse.json(
        { error: 'Session ID and winner are required' },
        { status: 400 }
      );
    }
    
    if (winner !== 'left' && winner !== 'right') {
      console.error('❌ Resolve failed: Invalid winner value');
      return NextResponse.json(
        { error: 'Winner must be "left" or "right"' },
        { status: 400 }
      );
    }
    
    console.log('🎮 Resolving game session:', sessionId, 'Winner:', winner);
    
    // Use existing betting service to resolve session
    const result = await BettingService.resolveSession(sessionId, winner);
    
    console.log('✅ Session resolved, payouts:', result.payouts.length, 'Service fee:', result.serviceFee);
    
    return NextResponse.json({
      success: true,
      winner,
      payouts: result.payouts,
      serviceFee: result.serviceFee,
    });
  } catch (error) {
    console.error('❌ Failed to resolve game session:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to resolve game session';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}


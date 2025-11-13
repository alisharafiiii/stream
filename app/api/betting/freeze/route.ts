import { NextRequest, NextResponse } from 'next/server';
import { BettingService } from '@/lib/betting-service';

// POST freeze betting for current session
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId } = body;
    
    if (!sessionId) {
      console.error('❌ Freeze failed: No session ID');
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }
    
    console.log('🎮 Freezing betting for session:', sessionId);
    
    // Use existing betting service to freeze (returns boolean)
    const success = await BettingService.freezeBetting(sessionId);
    
    if (!success) {
      console.error('❌ Freeze failed: Session not found or already frozen');
      return NextResponse.json(
        { error: 'Session not found or already frozen' },
        { status: 400 }
      );
    }
    
    console.log('✅ Betting frozen successfully');
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('❌ Failed to freeze betting:', error);
    return NextResponse.json(
      { error: 'Failed to freeze betting' },
      { status: 500 }
    );
  }
}


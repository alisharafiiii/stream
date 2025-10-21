import { NextResponse } from 'next/server'
import { redis } from '@/lib/redis'

const VIEWER_SESSIONS_SET = 'stream:unique_viewers' // Set to track unique viewers

export async function GET() {
  try {
    // Get count of unique viewers from Redis set
    const count = await redis.scard(VIEWER_SESSIONS_SET) || 0
    
    // Return actual count - no fake base viewers
    return NextResponse.json({ viewerCount: count })
  } catch (error) {
    console.error('Failed to get viewer count:', error)
    return NextResponse.json({ viewerCount: 0 }) // Default to 0
  }
}

export async function POST(request: Request) {
  try {
    const { sessionId, action } = await request.json()
    
    // Handle viewer count reset
    if (action === 'reset') {
      await redis.del(VIEWER_SESSIONS_SET)
      return NextResponse.json({ viewerCount: 0, message: 'Viewer count reset' })
    }
    
    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 })
    }
    
    // Add session to set (Redis sets automatically handle uniqueness)
    // No expiration - viewers are counted permanently
    await redis.sadd(VIEWER_SESSIONS_SET, sessionId)
    
    // Get updated count
    const count = await redis.scard(VIEWER_SESSIONS_SET) || 0
    
    return NextResponse.json({ viewerCount: count })
  } catch (error) {
    console.error('Failed to update viewer session:', error)
    return NextResponse.json({ error: 'Failed to update session' }, { status: 500 })
  }
}
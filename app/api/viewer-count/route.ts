import { NextResponse } from 'next/server'
import { redis } from '@/lib/redis'

const VIEWER_SESSION_PREFIX = 'viewer:session:'
const SESSION_TIMEOUT = 120 // 2 minutes - longer timeout
const ACTIVE_VIEWERS_KEY = 'stream:active_viewers'

export async function GET() {
  try {
    // Get the count from a single source of truth
    const count = await redis.get(ACTIVE_VIEWERS_KEY) || 0
    
    // Add base viewers for realism (3-5)
    const baseViewers = 3 + Math.floor(Math.random() * 3) // Random 3-5
    const totalViewers = Number(count) + baseViewers
    
    return NextResponse.json({ viewerCount: totalViewers })
  } catch (error) {
    console.error('Failed to get viewer count:', error)
    return NextResponse.json({ viewerCount: 5 }) // Default fallback
  }
}

export async function POST(request: Request) {
  try {
    const { sessionId } = await request.json()
    
    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 })
    }
    
    // Check if this session already exists
    const sessionKey = `${VIEWER_SESSION_PREFIX}${sessionId}`
    const exists = await redis.exists(sessionKey)
    
    // Update session timestamp
    await redis.setex(sessionKey, SESSION_TIMEOUT, Date.now())
    
    // If this is a new session, increment the counter
    if (!exists) {
      await redis.incr(ACTIVE_VIEWERS_KEY)
    }
    
    // Clean up expired sessions periodically
    const shouldCleanup = Math.random() < 0.1 // 10% chance
    if (shouldCleanup) {
      await cleanupExpiredSessions()
    }
    
    // Get updated count
    const response = await GET()
    return response
  } catch (error) {
    console.error('Failed to update viewer session:', error)
    return NextResponse.json({ error: 'Failed to update session' }, { status: 500 })
  }
}

async function cleanupExpiredSessions() {
  try {
    // Get all session keys
    const pattern = `${VIEWER_SESSION_PREFIX}*`
    const sessions = await redis.keys(pattern)
    
    let expiredCount = 0
    for (const session of sessions) {
      const exists = await redis.exists(session)
      if (!exists) {
        expiredCount++
      }
    }
    
    // Decrement the counter by expired sessions
    if (expiredCount > 0) {
      const current = await redis.get(ACTIVE_VIEWERS_KEY) || 0
      const newCount = Math.max(0, Number(current) - expiredCount)
      await redis.set(ACTIVE_VIEWERS_KEY, newCount)
    }
  } catch (error) {
    console.error('Failed to cleanup sessions:', error)
  }
}
import { NextRequest, NextResponse } from 'next/server'
import { redis, UserProfile } from '@/lib/redis'

// GET all users (admin only)
export async function GET(request: NextRequest) {
  try {
    // Check admin auth
    const walletAddress = request.headers.get('x-wallet-address')
    const ADMIN_WALLET = "0xAbD4BB1Ba7C9a57C40598604A7ad0E5d105AD54D"
    
    if (!walletAddress || walletAddress.toLowerCase() !== ADMIN_WALLET.toLowerCase()) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Get all user profile keys
    const keys = await redis.keys('user:profile:*')
    
    if (!keys || keys.length === 0) {
      return NextResponse.json([])
    }
    
    // Fetch all user profiles
    const users: UserProfile[] = []
    for (const key of keys) {
      const user = await redis.get<UserProfile>(key)
      if (user) {
        users.push(user)
      }
    }
    
    // Sort by creation date (newest first)
    users.sort((a, b) => b.createdAt - a.createdAt)
    
    return NextResponse.json(users)
  } catch (error) {
    console.error('[Users API] Error fetching users:', error)
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
  }
}

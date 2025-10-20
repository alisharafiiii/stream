import { NextRequest, NextResponse } from 'next/server';
import { redis, REDIS_KEYS, UserProfile } from '@/lib/redis';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ fid: string }> }
) {
  try {
    const { fid } = await context.params;
    
    // Get user profile
    const userProfile = await redis.get<UserProfile>(REDIS_KEYS.USER_PROFILE(fid));
    
    if (!userProfile) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Return profile data
    return NextResponse.json(userProfile);
    
  } catch (error) {
    console.error('[API/user/profile] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}

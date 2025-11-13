import { NextResponse } from 'next/server';
import { redis } from '@/lib/redis';

const USERS_KEY = 'v2:users:all';
const USER_KEY_PREFIX = 'v2:user:';

interface WalletUser {
  uid: string;
  fid?: string;
  username: string;
  displayName: string;
  profileImage?: string;
  walletAddress?: string;
  source: 'base_app' | 'browser_wallet' | 'guest';
  connectedAt: number;
  balance: number;
  totalBets: number;
  totalWon: number;
  lastActive: number;
}

// GET all users (for admin)
export async function GET() {
  try {
    const userIds = await redis.smembers(USERS_KEY);
    
    if (!userIds || userIds.length === 0) {
      return NextResponse.json({ users: [] });
    }

    // Fetch all user data
    const users = await Promise.all(
      userIds.map(async (uid) => {
        const userData = await redis.get<WalletUser>(`${USER_KEY_PREFIX}${uid}`);
        return userData;
      })
    );

    return NextResponse.json({ users: users.filter(Boolean) });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

// POST create/update user
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { uid, fid, username, displayName, profileImage, walletAddress, source } = body;

    if (!uid || !username) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if user exists
    const existingUser = await redis.get<WalletUser>(`${USER_KEY_PREFIX}${uid}`);

    const userData: WalletUser = {
      uid,
      fid,
      username,
      displayName,
      profileImage,
      walletAddress,
      source,
      connectedAt: existingUser?.connectedAt || Date.now(),
      balance: existingUser?.balance || 0,
      totalBets: existingUser?.totalBets || 0,
      totalWon: existingUser?.totalWon || 0,
      lastActive: Date.now()
    };

    // Save user data
    await redis.set(`${USER_KEY_PREFIX}${uid}`, userData);
    
    // Add to users set
    await redis.sadd(USERS_KEY, uid);

    return NextResponse.json({ success: true, user: userData });
  } catch (error) {
    console.error('Error saving user:', error);
    return NextResponse.json({ error: 'Failed to save user' }, { status: 500 });
  }
}


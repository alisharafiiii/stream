import { NextRequest, NextResponse } from 'next/server';
import { redis, REDIS_KEYS, UserProfile } from '@/lib/redis';
import { fetchFarcasterProfile } from '@/lib/farcaster-api';

// Extended User interface for API responses
interface User extends Omit<UserProfile, 'createdAt' | 'lastSeen'> {
  createdAt: string;
  updatedAt: string;
}

// Helper to convert UserProfile to User API format
function profileToUser(profile: UserProfile): User {
  return {
    ...profile,
    createdAt: new Date(profile.createdAt).toISOString(),
    updatedAt: new Date(profile.lastSeen).toISOString(),
  };
}

// Wrapper function to adapt the Farcaster API response
async function getFarcasterProfileData(fid: string) {
  const profile = await fetchFarcasterProfile(fid);
  if (!profile) return null;
  
  return {
    username: profile.username,
    displayName: profile.displayName,
    profileImage: profile.pfpUrl || `https://api.dicebear.com/7.x/personas/png?seed=${profile.fid}`,
  };
}

// File system operations disabled for Vercel deployment
// In production, use a database instead

// const USERS_FILE = path.join(process.cwd(), 'data', 'users.json');

// async function ensureDataDir() {
//   const dataDir = path.join(process.cwd(), 'data');
//   try {
//     await fs.access(dataDir);
//   } catch {
//     await fs.mkdir(dataDir, { recursive: true });
//   }
// }

// async function getUsers(): Promise<Record<string, User>> {
//   try {
//     const data = await fs.readFile(USERS_FILE, 'utf-8');
//     return JSON.parse(data);
//   } catch {
//     return {};
//   }
// }

// async function saveUsers(users: Record<string, User>) {
//   await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2));
// }

// Get user profile
export async function GET(request: NextRequest) {
  try {
    const fid = request.nextUrl.searchParams.get('fid');
    if (!fid) {
      return NextResponse.json({ error: 'FID required' }, { status: 400 });
    }

    console.log('[API] Getting user profile for FID:', fid);

    try {
      // Get from Redis
      const profile = await redis.get<UserProfile>(REDIS_KEYS.USER_PROFILE(fid));
      
      if (!profile) {
        console.log('[API] User not found');
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      // Update last seen
      profile.lastSeen = Date.now();
      await redis.set(REDIS_KEYS.USER_PROFILE(fid), profile);

      const userResponse = profileToUser(profile);
      console.log('[API] Returning user with image:', userResponse.profileImage);
      return NextResponse.json(userResponse);
    } catch (error) {
      console.error('[API] Redis error:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }
  } catch (error) {
    console.error('[API] Error getting user:', error);
    return NextResponse.json({ error: 'Failed to get user' }, { status: 500 });
  }
}

// Create or update user profile
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fid, username, displayName, profileImage, balance = 0 } = body;

    console.log('[API] Creating user profile:', { fid, username, displayName });

    if (!fid) {
      console.error('[API] No FID provided');
      return NextResponse.json({ error: 'FID required' }, { status: 400 });
    }

    try {
      // Check if user already exists
      const existingProfile = await redis.get<UserProfile>(REDIS_KEYS.USER_PROFILE(fid));
      
      let finalUsername = username;
      let finalDisplayName = displayName;
      let finalProfileImage = profileImage;

      // If no username/displayName provided, try to fetch from Farcaster
      if (!username || !displayName || !profileImage) {
        console.log('[API] Missing user data, fetching from Farcaster for FID:', fid);
        const farcasterData = await getFarcasterProfileData(fid);
        console.log('[API] Farcaster data received:', farcasterData);
        if (farcasterData) {
          finalUsername = username || farcasterData.username;
          finalDisplayName = displayName || farcasterData.displayName;
          finalProfileImage = profileImage || farcasterData.profileImage;
          console.log('[API] Final profile image after Farcaster fetch:', finalProfileImage);
        }
      }

      const profile: UserProfile = {
        fid,
        username: finalUsername,
        displayName: finalDisplayName,
        profileImage: finalProfileImage || `https://api.dicebear.com/7.x/personas/png?seed=${fid}`,
        balance: existingProfile?.balance || balance || 0,
        createdAt: existingProfile?.createdAt || Date.now(),
        lastSeen: Date.now(),
      };
      
      console.log('[API] Creating profile with image:', profile.profileImage);

      // Save to Redis
      await redis.set(REDIS_KEYS.USER_PROFILE(fid), profile);
      console.log('[API] User saved to Redis');

      return NextResponse.json(profileToUser(profile));
    } catch (error) {
      console.error('[API] Redis error:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }
  } catch (error) {
    console.error('[API] Error creating user:', error);
    return NextResponse.json({ error: 'Failed to save user' }, { status: 500 });
  }
}

// Update user balance
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { fid, amount, type, username, displayName, profileImage, transactionId } = body;

    console.log('[API] Updating balance:', { fid, amount, type, transactionId });

    if (!fid || amount === undefined) {
      return NextResponse.json({ error: 'FID and amount required' }, { status: 400 });
    }

    try {
      // Get existing user
      const profile = await redis.get<UserProfile>(REDIS_KEYS.USER_PROFILE(fid));
      
      if (!profile) {
        console.error('[API] User not found for balance update');
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      // Update balance based on type
      const newBalance = type === 'add' 
        ? (profile.balance + amount)
        : type === 'subtract'
        ? Math.max(0, profile.balance - amount)
        : amount;

      // Update profile
      profile.username = username || profile.username;
      profile.displayName = displayName || profile.displayName;
      profile.profileImage = profileImage || profile.profileImage;
      profile.balance = newBalance;
      profile.lastSeen = Date.now();

      // Save to Redis
      await redis.set(REDIS_KEYS.USER_PROFILE(fid), profile);
      console.log('[API] Updated user saved to Redis');
      
      // Record deposit transaction if type is 'add'
      if (type === 'add' && amount > 0) {
        const deposit = {
          type: 'deposit',
          amount,
          timestamp: Date.now(),
          transactionHash: transactionId || null,
          status: 'completed'
        };
        
        await redis.lpush(`user:deposits:${fid}`, JSON.stringify(deposit));
        console.log('[API] Deposit recorded');
      }

      return NextResponse.json(profileToUser(profile));
    } catch (error) {
      console.error('[API] Redis error:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }
  } catch (error) {
    console.error('[API] Error updating balance:', error);
    return NextResponse.json({ error: 'Failed to update balance' }, { status: 500 });
  }
}

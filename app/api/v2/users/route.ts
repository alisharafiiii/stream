import { NextResponse } from 'next/server';
import { redis } from '@/lib/redis';

const USERS_KEY = 'v2:users:all';
const USER_KEY_PREFIX = 'v2:user:';

// WalletUser interface is used for type consistency but not explicitly referenced
// eslint-disable-next-line @typescript-eslint/no-unused-vars
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
  isBanned?: boolean;
}

// GET all users (for admin)
export async function GET() {
  try {
    const userIds = await redis.smembers(USERS_KEY);
    console.log('Found user IDs:', userIds);
    
    if (!userIds || userIds.length === 0) {
      return NextResponse.json({ users: [] });
    }

    // Fetch all user data
    const users = await Promise.all(
      userIds.map(async (uid) => {
        try {
          // Try hgetall first (new format)
          let userData = await redis.hgetall(`${USER_KEY_PREFIX}${uid}`) as Record<string, string> | null;
          
          // If empty, try get (old format)
          if (!userData || Object.keys(userData).length === 0) {
            const oldData = await redis.get(`${USER_KEY_PREFIX}${uid}`);
            console.log(`Old format data for ${uid}:`, oldData);
            
            // If old format exists, convert it
            if (oldData && typeof oldData === 'object') {
              // Migrate to new format
              await redis.hset(`${USER_KEY_PREFIX}${uid}`, oldData as Record<string, string | number>);
              userData = oldData as Record<string, string>;
            }
          }
          
          if (!userData || !userData.uid) {
            console.log(`No data found for user ${uid}`);
            return null;
          }
          
          return {
            uid: userData.uid,
            fid: userData.fid,
            username: userData.username || 'Unknown',
            displayName: userData.displayName || userData.username || 'Unknown',
            profileImage: userData.profileImage,
            walletAddress: userData.walletAddress,
            source: userData.source as 'base_app' | 'browser_wallet' | 'guest',
            connectedAt: parseInt(userData.connectedAt || '0'),
            balance: parseFloat(userData.balance || '0'),
            totalBets: parseFloat(userData.totalBets || '0'),
            totalWon: parseFloat(userData.totalWon || '0'),
            lastActive: parseInt(userData.lastActive || '0'),
            isBanned: userData.isBanned === 'true'
          };
        } catch (err) {
          console.error(`Error processing user ${uid}:`, err);
          return null;
        }
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

    console.log(`Creating/updating user ${uid} with username ${username}`);

    // Check if user exists - try both hgetall and get for compatibility
    let existingUser = await redis.hgetall(`${USER_KEY_PREFIX}${uid}`) as Record<string, string> | null;
    console.log('Existing user data:', existingUser);
    
    // If no data in hash format, check old format
    if (!existingUser || Object.keys(existingUser).length === 0) {
      const oldData = await redis.get(`${USER_KEY_PREFIX}${uid}`);
      if (oldData && typeof oldData === 'object') {
        existingUser = oldData as Record<string, string>;
      }
    }

    // Only update fields that are provided, keep existing data
    const updateData: Record<string, string | number> = {
      uid,
      username,
      lastActive: Date.now()
    };

    // Update only if provided
    if (fid !== undefined) updateData.fid = fid;
    if (displayName !== undefined) updateData.displayName = displayName;
    if (profileImage !== undefined) updateData.profileImage = profileImage;
    if (walletAddress !== undefined) updateData.walletAddress = walletAddress;
    if (source !== undefined) updateData.source = source;

    // Set defaults for new users
    if (!existingUser || !existingUser.connectedAt) {
      updateData.connectedAt = Date.now();
      updateData.balance = 0;
      updateData.totalBets = 0;
      updateData.totalWon = 0;
      updateData.isBanned = 'false';
    } else {
      // Preserve existing data that shouldn't be overwritten
      if (existingUser.balance !== undefined && updateData.balance === undefined) {
        updateData.balance = existingUser.balance;
      }
      if (existingUser.totalBets !== undefined && updateData.totalBets === undefined) {
        updateData.totalBets = existingUser.totalBets;
      }
      if (existingUser.totalWon !== undefined && updateData.totalWon === undefined) {
        updateData.totalWon = existingUser.totalWon;
      }
      // IMPORTANT: Always preserve ban status unless explicitly updating
      if (existingUser.isBanned !== undefined && updateData.isBanned === undefined) {
        updateData.isBanned = existingUser.isBanned;
      }
    }

    // Save user data
    console.log(`Saving user data for ${uid}:`, updateData);
    await redis.hset(`${USER_KEY_PREFIX}${uid}`, updateData);
    
    // Add to users set
    await redis.sadd(USERS_KEY, uid);

    // Fetch updated user data
    const updatedUser = await redis.hgetall(`${USER_KEY_PREFIX}${uid}`) as Record<string, string>;
    console.log('Updated user data:', updatedUser);

    return NextResponse.json({ 
      success: true, 
      user: {
        uid: updatedUser.uid,
        fid: updatedUser.fid,
        username: updatedUser.username,
        displayName: updatedUser.displayName || updatedUser.username,
        profileImage: updatedUser.profileImage,
        walletAddress: updatedUser.walletAddress,
        source: updatedUser.source as 'base_app' | 'browser_wallet' | 'guest',
        connectedAt: parseInt(updatedUser.connectedAt || '0'),
        balance: parseFloat(updatedUser.balance || '0'),
        totalBets: parseFloat(updatedUser.totalBets || '0'),
        totalWon: parseFloat(updatedUser.totalWon || '0'),
        lastActive: parseInt(updatedUser.lastActive || '0'),
        isBanned: updatedUser.isBanned === 'true'
      }
    });
  } catch (error) {
    console.error('Error saving user:', error);
    return NextResponse.json({ error: 'Failed to save user' }, { status: 500 });
  }
}

// PATCH toggle ban status (for admin)
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { uid, isBanned } = body;

    if (!uid) {
      return NextResponse.json({ error: 'Missing uid' }, { status: 400 });
    }

    console.log(`Updating ban status for ${uid} to ${isBanned}`);

    // Check if user exists
    const existingUser = await redis.hgetall(`${USER_KEY_PREFIX}${uid}`) as Record<string, string> | null;
    
    if (!existingUser || Object.keys(existingUser).length === 0) {
      // Try old format
      const oldData = await redis.get(`${USER_KEY_PREFIX}${uid}`);
      if (!oldData) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
    }

    // Update ban status
    await redis.hset(`${USER_KEY_PREFIX}${uid}`, {
      isBanned: isBanned ? 'true' : 'false'
    });

    // Verify the update
    const updated = await redis.hget(`${USER_KEY_PREFIX}${uid}`, 'isBanned');
    console.log(`Ban status for ${uid} is now: ${updated}`);

    return NextResponse.json({ 
      success: true, 
      uid,
      isBanned,
      actualStatus: updated
    });
  } catch (error) {
    console.error('Error updating ban status:', error);
    return NextResponse.json({ error: 'Failed to update ban status' }, { status: 500 });
  }
}


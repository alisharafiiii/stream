// Farcaster API integration
// Using Neynar API for fetching real Farcaster profiles

interface FarcasterProfile {
  fid: string;
  username: string;
  displayName: string;
  pfpUrl?: string;
  bio?: string;
  followerCount?: number;
  followingCount?: number;
}

const NEYNAR_API_KEY = process.env.NEYNAR_API_KEY;
const NEYNAR_API_URL = 'https://api.neynar.com/v2/farcaster';

console.log('[Farcaster API] NEYNAR_API_KEY:', NEYNAR_API_KEY ? `Configured (${NEYNAR_API_KEY.substring(0, 10)}...)` : 'Not configured');

// Fetch real Farcaster profile data
export async function fetchFarcasterProfile(fid: string): Promise<FarcasterProfile | null> {
  try {
    // Check if FID is a wallet address (starts with 0x)
    if (fid.startsWith('0x')) {
      console.log('[Farcaster API] Wallet address detected, using generated avatar');
      const shortAddress = `${fid.slice(0, 6)}...${fid.slice(-4)}`;
      return {
        fid,
        username: shortAddress,
        displayName: shortAddress,
        pfpUrl: `https://api.dicebear.com/7.x/identicon/svg?seed=${fid}`,
      };
    }
    
    // If no API key is configured, return placeholder data
    if (!NEYNAR_API_KEY || NEYNAR_API_KEY === '') {
      console.warn('[Farcaster API] No NEYNAR_API_KEY configured, using placeholder data');
      return {
        fid,
        username: `user${fid}`,
        displayName: `User ${fid}`,
        pfpUrl: `https://api.dicebear.com/7.x/personas/svg?seed=${fid}`, // Better placeholder
      };
    }

    // Fetch user data from Neynar API (using bulk endpoint)
    const url = `${NEYNAR_API_URL}/user/bulk?fids=${fid}`;
    console.log('[Farcaster API] Fetching:', url);
    
    const response = await fetch(url, {
      headers: {
        'accept': 'application/json',
        'api_key': NEYNAR_API_KEY,
      },
    });

    if (!response.ok) {
      throw new Error(`Neynar API error: ${response.status}`);
    }

    const data = await response.json();
    const users = data.users;

    if (!users || users.length === 0) {
      throw new Error('User not found');
    }
    
    const user = users[0];
    console.log('[Farcaster API] User data:', {
      fid: user.fid,
      username: user.username,
      display_name: user.display_name,
      pfp_url: user.pfp_url,
      pfp: user.pfp
    });

    const result = {
      fid: user.fid.toString(),
      username: user.username,
      displayName: user.display_name || user.username,
      pfpUrl: user.pfp_url || user.pfp?.url,
      bio: user.profile?.bio?.text,
      followerCount: user.follower_count,
      followingCount: user.following_count,
    };
    
    console.log('[Farcaster API] Returning profile with pfpUrl:', result.pfpUrl);
    return result;
  } catch (error) {
    console.error('[Farcaster API] Error fetching profile:', error);
    
    // Return fallback data
    if (fid.startsWith('0x')) {
      // For wallet addresses, use identicon
      const shortAddress = `${fid.slice(0, 6)}...${fid.slice(-4)}`;
      return {
        fid,
        username: shortAddress,
        displayName: shortAddress,
        pfpUrl: `https://api.dicebear.com/7.x/identicon/svg?seed=${fid}`,
      };
    } else {
      // For numeric FIDs, use personas
      return {
        fid,
        username: `user${fid}`,
        displayName: `User ${fid}`,
        pfpUrl: `https://api.dicebear.com/7.x/personas/svg?seed=${fid}`,
      };
    }
  }
}

// Batch fetch multiple profiles (more efficient for admin panel)
export async function fetchFarcasterProfiles(fids: string[]): Promise<Map<string, FarcasterProfile>> {
  const profiles = new Map<string, FarcasterProfile>();
  
  try {
    if (!NEYNAR_API_KEY) {
      // Return placeholder data for all FIDs
      fids.forEach(fid => {
        profiles.set(fid, {
          fid,
          username: `user${fid}`,
          displayName: `User ${fid}`,
          pfpUrl: `https://i.imgur.com/default.png`,
        });
      });
      return profiles;
    }

    // Neynar supports batch fetching up to 100 FIDs at once
    const batchSize = 100;
    for (let i = 0; i < fids.length; i += batchSize) {
      const batch = fids.slice(i, i + batchSize);
      const fidParam = batch.join(',');
      
      const response = await fetch(`${NEYNAR_API_URL}/user/bulk-by-fid?fids=${fidParam}`, {
        headers: {
          'accept': 'application/json',
          'api_key': NEYNAR_API_KEY,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const users = data.users || [];
        
        users.forEach((user: {
          fid: number;
          username: string;
          display_name?: string;
          pfp_url?: string;
          pfp?: { url?: string };
          profile?: { bio?: { text?: string } };
          follower_count?: number;
          following_count?: number;
        }) => {
          profiles.set(user.fid.toString(), {
            fid: user.fid.toString(),
            username: user.username,
            displayName: user.display_name || user.username,
            pfpUrl: user.pfp_url || user.pfp?.url,
            bio: user.profile?.bio?.text,
            followerCount: user.follower_count,
            followingCount: user.following_count,
          });
        });
      }
    }
    
    // Add fallback data for any FIDs that weren't found
    fids.forEach(fid => {
      if (!profiles.has(fid)) {
        profiles.set(fid, {
          fid,
          username: `user${fid}`,
          displayName: `User ${fid}`,
          pfpUrl: `https://i.imgur.com/default.png`,
        });
      }
    });
    
  } catch (error) {
    console.error('[Farcaster API] Error batch fetching profiles:', error);
    
    // Return placeholder data for all FIDs
    fids.forEach(fid => {
      profiles.set(fid, {
        fid,
        username: `user${fid}`,
        displayName: `User ${fid}`,
        pfpUrl: `https://i.imgur.com/default.png`,
      });
    });
  }
  
  return profiles;
}

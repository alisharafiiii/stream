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

// Fetch real Farcaster profile data
export async function fetchFarcasterProfile(fid: string): Promise<FarcasterProfile | null> {
  try {
    // If no API key is configured, return placeholder data
    if (!NEYNAR_API_KEY) {
      console.warn('[Farcaster API] No NEYNAR_API_KEY configured, using placeholder data');
      return {
        fid,
        username: `user${fid}`,
        displayName: `User ${fid}`,
        pfpUrl: `https://i.imgur.com/default.png`, // Default placeholder
      };
    }

    // Fetch user data from Neynar API
    const response = await fetch(`${NEYNAR_API_URL}/user/by-fid?fid=${fid}`, {
      headers: {
        'accept': 'application/json',
        'api_key': NEYNAR_API_KEY,
      },
    });

    if (!response.ok) {
      throw new Error(`Neynar API error: ${response.status}`);
    }

    const data = await response.json();
    const user = data.user;

    if (!user) {
      throw new Error('User not found');
    }

    return {
      fid: user.fid.toString(),
      username: user.username,
      displayName: user.display_name || user.username,
      pfpUrl: user.pfp_url || user.pfp?.url,
      bio: user.profile?.bio?.text,
      followerCount: user.follower_count,
      followingCount: user.following_count,
    };
  } catch (error) {
    console.error('[Farcaster API] Error fetching profile:', error);
    
    // Return fallback data
    return {
      fid,
      username: `user${fid}`,
      displayName: `User ${fid}`,
      pfpUrl: `https://i.imgur.com/default.png`,
    };
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

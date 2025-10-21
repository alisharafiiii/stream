// Base app user profile API
// Since Base app users have profiles separate from Farcaster, we need a way to fetch them

interface BaseAppProfile {
  fid: string;
  username: string;
  displayName: string;
  profileImage?: string;
  basename?: string; // e.g. peymanrn.base.eth
}

/**
 * Fetches a Base app user's profile
 * Note: Base app doesn't currently expose a public API for user profiles
 * This is a placeholder for when/if such an API becomes available
 */
export async function fetchBaseAppProfile(username: string): Promise<BaseAppProfile | null> {
  try {
    // Check if it's a basename (ends with .base.eth)
    if (!username.endsWith('.base.eth')) {
      return null;
    }

    // TODO: When Base app provides a profile API, implement it here
    // For now, we'll store Base app profiles when users authenticate
    // and use the stored data
    
    console.log('[Base App API] Profile API not yet available for:', username);
    
    // Return null to indicate we couldn't fetch from Base app API
    return null;
  } catch (error) {
    console.error('[Base App API] Error fetching Base app profile:', error);
    return null;
  }
}

/**
 * Extracts Base app profile data from authentication context
 * This should be called when users first authenticate through Base app
 */
export function extractBaseAppProfile(context: any): BaseAppProfile | null {
  try {
    // The Base app context might have profile data in various formats
    // We need to check multiple possible locations
    
    const user = context?.user;
    if (!user) return null;

    // Log the entire context to understand its structure
    console.log('[Base App Profile] Full context:', JSON.stringify(context, null, 2));
    
    // Try to extract profile data from various possible locations
    const profileData: BaseAppProfile = {
      fid: String(user.fid || user.id || ''),
      username: user.username || user.basename || '',
      displayName: user.displayName || user.display_name || user.name || user.username || '',
      basename: user.basename || (user.username?.endsWith('.base.eth') ? user.username : undefined),
      profileImage: 
        user.profileImage || 
        user.profile_image || 
        user.profilePicture || 
        user.profile_picture ||
        user.avatar || 
        user.avatarUrl || 
        user.avatar_url ||
        user.pfp || 
        user.pfpUrl || 
        user.pfp_url ||
        user.image ||
        user.imageUrl ||
        user.image_url ||
        (context.profileImage) ||
        (context.profile_image) ||
        (context.avatar) ||
        (context.pfp) ||
        undefined
    };

    // Only return if we have valid data
    if (profileData.fid && profileData.username) {
      console.log('[Base App Profile] Extracted profile:', profileData);
      return profileData;
    }

    return null;
  } catch (error) {
    console.error('[Base App Profile] Error extracting profile:', error);
    return null;
  }
}

/**
 * Stores Base app profile data for later retrieval
 * This should be called when users authenticate with custom profile data
 */
export async function storeBaseAppProfile(profile: BaseAppProfile): Promise<void> {
  try {
    // Store in Redis with a specific key pattern for Base app profiles
    const { redis, REDIS_KEYS } = await import('./redis');
    
    const key = `base_app_profile:${profile.username}`;
    await redis.set(key, profile);
    
    console.log('[Base App Profile] Stored profile for:', profile.username);
  } catch (error) {
    console.error('[Base App Profile] Error storing profile:', error);
  }
}

/**
 * Retrieves stored Base app profile data
 */
export async function getStoredBaseAppProfile(username: string): Promise<BaseAppProfile | null> {
  try {
    const { redis } = await import('./redis');
    
    const key = `base_app_profile:${username}`;
    const profile = await redis.get<BaseAppProfile>(key);
    
    if (profile) {
      console.log('[Base App Profile] Retrieved stored profile for:', username);
    }
    
    return profile;
  } catch (error) {
    console.error('[Base App Profile] Error retrieving stored profile:', error);
    return null;
  }
}

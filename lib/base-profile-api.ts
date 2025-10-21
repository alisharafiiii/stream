// Base app profile handling
// Base app users have their own profile system separate from Farcaster

interface BaseProfile {
  fid: string;
  username: string;
  displayName: string;
  profileImage?: string;
}

/**
 * Handles Base app profile data
 * Base app profiles come with their own profile pictures uploaded through Base app
 */
export async function handleBaseProfile(authData: any): Promise<BaseProfile | null> {
  try {
    // When users authenticate through Base app, they provide profile data
    if (authData.profileImage && !authData.profileImage.includes('dicebear')) {
      console.log('[Base Profile] User has custom Base app profile picture:', authData.profileImage);
      return {
        fid: authData.fid,
        username: authData.username,
        displayName: authData.displayName || authData.username,
        profileImage: authData.profileImage
      };
    }
    
    // If no custom profile image from Base app, return null to use fallback
    return null;
  } catch (error) {
    console.error('[Base Profile] Error handling Base profile:', error);
    return null;
  }
}

/**
 * Determines if a user is a Base app user based on their username
 */
export function isBaseAppUser(username: string): boolean {
  return username?.endsWith('.base.eth') || false;
}

/**
 * Gets the appropriate profile image for a user
 * Priority: Base app profile > Farcaster profile > Dicebear fallback
 */
export function getProfileImageUrl(
  user: {
    fid: string;
    username?: string;
    profileImage?: string;
  },
  farcasterImage?: string
): string {
  // 1. If user has a custom profile image (from Base app), use it
  if (user.profileImage && 
      !user.profileImage.includes('dicebear') && 
      !user.profileImage.includes('imgur.com/default')) {
    return user.profileImage;
  }
  
  // 2. If we have a Farcaster profile image, use it
  if (farcasterImage && 
      !farcasterImage.includes('dicebear') && 
      !farcasterImage.includes('imgur.com/default')) {
    return farcasterImage;
  }
  
  // 3. Fallback to dicebear based on user type
  if (user.fid.startsWith('0x')) {
    // Wallet address - use identicon
    return `https://api.dicebear.com/7.x/identicon/png?seed=${user.fid}`;
  } else {
    // Base app or Farcaster user - use personas
    return `https://api.dicebear.com/7.x/personas/png?seed=${user.fid}`;
  }
}

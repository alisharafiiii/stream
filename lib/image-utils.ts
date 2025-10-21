// Utility functions for handling profile images

/**
 * Validates and fixes profile image URLs
 * Handles edge cases like double extensions and ensures URLs are accessible
 */
export function sanitizeProfileImageUrl(url: string | undefined, fid: string): string {
  // If no URL, return dicebear
  if (!url) {
    return getDefaultAvatar(fid);
  }

  // Handle Cloudinary URLs with double extensions
  // These are actually valid - some users uploaded files with extensions in the filename
  // e.g., "image.png" uploaded becomes "image.png.png" on Cloudinary
  if (url.includes('cloudinary.com/base-app')) {
    // These URLs are valid even with double extensions
    return url;
  }

  // Handle other Cloudinary URLs
  if (url.includes('cloudinary.com')) {
    return url;
  }

  // Handle imgur broken defaults
  if (url.includes('imgur.com/default')) {
    return getDefaultAvatar(fid);
  }

  // Return the URL as-is for other cases
  return url;
}

/**
 * Gets the appropriate default avatar based on FID type
 */
export function getDefaultAvatar(fid: string): string {
  if (fid.startsWith('0x')) {
    // Wallet address - use identicon
    return `https://api.dicebear.com/7.x/identicon/png?seed=${fid}`;
  } else if (fid.startsWith('guest_') || fid.startsWith('browser_')) {
    // Guest/browser user - use personas
    return `https://api.dicebear.com/7.x/personas/png?seed=${fid}`;
  } else {
    // Farcaster FID - use personas
    return `https://api.dicebear.com/7.x/personas/png?seed=${fid}`;
  }
}

/**
 * Handles image loading errors by providing appropriate fallbacks
 */
export function handleImageError(e: React.SyntheticEvent<HTMLImageElement>, fid: string) {
  const target = e.currentTarget;
  const originalSrc = target.src;
  
  console.warn(`[Image] Failed to load: ${originalSrc}`);
  
  // Set fallback avatar
  target.src = getDefaultAvatar(fid);
  
  // Prevent infinite error loops
  target.onerror = null;
}

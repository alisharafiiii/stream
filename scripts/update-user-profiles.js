#!/usr/bin/env node

// Script to batch update all user profiles with real Farcaster data via Neynar API
// This will fetch real usernames, display names, and profile pictures

const { Redis } = require('@upstash/redis');

// Initialize Redis
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || 'https://lucky-kangaroo-5978.upstash.io',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || 'ARdaAAImcDJmNTY0NmViMTU2MWI0MmEwOWU0OTczMzBjNzQ1NjllN3AyNTk3OA',
});

// Neynar API configuration
const NEYNAR_API_KEY = process.env.NEYNAR_API_KEY || 'AE9247C3-7112-4923-836C-621E7AE4417D';
const NEYNAR_API_URL = 'https://api.neynar.com/v2/farcaster';

async function fetchFarcasterProfiles(fids) {
  const profiles = new Map();
  
  try {
    // Neynar supports batch fetching up to 100 FIDs at once
    const batchSize = 100;
    for (let i = 0; i < fids.length; i += batchSize) {
      const batch = fids.slice(i, i + batchSize);
      const fidParam = batch.join(',');
      
      console.log(`📡 Fetching batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(fids.length/batchSize)} (${batch.length} users)...`);
      
      const response = await fetch(`${NEYNAR_API_URL}/user/bulk-by-fid?fids=${fidParam}`, {
        headers: {
          'accept': 'application/json',
          'api_key': NEYNAR_API_KEY,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const users = data.users || [];
        
        users.forEach((user) => {
          profiles.set(user.fid.toString(), {
            fid: user.fid.toString(),
            username: user.username,
            displayName: user.display_name || user.username,
            pfpUrl: user.pfp_url || user.pfp?.url,
          });
        });
        
        console.log(`✅ Found ${users.length} profiles in this batch`);
      } else {
        console.log(`❌ Failed to fetch batch: ${response.status} ${response.statusText}`);
      }
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  } catch (error) {
    console.error('❌ Error fetching profiles:', error);
  }
  
  return profiles;
}

async function updateUserProfiles() {
  try {
    console.log('🔍 Fetching all users from database...\n');
    
    // Get all user profile keys
    const keys = await redis.keys('user:profile:*');
    console.log(`Found ${keys.length} users in database\n`);
    
    // Collect all users and their FIDs
    const users = [];
    const validFids = [];
    
    for (const key of keys) {
      const user = await redis.get(key);
      if (user && user.fid) {
        users.push({ key, user });
        // Only add numeric FIDs (not wallet addresses)
        if (/^\d+$/.test(user.fid)) {
          validFids.push(user.fid);
        }
      }
    }
    
    console.log(`Found ${validFids.length} Farcaster users (excluding ${users.length - validFids.length} wallet users)\n`);
    
    if (validFids.length === 0) {
      console.log('No Farcaster users to update');
      return;
    }
    
    // Fetch real profiles from Neynar
    console.log('🌐 Fetching real profiles from Farcaster via Neynar API...\n');
    const farcasterProfiles = await fetchFarcasterProfiles(validFids);
    
    console.log(`\n📊 Retrieved ${farcasterProfiles.size} real profiles\n`);
    
    // Update users with real data
    let updatedCount = 0;
    let skippedCount = 0;
    
    for (const { key, user } of users) {
      // Skip wallet users
      if (!/^\d+$/.test(user.fid)) {
        console.log(`⏭️  Skipping wallet user: ${user.displayName} (${user.fid})`);
        skippedCount++;
        continue;
      }
      
      const farcasterProfile = farcasterProfiles.get(user.fid);
      
      if (farcasterProfile) {
        const oldData = {
          username: user.username,
          displayName: user.displayName,
          profileImage: user.profileImage
        };
        
        // Update with real data
        user.username = farcasterProfile.username || user.username;
        user.displayName = farcasterProfile.displayName || user.displayName;
        user.profileImage = farcasterProfile.pfpUrl || user.profileImage;
        
        // Save updated profile
        await redis.set(key, user);
        
        console.log(`✅ Updated ${user.displayName} (${user.fid}):`);
        console.log(`   Username: ${oldData.username} → ${user.username}`);
        console.log(`   Display: ${oldData.displayName} → ${user.displayName}`);
        console.log(`   Picture: ${oldData.profileImage?.includes('dicebear') ? 'placeholder' : 'custom'} → ${user.profileImage?.includes('imgur') ? 'default' : 'real'}\n`);
        
        updatedCount++;
      } else {
        console.log(`❓ No Farcaster profile found for: ${user.displayName} (${user.fid})`);
      }
    }
    
    console.log(`\n✨ Summary:`);
    console.log(`   - Updated: ${updatedCount} profiles`);
    console.log(`   - Skipped: ${skippedCount} wallet users`);
    console.log(`   - Not found: ${validFids.length - updatedCount} users`);
    console.log(`\n✅ Profile update complete!`);
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Run the script
updateUserProfiles();

/*
To run this script:

1. From the project directory:
   cd /Users/nabu/stream
   node scripts/update-user-profiles.js

This will:
- Fetch all users from Redis
- Batch fetch their real Farcaster profiles via Neynar API
- Update usernames, display names, and profile pictures
- Show before/after for each update
- Skip wallet users (those with addresses instead of FIDs)
*/

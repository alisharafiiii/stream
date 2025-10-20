#!/usr/bin/env node

// Script to batch update user profiles using FREE Farcaster Hub API
// This uses the public hub.farcaster.xyz endpoint which is free

const { Redis } = require('@upstash/redis');

// Initialize Redis
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || 'https://lucky-kangaroo-5978.upstash.io',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || 'ARdaAAImcDJmNTY0NmViMTU2MWI0MmEwOWU0OTczMzBjNzQ1NjllN3AyNTk3OA',
});

// Free Farcaster Hub API endpoint
const HUB_API_URL = 'https://hub.pinata.cloud/v1';

async function fetchUserDataFromHub(fid) {
  try {
    // Fetch user data from the free Hub API
    const response = await fetch(`${HUB_API_URL}/userDataByFid?fid=${fid}&user_data_type=6`, {
      headers: {
        'accept': 'application/json',
      },
    });

    if (response.ok) {
      const data = await response.json();
      if (data.messages && data.messages.length > 0) {
        const message = data.messages[0];
        return {
          username: message.data?.userDataBody?.value || null
        };
      }
    }
    return null;
  } catch (error) {
    console.error(`Error fetching user ${fid}:`, error.message);
    return null;
  }
}

async function fetchProfileFromWarpcast(username) {
  try {
    // Use Warpcast's public API to get profile data
    const response = await fetch(`https://api.warpcast.com/v2/user-by-username?username=${username}`, {
      headers: {
        'accept': 'application/json',
      },
    });

    if (response.ok) {
      const data = await response.json();
      if (data.result && data.result.user) {
        const user = data.result.user;
        return {
          displayName: user.displayName || user.username,
          profileImage: user.pfp?.url || null,
          bio: user.profile?.bio?.text || null
        };
      }
    }
    return null;
  } catch (error) {
    console.error(`Error fetching Warpcast profile for ${username}:`, error.message);
    return null;
  }
}

async function updateUserProfiles() {
  try {
    console.log('🔍 FREE Profile Update Script\n');
    console.log('Using public APIs (no API key required):\n');
    console.log('- Farcaster Hub API (hub.pinata.cloud)\n');
    console.log('- Warpcast Public API\n');
    console.log('='.repeat(50) + '\n');
    
    // Get all user profile keys
    const keys = await redis.keys('user:profile:*');
    console.log(`Found ${keys.length} users in database\n`);
    
    // Collect all users
    const users = [];
    let farcasterUsers = 0;
    
    for (const key of keys) {
      const user = await redis.get(key);
      if (user && user.fid) {
        users.push({ key, user });
        // Count Farcaster users (numeric FIDs)
        if (/^\d+$/.test(user.fid)) {
          farcasterUsers++;
        }
      }
    }
    
    console.log(`Processing ${farcasterUsers} Farcaster users...\n`);
    
    let updatedCount = 0;
    let skippedCount = 0;
    let processedCount = 0;
    
    for (const { key, user } of users) {
      // Skip wallet users
      if (!/^\d+$/.test(user.fid)) {
        skippedCount++;
        continue;
      }
      
      processedCount++;
      process.stdout.write(`\r⏳ Processing user ${processedCount}/${farcasterUsers}...`);
      
      // First, try to get username from Hub
      const hubData = await fetchUserDataFromHub(user.fid);
      
      if (hubData && hubData.username) {
        // Then fetch full profile from Warpcast
        const warpcastData = await fetchProfileFromWarpcast(hubData.username);
        
        if (warpcastData) {
          const oldData = {
            username: user.username,
            displayName: user.displayName,
            profileImage: user.profileImage
          };
          
          // Update with real data
          user.username = hubData.username;
          user.displayName = warpcastData.displayName || user.displayName;
          user.profileImage = warpcastData.profileImage || user.profileImage;
          
          // Save updated profile
          await redis.set(key, user);
          
          console.log(`\n✅ Updated ${user.displayName} (${user.fid}):`);
          console.log(`   Username: ${oldData.username} → ${user.username}`);
          console.log(`   Display: ${oldData.displayName} → ${user.displayName}`);
          console.log(`   Picture: ${oldData.profileImage ? 'yes' : 'no'} → ${user.profileImage ? 'yes' : 'no'}\n`);
          
          updatedCount++;
        }
      }
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log(`\n\n✨ Summary:`);
    console.log(`   - Updated: ${updatedCount} profiles`);
    console.log(`   - Skipped: ${skippedCount} wallet users`);
    console.log(`   - Not found: ${farcasterUsers - updatedCount} users`);
    console.log(`\n✅ Profile update complete!`);
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Alternative simple test function
async function testSingleUser() {
  console.log('\n📡 Testing with nabu.base.eth (FID 348569)...\n');
  
  // Test Hub API
  const hubData = await fetchUserDataFromHub(348569);
  console.log('Hub API Result:', hubData);
  
  if (hubData && hubData.username) {
    // Test Warpcast API
    const warpcastData = await fetchProfileFromWarpcast(hubData.username);
    console.log('\nWarpcast API Result:', warpcastData);
  }
}

// Check command line arguments
const args = process.argv.slice(2);
if (args[0] === 'test') {
  testSingleUser();
} else {
  updateUserProfiles();
}

/*
To run this script:

1. Test with a single user:
   cd /Users/nabu/stream
   node scripts/update-profiles-hub.js test

2. Update all users:
   cd /Users/nabu/stream
   node scripts/update-profiles-hub.js

This uses FREE public APIs:
- Farcaster Hub API (no key required)
- Warpcast public endpoints
*/

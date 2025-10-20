import { Redis } from '@upstash/redis';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Initialize Redis
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

// Neynar API config
const NEYNAR_API_KEY = process.env.NEYNAR_API_KEY || 'NEYNAR_API_DOCS';
const NEYNAR_API_URL = 'https://api.neynar.com/v2/farcaster';

async function checkImageLoads(url) {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch (error) {
    return false;
  }
}

async function fetchFarcasterProfile(fid) {
  try {
    // Skip wallet addresses
    if (fid.startsWith('0x')) {
      return null;
    }

    const url = `${NEYNAR_API_URL}/user/bulk?fids=${fid}`;
    const response = await fetch(url, {
      headers: {
        'accept': 'application/json',
        'api_key': NEYNAR_API_KEY,
      },
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    const users = data.users;

    if (!users || users.length === 0) {
      return null;
    }

    const user = users[0];
    return {
      fid: user.fid.toString(),
      username: user.username,
      displayName: user.display_name || user.username,
      pfpUrl: user.pfp_url || user.pfp?.url,
    };
  } catch (error) {
    console.error(`Error fetching Farcaster profile for ${fid}:`, error.message);
    return null;
  }
}

async function checkAllUsers() {
  console.log('🔍 Checking all user profile pictures...\n');
  
  // Get all user profiles
  const keys = await redis.keys('user:profile:*');
  console.log(`Found ${keys.length} users in the database\n`);

  const stats = {
    total: 0,
    walletUsers: 0,
    farcasterUsers: 0,
    workingPfps: 0,
    brokenPfps: 0,
    noImage: 0,
    farcasterProfiles: 0,
    placeholderProfiles: 0,
  };

  const brokenUsers = [];
  const sampleUsers = [];

  for (const key of keys) {
    stats.total++;
    
    // Get user profile from Redis
    const profile = await redis.get(key);
    if (!profile) continue;

    const fid = key.replace('user:profile:', '');
    const isWallet = fid.startsWith('0x');
    
    if (isWallet) {
      stats.walletUsers++;
    } else {
      stats.farcasterUsers++;
    }

    // Check if image loads
    if (profile.profileImage) {
      const imageWorks = await checkImageLoads(profile.profileImage);
      
      if (imageWorks) {
        stats.workingPfps++;
      } else {
        stats.brokenPfps++;
        brokenUsers.push({
          fid,
          username: profile.username,
          profileImage: profile.profileImage,
          isWallet,
        });
      }

      // Check if it's a placeholder or real Farcaster image
      if (profile.profileImage.includes('dicebear.com')) {
        stats.placeholderProfiles++;
      } else if (profile.profileImage.includes('imagedelivery.net') || profile.profileImage.includes('i.imgur.com')) {
        stats.farcasterProfiles++;
      }
    } else {
      stats.noImage++;
    }

    // Collect sample users
    if (sampleUsers.length < 5) {
      sampleUsers.push({
        fid,
        username: profile.username,
        profileImage: profile.profileImage,
        isWallet,
      });
    }
  }

  // Print report
  console.log('📊 PROFILE PICTURE REPORT');
  console.log('========================\n');
  
  console.log(`Total Users: ${stats.total}`);
  console.log(`├─ Wallet Users: ${stats.walletUsers}`);
  console.log(`└─ Farcaster Users: ${stats.farcasterUsers}\n`);
  
  console.log(`Profile Pictures:`);
  console.log(`├─ ✅ Working: ${stats.workingPfps} (${((stats.workingPfps / stats.total) * 100).toFixed(1)}%)`);
  console.log(`├─ ❌ Broken: ${stats.brokenPfps} (${((stats.brokenPfps / stats.total) * 100).toFixed(1)}%)`);
  console.log(`└─ ❓ No Image: ${stats.noImage}\n`);
  
  console.log(`Image Types:`);
  console.log(`├─ 🎭 Real Farcaster: ${stats.farcasterProfiles}`);
  console.log(`└─ 🤖 Placeholders: ${stats.placeholderProfiles}\n`);

  if (brokenUsers.length > 0) {
    console.log('❌ BROKEN PROFILE PICTURES:');
    console.log('==========================');
    brokenUsers.slice(0, 10).forEach(user => {
      console.log(`\nFID: ${user.fid}`);
      console.log(`Username: ${user.username}`);
      console.log(`Type: ${user.isWallet ? 'Wallet' : 'Farcaster'}`);
      console.log(`Image URL: ${user.profileImage}`);
    });
    if (brokenUsers.length > 10) {
      console.log(`\n... and ${brokenUsers.length - 10} more broken images`);
    }
  }

  console.log('\n📸 SAMPLE USERS:');
  console.log('================');
  sampleUsers.forEach(user => {
    console.log(`\nFID: ${user.fid}`);
    console.log(`Username: ${user.username}`);
    console.log(`Type: ${user.isWallet ? 'Wallet' : 'Farcaster'}`);
    console.log(`Image: ${user.profileImage || 'No image'}`);
  });

  // Try to fetch real Farcaster profiles for numeric FIDs
  if (stats.farcasterUsers > 0 && NEYNAR_API_KEY) {
    console.log('\n🔄 ATTEMPTING TO FETCH REAL FARCASTER PROFILES...');
    console.log('================================================\n');
    
    let updated = 0;
    let failed = 0;
    
    for (const key of keys) {
      const fid = key.replace('user:profile:', '');
      if (fid.startsWith('0x')) continue; // Skip wallet users
      
      const profile = await redis.get(key);
      if (!profile) continue;
      
      // Skip if already has a real Farcaster image
      if (profile.profileImage && !profile.profileImage.includes('dicebear.com')) {
        continue;
      }
      
      const farcasterProfile = await fetchFarcasterProfile(fid);
      if (farcasterProfile && farcasterProfile.pfpUrl) {
        // Update the profile with real data
        profile.username = farcasterProfile.username;
        profile.displayName = farcasterProfile.displayName;
        profile.profileImage = farcasterProfile.pfpUrl;
        
        await redis.set(key, profile);
        updated++;
        
        console.log(`✅ Updated ${fid}: ${farcasterProfile.username} - ${farcasterProfile.pfpUrl}`);
      } else {
        failed++;
      }
      
      // Rate limit protection
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log(`\n✅ Successfully updated: ${updated} profiles`);
    console.log(`❌ Failed to update: ${failed} profiles`);
  }

  process.exit(0);
}

checkAllUsers().catch(console.error);

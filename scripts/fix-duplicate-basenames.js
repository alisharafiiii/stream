import { Redis } from '@upstash/redis';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

async function fixDuplicateBasenames() {
  console.log('🔍 Searching for users with duplicate .base.eth in their names...\n');
  
  try {
    // Get all user profile keys
    const keys = await redis.keys('user:profile:*');
    console.log(`Found ${keys.length} user profiles to check\n`);
    
    let fixedCount = 0;
    const duplicateUsers = [];
    
    for (const key of keys) {
      const profile = await redis.get(key);
      if (!profile) continue;
      
      // Check if username has duplicate .base.eth
      if (profile.username && profile.username.includes('.base.eth.base.eth')) {
        duplicateUsers.push({
          key,
          fid: profile.fid,
          originalUsername: profile.username,
          displayName: profile.displayName
        });
      }
    }
    
    console.log(`Found ${duplicateUsers.length} users with duplicate .base.eth\n`);
    
    // Fix each user
    for (const user of duplicateUsers) {
      console.log(`\n🔧 Fixing user: ${user.fid}`);
      console.log(`  Original username: ${user.originalUsername}`);
      
      // Remove duplicate .base.eth
      const fixedUsername = user.originalUsername.replace(/\.base\.eth\.base\.eth/g, '.base.eth');
      console.log(`  Fixed username: ${fixedUsername}`);
      
      // Update the profile
      const profile = await redis.get(user.key);
      if (profile) {
        profile.username = fixedUsername;
        
        // Also fix displayName if it has the same issue
        if (profile.displayName && profile.displayName.includes('.base.eth.base.eth')) {
          profile.displayName = profile.displayName.replace(/\.base\.eth\.base\.eth/g, '.base.eth');
          console.log(`  Also fixed displayName: ${profile.displayName}`);
        }
        
        await redis.set(user.key, profile);
        fixedCount++;
        console.log(`  ✅ Updated successfully`);
      }
    }
    
    console.log(`\n✨ Summary:`);
    console.log(`  - Total users checked: ${keys.length}`);
    console.log(`  - Users with duplicate .base.eth: ${duplicateUsers.length}`);
    console.log(`  - Users fixed: ${fixedCount}`);
    
    // Show some examples
    if (duplicateUsers.length > 0) {
      console.log(`\n📋 Examples of fixed users:`);
      duplicateUsers.slice(0, 5).forEach(user => {
        console.log(`  - ${user.originalUsername} → ${user.originalUsername.replace(/\.base\.eth\.base\.eth/g, '.base.eth')}`);
      });
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the fix
fixDuplicateBasenames();

import { Redis } from '@upstash/redis';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

// Manual mapping of known Base app users with their profile pictures
// These would normally come from Base app authentication
const BASE_APP_PROFILES = {
  // Add known Base app users with custom profile pictures here
  // Format: 'username': 'profile_image_url'
  // Example: 'molion.base.eth': 'https://base-app-profile-url...'
};

async function restoreBaseProfiles() {
  console.log('🔍 Looking for Base app users to restore profiles...\n');
  
  const keys = await redis.keys('user:profile:*');
  let baseUsersCount = 0;
  let restoredCount = 0;
  
  for (const key of keys) {
    const profile = await redis.get(key);
    
    // Check if this is a Base app user (username ends with .base.eth)
    if (profile?.username?.endsWith('.base.eth')) {
      baseUsersCount++;
      
      // Check if they have a dicebear placeholder
      if (profile.profileImage?.includes('dicebear.com')) {
        console.log(`\n📱 Base app user with placeholder: ${profile.username}`);
        console.log(`  FID: ${profile.fid}`);
        console.log(`  Current image: ${profile.profileImage}`);
        
        // Check if we have a known profile picture for this user
        if (BASE_APP_PROFILES[profile.username]) {
          profile.profileImage = BASE_APP_PROFILES[profile.username];
          await redis.set(key, profile);
          console.log(`  ✅ Restored custom profile picture!`);
          restoredCount++;
        } else {
          console.log(`  ⚠️  No custom profile picture found in mapping`);
        }
      }
    }
  }
  
  console.log(`\n📊 Summary:`);
  console.log(`  Total Base app users: ${baseUsersCount}`);
  console.log(`  Users restored: ${restoredCount}`);
  console.log(`\n💡 Note: To properly fix this, Base app users need to re-authenticate`);
  console.log(`   so their custom profile pictures can be captured from the Base app.`);
}

restoreBaseProfiles();

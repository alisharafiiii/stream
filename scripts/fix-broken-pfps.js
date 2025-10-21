import { Redis } from '@upstash/redis';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

async function fixBrokenProfilePictures() {
  console.log('🔍 Scanning for broken profile pictures...\n');
  
  try {
    const keys = await redis.keys('user:profile:*');
    console.log(`Found ${keys.length} user profiles to check\n`);
    
    let brokenCount = 0;
    let fixedCount = 0;
    
    for (const key of keys) {
      const profile = await redis.get(key);
      if (!profile) continue;
      
      // Check if profile image is broken imgur link or missing
      if (!profile.profileImage || 
          profile.profileImage.includes('imgur.com/default') ||
          profile.profileImage === '') {
        
        brokenCount++;
        console.log(`\n❌ Broken profile for ${profile.fid}:`);
        console.log(`   Username: ${profile.username}`);
        console.log(`   Current image: ${profile.profileImage || 'NONE'}`);
        
        // Fix with appropriate dicebear avatar
        let newImage;
        if (profile.fid.startsWith('0x')) {
          // Wallet address - use identicon
          newImage = `https://api.dicebear.com/7.x/identicon/png?seed=${profile.fid}`;
        } else {
          // Farcaster FID - use personas
          newImage = `https://api.dicebear.com/7.x/personas/png?seed=${profile.fid}`;
        }
        
        profile.profileImage = newImage;
        await redis.set(key, profile);
        
        console.log(`   ✅ Fixed with: ${newImage}`);
        fixedCount++;
      }
    }
    
    console.log(`\n📊 Summary:`);
    console.log(`   Total profiles: ${keys.length}`);
    console.log(`   Broken images: ${brokenCount}`);
    console.log(`   Fixed: ${fixedCount}`);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

fixBrokenProfilePictures();

import { Redis } from '@upstash/redis';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

// The correct URLs from Warpcast API (with double extensions)
const correctUrls = {
  '387490': 'https://res.cloudinary.com/base-app/image/upload/f_auto/v1760747710/1000106696.png.png',
  '897064': 'https://res.cloudinary.com/base-app/image/upload/f_auto/v1760991847/IMG_9536.png.png',
  '981560': 'https://res.cloudinary.com/base-app/image/upload/f_auto/v1760630677/92d0804998d4213130d4fe5e8bc41582.jpg.jpg'
};

async function restoreCloudinaryUrls() {
  console.log('🔄 Restoring correct Cloudinary URLs...\n');
  
  for (const [fid, url] of Object.entries(correctUrls)) {
    const key = `user:profile:${fid}`;
    const profile = await redis.get(key);
    
    if (profile) {
      console.log(`Restoring ${profile.username} (${fid}):`);
      console.log(`  Current: ${profile.profileImage}`);
      console.log(`  Correct: ${url}`);
      
      profile.profileImage = url;
      await redis.set(key, profile);
      console.log('  ✅ Restored!\n');
    }
  }
  
  console.log('✨ URLs restored successfully!');
}

restoreCloudinaryUrls();

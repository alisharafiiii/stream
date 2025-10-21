import { Redis } from '@upstash/redis';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

async function fixCloudinaryUrls() {
  console.log('🔍 Fixing Cloudinary URLs with double extensions...\n');
  
  const keys = await redis.keys('user:profile:*');
  let fixedCount = 0;
  
  for (const key of keys) {
    const profile = await redis.get(key);
    if (!profile?.profileImage) continue;
    
    // Check for double extensions
    const url = profile.profileImage;
    if (url.includes('cloudinary.com') && 
        (url.endsWith('.jpg.jpg') || url.endsWith('.png.png') || url.endsWith('.jpeg.jpeg'))) {
      
      console.log(`\n🔧 Fixing ${profile.username} (${profile.fid}):`);
      console.log(`   Old URL: ${url}`);
      
      // Remove the duplicate extension
      let fixedUrl = url;
      if (url.endsWith('.jpg.jpg')) {
        fixedUrl = url.slice(0, -4); // Remove last .jpg
      } else if (url.endsWith('.png.png')) {
        fixedUrl = url.slice(0, -4); // Remove last .png
      } else if (url.endsWith('.jpeg.jpeg')) {
        fixedUrl = url.slice(0, -5); // Remove last .jpeg
      }
      
      console.log(`   New URL: ${fixedUrl}`);
      
      // Update the profile
      profile.profileImage = fixedUrl;
      await redis.set(key, profile);
      fixedCount++;
    }
  }
  
  console.log(`\n✅ Fixed ${fixedCount} Cloudinary URLs with double extensions`);
  
  // Also check for any Cloudinary URLs that might be broken
  console.log('\n🔍 Checking all Cloudinary URLs for accessibility...\n');
  
  const cloudinaryProfiles = [];
  for (const key of keys) {
    const profile = await redis.get(key);
    if (profile?.profileImage?.includes('cloudinary.com')) {
      cloudinaryProfiles.push({ key, profile });
    }
  }
  
  console.log(`Found ${cloudinaryProfiles.length} profiles with Cloudinary URLs`);
  
  // Test each URL
  for (const { key, profile } of cloudinaryProfiles) {
    try {
      const response = await fetch(profile.profileImage, { method: 'HEAD' });
      if (!response.ok) {
        console.log(`\n❌ Broken Cloudinary URL for ${profile.username} (${profile.fid}):`);
        console.log(`   Status: ${response.status}`);
        console.log(`   URL: ${profile.profileImage}`);
        
        // Replace with dicebear
        const newImage = profile.fid.startsWith('0x') 
          ? `https://api.dicebear.com/7.x/identicon/png?seed=${profile.fid}`
          : `https://api.dicebear.com/7.x/personas/png?seed=${profile.fid}`;
        
        profile.profileImage = newImage;
        await redis.set(key, profile);
        console.log(`   ✅ Replaced with: ${newImage}`);
      }
    } catch (error) {
      console.log(`\n⚠️  Error checking ${profile.username}: ${error.message}`);
    }
  }
  
  console.log('\n✨ Cloudinary URL fix complete!');
}

fixCloudinaryUrls();

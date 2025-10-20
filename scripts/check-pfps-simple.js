const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL || 'https://lucky-kangaroo-5978.upstash.io';
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

if (!UPSTASH_TOKEN) {
  console.error('❌ UPSTASH_REDIS_REST_TOKEN environment variable is required');
  console.log('Please run with: UPSTASH_REDIS_REST_TOKEN=your-token node scripts/check-pfps-simple.js');
  process.exit(1);
}

async function fetchFromUpstash(command, args = []) {
  const body = [command, ...args];
  const response = await fetch(`${UPSTASH_URL}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${UPSTASH_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  
  if (!response.ok) {
    throw new Error(`Upstash error: ${response.status}`);
  }
  
  const data = await response.json();
  return data.result;
}

async function checkImageLoads(url) {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch (error) {
    return false;
  }
}

async function checkAllUsers() {
  console.log('🔍 Checking all user profile pictures...\n');
  
  try {
    // Get all user profile keys
    const keys = await fetchFromUpstash('KEYS', ['user:profile:*']);
    console.log(`Found ${keys.length} users in the database\n`);

    const stats = {
      total: 0,
      walletUsers: 0,
      farcasterUsers: 0,
      workingPfps: 0,
      brokenPfps: 0,
      noImage: 0,
      svgImages: 0,
      pngImages: 0,
    };

    const brokenUsers = [];
    let sampleOutput = '\n📸 SAMPLE USERS:\n================\n';
    let samplesShown = 0;

    for (const key of keys) {
      stats.total++;
      
      // Get user profile
      const profileStr = await fetchFromUpstash('GET', [key]);
      if (!profileStr) continue;
      
      const profile = JSON.parse(profileStr);
      const fid = key.replace('user:profile:', '');
      const isWallet = fid.startsWith('0x');
      
      if (isWallet) {
        stats.walletUsers++;
      } else {
        stats.farcasterUsers++;
      }

      // Show first 5 samples
      if (samplesShown < 5) {
        sampleOutput += `\nFID: ${fid}\n`;
        sampleOutput += `Username: ${profile.username}\n`;
        sampleOutput += `Type: ${isWallet ? 'Wallet' : 'Farcaster'}\n`;
        sampleOutput += `Image: ${profile.profileImage || 'No image'}\n`;
        samplesShown++;
      }

      // Check image format and loading
      if (profile.profileImage) {
        const isSvg = profile.profileImage.includes('/svg?');
        const isPng = profile.profileImage.includes('/png?');
        
        if (isSvg) stats.svgImages++;
        if (isPng) stats.pngImages++;
        
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
            format: isSvg ? 'SVG' : isPng ? 'PNG' : 'Other',
          });
        }
      } else {
        stats.noImage++;
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
    
    console.log(`Image Formats:`);
    console.log(`├─ 🖼️ SVG: ${stats.svgImages}`);
    console.log(`└─ 🖼️ PNG: ${stats.pngImages}\n`);

    if (brokenUsers.length > 0) {
      console.log('❌ BROKEN PROFILE PICTURES:');
      console.log('==========================');
      brokenUsers.slice(0, 10).forEach(user => {
        console.log(`\nFID: ${user.fid}`);
        console.log(`Username: ${user.username}`);
        console.log(`Type: ${user.isWallet ? 'Wallet' : 'Farcaster'}`);
        console.log(`Format: ${user.format}`);
        console.log(`Image URL: ${user.profileImage}`);
      });
      if (brokenUsers.length > 10) {
        console.log(`\n... and ${brokenUsers.length - 10} more broken images`);
      }
    }

    console.log(sampleOutput);

    // Summary
    console.log('\n🎯 SUMMARY:');
    console.log('===========');
    if (stats.svgImages > 0) {
      console.log(`⚠️  Found ${stats.svgImages} users still using SVG format (should be PNG)`);
      console.log('   These need to be updated to PNG format to work properly.');
    }
    if (stats.brokenPfps === 0) {
      console.log('✅ All profile pictures are loading successfully!');
    } else {
      console.log(`❌ ${stats.brokenPfps} profile pictures are broken and need fixing.`);
    }

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkAllUsers();

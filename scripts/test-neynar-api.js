#!/usr/bin/env node

// Test script to check Neynar API status and fetch a single profile

const NEYNAR_API_KEY = process.env.NEYNAR_API_KEY || 'AE9247C3-7112-4923-836C-621E7AE4417D';
const NEYNAR_API_URL = 'https://api.neynar.com/v2/farcaster';

async function testNeynarAPI() {
  console.log('🔍 Testing Neynar API...\n');
  console.log(`API Key: ${NEYNAR_API_KEY.substring(0, 8)}...${NEYNAR_API_KEY.substring(NEYNAR_API_KEY.length - 4)}\n`);
  
  // Test 1: Fetch a single known user (nabu.base.eth - FID 348569)
  console.log('📡 Test 1: Fetching single user (nabu.base.eth - FID 348569)...');
  try {
    const response = await fetch(`${NEYNAR_API_URL}/user/by-fid?fid=348569`, {
      headers: {
        'accept': 'application/json',
        'api_key': NEYNAR_API_KEY,
      },
    });
    
    console.log(`Response Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const data = await response.json();
      const user = data.user;
      console.log('✅ Success! User data:');
      console.log(`   Username: ${user.username}`);
      console.log(`   Display Name: ${user.display_name}`);
      console.log(`   Profile Picture: ${user.pfp_url || user.pfp?.url || 'None'}`);
      console.log(`   Bio: ${user.profile?.bio?.text || 'None'}`);
      console.log(`   Followers: ${user.follower_count}`);
      console.log(`   Following: ${user.following_count}`);
    } else {
      const errorData = await response.text();
      console.log('❌ Failed:', errorData);
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // Test 2: Try a smaller bulk request (just 3 users)
  console.log('📡 Test 2: Fetching small bulk (3 users)...');
  try {
    const fids = '348569,1131027,1088162'; // nabu, Navid, Pouya
    const response = await fetch(`${NEYNAR_API_URL}/user/bulk-by-fid?fids=${fids}`, {
      headers: {
        'accept': 'application/json',
        'api_key': NEYNAR_API_KEY,
      },
    });
    
    console.log(`Response Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const data = await response.json();
      const users = data.users || [];
      console.log(`✅ Success! Found ${users.length} users:`);
      users.forEach(user => {
        console.log(`   - ${user.username} (${user.display_name})`);
      });
    } else {
      const errorData = await response.text();
      console.log('❌ Failed:', errorData);
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // Test 3: Check API usage/limits
  console.log('📡 Test 3: Checking API usage (if available)...');
  try {
    // Note: This endpoint might not exist, but worth trying
    const response = await fetch(`${NEYNAR_API_URL}/me`, {
      headers: {
        'accept': 'application/json',
        'api_key': NEYNAR_API_KEY,
      },
    });
    
    console.log(`Response Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('API Account Info:', JSON.stringify(data, null, 2));
    } else {
      console.log('ℹ️  No usage endpoint available');
    }
  } catch (error) {
    console.log('ℹ️  No usage endpoint available');
  }
  
  console.log('\n' + '='.repeat(50) + '\n');
  console.log('📌 Summary:');
  console.log('   - If getting 402 errors, the API key may need a paid plan');
  console.log('   - Free tier might have limits on bulk endpoints');
  console.log('   - Consider using individual fetches with rate limiting');
  console.log('   - Or upgrade to a paid Neynar plan for bulk operations');
}

// Run the test
testNeynarAPI();

/*
To run this script:
   cd /Users/nabu/stream
   node scripts/test-neynar-api.js
*/

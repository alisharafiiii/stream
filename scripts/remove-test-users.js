#!/usr/bin/env node

// Script to remove test/demo users from the database

const { Redis } = require('@upstash/redis');

// Initialize Redis
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || 'https://lucky-kangaroo-5978.upstash.io',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || 'ARdaAAImcDJmNTY0NmViMTU2MWI0MmEwOWU0OTczMzBjNzQ1NjllN3AyNTk3OA',
});

async function removeTestUsers() {
  try {
    console.log('🧹 Removing Test/Demo Users\n');
    console.log('This will remove users with names like:');
    console.log('- Test User XXXXX');
    console.log('- Demo User XXXXX');
    console.log('- testuser/demo prefixed usernames\n');
    console.log('='.repeat(50) + '\n');
    
    // Get all user profile keys
    const keys = await redis.keys('user:profile:*');
    console.log(`Found ${keys.length} total users\n`);
    
    let removedCount = 0;
    let keptCount = 0;
    const removedUsers = [];
    
    for (const key of keys) {
      const user = await redis.get(key);
      if (!user) continue;
      
      // Check if this is a test/demo user
      const isTestUser = (
        user.displayName?.startsWith('Test User') ||
        user.displayName?.startsWith('Demo User') ||
        user.username?.startsWith('testuser') ||
        user.username?.startsWith('demo') ||
        user.displayName?.includes('fid:') || // Generic names like "fid: 786694"
        user.displayName?.includes('{username}') // Template names
      );
      
      if (isTestUser) {
        console.log(`🗑️  Removing: ${user.displayName} (${user.fid}) - @${user.username}`);
        
        // Delete all related keys for this user
        await redis.del(key); // Profile
        await redis.del(`user:betting:stats:${user.fid}`); // Betting stats
        await redis.del(`user:withdrawals:${user.fid}`); // Withdrawals
        
        removedUsers.push({
          fid: user.fid,
          displayName: user.displayName,
          username: user.username
        });
        removedCount++;
      } else {
        keptCount++;
      }
    }
    
    console.log(`\n✅ Cleanup Complete!\n`);
    console.log(`📊 Summary:`);
    console.log(`   - Removed: ${removedCount} test/demo users`);
    console.log(`   - Kept: ${keptCount} real users`);
    console.log(`   - New total: ${keptCount} users`);
    
    if (removedCount > 0) {
      console.log(`\n📋 Removed Users List:`);
      removedUsers.forEach(u => {
        console.log(`   - ${u.displayName} (@${u.username}) - FID: ${u.fid}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Run the script
removeTestUsers();

/*
To run this script:
   cd /Users/nabu/stream
   node scripts/remove-test-users.js

This will permanently remove all test/demo users from the database.
*/

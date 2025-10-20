#!/usr/bin/env node

// Script to clear ALL user balances to $0
// USE WITH CAUTION - This will reset everyone to $0

const { Redis } = require('@upstash/redis');

// Initialize Redis
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || 'https://lucky-kangaroo-5978.upstash.io',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || 'ARdaAAImcDJmNTY0NmViMTU2MWI0MmEwOWU0OTczMzBjNzQ1NjllN3AyNTk3OA',
});

async function clearAllBalances() {
  try {
    console.log('⚠️  WARNING: This will reset ALL user balances to $0\n');
    console.log('🔍 Scanning for all users...\n');
    
    // Get all user profile keys
    const keys = await redis.keys('user:profile:*');
    console.log(`Found ${keys.length} users total\n`);
    
    let clearedCount = 0;
    
    for (const key of keys) {
      const user = await redis.get(key);
      if (!user) continue;
      
      const oldBalance = user.balance || 0;
      
      if (oldBalance > 0) {
        console.log(`❌ Clearing balance for ${user.displayName} (${user.fid}): $${oldBalance} → $0`);
        
        // Reset balance to 0
        user.balance = 0;
        await redis.set(key, user);
        clearedCount++;
      } else {
        console.log(`✅ ${user.displayName} (${user.fid}) already has $0 balance`);
      }
    }
    
    console.log(`\n🧹 Cleared ${clearedCount} user balances`);
    console.log('✅ All users now have $0 balance!');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Run the script
clearAllBalances();

/*
To run this script:

1. From the project directory:
   cd /Users/nabu/stream
   node scripts/clear-all-balances.js

This will:
- Find ALL users
- Set their balance to $0
- Show before/after for each user
*/

#!/usr/bin/env node

// Script to reset balances for users who have no real transactions
// This will set their balance to 0 if they only have the initial $10

const { Redis } = require('@upstash/redis');

// Initialize Redis
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || 'https://lucky-kangaroo-5978.upstash.io',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || 'ARdaAAImcDJmNTY0NmViMTU2MWI0MmEwOWU0OTczMzBjNzQ1NjllN3AyNTk3OA',
});

async function resetFakeBalances() {
  try {
    console.log('🔍 Scanning for users with fake balances...\n');
    
    // Get all user profile keys
    const keys = await redis.keys('user:profile:*');
    console.log(`Found ${keys.length} users total\n`);
    
    let resetCount = 0;
    
    for (const key of keys) {
      const user = await redis.get(key);
      if (!user) continue;
      
      // Check if user has any transaction history
      const fid = user.fid;
      
      // Check for deposits
      const deposits = await redis.lrange(`user:deposits:${fid}`, 0, -1);
      
      // Check for withdrawals
      const withdrawals = await redis.lrange(`user:withdrawals:${fid}`, 0, -1);
      
      // Check for betting history
      const bettingKeys = await redis.keys(`betting:session:*:user:${fid}`);
      
      // If user has no real transactions and balance is exactly 10
      if (deposits.length === 0 && withdrawals.length === 0 && bettingKeys.length === 0 && user.balance === 10) {
        console.log(`❌ Resetting fake balance for ${user.displayName} (${fid}): $${user.balance} → $0`);
        
        // Reset balance to 0
        user.balance = 0;
        await redis.set(key, user);
        resetCount++;
      } else if (user.balance > 0) {
        console.log(`✅ Keeping balance for ${user.displayName} (${fid}): $${user.balance} (has transactions)`);
      }
    }
    
    console.log(`\n✨ Reset ${resetCount} fake balances`);
    console.log('✅ Done!');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Run the script
resetFakeBalances();

/*
To run this script:

1. First, set your environment variables:
   export UPSTASH_REDIS_REST_URL="your-redis-url"
   export UPSTASH_REDIS_REST_TOKEN="your-redis-token"

2. Install dependencies:
   npm install @upstash/redis

3. Run the script:
   node scripts/reset-fake-balances.js

This will:
- Find all users with exactly $10 balance
- Check if they have any real transactions
- Reset balance to $0 if they have no transactions
- Keep balance if they have any real activity
*/

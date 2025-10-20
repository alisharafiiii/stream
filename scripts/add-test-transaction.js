const { Redis } = require('@upstash/redis');
require('dotenv').config({ path: '.env.local' });

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN
});

async function addTestTransaction() {
  const fid = '348569'; // User with existing bets
  
  // Add a test deposit
  const deposit = {
    type: 'deposit',
    amount: 5.00,
    timestamp: Date.now(),
    transactionHash: '0xtest123',
    status: 'completed'
  };
  
  await redis.lpush(`user:deposits:${fid}`, JSON.stringify(deposit));
  console.log(`Added test deposit for user ${fid}`);
  
  // Also update user balance
  const profile = await redis.get(`user:profile:${fid}`);
  if (profile) {
    profile.balance = (profile.balance || 0) + 5.00;
    await redis.set(`user:profile:${fid}`, profile);
    console.log(`Updated user balance to ${profile.balance}`);
  }
}

addTestTransaction();

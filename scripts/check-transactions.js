const { Redis } = require('@upstash/redis');
require('dotenv').config({ path: '.env.local' });

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN
});

async function checkTransactionData() {
  console.log('=== Checking Transaction Data ===');
  
  try {
    // 1. Check current betting session
    const currentSessionId = await redis.get('betting:current');
    console.log('\n1. Current Session ID:', currentSessionId || 'None');
    
    if (currentSessionId) {
      const session = await redis.get(`betting:session:${currentSessionId}`);
      console.log('   Current Session:', session ? 'Found' : 'Not found');
    }
    
    // 2. Check betting history
    const historyIds = await redis.lrange('betting:history', 0, -1);
    console.log('\n2. Historical Sessions:', historyIds.length);
    if (historyIds.length > 0) {
      console.log('   Recent session IDs:', historyIds.slice(0, 3));
    }
    
    // 3. Check user profiles
    const profileKeys = await redis.keys('user:profile:*');
    console.log('\n3. User Profiles:', profileKeys.length);
    if (profileKeys.length > 0) {
      console.log('   Sample users:', profileKeys.slice(0, 3));
      
      // Check first user's data
      const firstUserKey = profileKeys[0];
      const fid = firstUserKey.split(':')[2];
      const profile = await redis.get(firstUserKey);
      console.log(`\n4. User ${fid}:`, {
        balance: profile?.balance,
        username: profile?.username
      });
      
      // Check this user's transactions
      console.log(`\n5. Checking transactions for user ${fid}:`);
      
      // Check deposits
      const deposits = await redis.lrange(`user:deposits:${fid}`, 0, -1);
      console.log('   Deposits:', deposits.length);
      
      // Check withdrawals
      const withdrawals = await redis.lrange(`user:withdrawals:${fid}`, 0, -1);
      console.log('   Withdrawals:', withdrawals.length);
      
      // Check current session bets
      if (currentSessionId) {
        const userBets = await redis.get(`betting:bets:${currentSessionId}:${fid}`);
        console.log('   Current session bets:', userBets ? 'Yes' : 'No');
      }
      
      // Check historical bets
      for (const sessionId of historyIds.slice(0, 3)) {
        const userBets = await redis.get(`betting:bets:${sessionId}:${fid}`);
        if (userBets) {
          console.log(`   Historical bets in ${sessionId}:`, userBets);
        }
      }
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkTransactionData();

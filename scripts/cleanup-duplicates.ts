import * as dotenv from 'dotenv';
import { Redis } from '@upstash/redis';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Initialize Redis client
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const USERS_KEY = 'v2:users:all';
const USER_KEY_PREFIX = 'v2:user:';

async function cleanupDuplicates() {
  try {
    console.log('Starting duplicate cleanup...');
    
    // Get all user IDs
    const userIds = await redis.smembers(USERS_KEY);
    console.log(`Found ${userIds.length} total users`);
    
    // Group users by FID/wallet
    const usersByIdentifier = new Map<string, Array<{
      uid: string;
      data: any;
    }>>();
    
    // Fetch all user data
    for (const uid of userIds) {
      let userData: any;
      
      try {
        // Try hgetall first (new format)
        userData = await redis.hgetall(`${USER_KEY_PREFIX}${uid}`) as any;
        if (!userData || Object.keys(userData).length === 0) {
          // Try get (old format)
          userData = await redis.get(`${USER_KEY_PREFIX}${uid}`) as any;
        }
      } catch (error) {
        // If hgetall fails, try get
        try {
          userData = await redis.get(`${USER_KEY_PREFIX}${uid}`) as any;
        } catch {
          console.log(`Failed to read ${uid}, removing from set`);
          await redis.srem(USERS_KEY, uid);
          continue;
        }
      }
      
      if (!userData || !userData.uid) {
        console.log(`No data for ${uid}, removing from set`);
        await redis.srem(USERS_KEY, uid);
        continue;
      }
      
      // Determine identifier (FID for base_app, wallet address for browser)
      let identifier = '';
      if (userData.source === 'base_app' && userData.fid) {
        identifier = `base_${userData.fid}`;
      } else if (userData.walletAddress) {
        identifier = `wallet_${userData.walletAddress.toLowerCase()}`;
      } else {
        identifier = uid; // Fallback
      }
      
      if (!usersByIdentifier.has(identifier)) {
        usersByIdentifier.set(identifier, []);
      }
      
      usersByIdentifier.get(identifier)!.push({
        uid,
        data: {
          ...userData,
          connectedAt: parseInt(userData.connectedAt || '0'),
          lastActive: parseInt(userData.lastActive || '0'),
          balance: parseFloat(userData.balance || '0'),
          totalBets: parseFloat(userData.totalBets || '0'),
          totalWon: parseFloat(userData.totalWon || '0')
        }
      });
    }
    
    // Process duplicates
    let removedCount = 0;
    for (const [identifier, users] of usersByIdentifier) {
      if (users.length > 1) {
        console.log(`\nFound ${users.length} duplicates for ${identifier}`);
        
        // Sort by lastActive (most recent first)
        users.sort((a, b) => b.data.lastActive - a.data.lastActive);
        
        // Keep the most recent one
        const keepUser = users[0];
        console.log(`Keeping user: ${keepUser.uid} (lastActive: ${new Date(keepUser.data.lastActive).toISOString()})`);
        
        // Merge important data from duplicates
        let mergedBalance = keepUser.data.balance;
        let mergedTotalBets = keepUser.data.totalBets;
        let mergedTotalWon = keepUser.data.totalWon;
        let isBanned = keepUser.data.isBanned === 'true';
        
        // Remove duplicates and merge their data
        for (let i = 1; i < users.length; i++) {
          const dupUser = users[i];
          console.log(`Removing duplicate: ${dupUser.uid}`);
          
          // Merge balances and stats
          mergedBalance = Math.max(mergedBalance, dupUser.data.balance);
          mergedTotalBets += dupUser.data.totalBets;
          mergedTotalWon += dupUser.data.totalWon;
          
          // Keep banned status if any duplicate was banned
          if (dupUser.data.isBanned === 'true') {
            isBanned = true;
          }
          
          // Delete duplicate user data
          await redis.del(`${USER_KEY_PREFIX}${dupUser.uid}`);
          await redis.srem(USERS_KEY, dupUser.uid);
          removedCount++;
        }
        
        // Update the kept user with merged data
        const newUid = identifier; // Use clean identifier as new UID
        
        if (keepUser.uid !== newUid) {
          console.log(`Migrating ${keepUser.uid} to ${newUid}`);
          
          // Copy data to new UID
          await redis.hset(`${USER_KEY_PREFIX}${newUid}`, {
            ...keepUser.data,
            uid: newUid,
            balance: mergedBalance,
            totalBets: mergedTotalBets,
            totalWon: mergedTotalWon,
            isBanned: isBanned ? 'true' : 'false'
          });
          
          // Add new UID to set
          await redis.sadd(USERS_KEY, newUid);
          
          // Remove old UID
          await redis.del(`${USER_KEY_PREFIX}${keepUser.uid}`);
          await redis.srem(USERS_KEY, keepUser.uid);
        } else {
          // Just update with merged data
          await redis.hset(`${USER_KEY_PREFIX}${newUid}`, {
            balance: mergedBalance,
            totalBets: mergedTotalBets,
            totalWon: mergedTotalWon,
            isBanned: isBanned ? 'true' : 'false'
          });
        }
      }
    }
    
    console.log(`\nCleanup complete! Removed ${removedCount} duplicate users`);
    
    // Show final user count
    const finalUserIds = await redis.smembers(USERS_KEY);
    console.log(`Final user count: ${finalUserIds.length}`);
    
  } catch (error) {
    console.error('Error during cleanup:', error);
  }
}

// Run the cleanup
cleanupDuplicates().then(() => process.exit(0));

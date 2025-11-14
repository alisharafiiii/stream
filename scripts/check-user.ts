import * as dotenv from 'dotenv';
import { Redis } from '@upstash/redis';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Initialize Redis client
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

async function checkUser(uid: string) {
  console.log(`Checking user: ${uid}`);
  
  // Try hgetall
  try {
    const hashData = await redis.hgetall(`v2:user:${uid}`);
    console.log('Hash data:', hashData);
  } catch (e) {
    console.log('Failed to get hash data:', e);
  }
  
  // Try get
  try {
    const jsonData = await redis.get(`v2:user:${uid}`);
    console.log('JSON data:', jsonData);
  } catch (e) {
    console.log('Failed to get JSON data:', e);
  }
  
  // Check specific field
  try {
    const isBanned = await redis.hget(`v2:user:${uid}`, 'isBanned');
    console.log('isBanned field:', isBanned);
  } catch (e) {
    console.log('Failed to get isBanned field:', e);
  }
}

const uid = process.argv[2] || 'test_user_123';
checkUser(uid).then(() => process.exit(0));

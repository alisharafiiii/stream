import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || 'https://lucky-kangaroo-5978.upstash.io',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || ''
});

async function resetViewerCount() {
  try {
    // Reset the active viewers counter
    await redis.set('stream:active_viewers', 0);
    
    // Clean up all viewer sessions
    const pattern = 'viewer:session:*';
    const sessions = await redis.keys(pattern);
    
    if (sessions.length > 0) {
      console.log(`Found ${sessions.length} viewer sessions, removing...`);
      for (const session of sessions) {
        await redis.del(session);
      }
    }
    
    console.log('✅ Viewer count reset successfully');
  } catch (error) {
    console.error('❌ Error resetting viewer count:', error);
  }
}

resetViewerCount();
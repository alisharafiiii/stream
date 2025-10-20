#!/usr/bin/env node

// Script to reset viewer count

const { Redis } = require('@upstash/redis');

// Initialize Redis
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || 'https://lucky-kangaroo-5978.upstash.io',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || 'ARdaAAImcDJmNTY0NmViMTU2MWI0MmEwOWU0OTczMzBjNzQ1NjllN3AyNTk3OA',
});

async function resetViewerCount() {
  try {
    console.log('🧹 Resetting viewer count...\n');
    
    // Delete the active viewers counter
    await redis.del('stream:active_viewers');
    
    // Delete all viewer sessions
    const sessions = await redis.keys('viewer:session:*');
    console.log(`Found ${sessions.length} viewer sessions`);
    
    for (const session of sessions) {
      await redis.del(session);
    }
    
    console.log('\n✅ Viewer count reset complete!');
    console.log('Next viewers will start fresh from base count (4) + active sessions');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Run the script
resetViewerCount();

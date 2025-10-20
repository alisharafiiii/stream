import { NextResponse } from 'next/server';
import { redis, REDIS_KEYS } from '@/lib/redis';

export async function GET() {
  try {
    // Test Redis connection
    const testKey = 'test:connection';
    const testValue = { test: true, timestamp: Date.now() };
    
    // Try to set a value
    await redis.set(testKey, testValue);
    
    // Try to get it back
    const retrieved = await redis.get(testKey);
    
    // Get stream config
    const streamConfig = await redis.get(REDIS_KEYS.STREAM_CONFIG());
    
    // Clean up test key
    await redis.del(testKey);
    
    return NextResponse.json({
      status: 'connected',
      testWrite: 'success',
      testRead: retrieved,
      streamConfig: streamConfig || 'No stream config found',
      redisUrl: process.env.UPSTASH_REDIS_REST_URL ? 'Set' : 'Not set',
      redisToken: process.env.UPSTASH_REDIS_REST_TOKEN ? 'Set' : 'Not set'
    });
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      redisUrl: process.env.UPSTASH_REDIS_REST_URL ? 'Set' : 'Not set',
      redisToken: process.env.UPSTASH_REDIS_REST_TOKEN ? 'Set' : 'Not set'
    });
  }
}

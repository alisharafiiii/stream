import { NextRequest, NextResponse } from 'next/server';
import { redis, REDIS_KEYS } from '@/lib/redis';

interface StreamConfig {
  streamUrl: string;
  isLive: boolean;
  title: string;
  updatedAt?: string;
}

// Get stream configuration
export async function GET() {
  try {
    // Try to get from Redis
    const config = await redis.get<StreamConfig>(REDIS_KEYS.STREAM_CONFIG());
    
    if (config) {
      return NextResponse.json(config);
    }
    
    // If not in Redis, return defaults
    const defaultConfig: StreamConfig = {
      streamUrl: process.env.DEFAULT_STREAM_URL || '',
      isLive: process.env.DEFAULT_STREAM_LIVE === 'true' || false,
      title: process.env.DEFAULT_STREAM_TITLE || 'Live Stream'
    };
    
    // Save defaults to Redis for next time
    await redis.set(REDIS_KEYS.STREAM_CONFIG(), defaultConfig);
    
    return NextResponse.json(defaultConfig);
  } catch (error) {
    console.error('[Stream Config API] Error reading config:', error);
    
    // Fallback to defaults if Redis fails
    const fallbackConfig: StreamConfig = {
      streamUrl: process.env.DEFAULT_STREAM_URL || '',
      isLive: false,
      title: process.env.DEFAULT_STREAM_TITLE || 'Live Stream'
    };
    
    return NextResponse.json(fallbackConfig);
  }
}

// Update stream configuration (protected by wallet check)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { streamUrl, isLive, title, walletAddress } = body;

    console.log('[API] Updating stream config:', { streamUrl, isLive, title });

    // Verify admin wallet
    const ADMIN_WALLET = process.env.ADMIN_WALLET || '0xAbD4BB1Ba7C9a57C40598604A7ad0E5d105AD54D';
    if (walletAddress?.toLowerCase() !== ADMIN_WALLET.toLowerCase()) {
      console.error('[API] Unauthorized wallet:', walletAddress);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Update config
    const config: StreamConfig = {
      streamUrl: streamUrl || '',
      isLive: Boolean(isLive),
      title: title || 'Live Stream',
      updatedAt: new Date().toISOString()
    };

    // Save to Redis
    await redis.set(REDIS_KEYS.STREAM_CONFIG(), config);
    console.log('[API] Stream config saved to Redis:', config);

    return NextResponse.json({ success: true, config });
  } catch (error) {
    console.error('[API] Error updating config:', error);
    return NextResponse.json({ error: 'Failed to update configuration' }, { status: 500 });
  }
}
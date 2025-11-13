import { NextResponse } from 'next/server';
import { redis } from '@/lib/redis';

const STREAM_KEY = 'v2:stream:config';

interface StreamConfig {
  url: string;
  isLive: boolean;
  updatedAt: number;
}

// GET current stream config
export async function GET() {
  try {
    const config = await redis.get<StreamConfig>(STREAM_KEY);
    
    if (!config) {
      // Default config
      return NextResponse.json({
        url: 'https://www.youtube.com/live/aeFydtug4-w?si=oI3I894G2-Iw6OSj',
        isLive: true,
        updatedAt: Date.now(),
      });
    }

    return NextResponse.json(config);
  } catch (error) {
    console.error('Error fetching stream config:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stream config' },
      { status: 500 }
    );
  }
}

// POST update stream config
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { url, isLive } = body;

    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { error: 'Invalid URL' },
        { status: 400 }
      );
    }

    const config: StreamConfig = {
      url,
      isLive: isLive ?? true,
      updatedAt: Date.now(),
    };

    await redis.set(STREAM_KEY, config);

    return NextResponse.json({ success: true, config });
  } catch (error) {
    console.error('Error updating stream config:', error);
    return NextResponse.json(
      { error: 'Failed to update stream config' },
      { status: 500 }
    );
  }
}

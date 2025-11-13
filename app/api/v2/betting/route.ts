import { NextResponse } from 'next/server';
import { redis } from '@/lib/redis';

const BETTING_KEY = 'v2:betting:round';

interface BettingOption {
  name: string;
  color: string;
  multiplier: number;
}

interface BettingRound {
  question: string;
  options: BettingOption[];
  isBettingOpen: boolean;
  updatedAt: number;
}

// GET current betting round
export async function GET() {
  try {
    const round = await redis.get<BettingRound>(BETTING_KEY);
    
    if (!round) {
      // Default config
      return NextResponse.json({
        question: 'WHO WILL WIN?',
        options: [
          { name: 'OPTION 1', color: '#FF0000', multiplier: 2 },
          { name: 'OPTION 2', color: '#0000FF', multiplier: 2 }
        ],
        isBettingOpen: true,
        updatedAt: Date.now(),
      });
    }

    return NextResponse.json(round);
  } catch (error) {
    console.error('Error fetching betting round:', error);
    return NextResponse.json(
      { error: 'Failed to fetch betting round' },
      { status: 500 }
    );
  }
}

// POST update betting round
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { question, options, isBettingOpen } = body;

    if (!question || !options || !Array.isArray(options)) {
      return NextResponse.json(
        { error: 'Invalid data' },
        { status: 400 }
      );
    }

    const round: BettingRound = {
      question: question.toUpperCase(),
      options: options.map(opt => ({
        name: opt.name.toUpperCase(),
        color: opt.color,
        multiplier: opt.multiplier || options.length // Default multiplier
      })),
      isBettingOpen: isBettingOpen ?? true,
      updatedAt: Date.now(),
    };

    await redis.set(BETTING_KEY, round);

    return NextResponse.json({ success: true, round });
  } catch (error) {
    console.error('Error updating betting round:', error);
    return NextResponse.json(
      { error: 'Failed to update betting round' },
      { status: 500 }
    );
  }
}


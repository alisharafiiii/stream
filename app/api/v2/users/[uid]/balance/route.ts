import { NextResponse } from 'next/server';
import { redis } from '@/lib/redis';

const USER_KEY_PREFIX = 'v2:user:';

interface WalletUser {
  uid: string;
  balance: number;
  lastActive?: number;
  totalBets?: number;
  totalWon?: number;
  fid?: string;
  username?: string;
  displayName?: string;
  profileImage?: string;
  walletAddress?: string;
  source?: string;
  connectedAt?: number;
}

// GET user balance
export async function GET(
  request: Request,
  { params }: { params: Promise<{ uid: string }> }
) {
  try {
    const { uid } = await params;
    
    const userData = await redis.get<WalletUser>(`${USER_KEY_PREFIX}${uid}`);
    
    if (!userData) {
      return NextResponse.json({ balance: 0 });
    }

    return NextResponse.json({ balance: userData.balance || 0 });
  } catch (error) {
    console.error('Error fetching balance:', error);
    return NextResponse.json({ error: 'Failed to fetch balance' }, { status: 500 });
  }
}

// POST update balance (for deposit/withdraw)
export async function POST(
  request: Request,
  { params }: { params: Promise<{ uid: string }> }
) {
  try {
    const { uid } = await params;
    const body = await request.json();
    const { amount, type } = body; // type: 'deposit' | 'withdraw'

    const userData = await redis.get<WalletUser>(`${USER_KEY_PREFIX}${uid}`);
    
    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    let newBalance = userData.balance || 0;
    
    if (type === 'deposit') {
      newBalance += amount;
    } else if (type === 'withdraw') {
      if (newBalance < amount) {
        return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 });
      }
      newBalance -= amount;
    }

    userData.balance = newBalance;
    userData.lastActive = Date.now();

    await redis.set(`${USER_KEY_PREFIX}${uid}`, userData);

    return NextResponse.json({ success: true, balance: newBalance });
  } catch (error) {
    console.error('Error updating balance:', error);
    return NextResponse.json({ error: 'Failed to update balance' }, { status: 500 });
  }
}


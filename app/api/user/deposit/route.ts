import { NextRequest, NextResponse } from 'next/server';
import { redis, REDIS_KEYS, UserProfile } from '@/lib/redis';
import { depositVerification } from '@/lib/deposit-verification';
import { 
  checkRateLimit, 
  validateOrigin, 
  validateTransactionHash, 
  validateAmount,
  logSuspiciousActivity 
} from '@/lib/security-middleware';

// POST to record a deposit - NOW WITH BLOCKCHAIN VERIFICATION
export async function POST(request: NextRequest) {
  try {
    // Security: Validate origin
    if (!validateOrigin(request)) {
      return NextResponse.json(
        { error: 'Unauthorized origin' },
        { status: 403 }
      );
    }
    const body = await request.json();
    const { userId, amount, transactionHash } = body;
    
    // Validate input
    if (!userId || !amount || amount <= 0 || !transactionHash) {
      return NextResponse.json(
        { error: 'userId, amount, and transactionHash are required' },
        { status: 400 }
      );
    }
    
    // Security: Check rate limit
    const rateLimit = await checkRateLimit(request, 'deposit', userId);
    if (!rateLimit.allowed) {
      await logSuspiciousActivity(request, 'rate_limit_exceeded', { userId, endpoint: 'deposit' });
      return NextResponse.json(
        { 
          error: 'Too many requests. Please try again later.',
          retryAfter: rateLimit.resetIn 
        },
        { status: 429 }
      );
    }
    
    // Validate transaction hash format
    if (!validateTransactionHash(transactionHash)) {
      await logSuspiciousActivity(request, 'invalid_transaction_hash', { userId, transactionHash });
      return NextResponse.json(
        { error: 'Invalid transaction hash format' },
        { status: 400 }
      );
    }
    
    // Validate amount (min $0.01, max $10,000)
    if (!validateAmount(amount, 0.01, 10000)) {
      await logSuspiciousActivity(request, 'invalid_amount', { userId, amount });
      return NextResponse.json(
        { error: 'Invalid amount. Must be between $0.01 and $10,000' },
        { status: 400 }
      );
    }
    
    // Get user profile
    const userProfile = await redis.get<UserProfile>(REDIS_KEYS.USER_PROFILE(userId));
    if (!userProfile) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    console.log(`[Deposit API] Verifying deposit for user ${userId}: ${amount} USD, tx: ${transactionHash}`);
    
    // CRITICAL: Verify the blockchain transaction
    const verification = await depositVerification.verifyDeposit(
      transactionHash,
      amount,
      userId
    );
    
    if (!verification.isValid) {
      console.error(`[Deposit API] Verification failed: ${verification.error}`);
      return NextResponse.json(
        { 
          error: verification.error || 'Transaction verification failed',
          details: {
            transactionHash,
            expectedAmount: amount,
            actualAmount: verification.amount
          }
        },
        { status: 400 }
      );
    }
    
    // Transaction is valid - update user balance
    userProfile.balance += verification.amount || amount;
    userProfile.lastSeen = Date.now();
    await redis.set(REDIS_KEYS.USER_PROFILE(userId), userProfile);
    
    // Record verified deposit transaction
    const deposit = {
      type: 'deposit',
      amount: verification.amount || amount,
      timestamp: Date.now(),
      transactionHash,
      from: verification.from,
      status: 'verified',
      verifiedAt: Date.now()
    };
    
    await redis.lpush(`user:deposits:${userId}`, JSON.stringify(deposit));
    
    console.log(`[Deposit API] Successfully credited ${verification.amount} USD to user ${userId}`);
    
    return NextResponse.json({
      success: true,
      newBalance: userProfile.balance,
      deposit,
      verification: {
        amount: verification.amount,
        from: verification.from
      }
    });
    
  } catch (error) {
    console.error('[API/deposit] Error:', error);
    return NextResponse.json(
      { error: 'Failed to process deposit' },
      { status: 500 }
    );
  }
}

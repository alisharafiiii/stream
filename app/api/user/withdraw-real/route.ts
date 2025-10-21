import { NextRequest, NextResponse } from 'next/server';
import { redis, REDIS_KEYS, UserProfile } from '@/lib/redis';
import { USDCWithdrawalService } from '@/lib/usdc-withdrawal-service';
import { 
  checkRateLimit, 
  validateOrigin, 
  validateAmount,
  logSuspiciousActivity 
} from '@/lib/security-middleware';
import { ethers } from 'ethers';

// Daily withdrawal limits
const MAX_WITHDRAWAL_PER_DAY = 100; // $100
const MAX_WITHDRAWAL_PER_TX = 50;   // $50
const MIN_WITHDRAWAL_AMOUNT = 1;    // $1 minimum

export async function POST(request: NextRequest) {
  // Security: Validate origin
  if (!validateOrigin(request)) {
    return NextResponse.json({ error: 'Unauthorized origin' }, { status: 403 });
  }
  
  try {
    const body = await request.json();
    const { fid, amount, walletAddress } = body;
    
    if (!fid || !amount || amount <= 0 || !walletAddress) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }
    
    // Security: Prevent guest users from withdrawing
    if (fid.startsWith('guest_') || fid.startsWith('browser_')) {
      await logSuspiciousActivity(request, 'guest_withdrawal_attempt', { fid, amount, walletAddress });
      return NextResponse.json({ error: 'Guest users cannot withdraw funds' }, { status: 403 });
    }
    
    // Security: Validate wallet address
    if (!ethers.isAddress(walletAddress)) {
      await logSuspiciousActivity(request, 'invalid_wallet_address', { fid, walletAddress });
      return NextResponse.json({ error: 'Invalid wallet address' }, { status: 400 });
    }
    
    // Security: Check rate limit
    const rateLimit = await checkRateLimit(request, 'withdraw', fid);
    if (!rateLimit.allowed) {
      await logSuspiciousActivity(request, 'rate_limit_exceeded', { fid, endpoint: 'withdraw-real' });
      return NextResponse.json({ 
        error: 'Too many withdrawal attempts. Please try again later.',
        retryAfter: rateLimit.resetIn 
      }, { status: 429 });
    }
    
    // Security: Validate amount
    if (!validateAmount(amount, MIN_WITHDRAWAL_AMOUNT, MAX_WITHDRAWAL_PER_TX)) {
      await logSuspiciousActivity(request, 'invalid_withdrawal_amount', { fid, amount });
      return NextResponse.json({ 
        error: `Amount must be between $${MIN_WITHDRAWAL_AMOUNT} and $${MAX_WITHDRAWAL_PER_TX}` 
      }, { status: 400 });
    }
    
    // Get user profile
    const userProfile = await redis.get<UserProfile>(REDIS_KEYS.USER_PROFILE(fid));
    
    if (!userProfile) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    if (userProfile.balance < amount) {
      return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 });
    }
    
    // Check daily withdrawal limit
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    
    const withdrawals = await redis.lrange(REDIS_KEYS.USER_WITHDRAWALS(fid), 0, -1);
    const todayWithdrawals = withdrawals
      .map(w => {
        try {
          return typeof w === 'string' ? JSON.parse(w) : w;
        } catch (e) {
          console.error('Error parsing withdrawal:', e);
          return null;
        }
      })
      .filter(w => w && w.timestamp >= todayStart.getTime())
      .reduce((sum, w) => sum + w.amount, 0);
    
    if (todayWithdrawals + amount > MAX_WITHDRAWAL_PER_DAY) {
      return NextResponse.json({ 
        error: `Daily withdrawal limit of $${MAX_WITHDRAWAL_PER_DAY} exceeded. You've withdrawn $${todayWithdrawals} today.` 
      }, { status: 400 });
    }
    
    // Check if we have a real treasury configured
    const hasRealTreasury = !!process.env.TREASURY_PRIVATE_KEY && 
                           process.env.TREASURY_PRIVATE_KEY !== 'demo';
    
    if (hasRealTreasury) {
      // Process real withdrawal
      try {
        const withdrawalService = new USDCWithdrawalService();
        
        // Check treasury balances before attempting withdrawal
        const usdcBalance = await withdrawalService.getUSDCBalance();
        const ethBalance = await withdrawalService.getETHBalance();
        
        console.log('[Withdrawal] Treasury USDC balance:', usdcBalance);
        console.log('[Withdrawal] Treasury ETH balance:', ethBalance);
        
        if (parseFloat(usdcBalance) < amount) {
          return NextResponse.json({ 
            error: `Insufficient treasury balance. Available: $${usdcBalance}` 
          }, { status: 400 });
        }
        
        const result = await withdrawalService.processUSDCWithdrawal(walletAddress, amount);
        
        if (result.success) {
          // Deduct from user balance
          userProfile.balance -= amount;
          userProfile.lastSeen = Date.now();
          await redis.set(REDIS_KEYS.USER_PROFILE(fid), userProfile);
          
          // Store withdrawal record
          await redis.lpush(
            REDIS_KEYS.USER_WITHDRAWALS(fid),
            JSON.stringify({
              amount,
              walletAddress,
              transactionHash: result.transactionHash,
              blockNumber: result.blockNumber,
              gasUsed: result.gasUsed,
              timestamp: Date.now(),
              status: 'confirmed'
            })
          );
          
          return NextResponse.json({
            success: true,
            newBalance: userProfile.balance,
            transactionHash: result.transactionHash,
            message: 'Withdrawal completed successfully',
            isReal: true
          });
        } else {
          return NextResponse.json({ 
            error: result.error || 'Withdrawal failed' 
          }, { status: 500 });
        }
      } catch (error) {
        console.error('[API/withdraw-real] Blockchain error:', error);
        return NextResponse.json({ 
          error: `Blockchain error: ${error instanceof Error ? error.message : 'Unknown error'}` 
        }, { status: 500 });
      }
    } else {
      // Demo mode - simulate withdrawal
      const demoTxHash = `0x${Math.random().toString(16).substr(2, 64)}`;
      
      // Deduct from user balance
      userProfile.balance -= amount;
      userProfile.lastSeen = Date.now();
      await redis.set(REDIS_KEYS.USER_PROFILE(fid), userProfile);
      
      // Store withdrawal record
      await redis.lpush(
        REDIS_KEYS.USER_WITHDRAWALS(fid),
        JSON.stringify({
          amount,
          walletAddress,
          transactionHash: demoTxHash,
          timestamp: Date.now(),
          status: 'demo'
        })
      );
      
      return NextResponse.json({
        success: true,
        newBalance: userProfile.balance,
        transactionHash: demoTxHash,
        message: 'Withdrawal simulated (demo mode)',
        isReal: false
      });
    }
  } catch (error) {
    console.error('[API/withdraw-real] Error:', error);
    return NextResponse.json({ error: 'Failed to process withdrawal' }, { status: 500 });
  }
}

# 💰 Real Payment Implementation Guide

## Overview
To make deposits and withdrawals actually work with real money, you need:
1. **Treasury Wallet** - A wallet that holds all platform funds
2. **Base Pay** - For receiving deposits
3. **Wallet Integration** - For sending withdrawals

## Step 1: Set Up Treasury Wallet

### Create a Platform Wallet
```javascript
// 1. Generate a new wallet for your platform
import { ethers } from 'ethers';

const wallet = ethers.Wallet.createRandom();
console.log('Treasury Address:', wallet.address);
console.log('Private Key:', wallet.privateKey);
// SAVE THIS PRIVATE KEY SECURELY!
```

### Environment Variables
```env
TREASURY_WALLET_ADDRESS=0x... # Your treasury wallet address
TREASURY_PRIVATE_KEY=0x...    # KEEP THIS SECRET!
NEXT_PUBLIC_TREASURY_ADDRESS=0x... # Public address for deposits
```

## Step 2: Implement Real Deposit Flow

### Update BalanceModal.tsx
```typescript
const handleDeposit = async () => {
  const amount = parseFloat(depositAmount);
  if (isNaN(amount) || amount <= 0) return;
  
  setIsProcessing(true);
  try {
    // Use Base Pay to send funds to treasury
    const payment = await pay({
      amount: amount.toFixed(2),
      to: process.env.NEXT_PUBLIC_TREASURY_ADDRESS!, // Your treasury wallet
      testnet: false, // Use mainnet for real money
    });
    
    if (payment) {
      // Monitor the payment
      const checkPayment = setInterval(async () => {
        const status = await getPaymentStatus(payment);
        
        if (status.status === 'success') {
          clearInterval(checkPayment);
          
          // Credit user's balance in database
          const response = await fetch('/api/user/deposit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fid: user.fid,
              amount: amount,
              transactionHash: status.transactionHash,
            }),
          });
          
          if (response.ok) {
            const userData = await response.json();
            onBalanceUpdate(userData.balance);
            setShowDeposit(false);
          }
        }
      }, 2000);
    }
  } catch (error) {
    console.error('Deposit failed:', error);
  } finally {
    setIsProcessing(false);
  }
};
```

## Step 3: Implement Real Withdraw Flow

### Create Withdrawal Service
```typescript
// lib/withdrawal-service.ts
import { ethers } from 'ethers';

export class WithdrawalService {
  private wallet: ethers.Wallet;
  private provider: ethers.Provider;
  
  constructor() {
    // Connect to Base network
    this.provider = new ethers.JsonRpcProvider('https://mainnet.base.org');
    
    // Load treasury wallet
    this.wallet = new ethers.Wallet(
      process.env.TREASURY_PRIVATE_KEY!,
      this.provider
    );
  }
  
  async processWithdrawal(toAddress: string, amount: number) {
    try {
      // Convert amount to wei
      const amountWei = ethers.parseEther(amount.toString());
      
      // Check treasury balance
      const balance = await this.provider.getBalance(this.wallet.address);
      if (balance < amountWei) {
        throw new Error('Insufficient treasury balance');
      }
      
      // Send transaction
      const tx = await this.wallet.sendTransaction({
        to: toAddress,
        value: amountWei,
        // Gas will be auto-estimated
      });
      
      // Wait for confirmation
      const receipt = await tx.wait();
      
      return {
        success: true,
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber,
      };
    } catch (error) {
      console.error('Withdrawal failed:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }
}
```

### Update Withdraw API Route
```typescript
// app/api/user/withdraw/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { redis, REDIS_KEYS, UserProfile } from '@/lib/redis';
import { WithdrawalService } from '@/lib/withdrawal-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fid, amount, walletAddress } = body;
    
    if (!fid || !amount || amount <= 0 || !walletAddress) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }
    
    // Get user profile
    const userProfile = await redis.get<UserProfile>(REDIS_KEYS.USER_PROFILE(fid));
    
    if (!userProfile) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    if (userProfile.balance < amount) {
      return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 });
    }
    
    // Process real withdrawal
    const withdrawalService = new WithdrawalService();
    const result = await withdrawalService.processWithdrawal(walletAddress, amount);
    
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
          timestamp: Date.now(),
          status: 'confirmed'
        })
      );
      
      return NextResponse.json({
        success: true,
        newBalance: userProfile.balance,
        transactionHash: result.transactionHash,
        message: 'Withdrawal completed successfully'
      });
    } else {
      return NextResponse.json({ 
        error: result.error || 'Withdrawal failed' 
      }, { status: 500 });
    }
  } catch (error) {
    console.error('[API/withdraw] Error:', error);
    return NextResponse.json({ error: 'Failed to process withdrawal' }, { status: 500 });
  }
}
```

## Step 4: Security Considerations

### 1. Secure Private Key Storage
```javascript
// Use environment variables
// NEVER commit private keys to git
// Use Vercel's encrypted environment variables
```

### 2. Add Withdrawal Limits
```typescript
const MAX_WITHDRAWAL_PER_DAY = 100; // $100
const MAX_WITHDRAWAL_PER_TX = 50;   // $50

// Check limits before processing
const dailyWithdrawals = await getDailyWithdrawals(userId);
if (dailyWithdrawals + amount > MAX_WITHDRAWAL_PER_DAY) {
  throw new Error('Daily withdrawal limit exceeded');
}
```

### 3. Add 2FA for Withdrawals
```typescript
// Require email/SMS verification for withdrawals
const verificationCode = await sendVerificationCode(user.email);
// User must enter code before withdrawal processes
```

### 4. Hot/Cold Wallet Setup
```
HOT WALLET (Treasury): Keep only necessary funds for daily operations
COLD WALLET: Store majority of funds offline
```

## Step 5: Gas Fee Handling

### Option 1: User Pays Gas
```typescript
// Deduct gas estimate from withdrawal amount
const gasEstimate = await estimateGas(walletAddress, amount);
const netAmount = amount - gasEstimate;
```

### Option 2: Platform Pays Gas
```typescript
// Platform absorbs gas costs
// Include in your business model calculations
```

## Step 6: Monitoring & Alerts

### Set Up Monitoring
```typescript
// Monitor treasury balance
setInterval(async () => {
  const balance = await provider.getBalance(TREASURY_ADDRESS);
  if (balance < MIN_TREASURY_BALANCE) {
    sendAlert('Treasury balance low!');
  }
}, 60000); // Check every minute
```

## Testing Steps

1. **Test on Base Testnet First**
   - Get test ETH from Base faucet
   - Test full deposit/withdraw flow
   - Verify transactions on BaseScan

2. **Small Mainnet Test**
   - Start with $1 deposits/withdrawals
   - Verify everything works
   - Check gas costs

3. **Go Live**
   - Set appropriate limits
   - Monitor closely first week
   - Have support ready

## Common Issues & Solutions

### Issue: "Insufficient gas"
```typescript
// Solution: Estimate gas properly
const gasLimit = await tx.estimateGas();
tx.gasLimit = gasLimit * 110n / 100n; // Add 10% buffer
```

### Issue: "Transaction stuck"
```typescript
// Solution: Implement retry with higher gas
if (tx.status === 'pending' && Date.now() - tx.timestamp > 300000) {
  // Retry with 20% higher gas
}
```

## Required Dependencies
```json
{
  "dependencies": {
    "ethers": "^6.13.0",
    "@base-org/account": "latest"
  }
}
```

This implementation will make deposits and withdrawals actually work with real ETH on Base network!

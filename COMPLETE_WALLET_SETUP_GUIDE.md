# 💰 Complete Step-by-Step Wallet Setup Guide

## Step 1: Generate Your Treasury Wallet (2 minutes)

### Option A: Using Node.js (Recommended)
```bash
# Make sure you have Node.js installed, then run:
node -e "const { ethers } = require('ethers'); const w = ethers.Wallet.createRandom(); console.log('=== YOUR TREASURY WALLET ==='); console.log('Address:', w.address); console.log('Private Key:', w.privateKey); console.log('=========================');"
```

### You'll see something like:
```
=== YOUR TREASURY WALLET ===
Address: 0x742d35Cc6634C0532925a3b844Bc9e7595f6cE12
Private Key: 0x4c0883a69102937d6231471b5dbb6204fe512961708279f7d48e8e6c7b3c5a8f2
=========================
```

### ⚠️ IMPORTANT: SAVE THESE SECURELY!
- Copy both values to a secure password manager
- NEVER share your private key
- You'll need both for the next steps

## Step 2: Import to MetaMask (3 minutes)

1. **Install MetaMask** (if you haven't): https://metamask.io
2. **Open MetaMask** → Click profile icon → **"Import Account"**
3. **Paste your Private Key** (from Step 1)
4. **Click "Import"**
5. **Add Base Network**:
   - Click network dropdown → "Add Network"
   - Search for "Base" → Add
   - Switch to Base network

## Step 3: Add to Vercel Environment (5 minutes)

1. **Go to Vercel**: https://vercel.com
2. **Select your project**: "stream"
3. **Go to Settings** → **Environment Variables**
4. **Add these variables**:

```
Variable Name: TREASURY_PRIVATE_KEY
Value: 0x4c0883a... (your full private key from Step 1)
Environment: ✓ Production ✓ Preview ✓ Development

Variable Name: NEXT_PUBLIC_TREASURY_ADDRESS  
Value: 0x742d35Cc... (your address from Step 1)
Environment: ✓ Production ✓ Preview ✓ Development

Variable Name: BASE_TESTNET
Value: false
Environment: ✓ Production ✓ Preview ✓ Development
```

5. **Click "Save"** for each variable

## Step 4: Fund Your Wallet (5 minutes)

### What You Need:
- **0.1 ETH** on Base network (for gas fees)
- **100 USDC** on Base network (for testing withdrawals)

### Option A: From Coinbase (Easiest)
1. Buy ETH and USDC on Coinbase
2. Send to your treasury address on Base network
3. Use "Send" → Select Base network → Paste your treasury address

### Option B: Bridge from Ethereum
1. Go to https://bridge.base.org
2. Connect your existing wallet
3. Bridge ETH from Ethereum to Base
4. Bridge USDC from Ethereum to Base

### Option C: Buy Directly on Base
1. Use your treasury wallet in MetaMask
2. Go to https://base.org
3. Use their "Buy" feature
4. Purchase ETH and USDC directly

### How Much to Fund:
```
For Testing:
- 0.01 ETH (~$25) - Covers 100+ transactions
- 10 USDC - For test withdrawals

For Production:
- 0.1 ETH (~$250) - Covers 1000+ transactions  
- 100-500 USDC - Withdrawal float
```

## Step 5: Deploy with New Wallet (2 minutes)

```bash
# In your terminal:
vercel --prod
```

## Step 6: Verify Everything Works (5 minutes)

### 1. Check MetaMask
- You should see your ETH balance
- You should see your USDC balance
- You're on Base network

### 2. Check Admin Panel
Go to: https://stream-bay-delta.vercel.app/admin
- Treasury Monitor should show your balance
- Click "View on BaseScan" to verify

### 3. Test a Small Deposit
- Create a test user account
- Click balance → Deposit → $1
- Base Pay should open with your treasury as recipient
- Complete payment
- Balance should update

### 4. Test a Small Withdrawal  
- Click balance → Withdraw → $0.50
- Enter wallet address
- Confirm transaction
- Check MetaMask for incoming USDC

## Common Issues & Solutions:

### "Transaction Failed"
- Make sure you have enough ETH for gas
- Check you're on Base network
- Verify USDC balance for withdrawals

### "Environment Variable Not Found"
- Redeploy after adding variables
- Check spelling exactly matches
- Ensure all checkboxes selected

### "Insufficient Balance"
- Fund wallet with more ETH/USDC
- Check you're on Base network
- Wait for transactions to confirm

## Security Checklist:

✅ Private key saved in password manager
✅ Private key added to Vercel (not in code)
✅ MetaMask has strong password
✅ 2FA enabled on Vercel
✅ Only keeping working capital in hot wallet

## Daily Operations:

### Morning Routine:
1. Check treasury balance in admin panel
2. If > $1000 USDC, move excess to cold wallet
3. If < $100 USDC, add from cold wallet
4. Check for failed transactions

### Weekly:
1. Export transaction history from BaseScan
2. Reconcile with database balances
3. Check gas fee spending
4. Review withdrawal patterns

## Monitoring Your Wallet:

### In Admin Panel:
- Real-time balance
- USD value
- Quick links

### On BaseScan:
https://basescan.org/address/YOUR_TREASURY_ADDRESS
- All transactions
- Token balances
- Gas usage

### In MetaMask:
- Send/receive manually if needed
- Check pending transactions
- Monitor gas prices

## Upgrading Later:

When you reach $10k+ daily volume, consider:
1. Multi-signature wallet (Gnosis Safe)
2. Smart contract treasury
3. Automated rebalancing
4. Professional custody solution

## You're Ready! 🚀

Total setup time: ~20 minutes
- Wallet created ✓
- MetaMask ready ✓
- Vercel configured ✓
- Wallet funded ✓
- Deposits use real USDC ✓
- Withdrawals send real USDC ✓

Your platform now handles real money professionally!

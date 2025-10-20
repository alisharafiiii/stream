# 🚀 Quick Visual Setup Guide - 20 Minutes to Live!

## Step 1: Generate Wallet (2 min)

```bash
node -e "const { ethers } = require('ethers'); const w = ethers.Wallet.createRandom(); console.log('=== COPY THESE ==='); console.log('Address:', w.address); console.log('Private Key:', w.privateKey);"
```

### You'll Get:
```
=== COPY THESE ===
Address: 0x742d35Cc6634C0532925a3b844Bc9e7595f6cE12
Private Key: 0x4c0883a69102937d6231471b5dbb6204fe5126170827...
```
⚠️ **SAVE BOTH IN PASSWORD MANAGER NOW!**

---

## Step 2: Import to MetaMask (3 min)

1. **MetaMask** → Click profile → **Import Account**
2. **Paste Private Key** → Import
3. **Add Base Network**:
   - Network Name: `Base`
   - RPC URL: `https://mainnet.base.org`
   - Chain ID: `8453`
   - Symbol: `ETH`

---

## Step 3: Add to Vercel (5 min)

### Go to: vercel.com → Your Project → Settings → Environment Variables

Add these 3 variables:

| Variable | Value | Environment |
|----------|-------|-------------|
| `TREASURY_PRIVATE_KEY` | Your private key from Step 1 | ✓ All |
| `NEXT_PUBLIC_TREASURY_ADDRESS` | Your address from Step 1 | ✓ All |
| `BASE_TESTNET` | `false` | ✓ All |

Click **Save** after each!

---

## Step 4: Fund Your Wallet (5 min)

### Option A: From Coinbase App
1. Buy $50 worth of ETH
2. Buy $50 worth of USDC
3. Send → Select **Base** network → Your treasury address

### Option B: From Any Wallet
1. Go to: https://app.uniswap.org
2. Buy ETH and USDC on Base
3. Send to your treasury address

### Minimum Amounts:
- **ETH**: 0.01 ($25) - For gas fees
- **USDC**: 50 - For withdrawals

---

## Step 5: Deploy (2 min)

```bash
vercel --prod
```

---

## Step 6: Test It! (3 min)

### 1. Check Admin Panel
Go to: `your-app.vercel.app/admin`
- Should show USDC balance: $50
- Should show ETH balance: 0.01

### 2. Test Deposit
- Create account → Click balance → Deposit $1
- **Base App**: Opens Base Pay
- **Browser**: Connects MetaMask
- Pay with USDC → Balance updates!

### 3. Test Withdraw  
- Click withdraw → Enter $0.50
- Confirm → Check wallet for USDC!

---

## 🎉 You're Live with Real Money!

### What's Working:
✅ Real USDC deposits via Base Pay  
✅ Real USDC withdrawals to any wallet  
✅ Gas fees paid from ETH balance  
✅ All transactions on Base blockchain  
✅ Professional treasury management  

### Daily Checklist:
- [ ] Check USDC balance > $50
- [ ] Check ETH balance > 0.005
- [ ] Move excess to cold storage if > $500
- [ ] Check BaseScan for all transactions

### Monitor at:
- **Admin Panel**: Shows balances
- **MetaMask**: Full control
- **BaseScan**: https://basescan.org/address/YOUR_ADDRESS

---

## Common Issues:

### "Environment variable not found"
→ Redeploy after adding variables: `vercel --prod`

### "Transaction failed"  
→ Check you have ETH for gas
→ Check you have USDC for withdrawals

### "Insufficient balance"
→ Fund wallet with more ETH/USDC
→ Make sure on Base network

---

## Total Time: ~20 minutes
You now have a professional payment system handling real money! 💰

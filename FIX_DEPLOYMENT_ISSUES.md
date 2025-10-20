# 🔧 Fix Your Deployment Issues

## Problems:
1. **Still seeing demo mode** - Treasury private key not set in new deployment
2. **Balance becomes 0 on withdrawal** - Possible frontend state issue
3. **Console errors** - Ad blocker is blocking YouTube analytics

## Solution:

### 1. Use Your Main Deployment URL
```
https://stream-bay-delta.vercel.app/
```
NOT the preview URL (`stream-crf0nbt36-nabus-projects-fb6829d6.vercel.app`)

### 2. Fix Environment Variables in Vercel

Go to: https://vercel.com/dashboard/project/stream/settings/environment-variables

Make sure you have ALL these set:
```
TREASURY_PRIVATE_KEY = your_private_key_here
NEXT_PUBLIC_TREASURY_ADDRESS = 0x00081fd198A649c4DBF4B3AB6E9f8dd611f92611
BASE_TESTNET = false
UPSTASH_REDIS_REST_URL = https://lucky-kangaroo-5978.upstash.io
UPSTASH_REDIS_REST_TOKEN = ARdaAAImcDJmNTY0NmViMTU2MWI0MmEwOWU0OTczMzBjNzQ1NjllN3AyNTk3OA
```

⚠️ IMPORTANT: Set these for:
- ✅ Production
- ✅ Preview 
- ✅ Development

### 3. Fund Your Treasury First!

Before testing withdrawals, your treasury needs funds:
- Send 0.01 ETH to: `0x00081fd198A649c4DBF4B3AB6E9f8dd611f92611`
- Send 10 USDC to: `0x00081fd198A649c4DBF4B3AB6E9f8dd611f92611`

Check balance: https://basescan.org/address/0x00081fd198A649c4DBF4B3AB6E9f8dd611f92611

### 4. Console Errors Are Normal

The YouTube errors (`ERR_BLOCKED_BY_CLIENT`) are from ad blockers. They don't affect functionality - YouTube still works.

### 5. Test Real Money Flow

After fixing env vars and funding:

1. **Test Deposit**: 
   - Click balance → Deposit
   - Send 1 USDC
   - Check treasury received it on BaseScan

2. **Test Withdrawal**:
   - Click balance → Withdraw
   - Withdraw 0.50 USDC
   - Check your wallet received it

### 6. Debug Mode

To verify if you're in real or demo mode:
- Check admin panel: https://stream-bay-delta.vercel.app/admin
- Look at Treasury Monitor
- If it says "Demo Mode", your private key isn't set

## Quick Checklist:
- [ ] Using main URL (not preview)
- [ ] All env vars set in Vercel
- [ ] Treasury funded with ETH + USDC
- [ ] Tested on Base network (not Ethereum)

## Still Having Issues?

1. Clear browser cache
2. Disconnect and reconnect wallet
3. Make sure you're on Base network
4. Check Vercel logs for errors

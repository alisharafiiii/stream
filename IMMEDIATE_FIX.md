# 🚨 IMMEDIATE FIXES

## Problem Summary:
1. **Demo mode on preview URLs** - Environment variables not set
2. **Balance becomes 0 on withdrawal** - Possible bug in withdrawal logic
3. **YouTube errors** - Just ad blocker, ignore these

## Solution:

### 1. ONLY Use Your Main URL:
```
https://stream-bay-delta.vercel.app/
```

### 2. Environment Variables Must Be Set:

Go to: https://vercel.com/dashboard

1. Find your "stream" project
2. Go to Settings → Environment Variables
3. Add these if missing:

```
TREASURY_PRIVATE_KEY = [your private key]
NEXT_PUBLIC_TREASURY_ADDRESS = 0x00081fd198A649c4DBF4B3AB6E9f8dd611f92611
BASE_TESTNET = false
```

⚠️ Set for: Production ✓ Preview ✓ Development ✓

### 3. Quick Balance Fix:

If your balance went to 0, here's a temporary fix:

1. Go to admin panel: https://stream-bay-delta.vercel.app/admin
2. Look at Users section
3. Your balance should show there
4. If it's 0, you can manually top up in the app

### 4. Before Testing Withdrawals:

Your treasury needs funds FIRST:
- Check: https://basescan.org/address/0x00081fd198A649c4DBF4B3AB6E9f8dd611f92611
- If balance is 0, send ETH and USDC on Base network

### 5. Test Properly:

1. Clear your browser cache
2. Use the main URL only
3. Sign out and sign back in
4. Test with small amounts first (like $0.10)

## Debug Commands (paste in browser console):

```javascript
// Check your current balance
console.log(JSON.parse(localStorage.getItem('streamUser')));

// Check if in demo mode
fetch('/api/user/withdraw-real', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    fid: JSON.parse(localStorage.getItem('streamUser')).fid,
    amount: 0.01,
    walletAddress: '0x' + '0'.repeat(40)
  })
}).then(r => r.json()).then(d => console.log('Mode:', d.isReal ? 'REAL' : 'DEMO'));
```

## Still Not Working?

The issue is likely one of:
1. Treasury private key not set in Vercel
2. Using wrong deployment URL
3. Treasury has no funds

Check Vercel logs for the actual error!
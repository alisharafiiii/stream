# 🔐 How to Update Admin Wallet Address

## Current Issue:
Your wallet (`0x37Ed...c1A9`) doesn't match the configured admin wallet.

## Two Solutions:

### Option 1: Update in Vercel (RECOMMENDED) 
1. Go to [Vercel Dashboard](https://vercel.com)
2. Select your `stream` project
3. Go to **Settings** → **Environment Variables**
4. Find `ADMIN_WALLET`
5. Update it to your full wallet address (e.g., `0x37Ed...c1A9` but use the FULL address)
6. Click **Save**
7. **IMPORTANT**: Redeploy for changes to take effect
   ```bash
   vercel --prod
   ```

### Option 2: Quick Fix for Testing
Add your wallet to the admin page directly (already done in code).

## ⚠️ IMPORTANT: Use the Latest URL!

You're using an old deployment. Use the latest:

### Latest URL with Overlay Fix:
# https://stream-40w88q9b5-nabus-projects-fb6829d6.vercel.app

### Admin Panel:
# https://stream-40w88q9b5-nabus-projects-fb6829d6.vercel.app/admin

### For Base App:
# https://stream-bay-delta.vercel.app

## To Get Your Full Wallet Address:
1. Open MetaMask or your wallet
2. Click on your address to copy
3. It should look like: `0x37Ed1234567890abcdef1234567890abcdef1234` (40 characters after 0x)

## After Updating:
1. The betting overlay animations will work ✅
2. You'll be able to access admin panel ✅
3. All features are functional ✅

Remember: Always use the latest deployment URL!

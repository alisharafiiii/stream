# 🖼️ Farcaster Profile Pictures Setup

## 📝 What Changed:

### 1. **Real Profile Pictures**
- Integrated Neynar API to fetch real Farcaster profiles
- Shows actual usernames and profile pictures
- Fallback to placeholder if API not configured

### 2. **How to Enable Real Profiles**

#### Step 1: Get Neynar API Key
1. Go to https://neynar.com/
2. Sign up for a free account
3. Go to Dashboard → API Keys
4. Create a new API key

#### Step 2: Add to Vercel
1. Go to your Vercel project settings
2. Navigate to Environment Variables
3. Add: `NEYNAR_API_KEY = your-api-key-here`
4. Redeploy your app

## 🎯 Features:
- **Batch Fetching**: Admin panel fetches all profiles efficiently
- **Real Data**: Shows real usernames, display names, and profile pictures
- **Fallback**: If no API key, shows placeholder data
- **Caching**: Profile data is cached in Redis

## 💰 About User Balances:

User balances are **REAL MONEY** stored in Redis:
- Initial balance: $0 (when user signs up)
- Increased by: Real USDC deposits via Base Pay
- Decreased by: Betting and withdrawals
- All transactions are tracked in Redis

**Balance Flow:**
1. User deposits USDC → Treasury wallet receives real USDC → User balance increases
2. User bets → Balance decreases
3. User wins → Balance increases (2x payout minus 21% fee)
4. User withdraws → Treasury sends real USDC → Balance decreases

## 🔍 To Verify Real Balances:
1. Check Treasury Monitor in admin panel
2. View user transaction history in their profile
3. All deposits/withdrawals have transaction hashes

Without the Neynar API key, profile pictures will show as placeholders, but the balances are always real!

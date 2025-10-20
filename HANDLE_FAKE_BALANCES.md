# 💸 How to Handle Existing Fake Balances

## The Problem:
- Previous users got $10 demo money
- Total shows ~$70 in admin panel
- These are NOT real deposits
- One user already withdrew real money from fake balance!

## Solution Options:

### Option 1: Reset All Fake Balances (Recommended)
Use the provided script to automatically reset balances for users who:
- Have exactly $10
- Have no deposit history
- Have no betting history
- Have no withdrawal history

**Steps:**
1. SSH into your server or run locally:
```bash
cd /Users/nabu/stream
export UPSTASH_REDIS_REST_URL="your-redis-url"
export UPSTASH_REDIS_REST_TOKEN="your-redis-token"
npm install @upstash/redis
node scripts/reset-fake-balances.js
```

### Option 2: Manual Reset via Redis
1. Go to Upstash Redis console
2. Run: `KEYS user:profile:*`
3. For each user, check their balance
4. If they have $10 and no transactions, reset to 0

### Option 3: Let It Be (NOT Recommended)
- Risk: More users might withdraw fake money
- Cost: You're paying real USDC for fake balances

## Prevention Going Forward:
✅ New users now start with $0
✅ Must deposit real USDC to play
✅ No more fake money creation

## Important Notes:
- The script will preserve balances for users who have made real deposits
- Only resets users with exactly $10 and no transaction history
- Always backup your Redis data before running scripts

## What Changed in Code:
- `app/page.tsx` line 111: `balance: 0`
- `app/components/AuthModal.tsx` line 51: `balance: 0`
- API already defaults to 0 if no balance provided

Choose Option 1 to clean up the fake balances safely!

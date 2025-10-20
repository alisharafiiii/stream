# 🔑 Neynar API Key Setup

## Your API Key:
```
AE9247C3-7112-4923-836C-621E7AE4417D
```

## How to Add to Vercel:

1. Go to your Vercel project: https://vercel.com/dashboard
2. Select your "stream" project
3. Go to Settings → Environment Variables
4. Add new variable:
   - **Name**: `NEYNAR_API_KEY`
   - **Value**: `AE9247C3-7112-4923-836C-621E7AE4417D`
   - **Environment**: Select all (Production, Preview, Development)
5. Click "Save"
6. Redeploy your app

## What This Enables:
- Real Farcaster profile pictures
- Actual usernames and display names
- Profile data from Farcaster network

## Important:
- Yes, you can use the same API key for multiple apps
- The key allows up to 100 requests per minute (free tier)
- Profile data is cached in Redis to minimize API calls

After adding the key and redeploying, all new users will have their real Farcaster profiles fetched automatically!

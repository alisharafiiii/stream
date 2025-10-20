# Environment Variables Setup for Betting Platform

## Required Environment Variables

Add these to your `.env.local` file:

```env
# Upstash Redis
UPSTASH_REDIS_REST_URL=https://lucky-kangaroo-5978.upstash.io
UPSTASH_REDIS_REST_TOKEN=ARdaAAImcDJmNTY0NmViMTU2MWI0MmEwOWU0OTczMzBjNzQ1NjllN3AyNTk3OA

# Admin Wallet
ADMIN_WALLET=0xAbD4BB1Ba7C9a57C40598604A7ad0E5d105AD54D

# YouTube Stream Defaults (optional)
DEFAULT_STREAM_URL=
DEFAULT_STREAM_LIVE=false
DEFAULT_STREAM_TITLE=Live Stream
```

## Important Notes

1. **DO NOT** commit `.env.local` to your repository
2. Add `.env.local` to your `.gitignore` file
3. In production (Vercel), add these as environment variables in your project settings

## Vercel Deployment

1. Go to your project in Vercel Dashboard
2. Navigate to Settings → Environment Variables
3. Add each variable above
4. Redeploy your application

## Testing Redis Connection

You can test your Redis connection with:
```bash
redis-cli --tls -u redis://default:ARdaAAImcDJmNTY0NmViMTU2MWI0MmEwOWU0OTczMzBjNzQ1NjllN3AyNTk3OA@lucky-kangaroo-5978.upstash.io:6379
```

# Railway Environment Variables

Add these environment variables to your Railway service:

```
UPSTASH_REDIS_REST_URL=https://lucky-kangaroo-5978.upstash.io
UPSTASH_REDIS_REST_TOKEN=[your token from Upstash]
NEYNAR_API_KEY=NEYNAR_API_DOCS
ADMIN_WALLET=0xAbD4BB1Ba7C9a57C40598604A7ad0E5d105AD54D
NEXT_PUBLIC_ADMIN_WALLET=0xAbD4BB1Ba7C9a57C40598604A7ad0E5d105AD54D
NEXT_PUBLIC_TREASURY_ADDRESS=0x00081fd198A649c4DBF4B3AB6E9f8dd611f92611
TREASURY_PRIVATE_KEY=[your treasury private key]
PRIVATE_KEY=[same as TREASURY_PRIVATE_KEY]
```

## Important:
- `NEYNAR_API_KEY=NEYNAR_API_DOCS` - This enables real Farcaster profile pictures
- Without this key, all profile pictures will be placeholders

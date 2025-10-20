# Testing Profile Pictures

## 1. Check Browser Console

Open http://localhost:3003 and check the browser console (F12) for:
- `[Farcaster API] NEYNAR_API_KEY: Configured` or `Not configured`
- `[Farcaster API] Fetching:` URLs
- Any error messages

## 2. Check Network Tab

In Chrome DevTools:
1. Go to Network tab
2. Filter by "neynar" or "farcaster"
3. Look for API calls to `api.neynar.com`
4. Check if they return 200 OK or errors

## 3. Manual API Test

Test the Neynar API directly:
```bash
curl -X GET "https://api.neynar.com/v2/farcaster/user/by-fid?fid=1" \
  -H "accept: application/json" \
  -H "api_key: NEYNAR_API_DOCS"
```

## 4. Check Server Logs

Look for `[Farcaster API]` logs in your terminal running `npm run dev`

## 5. Common Issues

1. **API Key not loaded**: Restart dev server after adding to .env.local
2. **CORS issues**: Neynar API should be called from server-side only
3. **Rate limits**: The NEYNAR_API_DOCS key has rate limits
4. **Cached data**: Clear localStorage and try again

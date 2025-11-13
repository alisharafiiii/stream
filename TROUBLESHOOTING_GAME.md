# Troubleshooting Game Mode 🔧

## Common Issues & Solutions

### 1. "Starting game server..." Never Loads

**Cause**: Redis connection issues

**Solutions**:
- Check `.env.local` has Redis credentials:
  ```
  UPSTASH_REDIS_REST_URL=your_url_here
  UPSTASH_REDIS_REST_TOKEN=your_token_here
  ```
- Verify Redis is accessible from Upstash console
- Check terminal for specific error messages

### 2. Game Resets on Refresh

**This shouldn't happen anymore!** The game now runs server-side.

If it still happens:
- Make sure you're running `npm run dev` (not `dev:no-game`)
- Check terminal for game initialization messages
- Clear browser cache and try again

### 3. Can't Place Bets

**Working as intended if:**
- Countdown shows "0" (betting closed)
- Battle is in progress
- Results are showing

**Wait for:** Next betting phase (shown in countdown)

### 4. No Payout After Winning

**Check:**
- Did you bet on the winning side?
- Wait for results phase to complete
- Check your balance - it updates automatically
- Receipt should show if you won

### 5. Server Errors in Terminal

**Redis errors:**
```
TypeError: Cannot use 'in' operator...
```
- Fixed by updating to proper Redis TTL syntax
- Should not appear with latest code

**Connection errors:**
```
Redis connection failed
```
- Check your Upstash credentials
- Ensure Redis database is active

### 6. Game Not Starting Automatically

The game should start when you run `npm run dev`.

If not:
1. Check terminal for "🎮 Initializing game loop..." message
2. Look for any error messages
3. Try stopping server (Ctrl+C) and restarting

### Development Commands

```bash
# Start with game (normal development)
npm run dev

# Start without game (for testing other features)
npm run dev:no-game

# Production build
npm run build
npm run start
```

### Checking Game State

Visit these endpoints to debug:
- `/api/game/state` - Current game state
- `/api/game/init` - Force game initialization

### Need More Help?

1. Check server logs in terminal
2. Look for console errors in browser
3. Verify all environment variables are set
4. Ensure Redis (Upstash) is properly configured

The game should run continuously and independently once properly initialized! 🚀




# User Data Storage in Redis

## Yes, We Are Saving User Data! ✅

When users connect with Farcaster, we automatically create and store their profile in Redis (Upstash).

## What We Store

### 1. User Profile (`user:profile:{fid}`)
- **FID**: Farcaster ID (unique identifier)
- **Username**: From Farcaster or generated
- **Display Name**: From Farcaster profile
- **Profile Image**: Avatar URL from Farcaster or generated
- **Balance**: Starting with $10 for new users
- **Created At**: Timestamp when profile was created
- **Last Seen**: Updated every time they visit

### 2. Betting Stats (`user:betting:stats:{fid}`)
- **Total Sessions**: Number of betting rounds participated
- **Total Won**: Number of winning bets
- **Total Lost**: Number of losing bets
- **Total Wagered**: Total amount bet across all sessions
- **Total Winnings**: Total amount won
- **Profit/Loss**: Net profit or loss

### 3. Individual Bets (`betting:bets:{sessionId}:{userId}`)
- **Session ID**: Which betting round
- **Left Amount**: Total bet on left option
- **Right Amount**: Total bet on right option
- **Transactions**: Array of all individual bets with timestamps

## How It Works

### New User Flow:
1. User connects with Farcaster
2. System checks if profile exists in Redis
3. If not, creates new profile with:
   - Farcaster data (username, display name, avatar)
   - $10 starting balance
   - Current timestamp
4. Profile persists across sessions

### Returning User Flow:
1. User connects with Farcaster
2. System fetches existing profile from Redis
3. Updates "last seen" timestamp
4. Loads their current balance and stats

### Data Persistence:
- All data stored in Upstash Redis
- Survives server restarts
- No data loss between sessions
- Real-time updates during betting

## Viewing User Data

### For Users:
- Balance shown in header
- Betting history in BettingCard
- Win/loss stats (coming soon)

### For Admins:
- See all bets per session
- Track user participation
- Monitor betting patterns

## Data Structure Example

```json
// User Profile
{
  "fid": "12345",
  "username": "alice",
  "displayName": "Alice Smith",
  "profileImage": "https://...",
  "balance": 15.75,
  "createdAt": 1699123456789,
  "lastSeen": 1699234567890
}

// Betting Stats
{
  "totalSessions": 5,
  "totalWon": 3,
  "totalLost": 2,
  "totalWagered": 50.00,
  "totalWinnings": 75.00,
  "profitLoss": 25.00
}
```

## Benefits
- ✅ No need to reconnect wallet each time
- ✅ Balance persists between sessions
- ✅ Complete betting history tracked
- ✅ Fair payout calculations
- ✅ User stats for engagement

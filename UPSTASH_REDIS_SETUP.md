# Upstash Redis Setup for Betting Platform

## 1. Create Upstash Account
1. Go to [upstash.com](https://upstash.com)
2. Sign up for free account
3. Create a new Redis database

## 2. Get Redis Credentials
From your Upstash dashboard, copy:
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

## 3. Install Dependencies
```bash
npm install @upstash/redis
```

## 4. Environment Variables
Add to your `.env.local`:
```
UPSTASH_REDIS_REST_URL=your_redis_url
UPSTASH_REDIS_REST_TOKEN=your_redis_token
```

## 5. Redis Client Setup
Create `lib/redis.ts`:
```typescript
import { Redis } from '@upstash/redis'

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})
```

## 6. Betting Service
Create `lib/betting-service.ts` with methods for:
- Creating betting sessions
- Placing bets
- Calculating payouts
- Processing winners

## 7. Data Models
```typescript
interface BettingSession {
  id: string
  question: string
  options: ['left', 'right']
  status: 'open' | 'closed' | 'resolved'
  totalPool: number
  leftPool: number
  rightPool: number
  winner: 'left' | 'right' | null
  createdAt: number
  closedAt?: number
  resolvedAt?: number
}

interface UserBet {
  userId: string
  sessionId: string
  option: 'left' | 'right'
  amount: number
  timestamp: number
  paidOut: boolean
}
```

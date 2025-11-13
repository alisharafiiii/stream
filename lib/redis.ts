import { Redis } from '@upstash/redis'

// Initialize Redis client
export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

// Redis key prefixes
export const REDIS_KEYS = {
  // User profiles
  USER_PROFILE: (fid: string) => `user:profile:${fid}`,
  USER_BETTING_STATS: (fid: string) => `user:betting:stats:${fid}`,
  USER_WITHDRAWALS: (fid: string) => `user:withdrawals:${fid}`,
  
  // Betting sessions
  BETTING_CURRENT: () => 'betting:current',
  BETTING_SESSION: (sessionId: string) => `betting:session:${sessionId}`,
  BETTING_USER_BETS: (sessionId: string, userId: string) => `betting:bets:${sessionId}:${userId}`,
  BETTING_SESSION_BETS: (sessionId: string) => `betting:session:${sessionId}:bets`,
  BETTING_HISTORY: () => 'betting:history',
  
  // Admin settings
  ADMIN_SETTINGS: () => 'admin:settings',
  
  // Stream configuration
  STREAM_CONFIG: () => 'stream:config',
  
  // Game mode configuration
  GAME_CONFIG: () => 'game:config',
  GAME_STATS_DAILY: () => 'game:stats:daily',
}

// Types
export interface UserProfile {
  fid: string
  username: string
  displayName: string
  profileImage: string
  balance: number
  createdAt: number
  lastSeen: number
}

export interface BettingSession {
  id: string
  question: string
  status: 'open' | 'frozen' | 'closed' | 'resolved'
  totalPool: number
  leftPool: number
  rightPool: number
  leftBetCount: number
  rightBetCount: number
  winner: 'left' | 'right' | null
  serviceFeePercent: number
  showPrizePool: boolean
  createdAt: number
  frozenAt?: number
  closedAt?: number
  resolvedAt?: number
}

export interface UserBets {
  userId: string
  sessionId: string
  leftAmount: number   // Total amount bet on left
  rightAmount: number  // Total amount bet on right
  transactions: BetTransaction[]
}

export interface BetTransaction {
  option: 'left' | 'right'
  amount: number
  timestamp: number
}

export interface UserBettingStats {
  totalSessions: number
  totalWon: number
  totalLost: number
  totalWagered: number
  totalWinnings: number
  profitLoss: number
}

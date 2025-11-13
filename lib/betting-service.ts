import { redis, REDIS_KEYS, BettingSession, UserBets, BetTransaction, UserBettingStats } from './redis'
import { nanoid } from 'nanoid'

export class BettingService {
  private static SERVICE_FEE_PERCENT = 6.9

  // Create a new betting session
  static async createSession(question: string, showPrizePool: boolean = true): Promise<BettingSession> {
    const sessionId = `bet_${nanoid(10)}`
    const session: BettingSession = {
      id: sessionId,
      question,
      status: 'open',
      totalPool: 0,
      leftPool: 0,
      rightPool: 0,
      leftBetCount: 0,
      rightBetCount: 0,
      winner: null,
      serviceFeePercent: this.SERVICE_FEE_PERCENT,
      showPrizePool,
      createdAt: Date.now(),
    }

    await redis.set(REDIS_KEYS.BETTING_SESSION(sessionId), session)
    await redis.set(REDIS_KEYS.BETTING_CURRENT(), sessionId)
    
    return session
  }

  // Get current betting session
  static async getCurrentSession(): Promise<BettingSession | null> {
    const sessionId = await redis.get<string>(REDIS_KEYS.BETTING_CURRENT())
    if (!sessionId) return null
    
    return await redis.get<BettingSession>(REDIS_KEYS.BETTING_SESSION(sessionId))
  }

  // Get a specific betting session by ID
  static async getSession(sessionId: string): Promise<BettingSession | null> {
    return await redis.get<BettingSession>(REDIS_KEYS.BETTING_SESSION(sessionId))
  }

  // Place a bet (supports multiple bets per user)
  static async placeBet(
    sessionId: string, 
    userId: string, 
    option: 'left' | 'right', 
    amount: number
  ): Promise<{ success: boolean; error?: string }> {
    // Get session
    const session = await redis.get<BettingSession>(REDIS_KEYS.BETTING_SESSION(sessionId))
    if (!session) return { success: false, error: 'Session not found' }
    if (session.status !== 'open') return { success: false, error: 'Betting is closed' }

    // Get or create user bets for this session
    const userBetsKey = REDIS_KEYS.BETTING_USER_BETS(sessionId, userId)
    let userBets = await redis.get<UserBets>(userBetsKey)
    
    if (!userBets) {
      userBets = {
        userId,
        sessionId,
        leftAmount: 0,
        rightAmount: 0,
        transactions: []
      }
    }

    // Check user's total bets for this round (max $10 per user per round)
    const currentTotal = userBets.leftAmount + userBets.rightAmount
    if (currentTotal + amount > 10) {
      return { success: false, error: `Maximum $10 per round. You can bet $${(10 - currentTotal).toFixed(2)} more.` }
    }

    // Check button limit (max $100 per button per round)
    const buttonTotal = option === 'left' ? session.leftPool : session.rightPool
    if (buttonTotal + amount > 100) {
      return { success: false, error: `Maximum $100 per button. This button can accept $${(100 - buttonTotal).toFixed(2)} more.` }
    }

    // Add new transaction
    const transaction: BetTransaction = {
      option,
      amount,
      timestamp: Date.now()
    }
    
    userBets.transactions.push(transaction)
    
    // Update totals
    if (option === 'left') {
      userBets.leftAmount += amount
      session.leftPool += amount
    } else {
      userBets.rightAmount += amount
      session.rightPool += amount
    }
    
    session.totalPool = session.leftPool + session.rightPool

    // Update bet counts (only count users who have bet, not number of bets)
    const allBetsKey = REDIS_KEYS.BETTING_SESSION_BETS(sessionId)
    await redis.sadd(allBetsKey, userId)
    
    // Recalculate unique bettor counts
    const leftBettors = new Set<string>()
    const rightBettors = new Set<string>()
    
    const allBettorIds = await redis.smembers(allBetsKey)
    for (const bettorId of allBettorIds) {
      const bettorBets = await redis.get<UserBets>(REDIS_KEYS.BETTING_USER_BETS(sessionId, bettorId))
      if (bettorBets) {
        if (bettorBets.leftAmount > 0) leftBettors.add(bettorId)
        if (bettorBets.rightAmount > 0) rightBettors.add(bettorId)
      }
    }
    
    session.leftBetCount = leftBettors.size
    session.rightBetCount = rightBettors.size

    // Save updated data
    await redis.set(userBetsKey, userBets)
    await redis.set(REDIS_KEYS.BETTING_SESSION(sessionId), session)

    return { success: true }
  }

  // Freeze betting (admin only)
  static async freezeBetting(sessionId: string): Promise<boolean> {
    const session = await redis.get<BettingSession>(REDIS_KEYS.BETTING_SESSION(sessionId))
    if (!session || session.status !== 'open') return false

    session.status = 'frozen'
    session.frozenAt = Date.now()
    
    await redis.set(REDIS_KEYS.BETTING_SESSION(sessionId), session)
    return true
  }

  // Toggle prize pool visibility (admin only)
  static async togglePrizePool(sessionId: string): Promise<boolean> {
    const session = await redis.get<BettingSession>(REDIS_KEYS.BETTING_SESSION(sessionId))
    if (!session) return false

    session.showPrizePool = !session.showPrizePool
    
    await redis.set(REDIS_KEYS.BETTING_SESSION(sessionId), session)
    return session.showPrizePool
  }

  // Close betting and declare winner (admin only)
  static async resolveSession(
    sessionId: string, 
    winner: 'left' | 'right'
  ): Promise<{ payouts: Array<{ userId: string; amount: number }>; serviceFee: number }> {
    const session = await redis.get<BettingSession>(REDIS_KEYS.BETTING_SESSION(sessionId))
    if (!session || session.status === 'resolved') {
      throw new Error('Invalid session')
    }

    session.status = 'resolved'
    session.winner = winner
    session.resolvedAt = Date.now()

    // Calculate payouts - simple 2x payout minus service fee
    const payouts: Array<{ userId: string; amount: number }> = []
    let totalPayouts = 0
    
    // Get all bettors
    const allBettorIds = await redis.smembers(REDIS_KEYS.BETTING_SESSION_BETS(sessionId))
    
    for (const bettorId of allBettorIds) {
      const userBets = await redis.get<UserBets>(REDIS_KEYS.BETTING_USER_BETS(sessionId, bettorId))
      if (userBets) {
        const winningAmount = winner === 'left' ? userBets.leftAmount : userBets.rightAmount
        
        if (winningAmount > 0) {
          // Simple 2x payout minus service fee
          const grossPayout = winningAmount * 2
          const serviceFeeOnPayout = grossPayout * (session.serviceFeePercent / 100)
          const netPayout = grossPayout - serviceFeeOnPayout
          
          payouts.push({
            userId: bettorId,
            amount: netPayout
          })
          
          totalPayouts += netPayout
        }

        // Update user stats
        await this.updateUserStats(bettorId, userBets, winner)
      }
    }
    
    // Calculate total service fee collected
    const losingPool = winner === 'left' ? session.rightPool : session.leftPool
    const serviceFee = losingPool + (totalPayouts * (session.serviceFeePercent / (100 - session.serviceFeePercent)))

    // Save resolved session with payouts
    const resolvedSession = { ...session, resolvedPayouts: payouts };
    await redis.set(REDIS_KEYS.BETTING_SESSION(sessionId), resolvedSession)
    
    // Add to history
    await redis.lpush(REDIS_KEYS.BETTING_HISTORY(), sessionId)
    
    // Don't clear current session here - let it be replaced when a new session is created
    // This allows users to see the resolved session results

    return { payouts, serviceFee }
  }

  // Update user betting statistics
  private static async updateUserStats(userId: string, userBets: UserBets, winner: 'left' | 'right') {
    const statsKey = REDIS_KEYS.USER_BETTING_STATS(userId)
    let stats = await redis.get<UserBettingStats>(statsKey)
    
    if (!stats) {
      stats = {
        totalSessions: 0,
        totalWon: 0,
        totalLost: 0,
        totalWagered: 0,
        totalWinnings: 0,
        profitLoss: 0
      }
    }

    stats.totalSessions++
    stats.totalWagered += userBets.leftAmount + userBets.rightAmount

    const winningAmount = winner === 'left' ? userBets.leftAmount : userBets.rightAmount
    const losingAmount = winner === 'left' ? userBets.rightAmount : userBets.leftAmount

    if (winningAmount > 0) {
      stats.totalWon++
    } else if (losingAmount > 0) {
      stats.totalLost++
    }

    await redis.set(statsKey, stats)
  }

  // Get user bets for current session
  static async getUserBets(sessionId: string, userId: string): Promise<UserBets | null> {
    return await redis.get<UserBets>(REDIS_KEYS.BETTING_USER_BETS(sessionId, userId))
  }

  // Get all bets for a session (admin view)
  static async getAllSessionBets(sessionId: string): Promise<UserBets[]> {
    const allBettorIds = await redis.smembers(REDIS_KEYS.BETTING_SESSION_BETS(sessionId))
    const allBets: UserBets[] = []
    
    for (const bettorId of allBettorIds) {
      const userBets = await redis.get<UserBets>(REDIS_KEYS.BETTING_USER_BETS(sessionId, bettorId))
      if (userBets) {
        allBets.push(userBets)
      }
    }
    
    return allBets
  }

  // Get betting history
  static async getBettingHistory(limit: number = 10): Promise<BettingSession[]> {
    const sessionIds = await redis.lrange(REDIS_KEYS.BETTING_HISTORY(), 0, limit - 1)
    const sessions: BettingSession[] = []
    
    for (const sessionId of sessionIds) {
      const session = await redis.get<BettingSession>(REDIS_KEYS.BETTING_SESSION(sessionId))
      if (session) {
        sessions.push(session)
      }
    }
    
    return sessions
  }

  // Delete betting session (admin only)
  static async deleteSession(sessionId: string): Promise<boolean> {
    const session = await redis.get<BettingSession>(REDIS_KEYS.BETTING_SESSION(sessionId))
    if (!session) return false

    // Delete session data
    await redis.del(REDIS_KEYS.BETTING_SESSION(sessionId))
    
    // Remove from history
    await redis.lrem(REDIS_KEYS.BETTING_HISTORY(), 0, sessionId)
    
    // If this is the current session, delete it
    const currentSession = await redis.get<BettingSession>(REDIS_KEYS.BETTING_CURRENT())
    if (currentSession && currentSession.id === sessionId) {
      await redis.del(REDIS_KEYS.BETTING_CURRENT())
    }
    
    // Delete all user bets for this session
    const allBettorIds = await redis.smembers(REDIS_KEYS.BETTING_SESSION_BETS(sessionId))
    for (const bettorId of allBettorIds) {
      await redis.del(REDIS_KEYS.BETTING_USER_BETS(sessionId, bettorId))
    }
    await redis.del(REDIS_KEYS.BETTING_SESSION_BETS(sessionId))
    
    // Clear current session if it was this one
    const currentSessionId = await redis.get<string>(REDIS_KEYS.BETTING_CURRENT())
    if (currentSessionId === sessionId) {
      await redis.del(REDIS_KEYS.BETTING_CURRENT())
    }
    
    return true
  }
}

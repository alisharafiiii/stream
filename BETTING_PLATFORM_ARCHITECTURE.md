# Live Betting Platform Architecture

## Overview
A live betting platform where viewers can bet on real-time events during YouTube livestreams, with automated payouts and admin controls.

## System Flow

### 1. Betting Session Lifecycle
```
1. Admin starts new betting session
   └─> Define bet question (e.g., "Next car plate: Even or Odd?")
   └─> Enable betting buttons
   └─> Set minimum bet amount

2. Users place bets
   └─> Choose option (Left/Odd or Right/Even)
   └─> Bet amount deducted from balance
   └─> Bet recorded in Redis

3. Admin closes betting
   └─> Disable betting buttons
   └─> Show total pool and bet distribution

4. Admin declares winner
   └─> Select winning option
   └─> Calculate payouts (79% to winners, 21% service fee)
   └─> Distribute winnings

5. Reset for next round
```

### 2. Database Structure (Upstash Redis)

#### Key-Value Schema:
```
// Current betting session
betting:current:{sessionId} = {
  id: "session_123",
  question: "Next car plate even or odd?",
  options: ["odd", "even"],
  status: "open" | "closed" | "resolved",
  totalPool: 100.00,
  leftPool: 40.00,  // Total bet on left option
  rightPool: 60.00, // Total bet on right option
  winner: null | "left" | "right",
  createdAt: timestamp,
  closedAt: timestamp,
  resolvedAt: timestamp
}

// User bets for a session
betting:bets:{sessionId}:{userId} = {
  userId: "fid_123",
  option: "left" | "right",
  amount: 10.00,
  timestamp: timestamp,
  paidOut: false
}

// Betting history
betting:history:{sessionId} = {
  // Same as current session but archived
}

// User betting stats
user:betting:stats:{userId} = {
  totalBets: 50,
  totalWon: 30,
  totalLost: 20,
  totalWagered: 500.00,
  totalWinnings: 300.00
}
```

### 3. Prize Pool & Payout Calculation

#### Example Scenario:
- Total pool: $100
- Left bets: $40 (4 users)
- Right bets: $60 (6 users)
- Winner: Left

#### Payout Calculation:
```
Service fee: $100 × 21% = $21
Winners pool: $100 - $21 = $79

Each winner gets proportional share:
User A bet $10 on left → Gets: ($10/$40) × $79 = $19.75
User B bet $15 on left → Gets: ($15/$40) × $79 = $29.63
... and so on
```

### 4. Technical Implementation

#### Backend Requirements:
1. **Upstash Redis** - Store betting sessions and user bets
2. **Base Paymaster** - Handle payments and payouts
3. **WebSocket/Polling** - Real-time updates for bet counts
4. **Admin API** - Protected endpoints for session management

#### API Endpoints:
```
POST /api/betting/session      - Create new betting session (admin)
GET  /api/betting/current      - Get current session info
POST /api/betting/place        - Place a bet (user)
PUT  /api/betting/close        - Close betting (admin)
PUT  /api/betting/resolve      - Declare winner & payout (admin)
GET  /api/betting/history      - Get betting history
GET  /api/betting/user-stats   - Get user's betting stats
```

#### Security Considerations:
1. Admin wallet verification for all admin actions
2. Balance checks before accepting bets
3. Prevent double betting per session
4. Atomic operations for bet placement and payouts
5. Service fee automatically sent to platform wallet

### 5. UI Components

#### User Interface:
- Betting card with question and current odds
- Two betting buttons (Left/Right)
- Real-time pool amounts and participant counts
- Betting history and stats

#### Admin Interface:
- Create/manage betting sessions
- View all bets and participants
- Close betting and declare winners
- Monitor service fee collection

### 6. Smart Contract Integration (Optional)
For transparency, consider logging betting results on-chain:
- Session hash and winner
- Total pool and payout amounts
- Service fee collection

This provides an immutable record of all betting activities.

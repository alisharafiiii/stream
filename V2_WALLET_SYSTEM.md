# V2 - WALLET CONNECTION SYSTEM ✅

## WHAT'S BEEN BUILT:

### **1. UNIVERSAL WALLET CONNECTION**

#### **For Base App Users (MiniKit):**
- ✅ Auto-detects Base app environment
- ✅ Uses `@coinbase/onchainkit/minikit` authentication
- ✅ Triggers native Base app modal (slides up with Cancel/Confirm)
- ✅ Extracts FID from signed message
- ✅ Fetches Farcaster profile data:
  - Username (basename or farcaster username)
  - Display name
  - Profile picture (from Farcaster)
  - Wallet address (if available)
- ✅ Creates unique UID: `base_{fid}_{timestamp}`

#### **For Browser Users:**
**Wallet Selection Modal shows 3 options:**
- 🦊 **MetaMask**
- 🌈 **Rainbow**
- 👻 **Phantom**

**After selecting wallet:**
- ✅ Connects to selected provider
- ✅ Requests account access (`eth_requestAccounts`)
- ✅ Tries to fetch basename from Base API
- ✅ Fallback to first 6 chars of address: `0x1234...` → `0x1234`
- ✅ Generates Identicon PFP: `https://api.dicebear.com/7.x/identicon/png?seed={address}`
- ✅ Creates unique UID: `wallet_{address}`

---

### **2. USER DATA SAVED TO BACKEND**

**Every connected user gets:**
```typescript
{
  uid: string,              // Unique system ID
  fid?: string,             // Farcaster ID (Base app only)
  username: string,         // basename or wallet address (6 chars)
  displayName: string,      // Full display name
  profileImage: string,     // Farcaster PFP or Identicon
  walletAddress?: string,   // Ethereum address
  source: 'base_app' | 'browser_wallet',
  connectedAt: number,      // Timestamp
  balance: number,          // User balance
  totalBets: number,        // Total bets placed
  totalWon: number,         // Total won
  lastActive: number        // Last activity timestamp
}
```

**Stored in Redis:**
- `v2:user:{uid}` → User data
- `v2:users:all` → Set of all user UIDs

---

### **3. UI FEATURES**

#### **Header (Top Right):**
**When Connected:**
- Username (clickable) → Opens balance modal
- Balance $X.XX + (clickable) → Opens balance modal
- Shows first 6 chars for wallet users: `0xAbcd...` → `0xAbcd`

**When Not Connected:**
- Purple "CONNECT" button
- Base app → Auto-connects with MiniKit
- Browser → Shows wallet selection modal

#### **Balance Modal:**
**Footer Section:**
- Profile picture (32×32px, purple border)
  - Shows Farcaster PFP for Base app users
  - Shows Identicon for wallet users
  - Fallback 👤 emoji if none
- Username/Display name
- **CONNECTED button:**
  - Click → Changes to red **DISCONNECT** button
  - Click DISCONNECT → Disconnects wallet, closes modal

---

### **4. ADMIN PANEL - USERS TAB**

**Shows all connected users in table:**

| PFP | USERNAME | UID | SOURCE | BALANCE | BETS | WON |
|-----|----------|-----|--------|---------|------|-----|
| 🖼️ | user.base | base_123... | BASE APP | $100 | 5 | $50 |
| 🖼️ | 0xAbcd | wallet_0x... | BROWSER | $50 | 2 | $0 |

**Columns:**
- **PFP:** Profile picture (32×32px)
- **USERNAME:** Display name + FID/wallet address below
- **UID:** System unique ID (truncated)
- **SOURCE:** Badge showing "BASE APP" (green) or "BROWSER WALLET" (red)
- **BALANCE:** Current balance
- **BETS:** Total bets placed
- **WON:** Total amount won

**Stats Summary:**
- Total Users
- Base App Users
- Browser Wallet Users

---

### **5. API ENDPOINTS**

#### **`/api/v2/users` (POST)**
Create/update user
```json
{
  "uid": "wallet_0xAbcd...",
  "username": "0xAbcd",
  "walletAddress": "0xAbcd...",
  "profileImage": "https://...",
  "source": "browser_wallet"
}
```

#### **`/api/v2/users` (GET)**
Get all users (admin only)
```json
{
  "users": [...]
}
```

#### **`/api/v2/users/[uid]/balance` (GET)**
Get user balance
```json
{
  "balance": 1250.50
}
```

#### **`/api/v2/users/[uid]/balance` (POST)**
Update balance (deposit/withdraw)
```json
{
  "amount": 100,
  "type": "deposit" | "withdraw"
}
```

---

### **6. FALLBACK LOGIC**

#### **For Users Without Name:**
```javascript
// Priority order:
1. Basename (from Base API)
2. Farcaster username (from MiniKit)
3. First 6 chars of wallet: "0x1234"
```

#### **For Users Without PFP:**
```javascript
// Priority order:
1. Farcaster profile image
2. Identicon (generated from address)
3. 👤 emoji fallback
```

---

### **7. HOW IT WORKS**

#### **Base App User Flow:**
1. User visits `/v2` in Base app
2. Clicks "CONNECT"
3. Base app shows native authentication modal
4. User confirms
5. System extracts FID, fetches Farcaster data
6. User saved to backend with PFP
7. Balance modal shows Farcaster PFP

#### **Browser User Flow:**
1. User visits `/v2` in browser
2. Clicks "CONNECT"
3. **Wallet selection modal** appears
4. User selects MetaMask/Rainbow/Phantom
5. Wallet connection popup appears
6. User approves
7. System gets wallet address
8. Tries to fetch basename
9. Fallback to `0x1234` (6 chars)
10. Generates Identicon PFP
11. User saved to backend
12. Header shows `0x1234` + Identicon in modal

---

### **8. TEST SCENARIOS**

#### **Scenario 1: Base App User with Farcaster**
- ✅ Shows real username (`user.base.eth`)
- ✅ Shows Farcaster PFP
- ✅ FID saved to backend
- ✅ Appears in admin as "BASE APP"

#### **Scenario 2: Browser User with Basename**
- ✅ Shows basename (`alice.base.eth`)
- ✅ Shows Identicon PFP
- ✅ Wallet address saved
- ✅ Appears in admin as "BROWSER WALLET"

#### **Scenario 3: Browser User WITHOUT Basename**
- ✅ Shows `0xAbcd` (first 6 chars)
- ✅ Shows Identicon PFP
- ✅ Wallet address saved
- ✅ Appears in admin as "BROWSER WALLET"

---

## **TEST IT NOW:**

```bash
npm run dev
```

### **From Base App:**
1. Go to `/v2` in Base app
2. Click "CONNECT"
3. Approve in Base app modal
4. See your Farcaster username + PFP

### **From Browser:**
1. Go to `/v2` in Chrome/Firefox
2. Click "CONNECT"
3. **Wallet selection modal** appears
4. Choose MetaMask/Rainbow/Phantom
5. Approve in wallet
6. See `0xAbcd` (6 chars) + Identicon PFP

### **Admin Panel:**
1. Go to `/v2/admin`
2. Click "USERS" tab
3. See all connected users with PFPs, UIDs, sources, balances

---

**Complete wallet system with Base app + browser support!** 🎮💜✨


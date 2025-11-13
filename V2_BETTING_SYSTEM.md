# V2 - BETTING SYSTEM COMPLETE ✅

## WHAT'S BEEN BUILT:

### **1. USER PAGE (`/v2`)**
- ✅ Auto-playing vertical stream (muted by default)
- ✅ Click N Pray logo (cliclogo2.png - 96px, centered)
- ✅ **Left controls (stacked vertically):**
  - LIVE indicator on top - Shows LIVE (red pulsing dot) or OFF (grey)
  - Mute/unmute button below - 🔊/🔇
  - 8px gap between them, proper spacing from borders
- ✅ **Right controls (stacked vertically):**
  - Username only (light grey #ccc, NO pfp in header)
  - Balance button below with + icon (no border, dark grey #666)
  - Opens pixel retro balance modal
- ✅ **Pixel Balance Modal (Neon Purple Theme):**
  - Purple terminal design (#8b5cf6 on black)
  - Big pixel balance amount (48px font, purple glow)
  - Deposit button (purple filled with 3D press effect)
  - Withdraw button (purple outline with 3D press effect)
  - User info footer with pfp, username, and "CONNECTED" badge
  - Slide-up animation, backdrop blur
- ✅ **Header Layout:** Logo perfectly centered with balanced left/right sides (120px min-width each)
- ✅ **BETTING DASHBOARD** with toggle (▼/▶ arrows to collapse/expand)
- ✅ Dynamic grid layout (2-8 options)
- ✅ **Responsive buttons** - Fixed heights, covers full board width
- ✅ Pixel-style buttons with colors and 3D press effect
- ✅ Touch-friendly for mobile (onTouchStart/End events)
- ✅ **Selected option highlight** - Purple border when clicked
- ✅ **Bet Amount UI** - COMPACT 2-row design when option selected:
  - **Row 1:** [25%] [50%] [MAX] [$ input field] - All in one line
  - **Row 2:** [BET $X.XX] button - Full width, shows amount
  - Purple theme throughout
  - Preset buttons auto-calculate from balance
  - Disabled state when no amount entered
  - Slide-down animation
  - **Smart behavior:**
    - Click player → Shows bet UI
    - Click same player again → Closes bet UI (toggle)
    - Collapse dashboard → Automatically closes bet UI
- ✅ **Chat System (TikTok-style):**
  - 💬 Purple glowing icon (no circle, transparent background)
  - **Minimal input:** One box with send icon (➤) inside
  - Auto-closes after sending
  - **Comments overlay (no boxes, just floating text):**
    - Profile pic: 30px (25% smaller)
    - Username & message: 9px font (25% smaller)
    - **White text with black shadow** (readable on any background)
    - Progressive fade (newest 100% → oldest 20%)
    - Slide-up animation
  - **Smart positioning:** Stays above footer in all states
    - Collapsed: 80px from bottom
    - Open (no bet): 170px from bottom
    - Open + bet UI: 220px from bottom
  - Placeholder implementation (will connect to API in Phase 2)
- ✅ Real-time updates (polls every 5 seconds)

### **2. ADMIN PANEL (`/v2/admin`)**
- ✅ **STREAM CONTROL:**
  - Set YouTube live URL
  - Toggle stream ON/OFF
  - Link to view live stream
- ✅ **BETTING ROUND SETUP:**
  - Set question (pixel-style input)
  - Choose number of options (2-8)
  - For each option:
    - Set name
    - Choose color from 8 options
    - Live preview
  - Update button saves to Redis
- ✅ Pixel/retro green terminal design

### **3. API ROUTES**
- `/api/v2/stream` - GET/POST stream config
- `/api/v2/betting` - GET/POST betting round config

### **4. COLORS AVAILABLE**
🔴 RED (#FF0000)
🔵 BLUE (#0000FF)
🟢 GREEN (#00FF00)
🟡 YELLOW (#FFFF00)
🟠 ORANGE (#FF8800)
🟣 PURPLE (#8800FF)
⚪ WHITE (#FFFFFF)
⚫ BLACK (#000000)

## SMART COLLAGE LAYOUTS (Fixed Footer Height):

**Grid container max-height: 130px (doesn't expand)**

- **2 options:** 2 columns × 60px height = 1 row
- **3 options:** 3 columns × 60px height = 1 row
- **4 options:** 2 columns × 50px height = 2 rows (2×2 grid)
- **5-6 options:** 3 columns × 50px height = 2 rows
- **7-8 options:** 4 columns × 45px height = 2 rows

**Buttons automatically resize to fit in same area!**
**Font sizes: 16px (2-3), 14px (4-6), 12px (7-8)**

## HOW TO USE:

### **Admin:**
1. Go to `/v2/admin`
2. Set stream URL and toggle ON
3. Set betting question
4. Choose number of players (2-8)
5. Set name and color for each
6. Click "UPDATE BETTING ROUND"
7. Click "VIEW LIVE STREAM" to see it live

### **Users:**
1. Go to `/v2`
2. Stream auto-plays (muted)
3. Click 🔇 to unmute
4. See betting dashboard at bottom
5. Click question bar to collapse/expand
6. Buttons ready for betting (Phase 2)

## NEXT PHASE (Phase 2):
- [ ] Betting logic (place bets, amounts)
- [ ] Freeze betting
- [ ] Resolve winner
- [ ] Payout calculation (multiplier × bet amount)
- [ ] User wallet integration
- [ ] Transaction history

## REDIS STRUCTURE:

```typescript
// Stream config
v2:stream:config = {
  url: "youtube.com/live/...",
  isLive: true,
  updatedAt: timestamp
}

// Betting round
v2:betting:round = {
  question: "WHO WILL WIN?",
  options: [
    { name: "TRUMP", color: "#FF0000" },
    { name: "KAMALA", color: "#0000FF" }
  ],
  updatedAt: timestamp
}
```

## TEST IT NOW:

```bash
npm run dev
```

- Admin: `http://localhost:3000/v2/admin`
- Live: `http://localhost:3000/v2`

---

**PHASE 1 COMPLETE! 🎮✨**


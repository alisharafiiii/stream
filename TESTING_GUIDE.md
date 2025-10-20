# 🎯 Complete Testing Guide for Live Betting Platform

## ⚠️ CRITICAL: USE THE CORRECT URL!

### Current Live URL:
# https://stream-qp0g5j3x8-nabus-projects-fb6829d6.vercel.app

### Admin Panel:
# https://stream-qp0g5j3x8-nabus-projects-fb6829d6.vercel.app/admin

## Step-by-Step Testing Instructions:

### 1. Setup Test Environment
1. Open **TWO browser windows/tabs**:
   - Tab 1: Main app (for user betting)
   - Tab 2: Admin panel (for controlling sessions)

2. In Tab 1 (Main App):
   - Go to: https://stream-qp0g5j3x8-nabus-projects-fb6829d6.vercel.app
   - Click "Connect Wallet" or "Connect with Base"
   - You'll get $10 starting balance

3. In Tab 2 (Admin Panel):
   - Go to: https://stream-qp0g5j3x8-nabus-projects-fb6829d6.vercel.app/admin
   - Connect with your admin wallet

### 2. Create a Betting Session
In Admin Panel:
1. Scroll to "Betting Sessions" section
2. Enter a question like "Will the next car be red?"
3. Click "Create Session"
4. You should see the session appear with status "Open"

### 3. Place Bets (User Side)
In Main App:
1. You should see the betting card with the question
2. Click the **Purple (Left)** or **Blue (Right)** button
3. The button expands to show bet amounts
4. Click a preset amount ($0.10, $0.25, etc.) or enter custom
5. Your balance should update immediately
6. The pool amounts should increase

### 4. Test Multiple Bets
1. Place another bet on the same button
2. Place a bet on the opposite button
3. Check that:
   - Your total bets on each side are displayed
   - The bettor count shows unique users (not number of bets)
   - Balance updates after each bet

### 5. Freeze the Session
In Admin Panel:
1. Click "Freeze" button on the session
2. In Main App, verify:
   - Buttons are still visible but disabled
   - Status shows "Betting Frozen"
   - You cannot place new bets

### 6. Declare Winner & See Animations
In Admin Panel:
1. Click either "Left Wins" or "Right Wins"
2. **IMMEDIATELY** switch to Main App tab

In Main App, you should see:
- ✅ **Winner button**: Pulses with green glow animation
- ✅ **Loser button**: Fades to 30% opacity
- ✅ **Receipt overlay**: Shows automatically if you placed bets
- ✅ **Balance update**: Your new balance after payout

### 7. What the Receipt Shows:
- Your bets on each side
- Total amount bet
- Whether you won or lost
- If you won:
  - Winning amount
  - Prize pool share
  - Service fee (21%)
  - Total payout
- Click "Continue" to close

### 8. Check Console for Debug Info
Press F12 (Developer Tools) and check Console tab:
- Look for `[BettingCard]` messages
- You should see:
  - Session status checks
  - User bet amounts
  - "Setting showResult to true"
  - Payout calculations

## Common Issues & Solutions:

### Issue: "No animations or receipt showing"
**Solution**: 
1. Make sure you're using the CORRECT URL (not the old one)
2. Check console for errors - if you see 404 errors, you're on wrong URL
3. Ensure you actually placed bets before the round ended

### Issue: "Balance not updating"
**Solution**: 
- Balance updates automatically after:
  - Placing a bet (immediate)
  - Receiving payout (2 second delay)
- Check console for any errors

### Issue: "Bettor count seems wrong"
**Solution**: 
- The count shows UNIQUE users, not total bets
- If you bet 3 times, you still count as 1 bettor
- Each side shows how many different users bet on it

## Mobile Testing:
1. The betting card is responsive
2. On small screens:
   - Buttons are smaller
   - Bet options appear at bottom of screen
   - Font sizes adjust automatically

## What's Working Now:
✅ Animations on win/loss
✅ Automatic receipt display
✅ Balance auto-updates
✅ Accurate bettor counts
✅ Mobile responsive design
✅ Authentication persistence
✅ Stream persistence

Remember: Always use the latest deployment URL, not old bookmarks!

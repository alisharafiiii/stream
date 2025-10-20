# 🧪 Test Your New Features!

## 1. Test Betting Limits

### User Limit ($10 max):
1. Place a $5 bet on left
2. Place another $5 bet on right
3. Try to bet $1 more - should see: "Maximum $10 per round. You can bet $0.00 more."

### Button Limit ($100 max):
1. Have multiple users bet until one button reaches ~$95
2. Try to bet $10 on that button
3. Should see: "Maximum $100 per button. This button can accept $5.00 more."

## 2. Test New Payout (2x minus 21%)

1. Create betting session
2. Bet $1 on left
3. Freeze betting
4. Pick left as winner
5. You should receive:
   - Gross: $2.00
   - Service fee: -$0.42
   - **Net payout: $1.58**

## 3. Test Withdrawal Fix

1. Click balance → Withdraw
2. Enter $0.50
3. Should work now! (was showing insufficient gas before)
4. Check on BaseScan

## 4. Check Receipt Display

After winning a bet, the receipt shows:
- ✅ Winning Bet: $1.00
- ✅ 2x Payout: $2.00  
- ✅ Service Fee (21%): -$0.42
- ✅ **Total Payout: $1.58**

## 📊 Quick Math Check:

- Bet $5, win = $7.90
- Bet $10, win = $15.80
- Bet $1, lose = $0

Simple and clear! 🎯

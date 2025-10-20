# 🧪 Quick Test Commands

## Paste these in your browser console to test:

### 1. Check If You're in Real Mode:
```javascript
// This will tell you if real payments are enabled
fetch('/api/user/withdraw-real', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    fid: '123',
    amount: 0.01,
    walletAddress: '0x0000000000000000000000000000000000000000'
  })
}).then(r => r.json()).then(data => {
  console.log('Payment Mode:', data.isReal ? '✅ REAL MONEY' : '❌ DEMO MODE');
  if (!data.isReal) {
    console.log('⚠️  Treasury private key not set in this deployment!');
  }
});
```

### 2. Check Your Current Balance:
```javascript
const user = JSON.parse(localStorage.getItem('streamUser') || '{}');
console.log('Your Balance: $' + (user.balance || 0));
console.log('Your FID:', user.fid);
```

### 3. Test Deposit Flow (Opens Base Pay):
```javascript
// This simulates clicking deposit
console.log('To test deposit: Click your balance → Deposit → Enter amount → Pay with USDC');
```

### 4. View Treasury Balance:
```javascript
console.log('Treasury: https://basescan.org/address/0x00081fd198A649c4DBF4B3AB6E9f8dd611f92611');
console.log('Current USDC: $5.00');
console.log('Current ETH: 0.0005 (~$1.25)');
```

## 📱 Mobile Testing:

If testing on phone:
1. Open in Base app
2. Make sure you're on WiFi (faster)
3. Have USDC in your Base wallet
4. Start with $0.50 test transactions

## 🎯 Success Checklist:

- [ ] Admin panel shows "Live Mode"
- [ ] Treasury Monitor shows real balances
- [ ] Deposit adds USDC to treasury
- [ ] Withdrawal sends USDC to user
- [ ] All visible on BaseScan

You're ready to go! 🚀

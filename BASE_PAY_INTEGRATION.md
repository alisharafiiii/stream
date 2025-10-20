# Base Pay Integration

This app now uses the official Base Pay SDK for real USDC payments.

## Configuration

Edit `/app/config/payment.ts` to set:
- `recipientAddress`: Your wallet address to receive payments
- `useTestnet`: false (currently on mainnet)

## How It Works

1. **User clicks top-up amount** → Selects how much to add
2. **Clicks Base Pay button** → Opens wallet payment popup
3. **Confirms payment** → USDC sent to your address
4. **Balance updates** → Stored in Vercel KV or memory

## Now Live on Base Mainnet

The app is configured for mainnet (`useTestnet: false`).

- **Payments use real USDC** on Base mainnet
- **View transactions** on [BaseScan](https://basescan.org)
- **Recipient wallet**: `0xAbD4BB1Ba7C9a57C40598604A7ad0E5d105AD54D`

## For Testing (Optional)

To switch back to testnet:
1. Set `useTestnet: true` in `/app/config/payment.ts`
2. Get test USDC from [Circle Faucet](https://faucet.circle.com) (select "Base Sepolia")
3. View test transactions on [Sepolia BaseScan](https://sepolia.basescan.org)

## Payment Flow

```typescript
// User clicks BasePayButton
const payment = await pay({
  amount: '10.00',                        // USD amount
  to: '0xYourWallet',                    // Your recipient address
  testnet: false,                        // Mainnet
});

// Poll for completion
const status = await getPaymentStatus({
  id: payment.id,
  testnet: false
});

if (status.status === 'completed') {
  // Update user balance
}
```

## Production Status

- [x] ✅ `useTestnet: false` - Running on mainnet
- [x] ✅ `recipientAddress` set to your wallet
- [x] ✅ No email collection during payment
- [ ] Set up Vercel KV for persistent storage (currently using memory)
- [ ] Test with real USDC on Base mainnet

## Troubleshooting

**"Payment failed" error**
- Check if user has USDC balance
- Verify wallet is connected to correct network
- Ensure recipient address is valid

**Payment stuck on "Processing"**
- Transaction may be pending on chain
- Check transaction status on BaseScan
- Timeout is set to 30 seconds

**Balance not updating**
- Payment may have succeeded but API failed
- Check server logs for errors
- Verify Vercel KV is configured

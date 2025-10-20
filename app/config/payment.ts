// Payment configuration
export const PAYMENT_CONFIG = {
  // The wallet address that receives payments
  // This should be your wallet address where you want to receive USDC
  recipientAddress: '0xAbD4BB1Ba7C9a57C40598604A7ad0E5d105AD54D', // Your admin wallet
  
  // Set to true for testing on Base Sepolia, false for mainnet
  useTestnet: false,
  
  // Optional: Custom payment metadata
  metadata: {
    app: 'Stream Live',
    version: '1.0.0',
  }
};

// Helper to format USDC amounts (6 decimals)
export function formatUSDC(amount: number): string {
  return amount.toFixed(2);
}

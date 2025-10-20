// Admin wallet addresses
export const ADMIN_WALLETS = [
  process.env.ADMIN_WALLET || "0xAbD4BB1Ba7C9a57C40598604A7ad0E5d105AD54D",
  "0x37ed24e7c7311836fd01702a882937138688c1a9" // Added admin wallet
].map(w => w.toLowerCase());

// Check if a wallet address is an admin
export function isAdminWallet(walletAddress: string | null | undefined): boolean {
  if (!walletAddress) return false;
  return ADMIN_WALLETS.includes(walletAddress.toLowerCase());
}

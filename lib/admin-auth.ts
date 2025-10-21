// Admin wallet addresses
export const ADMIN_WALLETS = [
  process.env.ADMIN_WALLET || "0xAbD4BB1Ba7C9a57C40598604A7ad0E5d105AD54D",
  "0x37ed24e7c7311836fd01702a882937138688c1a9", // Added admin wallet
  "0x2148Cac52C14597131f55786499dc5A11b3e2d2d",
  "0xD8eED2630c3ed60521bB919b1E05F48Ae318aD1a",
  "0xFE48D425bEdca014D9E0a4EcD11D82Fb695611c0",
  "0x6eB860fD157e63604e6a9192dECd347A9A6aD610",
  "0x88652e47d32ee3c905619Eba3C0DDb9fF6A09452"
].map(w => w.toLowerCase());

// Check if a wallet address is an admin
export function isAdminWallet(walletAddress: string | null | undefined): boolean {
  if (!walletAddress) return false;
  return ADMIN_WALLETS.includes(walletAddress.toLowerCase());
}

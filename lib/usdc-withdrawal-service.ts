import { ethers } from 'ethers';

// USDC contract ABI (only transfer function needed)
const USDC_ABI = [
  "function transfer(address to, uint256 amount) returns (bool)",
  "function balanceOf(address account) view returns (uint256)"
];

// USDC contract address on Base
const USDC_ADDRESS = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";

export class USDCWithdrawalService {
  private wallet: ethers.Wallet;
  private provider: ethers.Provider;
  private usdcContract: ethers.Contract;
  
  constructor() {
    // Connect to Base network
    const rpcUrl = process.env.BASE_TESTNET === 'true' 
      ? 'https://sepolia.base.org' 
      : 'https://mainnet.base.org';
      
    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    
    // Load treasury wallet
    const privateKey = process.env.TREASURY_PRIVATE_KEY;
    if (!privateKey) {
      throw new Error('Treasury private key not configured');
    }
    
    this.wallet = new ethers.Wallet(
      privateKey,
      this.provider
    );
    
    // Initialize USDC contract
    this.usdcContract = new ethers.Contract(
      USDC_ADDRESS,
      USDC_ABI,
      this.wallet
    );
  }
  
  async getUSDCBalance(): Promise<string> {
    try {
      const balance = await this.usdcContract.balanceOf(this.wallet.address);
      return ethers.formatUnits(balance, 6); // USDC has 6 decimals
    } catch (error) {
      console.error('Error getting USDC balance:', error);
      // Return 0 if we can't get the balance
      return "0";
    }
  }
  
  async getETHBalance(): Promise<string> {
    const balance = await this.provider.getBalance(this.wallet.address);
    return ethers.formatEther(balance);
  }
  
  async processUSDCWithdrawal(toAddress: string, amount: number) {
    try {
      // Validate address
      if (!ethers.isAddress(toAddress)) {
        throw new Error('Invalid wallet address');
      }
      
      // Convert amount to USDC units (6 decimals)
      const amountInUnits = ethers.parseUnits(amount.toString(), 6);
      
      // Check USDC balance
      let usdcBalance;
      try {
        usdcBalance = await this.usdcContract.balanceOf(this.wallet.address);
      } catch (error) {
        console.error('Error checking USDC balance:', error);
        throw new Error('Failed to check treasury balance. Please try again later.');
      }
      
      if (usdcBalance < amountInUnits) {
        throw new Error('Insufficient USDC balance in treasury');
      }
      
      // Check ETH balance for gas
      const ethBalance = await this.provider.getBalance(this.wallet.address);
      const estimatedGas = ethers.parseEther("0.0001"); // ~$0.25 in gas - more than enough on Base
      if (ethBalance < estimatedGas) {
        throw new Error('Insufficient ETH for gas fees');
      }
      
      // Send USDC
      const tx = await this.usdcContract.transfer(toAddress, amountInUnits);
      
      // Wait for confirmation
      const receipt = await tx.wait();
      
      return {
        success: true,
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
      };
    } catch (error) {
      console.error('USDC withdrawal failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

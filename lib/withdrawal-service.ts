import { ethers } from 'ethers';

export class WithdrawalService {
  private wallet: ethers.Wallet;
  private provider: ethers.Provider;
  
  constructor() {
    // Connect to Base network (testnet for now)
    const rpcUrl = process.env.BASE_TESTNET === 'true' 
      ? 'https://sepolia.base.org' 
      : 'https://mainnet.base.org';
      
    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    
    // Load treasury wallet
    if (!process.env.TREASURY_PRIVATE_KEY) {
      throw new Error('Treasury private key not configured');
    }
    
    this.wallet = new ethers.Wallet(
      process.env.TREASURY_PRIVATE_KEY,
      this.provider
    );
  }
  
  async getBalance(): Promise<string> {
    const balance = await this.provider.getBalance(this.wallet.address);
    return ethers.formatEther(balance);
  }
  
  async processWithdrawal(toAddress: string, amount: number) {
    try {
      // Validate address
      if (!ethers.isAddress(toAddress)) {
        throw new Error('Invalid wallet address');
      }
      
      // Convert amount to wei
      const amountWei = ethers.parseEther(amount.toString());
      
      // Check treasury balance
      const balance = await this.provider.getBalance(this.wallet.address);
      if (balance < amountWei) {
        throw new Error('Insufficient treasury balance');
      }
      
      // Estimate gas
      const gasPrice = await this.provider.getFeeData();
      const gasLimit = await this.wallet.estimateGas({
        to: toAddress,
        value: amountWei,
      });
      
      // Send transaction
      const tx = await this.wallet.sendTransaction({
        to: toAddress,
        value: amountWei,
        gasLimit: gasLimit + (gasLimit / BigInt(10)), // Add 10% buffer
        maxFeePerGas: gasPrice.maxFeePerGas,
        maxPriorityFeePerGas: gasPrice.maxPriorityFeePerGas,
      });
      
      // Wait for confirmation
      const receipt = await tx.wait();
      
      return {
        success: true,
        transactionHash: receipt!.hash,
        blockNumber: receipt!.blockNumber,
        gasUsed: receipt!.gasUsed.toString(),
      };
    } catch (error) {
      console.error('Withdrawal failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

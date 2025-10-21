import { ethers } from 'ethers';
import { redis } from './redis';

// USDC contract details on Base
const USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';
const TREASURY_ADDRESS = process.env.TREASURY_ADDRESS || process.env.NEXT_PUBLIC_TREASURY_ADDRESS || '0xAbD4BB1Ba7C9a57C40598604A7ad0E5d105AD54D';

// ABI for USDC Transfer event
const USDC_ABI = [
  'event Transfer(address indexed from, address indexed to, uint256 value)'
];

// Cache for processed transactions to prevent double-crediting
const PROCESSED_TX_KEY = 'processed_deposits';

export interface DepositVerification {
  isValid: boolean;
  amount?: number;
  from?: string;
  transactionHash?: string;
  error?: string;
}

export class DepositVerificationService {
  private provider: ethers.JsonRpcProvider;
  private usdcContract: ethers.Contract;

  constructor() {
    // Initialize Base provider
    this.provider = new ethers.JsonRpcProvider('https://mainnet.base.org');
    this.usdcContract = new ethers.Contract(USDC_ADDRESS, USDC_ABI, this.provider);
  }

  /**
   * Verify a deposit transaction on the blockchain
   * @param transactionHash The transaction hash to verify
   * @param expectedAmount The amount in USD (will be converted to USDC decimals)
   * @param userId The user ID making the deposit
   */
  async verifyDeposit(
    transactionHash: string,
    expectedAmount: number,
    userId: string
  ): Promise<DepositVerification> {
    try {
      // Check if this transaction has already been processed
      const processedTxs = await redis.smembers(`${PROCESSED_TX_KEY}:${userId}`);
      if (processedTxs.includes(transactionHash)) {
        return {
          isValid: false,
          error: 'Transaction already processed'
        };
      }

      // Get transaction receipt
      const receipt = await this.provider.getTransactionReceipt(transactionHash);
      
      if (!receipt) {
        return {
          isValid: false,
          error: 'Transaction not found'
        };
      }

      // Check if transaction is confirmed (at least 2 confirmations)
      const currentBlock = await this.provider.getBlockNumber();
      const confirmations = currentBlock - receipt.blockNumber;
      
      if (confirmations < 2) {
        return {
          isValid: false,
          error: 'Transaction needs more confirmations'
        };
      }

      // Check if transaction was successful
      if (!receipt.status) {
        return {
          isValid: false,
          error: 'Transaction failed'
        };
      }

      // Parse USDC Transfer events
      const transferEvents = receipt.logs
        .filter(log => log.address.toLowerCase() === USDC_ADDRESS.toLowerCase())
        .map(log => {
          try {
            return this.usdcContract.interface.parseLog({
              topics: log.topics as string[],
              data: log.data
            });
          } catch {
            return null;
          }
        })
        .filter(parsed => parsed && parsed.name === 'Transfer');

      // Find transfer to treasury
      const treasuryTransfer = transferEvents.find(event => 
        event && event.args.to.toLowerCase() === TREASURY_ADDRESS.toLowerCase()
      );

      if (!treasuryTransfer) {
        return {
          isValid: false,
          error: 'No USDC transfer to treasury found'
        };
      }

      // Verify amount (USDC has 6 decimals)
      const transferAmount = Number(treasuryTransfer.args.value) / 1e6;
      const tolerance = 0.01; // Allow 1 cent tolerance for rounding

      if (Math.abs(transferAmount - expectedAmount) > tolerance) {
        return {
          isValid: false,
          error: `Amount mismatch: expected ${expectedAmount}, got ${transferAmount}`,
          amount: transferAmount
        };
      }

      // Get the sender address
      const from = treasuryTransfer.args.from;

      // Mark transaction as processed
      await redis.sadd(`${PROCESSED_TX_KEY}:${userId}`, transactionHash);
      
      // Set expiry for processed transactions (30 days)
      await redis.expire(`${PROCESSED_TX_KEY}:${userId}`, 30 * 24 * 60 * 60);

      return {
        isValid: true,
        amount: transferAmount,
        from,
        transactionHash
      };

    } catch (error) {
      console.error('[Deposit Verification] Error:', error);
      return {
        isValid: false,
        error: error instanceof Error ? error.message : 'Verification failed'
      };
    }
  }

  /**
   * Get transaction details without marking as processed
   * Useful for checking status before final verification
   */
  async getTransactionDetails(transactionHash: string): Promise<{
    found: boolean;
    confirmations: number;
    status: boolean;
    amount?: number;
    from?: string;
  }> {
    try {
      const receipt = await this.provider.getTransactionReceipt(transactionHash);
      
      if (!receipt) {
        return { found: false, confirmations: 0, status: false };
      }

      const currentBlock = await this.provider.getBlockNumber();
      const confirmations = currentBlock - receipt.blockNumber;

      // Try to find USDC transfer to treasury
      const transferEvents = receipt.logs
        .filter(log => log.address.toLowerCase() === USDC_ADDRESS.toLowerCase())
        .map(log => {
          try {
            return this.usdcContract.interface.parseLog({
              topics: log.topics as string[],
              data: log.data
            });
          } catch {
            return null;
          }
        })
        .filter(parsed => parsed && parsed.name === 'Transfer');

      const treasuryTransfer = transferEvents.find(event => 
        event && event.args.to.toLowerCase() === TREASURY_ADDRESS.toLowerCase()
      );

      if (treasuryTransfer) {
        return {
          found: true,
          confirmations,
          status: receipt.status || false,
          amount: Number(treasuryTransfer.args.value) / 1e6,
          from: treasuryTransfer.args.from
        };
      }

      return {
        found: true,
        confirmations,
        status: receipt.status || false
      };

    } catch (error) {
      console.error('[Deposit Details] Error:', error);
      return { found: false, confirmations: 0, status: false };
    }
  }
}

// Export singleton instance
export const depositVerification = new DepositVerificationService();

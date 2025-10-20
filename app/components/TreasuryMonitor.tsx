"use client";
import { useState, useEffect } from "react";
import { ethers } from "ethers";
import styles from "./TreasuryMonitor.module.css";

interface TreasuryMonitorProps {
  treasuryAddress?: string;
}

export default function TreasuryMonitor({ treasuryAddress }: TreasuryMonitorProps) {
  const [ethBalance, setEthBalance] = useState<string>("0");
  const [usdcBalance, setUsdcBalance] = useState<string>("0");
  const [ethPrice, setEthPrice] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<ethers.TransactionResponse[]>([]);
  
  const address = treasuryAddress || process.env.NEXT_PUBLIC_TREASURY_ADDRESS;
  
  useEffect(() => {
    if (!address || address === "demo") return;
    
    const fetchData = async () => {
      try {
        // Get balance
        const provider = new ethers.JsonRpcProvider(
          process.env.BASE_TESTNET === 'true' 
            ? 'https://sepolia.base.org' 
            : 'https://mainnet.base.org'
        );
        
        // Get ETH balance
        const balanceWei = await provider.getBalance(address);
        setEthBalance(ethers.formatEther(balanceWei));
        
        // Get USDC balance
        const USDC_ADDRESS = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
        const USDC_ABI = ["function balanceOf(address) view returns (uint256)"];
        const usdcContract = new ethers.Contract(USDC_ADDRESS, USDC_ABI, provider);
        const usdcBalanceRaw = await usdcContract.balanceOf(address);
        setUsdcBalance(ethers.formatUnits(usdcBalanceRaw, 6)); // USDC has 6 decimals
        
        // Get ETH price (you'd use a real API like CoinGecko)
        setEthPrice(2500); // Placeholder
        
        // For now, we'll skip transaction history
        // In production, you'd use Etherscan API or similar
        setTransactions([]);
        setLoading(false);
      } catch (error) {
        console.error('Treasury monitor error:', error);
        setLoading(false);
      }
    };
    
    fetchData();
    const interval = setInterval(fetchData, 30000); // Update every 30s
    
    return () => clearInterval(interval);
  }, [address]);
  
  if (!address || address === "demo") {
    return (
      <div className={styles.container}>
        <h3 className={styles.title}>💰 Treasury Wallet</h3>
        <div className={styles.demoMode}>
          <p>Demo Mode - No Treasury Configured</p>
          <p className={styles.hint}>
            To enable real payments, set TREASURY_PRIVATE_KEY in environment variables
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <div className={styles.container}>
      <h3 className={styles.title}>💰 Treasury Wallet</h3>
      
      <div className={styles.stats}>
        <div className={styles.stat}>
          <span className={styles.label}>Address</span>
          <span className={styles.value}>
            {address.slice(0, 6)}...{address.slice(-4)}
          </span>
        </div>
        
        <div className={styles.stat}>
          <span className={styles.label}>USDC Balance</span>
          <span className={styles.value}>
            {loading ? "..." : `$${parseFloat(usdcBalance).toFixed(2)}`}
          </span>
        </div>
        
        <div className={styles.stat}>
          <span className={styles.label}>ETH Balance</span>
          <span className={styles.value}>
            {loading ? "..." : `${parseFloat(ethBalance).toFixed(4)} ETH`}
          </span>
        </div>
        
        <div className={styles.stat}>
          <span className={styles.label}>Total Value</span>
          <span className={styles.value}>
            {loading ? "..." : `$${(parseFloat(usdcBalance) + (parseFloat(ethBalance) * ethPrice)).toFixed(2)}`}
          </span>
        </div>
      </div>
      
      <div className={styles.actions}>
        <a 
          href={`https://${process.env.BASE_TESTNET === 'true' ? 'sepolia.' : ''}basescan.org/address/${address}`}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.link}
        >
          View on BaseScan →
        </a>
        
        <button 
          className={styles.copyButton}
          onClick={() => navigator.clipboard.writeText(address)}
        >
          Copy Address
        </button>
      </div>
      
      {transactions.length > 0 && (
        <div className={styles.transactions}>
          <h4>Recent Activity</h4>
          {transactions.map((tx, i) => (
            <div key={i} className={styles.transaction}>
              <span className={styles.txType}>
                {tx.to?.toLowerCase() === address.toLowerCase() ? '⬇️ IN' : '⬆️ OUT'}
              </span>
              <span className={styles.txAmount}>
                {ethers.formatEther(tx.value || '0')} ETH
              </span>
              <a 
                href={`https://basescan.org/tx/${tx.hash}`}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.txLink}
              >
                →
              </a>
            </div>
          ))}
        </div>
      )}
      
      <div className={styles.warning}>
        <p>⚠️ Security Tips:</p>
        <ul>
          <li>Keep most funds in cold storage</li>
          <li>Monitor for unusual activity</li>
          <li>Set up alerts for low balance</li>
        </ul>
      </div>
    </div>
  );
}

"use client";
import { useState } from "react";
import styles from "./admin.module.css";

interface AdminWalletProps {
  onConnect: (address: string) => void;
}

export default function AdminWallet({ onConnect }: AdminWalletProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connectWallet = async () => {
    setIsConnecting(true);
    setError(null);

    try {
      // Check if MetaMask or another wallet is installed
      if (typeof window !== 'undefined' && (window as Window & { ethereum?: any }).ethereum) {
        const ethereum = (window as Window & { ethereum?: any }).ethereum;
        
        // Request account access
        const accounts = await ethereum.request({ 
          method: 'eth_requestAccounts' 
        });
        
        if (accounts && accounts.length > 0) {
          // Switch to Base network if needed
          try {
            await ethereum.request({
              method: 'wallet_switchEthereumChain',
              params: [{ chainId: '0x2105' }], // Base mainnet
            });
          } catch (switchError) {
            // If the chain doesn't exist, add it
            if ((switchError as any).code === 4902) {
              await ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [{
                  chainId: '0x2105',
                  chainName: 'Base',
                  nativeCurrency: {
                    name: 'Ethereum',
                    symbol: 'ETH',
                    decimals: 18
                  },
                  rpcUrls: ['https://mainnet.base.org'],
                  blockExplorerUrls: ['https://basescan.org']
                }]
              });
            }
          }
          
          onConnect(accounts[0]);
        }
      } else {
        setError("No wallet found. Please install MetaMask or another Web3 wallet.");
      }
    } catch (err) {
      setError((err as Error).message || "Failed to connect wallet");
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div>
      <button 
        onClick={connectWallet}
        disabled={isConnecting}
        className={styles.connectButton}
      >
        {isConnecting ? "Connecting..." : "Connect Wallet"}
      </button>
      {error && <p className={styles.error}>{error}</p>}
    </div>
  );
}

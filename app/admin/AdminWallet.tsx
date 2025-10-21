"use client";
import { useState } from "react";
import styles from "./admin.module.css";

interface EthereumProvider {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
}

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
      // Check for various wallet providers
      const ethereum = (window as Window & { ethereum?: EthereumProvider }).ethereum;
      
      // Check if we're in a mobile wallet browser
      const isMobileWallet = /Mobile|Android|iPhone/i.test(navigator.userAgent);
      
      if (ethereum) {
        // Request account access
        const accounts = await ethereum.request({ 
          method: 'eth_requestAccounts' 
        }) as string[];
        
        if (accounts && accounts.length > 0) {
          // Switch to Base network if needed
          try {
            await ethereum.request({
              method: 'wallet_switchEthereumChain',
              params: [{ chainId: '0x2105' }], // Base mainnet
            });
          } catch (switchError) {
            // If the chain doesn't exist, add it
            if ((switchError as { code?: number }).code === 4902) {
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
      } else if (isMobileWallet) {
        // Mobile wallet detection
        const deepLinks = {
          metamask: `https://metamask.app.link/dapp/${window.location.href}`,
          coinbase: `https://go.cb-w.com/dapp?cb_url=${encodeURIComponent(window.location.href)}`,
          trust: `https://link.trustwallet.com/open_url?coin_id=60&url=${encodeURIComponent(window.location.href)}`
        };
        
        setError("No wallet detected. Opening wallet options...");
        
        // Show wallet options
        const choice = window.confirm(
          "No wallet detected. Would you like to open MetaMask? (Cancel for Coinbase Wallet)"
        );
        
        if (choice) {
          window.location.href = deepLinks.metamask;
        } else {
          window.location.href = deepLinks.coinbase;
        }
      } else {
        setError("No wallet found. Please install MetaMask, Coinbase Wallet, or another Web3 wallet.");
      }
    } catch (err) {
      setError((err as Error).message || "Failed to connect wallet");
    } finally {
      setIsConnecting(false);
    }
  };

  const isMobile = typeof window !== 'undefined' && /Mobile|Android|iPhone/i.test(navigator.userAgent);

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
      {isMobile && !error && (
        <div className={styles.mobileHint}>
          <p>For best experience on mobile:</p>
          <ul>
            <li>Open this page in MetaMask or Coinbase Wallet browser</li>
            <li>Or use WalletConnect compatible wallet</li>
          </ul>
        </div>
      )}
    </div>
  );
}

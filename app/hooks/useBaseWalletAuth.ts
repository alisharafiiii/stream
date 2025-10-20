"use client";
import { useState, useCallback } from "react";

interface EthereumProvider {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on: (event: string, handler: (...args: unknown[]) => void) => void;
  removeListener: (event: string, handler: (...args: unknown[]) => void) => void;
}

interface AuthUser {
  fid: string;
  username: string;
  displayName: string;
  profileImage?: string;
  walletAddress?: string;
}

export function useBaseWalletAuth() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connectWallet = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (typeof window === 'undefined' || !(window as Window & { ethereum?: EthereumProvider }).ethereum) {
        throw new Error('No wallet found. Please install MetaMask or Coinbase Wallet.');
      }

      const ethereum = (window as Window & { ethereum?: EthereumProvider }).ethereum;

      // Request account access
      const accounts = await ethereum.request({ 
        method: 'eth_requestAccounts' 
      }) as string[];

      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts found');
      }

      const address = accounts[0];
      
      // Switch to Base network
      try {
        await ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x2105' }], // Base mainnet
        });
      } catch (switchError) {
        // This error code indicates that the chain has not been added to MetaMask
        if ((switchError as { code?: number }).code === 4902) {
          try {
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
          } catch (addError) {
            throw new Error('Failed to add Base network');
          }
        } else {
          throw switchError;
        }
      }

      // Create user from wallet address
      const shortAddress = `${address.slice(0, 6)}...${address.slice(-4)}`;
      const authUser: AuthUser = {
        fid: address.toLowerCase(), // Use wallet address as FID
        username: shortAddress,
        displayName: shortAddress,
        profileImage: `https://api.dicebear.com/7.x/identicon/svg?seed=${address}`,
        walletAddress: address,
      };

      return authUser;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to connect wallet';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    connectWallet,
    isLoading,
    error,
  };
}

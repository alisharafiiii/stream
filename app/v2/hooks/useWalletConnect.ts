'use client';

import { useState, useCallback, useEffect } from 'react';
import { useMiniKit, useAuthenticate } from '@coinbase/onchainkit/minikit';

interface WalletUser {
  uid: string; // Unique system ID
  fid?: string; // Farcaster ID
  username: string; // basename or wallet address
  displayName: string;
  profileImage?: string;
  walletAddress?: string;
  source: 'base_app' | 'browser_wallet' | 'guest';
  connectedAt: number;
}

export function useWalletConnect() {
  const { context } = useMiniKit();
  const { signIn: authenticateSignIn } = useAuthenticate();
  const [user, setUser] = useState<WalletUser | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInBaseApp, setIsInBaseApp] = useState(false);

  // Detect if we're in Base app
  useEffect(() => {
    const inApp = !!(context && context.user);
    setIsInBaseApp(inApp);
    
    if (typeof window !== 'undefined') {
      const userAgent = window.navigator.userAgent.toLowerCase();
      const isBaseUserAgent = userAgent.includes('base') || userAgent.includes('coinbase');
      const windowWithWallet = window as Window & { coinbase?: unknown; base?: unknown };
      const hasBaseObjects = !!(windowWithWallet.coinbase) || !!(windowWithWallet.base);
      setIsInBaseApp(inApp || isBaseUserAgent || hasBaseObjects);
    }
  }, [context]);

  // Load saved user from localStorage
  useEffect(() => {
    const savedUser = localStorage.getItem('v2_wallet_user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        console.error('Failed to parse saved user:', e);
      }
    }
  }, []);

  // Save user to backend when connected
  const saveUserToBackend = async (userData: WalletUser) => {
    try {
      const res = await fetch('/api/v2/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });
      
      if (res.ok) {
        const saved = await res.json();
        console.log('User saved to backend:', saved);
      }
    } catch (error) {
      console.error('Failed to save user to backend:', error);
    }
  };

  // Connect with Base App (MiniKit)
  const connectBaseApp = useCallback(async () => {
    try {
      const result = await authenticateSignIn();
      
      if (result) {
        const match = result.message?.match(/farcaster:\/\/fid\/(\d+)/);
        const fid = match ? match[1] : null;
        
        if (fid) {
          const walletUser: WalletUser = {
            uid: `base_${fid}_${Date.now()}`,
            fid: String(fid),
            username: context?.user?.username || `user${fid}`,
            displayName: context?.user?.displayName || context?.user?.username || `User ${fid}`,
            profileImage: (context?.user as Record<string, unknown> & { profileImage?: string; avatar?: string; pfpUrl?: string })?.profileImage || 
                         (context?.user as Record<string, unknown> & { profileImage?: string; avatar?: string; pfpUrl?: string })?.avatar || 
                         (context?.user as Record<string, unknown> & { profileImage?: string; avatar?: string; pfpUrl?: string })?.pfpUrl ||
                         `https://api.dicebear.com/7.x/personas/png?seed=${fid}`,
            walletAddress: (context as Record<string, unknown> & { walletAddress?: string })?.walletAddress,
            source: 'base_app',
            connectedAt: Date.now()
          };
          
          // Save to backend and localStorage
          await saveUserToBackend(walletUser);
          localStorage.setItem('v2_wallet_user', JSON.stringify(walletUser));
          
          return walletUser;
        }
      }
      return null;
    } catch (err) {
      throw err;
    }
  }, [authenticateSignIn, context]);

  // Connect with Browser Wallet (MetaMask, Rainbow, Phantom)
  const connectBrowserWallet = useCallback(async (walletType?: string) => {
    try {
      interface EthereumProvider {
        request: (args: { method: string }) => Promise<string[]>;
      }
      
      interface WindowWithWallets extends Window {
        ethereum?: EthereumProvider;
        phantom?: { ethereum?: EthereumProvider };
        rainbow?: { provider?: EthereumProvider };
      }

      const windowWithWallets = window as unknown as WindowWithWallets;
      let provider = windowWithWallets.ethereum;

      // Check for specific wallet if requested
      if (walletType === 'phantom' && windowWithWallets.phantom?.ethereum) {
        provider = windowWithWallets.phantom.ethereum;
      } else if (walletType === 'rainbow' && windowWithWallets.rainbow?.provider) {
        provider = windowWithWallets.rainbow.provider;
      }

      if (!provider) {
        throw new Error('No wallet found. Please install MetaMask, Rainbow, or Phantom.');
      }

      // Request accounts
      const accounts = await provider.request({ 
        method: 'eth_requestAccounts' 
      });
      
      const address = accounts[0];

      // Try to fetch basename from Base
      let basename = null;
      try {
        const res = await fetch(`https://api.basename.app/v1/names/${address}`);
        if (res.ok) {
          const data = await res.json();
          basename = data.name;
        }
      } catch {
        console.log('No basename found');
      }

      // Use first 6 chars of address if no basename
      const displayName = basename || address.slice(0, 6);

      const walletUser: WalletUser = {
        uid: `wallet_${address.toLowerCase()}`,
        username: displayName,
        displayName: displayName,
        walletAddress: address,
        profileImage: `https://api.dicebear.com/7.x/identicon/png?seed=${address}`,
        source: 'browser_wallet',
        connectedAt: Date.now()
      };

      // Save to backend and localStorage
      await saveUserToBackend(walletUser);
      localStorage.setItem('v2_wallet_user', JSON.stringify(walletUser));

      return walletUser;
    } catch (err) {
      throw err;
    }
  }, []);

  // Connect with specific wallet type (for browser)
  const connectWithWallet = useCallback(async (walletType: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const connectedUser = await connectBrowserWallet(walletType);
      
      if (connectedUser) {
        setUser(connectedUser);
        return connectedUser;
      } else {
        setError('Connection cancelled');
        return null;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Connection failed';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [connectBrowserWallet]);

  // Main connect function - returns 'need_selection' for browser users
  const connect = useCallback(async () => {
    if (isInBaseApp) {
      // Auto-connect with Base app
      setIsLoading(true);
      setError(null);
      try {
        const connectedUser = await connectBaseApp();
        if (connectedUser) {
          setUser(connectedUser);
          return { success: true, user: connectedUser };
        } else {
          setError('Connection cancelled');
          return { success: false };
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Connection failed';
        setError(errorMessage);
        return { success: false, error: errorMessage };
      } finally {
        setIsLoading(false);
      }
    } else {
      // Browser user needs to select wallet
      return { success: false, needWalletSelection: true };
    }
  }, [isInBaseApp, connectBaseApp]);

  // Disconnect
  const disconnect = useCallback(() => {
    setUser(null);
    localStorage.removeItem('v2_wallet_user');
  }, []);

  return {
    user,
    connect,
    connectWithWallet,
    disconnect,
    isLoading,
    error,
    isInBaseApp,
    isConnected: !!user
  };
}


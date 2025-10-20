"use client";
import { useState, useCallback, useEffect } from "react";
import { useMiniKit, useAuthenticate } from "@coinbase/onchainkit/minikit";

interface AuthUser {
  fid: string;
  username: string;
  displayName: string;
  profileImage?: string;
}

interface EthereumProvider {
  request: (args: { method: string }) => Promise<string[]>;
}

export function useUniversalAuth() {
  const { context } = useMiniKit();
  const { signIn: authenticateSignIn } = useAuthenticate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInBaseApp, setIsInBaseApp] = useState(false);

  // Detect if we're in the Base app
  useEffect(() => {
    // Check if MiniKit context is available and has user data
    const inApp = !!(context && context.user);
    setIsInBaseApp(inApp);
    
    // Additional checks for Base app environment
    if (typeof window !== 'undefined') {
      // Check user agent for Base app
      const userAgent = window.navigator.userAgent.toLowerCase();
      const isBaseUserAgent = userAgent.includes('base') || userAgent.includes('coinbase');
      
      // Check if window.coinbase or similar objects exist
      const hasBaseObjects = !!((window as Window & { coinbase?: unknown; base?: unknown }).coinbase) || 
                            !!((window as Window & { coinbase?: unknown; base?: unknown }).base);
      
      setIsInBaseApp(inApp || isBaseUserAgent || hasBaseObjects);
    }
  }, [context]);

  const signInBrowser = useCallback(async () => {
    // Browser wallet authentication
    try {
      // Check if ethereum wallet is available
      if (typeof window !== 'undefined' && (window as Window & { ethereum?: EthereumProvider }).ethereum) {
        const ethereum = (window as Window & { ethereum?: EthereumProvider }).ethereum;
        
        // Request account access
        const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
        
        if (accounts && accounts.length > 0) {
          const address = accounts[0];
          const shortAddress = `${address.slice(0, 6)}...${address.slice(-4)}`;
          
          // Create user from wallet address
          const walletUser: AuthUser = {
            fid: address.toLowerCase(), // Use wallet address as FID
            username: `wallet_${shortAddress}`,
            displayName: `Wallet User ${shortAddress}`,
            profileImage: `https://api.dicebear.com/7.x/identicon/svg?seed=${address}`,
          };
          
          return walletUser;
        }
      } else {
        // Fallback to demo user if no wallet available
        const randomFid = Math.floor(100000 + Math.random() * 900000).toString();
        
        const demoUser: AuthUser = {
          fid: randomFid,
          username: `demo${randomFid}`,
          displayName: `Demo User ${randomFid}`,
          profileImage: `https://api.dicebear.com/7.x/personas/svg?seed=${randomFid}`,
        };
        
        return demoUser;
      }
    } catch {
      throw new Error('Failed to connect wallet');
    }
    
    return null;
  }, []);

  const signInMiniKit = useCallback(async () => {
    try {
      const result = await authenticateSignIn();
      
      if (result) {
        const match = result.message?.match(/farcaster:\/\/fid\/(\d+)/);
        const fid = match ? match[1] : null;
        
        if (fid) {
          const authUser: AuthUser = {
            fid: String(fid),
            username: context?.user?.username || `user${fid}`,
            displayName: context?.user?.displayName || context?.user?.username || `User ${fid}`,
            profileImage: `https://api.dicebear.com/7.x/personas/svg?seed=${fid}`,
          };
          
          return authUser;
        } else {
          throw new Error("Failed to extract user information");
        }
      }
    } catch (err) {
      throw err;
    }
    
    return null;
  }, [authenticateSignIn, context]);

  const signIn = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      let user: AuthUser | null = null;
      
      if (isInBaseApp) {
        // Use MiniKit authentication in Base app
        user = await signInMiniKit();
      } else {
        // Use browser mock authentication
        user = await signInBrowser();
      }
      
      if (!user) {
        setError("Authentication cancelled or failed");
      }
      
      return user;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Authentication failed";
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [isInBaseApp, signInMiniKit, signInBrowser]);

  // Convert context user to AuthUser type if available
  const currentUser: AuthUser | null = context?.user ? {
    fid: String(context.user.fid),
    username: context.user.username || `user${context.user.fid}`,
    displayName: context.user.displayName || context.user.username || `User ${context.user.fid}`,
    profileImage: `https://api.dicebear.com/7.x/personas/svg?seed=${context.user.fid}`,
  } : null;

  return {
    signIn,
    isLoading,
    error,
    user: currentUser,
    isInBaseApp,
  };
}

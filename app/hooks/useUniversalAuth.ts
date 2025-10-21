"use client";
import { useState, useCallback, useEffect } from "react";
import { useMiniKit, useAuthenticate } from "@coinbase/onchainkit/minikit";

interface AuthUser {
  fid: string;
  username: string;
  displayName: string;
  profileImage?: string;
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
    // In browser, we'll use a simplified auth flow
    try {
      // Create a unique browser session ID
      const browserId = localStorage.getItem('browserId') || `browser_${Math.random().toString(36).substring(2, 15)}`;
      if (!localStorage.getItem('browserId')) {
        localStorage.setItem('browserId', browserId);
      }
      
      // Create user from browser session
      const browserUser: AuthUser = {
        fid: browserId,
        username: `User_${browserId.substring(8, 13)}`,
        displayName: `Browser User`,
        profileImage: `https://api.dicebear.com/7.x/identicon/png?seed=${browserId}`,
      };
      
      return browserUser;
    } catch {
      throw new Error('Failed to create browser session');
    }
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
            // Check for profile image in context or result
            profileImage: (context?.user as any)?.profileImage || 
                         (context?.user as any)?.avatar || 
                         (context?.user as any)?.pfpUrl ||
                         (result as any)?.profileImage ||
                         (result as any)?.avatar ||
                         (result as any)?.pfpUrl ||
                         `https://api.dicebear.com/7.x/personas/png?seed=${fid}`,
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
  // IMPORTANT: Check if context provides profile image from Base app
  const currentUser: AuthUser | null = context?.user ? {
    fid: String(context.user.fid),
    username: context.user.username || `user${context.user.fid}`,
    displayName: context.user.displayName || context.user.username || `User ${context.user.fid}`,
    // Use profile image from context if available (Base app users have custom avatars)
    profileImage: (context.user as any).profileImage || 
                  (context.user as any).avatar || 
                  (context.user as any).pfpUrl ||
                  `https://api.dicebear.com/7.x/personas/png?seed=${context.user.fid}`,
  } : null;

  return {
    signIn,
    isLoading,
    error,
    user: currentUser,
    isInBaseApp,
  };
}

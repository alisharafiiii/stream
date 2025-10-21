"use client";
import { useState, useCallback, useEffect } from "react";
import { sdk } from '@farcaster/miniapp-sdk';

interface BaseAppUser {
  fid: string;
  username: string;
  displayName: string;
  profileImage?: string;
}

/**
 * Custom hook for Base app authentication using MiniApp SDK
 * This properly captures user profile data including profile pictures
 */
export function useMiniKitAuth() {
  const [user, setUser] = useState<BaseAppUser | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if we're in the Base app
  const isInBaseApp = typeof window !== 'undefined' && 
    (window.navigator.userAgent.includes('Base') || 
     window.location.href.includes('base.org'));

  useEffect(() => {
    if (!isInBaseApp) return;

    // Request user data from Base app
    async function fetchUserData() {
      try {
        console.log('[MiniKit Auth] Fetching user data from Base app...');
        
        // The MiniApp SDK provides user data through the context
        const context = await sdk.context;
        console.log('[MiniKit Auth] Context received:', context);

        if (context?.user) {
          const baseUser: BaseAppUser = {
            fid: String(context.user.fid),
            username: context.user.username || `user${context.user.fid}`,
            displayName: context.user.displayName || context.user.username || `User ${context.user.fid}`,
            // IMPORTANT: Capture the profile image from Base app if available
            profileImage: (context.user as unknown as {profileImage?: string}).profileImage || 
                         (context.user as unknown as {avatar?: string}).avatar || 
                         (context.user as unknown as {pfpUrl?: string}).pfpUrl ||
                         undefined
          };

          console.log('[MiniKit Auth] Base user data:', baseUser);
          setUser(baseUser);
        }
      } catch (err) {
        console.error('[MiniKit Auth] Error fetching user data:', err);
      }
    }

    fetchUserData();
  }, [isInBaseApp]);

  const signIn = useCallback(async () => {
    if (!isInBaseApp) {
      setError('Not in Base app');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Trigger Base app authentication
      const authResult = await sdk.actions.signIn();
      console.log('[MiniKit Auth] Auth result:', authResult);

      if (authResult?.user) {
        const baseUser: BaseAppUser = {
          fid: String(authResult.user.fid),
          username: authResult.user.username || `user${authResult.user.fid}`,
          displayName: authResult.user.displayName || authResult.user.username,
          // Capture profile image from auth result
          profileImage: (authResult.user as unknown as {profileImage?: string}).profileImage || 
                       (authResult.user as unknown as {avatar?: string}).avatar || 
                       (authResult.user as unknown as {pfpUrl?: string}).pfpUrl ||
                       undefined
        };

        setUser(baseUser);
        return baseUser;
      }

      return null;
    } catch (err) {
      console.error('[MiniKit Auth] Sign in error:', err);
      setError('Authentication failed');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [isInBaseApp]);

  return {
    user,
    signIn,
    isLoading,
    error,
    isInBaseApp
  };
}

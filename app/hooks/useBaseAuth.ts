"use client";
import { useState, useCallback } from "react";
import { useMiniKit, useAuthenticate } from "@coinbase/onchainkit/minikit";

interface AuthUser {
  fid: string;
  username: string;
  displayName: string;
  profileImage?: string;
}

export function useBaseAuth() {
  const { context } = useMiniKit();
  const { signIn: authenticateSignIn } = useAuthenticate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signIn = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('useBaseAuth: Starting authentication...');
      // This triggers the Base app's native authentication modal
      // with Cancel and Confirm buttons at the bottom of the screen
      const result = await authenticateSignIn();
      
      console.log('useBaseAuth: Authentication result:', result);
      console.log('useBaseAuth: Result type:', typeof result);
      console.log('useBaseAuth: Result stringified:', JSON.stringify(result, null, 2));
      
      if (result) {
        // Authentication successful - extract FID from the message
        const match = result.message?.match(/farcaster:\/\/fid\/(\d+)/);
        const fid = match ? match[1] : null;
        
        console.log('useBaseAuth: Extracted FID:', fid);
        
        if (fid) {
          const authUser: AuthUser = {
            fid: String(fid),
            username: context?.user?.username || `user${fid}`,
            displayName: context?.user?.displayName || context?.user?.username || `User ${fid}`,
            profileImage: undefined, // Will be fetched from Farcaster API
          };
          
          console.log('useBaseAuth: Returning auth user:', authUser);
          return authUser;
        } else {
          console.error('useBaseAuth: Failed to extract FID from message');
          setError("Failed to extract user information");
        }
      } else {
        console.log('useBaseAuth: No result returned from authentication');
      }
    } catch (err) {
      console.error("useBaseAuth: Authentication error:", err);
      setError("Authentication cancelled or failed");
    } finally {
      setIsLoading(false);
    }

    return null;
  }, [authenticateSignIn, context]);

  // Convert context user to AuthUser type if available
  const currentUser: AuthUser | null = context?.user ? {
    fid: String(context.user.fid),
    username: context.user.username || `user${context.user.fid}`,
    displayName: context.user.displayName || context.user.username || `User ${context.user.fid}`,
    profileImage: undefined, // Will be fetched from Farcaster API
  } : null;

  return {
    signIn,
    isLoading,
    error,
    user: currentUser,
  };
}

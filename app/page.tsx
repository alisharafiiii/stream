"use client";
import { useEffect, useState } from "react";
import { useMiniKit } from "@coinbase/onchainkit/minikit";
import dynamic from "next/dynamic";
import styles from "./page.module.css";
import VideoPlayer from "./components/VideoPlayer";
import StreamOverlay from "./components/StreamOverlay";
import BettingCard from "./components/BettingCard";
import OfflineVideo from "./components/OfflineVideo";
import SplashScreen from "./components/SplashScreen";

// Dynamically import AuthModal to avoid SSR issues
const AuthModal = dynamic(() => import("./components/AuthModal"), {
  ssr: false,
});

interface StreamConfig {
  streamUrl: string;
  isLive: boolean;
  title: string;
}

interface User {
  fid: string;
  displayName: string;
  username: string;
  profileImage?: string;
  balance: number;
}

export default function Home() {
  const { setMiniAppReady, isMiniAppReady, context } = useMiniKit();
  const [streamConfig, setStreamConfig] = useState<StreamConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [isBettingCollapsed, setIsBettingCollapsed] = useState(false);
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    console.log('🎬 App mounted, showSplash:', showSplash);
    if (!isMiniAppReady) {
      setMiniAppReady();
    }
  }, [setMiniAppReady, isMiniAppReady, showSplash]);

  useEffect(() => {
    console.log('🎬 Initial load effect running');
    fetchStreamConfig();
    checkExistingUser();
    
    // Hide splash screen after 2.5 seconds
    const splashTimer = setTimeout(() => {
      console.log('🎬 Hiding splash screen');
      setShowSplash(false);
    }, 2500);
    
    return () => clearTimeout(splashTimer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchStreamConfig = async () => {
    try {
      const response = await fetch('/api/stream-config');
      if (response.ok) {
        const data = await response.json();
        setStreamConfig(data);
      }
    } catch (error) {
      console.error('Failed to fetch stream config:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkExistingUser = async () => {
    // Check if user is already signed in
    // First check localStorage for browser users
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem('streamUser');
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          setShowAuth(false);
          
          // Verify user still exists in database
          const response = await fetch(`/api/user?fid=${parsedUser.fid}`);
          if (response.ok) {
            const userData = await response.json();
            setUser(userData);
            localStorage.setItem('streamUser', JSON.stringify(userData));
          }
          return;
        } catch {
          localStorage.removeItem('streamUser');
        }
      }
    }
    
    // Then check MiniKit context for Base app users
    const fid = context?.user?.fid;
    if (fid) {
      try {
        const response = await fetch(`/api/user?fid=${fid}`, {
          cache: 'no-store', // Prevent caching issues
        });
        
        if (response.ok) {
          const userData = await response.json();
          console.log('🎬 User fetched:', userData);
          console.log('🎬 Profile image URL:', userData.profileImage);
          console.log('🎬 FID type:', typeof userData.fid, 'value:', userData.fid);
          setUser(userData);
          setShowAuth(false);
          localStorage.setItem('streamUser', JSON.stringify(userData));
        } else if (response.status === 404) {
          // User not found, create a new profile automatically
          const createResponse = await fetch('/api/user', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fid: String(fid),
              username: context.user.username || `user${fid}`,
              displayName: context.user.displayName || context.user.username || `User ${fid}`,
              // Don't send profileImage - let the API fetch from Farcaster
              balance: 0, // New users start with $0 - must deposit real money
            }),
          });
          
          if (createResponse.ok) {
            const newUser = await createResponse.json();
            setUser(newUser);
            setShowAuth(false);
            localStorage.setItem('streamUser', JSON.stringify(newUser));
            
            // Double-check by fetching again to ensure persistence
            setTimeout(async () => {
              const verifyResponse = await fetch(`/api/user?fid=${fid}`, {
                cache: 'no-store',
              });
              if (verifyResponse.ok) {
                const verifiedUser = await verifyResponse.json();
                setUser(verifiedUser);
              }
            }, 500);
          } else {
            setShowAuth(true);
          }
        } else {
          setShowAuth(true);
        }
      } catch {
        // Retry once after a short delay
        setTimeout(() => checkExistingUser(), 1000);
      }
    } else {
      // No FID, show auth modal
      setShowAuth(true);
    }
  };

  const handleAuthComplete = (authenticatedUser: User) => {
    setUser(authenticatedUser);
    setShowAuth(false);
    localStorage.setItem('streamUser', JSON.stringify(authenticatedUser));
  };

  // Show splash screen immediately, even while loading
  if (showSplash) {
    return <SplashScreen />;
  }

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading...</div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      
      {/* Auth modal */}
      {showAuth && <AuthModal onComplete={handleAuthComplete} />}
      
      {/* Stream content - show both live and playback */}
      {streamConfig?.streamUrl ? (
        <>
          <div className={`${styles.streamContainer} ${isBettingCollapsed ? styles.fullscreen : ''}`}>
            <VideoPlayer streamUrl={streamConfig.streamUrl} title={streamConfig.title} />
            {user && (
              <StreamOverlay 
                user={{
                  fid: user.fid,
                  displayName: user.displayName,
                  username: user.username,
                  profileImage: user.profileImage,
                  balance: user.balance
                }} 
                onBalanceUpdate={(newBalance) => {
                  setUser(prev => prev ? { ...prev, balance: newBalance } : null);
                  localStorage.setItem('streamUser', JSON.stringify({ ...user, balance: newBalance }));
                }}
                isLive={streamConfig.isLive}
              />
            )}
          </div>
          {/* Betting Card - Outside streamContainer for true fixed positioning */}
          {user && (
            <BettingCard
              userId={user.fid}
              userBalance={user.balance}
              onBalanceUpdate={(newBalance) => {
                setUser(prev => prev ? { ...prev, balance: newBalance } : null);
              }}
              onToggleCollapse={setIsBettingCollapsed}
            />
          )}
        </>
      ) : (
        <OfflineVideo />
      )}
    </div>
  );
}// Force rebuild Mon Oct 20 11:33:10 EDT 2025

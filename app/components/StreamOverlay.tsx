"use client";
import { useState, useEffect } from "react";
// import Image from "next/image";  // Commented out - using img tags for dicebear SVG URLs
import styles from "./StreamOverlay.module.css";
import Link from 'next/link';
import BalanceModal from "./BalanceModal";
import { sanitizeProfileImageUrl, handleImageError } from '@/lib/image-utils';

interface StreamOverlayProps {
  user: {
    fid: string;
    displayName: string;
    username?: string;
    profileImage?: string;
    balance: number;
  };
  onBalanceUpdate: (newBalance: number) => void;
  isLive?: boolean;
}

export default function StreamOverlay({ user, onBalanceUpdate, isLive = true }: StreamOverlayProps) {
  const [viewerCount, setViewerCount] = useState(0);
  const [showBalanceModal, setShowBalanceModal] = useState(false);
  
  console.log('StreamOverlay - user.fid:', user.fid, 'isGuest:', user.fid.startsWith('guest_'));
  const [sessionId] = useState(() => {
    // Get existing session ID from localStorage or create a new one
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('viewerSessionId');
      if (stored) return stored;
      const newId = Math.random().toString(36).substring(7);
      localStorage.setItem('viewerSessionId', newId);
      return newId;
    }
    return Math.random().toString(36).substring(7);
  });

  useEffect(() => {
    // Fetch initial viewer count
    fetchViewerCount();
    
    // Update viewer session once on mount (counts this user)
    updateViewerSession();
    
    // Update count every 30 seconds to get latest total
    const interval = setInterval(() => {
      fetchViewerCount();
    }, 30000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  const fetchViewerCount = async () => {
    try {
      const response = await fetch('/api/viewer-count');
      if (response.ok) {
        const data = await response.json();
        setViewerCount(data.viewerCount);
      }
    } catch (error) {
      console.error('Failed to fetch viewer count:', error);
    }
  };
  
  const updateViewerSession = async () => {
    try {
      const response = await fetch('/api/viewer-count', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      });
      if (response.ok) {
        const data = await response.json();
        setViewerCount(data.viewerCount);
      }
    } catch (error) {
      console.error('Failed to update viewer session:', error);
    }
  };
  

  return (
    <>
      {/* Header Overlay */}
      <div className={`${styles.overlay} ${styles.header}`}>
        <div className={styles.streamInfo}>
      <div className={styles.live}>
        {isLive && <span className={styles.liveDot}></span>}
        {isLive ? 'LIVE' : 'PLAYBACK'}
      </div>
          <div className={styles.viewers}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
            </svg>
            {viewerCount.toLocaleString()}
          </div>
        </div>
        <div className={styles.userSection}>
          <Link 
            href={`/profile/${user.fid}`}
            className={styles.profileLink}
            title="View profile"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={sanitizeProfileImageUrl(user.profileImage, user.fid)} 
              alt={user.displayName}
              className={styles.profilePic}
              width={32}
              height={32}
              onError={(e) => handleImageError(e, user.fid)}
            />
            <span className={styles.displayName}>
              {user.username && !user.username.startsWith('0x') 
                ? (user.username.endsWith('.base.eth') ? user.username : `${user.username}.base.eth`)
                : user.displayName}
            </span>
          </Link>
          <div
            className={styles.userBalance}
            onClick={() => setShowBalanceModal(true)}
            title="Click to manage balance"
          >
            <span className={styles.balance}>${user.balance.toFixed(2)}</span>
          </div>
          {user.fid.startsWith('guest_') && (
            <button
              className={styles.signOutButton}
              onClick={() => {
                localStorage.removeItem('streamUser');
                window.location.reload();
              }}
              title="Sign out and connect wallet"
            >
              Sign Out
            </button>
          )}
        </div>
      </div>

      {showBalanceModal && (
        <BalanceModal
          user={user}
          onClose={() => setShowBalanceModal(false)}
          onBalanceUpdate={onBalanceUpdate}
        />
      )}
    </>
  );
}

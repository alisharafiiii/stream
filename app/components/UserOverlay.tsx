"use client";
import { useState } from "react";
import styles from "./UserOverlay.module.css";
import WithdrawModal from "./WithdrawModal";

interface UserOverlayProps {
  user: {
    fid: string;
    displayName: string;
    balance: number;
    profileImage?: string;
  };
  onBalanceUpdate: (newBalance: number) => void;
}

export default function UserOverlay({ user, onBalanceUpdate }: UserOverlayProps) {
  const [showWithdraw, setShowWithdraw] = useState(false);

  const handleWithdraw = async (amount: number) => {
    try {
      const response = await fetch('/api/user/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fid: user.fid,
          amount
        })
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        onBalanceUpdate(data.newBalance);
        return { success: true };
      } else {
        return { success: false, error: data.error || 'Withdrawal failed' };
      }
    } catch {
      return { success: false, error: 'Network error' };
    }
  };

  return (
    <>
      <div className={styles.overlay}>
        <div className={styles.userInfo}>
          {user.profileImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img 
              src={user.profileImage} 
              alt={user.displayName} 
              className={styles.avatar}
              onError={(e) => {
                console.error('[UserOverlay] Profile image failed to load:', user.profileImage);
                e.currentTarget.src = `https://api.dicebear.com/7.x/personas/svg?seed=${user.fid}`;
              }}
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={`https://api.dicebear.com/7.x/personas/svg?seed=${user.fid}`}
              alt={user.displayName}
              className={styles.avatar}
            />
          )}
          <div className={styles.details}>
            <div className={styles.name}>
              {user.username && !user.username.startsWith('0x') 
                ? `${user.username}.base.eth` 
                : user.displayName}
            </div>
            <div 
              className={styles.balance}
              onClick={() => setShowWithdraw(true)}
              title="Click to withdraw"
            >
              <span className={styles.coin}>💰</span>
              ${user.balance.toFixed(2)}
            </div>
          </div>
        </div>
      </div>

      {showWithdraw && (
        <WithdrawModal
          balance={user.balance}
          onClose={() => setShowWithdraw(false)}
          onWithdraw={handleWithdraw}
        />
      )}
    </>
  );
}

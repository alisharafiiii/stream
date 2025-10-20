"use client";
import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import styles from "./profile.module.css";

interface UserProfile {
  fid: string;
  username: string;
  displayName: string;
  profileImage: string;
  balance: number;
  createdAt: number;
  lastSeen: number;
}

interface Transaction {
  type: 'deposit' | 'withdrawal' | 'bet' | 'payout';
  amount: number;
  timestamp: number;
  transactionHash?: string;
  status: string;
  details?: {
    side?: 'left' | 'right';
    sessionId?: string;
    won?: boolean;
    serviceFee?: number;
  };
}

export default function ProfilePage() {
  const params = useParams();
  const fid = params.fid as string;
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfileData = useCallback(async () => {
    try {
      // Fetch user profile
      const profileRes = await fetch(`/api/user/profile/${fid}`);
      if (!profileRes.ok) throw new Error('User not found');
      
      const profileData = await profileRes.json();
      setProfile(profileData);

      // Fetch transaction history
      const historyRes = await fetch(`/api/user/history/${fid}`);
      if (historyRes.ok) {
        const historyData = await historyRes.json();
        setTransactions(historyData.transactions || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  }, [fid]);

  useEffect(() => {
    fetchProfileData();
  }, [fetchProfileData]);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const formatAmount = (amount: number) => {
    return `$${amount.toFixed(2)}`;
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'deposit': return '💵';
      case 'withdrawal': return '💸';
      case 'bet': return '🎲';
      case 'payout': return '🏆';
      default: return '📝';
    }
  };

  const getTransactionColor = (type: string, won?: boolean) => {
    switch (type) {
      case 'deposit': return styles.deposit;
      case 'withdrawal': return styles.withdrawal;
      case 'bet': return styles.bet;
      case 'payout': return won ? styles.payout : styles.loss;
      default: return '';
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading profile...</div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <h2>Profile Not Found</h2>
          <p>{error || 'User does not exist'}</p>
          <Link href="/" className={styles.backButton}>
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  const totalDeposits = transactions
    .filter(t => t.type === 'deposit')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalWithdrawals = transactions
    .filter(t => t.type === 'withdrawal')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalBets = transactions
    .filter(t => t.type === 'bet')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalPayouts = transactions
    .filter(t => t.type === 'payout' && t.details?.won)
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className={styles.container}>
      <Link href="/" className={styles.backLink}>
        ← Back
      </Link>

      {/* Profile Header */}
      <div className={styles.profileHeader}>
        <Image 
          src={profile.profileImage} 
          alt={profile.displayName}
          className={styles.avatar}
          width={120}
          height={120}
        />
        <div className={styles.profileInfo}>
          <h1 className={styles.displayName}>{profile.displayName}</h1>
          <p className={styles.username}>@{profile.username}</p>
          <p className={styles.fid}>FID: {profile.fid}</p>
        </div>
        <div className={styles.balanceCard}>
          <div className={styles.balanceLabel}>Current Balance</div>
          <div className={styles.balanceAmount}>{formatAmount(profile.balance)}</div>
        </div>
      </div>

      {/* Statistics */}
      <div className={styles.stats}>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Total Deposits</div>
          <div className={styles.statValue}>{formatAmount(totalDeposits)}</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Total Withdrawals</div>
          <div className={styles.statValue}>{formatAmount(totalWithdrawals)}</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Total Bets</div>
          <div className={styles.statValue}>{formatAmount(totalBets)}</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Total Winnings</div>
          <div className={styles.statValue}>{formatAmount(totalPayouts)}</div>
        </div>
      </div>

      {/* Transaction History */}
      <div className={styles.transactionSection}>
        <h2 className={styles.sectionTitle}>Transaction History</h2>
        
        {transactions.length === 0 ? (
          <div className={styles.noTransactions}>
            No transactions yet
          </div>
        ) : (
          <div className={styles.transactionList}>
            {transactions.map((tx, index) => (
              <div 
                key={index} 
                className={`${styles.transaction} ${getTransactionColor(tx.type, tx.details?.won)}`}
              >
                <div className={styles.transactionLeft}>
                  <span className={styles.transactionIcon}>
                    {getTransactionIcon(tx.type)}
                  </span>
                  <div className={styles.transactionDetails}>
                    <div className={styles.transactionType}>
                      {tx.type.charAt(0).toUpperCase() + tx.type.slice(1)}
                      {tx.type === 'bet' && tx.details?.side && (
                        <span className={styles.betSide}> ({tx.details.side})</span>
                      )}
                      {tx.type === 'payout' && (
                        <span className={styles.payoutStatus}>
                          {tx.details?.won ? ' - Won!' : ' - Lost'}
                        </span>
                      )}
                    </div>
                    <div className={styles.transactionTime}>
                      {formatDate(tx.timestamp)}
                    </div>
                    {tx.transactionHash && (
                      <a 
                        href={`https://basescan.org/tx/${tx.transactionHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.txLink}
                      >
                        View on BaseScan →
                      </a>
                    )}
                  </div>
                </div>
                <div className={styles.transactionAmount}>
                  {tx.type === 'withdrawal' || tx.type === 'bet' ? '-' : '+'}
                  {formatAmount(tx.amount)}
                  {tx.details?.serviceFee && (
                    <div className={styles.serviceFee}>
                      (Fee: {formatAmount(tx.details.serviceFee)})
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Member Since */}
      <div className={styles.memberInfo}>
        <p>Member since: {formatDate(profile.createdAt)}</p>
        <p>Last active: {formatDate(profile.lastSeen)}</p>
      </div>
    </div>
  );
}

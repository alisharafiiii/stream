"use client";
import { useState, useEffect } from "react";
import { useUniversalAuth } from "../hooks/useUniversalAuth";
import styles from "./AuthModal.module.css";
import { pay, getPaymentStatus } from '@base-org/account';
import { PAYMENT_CONFIG } from '../config/payment';

interface User {
  fid: string;
  username: string;
  displayName: string;
  profileImage?: string;
  balance: number;
}

interface AuthModalProps {
  onComplete: (user: User) => void;
}

export default function AuthModal({ onComplete }: AuthModalProps) {
  const [step, setStep] = useState<'signin' | 'topup' | 'complete'>('signin');
  const [topupAmount, setTopupAmount] = useState('');
  const [user, setUser] = useState<User | null>(null);
  const [localError, setError] = useState<string | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const { user: authUser, isLoading, error: authError, signIn, isInBaseApp } = useUniversalAuth();

  useEffect(() => {
    // Check if user is already authenticated
    if (authUser && !user && authUser.displayName) {
      createUserProfile({
        fid: authUser.fid,
        username: authUser.username,
        displayName: authUser.displayName,
        profileImage: authUser.profileImage,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authUser]);

  const createUserProfile = async (userData: Omit<User, 'balance'>) => {
    try {
      const response = await fetch('/api/user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fid: userData.fid,
          username: userData.username || 'User',
          displayName: userData.displayName || userData.username || 'User',
          profileImage: userData.profileImage,
          balance: 0, // New users start with $0 - must deposit real money
        }),
      });
      
      if (response.ok) {
        const userProfile = await response.json();
        setUser(userProfile);
        setStep('topup');
      } else {
        const errorData = await response.json();
        setError(`Failed to create profile: ${errorData.error || 'Unknown error'}`);
      }
    } catch {
      setError('Failed to create profile. Please try again.');
    }
  };

  const handleTopup = async () => {
    const amount = parseFloat(topupAmount);
    if (amount > 0 && user) {
      setError(null);
      setIsProcessingPayment(true);
      
      try {
        // Check if we're in Base app
        if (!isInBaseApp) {
          // In browser, simulate a successful payment for demo
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          // Update user balance for demo
          const response = await fetch('/api/user', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fid: user.fid,
              username: user.username,
              displayName: user.displayName,
              profileImage: user.profileImage,
              amount: amount,
              type: 'add',
              transactionId: `demo-${Date.now()}`,
            }),
          });
          
          if (response.ok) {
            const updatedUser = await response.json();
            setUser(updatedUser);
            handleComplete(updatedUser);
          } else {
            setError('Failed to update balance in demo mode.');
          }
          return;
        }
        
        // Trigger Base Pay payment (only in Base app)
        const payment = await pay({
          amount: amount.toFixed(2), // USD amount as string
          to: PAYMENT_CONFIG.recipientAddress,
          testnet: PAYMENT_CONFIG.useTestnet,
        });
        
        // Poll for payment status
        let attempts = 0;
        const maxAttempts = 30; // 30 seconds timeout
        let paymentCompleted = false;
        
        while (attempts < maxAttempts && !paymentCompleted) {
          const status = await getPaymentStatus({ 
            id: payment.id,
            testnet: PAYMENT_CONFIG.useTestnet
          });
          
          if (status.status === 'completed') {
            paymentCompleted = true;
            
            // Update user balance after successful payment
            const response = await fetch('/api/user', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                fid: user.fid,
                username: user.username,
                displayName: user.displayName,
                profileImage: user.profileImage,
                amount: amount,
                type: 'add',
                transactionId: payment.id,
              }),
            });
            
            if (response.ok) {
              const updatedUser = await response.json();
              setUser(updatedUser);
              handleComplete(updatedUser);
            } else {
              const errorData = await response.json();
              setError(errorData.error || 'Payment received but failed to update balance.');
            }
          } else if (status.status === 'failed') {
            setError('Payment failed. Please try again.');
            break;
          }
          
          // Wait 1 second before next check
          await new Promise(resolve => setTimeout(resolve, 1000));
          attempts++;
        }
        
        if (!paymentCompleted && attempts >= maxAttempts) {
          setError('Payment timeout. Please check your wallet.');
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to process payment. Please try again.';
        setError(errorMessage);
      } finally {
        setIsProcessingPayment(false);
      }
    }
  };

  const handleSkip = () => {
    if (user) {
      handleComplete(user);
    }
  };

  const handleComplete = (finalUser: User) => {
    setStep('complete');
    setTimeout(() => {
      onComplete(finalUser);
    }, 1000);
  };

  if (step === 'complete') {
    return (
      <div className={styles.overlay}>
        <div className={styles.modal}>
          <div className={styles.success}>
            <div className={styles.successIcon}>✅</div>
            <h2>Welcome to Stream Live!</h2>
            <p>Enjoy the stream</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        {step === 'signin' && (
          <div className={styles.content}>
            <div className={styles.icon}>📺</div>
            <h2>Welcome to Stream Live</h2>
            <p>Sign in to create your profile and start watching</p>
            
            {(authError || localError) && (
              <div className={styles.error}>
                {localError || authError || 'Failed to sign in. Please try again.'}
              </div>
            )}
            
            <button 
              onClick={async () => {
                setError(null); // Clear any previous errors
                const authenticatedUser = await signIn();
                if (authenticatedUser) {
                  createUserProfile(authenticatedUser);
                }
              }}
              disabled={isLoading}
              className={styles.primaryButton}
            >
              {isLoading ? 'Connecting...' : isInBaseApp ? 'Connect with Base' : 'Connect Wallet'}
            </button>
            
            <p className={styles.hint}>
              {isInBaseApp 
                ? 'Your profile will be created automatically' 
                : 'Connect your wallet or continue as demo user'
              }
            </p>
          </div>
        )}

        {step === 'topup' && user && (
          <div className={styles.content}>
            <div className={styles.userInfo}>
              {user.profileImage && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.profileImage} alt={user.displayName} className={styles.avatar} />
              )}
              <h3>Welcome, {user.displayName}!</h3>
            </div>
            
            <div className={styles.topupSection}>
              <h2>Top Up Your Account</h2>
              <p>{isInBaseApp ? 'Add funds to tip creators and unlock features' : 'Payment available only in Base app'}</p>
              
              {localError && (
                <div className={styles.error}>
                  {localError}
                </div>
              )}
              
              <div className={styles.amountGrid}>
                <button 
                  onClick={() => setTopupAmount('0.01')}
                  className={`${styles.amountButton} ${topupAmount === '0.01' ? styles.selected : ''}`}
                >
                  $0.01
                </button>
                <button 
                  onClick={() => setTopupAmount('0.05')}
                  className={`${styles.amountButton} ${topupAmount === '0.05' ? styles.selected : ''}`}
                >
                  $0.05
                </button>
                <button 
                  onClick={() => setTopupAmount('0.10')}
                  className={`${styles.amountButton} ${topupAmount === '0.10' ? styles.selected : ''}`}
                >
                  $0.10
                </button>
                <button 
                  onClick={() => setTopupAmount('0.50')}
                  className={`${styles.amountButton} ${topupAmount === '0.50' ? styles.selected : ''}`}
                >
                  $0.50
                </button>
                <button 
                  onClick={() => setTopupAmount('1')}
                  className={`${styles.amountButton} ${topupAmount === '1' ? styles.selected : ''}`}
                >
                  $1
                </button>
              </div>
              
              <input
                type="number"
                placeholder="Or enter custom amount"
                value={topupAmount}
                onChange={(e) => setTopupAmount(e.target.value)}
                className={styles.input}
                min="0"
                step="0.01"
              />
              
              <div className={styles.buttonGroup}>
                {!topupAmount || parseFloat(topupAmount) <= 0 ? (
                  <button 
                    disabled
                    className={styles.primaryButton}
                  >
                    Select an amount
                  </button>
                ) : isProcessingPayment ? (
                  <button 
                    disabled
                    className={styles.primaryButton}
                  >
                    Processing payment...
                  </button>
                ) : (
                  <button 
                    onClick={handleTopup}
                    className={isInBaseApp ? styles.basePayButton : styles.primaryButton}
                  >
                    {isInBaseApp ? (
                      <>
                        <span className={styles.basePayLogo}>Base</span>
                        <span>Pay ${topupAmount}</span>
                      </>
                    ) : (
                      <span>Add ${topupAmount} (Demo)</span>
                    )}
                  </button>
                )}
                <button 
                  onClick={handleSkip}
                  className={styles.secondaryButton}
                  disabled={isProcessingPayment}
                >
                  Skip for now
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

"use client";
import { useState, useEffect } from "react";
import { useUniversalAuth } from "../hooks/useUniversalAuth";
import { useBaseWalletAuth } from "../hooks/useBaseWalletAuth";
import styles from "./AuthModal.module.css";
import { pay, getPaymentStatus } from '@base-org/account';
import { PAYMENT_CONFIG } from '../config/payment';
import Image from "next/image";

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
  const [isCreatingGuest, setIsCreatingGuest] = useState(false);
  const { user: authUser, isLoading, error: authError, signIn, isInBaseApp } = useUniversalAuth();
  const { connectWallet, isLoading: walletLoading, error: walletError } = useBaseWalletAuth();

  useEffect(() => {
    // Check if user is already authenticated
    if (authUser && !user && authUser.displayName) {
      createUserProfile({
        fid: authUser.fid,
        username: authUser.username,
        displayName: authUser.displayName,
        profileImage: authUser.profileImage?.includes('dicebear') ? undefined : authUser.profileImage,
      }, false); // Skip topup
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authUser]);

  const createUserProfile = async (userData: Omit<User, 'balance'>, skipTopup = false) => {
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
        
        if (skipTopup) {
          // Skip topup for guest users
          onComplete(userProfile);
        } else {
          // Skip topup for all users now - go directly to the app
          onComplete(userProfile);
        }
      } else {
        const errorData = await response.json();
        setError(`Failed to create profile: ${errorData.error || 'Unknown error'}`);
      }
    } catch {
      setError('Failed to create profile. Please try again.');
    }
  };

  const handleGuestLogin = async () => {
    setIsCreatingGuest(true);
    setError(null);
    
    // Generate a random guest ID
    const guestId = `guest_${Math.random().toString(36).substring(2, 15)}`;
    
    await createUserProfile({
      fid: guestId,
      username: `Guest_${guestId.substring(6, 11)}`,
      displayName: `Guest Player`,
      profileImage: undefined,
    }, true); // Skip topup for guest users
    
    setIsCreatingGuest(false);
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
    return null; // Modal will close and app will load
  }

  return (
    <div className={styles.modal}>
      <div className={styles.modalContent}>
        {step === 'signin' && (
          <>
            <Image 
              src="/clicknpray-preview.png" 
              alt="Click n Pray" 
              width={120}
              height={120}
              className={styles.logo}
              priority
            />
            <h1 className={styles.title}>Welcome</h1>
            <p className={styles.subtitle}>Join the action</p>
            
            {(authError || localError || walletError) && (
              <div className={styles.error}>
                {localError || walletError || authError || 'Failed to sign in. Please try again.'}
              </div>
            )}
            
            <button 
              onClick={async () => {
                setError(null);
                try {
                  // Check if we're in Base app
                  if (isInBaseApp) {
                    // Use MiniKit auth in Base app
                    const authenticatedUser = await signIn();
                    if (authenticatedUser) {
                      createUserProfile({
                        ...authenticatedUser,
                        profileImage: authenticatedUser.profileImage?.includes('dicebear') ? undefined : authenticatedUser.profileImage,
                      });
                    }
                  } else {
                    // Use direct wallet connection in browser
                    const walletUser = await connectWallet();
                    if (walletUser) {
                      createUserProfile({
                        ...walletUser,
                        profileImage: walletUser.profileImage?.includes('dicebear') ? undefined : walletUser.profileImage,
                      });
                    }
                  }
                } catch (err) {
                  setError(err instanceof Error ? err.message : 'Failed to connect wallet');
                }
              }}
              disabled={isLoading || walletLoading}
              className={styles.baseAuthButton}
            >
              {(isLoading || walletLoading) ? 'Connecting...' : 'Connect Base Wallet'}
            </button>
            
            <button
              onClick={handleGuestLogin}
              disabled={isCreatingGuest}
              className={styles.guestButton}
            >
              {isCreatingGuest ? 'Creating...' : 'Continue as Guest'}
            </button>
          </>
        )}

        {/* Topup step removed - users go directly to the app */}
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

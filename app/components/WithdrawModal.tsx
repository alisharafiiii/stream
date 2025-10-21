"use client";
import { useState } from "react";
import styles from "./WithdrawModal.module.css";

interface WithdrawModalProps {
  balance: number;
  onClose: () => void;
  onWithdraw: (amount: number) => Promise<{ success: boolean; error?: string; transactionHash?: string }>;
}

export default function WithdrawModal({ balance, onClose, onWithdraw }: WithdrawModalProps) {
  const [amount, setAmount] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [transactionHash, setTransactionHash] = useState<string | null>(null);

  const handleWithdraw = async () => {
    const withdrawAmount = parseFloat(amount);
    
    if (isNaN(withdrawAmount) || withdrawAmount <= 0) {
      setError("Please enter a valid amount");
      return;
    }
    
    if (withdrawAmount > balance) {
      setError("Insufficient balance");
      return;
    }
    
    setError(null);
    setIsProcessing(true);
    
    try {
      const result = await onWithdraw(withdrawAmount);
      
      if (result.success) {
        setSuccess(true);
        if (result.transactionHash) {
          setTransactionHash(result.transactionHash);
        }
        setTimeout(() => {
          onClose();
        }, 4000); // Give more time to see the transaction
      } else {
        setError(result.error || "Withdrawal failed");
      }
    } catch {
      setError("An error occurred");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeButton} onClick={onClose}>×</button>
        
        <h2 className={styles.title}>WITHDRAW</h2>
        
        <button 
          className={styles.backButton}
          onClick={onClose}
        >
          ← Back
        </button>
        
        <div className={styles.balanceInfo}>
          <span className={styles.label}>AVAILABLE</span>
          <span className={styles.balance}>${balance.toFixed(2)}</span>
        </div>
        
        {!success ? (
          <>
            <div className={styles.inputContainer}>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className={styles.input}
                disabled={isProcessing}
                step="0.01"
                min="0"
                max={balance}
              />
              <button 
                className={styles.maxButton}
                onClick={() => setAmount(balance.toString())}
                disabled={isProcessing}
              >
                MAX
              </button>
            </div>
            
            {error && <div className={styles.error}>{error}</div>}
            
            <div className={styles.actions}>
              <button 
                className={styles.withdrawButton}
                onClick={handleWithdraw}
                disabled={isProcessing || !amount}
              >
                {isProcessing ? "PROCESSING..." : "WITHDRAW"}
              </button>
            </div>
            
            <p className={styles.note}>
              Funds will be sent to your connected wallet
            </p>
          </>
        ) : (
          <div className={styles.success}>
            <div className={styles.successIcon}>✓</div>
            <p>Withdrawal initiated!</p>
            {transactionHash && (
              <div className={styles.transaction}>
                <p className={styles.txLabel}>Transaction Hash:</p>
                <code className={styles.txHash}>{transactionHash}</code>
                <p className={styles.txNote}>
                  Funds will arrive in 1-2 network confirmations
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

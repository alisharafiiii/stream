"use client";
import { useState } from "react";
import { pay } from "@base-org/account";
import styles from "./BalanceModal.module.css";
import WithdrawModal from "./WithdrawModal";

interface EthereumProvider {
  request: (args: { 
    method: string; 
    params?: Array<Record<string, string | number>> 
  }) => Promise<string[] | string>;
}

interface BalanceModalProps {
  user: {
    fid: string;
    displayName: string;
    balance: number;
  };
  onClose: () => void;
  onBalanceUpdate: (newBalance: number) => void;
}

export default function BalanceModal({ user, onClose, onBalanceUpdate }: BalanceModalProps) {
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [showDeposit, setShowDeposit] = useState(false);
  const [depositAmount, setDepositAmount] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const handleDeposit = async () => {
    const amount = parseFloat(depositAmount);
    if (isNaN(amount) || amount <= 0) return;
    
    setIsProcessing(true);
    try {
      // Check if we're in Base app
      const isInBaseApp = typeof window !== 'undefined' && 
        (window.navigator.userAgent.toLowerCase().includes('base') || 
         window.navigator.userAgent.toLowerCase().includes('coinbase'));
      
      if (isInBaseApp) {
        // Use Base Pay with real USDC
        const treasuryAddress = process.env.NEXT_PUBLIC_TREASURY_ADDRESS || "0xAbD4BB1Ba7C9a57C40598604A7ad0E5d105AD54D";
        const payment = await pay({
          amount: amount.toFixed(2),
          to: treasuryAddress,
          // Users can select USDC in Base Pay interface
        });
        
        // Update balance after successful payment
        if (payment) {
          const response = await fetch('/api/user', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fid: user.fid,
              amount: amount,
              type: 'add',
              transactionId: payment,
            }),
          });
          
          if (response.ok) {
            const userData = await response.json();
            onBalanceUpdate(userData.balance);
            setShowDeposit(false);
          }
        }
      } else {
        // Browser: For both guest and wallet users, connect wallet and send USDC
        if (typeof window !== 'undefined' && (window as Window & { ethereum?: EthereumProvider }).ethereum) {
          try {
            const treasuryAddress = process.env.NEXT_PUBLIC_TREASURY_ADDRESS || "0xAbD4BB1Ba7C9a57C40598604A7ad0E5d105AD54D";
            
            // Request wallet connection
            const ethereum = (window as Window & { ethereum?: EthereumProvider }).ethereum!;
            const accounts = await ethereum.request({ 
              method: 'eth_requestAccounts' 
            }) as string[];
            
            // Switch to Base network if needed
            try {
              await ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: '0x2105' }], // Base mainnet
              });
              } catch (switchError) {
              if ((switchError as { code?: number }).code === 4902) {
                await ethereum.request({
                  method: 'wallet_addEthereumChain',
                  params: [{
                    chainId: '0x2105',
                    chainName: 'Base',
                    nativeCurrency: { name: 'Ethereum', symbol: 'ETH', decimals: 18 },
                    rpcUrls: ['https://mainnet.base.org'],
                    blockExplorerUrls: ['https://basescan.org']
                  }]
                });
              }
            }
            
            // USDC contract on Base
            const USDC_ADDRESS = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
            const amount_wei = (amount * 1e6).toString(); // USDC has 6 decimals
            
            // Create the transfer data correctly
            const iface = {
              encodeFunctionData: (func: string, params: unknown[]) => {
                if (func === 'transfer') {
                  const to = (params[0] as string).slice(2).padStart(64, '0');
                  const value = BigInt(params[1] as string).toString(16).padStart(64, '0');
                  return '0xa9059cbb' + to + value;
                }
                return '0x';
              }
            };
            
            const data = iface.encodeFunctionData('transfer', [treasuryAddress, amount_wei]);
            
            // Send USDC using wallet
            const txHash = await ethereum.request({
              method: 'eth_sendTransaction',
              params: [{
                from: accounts[0],
                to: USDC_ADDRESS,
                data: data,
                gas: '0x15F90', // 90000 gas limit
              }],
            }) as string;
            
            // Wait for confirmation and update balance
            if (txHash) {
              const response = await fetch('/api/user', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  fid: user.fid,
                  amount: amount,
                  type: 'add',
                  transactionId: txHash,
                }),
              });
              
              if (response.ok) {
                const userData = await response.json();
                onBalanceUpdate(userData.balance);
                setShowDeposit(false);
                alert('Deposit successful!');
              } else {
                const error = await response.text();
                console.error('Deposit API error:', error);
                alert('Failed to record deposit. Please contact support.');
              }
            }
          } catch (error) {
            console.error('Wallet transaction failed:', error);
            if ((error as { code?: number }).code === 4001) {
              alert('Transaction rejected by user.');
            } else if ((error as Error).message?.includes('insufficient funds')) {
              alert('Insufficient USDC balance. Please ensure you have enough USDC on Base network.');
            } else {
              alert(`Transaction failed: ${(error as Error).message || 'Unknown error'}. Make sure you have USDC on Base network.`);
            }
          }
        } else {
          // No wallet detected
          if (window.confirm('No wallet detected. Would you like to install MetaMask?')) {
            window.open('https://metamask.io/download/', '_blank');
          }
        }
      }
    } catch (error) {
      console.error('Deposit failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleWithdraw = async (amount: number) => {
    try {
      // Check if user is a guest
      if (user.fid.startsWith('guest_')) {
        alert('Guest accounts cannot withdraw. Please sign out and connect with a real wallet.');
        return;
      }
      
      // Get user's wallet address
      let walletAddress = '';
      
      // Check if we're in Base app or browser
      const isInBaseApp = typeof window !== 'undefined' && 
        (window.navigator.userAgent.toLowerCase().includes('base') || 
         window.navigator.userAgent.toLowerCase().includes('coinbase'));
      
      if (!isInBaseApp && typeof window !== 'undefined' && (window as Window & { ethereum?: EthereumProvider }).ethereum) {
        // Get wallet address from browser wallet
        const accounts = await (window as Window & { ethereum?: EthereumProvider }).ethereum!.request({ 
          method: 'eth_requestAccounts' 
        }) as string[];
        walletAddress = accounts[0];
      } else {
        // For Base app, you'd get the address from the MiniKit context
        // For now, we'll use a placeholder
        walletAddress = user.fid; // This should be replaced with actual wallet address
      }
      
      const response = await fetch('/api/user/withdraw-real', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fid: user.fid,
          amount,
          walletAddress
        })
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        onBalanceUpdate(data.newBalance);
        return { success: true, transactionHash: data.transactionHash };
      } else {
        return { success: false, error: data.error || 'Withdrawal failed' };
      }
    } catch {
      return { success: false, error: 'Network error' };
    }
  };

  if (showWithdraw) {
    return (
      <WithdrawModal
        balance={user.balance}
        onClose={() => {
          setShowWithdraw(false);
          onClose();
        }}
        onWithdraw={handleWithdraw}
      />
    );
  }

  if (showDeposit) {
    return (
      <div className={styles.overlay} onClick={onClose}>
        <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
          <button className={styles.closeButton} onClick={onClose}>×</button>
          
          <h2 className={styles.title}>DEPOSIT</h2>
          
          <div className={styles.inputContainer}>
            <input
              type="number"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              placeholder="0.00"
              className={styles.input}
              disabled={isProcessing}
              step="0.01"
              min="0"
            />
          </div>
          
          <div className={styles.presetAmounts}>
            {[5, 10, 25, 50].map(amount => (
              <button
                key={amount}
                onClick={() => setDepositAmount(amount.toString())}
                className={styles.presetButton}
                disabled={isProcessing}
              >
                ${amount}
              </button>
            ))}
          </div>
          
          <button
            className={styles.actionButton}
            onClick={handleDeposit}
            disabled={isProcessing || !depositAmount}
          >
            {isProcessing ? "PROCESSING..." : "DEPOSIT USDC"}
          </button>
          
          <p className={styles.note}>
            Real USDC on Base network. You&apos;ll be connected to Base Pay or your wallet.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeButton} onClick={onClose}>×</button>
        
        <h2 className={styles.title}>BALANCE</h2>
        
        <div className={styles.balanceDisplay}>
          <span className={styles.amount}>${user.balance.toFixed(2)}</span>
        </div>
        
        <div className={styles.actions}>
          <button
            className={styles.depositButton}
            onClick={() => setShowDeposit(true)}
          >
            + DEPOSIT
          </button>
          
          <button
            className={styles.withdrawButton}
            onClick={() => setShowWithdraw(true)}
            disabled={user.balance <= 0}
          >
            - WITHDRAW
          </button>
        </div>
        
        <div className={styles.info}>
          <h3>How it works:</h3>
          <p><strong>Deposit:</strong> Send real USDC via Base Pay or wallet</p>
          <p><strong>Withdraw:</strong> Receive USDC to your wallet address</p>
          <p className={styles.warning}>
            Live Features:
            <br/>• Real USDC deposits & withdrawals
            <br/>• Base network (low fees)
            <br/>• Daily limit: $100
            <br/>• Per transaction: $50
          </p>
        </div>
      </div>
    </div>
  );
}

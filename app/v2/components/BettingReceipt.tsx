import React from 'react';

interface BettingReceiptProps {
  isWinner: boolean;
  betAmount: number;
  winAmount?: number;
  multiplier?: number;
  platformFee?: number;
  optionName: string;
  winningOption?: string;
  newBalance: number;
  onClose: () => void;
}

export default function BettingReceipt({
  isWinner,
  betAmount,
  winAmount,
  multiplier,
  platformFee,
  optionName,
  winningOption,
  newBalance,
  onClose
}: BettingReceiptProps) {
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9998,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        cursor: 'pointer',
        padding: '20px'
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '400px',
          width: '100%',
          backgroundColor: '#000',
          border: `3px solid ${isWinner ? '#00FF00' : '#FF0000'}`,
          padding: '24px',
          fontFamily: 'monospace',
          boxShadow: `0 0 20px ${isWinner ? '#00FF00' : '#FF0000'}`,
          cursor: 'default'
        }}
      >
        {/* Header */}
        <div style={{
          borderBottom: `2px solid ${isWinner ? '#00FF00' : '#FF0000'}`,
          paddingBottom: '12px',
          marginBottom: '16px',
          textAlign: 'center'
        }}>
          <h2 style={{
            margin: 0,
            fontSize: '18px',
            color: isWinner ? '#00FF00' : '#FF0000',
            letterSpacing: '2px'
          }}>
            {isWinner ? '🎊 YOU WON! 🎊' : 'BETTER LUCK NEXT TIME'}
          </h2>
        </div>

        {/* Receipt Details */}
        <div style={{ fontSize: '14px', lineHeight: '1.8' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ color: '#888' }}>BET ON:</span>
            <span style={{ color: '#FFF' }}>{optionName}</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ color: '#888' }}>BET AMOUNT:</span>
            <span style={{ color: '#FFF' }}>${betAmount.toFixed(2)}</span>
          </div>

          {isWinner ? (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: '#888' }}>MULTIPLIER:</span>
                <span style={{ color: '#FFF' }}>{multiplier?.toFixed(1)}x</span>
              </div>

              <div style={{
                borderTop: '1px dashed #333',
                borderBottom: '1px dashed #333',
                padding: '8px 0',
                margin: '12px 0'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: '#888' }}>GROSS WIN:</span>
                  <span style={{ color: '#00FF00' }}>${((winAmount || 0) + (platformFee || 0)).toFixed(2)}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#888' }}>PLATFORM FEE (5%):</span>
                  <span style={{ color: '#FF6666' }}>-${platformFee?.toFixed(2)}</span>
                </div>
              </div>

              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '16px',
                fontSize: '16px',
                fontWeight: 'bold'
              }}>
                <span style={{ color: '#00FF00' }}>NET PAYOUT:</span>
                <span style={{ color: '#00FF00' }}>${winAmount?.toFixed(2)}</span>
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
              <span style={{ color: '#888' }}>WINNING OPTION:</span>
              <span style={{ color: '#FFD700' }}>{winningOption}</span>
            </div>
          )}

          {/* New Balance */}
          <div style={{
            borderTop: '2px solid #333',
            paddingTop: '12px',
            marginTop: '12px',
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '16px',
            fontWeight: 'bold'
          }}>
            <span style={{ color: isWinner ? '#00FF00' : '#FF6666' }}>
              {isWinner ? 'NEW BALANCE:' : 'REMAINING BALANCE:'}
            </span>
            <span style={{ color: isWinner ? '#00FF00' : '#FF6666' }}>
              ${newBalance.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            width: '100%',
            padding: '12px',
            marginTop: '20px',
            backgroundColor: 'transparent',
            border: `2px solid ${isWinner ? '#00FF00' : '#FF0000'}`,
            color: isWinner ? '#00FF00' : '#FF0000',
            fontFamily: 'monospace',
            fontSize: '14px',
            cursor: 'pointer',
            textTransform: 'uppercase',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = isWinner ? '#00FF00' : '#FF0000';
            e.currentTarget.style.color = '#000';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = isWinner ? '#00FF00' : '#FF0000';
          }}
        >
          CLOSE
        </button>
      </div>
    </div>
  );
}

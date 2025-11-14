import React, { useEffect, useState } from 'react';

interface GameResultAnimationProps {
  isWinner: boolean;
  amount: number;
  onClose: () => void;
}

export default function GameResultAnimation({ isWinner, amount, onClose }: GameResultAnimationProps) {
  const [showAnimation, setShowAnimation] = useState(true);

  useEffect(() => {
    // Auto close after 4 seconds
    const timer = setTimeout(() => {
      setShowAnimation(false);
      setTimeout(onClose, 300); // Wait for fade out
    }, 4000);

    return () => clearTimeout(timer);
  }, [onClose]);

  const handleClick = () => {
    setShowAnimation(false);
    setTimeout(onClose, 300);
  };

  return (
    <div
      onClick={handleClick}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        cursor: 'pointer',
        opacity: showAnimation ? 1 : 0,
        transition: 'opacity 0.3s ease'
      }}
    >
      {isWinner ? (
        // Winner Animation
        <div style={{
          padding: '40px 60px',
          backgroundColor: '#000',
          border: '4px solid #00FF00',
          boxShadow: '0 0 20px #00FF00, inset 0 0 20px rgba(0, 255, 0, 0.2)',
          textAlign: 'center',
          fontFamily: 'var(--font-press-start), monospace',
          position: 'relative',
          animation: 'winnerPulse 0.5s ease infinite alternate'
        }}>
          {/* Animated Stars */}
          <div style={{
            position: 'absolute',
            top: '-20px',
            left: '50%',
            transform: 'translateX(-50%)',
            fontSize: '24px',
            animation: 'starRotate 2s linear infinite'
          }}>
            ★ ☆ ★ ☆ ★ ☆ ★ ☆ ★
          </div>

          <h1 style={{
            fontSize: '32px',
            color: '#00FF00',
            marginBottom: '20px',
            textShadow: '2px 2px 0 #008800',
            animation: 'rainbowText 2s linear infinite'
          }}>
            W I N N E R !
          </h1>

          <div style={{
            fontSize: '24px',
            color: '#FFD700',
            marginBottom: '20px',
            textShadow: '2px 2px 0 #B8860B'
          }}>
            YOU WON
          </div>

          <div style={{
            fontSize: '36px',
            color: '#00FF00',
            textShadow: '0 0 10px #00FF00',
            animation: 'pulse 0.8s ease infinite'
          }}>
            ${amount.toFixed(2)}
          </div>

          {/* Trophy Animation */}
          <div style={{
            fontSize: '48px',
            marginTop: '20px',
            animation: 'bounce 1s ease infinite'
          }}>
            🏆
          </div>

          <div style={{
            fontSize: '10px',
            color: '#666',
            marginTop: '20px',
            animation: 'blink 1s ease infinite'
          }}>
            [Click anywhere to continue]
          </div>

          {/* Pixel Confetti */}
          <div className="confetti-container">
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className="pixel-confetti"
                style={{
                  left: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 2}s`,
                  backgroundColor: ['#00FF00', '#FFD700', '#FF00FF', '#00FFFF'][Math.floor(Math.random() * 4)]
                }}
              />
            ))}
          </div>
        </div>
      ) : (
        // Loser Animation
        <div style={{
          padding: '40px 60px',
          backgroundColor: '#000',
          border: '4px solid #FF0000',
          boxShadow: '0 0 20px #FF0000, inset 0 0 20px rgba(255, 0, 0, 0.2)',
          textAlign: 'center',
          fontFamily: 'var(--font-press-start), monospace',
          position: 'relative',
          animation: 'shake 0.5s ease infinite'
        }}>
          <h1 style={{
            fontSize: '28px',
            color: '#FF0000',
            marginBottom: '20px',
            textShadow: '2px 2px 0 #880000',
            animation: 'flicker 0.1s ease infinite'
          }}>
            GAME OVER
          </h1>

          <div style={{
            fontSize: '20px',
            color: '#FF6666',
            marginBottom: '20px',
            textShadow: '1px 1px 0 #880000'
          }}>
            YOU LOST
          </div>

          <div style={{
            fontSize: '32px',
            color: '#FF0000',
            textShadow: '0 0 5px #FF0000'
          }}>
            -${amount.toFixed(2)}
          </div>

          {/* Sad Face Animation */}
          <div style={{
            fontSize: '48px',
            marginTop: '20px',
            animation: 'melt 2s ease-in-out infinite'
          }}>
            😢
          </div>

          <div style={{
            fontSize: '12px',
            color: '#FF6666',
            marginTop: '20px',
            animation: 'fadeInOut 1s ease infinite'
          }}>
            TRY AGAIN NEXT TIME
          </div>

          <div style={{
            fontSize: '10px',
            color: '#666',
            marginTop: '10px',
            animation: 'blink 1s ease infinite'
          }}>
            [Click anywhere to continue]
          </div>

          {/* Pixel Rain */}
          <div className="rain-container">
            {[...Array(30)].map((_, i) => (
              <div
                key={i}
                className="pixel-rain"
                style={{
                  left: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 3}s`
                }}
              />
            ))}
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes winnerPulse {
          from { transform: scale(1); }
          to { transform: scale(1.02); }
        }

        @keyframes pulse {
          0% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.1); }
          100% { opacity: 1; transform: scale(1); }
        }

        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-20px); }
        }

        @keyframes starRotate {
          from { transform: translateX(-50%) rotate(0deg); }
          to { transform: translateX(-50%) rotate(360deg); }
        }

        @keyframes rainbowText {
          0% { color: #FF0000; }
          16% { color: #FF8800; }
          33% { color: #FFFF00; }
          50% { color: #00FF00; }
          66% { color: #0088FF; }
          83% { color: #8800FF; }
          100% { color: #FF0000; }
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }

        @keyframes flicker {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        @keyframes melt {
          0% { transform: translateY(0) scaleY(1); }
          50% { transform: translateY(10px) scaleY(1.2); }
          100% { transform: translateY(0) scaleY(1); }
        }

        @keyframes blink {
          0%, 50%, 100% { opacity: 1; }
          25%, 75% { opacity: 0; }
        }

        @keyframes fadeInOut {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }

        .confetti-container {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          overflow: hidden;
          pointer-events: none;
        }

        .pixel-confetti {
          position: absolute;
          width: 8px;
          height: 8px;
          top: -10px;
          animation: confettiFall 3s linear infinite;
        }

        @keyframes confettiFall {
          to {
            transform: translateY(calc(100vh + 10px)) rotate(720deg);
          }
        }

        .rain-container {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          overflow: hidden;
          pointer-events: none;
        }

        .pixel-rain {
          position: absolute;
          width: 2px;
          height: 10px;
          background-color: #FF0000;
          opacity: 0.5;
          top: -10px;
          animation: rainFall 2s linear infinite;
        }

        @keyframes rainFall {
          to {
            transform: translateY(calc(100vh + 10px));
          }
        }
      `}</style>
    </div>
  );
}

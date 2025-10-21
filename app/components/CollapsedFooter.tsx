"use client";
import styles from './CollapsedFooter.module.css';

interface CollapsedFooterProps {
  onExpandBetting: () => void;
  onToggleMute: () => void;
  isMuted: boolean;
}

export default function CollapsedFooter({ onExpandBetting, onToggleMute, isMuted }: CollapsedFooterProps) {
  return (
    <div className={styles.footer}>
      <div className={styles.container}>
        <button 
          className={styles.muteButton}
          onClick={onToggleMute}
          aria-label={isMuted ? "Unmute" : "Mute"}
          title={isMuted ? "Click to unmute" : "Click to mute"}
        >
          {isMuted ? '🔇' : '🔊'}
        </button>
        
        <button 
          className={styles.bettingButton}
          onClick={onExpandBetting}
          aria-label="Expand betting section"
          title="Click to expand betting deck"
        >
          <span className={styles.icon}>🎲</span>
          <span className={styles.text}>Betting</span>
        </button>
      </div>
    </div>
  );
}

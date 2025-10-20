"use client";
import { useState, useRef, useEffect } from 'react';
import styles from './CommentInput.module.css';

interface CommentInputProps {
  userId: string;
  username: string;
  profileImage?: string;
  onCommentSent?: () => void;
}

export default function CommentInput({ userId, username, profileImage, onCommentSent }: CommentInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Cooldown timer
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSend = async () => {
    if (!message.trim() || sending || cooldown > 0) return;

    setSending(true);
    setError(null);

    try {
      const response = await fetch('/api/comments/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          username,
          profileImage,
          message: message.trim()
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send comment');
      }

      // Success
      setMessage('');
      setIsOpen(false);
      setCooldown(10); // 10 second cooldown
      onCommentSent?.();
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send comment');
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* FAB Button */}
      <button
        className={`${styles.fab} ${isOpen ? styles.fabHidden : ''}`}
        onClick={() => setIsOpen(true)}
        disabled={cooldown > 0}
        aria-label="Add comment"
      >
        {cooldown > 0 ? (
          <span className={styles.cooldown}>{cooldown}</span>
        ) : (
          <span className={styles.icon}>💬</span>
        )}
      </button>

      {/* Comment Input Panel */}
      {isOpen && (
        <div className={styles.inputPanel}>
          <div className={styles.inputHeader}>
            <span className={styles.title}>Add Comment</span>
            <button 
              className={styles.closeButton}
              onClick={() => {
                setIsOpen(false);
                setMessage('');
                setError(null);
              }}
            >
              ✕
            </button>
          </div>

          {error && (
            <div className={styles.error}>{error}</div>
          )}

          <div className={styles.inputWrapper}>
            <input
              ref={inputRef}
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your comment..."
              maxLength={100}
              className={styles.input}
              disabled={sending}
            />
            <button
              className={styles.sendButton}
              onClick={handleSend}
              disabled={!message.trim() || sending}
            >
              {sending ? '...' : '➤'}
            </button>
          </div>
          
          <div className={styles.charCount}>
            {message.length}/100
          </div>
        </div>
      )}
    </>
  );
}

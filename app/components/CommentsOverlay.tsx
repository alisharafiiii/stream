"use client";
import { useEffect, useState, useRef } from 'react';
import styles from './CommentsOverlay.module.css';
import { Comment } from '@/lib/types/comment';

export default function CommentsOverlay() {
  const [comments, setComments] = useState<Comment[]>([]);
  const eventSourceRef = useRef<EventSource | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Connect to SSE endpoint
    const eventSource = new EventSource('/api/comments/stream');
    eventSourceRef.current = eventSource;

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'initial' && data.comments) {
          // Load initial comments (show last 5)
          setComments(data.comments.slice(-5));
        } else if (data.type === 'new' && data.comment) {
          // Add new comment
          setComments(prev => {
            // Keep only last 10 comments
            const updated = [...prev, data.comment].slice(-10);
            
            // Scroll to bottom after adding new comment
            setTimeout(() => {
              if (containerRef.current) {
                containerRef.current.scrollTop = containerRef.current.scrollHeight;
              }
            }, 100);
            
            return updated;
          });
        }
      } catch (error) {
        console.error('Error parsing comment data:', error);
      }
    };

    eventSource.onerror = (error) => {
      console.error('SSE connection error:', error);
      eventSource.close();
      
      // Reconnect after 5 seconds
      setTimeout(() => {
        if (eventSourceRef.current === eventSource) {
          window.location.reload();
        }
      }, 5000);
    };

    return () => {
      eventSource.close();
      eventSourceRef.current = null;
    };
  }, []);

  return (
    <div className={styles.overlay} ref={containerRef}>
      {comments.map((comment) => (
        <div
          key={comment.id}
          className={styles.comment}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img 
            src={comment.profileImage} 
            alt={comment.username}
            className={styles.profilePic}
            onError={(e) => {
              e.currentTarget.src = `https://api.dicebear.com/7.x/personas/png?seed=${comment.userId}`;
            }}
          />
          <div className={styles.content}>
            <span className={styles.username}>
              {comment.username && !comment.username.startsWith('0x') 
                ? `${comment.username}.base.eth` 
                : comment.username}
            </span>
            <span className={styles.message}>{comment.message}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
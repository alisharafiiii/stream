"use client";
import { useEffect, useState, useRef } from 'react';
import styles from './CommentsOverlay.module.css';
import { Comment, CommentWithPosition } from '@/lib/types/comment';

export default function CommentsOverlay() {
  const [comments, setComments] = useState<CommentWithPosition[]>([]);
  const eventSourceRef = useRef<EventSource | null>(null);
  const commentIdCounter = useRef(0);

  useEffect(() => {
    // Connect to SSE endpoint
    const eventSource = new EventSource('/api/comments/stream');
    eventSourceRef.current = eventSource;

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'initial' && data.comments) {
          // Load initial comments
          const initialComments = data.comments.map((comment: Comment) => ({
            ...comment,
            key: `comment-${commentIdCounter.current++}`,
            position: comment.position || Math.random() * 40 + 10
          }));
          setComments(initialComments);
        } else if (data.type === 'new' && data.comment) {
          // Add new comment
          const newComment: CommentWithPosition = {
            ...data.comment,
            key: `comment-${commentIdCounter.current++}`,
            position: data.comment.position || Math.random() * 40 + 10
          };
          
          setComments(prev => [...prev, newComment]);
          
          // Remove comment after animation completes (15 seconds)
          setTimeout(() => {
            setComments(prev => prev.filter(c => c.key !== newComment.key));
          }, 15000);
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
    <div className={styles.overlay}>
      {comments.map((comment) => (
        <div
          key={comment.key}
          className={styles.comment}
          style={{ top: `${comment.position}%` }}
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
            <span className={styles.username}>{comment.username}</span>
            <span className={styles.message}>{comment.message}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

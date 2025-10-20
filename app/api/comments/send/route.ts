import { NextRequest, NextResponse } from 'next/server';
import { redis } from '@/lib/redis';
import { Comment } from '@/lib/types/comment';

// Rate limiting: Track last comment time per user
const RATE_LIMIT_SECONDS = 10;
const MAX_MESSAGE_LENGTH = 100;
const COMMENT_TTL = 60; // Comments expire after 60 seconds

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, username, profileImage, message } = body;

    // Validate input
    if (!userId || !username || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check message length
    if (message.length > MAX_MESSAGE_LENGTH) {
      return NextResponse.json({ error: 'Message too long' }, { status: 400 });
    }

    // Check rate limit
    const lastCommentKey = `comment:ratelimit:${userId}`;
    const lastCommentTime = await redis.get<number>(lastCommentKey);
    const now = Date.now();

    if (lastCommentTime && (now - lastCommentTime) < (RATE_LIMIT_SECONDS * 1000)) {
      const waitTime = Math.ceil((RATE_LIMIT_SECONDS * 1000 - (now - lastCommentTime)) / 1000);
      return NextResponse.json({ 
        error: `Please wait ${waitTime} seconds before commenting again` 
      }, { status: 429 });
    }

    // Create comment with basename formatting
    const displayUsername = username && !username.startsWith('0x') 
      ? username 
      : userId.startsWith('0x') 
        ? `${userId.slice(0, 6)}...${userId.slice(-4)}`
        : username;
    
    const comment: Comment = {
      id: `comment_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      userId,
      username: displayUsername,
      profileImage: profileImage || `https://api.dicebear.com/7.x/personas/png?seed=${userId}`,
      message: message.trim(),
      timestamp: now
    };

    // Store comment in Redis with TTL
    const commentKey = `stream:comment:${comment.id}`;
    await redis.setex(commentKey, COMMENT_TTL, comment);

    // Add to recent comments list
    await redis.lpush('stream:comments:recent', comment.id);
    await redis.ltrim('stream:comments:recent', 0, 19); // Keep only last 20 comments

    // Publish to Redis pub/sub for real-time updates
    await redis.publish('stream:comments:new', JSON.stringify(comment));

    // Update rate limit
    await redis.setex(lastCommentKey, RATE_LIMIT_SECONDS, now);

    return NextResponse.json({ success: true, comment });
  } catch (error) {
    console.error('Error sending comment:', error);
    return NextResponse.json({ error: 'Failed to send comment' }, { status: 500 });
  }
}

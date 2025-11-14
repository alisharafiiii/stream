import { NextResponse } from 'next/server';
import { redis } from '@/lib/redis';

const CHAT_KEY = 'v2:chat:messages';
const MAX_MESSAGES = 100; // Keep last 100 messages

interface ChatMessage {
  id: string;
  username: string;
  displayName?: string;
  profileImage?: string;
  message: string;
  timestamp: number;
}

// GET recent chat messages
export async function GET() {
  try {
    const messages = await redis.lrange(CHAT_KEY, 0, 49); // Get last 50 messages
    const parsedMessages = messages
      .map(msg => {
        try {
          return typeof msg === 'string' ? JSON.parse(msg) : msg;
        } catch {
          return null;
        }
      })
      .filter(Boolean)
      .reverse(); // Most recent last
    
    return NextResponse.json({ messages: parsedMessages });
  } catch (error) {
    console.error('Error fetching chat messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}

// POST new chat message
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, username, displayName, profileImage, message } = body;

    if (!userId || !message || !message.trim()) {
      return NextResponse.json(
        { error: 'Invalid message data' },
        { status: 400 }
      );
    }

    // Check if user is banned
    const userKey = `v2:user:${userId}`;
    
    let userData = await redis.hgetall(userKey) as Record<string, string> | null;
    
    // If no data in hash format, check old format
    if (!userData || Object.keys(userData).length === 0) {
      const oldData = await redis.get(userKey);
      if (oldData && typeof oldData === 'object' && 'isBanned' in oldData) {
        userData = { isBanned: (oldData as { isBanned?: string }).isBanned || 'false' };
      }
    }
    
    if (userData && (userData.isBanned === 'true' || (userData.isBanned as unknown) === true)) {
      return NextResponse.json(
        { error: 'You are banned from chatting' },
        { status: 403 }
      );
    }

    const chatMessage: ChatMessage = {
      id: `${Date.now()}_${userId}`,
      username: username || 'Anonymous',
      displayName,
      profileImage,
      message: message.trim(),
      timestamp: Date.now()
    };

    // Add to Redis list (newest first)
    await redis.lpush(CHAT_KEY, JSON.stringify(chatMessage));
    
    // Trim to keep only recent messages
    await redis.ltrim(CHAT_KEY, 0, MAX_MESSAGES - 1);

    return NextResponse.json({ success: true, message: chatMessage });
  } catch (error) {
    console.error('Error posting chat message:', error);
    return NextResponse.json(
      { error: 'Failed to post message' },
      { status: 500 }
    );
  }
}

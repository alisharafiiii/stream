import { NextRequest } from 'next/server';
import { redis } from '@/lib/redis';
import { Comment } from '@/lib/types/comment';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      // Send initial connection message
      controller.enqueue(encoder.encode(`data: {"type": "connected"}\n\n`));

      // Function to send SSE message
      const sendMessage = (data: { type: string; comment?: Comment; comments?: Comment[] }) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      // Send recent comments on connection
      try {
        const recentCommentIds = await redis.lrange('stream:comments:recent', 0, 9);
        const comments = [];
        
        for (const commentId of recentCommentIds) {
          const comment = await redis.get<Comment>(`stream:comment:${commentId}`);
          if (comment) {
            comments.push(comment);
          }
        }

        if (comments.length > 0) {
          sendMessage({ type: 'initial', comments: comments.reverse() });
        }
      } catch (error) {
        console.error('Error fetching recent comments:', error);
      }

      // Set up polling for new comments (since Upstash doesn't support persistent pub/sub connections)
      let lastCheck = Date.now();
      const pollInterval = setInterval(async () => {
        try {
          // Get comments added since last check
          const recentCommentIds = await redis.lrange('stream:comments:recent', 0, 9);
          
          for (const commentId of recentCommentIds) {
            const comment = await redis.get<Comment>(`stream:comment:${commentId}`);
            if (comment && comment.timestamp > lastCheck) {
              sendMessage({ type: 'new', comment });
            }
          }
          
          lastCheck = Date.now();
        } catch (error) {
          console.error('Error polling comments:', error);
        }
      }, 2000); // Poll every 2 seconds

      // Clean up on client disconnect
      request.signal.addEventListener('abort', () => {
        clearInterval(pollInterval);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}

import { NextRequest } from 'next/server';
import { redis } from './redis';

// Rate limiting configuration
const RATE_LIMIT_WINDOW = 60; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = {
  deposit: 3, // Max 3 deposit attempts per minute
  withdraw: 5, // Max 5 withdrawal attempts per minute
  bet: 30, // Max 30 bets per minute
  default: 60 // Default rate limit
};

// Get client identifier (IP or user ID)
function getClientId(request: NextRequest, userId?: string): string {
  if (userId) return `user:${userId}`;
  
  // Fallback to IP address
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown';
  return `ip:${ip}`;
}

// Check rate limit
export async function checkRateLimit(
  request: NextRequest,
  endpoint: string,
  userId?: string
): Promise<{ allowed: boolean; remaining: number; resetIn: number }> {
  const clientId = getClientId(request, userId);
  const key = `ratelimit:${endpoint}:${clientId}`;
  const maxRequests = RATE_LIMIT_MAX_REQUESTS[endpoint as keyof typeof RATE_LIMIT_MAX_REQUESTS] || RATE_LIMIT_MAX_REQUESTS.default;
  
  try {
    // Get current count
    const current = await redis.incr(key);
    
    // Set expiry on first request
    if (current === 1) {
      await redis.expire(key, RATE_LIMIT_WINDOW);
    }
    
    // Get TTL
    const ttl = await redis.ttl(key);
    
    return {
      allowed: current <= maxRequests,
      remaining: Math.max(0, maxRequests - current),
      resetIn: ttl > 0 ? ttl : RATE_LIMIT_WINDOW
    };
  } catch (error) {
    console.error('[Rate Limit] Error:', error);
    // Allow request on error but log it
    return { allowed: true, remaining: 0, resetIn: 0 };
  }
}

// Validate request origin
export function validateOrigin(request: NextRequest): boolean {
  const origin = request.headers.get('origin');
  
  // In production, check if request comes from allowed origins
  if (process.env.NODE_ENV === 'production') {
    const allowedOrigins = [
      process.env.NEXT_PUBLIC_APP_URL,
      'https://base.app',
      'https://warpcast.com'
    ].filter(Boolean);
    
    if (origin && !allowedOrigins.some(allowed => origin.startsWith(allowed || ''))) {
      console.warn(`[Security] Blocked request from unauthorized origin: ${origin}`);
      return false;
    }
  }
  
  return true;
}

// Validate transaction hash format
export function validateTransactionHash(hash: string): boolean {
  return /^0x[a-fA-F0-9]{64}$/.test(hash);
}

// Validate amount
export function validateAmount(amount: number, min = 0.01, max = 10000): boolean {
  return typeof amount === 'number' && 
         !isNaN(amount) && 
         amount >= min && 
         amount <= max &&
         Number.isFinite(amount);
}

// Log suspicious activity
export async function logSuspiciousActivity(
  request: NextRequest,
  reason: string,
  details: Record<string, unknown>
): Promise<void> {
  const clientId = getClientId(request);
  const log = {
    timestamp: Date.now(),
    clientId,
    reason,
    details,
    headers: {
      origin: request.headers.get('origin'),
      referer: request.headers.get('referer'),
      userAgent: request.headers.get('user-agent'),
    },
    url: request.url,
    method: request.method
  };
  
  try {
    await redis.lpush('security:suspicious_activity', JSON.stringify(log));
    // Keep only last 10000 entries
    await redis.ltrim('security:suspicious_activity', 0, 9999);
  } catch (error) {
    console.error('[Security] Failed to log suspicious activity:', error);
  }
}

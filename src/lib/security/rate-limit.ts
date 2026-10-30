/**
 * In-Memory Sliding Window Rate Limiter
 *
 * NOTE: IN-MEMORY RATE LIMITER (Single-instance demonstration mode).
 * For distributed multi-node production setups, swap this with Redis/Upstash rate limiting.
 */

import { AppError } from '@/lib/errors';

interface RateLimitRecord {
  timestamps: number[];
}

const rateLimitStore = new Map<string, RateLimitRecord>();

/**
 * Checks and updates rate limit for a given identifier (e.g. client IP).
 *
 * @param key - Unique client identifier (IP or user ID)
 * @param windowMs - Time window in milliseconds
 * @param maxRequests - Maximum allowed requests within the window
 * @throws AppError with code RATE_LIMITED if quota is exceeded
 */
export function checkRateLimit(key: string, windowMs: number, maxRequests: number): void {
  const now = Date.now();
  const windowStart = now - windowMs;

  const record = rateLimitStore.get(key) ?? { timestamps: [] };

  // Evict timestamps older than the active sliding window
  const activeTimestamps = record.timestamps.filter((ts) => ts > windowStart);

  if (activeTimestamps.length >= maxRequests) {
    const oldest = activeTimestamps[0];
    const retryAfterSeconds = Math.ceil((oldest + windowMs - now) / 1000);

    throw new AppError(
      `Rate limit exceeded. Please try again in ${retryAfterSeconds} seconds.`,
      'RATE_LIMITED',
      429,
      { retryAfterSeconds }
    );
  }

  activeTimestamps.push(now);
  rateLimitStore.set(key, { timestamps: activeTimestamps });
}

/**
 * Resets the rate limiter store (useful for clean unit and integration tests).
 */
export function resetRateLimiter(): void {
  rateLimitStore.clear();
}

import { logger } from "./logger.js";

// In-memory rate limiting store
const rateLimits = new Map<string, number[]>();

export async function checkRateLimit(
  playerId: string,
  event: string,
  limit: number,
  windowMs: number,
): Promise<boolean> {
  const key = `rl:${event}:${playerId}`;
  const now = Date.now();
  const cutoff = now - windowMs;

  try {
    let timestamps = rateLimits.get(key) || [];
    
    // 1. Remove entries older than the window
    timestamps = timestamps.filter(t => t >= cutoff);
    
    // 2. Count remaining entries
    if (timestamps.length >= limit) {
      rateLimits.set(key, timestamps);
      return false;
    }
    
    // 3. Add new entry
    timestamps.push(now);
    rateLimits.set(key, timestamps);
    
    // Periodically clean up old keys to prevent memory leaks in long-running servers
    // This isn't perfect garbage collection but it's simple and effective enough for memory rate limits
    if (Math.random() < 0.01) {
      for (const [k, v] of rateLimits.entries()) {
        const valid = v.filter(t => t >= now - windowMs);
        if (valid.length === 0) {
          rateLimits.delete(k);
        } else {
          rateLimits.set(k, valid);
        }
      }
    }

    return true;
  } catch (err) {
    logger.warn({ playerId, event, err }, "Rate limit check failed — allowing request (fail-open)");
    return true;
  }
}

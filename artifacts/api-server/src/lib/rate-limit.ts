import { redisClient } from "../config/redis.js";
import { logger } from "./logger.js";
import { randomUUID } from "node:crypto";

// ── Sliding-window rate limiter using a Redis sorted set ──────────────────────
//
// Each player+event pair has a ZSET key: `rl:{event}:{playerId}`.
// Members are opaque UUIDs; scores are Unix timestamps in milliseconds.
//
// On each check:
//   1. Remove entries older than the window (ZREMRANGEBYSCORE).
//   2. Count remaining entries (ZCARD).
//   3. If count < limit, add a new entry (ZADD) and refresh the key TTL.
//   4. Return 1 (allowed) or 0 (rate limited).
//
// This is a true sliding window — accurate to the millisecond — with no
// fixed bucket boundary artifacts.  Memory per key = O(limit) members.
//
// Fail-open: if Redis is unavailable the request is always allowed.
// This prevents Redis downtime from blocking gameplay.

const LUA_SLIDING_WINDOW = `
local key        = KEYS[1]
local now        = tonumber(ARGV[1])
local window_ms  = tonumber(ARGV[2])
local limit      = tonumber(ARGV[3])
local req_id     = ARGV[4]
local cutoff     = now - window_ms

redis.call('ZREMRANGEBYSCORE', key, '-inf', cutoff)
local count = redis.call('ZCARD', key)
if count >= limit then
  return 0
end
redis.call('ZADD', key, now, req_id)
-- Add a 1s buffer so the key does not expire while a concurrent request is
-- still within the window (clock skew / scheduling jitter guard).
redis.call('PEXPIRE', key, window_ms + 1000)
return 1
`;

/**
 * Check whether `playerId` is within the rate limit for `event`.
 *
 * @param playerId  Unique player / socket ID.
 * @param event     Event name used to namespace the limit (e.g. "submit_action").
 * @param limit     Maximum number of requests allowed within `windowMs`.
 * @param windowMs  Sliding window duration in milliseconds.
 * @returns `true` if the request is allowed, `false` if it should be rejected.
 */
export async function checkRateLimit(
  playerId: string,
  event: string,
  limit: number,
  windowMs: number,
): Promise<boolean> {
  const key = `rl:${event}:${playerId}`;
  try {
    const result = await redisClient.eval(
      LUA_SLIDING_WINDOW,
      1,
      key,
      String(Date.now()),
      String(windowMs),
      String(limit),
      randomUUID(),
    );
    return result === 1;
  } catch (err) {
    // Fail open — do not block players if Redis is down.
    logger.warn({ playerId, event, err }, "Rate limit check failed — allowing request (fail-open)");
    return true;
  }
}

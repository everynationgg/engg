// Re-export core game types from the engine — single source of truth
export type {
  Player,
  PlayerConnectionStatus,
  GamePhase as Phase,
  PlayerAction as OrbitAction,
  EmergencyVoteState,
  VoteResult,
  AbilityLogEntry,
  VoteTallyEntry,
  VoteCount,
  RoundSummary,
  GameState as Session,
} from "./engine.js";

import { addPlayer, trimState } from "./engine.js";

import type {
  Player,
  GameState as Session,
  PlayerAction as OrbitAction,
  EmergencyVoteState,
  RoundSummary,
} from "./engine.js";
import { redisClient } from "../../../config/redis.js";
import { randomUUID } from "node:crypto";
import { logger } from "../../../lib/logger.js";

const INSTANCE_ID = randomUUID();

let clockOffset = 0;
let lastSeenGlobalTime = 0;

/**
 * Periodically sync local clock with Redis server time to eliminate skew.
 * Anchor point for all phase-timing and stabilization logic.
 */
export async function syncGlobalTime() {
  try {
    const [seconds, microseconds] = await redisClient.time();
    const redisNow = Number(seconds) * 1000 + Math.floor(Number(microseconds) / 1000);
    
    const newOffset = redisNow - Date.now();
    // Smooth adjustment to prevent sudden jumps
    if (clockOffset === 0) {
      clockOffset = newOffset;
    } else {
      clockOffset = clockOffset * 0.9 + newOffset * 0.1;
    }
    
    logger.info({ clockOffset, redisNow }, "Driver: Global time synced with Redis (Smoothed)");
  } catch (err) {
    logger.error({ err }, "Driver: Failed to sync global time");
  }
}

// Initial sync and periodic refresh
syncGlobalTime();
setInterval(syncGlobalTime, 300_000);

/**
 * Returns the cluster-synchronized time in milliseconds.
 * Strictly monotonic: guaranteed to never jump backward even if Redis time shifts 
 * OR if the leadership fails over (via session state anchor).
 */
export function getGlobalTime(session?: Session): number {
  const now = Date.now() + clockOffset;
  
  // 1. Monotonicity: Clamp backward jumps
  lastSeenGlobalTime = Math.max(lastSeenGlobalTime, now);
  
  // 2. Cluster Monotonicity: Anchor to the last known time persisted in this session
  if (session?.lastGlobalNow) {
    lastSeenGlobalTime = Math.max(lastSeenGlobalTime, session.lastGlobalNow);
  }

  // 3. Anomaly Protection: Clamp excessive forward jumps (e.g. > 30s)
  const MAX_FORWARD_DRIFT = 30_000;
  const drift = lastSeenGlobalTime - now;
  
  if (drift > MAX_FORWARD_DRIFT) {
     logger.warn({ drift, now, lastSeen: lastSeenGlobalTime }, "Driver: Suppressing excessive forward time jump");
     
     // 1. Adaptive Degradation Trigger
     if (session) {
        if (session.health === "healthy") session.health = "degraded";
        session.lastAnomalyAt = now;
     }
     lastSeenGlobalTime = now + MAX_FORWARD_DRIFT;
  }
  
  return lastSeenGlobalTime;
}

// ── Versioned session — extends Session with an in-memory version counter ─────
//
// The version is stored in a separate Redis key (`session:{id}:v`) rather than
// inside the JSON blob, so the Lua CAS script can check it without parsing JSON.
// This keeps the Lua scripts small and avoids depending on cjson availability.
//
// Tradeoff: full-state JSON overwrite vs. partial field updates
//   Full overwrite (current approach):
//     + Simple, atomic, no partial-state inconsistency risk.
//     + Single SET command (fast for typical session sizes ≤ 8 KB).
//     - Rewrites unchanged fields on every mutation.
//   Partial updates (e.g. HSET per field, separate ZSET for players/votes):
//     + Reduces bytes written per mutation.
//     - Requires multiple Redis commands → loses atomicity without MULTI/EXEC.
//     - Increases read complexity (HGETALL + multiple GETs).
//     - Harder to maintain consistency across related fields (e.g. phase + votes).
//   Decision: keep full-overwrite with CAS versioning. At ≤ 8 KB per session the
//   bandwidth savings from partial updates are negligible; the simplicity wins.
export type VersionedSession = Session & { __v: number };

// ── Disconnect timers remain in-process (they hold OS handles; not serialisable) ──
const disconnectTimers = new Map<string, NodeJS.Timeout>();
const advanceTimers = new Map<string, NodeJS.Timeout>();

// ── Redis key helpers ──────────────────────────────────────────────────────────
const SESSION_KEY = (id: string) => `session:${id}`;
const VERSION_KEY = (id: string) => `session:${id}:v`;
const LOCK_KEY    = (id: string) => `session:${id}:lock`;
const HEARTBEAT_LEASE_KEY = (id: string) => `session:${id}:hb_lease`;
const FENCING_KEY = (id: string) => `session:${id}:f`;

/** Default TTL for a session in Redis (4 hours).  Refreshed on every save. */
const SESSION_TTL_S = 4 * 60 * 60;

/** Maximum time (ms) to wait for a distributed lock before giving up. */
const LOCK_WAIT_MS = 3_000;

/** How long a lock may be held before it expires (guards against crashed holders). */
const LOCK_TTL_MS = 5_000;

/** Maximum number of CAS retry attempts on version conflicts. */
export const CAS_MAX_ATTEMPTS = 3;

// ── In-process metrics ────────────────────────────────────────────────────────
/**
 * Lightweight in-process counters for operational visibility.
 * Expose via GET /api/metrics (Prometheus text format) or periodic logs.
 *
 * Concurrency / CAS:
 *   - `casConflicts`          : total CAS version conflicts (concurrent writes collided)
 *   - `casRetries`            : total CAS retry loop iterations triggered by conflicts
 *   - `lockAcquisitions`      : successful distributed lock acquisitions (create_session only)
 *   - `lockTimeouts`          : lock wait timeouts (high value → contention or slow Redis)
 *
 * Redis health:
 *   - `redisOpsInFlight`      : current number of in-flight Redis commands (gauge)
 *   - `redisErrors`           : cumulative Redis command errors (connection/timeout/eval)
 *   - `sessionCacheHits`      : reads served from in-memory fallback cache during degradation
 *
 * Latency (used to compute averages in the metrics endpoint):
 *   - `getSessionTotal`       : total `getSession` calls completed
 *   - `getSessionLatencyMsSum`: sum of all `getSession` durations in ms
 *   - `saveSessionTotal`      : total `saveSession` calls completed (success or conflict)
 *   - `saveSessionLatencyMsSum`: sum of all `saveSession` durations in ms
 */
export const sessionMetrics = {
  // concurrency
  casConflicts:            0,
  casRetries:              0,
  lockAcquisitions:        0,
  lockTimeouts:            0,
  // redis health
  redisOpsInFlight:        0,
  redisErrors:             0,
  sessionCacheHits:        0,
  // latency
  getSessionTotal:         0,
  getSessionLatencyMsSum:  0,
  saveSessionTotal:        0,
  saveSessionLatencyMsSum: 0,
};

/**
 * Sentinel returned from a `withCasRetry` mutate function to abort the CAS cycle
 * without saving.  Use when a guard check inside the mutate fails (e.g. wrong phase,
 * user not authorised) and the session should not be written.
 */
export const CAS_SKIP = Symbol("CAS_SKIP");

// ── Backpressure ───────────────────────────────────────────────────────────────

/**
 * Maximum number of concurrent in-flight Redis operations before the server
 * starts shedding load.  At this threshold, `isRedisOverloaded()` returns true
 * and callers should reject new mutations with a 503-equivalent error.
 *
 * Rationale: a single ioredis client serialises commands over one TCP socket.
 * Pipelining buffers them, but deep queues still inflate tail-latency and
 * increase the risk of timeouts under back-pressure from a slow Redis.
 * 50 concurrent commands is well above steady-state for a game server but
 * below the point where connection timeouts become likely.
 */
const MAX_INFLIGHT_REDIS_OPS = 50;

/** Returns `true` when the Redis command queue is saturated. */
export function isRedisOverloaded(): boolean {
  return sessionMetrics.redisOpsInFlight >= MAX_INFLIGHT_REDIS_OPS;
}

// ── In-memory read fallback (graceful degradation) ────────────────────────────
//
// When Redis becomes temporarily unavailable, `getSession` serves the last
// known session state from this cache so players see their game rather than
// a blank screen.  Writes during degradation still fail-closed (saveSession
// returns false) — the withCasRetry loop exhausts and handleSaveConflict
// re-reads the cached copy, keeping clients in sync with the last known state.
//
// ⚠ Single-instance only: the cache is per-process.  In a multi-instance
// deployment, each instance only has the sessions it served.  Clients may
// reconnect to a different instance that has no cache entry and see a flash
// of "session not found" until Redis recovers.  This is acceptable for a
// soft-degradation: a brief error is better than a hard crash.
//
// Cache is bounded to SESSION_CACHE_MAX_ENTRIES to prevent unbounded growth.
// Least-recently-used eviction would be more principled; we use simple FIFO
// via Map insertion order (delete+re-insert on write) for O(1) ops.

const SESSION_CACHE_MAX_ENTRIES = 500;
const sessionCache = new Map<string, VersionedSession>();
let _redisState: "healthy" | "degraded" = "healthy";

/** Returns the current Redis health state for the metrics endpoint. */
export function getRedisState(): "healthy" | "degraded" {
  return _redisState;
}

function cacheWrite(session: VersionedSession): void {
  // Enforce max size: evict the oldest entry (first in Map iteration order).
  if (sessionCache.size >= SESSION_CACHE_MAX_ENTRIES && !sessionCache.has(session.sessionId)) {
    const oldest = sessionCache.keys().next().value;
    if (oldest !== undefined) sessionCache.delete(oldest);
  }
  // Re-insert so this entry moves to the "newest" position.
  sessionCache.delete(session.sessionId);
  sessionCache.set(session.sessionId, session);
}

// ── Lua scripts ────────────────────────────────────────────────────────────────

// Acquire lock atomically: SET NX PX.
// Returns 'OK' if acquired, nil otherwise.
const LUA_ACQUIRE_LOCK = `
return redis.call('SET', KEYS[1], ARGV[1], 'NX', 'PX', ARGV[2])
`;

// Release lock atomically: only delete if we still own it (token match).
// Prevents releasing a lock that expired and was re-acquired by another holder.
// Returns 1 if released, 0 if not owner (expired or already released).
const LUA_RELEASE_LOCK = `
if redis.call('GET', KEYS[1]) == ARGV[1] then
  return redis.call('DEL', KEYS[1])
end
return 0
`;

// Compare-and-set save with Fencing Token enforcement: 
// KEYS[1] = session key, KEYS[2] = version key, KEYS[3] = fencing key
// ARGV[1] = serialised session JSON (without __v)
// ARGV[2] = TTL in seconds
// ARGV[3] = expected current version (CAS)
// ARGV[4] = new version
// ARGV[5] = incoming fencing token (Monotonic check)
const LUA_CAS_SAVE = `
local current_v = redis.call('GET', KEYS[2])
if current_v ~= false and tonumber(current_v) ~= tonumber(ARGV[3]) then
  return 0
end
local current_f = redis.call('GET', KEYS[3])
-- Strict fencing: incoming token must be EQUAL to or GREATER THAN current.
-- If we're the owner, it will be equal. If we're taking over, it will be greater.
if current_f ~= false and tonumber(ARGV[5]) < tonumber(current_f) then
  return 0
end
redis.call('SET', KEYS[1], ARGV[1], 'EX', ARGV[2])
redis.call('SET', KEYS[2], ARGV[4], 'EX', ARGV[2])
redis.call('SET', KEYS[3], ARGV[5], 'EX', ARGV[2])
return 1
`;

// ── Retry helper ───────────────────────────────────────────────────────────────

/** Retries `fn` up to `maxAttempts` times on Redis errors with linear back-off. */
async function withRedisRetry<T>(fn: () => Promise<T>, maxAttempts = 3): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt < maxAttempts) {
        await new Promise<void>((r) => setTimeout(r, 100 * attempt));
      }
    }
  }
  throw lastError;
}

// ── Serialisation ──────────────────────────────────────────────────────────────

// Strip __v before storing — version lives in the dedicated version key.
// Also strip top-level `null` values to reduce stored JSON size.  The
// nullable top-level field is `voteResult`; in
// lobby/orbit/voting phases (the majority of session lifetime) it is null,
// saving ~50 bytes per write.  `deserialise` restores them to `null` if absent.
function serialise(session: Session | VersionedSession): string {
  const { __v, ...state } = session as any;
  const lean: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(state)) {
    if (v !== null) lean[k] = v;
  }
  return JSON.stringify(lean);
}

// Restore nullable fields that were stripped during serialisation.
// Absent keys default to `null` first; the parsed object spread then overrides
// them if a non-null value was stored.  JSON.parse never produces `undefined`
// for parsed keys — absent keys are simply absent — so the spread is safe.
// If serialisation logic changes, update these defaults to match.
function deserialise(raw: string): Session {
  const parsed = JSON.parse(raw) as unknown as Session;
  return {
    ...parsed,
    settings: parsed.settings ?? {
      anonymousVoting: false,
      blindEjections: false,
      discussionTime: 60,
      votingTime: 30,
    },
    voteResult:          parsed.voteResult ?? null,
    kickedPlayerIds:     parsed.kickedPlayerIds ?? [],
    status:              parsed.status ?? "active",
    joinable:            parsed.joinable ?? true,
    revealActions:       parsed.revealActions ?? {},
    revealCompleted:     parsed.revealCompleted ?? [],
    jammedPlayerId:      parsed.jammedPlayerId ?? null,
    hijackedTargets:     parsed.hijackedTargets ?? {},
    orbitFeedback:       parsed.orbitFeedback ?? {},
    roundSummary:        parsed.roundSummary ?? { abilityLog: [], voteTally: [], voteCounts: [] },
  };
}

// ── Core Redis operations ──────────────────────────────────────────────────────

/**
 * Load a session from Redis.  Returns `undefined` if not found or on error.
 * Uses MGET to fetch session JSON and version in a single round-trip.
 *
 * On Redis error: serves the last known state from the in-memory fallback
 * cache and marks the session system as degraded.  Logs a warning on first
 * degradation and an info message when Redis recovers.
 */
export async function getSession(sessionId: string): Promise<VersionedSession | undefined> {
  const t0 = Date.now();
  sessionMetrics.redisOpsInFlight++;
  sessionMetrics.getSessionTotal++;
  try {
    const [raw, vRaw] = await withRedisRetry(() =>
      redisClient.mget(SESSION_KEY(sessionId), VERSION_KEY(sessionId)),
    );
    if (!raw) {
      sessionCache.delete(sessionId); // evict stale cache entry
      if (_redisState === "degraded") {
        _redisState = "healthy";
        logger.info({ sessionId }, "Redis recovered — resuming normal operation");
      }
      return undefined;
    }
    const session = deserialise(raw);
    const versioned: VersionedSession = { ...session, __v: vRaw ? parseInt(vRaw, 10) : 0 };
    cacheWrite(versioned);
    if (_redisState === "degraded") {
      _redisState = "healthy";
      logger.info({ sessionId }, "Redis recovered — resuming normal operation");
    }
    return versioned;
  } catch (err) {
    sessionMetrics.redisErrors++;
    logger.error({ sessionId, err }, "Failed to get session from Redis");
    // Serve from in-memory fallback cache.
    const cached = sessionCache.get(sessionId);
    if (cached) {
      sessionMetrics.sessionCacheHits++;
      if (_redisState !== "degraded") {
        _redisState = "degraded";
        logger.warn({ sessionId }, "Redis degraded — serving session from in-memory fallback cache");
      }
      return cached;
    }
    return undefined;
  } finally {
    sessionMetrics.redisOpsInFlight--;
    sessionMetrics.getSessionLatencyMsSum += Date.now() - t0;
  }
}

/**
 * Persist a session using an atomic compare-and-swap on its version counter.
 *
 * Returns `true` when saved successfully.
 * Returns `false` when:
 *   - Another writer updated the session after we loaded it (version mismatch).
 *   - Redis is unavailable (error logged; server does not crash).
 *
 * On success, `session.__v` is incremented in place so the caller always
 * holds the current version without a second round-trip, and the in-memory
 * cache is updated for read-fallback continuity.
 */
/**
 * Formal Invariant Enforcement.
 * Ensures the state machine is always in a valid, monotonic progression 
 * before any write to persistence.
 */
export function assertStateInvariants(session: Session) {
  // 1. Monotonic Phase Timing
  const now = getGlobalTime(session);
  if (session.phaseStartedAt && session.phaseStartedAt > now + 1000) {
    throw new Error(`Invariant Violated: phaseStartedAt is in the future (${session.phaseStartedAt} > ${now})`);
  }
  
  // 2. Cluster Monotonicity Anchor
  if (session.lastGlobalNow && session.lastGlobalNow > now) {
    throw new Error(`Invariant Violated: Time regression detected (${session.lastGlobalNow} > ${now})`);
  }
  
  // 3. Ownership Integrity
  if (session.heartbeatFencingToken && session.heartbeatFencingToken < 0) {
    throw new Error("Invariant Violated: fencing token cannot be negative");
  }

  // 4. Stabilization Consistency
  if (!session.phaseReady && session.phase === "result") {
    throw new Error("Invariant Violated: result phase must always be ready");
  }
}

/**
 * Emergency transition to CORRUPT state.
 * Bypasses CAS/Fencing to ensure the failure is visible even if leadership 
 * has been lost. Strictly restricted to only updating health and audit fields.
 */
async function markSessionCorrupt(session: Session, reason: string): Promise<void> {
  try {
    // 1. Lockdown: Strictly only mutate health/audit
    session.health = "corrupt";
    session.invariantFailures = (session.invariantFailures || 0) + 1;
    session.lastUpdateBy = `${INSTANCE_ID}:emergency`;
    
    // 2. Non-CAS persistent write
    const key = SESSION_KEY(session.sessionId);
    await redisClient.set(key, serialise(session), "EX", SESSION_TTL_S);
    logger.error({ sessionId: session.sessionId, reason }, "Driver: Session marked CORRUPT — Emergency write complete");
  } catch (err) {
    logger.error({ sessionId: session.sessionId, err }, "Driver: Failed to perform emergency session save");
  }
}

export async function saveSession(session: VersionedSession): Promise<boolean> {
  // Update the cluster monotonicity anchor before pre-flight checks
  session.lastGlobalNow = getGlobalTime(session);

  // 0. State Lifecycle Management
  trimState(session);

  // 1. Final pre-flight invariant check
  try {
    assertStateInvariants(session);
  } catch (err) {
    // ABORT logic: Invariant violation is fatal.
    // 1. Mark as corrupt (Emergency non-CAS path)
    await markSessionCorrupt(session, err instanceof Error ? err.message : String(err));
    // 2. Return false to terminate the local CAS retry loop
    return false;
  }

  const newVersion = session.__v + 1;
  const t0 = Date.now();
  sessionMetrics.redisOpsInFlight++;
  sessionMetrics.saveSessionTotal++;

  // Record ownership audit before serialisation
  session.lastUpdateBy = INSTANCE_ID;

  try {
    const result = await withRedisRetry(() =>
      redisClient.eval(
        LUA_CAS_SAVE,
        3,
        SESSION_KEY(session.sessionId),
        VERSION_KEY(session.sessionId),
        FENCING_KEY(session.sessionId),
        serialise(session),        // ARGV[1]
        String(SESSION_TTL_S),     // ARGV[2]
        String(session.__v),       // ARGV[3]
        String(newVersion),        // ARGV[4]
        String(session.heartbeatFencingToken || 0), // ARGV[5]
      ),
    );
    if (result === 1) {
      session.__v = newVersion;
      cacheWrite({ ...session });
      return true;
    }
    logger.warn(
      { sessionId: session.sessionId, expectedVersion: session.__v },
      "Session save conflict — version mismatch (concurrent update)",
    );
    sessionMetrics.casConflicts++;
    return false;
  } catch (err) {
    sessionMetrics.redisErrors++;
    logger.error({ sessionId: session.sessionId, err }, "Failed to save session to Redis");
    return false;
  } finally {
    sessionMetrics.redisOpsInFlight--;
    sessionMetrics.saveSessionLatencyMsSum += Date.now() - t0;
  }
}

/**
 * Delete a session and its version key from Redis.
 * Also evicts the in-memory fallback cache entry.
 * Logs but does not throw on Redis errors.
 */
export async function deleteSession(sessionId: string): Promise<void> {
  sessionCache.delete(sessionId);
  try {
    await withRedisRetry(() =>
      redisClient.del(SESSION_KEY(sessionId), VERSION_KEY(sessionId)),
    );
  } catch (err) {
    logger.error({ sessionId, err }, "Failed to delete session from Redis");
  }
}

// ── Optimistic CAS retry ───────────────────────────────────────────────────────

/**
 * Read-mutate-CAS-save cycle with automatic retry on version conflicts (up to
 * `maxAttempts`, default `CAS_MAX_ATTEMPTS = 3`).
 *
 * On each attempt:
 *   1. `getSession` — fresh read, includes current `__v`.
 *   2. `mutate(session)` — caller runs game-engine logic, mutating `session` in
 *      place.  Return `CAS_SKIP` to abort without saving (guard-check failed).
 *   3. `saveSession(session)` — atomic CAS write.  On conflict (another writer
 *      incremented the version between our read and write), increment retry
 *      counters and loop.
 *
 * Returns `{ session, result }` on the first successful save.
 * Returns `null` when:
 *   - The session does not exist.
 *   - The mutate returned `CAS_SKIP`.
 *   - All retry attempts are exhausted (CAS conflicts on every attempt).
 *
 * @example
 *   const cas = await withCasRetry(sessionId, (session) => {
 *     return engineCastVote(session, playerId, targetId);
 *   });
 *   if (!cas) { await handleFallback(); return; }
 *   const { session, result } = cas;
 *
 * @example — void mutate (wrap return value in a truthy constant)
 *   const cas = await withCasRetry(sessionId, (session) => {
 *     engineRestartGame(session);
 *     return true as const;
 *   });
 */
export async function withCasRetry<R>(
  sessionId: string,
  mutate: (session: VersionedSession) => R | typeof CAS_SKIP | Promise<R | typeof CAS_SKIP>,
  maxAttempts = CAS_MAX_ATTEMPTS,
): Promise<{ session: VersionedSession; result: R } | null> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const session = await getSession(sessionId);
    if (!session) return null;

    const result = await mutate(session);
    if (result === CAS_SKIP) return null;

    const saved = await saveSession(session);
    // If saveSession returns false, it could be a version conflict (retryable)
    // or an invariant violation (ABORT).
    if (saved) return { session, result: result as R };

    // Check if it was an invariant violation by re-running the check (cheap)
    try {
      assertStateInvariants(session);
    } catch (invErr) {
      logger.error({ sessionId, attempt, err: invErr }, "CAS Abort: Invariant violation during mutation");
      return null; // Fatal violation — do not retry
    }

    // saveSession already incremented sessionMetrics.casConflicts
    logger.warn({ sessionId, attempt, maxAttempts }, "CAS conflict in withCasRetry — retrying");
    // Cap metrics to prevent unbounded state growth
    session.casRetriesCount = Math.min((session.casRetriesCount || 0) + 1, 100_000);
    if (attempt < maxAttempts) {
      sessionMetrics.casRetries++;
      // Short linear back-off to reduce thundering-herd during sustained contention
      await new Promise<void>((r) => setTimeout(r, 10 * attempt));
    }
  }
  return null; // all attempts exhausted
}

// ── Distributed lock ───────────────────────────────────────────────────────────

/**
 * Acquire a short-lived distributed lock for the given session.
 * Returns an async release function; always call it (in a finally block).
 *
 * Improvements over a basic implementation:
 *   - Atomic token-based release via Lua (prevents releasing another holder's lock).
 *   - `released` flag prevents double-release.
 *   - Graceful degradation: on timeout or Redis error, logs a warning and
 *     returns a no-op release so callers don't need special-case handling.
 */
export async function acquireSessionLock(sessionId: string): Promise<() => Promise<void>> {
  const lockKey = LOCK_KEY(sessionId);
  const token   = randomUUID();
  const deadline = Date.now() + LOCK_WAIT_MS;

  const makeRelease = (): (() => Promise<void>) => {
    let released = false;
    return async () => {
      if (released) return;  // guard against double-release
      released = true;
      try {
        await redisClient.eval(LUA_RELEASE_LOCK, 1, lockKey, token);
      } catch (err) {
        // Log but do not throw — the lock TTL will clean it up automatically.
        logger.error({ sessionId, err }, "Failed to release session lock");
      }
    };
  };

  try {
    while (Date.now() < deadline) {
      const result = await redisClient.eval(
        LUA_ACQUIRE_LOCK, 1, lockKey, token, String(LOCK_TTL_MS),
      );
      if (result === "OK") {
        sessionMetrics.lockAcquisitions++;
        return makeRelease();
      }
      await new Promise<void>((r) => setTimeout(r, 50));
    }
  } catch (err) {
    logger.error({ sessionId, err }, "Redis error during lock acquisition — proceeding without lock");
    return async () => { /* no-op: best-effort on Redis failure */ };
  }

  // Timeout: lock is heavily contended or Redis is slow.
  // Proceed without the lock rather than stalling the player's action.
  logger.warn({ sessionId }, "Could not acquire session lock within timeout — proceeding without lock");
  sessionMetrics.lockTimeouts++;
  return async () => { /* no-op */ };
}

// ── Helper factories (pure; callers must saveSession after mutating) ──────────

export function freshEmergencyVote(): EmergencyVoteState {
  return { active: false, callerId: null, callerName: null, yesVoters: [], noVoters: [], cooldownUntil: null };
}

export function freshRoundSummary(): RoundSummary {
  return { abilityLog: [], voteTally: [], voteCounts: [] };
}

// ── Session-level operations (all async; save explicitly after mutations) ─────

/** Creates a fresh in-memory session (version 0).  Caller must call saveSession. */
export function createSession(sessionId: string, hostPlayer: Player): VersionedSession {
  return {
    sessionId,
    settings: {
      anonymousVoting: false,
      blindEjections: false,
      discussionTime: 60,
      votingTime: 30,
    },
    phase: "lobby",
    players: [hostPlayer],
    rolesAssigned: {},
    initialRoles: {},
    centerCards: [],
    roleCounts: {},
    unlockedRoles: [],
    orbitActions: {},
    orbitCompleted: [],
    orbitFeedback: {},
    roleAcknowledgements: [],
    phaseReady: true,
    phaseStartedAt: Date.now(),
    emergencyVote: freshEmergencyVote(),
    votes: {},
    chaoticAlignments: {},
    voteResult: null,
    roundSummary: freshRoundSummary(),
    createdAt: Date.now(),
    kickedPlayerIds: [],
    playersInGrace: [],
    hostEndedInterrupt: undefined,
    status: "active",
    joinable: true,
    revealActions: {},
    revealCompleted: [],
    jammedPlayerId: null,
    hijackedTargets: {},
    anesthetizedPlayers: [],
    justUnfrozen: false,
    __v: 0,
  };
}

export function addPlayerToSession(
  session: Session,
  player: Player,
): { success: boolean; isReconnect: boolean; error?: string } {
  return addPlayer(session, player);
}

export function removePlayerFromSession(
  session: VersionedSession,
  playerId: string, // stable playerId
): VersionedSession | null {
  session.players = session.players.filter((p) => (p.playerId || p.id) !== playerId);
  delete session.rolesAssigned[playerId];
  delete session.initialRoles[playerId];
  delete session.orbitActions[playerId];
  delete session.orbitFeedback[playerId];
  delete session.votes[playerId];
  session.orbitCompleted = session.orbitCompleted.filter((id) => id !== playerId);
  session.roleAcknowledgements = session.roleAcknowledgements.filter((id) => id !== playerId);
  
  if (session.players.length === 0) return null;
  return session;
}

export function scheduleRemovePlayer(
  sessionId: string,
  playerId: string,
  playerName: string,
  delayMs: number,
  onExpire: (session: VersionedSession | null) => void,
) {
  const key = `${sessionId}:${playerId}`;
  if (disconnectTimers.has(key)) return; // already scheduled
  const timer = setTimeout(async () => {
    disconnectTimers.delete(key);
    // Inline CAS retry loop — no distributed lock needed here because:
    //   1. Only one timer per player is ever scheduled (guard above).
    //   2. The CAS ensures we never overwrite a newer state.
    //   3. If the player reconnected, cancelRemovePlayer cleared this timer before firing.
    for (let attempt = 1; attempt <= CAS_MAX_ATTEMPTS; attempt++) {
      const session = await getSession(sessionId);
      if (!session) { onExpire(null); return; }

      const result = removePlayerFromSession(session, playerId);
      if (!result) {
        // Session is now empty — delete it (no version guard needed for unconditional delete).
        await deleteSession(sessionId);
        onExpire(null);
        return;
      }

      const saved = await saveSession(session);
      if (saved) { onExpire(session); return; }

      // CAS conflict — saveSession already incremented casConflicts
      logger.warn({ sessionId, playerId, attempt }, "CAS conflict during player removal — retrying");
      if (attempt < CAS_MAX_ATTEMPTS) {
        sessionMetrics.casRetries++;
        await new Promise<void>((r) => setTimeout(r, 10 * attempt));
      }
    }

    // All attempts exhausted — use Redis authoritative state.
    // The player may still be present if another instance re-added them.
    logger.warn(
      { sessionId, playerId },
      "Player removal CAS exhausted — using Redis authoritative state (player may still be present)",
    );
    onExpire(await getSession(sessionId) ?? null);
  }, delayMs);
  disconnectTimers.set(key, timer);
}

export function cancelRemovePlayer(sessionId: string, playerId: string) {
  const key = `${sessionId}:${playerId}`;
  const timer = disconnectTimers.get(key);
  if (timer) {
    clearTimeout(timer);
    disconnectTimers.delete(key);
  }
}

/**
 * Schedule a grace expiry callback after `delayMs` milliseconds.
 * Unlike `scheduleRemovePlayer`, this does NOT modify the session — it only
 * manages the timer and calls `onExpire()` when it fires.  The caller is
 * responsible for all session mutations (mark disconnected, interrupt, etc.).
 *
 * Uses the same `disconnectTimers` map so `cancelRemovePlayer` can cancel it.
 */
export function scheduleGraceExpiry(
  sessionId: string,
  playerId: string,
  delayMs: number,
  onExpire: () => void,
) {
  const key = `${sessionId}:${playerId}`;
  if (disconnectTimers.has(key)) return; // already scheduled
  const timer = setTimeout(() => {
    disconnectTimers.delete(key);
    onExpire();
  }, delayMs);
  disconnectTimers.set(key, timer);
}

/**
 * Ensures that a managed background 'advance' loop is active for the session.
 * 
 * HARDENED VERSION:
 * - Distributed Lease (Redis SET NX PX)
 * - Fencing Token (Monotonic versioning)
 * - Tighter Lease Renewal (Pre/Post work)
 * - Dynamic Scheduling (Wake-on-Need)
 */
export async function ensureHeartbeatActive(
  sessionId: string, 
  onTick: (session: VersionedSession) => Promise<void>
) {
  // 1. In-process idempotency + Backpressure
  if (advanceTimers.has(sessionId)) return;

  const runLoop = async () => {
    // Check if the loop was manually stopped
    if (!advanceTimers.has(sessionId)) return;

    const leaseKey = HEARTBEAT_LEASE_KEY(sessionId);
    const LEASE_TTL = 3500; 
    const now = getGlobalTime();
    
    try {
      // 2. Fencing Invariant check (MUST HAPPEN BEFORE LEASE RENEWAL)
      // If we're a stale leader waking from pause, we must notice we're invalid 
      // BEFORE we try to re-assert authority on the lease.
      const session = await getSession(sessionId);
      if (!session || session.phase === "lobby" || session.phase === "result") {
        stopHeartbeat(sessionId);
        return;
      }

      if (session.health === "corrupt") {
        logger.error({ sessionId }, "Driver: Session is marked CORRUPT — terminating heartbeat");
        stopHeartbeat(sessionId);
        return;
      }

      const currentToken = session.heartbeatFencingToken || 0;
      if (session.heartbeatOwnerId !== INSTANCE_ID && session.heartbeatOwnerId !== null) {
         const leaseOwner = await redisClient.get(leaseKey);
         if (leaseOwner !== INSTANCE_ID && leaseOwner !== null) {
            advanceTimers.delete(sessionId);
            return;
         }
      }

      // 3. Lease Negotiation
      const acquired = await redisClient.set(leaseKey, INSTANCE_ID, "PX", LEASE_TTL, "NX");
      let isOwner = acquired === "OK";
      
      if (!isOwner) {
        const currentOwner = await redisClient.get(leaseKey);
        if (currentOwner === INSTANCE_ID) {
          await redisClient.pexpire(leaseKey, LEASE_TTL);
          isOwner = true;
        }
      }

      if (!isOwner) {
        advanceTimers.delete(sessionId);
        return;
      }

      // 4. Ownership Acquisition / Fence Increment
      let justAcquired = false;
      if (session.heartbeatOwnerId !== INSTANCE_ID) {
        logger.info({ sessionId, from: session.heartbeatOwnerId, to: INSTANCE_ID, token: currentToken + 1 }, "Driver: Acquiring heartbeat ownership");
        session.heartbeatOwnerId = INSTANCE_ID;
        session.heartbeatFencingToken = currentToken + 1;
        session.lastHeartbeatAt = now;
        session.leaseChurnCount = Math.min((session.leaseChurnCount || 0) + 1, 100_000);
        session.lastAnomalyAt = now; // Failover is an anomaly
        if (!await saveSession(session)) {
          const timer = setTimeout(runLoop, 500);
          advanceTimers.set(sessionId, timer);
          return;
        }
        justAcquired = true;
      }

      // 5. Logic execution
      try {
        await onTick(session);
        
        // 6. Stability Tracking & Autonomous Recovery (Time-Based with Tolerance)
        if (session.health === "degraded") {
           const timeSinceAnomaly = now - (session.lastAnomalyAt || 0);
           const isOperationallyStable = (session.leaseChurnCount || 0) <= 2; // Tolerance for minor background noise
           
           // Recovery Condition: 30s of silence AND stable leadership
           if (timeSinceAnomaly > 30000 && isOperationallyStable) {
              logger.info({ 
                sessionId, 
                durationMs: timeSinceAnomaly, 
                churn: session.leaseChurnCount 
              }, "Driver: System stabilized — recovering to HEALTHY");
              session.health = "healthy";
              session.consecutiveHealthyTicks = 0;
           }
        }

        // 7. Churn-Aware Degradation
        if (session.health === "healthy" && (session.leaseChurnCount || 0) > 20) {
           logger.warn({ sessionId, churn: session.leaseChurnCount }, "Driver: High lease churn detected — moving to DEGRADED");
           session.health = "degraded";
           session.lastAnomalyAt = now;
        }

        // 8. Throttled health update (10s), or immediate on takeover/phase change
        const lastHb = session.lastHeartbeatAt || 0;
        if (justAcquired || now - lastHb > 10000) {
           session.lastHeartbeatAt = now;
           await saveSession(session);
        }
      } catch (err) {
        logger.error({ sessionId, err }, "Heartbeat logic failed");
      }

      // 9. Post-work Lease Renewal
      await redisClient.pexpire(leaseKey, LEASE_TTL);

      // 10. Dynamic Scheduling with Combined Signal Penalty
      if (advanceTimers.has(sessionId)) {
        const loopNow = getGlobalTime();
        const nextCheck = session.nextCheckAt || (loopNow + 1000);
        
        // Base Delay: (nextCheck - loopNow) capped between 100ms and 5000ms
        let delay = Math.min(Math.max(nextCheck - loopNow, 100), 5000);
        
        // Adaptive Combined Penalty: Proportional to instability
        if (session.health === "degraded") {
           const timeSinceAnomaly = now - (session.lastAnomalyAt || 0);
           
           // 1. Churn-based component (15ms per failover)
           const churnPenalty = (session.leaseChurnCount || 0) * 15;
           
           // 2. Smooth Recency Decay: Linearly fades from 500ms to 0 over 5s
           const recencyPenalty = Math.max(500 * (1 - timeSinceAnomaly / 5000), 0);
           
           // 3. Combined & Clamped Penalty (min 500ms, max 2000ms stabilization buffer)
           const penalty = Math.min(Math.max(500 + churnPenalty + recencyPenalty, 500), 2000);
           
           logger.debug({ 
             sessionId, 
             penalty, 
             components: { base: 500, churn: churnPenalty, recency: Math.round(recencyPenalty) },
             health: session.health
           }, "Driver: Adaptive backoff applied");
           
           delay += penalty;
        }

        const jitter = Math.floor(Math.random() * 200);
        const finalDelay = Math.min(delay + jitter, 10000); // Absolute cap of 10s
        
        const timer = setTimeout(runLoop, finalDelay);
        advanceTimers.set(sessionId, timer);
      }
    } catch (err) {
      logger.error({ sessionId, err }, "Critical heartbeat error — retrying");
      const timer = setTimeout(runLoop, 1000);
      advanceTimers.set(sessionId, timer);
    }
  };

  advanceTimers.set(sessionId, null as any); 
  runLoop();
}

/**
 * Legacy wrapper for backward compatibility during refactor.
 */
export function scheduleAdvanceTick(sessionId: string, _delayMs: number, onTick: (session: VersionedSession) => Promise<void>) {
  ensureHeartbeatActive(sessionId, onTick);
}

/**
 * Completely stops the background advance loop for a session.
 */
export function stopHeartbeat(sessionId: string) {
  const timer = advanceTimers.get(sessionId);
  if (timer) {
    clearTimeout(timer);
    advanceTimers.delete(sessionId);
  }
}

/**
 * Cancels any pending background ticks for a session.
 */
export function cancelAdvanceTick(sessionId: string) {
  stopHeartbeat(sessionId);
}


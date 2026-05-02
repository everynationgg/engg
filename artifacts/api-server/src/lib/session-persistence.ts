/**
 * Session Persistence — Redis ↔ PostgreSQL backup layer.
 *
 * Redis is the primary session store (fast, ephemeral).
 * PostgreSQL (via Drizzle) is the durable backup.
 *
 * Two main operations:
 *   1. `snapshotActiveSessions` — scan Redis, upsert live sessions to DB.
 *      Runs every ~30 s as a fire-and-forget background job.
 *   2. `restoreSessionsFromDb` — on startup, load DB snapshots into Redis
 *      (SET NX — never overwrites a session already in Redis).
 *
 * Serialization helpers are exported so callers can validate round-trips.
 */

import { sql } from "drizzle-orm";
import { db, sessionSnapshotsTable } from "@workspace/db";
import { redisClient } from "../config/redis.js";
import { logger } from "./logger.js";
import type { GameState as Session } from "../modules/games/errant-night/engine.js";

/** Must match the SESSION_TTL_S constant in sessions.ts (4 hours). */
const SESSION_TTL_S = 4 * 60 * 60;

/** Sessions older than this in the DB are considered expired and not restored. */
const SESSION_MAX_AGE_MS = SESSION_TTL_S * 1_000;

let snapshotTableEnsured = false;

/**
 * Best-effort bootstrap for environments where DB migrations haven't been run yet.
 * Keeps startup resilient by creating the persistence table lazily.
 */
async function ensureSnapshotTable(): Promise<void> {
  if (snapshotTableEnsured) return;

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS session_snapshots (
      session_id text PRIMARY KEY,
      game_state jsonb NOT NULL,
      updated_at timestamp NOT NULL DEFAULT now()
    )
  `);

  snapshotTableEnsured = true;
}

// ── Serialization ─────────────────────────────────────────────────────────────

/**
 * Serialize a Session to a plain JSON-compatible object for DB storage.
 *
 * All fields are preserved — including nulls — so that round-tripping
 * through the DB is lossless. (`sessions.ts` strips nulls before writing
 * to Redis to save space, but the DB copy keeps the full shape.)
 */
export function serializeSession(state: Session): Record<string, unknown> {
  // JSON.parse(JSON.stringify(...)) produces a plain object with no class
  // instances, Dates, or symbols — safe to store as JSONB.
  return JSON.parse(JSON.stringify(state)) as Record<string, unknown>;
}

/**
 * Deserialize a DB-stored game state back to a Session object.
 * Restores nullable fields that may be absent in older/stripped snapshots.
 * Returns `null` when the data is clearly corrupt (missing required fields).
 */
export function deserializeSession(data: unknown): Session | null {
  try {
    if (data === null || typeof data !== "object" || Array.isArray(data)) {
      return null;
    }
    const raw = data as Record<string, unknown>;

    // Guard: minimal structural check before we trust the data.
    if (typeof raw["sessionId"] !== "string" || typeof raw["phase"] !== "string") {
      return null;
    }

    // Restore nullable top-level fields that `sessions.ts` strips on write.
    return {
      ...raw,
      voteResult: (raw["voteResult"] as Session["voteResult"]) ?? null,
      chaoticAlignments: (raw["chaoticAlignments"] as Session["chaoticAlignments"]) ?? {},
    } as Session;
  } catch {
    return null;
  }
}

// ── Snapshot ──────────────────────────────────────────────────────────────────

/**
 * Scan Redis for all active sessions and upsert them to the database.
 *
 * Uses SCAN (non-blocking, cursor-based) to iterate keys, then MGET for
 * bulk reads. Upserts are batched into a single SQL statement.
 *
 * Errors are caught and logged — this must never crash the game server.
 */
export async function snapshotActiveSessions(): Promise<void> {
  const t0 = Date.now();
  let count = 0;
  let errors = 0;

  try {
    await ensureSnapshotTable();

    // ── 0. ACQUIRE DISTRIBUTED LOCK ─────────────────────────────────────
    // Ensures only one instance runs the snapshot at a time.
    // Lock expires automatically after 60s to prevent deadlocks.
    const lockKey = "lock:session-snapshot";
    const locked = await redisClient.set(lockKey, "locked", "EX", 60, "NX");
    if (!locked) {
      logger.debug("session-persistence: snapshot already in progress on another instance");
      return;
    }

    try {
      // ── 1. Collect session keys via cursor-based SCAN ─────────────────────
    const sessionKeys: string[] = [];
    let cursor = "0";

    do {
      const [nextCursor, keys] = await redisClient.scan(
        cursor,
        "MATCH",
        "session:*",
        "COUNT",
        100,
      );
      cursor = nextCursor;

      for (const key of keys) {
        // Exclude auxiliary keys: session:{id}:v (version) and session:{id}:lock
        if (!key.endsWith(":v") && !key.endsWith(":lock")) {
          sessionKeys.push(key);
        }
      }
    } while (cursor !== "0");

    if (sessionKeys.length === 0) {
      logger.debug("session-persistence: no active sessions to snapshot");
      return;
    }

    // ── 2. Bulk-read session JSON in one round-trip ───────────────────────
    const rawValues = await redisClient.mget(...sessionKeys);

    const rows: Array<{
      sessionId: string;
      gameState: Record<string, unknown>;
      updatedAt: Date;
    }> = [];

    for (let i = 0; i < sessionKeys.length; i++) {
      const raw = rawValues[i];
      if (!raw) continue; // key expired between SCAN and MGET

      try {
        const parsed = JSON.parse(raw) as unknown;
        const state = deserializeSession(parsed);
        if (!state) {
          errors++;
          logger.warn(
            { key: sessionKeys[i] },
            "session-persistence: skipping snapshot of unparseable session",
          );
          continue;
        }

        rows.push({
          sessionId: state.sessionId,
          gameState: parsed as Record<string, unknown>,
          updatedAt: new Date(),
        });
        count++;
      } catch (err) {
        errors++;
        logger.warn(
          { key: sessionKeys[i], err },
          "session-persistence: failed to parse session JSON during snapshot",
        );
      }
    }

    if (rows.length === 0) return;

    // ── 3. Upsert in a single DB round-trip ──────────────────────────────
    await db
      .insert(sessionSnapshotsTable)
      .values(rows)
      .onConflictDoUpdate({
        target: sessionSnapshotsTable.sessionId,
        set: {
          gameState: sql`excluded.game_state`,
          updatedAt: sql`excluded.updated_at`,
        },
      });

    logger.info(
      { count, errors, durationMs: Date.now() - t0 },
      "session-persistence: snapshot complete",
    );
    } finally {
      // Release lock
      await redisClient.del("lock:session-snapshot");
    }
  } catch (err) {
    logger.error({ err }, "session-persistence: snapshot failed");
  }
}

// ── Restore ───────────────────────────────────────────────────────────────────

/**
 * Restore session snapshots from PostgreSQL into Redis on server startup.
 *
 * Safety rules:
 *   - Expired snapshots (older than SESSION_TTL_S) are skipped.
 *   - Corrupt/unparseable snapshots are skipped with a warning.
 *   - SET NX is used so a session already in Redis is never overwritten
 *     (protects against stale DB data clobbering a live session).
 *   - The version key is also restored as "0" NX, enabling CAS writes
 *     to work immediately after restore.
 *
 * Errors are caught and logged — a restore failure must not prevent startup.
 */
export async function restoreSessionsFromDb(): Promise<void> {
  const t0 = Date.now();
  let restored = 0;
  let skipped = 0;
  let expired = 0;
  let corrupt = 0;

  try {
    await ensureSnapshotTable();

    const snapshots = await db.select().from(sessionSnapshotsTable);

    if (snapshots.length === 0) {
      logger.info("session-persistence: no snapshots to restore");
      return;
    }

    const now = Date.now();
    const pipeline = redisClient.pipeline();
    let validSessions = 0; // tracks how many valid sessions were enqueued

    for (const row of snapshots) {
      // Skip expired snapshots
      if (now - row.updatedAt.getTime() > SESSION_MAX_AGE_MS) {
        expired++;
        continue;
      }

      const state = deserializeSession(row.gameState);
      if (!state) {
        corrupt++;
        logger.warn(
          { sessionId: row.sessionId },
          "session-persistence: skipping restore of corrupt snapshot",
        );
        continue;
      }

      // Re-serialize from the stored object (keeps it consistent with what
      // sessions.ts writes to Redis: stripped-null JSON from `serialise()`).
      const json = JSON.stringify(row.gameState);

      // SET NX: only set if the key does not already exist
      pipeline.set(`session:${state.sessionId}`, json, "EX", SESSION_TTL_S, "NX");
      pipeline.set(`session:${state.sessionId}:v`, "0", "EX", SESSION_TTL_S, "NX");
      validSessions++;
    }

    if (validSessions === 0) {
      logger.info(
        { expired, corrupt },
        "session-persistence: no valid snapshots to restore",
      );
      return;
    }

    const results = await pipeline.exec();

    if (results) {
      // Each session adds 2 commands (session key + version key).
      // We only inspect the even-indexed results (session SET NX).
      for (let i = 0; i < validSessions; i++) {
        const sessionResult = results[i * 2];
        if (sessionResult && !sessionResult[0] && sessionResult[1] === "OK") {
          restored++;
        } else {
          skipped++; // key already existed — do not overwrite live session
        }
      }
    }

    logger.info(
      { restored, skipped, expired, corrupt, durationMs: Date.now() - t0 },
      "session-persistence: restore complete",
    );
  } catch (err) {
    logger.error(
      { err },
      "session-persistence: restore failed — server will start without session recovery",
    );
  }
}

// ── Background snapshot job ───────────────────────────────────────────────────

/**
 * Start the periodic session snapshot job.
 *
 * @param intervalMs  How often to snapshot (default: 30 000 ms = 30 s).
 *                    Set to 60 000 for lower DB pressure at the cost of a
 *                    larger potential recovery gap.
 * @returns The interval handle; call `clearInterval(handle)` to stop.
 */
export function startSnapshotJob(intervalMs = 30_000): NodeJS.Timeout {
  const handle = setInterval(() => {
    // Fire-and-forget: snapshot errors are logged inside snapshotActiveSessions.
    snapshotActiveSessions().catch((err: unknown) => {
      logger.error({ err }, "session-persistence: unhandled snapshot error");
    });
  }, intervalMs);

  // Allow the process to exit cleanly even if the interval is pending.
  handle.unref();

  logger.info(
    { intervalMs },
    "session-persistence: snapshot job started",
  );

  return handle;
}

/**
 * Session Persistence — In-Memory ↔ PostgreSQL backup layer.
 *
 * In-Memory (sessionCache) is the primary session store (fast, ephemeral).
 * PostgreSQL (via Drizzle) is the durable backup.
 *
 * Two main operations:
 *   1. `snapshotActiveSessions` — scan sessionCache, upsert live sessions to DB.
 *      Runs every ~30 s as a fire-and-forget background job.
 *   2. `restoreSessionsFromDb` — on startup, load DB snapshots into sessionCache.
 *
 * Serialization helpers are exported so callers can validate round-trips.
 */

import { sql } from "drizzle-orm";
import { db, sessionSnapshotsTable } from "@workspace/db";
import { logger } from "./logger.js";
import type { GameState as Session } from "../modules/games/errant-night/engine.js";
import { sessionCache } from "../modules/games/errant-night/sessions.js";

/** Sessions older than this in the DB are considered expired and not restored. */
const SESSION_MAX_AGE_MS = 4 * 60 * 60 * 1_000;

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

export function serializeSession(state: Session): Record<string, unknown> {
  return JSON.parse(JSON.stringify(state)) as Record<string, unknown>;
}

export function deserializeSession(data: unknown): Session | null {
  try {
    if (data === null || typeof data !== "object" || Array.isArray(data)) {
      return null;
    }
    const raw = data as Record<string, unknown>;

    if (typeof raw["sessionId"] !== "string" || typeof raw["phase"] !== "string") {
      return null;
    }

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
 * Scan sessionCache for all active sessions and upsert them to the database.
 */
export async function snapshotActiveSessions(): Promise<void> {
  const t0 = Date.now();
  let count = 0;
  let errors = 0;

  try {
    await ensureSnapshotTable();

    const rows: Array<{
      sessionId: string;
      gameState: Record<string, unknown>;
      updatedAt: Date;
    }> = [];

    for (const [sessionId, state] of sessionCache.entries()) {
      try {
        const parsed = serializeSession(state);
        rows.push({
          sessionId: state.sessionId,
          gameState: parsed,
          updatedAt: new Date(),
        });
        count++;
      } catch (err) {
        errors++;
        logger.warn(
          { sessionId, err },
          "session-persistence: failed to serialize session during snapshot",
        );
      }
    }

    if (rows.length === 0) return;

    // Upsert in a single DB round-trip
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
  } catch (err) {
    logger.error({ err }, "session-persistence: snapshot failed");
  }
}

// ── Restore ───────────────────────────────────────────────────────────────────

/**
 * Restore session snapshots from PostgreSQL into sessionCache on server startup.
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

    for (const row of snapshots) {
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

      // Only restore if it doesn't already exist in memory
      if (!sessionCache.has(state.sessionId)) {
        sessionCache.set(state.sessionId, { ...state, __v: 0 });
        restored++;
      } else {
        skipped++;
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

export function startSnapshotJob(intervalMs = 30_000): NodeJS.Timeout {
  const handle = setInterval(() => {
    snapshotActiveSessions().catch((err: unknown) => {
      logger.error({ err }, "session-persistence: unhandled snapshot error");
    });
  }, intervalMs);

  handle.unref();

  logger.info(
    { intervalMs },
    "session-persistence: snapshot job started",
  );

  return handle;
}

import { jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";

/**
 * Persistent backup of active game sessions.
 *
 * Redis is the primary session store (4-hour TTL). This table is a
 * secondary backup that allows sessions to survive a Redis restart or
 * process crash. The snapshot job writes here every ~30 seconds; the
 * startup restore job reads from here to re-hydrate Redis on boot.
 *
 * Schema decisions:
 *   - `sessionId` is the primary key — one row per live game session.
 *   - `gameState` is stored as JSONB for efficient read-back and to allow
 *     future indexed queries (e.g. "all sessions in voting phase").
 *   - `updatedAt` is set explicitly by the snapshot writer so it always
 *     reflects the Redis snapshot time, not the DB insert time.
 */
export const sessionSnapshotsTable = pgTable("session_snapshots", {
  sessionId: text("session_id").primaryKey(),
  gameState: jsonb("game_state").$type<Record<string, unknown>>().notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

export type SessionSnapshot = typeof sessionSnapshotsTable.$inferSelect;
export type InsertSessionSnapshot = typeof sessionSnapshotsTable.$inferInsert;

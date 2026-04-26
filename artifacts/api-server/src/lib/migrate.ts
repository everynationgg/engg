import { pool } from "@workspace/db";
import { logger } from "./logger.js";

/**
 * Ensure the PostgreSQL schema is up to date.
 *
 * Uses CREATE TABLE IF NOT EXISTS so the operation is idempotent — safe to
 * run on every server start.  Also handles the case where an older
 * `game_chats` table was created without the `id` BIGSERIAL column (added
 * later to support cursor-based chat pagination).
 *
 * All DDL is wrapped in an explicit transaction so a mid-migration crash
 * leaves the schema in a consistent state (fully applied or fully rolled back).
 *
 * Errors are caught and logged; the server always starts even if the
 * migration fails, matching the behaviour of restoreSessionsFromDb().
 */
export async function migrateDb(): Promise<void> {
  let client;
  try {
    client = await pool.connect();
  } catch (err) {
    logger.error({ err }, "migrate: could not acquire DB client — skipping schema migration");
    return;
  }

  try {
    await client.query("BEGIN");

    // In-game chat message persistence
    await client.query(`
      CREATE TABLE IF NOT EXISTS game_chats (
        id          BIGSERIAL    PRIMARY KEY,
        game_id     TEXT         NOT NULL,
        user_id     TEXT,
        guest_name  TEXT,
        message     TEXT         NOT NULL,
        timestamp   TIMESTAMP    NOT NULL DEFAULT NOW()
      )
    `);

    // Backfill id column for tables created before it was added to the schema.
    // Existing rows receive auto-incremented values (not tied to insertion order,
    // but id is only used as a deduplication cursor — not for display ordering).
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE  table_schema = 'public'
            AND  table_name   = 'game_chats'
            AND  column_name  = 'id'
        ) THEN
          ALTER TABLE game_chats ADD COLUMN id BIGSERIAL;
          ALTER TABLE game_chats DROP CONSTRAINT IF EXISTS game_chats_pkey;
          ALTER TABLE game_chats ADD PRIMARY KEY (id);
        END IF;
      END $$
    `);

    // Session snapshot backup (used by restoreSessionsFromDb on startup)
    await client.query(`
      CREATE TABLE IF NOT EXISTS session_snapshots (
        session_id  TEXT        PRIMARY KEY,
        game_state  JSONB       NOT NULL,
        updated_at  TIMESTAMP   NOT NULL
      )
    `);

    // Achievement System
    await client.query(`
      CREATE TABLE IF NOT EXISTS achievements (
        id              TEXT         PRIMARY KEY,
        slug            TEXT         NOT NULL UNIQUE,
        name            TEXT         NOT NULL,
        description     TEXT         NOT NULL,
        icon            TEXT         NOT NULL,
        rarity          TEXT         NOT NULL,
        category        TEXT         NOT NULL DEFAULT 'gameplay',
        prestige_xp     INTEGER      NOT NULL DEFAULT 0,
        points_required INTEGER      NOT NULL DEFAULT 0,
        created_at      TIMESTAMP    NOT NULL DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS user_achievements (
        user_id         TEXT         NOT NULL,
        achievement_id  TEXT         NOT NULL,
        unlocked_at     TIMESTAMP    NOT NULL DEFAULT NOW(),
        PRIMARY KEY (user_id, achievement_id)
      )
    `);

    // Backfill columns for achievements if they already exist
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'achievements' AND column_name = 'category') THEN
          ALTER TABLE achievements ADD COLUMN category TEXT NOT NULL DEFAULT 'gameplay';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'achievements' AND column_name = 'prestige_xp') THEN
          ALTER TABLE achievements ADD COLUMN prestige_xp INTEGER NOT NULL DEFAULT 0;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'credit_transactions' AND column_name = 'pack_id') THEN
          ALTER TABLE credit_transactions ADD COLUMN pack_id TEXT;
        END IF;
      END $$
    `);

    await client.query("COMMIT");
    logger.info("migrate: schema migration completed");
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    logger.error({ err }, "migrate: schema migration failed — chat and session persistence may not work correctly");
  } finally {
    client.release();
  }
}

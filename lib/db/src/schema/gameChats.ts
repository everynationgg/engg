import { pgTable, text, timestamp, bigserial } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const gameChatsTable = pgTable(
  "game_chats",
  {
    // Auto-incrementing surrogate key avoids timestamp-collision issues with composite PKs
    id: bigserial("id", { mode: "bigint" }).primaryKey(),
    gameId: text("game_id").notNull(),
    // Nullable — guests send messages without a user account
    userId: text("user_id")
      .references(() => usersTable.id, { onDelete: "cascade" }),
    // Display name for unauthenticated (guest) senders
    guestName: text("guest_name"),
    message: text("message").notNull(),
    timestamp: timestamp("timestamp").defaultNow().notNull(),
  },
);

export type GameChat = typeof gameChatsTable.$inferSelect;
export type InsertGameChat = typeof gameChatsTable.$inferInsert;

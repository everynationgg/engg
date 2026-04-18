import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const spectatorsTable = pgTable("spectators", {
  gameId: text("game_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
  leftAt: timestamp("left_at"),
});

export type Spectator = typeof spectatorsTable.$inferSelect;
export type InsertSpectator = typeof spectatorsTable.$inferInsert;

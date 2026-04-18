import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { usersTable } from "./users";

export const gameResultsTable = pgTable("game_results", {
  id: text("id").primaryKey(),
  gameId: text("game_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  role: text("role").notNull(), // "alien" | "crew" | "commander" | etc.
  won: text("won").notNull(), // "yes" | "no"
  completedAt: timestamp("completed_at").defaultNow().notNull(),
});

export const insertGameResultSchema = createInsertSchema(gameResultsTable).omit(
  {
    id: true,
    completedAt: true,
  }
) as unknown as z.ZodType<any>;

export type InsertGameResult = z.infer<typeof insertGameResultSchema>;
export type GameResult = typeof gameResultsTable.$inferSelect;

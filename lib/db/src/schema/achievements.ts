import { pgTable, text, integer, timestamp } from "drizzle-orm/pg-core";

export const achievementsTable = pgTable("achievements", {
  id: text("id").primaryKey(),
  slug: text("slug").unique().notNull(), // e.g., "first_win", "win_10_games"
  name: text("name").notNull(), // e.g., "First Victory"
  description: text("description").notNull(), // e.g., "Win your first game"
  icon: text("icon").notNull(), // emoji or icon name
  rarity: text("rarity").notNull(), // "common", "rare", "epic", "legendary"
  pointsRequired: integer("points_required").default(0).notNull(), // for rank-based achievements
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Achievement = typeof achievementsTable.$inferSelect;

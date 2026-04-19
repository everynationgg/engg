import { pgTable, text, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const userPreferencesTable = pgTable("user_preferences", {
  userId: text("user_id")
    .primaryKey()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  musicVolume: integer("music_volume").default(70).notNull(),
  sfxVolume: integer("sfx_volume").default(70).notNull(),
  theme: text("theme").default("dark").notNull(), // "dark" or "light"
  notificationsEnabled: boolean("notifications_enabled").default(true).notNull(),
  colorblindMode: boolean("colorblind_mode").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type UserPreferences = typeof userPreferencesTable.$inferSelect;

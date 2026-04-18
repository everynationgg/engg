import { pgTable, text, timestamp, primaryKey } from "drizzle-orm/pg-core";
import { usersTable } from "./users";
import { achievementsTable } from "./achievements";

export const userAchievementsTable = pgTable(
  "user_achievements",
  {
    userId: text("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    achievementId: text("achievement_id")
      .notNull()
      .references(() => achievementsTable.id, { onDelete: "cascade" }),
    unlockedAt: timestamp("unlocked_at").defaultNow().notNull(),
  },
  (t) => ({
    // Composite primary key ensures each user can only unlock each achievement once.
    // This is the conflict target used by onConflictDoNothing() in achievements.ts.
    pk: primaryKey({ columns: [t.userId, t.achievementId] }),
  }),
);

export type UserAchievement = typeof userAchievementsTable.$inferSelect;

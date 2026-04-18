import { pgTable, text, timestamp, primaryKey } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const friendshipsTable = pgTable(
  "friendships",
  {
    userId: text("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    friendId: text("friend_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    status: text("status")
      .notNull()
      .default("pending"), // "pending", "accepted", "blocked"
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.userId, table.friendId] }),
  })
);

export type Friendship = typeof friendshipsTable.$inferSelect;
export type InsertFriendship = typeof friendshipsTable.$inferInsert;

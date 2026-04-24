import { pgTable, text, timestamp, bigint, boolean, integer, jsonb, bigserial } from "drizzle-orm/pg-core";
import { type InferSelectModel } from "drizzle-orm";

export const usersTable = pgTable("users", {
  id: text("id").primaryKey(),
  username: text("username").notNull(),
  name: text("name"),
  email: text("email").notNull(),
  passwordHash: text("password_hash").notNull(),
  isVerified: boolean("is_verified").default(false),
  credits: integer("credits").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const gameChatsTable = pgTable("game_chats", {
  id: bigserial("id", { mode: "bigint" }).primaryKey(),
  gameId: text("game_id").notNull(),
  userId: text("user_id"),
  guestName: text("guest_name"),
  message: text("message").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const creditTransactionsTable = pgTable("credit_transactions", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  amount: integer("amount").notNull(),
  type: text("type").notNull(),
  description: text("description"),
  paypalOrderId: text("paypal_order_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const playerStatsTable = pgTable("player_stats", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().unique(),
  gamesPlayed: integer("games_played").default(0).notNull(),
  gamesWon: integer("games_won").default(0).notNull(),
  gamesLost: integer("games_lost").default(0).notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const gameResultsTable = pgTable("game_results", {
  id: text("id").primaryKey(),
  gameId: text("game_id").notNull(),
  userId: text("user_id").notNull(),
  role: text("role").notNull(),
  won: text("won").notNull(),
  completedAt: timestamp("completed_at").defaultNow().notNull(),
});

export const achievementsTable = pgTable("achievements", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  icon: text("icon").notNull(),
  rarity: text("rarity").notNull(),
  pointsRequired: integer("points_required").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const userAchievementsTable = pgTable("user_achievements", {
  userId: text("user_id").notNull(),
  achievementId: text("achievement_id").notNull(),
  unlockedAt: timestamp("unlocked_at").defaultNow().notNull(),
}, (table) => ({
  pk: { columns: [table.userId, table.achievementId] },
}));

export const emailVerificationTokensTable = pgTable("email_verification_tokens", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  token: text("token").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
});

export const passwordResetTokensTable = pgTable("password_reset_tokens", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  token: text("token").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
});

export const friendshipsTable = pgTable("friendships", {
  id: bigserial("id", { mode: "bigint" }).primaryKey(),
  userId: text("user_id").notNull(),
  friendId: text("friend_id").notNull(),
  status: text("status").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const userPreferencesTable = pgTable("user_preferences", {
  userId: text("user_id").primaryKey(),
  musicVolume: integer("music_volume").default(70).notNull(),
  sfxVolume: integer("sfx_volume").default(70).notNull(),
  theme: text("theme").default("dark").notNull(),
  notificationsEnabled: boolean("notifications_enabled").default(true).notNull(),
  colorblindMode: boolean("colorblind_mode").default(false).notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const spectatorsTable = pgTable("spectators", {
  id: bigserial("id", { mode: "bigint" }).primaryKey(),
  gameId: text("game_id").notNull(),
  userId: text("user_id").notNull(),
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
  leftAt: timestamp("left_at"),
});

export const sessionSnapshotsTable = pgTable("session_snapshots", {
  sessionId: text("session_id").primaryKey(),
  gameState: jsonb("game_state").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type User = InferSelectModel<typeof usersTable>;
export type Achievement = InferSelectModel<typeof achievementsTable>;
export type SessionSnapshot = InferSelectModel<typeof sessionSnapshotsTable>;

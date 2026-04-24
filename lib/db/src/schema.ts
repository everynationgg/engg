import { pgTable, text, timestamp, bigint, boolean, integer, jsonb } from "drizzle-orm/pg-core";

export const usersTable = pgTable("users", {
  id: text("id").primaryKey(),
  name: text("name"),
  email: text("email"),
  isVerified: boolean("is_verified").default(false),
  credits: integer("credits").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const gameChatsTable = pgTable("game_chats", {
  id: bigint("id", { mode: "bigint" }).primaryKey(),
  userId: text("user_id"),
  guestName: text("guest_name"),
  message: text("message").notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
});

export const creditTransactionsTable = pgTable("credit_transactions", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  amount: integer("amount").notNull(),
  type: text("type").notNull(),
  description: text("description"),
  paypalOrderId: text("paypal_order_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

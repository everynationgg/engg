import { Router, type IRouter } from "express";
import rateLimit from "express-rate-limit";
import { db, usersTable, gameChatsTable } from "@workspace/db";
import { eq, desc, sql, and, gt } from "drizzle-orm";
import { authMiddleware, optionalAuthMiddleware, type AuthRequest } from "../middlewares/auth.js";

const chatRouter: IRouter = Router();

// game_chats.user_id is UUID in the DB while users.id is TEXT; cast to avoid
// "operator does not exist: uuid = text" errors without changing the schema.
const userJoinCondition = eq(sql`${gameChatsTable.userId}::text`, usersTable.id);

const MAX_GUEST_NAME_LENGTH = 30;

// Dedicated rate limiter for the long-poll endpoint.
// Clients call /api/games/:gameId/chat/since/:timestamp very frequently; a
// generous per-minute limit prevents these requests from exhausting the global
// 100-req/15-min quota and collaterally blocking other endpoints.
const chatPollLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 120, // ~2 req/s sustained per IP
  message: { error: "Too many polling requests, please slow down." },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { trustProxy: false },
});

// POST /api/games/:gameId/chat - Send chat message (logged-in or guest)
chatRouter.post(
  "/games/:gameId/chat",
  optionalAuthMiddleware,
  async (req: AuthRequest, res) => {
    try {
      const { gameId } = req.params;
      const { message, guestName } = req.body;

      if (!gameId || typeof gameId !== "string") {
        res.status(400).json({ error: "gameId is required" });
        return;
      }

      if (!message || typeof message !== "string") {
        res.status(400).json({ error: "message is required" });
        return;
      }

      if (message.trim().length === 0) {
        res.status(400).json({ error: "message cannot be empty" });
        return;
      }

      if (message.length > 500) {
        res.status(400).json({ error: "message must be 500 characters or less" });
        return;
      }

      // Must be either logged in or provide a guest callsign
      if (!req.userId && (!guestName || typeof guestName !== "string" || !guestName.trim())) {
        res.status(400).json({ error: "guestName is required when not logged in" });
        return;
      }

      if (guestName && typeof guestName === "string" && guestName.trim().length > MAX_GUEST_NAME_LENGTH) {
        res.status(400).json({ error: `guestName must be ${MAX_GUEST_NAME_LENGTH} characters or less` });
        return;
      }

      // Insert chat message
      await db.insert(gameChatsTable).values({
        gameId: gameId as string,
        userId: req.userId ?? null,
        guestName: req.userId ? null : (guestName?.trim() ?? null),
        message: message.trim(),
      });

      res.status(201).json({ success: true, message: "Message sent" });
    } catch (error) {
      console.error("Error sending chat message:", error);
      res.status(500).json({ error: "Failed to send message" });
    }
  }
);

// GET /api/games/:gameId/chat - Get chat history
chatRouter.get("/games/:gameId/chat", async (req, res) => {
  try {
    const { gameId } = req.params;
    const { limit = 50 } = req.query;

    if (!gameId || typeof gameId !== "string") {
      res.status(400).json({ error: "gameId is required" });
      return;
    }

    const limitNum = Math.min(parseInt(limit as string) || 50, 200); // Max 200, default 50

    // Get chat messages with user info (left join so guest messages are included)
    const messages = await db
      .select({
        id: gameChatsTable.id,
        gameId: gameChatsTable.gameId,
        userId: gameChatsTable.userId,
        username: sql<string | null>`COALESCE(${usersTable.username}, ${gameChatsTable.guestName})`,
        message: gameChatsTable.message,
        timestamp: gameChatsTable.timestamp,
      })
      .from(gameChatsTable)
      .leftJoin(usersTable, userJoinCondition)
      .where(eq(gameChatsTable.gameId, gameId as string))
      .orderBy(desc(gameChatsTable.timestamp))
      .limit(limitNum);

    // Reverse to get chronological order
    res.json({
      gameId,
      messageCount: messages.length,
      messages: messages.reverse().map((m) => ({ ...m, id: String(m.id) })),
    });
  } catch (error) {
    console.error("Error fetching chat history:", error);
    res.status(500).json({ error: "Failed to fetch chat history" });
  }
});

// GET /api/games/:gameId/chat/since/:timestamp - Get new messages since timestamp (for polling)
// Also supports cursor-based fetch via ?after_id=<id>
chatRouter.get("/games/:gameId/chat/since/:timestamp", chatPollLimiter, async (req, res) => {
  try {
    const { gameId, timestamp } = req.params;
    const afterId = req.query.after_id as string | undefined;

    if (!gameId || typeof gameId !== "string") {
      res.status(400).json({ error: "gameId is required" });
      return;
    }

    if (!timestamp || typeof timestamp !== "string") {
      res.status(400).json({ error: "timestamp is required" });
      return;
    }

    const timestampDate = new Date(parseInt(timestamp));
    if (isNaN(timestampDate.getTime())) {
      res.status(400).json({ error: "Invalid timestamp" });
      return;
    }

    // Prefer cursor-based fetch if after_id is provided
    let messages;
    if (afterId && /^\d+$/.test(afterId)) {
      messages = await db
        .select({
          id: gameChatsTable.id,
          gameId: gameChatsTable.gameId,
          userId: gameChatsTable.userId,
          username: sql<string | null>`COALESCE(${usersTable.username}, ${gameChatsTable.guestName})`,
          message: gameChatsTable.message,
          timestamp: gameChatsTable.timestamp,
        })
        .from(gameChatsTable)
        .leftJoin(usersTable, userJoinCondition)
        .where(
          and(
            eq(gameChatsTable.gameId, gameId as string),
            gt(gameChatsTable.id, BigInt(afterId))
          )
        );
    } else {
      // Strip the trailing UTC 'Z' so the value is compatible with
      // the TIMESTAMP WITHOUT TIME ZONE column in the database.
      const timestampStr = timestampDate.toISOString().replace(/Z$/, "");

      // Get messages since timestamp (left join so guest messages are included)
      messages = await db
        .select({
          id: gameChatsTable.id,
          gameId: gameChatsTable.gameId,
          userId: gameChatsTable.userId,
          username: sql<string | null>`COALESCE(${usersTable.username}, ${gameChatsTable.guestName})`,
          message: gameChatsTable.message,
          timestamp: gameChatsTable.timestamp,
        })
        .from(gameChatsTable)
        .leftJoin(usersTable, userJoinCondition)
        .where(
          and(
            eq(gameChatsTable.gameId, gameId as string),
            gt(gameChatsTable.timestamp, sql`${timestampStr}::timestamp`)
          )
        );
    }

    res.json({
      gameId,
      newMessageCount: messages.length,
      messages: messages.map((m) => ({ ...m, id: String(m.id) })),
    });
  } catch (error) {
    console.error("Error fetching new messages:", error);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

// DELETE /api/games/:gameId/chat/:messageTimestamp - Delete own message (within 5 mins, logged-in only)
chatRouter.delete(
  "/games/:gameId/chat/:messageTimestamp",
  authMiddleware,
  async (req: AuthRequest, res) => {
    try {
      if (!req.userId) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      const { gameId, messageTimestamp } = req.params;

      if (!gameId || typeof gameId !== "string") {
        res.status(400).json({ error: "gameId is required" });
        return;
      }

      if (!messageTimestamp || typeof messageTimestamp !== "string") {
        res.status(400).json({ error: "messageTimestamp is required" });
        return;
      }

      const timestamp = new Date(parseInt(messageTimestamp));
      if (isNaN(timestamp.getTime())) {
        res.status(400).json({ error: "Invalid timestamp" });
        return;
      }

      // Check if message exists and belongs to user
      const messages = await db
        .select()
        .from(gameChatsTable)
        .where(
          and(
            eq(gameChatsTable.gameId, gameId as string),
            eq(gameChatsTable.userId, req.userId as string),
            eq(gameChatsTable.timestamp, timestamp)
          )
        );

      if (messages.length === 0) {
        res.status(404).json({ error: "Message not found or you don't own this message" });
        return;
      }

      // Check if message is within 5 minutes
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      if (timestamp < fiveMinutesAgo) {
        res.status(400).json({ error: "Cannot delete messages older than 5 minutes" });
        return;
      }

      // Delete message
      await db
        .delete(gameChatsTable)
        .where(
          and(
            eq(gameChatsTable.gameId, gameId as string),
            eq(gameChatsTable.userId, req.userId as string),
            eq(gameChatsTable.timestamp, timestamp)
          )
        );

      res.json({ success: true, message: "Message deleted" });
    } catch (error) {
      console.error("Error deleting message:", error);
      res.status(500).json({ error: "Failed to delete message" });
    }
  }
);

export { chatRouter };

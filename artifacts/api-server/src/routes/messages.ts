import { Router } from "express";
import { db, usersTable, privateMessagesTable } from "@workspace/db";
import { eq, and, or, desc, sql } from "drizzle-orm";
import { authMiddleware, type AuthRequest } from "../middlewares/auth.js";
import { logger } from "../lib/logger.js";

const messagesRouter = Router();

// GET /api/messages/private/:otherUserId - Get private message history
messagesRouter.get(
  "/messages/private/:otherUserId",
  authMiddleware,
  async (req: AuthRequest, res): Promise<void> => {
    try {
      const userId = req.userId!;
      const { otherUserId } = req.params;

      if (!otherUserId) {
        res.status(400).json({ error: "otherUserId is required" });
        return;
      }

      const messages = await db
        .select({
          id: privateMessagesTable.id,
          senderId: privateMessagesTable.senderId,
          receiverId: privateMessagesTable.receiverId,
          message: privateMessagesTable.message,
          isRead: privateMessagesTable.isRead,
          createdAt: privateMessagesTable.createdAt,
        })
        .from(privateMessagesTable)
        .where(
          or(
            and(
              eq(privateMessagesTable.senderId, userId),
              eq(privateMessagesTable.receiverId, otherUserId as string)
            ),
            and(
              eq(privateMessagesTable.senderId, otherUserId as string),
              eq(privateMessagesTable.receiverId, userId)
            )
          )
        )
        .orderBy(desc(privateMessagesTable.createdAt))
        .limit(50);

      // Mark unread messages as read
      const unreadIds = messages
        .filter((m) => m.receiverId === userId && !m.isRead)
        .map((m) => m.id);

      if (unreadIds.length > 0) {
        // Drizzle bigserial/bigint handling
        await db
          .update(privateMessagesTable)
          .set({ isRead: true })
          .where(sql`${privateMessagesTable.id} IN ${unreadIds}`);
      }

      res.json(messages.reverse());
    } catch (error) {
      logger.error({ err: error }, "Error fetching private messages");
      res.status(500).json({ error: "Failed to fetch private messages" });
    }
  }
);

// POST /api/messages/send - Send a private message
messagesRouter.post(
  "/messages/send",
  authMiddleware,
  async (req: AuthRequest, res): Promise<void> => {
    try {
      const senderId = req.userId!;
      const { receiverId, message } = req.body;

      if (!receiverId || !message) {
        res.status(400).json({ error: "receiverId and message are required" });
        return;
      }

      if (senderId === receiverId) {
        res.status(400).json({ error: "Cannot send message to yourself" });
        return;
      }

      const [newMessage] = await db
        .insert(privateMessagesTable)
        .values({
          senderId,
          receiverId,
          message: message.trim(),
        })
        .returning();

      // TODO: Emit socket event for real-time delivery
      
      res.json(newMessage);
    } catch (error) {
      logger.error({ err: error }, "Error sending private message");
      res.status(500).json({ error: "Failed to send message" });
    }
  }
);

export { messagesRouter };

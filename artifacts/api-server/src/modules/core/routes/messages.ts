import { Router } from "express";
import { db, usersTable, privateMessagesTable } from "@workspace/db";
import { eq, and, or, desc, sql } from "drizzle-orm";
import { authMiddleware, type AuthRequest } from "../auth/middleware";
import { logger } from "../../../lib/logger.js";

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
        // Emit read receipt to the original senders
        const io = req.app.get("io");
        if (io) {
          // Find unique senders of these unread messages
          const uniqueSenders = new Set(messages.filter(m => unreadIds.includes(m.id)).map(m => m.senderId));
          uniqueSenders.forEach(senderId => {
            io.to(`user:${senderId}`).emit("pm_read_receipt", {
              receiverId: userId,
              readAt: new Date().toISOString()
            });
          });
        }
      }

      res.json(messages.map(m => ({ ...m, id: m.id.toString() })).reverse());
    } catch (error) {
      logger.error({ err: error }, "Error fetching private messages");
      // Graceful degradation: return empty list on failure
      res.json([]);
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

      // Emit socket event for real-time delivery
      const io = req.app.get("io");
      if (io) {
        const serialized = { ...newMessage, id: newMessage.id.toString() };
        io.to(`user:${receiverId}`).emit("private_message", serialized);
        // Also emit to sender's other tabs
        io.to(`user:${senderId}`).emit("private_message", serialized);
      }
      
      res.json({ ...newMessage, id: newMessage.id.toString() });
    } catch (error) {
      logger.error({ err: error }, "Error sending private message");
      res.status(500).json({ error: "Failed to send message" });
    }
  }
);

// GET /api/messages/unread-counts - Get unread message counts per sender
messagesRouter.get(
  "/messages/unread-counts",
  authMiddleware,
  async (req: AuthRequest, res): Promise<void> => {
    try {
      const userId = req.userId!;
      
      const counts = await db
        .select({
          senderId: privateMessagesTable.senderId,
          count: sql<number>`count(*)`
        })
        .from(privateMessagesTable)
        .where(
          and(
            eq(privateMessagesTable.receiverId, userId),
            eq(privateMessagesTable.isRead, false)
          )
        )
        .groupBy(privateMessagesTable.senderId);
      
      res.json(counts);
    } catch (error) {
      logger.error({ err: error }, "Error fetching unread counts");
      // Graceful degradation: return empty counts
      res.json([]);
    }
  }
);

export { messagesRouter };

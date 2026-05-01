import type { Server as SocketIOServer, Socket } from "socket.io";
import { validate, sendChatMessageSchema, chatTypingSchema } from "../../../games/errant-night/schemas.js";
import { logger } from "../../../../lib/logger.js";
import { db, gameChatsTable, usersTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { checkRateLimit } from "../../../../lib/rate-limit.js";
import { chatSystemMessage } from "../../../games/errant-night/emitters.js";
import { getSession } from "../../../games/errant-night/sessions.js";

const RATE_LIMIT_WINDOW_MS = 60_000;

export function registerChatHandlers(
  io: SocketIOServer,
  socket: Socket,
  state: {
    currentSessionId: string | null;
    currentPlayerId: string | null;
    currentUserId: string | null;
    currentRateLimitId: string | null;
  }
) {
  socket.on("send_chat_message", async (data: unknown, ack) => {
    const parsed = validate(sendChatMessageSchema, data, ack);
    if (!parsed) return;
    const { sessionId, message } = parsed;
    const gameId = sessionId; // Map sessionId to gameId for database


    if (!await checkRateLimit(state.currentRateLimitId ?? socket.id, "chat", 30, RATE_LIMIT_WINDOW_MS)) {
      ack?.({ success: false, error: "Rate limit exceeded — slow down" });
      return;
    }

    const session = await getSession(sessionId);
    if (!session) {
      ack?.({ success: false, error: "Session not found" });
      return;
    }

    const player = session.players.find((p) => p.id === socket.id);
    if (!player) {
      ack?.({ success: false, error: "You are not in this session" });
      return;
    }

    try {
      const [chatRow] = await db.insert(gameChatsTable).values({
        gameId: sessionId,
        userId: player.userId || null,
        guestName: player.userId ? null : player.name,
        message,
      }).returning();

      io.to(sessionId).emit("chat_message", {
        id: chatRow.id.toString(),
        userId: chatRow.userId,
        guestName: chatRow.guestName,
        message: chatRow.message,
        timestamp: chatRow.timestamp,
      });

      ack?.({ success: true });
    } catch (err) {
      logger.error({ err, sessionId }, "Failed to save chat message");
      ack?.({ success: false, error: "Internal server error" });
    }
  });

  socket.on("chat_typing_start", async (data: unknown) => {
    const parsed = validate(chatTypingSchema, data);
    if (!parsed) return;
    const session = await getSession(parsed.sessionId);
    if (!session) return;
    const player = session.players.find(p => p.id === socket.id);
    if (!player) return;

    socket.to(parsed.sessionId).emit("chat_typing_update", {
      playerName: player.name,
      isTyping: true
    });
  });

  socket.on("chat_typing_stop", async (data: unknown) => {
    const parsed = validate(chatTypingSchema, data);
    if (!parsed) return;
    const session = await getSession(parsed.sessionId);
    if (!session) return;
    const player = session.players.find(p => p.id === socket.id);
    if (!player) return;

    socket.to(parsed.sessionId).emit("chat_typing_update", {
      playerName: player.name,
      isTyping: false
    });
  });
}


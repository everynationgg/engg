import type { Server as SocketIOServer, Socket } from "socket.io";
import { registerSessionHandlers } from "./session.js";
import { registerChatHandlers } from "./chat.js";
import { registerGameHandlers } from "./game.js";
import { registerPrivateMessageHandlers } from "./private_messages.js";
import { verifyToken } from "../../lib/auth.js";
import { logger } from "../../lib/logger.js";

export function registerHandlers(io: SocketIOServer) {
  io.on("connection", (socket) => {
    // Shared state per connection
    const state = {
      currentSessionId: null as string | null,
      currentPlayerId: null as string | null,
      currentUserId: null as string | null,
      currentPlayerToken: null as string | null,
      currentRateLimitId: null as string | null,
      playerQuit: false, 
    };

    // Authenticate user from handshake if provided
    const token = socket.handshake.auth.token;
    if (token) {
      const verified = verifyToken(token);
      if (verified) {
        state.currentUserId = verified.userId;
        socket.join(`user:${verified.userId}`);
        logger.info({ userId: verified.userId, socketId: socket.id }, "User connected and joined private room");
      }
    }

    registerSessionHandlers(io, socket, state);
    registerChatHandlers(io, socket, state);
    registerGameHandlers(io, socket, state);
    registerPrivateMessageHandlers(io, socket, state);
  });
}


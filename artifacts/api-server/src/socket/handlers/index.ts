import type { Server as SocketIOServer, Socket } from "socket.io";
import { registerSessionHandlers } from "./session.js";
import { registerChatHandlers } from "./chat.js";
import { registerGameHandlers } from "./game.js";

export function registerHandlers(io: SocketIOServer) {
  io.on("connection", (socket) => {
    // Shared state per connection
    const state = {
      currentSessionId: null as string | null,
      currentPlayerId: null as string | null,
      currentUserId: null as string | null,
      currentPlayerToken: null as string | null,
      currentRateLimitId: null as string | null,
      playerQuit: false, // Flag to track explicit quit vs unexpected disconnect
    };

    registerSessionHandlers(io, socket, state);
    registerChatHandlers(io, socket, state);
    registerGameHandlers(io, socket, state);
  });
}


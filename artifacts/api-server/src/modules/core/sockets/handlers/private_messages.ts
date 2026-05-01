import type { Server as SocketIOServer, Socket } from "socket.io";
import { validate, privateMessageTypingSchema } from "../../../games/errant-night/schemas.js";

export function registerPrivateMessageHandlers(
  io: SocketIOServer,
  socket: Socket,
  state: {
    currentUserId: string | null;
  }
) {
  socket.on("pm_typing_update", (data: unknown) => {
    if (!state.currentUserId) return;
    
    const parsed = validate(privateMessageTypingSchema, data);
    if (!parsed) return;
    
    const { receiverId, isTyping } = parsed;
    
    // Broadcast to the receiver's room
    socket.to(`user:${receiverId}`).emit("pm_typing_update", {
      senderId: state.currentUserId,
      isTyping
    });
  });
}

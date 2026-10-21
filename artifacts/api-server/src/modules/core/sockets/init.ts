import { Server, Socket } from 'socket.io';
import { registerCoreHandlers } from './handlers/index.js';
import { registerGameHandlersIndex } from '../../games/errant-night/socket-handlers/index.js';
import { verifyToken } from '../../../lib/auth.js';

export const initSockets = (io: Server) => {
  io.on('connection', (socket: Socket) => {
    // Shared state for all handlers on this socket
    const state = {
      currentSessionId: null as string | null,
      currentPlayerId: null as string | null,
      currentUserId: (socket.data.userId as string | undefined) ?? null,
      currentPlayerToken: null as string | null,
      currentRateLimitId: (socket.data.userId as string | undefined) ?? null,
      playerQuit: false,
    };

    if (state.currentUserId) {
      socket.join(`user:${state.currentUserId}`);
    }

    socket.on('authenticate', (payload: unknown) => {
      const rawToken =
        typeof payload === 'string'
          ? payload
          : (payload as { token?: string } | null)?.token;
      if (!rawToken || typeof rawToken !== 'string') return;
      const cleanToken = rawToken.startsWith('Bearer ') ? rawToken.slice(7) : rawToken;
      const decoded = verifyToken(cleanToken);
      if (decoded?.userId) {
        socket.data.userId = decoded.userId;
        state.currentUserId = decoded.userId;
        state.currentRateLimitId = decoded.userId;
        socket.join(`user:${decoded.userId}`);
      }
    });

    // Register platform-generic handlers
    registerCoreHandlers(io, socket, state);
    
    // Register game-specific handlers (Errant Night)
    registerGameHandlersIndex(io, socket, state);

    socket.on('disconnect', () => {
      // Handle global disconnect logic if any
    });
  });
};

import { Server, Socket } from 'socket.io';
import { registerCoreHandlers } from './handlers/index.js';
import { registerGameHandlersIndex } from '../../games/errant-night/socket-handlers/index.js';

export const initSockets = (io: Server) => {
  io.on('connection', (socket: Socket) => {
    // Shared state for all handlers on this socket
    const state = {
      currentSessionId: null,
      currentPlayerId: null,
      currentUserId: null,
      currentPlayerToken: null,
      currentRateLimitId: null,
      playerQuit: false,
    };

    // Register platform-generic handlers
    registerCoreHandlers(io, socket, state);
    
    // Register game-specific handlers (Errant Night)
    registerGameHandlersIndex(io, socket, state);

    socket.on('disconnect', () => {
      // Handle global disconnect logic if any
    });
  });
};

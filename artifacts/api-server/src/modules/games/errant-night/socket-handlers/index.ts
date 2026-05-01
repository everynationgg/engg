import { Server, Socket } from 'socket.io';
import { registerGameHandlers } from './game.js';
import { registerSessionHandlers } from './session.js';

export const registerGameHandlersIndex = (io: Server, socket: Socket, state: any) => {
  registerGameHandlers(io, socket, state);
  registerSessionHandlers(io, socket, state);
};

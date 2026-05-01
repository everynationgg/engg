import { Server, Socket } from 'socket.io';
import { registerChatHandlers } from './chat.js';
import { registerPrivateMessageHandlers } from './private_messages.js';

export const registerCoreHandlers = (io: Server, socket: Socket, state: any) => {
  registerChatHandlers(io, socket, state);
  registerPrivateMessageHandlers(io, socket, state);
};

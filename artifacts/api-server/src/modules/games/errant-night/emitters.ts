import type { Server as SocketIOServer } from "socket.io";
import { logger } from "../../../lib/logger.js";
import { sortPlayersByStatus, computeSanitizedState } from "./engine.js";
import type { MaybeSession } from "./types.js";

let nextSystemChatId = 0;

export function logGameEvent(
  event: string,
  sessionId: string,
  playerId: string,
  payload?: Record<string, unknown>,
): void {
  logger.info(
    { gameEvent: true, event, sessionId, playerId, ts: Date.now(), ...payload },
    `game_event:${event}`,
  );
}

export function phaseUpdate(
  io: SocketIOServer,
  sessionId: string,
  session: MaybeSession,
) {
  if (!session) return;
  // Ensure consistent player ordering and connectionStatus in every broadcast
  sortPlayersByStatus(session);
  logger.info(
    { sessionId, phase: session.phase, players: session.players.length },
    "phase_update broadcast (sanitized)",
  );

  // Get all sockets currently in this session room
  const room = io.sockets.adapter.rooms.get(sessionId);
  if (room) {
    if (session.health === "corrupt") {
      io.to(sessionId).emit("session_corrupt", { 
        error: "Engine invariant violation. Session halted.",
        timestamp: Date.now()
      });
      return;
    }

    for (const socketId of room) {
      const socket = io.sockets.sockets.get(socketId);
      if (socket) {
        const sanitized = computeSanitizedState(session, socketId);
        socket.emit("phase_update", sanitized);
      }
    }
  }
}

export function chatSystemMessage(io: SocketIOServer, sessionId: string, text: string) {
  io.to(sessionId).emit("chat_system_message", {
    id: `sys-${Date.now()}-${++nextSystemChatId}`,
    type: "system" as const,
    text,
    timestamp: new Date().toISOString(),
  });
}

export function graceUpdate(
  io: SocketIOServer,
  sessionId: string,
  session: MaybeSession,
  playerName: string,
) {
  if (!session) return;
  io.to(sessionId).emit("grace_update", {
    playersInGrace: (session.playersInGrace ?? []).filter(pId => {
      const p = session.players.find(pl => (pl.playerId === pId || pl.id === pId));
      return p && !p.isSpectator;
    }),
    playerName,
    players: session.players.map((p) => ({
      id: p.id,
      name: p.name,
      connectionStatus: p.connectionStatus ?? "connected",
      isHost: p.isHost,
      didQuit: p.didQuit,
      isSpectator: !!p.isSpectator,
    })),
  });
}


import type { Server as SocketIOServer, Socket } from "socket.io";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import {
  validate,
  startGameSchema,
  startGameCustomSchema,
  sessionIdSchema,
  submitActionSchema,
  castVoteSchema,
  castEmergencyVoteSchema,
  kickPlayerSchema,
  sessionOnlySchema,
} from "../schemas.js";
import { logger } from "../../lib/logger.js";
import {
  isRedisOverloaded,
  // v1.0.1 - deployment sync
  getSession,
  saveSession,
  withCasRetry,
  CAS_SKIP,
  freshEmergencyVote,
  freshRoundSummary,
} from "../../lib/sessions.js";
import {
  startGame,
  acknowledgeRole,
  submitAction,
  castVote,
  recheckVotingCompletion,
  castEmergencyVote,
  startEmergencyMeeting,
  resolveEmergencyMeeting,
  computeOrbitInfo,
  calculateGameResults,
  continueGame,
  endGame,
} from "../game.engine.js";
import { checkAndRunResolution } from "../logic.js";
import { registerStatusHandlers } from "./status.js";

/**
 * Game handlers:
 * Covers the high-level flow from role reveal through orbit actions and voting.
 */
export function registerGameHandlers(
  io: SocketIOServer,
  socket: Socket,
  state: {
    currentSessionId: string | null;
    currentPlayerId: string | null;
    currentUserId: string | null;
    currentPlayerToken: string | null;
    currentRateLimitId: string | null;
    playerQuit: boolean;
  },
) {
  // --- ROLE REVEAL PHASE ---

  socket.on("acknowledge_role", async (data: unknown, ack) => {
    const parsed = validate(sessionOnlySchema, data, ack);
    if (!parsed) return;
    const { sessionId } = parsed;

    const cas = await withCasRetry(sessionId, (session) => {
      if (session.phase !== "role_reveal") return CAS_SKIP;
      acknowledgeRole(session, socket.id);
      return true as const;
    });

    if (!cas) {
      // Even if cas is null (already acked), still try to resolve
      const current = await getSession(sessionId);
      if (current) await checkAndRunResolution(io, sessionId, current);
      ack?.({ success: true });
      return;
    }

    const session = await getSession(sessionId);
    if (session) {
      await checkAndRunResolution(io, sessionId, session);
    }
    ack?.({ success: true });
  });

  // --- ORBIT ACTION PHASE ---

  socket.on("submit_action", async (data: unknown, ack) => {
    const parsed = validate(submitActionSchema, data, ack);
    if (!parsed) return;
    const { sessionId, action } = parsed;

    const cas = await withCasRetry(sessionId, (session) => {
      if (session.phase !== "orbit_action") return CAS_SKIP;
      const res = submitAction(session, socket.id, action as any);
      if (!res.accepted) return CAS_SKIP;
      return true as const;
    });

    if (!cas) {
      // Even if cas is null (e.g. redundant submission), still try to resolve
      const current = await getSession(sessionId);
      if (current) await checkAndRunResolution(io, sessionId, current);
      ack?.({ success: false, error: "Invalid action or already synchronized" });
      return;
    }

    const session = await getSession(sessionId);
    if (session) {
      await checkAndRunResolution(io, sessionId, session);
    }
    ack?.({ success: true });
  });

  // --- EMERGENCY MEETING ---

  socket.on("start_emergency", async (data: unknown, ack) => {
    const parsed = validate(sessionOnlySchema, data, ack);
    if (!parsed) return;
    const { sessionId } = parsed;

    const cas = await withCasRetry(sessionId, (session) => {
      const res = startEmergencyMeeting(session, socket.id);
      if (!res.accepted) return CAS_SKIP;
      return true as const;
    });

    if (cas) {
      const session = await getSession(sessionId);
      if (session) {
        io.to(sessionId).emit("phase_update", session);
        io.to(sessionId).emit("emergency_called", { callerId: socket.id });
      }
      ack?.({ success: true });
    } else {
      ack?.({ success: false, error: "Cannot start emergency" });
    }
  });

  socket.on("cast_emergency_vote", async (data: unknown, ack) => {
    const parsed = validate(castEmergencyVoteSchema, data, ack);
    if (!parsed) return;
    const { sessionId, vote } = parsed;

    const cas = await withCasRetry(sessionId, (session) => {
      const res = castEmergencyVote(session, socket.id, vote);
      if (!res.accepted) return CAS_SKIP;
      return true as const;
    });

    if (cas) {
      const session = await getSession(sessionId);
      if (session) {
        if (session.emergencyMeeting?.state === "resolved") {
          resolveEmergencyMeeting(session);
          io.to(sessionId).emit("phase_update", session);
        } else {
          io.to(sessionId).emit("emergency_vote_update", {
            votes: session.emergencyMeeting?.votes,
          });
        }
      }
      ack?.({ success: true });
    } else {
      ack?.({ success: false, error: "Invalid vote" });
    }
  });

  // --- VOTING PHASE ---

  socket.on("cast_vote", async (data: unknown, ack) => {
    const parsed = validate(castVoteSchema, data, ack);
    if (!parsed) return;
    const { sessionId, targetId } = parsed;

    const cas = await withCasRetry(sessionId, (session) => {
      if (session.phase !== "voting") return CAS_SKIP;
      const res = castVote(session, socket.id, targetId);
      if (!res.accepted) return CAS_SKIP;
      return true as const;
    });

    if (cas) {
      const session = await getSession(sessionId);
      if (session) {
        await checkAndRunResolution(io, sessionId, session);
      }
      ack?.({ success: true });
    } else {
      ack?.({ success: false, error: "Invalid vote" });
    }
  });

  // --- GAME CONTROL ---

  socket.on("start_game", async (data: unknown, ack) => {
    const parsed = validate(startGameSchema, data, ack);
    if (!parsed) return;
    const { sessionId, roleCounts, customRoles } = parsed;

    const cas = await withCasRetry(sessionId, (session) => {
      if (session.phase !== "lobby") return CAS_SKIP;
      const res = startGame(session, socket.id, roleCounts, customRoles);
      if (!res.accepted) return CAS_SKIP;
      return true as const;
    });

    if (cas) {
      const session = await getSession(sessionId);
      if (session) io.to(sessionId).emit("phase_update", session);
      ack?.({ success: true });
    } else {
      ack?.({ success: false, error: "Only host can start game" });
    }
  });

  socket.on("continue_game", async (data: unknown, ack) => {
    const parsed = validate(sessionOnlySchema, data, ack);
    if (!parsed) return;
    const { sessionId } = parsed;

    const cas = await withCasRetry(sessionId, (session) => {
      const res = continueGame(session, socket.id);
      if (!res.accepted) return CAS_SKIP;
      return true as const;
    });

    if (cas) {
      const session = await getSession(sessionId);
      if (session) io.to(sessionId).emit("phase_update", session);
      ack?.({ success: true });
    } else {
      ack?.({ success: false, error: "Cannot continue" });
    }
  });

  socket.on("restart_game", async (data: unknown, ack) => {
    const parsed = validate(sessionOnlySchema, data, ack);
    if (!parsed) return;
    const { sessionId } = parsed;

    const cas = await withCasRetry(sessionId, (session) => {
      const res = endGame(session, socket.id); // Reset to lobby
      if (!res.accepted) return CAS_SKIP;
      return true as const;
    });

    if (cas) {
      const session = await getSession(sessionId);
      if (session) io.to(sessionId).emit("phase_update", session);
      ack?.({ success: true });
    } else {
      ack?.({ success: false, error: "Cannot restart" });
    }
  });

  // PM and Status
  registerStatusHandlers(io, socket, state);
}

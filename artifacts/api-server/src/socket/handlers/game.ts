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
  // System diagnostic: session persistence layer initialized
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
  // ── START GAME ──
  socket.on("start_game", async (data: unknown, ack) => {
    const parsed = validate(startGameSchema, data, ack);
    if (!parsed) return;
    const { sessionId, roleCounts, customRoles } = parsed;

    if (state.currentSessionId !== sessionId) {
      ack?.({ success: false, error: "Not in session" });
      return;
    }

    const cas = await withCasRetry(sessionId, (session) => {
      const player = session.players.find((p) => p.id === state.currentPlayerId);
      if (!player?.isHost) return CAS_SKIP;
      if (session.phase !== "lobby" && session.phase !== "role_config") return CAS_SKIP;

      if (customRoles) {
        session.rolesAssigned = { ...customRoles };
        session.initialRoles = { ...customRoles };
        const assignedCounts = { ...roleCounts };
        Object.values(customRoles).forEach(roleId => { assignedCounts[roleId] = (assignedCounts[roleId] || 1) - 1; });
        const pool: string[] = [];
        for (const [roleId, count] of Object.entries(assignedCounts)) {
          for (let i = 0; i < count; i++) pool.push(roleId);
        }
        session.centerCards = pool;
        session.roleCounts = { ...roleCounts };
        session.orbitActions = {};
        session.orbitCompleted = [];
        session.roleAcknowledgements = [];
        session.resolutionAcknowledgements = [];
        session.discussionStartedAt = null;
        session.emergencyVote = freshEmergencyVote();
        session.votes = {};
        session.voteResult = null;
        session.roundSummary = freshRoundSummary();
      } else {
        startGame(session, roleCounts, session.settings);
      }
      session.phase = "role_reveal";
      return true as const;
    });

    if (!cas) {
      ack?.({ success: false, error: "Only host can start or game already in progress" });
      return;
    }

    phaseUpdate(io, sessionId, cas.session);
    logGameEvent("game_started", sessionId, state.currentPlayerId ?? socket.id, { players: cas.session.players.length });

    await logAudit({
      userId: state.currentUserId,
      eventType: "GAME_START",
      description: `Host initiated round deployment in session ${sessionId}`,
      metadata: { sessionId, playerCount: cas.session.players.length },
    });

    ack?.({ success: true });
  });

  // ── UNLOCK ROLE (Credits) ──
  socket.on("unlock_role", async (data: unknown, ack) => {
    const unlockRoleSchema = z.object({
      sessionId: sessionIdSchema,
      roleId: z.enum(["virus", "router", "doctor"]),
    });
    const parsed = validate(unlockRoleSchema, data, ack);
    if (!parsed) return;
    const { sessionId, roleId } = parsed;

    if (state.currentSessionId !== sessionId || !state.currentUserId) {
      ack?.({ success: false, error: "Auth required or not in session" });
      return;
    }

    const price = (roleId === "virus" || roleId === "doctor") ? 25 : 35;
    try {
      const result = await db.transaction(async (tx) => {
        const user = await tx.select().from(usersTable).where(eq(usersTable.id, state.currentUserId!)).limit(1);
        if (!user.length || user[0].credits < price) return "insufficient_funds";

        const session = await getSession(sessionId);
        if (session?.unlockedRoles.includes(roleId)) return "already_unlocked";

        // ── IDEMPOTENCY CHECK ──
        // Prevent double-spend if the socket event is retried or double-clicked
        const idempotencyKey = `unlock:${sessionId}:${roleId}`;
        const existingTx = await tx
          .select()
          .from(creditTransactionsTable)
          .where(sql`${creditTransactionsTable.userId} = ${state.currentUserId!} AND ${creditTransactionsTable.packId} = ${idempotencyKey}`)
          .limit(1);

        if (existingTx.length > 0) return "already_processed";

        // Deduct and log
        await tx.update(usersTable).set({ credits: user[0].credits - price }).where(eq(usersTable.id, state.currentUserId!));
        await tx.insert(creditTransactionsTable).values({
          id: randomUUID(),
          userId: state.currentUserId!,
          username: user[0].username,
          email: user[0].email,
          amount: -price,
          type: "spend",
          packId: idempotencyKey, // Used as idempotency key for game unlocks
          description: `Authorized role protocol: ${roleId.toUpperCase()} in session ${sessionId}`,
        });
        return true;
      });

      if (result === true) {
        await withCasRetry(sessionId, (session) => {
          if (!session.unlockedRoles.includes(roleId)) {
            session.unlockedRoles.push(roleId);
            return true as const;
          }
          return CAS_SKIP;
        });
        const fresh = await getSession(sessionId);
        if (fresh) phaseUpdate(io, sessionId, fresh);
        chatSystemMessage(io, sessionId, `${roleId.toUpperCase()} protocol initialized`);

        await logAudit({
          userId: state.currentUserId,
          eventType: "CREDIT_SPEND_UNLOCK",
          description: `User unlocked premium protocol: ${roleId.toUpperCase()}`,
          metadata: { sessionId, roleId, price },
        });

        ack?.({ success: true });
      } else {
        let error = "Internal error";
        if (result === "already_unlocked") error = "Already unlocked in this session";
        if (result === "already_processed") error = "Transaction already processed";
        if (result === "insufficient_funds") error = "Insufficient credits for this protocol";

        ack?.({ success: false, error });
      }
    } catch (err) {
      logger.error({ err, sessionId }, "Failed to unlock role");
      ack?.({ success: false, error: "Internal server error" });
    }
  });

  // ── ACKNOWLEDGE ROLE ──
  socket.on("acknowledge_role", async (data: unknown, ack) => {
    const parsed = validate(sessionOnlySchema, data, ack);
    if (!parsed) return;
    const { sessionId } = parsed;

    const cas = await withCasRetry(sessionId, (session) => {
      if (session.phase !== "role_reveal") return CAS_SKIP;
      acknowledgeRole(session, state.currentPlayerId!);
      if ((session.phase as string) === "orbit_action") {
        // Transitioned to orbit
      }
      return true as const;
    });

    if (!cas) {
      // Even if cas is null (already acked), still try to resolve
      const current = await getSession(sessionId);
      if (current) await checkAndRunResolution(io, sessionId, current);
      ack?.({ success: true });

      // Trigger resolution check if everyone is already ready (e.g. solo play or all passive)
      await checkAndRunResolution(io, sessionId, cas.session);
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
      const res = submitAction(session, state.currentPlayerId!, action as any);
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

    const cas = await withCasRetry(sessionId, (session) => {
      if (session.phase !== "voting") return CAS_SKIP;
      const res = castVote(session, state.currentPlayerId!, targetId);
      if (!res.accepted) return CAS_SKIP;

      const recheck = recheckVotingCompletion(session);
      if (recheck.votingComplete) {
        votingComplete = true;
        voteResult = recheck.voteResult;
      }
      return true as const;
    });

    if (cas) {
      ack?.({ success: true });
      phaseUpdate(io, sessionId, cas.session);
      if (votingComplete && voteResult) {
        io.to(sessionId).emit("vote_result", voteResult);
        io.to(sessionId).emit("round_summary", cas.session.roundSummary);

        if (voteResult.eliminatedId) {
          await logAudit({
            userId: voteResult.eliminatedId,
            eventType: "PLAYER_ELIMINATED",
            description: `Player protocol terminated: ${voteResult.eliminatedName} (${voteResult.eliminatedRole})`,
            metadata: { sessionId, eliminatedRole: voteResult.eliminatedRole },
          });
        }

        if (cas.session.phase === "result") {
          await recordGameResults(io, sessionId, voteResult, cas.session);
        }
      }
    }
  });

  // ── EMERGENCY VOTE ──
  socket.on("start_emergency_vote", async (data: unknown, ack) => {
    const parsed = validate(sessionOnlySchema, data, ack);
    if (!parsed) return;
    const { sessionId } = parsed;

    const cas = await withCasRetry(sessionId, (session) => {
      if (session.phase !== "discussion") return CAS_SKIP;
      const res = startEmergencyVote(session, state.currentPlayerId!);
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
      if (!session.emergencyVote?.active) return CAS_SKIP;
      const res = castEmergencyVote(session, state.currentPlayerId!, vote);
      outcome = res.outcome;
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
      const player = session.players.find(p => p.id === state.currentPlayerId);
      if (!player?.isHost) return CAS_SKIP;
      restartGame(session);
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
      const player = session.players.find(p => p.id === state.currentPlayerId);
      if (!player?.isHost) return CAS_SKIP;
      continueGame(session, state.currentPlayerId!);
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
      const player = session.players.find(p => p.id === state.currentPlayerId);
      if (!player?.isHost) return CAS_SKIP;
      endGame(session, state.currentPlayerId!);
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
      const player = session.players.find(p => p.id === state.currentPlayerId);
      if (!player?.isHost) return CAS_SKIP;
      kickPlayer(session, state.currentPlayerId!, targetPlayerId);
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

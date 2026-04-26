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
  sessionOnlySchema
} from "../schemas.js";
import { logger } from "../../lib/logger.js";
import { 
  isRedisOverloaded, 
  getSession, 
  saveSession, 
  withCasRetry, 
  CAS_SKIP,
  freshEmergencyVote,
  freshRoundSummary
} from "../../sessions.js";
import { 
  startGame, 
  acknowledgeRole, 
  submitAction, 
  castVote, 
  recheckVotingCompletion,
  startEmergencyVote,
  castEmergencyVote,
  restartGame,
  continueGame,
  endGame,
  kickPlayer,
  sortPlayersByStatus
} from "../../modules/game/game.engine.js";
import { db, usersTable, creditTransactionsTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { phaseUpdate, chatSystemMessage, logGameEvent } from "../emitters.js";
import { handleSaveConflict, checkAndRunResolution, recordGameResults } from "../logic.js";
import { checkRateLimit } from "../../lib/rate-limit.js";
import { logAudit } from "../../lib/audit.js";

const RATE_LIMIT_WINDOW_MS = 60_000;

export function registerGameHandlers(
  io: SocketIOServer,
  socket: Socket,
  state: {
    currentSessionId: string | null;
    currentPlayerId: string | null;
    currentUserId: string | null;
    currentRateLimitId: string | null;
  }
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
      const player = session.players.find((p) => p.id === socket.id);
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
    logGameEvent("game_started", sessionId, socket.id, { players: cas.session.players.length });
    
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
      roleId: z.enum(["virus", "router"]),
    });
    const parsed = validate(unlockRoleSchema, data, ack);
    if (!parsed) return;
    const { sessionId, roleId } = parsed;

    if (state.currentSessionId !== sessionId || !state.currentUserId) {
      ack?.({ success: false, error: "Auth required or not in session" });
      return;
    }

    const price = roleId === "virus" ? 25 : 35;
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
      acknowledgeRole(session, socket.id);
      if ((session.phase as string) === "orbit_action") {
         // Transitioned to orbit
      }
      return true as const;
    });

    if (cas) {
      phaseUpdate(io, sessionId, cas.session);
      ack?.({ success: true });
    }
  });

  // ── SUBMIT ACTION ──
  socket.on("submit_action", async (data: unknown, ack) => {
    const parsed = validate(submitActionSchema, data, ack);
    if (!parsed) return;
    const { sessionId, action } = parsed;

    if (!await checkRateLimit(state.currentRateLimitId ?? socket.id, "action", 20, RATE_LIMIT_WINDOW_MS)) {
      ack?.({ success: false, error: "Rate limit exceeded" });
      return;
    }

    const cas = await withCasRetry(sessionId, (session) => {
      if (session.phase !== "orbit_action") return CAS_SKIP;
      const res = submitAction(session, socket.id, action as any);
      if (!res.accepted) return CAS_SKIP;
      return true as const;
    });

    if (!cas) {
      ack?.({ success: false, error: "Invalid action or wrong phase" });
      return;
    }

    ack?.({ success: true });
    phaseUpdate(io, sessionId, cas.session);
    await checkAndRunResolution(io, sessionId, cas.session);
  });

  // ── CAST VOTE ──
  socket.on("cast_vote", async (data: unknown, ack) => {
    const parsed = validate(castVoteSchema, data, ack);
    if (!parsed) return;
    const { sessionId, targetId } = parsed;

    let votingComplete = false;
    let voteResult: any;

    const cas = await withCasRetry(sessionId, (session) => {
      if (session.phase !== "voting") return CAS_SKIP;
      const res = castVote(session, socket.id, targetId);
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
      const res = startEmergencyVote(session, socket.id);
      if (!res.accepted) return CAS_SKIP;
      return res;
    });

    if (cas) {
      phaseUpdate(io, sessionId, cas.session);
      io.to(sessionId).emit("emergency_vote_started", { callerName: cas.result.callerName });
      chatSystemMessage(io, sessionId, "EMERGENCY VOTE INITIATED");
      ack?.({ success: true });
    }
  });

  socket.on("cast_emergency_vote", async (data: unknown, ack) => {
    const parsed = validate(castEmergencyVoteSchema, data, ack);
    if (!parsed) return;
    const { sessionId, vote } = parsed;

    let outcome: boolean | null = null;

    const cas = await withCasRetry(sessionId, (session) => {
      if (!session.emergencyVote?.active) return CAS_SKIP;
      const res = castEmergencyVote(session, socket.id, vote);
      outcome = res.outcome;
      return true as const;
    });

    if (cas) {
      phaseUpdate(io, sessionId, cas.session);
      if (outcome !== null) {
        io.to(sessionId).emit("emergency_vote_result", { passed: outcome });
      }
      ack?.({ success: true });
    }
  });

  // ── GAME LIFECYCLE ──
  socket.on("restart_game", async (data: unknown, ack) => {
    const parsed = validate(sessionOnlySchema, data, ack);
    if (!parsed) return;
    const { sessionId } = parsed;

    const cas = await withCasRetry(sessionId, (session) => {
      const player = session.players.find(p => p.id === socket.id);
      if (!player?.isHost) return CAS_SKIP;
      restartGame(session);
      return true as const;
    });

    if (cas) {
      phaseUpdate(io, sessionId, cas.session);
      chatSystemMessage(io, sessionId, "Systems rebooting... New game starting.");
      
      await logAudit({
        userId: state.currentUserId,
        eventType: "GAME_RESTART",
        description: `Host requested round reset in session ${sessionId}`,
        metadata: { sessionId },
      });

      ack?.({ success: true });
    }
  });

  socket.on("continue_game", async (data: unknown, ack) => {
    const parsed = validate(sessionOnlySchema, data, ack);
    if (!parsed) return;
    const { sessionId } = parsed;

    const cas = await withCasRetry(sessionId, (session) => {
      const player = session.players.find(p => p.id === socket.id);
      if (!player?.isHost) return CAS_SKIP;
      continueGame(session, socket.id);
      return true as const;
    });

    if (cas) {
      phaseUpdate(io, sessionId, cas.session);
      chatSystemMessage(io, sessionId, "Game resumed by host");
      ack?.({ success: true });
    }
  });

  socket.on("end_game", async (data: unknown, ack) => {
    const parsed = validate(sessionOnlySchema, data, ack);
    if (!parsed) return;
    const { sessionId } = parsed;

    const cas = await withCasRetry(sessionId, (session) => {
      const player = session.players.find(p => p.id === socket.id);
      if (!player?.isHost) return CAS_SKIP;
      endGame(session, socket.id);
      return true as const;
    });

    if (cas) {
      io.to(sessionId).emit("session_closed", { message: "The host has ended the session." });
      
      await logAudit({
        userId: state.currentUserId,
        eventType: "GAME_END",
        description: `Host terminated session ${sessionId}`,
        metadata: { sessionId },
      });

      ack?.({ success: true });
    }
  });

  socket.on("kick_player", async (data: unknown, ack) => {
    const parsed = validate(kickPlayerSchema, data, ack);
    if (!parsed) return;
    const { sessionId, targetPlayerId } = parsed;

    const cas = await withCasRetry(sessionId, (session) => {
      const player = session.players.find(p => p.id === socket.id);
      if (!player?.isHost) return CAS_SKIP;
      kickPlayer(session, socket.id, targetPlayerId);
      return true as const;
    });

    if (cas) {
      phaseUpdate(io, sessionId, cas.session);
      
      await logAudit({
        userId: state.currentUserId,
        eventType: "MOD_KICK_PLAYER",
        description: `Host ejected player from session ${sessionId}`,
        metadata: { sessionId, targetPlayerId },
      });

      ack?.({ success: true });
    }
  });
}


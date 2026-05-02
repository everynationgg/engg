import type { Server as SocketIOServer } from "socket.io";
import { recordPlayerGameResult } from "../../core/services/statsService.js";
import { logger } from "../../../lib/logger.js";
import { getSession, saveSession, CAS_MAX_ATTEMPTS, scheduleAdvanceTick, getGlobalTime } from "./sessions.js";
import { phaseUpdate } from "./emitters.js";
import {
  isGameFrozen,
  consumeJustUnfrozen,
  getActivePlayers,
  resolveRound,
  applyResolution,
  sortPlayersByStatus,
  autoCompleteOrbitActions,
  processRevealActions,
  startVoting,
  tallyVotes
} from "./engine.js";
import { syncUserAchievements } from "../../core/routes/achievements.js";
import { logAudit } from "../../../lib/audit.js";
import type { MaybeSession } from "./types.js";

export async function handleSaveConflict(
  io: SocketIOServer,
  sessionId: string,
): Promise<void> {
  logger.warn({ sessionId }, "Session save conflict — re-broadcasting latest state");
  const fresh = await getSession(sessionId);
  if (fresh) phaseUpdate(io, sessionId, fresh);
}

export async function recordGameResults(io: SocketIOServer, sessionId: string, voteResult: any, session: any) {
  try {
    const results = voteResult.allRoles;
    if (!results || !Array.isArray(results)) return;

    for (const player of results) {
      const userId = player.stablePlayerId;
      if (!userId) continue;

      const role = player.role;
      const socketId = player.playerId;
      const winTeam = voteResult.winTeam;

      let wonStatus: "yes" | "no" | "draw" = "no";

      if (winTeam === "tie") {
        wonStatus = "draw";
      } else {
        let playerTeam = "crew";
        const chaoticRoles = new Set(["disruptor", "shifter", "warper", "router"]);
        if (role === "alien" || role === "parasite" || role === "virus") {
          playerTeam = "alien";
        } else if (chaoticRoles.has(role)) {
          const alignment = session.chaoticAlignments?.[socketId] ?? "Good";
          playerTeam = (alignment === "Bad") ? "alien" : "crew";
        }

        wonStatus = (playerTeam === winTeam) ? "yes" : "no";
      }

      const recorded = await recordPlayerGameResult(
        sessionId,
        userId,
        role,
        wonStatus,
        session.chaoticAlignments?.[socketId]
      );

      if (!recorded) continue;

      const newAchievements = await syncUserAchievements(userId);
      if (newAchievements.length > 0) {
        const sock = io.sockets.sockets.get(socketId);
        if (sock) {
          sock.emit("achievements_unlocked", { count: newAchievements.length });
        }
      }
    }

    await logAudit({
      eventType: "GAME_RESULTS_RECORDED",
      description: `Outcome finalized for session ${sessionId}`,
      metadata: { sessionId, winTeam: voteResult.winTeam },
    });
  } catch (err) {
    logger.error({ err, sessionId }, "Failed to record game results");
  }
}

const MAX_PHASE_CONFIG: Record<string, number> = {
  role_reveal: 60_000,
  orbit_action: 120_000,
  orbit_resolution: 5_000,
  discussion: 300_000,
  voting: 90_000,
};

/**
 * The core game flow engine. Checks the current state and advances the game 
 * to the next phase if conditions are met (timer expired, actions completed, etc).
 */
export async function advanceGameFlow(
  io: SocketIOServer,
  sessionId: string,
  session: NonNullable<MaybeSession>,
): Promise<void> {
  // ── 0. LIFECYCLE & MONOTONICITY ───────────────────────────────────────────
  if (isGameFrozen(session)) return;
  if (consumeJustUnfrozen(session)) return;

  const now = getGlobalTime(session);
  const phaseStart = session.phaseStartedAt || 0;
  const timeInPhase = now - phaseStart;

  // ENSURE HEARTBEAT (Autonomous Driver)
  // The logic layer is now responsible for ensuring its own heartbeat loop is active.
  if (session.phase !== "lobby" && session.phase !== "result") {
    scheduleAdvanceTick(sessionId, 1000, async (fresh) => {
      await advanceGameFlow(io, sessionId, fresh);
    });
  }

  // ── 0.5 FALLBACK SAFETY ───────────────────────────────────────────────────
  // Hardened fallback: use phase-specific timeouts + buffer to detect stalls.
  const maxAllowed = MAX_PHASE_CONFIG[session.phase] || 300_000;
  const buffer = 10_000;
  if (timeInPhase > maxAllowed + buffer) {
    logger.warn({ sessionId, phase: session.phase, elapsed: timeInPhase }, "Driver: Smart fallback triggered — forcing evaluation");
    session.nextCheckAt = null;
  }

  // ── 1. EFFICIENCY GUARD (Tick Throttling) ──────────────────────────────────
  // If we have a scheduled 'nextCheckAt' and we haven't reached it, skip the heavy logic.
  // Exception: if phaseReady is false, we must check for stabilization (500ms).
  if (session.nextCheckAt && now < session.nextCheckAt && session.phaseReady) {
    return;
  }

  // ── 2. PHASE STABILIZATION (Global Guard) ──────────────────────────────────
  // Ensure every phase has a 500ms stabilization window where actions are blocked.
  if (!session.phaseReady && session.phase !== "lobby" && session.phase !== "result" && timeInPhase >= 500) {
    logger.info({ sessionId, phase: session.phase, elapsed: timeInPhase }, "Driver: Phase stabilized — unlocking interaction");
    session.phaseReady = true;
    session.nextCheckAt = null; // Clear throttle
    if (await saveSession(session)) {
      phaseUpdate(io, sessionId, session);
    }
    return;
  }

  // ── 3. PHASE PROGRESSION LOGIC ─────────────────────────────────────────────
  const activeCount = getActivePlayers(session).length;
  
  // ── PHASE: ROLE REVEAL ──
  if (session.phase === "role_reveal") {
    const REVEAL_TIMEOUT = 45_000;
    const allAck = session.roleAcknowledgements.length >= activeCount;
    
    if (allAck || timeInPhase > REVEAL_TIMEOUT) {
      logger.info({ sessionId, allAck, elapsed: timeInPhase }, "Driver: Advancing from ROLE_REVEAL");
      processRevealActions(session);
      session.phase = "orbit_action";
      session.phaseReady = false;
      session.phaseStartedAt = now;
      session.nextCheckAt = now + 500; // Next tick should check stabilization
      if (await saveSession(session)) {
        phaseUpdate(io, sessionId, session);
      }
    } else if (!session.nextCheckAt) {
      // Set throttle for the timeout
      session.nextCheckAt = phaseStart + REVEAL_TIMEOUT;
      await saveSession(session);
    }
    return;
  }

  // ── PHASE: ORBIT ACTION ──
  if (session.phase === "orbit_action") {
    const ORBIT_TIMEOUT_MS = 90_000;

    if (session.orbitCompleted.length < activeCount) {
      if (timeInPhase > ORBIT_TIMEOUT_MS) {
        logger.info({ sessionId, elapsed: timeInPhase }, "Driver: Orbit timeout — auto-completing AFK players");
        autoCompleteOrbitActions(session);
      } else {
        // Set throttle for timeout check if not set
        if (!session.nextCheckAt) {
          session.nextCheckAt = phaseStart + ORBIT_TIMEOUT_MS;
          await saveSession(session);
        }
        return;
      }
    }

    // Transition to resolution
    logger.info({ sessionId }, "Driver: All orbit actions in — advancing to ORBIT_RESOLUTION");
    session.phase = "orbit_resolution";
    session.phaseReady = false;
    session.phaseStartedAt = now;
    session.nextCheckAt = now + 1200; // Cinematic delay
    if (await saveSession(session)) {
      phaseUpdate(io, sessionId, session);
    }
    return;
  }

  // ── PHASE: ORBIT RESOLUTION (Cinematic Delay) ──
  if (session.phase === "orbit_resolution") {
    const RESOLUTION_DELAY = 1200;
    if (timeInPhase >= RESOLUTION_DELAY) {
      logger.info({ sessionId }, "Driver: Cinematic delay complete — resolving round state");
      
      for (let attempt = 1; attempt <= CAS_MAX_ATTEMPTS; attempt++) {
        const current = await getSession(sessionId);
        if (!current || current.phase !== "orbit_resolution") return;
        
        const resolutionResult = resolveRound(current);
        applyResolution(current, resolutionResult);
        
        current.phase = "discussion";
        current.phaseReady = false;
        current.phaseStartedAt = now;
        current.nextCheckAt = now + 500; // Stabilization check

        if (await saveSession(current)) {
          phaseUpdate(io, sessionId, current);
          return;
        }
      }
    } else if (!session.nextCheckAt) {
      session.nextCheckAt = phaseStart + RESOLUTION_DELAY;
      await saveSession(session);
    }
    return;
  }

  // ── PHASE: DISCUSSION ──
  if (session.phase === "discussion") {
    const discussionTime = (session.settings?.discussionTime || 120) * 1000;

    if (timeInPhase >= discussionTime) {
      logger.info({ sessionId, elapsed: timeInPhase }, "Driver: Discussion expired — starting VOTING");
      startVoting(session, now);
      session.phase = "voting";
      session.phaseReady = false;
      session.phaseStartedAt = now;
      session.nextCheckAt = now + 500; // Stabilization check
      if (await saveSession(session)) {
        phaseUpdate(io, sessionId, session);
      }
    } else if (!session.nextCheckAt) {
      session.nextCheckAt = phaseStart + discussionTime;
      await saveSession(session);
    }
    return;
  }

  // ── PHASE: VOTING ──
  if (session.phase === "voting") {
    const VOTING_TIMEOUT = 45_000;
    const voteCount = Object.keys(session.votes).length;

    if (voteCount >= activeCount || timeInPhase > VOTING_TIMEOUT) {
      logger.info({ sessionId, voteCount, elapsed: timeInPhase }, "Driver: Advancing from VOTING to RESULT");
      const voteResult = tallyVotes(session);
      session.voteResult = voteResult;
      session.phase = "result";
      session.phaseReady = true; 
      session.phaseStartedAt = now;
      session.nextCheckAt = null; // No more auto-advances
      
      if (await saveSession(session)) {
        phaseUpdate(io, sessionId, session);
        await recordGameResults(io, sessionId, voteResult, session);
      }
    } else if (!session.nextCheckAt) {
      session.nextCheckAt = phaseStart + VOTING_TIMEOUT;
      await saveSession(session);
    }
  }
}

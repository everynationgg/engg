import type { Server as SocketIOServer } from "socket.io";
import { recordPlayerGameResult } from "../services/statsService.js";
import { logger } from "../lib/logger.js";
import { getSession, saveSession, CAS_MAX_ATTEMPTS } from "../sessions.js";
import { phaseUpdate } from "./emitters.js";
import { 
  isGameFrozen, 
  consumeJustUnfrozen, 
  getActivePlayers, 
  resolveRound, 
  applyResolution,
  sortPlayersByStatus
} from "../modules/game/game.engine.js";
import { syncUserAchievements } from "../routes/achievements.js";
import { logAudit } from "../lib/audit.js";
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

export async function checkAndRunResolution(
  io: SocketIOServer,
  sessionId: string,
  session: NonNullable<MaybeSession>,
): Promise<void> {
  if (session.phase !== "orbit_action") return;
  if (isGameFrozen(session)) return;
  if (consumeJustUnfrozen(session)) return;
  const activeCount = getActivePlayers(session).length;
  if (session.orbitCompleted.length < activeCount) return;

  phaseUpdate(io, sessionId, session);
  session.phase = "orbit_resolution";

  if (!await saveSession(session)) {
    logger.warn({ sessionId }, "Failed to persist orbit_resolution phase — aborting resolution run");
    const fresh = await getSession(sessionId);
    if (fresh) phaseUpdate(io, sessionId, fresh);
    return;
  }

  phaseUpdate(io, sessionId, session);

  setTimeout(async () => {
    try {
      for (let attempt = 1; attempt <= CAS_MAX_ATTEMPTS; attempt++) {
        const current = await getSession(sessionId);
        if (!current || (current.phase !== "orbit_resolution" && current.phase !== "orbit_action")) {
          return;
        }

        if (isGameFrozen(current)) {
          logger.info({ sessionId }, "Resolution aborted — game frozen during delay");
          return;
        }

        const resolutionResult = resolveRound(current);
        applyResolution(current, resolutionResult);

        if (await saveSession(current)) {
           // Success logic moved to individual handlers or emitters if needed
           // For now keeping it simple as it was in socket.ts
           phaseUpdate(io, sessionId, current);

           await logAudit({
             eventType: "GAME_ROUND_RESOLVED",
             description: `Round resolution finalized for session ${sessionId}`,
             metadata: { sessionId },
           });

           return;
        }
      }
    } catch (err) {
      logger.error({ err, sessionId }, "Critical failure during round resolution");
    }
  }, 1200);
}

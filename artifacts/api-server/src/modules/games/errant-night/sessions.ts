// Re-export core game types from the engine — single source of truth
export type {
  Player,
  PlayerConnectionStatus,
  GamePhase as Phase,
  PlayerAction as OrbitAction,
  EmergencyVoteState,
  VoteResult,
  AbilityLogEntry,
  VoteTallyEntry,
  VoteCount,
  RoundSummary,
  GameState as Session,
} from "./engine.js";

import { addPlayer, trimState } from "./engine.js";
import type {
  Player,
  GameState as Session,
  EmergencyVoteState,
  RoundSummary,
} from "./engine.js";
import { randomUUID } from "node:crypto";
import { logger } from "../../../lib/logger.js";

const INSTANCE_ID = randomUUID();

export async function syncGlobalTime() {
  // No-op for in-memory
}

export function getGlobalTime(session?: Session): number {
  return Date.now();
}

export type VersionedSession = Session & { __v: number };

const disconnectTimers = new Map<string, NodeJS.Timeout>();
const advanceTimers = new Map<string, NodeJS.Timeout>();

export const CAS_MAX_ATTEMPTS = 3;

export const sessionMetrics = {
  casConflicts: 0,
  casRetries: 0,
  lockAcquisitions: 0,
  lockTimeouts: 0,
  redisOpsInFlight: 0,
  redisErrors: 0,
  sessionCacheHits: 0,
  getSessionTotal: 0,
  getSessionLatencyMsSum: 0,
  saveSessionTotal: 0,
  saveSessionLatencyMsSum: 0,
};

export const CAS_SKIP = Symbol("CAS_SKIP");

export function isRedisOverloaded(): boolean {
  return false;
}

export const sessionCache = new Map<string, VersionedSession>();
let _redisState: "healthy" | "degraded" = "healthy";

export function getRedisState(): "healthy" | "degraded" {
  return _redisState;
}

function cacheWrite(session: VersionedSession): void {
  sessionCache.set(session.sessionId, session);
}

// Deep clone to prevent accidental mutations outside of CAS loop
function cloneSession(session: VersionedSession): VersionedSession {
  return JSON.parse(JSON.stringify(session)) as VersionedSession;
}

export async function getSession(sessionId: string): Promise<VersionedSession | undefined> {
  const t0 = Date.now();
  sessionMetrics.getSessionTotal++;
  const cached = sessionCache.get(sessionId);
  sessionMetrics.getSessionLatencyMsSum += Date.now() - t0;
  if (cached) {
    return cloneSession(cached);
  }
  return undefined;
}

export function assertStateInvariants(session: Session) {
  const now = getGlobalTime(session);
  if (session.phaseStartedAt && session.phaseStartedAt > now + 1000) {
    throw new Error(`Invariant Violated: phaseStartedAt is in the future (${session.phaseStartedAt} > ${now})`);
  }
  if (session.heartbeatFencingToken && session.heartbeatFencingToken < 0) {
    throw new Error("Invariant Violated: fencing token cannot be negative");
  }
  if (!session.phaseReady && session.phase === "result") {
    throw new Error("Invariant Violated: result phase must always be ready");
  }
}

async function markSessionCorrupt(session: Session, reason: string): Promise<void> {
  session.health = "corrupt";
  session.invariantFailures = (session.invariantFailures || 0) + 1;
  session.lastUpdateBy = `${INSTANCE_ID}:emergency`;
  
  const vSession = session as VersionedSession;
  cacheWrite(cloneSession(vSession));
  logger.error({ sessionId: session.sessionId, reason }, "Driver: Session marked CORRUPT");
}

export async function saveSession(session: VersionedSession): Promise<boolean> {
  session.lastGlobalNow = getGlobalTime(session);
  trimState(session);

  try {
    assertStateInvariants(session);
  } catch (err) {
    await markSessionCorrupt(session, err instanceof Error ? err.message : String(err));
    return false;
  }

  const t0 = Date.now();
  sessionMetrics.saveSessionTotal++;

  session.lastUpdateBy = INSTANCE_ID;

  const current = sessionCache.get(session.sessionId);
  
  // If no session exists in cache, we just save it (new session).
  if (current) {
    if (current.__v !== session.__v) {
      sessionMetrics.casConflicts++;
      logger.warn(
        { sessionId: session.sessionId, expectedVersion: session.__v, currentVersion: current.__v },
        "Session save conflict — version mismatch",
      );
      return false;
    }
  }

  session.__v += 1;
  cacheWrite(cloneSession(session));
  
  sessionMetrics.saveSessionLatencyMsSum += Date.now() - t0;
  return true;
}

export async function deleteSession(sessionId: string): Promise<void> {
  sessionCache.delete(sessionId);
}

export async function withCasRetry<R>(
  sessionId: string,
  mutate: (session: VersionedSession) => R | typeof CAS_SKIP | Promise<R | typeof CAS_SKIP>,
  maxAttempts = CAS_MAX_ATTEMPTS,
): Promise<{ session: VersionedSession; result: R } | null> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const session = await getSession(sessionId);
    if (!session) return null;

    const result = await mutate(session);
    if (result === CAS_SKIP) return null;

    const saved = await saveSession(session);
    if (saved) return { session, result: result as R };

    try {
      assertStateInvariants(session);
    } catch (invErr) {
      logger.error({ sessionId, attempt, err: invErr }, "CAS Abort: Invariant violation during mutation");
      return null;
    }

    logger.warn({ sessionId, attempt, maxAttempts }, "CAS conflict in withCasRetry — retrying");
    session.casRetriesCount = Math.min((session.casRetriesCount || 0) + 1, 100_000);
    if (attempt < maxAttempts) {
      sessionMetrics.casRetries++;
      await new Promise<void>((r) => setTimeout(r, 10 * attempt));
    }
  }
  return null;
}

export async function acquireSessionLock(sessionId: string): Promise<() => Promise<void>> {
  // In a single-instance environment, async interleavings are handled by CAS.
  // We return a no-op lock.
  sessionMetrics.lockAcquisitions++;
  return async () => {};
}

export function freshEmergencyVote(): EmergencyVoteState {
  return { active: false, callerId: null, callerName: null, yesVoters: [], noVoters: [], cooldownUntil: null };
}

export function freshRoundSummary(): RoundSummary {
  return { abilityLog: [], voteTally: [], voteCounts: [] };
}

export function createSession(sessionId: string, hostPlayer: Player): VersionedSession {
  return {
    sessionId,
    settings: {
      anonymousVoting: false,
      blindEjections: false,
      discussionTime: 60,
      votingTime: 30,
    },
    phase: "lobby",
    players: [hostPlayer],
    rolesAssigned: {},
    initialRoles: {},
    centerCards: [],
    roleCounts: {},
    unlockedRoles: [],
    orbitActions: {},
    orbitCompleted: [],
    orbitFeedback: {},
    roleAcknowledgements: [],
    phaseReady: true,
    phaseStartedAt: Date.now(),
    emergencyVote: freshEmergencyVote(),
    votes: {},
    chaoticAlignments: {},
    voteResult: null,
    roundSummary: freshRoundSummary(),
    createdAt: Date.now(),
    kickedPlayerIds: [],
    playersInGrace: [],
    hostEndedInterrupt: undefined,
    status: "active",
    joinable: true,
    revealActions: {},
    revealCompleted: [],
    jammedPlayerId: null,
    hijackedTargets: {},
    anesthetizedPlayers: [],
    justUnfrozen: false,
    __v: 0,
  };
}

export function addPlayerToSession(
  session: Session,
  player: Player,
): { success: boolean; isReconnect: boolean; error?: string } {
  return addPlayer(session, player);
}

export function removePlayerFromSession(
  session: VersionedSession,
  playerId: string,
): VersionedSession | null {
  session.players = session.players.filter((p) => (p.playerId || p.id) !== playerId);
  delete session.rolesAssigned[playerId];
  delete session.initialRoles[playerId];
  delete session.orbitActions[playerId];
  delete session.orbitFeedback[playerId];
  delete session.votes[playerId];
  session.orbitCompleted = session.orbitCompleted.filter((id) => id !== playerId);
  session.roleAcknowledgements = session.roleAcknowledgements.filter((id) => id !== playerId);
  
  if (session.players.length === 0) return null;
  return session;
}

export function scheduleRemovePlayer(
  sessionId: string,
  playerId: string,
  playerName: string,
  delayMs: number,
  onExpire: (session: VersionedSession | null) => void,
) {
  const key = `${sessionId}:${playerId}`;
  if (disconnectTimers.has(key)) return;
  const timer = setTimeout(async () => {
    disconnectTimers.delete(key);
    for (let attempt = 1; attempt <= CAS_MAX_ATTEMPTS; attempt++) {
      const session = await getSession(sessionId);
      if (!session) { onExpire(null); return; }

      const result = removePlayerFromSession(session, playerId);
      if (!result) {
        await deleteSession(sessionId);
        onExpire(null);
        return;
      }

      const saved = await saveSession(session);
      if (saved) { onExpire(session); return; }

      logger.warn({ sessionId, playerId, attempt }, "CAS conflict during player removal — retrying");
      if (attempt < CAS_MAX_ATTEMPTS) {
        sessionMetrics.casRetries++;
        await new Promise<void>((r) => setTimeout(r, 10 * attempt));
      }
    }
    logger.warn({ sessionId, playerId }, "Player removal CAS exhausted");
    onExpire(await getSession(sessionId) ?? null);
  }, delayMs);
  disconnectTimers.set(key, timer);
}

export function cancelRemovePlayer(sessionId: string, playerId: string) {
  const key = `${sessionId}:${playerId}`;
  const timer = disconnectTimers.get(key);
  if (timer) {
    clearTimeout(timer);
    disconnectTimers.delete(key);
  }
}

export function scheduleGraceExpiry(
  sessionId: string,
  playerId: string,
  delayMs: number,
  onExpire: () => void,
) {
  const key = `${sessionId}:${playerId}`;
  if (disconnectTimers.has(key)) return;
  const timer = setTimeout(() => {
    disconnectTimers.delete(key);
    onExpire();
  }, delayMs);
  disconnectTimers.set(key, timer);
}

export async function ensureHeartbeatActive(
  sessionId: string, 
  onTick: (session: VersionedSession) => Promise<void>
) {
  if (advanceTimers.has(sessionId)) return;

  const runLoop = async () => {
    if (!advanceTimers.has(sessionId)) return;
    
    try {
      const session = await getSession(sessionId);
      if (!session || session.phase === "lobby" || session.phase === "result") {
        stopHeartbeat(sessionId);
        return;
      }

      if (session.health === "corrupt") {
        stopHeartbeat(sessionId);
        return;
      }

      try {
        await onTick(session);
      } catch (err) {
        logger.error({ sessionId, err }, "Heartbeat logic failed");
      }

      if (advanceTimers.has(sessionId)) {
        const loopNow = getGlobalTime();
        const nextCheck = session.nextCheckAt || (loopNow + 1000);
        let delay = Math.min(Math.max(nextCheck - loopNow, 100), 5000);
        
        const timer = setTimeout(runLoop, delay);
        advanceTimers.set(sessionId, timer);
      }
    } catch (err) {
      logger.error({ sessionId, err }, "Critical heartbeat error — retrying");
      const timer = setTimeout(runLoop, 1000);
      advanceTimers.set(sessionId, timer);
    }
  };

  advanceTimers.set(sessionId, null as any); 
  runLoop();
}

export function scheduleAdvanceTick(sessionId: string, _delayMs: number, onTick: (session: VersionedSession) => Promise<void>) {
  ensureHeartbeatActive(sessionId, onTick);
}

export function stopHeartbeat(sessionId: string) {
  const timer = advanceTimers.get(sessionId);
  if (timer) {
    clearTimeout(timer);
    advanceTimers.delete(sessionId);
  }
}

export function cancelAdvanceTick(sessionId: string) {
  stopHeartbeat(sessionId);
}

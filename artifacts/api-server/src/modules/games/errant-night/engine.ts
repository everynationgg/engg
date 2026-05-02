/**
 * Game Engine — pure, deterministic game logic for Errant Night.
 *
 * This module contains ALL gameplay logic extracted from socket.ts and
 * resolution.ts. It is completely independent of Socket.IO, Express, and
 * the database layer so that every function can be unit-tested in isolation.
 *
 * Rules:
 *  - Functions return new/updated state; mutations are clearly documented.
 *  - No side-effects (no I/O, no timers, no randomness except where noted).
 * */

import { randomUUID } from "node:crypto";

// ═══════════════════════════════════════════════════════════════════════════════
// Core Types
// ═══════════════════════════════════════════════════════════════════════════════

export type PlayerConnectionStatus = "connected" | "reconnecting" | "disconnected";

export interface Player {
  id: string;
  name: string;
  isHost: boolean;
  isSpectator?: boolean;
  userId?: string;
  /** Stable persistent identity supplied by the client (stored in localStorage). */
  playerId?: string;
  /** Whether the player currently has an active socket connection. */
  connected?: boolean;
  /** Whether the player is currently alive in the active round. */
  alive?: boolean;
  /** Real-time connection status for presence UI. */
  connectionStatus?: PlayerConnectionStatus;
  /** Set to true when the player explicitly quits (bypasses grace). */
  didQuit?: boolean;
}

export type GamePhase =
  | "lobby"
  | "role_config"
  | "role_reveal"
  | "orbit_action"
  | "orbit_resolution"
  | "orbit_result"
  | "discussion"
  | "voting"
  | "result"
  | "interrupted";

export interface GameSettings {
  anonymousVoting: boolean;
  blindEjections: boolean;
  discussionTime: number;
  votingTime: number;
}

export interface PlayerAction {
  type: string;
  targets: string[];
  alignment?: "Good" | "Bad";
}

export interface EmergencyVoteState {
  active: boolean;
  callerId: string | null;
  callerName: string | null;
  yesVoters: string[];
  noVoters: string[];
  cooldownUntil: number | null;
}

export interface VoteResult {
  eliminatedId: string | null; // Now using playerId
  eliminatedName: string | null;
  eliminatedRole: string | null;
  winTeam: "crew" | "alien" | "tie";
  allRoles: {
    playerId: string; // Persistent UUID
    socketId?: string; // Current ephemeral connection ID
    playerName: string;
    role: string;
    initialRole: string;
    alive: boolean;
    alignment?: "Good" | "Bad"
  }[];
  centerCards: string[];
}

export interface AbilityLogEntry {
  actorName: string;
  event: string;
}

export interface VoteTallyEntry {
  voterName: string;
  targetName: string;
  isCommander: boolean;
  isAbstain: boolean;
}

export interface VoteCount {
  playerName: string;
  votes: number;
}

export interface RoundSummary {
  abilityLog: AbilityLogEntry[];
  voteTally: VoteTallyEntry[];
  voteCounts: VoteCount[];
}

export interface PrivateFeedback {
  type:
  | "blocked"
  | "disrupt_ineffective"
  | "disrupt_success"
  | "scan_player"
  | "scan_deck"
  | "alien_view"
  | "seek_result"
  | "sentinel_report"
  | "commander_boost"
  | "warper_swap"
  | "shifter_exchange"
  | "virus_result"
  | "router_result"
  | "doctor_result"
  | "skipped"
  | "no_action"
  | "passive"
  | "no_ability";
  data?: unknown;
}

/**
 * GameState is the single source of truth for an in-progress game.
 * It mirrors the existing Session interface so the transition is seamless.
 */
export interface GameState {
  sessionId: string;
  settings: GameSettings;
  phase: GamePhase;
  phaseStartedAt: number | null;
  phaseReady: boolean;
  players: Player[];
  rolesAssigned: Record<string, string>; // Moving to playerId
  initialRoles: Record<string, string>;  // Moving to playerId
  centerCards: string[];
  roleCounts: Record<string, number>;
  unlockedRoles: string[];
  orbitActions: Record<string, PlayerAction>;
  orbitCompleted: string[];
  orbitFeedback: Record<string, { type: string; data?: unknown }>;
  roleAcknowledgements: string[];
  revealActions: Record<string, PlayerAction>;
  revealCompleted: string[];
  jammedPlayerId: string | null;
  hijackedTargets: Record<string, string>; // actorId -> targetId
  emergencyVote: EmergencyVoteState;
  votes: Record<string, string>;
  chaoticAlignments: Record<string, "Good" | "Bad">;
  voteResult: VoteResult | null;
  anesthetizedPlayers: string[];
  roundSummary: RoundSummary;
  createdAt: number;
  /** Stable playerIds (UUIDs) that have been kicked — these players cannot rejoin. */
  kickedPlayerIds: string[];
  /** The phase the game was in before being interrupted (for resume). */
  interruptedFromPhase?: GamePhase;
  /** Socket IDs of players whose reconnect grace timers are currently active. */
  playersInGrace?: string[];
  /** Set to true when the host triggers restart or end from the interrupted state. Prevents auto-resume. */
  hostEndedInterrupt?: boolean;
  /** Session lifecycle status. "closed" means the host quit and no further actions are allowed. */
  status?: "active" | "closed";
  /** Whether new players can join this session. Set to false when status is "closed". */
  joinable?: boolean;
  /** Set to true when playersInGrace becomes empty (grace period ends). Consumed by the next resolution check to prevent immediate phase progression. */
  justUnfrozen?: boolean;
  /** Scheduled timestamp for the next automated phase check. */
  nextCheckAt?: number | null;
  /** The unique ID of the server instance currently driving this session's heartbeat. */
  heartbeatOwnerId?: string | null;
  /** Monotonic version counter for the distributed heartbeat lease (fencing token). */
  heartbeatFencingToken?: number;
  /** Last successful heartbeat tick timestamp. */
  lastHeartbeatAt?: number | null;
  /** Audit field: ID of the server instance that performed the last successful write. */
  lastUpdateBy?: string | null;
  /** The last cluster-synchronized time seen by this session. Used to enforce cluster-wide monotonicity. */
  lastGlobalNow?: number;
  /** Structured health signal for the session state. */
  health?: "healthy" | "degraded" | "corrupt";
  /** Total count of invariant failures encountered by this session. */
  invariantFailures?: number;
  /** Cumulative count of CAS version conflicts (write contention). */
  casRetriesCount?: number;
  /** Cumulative count of leadership failovers (lease churn). */
  leaseChurnCount?: number;
  /** Number of consecutive heartbeat ticks that passed without timing anomalies. */
  consecutiveHealthyTicks?: number;
  /** Timestamp of the last detected timing or coordination anomaly. Used for stabilization tracking. */
  lastAnomalyAt?: number | null;
  /** Last successful phase transition timestamp. */
  lastTransitionAt?: number | null;
}

/**
 * State Lifecycle Management: Trims large/obsolete fields to prevent Redis payload growth.
 */
export function trimState(session: GameState) {
  // 1. Cap ability logs within the current round summary if they grow excessively
  if (session.roundSummary?.abilityLog && session.roundSummary.abilityLog.length > 100) {
    session.roundSummary.abilityLog = session.roundSummary.abilityLog.slice(-100);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// Identity Mapping Helpers
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Resolves a stable playerId from an ephemeral socket.id.
 */
export function getPlayerIdBySocketId(state: GameState, socketId: string): string | null {
  return state.players.find(p => p.id === socketId)?.playerId || null;
}

/**
 * Resolves an ephemeral socket.id from a stable playerId.
 */
export function getSocketIdByPlayerId(state: GameState, playerId: string): string | null {
  return state.players.find(p => p.playerId === playerId)?.id || null;
}

/**
 * Normalizes an identifier (either socketId or playerId) into a stable playerId.
 * Useful during transition phase where inputs might be mixed.
 */
export function normalizeToPlayerId(state: GameState, id: string): string | null {
  // If it's already a valid playerId in the system, return it
  if (state.players.some(p => p.playerId === id)) return id;
  // Otherwise, try to resolve it from socket.id
  return getPlayerIdBySocketId(state, id);
}

// ═══════════════════════════════════════════════════════════════════════════════
// Result types — returned by engine functions so callers know what happened
// ═══════════════════════════════════════════════════════════════════════════════

export interface ActionResult {
  /** Whether the action was accepted */
  accepted: boolean;
  /** Whether all players have submitted and resolution should be triggered */
  allSubmitted: boolean;
  error?: string;
}

export interface VoteCastResult {
  accepted: boolean;
  /** When true the voting phase is complete — caller should broadcast result */
  votingComplete: boolean;
  voteResult?: VoteResult;
  roundSummary?: RoundSummary;
  error?: string;
}

export interface EmergencyVoteStartResult {
  accepted: boolean;
  callerName?: string;
  error?: string;
}

export interface EmergencyVoteCastResult {
  accepted: boolean;
  /** null = still in progress, true = passed, false = denied */
  outcome: boolean | null;
  error?: string;
}

export interface ResolutionResult {
  feedback: Record<string, PrivateFeedback>;
  abilityLog: AbilityLogEntry[];
}

export interface AcknowledgeRoleResult {
  accepted: boolean;
  orbitInfo: { type: string; data?: unknown };
  /** When true all players acknowledged — phase advanced to orbit_action */
  allAcknowledged: boolean;
  /** Auto-submitted passive actions (crew, parasite) — only present when allAcknowledged */
  autoActions?: Array<{ playerId: string; roleId: string; action: PlayerAction }>;
  /** Whether all actions are already submitted after auto-completing passives */
  allSubmitted?: boolean;
  error?: string;
}

export interface KickPlayerResult {
  accepted: boolean;
  error?: string;
  /** The kicked player's socket.id — used by the caller to clean up the socket. */
  kickedSocketId?: string;
  kickedPlayerName?: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════════════════════════════════════

const PASSIVE_ROLE_IDS = new Set<string>([]); // All roles must manually acknowledge as requested

/** Strict resolution order for ability processing. */
const ROLE_ORDER = [
  "doctor",
  "virus",
  "router",
  "sentinel",
  "scanner",
  "alien",
  "disruptor",
  "parasite",
  "commander",
  "warper",
  "shifter",
  "seeker",
];

// ═══════════════════════════════════════════════════════════════════════════════
// Helpers (internal)
// ═══════════════════════════════════════════════════════════════════════════════

function freshEmergencyVote(): EmergencyVoteState {
  return { active: false, callerId: null, callerName: null, yesVoters: [], noVoters: [], cooldownUntil: null };
}

/**
 * Return only the players who currently have an active socket connection.
 * ALL game-progress checks (voting completion, action submission, acknowledgements,
 * emergency votes) must use this instead of `state.players.length` so that
 * disconnected/reconnecting players never block game flow.
 */
export function getActivePlayers(state: GameState): Player[] {
  // Only non-spectators are considered active for game logic.
  // We include "reconnecting" players to prevent premature phase transitions
  // during brief network instability.
  return state.players.filter((p) => 
    !p.isSpectator && 
    (p.connectionStatus === "connected" || p.connectionStatus === "reconnecting")
  );
}

function freshRoundSummary(): RoundSummary {
  return { abilityLog: [], voteTally: [], voteCounts: [] };
}

function commanderVoteWeight(state: GameState, voterId: string): number {
  const pId = normalizeToPlayerId(state, voterId);
  if (!pId) return 1;

  const voterRole = state.rolesAssigned[pId];
  if (voterRole !== "commander") return 1;
  const feedback = state.orbitFeedback[pId] as { type: string } | undefined;
  return feedback?.type === "commander_boost" ? 2 : 1;
}

/**
 * Consume the justUnfrozen flag. Returns true if the flag was set,
 * meaning the caller should abort its current resolution/transition
 * to prevent instant phase skipping after a reconnect.
 */
export function consumeJustUnfrozen(state: GameState): boolean {
  if (state.justUnfrozen) {
    state.justUnfrozen = false;
    return true;
  }
  return false;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Core Engine Functions
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Create initial game state for a new session.
 *
 * NOTE: this mutates nothing — returns a fresh GameState object.
 */
export function createGame(sessionId: string, hostPlayer: Player): GameState {
  return {
    sessionId,
    settings: {
      anonymousVoting: false,
      blindEjections: false,
      discussionTime: 120,
      votingTime: 60,
    },
    phase: "lobby",
    phaseReady: true,
    players: [{ ...hostPlayer, alive: true }],
    rolesAssigned: {},
    initialRoles: {},
    centerCards: [],
    roleCounts: {},
    unlockedRoles: [],
    orbitActions: {},
    orbitCompleted: [],
    orbitFeedback: {},
    roleAcknowledgements: [],
    phaseStartedAt: Date.now(),
    revealActions: {},
    revealCompleted: [],
    jammedPlayerId: null,
    hijackedTargets: {},
    emergencyVote: freshEmergencyVote(),
    votes: {},
    chaoticAlignments: {},
    anesthetizedPlayers: [],
    voteResult: null,
    roundSummary: freshRoundSummary(),
    createdAt: Date.now(),
    kickedPlayerIds: [],
    playersInGrace: [],
    hostEndedInterrupt: undefined,
    justUnfrozen: undefined,
    status: "active",
    joinable: true,
    nextCheckAt: null,
    heartbeatOwnerId: null,
    heartbeatFencingToken: 0,
    lastHeartbeatAt: null,
    lastUpdateBy: null,
    lastGlobalNow: 0,
    health: "healthy",
    invariantFailures: 0,
    casRetriesCount: 0,
    leaseChurnCount: 0,
    consecutiveHealthyTicks: 0,
    lastAnomalyAt: null,
    lastTransitionAt: null,
  };
}

/**
 * Start a game: shuffles the role pool, assigns roles to players, sets
 * center cards, and advances phase to role_reveal.
 *
 * MUTATION: modifies `state` in place for compatibility with the existing
 * session store. Returns the same reference.
 *
 * NOTE: uses Math.random() for the Fisher-Yates shuffle — the only
 * non-deterministic operation in the engine. Callers can inject a seeded
 * RNG via the optional `rng` parameter for reproducible tests.
 * The `rng` function must return values in [0, 1) (same contract as Math.random).
 */
export function startGame(
  state: GameState,
  roleCounts: Record<string, number>,
  settings: GameSettings,
  rng: () => number = Math.random,
): GameState {
  const pool: string[] = [];
  for (const [roleId, count] of Object.entries(roleCounts)) {
    if (roleId === "spectator") continue; // Spectators not allowed in randomized pool
    for (let i = 0; i < count; i++) pool.push(roleId);
  }

  // Fisher-Yates shuffle
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  state.rolesAssigned = {};
  let roleIdx = 0;
  state.players.forEach((player) => {
    // RESOLVE STABLE IDENTITY
    // If a player somehow lacks a playerId, we assign one now to ensure
    // their role is keyed to a persistent identity, not an ephemeral socket ID.
    if (!player.playerId) {
      player.playerId = randomUUID();
      console.warn(`[startGame] Assigned new stable identity to player ${player.name}: ${player.playerId}`);
    }
    const targetKey = player.playerId;

    // Only assign roles to players who are NOT spectators.
    // If they joined as a spectator, they stay a spectator.
    if (!player.isSpectator) {
      state.rolesAssigned[targetKey] = pool[roleIdx++] ?? pool[0];
      player.alive = true;
    } else {
      state.rolesAssigned[targetKey] = "spectator";
      player.alive = false; // Spectators aren't "alive" in game terms
    }
  });
  state.initialRoles = { ...state.rolesAssigned };
  const participantCount = state.players.filter(p => !p.isSpectator).length;
  state.centerCards = pool.slice(participantCount);
  state.roleCounts = { ...roleCounts };
  state.settings = { ...settings };

  // Reset round state
  state.orbitActions = {};
  state.orbitCompleted = [];
  state.roleAcknowledgements = [];
  state.revealActions = {};
  state.revealCompleted = [];
  state.jammedPlayerId = null;
  state.hijackedTargets = {};
  state.emergencyVote = freshEmergencyVote();
  state.votes = {};
  state.anesthetizedPlayers = [];
  state.voteResult = null;
  state.roundSummary = freshRoundSummary();
  state.orbitFeedback = {};
  state.phase = "role_reveal";
  state.phaseStartedAt = Date.now();
  state.phaseReady = false;
  return state;
}

/**
 * Record a player's acknowledgement of their revealed role.
 *
 * When all players have acknowledged, the phase advances to orbit_action
 * and passive roles are auto-submitted.
 *
 * MUTATION: modifies `state` in place.
 */
export function acknowledgeRole(
  state: GameState,
  id: string, // socketId or playerId
  revealAction?: PlayerAction,
): AcknowledgeRoleResult {
  const playerId = normalizeToPlayerId(state, id);
  if (!playerId) {
    return { accepted: false, orbitInfo: { type: "none" }, allAcknowledged: false, error: "player identity could not be resolved" };
  }

  if (state.phase !== "role_reveal") {
    return { accepted: false, orbitInfo: { type: "none" }, allAcknowledged: false, error: "wrong phase" };
  }
  const player = state.players.find((p) => p.playerId === playerId);
  if (!player || player.isSpectator) {
    return { accepted: false, orbitInfo: { type: "none" }, allAcknowledged: false, error: "Spectators cannot acknowledge roles" };
  }

  if (!state.roleAcknowledgements.includes(playerId)) {
    state.roleAcknowledgements.push(playerId);
  }
  if (revealAction) {
    const roleId = state.rolesAssigned[playerId];

    // ROLE AUTHORITY VALIDATION (Reveal Phase)
    if (roleId === "doctor" && revealAction.type !== "anesthetize") {
      return { accepted: false, orbitInfo: { type: "none" }, allAcknowledged: false, error: "invalid doctor action" };
    }
    if (roleId === "virus" && revealAction.type !== "packet_loss") {
      return { accepted: false, orbitInfo: { type: "none" }, allAcknowledged: false, error: "invalid virus action" };
    }
    if (roleId === "router" && revealAction.type !== "gateway_hijack") {
      return { accepted: false, orbitInfo: { type: "none" }, allAcknowledged: false, error: "invalid router action" };
    }
    if (roleId !== "doctor" && roleId !== "virus" && roleId !== "router" && roleId !== "chaotic") {
      return { accepted: false, orbitInfo: { type: "none" }, allAcknowledged: false, error: "unauthorized reveal action" };
    }

    // Prevent reveal-phase roles (Virus, Router) from targeting spectators
    const resolvedTargets: string[] = [];
    for (const tId of (revealAction.targets || [])) {
      const tPlayerId = normalizeToPlayerId(state, tId);
      if (!tPlayerId) {
        return { accepted: false, orbitInfo: { type: "none" }, allAcknowledged: false, error: "invalid target identity" };
      }
      const targetPlayer = state.players.find(p => p.playerId === tPlayerId);
      if (targetPlayer && targetPlayer.isSpectator) {
        return { accepted: false, orbitInfo: { type: "none" }, allAcknowledged: false, error: "cannot target spectators" };
      }
      resolvedTargets.push(tPlayerId);
    }
    state.revealActions[playerId] = { ...revealAction, targets: resolvedTargets };

    if (revealAction.alignment) {
      if (!state.chaoticAlignments) state.chaoticAlignments = {};
      state.chaoticAlignments[playerId] = revealAction.alignment;
    }
  }

  // ── CLEAR THROTTLE ──
  // Re-evaluate immediately on next tick after an acknowledgement
  state.nextCheckAt = null;

  const orbitInfo = computeOrbitInfo(state, playerId);

  // Block phase advance while game is frozen (grace period or interrupted)
  if (isGameFrozen(state)) {
    return { accepted: true, orbitInfo, allAcknowledged: false };
  }

  // Post-resume safety: consume the justUnfrozen flag to prevent instant phase skip
  if (consumeJustUnfrozen(state)) {
    return { accepted: true, orbitInfo, allAcknowledged: false };
  }

  const activeCount = getActivePlayers(state).length;
  // Use stable playerIds for count
  const ackCount = state.players.filter(p => state.roleAcknowledgements.includes(p.playerId || "") && !p.isSpectator).length;

  if (ackCount < activeCount) {
    return { accepted: true, orbitInfo, allAcknowledged: false };
  }

  // All acknowledged → advance to orbit_action
  processRevealActions(state);
  state.phase = "orbit_action";
  state.phaseStartedAt = Date.now();
  state.phaseReady = false;

  const autoActions: Array<{ playerId: string; roleId: string; action: PlayerAction }> = [];
  const alivePlayers = state.players.filter((p) => p.alive);
  for (const p of alivePlayers) {
    const pId = p.playerId || p.id;
    const rId = state.rolesAssigned[pId];
    if (PASSIVE_ROLE_IDS.has(rId)) {
      // If they haven't submitted yet (e.g. disconnected or just didn't acknowledge yet)
      if (!state.orbitCompleted.includes(pId)) {
        const passiveAction: PlayerAction = {
          type: rId === "parasite" ? "passive" : "none",
          targets: [],
        };
        submitActionInternal(state, pId, passiveAction);
        autoActions.push({ playerId: pId, roleId: rId, action: passiveAction });
      }
    }
  }

  const completedCount = state.players.filter(p => state.orbitCompleted.includes(p.playerId || "") && !p.isSpectator).length;
  const allSubmitted = completedCount >= activeCount;

  return {
    accepted: true,
    orbitInfo,
    allAcknowledged: true,
    autoActions,
    allSubmitted,
  };
}

/**
 * Compute role-specific information delivered to a player at the start of
 * the orbit phase (e.g. Parasite sees alien teammates).
 */
export function computeOrbitInfo(
  state: GameState,
  id: string,
): { type: string; data?: unknown } {
  const playerId = normalizeToPlayerId(state, id);
  if (!playerId) return { type: "none" };

  const role = state.rolesAssigned[playerId];
  if (role === "parasite") {
    const alienPlayers = state.players
      .filter((p) => {
        const pId = p.playerId || p.id;
        const r = state.rolesAssigned[pId];
        return r === "alien";
      })
      .map((p) => p.name);
    return { type: "parasite_info", data: { alienPlayers } };
  }
  return { type: "none" };
}

/**
 * Internal helper — stores an action and marks the player as completed.
 * Used by both submitAction (player-initiated) and acknowledgeRole (auto-passive).
 */
function submitActionInternal(state: GameState, id: string, action: PlayerAction): void {
  const playerId = normalizeToPlayerId(state, id);
  if (!playerId) return;

  state.orbitActions[playerId] = action;
  if (!state.orbitCompleted.includes(playerId)) {
    state.orbitCompleted.push(playerId);
  }
  // ── CLEAR THROTTLE ──
  // Ensure the background engine re-evaluates the state immediately 
  // after a significant player action, bypassing any long-tail timeouts.
  state.nextCheckAt = null;
}

/**
 * Submit a player's orbit action.
 *
 * MUTATION: modifies `state` in place.
 */
export function submitAction(
  state: GameState,
  id: string, // socketId or playerId
  action: PlayerAction,
): ActionResult {
  if (state.phase !== "orbit_action") {
    return { accepted: false, allSubmitted: false, error: "Phase protocol mismatch: orbit_action required" };
  }

  const playerId = normalizeToPlayerId(state, id);
  if (!playerId) {
    return { accepted: false, allSubmitted: false, error: "Identity verification failed: player not in session" };
  }

  const player = state.players.find(p => p.playerId === playerId);
  if (!player) {
    return { accepted: false, allSubmitted: false, error: "Identity verification failed: player not in session" };
  }
  if (player.isSpectator) {
    return { accepted: false, allSubmitted: false, error: "Spectator interference prohibited" };
  }

  // ── FINALITY LOCK ──
  // Prevent race conditions or double-submissions
  // ── IDEMPOTENCY CHECK ──
  // If already recorded, return success silently to avoid console errors on double-clicks
  if (state.orbitCompleted.includes(playerId)) {
    return { accepted: true, allSubmitted: state.orbitCompleted.length >= getActivePlayers(state).length };
  }

  // ── ROLE AUTHORITY VALIDATION ──
  // Strictly enforce that the player's role is allowed to perform the submitted action type
  const roleId = state.rolesAssigned[playerId];
  const allowedActions: Record<string, string[]> = {
    scanner: ["scan_player", "scan_deck", "skip", "none"],
    alien: ["alien_view", "skip", "none"],
    disruptor: ["disrupt", "skip", "none"],
    commander: ["boost", "commander_vote_boost", "skip", "none"],
    warper: ["warp", "skip", "none"],
    shifter: ["exchange", "shift", "skip", "none"],
    sentinel: ["watch", "sentinel_watch", "skip", "none"],
    seeker: ["seek", "skip", "none"],
    parasite: ["passive", "none", "skip"],
    crew: ["none", "skip", "passive"],
    virus: ["none", "skip", "passive"],
    router: ["none", "skip", "passive"],
    doctor: ["none", "skip", "passive"],
    chaotic: ["none", "skip", "passive"],
  };

  // If roleId is unknown (e.g. stored under old socket.id before reconnect),
  // still allow passive actions so the orbit phase is not permanently blocked.
  if (!roleId) {
    if (action.type !== "none" && action.type !== "skip") {
      return { accepted: false, allSubmitted: false, error: "Role identity could not be resolved — try refreshing" };
    }
  } else {
    const allowed = allowedActions[roleId] || ["none", "skip"];
    if (!allowed.includes(action.type) && action.type !== "none" && action.type !== "skip") {
      return { accepted: false, allSubmitted: false, error: `Unauthorized protocol for role: ${roleId}` };
    }
  }

  // Prevent targeting spectators in Orbit phase
  let resolvedTargets = action.targets || [];
  if (action.targets) {
    const newTargets: string[] = [];
    for (const tId of action.targets) {
      if (tId.startsWith("center_")) {
        newTargets.push(tId);
        continue;
      }
      const targetPlayerId = normalizeToPlayerId(state, tId);
      if (!targetPlayerId) {
        return { accepted: false, allSubmitted: false, error: "Invalid target identity" };
      }
      const targetPlayer = state.players.find(p => p.playerId === targetPlayerId);
      if (targetPlayer && targetPlayer.isSpectator) {
        return { accepted: false, allSubmitted: false, error: "Targeting spectators is prohibited" };
      }
      newTargets.push(targetPlayerId);
    }
    resolvedTargets = newTargets;
  }

  submitActionInternal(state, playerId, { ...action, targets: resolvedTargets });

  // Block resolution trigger while game is frozen (grace period or interrupted)
  if (isGameFrozen(state)) {
    return { accepted: true, allSubmitted: false };
  }

  // Post-resume safety: consume the justUnfrozen flag to prevent instant resolution
  if (consumeJustUnfrozen(state)) {
    return { accepted: true, allSubmitted: false };
  }

  const activeCount = getActivePlayers(state).length;
  const completedCount = state.players.filter(p => state.orbitCompleted.includes(p.playerId || "") && !p.isSpectator).length;

  return {
    accepted: true,
    allSubmitted: completedCount >= activeCount,
  };
}

/**
 * Auto-complete unready players in the Orbit phase.
 * Marks any non-spectator player who hasn't submitted as "skipped" or "none".
 * 
 * MUTATION: modifies state in place.
 */
export function autoCompleteOrbitActions(state: GameState): void {
  if (state.phase !== "orbit_action") return;

  state.players.forEach(p => {
    if (p.isSpectator) return;
    const pId = p.playerId || p.id;
    if (!state.orbitCompleted.includes(pId)) {
      const roleId = state.rolesAssigned[pId];
      // Default to "skip" for actives, "none" for others
      const isPassive = roleId === "crew" || roleId === "parasite" || roleId === "virus" || roleId === "router" || roleId === "doctor";
      submitActionInternal(state, pId, { type: isPassive ? "none" : "skip", targets: [] });
    }
  });
}

/**
 * Run deterministic ability resolution.
 *
 * This is the heart of the game engine: processes all submitted actions
 * in strict role-priority order and produces per-player feedback plus
 * a public ability log.
 *
 * MUTATION: modifies `state.rolesAssigned` when Warper/Shifter swap roles.
 * All other state is written to the returned result object.
 */
export function resolveRound(state: GameState): ResolutionResult {
  // Snapshot roles before any mutations (Warper/Shifter mutate rolesAssigned)
  const startRoles: Record<string, string> = { ...state.rolesAssigned };

  const blockedPlayerIds = new Set<string>(state.anesthetizedPlayers || []);
  const actionLog: Record<string, string[]> = {};
  const sentinelWatchTargets: Record<string, string> = {};

  const feedback: Record<string, PrivateFeedback> = {};
  const abilityLog: AbilityLogEntry[] = [];
  const loggedPlayerIds = new Set<string>();

  function logInternal(targetPlayerId: string, desc: string) {
    if (!actionLog[targetPlayerId]) actionLog[targetPlayerId] = [];
    actionLog[targetPlayerId].push(desc);
  }

  function logActor(actorName: string, actorPlayerId: string, event: string) {
    abilityLog.push({ actorName, event });
    loggedPlayerIds.add(actorPlayerId);
  }

  // ── Pass 1: resolve all roles in strict order ────────────────────────────
  for (const roleId of ROLE_ORDER) {
    // Actors are now identified primarily by their stable playerId, with fallback to ephemeral id
    const actors = state.players.filter((p) => {
      const pId = p.playerId || "";
      const sId = p.id || "";
      return startRoles[pId] === roleId || startRoles[sId] === roleId;
    });

    for (const actor of actors) {
      const actorId = actor.playerId || actor.id;
      const action = state.orbitActions[actorId];

      // Roles that act during Role Reveal
      if (roleId === "doctor") {
        const revealAction = state.revealActions[actorId];
        if (revealAction && revealAction.targets[0]) {
          const target = state.players.find(p => p.playerId === revealAction.targets[0]);
          feedback[actorId] = { type: "doctor_result", data: { targetName: target?.name ?? "a player" } };
          logActor(actor.name, actorId, `anesthetized ${target?.name ?? "a player"}`);
        } else {
          feedback[actorId] = { type: "skipped" };
          logActor(actor.name, actorId, "skipped their ability");
        }
        continue;
      }
      if (roleId === "virus") {
        const revealAction = state.revealActions[actorId];
        if (revealAction && revealAction.targets[0]) {
          const target = state.players.find(p => p.playerId === revealAction.targets[0]);
          feedback[actorId] = { type: "virus_result", data: { targetName: target?.name ?? "a player" } };
          logActor(actor.name, actorId, `used Packet Loss on ${target?.name ?? "a player"}`);
        } else {
          feedback[actorId] = { type: "skipped" };
          logActor(actor.name, actorId, "skipped their ability");
        }
        continue;
      }
      if (roleId === "router") {
        const revealAction = state.revealActions[actorId];
        if (revealAction && revealAction.targets[0] && revealAction.targets[1]) {
          const source = state.players.find(p => p.playerId === revealAction.targets[0]);
          const dest = state.players.find(p => p.playerId === revealAction.targets[1]);
          feedback[actorId] = { type: "router_result", data: { sourceName: source?.name ?? "a player", destName: dest?.name ?? "another player" } };
          logActor(actor.name, actorId, `hijacked ${source?.name ?? "a player"}'s ability`);
        } else {
          feedback[actorId] = { type: "skipped" };
          logActor(actor.name, actorId, "skipped their ability");
        }
        continue;
      }

      // No submission (or auto-submit)
      if (!action || action.type === "passive" || action.type === "none") {
        feedback[actorId] = { type: roleId === "parasite" ? "passive" : "no_ability" };
        
        if (roleId === "parasite") {
          logActor(actor.name, actorId, "(Parasite) monitored via passive ability");
        } else {
          logActor(actor.name, actorId, "skipped their ability");
        }
        continue;
      }

      // Voluntary skip
      if (action.type === "skip") {
        feedback[actorId] = { type: "skipped" };
        logActor(actor.name, actorId, "skipped their ability");
        continue;
      }

      const originalTargets = [...action.targets];
      let targets = [...action.targets];

      // Router Effect: Gateway Hijack
      if (state.hijackedTargets[actorId]) {
        const destinationId = state.hijackedTargets[actorId];

        // REFINEMENT: Hijack only applies to actions targeting players.
        // It does NOT redirect Deck-based actions (center_*) or affect certain roles.
        const isDeckAction = action?.targets?.some(t => t.startsWith("center_"));
        const isExemptRole = ["alien", "commander", "crew"].includes(roleId);

        if (!isDeckAction && !isExemptRole) {
          const destination = state.players.find(p => p.playerId === destinationId);
          if (destination) {
            if (roleId === "warper") {
              // Special rule: Warper is forced to change their redirect target (second target)
              // Example: Warper (B) C -> D becomes C -> E (where E is Router's target)
              targets = [targets[0], destinationId];
            } else {
              targets = [destinationId];
            }
          }
        }
      }

      // Block check — Sentinel and Scanner are immune
      const immuneToBlock = roleId === "scanner" || roleId === "sentinel";
      if (!immuneToBlock && blockedPlayerIds.has(actorId)) {
        feedback[actorId] = { type: "blocked" };
        logActor(actor.name, actorId, "(Ability) was blocked");
        continue;
      }

      switch (roleId) {
        // ── Sentinel ─────────────────────────────────────────────────────
        case "sentinel": {
          const targetId = targets[0];
          if (targetId) {
            sentinelWatchTargets[actorId] = targetId;
            const target = state.players.find((p) => p.playerId === targetId);
            logActor(actor.name, actorId, `(Sentinel) observed ${target?.name ?? "a player"}`);
          } else {
            feedback[actorId] = { type: "no_action" };
            logActor(actor.name, actorId, "(Sentinel) did not select a watch target");
          }
          break;
        }

        // ── Scanner ──────────────────────────────────────────────────────
        case "scanner": {
          if (action.type === "scan_player") {
            const target = state.players.find((p) => p.playerId === targets[0]);
            if (target) {
              const initialRole = state.initialRoles[target.playerId || target.id] ?? "unknown";
              feedback[actorId] = {
                type: "scan_player",
                data: { targetName: target.name, roleId: initialRole },
              };
              logInternal(target.playerId || target.id, "role was inspected by a scanner");
              logActor(actor.name, actorId, `(Scanner) scanned ${target.name}`);
            }
          } else if (action.type === "scan_deck") {
            const roles = targets.slice(0, 2).map((t) => {
              const idx = parseInt(t.replace("center_", ""), 10);
              return state.centerCards[idx] ?? "unknown";
            });
            feedback[actorId] = { type: "scan_deck", data: { roles } };
            logActor(actor.name, actorId, "(Scanner) scanned the central deck");
          } else {
            feedback[actorId] = { type: "no_action" };
            logActor(actor.name, actorId, "(Scanner) used an unknown scan action");
          }
          break;
        }

        // ── Alien ────────────────────────────────────────────────────────
        case "alien": {
          if (action.type === "alien_view") {
            const idx = parseInt(
              (targets[0] ?? "center_0").replace("center_", ""),
              10,
            );
            const cardRole = state.centerCards[idx] ?? "unknown";
            feedback[actorId] = {
              type: "alien_view",
              data: { cardIndex: idx, roleId: cardRole },
            };
            logActor(actor.name, actorId, "(Alien) reviewed a hidden card from the central deck");
          } else {
            feedback[actorId] = { type: "no_action" };
            logActor(actor.name, actorId, "(Alien) used their ability");
          }
          break;
        }

        // ── Disruptor ────────────────────────────────────────────────────
        case "disruptor": {
          const targetId = targets[0];
          const targetRole = state.rolesAssigned[targetId];
          const targetPlayer = state.players.find((p) => p.playerId === targetId);
          if (targetRole === "scanner") {
            feedback[actorId] = { type: "disrupt_ineffective" };
            logActor(actor.name, actorId, "(Disruptor) attempted to block — target was immune");
          } else {
            blockedPlayerIds.add(targetId);
            const originalTarget = state.players.find(p => p.playerId === originalTargets[0]);
            feedback[actorId] = { type: "disrupt_success", data: { targetName: originalTarget?.name ?? "a player" } };
            logInternal(targetId, "ability was blocked");
            logActor(
              actor.name,
              actorId,
              `(Disruptor) blocked ${originalTarget?.name ?? "a player"}'s ability`
            );
          }
          break;
        }

        // ── Parasite (active branch — passive already handled above) ──
        case "parasite": {
          feedback[actorId] = { type: "passive" };
          logActor(actor.name, actorId, "(Parasite) monitored via passive ability");
          break;
        }

        // ── Seeker ───────────────────────────────────────────────────────
        case "seeker": {
          const target = state.players.find((p) => p.playerId === targets[0]);
          if (target) {
            const role = state.rolesAssigned[target.playerId || target.id];
            let alignment = role === "alien" || role === "parasite" || role === "virus" ? "Bad" : "Good";

            // Chaotic Alignment Override
            if (role === "chaotic" && state.chaoticAlignments[target.playerId || target.id]) {
              alignment = state.chaoticAlignments[target.playerId || target.id];
            }

            feedback[actorId] = {
              type: "seek_result",
              data: { targetName: target.name, alignment },
            };
            logInternal(target.playerId || target.id, "alignment was checked");
            logActor(actor.name, actorId, `(Seeker) checked ${target.name}'s alignment`);
          } else {
            feedback[actorId] = { type: "no_action" };
            logActor(actor.name, actorId, "(Seeker) attempted an alignment check — no valid target");
          }
          break;
        }

        // ── Commander ────────────────────────────────────────────────────
        case "commander": {
          feedback[actorId] = { type: "commander_boost", data: { granted: true } };
          logActor(actor.name, actorId, "(Commander) activated vote boost");
          break;
        }

        // ── Warper (MUTATES state.rolesAssigned) ─────────────────────────
        case "warper": {
          const [tA, tB] = targets;
          if (tA && tB) {
            const playerA = state.players.find((p) => p.playerId === tA);
            const playerB = state.players.find((p) => p.playerId === tB);

            if (!playerA || !playerB || tA === actorId || tB === actorId) {
              feedback[actorId] = { type: "no_action" };
              logActor(actor.name, actorId, "(Warper) attempted an invalid swap (cannot swap self)");
              break;
            }

            const roleA = state.rolesAssigned[tA];
            const roleB = state.rolesAssigned[tB];
            state.rolesAssigned[tA] = roleB;
            state.rolesAssigned[tB] = roleA;
            const originalA = state.players.find(p => p.playerId === originalTargets[0]);
            const originalB = state.players.find(p => p.playerId === originalTargets[1]);

            logInternal(tA, "role was swapped by a warper");
            logInternal(tB, "role was swapped by a warper");
            feedback[actorId] = {
              type: "warper_swap",
              data: {
                playerAName: originalA?.name ?? playerA.name,
                playerBName: originalB?.name ?? playerB.name
              },
            };
            logActor(
              actor.name,
              actorId,
              `swapped the roles of ${originalA?.name ?? playerA.name} and ${originalB?.name ?? playerB.name}`,
            );
          } else {
            feedback[actorId] = { type: "no_action" };
            logActor(actor.name, actorId, "used their ability (incomplete targets)");
          }
          break;
        }

        // ── Shifter (MUTATES state.rolesAssigned) ────────────────────────
        case "shifter": {
          const targetId = targets[0];
          const targetPlayer = state.players.find((p) => p.playerId === targetId);

          if (!targetPlayer) {
            feedback[actorId] = { type: "no_action" };
            logActor(actor.name, actorId, "attempted an invalid exchange");
            break;
          }

          const actorRole = state.rolesAssigned[actorId];
          const targetRole = state.rolesAssigned[targetId];

          state.rolesAssigned[actorId] = targetRole;
          state.rolesAssigned[targetId] = actorRole;

          logInternal(actorId, "role was changed by a shifter");
          logInternal(targetId, "role was changed by a shifter");
          feedback[actorId] = {
            type: "shifter_exchange",
            data: { targetName: targetPlayer.name, acquiredRole: targetRole },
          };
          logActor(actor.name, actorId, `exchanged roles with ${targetPlayer.name}`);
          break;
        }

        default: {
          feedback[actorId] = { type: "no_action" };
          logActor(actor.name, actorId, "used their ability");
        }
      }
    }
  }

  // ── Pass 2: compile Sentinel reports (actionLog is now complete) ─────────
  for (const [sentinelId, targetId] of Object.entries(sentinelWatchTargets)) {
    const target = state.players.find((p) => p.playerId === targetId);
    if (!target) continue;
    const actions = actionLog[targetId] ?? [];
    feedback[sentinelId] = {
      type: "sentinel_report",
      data: { targetName: target.name, actions },
    };
  }

  // ── Catch-all: players with no feedback yet ──────────────────────────────
  for (const player of state.players) {
    const pId = player.playerId || player.id;
    if (!loggedPlayerIds.has(pId)) {
      const roleId = state.rolesAssigned[pId];
      if (!feedback[pId]) {
        feedback[pId] = { type: "no_ability" };
      }
      
      if (roleId === "crew") {
        logActor(player.name, pId, "has no active ability");
      } else if (roleId === "parasite") {
        logActor(player.name, pId, "(Parasite) monitored via passive ability");
      } else {
        logActor(player.name, pId, "skipped their ability");
      }
    }
  }

  return { feedback, abilityLog };
}

/**
 * Apply resolution results to the game state and advance to discussion.
 *
 * MUTATION: modifies `state` in place.
 */
export function applyResolution(state: GameState, result: ResolutionResult, now: number = Date.now()): void {
  state.orbitFeedback = result.feedback;
  state.roundSummary.abilityLog = result.abilityLog;
  state.phase = "discussion";
  state.phaseStartedAt = now;
  state.phaseReady = false;
}

/**
 * Transition the game to the voting phase.
 *
 * MUTATION: modifies `state` in place.
 */
export function startVoting(state: GameState, now: number = Date.now()): void {
  state.phase = "voting";
  state.phaseStartedAt = now;
  state.phaseReady = false;
  if (state.emergencyVote) {
    state.emergencyVote.active = false;
  }
}

/**
 * Start an emergency vote during the discussion phase.
 *
 * MUTATION: modifies `state.emergencyVote` in place.
 */
export function startEmergencyVote(
  state: GameState,
  callerId: string,
  now: number = Date.now(),
): EmergencyVoteStartResult {
  if (state.phase !== "discussion") {
    return { accepted: false, error: "wrong phase" };
  }
  // Block while game is frozen (grace period or interrupted)
  if (isGameFrozen(state)) {
    return { accepted: false, error: "game_frozen" };
  }
  if (state.orbitCompleted.length < getActivePlayers(state).length) {
    return { accepted: false, error: "players_not_ready" };
  }
  if (state.emergencyVote.cooldownUntil && now < state.emergencyVote.cooldownUntil) {
    return { accepted: false, error: "cooldown" };
  }
  if (state.emergencyVote.active) {
    return { accepted: false, error: "already active" };
  }

  const caller = state.players.find((p) => p.playerId === callerId || p.id === callerId);
  if (!caller || !caller.playerId) {
    return { accepted: false, error: "not in session or missing persistent identity" };
  }
  if (caller.isSpectator) {
    return { accepted: false, error: "spectators cannot call emergency votes" };
  }
  state.emergencyVote = {
    active: true,
    callerId: caller.playerId,
    callerName: caller.name,
    yesVoters: [],
    noVoters: [],
    cooldownUntil: null,
  };

  return { accepted: true, callerName: caller.name };
}

/**
 * Cast a vote in an active emergency vote.
 *
 * MUTATION: modifies `state.emergencyVote` (and `state.phase` if vote passes).
 */
export function castEmergencyVote(
  state: GameState,
  voterId: string, // socketId or playerId
  vote: "yes" | "no",
  now: number = Date.now(),
): EmergencyVoteCastResult {
  if (!state.emergencyVote.active) {
    return { accepted: false, outcome: null, error: "no active emergency vote" };
  }

  const playerId = normalizeToPlayerId(state, voterId);
  if (!playerId) {
    return { accepted: false, outcome: null, error: "not in session or missing persistent identity" };
  }

  const voter = state.players.find(p => p.playerId === playerId);
  if (voter?.isSpectator) {
    return { accepted: false, outcome: null, error: "spectators cannot vote" };
  }

  const ev = state.emergencyVote;

  // Deduplication using stable playerId
  if (ev.yesVoters.includes(playerId) || ev.noVoters.includes(playerId)) {
    return { accepted: true, outcome: null };
  }

  if (vote === "yes") ev.yesVoters.push(playerId);
  else ev.noVoters.push(playerId);

  // Block emergency vote resolution while game is frozen
  if (isGameFrozen(state)) {
    return { accepted: true, outcome: null };
  }

  // Post-resume safety: consume the justUnfrozen flag to prevent instant resolution
  if (consumeJustUnfrozen(state)) {
    return { accepted: true, outcome: null };
  }

  const totalVoters = ev.yesVoters.length + ev.noVoters.length;
  const totalPlayers = getActivePlayers(state).length;
  const yesNeeded = Math.ceil(totalPlayers * 0.4);

  const yesReached = ev.yesVoters.length >= yesNeeded;
  const canStillPass =
    ev.yesVoters.length < yesNeeded &&
    (totalPlayers - ev.noVoters.length) >= yesNeeded;
  const failureCertain = !yesReached && !canStillPass;

  if (yesReached || failureCertain || totalVoters >= totalPlayers) {
    if (yesReached) {
      state.emergencyVote.active = false;
      state.phase = "voting";
      state.phaseStartedAt = now;
      state.phaseReady = false;
      return { accepted: true, outcome: true };
    } else {
      state.emergencyVote.active = false;
      state.emergencyVote.cooldownUntil = now + 60_000;
      return { accepted: true, outcome: false };
    }
  }

  // Still in progress
  return { accepted: true, outcome: null };
}

/**
 * Cast an elimination vote.
 *
 * MUTATION: modifies `state.votes`, and when all votes are in, sets
 * `state.voteResult`, `state.roundSummary`, and `state.phase`.
 */
export function castVote(
  state: GameState,
  voterId: string, // socketId or playerId
  targetId: string, // socketId or playerId or "abstain"
): VoteCastResult {
  if (state.phase !== "voting") {
    return { accepted: false, votingComplete: false, error: "Phase protocol mismatch: voting phase required" };
  }

  const vPlayerId = normalizeToPlayerId(state, voterId);
  if (!vPlayerId) {
    return { accepted: false, votingComplete: false, error: "Identity verification failed: player not in session" };
  }
  const voter = state.players.find(p => p.playerId === vPlayerId);
  if (voter?.isSpectator) {
    return { accepted: false, votingComplete: false, error: "Spectators cannot vote" };
  }

  // ── FINALITY LOCK ──
  // Prevent changing votes or double-voting once synchronized
  if (state.votes[vPlayerId]) {
    return { accepted: false, votingComplete: false, error: "Vote already synchronized and locked" };
  }

  // ── ANESTHESIA ENFORCEMENT ──
  if (state.anesthetizedPlayers?.includes(vPlayerId)) {
    return { accepted: false, votingComplete: false, error: "Neural link inhibited: you cannot cast a vote this round" };
  }

  // Validate target
  let resolvedTargetId = targetId;
  if (targetId !== "abstain") {
    const tPlayerId = normalizeToPlayerId(state, targetId);
    if (!tPlayerId) {
      return { accepted: false, votingComplete: false, error: "Target identity verification failed" };
    }
    if (tPlayerId === vPlayerId) {
      return { accepted: false, votingComplete: false, error: "Self-targeting prohibited in voting protocol" };
    }
    const targetPlayer = state.players.find((p) => p.playerId === tPlayerId);
    if (!targetPlayer) {
      return { accepted: false, votingComplete: false, error: "Target not found in session" };
    }
    if (targetPlayer.isSpectator) {
      return { accepted: false, votingComplete: false, error: "Targeting spectators is prohibited" };
    }
    resolvedTargetId = tPlayerId;
  }

  state.votes[vPlayerId] = resolvedTargetId;

  // ── CLEAR THROTTLE ──
  // Re-evaluate immediately on next tick after a vote
  state.nextCheckAt = null;

  // Block voting resolution while game is frozen (grace period or interrupted)
  if (isGameFrozen(state)) {
    return { accepted: true, votingComplete: false };
  }

  // Post-resume safety: consume the justUnfrozen flag to prevent instant phase skip
  if (consumeJustUnfrozen(state)) {
    return { accepted: true, votingComplete: false };
  }

  // Check if all *active* (connected) players have voted
  const activeCount = getActivePlayers(state).length;
  const activeAnesthetizedCount = (state.anesthetizedPlayers || []).filter(pId =>
    state.players.find(p => p.playerId === pId)?.connectionStatus === "connected"
  ).length;

  // NOTE: state.votes is now keyed by playerId. 
  // We check how many ACTIVE (connected) players have their playerId in the votes map.
  const activeVotedCount = getActivePlayers(state).filter(p => state.votes[p.playerId || ""]).length;

  if (activeVotedCount < (activeCount - activeAnesthetizedCount)) {
    return { accepted: true, votingComplete: false };
  }

  // ── All votes in — tally ──────────────────────────────────────────────────
  const result = tallyVotes(state);
  if (result.eliminatedId) {
    const eliminatedPlayer = state.players.find((p) => p.playerId === result.eliminatedId);
    if (eliminatedPlayer) {
      eliminatedPlayer.alive = false;
    }
  }

  result.allRoles = state.players.map((p) => ({
    playerId: p.playerId || p.id,
    socketId: p.id,
    playerName: p.name,
    role: state.rolesAssigned[p.playerId || p.id] ?? "unknown",
    initialRole: state.initialRoles[p.playerId || p.id] ?? "unknown",
    alive: p.alive !== false,
  }));
  state.voteResult = result;

  // Build round summary
  const voteTally = Object.entries(state.votes).map(([vid, tid]) => {
    const vPlayer = state.players.find((p) => p.playerId === vid);
    const abstain = tid === "abstain";
    const tPlayer = abstain ? null : state.players.find((p) => p.playerId === tid);
    const weight = commanderVoteWeight(state, vid);
    return {
      voterName: vPlayer?.name ?? "Unknown",
      targetName: abstain ? "—" : (tPlayer?.name ?? "Unknown"),
      isCommander: !abstain && weight === 2,
      isAbstain: abstain,
    };
  });

  const weightedCounts: Record<string, number> = {};
  for (const [vid, tid] of Object.entries(state.votes)) {
    if (tid === "abstain") continue;
    const weight = commanderVoteWeight(state, vid);
    weightedCounts[tid] = (weightedCounts[tid] ?? 0) + weight;
  }
  const voteCounts = Object.entries(weightedCounts)
    .map(([tid, count]) => {
      const player = state.players.find((p) => p.playerId === tid);
      return { playerName: player?.name ?? "Unknown", votes: count };
    })
    .sort((a, b) => b.votes - a.votes);

  state.roundSummary.voteTally = voteTally;
  state.roundSummary.voteCounts = voteCounts;
  state.phase = "result";

  return {
    accepted: true,
    votingComplete: true,
    voteResult: result,
    roundSummary: state.roundSummary,
  };
}

/**
 * Re-check if voting should resolve after a player disconnects/quits.
 * When a player leaves during voting, the required vote count drops.
 * If all remaining active players have already voted, resolve immediately.
 *
 * MUTATION: modifies `state` in place when voting completes.
 */
export function recheckVotingCompletion(state: GameState): VoteCastResult {
  if (state.phase !== "voting") {
    return { accepted: false, votingComplete: false };
  }

  // Block voting resolution while game is frozen
  if (isGameFrozen(state)) {
    return { accepted: true, votingComplete: false };
  }

  // Post-resume safety: consume the justUnfrozen flag to prevent instant phase skip
  if (consumeJustUnfrozen(state)) {
    return { accepted: true, votingComplete: false };
  }

  const activePlayers = getActivePlayers(state);
  const activeCount = activePlayers.length;
  const activeAnesthetizedCount = (state.anesthetizedPlayers || []).filter(pId =>
    state.players.find(p => p.playerId === pId)?.connectionStatus === "connected"
  ).length;

  const activeVotedCount = activePlayers.filter(p => state.votes[p.playerId || ""]).length;

  if (activeVotedCount < (activeCount - activeAnesthetizedCount)) {
    return { accepted: true, votingComplete: false };
  }

  // All active players have voted — tally
  const result = tallyVotes(state);
  if (result.eliminatedId) {
    const eliminatedPlayer = state.players.find((p) => p.playerId === result.eliminatedId);
    if (eliminatedPlayer) {
      eliminatedPlayer.alive = false;
    }
  }

  result.allRoles = state.players.map((p) => ({
    playerId: p.playerId || p.id,
    socketId: p.id,
    playerName: p.name,
    role: state.rolesAssigned[p.playerId || p.id] ?? "unknown",
    initialRole: state.initialRoles[p.playerId || p.id] ?? "unknown",
    alive: p.alive !== false,
  }));
  state.voteResult = result;

  // Build round summary
  const voteTally = Object.entries(state.votes).map(([vid, tid]) => {
    const vPlayer = state.players.find((p) => p.playerId === vid);
    const abstain = tid === "abstain";
    const tPlayer = abstain ? null : state.players.find((p) => p.playerId === tid);
    const weight = commanderVoteWeight(state, vid);
    return {
      voterName: vPlayer?.name ?? "Unknown",
      targetName: abstain ? "—" : (tPlayer?.name ?? "Unknown"),
      isCommander: !abstain && weight === 2,
      isAbstain: abstain,
    };
  });

  const weightedCounts: Record<string, number> = {};
  for (const [vid, tid] of Object.entries(state.votes)) {
    if (tid === "abstain") continue;
    const weight = commanderVoteWeight(state, vid);
    weightedCounts[tid] = (weightedCounts[tid] ?? 0) + weight;
  }
  const voteCounts = Object.entries(weightedCounts)
    .map(([tid, count]) => {
      const player = state.players.find((p) => p.playerId === tid);
      return { playerName: player?.name ?? "Unknown", votes: count };
    })
    .sort((a, b) => b.votes - a.votes);

  state.roundSummary.voteTally = voteTally;
  state.roundSummary.voteCounts = voteCounts;
  state.phase = "result";

  return {
    accepted: true,
    votingComplete: true,
    voteResult: result,
    roundSummary: state.roundSummary,
  };
}

/**
 * Tally votes and determine the game result.
 *
 * Pure function — reads state but does not modify it.
 */
export function tallyVotes(state: GameState): VoteResult {
  const voteCounts: Record<string, number> = {};
  for (const [voterId, targetId] of Object.entries(state.votes)) {
    if (targetId === "abstain") continue;
    const weight = commanderVoteWeight(state, voterId);
    voteCounts[targetId] = (voteCounts[targetId] ?? 0) + weight;
  }

  let maxVotes = 0;
  let topTargets: string[] = [];
  for (const [targetId, count] of Object.entries(voteCounts)) {
    if (count > maxVotes) {
      maxVotes = count;
      topTargets = [targetId];
    } else if (count === maxVotes) {
      topTargets.push(targetId);
    }
  }

  const allRoles = state.players.map((p) => ({
    playerId: p.playerId || p.id,
    socketId: p.id,
    playerName: p.name,
    role: state.rolesAssigned[p.playerId || p.id] ?? "unknown",
    initialRole: state.initialRoles[p.playerId || p.id] ?? "unknown",
    alive: p.alive !== false,
    alignment: state.chaoticAlignments?.[p.playerId || p.id],
  }));

  const centerCards = state.centerCards ?? [];

  const isAlienInPlay = Object.values(state.rolesAssigned).includes("alien");
  const isParasiteInPlay = Object.values(state.rolesAssigned).includes("parasite");
  const isVirusInPlay = Object.values(state.rolesAssigned).includes("virus");

  // Any "Bad" role makes a tie (no-one voted out) an Alien win.
  const isAnyEvilInPlay = isAlienInPlay || isParasiteInPlay || isVirusInPlay;

  if (topTargets.length !== 1 || !topTargets[0]) {
    // TIE OR NO VOTES: Bad roles win by default if present
    return {
      eliminatedId: null,
      eliminatedName: topTargets.length > 1 ? "DEADLOCK: Consensus failure" : "No protocol targeted",
      eliminatedRole: null,
      winTeam: isAnyEvilInPlay ? "alien" : "tie",
      allRoles,
      centerCards,
    };
  }

  const eliminatedId = topTargets[0];
  const eliminated = state.players.find((p) => p.playerId === eliminatedId);
  const eliminatedRole = state.rolesAssigned[eliminatedId] ?? "unknown";

  /**
   * WIN HIERARCHY (The most "Evil" role present must be the one eliminated):
   * 1. If Alien is in play, they MUST be voted out for Crew to win.
   * 2. If no Alien, but Parasite is in play, Parasite MUST be voted out for Crew to win.
   * 3. If no Alien and no Parasite, but Virus is in play, Virus MUST be voted out for Crew to win.
   * 4. If none of the above are in play (All Crew), voting anyone out results in an Alien win (Crew loss).
   */
  let winTeam: "crew" | "alien" | "tie" = "alien";

  if (eliminatedRole === "alien") {
    winTeam = "crew";
  } else if (!isAlienInPlay && eliminatedRole === "parasite") {
    winTeam = "crew";
  } else if (!isAlienInPlay && !isParasiteInPlay && eliminatedRole === "virus") {
    winTeam = "crew";
  }

  return {
    eliminatedId,
    eliminatedName: eliminated?.name ?? null,
    eliminatedRole,
    winTeam,
    allRoles,
    centerCards,
  };
}

/**
 * Get the current game result (convenience wrapper around tallyVotes).
 * Returns null if the game hasn't reached the result phase.
 */
export function getGameResult(state: GameState): VoteResult | null {
  if (state.phase !== "result") return null;
  return state.voteResult;
}

/**
 * Reset the game state for a new round — keeps players and session intact.
 *
 * MUTATION: modifies `state` in place.
 */
export function restartGame(state: GameState): GameState {
  // Remove players who explicitly quit — they should not linger after restart
  state.players = state.players.filter((p) => !p.didQuit);

  state.phase = "role_config";
  state.rolesAssigned = {};
  state.initialRoles = {};
  state.centerCards = [];
  state.orbitActions = {};
  state.orbitCompleted = [];
  state.orbitFeedback = {};
  state.roleAcknowledgements = [];
  state.emergencyVote = freshEmergencyVote();
  state.votes = {};
  state.anesthetizedPlayers = [];
  state.chaoticAlignments = {};
  state.voteResult = null;
  state.roundSummary = freshRoundSummary();
  state.interruptedFromPhase = undefined;
  state.playersInGrace = [];
  state.hostEndedInterrupt = undefined;
  state.justUnfrozen = undefined;
  state.players.forEach((player) => {
    player.alive = true;
    player.isSpectator = false;
    player.connectionStatus = player.connected !== false ? "connected" : "disconnected";
  });
  return state;
}

/**
 * Update a reconnecting player's socket ID throughout the game state,
 * remapping all keyed data from oldId → newId.
 *
 * MUTATION: modifies `state` in place.
 */
export function reconnectPlayer(state: GameState, oldId: string, newId: string): void {
  console.log(`[reconnectPlayer] Phase 3 Unified: Remapping socket ${oldId} to ${newId}`);

  const player = state.players.find((p) => p.id === oldId);
  if (player) {
    player.id = newId;
    player.connected = true;
    player.connectionStatus = "connected";

    // If the player was in grace, remove them using their stable identity
    if (player.playerId) {
      removePlayerFromGrace(state, player.playerId);
    }
  }

  if (oldId === newId) return;

  // NOTE: In Phase 3, all engine state (roles, actions, votes) is keyed by persistent playerId.
  // We no longer need to remap rolesAssigned, orbitActions, etc. because the playerId doesn't change!
  // We ONLY need to remap state that is still indexed by socketId (mostly metadata/transient arrays).
}

/**
 * Add a player to the game.
 *
 * MUTATION: modifies `state.players` in place.
 * Returns false if the player is already present.
 */
export function addPlayer(state: GameState, player: Player): { success: boolean; isReconnect: boolean; error?: string } {
  const pId = player.playerId || player.id;
  const existing = state.players.find((p) => (p.playerId || p.id) === pId);
  
  if (existing) {
    // Update existing player with new socket ID and connectivity
    existing.id = player.id;
    existing.connected = true;
    existing.connectionStatus = "connected";
    return { success: true, isReconnect: true };
  }

  // Strict Join Lock: only allow new players in Lobby, Role Config, or Result phase
  if (state.phase !== "lobby" && state.phase !== "role_config" && state.phase !== "result") {
    return { success: false, isReconnect: false, error: "SESSION_LOCKED: Game in progress" };
  }

  state.players.push({ ...player, alive: true });
  return { success: true, isReconnect: false };
}

/**
 * Remove a player from the game and clean up their keyed data.
 *
 * MUTATION: modifies `state` in place.
 * Returns true if the player was found and removed.
 */
export function removePlayer(state: GameState, socketId: string): boolean {
  const idx = state.players.findIndex((p) => p.id === socketId);
  if (idx === -1) return false;

  const player = state.players[idx];
  const playerId = player.playerId || socketId;

  state.players.splice(idx, 1);
  delete state.rolesAssigned[playerId];
  delete state.initialRoles[playerId];
  delete state.orbitActions[playerId];
  delete state.orbitFeedback[playerId];
  delete state.votes[playerId];
  state.orbitCompleted = state.orbitCompleted.filter((id) => id !== playerId);
  state.roleAcknowledgements = state.roleAcknowledgements.filter((id) => id !== playerId);
  state.playersInGrace = (state.playersInGrace || []).filter((id) => id !== playerId);

  return true;
}

/**
 * Host-initiated player kick.
 *
 * Validates that the requester is the host, that kicking is only allowed
 * in the lobby/role_config phases, removes the target player, and adds
 * their stable playerId to kickedPlayerIds to block rejoining.
 *
 * MUTATION: modifies `state` in place when accepted.
 */
export function kickPlayer(
  state: GameState,
  requesterId: string, // stable playerId or socketId
  targetPlayerId: string, // stable playerId
): KickPlayerResult {
  const reqId = normalizeToPlayerId(state, requesterId);
  const requester = state.players.find((p) => p.playerId === reqId || p.id === reqId);
  if (!requester) {
    return { accepted: false, error: "Not in session" };
  }
  if (!requester.isHost) {
    return { accepted: false, error: "Only the host can kick players" };
  }
  if (state.phase !== "lobby" && state.phase !== "role_config") {
    return { accepted: false, error: "Cannot kick players after game has started" };
  }

  // Find the target by their stable UUID
  const target = state.players.find((p) => p.playerId === targetPlayerId);

  // Idempotent: already kicked or removed → success, no-op
  if (!target) {
    return state.kickedPlayerIds.includes(targetPlayerId)
      ? { accepted: true }
      : { accepted: false, error: "Player not found" };
  }

  if (target.playerId === reqId) {
    return { accepted: false, error: "Host cannot kick themselves" };
  }

  const kickedSocketId = target.id;
  const kickedPlayerName = target.name;

  // Persist the ban before mutating players
  if (!state.kickedPlayerIds.includes(targetPlayerId)) {
    state.kickedPlayerIds.push(targetPlayerId);
  }

  // Remove from active players and clean up all session state
  removePlayer(state, targetPlayerId);

  return { accepted: true, kickedSocketId, kickedPlayerName };
}

/**
 * Process abilities used during the Role Reveal phase (Virus, Router).
 * Sets up effects (jamming, hijacking) for the subsequent round.
 *
 * MUTATION: modifies `state` in place.
 */
export function processRevealActions(state: GameState): void {
  state.jammedPlayerId = null;
  state.hijackedTargets = {};
  state.anesthetizedPlayers = [];

  for (const [actorId, action] of Object.entries(state.revealActions)) {
    const role = state.rolesAssigned[actorId];
    if (role === "doctor") {
      const targetId = action.targets[0];
      if (targetId && targetId !== actorId) {
        state.anesthetizedPlayers.push(targetId);
      }
    } else if (role === "virus") {
      const targetId = action.targets[0];
      const targetRole = state.rolesAssigned[targetId];
      // REFINEMENT: Router is immune to Packet Loss (Jamming)
      if (targetId && targetRole !== "router") {
        state.jammedPlayerId = targetId;
      }
    } else if (role === "router") {
      const [sourceId, destId] = action.targets;
      const sourceRole = state.rolesAssigned[sourceId];
      // REFINEMENT: Virus is immune to Gateway Hijack
      if (sourceId && destId && sourceRole !== "virus") {
        state.hijackedTargets[sourceId] = destId;
      }
    } else if (role === "chaotic") {
      const alignment = action.targets[0] as "Good" | "Bad";
      if (alignment) {
        state.chaoticAlignments[actorId] = alignment;
      }
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// Player list ordering — stable, deterministic sort for all payloads
// ═══════════════════════════════════════════════════════════════════════════════

const STATUS_SORT_ORDER: Record<PlayerConnectionStatus, number> = {
  reconnecting: 0,
  connected: 1,
  disconnected: 2,
};

/**
 * Sort players in a stable, deterministic order:
 *   1. Host always first
 *   2. Among non-hosts: reconnecting → connected → disconnected
 *   3. Within the same group, preserve original insertion order (by index)
 *
 * MUTATION: sorts `state.players` in place.
 */
export function sortPlayersByStatus(state: GameState): void {
  state.players.sort((a, b) => {
    // Host always first
    if (a.isHost !== b.isHost) return a.isHost ? -1 : 1;
    const statusA = a.connectionStatus ?? "connected";
    const statusB = b.connectionStatus ?? "connected";
    return STATUS_SORT_ORDER[statusA] - STATUS_SORT_ORDER[statusB];
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// Mid-game interrupt logic
// ═══════════════════════════════════════════════════════════════════════════════

/** Phases where the game is actively in progress (leaving interrupts the game). */
const IN_GAME_PHASES = new Set<GamePhase>([
  "role_reveal",
  "orbit_action",
  "orbit_resolution",
  "orbit_result",
  "discussion",
  "voting",
]);

/**
 * Whether the session is in an active game phase that would be interrupted
 * by a player leaving.
 */
export function isGameInProgress(state: GameState): boolean {
  return IN_GAME_PHASES.has(state.phase);
}

/**
 * Pause the game by setting the phase to "interrupted".
 * Called when a player's reconnect grace expires during an active game.
 *
 * Idempotent: if the game is already interrupted, returns `{ interrupted: false }`.
 *
 * MUTATION: modifies `state` in place.
 */
export function interruptGame(
  state: GameState,
): { interrupted: boolean; previousPhase: GamePhase } {
  // Already interrupted — single interrupt control (idempotent)
  if (state.phase === "interrupted") {
    return { interrupted: false, previousPhase: state.interruptedFromPhase ?? "interrupted" };
  }
  const previousPhase = state.phase;
  if (!isGameInProgress(state)) {
    return { interrupted: false, previousPhase };
  }
  state.interruptedFromPhase = previousPhase;
  state.phase = "interrupted";
  return { interrupted: true, previousPhase };
}

/**
 * Add a player to the grace tracking list.
 *
 * MUTATION: modifies `state.playersInGrace` in place.
 */
export function addPlayerToGrace(state: GameState, id: string): void {
  const playerId = normalizeToPlayerId(state, id);
  if (!playerId) return;

  if (!state.playersInGrace) state.playersInGrace = [];
  if (!state.playersInGrace.includes(playerId)) {
    state.playersInGrace.push(playerId);
  }
  // Mark player as reconnecting for presence UI
  const player = state.players.find((p) => p.playerId === playerId || p.id === id);
  if (player) player.connectionStatus = "reconnecting";
}

/**
 * Remove a player from the grace tracking list (e.g. on reconnect or expiry).
 *
 * MUTATION: modifies `state.playersInGrace` in place.
 */
export function removePlayerFromGrace(state: GameState, id: string): void {
  const playerId = normalizeToPlayerId(state, id);
  if (!playerId || !state.playersInGrace) return;

  const wasFrozen = state.playersInGrace.length > 0;
  state.playersInGrace = state.playersInGrace.filter((pid) => pid !== playerId);
  // When grace list becomes empty after being non-empty AND the game is not
  // still in interrupted phase, set justUnfrozen to prevent instant
  // phase-skipping on the next resolution check.
  if (wasFrozen && state.playersInGrace.length === 0 && state.phase !== "interrupted") {
    state.justUnfrozen = true;
  }
}

/**
 * Whether any players currently have active reconnect grace timers.
 */
export function hasActiveGrace(state: GameState): boolean {
  if (!state.playersInGrace || state.playersInGrace.length === 0) return false;
  
  // Only non-spectators in grace block the game.
  // Spectators coming/going should not trigger a game-wide freeze.
  return state.playersInGrace.some(pId => {
    const p = state.players.find(x => x.playerId === pId);
    return !p || !p.isSpectator;
  });
}

/**
 * Global freeze check: returns true if the game should block all progression.
 * The game is frozen when:
 *   - Any player is in reconnect grace period (playersInGrace.length > 0), OR
 *   - The phase is "interrupted"
 *
 * ALL resolution paths, phase transitions, timer completions, and gameplay
 * actions must check this before completing or transitioning.
 */
export function isGameFrozen(state: GameState): boolean {
  return hasActiveGrace(state) || state.phase === "interrupted";
}

/**
 * Resume the game from "interrupted" phase back to the phase it was in before interruption.
 * Only succeeds when:
 *   - phase === "interrupted"
 *   - playersInGrace is empty (all players returned)
 *   - all players are connected
 *   - host has NOT triggered restart or end (hostEndedInterrupt flag)
 *
 * MUTATION: modifies `state` in place.
 */
export function resumeFromInterrupt(
  state: GameState,
): { resumed: boolean; phase: GamePhase } {
  if (state.phase !== "interrupted" || !state.interruptedFromPhase) {
    return { resumed: false, phase: state.phase };
  }
  // Don't resume if the host has already triggered restart or end
  if (state.hostEndedInterrupt) {
    return { resumed: false, phase: state.phase };
  }
  // Don't resume if any grace timers are still active
  if (hasActiveGrace(state)) {
    return { resumed: false, phase: state.phase };
  }
  // Don't resume if any player is still disconnected or reconnecting
  const anyDisconnected = state.players.some(
    (p) => p.connectionStatus !== "connected" && !p.didQuit,
  );
  if (anyDisconnected) {
    return { resumed: false, phase: state.phase };
  }
  state.phase = state.interruptedFromPhase;
  state.interruptedFromPhase = undefined;
  state.hostEndedInterrupt = undefined;
  state.justUnfrozen = true;
  return { resumed: true, phase: state.phase };
}

export interface EndGameResult {
  accepted: boolean;
  error?: string;
}

/**
 * Host-only: end an interrupted game and return to the lobby (role_config).
 *
 * MUTATION: modifies `state` in place.
 */
export function endGame(
  state: GameState,
  requesterSocketId: string,
): EndGameResult {
  const requester = state.players.find((p) => p.id === requesterSocketId);
  if (!requester) return { accepted: false, error: "Not in session" };
  if (!requester.isHost) return { accepted: false, error: "Only host can end the game" };
  if (state.phase !== "interrupted") return { accepted: false, error: "Game is not interrupted" };

  // Mark that the host ended the session — terminates for all players.
  state.status = "closed";
  state.joinable = false;
  return { accepted: true };
}

export interface ContinueGameResult {
  accepted: boolean;
  phase?: GamePhase;
  error?: string;
}

/**
 * Host-only: continue the game by clearing grace state and marking
 * reconnecting players as disconnected. Disconnected players are excluded
 * from further gameplay (only connected players participate).
 *
 * - If the game is interrupted, resumes to the interrupted-from phase.
 * - If the game is in an active phase with players in grace, clears grace
 *   and continues from the current phase.
 * - Rejects from role_config (nothing to continue).
 *
 * MUTATION: modifies `state` in place.
 */
export function continueGame(
  state: GameState,
  requesterSocketId: string,
): ContinueGameResult {
  const requester = state.players.find((p) => p.id === requesterSocketId);
  if (!requester) return { accepted: false, error: "Not in session" };
  if (!requester.isHost) return { accepted: false, error: "Only host can continue the game" };

  // Allow continue from interrupted phase OR from any in-game phase that has
  // players in grace (waiting to reconnect). This lets the host skip the grace
  // wait period and proceed immediately with connected players only.
  const hasGrace = (state.playersInGrace?.length ?? 0) > 0;
  const hasDisconnected = state.players.some(
    (p) => !p.didQuit && (p.connectionStatus === "reconnecting" || p.connectionStatus === "disconnected"),
  );
  if (state.phase !== "interrupted" && !hasGrace && !hasDisconnected) {
    return { accepted: false, error: "Game is not interrupted" };
  }

  // Clear playersInGrace
  state.playersInGrace = [];

  // Set all reconnecting players to "disconnected"
  state.players.forEach((p) => {
    if (p.connectionStatus === "reconnecting") {
      p.connectionStatus = "disconnected";
      p.connected = false;
    }
  });

  // Resume from interruptedFromPhase if interrupted, otherwise keep current phase
  let resumedPhase: GamePhase = state.phase;
  if (state.phase === "interrupted" && state.interruptedFromPhase) {
    resumedPhase = state.interruptedFromPhase;
    state.phase = resumedPhase;
    state.interruptedFromPhase = undefined;
  }

  state.hostEndedInterrupt = undefined;
  state.justUnfrozen = undefined;
  // Do NOT set justUnfrozen — the host explicitly chose to continue, so
  // phase completion rechecks should proceed immediately in the socket handler.

  return { accepted: true, phase: resumedPhase };
}

/**
 * Check the single-player edge case: if only 0 or 1 active players remain
 * during an in-progress game, the game should end immediately.
 *
 * Returns `{ shouldEnd: true }` when the game must be stopped.
 * The caller is responsible for emitting a system message and resetting to role_config.
 *
 * MUTATION: modifies `state` in place when shouldEnd is true.
 */
export function checkSinglePlayerEdgeCase(
  state: GameState,
): { shouldEnd: boolean; message?: string } {
  if (!isGameInProgress(state) && state.phase !== "interrupted") {
    return { shouldEnd: false };
  }
  const active = getActivePlayers(state);
  if (active.length > 1) return { shouldEnd: false };

  // End the game — not enough players
  state.hostEndedInterrupt = true;
  restartGame(state);
  return { shouldEnd: true, message: "Not enough players to continue" };
}

/**
 * Create a privacy-preserving view of the game state for a specific player.
 *
 * This prevents information leaks during the game:
 * - centerCards and orbitActions are hidden until the result phase.
 * - rolesAssigned only contains the player's own "perceived" role.
 * - Players who are swapped by a Warper see their INITIAL role until the end.
 * - Shifters see their NEW role after an exchange.
 * - Aliens/Parasites see other members of the Alien team.
 */
export function computeSanitizedState(state: GameState, viewerSocketId: string): GameState {
  // Deep clone state (simple version for this object structure)
  const sanitized = {
    ...state,
    centerCards: [...(state.centerCards || [])],
    players: [...(state.players || [])],
    roleCounts: { ...(state.roleCounts || {}) },
    rolesAssigned: { ...(state.rolesAssigned || {}) },
    initialRoles: { ...(state.initialRoles || {}) },
    orbitActions: { ...(state.orbitActions || {}) },
    orbitCompleted: [...(state.orbitCompleted || [])],
    unlockedRoles: [...(state.unlockedRoles || [])],
    votes: { ...(state.votes || {}) },
  };

  const viewer = state.players.find(p => p.id === viewerSocketId);
  const viewerPlayerId = viewer?.playerId || viewerSocketId;

  // 0. Jamming Effect (Virus) — Mask identities for the jammed player
  if (state.jammedPlayerId === viewerPlayerId && state.phase === "orbit_action") {
    sanitized.players = state.players.map(p => ({
      ...p,
      name: (p.playerId === viewerPlayerId || p.id === viewerSocketId) ? p.name : "DATA CORRUPTED",
    }));
  }

  // 1. Clear globally sensitive data unless in result phase
  if (state.phase !== "result") {
    sanitized.centerCards = [];
    sanitized.orbitActions = {};
    sanitized.revealActions = {};
    sanitized.revealCompleted = [];
    sanitized.initialRoles = {};

    // Anonymous voting: hide voter targets
    if (state.settings?.anonymousVoting && state.phase === "voting") {
      sanitized.votes = Object.keys(state.votes).reduce((acc, id) => {
        acc[id] = "voted";
        return acc;
      }, {} as Record<string, string>);
    }
  }

  // 2. Private Feedback Sanitization — Only the owner sees their report
  const sanitizedFeedback: Record<string, { type: string; data?: unknown }> = {};
  if (state.orbitFeedback[viewerPlayerId]) {
    sanitizedFeedback[viewerPlayerId] = state.orbitFeedback[viewerPlayerId];
  }
  sanitized.orbitFeedback = sanitizedFeedback;

  // 3. Roles Sanitization — hide other players' roles and swap info
  if (state.phase !== "result" && state.phase !== "role_config" && state.phase !== "lobby") {
    const sanitizedRoles: Record<string, string> = {};

    // Use persistent identity for lookup
    const myRole = state.rolesAssigned[viewerPlayerId];
    const myInitialRole = state.initialRoles[viewerPlayerId];

    if (myRole) {
      // RULE: You see your initial role unless you are a Shifter.
      if (myInitialRole === "shifter") {
        sanitizedRoles[viewerPlayerId] = myRole;
      } else {
        sanitizedRoles[viewerPlayerId] = myInitialRole;
      }

      // Alien Team Visibility: Aliens see each other.
      const perceivedRole = sanitizedRoles[viewerPlayerId];
      if (perceivedRole === "alien" || perceivedRole === "parasite" || perceivedRole === "virus") {
        for (const [id, r] of Object.entries(state.rolesAssigned)) {
          if (r === "alien" || r === "parasite" || r === "virus") {
            sanitizedRoles[id] = r;
          }
        }
      }
    }

    // 4. Spectator Visibility: Spectators see ALL roles and full round summary
    if (viewer?.isSpectator) {
      sanitized.rolesAssigned = { ...state.rolesAssigned };
      sanitized.initialRoles = { ...state.initialRoles };
      sanitized.roundSummary = state.roundSummary;
      sanitized.orbitFeedback = { ...state.orbitFeedback };
    } else {
      sanitized.rolesAssigned = sanitizedRoles;
      sanitized.roundSummary = { abilityLog: [], voteTally: [], voteCounts: [] };
    }
  }

  return sanitized;
}

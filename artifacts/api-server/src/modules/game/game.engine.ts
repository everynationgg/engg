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
 *  - Callers (socket handlers) are responsible for broadcasting results.
 */

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
  eliminatedId: string | null;
  eliminatedName: string | null;
  eliminatedRole: string | null;
  winTeam: "crew" | "alien" | "tie";
  allRoles: { playerId: string; stablePlayerId?: string; playerName: string; role: string; initialRole: string; alive: boolean; alignment?: "Good" | "Bad" }[];
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
  players: Player[];
  rolesAssigned: Record<string, string>;
  initialRoles: Record<string, string>;
  centerCards: string[];
  roleCounts: Record<string, number>;
  unlockedRoles: string[];
  orbitActions: Record<string, PlayerAction>;
  orbitCompleted: string[];
  orbitFeedback: Record<string, { type: string; data?: unknown }>;
  roleAcknowledgements: string[];
  resolutionAcknowledgements: string[];
  revealActions: Record<string, PlayerAction>;
  revealCompleted: string[];
  jammedPlayerId: string | null;
  hijackedTargets: Record<string, string>; // actorId -> targetId
  discussionStartedAt: number | null;
  votingStartedAt: number | null;
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

/** Roles whose abilities are auto-submitted (no player interaction needed). */
const PASSIVE_ROLE_IDS = new Set(["crew", "parasite"]);

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
  // Only non-spectators are considered active for game logic
  return state.players.filter((p) => !p.isSpectator && p.connectionStatus === "connected");
}

function freshRoundSummary(): RoundSummary {
  return { abilityLog: [], voteTally: [], voteCounts: [] };
}

function commanderVoteWeight(state: GameState, voterId: string): number {
  const voterRole = state.rolesAssigned[voterId];
  if (voterRole !== "commander") return 1;
  const feedback = state.orbitFeedback[voterId] as { type: string } | undefined;
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
    resolutionAcknowledgements: [],
    revealActions: {},
    revealCompleted: [],
    jammedPlayerId: null,
    hijackedTargets: {},
    discussionStartedAt: null,
    votingStartedAt: null,
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
    // Only assign roles to players who are NOT spectators.
    // If they joined as a spectator, they stay a spectator.
    if (!player.isSpectator) {
      state.rolesAssigned[player.id] = pool[roleIdx++] ?? pool[0];
      player.alive = true;
    } else {
      state.rolesAssigned[player.id] = "spectator";
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
  state.resolutionAcknowledgements = [];
  state.revealActions = {};
  state.revealCompleted = [];
  state.jammedPlayerId = null;
  state.hijackedTargets = {};
  state.discussionStartedAt = null;
  state.votingStartedAt = null;
  state.emergencyVote = freshEmergencyVote();
  state.votes = {};
  state.anesthetizedPlayers = [];
  state.voteResult = null;
  state.roundSummary = freshRoundSummary();
  state.orbitFeedback = {};

  state.phase = "role_reveal";
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
  playerId: string,
  revealAction?: PlayerAction,
): AcknowledgeRoleResult {
  if (state.phase !== "role_reveal") {
    return { accepted: false, orbitInfo: { type: "none" }, allAcknowledged: false, error: "wrong phase" };
  }
  const player = state.players.find((p) => p.id === playerId);
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
    for (const tId of (revealAction.targets || [])) {
      const targetPlayer = state.players.find(p => p.id === tId);
      if (targetPlayer && targetPlayer.isSpectator) {
        return { accepted: false, orbitInfo: { type: "none" }, allAcknowledged: false, error: "cannot target spectators" };
      }
    }
    state.revealActions[playerId] = revealAction;
    if (revealAction.alignment) {
      if (!state.chaoticAlignments) state.chaoticAlignments = {};
      state.chaoticAlignments[playerId] = revealAction.alignment;
    }
  }

  const orbitInfo = computeOrbitInfo(state, playerId);

  // Auto-submit for the acknowledging player if they have a passive role
  const roleId = state.rolesAssigned[playerId];
  if (PASSIVE_ROLE_IDS.has(roleId) && !state.orbitCompleted.includes(playerId)) {
    const passiveAction: PlayerAction = {
      type: roleId === "parasite" ? "passive" : "none",
      targets: [],
    };
    submitActionInternal(state, playerId, passiveAction);
  }

  // Block phase advance while game is frozen (grace period or interrupted)
  if (isGameFrozen(state)) {
    return { accepted: true, orbitInfo, allAcknowledged: false };
  }

  // Post-resume safety: consume the justUnfrozen flag to prevent instant phase skip
  if (consumeJustUnfrozen(state)) {
    return { accepted: true, orbitInfo, allAcknowledged: false };
  }

  const activeCount = getActivePlayers(state).length;
  if (state.roleAcknowledgements.length < activeCount) {
    return { accepted: true, orbitInfo, allAcknowledged: false };
  }

  // All acknowledged → advance to orbit_action
  processRevealActions(state);
  state.phase = "orbit_action";

  const autoActions: Array<{ playerId: string; roleId: string; action: PlayerAction }> = [];
  const alivePlayers = state.players.filter((p) => p.alive);
  for (const p of alivePlayers) {
    const rId = state.rolesAssigned[p.id];
    if (PASSIVE_ROLE_IDS.has(rId)) {
      // If they haven't submitted yet (e.g. disconnected or just didn't acknowledge yet)
      if (!state.orbitCompleted.includes(p.id)) {
        const passiveAction: PlayerAction = {
          type: rId === "parasite" ? "passive" : "none",
          targets: [],
        };
        submitActionInternal(state, p.id, passiveAction);
        autoActions.push({ playerId: p.id, roleId: rId, action: passiveAction });
      }
    }
  }

  const allSubmitted = state.orbitCompleted.length >= activeCount;

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
  playerId: string,
): { type: string; data?: unknown } {
  const role = state.rolesAssigned[playerId];
  if (role === "parasite") {
    const alienPlayers = state.players
      .filter((p) => state.rolesAssigned[p.id] === "alien")
      .map((p) => p.name);
    return { type: "parasite_info", data: { alienPlayers } };
  }
  return { type: "none" };
}

/**
 * Internal helper — stores an action and marks the player as completed.
 * Used by both submitAction (player-initiated) and acknowledgeRole (auto-passive).
 */
function submitActionInternal(state: GameState, playerId: string, action: PlayerAction): void {
  state.orbitActions[playerId] = action;
  if (!state.orbitCompleted.includes(playerId)) {
    state.orbitCompleted.push(playerId);
  }
}

/**
 * Submit a player's orbit action.
 *
 * MUTATION: modifies `state` in place.
 */
export function submitAction(
  state: GameState,
  playerId: string,
  action: PlayerAction,
): ActionResult {
  if (state.phase !== "orbit_action") {
    return { accepted: false, allSubmitted: false, error: "Phase protocol mismatch: orbit_action required" };
  }
  const player = state.players.find(p => p.id === playerId);
  if (!player) {
    return { accepted: false, allSubmitted: false, error: "Identity verification failed: player not in session" };
  }
  if (player.isSpectator) {
    return { accepted: false, allSubmitted: false, error: "Spectator interference prohibited" };
  }

  // ── FINALITY LOCK ──
  // Prevent race conditions or double-submissions
  if (state.orbitCompleted.includes(playerId)) {
    return { accepted: false, allSubmitted: false, error: "Action already synchronized" };
  }

  // ── ROLE AUTHORITY VALIDATION ──
  // Strictly enforce that the player's role is allowed to perform the submitted action type
  const roleId = state.rolesAssigned[playerId];
  const allowedActions: Record<string, string[]> = {
    scanner: ["scan_player", "scan_deck", "skip"],
    alien: ["alien_view", "skip"],
    disruptor: ["disrupt", "skip"],
    commander: ["boost", "skip"],
    warper: ["warp", "skip"],
    shifter: ["exchange", "skip"],
    sentinel: ["watch", "skip"],
    seeker: ["seek", "skip"],
    parasite: ["passive", "none"], // Auto-handled
    crew: ["none"], // Auto-handled
  };

  if (!allowedActions[roleId]?.includes(action.type)) {
    return { accepted: false, allSubmitted: false, error: `Unauthorized protocol for role: ${roleId}` };
  }

  // Prevent targeting spectators in Orbit phase
  for (const tId of (action.targets || [])) {
    // Center cards are not players
    if (tId.startsWith("center_")) continue;
    const targetPlayer = state.players.find(p => p.id === tId);
    if (targetPlayer && targetPlayer.isSpectator) {
      return { accepted: false, allSubmitted: false, error: "Targeting spectators is prohibited" };
    }
  }

  submitActionInternal(state, playerId, action);

  // Block resolution trigger while game is frozen (grace period or interrupted)
  if (isGameFrozen(state)) {
    return { accepted: true, allSubmitted: false };
  }

  // Post-resume safety: consume the justUnfrozen flag to prevent instant resolution
  if (consumeJustUnfrozen(state)) {
    return { accepted: true, allSubmitted: false };
  }

  return {
    accepted: true,
    allSubmitted: state.orbitCompleted.length >= getActivePlayers(state).length,
  };
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

  const blockedPlayers = new Set<string>();
  const actionLog: Record<string, string[]> = {};
  const sentinelWatchTargets: Record<string, string> = {};

  const feedback: Record<string, PrivateFeedback> = {};
  const abilityLog: AbilityLogEntry[] = [];
  const loggedPlayerIds = new Set<string>();

  function logInternal(targetId: string, desc: string) {
    if (!actionLog[targetId]) actionLog[targetId] = [];
    actionLog[targetId].push(desc);
  }

  function logActor(actorName: string, actorId: string, event: string) {
    abilityLog.push({ actorName, event });
    loggedPlayerIds.add(actorId);
  }

  // ── Pass 1: resolve all roles in strict order ────────────────────────────
  for (const roleId of ROLE_ORDER) {
    const actors = state.players.filter((p) => startRoles[p.id] === roleId);

    for (const actor of actors) {
      const action = state.orbitActions[actor.id];

      // Roles that act during Role Reveal
      if (roleId === "doctor") {
        const revealAction = state.revealActions[actor.id];
        if (revealAction && revealAction.targets[0]) {
          const target = state.players.find(p => p.id === revealAction.targets[0]);
          feedback[actor.id] = { type: "doctor_result", data: { targetName: target?.name ?? "a player" } };
          logActor(actor.name, actor.id, `anesthetized ${target?.name ?? "a player"}`);
        } else {
          feedback[actor.id] = { type: "skipped" };
          logActor(actor.name, actor.id, "skipped their ability");
        }
        continue;
      }
      if (roleId === "virus") {
        const revealAction = state.revealActions[actor.id];
        if (revealAction && revealAction.targets[0]) {
          const target = state.players.find(p => p.id === revealAction.targets[0]);
          feedback[actor.id] = { type: "virus_result", data: { targetName: target?.name ?? "a player" } };
          logActor(actor.name, actor.id, `used Packet Loss on ${target?.name ?? "a player"}`);
        } else {
          feedback[actor.id] = { type: "skipped" };
          logActor(actor.name, actor.id, "skipped their ability");
        }
        continue;
      }
      if (roleId === "router") {
        const revealAction = state.revealActions[actor.id];
        if (revealAction && revealAction.targets[0] && revealAction.targets[1]) {
          const source = state.players.find(p => p.id === revealAction.targets[0]);
          const dest = state.players.find(p => p.id === revealAction.targets[1]);
          feedback[actor.id] = { type: "router_result", data: { sourceName: source?.name ?? "a player", destName: dest?.name ?? "another player" } };
          logActor(actor.name, actor.id, `hijacked ${source?.name ?? "a player"}'s ability`);
        } else {
          feedback[actor.id] = { type: "skipped" };
          logActor(actor.name, actor.id, "skipped their ability");
        }
        continue;
      }

      // No submission (or auto-submit)
      if (!action || action.type === "passive" || action.type === "none") {
        feedback[actor.id] = { type: roleId === "parasite" ? "passive" : "no_ability" };
        logActor(
          actor.name,
          actor.id,
          roleId === "parasite"
            ? "(Parasite) monitored via passive ability"
            : "skipped their ability",
        );
        continue;
      }

      // Voluntary skip
      if (action.type === "skip") {
        feedback[actor.id] = { type: "skipped" };
        logActor(actor.name, actor.id, "skipped their ability");
        continue;
      }

      const originalTargets = [...action.targets];
      let targets = [...action.targets];

      // Router Effect: Gateway Hijack
      if (state.hijackedTargets[actor.id]) {
        const destinationId = state.hijackedTargets[actor.id];
        
        // REFINEMENT: Hijack only applies to actions targeting players.
        // It does NOT redirect Deck-based actions (center_*) or affect certain roles.
        const isDeckAction = action?.targets?.some(t => t.startsWith("center_"));
        const isExemptRole = ["alien", "commander", "crew"].includes(roleId);

        if (!isDeckAction && !isExemptRole) {
          const destination = state.players.find(p => p.id === destinationId);
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
      if (!immuneToBlock && blockedPlayers.has(actor.id)) {
        feedback[actor.id] = { type: "blocked" };
        logActor(actor.name, actor.id, "(Ability) was blocked");
        continue;
      }

      switch (roleId) {
        // ── Sentinel ─────────────────────────────────────────────────────
        case "sentinel": {
          const targetId = targets[0];
          if (targetId) {
            sentinelWatchTargets[actor.id] = targetId;
            const target = state.players.find((p) => p.id === targetId);
            logActor(actor.name, actor.id, `(Sentinel) observed ${target?.name ?? "a player"}`);
          } else {
            feedback[actor.id] = { type: "no_action" };
            logActor(actor.name, actor.id, "(Sentinel) did not select a watch target");
          }
          break;
        }

        // ── Scanner ──────────────────────────────────────────────────────
        case "scanner": {
          if (action.type === "scan_player") {
            const target = state.players.find((p) => p.id === targets[0]);
            if (target) {
              const initialRole = state.initialRoles[target.id] ?? "unknown";
              feedback[actor.id] = {
                type: "scan_player",
                data: { targetName: target.name, roleId: initialRole },
              };
              logInternal(target.id, "role was inspected by a scanner");
              logActor(actor.name, actor.id, `(Scanner) scanned ${target.name}`);
            }
          } else if (action.type === "scan_deck") {
            const roles = targets.slice(0, 2).map((t) => {
              const idx = parseInt(t.replace("center_", ""), 10);
              return state.centerCards[idx] ?? "unknown";
            });
            feedback[actor.id] = { type: "scan_deck", data: { roles } };
            logActor(actor.name, actor.id, "(Scanner) scanned the central deck");
          } else {
            logActor(actor.name, actor.id, "(Scanner) used an unknown scan action");
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
            feedback[actor.id] = {
              type: "alien_view",
              data: { cardIndex: idx, roleId: cardRole },
            };
            logActor(actor.name, actor.id, "(Alien) reviewed a hidden card from the central deck");
          } else {
            feedback[actor.id] = { type: "no_action" };
            logActor(actor.name, actor.id, "(Alien) used their ability");
          }
          break;
        }

        // ── Disruptor ────────────────────────────────────────────────────
        case "disruptor": {
          const targetId = targets[0];
          const targetRole = state.rolesAssigned[targetId];
          const targetPlayer = state.players.find((p) => p.id === targetId);
          if (targetRole === "scanner") {
            feedback[actor.id] = { type: "disrupt_ineffective" };
            logActor(actor.name, actor.id, "(Disruptor) attempted to block — target was immune");
          } else {
            blockedPlayers.add(targetId);
            const originalTarget = state.players.find(p => p.id === originalTargets[0]);
            logInternal(targetId, "ability was blocked");
            logActor(
              actor.name, 
              actor.id, 
              `(Disruptor) blocked ${originalTarget?.name ?? "a player"}'s ability`
            );
          }
          break;
        }

        // ── Parasite (active branch — passive already handled above) ──
        case "parasite": {
          feedback[actor.id] = { type: "passive" };
          logActor(actor.name, actor.id, "(Parasite) monitored via passive ability");
          break;
        }

        // ── Seeker ───────────────────────────────────────────────────────
        case "seeker": {
          const target = state.players.find((p) => p.id === targets[0]);
          if (target) {
            const role = state.rolesAssigned[target.id];
            let alignment = role === "alien" || role === "parasite" || role === "virus" ? "Bad" : "Good";
            
            // Chaotic Alignment Override
            if (role === "chaotic" && state.chaoticAlignments[target.id]) {
              alignment = state.chaoticAlignments[target.id];
            }

            feedback[actor.id] = {
              type: "seek_result",
              data: { targetName: target.name, alignment },
            };
            logInternal(target.id, "alignment was checked");
            logActor(actor.name, actor.id, `(Seeker) checked ${target.name}'s alignment`);
          } else {
            feedback[actor.id] = { type: "no_action" };
            logActor(actor.name, actor.id, "(Seeker) attempted an alignment check — no valid target");
          }
          break;
        }

        // ── Commander ────────────────────────────────────────────────────
        case "commander": {
          feedback[actor.id] = { type: "commander_boost", data: { granted: true } };
          logActor(actor.name, actor.id, "(Commander) activated vote boost");
          break;
        }

        // ── Warper (MUTATES state.rolesAssigned) ─────────────────────────
        case "warper": {
          const [tA, tB] = targets;
          if (tA && tB) {
            const playerA = state.players.find((p) => p.id === tA);
            const playerB = state.players.find((p) => p.id === tB);

            if (!playerA || !playerB || tA === actor.id || tB === actor.id) {
              feedback[actor.id] = { type: "no_action" };
              logActor(actor.name, actor.id, "(Warper) attempted an invalid swap (cannot swap self)");
              break;
            }

            const roleA = state.rolesAssigned[tA];
            const roleB = state.rolesAssigned[tB];
            state.rolesAssigned[tA] = roleB;
            state.rolesAssigned[tB] = roleA;
            const originalA = state.players.find(p => p.id === originalTargets[0]);
            const originalB = state.players.find(p => p.id === originalTargets[1]);

            logInternal(tA, "role was swapped by a warper");
            logInternal(tB, "role was swapped by a warper");
            feedback[actor.id] = {
              type: "warper_swap",
              data: { 
                playerAName: originalA?.name ?? playerA.name, 
                playerBName: originalB?.name ?? playerB.name 
              },
            };
            logActor(
              actor.name,
              actor.id,
              `swapped the roles of ${originalA?.name ?? playerA.name} and ${originalB?.name ?? playerB.name}`,
            );
          } else {
            feedback[actor.id] = { type: "no_action" };
            logActor(actor.name, actor.id, "used their ability (incomplete targets)");
          }
          break;
        }

        // ── Shifter (MUTATES state.rolesAssigned) ────────────────────────
        case "shifter": {
          const targetId = targets[0];
          const targetPlayer = state.players.find((p) => p.id === targetId);

          if (!targetPlayer) {
            feedback[actor.id] = { type: "no_action" };
            logActor(actor.name, actor.id, "attempted an invalid exchange");
            break;
          }

          const actorRole = state.rolesAssigned[actor.id];
          const targetRole = state.rolesAssigned[targetId];
          state.rolesAssigned[actor.id] = targetRole;
          state.rolesAssigned[targetId] = actorRole;
          
          logInternal(actor.id, "role was changed by a shifter");
          logInternal(targetId, "role was changed by a shifter");
          feedback[actor.id] = {
            type: "shifter_exchange",
            data: { targetName: targetPlayer.name, acquiredRole: targetRole },
          };
          logActor(actor.name, actor.id, `exchanged roles with ${targetPlayer.name}`);
          break;
        }

        default: {
          feedback[actor.id] = { type: "no_action" };
          logActor(actor.name, actor.id, "used their ability");
        }
      }
    }
  }

  // ── Pass 2: compile Sentinel reports (actionLog is now complete) ─────────
  for (const [sentinelId, targetId] of Object.entries(sentinelWatchTargets)) {
    const target = state.players.find((p) => p.id === targetId);
    if (!target) continue;
    const actions = actionLog[targetId] ?? [];
    feedback[sentinelId] = {
      type: "sentinel_report",
      data: { targetName: target.name, actions },
    };
  }

  // ── Catch-all: players with no feedback yet ──────────────────────────────
  for (const player of state.players) {
    if (!loggedPlayerIds.has(player.id)) {
      feedback[player.id] = { type: "no_ability" };
      logActor(player.name, player.id, "skipped their ability");
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
  state.discussionStartedAt = now;
}

/**
 * Transition the game to the voting phase.
 *
 * MUTATION: modifies `state` in place.
 */
export function startVoting(state: GameState, now: number = Date.now()): void {
  state.phase = "voting";
  state.votingStartedAt = now;
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

  const caller = state.players.find((p) => p.id === callerId);
  if (!caller) {
    return { accepted: false, error: "not in session" };
  }
  if (caller.isSpectator) {
    return { accepted: false, error: "spectators cannot call emergency votes" };
  }
  state.emergencyVote = {
    active: true,
    callerId,
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
  voterId: string,
  vote: "yes" | "no",
  now: number = Date.now(),
): EmergencyVoteCastResult {
  if (!state.emergencyVote.active) {
    return { accepted: false, outcome: null, error: "no active emergency vote" };
  }
  if (!state.players.some((p) => p.id === voterId)) {
    return { accepted: false, outcome: null, error: "not in session" };
  }
  const voter = state.players.find(p => p.id === voterId);
  if (voter?.isSpectator) {
    return { accepted: false, outcome: null, error: "spectators cannot vote" };
  }

  const ev = state.emergencyVote;

  // Deduplication
  if (ev.yesVoters.includes(voterId) || ev.noVoters.includes(voterId)) {
    return { accepted: true, outcome: null };
  }

  if (vote === "yes") ev.yesVoters.push(voterId);
  else ev.noVoters.push(voterId);

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
      state.votingStartedAt = now;
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
  voterId: string,
  targetId: string,
): VoteCastResult {
  if (state.phase !== "voting") {
    return { accepted: false, votingComplete: false, error: "Phase protocol mismatch: voting phase required" };
  }
  const voter = state.players.find(p => p.id === voterId);
  if (!voter) {
    return { accepted: false, votingComplete: false, error: "Identity verification failed: player not in session" };
  }
  if (voter.isSpectator) {
    return { accepted: false, votingComplete: false, error: "Spectators cannot vote" };
  }

  // ── FINALITY LOCK ──
  // Prevent changing votes or double-voting once synchronized
  if (state.votes[voterId]) {
    return { accepted: false, votingComplete: false, error: "Vote already synchronized and locked" };
  }

  // ── ANESTHESIA ENFORCEMENT ──
  if (voter?.playerId && state.anesthetizedPlayers?.includes(voter.playerId)) {
    return { accepted: false, votingComplete: false, error: "Neural link inhibited: you cannot cast a vote this round" };
  }

  // Validate target
  if (targetId !== "abstain") {
    if (targetId === voterId) {
      return { accepted: false, votingComplete: false, error: "Self-targeting prohibited in voting protocol" };
    }
    const targetPlayer = state.players.find((p) => p.id === targetId);
    if (!targetPlayer) {
      return { accepted: false, votingComplete: false, error: "Target not found in session" };
    }
    if (targetPlayer.isSpectator) {
      return { accepted: false, votingComplete: false, error: "Targeting spectators is prohibited" };
    }
  }

  state.votes[voterId] = targetId;

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
  
  if (Object.keys(state.votes).length < (activeCount - activeAnesthetizedCount)) {
    return { accepted: true, votingComplete: false };
  }

  // ── All votes in — tally ──────────────────────────────────────────────────
  const result = tallyVotes(state);
  if (result.eliminatedId) {
    const eliminatedPlayer = state.players.find((p) => p.id === result.eliminatedId);
    if (eliminatedPlayer) {
      eliminatedPlayer.alive = false;
    }
  }
  result.allRoles = state.players.map((p) => ({
    playerId: p.id,
    stablePlayerId: p.playerId,
    playerName: p.name,
    role: state.rolesAssigned[p.id] ?? "unknown",
    initialRole: state.initialRoles[p.id] ?? "unknown",
    alive: p.alive !== false,
  }));
  state.voteResult = result;

  // Build round summary
  const voteTally = Object.entries(state.votes).map(([vid, tid]) => {
    const voter = state.players.find((p) => p.id === vid);
    const abstain = tid === "abstain";
    const target = abstain ? null : state.players.find((p) => p.id === tid);
    const weight = commanderVoteWeight(state, vid);
    return {
      voterName: voter?.name ?? "Unknown",
      targetName: abstain ? "—" : (target?.name ?? "Unknown"),
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
      const player = state.players.find((p) => p.id === tid);
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

  const activeCount = getActivePlayers(state).length;
  const activeAnesthetizedCount = (state.anesthetizedPlayers || []).filter(pId => 
    state.players.find(p => p.playerId === pId)?.connectionStatus === "connected"
  ).length;

  if (Object.keys(state.votes).length < (activeCount - activeAnesthetizedCount)) {
    return { accepted: true, votingComplete: false };
  }

  // All active players have voted — tally
  const result = tallyVotes(state);
  if (result.eliminatedId) {
    const eliminatedPlayer = state.players.find((p) => p.id === result.eliminatedId);
    if (eliminatedPlayer) {
      eliminatedPlayer.alive = false;
    }
  }
  result.allRoles = state.players.map((p) => ({
    playerId: p.id,
    stablePlayerId: p.playerId,
    playerName: p.name,
    role: state.rolesAssigned[p.id] ?? "unknown",
    initialRole: state.initialRoles[p.id] ?? "unknown",
    alive: p.alive !== false,
  }));
  state.voteResult = result;

  // Build round summary
  const voteTally = Object.entries(state.votes).map(([vid, tid]) => {
    const voter = state.players.find((p) => p.id === vid);
    const abstain = tid === "abstain";
    const target = abstain ? null : state.players.find((p) => p.id === tid);
    const weight = commanderVoteWeight(state, vid);
    return {
      voterName: voter?.name ?? "Unknown",
      targetName: abstain ? "—" : (target?.name ?? "Unknown"),
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
      const player = state.players.find((p) => p.id === tid);
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
    playerId: p.id,
    stablePlayerId: p.playerId,
    playerName: p.name,
    role: state.rolesAssigned[p.id] ?? "unknown",
    initialRole: state.initialRoles[p.id] ?? "unknown",
    alive: p.alive !== false,
    alignment: state.chaoticAlignments?.[p.id],
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
  const eliminated = state.players.find((p) => p.id === eliminatedId);
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
  state.resolutionAcknowledgements = [];
  state.discussionStartedAt = null;
  state.votingStartedAt = null;
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
  console.log(`[reconnectPlayer] START oldId=${oldId}, newId=${newId}`);
  console.log(`[reconnectPlayer] BEFORE state.rolesAssigned:`, state.rolesAssigned);
  
  if (oldId === newId) {
    const player = state.players.find((p) => p.id === oldId);
    if (player) {
      player.connected = true;
      player.connectionStatus = "connected";
    }
    removePlayerFromGrace(state, oldId);
    console.log(`[reconnectPlayer] SKIPPED (oldId === newId)`);
    return;
  }

  // Update the player entry
  const player = state.players.find((p) => p.id === oldId);
  if (player) {
    player.id = newId;
    player.connected = true;
    player.connectionStatus = "connected";
  } else {
    console.log(`[reconnectPlayer] WARNING: Player not found in state.players for oldId=${oldId}`);
  }

  // Remap keyed records
  const remap = (record: any, name: string) => {
    if (!record) {
      console.log(`[reconnectPlayer] WARNING: ${name} record itself is undefined! Initializing...`);
      return;
    }
    if (record[oldId] !== undefined) {
      record[newId] = record[oldId];
      delete record[oldId];
      console.log(`[reconnectPlayer] Remapped ${name} from ${oldId} to ${newId}`);
    } else {
      console.log(`[reconnectPlayer] WARNING: ${name}[oldId] is undefined`);
    }
  };

  // Ensure record fields exist before remapping to avoid crashes with legacy sessions
  state.rolesAssigned = state.rolesAssigned || {};
  state.initialRoles = state.initialRoles || {};
  state.orbitActions = state.orbitActions || {};
  state.orbitFeedback = state.orbitFeedback || {};
  state.votes = state.votes || {};
  state.chaoticAlignments = state.chaoticAlignments || {};

  remap(state.rolesAssigned, "rolesAssigned");
  remap(state.initialRoles, "initialRoles");
  remap(state.orbitActions, "orbitActions");
  remap(state.orbitFeedback, "orbitFeedback");
  remap(state.votes, "votes");
  remap(state.chaoticAlignments, "chaoticAlignments");

  // Remap arrays of IDs
  const remapArray = (arr: string[]) => arr.map((id) => (id === oldId ? newId : id));
  state.orbitCompleted = remapArray(state.orbitCompleted);
  state.roleAcknowledgements = remapArray(state.roleAcknowledgements);
  state.resolutionAcknowledgements = remapArray(state.resolutionAcknowledgements);
  // anesthetizedPlayers uses stable playerId — no remapping required

  // Remap emergency vote state (yesVoters, noVoters, callerId all use socket IDs)
  if (state.emergencyVote) {
    state.emergencyVote.yesVoters = remapArray(state.emergencyVote.yesVoters);
    state.emergencyVote.noVoters = remapArray(state.emergencyVote.noVoters);
    if (state.emergencyVote.callerId === oldId) {
      state.emergencyVote.callerId = newId;
    }
  }

  // Remap nested targets in orbit actions
  for (const action of Object.values(state.orbitActions)) {
    if (action && action.targets) {
      action.targets = remapArray(action.targets);
    }
  }

  // Remap targets in votes
  for (const [voterId, targetId] of Object.entries(state.votes)) {
    if (targetId === oldId) {
      state.votes[voterId] = newId;
    }
  }

  // Remove from grace tracking (player reconnected)
  removePlayerFromGrace(state, oldId);
}

/**
 * Add a player to the game.
 *
 * MUTATION: modifies `state.players` in place.
 * Returns false if the player is already present.
 */
export function addPlayer(state: GameState, player: Player): boolean {
  const existing = state.players.find((p) => p.id === player.id);
  if (existing) return false;
  state.players.push({ ...player, alive: true });
  return true;
}

/**
 * Remove a player from the game and clean up their keyed data.
 *
 * MUTATION: modifies `state` in place.
 * Returns true if the player was found and removed.
 */
export function removePlayer(state: GameState, playerId: string): boolean {
  const idx = state.players.findIndex((p) => p.id === playerId);
  if (idx === -1) return false;

  state.players.splice(idx, 1);
  delete state.rolesAssigned[playerId];
  delete state.initialRoles[playerId];
  delete state.orbitActions[playerId];
  delete state.orbitFeedback[playerId];
  delete state.votes[playerId];
  state.orbitCompleted = state.orbitCompleted.filter((id) => id !== playerId);
  state.roleAcknowledgements = state.roleAcknowledgements.filter((id) => id !== playerId);
  state.resolutionAcknowledgements = state.resolutionAcknowledgements.filter((id) => id !== playerId);

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
  requesterSocketId: string,
  targetPlayerId: string,
): KickPlayerResult {
  const requester = state.players.find((p) => p.id === requesterSocketId);
  if (!requester) {
    return { accepted: false, error: "Not in session" };
  }
  if (!requester.isHost) {
    return { accepted: false, error: "Only the host can kick players" };
  }
  if (state.phase !== "lobby" && state.phase !== "role_config") {
    return { accepted: false, error: "Cannot kick players after game has started" };
  }

  // Find the target by their stable UUID (not socket.id which changes on reconnect)
  const target = state.players.find((p) => p.playerId === targetPlayerId);

  // Idempotent: already kicked or removed → success, no-op
  if (!target) {
    return state.kickedPlayerIds.includes(targetPlayerId)
      ? { accepted: true }
      : { accepted: false, error: "Player not found" };
  }

  if (target.id === requesterSocketId || (target.playerId !== undefined && target.playerId === requester.playerId)) {
    return { accepted: false, error: "Host cannot kick themselves" };
  }

  const kickedSocketId = target.id;
  const kickedPlayerName = target.name;

  // Persist the ban before mutating players
  if (!state.kickedPlayerIds.includes(targetPlayerId)) {
    state.kickedPlayerIds.push(targetPlayerId);
  }

  // Remove from active players and clean up all session state keyed by socket.id
  state.players = state.players.filter((p) => p.id !== kickedSocketId);
  delete state.rolesAssigned[kickedSocketId];
  delete state.initialRoles[kickedSocketId];
  delete state.orbitActions[kickedSocketId];
  delete state.orbitFeedback[kickedSocketId];
  delete state.votes[kickedSocketId];
  state.orbitCompleted = state.orbitCompleted.filter((id) => id !== kickedSocketId);
  state.roleAcknowledgements = state.roleAcknowledgements.filter((id) => id !== kickedSocketId);
  state.resolutionAcknowledgements = state.resolutionAcknowledgements.filter((id) => id !== kickedSocketId);

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
      const targetSocketId = action.targets[0];
      const target = state.players.find(p => p.id === targetSocketId);
      const actor = state.players.find(p => p.id === actorId);
      if (target?.playerId && actor?.playerId && target.playerId !== actor.playerId) {
        state.anesthetizedPlayers.push(target.playerId);
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
export function addPlayerToGrace(state: GameState, socketId: string): void {
  if (!state.playersInGrace) state.playersInGrace = [];
  if (!state.playersInGrace.includes(socketId)) {
    state.playersInGrace.push(socketId);
  }
  // Mark player as reconnecting for presence UI
  const player = state.players.find((p) => p.id === socketId);
  if (player) player.connectionStatus = "reconnecting";
}

/**
 * Remove a player from the grace tracking list (e.g. on reconnect or expiry).
 *
 * MUTATION: modifies `state.playersInGrace` in place.
 */
export function removePlayerFromGrace(state: GameState, socketId: string): void {
  if (!state.playersInGrace) return;
  const wasFrozen = state.playersInGrace.length > 0;
  state.playersInGrace = state.playersInGrace.filter((id) => id !== socketId);
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
  return (state.playersInGrace?.length ?? 0) > 0;
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

  // 0. Jamming Effect (Virus) — Mask identities for the jammed player
  if (state.jammedPlayerId === viewerSocketId && state.phase === "orbit_action") {
    sanitized.players = state.players.map(p => ({
      ...p,
      name: p.id === viewerSocketId ? p.name : "DATA CORRUPTED",
    }));
  }

  // 1. Clear globally sensitive data unless in result phase
  if (state.phase !== "result") {
    sanitized.centerCards = [];
    sanitized.orbitActions = {};

    // Anonymous voting: hide voter targets
    if (state.settings?.anonymousVoting && state.phase === "voting") {
      sanitized.votes = Object.keys(state.votes).reduce((acc, id) => {
        acc[id] = "voted";
        return acc;
      }, {} as Record<string, string>);
    }
  }

  // 2. Roles Sanitization — hide other players' roles and swap info
  if (state.phase !== "result" && state.phase !== "role_config" && state.phase !== "lobby") {
    const sanitizedRoles: Record<string, string> = {};
    
    // Find the player entry to check their ID mapping (socket ID vs persistent ID)
    const viewer = state.players.find(p => p.id === viewerSocketId);
    
    // We use socketId (key in rolesAssigned) for lookup
    const myRole = state.rolesAssigned[viewerSocketId];
    const myInitialRole = state.initialRoles[viewerSocketId];

    if (myRole) {
      // RULE: You see your initial role unless you are a Shifter.
      // Shifters exchange roles and are aware of it.
      // Warper targets are NOT aware they were swapped.
      if (myInitialRole === "shifter") {
        sanitizedRoles[viewerSocketId] = myRole;
      } else {
        sanitizedRoles[viewerSocketId] = myInitialRole;
      }

      // Alien Team Visibility: Aliens see each other.
      // You only see the team if your PERCEIVED role is part of it.
      const perceivedRole = sanitizedRoles[viewerSocketId];
      if (perceivedRole === "alien" || perceivedRole === "parasite" || perceivedRole === "virus") {
        for (const [id, r] of Object.entries(state.rolesAssigned)) {
          if (r === "alien" || r === "parasite" || r === "virus") {
            sanitizedRoles[id] = r;
          }
        }
      }
    }
    
    // 3. Spectator Visibility: Spectators see ALL roles and full round summary
    if (viewer?.isSpectator) {
      sanitized.rolesAssigned = { ...state.rolesAssigned };
      sanitized.initialRoles = { ...state.initialRoles };
      // Spectators see the full round summary (ability logs) even before the result phase
      sanitized.roundSummary = state.roundSummary;
    } else {
      sanitized.rolesAssigned = sanitizedRoles;
      sanitized.initialRoles = {}; // Hide everyone else's initial roles
      
      // Regular players ONLY see the round summary in the result phase
      sanitized.roundSummary = { abilityLog: [], voteTally: [], voteCounts: [] };
    }
  }

  return sanitized;
}

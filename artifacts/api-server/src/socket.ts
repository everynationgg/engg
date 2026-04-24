import { randomUUID } from "node:crypto";
import { Server as SocketIOServer } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import type { Server as HttpServer } from "node:http";
import { z } from "zod";
import {
  createSession,
  getSession,
  saveSession,
  addPlayerToSession,
  scheduleRemovePlayer,
  cancelRemovePlayer,
  scheduleGraceExpiry,
  deleteSession,
  acquireSessionLock,
  withCasRetry,
  CAS_SKIP,
  CAS_MAX_ATTEMPTS,
  sessionMetrics,
  isRedisOverloaded,
  freshEmergencyVote,
  freshRoundSummary,
} from "./sessions.js";
import {
  submitAction as engineSubmitAction,
  castVote as engineCastVote,
  resolveRound as engineResolveRound,
  applyResolution as engineApplyResolution,
  acknowledgeRole as engineAcknowledgeRole,
  startEmergencyVote as engineStartEmergencyVote,
  castEmergencyVote as engineCastEmergencyVote,
  restartGame as engineRestartGame,
  reconnectPlayer as engineReconnectPlayer,
  computeOrbitInfo as engineComputeOrbitInfo,
  kickPlayer as engineKickPlayer,
  interruptGame as engineInterruptGame,
  isGameInProgress as engineIsGameInProgress,
  endGame as engineEndGame,
  addPlayerToGrace as engineAddPlayerToGrace,
  removePlayerFromGrace as engineRemovePlayerFromGrace,
  isGameFrozen as engineIsGameFrozen,
  consumeJustUnfrozen as engineConsumeJustUnfrozen,
  resumeFromInterrupt as engineResumeFromInterrupt,
  sortPlayersByStatus as engineSortPlayersByStatus,
  startGame as engineStartGame,
  continueGame as engineContinueGame,
  checkSinglePlayerEdgeCase as engineCheckSinglePlayerEdgeCase,
  recheckVotingCompletion as engineRecheckVotingCompletion,
  removePlayer as engineRemovePlayer,
  computeSanitizedState as engineComputeSanitizedState,
  getActivePlayers as engineGetActivePlayers,
  startVoting as engineStartVoting,
  type PlayerAction,
} from "./modules/game/game.engine.js";
import { logger } from "./lib/logger.js";
import { db, gameChatsTable, usersTable, creditTransactionsTable } from "@workspace/db";
import { eq, desc, gt } from "drizzle-orm";
import { redisPub, redisSub } from "./config/redis.js";
import { checkRateLimit } from "./lib/rate-limit.js";
import { issuePlayerToken, verifyPlayerToken } from "./lib/auth.js";

// ── Named type aliases ────────────────────────────────────────────────────────
/** Resolved return type of getSession — either a VersionedSession or undefined. */
type MaybeSession = Awaited<ReturnType<typeof getSession>>;

/** Shape of a row returned from the game_chats table. */
interface GameChatRow {
  id: bigint;
  userId: string | null;
  guestName: string | null;
  message: string;
  timestamp: Date | string;
}

/** Monotonically increasing counter for system chat messages (not persisted). */
let nextSystemChatId = 0;

// ── Grace / session lifecycle constants ───────────────────────────────────────
/** Time a disconnected player has to reconnect before being marked permanently disconnected. */
const GRACE_PERIOD_MS = 60_000;
/** Delay before a session is deleted from Redis after the host quits. */
const SESSION_CLEANUP_DELAY_MS = 30_000;

// ── Rate-limit constants ──────────────────────────────────────────────────────
/** Sliding-window duration shared by all per-event rate limiters (1 minute). */
const RATE_LIMIT_WINDOW_MS = 60_000;
/** Submit-action: allow up to 20 per player per minute (generous for normal gameplay). */
const ACTION_RATE_LIMIT     = 20;
/** Voting events: allow up to 5 per player per minute. */
const VOTE_RATE_LIMIT       = 5;
/** Emergency vote start: allow at most 2 per player per minute. */
const EMERGENCY_START_LIMIT = 2;

// ── Structured game event logger ──────────────────────────────────────────────
//
// Every significant game state transition is logged as a structured JSON line
// with a stable `gameEvent: true` discriminator field.  This enables:
//   - Log aggregators (Loki, CloudWatch Insights) to filter by event type.
//   - Replay/debug: `jq 'select(.gameEvent)' <log.ndjson` reconstructs a
//     timeline of actions for any session.
//   - Metrics derivation: event counts, latency between events, player actions.
//
// Keep payload small — only include fields directly relevant to the event.
// Full session state is never logged (PII, size).

/**
 * Emit a structured game event for observability and replay capability.
 *
 * @param event     Machine-readable event name, e.g. `"action_submitted"`.
 * @param sessionId Session the event belongs to.
 * @param playerId  Player who triggered the event (socket/player ID).
 * @param payload   Optional additional context (phase, action type, etc.).
 */
function logGameEvent(
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

// ── Input validation schemas ──────────────────────────────────────────────────

/** Room codes are 6 upper-case alphanumeric characters (excluding O/0/I/1). */
const sessionIdSchema = z.string().regex(/^[A-Z2-9]{6}$/, "Invalid session ID");

/** Player display name: 1–30 characters, no leading/trailing whitespace. */
const playerNameSchema = z.string().min(1).max(30).transform((s) => s.trim());

const orbitActionSchema = z.object({
  type: z.string().min(1).max(50),
  targets: z.array(z.string().max(128)).max(10),
});

const createSessionSchema = z.object({
  sessionId: sessionIdSchema,
  playerName: playerNameSchema,
  playerId: z.string().uuid().optional(),
  userId: z.string().max(128).optional(),
  isSpectator: z.boolean().optional(),
});

const joinSessionSchema = z.object({
  sessionId: sessionIdSchema,
  playerName: playerNameSchema,
  playerId: z.string().uuid(),
  playerToken: z.string().min(1).max(128).optional(),
  userId: z.string().max(128).optional(),
  isSpectator: z.boolean().optional(),
});

/** Schema for the token-issuance event. */
const requestPlayerTokenSchema = z.object({
  playerId: z.string().uuid(),
});

const sessionOnlySchema = z.object({
  sessionId: sessionIdSchema,
});

const startGameSchema = z.object({
  sessionId: sessionIdSchema,
  roleCounts: z.record(z.string().max(50), z.number().int().min(0).max(20)),
  customRoles: z.record(z.string().max(128), z.string().max(50)).optional(),
});

// Schema for custom game start (custom player roles + custom deck)
const startGameCustomSchema = z.object({
  sessionId: sessionIdSchema,
  customRoles: z.record(z.string().max(128), z.string().max(50)),
  customDeck: z.array(z.string().max(50)).length(3),
});

const submitActionSchema = z.object({
  sessionId: sessionIdSchema,
  action: orbitActionSchema,
});

const castEmergencyVoteSchema = z.object({
  sessionId: sessionIdSchema,
  vote: z.enum(["yes", "no"]),
});

const castVoteSchema = z.object({
  sessionId: sessionIdSchema,
  targetId: z.string().min(1).max(128),
});

const sendChatMessageSchema = z.object({
  sessionId: sessionIdSchema,
  message: z.string().min(1).max(500).transform((s) => s.trim()),
});

const chatTypingSchema = z.object({
  sessionId: sessionIdSchema,
});

const kickPlayerSchema = z.object({
  sessionId: sessionIdSchema,
  targetPlayerId: z.string().uuid(),
});

/**
 * Validates socket event data with a Zod schema.
 * Returns the parsed (coerced) data on success, or sends a failure ack and
 * returns null so the caller can bail out early.
 */
function validate<T>(
  schema: z.ZodType<T>,
  data: unknown,
  ack?: (result: { success: false; error: string }) => void,
): T | null {
  const result = schema.safeParse(data);
  if (!result.success) {
    const msg = result.error.errors[0]?.message ?? "Invalid input";
    ack?.({ success: false, error: msg });
    return null;
  }
  return result.data;
}

function phaseUpdate(
  io: SocketIOServer,
  sessionId: string,
  session: MaybeSession,
) {
  if (!session) return;
  // Ensure consistent player ordering and connectionStatus in every broadcast
  engineSortPlayersByStatus(session);
  logger.info(
    { sessionId, phase: session.phase, players: session.players.length },
    "phase_update broadcast (sanitized)",
  );

  // Get all sockets currently in this session room
  const room = io.sockets.adapter.rooms.get(sessionId);
  if (room) {
    for (const socketId of room) {
      const socket = io.sockets.sockets.get(socketId);
      if (socket) {
        const sanitized = engineComputeSanitizedState(session, socketId);
        socket.emit("phase_update", sanitized);
      }
    }
  }
}

/**
 * Broadcast a system message into the in-game chat stream.
 * Unlike the existing `system_message` event (shown as a toast),
 * `chat_system_message` is rendered inline in the chat panel.
 */
function chatSystemMessage(io: SocketIOServer, sessionId: string, text: string) {
  io.to(sessionId).emit("chat_system_message", {
    id: `sys-${Date.now()}-${++nextSystemChatId}`,
    type: "system" as const,
    text,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Broadcast grace_update with connectionStatus for every player so clients
 * never show stale presence information between phase_update events.
 */
function graceUpdate(
  io: SocketIOServer,
  sessionId: string,
  session: MaybeSession,
  playerName: string,
) {
  if (!session) return;
  io.to(sessionId).emit("grace_update", {
    playersInGrace: (session.playersInGrace ?? []).filter(id => {
      const p = session.players.find(pl => pl.id === id);
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

/**
 * Called when saveSession returns false (version conflict).
 * Re-reads the latest state from Redis and broadcasts it so all clients stay
 * in sync with the authoritative server state.
 */
async function handleSaveConflict(
  io: SocketIOServer,
  sessionId: string,
): Promise<void> {
  logger.warn({ sessionId }, "Session save conflict — re-broadcasting latest state");
  const fresh = await getSession(sessionId);
  if (fresh) phaseUpdate(io, sessionId, fresh);
}

async function checkAndRunResolution(
  io: SocketIOServer,
  sessionId: string,
  session: NonNullable<MaybeSession>,
): Promise<void> {
   // Idempotency guard — only runs from orbit_action phase; prevents double-resolution
  if (session.phase !== "orbit_action") return;
  // Block resolution while game is frozen (grace period or interrupted)
  if (engineIsGameFrozen(session)) return;
  // Post-resume safety: consume justUnfrozen flag to prevent instant phase skip
  if (engineConsumeJustUnfrozen(session)) return;
  const activeCount = engineGetActivePlayers(session).length;
  if (session.orbitCompleted.length < activeCount) return;

  phaseUpdate(io, sessionId, session);

  // Step 1: signal all clients that resolution is computing (brief visual indicator)
  session.phase = "orbit_resolution";

  // Persist phase transition before delayed resolution so re-reads see the new phase.
  if (!await saveSession(session)) {
    logger.warn({ sessionId }, "Failed to persist orbit_resolution phase — aborting resolution run");
    const fresh = await getSession(sessionId);
    if (fresh) phaseUpdate(io, sessionId, fresh);
    return;
  }

  phaseUpdate(io, sessionId, session);

  // Step 2: run deterministic resolution after a short pause so the indicator is visible
  setTimeout(async () => {
    try {
      // Inline CAS retry — no distributed lock needed: if two instances race to resolve,
      // the first save wins (CAS) and the second will see a changed phase on re-read.
      for (let attempt = 1; attempt <= CAS_MAX_ATTEMPTS; attempt++) {
        const current = await getSession(sessionId);
        // Accept either phase to tolerate stale reads during rollout.
        if (!current || (current.phase !== "orbit_resolution" && current.phase !== "orbit_action")) {
          return;
        }

        // Block resolution if game became frozen during the delay (grace or interrupted)
        if (engineIsGameFrozen(current)) {
          logger.info({ sessionId }, "Resolution aborted — game frozen during delay");
          return;
        }

        // Delegate to game engine for pure resolution logic
        const resolutionResult = engineResolveRound(current);
        engineApplyResolution(current, resolutionResult);

        if (await saveSession(current)) {
          logger.info({ sessionId }, "Resolution complete");
          logger.info({ sessionId }, "Phase → discussion (post-resolution)");
          logGameEvent("resolution_complete", sessionId, "system", {
            phase: current.phase,
            players: current.players.length,
          });
          phaseUpdate(io, sessionId, current);

          // Deliver private results to each player as discussion begins
          for (const p of current.players) {
            const sock = io.sockets.sockets.get(p.id);
            if (sock) sock.emit("orbit_result", resolutionResult.feedback[p.id] ?? { type: "none" });
          }
          return;
        }

        // saveSession already incremented sessionMetrics.casConflicts
        logger.warn({ sessionId, attempt }, "Resolution save conflict — retrying");
        if (attempt < CAS_MAX_ATTEMPTS) {
          sessionMetrics.casRetries++;
          await new Promise<void>((r) => setTimeout(r, 10 * attempt));
        }
      }

      // All CAS attempts exhausted — another instance resolved it; broadcast authoritative state
      logger.warn({ sessionId }, "Resolution CAS exhausted — re-broadcasting authoritative state");
      const fresh = await getSession(sessionId);
      if (fresh) phaseUpdate(io, sessionId, fresh);
    } catch (err) {
      logger.error({ sessionId, err }, "Resolution pipeline failed unexpectedly");
      const fresh = await getSession(sessionId);
      if (fresh) phaseUpdate(io, sessionId, fresh);
    }
  }, 1500);
}

export function attachSocketIO(httpServer: HttpServer) {
  const defaultAllowedOrigins = new Set([
    "https://engg.online",
    "https://www.engg.online",
    "https://end.engg.online",
  ]);

  const envOrigins = (process.env.CORS_ORIGIN ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const corsOrigin = (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    if (!origin) {
      callback(null, true);
      return;
    }

    const allowed =
      /\.vercel\.app$/.test(origin)
      || defaultAllowedOrigins.has(origin)
      || envOrigins.includes(origin);

    if (allowed) {
      callback(null, true);
      return;
    }

    callback(new Error(`CORS blocked for origin: ${origin}`));
  };

  const io = new SocketIOServer(httpServer, {
    cors: { origin: corsOrigin, methods: ["GET", "POST"], credentials: true },
    path: "/socket.io",
    transports: ["polling", "websocket"],
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // ── Redis adapter — enables multi-instance Socket.IO (rooms/emits across nodes) ──
  io.adapter(createAdapter(redisPub, redisSub));

  io.on("connection", (socket) => {
    let currentSessionId: string | null = null;
    let currentPlayerId: string | null = null;
    let currentUserId: string | null = null;
    // Verified stable player identity token — set on join_session, checked on reconnect.
    let currentPlayerToken: string | null = null;
    // Stable rate-limit identity: prefer the player's persistent userId (survives reconnects)
    // over socket.id (ephemeral, changes on every new TCP connection).
    let currentRateLimitId: string | null = null;

    logger.info({ socketId: socket.id }, "Socket connected");

    // ── REQUEST PLAYER TOKEN ───────────────────────────────────────────────
    // Lightweight identity-binding step performed before join_session.
    // Client generates a UUID v4 (stored in localStorage), calls this event
    // once, and stores the returned token alongside the UUID.
    // The token is HMAC-SHA256(playerId, JWT_SECRET) — deterministic, stateless,
    // verifiable by any server instance.  Rate-limited to 10/min to prevent
    // enumeration of MAC values for arbitrary UUIDs.
    socket.on("request_player_token", async (data: unknown, ack) => {
      const parsed = validate(requestPlayerTokenSchema, data, ack);
      if (!parsed) return;

      if (!await checkRateLimit(socket.id, "request_player_token", 10, RATE_LIMIT_WINDOW_MS)) {
        ack?.({ success: false, error: "Rate limit exceeded — slow down" });
        return;
      }

      const token = issuePlayerToken(parsed.playerId);
      ack?.({ success: true, token });
    });

    // ── CREATE SESSION ─────────────────────────────────────────────────────
    socket.on(
      "create_session",
      async (data: unknown, ack) => {
        const parsed = validate(createSessionSchema, data, ack);
        if (!parsed) return;
        const { sessionId, playerName, playerId } = parsed;

        if (isRedisOverloaded()) {
          ack?.({ success: false, error: "Server busy — please try again shortly" });
          return;
        }

        const release = await acquireSessionLock(sessionId);
        try {
          let session = await getSession(sessionId);

          if (session) {
            // Session closed check — if the host quit, block all join/reconnect attempts
            if (session.status === "closed") {
              socket.emit("session_closed", { message: "Host ended the game" });
              ack?.({ success: false, error: "Session has been closed by the host" });
              return;
            }

            if (playerId && session.kickedPlayerIds.includes(playerId)) {
              ack?.({ success: false, error: "You have been removed from this session" });
              return;
            }

            // Reconnect match priority: stable playerId, then callsign fallback.
            const reconnecting = playerId
              ? session.players.find((p) => p.playerId === playerId) ?? session.players.find((p) => p.name === playerName)
              : session.players.find((p) => p.name === playerName);
            // Reject reconnect for players who explicitly quit
            if (reconnecting && reconnecting.didQuit) {
              socket.emit("session_closed", { message: "You left the game" });
              ack?.({ success: false, error: "You have left this session" });
              return;
            }
            if (reconnecting && reconnecting.id !== socket.id) {
              // Capture the old socket ID before overwriting it, then cancel its grace timer
              const oldId = reconnecting.id;
              cancelRemovePlayer(sessionId, oldId);

              // Delegate ID remapping to game engine (also removes from grace tracking)
              engineReconnectPlayer(session, oldId, socket.id);
              if (playerId && !reconnecting.playerId) {
                reconnecting.playerId = playerId;
              }

              // DO NOT auto-resume — host must explicitly use continue_game

              if (!await saveSession(session)) {
                await handleSaveConflict(io, sessionId);
                ack?.({ success: true });
                return;
              }

              // Broadcast updated grace state so clients clear reconnect banners
              graceUpdate(io, sessionId, session, playerName);
              // Emit reconnect system chat message
              chatSystemMessage(io, sessionId, `${playerName} reconnected`);

              logger.info({ sessionId, playerName, oldId, newId: socket.id }, "Player reconnected — ID updated");
              logGameEvent("player_reconnected", sessionId, socket.id, { playerName, oldId });
            } else if (reconnecting && reconnecting.id === socket.id) {
              // Same socket already associated; backfill missing stable identity if needed.
              if (playerId && !reconnecting.playerId) {
                reconnecting.playerId = playerId;
                if (!await saveSession(session)) {
                  await handleSaveConflict(io, sessionId);
                  ack?.({ success: true });
                  return;
                }
              }
            } else if (!reconnecting) {
              // New player mistakenly sent create_session on an existing session (e.g. stale lp_isHost).
              // Treat as a regular join so they are added to the session and all clients stay in sync.
              addPlayerToSession(session, {
                id: socket.id,
                playerId,
                name: playerName,
                isHost: false,
                isSpectator: !!parsed.isSpectator,
                connectionStatus: "connected",
              });
              if (!await saveSession(session)) {
                await handleSaveConflict(io, sessionId);
                ack?.({ success: true });
                return;
              }
              socket.join(sessionId);
              currentSessionId = sessionId;
              currentPlayerId = socket.id;
              currentUserId = parsed.userId ?? null;
              currentRateLimitId = parsed.userId ?? socket.id;
              logger.info({ sessionId, playerName }, "New player joined via create_session fallback");
              phaseUpdate(io, sessionId, session);
              ack?.({ success: true, session });
              return;
            }
            socket.join(sessionId);
            currentSessionId = sessionId;
            currentPlayerId = socket.id;
            currentUserId = reconnecting.userId ?? parsed.userId ?? null;
            // Use the stable userId (if provided) so the rate-limit window persists
            // across reconnects. Fall back to socket.id for anonymous sessions.
            currentRateLimitId = reconnecting.userId ?? parsed.userId ?? socket.id;
            // Sort players before sending to this socket
            engineSortPlayersByStatus(session);
            socket.emit("phase_update", session);
            // Re-deliver orbit result for late-joiners/reconnects during discussion
            if (
              (session.phase === "discussion" || session.phase === "voting" || session.phase === "result") &&
              session.orbitFeedback[socket.id]
            ) {
              socket.emit("orbit_result", session.orbitFeedback[socket.id]);
            }
            ack?.({ success: true, session });
            return;
          }

          session = createSession(sessionId, {
            id: socket.id,
            playerId,
            name: playerName,
            isHost: true,
            isSpectator: !!parsed.isSpectator,
            userId: parsed.userId,
            connectionStatus: "connected",
          });
          if (!await saveSession(session)) {
            // Redis error during new session creation — client should retry.
            ack?.({ success: false, error: "Server error — please try again" });
            return;
          }

          socket.join(sessionId);
          currentSessionId = sessionId;
          currentPlayerId = socket.id;
          currentUserId = parsed.userId ?? null;

          logger.info({ sessionId, playerName }, "Session created");
          phaseUpdate(io, sessionId, session);
          logGameEvent("session_created", sessionId, socket.id, { playerName });
          // Use the stable userId (if provided) as the rate-limit key so it persists
          // across reconnects. Fall back to socket.id for guest sessions.
          currentRateLimitId = parsed.userId ?? socket.id;
          ack?.({ success: true, session });
        } finally {
          await release();
        }
      },
    );

    // ── JOIN SESSION ──────────────────────────────────────────────────────
    socket.on(
      "join_session",
      async (data: unknown, ack) => {
        const parsed = validate(joinSessionSchema, data, ack);
        if (!parsed) return;
        const { sessionId, playerName, playerId } = parsed;

        // ── Identity verification ──────────────────────────────────────────
        // If the client supplied a token, verify it was issued by this server
        // for this exact playerId.  If the client failed to obtain a token
        // (e.g. request_player_token timed out), generate one server-side so
        // the join never partially fails (player visible in chat but absent
        // from session.players).
        let resolvedToken: string;
        if (parsed.playerToken) {
          if (!verifyPlayerToken(parsed.playerToken, playerId)) {
            logger.warn({ socketId: socket.id, playerId }, "join_session rejected — invalid player token");
            ack?.({ success: false, error: "Invalid player token" });
            return;
          }
          resolvedToken = parsed.playerToken;
        } else {
          // Token was missing — generate server-side so the join can proceed.
          resolvedToken = issuePlayerToken(playerId);
          logger.info({ socketId: socket.id, playerId }, "join_session — generated server-side player token (client had none)");
        }

        if (isRedisOverloaded()) {
          ack?.({ success: false, error: "Server busy — please try again shortly" });
          return;
        }

        let nameConflict = false;
        let kickedBan = false;
        let sessionClosed = false;
        let playerDidQuit = false;
        let gameInProgress = false;
        let playersBeforeJoin = 0;
        let isReconnect = false;

        const cas = await withCasRetry(sessionId, (session) => {
          // Guard: join_session must never create a new session — only operate on existing ones.
          // withCasRetry returns null (not CAS_SKIP) when the session is absent, so this branch
          // is unreachable in practice. It is kept as an explicit defensive assertion so the
          // intent is clear and future refactors cannot accidentally remove the null-guard in
          // withCasRetry without this becoming a silent no-op.
          if (!session) return CAS_SKIP;

          // Session closed check — if the host quit, block all join/reconnect attempts
          if (session.status === "closed") {
            sessionClosed = true;
            return CAS_SKIP;
          }

          // Capture player count before any modification (reflects the last successful attempt).
          playersBeforeJoin = session.players.length;

          // Kick-ban check: prevent kicked players from rejoining via fresh join or reconnect
          if (session.kickedPlayerIds.includes(playerId)) {
            kickedBan = true;
            return CAS_SKIP;
          }

          // Check if this playerId already exists → RECONNECT path
          const existing = session.players.find((p) => p.playerId === playerId);
          if (existing) {
            // Reject reconnect for players who explicitly quit
            if (existing.didQuit) {
              playerDidQuit = true;
              return CAS_SKIP;
            }
            isReconnect = true;
            // Cancel in-process grace timer (best-effort; multi-instance safe via CAS)
            const oldSocketId = existing.id;
            cancelRemovePlayer(sessionId, oldSocketId);
            // Remap all session data from old socketId → new socketId, mark connected.
            // session.players is never reassigned — engineReconnectPlayer mutates in place.
            // reconnectPlayer also removes the player from grace tracking.
            engineReconnectPlayer(session, oldSocketId, socket.id);

            // DO NOT auto-resume — host must explicitly use continue_game
            return true as const;
          }

          // Legacy fallback: older clients created hosts without stable playerId.
          // If we see a matching callsign on a player missing playerId, bind this
          // join to that player and promote it into the stable identity model.
          const legacyByName = session.players.find(
            (p) => p.name.toLowerCase() === playerName.toLowerCase() && !p.playerId,
          );
          if (legacyByName) {
            // Reject reconnect for players who explicitly quit
            if (legacyByName.didQuit) {
              playerDidQuit = true;
              return CAS_SKIP;
            }
            isReconnect = true;
            if (legacyByName.id !== socket.id) {
              cancelRemovePlayer(sessionId, legacyByName.id);
              engineReconnectPlayer(session, legacyByName.id, socket.id);
            }
            legacyByName.playerId = playerId;
            legacyByName.connected = true;
            legacyByName.connectionStatus = "connected";

            // DO NOT auto-resume — host must explicitly use continue_game
            return true as const;
          }

          // NEW PLAYER: block joining when the game has already started
          if (session.phase !== "lobby" && session.phase !== "role_config") {
            gameInProgress = true;
            return CAS_SKIP;
          }

          // NEW PLAYER: enforce case-insensitive name uniqueness
          const nameTaken = session.players.some(
            (p) => p.name.toLowerCase() === playerName.toLowerCase(),
          );
          if (nameTaken) {
            nameConflict = true;
            return CAS_SKIP;
          }

          // addPlayerToSession pushes to session.players — never reassigns the array.
          // isHost is always false here; host assignment only happens in create_session.
          addPlayerToSession(session, {
            id: socket.id,
            playerId,
            name: playerName,
            isHost: false,
            isSpectator: !!parsed.isSpectator,
            userId: parsed.userId,
            connected: true,
            connectionStatus: "connected",
          });
          return true as const;
        });

        if (kickedBan) {
          ack?.({ success: false, error: "You have been removed from this session" });
          return;
        }

        if (sessionClosed) {
          socket.emit("session_closed", { message: "Host ended the game" });
          ack?.({ success: false, error: "Session has been closed by the host" });
          return;
        }

        if (playerDidQuit) {
          socket.emit("session_closed", { message: "You left the game" });
          ack?.({ success: false, error: "You have left this session" });
          return;
        }

        if (gameInProgress) {
          ack?.({ success: false, error: "Game already in progress — please wait for the next round" });
          return;
        }

        if (nameConflict) {
          ack?.({ success: false, error: "Name already taken in this lobby" });
          return;
        }

        if (!cas) {
          ack?.({ success: false, error: "Session not found" });
          return;
        }

        socket.join(sessionId);
        currentSessionId = sessionId;
        currentPlayerId = socket.id;
        currentUserId = parsed.userId ?? null;
        // Persist the verified/generated token so reconnect verification is self-contained.
        currentPlayerToken = resolvedToken;
        // Use the stable userId (if provided) so the rate-limit window persists
        // across reconnects. Fall back to socket.id for anonymous join.
        currentRateLimitId = parsed.userId ?? socket.id;

        // Re-deliver private orbit result for reconnects during discussion/voting/result
        if (
          (cas.session.phase === "discussion" || cas.session.phase === "voting" || cas.session.phase === "result") &&
          cas.session.orbitFeedback[socket.id]
        ) {
          socket.emit("orbit_result", cas.session.orbitFeedback[socket.id]);
        }

        logger.info(
          { sessionId, playerName, playerId, playersBeforeJoin, playersAfterJoin: cas.session.players.length },
          "Player joined",
        );
        logGameEvent("player_joined", sessionId, socket.id, { playerName, playerId });

        // Broadcast updated grace state so clients clear reconnect banners on rejoin
        graceUpdate(io, sessionId, cas.session, playerName);

        // On reconnect: emit system chat message and send recent chat history
        if (isReconnect) {
          chatSystemMessage(io, sessionId, `${playerName} reconnected`);

          // Deliver last 20 messages to the reconnecting player
          try {
            const recentMessages = await db
              .select()
              .from(gameChatsTable)
              .where(eq(gameChatsTable.gameId, sessionId))
              .orderBy(desc(gameChatsTable.timestamp))
              .limit(20);
            if (recentMessages.length > 0) {
              // Reverse to chronological order (oldest first)
              socket.emit("chat_history", recentMessages.reverse().map((m: GameChatRow) => ({
                id: String(m.id),
                gameId: sessionId,
                userId: m.userId,
                username: m.guestName ?? m.userId,
                message: m.message,
                timestamp: m.timestamp instanceof Date ? m.timestamp.toISOString() : String(m.timestamp),
              })));
            }
          } catch (err) {
            logger.error({ sessionId, err }, "Failed to send chat history on reconnect");
          }
        }

        phaseUpdate(io, sessionId, cas.session);
        // Return the resolved token so the client can cache it for future reconnects.
        const sanitized = engineComputeSanitizedState(cas.session, socket.id);
        ack?.({ success: true, session: sanitized, playerToken: resolvedToken });
      },
    );

    // ── GET SESSION (for page mount sync) ────────────────────────────────
    socket.on("get_session", async (data: unknown, ack) => {
      const parsed = validate(sessionOnlySchema, data, ack);
      if (!parsed) return;
      const session = await getSession(parsed.sessionId);
      if (session) {
        engineSortPlayersByStatus(session);
        const sanitized = engineComputeSanitizedState(session, socket.id);
        ack?.({ success: true, session: sanitized });
      } else {
        ack?.({ success: false });
      }
    });

    // ── CHAT: SEND MESSAGE (real-time) ───────────────────────────────────
    socket.on("send_chat_message", async (data: unknown, ack) => {
      const parsed = validate(sendChatMessageSchema, data, ack);
      if (!parsed) return;

      if (currentSessionId !== parsed.sessionId) {
        ack?.({ success: false, error: "Not in session" });
        return;
      }

      if (!await checkRateLimit(currentRateLimitId ?? socket.id, "send_chat_message", 20, RATE_LIMIT_WINDOW_MS)) {
        ack?.({ success: false, error: "Rate limit exceeded — slow down" });
        return;
      }

      const session = await getSession(parsed.sessionId);
      if (!session) {
        ack?.({ success: false, error: "Session not found" });
        return;
      }

      // Reject messages when session is closed
      if (session.status === "closed") {
        ack?.({ success: false, error: "Session has ended" });
        return;
      }

      const player = session.players.find((p) => p.id === socket.id);
      if (!player) {
        ack?.({ success: false, error: "Player not found in session" });
        return;
      }

      // Reject messages from players who explicitly quit
      if (player.didQuit) {
        ack?.({ success: false, error: "You have left this session" });
        return;
      }

      // Reject messages from disconnected/reconnecting players
      if (player.connectionStatus !== "connected") {
        ack?.({ success: false, error: "You must be connected to send messages" });
        return;
      }

      // Reject messages from eliminated players
      if (player.alive === false) {
        ack?.({ success: false, error: "Eliminated players cannot send messages" });
        return;
      }

      try {
        const inserted = await db
          .insert(gameChatsTable)
          .values({
            gameId: parsed.sessionId,
            userId: currentUserId,
            guestName: currentUserId ? null : player.name,
            message: parsed.message,
          })
          .returning({ id: gameChatsTable.id, timestamp: gameChatsTable.timestamp });

        const row = inserted[0];
        const timestamp = row?.timestamp ?? new Date();
        const payload = {
          id: row?.id != null ? String(row.id) : `msg-${Date.now()}`,
          gameId: parsed.sessionId,
          userId: currentUserId,
          username: player.name,
          message: parsed.message,
          timestamp: timestamp instanceof Date ? timestamp.toISOString() : String(timestamp),
        };

        // Sender is no longer typing once a message is sent.
        socket.to(parsed.sessionId).emit("chat_typing", {
          gameId: parsed.sessionId,
          playerId: socket.id,
          username: player.name,
          isTyping: false,
        });
        io.to(parsed.sessionId).emit("chat_message", payload);
        ack?.({ success: true, message: payload });
      } catch (err) {
        logger.error({ sessionId: parsed.sessionId, err }, "send_chat_message failed");
        const errorMsg = "Failed to send message";
        socket.emit("chat_error", { message: errorMsg });
        ack?.({ success: false, error: errorMsg });
      }
    });

    // ── CHAT: TYPING INDICATOR (real-time) ───────────────────────────────
    socket.on("chat_typing_start", async (data: unknown) => {
      const parsed = validate(chatTypingSchema, data);
      if (!parsed) return;

      if (currentSessionId !== parsed.sessionId) return;

      if (!await checkRateLimit(currentRateLimitId ?? socket.id, "chat_typing_start", 60, RATE_LIMIT_WINDOW_MS)) {
        return;
      }

      const session = await getSession(parsed.sessionId);
      if (!session) return;
      const player = session.players.find((p) => p.id === socket.id);
      if (!player) return;

      socket.to(parsed.sessionId).emit("chat_typing", {
        gameId: parsed.sessionId,
        playerId: socket.id,
        username: player.name,
        isTyping: true,
      });
    });

    socket.on("chat_typing_stop", async (data: unknown) => {
      const parsed = validate(chatTypingSchema, data);
      if (!parsed) return;

      if (currentSessionId !== parsed.sessionId) return;

      const session = await getSession(parsed.sessionId);
      if (!session) return;
      const player = session.players.find((p) => p.id === socket.id);
      if (!player) return;

      socket.to(parsed.sessionId).emit("chat_typing", {
        gameId: parsed.sessionId,
        playerId: socket.id,
        username: player.name,
        isTyping: false,
      });
    });

    // ── START GAME CUSTOM ────────────────────────────────────────────────
    socket.on(
      "start_game_custom",
      async (data: unknown, ack) => {
        const parsed = validate(startGameCustomSchema, data, ack);
        if (!parsed) return;
        const { sessionId, customRoles, customDeck } = parsed;
        logger.info({ sessionId, customRoles, customDeck }, "start_game_custom payload received");

        if (currentSessionId !== sessionId) {
          ack?.({ success: false, error: "Not in session" });
          return;
        }
        if (isRedisOverloaded()) {
          ack?.({ success: false, error: "Server busy — please try again shortly" });
          return;
        }

        let notHost = false;
        let wrongPhase = false;
        let invalidCustomRoles = false;
        let invalidCustomDeck = false;
        const cas = await withCasRetry(sessionId, (session) => {
          const player = session.players.find((p) => p.id === socket.id);
          if (!player?.isHost) { notHost = true; return CAS_SKIP; }
          if (session.phase !== "lobby" && session.phase !== "role_config") { wrongPhase = true; return CAS_SKIP; }
          // Validate all players assigned and all roles valid
          const playerIds = session.players.map(p => p.id);
          const allAssigned = playerIds.every(pid => customRoles[pid]);
          const allRolesValid = Object.values(customRoles).every(roleId => typeof roleId === "string" && roleId.length > 0);
          if (!allAssigned || !allRolesValid) { invalidCustomRoles = true; return CAS_SKIP; }
          // Validate customDeck: 3 roles, not assigned to any player
          const assignedRoles = new Set(Object.values(customRoles));
          const deckValid = customDeck.length === 3 && customDeck.every(roleId => typeof roleId === "string" && roleId.length > 0 && !assignedRoles.has(roleId));
          if (!deckValid) { invalidCustomDeck = true; return CAS_SKIP; }

          // Mark spectators and exclude them from rolesAssigned/initialRoles
          for (const p of session.players) {
            if (customRoles[p.id] === "spectator") {
              p.isSpectator = true;
              logger.info({ playerId: p.id, playerName: p.name }, "Assigned as spectator");
              // Spectators should not have a role assigned
              delete session.rolesAssigned?.[p.id];
              delete session.initialRoles?.[p.id];
            } else {
              p.isSpectator = false;
            }
          }
          // Only assign roles to non-spectators
          const filteredRoles = Object.fromEntries(
            Object.entries(customRoles).filter(([pid, role]) => role !== "spectator")
          );
          session.rolesAssigned = { ...filteredRoles };
          
          // Ensure spectators have the "spectator" role explicitly in rolesAssigned
          for (const p of session.players) {
            if (p.isSpectator) {
              session.rolesAssigned[p.id] = "spectator";
            }
          }
          
          session.initialRoles = { ...session.rolesAssigned };
          session.centerCards = [...customDeck];
          session.roleCounts = {};
          // Reset round state
          session.orbitActions = {};
          session.orbitCompleted = [];
          session.roleAcknowledgements = [];
          session.resolutionAcknowledgements = [];
          session.discussionStartedAt = null;
          session.emergencyVote = freshEmergencyVote();
          session.votes = {};
          session.voteResult = null;
          session.roundSummary = freshRoundSummary();
          session.phase = "role_reveal";
          // Ensure isSpectator is always included in phase_update
          engineSortPlayersByStatus(session);
          return true as const;
        });
        if (notHost) {
          ack?.({ success: false, error: "Only host can start" });
          return;
        }
        if (wrongPhase) {
          ack?.({ success: false, error: "Game already in progress" });
          return;
        }
        if (invalidCustomRoles) {
          ack?.({ success: false, error: "Custom roles invalid or incomplete" });
          return;
        }
        if (invalidCustomDeck) {
          ack?.({ success: false, error: "Custom deck invalid or overlaps with player roles" });
          return;
        }
        if (!cas) {
          await handleSaveConflict(io, sessionId);
          ack?.({ success: false });
          return;
        }
        logger.info({ sessionId, players: cas.session.players.length }, "Custom game started");
        logGameEvent("game_started_custom", sessionId, socket.id, {
          players: cas.session.players.length,
          customRoles: true,
          customDeck: true,
        });
        phaseUpdate(io, sessionId, cas.session);
        ack?.({ success: true });
      },
    );

    // ── START GAME ────────────────────────────────────────────────────────
    socket.on(
      "start_game",
      async (
        data: unknown,
        ack,
      ) => {
        const parsed = validate(startGameSchema, data, ack);
        if (!parsed) return;
        const { sessionId, roleCounts, customRoles } = parsed;

        // Socket-level ownership guard: only the socket that joined this session may act on it
        if (currentSessionId !== sessionId) {
          ack?.({ success: false, error: "Not in session" });
          return;
        }

        if (isRedisOverloaded()) {
          ack?.({ success: false, error: "Server busy — please try again shortly" });
          return;
        }

        let notHost = false;
        let wrongPhase = false;
        let invalidRoleCounts = false;
        let invalidCustomRoles = false;
        const cas = await withCasRetry(sessionId, (session) => {
          const player = session.players.find((p) => p.id === socket.id);
          if (!player?.isHost) { notHost = true; return CAS_SKIP; }
          // Phase guard: game may only be started from lobby or role_config
          if (session.phase !== "lobby" && session.phase !== "role_config") { wrongPhase = true; return CAS_SKIP; }
          // Pool size guard: total role count must cover all active players
          const activePlayers = session.players.filter(p => !p.isSpectator);
          const totalRoles = Object.values(roleCounts).reduce((s, n) => s + n, 0);
          if (totalRoles < activePlayers.length) { invalidRoleCounts = true; return CAS_SKIP; }

          // If customRoles is provided, validate and assign directly
          if (customRoles) {
            // Validate all players are assigned and roles are valid
            const playerIds = session.players.map(p => p.id);
            const allAssigned = playerIds.every(pid => customRoles[pid]);
            const allRolesValid = Object.values(customRoles).every(roleId => roleCounts[roleId] > 0);
            if (!allAssigned || !allRolesValid) { invalidCustomRoles = true; return CAS_SKIP; }
            // Assign roles directly
            session.rolesAssigned = { ...customRoles };
            session.initialRoles = { ...customRoles };
            // Remove assigned roles from pool for center cards
            const assignedCounts = { ...roleCounts };
            Object.values(customRoles).forEach(roleId => { assignedCounts[roleId] = (assignedCounts[roleId] || 1) - 1; });
            const pool: string[] = [];
            for (const [roleId, count] of Object.entries(assignedCounts)) {
              for (let i = 0; i < count; i++) pool.push(roleId);
            }
            session.centerCards = pool;
            session.roleCounts = { ...roleCounts };
            // Reset round state
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
            engineStartGame(session, roleCounts, session.settings);
          }
          session.phase = "role_reveal";
          return true as const;
        });

        if (notHost) {
          ack?.({ success: false, error: "Only host can start" });
          return;
        }
        if (wrongPhase) {
          ack?.({ success: false, error: "Game already in progress" });
          return;
        }
        if (invalidRoleCounts) {
          ack?.({ success: false, error: "Role count must cover all players" });
          return;
        }
        if (invalidCustomRoles) {
          ack?.({ success: false, error: "Custom roles invalid or incomplete" });
          return;
        }
        if (!cas) {
          await handleSaveConflict(io, sessionId);
          ack?.({ success: false });
          return;
        }

        logger.info({ sessionId, players: cas.session.players.length }, "Game started");
        logGameEvent("game_started", sessionId, socket.id, {
          players: cas.session.players.length,
          roleCounts,
          customRoles: customRoles ? true : false,
        });
        phaseUpdate(io, sessionId, cas.session);
        ack?.({ success: true });
      },
    );

    // ── UNLOCK ROLE (Credit Spend) ─────────────────────────────────────────
    socket.on(
      "unlock_role",
      async (data: unknown, ack) => {
        const unlockRoleSchema = z.object({
          sessionId: sessionIdSchema,
          roleId: z.enum(["virus", "router"]),
        });

        const parsed = validate(unlockRoleSchema, data, ack);
        if (!parsed) return;
        const { sessionId, roleId } = parsed;

        if (currentSessionId !== sessionId) {
          ack?.({ success: false, error: "Not in session" });
          return;
        }

        if (!currentUserId) {
          ack?.({ success: false, error: "Authentication required to spend credits" });
          return;
        }

        const ROLE_PRICES: Record<string, number> = {
          virus: 25,
          router: 35,
        };
        const price = ROLE_PRICES[roleId];

        try {
          const success = await db.transaction(async (tx: any) => {
            // 1. Get user and check balance
            const user = await tx.select().from(usersTable).where(eq(usersTable.id, currentUserId!)).limit(1);
            if (!user.length || user[0].credits < price) {
              return false;
            }

            // 2. Check if already unlocked in this session (redundant check but good for safety)
            const session = await getSession(sessionId);
            if (session?.unlockedRoles.includes(roleId)) {
              return "already_unlocked";
            }

            // 3. Deduct credits
            await tx.update(usersTable).set({ credits: user[0].credits - price }).where(eq(usersTable.id, currentUserId!));

            // 4. Log transaction
            await tx.insert(creditTransactionsTable).values({
              id: randomUUID(),
              userId: currentUserId!,
              amount: -price,
              type: "spend",
              description: `Unlocked ${roleId} for session ${sessionId}`,
            });

            return true;
          });

          if (success === false) {
            ack?.({ success: false, error: "Insufficient credits" });
            return;
          }

          if (success === "already_unlocked") {
            ack?.({ success: false, error: "Role already authorized for this session" });
            return;
          }

          // 5. Update live session state
          const cas = await withCasRetry(sessionId, (session) => {
            if (session.unlockedRoles.includes(roleId)) return CAS_SKIP;
            session.unlockedRoles.push(roleId);
            return true as const;
          });

          if (cas) {
            logger.info({ sessionId, userId: currentUserId, roleId }, "Role unlocked for session");
            logGameEvent("role_unlocked", sessionId, socket.id, { roleId, price });
            
            // Broadcast system message to lobby
            const playerName = cas.session.players.find(p => p.id === socket.id)?.name || "A player";
            chatSystemMessage(io, sessionId, `${playerName} has authorized the ${roleId.toUpperCase()} role for this match!`);
            
            phaseUpdate(io, sessionId, cas.session);
            ack?.({ success: true, credits: (await db.select().from(usersTable).where(eq(usersTable.id, currentUserId!)).limit(1))[0].credits });
          } else {
            ack?.({ success: false, error: "Session conflict — please try again" });
          }
        } catch (err) {
          logger.error({ err, sessionId, roleId }, "Failed to unlock role");
          ack?.({ success: false, error: "Internal server error" });
        }
      }
    );

    // ── ACKNOWLEDGE ROLE REVEAL ───────────────────────────────────────────
    socket.on(
      "acknowledge_role",
      async (data: unknown, ack) => {
        const parsed = validate(sessionOnlySchema, data, ack);
        if (!parsed) return;

        if (currentSessionId !== parsed.sessionId) {
          ack?.({ success: false, error: "Not in session" });
          return;
        }

        if (isRedisOverloaded()) {
          ack?.({ success: false, error: "Server busy — please try again shortly" });
          return;
        }

        let engineError: string | undefined;
        const cas = await withCasRetry(parsed.sessionId, (session) => {
          const actionData = (data as any).action;
          const result = engineAcknowledgeRole(session, socket.id, actionData);
          if (!result.accepted) { engineError = result.error; return CAS_SKIP; }
          return result;
        });

        if (engineError) {
          ack?.({ success: false, error: engineError });
          return;
        }
        if (!cas) {
          await handleSaveConflict(io, parsed.sessionId);
          ack?.({ success: true });
          return;
        }

        const { session, result } = cas;
        ack?.({ success: true, orbitInfo: result.orbitInfo });

        logger.info(
          {
            sessionId: parsed.sessionId,
            acked: session.roleAcknowledgements.length,
            total: session.players.filter(p => !p.isSpectator).length,
          },
          "Role acknowledged",
        );
        logGameEvent("role_acknowledged", parsed.sessionId, socket.id, {
          acked: session.roleAcknowledgements.length,
          total: session.players.filter(p => !p.isSpectator).length,
        });

        if (result.allAcknowledged) {
          logger.info({ sessionId: parsed.sessionId }, "All roles acknowledged → orbit_action");
          logGameEvent("orbit_action_started", parsed.sessionId, socket.id, {
            players: session.players.length,
          });

          if (result.autoActions) {
            for (const auto of result.autoActions) {
              logger.info({ sessionId: parsed.sessionId, playerId: auto.playerId, roleId: auto.roleId }, "Passive player auto-completed");
              logGameEvent("auto_action", parsed.sessionId, auto.playerId, { roleId: auto.roleId });
            }
          }

          logger.debug(
            { completed: session.orbitCompleted.length, total: session.players.length },
            "Orbit start — completion state",
          );

          phaseUpdate(io, parsed.sessionId, session);

          for (const p of session.players) {
            const sock = io.sockets.sockets.get(p.id);
            if (sock) sock.emit("orbit_info", engineComputeOrbitInfo(session, p.id));
          }

          if (result.allSubmitted) {
            void checkAndRunResolution(io, parsed.sessionId, session);
          }
        }
      },
    );

    // ── SUBMIT ORBIT ACTION ───────────────────────────────────────────────
    socket.on(
      "submit_action",
      async (data: unknown, ack) => {
        const parsed = validate(submitActionSchema, data, ack);
        if (!parsed) return;

        if (currentSessionId !== parsed.sessionId) {
          ack?.({ success: false, error: "Not in session" });
          return;
        }

        if (isRedisOverloaded()) {
          ack?.({ success: false, error: "Server busy — please try again shortly" });
          return;
        }

        if (!await checkRateLimit(currentRateLimitId ?? socket.id, "submit_action", ACTION_RATE_LIMIT, RATE_LIMIT_WINDOW_MS)) {
          ack?.({ success: false, error: "Rate limit exceeded — slow down" });
          return;
        }

        let actionError: string | undefined;
        const cas = await withCasRetry(parsed.sessionId, (session) => {
          const result = engineSubmitAction(session, socket.id, parsed.action as PlayerAction);
          if (!result.accepted) { actionError = result.error; return CAS_SKIP; }
          return result;
        });

        if (actionError) {
          ack?.({ success: false, error: actionError });
          return;
        }
        if (!cas) {
          await handleSaveConflict(io, parsed.sessionId);
          ack?.({ success: true });
          return;
        }

        const { session, result } = cas;

        logger.info(
          {
            sessionId: parsed.sessionId,
            completed: session.orbitCompleted.length,
            total: session.players.filter(p => !p.isSpectator).length,
            actionType: parsed.action.type,
          },
          "Action submitted",
        );
        logGameEvent("action_submitted", parsed.sessionId, socket.id, {
          actionType: parsed.action.type,
          completed: session.orbitCompleted.length,
          total: session.players.filter(p => !p.isSpectator).length,
        });

        ack?.({ success: true });
        phaseUpdate(io, parsed.sessionId, session);

        if (result.allSubmitted) {
          void checkAndRunResolution(io, parsed.sessionId, session);
        }
      },
    );

    // ── ACKNOWLEDGE RESOLUTION (legacy no-op) ────────────────────────────
    socket.on(
      "acknowledge_resolution",
      async (data: unknown, ack) => {
        const parsed = validate(sessionOnlySchema, data, ack);
        if (!parsed) return;
        const session = await getSession(parsed.sessionId);
        if (!session) { ack?.({ success: false }); return; }
        ack?.({ success: true });
      },
    );

    // ── START EMERGENCY VOTE ─────────────────────────────────────────────
    socket.on(
      "start_emergency_vote",
      async (data: unknown, ack) => {
        const parsed = validate(sessionOnlySchema, data, ack);
        if (!parsed) return;

        if (currentSessionId !== parsed.sessionId) {
          ack?.({ success: false, error: "Not in session" });
          return;
        }

        if (isRedisOverloaded()) {
          ack?.({ success: false, error: "Server busy — please try again shortly" });
          return;
        }

        if (!await checkRateLimit(currentRateLimitId ?? socket.id, "start_emergency_vote", EMERGENCY_START_LIMIT, RATE_LIMIT_WINDOW_MS)) {
          ack?.({ success: false, error: "Rate limit exceeded — slow down" });
          return;
        }

        let engineError: string | undefined;
        const cas = await withCasRetry(parsed.sessionId, (session) => {
          const result = engineStartEmergencyVote(session, socket.id);
          if (!result.accepted) { engineError = result.error; return CAS_SKIP; }
          return result;
        });

        if (engineError) {
          ack?.({ success: false, error: engineError });
          return;
        }
        if (!cas) {
          await handleSaveConflict(io, parsed.sessionId);
          ack?.({ success: true });
          return;
        }

        logger.info({ sessionId: parsed.sessionId, callerName: cas.result.callerName }, "Emergency vote called");
        logGameEvent("emergency_vote_started", parsed.sessionId, socket.id, {
          callerName: cas.result.callerName ?? "Unknown",
        });
        io.to(parsed.sessionId).emit("emergency_vote_started", {
          callerName: cas.result.callerName ?? "Unknown",
        });
        ack?.({ success: true });
      },
    );

    // ── CAST EMERGENCY VOTE ───────────────────────────────────────────────
    socket.on(
      "cast_emergency_vote",
      async (data: unknown, ack) => {
        const parsed = validate(castEmergencyVoteSchema, data, ack);
        if (!parsed) return;

        if (currentSessionId !== parsed.sessionId) {
          ack?.({ success: false, error: "Not in session" });
          return;
        }

        if (isRedisOverloaded()) {
          ack?.({ success: false, error: "Server busy — please try again shortly" });
          return;
        }

        if (!await checkRateLimit(currentRateLimitId ?? socket.id, "cast_emergency_vote", VOTE_RATE_LIMIT, RATE_LIMIT_WINDOW_MS)) {
          ack?.({ success: false, error: "Rate limit exceeded — slow down" });
          return;
        }

        let engineError: string | undefined;
        const cas = await withCasRetry(parsed.sessionId, (session) => {
          const result = engineCastEmergencyVote(session, socket.id, parsed.vote);
          if (!result.accepted) { engineError = result.error; return CAS_SKIP; }
          return result;
        });

        if (engineError) {
          ack?.({ success: false, error: engineError });
          return;
        }
        if (!cas) {
          await handleSaveConflict(io, parsed.sessionId);
          ack?.({ success: true });
          return;
        }

        ack?.({ success: true });
        const ev = cas.session.emergencyVote;
        const yesNeeded = Math.ceil(engineGetActivePlayers(cas.session).length * 0.4);
        logger.info({ sessionId: parsed.sessionId, yes: ev.yesVoters.length, no: ev.noVoters.length, needed: yesNeeded }, "Emergency vote cast");
        logGameEvent("emergency_vote_cast", parsed.sessionId, socket.id, {
          vote: parsed.vote,
          yes: ev.yesVoters.length,
          no: ev.noVoters.length,
          outcome: cas.result.outcome,
        });

        if (cas.result.outcome === true) {
          logger.info({ sessionId: parsed.sessionId }, "Emergency vote passed → voting");
          phaseUpdate(io, parsed.sessionId, cas.session);
          io.to(parsed.sessionId).emit("emergency_vote_result", { passed: true });
        } else if (cas.result.outcome === false) {
          logger.info({ sessionId: parsed.sessionId }, "Emergency vote denied");
          io.to(parsed.sessionId).emit("emergency_vote_result", { passed: false });
        }
      },
    );

    // ── START VOTING (host-only) ──────────────────────────────────────────
    socket.on(
      "start_voting",
      async (data: unknown, ack) => {
        const parsed = validate(sessionOnlySchema, data, ack);
        if (!parsed) return;

        if (currentSessionId !== parsed.sessionId) {
          ack?.({ success: false, error: "Not in session" });
          return;
        }

        if (isRedisOverloaded()) {
          ack?.({ success: false, error: "Server busy — please try again shortly" });
          return;
        }

        let notHost = false;
        let wrongPhase = false;
        const cas = await withCasRetry(parsed.sessionId, (session) => {
          const player = session.players.find((p) => p.id === socket.id);
          if (!player?.isHost) { notHost = true; return CAS_SKIP; }
          if (session.phase !== "discussion") { wrongPhase = true; return CAS_SKIP; }

          engineStartVoting(session);
          return true as const;
        });

        if (notHost) {
          ack?.({ success: false, error: "Only host can start voting" });
          return;
        }
        if (wrongPhase) {
          ack?.({ success: false, error: "Can only start voting from discussion phase" });
          return;
        }
        if (!cas) {
          await handleSaveConflict(io, parsed.sessionId);
          ack?.({ success: false });
          return;
        }

        logger.info({ sessionId: parsed.sessionId }, "Voting started by host (timer expired)");
        logGameEvent("voting_started", parsed.sessionId, socket.id, {
          reason: "timer_expired",
        });
        phaseUpdate(io, parsed.sessionId, cas.session);
        ack?.({ success: true });
      },
    );

    // ── CAST ELIMINATION VOTE ─────────────────────────────────────────────
    socket.on(
      "cast_vote",
      async (data: unknown, ack) => {
        const parsed = validate(castVoteSchema, data, ack);
        if (!parsed) return;

        if (currentSessionId !== parsed.sessionId) {
          ack?.({ success: false, error: "Not in session" });
          return;
        }

        if (isRedisOverloaded()) {
          ack?.({ success: false, error: "Server busy — please try again shortly" });
          return;
        }

        if (!await checkRateLimit(currentRateLimitId ?? socket.id, "cast_vote", VOTE_RATE_LIMIT, RATE_LIMIT_WINDOW_MS)) {
          ack?.({ success: false, error: "Rate limit exceeded — slow down" });
          return;
        }

        let engineError: string | undefined;
        const cas = await withCasRetry(parsed.sessionId, (session) => {
          const result = engineCastVote(session, socket.id, parsed.targetId);
          if (!result.accepted) { engineError = result.error; return CAS_SKIP; }
          return result;
        });

        if (engineError) {
          ack?.({ success: false, error: engineError });
          return;
        }
        if (!cas) {
          await handleSaveConflict(io, parsed.sessionId);
          ack?.({ success: true });
          return;
        }

        ack?.({ success: true });
        const isAbstain = parsed.targetId === "abstain";
        logger.info({ sessionId: parsed.sessionId, voter: socket.id, target: parsed.targetId, isAbstain }, "Vote cast");
        logGameEvent("vote_cast", parsed.sessionId, socket.id, {
          targetId: parsed.targetId,
          isAbstain,
          votingComplete: cas.result.votingComplete,
        });

        // Always broadcast so all clients see the updated vote count.
        phaseUpdate(io, parsed.sessionId, cas.session);

        if (cas.result.votingComplete && cas.result.voteResult) {
          logger.info({ sessionId: parsed.sessionId, winTeam: cas.result.voteResult.winTeam, eliminated: cas.result.voteResult.eliminatedName }, "Phase → result");
          logGameEvent("round_complete", parsed.sessionId, socket.id, {
            winTeam: cas.result.voteResult.winTeam,
            eliminatedName: cas.result.voteResult.eliminatedName,
          });
          io.to(parsed.sessionId).emit("vote_result", cas.result.voteResult);
          io.to(parsed.sessionId).emit("round_summary", cas.session.roundSummary);
        }
      },
    );

    // ── KICK PLAYER ───────────────────────────────────────────────────────
    // Only the host may kick, and only during lobby/role_config.
    // The kicked player's stable playerId is added to session.kickedPlayerIds
    // so that any future join_session attempt is permanently rejected.
    socket.on(
      "kick_player",
      async (data: unknown, ack) => {
        const parsed = validate(kickPlayerSchema, data, ack);
        if (!parsed) return;

        if (currentSessionId !== parsed.sessionId) {
          ack?.({ success: false, error: "Not in session" });
          return;
        }

        if (isRedisOverloaded()) {
          ack?.({ success: false, error: "Server busy — please try again shortly" });
          return;
        }

        let engineError: string | undefined;
        let kickedSocketId: string | undefined;
        let kickedPlayerName: string | undefined;

        const cas = await withCasRetry(parsed.sessionId, (session) => {
          const result = engineKickPlayer(session, socket.id, parsed.targetPlayerId);
          if (!result.accepted) { engineError = result.error; return CAS_SKIP; }
          kickedSocketId   = result.kickedSocketId;
          kickedPlayerName = result.kickedPlayerName;
          return true as const;
        });

        if (engineError) {
          ack?.({ success: false, error: engineError });
          return;
        }
        if (!cas) {
          await handleSaveConflict(io, parsed.sessionId);
          ack?.({ success: false, error: "Session not found" });
          return;
        }

        logger.info(
          { sessionId: parsed.sessionId, kickedPlayerId: parsed.targetPlayerId, kickedPlayerName },
          "Player kicked by host",
        );
        logGameEvent("player_kicked", parsed.sessionId, socket.id, {
          targetPlayerId: parsed.targetPlayerId,
          kickedPlayerName,
        });

        // Notify the kicked player before removing their socket from the room
        if (kickedSocketId) {
          const kickedSocket = io.sockets.sockets.get(kickedSocketId);
          if (kickedSocket) {
            kickedSocket.emit("kicked", { reason: "You were removed by the host" });
            kickedSocket.leave(parsed.sessionId);
          }
        }

        // Broadcast updated lobby state to remaining players
        phaseUpdate(io, parsed.sessionId, cas.session);
        ack?.({ success: true });
      },
    );

    // ── RESTART GAME ──────────────────────────────────────────────────────
    socket.on(
      "restart_game",
      async (data: unknown, ack) => {
        const parsed = validate(sessionOnlySchema, data, ack);
        if (!parsed) return;

        if (currentSessionId !== parsed.sessionId) {
          ack?.({ success: false, error: "Not in session" });
          return;
        }

        if (isRedisOverloaded()) {
          ack?.({ success: false, error: "Server busy — please try again shortly" });
          return;
        }

        let notHost = false;
        let gracePlayerIds: string[] = [];
        const cas = await withCasRetry(parsed.sessionId, (session) => {
          const player = session.players.find((p) => p.id === socket.id);
          if (!player?.isHost) { notHost = true; return CAS_SKIP; }

          // Capture players in grace so we can cancel their timers after CAS
          gracePlayerIds = [...(session.playersInGrace ?? [])];

          engineRestartGame(session);
          return true as const;
        });

        if (notHost) {
          ack?.({ success: false, error: "Only host can restart" });
          return;
        }
        if (!cas) {
          await handleSaveConflict(io, parsed.sessionId);
          ack?.({ success: false, error: "Session not found" });
          return;
        }

        // Cancel grace timers for all players that were in grace
        for (const pid of gracePlayerIds) {
          cancelRemovePlayer(parsed.sessionId, pid);
        }

        logger.info({ sessionId: parsed.sessionId, players: cas.session.players.length }, "Game restarted → role_config");
        logGameEvent("game_restarted", parsed.sessionId, socket.id, {
          players: cas.session.players.length,
        });
        phaseUpdate(io, parsed.sessionId, cas.session);
        ack?.({ success: true });
      },
    );

    // ── END GAME (host-only, from interrupted state) ────────────────────
    socket.on(
      "end_game",
      async (data: unknown, ack) => {
        const parsed = validate(sessionOnlySchema, data, ack);
        if (!parsed) return;

        if (currentSessionId !== parsed.sessionId) {
          ack?.({ success: false, error: "Not in session" });
          return;
        }

        if (isRedisOverloaded()) {
          ack?.({ success: false, error: "Server busy — please try again shortly" });
          return;
        }

        let engineError: string | undefined;
        let gracePlayerIds: string[] = [];
        const cas = await withCasRetry(parsed.sessionId, (session) => {
          // Capture players in grace so we can cancel their timers after CAS
          gracePlayerIds = [...(session.playersInGrace ?? [])];
          const result = engineEndGame(session, socket.id);
          if (!result.accepted) { engineError = result.error; return CAS_SKIP; }
          return true as const;
        });

        if (engineError) {
          ack?.({ success: false, error: engineError });
          return;
        }
        if (!cas) {
          await handleSaveConflict(io, parsed.sessionId);
          ack?.({ success: false, error: "Session not found" });
          return;
        }

        // Cancel grace timers for all players that were in grace
        for (const pid of gracePlayerIds) {
          cancelRemovePlayer(parsed.sessionId, pid);
        }

        logger.info({ sessionId: parsed.sessionId, players: cas.session.players.length }, "Game ended by host → role_config");
        logGameEvent("game_ended", parsed.sessionId, socket.id, {
          players: cas.session.players.length,
        });
        phaseUpdate(io, parsed.sessionId, cas.session);
        ack?.({ success: true });
      },
    );

    // ── QUIT GAME (explicit player quit — bypasses grace) ─────────────────
    // When a player explicitly quits, they are immediately marked as
    // disconnected. Quit must NEVER enter the "reconnecting" state.
    // If the host quits, the session is permanently closed.
    let playerQuit = false;
    socket.on(
      "quit_game",
      async (data: unknown, ack) => {
        const parsed = validate(sessionOnlySchema, data, ack);
        if (!parsed) return;

        if (currentSessionId !== parsed.sessionId) {
          ack?.({ success: false, error: "Not in session" });
          return;
        }

        playerQuit = true;
        const sessionId = parsed.sessionId;
        const playerId = currentPlayerId!;
        let playerName: string | undefined;
        let isHostQuit = false;
        let gameEnded = false;
        let votingResolved = false;
        let voteResult: { winTeam: string; eliminatedName: string | null } | undefined;

        await withCasRetry(sessionId, (session) => {
          const player = session.players.find((p) => p.id === playerId);
          if (!player) return CAS_SKIP;
          playerName = player.name;
          player.connected = false;
          player.connectionStatus = "disconnected";
          player.didQuit = true;
          isHostQuit = player.isHost;

          // Remove from grace if present (cancel any pending grace)
          engineRemovePlayerFromGrace(session, playerId);

          // HOST QUIT → SESSION TERMINATION
          if (isHostQuit) {
            session.status = "closed";
            session.joinable = false;
            return true as const;
          }

          // LOBBY / ROLE_CONFIG QUIT — remove the player entirely.
          // There is no in-game state to preserve before the game starts, so
          // the quitting player should disappear from the session immediately
          // (same as a kick, but without the permanent ban).
          if (session.phase === "lobby" || session.phase === "role_config") {
            engineRemovePlayer(session, playerId);
            return true as const;
          }

          // Single-player edge case
          const edgeCase = engineCheckSinglePlayerEdgeCase(session);
          if (edgeCase.shouldEnd) {
            gameEnded = true;
            return true as const;
          }

          // If we're in the voting phase, recheck if voting should resolve
          if (session.phase === "voting") {
            const recheck = engineRecheckVotingCompletion(session);
            if (recheck.votingComplete && recheck.voteResult) {
              votingResolved = true;
              voteResult = recheck.voteResult;
            }
          }

          // Explicit quit does NOT interrupt the game — the remaining players
          // continue normally.  Only unexpected disconnects (grace expiry) may
          // trigger an interrupt.

          return true as const;
        });

        // Cancel any pending grace timer for this player
        cancelRemovePlayer(sessionId, playerId);

        if (isHostQuit && playerName) {
          // Host quit — close session for all players
          io.to(sessionId).emit("session_closed", { message: "Host ended the game" });
          // Chat-only — no separate toast (session_closed already triggers UI feedback)
          chatSystemMessage(io, sessionId, "Host ended the game");
          chatSystemMessage(io, sessionId, "Session ended");

          logger.info({ sessionId, playerName }, "Host quit — session closed");
          logGameEvent("host_quit_session_closed", sessionId, playerId, { playerName });

          // Delayed session deletion (~30 seconds)
          setTimeout(async () => {
            try {
              await deleteSession(sessionId);
              logger.info({ sessionId }, "Session deleted after host quit (delayed cleanup)");
              // Purge chat messages
              db.delete(gameChatsTable)
                .where(eq(gameChatsTable.gameId, sessionId))
                .then(() => {
                  logger.info({ sessionId }, "Host quit — chat messages purged");
                })
                .catch((err: unknown) => {
                  logger.error({ sessionId, err }, "Failed to purge chat messages after host quit");
                });
            } catch (err) {
              logger.error({ sessionId, err }, "Failed to delete session after host quit");
            }
          }, SESSION_CLEANUP_DELAY_MS);
        } else if (playerName) {
          // Non-host quit — chat-only (no toast duplication)
          chatSystemMessage(io, sessionId, `${playerName} left the game`);

          // Broadcast updated grace + phase state
          const latestSession = await getSession(sessionId);
          if (latestSession) {
            graceUpdate(io, sessionId, latestSession, playerName);
            phaseUpdate(io, sessionId, latestSession);

            if (gameEnded) {
              chatSystemMessage(io, sessionId, "Not enough players to continue");
            }

            if (votingResolved && voteResult) {
              io.to(sessionId).emit("vote_result", voteResult);
              io.to(sessionId).emit("round_summary", latestSession.roundSummary);
            }

            // If in orbit_action, recheck whether all active players have submitted
            if (latestSession.phase === "orbit_action") {
              await checkAndRunResolution(io, sessionId, latestSession);
            }
          }

          logger.info({ sessionId, playerName }, "Player quit game explicitly");
          logGameEvent("player_quit", sessionId, playerId, { playerName });
        }

        ack?.({ success: true });
      },
    );

    // ── CONTINUE GAME (host-only) ────────────────────────────────────────
    // Host can continue the game at any point when players are disconnected
    // or reconnecting (not just from the "interrupted" phase).  Clears grace
    // state and marks reconnecting players as disconnected so the game
    // proceeds with only connected players.
    socket.on(
      "continue_game",
      async (data: unknown, ack) => {
        const parsed = validate(sessionOnlySchema, data, ack);
        if (!parsed) return;

        if (currentSessionId !== parsed.sessionId) {
          ack?.({ success: false, error: "Not in session" });
          return;
        }

        if (isRedisOverloaded()) {
          ack?.({ success: false, error: "Server busy — please try again shortly" });
          return;
        }

        let engineError: string | undefined;
        let gracePlayerIds: string[] = [];
        let gameEnded = false;
        let votingResolved = false;
        let voteResult: { winTeam: string; eliminatedName: string | null } | undefined;
        const cas = await withCasRetry(parsed.sessionId, (session) => {
          // Capture players in grace so we can cancel their timers after CAS
          gracePlayerIds = [...(session.playersInGrace ?? [])];

          const result = engineContinueGame(session, socket.id);
          if (!result.accepted) { engineError = result.error; return CAS_SKIP; }

          // Single-player edge case: if only 0 or 1 active players remain, end
          const edgeCase = engineCheckSinglePlayerEdgeCase(session);
          if (edgeCase.shouldEnd) {
            gameEnded = true;
            return result;
          }

          // If the resumed phase is voting, recheck completion — active count dropped
          if (session.phase === "voting") {
            const recheck = engineRecheckVotingCompletion(session);
            if (recheck.votingComplete && recheck.voteResult) {
              votingResolved = true;
              voteResult = recheck.voteResult;
            }
          }

          return result;
        });

        if (engineError) {
          ack?.({ success: false, error: engineError });
          return;
        }
        if (!cas) {
          await handleSaveConflict(io, parsed.sessionId);
          ack?.({ success: false, error: "Session not found" });
          return;
        }

        // Cancel grace timers for all players that were in grace
        for (const pid of gracePlayerIds) {
          cancelRemovePlayer(parsed.sessionId, pid);
        }

        logger.info({ sessionId: parsed.sessionId, phase: cas.session.phase }, "Game continued by host");
        logGameEvent("game_continued", parsed.sessionId, socket.id, {
          phase: cas.session.phase,
        });

        // Re-read authoritative session state for broadcasts
        const latestSession = await getSession(parsed.sessionId);
        if (latestSession) {
          graceUpdate(io, parsed.sessionId, latestSession, "");
          phaseUpdate(io, parsed.sessionId, latestSession);

          if (gameEnded) {
            chatSystemMessage(io, parsed.sessionId, "Not enough players to continue");
          }

          if (votingResolved && voteResult) {
            io.to(parsed.sessionId).emit("vote_result", voteResult);
            io.to(parsed.sessionId).emit("round_summary", latestSession.roundSummary);
          }

          // If in orbit_action, recheck whether all active players have submitted
          if (!votingResolved && !gameEnded && latestSession.phase === "orbit_action") {
            await checkAndRunResolution(io, parsed.sessionId, latestSession);
          }
        }

        ack?.({ success: true });
      },
    );

    // ── DISCONNECT ────────────────────────────────────────────────────────
    socket.on("disconnect", async () => {
    if (currentSessionId && currentPlayerId) {
      const sessionId = currentSessionId;
      const playerId = currentPlayerId;

      socket.to(sessionId).emit("chat_typing", {
        gameId: sessionId,
        playerId,
        username: "",
        isTyping: false,
      });

      // If the player explicitly quit, quit_game already handled everything.
      // Do NOT enter grace or re-process disconnect logic.
      if (playerQuit) return;

      // Mark the player as reconnecting and add to grace tracking.
      // ALL players (including host) enter grace on unexpected disconnect.
      // Do NOT interrupt immediately — wait for grace to expire.
      let playerName: string | undefined;
      let playerDidQuit = false;
      await withCasRetry(sessionId, (session) => {
        // If session is already closed, nothing to do
        if (session.status === "closed") return CAS_SKIP;

        const player = session.players.find((p) => p.id === playerId);
        if (!player) return CAS_SKIP;
        playerName = player.name;

        // Extra guard: if the player already quit (multi-instance safety),
        // do not enter grace.
        if (player.didQuit) {
          playerDidQuit = true;
          return CAS_SKIP;
        }

        player.connected = false;

        // Enter grace period — set connectionStatus to "reconnecting"
        engineAddPlayerToGrace(session, playerId);
        return true as const;
      });

      if (!playerName || playerDidQuit) return;

      // Emit chat system message for grace start
      chatSystemMessage(io, sessionId, `${playerName} is reconnecting...`);

      // Broadcast grace state so clients show "waiting to reconnect"
      const fresh = await getSession(sessionId);
      if (fresh) {
        graceUpdate(io, sessionId, fresh, playerName ?? "");
        // If this is the first player entering grace while game is in progress,
        // broadcast a "game paused" system message
        if ((fresh.playersInGrace ?? []).length > 0 && engineIsGameInProgress(fresh)) {
          chatSystemMessage(io, sessionId, "Game paused — waiting for players to reconnect");
        }
      }

      logger.info(
        { sessionId, playerName },
        "Player disconnected — starting 60s grace timer",
      );
      logGameEvent("player_disconnected", sessionId, playerId, { playerName });

      // Schedule grace expiry — when it fires, we mark the player as
      // disconnected, emit updates, and interrupt the game if needed.
      scheduleGraceExpiry(
        sessionId,
        playerId,
        GRACE_PERIOD_MS,
        async () => {
          // Grace expired — mark player disconnected and interrupt if game is in progress
          let gameInterrupted = false;
          let gameEnded = false;
          let sessionGone = false;
          let votingResolved = false;
          let voteResult: { winTeam: string; eliminatedName: string | null } | undefined;
          await withCasRetry(sessionId, (session) => {
            if (!session) { sessionGone = true; return CAS_SKIP; }

            // Timer safety guard: if the player already reconnected (no longer in grace)
            // or interruptGame() already ran, this callback is a no-op.
            const stillInGrace = (session.playersInGrace ?? []).includes(playerId);
            if (!stillInGrace) return CAS_SKIP;

            // Remove from grace; in lobby/role_config remove the player entirely
            // (no in-game state to preserve — they can rejoin if they reconnect).
            engineRemovePlayerFromGrace(session, playerId);
            if (session.phase === "lobby" || session.phase === "role_config") {
              engineRemovePlayer(session, playerId);
              return true as const;
            }
            const player = session.players.find((p) => p.id === playerId);
            if (player) player.connectionStatus = "disconnected";

            // Single-player edge case: if only 1 or 0 active players remain, end the game
            const edgeCase = engineCheckSinglePlayerEdgeCase(session);
            if (edgeCase.shouldEnd) {
              gameEnded = true;
              return true as const;
            }

            // If in voting phase, recheck completion — the required vote count
            // just dropped because this player is no longer active.
            if (session.phase === "voting") {
              const recheck = engineRecheckVotingCompletion(session);
              if (recheck.votingComplete && recheck.voteResult) {
                votingResolved = true;
                voteResult = recheck.voteResult;
              }
            }

            // If the game is still in an active phase and voting didn't resolve,
            // interrupt it now that grace expired
            if (!votingResolved && engineIsGameInProgress(session)) {
              const result = engineInterruptGame(session);
              gameInterrupted = result.interrupted;
            }
            return true as const;
          });

          if (!sessionGone) {
            // Chat-only — no duplicate toast for grace expiry events
            chatSystemMessage(io, sessionId, `${playerName} disconnected`);

            // Re-read the latest session after our CAS updates
            const latestSession = await getSession(sessionId);
            if (latestSession) {
              graceUpdate(io, sessionId, latestSession, playerName ?? "");
              phaseUpdate(io, sessionId, latestSession);

              if (votingResolved && voteResult) {
                io.to(sessionId).emit("vote_result", voteResult);
                io.to(sessionId).emit("round_summary", latestSession.roundSummary);
              }

              // If in orbit_action, recheck whether all active players have submitted
              if (!votingResolved && !gameInterrupted && latestSession.phase === "orbit_action") {
                await checkAndRunResolution(io, sessionId, latestSession);
              }
            }

            if (gameEnded) {
              chatSystemMessage(io, sessionId, "Not enough players to continue");
              logger.info({ sessionId, playerName }, "Game ended — not enough active players");
              logGameEvent("game_ended_insufficient_players", sessionId, playerId, { playerName });
            } else if (votingResolved) {
              logger.info({ sessionId, playerName }, "Voting resolved after grace expiry — all active players had voted");
              logGameEvent("voting_resolved_grace_expiry", sessionId, playerId, { playerName });
            } else if (gameInterrupted) {
              chatSystemMessage(io, sessionId, "Game paused — waiting for host");
              logger.info({ sessionId, playerName }, "Game interrupted — grace expired for player");
              logGameEvent("game_interrupted", sessionId, playerId, { playerName });
            }
          }

          logger.info(
            { sessionId, playerName },
            "Grace timer expired — player marked disconnected",
          );
        },
      );
    }
  });
  });

  return io;
}

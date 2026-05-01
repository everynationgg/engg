import type { Server as SocketIOServer, Socket } from "socket.io";
import { z } from "zod";
import { 
  validate, 
  requestPlayerTokenSchema, 
  createSessionSchema, 
  joinSessionSchema,
  sessionOnlySchema
} from "../schemas.js";
import { logger } from "../../../../lib/logger.js";
import { 
  isRedisOverloaded, 
  acquireSessionLock, 
  getSession, 
  createSession, 
  saveSession, 
  withCasRetry, 
  CAS_SKIP, 
  cancelRemovePlayer,
  addPlayerToSession,
  scheduleGraceExpiry
} from "../sessions.js";
import { 
  reconnectPlayer, 
  sortPlayersByStatus, 
  addPlayerToGrace,
  isGameInProgress,
  removePlayerFromGrace,
  removePlayer,
  checkSinglePlayerEdgeCase,
  recheckVotingCompletion,
  interruptGame
} from "../engine.js";
import { checkRateLimit } from "../../../../lib/rate-limit.js";
import { issuePlayerToken, verifyPlayerToken } from "../../../../lib/auth.js";
import { phaseUpdate, graceUpdate, chatSystemMessage, logGameEvent } from "../emitters.js";
import { handleSaveConflict, checkAndRunResolution } from "../logic.js";

const RATE_LIMIT_WINDOW_MS = 60_000;
const GRACE_PERIOD_MS = 60_000;

export function registerSessionHandlers(
  io: SocketIOServer,
  socket: Socket,
  state: {
    currentSessionId: string | null;
    currentPlayerId: string | null;
    currentUserId: string | null;
    currentPlayerToken: string | null;
    currentRateLimitId: string | null;
    playerQuit: boolean;
  }
) {
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

  socket.on("create_session", async (data: unknown, ack) => {
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
        if (session.status === "closed") {
          socket.emit("session_closed", { message: "Host ended the game" });
          ack?.({ success: false, error: "Session has been closed by the host" });
          return;
        }

        if (playerId && session.kickedPlayerIds.includes(playerId)) {
          ack?.({ success: false, error: "You have been removed from this session" });
          return;
        }

        const reconnecting = playerId
          ? session.players.find((p) => p.playerId === playerId) ?? session.players.find((p) => p.name === playerName)
          : session.players.find((p) => p.name === playerName);

        if (reconnecting && reconnecting.didQuit) {
          socket.emit("session_closed", { message: "You left the game" });
          ack?.({ success: false, error: "You have left this session" });
          return;
        }

        if (reconnecting && reconnecting.id !== socket.id) {
          const oldId = reconnecting.id;
          cancelRemovePlayer(sessionId, oldId);
          reconnectPlayer(session, oldId, socket.id);
          if (playerId && !reconnecting.playerId) {
            reconnecting.playerId = playerId;
          }

          if (!await saveSession(session)) {
            await handleSaveConflict(io, sessionId);
            ack?.({ success: true });
            return;
          }

          graceUpdate(io, sessionId, session, playerName);
          chatSystemMessage(io, sessionId, `${playerName} reconnected`);
          logger.info({ sessionId, playerName, oldId, newId: socket.id }, "Player reconnected — ID updated");
          logGameEvent("player_reconnected", sessionId, socket.id, { playerName, oldId });
        } else if (!reconnecting) {
          const currentHost = session.players.find(p => p.isHost);
          const shouldClaimHost = !currentHost;

          addPlayerToSession(session, {
            id: socket.id,
            playerId,
            name: playerName,
            isHost: shouldClaimHost,
            isSpectator: !!parsed.isSpectator,
            connectionStatus: "connected",
          });
          if (!await saveSession(session)) {
            await handleSaveConflict(io, sessionId);
            ack?.({ success: true });
            return;
          }
          socket.join(sessionId);
          state.currentSessionId = sessionId;
          state.currentPlayerId = socket.id;
          state.currentUserId = parsed.userId ?? null;
          state.currentRateLimitId = parsed.userId ?? socket.id;
          phaseUpdate(io, sessionId, session);
          ack?.({ success: true, session });
          return;
        }
        socket.join(sessionId);
        state.currentSessionId = sessionId;
        state.currentPlayerId = socket.id;
        state.currentUserId = reconnecting?.userId ?? parsed.userId ?? null;
        state.currentRateLimitId = reconnecting?.userId ?? parsed.userId ?? socket.id;
        sortPlayersByStatus(session);
        socket.emit("phase_update", session);
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
        ack?.({ success: false, error: "Server error — please try again" });
        return;
      }

      socket.join(sessionId);
      state.currentSessionId = sessionId;
      state.currentPlayerId = socket.id;
      state.currentUserId = parsed.userId ?? null;
      state.currentRateLimitId = parsed.userId ?? socket.id;

      logger.info({ sessionId, playerName }, "Session created");
      phaseUpdate(io, sessionId, session);
      logGameEvent("session_created", sessionId, socket.id, { playerName });
      ack?.({ success: true, session });
    } finally {
      await release();
    }
  });

  socket.on("join_session", async (data: unknown, ack) => {
    const parsed = validate(joinSessionSchema, data, ack);
    if (!parsed) return;
    const { sessionId, playerName, playerId } = parsed;

    let resolvedToken: string;
    if (parsed.playerToken) {
      if (!verifyPlayerToken(parsed.playerToken, playerId)) {
        ack?.({ success: false, error: "Invalid player token" });
        return;
      }
      resolvedToken = parsed.playerToken;
    } else {
      resolvedToken = issuePlayerToken(playerId);
    }

    if (isRedisOverloaded()) {
      ack?.({ success: false, error: "Server busy — please try again shortly" });
      return;
    }

    let sessionClosed = false;
    let kickedBan = false;
    let playerDidQuit = false;

    const cas = await withCasRetry(sessionId, (session) => {
      if (!session) return CAS_SKIP;
      if (session.status === "closed") { sessionClosed = true; return CAS_SKIP; }
      if (session.kickedPlayerIds.includes(playerId)) { kickedBan = true; return CAS_SKIP; }

      const existing = session.players.find((p) => p.playerId === playerId);
      if (existing) {
        if (existing.didQuit) { playerDidQuit = true; return CAS_SKIP; }
        cancelRemovePlayer(sessionId, existing.id);
        reconnectPlayer(session, existing.id, socket.id);
        existing.connectionStatus = "connected";
        existing.connected = true;
        return true as const;
      }

      addPlayerToSession(session, {
        id: socket.id,
        playerId,
        name: playerName,
        isHost: false,
        isSpectator: !!parsed.isSpectator,
        userId: parsed.userId,
        connectionStatus: "connected",
      });
      return true as const;
    });

    if (sessionClosed) { ack?.({ success: false, error: "Session closed" }); return; }
    if (kickedBan) { ack?.({ success: false, error: "Kicked from session" }); return; }
    if (playerDidQuit) { ack?.({ success: false, error: "You already left" }); return; }

    if (!cas) { ack?.({ success: false, error: "Session not found" }); return; }

    socket.join(sessionId);
    state.currentSessionId = sessionId;
    state.currentPlayerId = socket.id;
    state.currentUserId = parsed.userId ?? null;
    state.currentRateLimitId = parsed.userId ?? socket.id;
    state.currentPlayerToken = resolvedToken;

    const session = await getSession(sessionId);
    if (session) {
      phaseUpdate(io, sessionId, session);
      chatSystemMessage(io, sessionId, `${playerName} joined`);
      ack?.({ success: true, session, playerToken: resolvedToken });
    }
  });

  socket.on("get_session", async (data: unknown, ack) => {
    const parsed = validate(sessionOnlySchema, data, ack);
    if (!parsed) return;
    const { sessionId } = parsed;

    const session = await getSession(sessionId);
    if (!session) {
      ack?.({ success: false, error: "Session not found" });
      return;
    }
    // Join room if not already in it to ensure sync
    socket.join(sessionId);
    state.currentSessionId = sessionId;
    
    ack?.({ success: true, session });
  });

  socket.on("quit_game", async (data: unknown, ack) => {
    const parsed = validate(sessionOnlySchema, data, ack);
    if (!parsed) return;
    const { sessionId } = parsed;
    const playerId = state.currentPlayerId;

    if (!playerId) {
      ack?.({ success: false, error: "Player ID missing" });
      return;
    }

    state.playerQuit = true; // Mark as explicit quit to avoid grace period

    let isHost = false;
    let playerName = "Unknown Operative";

    await withCasRetry(sessionId, (session) => {
      const player = session.players.find(p => (p.playerId === playerId || p.id === socket.id));
      if (!player) return CAS_SKIP;
      
      isHost = player.isHost;
      playerName = player.name;
      player.connected = false;

      if (isHost) {
        session.status = "closed";
        session.joinable = false;
      } else {
        removePlayer(session, playerId);
      }
      return true as const;
    });

    if (isHost) {
      io.to(sessionId).emit("session_closed", { 
        message: "The host has terminated the session. Connection severed." 
      });
    } else {
      chatSystemMessage(io, sessionId, `${playerName} has left the session.`);
      const latest = await getSession(sessionId);
      if (latest) {
        phaseUpdate(io, sessionId, latest);
      }
    }

    ack?.({ success: true });
    socket.leave(sessionId);
  });

  socket.on("disconnect", async () => {
    if (state.currentSessionId && state.currentPlayerId) {
      const sessionId = state.currentSessionId;
      const playerId = state.currentPlayerId;

      if (state.playerQuit) return;

      let playerName: string | undefined;
      await withCasRetry(sessionId, (session) => {
        if (session.status === "closed") return CAS_SKIP;
        const player = session.players.find((p) => p.id === playerId);
        if (!player || player.didQuit) return CAS_SKIP;
        playerName = player.name;
        player.connected = false;
        addPlayerToGrace(session, playerId);
        return true as const;
      });

      if (!playerName) return;

      chatSystemMessage(io, sessionId, `${playerName} is reconnecting...`);
      const fresh = await getSession(sessionId);
      if (fresh) {
        graceUpdate(io, sessionId, fresh, playerName);
        if ((fresh.playersInGrace ?? []).length > 0 && isGameInProgress(fresh)) {
          chatSystemMessage(io, sessionId, "Game paused — waiting for players to reconnect");
        }
      }

      scheduleGraceExpiry(sessionId, playerId, GRACE_PERIOD_MS, async () => {
        let votingResolved = false;
        let voteResult: any;
        let gameEnded = false;
        let gameInterrupted = false;

        await withCasRetry(sessionId, (session) => {
          if (!session) return CAS_SKIP;
          const stillInGrace = (session.playersInGrace ?? []).includes(playerId);
          if (!stillInGrace) return CAS_SKIP;

          removePlayerFromGrace(session, playerId);
          if (session.phase === "lobby" || session.phase === "role_config") {
            const player = session.players.find(p => p.id === playerId);
            if (player?.isHost) {
              session.status = "closed";
              gameEnded = true;
            } else {
              removePlayer(session, playerId);
            }
            return true as const;
          }
          const player = session.players.find(p => p.id === playerId);
          if (player) {
            player.connectionStatus = "disconnected";
            if (player.isHost) {
              session.status = "closed";
              gameEnded = true;
            }
          }

          const edgeCase = checkSinglePlayerEdgeCase(session);
          if (edgeCase.shouldEnd) { gameEnded = true; return true as const; }

          if (session.phase === "voting") {
            const recheck = recheckVotingCompletion(session);
            if (recheck.votingComplete) {
              votingResolved = true;
              voteResult = recheck.voteResult;
            }
          }

          if (!votingResolved && isGameInProgress(session)) {
            const result = interruptGame(session);
            gameInterrupted = result.interrupted;
          }
          return true as const;
        });

        const latest = await getSession(sessionId);
        if (latest) {
          chatSystemMessage(io, sessionId, `${playerName} disconnected`);
          graceUpdate(io, sessionId, latest, playerName ?? "");
          phaseUpdate(io, sessionId, latest);
          if (gameEnded || latest.status === "closed") {
            io.to(sessionId).emit("session_closed", { 
              message: "The host has disconnected. Session terminated." 
            });
          }
          if (votingResolved) {
             io.to(sessionId).emit("vote_result", voteResult);
          }
          if (!votingResolved && !gameInterrupted && latest.phase === "orbit_action") {
            await checkAndRunResolution(io, sessionId, latest);
          }
        }
      });
    }
  });
}


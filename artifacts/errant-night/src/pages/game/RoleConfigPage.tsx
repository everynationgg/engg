import React, { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Modal from "@/components/common/Modal";
import { useLocation } from "wouter";
import { ROLES, ALIEN_ROLES, CHAOTIC_ROLES, CREW_ROLES, type Role } from "@/data/roles";
import { playSciFiClick, playLobbyJoin } from "@/lib/sound";
import { getSocket } from "@/lib/socket";
import { systemToast } from "@/components/common/SystemToast";
import ConfirmModal from "@/components/common/ConfirmModal";
import { useAuth } from "@/hooks/useAuth";
import { FaLock, FaBolt, FaCoins, FaTimes } from "react-icons/fa";
import ShopModal from "@/components/shop/ShopModal";
import ProfileModal from "@/components/profile/ProfileModal";
import { gameSessionStore } from "@/lib/gameSessionStore";

const SPECTATOR_ROLES = ROLES.filter((r) => r.team === "spectator");
const NON_SPECTATOR_ROLES = ROLES.filter((r) => r.team !== "spectator");
const SPECTATOR_ROLE = ROLES.find((r) => r.team === "spectator");
const PREMIUM_ROLE_IDS = ["virus", "router", "doctor"];

type SessionPayload = {
  phase: string;
  players: LivePlayer[];
  rolesAssigned: { [playerId: string]: string };
  unlockedRoles: string[];
  roleCounts?: RoleCounts;
  isPublic?: boolean;
  difficulty?: "easy" | "medium" | "hard" | "extreme";
};

function getMyCallsign(): string {
  // Callsign is a preference, safe to share across tabs
  return gameSessionStore.getCallsign("CREW");
}

interface RoleCounts {
  [roleId: string]: number;
}

interface LivePlayer {
  id: string;
  name: string;
  isHost: boolean;
  isYou?: boolean;
  playerId?: string;
  isSpectator?: boolean;
  isBot?: boolean;
  botDifficulty?: "easy" | "medium" | "hard" | "extreme";
}

function getRoomCode(): string {
  return gameSessionStore.getRoomCode("------");
}

function randomizeRoles(playerCount: number, unlockedRoles: string[]): RoleCounts {
  const totalRoles = playerCount + 3;
  const counts: RoleCounts = {};
  ROLES.forEach((r) => { counts[r.id] = 0; });

  const availableRoles = NON_SPECTATOR_ROLES.filter(r =>
    !PREMIUM_ROLE_IDS.includes(r.id) || unlockedRoles.includes(r.id)
  );

  if (availableRoles.length === 0) return counts;

  // Build a pool of exactly totalRoles, randomly chosen from availableRoles
  const pool: string[] = [];
  for (let i = 0; i < totalRoles; i++) {
    const role = availableRoles[Math.floor(Math.random() * availableRoles.length)];
    pool.push(role.id);
  }

  pool.forEach((roleId) => {
    counts[roleId] = (counts[roleId] || 0) + 1;
  });

  return counts;
}

export default function RoleConfigPage() {
  const [isSpectator, setIsSpectator] = useState(false);
  const [, setLocation] = useLocation();
  const [customGameOpen, setCustomGameOpen] = useState(false);
  const [customRoles, setCustomRoles] = useState<{ [playerId: string]: string }>({});
  const [customDeck, setCustomDeck] = useState<[string, string, string]>(["", "", ""]);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [roleCounts, setRoleCounts] = useState<RoleCounts>(() => {
    const init: RoleCounts = {};
    ROLES.forEach((r) => { init[r.id] = 0; });
    return init;
  });
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);
  const [kickError, setKickError] = useState<string | null>(null);
  const [kickConfirmTarget, setKickConfirmTarget] = useState<LivePlayer | null>(null);
  const [kickedNotice, setKickedNotice] = useState<string | null>(null);
  const [nameTakenNotice, setNameTakenNotice] = useState<string | null>(null);
  const [showAloneWarning, setShowAloneWarning] = useState(false);
  const [livePlayers, setLivePlayers] = useState<LivePlayer[]>([]);
  const [isPublic, setIsPublic] = useState(true);
  const [botDifficulty, setBotDifficulty] = useState<"easy" | "medium" | "hard" | "extreme">("medium");
  const [botLoading, setBotLoading] = useState(false);
  const { credits, isLoggedIn, token } = useAuth();
  const [unlockedRoles, setUnlockedRoles] = useState<string[]>([]);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [showShopModal, setShowShopModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  // isCreating is a one-shot flag: read from sessionStorage ONCE on mount (then
  // immediately deleted so reconnects never re-trigger create_session).
  // Only the player who clicked "Create Lobby" will have lp_isCreating="true".
  // Every other path (join, page reload, reconnect) will have it absent → false.
  const [isCreating] = useState(() => {
    return gameSessionStore.consumeIsCreating();
  });

  const myCallsign = getMyCallsign();
  const roomCode = getRoomCode();
  const kickedOutRef = useRef(false);
  const previousPlayerCountRef = useRef(0);

  // Identity lookup available across the entire component
  const myPlayerId = typeof window !== "undefined" ? (gameSessionStore.getPlayerId(roomCode) || gameSessionStore.ensurePlayerId(roomCode)) : null;

  // If this client initiated lobby creation, immediately lock in host status
  useEffect(() => {
    if (isCreating && roomCode) {
      gameSessionStore.setHost(roomCode, true);
    }
  }, [isCreating, roomCode]);



  // Socket connection — server is the single source of truth for phase
  useEffect(() => {
    const socket = getSocket(token || undefined);

    const handlePhaseUpdate = (session: SessionPayload) => {
      console.log("PHASE:", session.phase, "PLAYERS:", session.players.length);

      if (previousPlayerCountRef.current > 0 && session.players.length > previousPlayerCountRef.current) {
        playLobbyJoin();
        systemToast("Player joined", "info");
      }
      previousPlayerCountRef.current = session.players.length;

      // Prefer the stable playerId (non-host) over the volatile socket.id for
      // identifying the current player, so reconnects don't lose the "(You)" marker.
      const mySocketId = socket.id;

      // Update live player list — always reflect the server's authoritative list
      if (session.players) {
        setLivePlayers(session.players);
      }
      // Detect if I am a spectator or host
      const me = session.players.find((p) => (myPlayerId ? p.playerId === myPlayerId : p.id === mySocketId));

      // Detect if I am the host based on server authority
      if (me?.isHost) {
        gameSessionStore.setHost(roomCode);
      }

      setUnlockedRoles(session.unlockedRoles || []);
      if (typeof session.isPublic === "boolean") {
        setIsPublic(session.isPublic);
      }
      if (session.difficulty) {
        setBotDifficulty(session.difficulty);
      }
      if (session.roleCounts && Object.keys(session.roleCounts).length > 0) {
        setRoleCounts(session.roleCounts);
      }

      setIsSpectator(!!me?.isSpectator);

      // Store role assignment when server transitions to role_reveal or any later
      // in-game phase (covers reconnect scenarios where phase is already past role_reveal)
      if (session.phase !== "role_config") {
        if (session.rolesAssigned) {
          const myRole = session.rolesAssigned[myPlayerId || ""] || session.rolesAssigned[mySocketId || ""];
          if (myRole) {
            gameSessionStore.setAssignedRole(myRole);
          }
        }
        gameSessionStore.setTotalPlayers(session.players.length);
      } else {
        // Entering lobby phase: clear the assigned role from previous round
        gameSessionStore.clearAssignedRole();
      }
    };

    const handleKicked = (payload?: { reason?: string }) => {
      const reason = payload?.reason ?? "You were removed by the host";
      kickedOutRef.current = true;
      setKickedNotice(reason);

      // Only remove if we are intentionally leaving, not on refresh
    };

    const handleJoinBlocked = (reason?: string) => {
      const normalized = (reason ?? "").toLowerCase();
      if (!normalized.includes("removed") && !normalized.includes("kicked")) return false;

      kickedOutRef.current = true;
      setKickedNotice(reason ?? "You were removed from this session");
      gameSessionStore.clearVolatileGameState(roomCode);
      return true;
    };

    const handleNameTaken = (reason?: string) => {
      const normalized = (reason ?? "").toLowerCase();
      if (!normalized.includes("name already taken")) return false;

      setNameTakenNotice(`Callsign ${myCallsign} is already taken in this lobby. Please choose a different callsign.`);
      return true;
    };

    // Track whether join_session has succeeded or is in progress.
    let joinSucceeded = false;
    let joinInProgress = false;

    const joinOrCreate = async () => {
      if (kickedOutRef.current || joinInProgress) return;
      joinInProgress = true;

      // isCreating is true only for the player who originally generated the room
      // code on this device. It is a one-shot React state value (sessionStorage
      // key was deleted immediately on mount), so reconnects always see false and
      // always call join_session — preventing any accidental create_session calls.
      const lp_userId = gameSessionStore.getUserId(roomCode);

      console.log(
        "[join] Emitting", isCreating ? "create_session" : "join_session",
        "→ sessionId:", roomCode, "| isCreating:", isCreating,
      );

      // Ensure a stable per-session UUID for both host and non-host flows.
      // Without this, a host recreated via create_session fallback can lose
      // identity continuity after restart/reconnect.
      // ── TAB-ISOLATED IDENTITY ──
      // Prioritize sessionStorage so different tabs can be different players.
      // Use localStorage ONLY as a recovery fallback for the SAME room.
      const playerId = gameSessionStore.ensurePlayerId(roomCode);

      if (!isCreating) {
        const playerToken = gameSessionStore.getPlayerToken(roomCode) || undefined;

        socket.emit(
          "join_session",
          { sessionId: roomCode, playerName: myCallsign, playerId, playerToken, userId: lp_userId ?? undefined },
          (resp: { success: boolean; error?: string; session?: SessionPayload; playerToken?: string }) => {
            joinInProgress = false;
            if (resp?.success && resp.session) {
              console.log("[join] join_session OK — players:", resp.session.players.length);
              joinSucceeded = true;
              
              // Cache the server-returned token (may have been generated server-side).
              if (resp.playerToken) {
                gameSessionStore.setPlayerToken(resp.playerToken, roomCode);
              }
              handlePhaseUpdate(resp.session);
            } else {
              console.warn("[join] join_session failed:", resp?.error ?? "unknown error");
              if (handleJoinBlocked(resp?.error)) {
                joinSucceeded = true;
                return;
              }
              if (handleNameTaken(resp?.error)) {
                joinSucceeded = true;
                return;
              }

              const errLower = (resp?.error ?? "").toLowerCase();
              if (errLower.includes("not found") || errLower.includes("closed") || errLower.includes("invalid session")) {
                joinSucceeded = true;
                systemToast("Session not found or closed.", "error", 6000);
                gameSessionStore.clearVolatileGameState(roomCode);
                setLocation("/");
              } else {
                // For other errors (like transient network issues), don't redirect yet.
                // The periodic retry will catch it if it's transient.
                systemToast(resp?.error || "Connection failed. Retrying...", "warning");
              }
            }
          },
        );
      } else {
        socket.emit(
          "create_session",
          { sessionId: roomCode, playerName: myCallsign, playerId, userId: lp_userId ?? undefined },
          (resp: { success: boolean; error?: string; session?: SessionPayload; playerToken?: string }) => {
            joinInProgress = false;
            if (resp?.success && resp.session) {
              console.log(
                "[join] create_session OK — players:", resp.session.players.length,
              );
              joinSucceeded = true;
              systemToast("Lobby created", "success");
              handlePhaseUpdate(resp.session);
            } else {
              console.warn("[join] create_session failed:", resp?.error ?? "unknown error");
              if (handleJoinBlocked(resp?.error)) {
                joinSucceeded = true;
              } else {
                systemToast("Failed to create game", "error");
              }
            }
          },
        );
      }
    };

    // Register listener BEFORE emitting so we never miss the server's broadcast
    socket.on("phase_update", handlePhaseUpdate);
    socket.on("kicked", handleKicked);
    // Re-join on reconnect so a server restart doesn't strand the player on this page.
    // Reset joinSucceeded so the poll interval retries the join if the reconnect fails.
    const onConnect = () => {
      if (kickedOutRef.current) return;
      joinSucceeded = false;
      joinOrCreate();
    };
    socket.on("connect", onConnect);

    // If already connected, join immediately; otherwise the connect event will fire
    if (socket.connected) {
      joinOrCreate();
    }

    // Fallback poll every 2 s: if connected, fetch latest session state to catch
    // any missed phase_update broadcasts; if disconnected, attempt to rejoin so
    // the socket re-enters the session room after a reconnect.
    // Also retries joinOrCreate when connected but the initial join failed (e.g.
    // token request timed out on first attempt) — prevents silent join failures
    // where the player appears in chat but not in session.players.
    const pollInterval = setInterval(() => {
      if (kickedOutRef.current) return;

      if (socket.connected) {
        if (!joinSucceeded && !joinInProgress) {
          // Join hasn't completed yet — retry instead of just polling state.
          joinOrCreate();
        } else if (joinSucceeded) {
          socket.emit(
            "get_session",
            { sessionId: roomCode, playerId: myPlayerId, playerToken: gameSessionStore.getPlayerToken(roomCode) || undefined },
            (resp: { success: boolean; session?: SessionPayload }) => {
              if (resp?.success && resp.session) {
                handlePhaseUpdate(resp.session);
              }
            },
          );
        }
      } else {
        // Socket is disconnected — attempt to rejoin so
        // the socket re-enters the session room after a reconnect.
        joinOrCreate();
      }
    }, 4000);

    return () => {
      socket.off("phase_update", handlePhaseUpdate);
      socket.off("kicked", handleKicked);
      socket.off("connect", onConnect);
      clearInterval(pollInterval);
    };
  }, [roomCode, myCallsign, isCreating]);

  // Show active roles only in lobby phase (before game starts)
  const showActiveRoles = typeof window !== "undefined" ? !gameSessionStore.getAssignedRole() : true;

  // Derive host status from server-provided player list. Falls back to
  // room-keyed storage to ensure authority survives reloads.
  const amIHost = livePlayers.find((p) => (myPlayerId && p.playerId === myPlayerId) || (getSocket()?.id && p.id === getSocket().id) || (myCallsign && p.name === myCallsign))?.isHost || 
                  gameSessionStore.isHost(roomCode) || 
                  isCreating;

  // Derive final players list with fresh isYou/isHost flags for UI
  const players: LivePlayer[] = useMemo(() => {
    if (livePlayers.length === 0) {
      return [{ id: "local", name: myCallsign, isHost: amIHost, isYou: true }];
    }
    const currentSocketId = getSocket()?.id;
    return livePlayers.map(p => {
      const isMe = (myPlayerId && p.playerId === myPlayerId) || (!!currentSocketId && p.id === currentSocketId) || (myCallsign && p.name === myCallsign);
      return {
        ...p,
        isYou: Boolean(isMe),
        // If the server hasn't caught up but we know we are host from storage, 
        // show the badge for ourselves.
        isHost: Boolean(p.isHost || (isMe && amIHost))
      };
    });
  }, [livePlayers, myPlayerId, amIHost, myCallsign]);
  const joinUrl = `https://engg.online/errant-night/join/${roomCode}`;

  const totalRoleCount = Object.values(roleCounts).reduce((a, b) => a + b, 0);
  const activePlayerCount = players.filter(p => !p.isSpectator).length;
  const requiredRoles = activePlayerCount + 3;
  const rolesReady = totalRoleCount === requiredRoles;

  const handleSelectRole = useCallback((role: Role) => {
    playSciFiClick();
    setSelectedRole(prev => prev?.id === role.id ? null : role);
  }, [playSciFiClick]);

  const handleAdd = useCallback((roleId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    playSciFiClick();
    setRoleCounts((prev) => {
      const next = { ...prev, [roleId]: (prev[roleId] || 0) + 1 };
      if (amIHost) {
        getSocket().emit("update_role_counts", { sessionId: roomCode, roleCounts: next });
      }
      return next;
    });
  }, [amIHost, roomCode]);

  const handleRemove = useCallback((roleId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    playSciFiClick();
    setRoleCounts((prev) => {
      const next = { ...prev, [roleId]: Math.max(0, (prev[roleId] || 0) - 1) };
      if (amIHost) {
        getSocket().emit("update_role_counts", { sessionId: roomCode, roleCounts: next });
      }
      return next;
    });
  }, [amIHost, roomCode]);

  const handleRandomize = useCallback(() => {
    playSciFiClick();
    setStartError(null);
    const activePlayerCount = players.filter(p => !p.isSpectator).length;
    const next = randomizeRoles(activePlayerCount, unlockedRoles);
    setRoleCounts(next);
    if (amIHost) {
      getSocket().emit("update_role_counts", { sessionId: roomCode, roleCounts: next });
    }
  }, [players, unlockedRoles, amIHost, roomCode]);

  const handleCopyLink = useCallback(() => {
    playSciFiClick();
    navigator.clipboard.writeText(joinUrl).then(() => {
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2000);
    });
  }, [joinUrl]);

  const handleTogglePublic = useCallback(() => {
    playSciFiClick();
    const nextPublic = !isPublic;
    setIsPublic(nextPublic);
    getSocket().emit("toggle_public_lobby", { sessionId: roomCode, isPublic: nextPublic });
  }, [isPublic, roomCode]);

  const handleChangeDifficulty = useCallback((diff: "easy" | "medium" | "hard" | "extreme") => {
    playSciFiClick();
    setBotDifficulty(diff);
    getSocket().emit("set_difficulty", { sessionId: roomCode, difficulty: diff });
  }, [roomCode]);

  const handleAddBot = useCallback(() => {
    if (botLoading || players.length >= 10) return;
    playSciFiClick();
    setBotLoading(true);
    getSocket().emit("add_bot", { sessionId: roomCode, difficulty: botDifficulty }, () => {
      setBotLoading(false);
    });
  }, [botLoading, players.length, roomCode, botDifficulty]);

  const handleFillWithBots = useCallback(() => {
    if (botLoading || players.length >= 4) return;
    playSciFiClick();
    setBotLoading(true);
    const needed = Math.max(0, 4 - players.length);
    let remaining = needed;
    for (let i = 0; i < needed; i++) {
      getSocket().emit("add_bot", { sessionId: roomCode, difficulty: botDifficulty }, () => {
        remaining--;
        if (remaining <= 0) setBotLoading(false);
      });
    }
  }, [botLoading, players.length, roomCode, botDifficulty]);

  const handleRemoveBot = useCallback((botId: string) => {
    playSciFiClick();
    getSocket().emit("remove_bot", { sessionId: roomCode, botId });
  }, [roomCode]);

  // For custom game: require all players and all 3 deck cards to be assigned
  const customGameReady = players.length > 0 && players.every(p => p.isHost || customRoles[p.id]) && customDeck.every(Boolean);
  const handleCustomDeckChange = (idx: number, value: string) => {
    setCustomDeck(deck => {
      const next = [...deck] as [string, string, string];
      next[idx] = value;
      return next;
    });
  };
  const handleStartCustomGame = useCallback(() => {
    playSciFiClick();
    if (players.length <= 1) {
      setStartError("Cannot start game with only 1 player");
      setShowAloneWarning(true);
      systemToast("Cannot launch mission alone. At least 2 players required!", "warning", 5000);
      return;
    }
    if (!customGameReady) {
      setStartError("Assign all player roles and all 3 deck cards");
      setTimeout(() => setStartError(null), 3000);
      return;
    }
    setStartError(null);

    // Auto-assign host as spectator for custom games
    const host = players.find(p => p.isHost);
    const finalCustomRoles = { ...customRoles };
    if (host) {
      finalCustomRoles[host.id] = "spectator";
    }

    // Debug log: print finalCustomRoles and player IDs before emitting
    console.log("[DEBUG] Emitting start_game_custom", { sessionId: roomCode, customRoles: finalCustomRoles, customDeck });

    const socket = getSocket();
    socket.emit(
      "start_game_custom",
      { sessionId: roomCode, customRoles: finalCustomRoles, customDeck },
      (resp: { success: boolean; error?: string }) => {
        if (!resp?.success) {
          setStartError(resp?.error ?? "Failed to start custom game");
          setTimeout(() => setStartError(null), 4000);
        } else {
          setCustomGameOpen(false);
        }
      },
    );
  }, [players.length, customGameReady, customRoles, customDeck, roomCode]);

  const handleStartGame = useCallback(() => {
    playSciFiClick();
    if (players.length <= 1) {
      setStartError("Cannot start game with only 1 player");
      setShowAloneWarning(true);
      systemToast("Cannot launch mission alone. At least 2 players required!", "warning", 5000);
      return;
    }
    if (!rolesReady) {
      setStartError("Not enough roles configured");
      systemToast("Configure all required roles before starting!", "warning", 3000);
      setTimeout(() => setStartError(null), 3000);
      return;
    }
    setStartError(null);

    // Server is authoritative — send role counts and let the server
    // assign roles, update phase, and broadcast phase_update to all players
    const socket = getSocket();
    socket.emit(
      "start_game",
      { sessionId: roomCode, roleCounts },
      (resp: { success: boolean; error?: string }) => {
        if (!resp?.success) {
          setStartError(resp?.error ?? "Failed to start — reconnecting, please try again");
          setTimeout(() => setStartError(null), 4000);
        }
      },
    );
  }, [players.length, rolesReady, roleCounts, roomCode]);

  const handleKickPlayer = useCallback((target: LivePlayer) => {
    if (!target.playerId) {
      setKickError("Cannot kick this player yet. Ask them to rejoin once.");
      setTimeout(() => setKickError(null), 3000);
      return;
    }

    setKickConfirmTarget(target);
  }, []);

  const confirmKickPlayer = useCallback(() => {
    if (!kickConfirmTarget?.playerId) {
      setKickConfirmTarget(null);
      return;
    }

    playSciFiClick();
    const socket = getSocket();
    socket.emit(
      "kick_player",
      { sessionId: roomCode, targetPlayerId: kickConfirmTarget.playerId },
      (resp: { success: boolean; error?: string }) => {
        if (!resp?.success) {
          setKickError(resp?.error ?? "Failed to kick player");
          setTimeout(() => setKickError(null), 3000);
        }
        setKickConfirmTarget(null);
      },
    );
  }, [kickConfirmTarget, roomCode]);

  const closeKickConfirm = useCallback(() => {
    setKickConfirmTarget(null);
  }, []);

  const acknowledgeKicked = useCallback(() => {
    setKickedNotice(null);
    setLocation("/");
  }, [setLocation]);

  const acknowledgeNameTaken = useCallback(() => {
    setNameTakenNotice(null);
    gameSessionStore.clearVolatileGameState(roomCode);
    setLocation(`/join/${roomCode}`);
  }, [roomCode, setLocation]);

  const handleUnlockRole = useCallback((roleId: string) => {
    if (!isLoggedIn) {
      systemToast("Authentication required to spend credits", "warning");
      return;
    }
    if (isUnlocking) return;
    playSciFiClick();
    setIsUnlocking(true);

    const socket = getSocket();
    socket.emit("unlock_role", { sessionId: roomCode, roleId }, (resp: { success: boolean; error?: string }) => {
      setIsUnlocking(false);
      if (resp.success) {
        systemToast(`${roleId.toUpperCase()} role authorized for this match!`, "success");
      } else {
        systemToast(resp.error || "Unlock failed", "error");
      }
    });
  }, [roomCode, isUnlocking, isLoggedIn]);


  // Spectators see the same HUD as the host, just without controls.
  // We'll let them fall through to the main render.

  return (
    <div
      className="relative h-screen w-full flex flex-col overflow-hidden"
      style={{ background: "hsl(220 30% 5%)", color: "hsl(190 80% 90%)" }}
    >

      <ConfirmModal
        isOpen={Boolean(kickConfirmTarget)}
        title="Kick Player"
        message={kickConfirmTarget ? `Remove ${kickConfirmTarget.name} from this lobby?` : "Remove this player from this lobby?"}
        warning="This player will be ejected and cannot rejoin this session."
        confirmLabel="Kick"
        cancelLabel="Cancel"
        onConfirm={confirmKickPlayer}
        onCancel={closeKickConfirm}
      />

      <ConfirmModal
        isOpen={Boolean(kickedNotice)}
        title="Ejected"
        message={kickedNotice ?? "You were removed from this lobby."}
        warning="You have been removed from this session by the host."
        showCancel={false}
        confirmLabel="OK"
        onConfirm={acknowledgeKicked}
        onCancel={acknowledgeKicked}
      />

      <ConfirmModal
        isOpen={Boolean(nameTakenNotice)}
        title="Callsign Taken"
        message={nameTakenNotice ?? "This callsign is already taken in this lobby."}
        warning="Pick a different callsign and try joining again."
        showCancel={false}
        confirmLabel="Choose New Callsign"
        onConfirm={acknowledgeNameTaken}
        onCancel={acknowledgeNameTaken}
      />

      <ConfirmModal
        isOpen={showAloneWarning}
        title="CANNOT START ALONE"
        message="Errant Night is a multiplayer social deduction game. You cannot launch a match with only 1 player."
        warning="Share your Room Code or tap 'COPY INVITE LINK' to invite crewmates before launching."
        confirmLabel="COPY INVITE LINK"
        cancelLabel="DISMISS"
        onConfirm={() => {
          setShowAloneWarning(false);
          handleCopyLink();
        }}
        onCancel={() => setShowAloneWarning(false)}
      />

      {/* Top bar */}
      <div
        className="hidden lg:hidden w-full px-8 py-6 flex items-center gap-6 border-b shrink-0 h-[var(--nav-height)]"
        style={{
          background: "hsl(220 28% 7%)",
          borderColor: "hsl(185 100% 50% / 0.15)",
          boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
          zIndex: 60
        }}
      >
        <div className="flex-1 min-w-0">
          <div
            className="font-orbitron font-black text-xl sm:text-2xl tracking-[0.25em] sm:tracking-[0.3em] uppercase leading-none italic"
            style={{ color: "hsl(185 100% 55%)", textShadow: "0 0 15px hsl(185 100% 50% / 0.8)" }}
          >
            Role Setup
          </div>
          <div
            className="font-orbitron font-bold text-[10px] tracking-[0.5em] uppercase opacity-40 mt-1"
            style={{ color: "hsl(270 80% 65%)" }}
          >
            Match Configuration
          </div>
        </div>

        <div className="flex items-center gap-8 shrink-0">
          {isLoggedIn ? (
            <div className="flex items-center gap-6 bg-white/[0.03] px-6 py-2 border border-white/5 rounded-sm">
              <div className="flex flex-col items-end">
                <div className="text-[9px] tracking-[0.3em] uppercase opacity-40 font-bold">Signed In</div>
                <div className="font-orbitron text-xs text-white/80">{gameSessionStore.getCallsign()}</div>
              </div>
              <div className="w-px h-6 bg-white/10" />
              <div className="flex flex-col items-end">
                <div className="text-[9px] tracking-[0.3em] uppercase opacity-40 font-bold">Credits</div>
                <div
                  className="font-orbitron font-black text-xl tracking-[0.1em] text-glow-cyan"
                  style={{ color: "hsl(185 100% 65%)" }}
                >
                  {credits} <span className="text-[10px] opacity-40 italic">CC</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-right">
              <div className="text-[10px] tracking-[0.4em] uppercase mb-1 opacity-40 font-bold">Unauthenticated_Session</div>
              <div className="font-orbitron font-black text-sm tracking-[0.3em] text-white/60">GUEST_ACCESS</div>
            </div>
          )}
        </div>
      </div>



      {/* Role Deck Area */}
      <div className="flex flex-col lg:flex-row flex-1 relative overflow-hidden">
        {/* LEFT SIDEBAR — players (desktop only, hidden on mobile) */}
        <div className="hidden lg:flex w-72 shrink-0 flex-col border-r h-full overflow-hidden" style={{ background: "hsl(220 30% 6%)", borderColor: "hsl(210 30% 14%)" }}>
          <div className="p-6 border-b" style={{ borderColor: "hsl(210 30% 14%)" }}>
            <div className="text-[11px] tracking-[0.5em] uppercase font-mono mb-2 opacity-30 font-bold">Lobby Ready</div>
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="font-orbitron font-black text-2xl tracking-[0.25em] text-white shadow-cyan-500/20">{roomCode}</div>
                {amIHost ? (
                  <button
                    onClick={handleTogglePublic}
                    className={`px-2 py-0.5 rounded text-[10px] font-orbitron font-bold tracking-wider uppercase border transition-all cursor-pointer ${
                      isPublic
                        ? "bg-emerald-950/60 border-emerald-500/50 text-emerald-300 hover:bg-emerald-900/80 shadow-[0_0_8px_rgba(16,185,129,0.3)]"
                        : "bg-amber-950/60 border-amber-500/50 text-amber-300 hover:bg-amber-900/80 shadow-[0_0_8px_rgba(245,158,11,0.3)]"
                    }`}
                  >
                    {isPublic ? "PUBLIC 🌐" : "PRIVATE 🔒"}
                  </button>
                ) : (
                  <span className={`px-2 py-0.5 rounded text-[10px] font-orbitron font-semibold tracking-wider uppercase border ${
                    isPublic ? "bg-emerald-950/40 border-emerald-500/30 text-emerald-400" : "bg-amber-950/40 border-amber-500/30 text-amber-400"
                  }`}>
                    {isPublic ? "PUBLIC 🌐" : "PRIVATE 🔒"}
                  </span>
                )}
              </div>
              {amIHost && (
                <div className="p-2.5 rounded border bg-cyan-950/20 border-cyan-500/30">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[9px] font-orbitron font-bold tracking-wider text-cyan-400 uppercase">
                      COMPUTER BOTS
                    </span>
                    <div className="flex items-center gap-1">
                      {(["easy", "medium", "hard", "extreme"] as const).map((diff) => (
                        <button
                          key={diff}
                          onClick={() => handleChangeDifficulty(diff)}
                          className={`px-1.5 py-0.5 text-[8px] font-orbitron rounded uppercase transition-all ${
                            botDifficulty === diff
                              ? "bg-cyan-500 text-black font-bold shadow-[0_0_8px_rgba(6,182,212,0.6)]"
                              : "bg-white/5 text-white/50 hover:text-white"
                          }`}
                        >
                          {diff}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleAddBot}
                      disabled={botLoading || players.length >= 10}
                      className="flex-1 py-1 px-1.5 rounded font-orbitron text-[9px] tracking-wider uppercase bg-cyan-900/40 hover:bg-cyan-800/60 border border-cyan-500/40 text-cyan-200 transition-all active:scale-95 disabled:opacity-40 cursor-pointer"
                    >
                      + ADD BOT
                    </button>
                    {players.length < 4 && (
                      <button
                        onClick={handleFillWithBots}
                        disabled={botLoading}
                        className="flex-1 py-1 px-1.5 rounded font-orbitron text-[9px] tracking-wider uppercase bg-indigo-900/40 hover:bg-indigo-800/60 border border-indigo-500/40 text-indigo-200 transition-all active:scale-95 disabled:opacity-40 cursor-pointer"
                      >
                        FILL TO 4
                      </button>
                    )}
                  </div>
                </div>
              )}
              <button
                onClick={handleCopyLink}
                className="w-full py-1.5 font-orbitron text-[10px] tracking-[0.1em] uppercase rounded border transition-all duration-150 cursor-pointer"
                style={{
                  background: copyFeedback ? "hsl(140 60% 15% / 0.6)" : "hsl(220 28% 10%)",
                  borderColor: copyFeedback ? "hsl(140 60% 45%)" : "hsl(185 100% 50% / 0.35)",
                  color: copyFeedback ? "hsl(140 60% 60%)" : "hsl(185 100% 50%)",
                }}
              >
                {copyFeedback ? "COPIED!" : "COPY LINK"}
              </button>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <div className="text-[10px] font-mono uppercase tracking-widest" style={{ color: "hsl(185 100% 50% / 0.6)" }}>
                {Object.values(roleCounts).reduce((a, b) => a + b, 0)} Total Roles
              </div>
              <div className="text-[9px] font-mono uppercase tracking-widest" style={{ color: "hsl(210 30% 35%)" }}>
                {players.length} Players
              </div>
            </div>
          </div>

          {/* Role summary: moved to top for better visibility */}
          {showActiveRoles && (
            <div className="px-5 py-4 border-b bg-cyan-500/5 pb-6" style={{ borderColor: "hsl(210 30% 14%)" }}>
              <div className="text-[10px] tracking-[0.25em] uppercase mb-3 font-bold" style={{ color: "hsl(210 30% 55%)" }}>Active Roles Manifest</div>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {ROLES.filter((r) => (roleCounts[r.id] || 0) > 0).map((r) => (
                  <div
                    key={r.id}
                    className="px-1.5 py-0.5 rounded border flex items-center gap-1.5"
                    style={{
                      background: "hsl(220 30% 10%)",
                      borderColor: r.team === "alien" ? "hsl(270 80% 50% / 0.3)" : r.team === "chaotic" ? "hsl(300 70% 50% / 0.3)" : "hsl(185 100% 50% / 0.3)"
                    }}
                  >
                    <span
                      className="text-[9px] font-orbitron tracking-wider uppercase"
                      style={{
                        color: r.team === "alien" ? "hsl(270 80% 65%)" : r.team === "chaotic" ? "hsl(300 70% 65%)" : "hsl(185 100% 60%)",
                      }}
                    >
                      {r.name}
                    </span>
                    <span className="text-[9px] font-bold" style={{ color: "hsl(190 60% 75%)" }}>{roleCounts[r.id]}</span>
                  </div>
                ))}
                {ROLES.every((r) => (roleCounts[r.id] || 0) === 0) && (
                  <div className="text-[10px] font-mono italic" style={{ color: "hsl(210 30% 35%)" }}>Initialization required — no roles selected</div>
                )}
              </div>
            </div>
          )}

          <div className="flex-1 overflow-y-auto px-4 py-3">
            <div className="text-[10px] tracking-widest uppercase mb-3 px-1" style={{ color: "hsl(210 30% 45%)" }}>Personnel_List</div>
            <div className="space-y-1">
              {players.map((player) => (
                <div
                  key={player.id}
                  className="group relative flex items-center justify-between p-2 rounded transition-all duration-200"
                  style={{
                    background: player.isYou ? "hsl(185 100% 50% / 0.05)" : "transparent",
                    border: player.isYou ? "1px solid hsl(185 100% 50% / 0.15)" : "1px solid transparent"
                  }}
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className={`w-2 h-2 rounded-full ${player.isYou ? "bg-cyan-500 shadow-[0_0_10px_#00f3ff] animate-pulse" : "bg-white/10"}`} />
                    <span className={`font-orbitron text-[12px] font-bold tracking-widest uppercase truncate ${player.isYou ? "text-white" : "text-white/30"}`}>
                      {player.name}
                    </span>
                  </div>
                  {player.isHost && (
                    <div className="px-2 py-0.5 rounded-[1px] bg-cyan-500/15 border border-cyan-500/30 text-[8px] font-orbitron font-black tracking-[0.2em] text-cyan-400 italic">
                      HOST
                    </div>
                  )}
                  {player.isBot && (
                    <div className="px-1.5 py-0.5 rounded-[1px] bg-purple-500/20 border border-purple-500/40 text-[8px] font-orbitron font-bold tracking-wider text-purple-300">
                      BOT
                    </div>
                  )}
                  {amIHost && player.isBot && (
                    <button
                      onClick={() => handleRemoveBot(player.playerId || player.id)}
                      className="opacity-0 group-hover:opacity-100 absolute right-2 bg-red-500/20 hover:bg-red-500/40 border border-red-500/50 text-red-300 text-[8px] px-1.5 py-0.5 transition-all cursor-pointer rounded"
                      title="Deactivate bot"
                    >
                      REMOVE
                    </button>
                  )}
                  {amIHost && !player.isYou && player.playerId !== myPlayerId && (
                    <button
                      onClick={() => handleKickPlayer(player)}
                      className="opacity-0 group-hover:opacity-100 absolute right-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-500 text-[8px] px-1.5 py-0.5 transition-all"
                    >
                      KICK
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CENTER PANEL */}
        <div
          className="flex-1 overflow-y-auto px-4 sm:px-6 pb-8 h-full custom-scrollbar"
          style={{
            paddingTop: "max(16px, calc(env(safe-area-inset-top, 36px) + 12px))",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedRole(null);
          }}
        >

          {/* Mobile-only: room code + player list */}
          <div className="lg:hidden mb-5 pb-5 border-b" style={{ borderColor: "hsl(210 30% 14%)" }}>
            <div className="flex flex-col gap-4 mb-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs tracking-widest uppercase" style={{ color: "hsl(210 30% 45%)" }}>Room Code</span>
                    {amIHost ? (
                      <button
                        onClick={handleTogglePublic}
                        className={`px-2 py-0.5 rounded text-[10px] font-orbitron font-bold tracking-wider uppercase border transition-all cursor-pointer ${
                          isPublic
                            ? "bg-emerald-950/60 border-emerald-500/50 text-emerald-300 hover:bg-emerald-900/80 shadow-[0_0_8px_rgba(16,185,129,0.3)]"
                            : "bg-amber-950/60 border-amber-500/50 text-amber-300 hover:bg-amber-900/80 shadow-[0_0_8px_rgba(245,158,11,0.3)]"
                        }`}
                      >
                        {isPublic ? "PUBLIC 🌐" : "PRIVATE 🔒"}
                      </button>
                    ) : (
                      <span className={`px-2 py-0.5 rounded text-[10px] font-orbitron font-semibold tracking-wider uppercase border ${
                        isPublic ? "bg-emerald-950/40 border-emerald-500/30 text-emerald-400" : "bg-amber-950/40 border-amber-500/30 text-amber-400"
                      }`}>
                        {isPublic ? "PUBLIC 🌐" : "PRIVATE 🔒"}
                      </span>
                    )}
                  </div>
                  <div className="font-orbitron font-black text-2xl tracking-[0.25em]" style={{ color: "hsl(185 100% 60%)", textShadow: "0 0 8px hsl(185 100% 50% / 0.5)" }}>
                    {roomCode}
                  </div>
                </div>
                <div
                  className="px-2 py-1 rounded text-xs"
                  style={{
                    background: "hsl(220 28% 10%)",
                    border: "1px solid hsl(185 100% 50% / 0.25)",
                    color: "hsl(185 100% 72%)",
                    fontFamily: "'Exo 2', sans-serif",
                  }}
                >
                  {players.length}/10 · min 4
                </div>
              </div>
              <button
                onClick={handleCopyLink}
                className="w-full py-2 font-orbitron text-xs tracking-[0.15em] uppercase rounded border transition-all duration-150 cursor-pointer"
                style={{
                  background: copyFeedback ? "hsl(140 60% 15% / 0.6)" : "hsl(220 28% 10%)",
                  borderColor: copyFeedback ? "hsl(140 60% 45%)" : "hsl(185 100% 50% / 0.35)",
                  color: copyFeedback ? "hsl(140 60% 60%)" : "hsl(185 100% 50%)",
                }}
              >
                {copyFeedback ? "COPIED!" : "COPY LINK"}
              </button>
              {amIHost && (
                <div className="p-2.5 rounded border bg-cyan-950/20 border-cyan-500/30">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-orbitron font-bold tracking-wider text-cyan-400 uppercase">
                      COMPUTER BOTS
                    </span>
                    <div className="flex items-center gap-1">
                      {(["easy", "medium", "hard", "extreme"] as const).map((diff) => (
                        <button
                          key={diff}
                          onClick={() => handleChangeDifficulty(diff)}
                          className={`px-2 py-0.5 text-[9px] font-orbitron rounded uppercase transition-all ${
                            botDifficulty === diff
                              ? "bg-cyan-500 text-black font-bold shadow-[0_0_8px_rgba(6,182,212,0.6)]"
                              : "bg-white/5 text-white/50 hover:text-white"
                          }`}
                        >
                          {diff}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleAddBot}
                      disabled={botLoading || players.length >= 10}
                      className="flex-1 py-1.5 px-2 rounded font-orbitron text-[10px] tracking-wider uppercase bg-cyan-900/40 hover:bg-cyan-800/60 border border-cyan-500/40 text-cyan-200 transition-all active:scale-95 disabled:opacity-40 cursor-pointer"
                    >
                      + ADD BOT
                    </button>
                    {players.length < 4 && (
                      <button
                        onClick={handleFillWithBots}
                        disabled={botLoading}
                        className="flex-1 py-1.5 px-2 rounded font-orbitron text-[10px] tracking-wider uppercase bg-indigo-900/40 hover:bg-indigo-800/60 border border-indigo-500/40 text-indigo-200 transition-all active:scale-95 disabled:opacity-40 cursor-pointer"
                      >
                        FILL TO 4
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Horizontal scrolling player list on mobile */}
            <div className="flex overflow-x-auto gap-1.5 pb-2 scrollbar-none snap-x">
              {players.map((player) => (
                <div
                  key={player.id}
                  className="px-2.5 py-1 rounded font-orbitron text-xs tracking-wider flex items-center gap-2 whitespace-nowrap shrink-0 snap-center"
                  style={{
                    background: "hsl(220 28% 10%)",
                    border: player.isYou ? "1px solid hsl(185 100% 50% / 0.5)" : "1px solid hsl(210 30% 15%)",
                    color: player.isYou ? "hsl(185 100% 70%)" : "hsl(190 60% 70%)",
                  }}
                >
                  <span>{player.name}{player.isHost ? " HOST" : ""}{player.isBot ? " [BOT]" : ""}{player.isYou ? " ★" : ""}</span>
                  {amIHost && player.isBot && (
                    <button
                      onClick={() => handleRemoveBot(player.playerId || player.id)}
                      className="text-red-400 font-bold ml-1 hover:text-red-300 px-1 text-[11px]"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
            {kickError && (
              <div className="text-xs mt-2" style={{ color: "hsl(0 75% 60%)" }}>
                {kickError}
              </div>
            )}

            {/* Mobile Active Roles Summary */}
            {showActiveRoles && (
              <div className="mt-4 p-3 bg-white/5 border border-white/10 rounded">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-[10px] tracking-widest uppercase opacity-60 font-orbitron">
                    Active Roles ({totalRoleCount}/{requiredRoles})
                  </div>
                  {amIHost && (
                    <button
                      onClick={handleRandomize}
                      data-testid="button-randomize-roles-badge"
                      className="px-2.5 py-1 rounded text-[10px] font-orbitron font-bold tracking-wider uppercase border border-amber-500/50 bg-amber-500/10 hover:bg-amber-500/25 text-amber-300 active:scale-95 transition-all flex items-center gap-1 shadow-[0_0_8px_rgba(245,158,11,0.2)]"
                    >
                      <span>🎲</span>
                      <span>RANDOMIZE</span>
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1">
                  {ROLES.filter((r) => (roleCounts[r.id] || 0) > 0).map((r) => (
                    <div key={r.id} className="flex items-center gap-2">
                      <span className="text-[10px]" style={{ color: r.team === "alien" ? "hsl(270 80% 65%)" : r.team === "chaotic" ? "hsl(300 70% 65%)" : "hsl(185 100% 60%)" }}>
                        {r.name}
                      </span>
                      <span className="font-orbitron text-[10px] text-white/60">x{roleCounts[r.id]}</span>
                    </div>
                  ))}
                  {ROLES.every((r) => (roleCounts[r.id] || 0) === 0) && (
                    <div className="text-[10px] text-white/20">No roles selected</div>
                  )}
                </div>
              </div>
            )}

            {/* Mobile Action Buttons (Host Only) */}
            {amIHost && (
              <div className="mt-4 flex flex-col gap-2">
                {startError && (
                  <div className="text-[10px] text-red-500 font-mono uppercase tracking-widest mb-1">{startError}</div>
                )}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={handleRandomize}
                    data-testid="button-randomize-roles-mobile"
                    className="px-3 py-2.5 font-orbitron font-bold text-xs tracking-[0.15em] uppercase rounded border-2 transition-all flex items-center justify-center gap-1.5 shadow-[0_0_10px_rgba(245,158,11,0.25)]"
                    style={{
                      background: "linear-gradient(135deg, hsl(45 90% 20% / 0.7), hsl(30 90% 12% / 0.9))",
                      borderColor: "hsl(45 90% 50%)",
                      color: "hsl(45 90% 80%)"
                    }}
                  >
                    <span>🎲</span>
                    <span>RANDOMIZE</span>
                  </button>
                  <button
                    onClick={() => setCustomGameOpen(true)}
                    className="px-3 py-2.5 font-orbitron font-bold text-xs tracking-[0.15em] uppercase rounded border-2 transition-all flex items-center justify-center gap-1.5"
                    style={{
                      background: "hsl(270 80% 15% / 0.5)",
                      borderColor: "hsl(270 80% 50% / 0.7)",
                      color: "hsl(270 80% 80%)"
                    }}
                  >
                    <span>⚙️</span>
                    <span>CUSTOM</span>
                  </button>
                </div>
                <button
                  onClick={handleStartGame}
                  className="w-full py-3.5 font-orbitron font-bold text-xs tracking-[0.3em] uppercase rounded border-2 transition-all flex items-center justify-center gap-2"
                  style={{
                    background: rolesReady ? "hsl(185 100% 15% / 0.7)" : "hsl(220 28% 10%)",
                    borderColor: rolesReady ? "hsl(185 100% 50%)" : "hsl(210 30% 20%)",
                    color: rolesReady ? "hsl(185 100% 65%)" : "hsl(210 30% 40%)",
                    boxShadow: rolesReady ? "0 0 15px hsl(185 100% 50% / 0.25)" : "none"
                  }}
                >
                  <span>🚀</span>
                  <span>START GAME</span>
                </button>
              </div>
            )}
          </div>

          {/* Desktop Action buttons — host only, anchored above the role cards */}
          {amIHost && (
            <div className="hidden lg:flex flex-wrap items-center gap-3 mb-5">
              {startError && (
                <span
                  className="w-full text-xs tracking-wider"
                  style={{ color: "hsl(0 75% 60%)", fontFamily: "'Exo 2', sans-serif" }}
                >
                  {startError}
                </span>
              )}
              <button
                onClick={handleRandomize}
                data-testid="button-randomize-roles"
                className="flex-1 sm:flex-none px-5 py-2 font-orbitron font-bold text-xs tracking-[0.2em] uppercase rounded-md border-2 transition-all duration-150 cursor-pointer"
                style={{
                  background: "linear-gradient(135deg, hsl(45 90% 20% / 0.6), hsl(30 90% 12% / 0.8))",
                  borderColor: "hsl(45 90% 50%)",
                  color: "hsl(45 90% 65%)",
                  boxShadow: "0 0 8px hsl(45 90% 50% / 0.3), 0 0 16px hsl(45 90% 50% / 0.1)",
                }}
                onMouseEnter={(e) => {
                  const btn = e.currentTarget;
                  btn.style.boxShadow = "0 0 14px hsl(45 90% 50% / 0.6), 0 0 28px hsl(45 90% 50% / 0.25)";
                  btn.style.color = "hsl(45 90% 80%)";
                }}
                onMouseLeave={(e) => {
                  const btn = e.currentTarget;
                  btn.style.boxShadow = "0 0 8px hsl(45 90% 50% / 0.3), 0 0 16px hsl(45 90% 50% / 0.1)";
                  btn.style.color = "hsl(45 90% 65%)";
                }}
              >
                RANDOMIZE ROLES
              </button>

              {/* Custom Game Button */}
              <button
                onClick={() => setCustomGameOpen(true)}
                data-testid="button-custom-game"
                className="flex-1 sm:flex-none px-5 py-2 font-orbitron font-bold text-xs tracking-[0.2em] uppercase rounded-md border-2 transition-all duration-150 cursor-pointer"
                style={{
                  background: "linear-gradient(135deg, hsl(270 80% 20% / 0.6), hsl(270 80% 12% / 0.8))",
                  borderColor: "hsl(270 80% 50%)",
                  color: "hsl(270 80% 65%)",
                  boxShadow: "0 0 8px hsl(270 80% 50% / 0.3), 0 0 16px hsl(270 80% 50% / 0.1)",
                }}
                onMouseEnter={(e) => {
                  const btn = e.currentTarget;
                  btn.style.boxShadow = "0 0 14px hsl(270 80% 50% / 0.6), 0 0 28px hsl(270 80% 50% / 0.25)";
                  btn.style.color = "hsl(270 80% 80%)";
                }}
                onMouseLeave={(e) => {
                  const btn = e.currentTarget;
                  btn.style.boxShadow = "0 0 8px hsl(270 80% 50% / 0.3), 0 0 16px hsl(270 80% 50% / 0.1)";
                  btn.style.color = "hsl(270 80% 65%)";
                }}
              >
                CUSTOM GAME
              </button>

              <button
                onClick={handleStartGame}
                data-testid="button-start-game"
                className="flex-1 sm:flex-none px-5 py-2 font-orbitron font-bold text-xs tracking-[0.2em] uppercase rounded-md border-2 transition-all duration-150 cursor-pointer"
                style={{
                  background: rolesReady
                    ? "linear-gradient(135deg, hsl(185 100% 18% / 0.7), hsl(185 100% 8% / 0.9))"
                    : "hsl(220 28% 10%)",
                  borderColor: rolesReady ? "hsl(185 100% 50%)" : "hsl(210 30% 25%)",
                  color: rolesReady ? "hsl(185 100% 65%)" : "hsl(210 30% 40%)",
                  boxShadow: rolesReady
                    ? "0 0 8px hsl(185 100% 50% / 0.4), 0 0 18px hsl(185 100% 50% / 0.15)"
                    : "none",
                  cursor: rolesReady ? "pointer" : "not-allowed",
                }}
                onMouseEnter={(e) => {
                  if (!rolesReady) return;
                  const btn = e.currentTarget;
                  btn.style.boxShadow = "0 0 16px hsl(185 100% 50% / 0.7), 0 0 32px hsl(185 100% 50% / 0.3)";
                  btn.style.color = "hsl(185 100% 85%)";
                }}
                onMouseLeave={(e) => {
                  if (!rolesReady) return;
                  const btn = e.currentTarget;
                  btn.style.boxShadow = "0 0 8px hsl(185 100% 50% / 0.4), 0 0 18px hsl(185 100% 50% / 0.15)";
                  btn.style.color = "hsl(185 100% 65%)";
                }}
              >
                START GAME
              </button>
            </div>
          )}
          {/* Custom Game Modal */}
          <Modal open={customGameOpen} onClose={() => setCustomGameOpen(false)} title="Custom Game Setup">
            <div className="flex flex-col gap-4">
              {(() => {
                const selectableRoles = NON_SPECTATOR_ROLES.filter(r =>
                  !PREMIUM_ROLE_IDS.includes(r.id) || unlockedRoles.includes(r.id)
                );
                return (
                  <>
                    <div className="font-orbitron text-sm mb-2">Assign roles to each player:</div>
                    {players.map((player) => (
                      <div key={player.id} className="flex items-center gap-3">
                        <span className="min-w-[100px] font-orbitron text-xs" style={{ color: "hsl(185 100% 70%)" }}>{player.name}{player.isHost ? " (Host)" : ""}</span>
                        {player.isHost ? (
                          <div className="px-2 py-1 rounded border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 font-orbitron text-[10px] tracking-wider uppercase">
                            Spectator (Auto)
                          </div>
                        ) : (
                          <select
                            className="px-2 py-1 rounded border bg-black text-white"
                            value={customRoles[player.id] || ""}
                            onChange={e => setCustomRoles(r => ({ ...r, [player.id]: e.target.value }))}
                          >
                            <option value="">— Assign a role —</option>
                            {selectableRoles.map(role => (
                              <option key={role.id} value={role.id}>{role.name}</option>
                            ))}
                            {SPECTATOR_ROLE && <option value={SPECTATOR_ROLE.id}>{SPECTATOR_ROLE.name}</option>}
                          </select>
                        )}
                      </div>
                    ))}
                    <div className="font-orbitron text-sm mt-4 mb-2">Assign 3 center deck cards:</div>
                    <div className="flex flex-col gap-2">
                      {[0, 1, 2].map(idx => (
                        <div key={idx} className="flex items-center gap-3">
                          <span className="min-w-[80px] font-orbitron text-xs" style={{ color: "hsl(210 80% 70%)" }}>{`Card ${idx + 1}`}</span>
                          <select
                            className="px-2 py-1 rounded border bg-black text-white"
                            value={customDeck[idx]}
                            onChange={e => handleCustomDeckChange(idx, e.target.value)}
                          >
                            <option value="">— Assign a role —</option>
                            {selectableRoles.map(role => (
                              <option key={role.id} value={role.id}>{role.name}</option>
                            ))}
                          </select>
                        </div>
                      ))}
                    </div>
                  </>
                );
              })()}
              <div className="flex gap-3 mt-4">
                <button
                  className="flex-1 px-4 py-2 rounded bg-blue-700 text-white font-orbitron text-xs tracking-wider"
                  disabled={!customGameReady}
                  onClick={handleStartCustomGame}
                >
                  Start Game
                </button>
                <button
                  className="flex-1 px-4 py-2 rounded bg-gray-700 text-white font-orbitron text-xs tracking-wider"
                  onClick={() => setCustomGameOpen(false)}
                >
                  Cancel
                </button>
              </div>
              {startError && (
                <div className="text-xs mt-2" style={{ color: "hsl(0 75% 60%)" }}>{startError}</div>
              )}
            </div>
          </Modal>

          {/* Alien Team */}
          <div className="mb-4">
            <div className="flex items-center gap-3 mb-4">
              <div
                className="h-px flex-1"
                style={{ background: "linear-gradient(90deg, hsl(270 80% 55% / 0.6), transparent)" }}
              />
              <span
                className="font-orbitron font-bold text-[10px] tracking-[0.2em] uppercase px-3"
                style={{ color: "hsl(270 80% 65%)", textShadow: "0 0 8px hsl(270 80% 55% / 0.7)" }}
              >
                ALIEN TEAM
              </span>
              <div
                className="h-px flex-1"
                style={{ background: "linear-gradient(90deg, transparent, hsl(270 80% 55% / 0.6))" }}
              />
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-6 lg:grid-cols-8 gap-1.5 lg:gap-2">
              {ALIEN_ROLES.map((role) => (
                <RoleCard
                  key={role.id}
                  role={role}
                  count={roleCounts[role.id] || 0}
                  isSelected={selectedRole?.id === role.id}
                  showControls={amIHost}
                  onSelect={handleSelectRole}
                  onAdd={handleAdd}
                  onRemove={handleRemove}
                  isLocked={PREMIUM_ROLE_IDS.includes(role.id) && !unlockedRoles.includes(role.id)}
                  tooltipPosition="bottom"
                />
              ))}
            </div>
          </div>

          {/* Chaotic */}
          <div className="mb-4">
            <div className="flex items-center gap-3 mb-4">
              <div
                className="h-px flex-1"
                style={{ background: "linear-gradient(90deg, hsl(300 70% 50% / 0.6), transparent)" }}
              />
              <span
                className="font-orbitron font-bold text-[10px] tracking-[0.2em] uppercase px-3"
                style={{ color: "hsl(300 70% 65%)", textShadow: "0 0 8px hsl(300 70% 50% / 0.7)" }}
              >
                CHAOTIC
              </span>
              <div
                className="h-px flex-1"
                style={{ background: "linear-gradient(90deg, transparent, hsl(300 70% 50% / 0.6))" }}
              />
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-6 lg:grid-cols-8 gap-1.5 lg:gap-2">
              {CHAOTIC_ROLES.map((role) => (
                <RoleCard
                  key={role.id}
                  role={role}
                  count={roleCounts[role.id] || 0}
                  isSelected={selectedRole?.id === role.id}
                  showControls={amIHost}
                  onSelect={handleSelectRole}
                  onAdd={handleAdd}
                  onRemove={handleRemove}
                  isLocked={PREMIUM_ROLE_IDS.includes(role.id) && !unlockedRoles.includes(role.id)}
                />
              ))}
            </div>
          </div>

          {/* Crew Team */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div
                className="h-px flex-1"
                style={{ background: "linear-gradient(90deg, hsl(185 100% 50% / 0.6), transparent)" }}
              />
              <span
                className="font-orbitron font-bold text-[10px] tracking-[0.2em] uppercase px-3"
                style={{ color: "hsl(185 100% 60%)", textShadow: "0 0 8px hsl(185 100% 50% / 0.7)" }}
              >
                CREW TEAM
              </span>
              <div
                className="h-px flex-1"
                style={{ background: "linear-gradient(90deg, transparent, hsl(185 100% 50% / 0.6))" }}
              />
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-6 lg:grid-cols-8 gap-1.5 lg:gap-2">
              {CREW_ROLES.map((role) => (
                <RoleCard
                  key={role.id}
                  role={role}
                  count={roleCounts[role.id] || 0}
                  isSelected={selectedRole?.id === role.id}
                  showControls={amIHost}
                  onSelect={handleSelectRole}
                  onAdd={handleAdd}
                  onRemove={handleRemove}
                  isLocked={PREMIUM_ROLE_IDS.includes(role.id) && !unlockedRoles.includes(role.id)}
                />
              ))}
            </div>
          </div>

        </div>

        {/* RIGHT PANEL — preview and details */}
        <AnimatePresence>
          {selectedRole && (
            <>
              {/* Mobile Backdrop — click anywhere to hide */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedRole(null)}
                className="lg:hidden fixed inset-0 z-[45] bg-black/60 backdrop-blur-sm"
              />
              <motion.div
                initial={{ y: "100%", opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: "100%", opacity: 0 }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="fixed lg:relative inset-x-0 bottom-0 z-50 lg:z-0 flex w-full lg:w-[clamp(240px,30%,400px)] shrink-0 flex-col border-t lg:border-t-0 lg:border-l lg:h-full lg:overflow-hidden shadow-[0_-20px_40px_rgba(0,0,0,0.5)] lg:shadow-none backdrop-blur-xl lg:backdrop-blur-0"
                style={{
                  background: "hsl(220 30% 6% / 0.95)",
                  borderColor: "hsl(210 30% 14%)",
                  minHeight: "70vh",
                  paddingBottom: "max(16px, env(safe-area-inset-bottom, 16px))",
                }}
              >
                <RolePreview
                  role={selectedRole}
                  isLocked={PREMIUM_ROLE_IDS.includes(selectedRole.id) && !unlockedRoles.includes(selectedRole.id)}
                  onUnlock={handleUnlockRole}
                  userCredits={credits}
                  isUnlocking={isUnlocking}
                  isLoggedIn={isLoggedIn}
                  onShowProfile={() => setShowProfileModal(true)}
                  onBuyCredits={() => setShowShopModal(true)}
                  onClose={() => setSelectedRole(null)}
                />
              </motion.div>
            </>
          )}

          {/* Desktop Standby State — show when nothing selected on large screens */}
          {!selectedRole && (
            <div
              className="hidden lg:flex relative w-[clamp(240px,30%,400px)] shrink-0 flex-col border-l h-full"
              style={{ background: "hsl(220 30% 6%)", borderColor: "hsl(210 30% 14%)" }}
            >
              <RolePreview
                role={null}
                isLocked={false}
                onUnlock={() => { }}
                userCredits={credits}
                isUnlocking={false}
                isLoggedIn={isLoggedIn}
                onShowProfile={() => { }}
                onBuyCredits={() => setShowShopModal(true)}
              />
            </div>
          )}
        </AnimatePresence>
      </div>
      <ShopModal isOpen={showShopModal} onClose={() => setShowShopModal(false)} />
      <ProfileModal isOpen={showProfileModal} onClose={() => setShowProfileModal(false)} />
    </div>
  );
}

interface RoleCardProps {
  role: Role;
  count: number;
  isSelected: boolean;
  showControls: boolean;
  onSelect: (role: Role) => void;
  onAdd: (roleId: string, e: React.MouseEvent) => void;
  onRemove: (roleId: string, e: React.MouseEvent) => void;
  isLocked?: boolean;
  tooltipPosition?: "top" | "bottom";
}

function RoleCard({ role, count, isSelected, showControls, onSelect, onAdd, onRemove, isLocked }: RoleCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0, showBelow: false, transformX: "-50%" });

  useEffect(() => {
    if (isHovered && cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect();
      const tooltipWidth = 190; // Default minWidth
      const padding = 12;

      let left = rect.left + rect.width / 2;
      let transformX = "-50%";

      // Boundary check for mobile/small screens
      if (left - tooltipWidth / 2 < padding) {
        // Too close to left
        left = padding;
        transformX = "0%";
      } else if (left + tooltipWidth / 2 > window.innerWidth - padding) {
        // Too close to right
        left = window.innerWidth - padding;
        transformX = "-100%";
      }

      setTooltipPos({
        top: rect.top < 150 ? rect.bottom + 5 : rect.top - 5,
        left: left,
        showBelow: rect.top < 150,
        transformX
      });
    }
  }, [isHovered]);

  const accentColor =
    role.team === "alien"
      ? "hsl(270 80% 55%)"
      : role.team === "chaotic"
        ? "hsl(300 70% 50%)"
        : "hsl(185 100% 50%)";
  const accentColorLight =
    role.team === "alien"
      ? "hsl(270 80% 70%)"
      : role.team === "chaotic"
        ? "hsl(300 70% 65%)"
        : "hsl(185 100% 70%)";

  return (
    <div
      ref={cardRef}
      onClick={() => onSelect(role)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      data-testid={`role-card-${role.id}`}
      className="group relative flex flex-col rounded-md cursor-pointer transition-all duration-150"
      style={{
        background: "hsl(220 28% 10%)",
        border: isSelected
          ? `2px solid ${accentColor}`
          : "2px solid hsl(210 30% 16%)",
        boxShadow: isSelected
          ? `0 0 12px ${accentColor}90, 0 0 24px ${accentColor}40`
          : "none",
      }}
    >
      {/* Selection Pulse Ring */}
      <AnimatePresence>
        {isSelected && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="absolute -inset-1 rounded-lg pointer-events-none z-0"
            style={{ border: `1px solid ${accentColor}` }}
          >
            <motion.div
              animate={{ opacity: [0.1, 0.3, 0.1] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="absolute inset-0 rounded-lg"
              style={{ background: accentColor }}
            />
          </motion.div>
        )}
      </AnimatePresence>
      {/* Image */}
      <div className="relative w-full aspect-[1/0.95] overflow-hidden">
        <img
          src={role.image}
          alt={role.name}
          className="w-full h-full object-cover transition-transform duration-200 hover:scale-105"
          loading="lazy"
          style={{ filter: isSelected ? "brightness(1.05)" : "brightness(0.85)" }}
          data-testid={`img-role-${role.id}`}
        />
        {/* Overlay gradient */}
        <div
          className="absolute inset-0"
          style={{
            background: isSelected
              ? `linear-gradient(to bottom, transparent 50%, ${accentColor}20 100%)`
              : "linear-gradient(to bottom, transparent 60%, hsl(220 30% 5% / 0.5) 100%)",
          }}
        />
        {/* Count badge — hosts only */}
        {showControls && count > 0 && !isLocked && (
          <div
            className="absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center font-orbitron font-bold text-xs"
            style={{ background: accentColor, color: "hsl(220 30% 6%)" }}
          >
            {count}
          </div>
        )}

        {/* Lock Overlay */}
        {isLocked && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center">
            <FaLock className="text-white/40 text-xl" />
          </div>
        )}
      </div>

      {/* Name and controls */}
      <div className={`px-1.5 flex flex-col ${showControls ? "py-1.5 gap-1.5" : "py-1"}`}>
        <div
          className={`font-orbitron font-bold tracking-wider uppercase text-center ${role.name.length > 8 ? 'text-[9px]' : 'text-xs'} truncate`}
          style={{ color: isSelected ? accentColorLight : "hsl(190 60% 70%)", minHeight: '1.2em' }}
        >
          {role.name}
        </div>
        {showControls && !isLocked && (
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={(e) => onRemove(role.id, e)}
              data-testid={`button-remove-${role.id}`}
              className="w-6 h-6 rounded flex items-center justify-center font-bold text-xs transition-all duration-150 cursor-pointer"
              style={{
                background: "hsl(220 28% 14%)",
                border: "1px solid hsl(210 30% 20%)",
                color: "hsl(210 30% 55%)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "hsl(0 75% 55%)";
                e.currentTarget.style.color = "hsl(0 75% 70%)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "hsl(210 30% 20%)";
                e.currentTarget.style.color = "hsl(210 30% 55%)";
              }}
            >
              −
            </button>
            <span
              className="font-orbitron text-xs w-4 text-center"
              style={{ color: count > 0 ? accentColorLight : "hsl(210 30% 35%)" }}
            >
              {count}
            </span>
            <button
              onClick={(e) => onAdd(role.id, e)}
              data-testid={`button-add-${role.id}`}
              className="w-6 h-6 rounded flex items-center justify-center font-bold text-xs transition-all duration-150 cursor-pointer"
              style={{
                background: "hsl(220 28% 14%)",
                border: "1px solid hsl(210 30% 20%)",
                color: "hsl(210 30% 55%)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = accentColor;
                e.currentTarget.style.color = accentColorLight;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "hsl(210 30% 20%)";
                e.currentTarget.style.color = "hsl(210 30% 55%)";
              }}
            >
              +
            </button>
          </div>
        )}
      </div>

      {isHovered && typeof window !== 'undefined' && window.innerWidth >= 768 && (
        <div
          className="pointer-events-none fixed z-[9999]"
          style={{
            top: tooltipPos.top,
            left: tooltipPos.left,
            transform: `translateX(${tooltipPos.transformX}) translateY(${tooltipPos.showBelow ? "0" : "-100%"})`,
            minWidth: "170px",
            maxWidth: "220px",
            background: "hsl(220 28% 10% / 0.98)",
            border: `1px solid ${accentColor.replace(")", " / 0.6")}`,
            boxShadow: `0 4px 20px rgba(0, 0, 0, 0.5), 0 0 15px ${accentColor.replace(")", " / 0.3")}`,
            borderRadius: "8px",
            padding: "10px",
            backdropFilter: "blur(8px)",
          }}
        >
          <div className="font-orbitron text-[10px] tracking-[0.2em] uppercase mb-1.5 font-black" style={{ color: accentColorLight }}>
            Tactical_Ability
          </div>
          <p className="text-[11px] leading-relaxed font-medium" style={{ color: "hsl(190 60% 85%)", fontFamily: "'Exo 2', sans-serif" }}>
            {role.ability}
          </p>
        </div>
      )}
    </div>
  );
}

const ROLE_PRICES: Record<string, number> = {
  virus: 25,
  router: 35,
  doctor: 25,
};

function RolePreview({ role, isLocked, onUnlock, userCredits, isUnlocking, isLoggedIn, onShowProfile, onBuyCredits, onClose }: {
  role: Role | null;
  isLocked: boolean;
  onUnlock: (id: string) => void;
  userCredits: number;
  isUnlocking: boolean;
  isLoggedIn: boolean;
  onShowProfile: () => void;
  onBuyCredits: () => void;
  onClose?: () => void;
}) {
  if (!role) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-black/20">
        <div className="w-16 h-16 rounded-full border border-white/5 flex items-center justify-center mb-6 opacity-20">
          <div className="w-8 h-8 border border-cyan-500/20 rounded-full animate-pulse" />
        </div>
        <h3 className="font-orbitron text-[10px] tracking-[0.4em] uppercase text-white/30 mb-2">Neural_Link_Standby</h3>
        <p className="font-mono text-[8px] uppercase tracking-[0.2em] text-white/10 max-w-[200px]">
          Select a role protocol from the grid to establish identity uplink and view tactical parameters.
        </p>
      </div>
    );
  }

  const accentColor =
    role.team === "alien"
      ? "hsl(270 80% 55%)"
      : role.team === "chaotic"
        ? "hsl(300 70% 50%)"
        : "hsl(185 100% 50%)";
  const accentColorLight =
    role.team === "alien"
      ? "hsl(270 80% 70%)"
      : role.team === "chaotic"
        ? "hsl(300 70% 65%)"
        : "hsl(185 100% 70%)";
  const accentColorDim =
    role.team === "alien"
      ? "hsl(270 80% 55% / 0.25)"
      : role.team === "chaotic"
        ? "hsl(300 70% 50% / 0.25)"
        : "hsl(185 100% 50% / 0.25)";
  const teamLabel =
    role.team === "alien" ? "ALIEN TEAM" : role.team === "chaotic" ? "CHAOTIC" : "CREW TEAM";

  return (
    <div className="flex flex-col lg:h-full">
      {/* Role image/video — square frame */}
      <div className="relative w-full lg:w-[85%] lg:mx-auto aspect-[21/12] lg:aspect-square overflow-hidden shrink-0 p-2 lg:p-3">
        <div className="relative w-full h-full rounded-lg border border-white/10 overflow-hidden">
          <video
            key={role.id}
            src={role.video}
            poster={role.image}
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            className="w-full h-full object-contain"
            style={{ background: "black" }}
            data-testid="video-role-preview"
          />
        </div>
        {/* Team badge */}
        <div className="absolute top-6 left-6 flex items-center gap-2">
          <div
            className={`px-1.5 lg:px-2 py-0.5 rounded font-orbitron text-xs tracking-widest uppercase font-bold team-badge ${role.team}-color`}
            style={{
              background: accentColorDim,
              border: `1px solid ${accentColor}`,
              color: accentColorLight,
              backdropFilter: "blur(4px)",
              fontSize: "0.6rem",
            }}
          >
            {teamLabel}
          </div>
        </div>

        {/* Mobile Close Button */}
        <button
          onClick={onClose}
          aria-label="Close role preview"
          className="lg:hidden absolute top-4 right-4 w-11 h-11 rounded-full bg-black/70 border border-white/20 active:scale-95 flex items-center justify-center text-white/80 hover:text-white cursor-pointer"
          style={{ backdropFilter: "blur(6px)", touchAction: "manipulation" }}
        >
          <FaTimes />
        </button>
      </div>

      {/* Right side (mobile) / Bottom section (desktop) */}
      <div className="flex flex-col flex-1 min-w-0 lg:overflow-hidden">
        {/* Role name */}
        <div
          className="px-3 lg:px-4 pt-1 pb-1 lg:pt-1 lg:pb-2 border-b shrink-0"
          style={{ borderColor: "hsl(210 30% 14%)" }}
        >
          <div
            className="font-orbitron font-black text-xs lg:text-lg tracking-widest uppercase flex items-center gap-2"
            style={{ color: accentColorLight, textShadow: `0 0 10px ${accentColor}` }}
            data-testid="text-preview-name"
          >
            <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 2 }} className="w-1.5 h-1.5 rounded-full bg-current shadow-[0_0_8px_currentColor]" />
            {role.name}
            {PREMIUM_ROLE_IDS.includes(role.id) && (
              <span className="text-[9px] px-2 py-0.5 rounded border border-amber-500/50 bg-amber-500/10 text-amber-500 font-bold tracking-widest ml-2">VIP</span>
            )}
          </div>
        </div>

        {/* Details */}
        <div className="flex-1 lg:overflow-y-auto px-3 lg:px-4 py-1 lg:py-2 flex flex-col gap-1.5 lg:gap-3 pb-32">
          <InfoBlock label="Alignment" value={role.alignment} accentColor={accentColorLight} />
          <InfoBlock label="Win Condition" value={role.winCondition} accentColor={accentColorLight} />
          <InfoBlock label="Ability" value={role.ability} accentColor={accentColorLight} />
          <InfoBlock label="Notes" value={role.notes} accentColor={accentColorLight} dim />

          {isLocked && (
            <div className="mt-4 pt-6 border-t border-white/10 flex flex-col items-center">
              <div className="flex items-center gap-2 mb-4 opacity-50">
                <FaLock className="text-[10px]" />
                <div className="text-[10px] tracking-[0.3em] uppercase font-mono">Authorization Required</div>
              </div>

              {!isLoggedIn ? (
                <button
                  onClick={onShowProfile}
                  className="w-full py-4 rounded-md border border-cyan-500/30 bg-cyan-500/5 hover:bg-cyan-500/10 hover:border-cyan-400 transition-all flex flex-col items-center gap-1 group"
                >
                  <span className="font-orbitron font-bold text-xs tracking-[0.2em] text-cyan-400">INITIALIZE IDENTITY HANDSHAKE</span>
                  <span className="font-mono text-[8px] text-cyan-400/40 uppercase tracking-widest group-hover:text-cyan-400/60 transition-colors">Login to authorize premium access</span>
                </button>
              ) : (
                <div className="w-full flex flex-col gap-3">
                  <div className="flex justify-between items-center px-4 py-3 bg-white/5 border border-white/10 rounded-md">
                    <span className="font-mono text-[9px] uppercase tracking-widest text-white/30">Protocol Fee</span>
                    <span className="font-orbitron text-sm font-bold text-cyan-400">{ROLE_PRICES[role.id] || 0} CC</span>
                  </div>

                  {userCredits >= (ROLE_PRICES[role.id] || 0) ? (
                    <button
                      onClick={() => onUnlock(role.id)}
                      disabled={isUnlocking}
                      className="w-full py-4 rounded-md bg-cyan-600 hover:bg-cyan-500 text-white transition-all flex flex-col items-center gap-1 shadow-[0_0_20px_rgba(6,182,212,0.3)]"
                    >
                      <span className="font-orbitron font-bold text-xs tracking-[0.2em]">{isUnlocking ? "AUTHORIZING..." : "AUTHORIZE UNLOCK"}</span>
                      <span className="font-mono text-[8px] text-white/50 uppercase tracking-widest">Deduct credits from secure balance</span>
                    </button>
                  ) : (
                    <button
                      onClick={onBuyCredits}
                      className="w-full py-4 rounded-md border border-red-500/30 bg-red-500/5 hover:bg-red-500/10 hover:border-red-400 transition-all flex flex-col items-center gap-1 group"
                    >
                      <span className="font-orbitron font-bold text-xs tracking-[0.2em] text-red-400">INSUFFICIENT CREDITS</span>
                      <span className="font-mono text-[8px] text-red-400/40 uppercase tracking-widest group-hover:text-red-400/60 transition-colors">Access the Credit Exchange to continue</span>
                    </button>
                  )}
                  <div className="text-center font-mono text-[8px] text-amber-500/80 uppercase tracking-wider leading-normal px-2 mt-1">
                    Notice: Unlocking this role is temporary and will only apply to the current game session.
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoBlock({ label, value, accentColor, dim }: { label: string; value: string; accentColor: string; dim?: boolean }) {
  return (
    <div data-testid={`preview-block-${label.toLowerCase().replace(/\s/g, "-")}`}>
      <div
        className="font-orbitron text-xs tracking-[0.2em] uppercase mb-1.5 font-bold"
        style={{ color: accentColor }}
      >
        {label}
      </div>
      <p
        className="text-xs leading-relaxed"
        style={{ color: dim ? "hsl(210 30% 48%)" : "hsl(190 60% 72%)", fontFamily: "'Exo 2', sans-serif" }}
      >
        {value}
      </p>
    </div>
  );
}



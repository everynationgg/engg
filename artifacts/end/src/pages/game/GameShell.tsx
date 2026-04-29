import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation, useParams } from "wouter";
import { getSocket, disconnectSocket } from "@/lib/socket";
import { playPhaseTransition } from "@/lib/sound";
import { systemToast } from "@/components/common/SystemToast";
import RoleConfigPage from "@/pages/game/RoleConfigPage";
import RoleRevealPage from "@/pages/game/RoleRevealPage";
import OrbitPage from "@/pages/game/OrbitPage";
import DiscussionPage from "@/pages/game/DiscussionPage";
import VotingPage from "@/pages/game/VotingPage";
import ResultPage from "@/pages/game/ResultPage";
import InterruptedPage from "@/pages/game/InterruptedPage";
import ReconnectGraceBanner from "@/components/game/ReconnectGraceBanner";
import PlayerStatusList from "@/components/game/PlayerStatusList";
import HostGameControls from "@/components/game/HostGameControls";
import ChatModal from "@/components/game/ChatModal";
import FloatingChatButton from "@/components/game/FloatingChatButton";
import GlobalHUD from "@/components/game/GlobalHUD";
import { useQuitGame } from "@/components/system/QuitGameButton";
import ConfirmModal from "@/components/common/ConfirmModal";
import SettingsModal from "@/components/system/SettingsModal";
import ProfileModal from "@/components/profile/ProfileModal";
import HowToPlayModal from "@/components/game/HowToPlayModal";
import { playSciFiClick } from "@/lib/sound";
import { getSoundEnabled, setSoundEnabled, startLobbyMusic, stopLobbyMusic } from "@/lib/music";
import { usePreferences } from "@/hooks/usePreferences";
import LandingNavbar from "@/components/system/LandingNavbar";
import LandingSidebar from "@/components/system/LandingSidebar";
import HamburgerMenu from "@/components/system/HamburgerMenu";

// Phases that warrant a dramatic countdown overlay before switching
const DRAMATIC_PHASES = new Set(["voting", "result", "discussion"]);

const PHASE_LABELS: Record<string, string> = {
  role_config: "Role Configuration",
  role_reveal: "Role Reveal",
  orbit_action: "Orbit Phase",
  discussion: "Discussion Phase",
  voting: "Voting Phase",
  result: "Result Phase",
  interrupted: "Game Interrupted",
};

const TIMELINE_PHASES = [
  { id: "role_reveal", label: "ROLES" },
  { id: "orbit_action", label: "ORBIT" },
  { id: "discussion", label: "DISCUSS" },
  { id: "voting", label: "VOTE" },
  { id: "result", label: "RESULT" }
];

function PhaseTimeline({ currentPhase }: { currentPhase: string }) {
  if (currentPhase === "interrupted" || currentPhase === "role_config") return null;

  const effectivePhase = currentPhase === "orbit_resolution" ? "orbit_action" : currentPhase;
  const currentIndex = TIMELINE_PHASES.findIndex(p => p.id === effectivePhase);
  if (currentIndex === -1) return null;

  return (
    <div className="flex items-center justify-center gap-2 py-3 px-6 z-50 bg-black/60 border-b border-white/5 backdrop-blur-md shrink-0 h-[var(--context-height)]">
      {TIMELINE_PHASES.map((phase, idx) => {
        const isActive = idx === currentIndex;
        const isPast = idx < currentIndex;
        return (
          <div key={phase.id} className="flex items-center">
            <div
              className={`text-[11px] tracking-[0.2em] uppercase font-orbitron font-bold px-4 py-1 rounded-sm transition-all duration-300 ${isActive ? "bg-cyan-500/25 text-white border border-cyan-500/60 shadow-[0_0_15px_rgba(6,182,212,0.4)]"
                : isPast ? "text-cyan-700 font-medium"
                  : "text-white/10"
                }`}
            >
              {phase.label}
            </div>
            {idx < TIMELINE_PHASES.length - 1 && (
              <div className={`w-6 h-[1px] mx-2 ${isPast ? "bg-cyan-900" : "bg-white/5"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

/** Shape of the join_session ack response used during reconnect. */
interface JoinSessionResponse {
  success: boolean;
  playerToken?: string;
  session?: {
    phase: string;
    playersInGrace?: string[];
    players?: Array<{ id: string; name: string }>;
    rolesAssigned?: Record<string, string>;
  };
}

export default function GameShell() {
  const params = useParams<{ roomCode: string }>();
  const [, setLocation] = useLocation();

  // Store room code in sessionStorage synchronously before children render
  const [roomCode] = useState(() => {
    const code = (params.roomCode ?? "").toUpperCase();
    if (code) sessionStorage.setItem("lp_roomCode", code);
    return code;
  });

  const [displayedPhase, setDisplayedPhase] = useState<string>("role_config");
  const [transition, setTransition] = useState<{ label: string; secondsLeft: number } | null>(null);
  const [gracePlayerNames, setGracePlayerNames] = useState<string[]>([]);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatUnread, setChatUnread] = useState(0);
  const [chatTypingActive, setChatTypingActive] = useState(false);
  const [isGlitching, setIsGlitching] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [showGameMenu, setShowGameMenu] = useState(false);
  const { preferences, updateMusicVolume } = usePreferences();
  const musicOn = (preferences?.musicVolume ?? 0) > 0;
  const touchStartX = useRef<number | null>(null);

  const [isHost] = useState(() => {
    const isCreating = sessionStorage.getItem("lp_isCreating") === "true";
    const alreadyHost = sessionStorage.getItem("lp_isHost") === "true";
    if (isCreating || alreadyHost) {
      sessionStorage.setItem("lp_isHost", "true");
      return true;
    }
    return false;
  });
  const { midGame, showConfirm, openConfirm, closeConfirm, handleConfirmQuit } = useQuitGame(isHost);

  const handleToggleMusic = () => {
    updateMusicVolume(musicOn ? 0 : 100);
  };

  const toggleChat = useCallback(() => setChatOpen((o) => !o), []);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;

    // Swipe left (to the left) -> Open/Close Chat depending on direction
    if (deltaX < -100) { // Swipe Left
      if (!chatOpen) setChatOpen(true);
    } else if (deltaX > 100) { // Swipe Right
      if (chatOpen) setChatOpen(false);
    }
    touchStartX.current = null;
  };

  const prevPhaseRef = useRef<string | null>(null);
  const displayedPhaseRef = useRef<string>(displayedPhase);
  const transitionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const transitionTickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        // If chat is open, close it and stop
        if (chatOpen) {
          setChatOpen(false);
          return;
        }

        // If any sub-modal is open, close it first
        if (showSettings || showProfile || showHowToPlay || showGameMenu) {
          if (showSettings) setShowSettings(false);
          if (showProfile) setShowProfile(false);
          if (showHowToPlay) setShowHowToPlay(false);
          if (showGameMenu) setShowGameMenu(false);
          return;
        }

        // Desktop Game Menu Toggle
        if (window.innerWidth >= 1024) {
          setShowGameMenu(prev => !prev);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [chatOpen, showSettings, showProfile, showHowToPlay, showGameMenu]);

  // Redirect if no room code
  useEffect(() => {
    if (!roomCode) setLocation("/");
  }, [roomCode, setLocation]);

  // Redirect to join page if no callsign is set (direct URL access)
  useEffect(() => {
    if (roomCode && !sessionStorage.getItem("lp_callsign")) {
      setLocation(`/join/${roomCode}`);
    }
  }, [roomCode, setLocation]);

  // Keep displayedPhaseRef in sync so the reconnect handler always reads the latest phase
  useEffect(() => {
    displayedPhaseRef.current = displayedPhase;
  }, [displayedPhase]);

  // Listen for phase updates from the server
  useEffect(() => {
    if (!roomCode) return;
    const socket = getSocket();

    const applyPhase = (newPhase: string) => {
      if (!newPhase || newPhase === prevPhaseRef.current) return;

      if (newPhase === "role_config") {
        sessionStorage.removeItem("lp_assignedRole");
      }

      const prevPhase = prevPhaseRef.current;
      prevPhaseRef.current = newPhase;

      // Stop lobby music on role reveal
      if (newPhase === "role_reveal") stopLobbyMusic();

      // Play transition sound
      if (prevPhase !== null) playPhaseTransition();

      // Determine if a dramatic overlay is needed
      const needsDramatic = prevPhase !== null && DRAMATIC_PHASES.has(newPhase) && prevPhase !== "role_config";

      if (needsDramatic && !transitionTimeoutRef.current) {
        setIsGlitching(true);
        setTimeout(() => setIsGlitching(false), 300);

        setTransition({ label: PHASE_LABELS[newPhase] ?? "Next Phase", secondsLeft: 2 });
        transitionTickRef.current = setInterval(() => {
          setTransition((prev) => prev ? { ...prev, secondsLeft: Math.max(1, prev.secondsLeft - 1) } : prev);
        }, 700);

        transitionTimeoutRef.current = setTimeout(() => {
          if (transitionTickRef.current) { clearInterval(transitionTickRef.current); transitionTickRef.current = null; }
          transitionTimeoutRef.current = null;
          setTransition(null);
          setDisplayedPhase(newPhase);
        }, 1400);
      } else if (!transitionTimeoutRef.current) {
        // Subtle glitch even for non-dramatic transitions
        setIsGlitching(true);
        setTimeout(() => setIsGlitching(false), 200);
        setDisplayedPhase(newPhase);
      }
    };

    const handlePhaseUpdate = (session: { phase: string; playersInGrace?: string[]; players?: Array<{ id: string; name: string }>; rolesAssigned?: Record<string, string> }) => {
      if (session.phase) applyPhase(session.phase);
      // Restore assigned role from server state so the UI never shows "unknown"
      // after browser back/forward or missed events.
      if (session.rolesAssigned) {
        const myRole = session.rolesAssigned[socket.id ?? ""];
        if (myRole) {
          sessionStorage.setItem("lp_assignedRole", myRole);
        }
      }
      // Clear grace banner when no players are in grace
      if (!session.playersInGrace || session.playersInGrace.length === 0) {
        setGracePlayerNames([]);
      } else if (session.players) {
        // Refresh the list of names for all players currently in grace
        const graceSet = new Set(session.playersInGrace);
        const names = session.players
          .filter((p) => graceSet.has(p.id))
          .map((p) => p.name);
        if (names.length > 0) setGracePlayerNames(names);
      }
    };

    socket.on("phase_update", handlePhaseUpdate);

    // Listen for grace updates (player disconnected during game, waiting to reconnect)
    const handleGraceUpdate = (data: {
      playersInGrace: string[];
      playerName: string;
      players?: Array<{ id: string; name: string }>;
    }) => {
      if (data.playersInGrace.length > 0) {
        const graceSet = new Set(data.playersInGrace);

        // Build the full list of names for ALL players currently in grace
        const allGraceNames = data.players
          ?.filter((p) => graceSet.has(p.id))
          .map((p) => p.name) ?? [];

        if (allGraceNames.length > 0) {
          setGracePlayerNames(allGraceNames);
        }

        // Show toast for the triggering player if they're entering grace
        const triggerPlayer = data.players?.find((p) => p.name === data.playerName);
        const isEnteringGrace = triggerPlayer !== undefined && graceSet.has(triggerPlayer.id);
        if (isEnteringGrace) {
          systemToast(
            `Player ${data.playerName} reconnecting…`,
            "warning",
            4000,
          );
        }
      } else {
        setGracePlayerNames([]);
      }
    };
    socket.on("grace_update", handleGraceUpdate);

    // If the host leaves, the server will close the session
    const handleSessionClosed = (data?: { message?: string }) => {
      const msg = data?.message ?? "The host has left. The lobby has been disbanded.";
      systemToast(msg, "error", 6000);
      sessionStorage.removeItem("lp_roomCode");
      sessionStorage.removeItem("lp_isCreating");
      sessionStorage.removeItem("lp_assignedRole");
      sessionStorage.removeItem("lp_callsign");
      sessionStorage.removeItem("lp_totalPlayers");
      sessionStorage.removeItem("lp_orbit_info");
      sessionStorage.removeItem("lp_orbit_result");
      sessionStorage.removeItem("lp_userId");
      sessionStorage.removeItem("lp_playerId");
      sessionStorage.removeItem("lp_playerToken");
      // Disconnect socket to prevent auto-reconnect loops
      disconnectSocket();
      setLocation("/");
    };
    socket.on("session_closed", handleSessionClosed);

    // Listen for player_left notifications
    const handlePlayerLeft = (data: { playerName: string }) => {
      systemToast(
        `Player ${data.playerName} has left the game`,
        "warning",
        5000,
      );
    };
    socket.on("player_left", handlePlayerLeft);

    // Listen for system messages (e.g. "Not enough players to continue")
    const handleSystemMessage = (data: { message: string }) => {
      systemToast(data.message, "error", 6000);
    };
    socket.on("system_message", handleSystemMessage);

    // Shared sync helper — fetches latest session and applies phase + grace state.
    // Used on initial mount AND as a periodic fallback in case phase_update
    // socket events are missed (transport hiccups, proxy drops, etc.).
    const syncSession = () => {
      socket.emit("get_session", { sessionId: roomCode }, (resp: { success: boolean; session?: { phase: string; playersInGrace?: string[]; players?: { id: string; name: string; connected?: boolean }[]; rolesAssigned?: Record<string, string> } }) => {
        if (resp.success && resp.session?.phase) {
          // First mount — set both displayed and tracked phase without animation
          if (prevPhaseRef.current === null) {
            prevPhaseRef.current = resp.session.phase;
            setDisplayedPhase(resp.session.phase);
          } else {
            applyPhase(resp.session.phase);
          }
          // Restore assigned role from server state so browser back/forward
          // and page remounts don't lose the role (showing "unknown").
          if (resp.session.rolesAssigned) {
            const myRole = resp.session.rolesAssigned[socket.id ?? ""];
            if (myRole) {
              sessionStorage.setItem("lp_assignedRole", myRole);
            }
          }
          // Sync grace state
          if (resp.session.playersInGrace && resp.session.playersInGrace.length > 0 && resp.session.players) {
            const graceSet = new Set(resp.session.playersInGrace);
            const names = resp.session.players
              .filter((p) => graceSet.has(p.id))
              .map((p) => p.name);
            if (names.length > 0) setGracePlayerNames(names);
          } else {
            setGracePlayerNames([]);
          }
        }
      });
    };

    // Get initial phase on mount
    syncSession();

    // Periodic fallback: poll every 3 seconds so phase transitions (e.g. voting→result)
    // are detected even when Socket.IO events are missed.
    const pollId = setInterval(syncSession, 3000);

    // Re-join the session when the socket reconnects during in-game phases.
    // RoleConfigPage handles reconnect for the lobby (role_config) phase; all
    // other phase pages are rendered by GameShell without their own reconnect
    // logic, so without this handler the new socket would not be registered in
    // the session room and chat (and other events) would silently fail.
    const handleReconnect = () => {
      // Lobby phase is managed by RoleConfigPage — skip to avoid a double join.
      if (displayedPhaseRef.current === "role_config") return;
      const callsign = sessionStorage.getItem("lp_callsign");
      const playerId = sessionStorage.getItem("lp_playerId");
      if (!callsign || !playerId) return;
      socket.emit(
        "join_session",
        {
          sessionId: roomCode,
          playerName: callsign,
          playerId,
          playerToken: sessionStorage.getItem("lp_playerToken") ?? undefined,
          userId: sessionStorage.getItem("lp_userId") ?? undefined,
        },
        (resp: JoinSessionResponse) => {
          // Cache any server-issued token so future reconnects can use it.
          if (resp?.playerToken) {
            sessionStorage.setItem("lp_playerToken", resp.playerToken);
          }
          // Sync phase and grace state directly from the ack response.
          // With Redis pub/sub, the room broadcasts (phase_update / grace_update) may
          // arrive after this ack callback fires, so we apply the state here as a
          // safety net to avoid a frozen UI on the reconnecting player's screen.
          if (resp?.session?.phase) {
            applyPhase(resp.session.phase);
          }
          // Restore assigned role on reconnect so game pages display the correct
          // role instead of "unknown".  The server remaps rolesAssigned from the
          // old socket ID to the new one in reconnectPlayer(), so we can look up
          // the role by the current socket.id.
          if (resp?.session?.rolesAssigned) {
            const myRole = resp.session.rolesAssigned[socket.id ?? ""];
            if (myRole) {
              sessionStorage.setItem("lp_assignedRole", myRole);
            }
          }
          if (resp?.session) {
            if (!resp.session.playersInGrace || resp.session.playersInGrace.length === 0) {
              setGracePlayerNames([]);
            } else if (resp.session.players) {
              const graceSet = new Set(resp.session.playersInGrace);
              const names = resp.session.players
                .filter((p) => graceSet.has(p.id))
                .map((p) => p.name);
              setGracePlayerNames(names.length > 0 ? names : []);
            }
          }
        },
      );
    };
    socket.on("connect", handleReconnect);

    return () => {
      socket.off("phase_update", handlePhaseUpdate);
      socket.off("grace_update", handleGraceUpdate);
      socket.off("session_closed", handleSessionClosed);
      socket.off("player_left", handlePlayerLeft);
      socket.off("system_message", handleSystemMessage);
      socket.off("connect", handleReconnect);
      clearInterval(pollId);
      if (transitionTimeoutRef.current) clearTimeout(transitionTimeoutRef.current);
      if (transitionTickRef.current) clearInterval(transitionTickRef.current);
      disconnectSocket();
    };
  }, [roomCode]);

  // Render the appropriate phase component
  const renderPhase = () => {
    switch (displayedPhase) {
      case "role_config": return <RoleConfigPage />;
      case "role_reveal": return <RoleRevealPage />;
      case "orbit_action":
      case "orbit_resolution": return <OrbitPage />;
      case "discussion": return <DiscussionPage onOpenChat={() => setChatOpen(true)} />;
      case "voting": return <VotingPage />;
      case "result": return <ResultPage />;
      case "interrupted": return <InterruptedPage />;
      default: return <RoleConfigPage />;
    }
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col overflow-hidden" style={{ background: "hsl(220 30% 2%)" }}>
      <GlobalHUD isWarping={!!transition} />

      {/* Top Navbar — primary control system on desktop */}
      <LandingNavbar
        onShowSettings={() => setShowSettings(true)}
        onShowProfile={() => setShowProfile(true)}
        onShowHowToPlay={() => setShowHowToPlay(true)}
        onShowAuth={() => { }} // Auth not needed mid-game
        onShowMenu={() => {
          // Close all system modals before opening session menu
          setShowSettings(false);
          setShowProfile(false);
          setShowHowToPlay(false);
          setShowGameMenu(true);
        }}
      />


      <div className="h-[var(--nav-height)] shrink-0 hidden lg:block" />

      <AnimatePresence>
        {isGlitching && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[10000] pointer-events-none mix-blend-screen bg-cyan-500/10 backdrop-invert-[0.05]"
            style={{
              backgroundImage: `repeating-linear-gradient(0deg, transparent 0, transparent 2px, rgba(0,255,255,0.1) 2px, rgba(0,255,255,0.1) 4px)`,
              backgroundSize: '100% 4px'
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showGameMenu && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[2000] hidden lg:flex flex-col items-center justify-center bg-black/60 backdrop-blur-md"
            onClick={() => setShowGameMenu(false)}
            onKeyDown={(e) => {
              if (e.key === "Tab") {
                const focusable = e.currentTarget.querySelectorAll('button');
                const first = focusable[0];
                const last = focusable[focusable.length - 1];
                if (e.shiftKey && document.activeElement === first) {
                  e.preventDefault();
                  last.focus();
                } else if (!e.shiftKey && document.activeElement === last) {
                  e.preventDefault();
                  first.focus();
                }
              }
            }}
          >
            <style dangerouslySetInnerHTML={{ __html: 'body { overflow: hidden !important; }' }} />
            <motion.div
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              className="w-[320px] flex flex-col gap-3 p-8 border border-white/10 bg-black/90 shadow-[0_30px_60px_rgba(0,0,0,0.8)]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-6 flex flex-col items-center">
                <span className="font-mono text-[8px] tracking-[0.5em] uppercase text-cyan-400/40 mb-1">Session_Status</span>
                <h2 className="font-orbitron font-black text-xl tracking-[0.3em] uppercase text-white">Game Menu</h2>
              </div>

              <MenuButton
                label="RESUME"
                onClick={() => setShowGameMenu(false)}
                primary
                autoFocus
              />

              {isHost && (
                <MenuButton
                  label="RESTART"
                  onClick={() => {
                    getSocket().emit("restart_game", { sessionId: roomCode });
                    setShowGameMenu(false);
                  }}
                />
              )}

              <div className="h-px bg-white/5 my-2" />

              <MenuButton
                label="QUIT GAME"
                variant="danger"
                onClick={() => {
                  setShowGameMenu(false);
                  openConfirm();
                }}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Mission Interrupt Panel (Radial) */}
      <div className="lg:hidden">
        <HamburgerMenu
          onShowSettings={() => setShowSettings(true)}
          onShowProfile={() => setShowProfile(true)}
          onShowHowToPlay={() => setShowHowToPlay(true)}
          musicOn={musicOn}
          onToggleMusic={handleToggleMusic}
          playSound={playSciFiClick}
          showQuitButton={true}
          isHost={isHost}
          onRestartRound={() => {
            getSocket().emit("restart_game", { sessionId: roomCode });
          }}
        />
      </div>

      <PhaseTimeline currentPhase={displayedPhase} />
      {renderPhase()}

      {/* Player presence overlay — subtle during gameplay, hidden in lobby since sidebar has a list */}
      {displayedPhase !== "role_config" && displayedPhase !== "lobby" && (
        <PlayerStatusList phase={displayedPhase} roomCode={roomCode} />
      )}

      {/* Reconnect grace banner — shown during game when a player disconnects.
          Host controls are embedded inside the banner so the host can act
          while the grace overlay is visible. */}
      {gracePlayerNames.length > 0 && displayedPhase !== "interrupted" && (
        <ReconnectGraceBanner playerName={gracePlayerNames.join(", ")}>
          <HostGameControls phase={displayedPhase} roomCode={roomCode} variant="inline" />
        </ReconnectGraceBanner>
      )}

      {/* In-game chat — available during all phases including grace pause and interrupted */}
      <ChatModal
        gameId={roomCode || null}
        isOpen={chatOpen}
        onToggle={toggleChat}
        onUnreadChange={setChatUnread}
        onTypingActivityChange={setChatTypingActive}
      />
      <FloatingChatButton
        onClick={toggleChat}
        unreadCount={chatUnread}
        typingActive={chatTypingActive}
        isOpen={chatOpen}
      />

      {/* Phase transition overlay */}
      {transition && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center px-6 transition-opacity duration-500 ix-backdrop ix-backdrop-blur"
          style={{ background: "hsl(220 30% 3% / 0.60)", backdropFilter: "blur(2px)", transition: 'background 0.5s' }}
        >
          <div
            className="rounded-lg px-6 py-5 text-center ix-modal-enter"
            style={{
              background: "hsl(220 28% 10% / 0.85)",
              border: "1px solid hsl(185 100% 50% / 0.25)",
              boxShadow: "0 0 12px hsl(185 100% 50% / 0.18)",
              transition: 'background 0.5s, box-shadow 0.5s',
            }}
          >
            <div className="font-orbitron text-xs tracking-[0.25em] uppercase mb-2" style={{ color: "hsl(210 30% 55%)" }}>
              Phase Transition
            </div>
            <div className="font-orbitron font-black text-lg tracking-[0.15em] uppercase" style={{ color: "hsl(185 100% 70%)" }}>
              {transition.label}
            </div>
            <div className="mt-2 text-xs" style={{ color: "hsl(210 30% 50%)", fontFamily: "'Exo 2', sans-serif" }}>
              Syncing all players… {transition.secondsLeft}
            </div>
          </div>
        </div>
      )}
      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />
      <ProfileModal
        isOpen={showProfile}
        onClose={() => setShowProfile(false)}
      />
      {showHowToPlay && (
        <HowToPlayModal onClose={() => setShowHowToPlay(false)} />
      )}

      {showConfirm && (
        <ConfirmModal
          isOpen={showConfirm}
          title="TERMINATE SESSION"
          message="Confirm intentional disconnect from current operation?"
          warning={
            isHost
              ? "WARNING: HOST_STATUS ACTIVE. SESSION WILL TERMINATE FOR ALL OPERATORS."
              : midGame
                ? "WARNING: MID_ENGAGEMENT. DISCONNECT WILL IMPACT UNIT COHESION."
                : undefined
          }
          confirmLabel="TERMINATE"
          cancelLabel="RESUME"
          onConfirm={handleConfirmQuit}
          onCancel={closeConfirm}
        />
      )}
    </div>
  );
}

function MenuButton({
  label,
  onClick,
  primary = false,
  variant = 'default',
  autoFocus = false
}: {
  label: string;
  onClick: () => void;
  primary?: boolean;
  variant?: 'default' | 'danger';
  autoFocus?: boolean;
}) {
  return (
    <button
      autoFocus={autoFocus}
      onClick={() => { playSciFiClick(); onClick(); }}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          onClick();
        }
      }}
      className={`w-full py-4 font-orbitron font-bold text-xs tracking-[0.3em] uppercase transition-all duration-200 border ${variant === 'danger'
        ? 'border-red-500/20 text-red-500 hover:bg-red-500/10 hover:border-red-500/50'
        : primary
          ? 'border-cyan-500/40 bg-cyan-500/10 text-white hover:bg-cyan-500/20 hover:border-cyan-500/60 shadow-[0_0_20px_rgba(6,182,212,0.1)]'
          : 'border-white/5 text-white/40 hover:text-white hover:border-white/20 hover:bg-white/5'
        }`}
    >
      {label}
    </button>
  );
}


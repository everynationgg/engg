import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ROLES, type Role } from "@/data/roles";
import { getAssignedRole, getRoomCode, getMySocketId } from "@/lib/gameHelpers";
import { playSciFiClick, playActionConfirm } from "@/lib/sound";
import { getSocket } from "@/lib/socket";
import HamburgerMenu from "@/components/HamburgerMenu";
import SettingsModal from "@/components/SettingsModal";
import ProfileModal from "@/components/ProfileModal";
import { getSoundEnabled, setSoundEnabled, startLobbyMusic, stopLobbyMusic } from "@/lib/music";

// ── Types ─────────────────────────────────────────────────────────────────────

interface OrbitActionDef {
  id: string;
  label: string;
  targetType: "player" | "center" | "two_players" | "self";
  targetCount: 0 | 1 | 2;
}

interface RoleOrbitConfig {
  type: "active" | "passive" | "none";
  actions?: OrbitActionDef[];
}

interface LivePlayer {
  id: string;
  name: string;
  isHost: boolean;
  isYou?: boolean;
  playerId?: string;
  isSpectator?: boolean;
}

type PageState =
  | "loading"
  | "action_select"
  | "target_select"
  | "passive_info"
  | "waiting"
  | "resolving"
  | "done";

// ── Role orbit config ──────────────────────────────────────────────────────────

const ROLE_ORBIT: Record<string, RoleOrbitConfig> = {
  scanner: {
    type: "active",
    actions: [
      { id: "scan_player", label: "SCAN PLAYER", targetType: "player", targetCount: 1 },
      { id: "scan_deck", label: "SCAN DECK", targetType: "center", targetCount: 2 },
    ],
  },
  sentinel: {
    type: "active",
    actions: [{ id: "sentinel_watch", label: "USE ABILITY", targetType: "player", targetCount: 1 }],
  },
  disruptor: {
    type: "active",
    actions: [{ id: "disrupt", label: "USE ABILITY", targetType: "player", targetCount: 1 }],
  },
  shifter: {
    type: "active",
    actions: [{ id: "shift", label: "USE ABILITY", targetType: "player", targetCount: 1 }],
  },
  warper: {
    type: "active",
    actions: [{ id: "warp", label: "USE ABILITY", targetType: "two_players", targetCount: 2 }],
  },
  seeker: {
    type: "active",
    actions: [{ id: "seek", label: "USE ABILITY", targetType: "player", targetCount: 1 }],
  },
  // Alien is ACTIVE — picks 1 hidden center card, sees result after resolution
  alien: {
    type: "active",
    actions: [{ id: "alien_view", label: "VIEW CENTER CARD", targetType: "center", targetCount: 1 }],
  },
  // Parasite is passive — sees alien player names, auto-completes
  parasite: { type: "passive" },
  // Commander has an active self-targeted ability — no target selection needed
  commander: {
    type: "active",
    actions: [{ id: "commander_vote_boost", label: "BOOST VOTE", targetType: "self", targetCount: 0 }],
  },
  crew: { type: "none" },
};

// ── Helpers ───────────────────────────────────────────────────────────────────



const CENTER_LABELS = ["CARD ALPHA", "CARD BETA", "CARD GAMMA"];

// ── Component ─────────────────────────────────────────────────────────────────

export default function OrbitPage() {
  const role = getAssignedRole();
  const roomCode = getRoomCode();
  const orbitConfig = ROLE_ORBIT[role.id] ?? { type: "none" };

  const [pageState, setPageState] = useState<PageState>("loading");

  const [sessionPlayers, setSessionPlayers] = useState<LivePlayer[]>([]);
  const [completedCount, setCompletedCount] = useState<number>(0);
  const [selectedAction, setSelectedAction] = useState<OrbitActionDef | null>(null);
  const [selectedTargets, setSelectedTargets] = useState<string[]>([]);
  const [orbitInfoData, setOrbitInfoData] = useState<{ type: string; data?: unknown } | null>(null);
  const [isSurging, setIsSurging] = useState(false);
  const autoSubmittedRef = useRef(false);
  const [isHost, setIsHost] = useState(false);

  // Hamburger menu states
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [musicOn, setMusicOn] = useState<boolean>(getSoundEnabled);
  const handleToggleMusic = useCallback(() => {
    const next = !musicOn;
    setMusicOn(next);
    setSoundEnabled(next);
    if (next) {
      startLobbyMusic();
    } else {
      stopLobbyMusic();
    }
  }, [musicOn]);

  // Accent colors — consistent with role reveal
  const isAlien = role.team === "alien";
  const isChaotic = role.team === "chaotic";
  const accentColor = isAlien ? "hsl(0 75% 55%)" : isChaotic ? "hsl(300 70% 55%)" : "hsl(185 100% 50%)";
  const accentLight = isAlien ? "hsl(0 75% 70%)" : isChaotic ? "hsl(300 70% 70%)" : "hsl(185 100% 70%)";
  const accentGlow = isAlien ? "hsl(0 75% 55% / 0.4)" : isChaotic ? "hsl(300 70% 55% / 0.4)" : "hsl(185 100% 50% / 0.4)";
  const accentDim = isAlien ? "hsl(0 75% 55% / 0.12)" : isChaotic ? "hsl(300 70% 55% / 0.12)" : "hsl(185 100% 50% / 0.12)";
  const bgTint = isAlien ? "hsl(0 40% 6%)" : isChaotic ? "hsl(290 30% 6%)" : "hsl(200 30% 6%)";
  const bgOverlay = isAlien ? "hsl(0 35% 3% / 0.83)" : isChaotic ? "hsl(290 25% 3% / 0.83)" : "hsl(200 25% 3% / 0.83)";

  const myPlayerId = sessionStorage.getItem("lp_playerId");
  const me = sessionPlayers.find((p) => myPlayerId ? p.playerId === myPlayerId : p.id === getSocket().id);
  const isSpectator = !!me && !!me.isSpectator;

  // Submit action to server
  const submitAction = useCallback((type: string, targets: string[]) => {
    const socket = getSocket();
    socket.emit("submit_action", { sessionId: roomCode, action: { type, targets } });
    playActionConfirm();
    if (type !== "skip" && type !== "passive" && type !== "none") {
      setIsSurging(true);
      setTimeout(() => setIsSurging(false), 500);
    }
    setPageState("waiting");
  }, [roomCode]);

  const handleRestartRound = useCallback(() => {
    const socket = getSocket();
    socket.emit("restart_game", { sessionId: roomCode }, (resp: { success: boolean; error?: string }) => {
      if (!resp.success) {
        console.error("Restart failed:", resp.error);
      }
    });
  }, [roomCode]);

  // ── Socket setup ──────────────────────────────────────────────────────────
  useEffect(() => {
    const socket = getSocket();

    const handlePhaseUpdate = (session: { phase: string; players: LivePlayer[]; orbitCompleted?: string[] }) => {
      console.log("PHASE:", session.phase, "PLAYERS:", session.players.length);
      const myPlayerId = sessionStorage.getItem("lp_playerId");
      const mySocketId = socket.id;
      setSessionPlayers(
        session.players.map((p) => ({ ...p, isYou: myPlayerId ? p.playerId === myPlayerId : p.id === mySocketId })),
      );

      // Identify host status from session player list
      const me = session.players.find((p) => myPlayerId ? p.playerId === myPlayerId : p.id === mySocketId);
      if (me) setIsHost(me.isHost);

      if (session.orbitCompleted) setCompletedCount(session.orbitCompleted.length);
      if (session.phase === "orbit_resolution") setPageState("resolving");
      // GameShell handles navigation to discussion/voting/result/role_config
    };

    const handleOrbitInfo = (info: { type: string; data?: unknown }) => {
      setOrbitInfoData(info);
      sessionStorage.setItem("lp_orbit_info", JSON.stringify(info));
    };

    // orbit_result is now delivered at the start of the Discussion phase.
    // Store it in sessionStorage so DiscussionPage can read it immediately on mount.
    const handleOrbitResult = (result: { type: string; data?: unknown }) => {
      sessionStorage.setItem("lp_orbit_result", JSON.stringify(result));
    };

    socket.on("phase_update", handlePhaseUpdate);
    socket.on("orbit_info", handleOrbitInfo);
    socket.on("orbit_result", handleOrbitResult);

    // Shared sync function: fetches latest session and updates local state
    const syncSession = () => {
      socket.emit("get_session", { sessionId: roomCode }, (resp: { success: boolean; session?: { phase: string; players: LivePlayer[]; orbitCompleted?: string[] } }) => {
        if (resp.success && resp.session) {
          const myPlayerId = sessionStorage.getItem("lp_playerId");
          const mySocketId = socket.id;
          setSessionPlayers(
            (resp.session.players ?? []).map((p: LivePlayer) => ({
              ...p,
              isYou: myPlayerId ? p.playerId === myPlayerId : p.id === mySocketId,
            })),
          );

          const me = (resp.session.players ?? []).find((p: LivePlayer) => myPlayerId ? p.playerId === myPlayerId : p.id === mySocketId);
          if (me) setIsHost(me.isHost);

          if (resp.session.orbitCompleted) setCompletedCount(resp.session.orbitCompleted.length);
          if (resp.session.phase === "orbit_resolution") setPageState("resolving");
          // GameShell handles navigation for other phases
        }
      });
    };

    // Sync current session on mount
    syncSession();

    // Periodic fallback: poll every 3 seconds so the UI stays in sync even when
    // phase_update socket events are missed (e.g. transport hiccups).
    const pollId = setInterval(syncSession, 3000);

    // Restore cached orbit info (in case page remounted)
    const cached = sessionStorage.getItem("lp_orbit_info");
    if (cached) {
      try { setOrbitInfoData(JSON.parse(cached)); } catch {}
    }

    // Determine initial UI state — strict passive classification:
    // ONLY Crew and Parasite are passive. All other roles (including Commander) are active.
    if (role.id === "crew") {
      // Crew has no ability — server already auto-completes it; client mirrors with waiting state
      if (!autoSubmittedRef.current) {
        autoSubmittedRef.current = true;
        socket.emit("submit_action", { sessionId: roomCode, action: { type: "none", targets: [] } });
      }
      setPageState("waiting");
    } else if (role.id === "parasite") {
      // Parasite sees alien team — auto-submit so they don't block, but show info page
      if (!autoSubmittedRef.current) {
        autoSubmittedRef.current = true;
        socket.emit("submit_action", { sessionId: roomCode, action: { type: "passive", targets: [] } });
      }
      setPageState("passive_info");
    } else if (role.id === "virus" || role.id === "router") {
      // Virus and Router act during Role Reveal — they have no Orbit action.
      // Auto-submit so they don't block resolution.
      if (!autoSubmittedRef.current) {
        autoSubmittedRef.current = true;
        socket.emit("submit_action", { sessionId: roomCode, action: { type: "none", targets: [] } });
      }
      setPageState("waiting");
    } else {
      // All other roles (Alien, Scanner, Sentinel, Disruptor, Seeker, Warper, Shifter, Commander)
      // must interact — either use their ability or click SKIP
      setPageState("action_select");
    }

    return () => {
      socket.off("phase_update", handlePhaseUpdate);
      socket.off("orbit_info", handleOrbitInfo);
      socket.off("orbit_result", handleOrbitResult);
      clearInterval(pollId);
    };
  }, [roomCode, role.canAct, role.id]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleSelectAction = useCallback((action: OrbitActionDef) => {
    playSciFiClick();
    // Self-targeting abilities (e.g. Commander vote boost) need no target selection
    if (action.targetType === "self") {
      submitAction(action.id, []);
      return;
    }
    setSelectedAction(action);
    setSelectedTargets([]);
    setPageState("target_select");
  }, [submitAction]);

  const handleToggleTarget = useCallback((targetId: string, maxCount: number) => {
    playSciFiClick();
    setSelectedTargets((prev) => {
      if (prev.includes(targetId)) return prev.filter((id) => id !== targetId);
      if (prev.length >= maxCount) return [...prev.slice(1), targetId];
      return [...prev, targetId];
    });
  }, []);

  const handleConfirmTargets = useCallback(() => {
    if (!selectedAction) return;
    playSciFiClick();
    if (selectedAction.targetType === "center") {
      const idx = parseInt((selectedTargets[0] ?? "center_0").replace("center_", ""), 10);
      console.log("ALIEN SELECTED:", idx);
      console.log("ALIEN ACTION:", { type: selectedAction.id, target: idx, targets: selectedTargets });
    }
    submitAction(selectedAction.id, selectedTargets);
  }, [selectedAction, selectedTargets, submitAction]);

  const handleSkip = useCallback(() => {
    playSciFiClick();
    submitAction("skip", []);
  }, [submitAction]);

  const handlePassiveAcknowledge = useCallback(() => {
    playSciFiClick();
    if (!autoSubmittedRef.current) {
      autoSubmittedRef.current = true;
      submitAction("passive", []);
    }
  }, [submitAction]);


  // Other players for target selection (exclude self and spectators)
  const otherPlayers = sessionPlayers.filter((p) => !p.isYou && !p.isSpectator);

  // ── Render ────────────────────────────────────────────────────────────────
  if (isSpectator) {
    return (
      <div className="relative min-h-screen w-full flex flex-col ix-page-enter" style={{ background: "hsl(210 30% 8%)", color: "hsl(190 80% 90%)" }}>
        <HamburgerMenu
          onShowSettings={() => setShowSettingsModal(true)}
          onShowProfile={() => setShowProfileModal(true)}
          onShowHowToPlay={() => setShowHowToPlay(true)}
          musicOn={musicOn}
          onToggleMusic={handleToggleMusic}
          playSound={playSciFiClick}
          showQuitButton
          isHost={isHost}
          onRestartRound={handleRestartRound}
        />
        <SettingsModal isOpen={showSettingsModal} onClose={() => setShowSettingsModal(false)} />
        <ProfileModal isOpen={showProfileModal} onClose={() => setShowProfileModal(false)} />
        
        <div className="w-full px-6 py-3 flex items-center justify-between border-b shrink-0" style={{ background: "hsl(220 28% 7%)", borderColor: "hsl(185 100% 50% / 0.2)" }}>
          <div className="font-orbitron font-black text-lg tracking-widest uppercase leading-none" style={{ color: "hsl(185 100% 70%)" }}>
            OBSERVER LINK
          </div>
          <div className="text-right">
            <div className="text-xs tracking-widest uppercase mb-1" style={{ color: "hsl(210 30% 50%)" }}>Orbit Phase</div>
            <div className="font-orbitron font-bold text-sm tracking-[0.2em]" style={{ color: "hsl(185 100% 70%)" }}>
              MONITORING
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-24 h-24 mb-8 relative">
            <div className="absolute inset-0 rounded-full border-4 border-cyan-500/20 animate-ping" />
            <div className="absolute inset-2 rounded-full border-2 border-cyan-400 animate-spin" style={{ borderTopColor: "transparent", borderBottomColor: "transparent" }} />
            <div className="absolute inset-0 flex items-center justify-center">
              <svg className="w-10 h-10 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
          </div>
          
          <div className="font-orbitron text-2xl lg:text-3xl font-black tracking-widest uppercase mb-4" style={{ color: "hsl(185 100% 70%)" }}>
            ORBIT IN PROGRESS
          </div>
          <div className="max-w-md text-sm lg:text-base leading-relaxed mb-8" style={{ color: "hsl(210 30% 65%)", fontFamily: "'Exo 2', sans-serif" }}>
            Players are currently executing their specialized abilities. <br />
            As an observer, you are witnessing the tactical layer of the mission. <br />
            Stand by for Deliberation.
          </div>
          
          <WaitingPanel
            accentColor="hsl(185 100% 50%)"
            label="Neural sync status"
            completedCount={completedCount}
            totalCount={sessionPlayers.filter(p => !p.isSpectator).length}
          />
        </div>
      </div>
    );
  }
  return (
    <motion.div
      animate={isSurging ? { 
        x: [0, -5, 5, -5, 5, 0],
        filter: [
          "none", 
          "drop-shadow(2px 0 0 rgba(255,0,0,0.5)) drop-shadow(-2px 0 0 rgba(0,255,255,0.5))",
          "none"
        ]
      } : { x: 0, filter: "none" }}
      transition={{ duration: 0.4 }}
      className="min-h-screen w-full flex flex-col relative"
      style={{
        backgroundImage: `linear-gradient(${bgOverlay}, ${bgOverlay}), url('${import.meta.env.BASE_URL}moon-phases.webp')`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
        color: "hsl(190 80% 90%)",
      }}
    >
      {/* Hamburger Menu */}
      <HamburgerMenu
        onShowSettings={() => setShowSettingsModal(true)}
        onShowProfile={() => setShowProfileModal(true)}
        onShowHowToPlay={() => setShowHowToPlay(true)}
        musicOn={musicOn}
        onToggleMusic={handleToggleMusic}
        playSound={playSciFiClick}
        showQuitButton
        isHost={isHost}
        onRestartRound={handleRestartRound}
      />

      {/* Settings Modal */}
      <SettingsModal isOpen={showSettingsModal} onClose={() => setShowSettingsModal(false)} />

      {/* Profile Modal */}
      <ProfileModal isOpen={showProfileModal} onClose={() => setShowProfileModal(false)} />

      {/* Top bar */}
      <div
        className="w-full px-6 py-3 flex items-center justify-between border-b shrink-0"
        style={{
          background: "hsl(220 28% 7%)",
          borderColor: accentColor.replace(")", " / 0.25)"),
          boxShadow: `0 1px 12px ${accentGlow.replace("0.4", "0.1")}`,
        }}
      >
        <div>
          <div className="font-orbitron font-black text-lg tracking-widest uppercase leading-none" style={{ color: accentLight, textShadow: `0 0 12px ${accentGlow}` }}>
            ERROR: NEWFORM
          </div>
          <div className="font-orbitron font-bold text-xs tracking-[0.3em] uppercase" style={{ color: "hsl(270 80% 65%)" }}>
            DETECTED
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs tracking-widest uppercase mb-1" style={{ color: "hsl(210 30% 50%)" }}>Orbit Phase</div>
          <div className="font-orbitron font-bold text-sm tracking-[0.2em]" style={{ color: accentLight }}>
            ACTION PHASE
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col px-6 py-6 gap-5 overflow-y-auto pb-32 lg:pb-8 max-w-2xl mx-auto w-full">

        {/* Role header */}
        <div className="flex items-center gap-4">
          <img
            src={role.image}
            alt={role.name}
            className="w-16 h-16 rounded-md object-cover shrink-0"
            loading="lazy"
            style={{ border: `1px solid ${accentColor.replace(")", " / 0.4)")}` }}
          />
          <div>
            <div className="text-xs tracking-widest uppercase mb-0.5" style={{ color: "hsl(210 30% 45%)" }}>
              YOUR ABILITY AS
            </div>
            <div
              className="font-orbitron font-black text-2xl tracking-widest uppercase"
              style={{ color: accentLight, textShadow: `0 0 12px ${accentGlow}` }}
            >
              {role.name}
            </div>
          </div>
        </div>

        {/* Ability text */}
        <div
          className="rounded-md p-4"
          style={{ background: accentDim, border: `1px solid ${accentColor.replace(")", " / 0.3)")}` }}
        >
          <div className="font-orbitron text-xs tracking-[0.25em] uppercase mb-2 font-bold" style={{ color: accentLight }}>
            ABILITY
          </div>
          <p className="text-sm leading-relaxed" style={{ color: "hsl(190 60% 78%)", fontFamily: "'Exo 2', sans-serif", whiteSpace: "pre-line" }}>
            {role.ability}
          </p>
        </div>

        {/* ── State-dependent action area ── */}

        {pageState === "loading" && (
          <div className="text-center py-8" style={{ color: "hsl(210 30% 45%)", fontFamily: "'Exo 2', sans-serif" }}>
            Syncing...
          </div>
        )}

        {/* Active: ability action select */}
        {pageState === "action_select" && (
          <div className="flex flex-col gap-3">
            <div className="font-orbitron text-xs tracking-[0.3em] uppercase mb-1" style={{ color: "hsl(210 30% 50%)" }}>
              CHOOSE ACTION
            </div>
            {(orbitConfig.actions ?? []).map((action) => (
              <ActionButton
                key={action.id}
                label={action.label}
                accentColor={accentColor}
                accentLight={accentLight}
                accentGlow={accentGlow}
                onClick={() => handleSelectAction(action)}
              />
            ))}
            <SkipButton accentColor={accentColor} onClick={handleSkip} />
          </div>
        )}

        {/* Active: target select */}
        {pageState === "target_select" && selectedAction && (
          <TargetSelect
            action={selectedAction}
            otherPlayers={otherPlayers}
            selectedTargets={selectedTargets}
            accentColor={accentColor}
            accentLight={accentLight}
            accentGlow={accentGlow}
            accentDim={accentDim}
            onToggle={handleToggleTarget}
            onConfirm={handleConfirmTargets}
            onSkip={handleSkip}
            onBack={() => { playSciFiClick(); setPageState("action_select"); setSelectedTargets([]); }}
          />
        )}

        {/* Passive: parasite info */}
        {pageState === "passive_info" && role.id === "parasite" && (
          <PassiveParasiteInfo
            orbitInfoData={orbitInfoData}
            accentColor={accentColor}
            accentLight={accentLight}
            accentGlow={accentGlow}
            accentDim={accentDim}
            onAcknowledge={handlePassiveAcknowledge}
          />
        )}

        {/* Waiting */}
        {pageState === "waiting" && (
          <WaitingPanel
            accentColor={accentColor}
            label={!role.canAct ? "Waiting for other players to use their ability" : "Waiting for other players..."}
            completedCount={completedCount}
            totalCount={sessionPlayers.filter(p => !p.isSpectator).length}
          />
        )}

        {/* Resolving */}
        {pageState === "resolving" && (
          <div
            className="rounded-md p-6 text-center"
            style={{ background: "hsl(220 28% 10%)", border: "1px solid hsl(210 30% 18%)" }}
          >
            <div className="font-orbitron font-bold text-lg tracking-[0.3em] uppercase mb-2" style={{ color: "hsl(45 90% 60%)" }}>
              RESOLVING ACTIONS...
            </div>
            <p className="text-sm" style={{ color: "hsl(210 30% 45%)", fontFamily: "'Exo 2', sans-serif" }}>
              Processing all player abilities. Stand by.
            </p>
          </div>
        )}

        {/* Done / Discussion */}
        {pageState === "done" && (
          <div
            className="rounded-md p-6 text-center"
            style={{ background: "hsl(220 28% 10%)", border: "1px solid hsl(210 30% 18%)" }}
          >
            <div className="font-orbitron font-bold text-lg tracking-[0.3em] uppercase mb-2" style={{ color: accentLight }}>
              DISCUSSION PHASE
            </div>
            <p className="text-sm" style={{ color: "hsl(210 30% 50%)", fontFamily: "'Exo 2', sans-serif" }}>
              Orbit complete. Discuss what you know.
            </p>
          </div>
        )}

      </div>
    </motion.div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function ActionButton({
  label,
  accentColor,
  accentLight,
  accentGlow,
  onClick,
}: {
  label: string;
  accentColor: string;
  accentLight: string;
  accentGlow: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full py-4 font-orbitron font-bold text-sm tracking-[0.25em] uppercase rounded-md border-2 transition-all duration-150 cursor-pointer"
      style={{
        background: accentColor.replace(")", " / 0.15)"),
        borderColor: accentColor,
        color: accentLight,
        boxShadow: `0 0 8px ${accentGlow}`,
      }}
      onMouseEnter={(e) => { e.currentTarget.style.boxShadow = `0 0 18px ${accentGlow.replace("0.4", "0.7")}`; }}
      onMouseLeave={(e) => { e.currentTarget.style.boxShadow = `0 0 8px ${accentGlow}`; }}
    >
      {label}
    </button>
  );
}

function SkipButton({ accentColor, onClick }: { accentColor: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full py-3 font-orbitron font-bold text-xs tracking-[0.25em] uppercase rounded-md border transition-all duration-150 cursor-pointer"
      style={{
        background: "transparent",
        borderColor: "hsl(210 30% 25%)",
        color: "hsl(210 30% 50%)",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = "hsl(210 30% 40%)"; e.currentTarget.style.color = "hsl(210 30% 65%)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = "hsl(210 30% 25%)"; e.currentTarget.style.color = "hsl(210 30% 50%)"; }}
    >
      SKIP
    </button>
  );
}

function WaitingPanel({ accentColor, label, completedCount, totalCount }: { accentColor: string; label: string; completedCount: number; totalCount: number }) {
  return (
    <div
      className="rounded-md py-5 px-4 text-center"
      style={{ background: "hsl(220 28% 9%)", border: `1px solid ${accentColor.replace(")", " / 0.15)")}` }}
    >
      <p className="font-orbitron text-sm tracking-[0.15em] uppercase mb-3" style={{ color: "hsl(210 30% 45%)" }}>
        {label}
      </p>
      {totalCount > 0 && (
        <div className="font-orbitron font-bold text-lg" style={{ color: accentColor }}>
          {completedCount} / {totalCount}
          <span className="block text-xs tracking-[0.2em] uppercase mt-1" style={{ color: "hsl(210 30% 40%)", fontWeight: 400 }}>
            PLAYERS READY
          </span>
        </div>
      )}
    </div>
  );
}

function TargetSelect({
  action,
  otherPlayers,
  selectedTargets,
  accentColor,
  accentLight,
  accentGlow,
  accentDim,
  onToggle,
  onConfirm,
  onSkip,
  onBack,
}: {
  action: OrbitActionDef;
  otherPlayers: { id: string; name: string }[];
  selectedTargets: string[];
  accentColor: string;
  accentLight: string;
  accentGlow: string;
  accentDim: string;
  onToggle: (id: string, max: number) => void;
  onConfirm: () => void;
  onSkip: () => void;
  onBack: () => void;
}) {
  const isCenterScan = action.targetType === "center";
  const targets = isCenterScan
    ? CENTER_LABELS.map((label, i) => ({ id: `center_${i}`, name: label }))
    : otherPlayers;

  const canConfirm = selectedTargets.length === action.targetCount;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="font-orbitron text-xs tracking-[0.3em] uppercase" style={{ color: "hsl(210 30% 50%)" }}>
          SELECT TARGET{action.targetCount > 1 ? "S" : ""} ({selectedTargets.length}/{action.targetCount})
        </div>
        <button
          onClick={onBack}
          className="text-xs tracking-widest uppercase cursor-pointer"
          style={{ color: "hsl(210 30% 40%)", fontFamily: "'Exo 2', sans-serif" }}
        >
          ← BACK
        </button>
      </div>

      <div className="flex flex-col gap-2">
        {targets.map((t) => {
          const isSelected = selectedTargets.includes(t.id);
          return (
            <button
              key={t.id}
              onClick={() => onToggle(t.id, action.targetCount)}
              className="w-full px-4 py-3 rounded-md font-orbitron text-sm tracking-wider uppercase text-left cursor-pointer transition-all duration-100"
              style={{
                background: isSelected ? accentDim : "hsl(220 28% 10%)",
                border: `1px solid ${isSelected ? accentColor : "hsl(210 30% 18%)"}`,
                color: isSelected ? accentLight : "hsl(190 60% 75%)",
                boxShadow: isSelected ? `0 0 8px ${accentGlow}` : "none",
              }}
            >
              {t.name}
            </button>
          );
        })}
      </div>

      <button
        onClick={onConfirm}
        disabled={!canConfirm}
        className="w-full py-4 font-orbitron font-bold text-sm tracking-[0.25em] uppercase rounded-md border-2 transition-all duration-150"
        style={{
          background: canConfirm ? accentColor.replace(")", " / 0.2)") : "hsl(220 28% 8%)",
          borderColor: canConfirm ? accentColor : "hsl(210 30% 18%)",
          color: canConfirm ? accentLight : "hsl(210 30% 35%)",
          cursor: canConfirm ? "pointer" : "not-allowed",
        }}
      >
        CONFIRM
      </button>

      <SkipButton accentColor={accentColor} onClick={onSkip} />
    </div>
  );
}

function PassiveParasiteInfo({
  orbitInfoData,
  accentColor,
  accentLight,
  accentGlow,
  accentDim,
  onAcknowledge,
}: {
  orbitInfoData: { type: string; data?: unknown } | null;
  accentColor: string;
  accentLight: string;
  accentGlow: string;
  accentDim: string;
  onAcknowledge: () => void;
}) {
  const info = orbitInfoData?.data as { alienPlayers?: string[] } | undefined;
  const alienPlayers = info?.alienPlayers ?? [];

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-md p-4" style={{ background: accentDim, border: `1px solid ${accentColor.replace(")", " / 0.3)")}` }}>
        <div className="font-orbitron text-xs tracking-[0.25em] uppercase mb-3 font-bold" style={{ color: accentLight }}>
          ANOMALY DETECTION
        </div>
        <p className="text-xs mb-3" style={{ color: "hsl(210 30% 50%)", fontFamily: "'Exo 2', sans-serif" }}>
          You detect the following anomalies:
        </p>
        {alienPlayers.length > 0 ? (
          <div className="flex flex-col gap-2">
            {alienPlayers.map((name, i) => (
              <div key={i} className="px-3 py-2 rounded font-orbitron text-sm tracking-wider uppercase" style={{ background: "hsl(220 28% 12%)", border: `1px solid ${accentColor.replace(")", " / 0.3)")}`, color: accentLight }}>
                {name}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm" style={{ color: "hsl(210 30% 45%)", fontFamily: "'Exo 2', sans-serif" }}>No anomalies detected.</p>
        )}
      </div>
      <ActionButton label="ACKNOWLEDGED" accentColor={accentColor} accentLight={accentLight} accentGlow={accentGlow} onClick={onAcknowledge} />
    </div>
  );
}


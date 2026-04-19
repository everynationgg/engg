import { useState, useCallback, useEffect } from "react";
import { ROLES, type Role } from "@/data/roles";
import { playSciFiClick, playBassDrop } from "@/lib/sound";
import { getSocket } from "@/lib/socket";
import { getSoundEnabled, setSoundEnabled, startLobbyMusic, stopLobbyMusic } from "@/lib/music";
import HamburgerMenu from "@/components/HamburgerMenu";
import SettingsModal from "@/components/SettingsModal";
import ProfileModal from "@/components/ProfileModal";
import { TeamIcon } from "@/components/TeamIcon";
import ScratchOffCard from "@/components/ScratchOffCard";

function getAssignedRole(): Role {
  const roleId = sessionStorage.getItem("lp_assignedRole");
  const found = ROLES.find((r) => r.id === roleId);
  return found ?? ROLES[6];
}

function getPlayerName(): string {
  return sessionStorage.getItem("lp_callsign") || "OPERATIVE";
}

function getTotalPlayers(): number {
  const raw = sessionStorage.getItem("lp_totalPlayers");
  return raw ? parseInt(raw, 10) : 1;
}

export default function RoleRevealPage() {
  const [acknowledged, setAcknowledged] = useState(false);
  const [revealState, setRevealState] = useState<"black" | "flash" | "scratch" | "ready">("black");

  const role = getAssignedRole();
  const isAlien = role.team === "alien";

  useEffect(() => {
    // Brief delay to build tension without feeling broken
    const t1 = setTimeout(() => {
      setRevealState("flash");
      // Flash lasts 150ms
      setTimeout(() => {
        setRevealState("scratch");
      }, 150);
    }, 1000);
    return () => clearTimeout(t1);
  }, []);

  const handleReveal = useCallback(() => {
    if (isAlien) {
      playBassDrop();
    } else {
      playSciFiClick(1.0);
    }
    setRevealState("ready");
  }, [isAlien]);

  const [readyCount, setReadyCount] = useState(0);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [musicOn, setMusicOn] = useState<boolean>(getSoundEnabled);

  const playerName = getPlayerName();
  const totalPlayers = getTotalPlayers();
  const roomCode = sessionStorage.getItem("lp_roomCode") || "";

  useEffect(() => {
    const socket = getSocket();

    const handlePhaseUpdate = (session: { phase: string; players: { id: string }[]; roleAcknowledgements?: string[] }) => {
      if (session.roleAcknowledgements !== undefined) {
        setReadyCount(session.roleAcknowledgements.length);
      }
      // Clear orbit cache when transitioning to orbit (GameShell handles navigation)
      if (session.phase === "orbit_action") {
        sessionStorage.removeItem("lp_orbit_info");
        sessionStorage.removeItem("lp_orbit_result");
      }
    };

    const handleOrbitInfo = (info: unknown) => {
      sessionStorage.setItem("lp_orbit_info", JSON.stringify(info));
    };

    socket.on("phase_update", handlePhaseUpdate);
    socket.on("orbit_info", handleOrbitInfo);

    // Periodic fallback: poll every 3 seconds so the UI stays in sync even when
    // phase_update socket events are missed (e.g. transport hiccups).
    const syncSession = () => {
      socket.emit("get_session", { sessionId: roomCode }, (resp: { success: boolean; session?: { phase: string; players: { id: string }[]; roleAcknowledgements?: string[] } }) => {
        if (resp.success && resp.session) {
          if (resp.session.roleAcknowledgements !== undefined) {
            setReadyCount(resp.session.roleAcknowledgements.length);
          }
        }
      });
    };

    // Initial fetch + periodic poll
    syncSession();
    const pollId = setInterval(syncSession, 3000);

    return () => {
      socket.off("phase_update", handlePhaseUpdate);
      socket.off("orbit_info", handleOrbitInfo);
      clearInterval(pollId);
    };
  }, [roomCode]);

  const displayName = role.salutation.replace("{username}", playerName);

  const isChaotic = role.team === "chaotic";

  const accentColor = isAlien
    ? "hsl(0 75% 55%)"
    : isChaotic
    ? "hsl(300 70% 55%)"
    : "hsl(185 100% 50%)";
  const accentColorLight = isAlien
    ? "hsl(0 75% 70%)"
    : isChaotic
    ? "hsl(300 70% 70%)"
    : "hsl(185 100% 70%)";
  const accentColorDim = isAlien
    ? "hsl(0 75% 55% / 0.15)"
    : isChaotic
    ? "hsl(300 70% 55% / 0.15)"
    : "hsl(185 100% 50% / 0.15)";
  const accentGlow = isAlien
    ? "hsl(0 75% 55% / 0.4)"
    : isChaotic
    ? "hsl(300 70% 55% / 0.4)"
    : "hsl(185 100% 50% / 0.4)";
  const bgTint = isAlien
    ? "hsl(0 40% 6%)"
    : isChaotic
    ? "hsl(290 30% 6%)"
    : "hsl(200 30% 6%)";

  const handleAcknowledge = useCallback(() => {
    if (acknowledged) return;
    playSciFiClick();
    setAcknowledged(true);
    setReadyCount((prev) => prev + 1);
    const socket = getSocket();
    socket.emit(
      "acknowledge_role",
      { sessionId: roomCode },
      (resp: { success: boolean; orbitInfo?: unknown }) => {
        if (resp?.orbitInfo) {
          sessionStorage.setItem("lp_orbit_info", JSON.stringify(resp.orbitInfo));
        }
      },
    );
  }, [acknowledged, roomCode]);

  const handleToggleMusic = () => {
    const next = !musicOn;
    setMusicOn(next);
    setSoundEnabled(next);
    if (next) {
      startLobbyMusic();
    } else {
      stopLobbyMusic();
    }
  };

  if (revealState === "black") {
    return (
      <div className="fixed inset-0 bg-black z-[9999] flex flex-col items-center justify-center">
        <div className="font-orbitron text-xs tracking-[0.4em] uppercase" style={{ color: "hsl(210 30% 25%)" }}>
          DECRYPTING NEURAL LINK<span className="animate-pulse">...</span>
        </div>
      </div>
    );
  }

  if (revealState === "flash") {
    return (
      <div 
        className="fixed inset-0 z-[9999]" 
        style={{ background: isAlien ? "hsl(0 75% 55%)" : "hsl(185 100% 50%)" }} 
      />
    );
  }

  return (
    <div
      className="relative min-h-screen w-full flex flex-col"
      style={{ background: bgTint, color: "hsl(190 80% 90%)" }}
    >
      {/* Hamburger Menu */}
      <HamburgerMenu
        onShowSettings={() => setShowSettingsModal(true)}
        onShowProfile={() => setShowProfileModal(true)}
        onShowHowToPlay={() => {}} // No how to play in role reveal
        musicOn={musicOn}
        onToggleMusic={handleToggleMusic}
        playSound={playSciFiClick}
        showQuitButton
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
          borderColor: `${accentColor.replace(")", " / 0.25)")}`,
          boxShadow: `0 1px 12px ${accentGlow.replace("0.4", "0.12")}`,
        }}
      >
        <div>
          <div
            className="font-orbitron font-black text-lg tracking-widest uppercase leading-none"
            style={{ color: accentColorLight, textShadow: `0 0 12px ${accentGlow}` }}
          >
            ERROR: NEWFORM
          </div>
          <div
            className="font-orbitron font-bold text-xs tracking-[0.3em] uppercase"
            style={{ color: "hsl(270 80% 65%)" }}
          >
            DETECTED
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs tracking-widest uppercase mb-1" style={{ color: "hsl(210 30% 50%)" }}>Role Reveal</div>
          <div
            className="font-orbitron font-bold text-sm tracking-[0.2em]"
            style={{ color: accentColorLight }}
          >
            EYES ONLY
          </div>
        </div>
      </div>

      {/* Main content — horizontal on desktop, vertical on mobile */}
      <ScratchOffCard
        onReveal={handleReveal}
        coverColor={bgTint}
        coverImage={role.image}
        revealThreshold={0.4}
        className="flex-1 w-full h-full relative"
      >
        <div className="flex flex-col lg:flex-row absolute inset-0 overflow-hidden" style={{ minHeight: 0 }}>

          {/* LEFT — Role image */}
          <div
            className="lg:w-96 shrink-0 relative overflow-hidden"
            style={{
              minHeight: "260px",
              opacity: revealState === "ready" ? 1 : 0.4,
              transform: revealState === "ready" ? "rotateY(0deg) scale(1)" : "rotateY(16deg) scale(0.96)",
              transformOrigin: "left center",
              transition: "opacity 360ms ease, transform 560ms cubic-bezier(0.22, 1, 0.36, 1)",
            }}
          >
          <img
            src={role.image}
            alt={role.name}
            className="w-full h-full object-cover"
            style={{ minHeight: "260px", maxHeight: "100vh" }}
          />
          {/* Gradient fade to bg */}
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(to bottom, transparent 40%, ${bgTint} 100%), linear-gradient(to right, transparent 70%, ${bgTint} 100%)`,
            }}
          />
        </div>

        {/* RIGHT — Role info stack */}
        <div
          className="flex-1 flex flex-col overflow-y-auto px-6 lg:px-10 py-6 lg:py-8 gap-5 pb-28 lg:pb-6"
          style={{
            opacity: revealState === "ready" ? 1 : 0,
            transform: revealState === "ready" ? "translateY(0px)" : "translateY(18px)",
            transition: "opacity 420ms ease 120ms, transform 520ms cubic-bezier(0.22, 1, 0.36, 1) 120ms",
            pointerEvents: revealState === "ready" ? "auto" : "none",
          }}
        >

          {/* Alignment badge */}
          <div className="flex items-start">
            <div
              className="px-3 py-1 rounded font-orbitron text-xs tracking-widest uppercase font-bold"
              style={{
                background: accentColorDim,
                border: `1px solid ${accentColor}`,
                color: accentColorLight,
                boxShadow: `0 0 12px ${accentGlow}`,
              }}
            >
              {role.team === "alien" ? "ALIEN TEAM" : role.team === "chaotic" ? "CHAOTIC" : "CREW TEAM"}
              <TeamIcon team={role.team} className="ml-2" />
            </div>
          </div>

          {/* YOUR ROLE IS */}
          <div>
            <div
              className="font-orbitron text-xs tracking-[0.35em] uppercase mb-1"
              style={{ color: "hsl(210 30% 45%)" }}
            >
              YOUR ROLE IS
            </div>
            <div
              className={`font-orbitron font-black text-4xl lg:text-5xl tracking-widest uppercase ${isAlien ? "glitch-text" : ""}`}
              data-text={role.name}
              style={{
                color: accentColorLight,
                textShadow: `0 0 16px ${accentGlow}, 0 0 40px ${accentGlow.replace("0.4", "0.2")}`,
              }}
            >
              {role.name}
            </div>
          </div>

          {/* Display name / salutation */}
          <div
            className="font-orbitron text-sm tracking-[0.15em] uppercase"
            style={{ color: "hsl(190 60% 65%)" }}
          >
            {displayName}
          </div>

          {/* Divider */}
          <div
            className="h-px w-full"
            style={{
              background: `linear-gradient(90deg, ${accentColor.replace(")", " / 0.5)")}, transparent)`,
            }}
          />

          {/* Ability panel */}
          <div
            className="rounded-md p-4"
            style={{
              background: accentColorDim,
              border: `1px solid ${accentColor.replace(")", " / 0.3)")}`,
            }}
          >
            <div
              className="font-orbitron text-xs tracking-[0.25em] uppercase mb-2 font-bold"
              style={{ color: accentColorLight }}
            >
              ABILITY
            </div>
            <p
              className="text-sm leading-relaxed"
              style={{
                color: "hsl(190 60% 78%)",
                fontFamily: "'Exo 2', sans-serif",
                whiteSpace: "pre-line",
              }}
            >
              {role.ability}
            </p>
          </div>

          {/* Lore panel */}
          <div
            className="rounded-md p-4"
            style={{
              background: "hsl(220 28% 8%)",
              border: "1px solid hsl(210 30% 16%)",
            }}
          >
            <div
              className="font-orbitron text-xs tracking-[0.25em] uppercase mb-2 font-bold"
              style={{ color: "hsl(210 30% 50%)" }}
            >
              INTEL FILE
            </div>
            <p
              className="text-sm leading-relaxed"
              style={{
                color: "hsl(210 30% 60%)",
                fontFamily: "'Exo 2', sans-serif",
                whiteSpace: "pre-line",
              }}
            >
              {role.lore}
            </p>
          </div>

          {/* Ready count */}
          {acknowledged && (
            <div
              className="text-xs tracking-wider text-center"
              style={{ color: "hsl(210 30% 45%)", fontFamily: "'Exo 2', sans-serif" }}
            >
              {readyCount} / {totalPlayers} players ready
            </div>
          )}

          {/* Acknowledge button — desktop (inline) */}
          <div className={`hidden lg:block transition-opacity duration-500 delay-300 ${revealState === "ready" ? "opacity-100" : "opacity-0"}`}>
            {revealState === "ready" && (
              <AcknowledgeButton
                acknowledged={acknowledged}
                accentColor={accentColor}
                accentColorLight={accentColorLight}
                accentGlow={accentGlow}
                onAcknowledge={handleAcknowledge}
              />
            )}
          </div>
        </div>
        </div>
      </ScratchOffCard>

      {/* Acknowledge button — mobile (fixed bottom) */}
      <div
        className={`lg:hidden fixed bottom-0 left-0 right-0 px-6 py-4 border-t transition-transform duration-500 delay-300 ${revealState === "ready" ? "translate-y-0" : "translate-y-full"}`}
        style={{
          background: bgTint,
          borderColor: `${accentColor.replace(")", " / 0.2)")}`,
          backdropFilter: "blur(8px)",
          zIndex: 60,
        }}
      >
        {revealState === "ready" && (
          <AcknowledgeButton
            acknowledged={acknowledged}
            accentColor={accentColor}
            accentColorLight={accentColorLight}
            accentGlow={accentGlow}
            onAcknowledge={handleAcknowledge}
          />
        )}
      </div>
    </div>
  );
}

interface AcknowledgeButtonProps {
  acknowledged: boolean;
  accentColor: string;
  accentColorLight: string;
  accentGlow: string;
  onAcknowledge: () => void;
}

function AcknowledgeButton({ acknowledged, accentColor, accentColorLight, accentGlow, onAcknowledge }: AcknowledgeButtonProps) {
  if (acknowledged) {
    return (
      <div
        className="w-full py-4 font-orbitron font-bold text-sm tracking-[0.25em] uppercase rounded-md border-2 text-center"
        style={{
          background: "hsl(220 28% 9%)",
          borderColor: "hsl(210 30% 22%)",
          color: "hsl(210 30% 45%)",
        }}
      >
        Waiting for other players...
      </div>
    );
  }

  return (
    <button
      onClick={onAcknowledge}
      data-testid="button-acknowledge"
      className="w-full py-4 font-orbitron font-bold text-sm tracking-[0.25em] uppercase rounded-md border-2 transition-all duration-200 cursor-pointer"
      style={{
        background: `linear-gradient(135deg, ${accentColor.replace(")", " / 0.25)")}, ${accentColor.replace(")", " / 0.1)")})`,
        borderColor: accentColor,
        color: accentColorLight,
        boxShadow: `0 0 10px ${accentGlow}, 0 0 24px ${accentGlow.replace("0.4", "0.15")}`,
      }}
      onMouseEnter={(e) => {
        const btn = e.currentTarget;
        btn.style.boxShadow = `0 0 18px ${accentGlow.replace("0.4", "0.7")}, 0 0 40px ${accentGlow.replace("0.4", "0.3")}`;
        btn.style.color = "hsl(0 0% 95%)";
      }}
      onMouseLeave={(e) => {
        const btn = e.currentTarget;
        btn.style.boxShadow = `0 0 10px ${accentGlow}, 0 0 24px ${accentGlow.replace("0.4", "0.15")}`;
        btn.style.color = accentColorLight;
      }}
    >
      I ACKNOWLEDGE MY ROLE
    </button>
  );
}

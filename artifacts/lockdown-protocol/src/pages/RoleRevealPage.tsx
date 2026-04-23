import { useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { ROLES, type Role } from "@/data/roles";
import { playSciFiClick, playBassDrop } from "@/lib/sound";
import { getSocket } from "@/lib/socket";
import { getSoundEnabled, setSoundEnabled, startLobbyMusic, stopLobbyMusic } from "@/lib/music";
import HamburgerMenu from "@/components/HamburgerMenu";
import SettingsModal from "@/components/SettingsModal";
import ProfileModal from "@/components/ProfileModal";
import { TeamIcon } from "@/components/TeamIcon";
function getAssignedRole(): Role {
  const roleId = sessionStorage.getItem("lp_assignedRole");
  const found = ROLES.find((r) => r.id === roleId);
  return found ?? ROLES.find((r) => r.id === "crew") ?? ROLES[0];
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
  const [revealState, setRevealState] = useState<"black" | "flash" | "ready">("black");
  const [readyCount, setReadyCount] = useState(0);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [sessionPlayers, setSessionPlayers] = useState<any[]>([]);
  const [isHost, setIsHost] = useState(false);
  const [musicOn, setMusicOn] = useState<boolean>(getSoundEnabled);
  const [rolesAssigned, setRolesAssigned] = useState<Record<string, string>>({});
  const [initialRoles, setInitialRoles] = useState<Record<string, string>>({});
  const [livePlayers, setLivePlayers] = useState<any[]>([]);
  const [selectedTargetId, setSelectedTargetId] = useState<string | null>(null);
  const [selectedRouterDestId, setSelectedRouterDestId] = useState<string | null>(null);

  // Defensive: Only compute after state is initialized
  const role = getAssignedRole();
  const myPlayerId = sessionStorage.getItem("lp_playerId");
  const me = livePlayers.find((p: any) => myPlayerId ? p.playerId === myPlayerId : p.id === getSocket().id);
  const isSpectator = !!me && !!me.isSpectator;
  const isAlien = !!role && role.team === "alien";

  useEffect(() => {
    // Brief delay to build tension, then transition smoothly
    const t1 = setTimeout(() => {
      setRevealState("ready");
      if (isAlien) {
        playBassDrop();
      } else {
        playSciFiClick(1.0);
      }
    }, 1200);
    return () => clearTimeout(t1);
  }, [isAlien]);

  const playerName = getPlayerName();
  const totalPlayers = getTotalPlayers();
  const roomCode = sessionStorage.getItem("lp_roomCode") || "";

  useEffect(() => {
    const socket = getSocket();
    const handlePhaseUpdate = (session: any) => {
      if (session.roleAcknowledgements !== undefined) {
        setReadyCount(session.roleAcknowledgements.length);
      }
      if (session.players) {
        setLivePlayers(session.players);
        setSessionPlayers(session.players.map((p: any) => ({ ...p, isYou: myPlayerId ? p.playerId === myPlayerId : p.id === socket.id })));
      }
      if (session.rolesAssigned) setRolesAssigned(session.rolesAssigned);
      if (session.initialRoles) setInitialRoles(session.initialRoles);

      const me = session.players.find((p: any) => myPlayerId ? p.playerId === myPlayerId : p.id === socket.id);
      if (me) setIsHost(me.isHost);
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
      socket.emit("get_session", { sessionId: roomCode }, (resp: any) => {
        if (resp.success && resp.session) {
          if (resp.session.roleAcknowledgements !== undefined) {
            setReadyCount(resp.session.roleAcknowledgements.length);
          }
          if (resp.session.players) {
            setLivePlayers(resp.session.players);
            setSessionPlayers(resp.session.players.map((p: any) => ({ ...p, isYou: myPlayerId ? p.playerId === myPlayerId : p.id === socket.id })));
          }
          if (resp.session.rolesAssigned) setRolesAssigned(resp.session.rolesAssigned);
          if (resp.session.initialRoles) setInitialRoles(resp.session.initialRoles);
          
          const me = resp.session.players.find((p: any) => myPlayerId ? p.playerId === myPlayerId : p.id === socket.id);
          if (me) setIsHost(me.isHost);
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

    // Validation for acting roles
    if (role.id === "virus" && !selectedTargetId) {
      alert("Please select a target to jam.");
      return;
    }
    if (role.id === "router" && (!selectedTargetId || !selectedRouterDestId)) {
      alert("Please select both Source and Destination.");
      return;
    }

    playSciFiClick();
    setAcknowledged(true);
    setReadyCount((prev) => prev + 1);

    let action: any = null;
    if (role.id === "virus") {
      action = { type: "packet_loss", targets: [selectedTargetId] };
    } else if (role.id === "router") {
      action = { type: "gateway_hijack", targets: [selectedTargetId, selectedRouterDestId] };
    }

    const socket = getSocket();
    socket.emit(
      "acknowledge_role",
      { sessionId: roomCode, action },
      (resp: { success: boolean; orbitInfo?: unknown }) => {
        if (resp?.orbitInfo) {
          sessionStorage.setItem("lp_orbit_info", JSON.stringify(resp.orbitInfo));
        }
      },
    );
  }, [acknowledged, roomCode, role.id, selectedTargetId, selectedRouterDestId]);

  const handleRestartRound = useCallback(() => {
    const socket = getSocket();
    socket.emit("restart_game", { sessionId: roomCode }, (resp: { success: boolean; error?: string }) => {
      if (!resp.success) {
        console.error("Restart failed:", resp.error);
      }
    });
  }, [roomCode]);

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


  if (isSpectator) {
    // Spectator UI: Hide all role info, show only spectator message
    return (
      <div className="relative min-h-screen w-full flex flex-col items-center justify-center ix-page-enter" style={{ background: "hsl(210 30% 8%)", color: "hsl(190 80% 90%)" }}>
        <HamburgerMenu
          onShowSettings={() => setShowSettingsModal(true)}
          onShowProfile={() => setShowProfileModal(true)}
          onShowHowToPlay={() => { }}
          musicOn={musicOn}
          onToggleMusic={handleToggleMusic}
          playSound={playSciFiClick}
          showQuitButton
          isHost={isHost}
          onRestartRound={handleRestartRound}
        />
        <SettingsModal isOpen={showSettingsModal} onClose={() => setShowSettingsModal(false)} />
        <ProfileModal isOpen={showProfileModal} onClose={() => setShowProfileModal(false)} />
        <div className="flex flex-col items-center justify-center flex-1 w-full">
          <div className="font-orbitron text-4xl lg:text-6xl font-black tracking-widest uppercase mb-6" style={{ color: "hsl(185 100% 70%)", textShadow: "0 0 24px hsl(185 100% 50% / 0.4)" }}>
            Spectator
          </div>
          <div className="font-orbitron text-lg lg:text-2xl tracking-widest uppercase mb-4" style={{ color: "hsl(210 30% 60%)" }}>
            You are observing this game
          </div>
          <div className="text-base lg:text-lg text-center max-w-xl mb-12" style={{ color: "hsl(210 30% 70%)" }}>
            You can watch all phases but cannot participate in actions or voting.<br />Sit back, relax, and enjoy the show!
          </div>

          {Object.keys(rolesAssigned).length > 0 && (
            <div className="w-full max-w-md rounded-md p-4" style={{ background: "hsl(220 28% 9%)", border: "1px solid hsl(210 30% 18%)" }}>
              <div className="font-orbitron text-xs tracking-[0.25em] uppercase mb-4 font-bold text-center" style={{ color: "hsl(185 100% 70%)" }}>
                IDENTIFIED SUBJECTS
              </div>
              <div className="flex flex-col gap-1.5">
                {sessionPlayers.map((p) => {
                  const roleId = rolesAssigned[p.id];
                  if (!roleId || roleId === "spectator") return null;

                  const r = ROLES.find((x) => x.id === roleId);
                  const isAlienTeam = r?.team === "alien";
                  const isChaotic = r?.team === "chaotic";
                  const teamColor = isAlienTeam ? "hsl(0 75% 60%)" : isChaotic ? "hsl(300 70% 65%)" : "hsl(185 100% 65%)";

                  return (
                    <div
                      key={p.id}
                      className="flex items-center justify-between px-3 py-2 rounded gap-2"
                      style={{ background: "hsl(220 28% 12%)", border: "1px solid hsl(210 30% 16%)" }}
                    >
                      <div className="flex items-center gap-3">
                        {r && (
                          <img src={r.image} alt={r.name} className="w-8 h-8 rounded object-cover shrink-0" loading="lazy" style={{ border: "1px solid hsl(210 30% 22%)" }} />
                        )}
                        <span className="font-orbitron text-sm tracking-wide uppercase truncate" style={{ color: "hsl(190 80% 90%)" }}>
                          {p.name}
                        </span>
                      </div>
                      <span className="font-orbitron text-xs uppercase font-bold" style={{ color: teamColor }}>
                        {r?.name?.toUpperCase() ?? roleId.toUpperCase()}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative min-h-screen w-full flex flex-col ix-page-enter"
      style={{ background: bgTint, color: "hsl(190 80% 90%)" }}
    >
      {/* Hamburger Menu */}
      <HamburgerMenu
        onShowSettings={() => setShowSettingsModal(true)}
        onShowProfile={() => setShowProfileModal(true)}
        onShowHowToPlay={() => { }} // No how to play in role reveal
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
      <div className="flex-1 w-full h-full relative">
        <div className="flex flex-col lg:flex-row absolute inset-0 overflow-hidden" style={{ minHeight: 0 }}>

          {/* LEFT — Role image/video */}
          <div
            className="lg:w-[45%] shrink-0 relative flex items-center justify-center p-4 lg:p-12"
            style={{
              opacity: revealState === "ready" ? 1 : 0.4,
              transform: revealState === "ready" ? "rotateY(0deg) scale(1)" : "rotateY(16deg) scale(0.96)",
              transformOrigin: "left center",
              transition: "opacity 360ms ease, transform 560ms cubic-bezier(0.22, 1, 0.36, 1)",
            }}
          >
            <div className="relative w-full aspect-square max-w-[500px] max-h-[30vh] lg:max-h-none">
              {/* Futuristic frame border */}
              <div
                className="absolute -inset-1 rounded-lg blur-sm opacity-50"
                style={{ background: accentColor }}
              />
              <div
                className="absolute inset-0 rounded-lg border-2 z-10 pointer-events-none"
                style={{ borderColor: accentColor, boxShadow: `inset 0 0 20px ${accentGlow}` }}
              />

              <video
                src={role.video}
                poster={role.image}
                autoPlay
                loop
                muted
                playsInline
                preload="auto"
                className="w-full h-full object-contain rounded-lg relative z-0"
                style={{ background: "black" }}
              />
              {/* Bio-Scan Overlay */}
              <motion.div 
                animate={{ top: ["0%", "100%", "0%"] }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                className="absolute left-0 right-0 h-[2px] bg-cyan-400/50 shadow-[0_0_15px_#22d3ee] z-10 pointer-events-none"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/5 to-transparent pointer-events-none z-10" />
            </div>
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
                className={`px-3 py-1 rounded font-orbitron text-xs tracking-widest uppercase font-bold team-badge ${role.team}-color`}
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
                className={`font-orbitron font-black text-3xl lg:text-5xl tracking-widest uppercase ${isAlien ? "glitch-text" : ""}`}
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
              <div
                className="text-xs tracking-wider text-center"
                style={{ color: "hsl(210 30% 45%)", fontFamily: "'Exo 2', sans-serif" }}
              >
                {readyCount} / {livePlayers.filter(p => !p.isSpectator).length} players ready
              </div>

            {/* Target Selection for Virus/Router + Skip Button */}
            {!acknowledged && revealState === "ready" && (role.id === "virus" || role.id === "router") && (() => {
              const myPlayerId = sessionStorage.getItem("lp_playerId");
              const mySocketId = getSocket().id;
              const isSelf = (p: any) =>
                (myPlayerId && p.playerId === myPlayerId) || p.id === mySocketId;
              return (
                <div className="flex flex-col gap-4 mb-4">
                  <TargetSelector
                    label={role.id === "virus" ? "JAM INTERFACE" : "GATEWAY SOURCE"}
                    players={livePlayers.filter(p => {
                      if (isSelf(p)) return false;
                      if (role.id === "virus") {
                        const r = rolesAssigned[p.id];
                        return r !== "alien" && r !== "parasite" && r !== "virus";
                      }
                      return true;
                    })}
                    selectedId={selectedTargetId}
                    onSelect={(id) => setSelectedTargetId(id)}
                    accentColor={accentColor}
                  />
                  {role.id === "router" && (
                    <TargetSelector
                      label="GATEWAY DESTINATION"
                      players={livePlayers.filter(p => !isSelf(p) && p.id !== selectedTargetId)}
                      selectedId={selectedRouterDestId}
                      onSelect={(id) => setSelectedRouterDestId(id)}
                      accentColor={accentColor}
                    />
                  )}
                  {/* Skip Button */}
                  <button
                    className="mt-2 px-4 py-2 rounded bg-gray-800 border border-gray-600 text-xs font-orbitron tracking-widest uppercase hover:bg-gray-700"
                    style={{ color: accentColorLight, borderColor: accentColor }}
                    onClick={() => {
                      playSciFiClick();
                      setAcknowledged(true);
                      setReadyCount((prev) => prev + 1);
                      const socket = getSocket();
                      socket.emit(
                        "acknowledge_role",
                        { sessionId: roomCode, action: { type: "skip", targets: [] } },
                        (resp: { success: boolean; orbitInfo?: unknown }) => {
                          if (resp?.orbitInfo) {
                            sessionStorage.setItem("lp_orbit_info", JSON.stringify(resp.orbitInfo));
                          }
                        }
                      );
                    }}
                  >
                    Skip
                  </button>
                </div>
              );
            })()}

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
      </div>

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

function TargetSelector({
  label,
  players,
  selectedId,
  onSelect,
  accentColor,
}: {
  label: string;
  players: any[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  accentColor: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="font-orbitron text-[10px] tracking-[0.2em] uppercase" style={{ color: accentColor }}>
        {label}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {players.map((p) => {
          const isSelected = selectedId === p.id;
          const isLocked = selectedId !== null && !isSelected;
          return (
            <button
              key={p.id}
              onClick={() => onSelect(isSelected ? null : p.id)}
              disabled={isLocked}
              className="px-3 py-2 rounded border font-orbitron text-[10px] tracking-widest uppercase transition-all duration-200"
              style={{
                background: isSelected ? `${accentColor}33` : "transparent",
                borderColor: isSelected ? accentColor : "rgba(255,255,255,0.12)",
                color: isSelected ? "white" : isLocked ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.5)",
                opacity: isLocked ? 0.35 : 1,
                cursor: isLocked ? "not-allowed" : "pointer",
                boxShadow: isSelected ? `0 0 8px ${accentColor}66` : "none",
              }}
            >
              {p.name}
            </button>
          );
        })}
      </div>
      {selectedId && (
        <div className="font-orbitron text-[9px] tracking-widest uppercase mt-1" style={{ color: accentColor }}>
          ✓ {players.find(p => p.id === selectedId)?.name ?? "TARGET"} LOCKED
        </div>
      )}
    </div>
  );
}

import { useState, useEffect, useCallback, useRef } from "react";
import { getSocket } from "@/lib/socket";
import { ROLES } from "@/data/roles";
import { getRoomCode, getCallsign, getInitialRoleId, getOrbitResult } from "@/lib/gameHelpers";
import { playSciFiClick, playEmergencyVoteCalled } from "@/lib/sound";
import { getSoundEnabled, setSoundEnabled, startLobbyMusic, stopLobbyMusic } from "@/lib/music";
import HamburgerMenu from "@/components/HamburgerMenu";
import SettingsModal from "@/components/SettingsModal";
import ProfileModal from "@/components/ProfileModal";

interface LivePlayer {
  id: string;
  name: string;
  isHost: boolean;
  isYou?: boolean;
  playerId?: string;
  connected?: boolean;
  alive?: boolean;
  isSpectator?: boolean;
}



export default function DiscussionPage() {
  const roomCode = getRoomCode();
  const callsign = getCallsign();
  const initialRoleId = getInitialRoleId();
  const role = ROLES.find((r) => r.id === initialRoleId) ?? ROLES.find((r) => r.id === "crew") ?? ROLES[0];
  const isAlien = role.team === "alien";
  const isChaotic = role.team === "chaotic";
  const accentColor = isAlien ? "hsl(0 75% 55%)" : isChaotic ? "hsl(300 70% 55%)" : "hsl(185 100% 50%)";
  const accentLight = isAlien ? "hsl(0 75% 70%)" : isChaotic ? "hsl(300 70% 70%)" : "hsl(185 100% 70%)";
  const accentGlow = isAlien ? "hsl(0 75% 55% / 0.4)" : isChaotic ? "hsl(300 70% 55% / 0.4)" : "hsl(185 100% 50% / 0.4)";
  const accentDim = isAlien ? "hsl(0 75% 55% / 0.12)" : isChaotic ? "hsl(300 70% 55% / 0.12)" : "hsl(185 100% 50% / 0.12)";
  const bgTint = isAlien ? "hsl(0 40% 6%)" : isChaotic ? "hsl(290 30% 6%)" : "hsl(200 30% 6%)";
  const bgOverlay = isAlien ? "hsl(0 35% 3% / 0.83)" : isChaotic ? "hsl(290 25% 3% / 0.83)" : "hsl(200 25% 3% / 0.83)";
  const [sessionPlayers, setSessionPlayers] = useState<LivePlayer[]>([]);
  const myPlayerId = sessionStorage.getItem("lp_playerId");
  const me = sessionPlayers.find((p) => myPlayerId ? p.playerId === myPlayerId : p.id === getSocket().id);
  const isSpectator = (!!me && !!me.isSpectator) || (initialRoleId === "spectator");
  const [orbitResultState, setOrbitResultState] = useState<{ type: string; data?: unknown } | null>(() => getOrbitResult());
  const [roleCounts, setRoleCounts] = useState<Record<string, number>>({});
  const [rolesAssigned, setRolesAssigned] = useState<Record<string, string>>({});
  const [initialRoles, setInitialRoles] = useState<Record<string, string>>({});
  const [roundSummary, setRoundSummary] = useState<{ abilityLog: { actorName: string; event: string }[] } | null>(null);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [musicOn, setMusicOn] = useState<boolean>(getSoundEnabled);
  const [isHost, setIsHost] = useState(() => sessionStorage.getItem("lp_isHost") === "true");

  const [evPopup, setEvPopup] = useState<{ callerName: string } | null>(null);
  const [evCast, setEvCast] = useState<"yes" | "no" | null>(null);
  const [evResult, setEvResult] = useState<{ passed: boolean; msg: string } | null>(null);
  const [cooldownLeft, setCooldownLeft] = useState<number>(0);
  const [evLoading, setEvLoading] = useState(false);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [roomCopyFeedback, setRoomCopyFeedback] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(120);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const typingTimeoutsRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Sync timer with session settings and server timestamp
  useEffect(() => {
    const socket = getSocket();
    const handlePhaseUpdate = (session: any) => {
      if (session.phase === "discussion" && session.discussionStartedAt) {
        const discussionTime = session.settings?.discussionTime ?? 120;
        const elapsed = Math.floor((Date.now() - session.discussionStartedAt) / 1000);
        setSecondsLeft(Math.max(0, discussionTime - elapsed));
      }
    };
    socket.on("phase_update", handlePhaseUpdate);
    
    // Initial sync
    socket.emit("get_session", { sessionId: roomCode }, (resp: any) => {
      if (resp.success && resp.session) {
        handlePhaseUpdate(resp.session);
      }
    });

    return () => {
      socket.off("phase_update", handlePhaseUpdate);
    };
  }, [roomCode]);

  useEffect(() => {
    const socket = getSocket();
    const onChatTyping = (evt: { gameId: string; username: string; isTyping: boolean }) => {
      if (evt.gameId !== roomCode) return;
      if (!evt.username) return;

      if (evt.isTyping) {
        setTypingUsers((prev) => (prev.includes(evt.username) ? prev : [...prev, evt.username]));
        const prevTimer = typingTimeoutsRef.current.get(evt.username);
        if (prevTimer) clearTimeout(prevTimer);
        const timer = setTimeout(() => {
          setTypingUsers((prev) => prev.filter((u) => u !== evt.username));
          typingTimeoutsRef.current.delete(evt.username);
        }, 2500);
        typingTimeoutsRef.current.set(evt.username, timer);
      } else {
        const prevTimer = typingTimeoutsRef.current.get(evt.username);
        if (prevTimer) clearTimeout(prevTimer);
        typingTimeoutsRef.current.delete(evt.username);
        setTypingUsers((prev) => prev.filter((u) => u !== evt.username));
      }
    };

    socket.on("chat_typing", onChatTyping);
    return () => {
      socket.off("chat_typing", onChatTyping);
      for (const timer of typingTimeoutsRef.current.values()) clearTimeout(timer);
      typingTimeoutsRef.current.clear();
    };
  }, [roomCode]);

  const handleCopyRoomCode = useCallback(() => {
    playSciFiClick();
    navigator.clipboard.writeText(roomCode).then(() => {
      setRoomCopyFeedback(true);
      setTimeout(() => setRoomCopyFeedback(false), 1400);
    }).catch(() => {
    });
  }, [roomCode]);

  function startCooldown() {
    setCooldownLeft(60);
    if (cooldownRef.current) clearInterval(cooldownRef.current);
    cooldownRef.current = setInterval(() => {
      setCooldownLeft((prev) => {
        if (prev <= 1) { clearInterval(cooldownRef.current!); return 0; }
        return prev - 1;
      });
    }, 1000);
  }

  useEffect(() => {
    const socket = getSocket();

    const handlePhaseUpdate = (session: { phase: string; players: LivePlayer[]; roleCounts?: Record<string, number>; rolesAssigned?: Record<string, string>; initialRoles?: Record<string, string>; roundSummary?: any }) => {
      const myPlayerId = sessionStorage.getItem("lp_playerId");
      const myId = socket.id;
      const players = session.players.map((p) => ({ ...p, isYou: myPlayerId ? p.playerId === myPlayerId : p.id === myId }));
      setSessionPlayers(players);
      
      const me = players.find((p) => p.isYou);
      if (me) {
        setIsHost(!!me.isHost);
      }

      if (session.roleCounts) setRoleCounts(session.roleCounts);
      if (session.rolesAssigned) setRolesAssigned(session.rolesAssigned);
      if (session.initialRoles) setInitialRoles(session.initialRoles);
      if (session.roundSummary) setRoundSummary(session.roundSummary);
      
      // GameShell handles phase navigation
    };

    const handleEmergencyVoteStarted = (data: { callerName: string }) => {
      playEmergencyVoteCalled();
      setEvCast(null);
      setEvResult(null);
      setEvPopup({ callerName: data.callerName });
    };

    const handleEmergencyVoteResult = (data: { passed: boolean }) => {
      setEvPopup(null);
      if (data.passed) {
        setEvResult({ passed: true, msg: "Emergency vote passed — initiating vote." });
      } else {
        setEvResult({ passed: false, msg: "Vote denied. 60-second cooldown active." });
        startCooldown();
      }
    };

    // Receive private ability result — delivered by the server when discussion phase begins
    const handleOrbitResult = (result: { type: string; data?: unknown }) => {
      setOrbitResultState(result);
      sessionStorage.setItem("lp_orbit_result", JSON.stringify(result));
    };

    socket.on("phase_update", handlePhaseUpdate);
    socket.on("emergency_vote_started", handleEmergencyVoteStarted);
    socket.on("emergency_vote_result", handleEmergencyVoteResult);
    socket.on("orbit_result", handleOrbitResult);

    // Shared sync function: fetches latest session and updates local state
    const syncSession = () => {
      socket.emit("get_session", { sessionId: roomCode }, (resp: { success: boolean; session?: { phase: string; players: LivePlayer[]; orbitFeedback?: Record<string, unknown>; roleCounts?: Record<string, number>; rolesAssigned?: Record<string, string>; initialRoles?: Record<string, string>; roundSummary?: any } }) => {
        if (resp.success && resp.session) {
          const myPlayerId = sessionStorage.getItem("lp_playerId");
          const myId = socket.id;
          if (resp.session.players) {
            setSessionPlayers(resp.session.players.map((p: LivePlayer) => ({ ...p, isYou: myPlayerId ? p.playerId === myPlayerId : p.id === myId })));
            const me = resp.session.players.find((p: LivePlayer) => myPlayerId ? p.playerId === myPlayerId : p.id === myId);
            if (me) setIsHost(me.isHost);
          }

          // Populate roles-in-play from session config
          if (resp.session.roleCounts) setRoleCounts(resp.session.roleCounts);
          if (resp.session.rolesAssigned) setRolesAssigned(resp.session.rolesAssigned);
          if (resp.session.initialRoles) setInitialRoles(resp.session.initialRoles);
        if (resp.session.roundSummary) setRoundSummary(resp.session.roundSummary);

          // Fallback: if orbit result wasn't received via socket, read from session
          if (!orbitResultState && myId && resp.session.orbitFeedback?.[myId]) {
            const fb = resp.session.orbitFeedback[myId] as { type: string; data?: unknown };
            setOrbitResultState(fb);
            sessionStorage.setItem("lp_orbit_result", JSON.stringify(fb));
          }
          // GameShell handles phase navigation
        }
      });
    };

    // Sync session on mount
    syncSession();

    // Periodic fallback: poll every 3 seconds so the UI stays in sync even when
    // phase_update socket events are missed (e.g. transport hiccups).
    const pollId = setInterval(syncSession, 3000);

    return () => {
      socket.off("phase_update", handlePhaseUpdate);
      socket.off("emergency_vote_started", handleEmergencyVoteStarted);
      socket.off("emergency_vote_result", handleEmergencyVoteResult);
      socket.off("orbit_result", handleOrbitResult);
      clearInterval(pollId);
    };
  }, [roomCode, orbitResultState]);

  const handleCallEmergencyVote = useCallback(() => {
    playSciFiClick();
    const socket = getSocket();
    setEvLoading(true);
    socket.emit("start_emergency_vote", { sessionId: roomCode }, (resp: { success: boolean; error?: string }) => {
      setEvLoading(false);
      if (!resp.success) {
        if (resp.error === "cooldown") {
          setEvResult({ passed: false, msg: "Cooldown active — cannot call yet." });
        }
      }
    });
  }, [roomCode]);

  const handleCastEmergencyVote = useCallback((vote: "yes" | "no") => {
    playSciFiClick();
    const socket = getSocket();
    setEvCast(vote);
    socket.emit("cast_emergency_vote", { sessionId: roomCode, vote });
  }, [roomCode]);

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

  // ── Render ────────────────────────────────────────────────────────────────
  if (isSpectator) {
    return (
      <div className="relative min-h-screen w-full flex flex-col ix-page-enter" style={{ background: "hsl(210 30% 6%)", color: "hsl(190 80% 90%)", overflow: "hidden" }}>
        <HamburgerMenu
          onShowSettings={() => setShowSettingsModal(true)}
          onShowProfile={() => setShowProfileModal(true)}
          onShowHowToPlay={() => {}}
          musicOn={musicOn}
          onToggleMusic={handleToggleMusic}
          playSound={playSciFiClick}
          showQuitButton
          isHost={isHost}
          onRestartRound={handleRestartRound}
        />
        <SettingsModal isOpen={showSettingsModal} onClose={() => setShowSettingsModal(false)} />
        <ProfileModal isOpen={showProfileModal} onClose={() => setShowProfileModal(false)} />

        {/* Header Bar */}
        <div className="w-full px-4 sm:px-6 py-4 flex items-center justify-between border-b shrink-0" style={{ background: "hsl(220 28% 5%)", borderColor: "hsl(185 100% 50% / 0.2)", boxShadow: "0 4px 20px rgba(0,0,0,0.4)" }}>
          <div className="flex items-center gap-4">
            <div className="w-3 h-3 rounded-full bg-cyan-500 animate-pulse shadow-[0_0_10px_hsl(185,100%,50%)]" />
            <div className="font-orbitron font-black text-xl tracking-[0.25em] uppercase leading-none" style={{ color: "hsl(185 100% 70%)" }}>
              INTEL HUB: OBSERVATION MODE
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] tracking-[0.3em] uppercase mb-1 text-cyan-600">Syncing Discussion</div>
            <div className="font-orbitron font-bold text-lg tracking-widest" style={{ color: "hsl(185 100% 70%)" }}>
              {Math.floor(secondsLeft / 60)}:{(secondsLeft % 60).toString().padStart(2, '0')}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-10">
          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
            
            {/* Left Column: Ability Intel */}
            <div className="lg:col-span-5 flex flex-col gap-6">
              <div>
                <h3 className="font-orbitron text-xs tracking-[0.4em] uppercase mb-4 flex items-center gap-2" style={{ color: "hsl(270 70% 60%)" }}>
                  <span className="w-1.5 h-1.5 bg-purple-500 rounded-full" />
                  Ability Intel Log
                </h3>
                <div className="rounded-xl p-5 space-y-3" style={{ background: "hsl(220 28% 9%)", border: "1px solid hsl(270 50% 30% / 0.3)", boxShadow: "inset 0 0 20px rgba(0,0,0,0.5)" }}>
                  {roundSummary && roundSummary.abilityLog.filter(e => {
                    const actor = sessionPlayers.find(p => p.name === e.actorName);
                    return !actor?.isSpectator;
                  }).length > 0 ? (
                    roundSummary.abilityLog
                      .filter(e => {
                        const actor = sessionPlayers.find(p => p.name === e.actorName);
                        return !actor?.isSpectator;
                      })
                      .map((entry, idx) => (
                      <div key={idx} className="flex gap-4 p-3 rounded-lg border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] transition-colors">
                        <span className="font-orbitron text-xs font-black text-purple-500/60 mt-0.5">{String(idx + 1).padStart(2, '0')}</span>
                        <div className="text-sm leading-relaxed">
                          <span className="font-bold text-cyan-400 uppercase tracking-wider text-xs">{entry.actorName}</span>
                          <span className="text-white/60 ml-2 font-light" style={{ fontFamily: "'Exo 2', sans-serif" }}>{entry.event}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-8 text-center text-white/20 font-orbitron text-[10px] tracking-widest uppercase">
                      No active abilities recorded
                    </div>
                  )}
                </div>
              </div>

              {/* Roles in play */}
              {Object.keys(roleCounts).length > 0 && (
                <div>
                  <h3 className="font-orbitron text-xs tracking-[0.4em] uppercase mb-4 flex items-center gap-2" style={{ color: "hsl(210 30% 50%)" }}>
                    <span className="w-1.5 h-1.5 bg-cyan-500/50 rounded-full" />
                    Roles in Field
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(roleCounts)
                      .filter(([roleId, count]) => count > 0 && roleId !== "spectator")
                      .map(([roleId, count]) => {
                        const r = ROLES.find(x => x.id === roleId);
                        const teamColor = r?.team === "alien" ? "hsl(0 75% 60%)" : r?.team === "chaotic" ? "hsl(300 70% 65%)" : "hsl(185 100% 55%)";
                        return (
                          <div key={roleId} className="flex items-center gap-2 px-3 py-1.5 rounded-full border bg-white/[0.03]" style={{ borderColor: teamColor + "33" }}>
                            <span className="font-orbitron text-[10px] font-bold uppercase tracking-widest" style={{ color: teamColor }}>{r?.name ?? roleId}</span>
                            <span className="text-[10px] text-white/30 font-bold">×{count}</span>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Player Manifest */}
            <div className="lg:col-span-7 flex flex-col gap-6">
              <h3 className="font-orbitron text-xs tracking-[0.4em] uppercase mb-4 flex items-center gap-2" style={{ color: "hsl(185 100% 50%)" }}>
                <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full" />
                Biometric Manifest — {sessionPlayers.filter(p => !p.isSpectator).length} Active Subjects
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {sessionPlayers.filter(p => !p.isSpectator).map((p) => {
                  const roleId = rolesAssigned[p.id];
                  const initRoleId = initialRoles[p.id];
                  const r = ROLES.find(x => x.id === roleId);
                  const initR = ROLES.find(x => x.id === initRoleId);
                  const roleChanged = initRoleId && roleId !== initRoleId;
                  const teamColor = r?.team === "alien" ? "hsl(0 75% 60%)" : r?.team === "chaotic" ? "hsl(300 70% 65%)" : "hsl(185 100% 65%)";

                  return (
                    <div key={p.id} className="p-4 rounded-xl border relative overflow-hidden group" style={{ background: "hsl(220 28% 8%)", borderColor: "white/10" }}>
                      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
                      
                      <div className="flex items-center gap-4 relative z-10">
                        {r && (
                          <img src={r.image} alt={r.name} className="w-10 h-10 rounded-lg object-cover border border-white/10" />
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="font-orbitron text-xs font-black text-white/90 tracking-widest uppercase truncate">{p.name}</div>
                          <div className="flex items-center gap-1.5 mt-1">
                            <span className="font-orbitron text-[9px] font-black uppercase tracking-tighter" style={{ color: teamColor }}>
                              {initR?.name?.toUpperCase() ?? "UNKNOWN"}
                            </span>
                            {roleChanged && (
                              <>
                                <span className="text-[9px] text-white/20">→</span>
                                <span className="font-orbitron text-[9px] font-black uppercase tracking-tighter text-white" style={{ background: teamColor, padding: '0 4px', borderRadius: '2px' }}>
                                  {r?.name?.toUpperCase() ?? "UNKNOWN"}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Observer Status */}
              <div className="mt-auto pt-10">
                <div className="p-6 rounded-2xl border border-dashed border-white/10 bg-white/[0.01] text-center">
                  <div className="font-orbitron text-[10px] tracking-[0.5em] uppercase text-white/20 mb-2">Neural Observation Protocol</div>
                  <p className="text-xs text-white/40 leading-relaxed max-w-sm mx-auto italic" style={{ fontFamily: "'Exo 2', sans-serif" }}>
                    You are currently out of phase with the crew. <br />
                    Direct interaction is suspended until the mission concludes.
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    );
  }

  const abilityResultText = renderOrbitResultSummary(orbitResultState, accentLight, role.id);

  return (
    <div
      className={`relative min-h-screen w-full flex flex-col ${isAlien ? "ix-glitch-bg" : ""}`}
      style={{
        backgroundImage: `linear-gradient(${bgOverlay}, ${bgOverlay}), url('${import.meta.env.BASE_URL}moon-phases.webp')`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
        color: "hsl(190 80% 90%)",
      }}
    >
      {/* Alien Corruption Overlays */}
      {isAlien && (
        <div className="absolute inset-0 pointer-events-none z-0">
          <div className="absolute inset-0 opacity-20 mix-blend-overlay" style={{ background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,0,0,0.2) 2px, rgba(255,0,0,0.2) 4px)" }} />
          <div className="absolute top-1/4 left-10 opacity-[0.03] font-mono text-8xl text-red-500 font-bold rotate-12 select-none tracking-[0.5em] uppercase">INFEST</div>
          <div className="absolute bottom-1/4 right-10 opacity-[0.03] font-mono text-8xl text-red-500 font-bold -rotate-12 select-none tracking-[0.5em] uppercase">CONSUME</div>
        </div>
      )}
      
      <div className="relative z-10 flex flex-col flex-1 h-full">
      {/* Hamburger Menu */}
      <HamburgerMenu
        onShowSettings={() => setShowSettingsModal(true)}
        onShowProfile={() => setShowProfileModal(true)}
        onShowHowToPlay={() => {}} // No how to play in discussion
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
        style={{ background: "hsl(220 28% 7%)", borderColor: accentColor.replace(")", " / 0.25)"), boxShadow: `0 1px 12px ${accentGlow.replace("0.4", "0.1")}` }}
      >
        <div>
          <div className="font-orbitron font-black text-lg tracking-widest uppercase leading-none" style={{ color: accentLight, textShadow: `0 0 12px ${accentGlow}` }}>
            ERROR: NEWFORM
          </div>
          <div className="font-orbitron font-bold text-xs tracking-[0.3em] uppercase" style={{ color: "hsl(270 80% 65%)" }}>
            DETECTED
          </div>
          <button
            onClick={handleCopyRoomCode}
            className="mt-1 text-[10px] tracking-[0.22em] uppercase rounded border px-2 py-0.5 lg:hidden"
            style={{
              color: roomCopyFeedback ? "hsl(140 70% 62%)" : "hsl(185 100% 66%)",
              borderColor: roomCopyFeedback ? "hsl(140 60% 45% / 0.45)" : "hsl(185 100% 50% / 0.35)",
              background: "hsl(220 28% 9%)",
            }}
          >
            {roomCopyFeedback ? "CODE COPIED" : `ROOM ${roomCode}`}
          </button>
        </div>
        <div className="text-right">
          <div className="text-xs tracking-widest uppercase mb-1 flex items-center justify-end gap-2" style={{ color: "hsl(210 30% 50%)" }}>
            Phase
            <span className={`font-mono ${secondsLeft <= 10 && secondsLeft > 0 ? 'animate-heartbeat text-red-500 font-bold' : secondsLeft === 0 ? 'text-red-500 font-bold' : 'text-[hsl(210,30%,70%)]'}`}>
              {Math.floor(secondsLeft / 60)}:{(secondsLeft % 60).toString().padStart(2, '0')}
            </span>
          </div>
          <div className="font-orbitron font-bold text-sm tracking-[0.2em]" style={{ color: accentLight }}>
            DELIBERATION
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col px-6 py-6 gap-5 overflow-y-auto pb-32 lg:pb-8 max-w-2xl mx-auto w-full">

        {/* Phase title + role */}
        <div className="flex items-center gap-4">
          <div className="relative shrink-0">
            <img
              src={role.image}
              alt={role.name}
              className="w-16 h-16 rounded-md object-cover"
              loading="lazy"
              style={{ border: `1px solid ${accentColor.replace(")", " / 0.4)")}` }}
            />
            {/* Wing icon with silver shine */}
            <WingIcon accentColor={accentColor} />
          </div>
          <div>
            <div className="font-orbitron font-black text-2xl tracking-widest uppercase" style={{ color: accentLight, textShadow: `0 0 12px ${accentGlow}` }}>
              DELIBERATION
            </div>
            <div className="text-xs tracking-widest uppercase mt-0.5" style={{ color: "hsl(210 30% 50%)" }}>
              YOUR INITIAL ROLE: <span className="font-orbitron font-bold" style={{ color: accentLight }}>{role.name.toUpperCase()}</span>
            </div>
            <div className="text-xs tracking-widest uppercase mt-0.5" style={{ color: "hsl(210 30% 40%)" }}>
              CALLSIGN: {callsign}
            </div>
          </div>
        </div>

        {/* Private ability result */}
        <div className="rounded-md p-4" style={{ background: accentDim, border: `1px solid ${accentColor.replace(")", " / 0.3)")}` }}>
          <div className="font-orbitron text-xs tracking-[0.25em] uppercase mb-3 font-bold" style={{ color: accentLight }}>
            ABILITY USED
          </div>
          {abilityResultText}
        </div>

        {/* Roles in Play — same for all players, no identity info */}
        {Object.keys(roleCounts).length > 0 && (
          <div className="rounded-md p-4" style={{ background: "hsl(220 28% 9%)", border: "1px solid hsl(210 30% 15%)" }}>
            <div className="font-orbitron text-xs tracking-[0.25em] uppercase mb-3 font-bold" style={{ color: "hsl(210 30% 50%)" }}>
              ROLES IN PLAY
            </div>
            <div className="flex flex-wrap gap-2">
              {Object.entries(roleCounts)
                .filter(([, count]) => count > 0)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([roleId, count]) => {
                  const r = ROLES.find((x) => x.id === roleId);
                  const teamColor =
                    r?.team === "alien" ? "hsl(0 75% 60%)" :
                    r?.team === "chaotic" ? "hsl(300 70% 65%)" :
                    "hsl(185 100% 55%)";
                  return (
                    <div
                      key={roleId}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded team-badge ${r?.team}-color`}
                      style={{ background: "hsl(220 28% 12%)", border: `1px solid ${teamColor.replace(")", " / 0.3)")}` }}
                    >
                      <span className="font-orbitron text-xs tracking-wider uppercase" style={{ color: teamColor }}>
                        {r?.name ?? roleId}
                      </span>
                      {count > 1 && (
                        <span className="text-xs font-bold" style={{ color: "hsl(210 30% 50%)", fontFamily: "'Exo 2', sans-serif" }}>
                          ×{count}
                        </span>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* Player list */}
        <div className="rounded-md p-4" style={{ background: "hsl(220 28% 9%)", border: "1px solid hsl(210 30% 15%)" }}>
          <div className="font-orbitron text-xs tracking-[0.25em] uppercase mb-3 font-bold" style={{ color: "hsl(210 30% 50%)" }}>
            CREW MANIFEST — {sessionPlayers.filter(p => !p.isSpectator).length} ABOARD
          </div>
          <div className="flex flex-col gap-2">
            {sessionPlayers.filter(p => !p.isSpectator).map((p) => {
              const isTyping = typingUsers.includes(p.name);
              return (
              <div
                key={p.id}
                className="flex items-center justify-between px-3 py-2 rounded relative"
                style={{ background: "hsl(220 28% 12%)", border: p.isYou ? `1px solid ${accentColor.replace(")", " / 0.5)")}` : "1px solid hsl(210 30% 16%)" }}
              >
                <div className="flex items-center gap-2 relative">
                  {isTyping && (
                    <span className="absolute left-[-20px] text-[10px] text-cyan-400 ix-typing-dots">
                      <span>.</span><span>.</span><span>.</span>
                    </span>
                  )}
                  <span className="font-orbitron text-sm tracking-wider uppercase" style={{ color: p.isYou ? accentLight : "hsl(190 60% 75%)" }}>
                    {p.name}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {p.isYou && (
                    <span className="text-xs tracking-widest uppercase" style={{ color: "hsl(210 30% 40%)" }}>YOU</span>
                  )}
                </div>
              </div>
            )})}
          </div>
        </div>

        {/* Emergency vote result notice */}
        {evResult && (
          <div
            className="rounded-md px-4 py-3 text-center"
            style={{
              background: evResult.passed ? "hsl(140 60% 8%)" : "hsl(0 50% 8%)",
              border: `1px solid ${evResult.passed ? "hsl(140 70% 30%)" : "hsl(0 60% 30%)"}`,
            }}
          >
            <div className="font-orbitron text-xs tracking-[0.25em] uppercase font-bold" style={{ color: evResult.passed ? "hsl(140 70% 55%)" : "hsl(0 75% 60%)" }}>
              {evResult.msg}
            </div>
            {!evResult.passed && cooldownLeft > 0 && (
              <div className="mt-1 text-xs" style={{ color: "hsl(210 30% 45%)", fontFamily: "'Exo 2', sans-serif" }}>
                Cooldown: {cooldownLeft}s
              </div>
            )}
          </div>
        )}

        {/* Emergency vote button */}
        {!isSpectator && (
          <button
            data-testid="button-emergency-vote"
            onClick={handleCallEmergencyVote}
            disabled={evLoading || cooldownLeft > 0 || !!evPopup}
            className="w-full py-2.5 font-orbitron font-bold text-xs tracking-[0.2em] uppercase rounded-md border transition-all duration-150 cursor-pointer"
            style={{
              background: (cooldownLeft > 0 || !!evPopup) ? "hsl(220 28% 8%)" : "hsl(0 60% 20% / 0.8)",
              borderColor: (cooldownLeft > 0 || !!evPopup) ? "hsl(210 30% 18%)" : "hsl(0 75% 55%)",
              color: (cooldownLeft > 0 || !!evPopup) ? "hsl(210 30% 35%)" : "hsl(0 75% 70%)",
              cursor: (cooldownLeft > 0 || !!evPopup) ? "not-allowed" : "pointer",
              boxShadow: (cooldownLeft > 0 || !!evPopup) ? "none" : "0 0 8px hsl(0 75% 55% / 0.3)",
            }}
          >
            {cooldownLeft > 0 ? `EMERGENCY VOTE (${cooldownLeft}s)` : "EMERGENCY VOTE"}
          </button>
        )}

      </div>

      {/* Emergency vote popup */}
      {!isSpectator && evPopup && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 px-6"
          style={{ background: "hsl(220 28% 4% / 0.85)" }}
        >
          <div
            className="w-full max-w-sm rounded-lg p-6 flex flex-col gap-5"
            style={{ background: "hsl(220 28% 10%)", border: "2px solid hsl(0 75% 55%)", boxShadow: "0 0 32px hsl(0 75% 55% / 0.3)" }}
          >
            <div className="text-center">
              <div className="font-orbitron font-black text-lg tracking-[0.2em] uppercase mb-2" style={{ color: "hsl(0 75% 70%)" }}>
                EMERGENCY VOTE
              </div>
              <div className="text-sm" style={{ color: "hsl(190 60% 78%)", fontFamily: "'Exo 2', sans-serif" }}>
                <span className="font-bold" style={{ color: "hsl(0 75% 70%)" }}>{evPopup.callerName}</span> has called for an Emergency Vote.
              </div>
              <div className="mt-2 text-xs tracking-wider" style={{ color: "hsl(210 30% 45%)", fontFamily: "'Exo 2', sans-serif" }}>
                40% YES required to proceed to voting immediately.
              </div>
            </div>

            {evCast === null ? (
              <div className="flex gap-3">
                <button
                  onClick={() => handleCastEmergencyVote("yes")}
                  className="flex-1 py-4 font-orbitron font-bold text-sm tracking-[0.25em] uppercase rounded-md border-2 transition-all duration-150 cursor-pointer"
                  style={{ background: "hsl(140 60% 12%)", borderColor: "hsl(140 70% 45%)", color: "hsl(140 70% 60%)" }}
                >
                  YES
                </button>
                <button
                  onClick={() => handleCastEmergencyVote("no")}
                  className="flex-1 py-4 font-orbitron font-bold text-sm tracking-[0.25em] uppercase rounded-md border-2 transition-all duration-150 cursor-pointer"
                  style={{ background: "hsl(0 50% 12%)", borderColor: "hsl(0 60% 45%)", color: "hsl(0 70% 60%)" }}
                >
                  NO
                </button>
              </div>
            ) : (
              <div className="text-center font-orbitron text-sm tracking-[0.2em] uppercase" style={{ color: "hsl(210 30% 50%)" }}>
                VOTE CAST: <span style={{ color: evCast === "yes" ? "hsl(140 70% 60%)" : "hsl(0 70% 60%)" }}>{evCast.toUpperCase()}</span>. Waiting for others...
              </div>
            )}
          </div>
        </div>
      )}

      {/* Shine animation style */}
      <style>{`
        @keyframes wing-shine {
          0%, 100% { opacity: 0; transform: translateX(-100%) skewX(-15deg); }
          40%, 60% { opacity: 0.35; }
          50% { transform: translateX(200%) skewX(-15deg); }
        }
        .wing-shine { animation: wing-shine 4s ease-in-out infinite; }
      `}</style>
      </div>
    </div>
  );
}

// Wing icon with looping silver shine
function WingIcon({ accentColor }: { accentColor: string }) {
  return (
    <div
      className="absolute -bottom-1 -right-1 w-5 h-5 rounded overflow-hidden"
      style={{ background: "hsl(220 28% 12%)", border: `1px solid ${accentColor.replace(")", " / 0.4)")}` }}
      title="Orbit complete"
    >
      <svg viewBox="0 0 20 20" fill="none" className="w-full h-full p-1">
        <path d="M3 10 Q10 3 17 10 Q10 17 3 10Z" fill="hsl(210 20% 55% / 0.6)" />
        <path d="M10 5 L10 15" stroke="hsl(210 30% 70% / 0.4)" strokeWidth="1" />
      </svg>
      <div
        className="wing-shine absolute inset-0"
        style={{ background: "linear-gradient(90deg, transparent, hsl(210 40% 90% / 0.5), transparent)", width: "60%", top: 0, bottom: 0 }}
      />
    </div>
  );
}

// Renders a short summary of the private orbit result for discussion display.
// Every case must use first-person "You" language. No fallback catch-all text.
function renderOrbitResultSummary(
  result: { type: string; data?: unknown } | null,
  accentLight: string,
  roleId?: string,
): React.ReactNode {
  const muted: React.CSSProperties = { color: "hsl(210 30% 50%)", fontFamily: "'Exo 2', sans-serif" };
  const info: React.CSSProperties = { color: "hsl(190 60% 78%)", fontFamily: "'Exo 2', sans-serif" };
  const warn: React.CSSProperties = { color: "hsl(45 80% 65%)", fontFamily: "'Exo 2', sans-serif" };
  const good: React.CSSProperties = { color: "hsl(140 70% 60%)", fontFamily: "'Exo 2', sans-serif" };

  // Virus and Router act during Role Reveal, not during Orbit
  if (roleId === "virus") {
    if (result?.type === "virus_result") {
      const d = result.data as Record<string, unknown>;
      return <p className="text-sm" style={info}>You used <strong>Packet Loss</strong> on {String(d?.targetName ?? "a player")}. They cannot see player identities this round.</p>;
    }
    if (result?.type === "skipped") {
      return <p className="text-sm" style={muted}>You chose not to use <strong>Packet Loss</strong> this round.</p>;
    }
    return <p className="text-sm" style={info}>You used <strong>Packet Loss</strong> during the Role Reveal phase.</p>;
  }
  if (roleId === "router") {
    if (result?.type === "router_result") {
      const d = result.data as Record<string, unknown>;
      return <p className="text-sm" style={info}>You used <strong>Gateway Hijack</strong>. {String(d?.sourceName ?? "The Source")}'s ability was redirected to {String(d?.destName ?? "the Destination")}.</p>;
    }
    if (result?.type === "skipped") {
      return <p className="text-sm" style={muted}>You chose not to use <strong>Gateway Hijack</strong> this round.</p>;
    }
    return <p className="text-sm" style={info}>You used <strong>Gateway Hijack</strong> during the Role Reveal phase.</p>;
  }

  if (!result || result.type === "no_ability") {
    return <p className="text-sm" style={muted}>You have no active ability — you observed the orbit phase.</p>;
  }

  if (result.type === "passive") {
    return <p className="text-sm" style={muted}>Your ability is passive — no orbit action was required from you.</p>;
  }

  if (result.type === "no_action") {
    return <p className="text-sm" style={warn}>You did not submit an action before the phase ended.</p>;
  }

  if (result.type === "skipped") {
    return <p className="text-sm" style={muted}>You chose not to use your ability this orbit.</p>;
  }

  const d = result.data as Record<string, unknown> | undefined;

  switch (result.type) {
    case "blocked":
      return <p className="text-sm leading-relaxed" style={warn}>Your ability was blocked — it did not take effect.</p>;

    case "disrupt_ineffective":
      return <p className="text-sm leading-relaxed" style={warn}>Your block attempt failed — that target cannot be blocked.</p>;

    case "disrupt_success":
      return (
        <p className="text-sm leading-relaxed" style={good}>
          You successfully blocked <span className="font-bold" style={{ color: accentLight }}>{String(d?.targetName ?? "the target")}</span>'s ability.
        </p>
      );

    case "scan_player":
      return (
        <p className="text-sm" style={info}>
          You scanned <span className="font-bold" style={{ color: accentLight }}>{String(d?.targetName ?? "target")}</span> — their initial role was{" "}
          <span className="font-bold" style={{ color: accentLight }}>{String(d?.roleId ?? "unknown").toUpperCase()}</span>.
        </p>
      );

    case "scan_deck":
      return (
        <p className="text-sm" style={info}>
          You scanned the central deck. Roles found:{" "}
          <span className="font-bold" style={{ color: accentLight }}>
            {((d?.roles as string[]) ?? []).join(", ").toUpperCase()}
          </span>.
        </p>
      );

    case "alien_view":
      return (
        <p className="text-sm" style={info}>
          You viewed center card {Number(d?.cardIndex ?? 0) + 1} — it contained{" "}
          <span className="font-bold" style={{ color: accentLight }}>{String(d?.roleId ?? "unknown").toUpperCase()}</span>.
        </p>
      );

    case "seek_result":
      return (
        <p className="text-sm" style={info}>
          You checked <span className="font-bold" style={{ color: accentLight }}>{String(d?.targetName ?? "target")}</span> — they are{" "}
          <span className="font-bold" style={{ color: d?.alignment === "Bad" ? "hsl(0 75% 60%)" : "hsl(140 70% 55%)" }}>
            {String(d?.alignment ?? "unknown").toUpperCase()}
          </span>.
        </p>
      );

    case "sentinel_report": {
      const actions = (d?.actions as string[]) ?? [];
      return (
        <p className="text-sm" style={info}>
          You observed <span className="font-bold" style={{ color: accentLight }}>{String(d?.targetName ?? "target")}</span>:{" "}
          {actions.length > 0 ? actions.join("; ") : "no actions affected them this orbit"}.
        </p>
      );
    }

    case "commander_boost":
      return (
        <p className="text-sm leading-relaxed" style={good}>
          You activated your command authority — your vote counts as <span className="font-bold">×2</span> this round.
        </p>
      );

    case "warper_swap":
      return (
        <p className="text-sm" style={good}>
          You swapped the roles of{" "}
          <span className="font-bold" style={{ color: accentLight }}>{String(d?.playerAName ?? "Player A")}</span>
          {" "}and{" "}
          <span className="font-bold" style={{ color: accentLight }}>{String(d?.playerBName ?? "Player B")}</span>.
        </p>
      );

    case "shifter_exchange":
      return (
        <p className="text-sm" style={good}>
          You exchanged roles with{" "}
          <span className="font-bold" style={{ color: accentLight }}>{String(d?.targetName ?? "a player")}</span>.
          {" "}You are now the{" "}
          <span className="font-bold" style={{ color: accentLight }}>{String(d?.acquiredRole ?? "unknown")}</span>.
        </p>
      );

    default:
      return <p className="text-sm" style={warn}>Your ability result was recorded.</p>;
  }
}

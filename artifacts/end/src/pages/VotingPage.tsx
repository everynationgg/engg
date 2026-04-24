import { useState, useEffect, useCallback, useRef } from "react";
import { getSocket } from "@/lib/socket";
import { ROLES } from "@/data/roles";
import { playSciFiClick, playMechanicalChunk } from "@/lib/sound";
import { getSoundEnabled, setSoundEnabled, startLobbyMusic, stopLobbyMusic } from "@/lib/music";
import { isPlayerConnected } from "@/lib/utils";
import HamburgerMenu from "@/components/HamburgerMenu";
import SettingsModal from "@/components/SettingsModal";
import ProfileModal from "@/components/ProfileModal";
import HolographicCard from "@/components/HolographicCard";

interface LivePlayer {
  id: string;
  name: string;
  isHost: boolean;
  isYou?: boolean;
  playerId?: string;
  connected?: boolean;
  connectionStatus?: "connected" | "reconnecting" | "disconnected";
  alive?: boolean;
  isSpectator?: boolean;
}

function getRoomCode(): string {
  return sessionStorage.getItem("lp_roomCode") || "------";
}
function getInitialRoleId(): string {
  return sessionStorage.getItem("lp_assignedRole") || "crew";
}

export default function VotingPage() {
  const roomCode = getRoomCode();
  const initialRoleId = getInitialRoleId();
  const role = ROLES.find((r) => r.id === initialRoleId) ?? ROLES.find((r) => r.id === "crew") ?? ROLES[0];

  const isAlien = role.team === "alien";
  const isChaotic = role.team === "chaotic";
  const accentColor = isAlien ? "hsl(0 75% 55%)" : isChaotic ? "hsl(300 70% 55%)" : "hsl(185 100% 50%)";
  const accentLight = isAlien ? "hsl(0 75% 70%)" : isChaotic ? "hsl(300 70% 70%)" : "hsl(185 100% 70%)";
  const accentGlow = isAlien ? "hsl(0 75% 55% / 0.4)" : isChaotic ? "hsl(300 70% 55% / 0.4)" : "hsl(185 100% 50% / 0.4)";
  const bgTint = isAlien ? "hsl(0 40% 6%)" : isChaotic ? "hsl(290 30% 6%)" : "hsl(200 30% 6%)";

  
  const [sessionPlayers, setSessionPlayers] = useState<LivePlayer[]>([]);
  const [votedFor, setVotedFor] = useState<string | null>(null);
  const [pendingVote, setPendingVote] = useState<string | null>(null);
  const [waitingCount, setWaitingCount] = useState<number>(0);
  const [voterIds, setVoterIds] = useState<Set<string>>(new Set());
  const [votes, setVotes] = useState<Record<string, string>>({});
  const [myId, setMyId] = useState<string>("");
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [musicOn, setMusicOn] = useState<boolean>(getSoundEnabled);
  const [roomCopyFeedback, setRoomCopyFeedback] = useState(false);
  const [isHost, setIsHost] = useState(() => sessionStorage.getItem("lp_isHost") === "true");
  const [isSpectator, setIsSpectator] = useState(() => {
    const role = sessionStorage.getItem("lp_assignedRole");
    return role === "spectator" || role === "Spectator";
  });
  const [secondsLeft, setSecondsLeft] = useState(60);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const typingTimeoutsRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const [roundSummary, setRoundSummary] = useState<{ voteTally: { voterName: string; targetName: string; isAbstain: boolean }[] } | null>(null);

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
      if (session.phase === "voting" && session.votingStartedAt) {
        const votingTime = session.settings?.votingTime ?? 60;
        const elapsed = Math.floor((Date.now() - session.votingStartedAt) / 1000);
        setSecondsLeft(Math.max(0, votingTime - elapsed));
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

  useEffect(() => {
    const socket = getSocket();
    setMyId(socket.id ?? "");

    const handlePhaseUpdate = (session: { phase: string; players: LivePlayer[]; votes?: Record<string, string>; roundSummary?: any }) => {
      const myPlayerId = sessionStorage.getItem("lp_playerId");
      const myId = socket.id;
      const players = session.players.map((p) => ({ ...p, isYou: myPlayerId ? p.playerId === myPlayerId : p.id === myId }));
      setSessionPlayers(players);

      const me = players.find((p) => p.isYou);
      if (me) {
        setIsHost(!!me.isHost);
        setIsSpectator(!!me.isSpectator);
      }

      if (session.votes) {
        setWaitingCount(Object.keys(session.votes).length);
        setVoterIds(new Set(Object.keys(session.votes)));
        setVotes(session.votes);
      }
      if (session.roundSummary) setRoundSummary(session.roundSummary);
      // GameShell handles phase navigation
    };

    socket.on("phase_update", handlePhaseUpdate);

    // Shared sync function: fetches latest session and updates local state
    const syncSession = () => {
      socket.emit("get_session", { sessionId: roomCode }, (resp: { success: boolean; session?: { phase: string; players: LivePlayer[]; votes?: Record<string, string>; roundSummary?: any } }) => {
        if (resp.success && resp.session) {
          const myPlayerId = sessionStorage.getItem("lp_playerId");
          const id = socket.id;
          if (resp.session.players) {
            setSessionPlayers(resp.session.players.map((p: LivePlayer) => ({ ...p, isYou: myPlayerId ? p.playerId === myPlayerId : p.id === id })));
            const me = resp.session.players.find((p: LivePlayer) => myPlayerId ? p.playerId === myPlayerId : p.id === id);
            if (me) setIsHost(me.isHost);
          }
          if (resp.session.votes) {
            setWaitingCount(Object.keys(resp.session.votes).length);
            setVoterIds(new Set(Object.keys(resp.session.votes)));
            setVotes(resp.session.votes);
            if (resp.session.votes[id ?? ""]) setVotedFor(resp.session.votes[id ?? ""]);
          }
          // GameShell handles phase navigation
        }
      });
    };

    // Initial fetch
    syncSession();

    // Periodic fallback: poll every 3 seconds so the UI stays in sync even when
    // phase_update socket events are missed (e.g. transport hiccups).
    const pollId = setInterval(syncSession, 3000);

    return () => {
      socket.off("phase_update", handlePhaseUpdate);
      clearInterval(pollId);
    };
  }, [roomCode]);


  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleVote = (targetId: string) => {
    if (votedFor || (targetId !== "abstain" && targetId === myId) || isSpectator) return;
    const socket = getSocket();
    setVotedFor(targetId);
    playMechanicalChunk();
    socket.emit("cast_vote", { sessionId: roomCode, targetId });
  };

  const handleAbstain = () => {
    if (votedFor || isSpectator) return;
    handleVote("abstain");
  };

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

  const handleRestartRound = useCallback(() => {
    const socket = getSocket();
    socket.emit("restart_game", { sessionId: roomCode }, (resp: { success: boolean; error?: string }) => {
      if (!resp.success) {
        console.error("Restart failed:", resp.error);
      }
    });
  }, [roomCode]);

  const activePlayers = sessionPlayers.filter(p => isPlayerConnected(p) && !p.isSpectator);
  const totalPlayers = activePlayers.length;
  const votesIn = waitingCount;
  const pendingVoters = activePlayers.filter((p) => !voterIds.has(p.id));

  // Determine who has the most votes for the Heartbeat Tension effect
  const [leadingVoteGetters, setLeadingVoteGetters] = useState<Set<string>>(new Set());
  
  useEffect(() => {
    const socket = getSocket();
    const handlePhaseUpdate = (session: any) => {
      if (session.votes) {
        const counts: Record<string, number> = {};
        for (const target of Object.values(session.votes) as string[]) {
          if (target !== "abstain") {
            counts[target] = (counts[target] || 0) + 1;
          }
        }
        let maxVotes = 0;
        let leaders = new Set<string>();
        for (const [id, count] of Object.entries(counts)) {
          if (count > maxVotes) {
            maxVotes = count;
            leaders = new Set([id]);
          } else if (count === maxVotes && maxVotes > 0) {
            leaders.add(id);
          }
        }
        setLeadingVoteGetters(leaders);
        
        // Dynamic Vignette for the person receiving the most votes
        const vignette = document.getElementById("tension-vignette");
        if (vignette) {
          if (leaders.has(myId)) {
            vignette.style.opacity = "1";
          } else {
            vignette.style.opacity = "0";
          }
        }
      }
    };
    
    socket.on("phase_update", handlePhaseUpdate);
    return () => {
      socket.off("phase_update", handlePhaseUpdate);
      const vignette = document.getElementById("tension-vignette");
      if (vignette) vignette.style.opacity = "0";
    };
  }, [myId]);

  if (isSpectator) {
    return (
      <div className="flex flex-col min-h-screen w-full relative overflow-hidden" style={{ background: "hsl(210 30% 6%)", color: "hsl(185 100% 70%)" }}>
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
        
        {/* Header */}
        <div className="w-full px-4 sm:px-6 py-4 flex items-center justify-between border-b shrink-0" style={{ background: "hsl(220 28% 5%)", borderColor: "hsl(185 100% 50% / 0.2)" }}>
          <div className="flex items-center gap-4">
            <div className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse" />
            <div className="font-orbitron font-black text-lg tracking-[0.3em] uppercase leading-none">
              CONSENSUS MONITORING
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] tracking-[0.3em] uppercase mb-1 text-cyan-600">Syncing Votes</div>
            <div className="font-orbitron font-bold text-lg tracking-widest text-white/90">
              {Math.floor(secondsLeft / 60)}:{(secondsLeft % 60).toString().padStart(2, '0')}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-10">
          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
            
            {/* Left Column: Live Vote Tally */}
            <div className="lg:col-span-5 flex flex-col gap-6">
              <h3 className="font-orbitron text-[10px] tracking-[0.4em] uppercase mb-2 text-white/40 flex items-center gap-2">
                <span className="w-1 h-1 bg-white/40 rounded-full" />
                Live Transmission
              </h3>
              <div className="rounded-2xl p-5 space-y-3" style={{ background: "hsl(220 28% 9%)", border: "1px solid white/5" }}>
                {Object.keys(votes).length > 0 ? (
                  Object.entries(votes).map(([voterId, targetId], idx) => {
                    const voter = sessionPlayers.find(p => p.id === voterId);
                    const target = sessionPlayers.find(p => p.id === targetId);
                    const isAbstain = targetId === "abstain";
                    return (
                      <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-white/[0.05]">
                        <span className="font-orbitron text-xs font-bold text-cyan-400">{voter?.name || "Unknown"}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] text-white/20 uppercase tracking-tighter">targeting</span>
                          <span className="font-orbitron text-xs font-black" style={{ color: isAbstain ? "hsl(210 20% 40%)" : "hsl(185 100% 70%)" }}>
                            {isAbstain ? "ABSTAIN" : (target?.name || "---")}
                          </span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="py-12 text-center text-white/10 font-orbitron text-[10px] tracking-[0.4em] uppercase animate-pulse">
                    Scanning for votes...
                  </div>
                )}
              </div>

              {/* Progress Summary */}
              <div className="p-5 rounded-2xl border border-white/5 bg-white/[0.02] flex items-center justify-between">
                <div>
                  <div className="text-[10px] tracking-widest text-white/30 uppercase mb-1">Transmission Progress</div>
                  <div className="font-orbitron font-black text-2xl">{votesIn} / {totalPlayers}</div>
                </div>
                <div className="w-16 h-16 rounded-full border-2 border-white/5 flex items-center justify-center relative">
                   <svg className="w-12 h-12 -rotate-90">
                      <circle cx="24" cy="24" r="22" stroke="currentColor" strokeWidth="2" fill="transparent" className="text-white/5" />
                      <circle cx="24" cy="24" r="22" stroke="currentColor" strokeWidth="2" fill="transparent" className="text-cyan-500" strokeDasharray={138} strokeDashoffset={138 - (138 * (votesIn / (totalPlayers || 1)))} />
                   </svg>
                   <span className="absolute font-orbitron text-[10px] font-bold text-white/50">{Math.round((votesIn / (totalPlayers || 1)) * 100)}%</span>
                </div>
              </div>
            </div>

            {/* Right Column: Vote Distribution */}
            <div className="lg:col-span-7 flex flex-col gap-6">
              <h3 className="font-orbitron text-[10px] tracking-[0.4em] uppercase mb-2 text-white/40 flex items-center gap-2">
                <span className="w-1 h-1 bg-white/40 rounded-full" />
                Target Analysis
              </h3>
              
              <div className="space-y-3">
                {activePlayers.map((p) => {
                  const voteCount = Object.values(votes).filter(targetId => targetId === p.id).length;
                  const isLeading = leadingVoteGetters.has(p.id);

                  return (
                    <div key={p.id} className={`p-4 rounded-xl border transition-all duration-300 ${isLeading ? 'bg-red-500/5 border-red-500/20 shadow-[0_0_20px_rgba(239,68,68,0.1)]' : 'bg-white/[0.03] border-white/5'}`}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${isLeading ? 'bg-red-500 animate-ping' : 'bg-white/20'}`} />
                          <span className="font-orbitron text-sm font-bold tracking-widest">{p.name}</span>
                        </div>
                        <div className="font-orbitron font-black text-lg" style={{ color: isLeading ? 'hsl(0 75% 60%)' : 'inherit' }}>
                          {voteCount}
                        </div>
                      </div>
                      <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-500 rounded-full ${isLeading ? 'bg-red-500' : 'bg-cyan-500'}`} 
                          style={{ width: `${(voteCount / (totalPlayers || 1)) * 100}%` }} 
                        />
                      </div>
                    </div>
                  );
                })}

                {/* Abstain Count */}
                {Object.values(votes).filter(v => v === "abstain").length > 0 && (
                  <div className="p-4 rounded-xl border bg-white/[0.01] border-white/[0.03]">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-white/10" />
                        <span className="font-orbitron text-sm font-bold tracking-widest text-white/30 italic">ABSTAINED</span>
                      </div>
                      <div className="font-orbitron font-black text-lg text-white/20">
                        {Object.values(votes).filter(v => v === "abstain").length}
                      </div>
                    </div>
                    <div className="w-full h-1 bg-white/[0.02] rounded-full overflow-hidden">
                      <div 
                        className="h-full transition-all duration-500 rounded-full bg-white/10" 
                        style={{ width: `${(Object.values(votes).filter(v => v === "abstain").length / (totalPlayers || 1)) * 100}%` }} 
                      />
                    </div>
                  </div>
                )}
              </div>
              </div>

              {/* Pending Voters */}
              {pendingVoters.length > 0 && (
                <div className="mt-8">
                  <h4 className="font-orbitron text-[9px] tracking-[0.4em] uppercase mb-3 text-white/20">Pending Decision</h4>
                  <div className="flex flex-wrap gap-2">
                    {pendingVoters.map(p => (
                      <span key={p.id} className="px-3 py-1 rounded-full bg-white/[0.03] border border-white/5 font-orbitron text-[9px] text-white/40 tracking-widest uppercase">
                        {p.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative min-h-0 h-screen max-h-screen w-full flex flex-col transition-transform duration-1000 ${votesIn > 0 ? "scale-[1.02]" : "scale-100"} ${isAlien ? "ix-glitch-bg" : ""}`}
      style={{ background: bgTint, color: "hsl(190 80% 90%)", overflow: "hidden" }}
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
        onShowHowToPlay={() => {}} // No how to play in voting
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
            VOTING
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col px-4 sm:px-6 py-3 gap-3 overflow-y-auto pb-24 lg:pb-6 max-w-2xl mx-auto w-full min-h-0" style={{ WebkitOverflowScrolling: "touch" }}>

        {/* Title */}
        <div>
          <div className="font-orbitron font-black text-2xl tracking-widest uppercase" style={{ color: accentLight, textShadow: `0 0 12px ${accentGlow}` }}>
            VOTING
          </div>
          <div className="text-xs tracking-widest uppercase mt-1" style={{ color: "hsl(210 30% 50%)" }}>
            SELECT A PLAYER TO ELIMINATE
          </div>
          {role.id === "commander" && (
            <div className="text-xs tracking-wider mt-1" style={{ color: "hsl(45 90% 60%)", fontFamily: "'Exo 2', sans-serif" }}>
              ★ Your vote counts as 2
            </div>
          )}
        </div>

        {/* Vote progress */}
        <div className="rounded-md px-4 py-3 flex items-center justify-between" style={{ background: "hsl(220 28% 9%)", border: "1px solid hsl(210 30% 15%)" }}>
          <div className="text-xs tracking-widest uppercase" style={{ color: "hsl(210 30% 50%)" }}>VOTES IN</div>
          <div className="font-orbitron font-bold text-sm" style={{ color: accentLight }}>
            {votesIn} / {totalPlayers}
          </div>
        </div>

        {/* Pending voters — shown once at least one vote is in and some players still haven't voted */}
        {votesIn > 0 && pendingVoters.length > 0 && (
          <div className="rounded-md px-4 py-3" style={{ background: "hsl(220 28% 9%)", border: "1px solid hsl(210 30% 15%)" }}>
            <div className="text-xs tracking-widest uppercase mb-2" style={{ color: "hsl(210 30% 50%)" }}>
              WAITING ON
            </div>
            <div className="flex flex-wrap gap-2">
              {pendingVoters.map((p) => (
                <span
                  key={p.id}
                  className="font-orbitron text-xs tracking-wider px-2 py-1 rounded"
                  style={{
                    background: "hsl(220 28% 13%)",
                    border: "1px solid hsl(45 90% 55% / 0.35)",
                    color: p.isYou ? "hsl(45 90% 65%)" : "hsl(45 70% 55%)",
                  }}
                >
                  {p.isYou ? `${p.name} (YOU)` : p.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Player list */}
        {!isSpectator && !votedFor && !pendingVote ? (
          <div className="flex flex-col gap-3">
            <div className="font-orbitron text-xs tracking-[0.25em] uppercase mb-1" style={{ color: "hsl(210 30% 50%)" }}>
              CHOOSE CAREFULLY
            </div>
            {activePlayers.map((p) => {
              const isSelf = p.id === myId;
              const isPulsing = leadingVoteGetters.has(p.id) && votesIn > 0;
              const isTyping = typingUsers.includes(p.name);
              
              return (
                <HolographicCard
                  key={p.id}
                  data-testid={`vote-player-${p.name}`}
                  onClick={() => { if (!isSelf) { playSciFiClick(); setPendingVote(p.id); } }}
                  disabled={isSelf}
                  isPulsing={isPulsing}
                  className="w-full py-2.5 font-orbitron font-bold text-sm tracking-[0.2em] uppercase rounded-md border-2 transition-all duration-150 active:scale-95"
                  style={{
                    background: isSelf ? "hsl(220 28% 8%)" : accentColor.replace(")", " / 0.12)"),
                    borderColor: isSelf ? "hsl(210 30% 16%)" : accentColor.replace(")", " / 0.6)"),
                    color: isSelf ? "hsl(210 30% 30%)" : accentLight,
                    cursor: isSelf ? "not-allowed" : "pointer",
                    boxShadow: isSelf ? "none" : `0 0 6px ${accentGlow}`,
                  }}
                  onMouseEnter={(e) => { if (!isSelf && !isPulsing) e.currentTarget.style.boxShadow = `0 0 16px ${accentGlow.replace("0.4", "0.65")}`; }}
                  onMouseLeave={(e) => { if (!isSelf && !isPulsing) e.currentTarget.style.boxShadow = `0 0 6px ${accentGlow}`; }}
                >
                  <div className="flex items-center justify-center gap-2 relative">
                    {isTyping && (
                      <span className="absolute left-[-20px] text-[10px] text-cyan-400 ix-typing-dots">
                        <span>.</span><span>.</span><span>.</span>
                      </span>
                    )}
                    {p.name}
                    {isSelf && " (YOU)"}
                    {isPulsing && <span className="text-[10px] text-red-500 animate-pulse">⚠️ TARGET</span>}
                  </div>
                </HolographicCard>
              );
            })}

            {/* Abstain option */}
            <div className="mt-1 pt-3" style={{ borderTop: "1px solid hsl(210 30% 14%)" }}>
              <button
                data-testid="vote-abstain"
                onClick={() => { playSciFiClick(); setPendingVote("abstain"); }}
                className="w-full py-2 font-orbitron font-bold text-xs tracking-[0.25em] uppercase rounded-md border transition-all duration-150 active:scale-95"
                style={{
                  background: "hsl(220 28% 8%)",
                  borderColor: "hsl(210 30% 22%)",
                  color: "hsl(210 30% 50%)",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "hsl(210 30% 38%)";
                  e.currentTarget.style.color = "hsl(210 30% 70%)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "hsl(210 30% 22%)";
                  e.currentTarget.style.color = "hsl(210 30% 50%)";
                }}
              >
                ABSTAIN
              </button>
            </div>
          </div>
        ) : !votedFor && pendingVote ? (
          <div className="rounded-md p-6 flex flex-col gap-5" style={{ background: "hsl(220 28% 10%)", border: `1px solid ${accentColor.replace(")", " / 0.45)")}`, boxShadow: `0 0 20px ${accentGlow}` }}>
            <div className="text-center">
              <div className="font-orbitron font-bold text-xs tracking-[0.3em] uppercase mb-3" style={{ color: "hsl(210 30% 50%)" }}>
                CONFIRM VOTE
              </div>
              {pendingVote === "abstain" ? (
                <p className="text-base" style={{ color: "hsl(210 30% 70%)", fontFamily: "'Exo 2', sans-serif" }}>
                  Abstain from voting this round?
                </p>
              ) : (
                <p className="text-base" style={{ color: "hsl(190 60% 80%)", fontFamily: "'Exo 2', sans-serif" }}>
                  Vote to eliminate{" "}
                  <span className="font-bold font-orbitron tracking-wider" style={{ color: accentLight }}>
                    {sessionPlayers.find((p) => p.id === pendingVote)?.name ?? "Unknown"}
                  </span>
                  ?
                </p>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => { handleVote(pendingVote); setPendingVote(null); }}
                className="flex-1 py-3 font-orbitron font-bold text-sm tracking-[0.2em] uppercase rounded-md border-2 transition-all duration-150 active:scale-95"
                style={{
                  background: accentColor.replace(")", " / 0.18)"),
                  borderColor: accentColor.replace(")", " / 0.7)"),
                  color: accentLight,
                  cursor: "pointer",
                  boxShadow: `0 0 8px ${accentGlow}`,
                }}
                onMouseEnter={(e) => { e.currentTarget.style.boxShadow = `0 0 18px ${accentGlow.replace("0.4", "0.7")}`; }}
                onMouseLeave={(e) => { e.currentTarget.style.boxShadow = `0 0 8px ${accentGlow}`; }}
              >
                YES
              </button>
              <button
                onClick={() => setPendingVote(null)}
                className="flex-1 py-3 font-orbitron font-bold text-sm tracking-[0.2em] uppercase rounded-md border-2 transition-all duration-150 active:scale-95"
                style={{
                  background: "hsl(220 28% 8%)",
                  borderColor: "hsl(210 30% 22%)",
                  color: "hsl(210 30% 55%)",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "hsl(210 30% 40%)";
                  e.currentTarget.style.color = "hsl(210 30% 75%)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "hsl(210 30% 22%)";
                  e.currentTarget.style.color = "hsl(210 30% 55%)";
                }}
              >
                NO
              </button>
            </div>
          </div>
        ) : (
          <div className="rounded-md p-6 text-center" style={{ background: "hsl(220 28% 10%)", border: `2px solid ${accentColor}`, boxShadow: `0 0 15px ${accentGlow}, inset 0 0 10px ${accentGlow}` }}>
            <div className="font-orbitron font-bold text-sm tracking-[0.25em] uppercase mb-2" style={{ color: accentLight }}>
              {votedFor === "abstain" ? "ABSTAINED" : "VOTE LOCKED"}
            </div>
            {votedFor === "abstain" ? (
              <p className="text-sm mb-1" style={{ color: "hsl(210 30% 55%)", fontFamily: "'Exo 2', sans-serif" }}>
                You chose not to vote this round.
              </p>
            ) : (
              <p className="text-sm mb-1" style={{ color: "hsl(190 60% 75%)", fontFamily: "'Exo 2', sans-serif" }}>
                You voted for: <span className="font-bold" style={{ color: accentLight }}>
                  {sessionPlayers.find((p) => p.id === votedFor)?.name ?? "Unknown"}
                </span>
              </p>
            )}
            <p className="text-xs" style={{ color: "hsl(210 30% 45%)", fontFamily: "'Exo 2', sans-serif" }}>
              Waiting for other players... ({votesIn} / {totalPlayers})
            </p>
          </div>
        )}

      </div>
      </div>
    </div>
  );
}

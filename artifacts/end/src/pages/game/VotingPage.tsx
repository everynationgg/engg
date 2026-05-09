import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getSocket } from "@/lib/socket";
import { ROLES } from "@/data/roles";
import { playSciFiClick, playMechanicalChunk } from "@/lib/sound";
import { isPlayerConnected } from "@/lib/utils";
import HolographicCard from "@/components/common/HolographicCard";
import { getInitialRoleId, getRoomCode } from "@/lib/gameHelpers";
import { gameSessionStore } from "@/lib/gameSessionStore";

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
  const [roomCopyFeedback, setRoomCopyFeedback] = useState(false);
  const [isHost, setIsHost] = useState(() => gameSessionStore.isHost(roomCode));
  const [isSpectator, setIsSpectator] = useState(() => {
    const role = gameSessionStore.getAssignedRole();
    return role === "spectator" || role === "Spectator";
  });
  const [secondsLeft, setSecondsLeft] = useState(60);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const typingTimeoutsRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const [roundSummary, setRoundSummary] = useState<{ voteTally: { voterName: string; targetName: string; isAbstain: boolean }[] } | null>(null);
  const [isAnesthetized, setIsAnesthetized] = useState(false);
  const [isPhaseReady, setIsPhaseReady] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1 && !votedFor && !isSpectator && !isAnesthetized) {
          // Auto-abstain when timer hits 0
          handleAbstain();
        }
        return Math.max(0, prev - 1);
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [votedFor, isSpectator, isAnesthetized]);

  // Sync timer with session settings and server timestamp
  useEffect(() => {
    const socket = getSocket();
    const handlePhaseUpdate = (session: any) => {
      if (session.phase === "voting" && session.phaseStartedAt) {
        const votingTime = session.settings?.votingTime ?? 60;
        const elapsed = Math.floor((Date.now() - session.phaseStartedAt) / 1000);
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

    const handlePhaseUpdate = (session: { phase: string; phaseReady?: boolean; players: LivePlayer[]; votes?: Record<string, string>; roundSummary?: any; anesthetizedPlayers?: string[] }) => {
      const myPlayerId = gameSessionStore.getPlayerId(roomCode);
      const myId = socket.id;
      const players = session.players.map((p) => ({ ...p, isYou: myPlayerId ? p.playerId === myPlayerId : p.id === myId }));
      setSessionPlayers(players);

      const me = players.find((p) => p.isYou);
      if (me) {
        setIsHost(!!me.isHost);
        setIsSpectator(!!me.isSpectator);
      }
      if (session.phaseReady !== undefined) {
        setIsPhaseReady(session.phaseReady);
      }

      if (session.votes) {
        setWaitingCount(Object.keys(session.votes).length);
        setVoterIds(new Set(Object.keys(session.votes)));
        setVotes(session.votes);
        
        // Ensure votedFor is synced from server state
        const myStableId = myPlayerId || socket.id || "";
        if (session.votes[myStableId]) {
          setVotedFor(session.votes[myStableId]);
        }
      }
      if (session.roundSummary) setRoundSummary(session.roundSummary);
      if (session.anesthetizedPlayers) {
        const myPlayerId = gameSessionStore.getPlayerId(roomCode);
        const me = session.players.find((p: any) => myPlayerId ? p.playerId === myPlayerId : p.id === socket.id);
        if (me) {
          const checkId = me.playerId || me.id;
          setIsAnesthetized(session.anesthetizedPlayers.includes(checkId));
        }
      }
      // GameShell handles phase navigation
    };

    socket.on("phase_update", handlePhaseUpdate);

    // Shared sync function: fetches latest session and updates local state
    const syncSession = () => {
      socket.emit("get_session", { sessionId: roomCode }, (resp: { success: boolean; session?: { phase: string; players: LivePlayer[]; votes?: Record<string, string>; roundSummary?: any; anesthetizedPlayers?: string[]; phaseReady?: boolean } }) => {
        if (resp.success && resp.session) {
          const myPlayerId = gameSessionStore.getPlayerId(roomCode);
          const id = socket.id;
          if (resp.session.players) {
            setSessionPlayers(resp.session.players.map((p: LivePlayer) => ({ ...p, isYou: myPlayerId ? p.playerId === myPlayerId : p.id === id })));
            const me = resp.session.players.find((p: LivePlayer) => myPlayerId ? p.playerId === myPlayerId : p.id === id);
            if (me) setIsHost(me.isHost);
          }
          if (resp.session.phaseReady !== undefined) setIsPhaseReady(resp.session.phaseReady);
          if (resp.session.votes) {
            setWaitingCount(Object.keys(resp.session.votes).length);
            setVoterIds(new Set(Object.keys(resp.session.votes)));
            setVotes(resp.session.votes);
            const myStableId = myPlayerId || id || "";
            if (resp.session.votes[myStableId]) setVotedFor(resp.session.votes[myStableId]);
          }
          if (resp.session.roundSummary) setRoundSummary(resp.session.roundSummary);
          if (resp.session.anesthetizedPlayers) {
            const myPlayerId = gameSessionStore.getPlayerId(roomCode);
            const me = resp.session.players.find((p: any) => myPlayerId ? p.playerId === myPlayerId : p.id === id);
            if (me) {
              const checkId = me.playerId || me.id;
              setIsAnesthetized(resp.session.anesthetizedPlayers.includes(checkId));
            }
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
    if (votedFor || (targetId !== "abstain" && targetId === myId) || isSpectator || isAnesthetized) return;
    const socket = getSocket();
    setVotedFor(targetId);
    playMechanicalChunk();
    socket.emit("cast_vote", { sessionId: roomCode, targetId });
  };

  const handleAbstain = () => {
    if (votedFor || isSpectator) return;
    handleVote("abstain");
  };



  const activePlayers = sessionPlayers.filter(p => isPlayerConnected(p) && !p.isSpectator);
  const totalPlayers = activePlayers.length;
  const votesIn = waitingCount;
  const pendingVoters = activePlayers.filter((p) => !voterIds.has(p.playerId || p.id));

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
        
        {/* Tactical HUD — Sidebars */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-between px-2 sm:px-6 z-20">
          <div className="flex flex-col gap-4 pointer-events-auto">
            <HudSidebarTab label="PLAYERS" active />
            <HudSidebarTab label="MAP" />
            <HudSidebarTab label="STATS" />
          </div>
          <div className="flex flex-col gap-4 pointer-events-auto items-end">
            <HudSidebarTab label="WATCHING" active right />
            <HudSidebarTab label="ALL GAME" right />
            <HudSidebarTab label="CHAT" right />
          </div>
        </div>

        {/* Center Content */}
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center relative z-10">
          <div className="w-40 h-40 mb-8 relative group">
             <div className="absolute inset-0 rounded-full border border-red-500/20 animate-[spin_30s_linear_infinite]" />
             <div className="absolute inset-[-10%] rounded-full border-t-2 border-red-500/30 animate-spin" />
             <div className="absolute inset-6 rounded-full overflow-hidden bg-black/40 border border-red-500/10 flex items-center justify-center">
                <svg className="w-12 h-12 text-red-500 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
             </div>
             <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-red-500/10 border border-red-500/30 rounded backdrop-blur-md">
                <div className="font-orbitron text-[8px] tracking-[0.3em] uppercase text-red-500">Stalemate_Detected</div>
             </div>
          </div>

          <h1 className="font-orbitron text-4xl font-black tracking-[0.3em] uppercase mb-2" style={{ color: "hsl(0 75% 70%)", textShadow: "0 0 24px hsl(0 75% 50% / 0.4)" }}>
            VOTING
          </h1>
          <div className="font-orbitron text-[10px] tracking-[0.5em] uppercase white/30 mb-8">Observation Mode</div>
          
          <div className="max-w-md w-full p-4 rounded-xl border border-white/5 bg-white/[0.02] backdrop-blur-sm">
             <div className="flex items-center justify-between mb-4">
                <span className="font-orbitron text-[9px] tracking-widest text-white/40 uppercase">Voter Turnout</span>
                <span className="font-orbitron text-xs font-bold text-cyan-400">{votesIn} / {totalPlayers}</span>
             </div>
             <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-cyan-500 shadow-[0_0_8px_hsl(185,100%,50%)] transition-all duration-500" style={{ width: `${(votesIn/totalPlayers)*100}%` }} />
             </div>
          </div>
        </div>

        {/* Mobile Spacer */}
        <div className="h-20 lg:hidden shrink-0" />
      </div>
    );
  }

function HudSidebarTab({ label, active, right }: { label: string; active?: boolean; right?: boolean }) {
  return (
    <div className={`flex items-center gap-0 group cursor-pointer transition-all ${right ? 'flex-row-reverse' : 'flex-row'}`}>
       <div 
         className={`h-20 w-8 flex items-center justify-center transition-all ${active ? 'opacity-100' : 'opacity-30 group-hover:opacity-60'}`}
         style={{ 
           background: active ? "hsl(185 100% 50% / 0.1)" : "hsl(220 30% 8% / 0.8)",
           border: active ? "1px solid hsl(185 100% 50% / 0.3)" : "1px solid hsl(210 30% 15%)",
           borderLeft: !right && active ? "3px solid hsl(185 100% 50%)" : undefined,
           borderRight: right && active ? "3px solid hsl(185 100% 50%)" : undefined,
           backdropFilter: "blur(4px)"
         }}
       >
         <div className="rotate-[-90deg] whitespace-nowrap font-orbitron text-[8px] font-black tracking-[0.3em] uppercase" style={{ color: active ? "hsl(185 100% 60%)" : "white" }}>
           {label}
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
      <div className="flex-1 flex flex-col px-4 sm:px-6 py-10 gap-6 overflow-y-auto pb-24 lg:pb-6 max-w-2xl mx-auto w-full min-h-0" style={{ WebkitOverflowScrolling: "touch" }}>
        {/* Header with Timer */}
        <div className="p-6 bg-white/[0.02] border border-white/5 rounded-sm shadow-xl flex justify-between items-center">
          <div className="flex-1">
            <div className="text-[10px] tracking-[0.4em] uppercase opacity-40 font-bold mb-1">
              MISSION_CRITICAL_DECISION
            </div>
            <div className="font-orbitron font-black text-3xl sm:text-4xl tracking-[0.2em] uppercase italic" style={{ color: accentLight, textShadow: `0 0 20px ${accentGlow}` }}>
              VOTING
            </div>
          </div>
          <div className="text-right pl-4 border-l border-white/10">
            <div className="text-[10px] tracking-[0.3em] uppercase mb-1 opacity-40">System_Lock</div>
            <div className="font-orbitron font-bold text-2xl tracking-widest" style={{ color: secondsLeft < 10 ? "hsl(0 75% 60%)" : accentLight }}>
              {Math.floor(secondsLeft / 60)}:{(secondsLeft % 60).toString().padStart(2, '0')}
            </div>
          </div>
        </div>

        {role.id === "commander" && (
          <div className="px-4 py-2 rounded border border-yellow-500/30 bg-yellow-500/10 text-center">
            <div className="text-[10px] tracking-[0.3em] uppercase font-bold" style={{ color: "hsl(45 90% 60%)" }}>
              ★ NEURAL_PRIORITY: ALPHA (VOTE POWER X2)
            </div>
          </div>
        )}

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

        {/* SYSTEM STABILIZATION OVERLAY */}
        <AnimatePresence>
          {!isPhaseReady && !votedFor && !isSpectator && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-[100] flex flex-col items-center justify-center bg-black/60 backdrop-blur-md"
            >
              <div className="relative">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                  className="w-32 h-32 border-2 border-dashed rounded-full"
                  style={{ borderColor: accentColor, opacity: 0.2 }}
                />
                <motion.div
                  animate={{ rotate: -360 }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-4 border-2 border-dashed rounded-full"
                  style={{ borderColor: accentColor, opacity: 0.4 }}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <motion.div
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="font-orbitron text-xs tracking-[0.3em]"
                    style={{ color: accentLight }}
                  >
                    SYSTEM LOCKING...
                  </motion.div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Player list */}
        {!isSpectator && !votedFor && !pendingVote && !isAnesthetized ? (
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
                  onClick={() => { if (!isSelf) { playSciFiClick(); setPendingVote(p.playerId || p.id); } }}
                  disabled={isSelf}
                  isPulsing={isPulsing}
                  className="w-full py-4 font-orbitron font-bold text-sm tracking-[0.2em] uppercase rounded-md border-2 transition-all duration-150 active:scale-95"
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
        ) : pendingVote && !votedFor && !isAnesthetized ? (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
            <div className="w-full max-w-sm rounded-lg p-6 flex flex-col gap-6 ix-modal-enter" style={{ background: "hsl(220 30% 8%)", border: `2px solid ${accentColor.replace(")", " / 0.5)")}`, boxShadow: `0 0 60px ${accentGlow}` }}>
              <div className="text-center">
                <div className="font-orbitron font-bold text-[9px] tracking-[0.5em] uppercase mb-4 opacity-40">
                  NEURAL_CONFIRMATION_REQUIRED
                </div>
                {pendingVote === "abstain" ? (
                  <p className="text-xl font-bold" style={{ color: "hsl(190 60% 95%)", fontFamily: "'Exo 2', sans-serif" }}>
                    Abstain from voting?
                  </p>
                ) : (
                  <p className="text-xl" style={{ color: "hsl(190 60% 95%)", fontFamily: "'Exo 2', sans-serif" }}>
                    Vote to terminate <span className="font-bold font-orbitron tracking-wider text-white" style={{ color: accentLight }}>
                      {sessionPlayers.find((p) => (p.playerId || p.id) === pendingVote)?.name ?? "Unknown"}
                    </span>?
                  </p>
                )}
              </div>
              <div className="flex gap-4">
                <button
                  onClick={() => { handleVote(pendingVote); setPendingVote(null); }}
                  className="flex-1 py-5 font-orbitron font-black text-base tracking-[0.2em] uppercase rounded-md border-2 transition-all duration-150 active:scale-90"
                  style={{
                    background: accentColor.replace(")", " / 0.25)"),
                    borderColor: accentColor.replace(")", " / 0.8)"),
                    color: accentLight,
                    boxShadow: `0 0 15px ${accentGlow}`,
                  }}
                >
                  VOTE
                </button>
                <button
                  onClick={() => setPendingVote(null)}
                  className="flex-1 py-5 font-orbitron font-bold text-sm tracking-[0.2em] uppercase rounded-md border-2 transition-all duration-150 active:scale-95"
                  style={{
                    background: "hsl(220 28% 8%)",
                    borderColor: "hsl(210 30% 25%)",
                    color: "hsl(210 30% 60%)",
                  }}
                >
                  CANCEL
                </button>
              </div>
            </div>
          </div>
        ) : isAnesthetized && !votedFor ? (
          <div className="rounded-md p-6 text-center ix-glitch-bg" style={{ background: "hsl(0 60% 8% / 0.8)", border: `2px solid hsl(0 75% 55%)`, boxShadow: `0 0 25px hsl(0 75% 55% / 0.4)` }}>
            <div className="font-orbitron font-bold text-sm tracking-[0.25em] uppercase mb-3" style={{ color: "hsl(0 75% 70%)" }}>
              Neural Link Inhibited
            </div>
            <p className="text-sm mb-2" style={{ color: "hsl(0 50% 85%)", fontFamily: "'Exo 2', sans-serif" }}>
              The Doctor has anesthetized your cognitive interface.
            </p>
            <p className="text-xs italic" style={{ color: "hsl(0 40% 60%)", fontFamily: "'Exo 2', sans-serif" }}>
              Voting functions are temporarily offline.
            </p>
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
                  {sessionPlayers.find((p) => (p.playerId || p.id) === votedFor)?.name ?? "Unknown"}
                </span>
              </p>
            )}
            <div className="mt-4 flex items-center justify-center gap-2">
              <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <p className="text-xs tracking-[0.2em] uppercase font-bold" style={{ color: "hsl(210 30% 45%)", fontFamily: "'Exo 2', sans-serif" }}>
                Neural_Wait: {votesIn} / {totalPlayers} Ready
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  </div>
  );
}


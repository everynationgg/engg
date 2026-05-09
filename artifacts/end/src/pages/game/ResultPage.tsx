import { useState, useEffect, useCallback, useRef } from "react";
import { getSocket } from "@/lib/socket";
import { ROLES } from "@/data/roles";
import { playGameOutcome, playSciFiClick, playBassDrop, playMechanicalChunk } from "@/lib/sound";
import { useAuth } from "@/hooks/useAuth";
import { useGameChat } from "@/hooks/useGameChat";
import { useRecordGameResult, determinePlayerWon, generateGameId } from "@/hooks/useRecordGameResult";
import StatsDisplay from "@/components/profile/StatsDisplay";
import { motion, AnimatePresence } from "framer-motion";
import { TeamIcon } from "@/components/common/TeamIcon";
import { gameSessionStore } from "@/lib/gameSessionStore";

interface VoteResult {
  eliminatedId: string | null;
  eliminatedName: string | null;
  eliminatedRole: string | null;
  winTeam: "crew" | "alien" | "tie";
  allRoles: { playerId: string; stablePlayerId?: string; playerName: string; role: string; initialRole: string; alive?: boolean; alignment?: "Good" | "Bad" }[];
  centerCards: string[];
}

interface AbilityLogEntry {
  actorName: string;
  event: string;
}

interface VoteTallyEntry {
  voterName: string;
  targetName: string;
  isCommander: boolean;
  isAbstain: boolean;
}

interface VoteCount {
  playerName: string;
  votes: number;
}

interface RoundSummary {
  abilityLog: AbilityLogEntry[];
  voteTally: VoteTallyEntry[];
  voteCounts: VoteCount[];
}

function getRoomCode(): string {
  return gameSessionStore.getRoomCode("------");
}

function PlayAgainButton({ roomCode, bannerColor, bannerGlow }: { roomCode: string; bannerColor: string; bannerGlow: string }) {
  const [loading, setLoading] = useState(false);

  const handleRestart = useCallback(() => {
    const socket = getSocket();
    setLoading(true);
    socket.emit("restart_game", { sessionId: roomCode }, (resp: { success: boolean; error?: string }) => {
      setLoading(false);
      if (!resp.success) {
        console.error("Restart failed:", resp.error);
      }
    });
  }, [roomCode]);

  return (
    <button
      data-testid="button-play-again"
      onClick={handleRestart}
      disabled={loading}
      className="w-full py-4 font-orbitron font-bold text-sm tracking-[0.25em] uppercase rounded-md border-2 transition-all duration-150 cursor-pointer"
      style={{
        background: loading ? "hsl(220 28% 8%)" : bannerColor.replace(")", " / 0.15)"),
        borderColor: loading ? "hsl(210 30% 20%)" : bannerColor,
        color: loading ? "hsl(210 30% 40%)" : bannerColor,
        boxShadow: loading ? "none" : `0 0 8px ${bannerGlow}`,
        cursor: loading ? "not-allowed" : "pointer",
      }}
      onMouseEnter={(e) => { if (!loading) e.currentTarget.style.boxShadow = `0 0 18px ${bannerGlow.replace("0.4", "0.7")}`; }}
      onMouseLeave={(e) => { if (!loading) e.currentTarget.style.boxShadow = `0 0 8px ${bannerGlow}`; }}
    >
      {loading ? "RESTARTING..." : "PLAY AGAIN"}
    </button>
  );
}

function RewardSummary({ rewards, onClose }: { rewards: { xp: number; credits: number }, onClose: () => void }) {
  const [count, setCount] = useState(0);
  const { xp, level } = useAuth();
  
  useEffect(() => {
    let start = 0;
    const end = rewards.credits;
    if (start === end) return;
    let timer = setInterval(() => {
      start += 1;
      setCount(start);
      if (start >= end) clearInterval(timer);
    }, 30);
    return () => clearInterval(timer);
  }, [rewards.credits]);

  const progress = (xp % 500) / 500;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-6"
    >
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-[400px] bg-[#020408] border border-cyan-500/30 p-8 flex flex-col items-center gap-8 relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-cyan-500/20" />
        <div className="absolute top-0 left-0 w-8 h-8 border-t border-l border-cyan-500/40" />
        <div className="absolute bottom-0 right-0 w-8 h-8 border-b border-r border-cyan-500/40" />
        
        <div className="flex flex-col items-center gap-2">
          <span className="font-mono text-[8px] uppercase tracking-[0.6em] text-cyan-400/40">Mission_Debrief</span>
          <h2 className="font-orbitron font-black text-2xl tracking-[0.3em] uppercase text-white text-center leading-tight">Operation_Results</h2>
        </div>

        <div className="w-full flex flex-col gap-6">
          {/* XP PROGRESS */}
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-end">
              <span className="font-mono text-[8px] uppercase text-white/30">Neural_XP</span>
              <span className="font-orbitron text-[10px] text-cyan-400 font-bold">LVL_{level}</span>
            </div>
            <div className="w-full h-2 bg-white/5 relative">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${progress * 100}%` }}
                className="absolute inset-y-0 left-0 bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.5)]"
                transition={{ duration: 1, delay: 0.5 }}
              />
            </div>
            <div className="flex justify-between">
               <span className="font-mono text-[7px] text-cyan-400/60">+{rewards.xp} XP</span>
               <span className="font-mono text-[7px] text-white/20 uppercase tracking-tighter">Syncing...</span>
            </div>
          </div>

          {/* CREDITS DEPOSIT */}
          <div className="p-4 bg-white/[0.02] border border-white/5 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="font-mono text-[7px] uppercase tracking-widest text-white/20">Assets_Recovered</span>
              <span className="font-orbitron text-xl font-black text-white">+{count} <span className="text-[10px] text-cyan-400">CC</span></span>
            </div>
            <div className="w-10 h-10 border border-cyan-500/20 flex items-center justify-center">
              <div className="w-4 h-4 bg-cyan-500/40 animate-pulse" />
            </div>
          </div>
        </div>

        <div className="flex flex-col w-full gap-3 mt-4">
           <button 
             onClick={onClose}
             className="w-full py-4 bg-cyan-500/10 border border-cyan-500/40 hover:bg-cyan-500/20 transition-all font-orbitron text-[10px] uppercase tracking-[0.4em] text-cyan-400 font-bold"
           >
             Continue_Sequence
           </button>
           <button 
             onClick={() => window.location.href = "/hub"}
             className="w-full py-4 border border-white/5 hover:border-white/10 transition-all font-orbitron text-[10px] uppercase tracking-[0.4em] text-white/20 hover:text-white"
           >
             Return_to_Nexus
           </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function ResultPage() {
  const roomCode = getRoomCode();
  const { isLoggedIn, userId, isInitialized } = useAuth();
  const { recordResult, personalStats, leaderboard, hasRecorded, fetchLeaderboard, lastRewards } = useRecordGameResult();
  const [showRewards, setShowRewards] = useState(false);

  // Host status is derived from the server's session player list — not from
  // sessionStorage — so it is always accurate regardless of page reloads.
  const [isHost, setIsHost] = useState(false);
  const [isSpectator, setIsSpectator] = useState(false);

  const [result, setResult] = useState<VoteResult | null>(null);
  const [summary, setSummary] = useState<RoundSummary | null>(null);
  const [gameId] = useState(() => generateGameId());
  const { messages } = useGameChat(roomCode);
  const [revealedVoteRows, setRevealedVoteRows] = useState(0);
  const [revealedCountRows, setRevealedCountRows] = useState(0);
  const [showWinParticles, setShowWinParticles] = useState(false);
  const [pendingVoteResult, setPendingVoteResult] = useState<VoteResult | null>(null);
  const [cinematicPlayed, setCinematicPlayed] = useState(false);
  
  const handleCinematicComplete = useCallback(() => setCinematicPlayed(true), []);

  const resultPlayedRef = useRef(false);
  const recordedResultRef = useRef(false);

  const maybeRecordMyResult = useCallback((voteResult: VoteResult) => {
    if (recordedResultRef.current || hasRecorded) return;

    const myStablePlayerId = gameSessionStore.getPlayerId(roomCode);
    const mySocketId = getSocket().id;
    const callsign = gameSessionStore.getCallsign().toUpperCase();

    const playerData = voteResult.allRoles.find((p) =>
      (myStablePlayerId && p.stablePlayerId === myStablePlayerId)
      || (!!mySocketId && p.playerId === mySocketId)
      || (!!callsign && p.playerName.toUpperCase() === callsign)
    );

    if (!playerData || playerData.role === "spectator") return;

    if (!isInitialized) {
      setPendingVoteResult(voteResult);
      return;
    }

    if (!isLoggedIn || !userId) return;

    recordedResultRef.current = true;
    const won = determinePlayerWon(playerData.role, voteResult.winTeam, playerData.alignment) ? "yes" : "no";
    recordResult({ gameId, role: playerData.role, won, alignment: playerData.alignment });
    setPendingVoteResult(null);
  }, [gameId, hasRecorded, isInitialized, isLoggedIn, recordResult, userId]);

  useEffect(() => {
    if (!pendingVoteResult) return;
    maybeRecordMyResult(pendingVoteResult);
  }, [pendingVoteResult, maybeRecordMyResult]);

  useEffect(() => {
    const socket = getSocket();

    // Fetch leaderboard on page load
    fetchLeaderboard();

    const handleVoteResult = (data: VoteResult) => {
      setResult((prev) => JSON.stringify(prev) === JSON.stringify(data) ? prev : data);
      if (!resultPlayedRef.current) {
        resultPlayedRef.current = true;
        playGameOutcome(data.winTeam);
      }
      maybeRecordMyResult(data);
    };

    const handleRoundSummary = (data: RoundSummary) => {
      setSummary((prev) => JSON.stringify(prev) === JSON.stringify(data) ? prev : data);
    };

    const handlePhaseUpdate = (session: { phase: string; voteResult?: VoteResult | null; roundSummary?: RoundSummary }) => {
      if (session.voteResult) setResult((prev) => JSON.stringify(prev) === JSON.stringify(session.voteResult) ? prev : session.voteResult!);
      if (session.roundSummary) setSummary((prev) => JSON.stringify(prev) === JSON.stringify(session.roundSummary) ? prev : session.roundSummary!);
      // GameShell handles navigation to role_config
    };

    socket.on("vote_result", handleVoteResult);
    socket.on("round_summary", handleRoundSummary);
    socket.on("phase_update", handlePhaseUpdate);

    socket.emit("get_session", { sessionId: roomCode }, (resp: {
      success: boolean;
      session?: {
        phase: string;
        players?: { id: string; name: string; isHost: boolean; isSpectator?: boolean }[];
        voteResult?: VoteResult | null;
        roundSummary?: RoundSummary;
      };
    }) => {
      if (resp.success && resp.session) {
        const sess = resp.session;
        if (sess.voteResult) {
          setResult((prev) => JSON.stringify(prev) === JSON.stringify(sess.voteResult) ? prev : sess.voteResult!);
          if (!resultPlayedRef.current) {
            resultPlayedRef.current = true;
            playGameOutcome(sess.voteResult.winTeam);
          }
          maybeRecordMyResult(sess.voteResult);
        }
        if (sess.roundSummary) setSummary((prev) => JSON.stringify(prev) === JSON.stringify(sess.roundSummary) ? prev : sess.roundSummary!);

        if (sess.players) {
          const mySocketId = socket.id;
          const myPlayerId = gameSessionStore.getPlayerId(roomCode);
          const me = sess.players.find(
            (p) => p.id === mySocketId || (myPlayerId && (p as { playerId?: string }).playerId === myPlayerId),
          );
          if (me) {
            setIsHost(!!me.isHost);
            setIsSpectator(!!me.isSpectator);
          }
        }
      }
    });

    // Periodic fallback: poll every 3 seconds so the UI stays in sync even when
    // phase_update socket events are missed (e.g. transport hiccups).
    const pollId = setInterval(() => {
      socket.emit("get_session", { sessionId: roomCode }, (resp: {
        success: boolean;
        session?: {
          phase: string;
          players?: { id: string; name: string; isHost: boolean; isSpectator?: boolean }[];
          voteResult?: VoteResult | null;
          roundSummary?: RoundSummary;
        };
      }) => {
        if (resp.success && resp.session) {
          const sess = resp.session;
          if (sess.voteResult) setResult((prev) => JSON.stringify(prev) === JSON.stringify(sess.voteResult) ? prev : sess.voteResult!);
          if (sess.roundSummary) setSummary((prev) => JSON.stringify(prev) === JSON.stringify(sess.roundSummary) ? prev : sess.roundSummary!);
          if (sess.players) {
            const mySocketId = socket.id;
            const myPlayerId = gameSessionStore.getPlayerId(roomCode);
            const me = sess.players.find(
              (p) => p.id === mySocketId || (myPlayerId && (p as { playerId?: string }).playerId === myPlayerId),
            );
            if (me) {
              setIsHost(!!me.isHost);
              setIsSpectator(!!me.isSpectator);
            }
          }
        }
      });
    }, 3000);

    return () => {
      socket.off("vote_result", handleVoteResult);
      socket.off("round_summary", handleRoundSummary);
      socket.off("phase_update", handlePhaseUpdate);
      clearInterval(pollId);
    };
  }, [fetchLeaderboard, maybeRecordMyResult, roomCode]);



  const winTeam = result?.winTeam ?? "tie";
  const crewWon = winTeam === "crew";
  const alienWon = winTeam === "alien";

  const bannerColor = crewWon ? "hsl(185 100% 50%)" : alienWon ? "hsl(0 75% 55%)" : "hsl(270 70% 60%)";
  const bannerGlow = crewWon ? "hsl(185 100% 50% / 0.4)" : alienWon ? "hsl(0 75% 55% / 0.4)" : "hsl(270 70% 60% / 0.4)";
  const bannerDim = crewWon ? "hsl(185 100% 50% / 0.1)" : alienWon ? "hsl(0 75% 55% / 0.1)" : "hsl(270 70% 60% / 0.1)";
  const bgTint = crewWon ? "hsl(200 30% 6%)" : alienWon ? "hsl(0 40% 6%)" : "hsl(270 30% 6%)";

  const winLabel = crewWon ? "CREW VICTORY" : alienWon ? "ALIEN VICTORY" : "CONSENSUS REACHED";
  const winSub = crewWon
    ? "The alien has been identified and eliminated."
    : alienWon
      ? "The alien survived. The infestation continues."
      : "The crew has reached a consensus. No threats were eliminated.";

  useEffect(() => {
    if (!summary) {
      setRevealedVoteRows(0);
      setRevealedCountRows(0);
      return;
    }

    setRevealedVoteRows(0);
    setRevealedCountRows(0);

    const voteRows = summary.voteTally.length;
    const countRows = summary.voteCounts.length;

    const voteInterval = setInterval(() => {
      setRevealedVoteRows((prev) => {
        if (prev >= voteRows) {
          clearInterval(voteInterval);
          return prev;
        }
        return prev + 1;
      });
    }, 190);

    const countStart = setTimeout(() => {
      const countInterval = setInterval(() => {
        setRevealedCountRows((prev) => {
          if (prev >= countRows) {
            clearInterval(countInterval);
            return prev;
          }
          return prev + 1;
        });
      }, 220);
    }, 280 + voteRows * 190);

    return () => {
      clearInterval(voteInterval);
      clearTimeout(countStart);
    };
  }, [summary]);

  useEffect(() => {
    if (!result || result.winTeam === "tie") {
      setShowWinParticles(false);
      return;
    }
    setShowWinParticles(true);
    const timer = setTimeout(() => setShowWinParticles(false), 4200);
    return () => clearTimeout(timer);
  }, [result]);

  return (
    <div className={`relative min-h-screen w-full flex flex-col overflow-hidden ${alienWon ? "ix-glitch-bg" : ""}`} style={{ background: bgTint, color: "hsl(190 80% 90%)" }}>
      {/* Victory/Defeat Screen Takeover Overlays */}
      {alienWon && (
        <div className="absolute inset-0 pointer-events-none z-0">
          {/* Corrupted scanlines and red vignette */}
          <div className="absolute inset-0 opacity-40 mix-blend-overlay" style={{ background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,0,0,0.2) 2px, rgba(255,0,0,0.2) 4px)" }} />
          <div className="absolute inset-0 opacity-80" style={{ background: "radial-gradient(circle at center, transparent 40%, rgba(255,0,0,0.3) 100%)" }} />
          {/* Glitching error text in background */}
          <div className="absolute top-10 left-10 opacity-10 font-mono text-4xl text-red-500 font-bold rotate-12 select-none tracking-[0.5em] uppercase">SYSTEM COMPROMISED</div>
          <div className="absolute bottom-20 right-10 opacity-10 font-mono text-6xl text-red-600 font-black -rotate-6 select-none tracking-widest uppercase">FATAL ERROR</div>
        </div>
      )}
      
      {crewWon && (
        <div className="absolute inset-0 pointer-events-none z-0">
          {/* Pristine grid and blue glow */}
          <div className="absolute inset-0 opacity-20" style={{ background: "linear-gradient(rgba(0,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,255,0.1) 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
          <div className="absolute inset-0 opacity-60" style={{ background: "radial-gradient(circle at center, transparent 30%, rgba(0,255,255,0.1) 100%)" }} />
          {/* Secure text in background */}
          <div className="absolute top-1/4 left-0 w-full flex justify-between px-10 opacity-5 font-orbitron text-6xl text-cyan-400 font-black select-none tracking-[1em] uppercase">
            <span>SECURE</span>
            <span>SECURE</span>
          </div>
        </div>
      )}
      
      <div className="relative z-10 flex flex-col flex-1 h-full">
      {/* Top bar */}
      <div
        className="w-full px-6 py-3 flex items-center justify-between border-b shrink-0"
        style={{ background: "hsl(220 28% 7%)", borderColor: bannerColor.replace(")", " / 0.25)"), boxShadow: `0 1px 12px ${bannerGlow.replace("0.4", "0.1")}` }}
      >
        <div>
          <div className="font-orbitron font-black text-lg tracking-widest uppercase leading-none" style={{ color: bannerColor, textShadow: `0 0 12px ${bannerGlow}` }}>
            ERRANT NIGHT
          </div>
          <div className="font-orbitron font-bold text-xs tracking-[0.3em] uppercase" style={{ color: "hsl(270 80% 65%)" }}>
            DETECTED
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs tracking-widest uppercase mb-1" style={{ color: "hsl(210 30% 50%)" }}>Phase</div>
          <div className="font-orbitron font-bold text-sm tracking-[0.2em]" style={{ color: bannerColor }}>
            RESULT
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col px-6 py-6 gap-5 overflow-y-auto pb-32 lg:pb-8 max-w-2xl mx-auto w-full">

        {result ? (
          <>
            {/* Win banner */}
            <div
              className="relative rounded-md p-6 text-center"
              style={{ background: bannerDim, border: `2px solid ${bannerColor.replace(")", " / 0.6)")}`, boxShadow: `0 0 24px ${bannerGlow}` }}
            >
              {showWinParticles && <WinParticles hue={crewWon ? 185 : 0} />}
              <div
                className="font-orbitron font-black text-2xl sm:text-3xl tracking-widest uppercase mb-2"
                style={{ color: bannerColor, textShadow: `0 0 20px ${bannerGlow}` }}
              >
                {winLabel}
              </div>
              <p className="text-sm" style={{ color: "hsl(190 60% 75%)", fontFamily: "'Exo 2', sans-serif" }}>
                {winSub}
              </p>
            </div>

            {/* Eliminated player */}
            {result.eliminatedId ? (
              <div className="rounded-md p-4 relative overflow-hidden" style={{ background: "hsl(0 40% 12% / 0.5)", border: "1px solid hsl(0 75% 45% / 0.6)", boxShadow: "0 0 20px hsl(0 75% 55% / 0.2)" }}>
                {/* Glitchy stamp overlay */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-[-15deg] border-4 border-red-600/80 px-6 py-2 font-orbitron font-black text-3xl text-red-600/80 tracking-[0.3em] uppercase pointer-events-none z-10 select-none">
                  EJECTED
                </div>
                <div className="font-orbitron text-xs tracking-[0.25em] uppercase mb-3 font-bold" style={{ color: "hsl(0 75% 60%)" }}>
                  TERMINATED SUBJECT
                </div>
                <div className="flex items-center gap-4 relative">
                  {(() => {
                    const roleDef = ROLES.find((r) => r.id === result.eliminatedRole);
                    return roleDef ? (
                      <div className="relative w-16 h-16 shrink-0">
                        <img src={roleDef.image} alt={roleDef.name} className="w-full h-full rounded-md object-cover" loading="lazy" style={{ border: "1px solid hsl(0 75% 45%)" }} />
                        <div className="absolute inset-0 bg-red-900/20 mix-blend-color" />
                      </div>
                    ) : null;
                  })()}
                  <div>
                    <div className="font-orbitron font-black text-xl tracking-widest uppercase" style={{ color: "hsl(0 75% 85%)" }}>
                      {result.eliminatedName}
                    </div>
                    <div className="text-xs tracking-widest uppercase mt-1" style={{ color: "hsl(0 75% 60%)" }}>
                      ROLE: <span className="font-orbitron font-bold" style={{ color: "white" }}>
                        {ROLES.find((r) => r.id === result.eliminatedRole)?.name?.toUpperCase() ?? result.eliminatedRole?.toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-md p-4 text-center" style={{ background: "hsl(220 28% 9%)", border: "1px solid hsl(210 30% 18%)" }}>
                <div className="font-orbitron text-xs tracking-[0.25em] uppercase mb-2 font-bold" style={{ color: "hsl(210 30% 50%)" }}>
                  ELIMINATED
                </div>
                <p className="text-sm" style={{ color: "hsl(190 60% 65%)", fontFamily: "'Exo 2', sans-serif" }}>No player was eliminated — tied vote.</p>
              </div>
            )}

            {/* Ability Phase Summary + Full Role Reveal — side by side on desktop */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

              {/* Ability Phase Summary */}
              <div className="rounded-md p-4" style={{ background: "hsl(220 28% 9%)", border: "1px solid hsl(210 30% 18%)" }}>
                <div className="font-orbitron text-xs tracking-[0.25em] uppercase mb-3 font-bold" style={{ color: "hsl(270 70% 60%)" }}>
                  ABILITY PHASE SUMMARY
                </div>
                {summary && summary.abilityLog.filter(e => {
                  const actor = result?.allRoles.find(p => p.playerName === e.actorName);
                  return actor?.role !== "spectator";
                }).length > 0 ? (
                  <div className="flex flex-col gap-1.5">
                    {summary.abilityLog
                      .filter(e => {
                        const actor = result?.allRoles.find(p => p.playerName === e.actorName);
                        return actor?.role !== "spectator";
                      })
                      .map((entry, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-2 px-2 py-1.5 rounded"
                        style={{ background: "hsl(220 28% 12%)", border: "1px solid hsl(210 30% 16%)" }}
                      >
                        <span className="font-orbitron text-xs font-bold shrink-0 mt-0.5" style={{ color: "hsl(270 50% 50%)" }}>
                          {String(idx + 1).padStart(2, "0")}
                        </span>
                        <span style={{ color: "hsl(190 60% 80%)", fontFamily: "'Exo 2', sans-serif", fontSize: "0.75rem", lineHeight: "1.4" }}>
                          <span className="font-bold" style={{ color: "hsl(190 80% 90%)" }}>{entry.actorName}</span>
                          {" "}{entry.event}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm" style={{ color: "hsl(210 30% 40%)", fontFamily: "'Exo 2', sans-serif" }}>
                    No ability events were recorded this round.
                  </p>
                )}
              </div>

              {/* Full Role Reveal */}
              <div className="rounded-md p-4" style={{ background: "hsl(220 28% 9%)", border: "1px solid hsl(210 30% 18%)" }}>
                <div className="font-orbitron text-xs tracking-[0.25em] uppercase mb-3 font-bold" style={{ color: "hsl(210 30% 50%)" }}>
                  FULL ROLE REVEAL
                </div>
                <div className="flex flex-col gap-1.5">
                  {result.allRoles.map((entry) => {
                    const finalRoleDef = ROLES.find((r) => r.id === entry.role);
                    const initialRoleDef = ROLES.find((r) => r.id === entry.initialRole);
                    const roleChanged = !!entry.initialRole && entry.role !== entry.initialRole;
                    const isAlienTeam = finalRoleDef?.team === "alien";
                    const isChaotic = finalRoleDef?.team === "chaotic";
                    const finalRoleColor = isAlienTeam ? "hsl(0 75% 60%)" : isChaotic ? "hsl(300 70% 65%)" : "hsl(185 100% 65%)";
                    const isEliminated = entry.playerId === result.eliminatedId;
                    return (
                      <div
                        key={entry.playerId}
                        className="flex items-center justify-between px-2 py-1.5 rounded gap-2"
                        style={{
                          background: isEliminated ? "hsl(0 30% 10%)" : "hsl(220 28% 12%)",
                          border: isEliminated ? "1px solid hsl(0 60% 30%)" : "1px solid hsl(210 30% 16%)",
                        }}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          {finalRoleDef && (
                            <img src={finalRoleDef.image} alt={finalRoleDef.name} className="w-6 h-6 rounded object-cover shrink-0" loading="lazy" style={{ border: "1px solid hsl(210 30% 22%)" }} />
                          )}
                          <span className="font-orbitron text-xs tracking-wide uppercase truncate" style={{ color: "hsl(190 60% 78%)" }}>
                            {entry.playerName}
                          </span>
                          {entry.alignment && (
                            <span 
                              className="text-[9px] px-1.5 py-0.5 rounded font-orbitron font-bold tracking-widest uppercase border"
                              style={{ 
                                background: entry.alignment === "Bad" ? "hsl(0 100% 50% / 0.1)" : "hsl(185 100% 50% / 0.1)",
                                borderColor: entry.alignment === "Bad" ? "hsl(0 100% 50% / 0.3)" : "hsl(185 100% 50% / 0.3)",
                                color: entry.alignment === "Bad" ? "hsl(0 100% 70%)" : "hsl(185 100% 70%)"
                              }}
                            >
                              {entry.alignment}
                            </span>
                          )}
                          {/* Alive/eliminated badge intentionally disabled for now. */}
                          {isEliminated && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-950/40 border border-red-500/50 text-red-400 font-orbitron font-bold tracking-widest uppercase scale-75 origin-right">EJECTED</span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <span className="font-orbitron text-xs uppercase font-bold" style={{ color: roleChanged ? "hsl(210 40% 55%)" : finalRoleColor, fontSize: "0.65rem" }}>
                            {initialRoleDef?.name?.toUpperCase() ?? entry.initialRole?.toUpperCase() ?? "—"}
                          </span>
                          {roleChanged && (
                            <>
                              <span className="font-orbitron text-xs" style={{ color: "hsl(210 30% 40%)" }}>→</span>
                              <span className="font-orbitron text-xs uppercase font-bold" style={{ color: finalRoleColor, fontSize: "0.65rem" }}>
                                {finalRoleDef?.name?.toUpperCase() ?? entry.role.toUpperCase()}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>

            {/* Voting Tally */}
            <div className="rounded-md p-4" style={{ background: "hsl(220 28% 9%)", border: "1px solid hsl(210 30% 18%)" }}>
              <div className="font-orbitron text-xs tracking-[0.25em] uppercase mb-3 font-bold" style={{ color: "hsl(270 70% 60%)" }}>
                VOTING TALLY
              </div>
              {summary && summary.voteTally.length > 0 ? (
                <div className="flex flex-col gap-4">
                  {/* Individual votes */}
                  <div className="flex flex-col gap-1.5">
                    {summary.voteTally.slice(0, revealedVoteRows).map((entry, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 px-3 py-2 rounded flex-wrap"
                        style={{
                          background: entry.isAbstain ? "hsl(220 28% 10%)" : "hsl(220 28% 12%)",
                          border: entry.isAbstain ? "1px solid hsl(210 30% 14%)" : "1px solid hsl(210 30% 16%)",
                        }}
                      >
                        <span className="font-orbitron text-xs font-bold" style={{ color: entry.isAbstain ? "hsl(210 30% 50%)" : "hsl(190 80% 85%)" }}>
                          {entry.voterName}
                        </span>
                        {entry.isCommander && !entry.isAbstain && (
                          <span className="font-orbitron text-xs font-bold px-1.5 py-0.5 rounded" style={{ background: "hsl(45 80% 20%)", color: "hsl(45 90% 60%)", fontSize: "0.65rem", letterSpacing: "0.1em" }}>
                            ×2
                          </span>
                        )}
                        {entry.isAbstain ? (
                          <span style={{ color: "hsl(210 30% 40%)", fontFamily: "'Exo 2', sans-serif", fontSize: "0.8rem", fontStyle: "italic" }}>
                            abstained
                          </span>
                        ) : (
                          <>
                            <span style={{ color: "hsl(210 30% 45%)", fontFamily: "'Exo 2', sans-serif", fontSize: "0.8rem" }}>
                              voted for
                            </span>
                            <span className="font-orbitron text-xs font-bold" style={{ color: "hsl(190 80% 65%)" }}>
                              {entry.targetName}
                            </span>
                          </>
                        )}
                      </div>
                    ))}
                    {revealedVoteRows < summary.voteTally.length && (
                      <div className="text-xs px-2" style={{ color: "hsl(210 30% 45%)", fontFamily: "'Exo 2', sans-serif" }}>
                        Decrypting vote records...
                      </div>
                    )}
                  </div>

                  {/* Vote counts per player */}
                  <div>
                    <div className="font-orbitron text-xs tracking-[0.2em] uppercase mb-2" style={{ color: "hsl(210 30% 45%)" }}>
                      TOTALS
                    </div>
                    <div className="flex flex-col gap-1.5">
                      {summary.voteCounts.slice(0, revealedCountRows).map((entry, idx) => {
                        const isEliminated = entry.playerName === result.eliminatedName;
                        return (
                          <div
                            key={idx}
                            className="flex items-center justify-between px-3 py-2 rounded"
                            style={{
                              background: isEliminated ? "hsl(0 30% 10%)" : "hsl(220 28% 12%)",
                              border: isEliminated ? "1px solid hsl(0 60% 28%)" : "1px solid hsl(210 30% 16%)",
                            }}
                          >
                            <div className="flex items-center gap-2">
                              <span className="font-orbitron text-xs font-bold" style={{ color: isEliminated ? "hsl(0 70% 65%)" : "hsl(190 80% 85%)" }}>
                                {entry.playerName}
                              </span>
                              {isEliminated && (
                                <span className="text-xs font-orbitron tracking-widest uppercase" style={{ color: "hsl(0 60% 50%)" }}>ELIMINATED</span>
                              )}
                            </div>
                            <span className="font-orbitron font-black text-sm" style={{ color: isEliminated ? "hsl(0 70% 60%)" : "hsl(190 60% 65%)" }}>
                              {entry.votes} {entry.votes === 1 ? "vote" : "votes"}
                            </span>
                          </div>
                        );
                      })}
                      {revealedCountRows < summary.voteCounts.length && (
                        <div className="text-xs px-2" style={{ color: "hsl(210 30% 45%)", fontFamily: "'Exo 2', sans-serif" }}>
                          Calculating weighted totals...
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Tie note */}
                  {winTeam === "tie" && (
                    <p className="text-xs text-center" style={{ color: "hsl(270 60% 55%)", fontFamily: "'Exo 2', sans-serif" }}>
                      Tied vote — no elimination.
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm" style={{ color: "hsl(210 30% 40%)", fontFamily: "'Exo 2', sans-serif" }}>
                  Voting data unavailable.
                </p>
              )}
            </div>

            {/* Center Deck Reveal */}
            {result.centerCards && result.centerCards.length > 0 && (
              <div className="rounded-md p-4" style={{ background: "hsl(220 28% 9%)", border: "1px solid hsl(210 30% 18%)" }}>
                <div className="font-orbitron text-xs tracking-[0.25em] uppercase mb-3 font-bold" style={{ color: "hsl(210 30% 50%)" }}>
                  CENTER DECK
                </div>
                <p className="text-xs mb-3" style={{ color: "hsl(210 30% 40%)", fontFamily: "'Exo 2', sans-serif" }}>
                  These roles were set aside and not assigned to any player.
                </p>
                <div className="flex flex-wrap gap-3">
                  {result.centerCards.map((roleId, idx) => {
                    const roleDef = ROLES.find((r) => r.id === roleId);
                    const isAlienTeam = roleDef?.team === "alien";
                    const isChaotic = roleDef?.team === "chaotic";
                    const roleColor = isAlienTeam ? "hsl(0 75% 60%)" : isChaotic ? "hsl(300 70% 65%)" : "hsl(185 100% 65%)";
                    return (
                      <div
                        key={idx}
                        className="flex flex-col items-center gap-1.5"
                        style={{ width: "80px" }}
                      >
                        {roleDef ? (
                          <img
                            src={roleDef.image}
                            alt={roleDef.name}
                            className="w-20 h-20 rounded-md object-cover"
                            loading="lazy"
                            style={{ border: `1px solid ${roleColor.replace(")", " / 0.4)")}` }}
                          />
                        ) : (
                          <div
                            className="w-20 h-20 rounded-md flex items-center justify-center"
                            style={{ background: "hsl(220 28% 12%)", border: "1px solid hsl(210 30% 20%)" }}
                          >
                            <span className="font-orbitron text-xs" style={{ color: "hsl(210 30% 40%)" }}>?</span>
                          </div>
                        )}
                        <span className="font-orbitron font-bold text-center leading-tight" style={{ color: roleColor, fontSize: "0.6rem", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                          {roleDef?.name ?? roleId}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Play again */}
            {isHost ? (
              <PlayAgainButton
                roomCode={roomCode}
                bannerColor={bannerColor}
                bannerGlow={bannerGlow}
              />
            ) : (
              <div className="rounded-md px-4 py-3 text-center" style={{ background: "hsl(220 28% 9%)", border: "1px solid hsl(210 30% 18%)" }}>
                <p className="font-orbitron text-xs tracking-[0.2em] uppercase" style={{ color: "hsl(210 30% 45%)" }}>
                  Waiting for host to start a new round...
                </p>
              </div>
            )}

            {/* Stats Display (Personal Stats + Leaderboard) */}
            {hasRecorded && (
              <>
                <div className="w-px h-6 mx-auto" style={{ background: "hsl(210 30% 25%)" }} />
                <StatsDisplay
                  personalStats={personalStats}
                  leaderboard={leaderboard}
                  isLoggedIn={isLoggedIn}
                />
              </>
            )}
          </>
        ) : (
          <div className="text-center py-12" style={{ color: "hsl(210 30% 45%)", fontFamily: "'Exo 2', sans-serif" }}>
            Loading results...
          </div>
        )}

      </div>
      </div>
      
      {result && !cinematicPlayed && (
        <EjectionCinematic 
          result={result} 
          onComplete={handleCinematicComplete} 
          lastMessage={(() => {
            const last = messages.filter(m => m.type === 'player' && m.username === result.eliminatedName).pop();
            return last?.type === 'player' ? last.message : undefined;
          })()}
        />
      )}

    </div>
  );
}

function WinParticles({ hue }: { hue: number }) {
  const particles = Array.from({ length: 24 }, (_, i) => i);
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {particles.map((i) => (
        <span
          key={i}
          className="absolute w-1.5 h-1.5 rounded-full"
          style={{
            left: `${8 + (i * 3.8) % 84}%`,
            top: `${8 + (i * 5.1) % 22}%`,
            background: `hsl(${hue} 95% ${55 + (i % 3) * 8}%)`,
            boxShadow: `0 0 10px hsl(${hue} 95% 58% / 0.75)`,
            animation: `result-particle-${i % 4} ${1.2 + (i % 5) * 0.22}s ease-out forwards`,
            animationDelay: `${(i % 8) * 0.06}s`,
            opacity: 0,
          }}
        />
      ))}
      <style>{`
        @keyframes result-particle-0 {
          0% { transform: translateY(0) scale(0.7); opacity: 0; }
          15% { opacity: 1; }
          100% { transform: translateY(-72px) translateX(-16px) scale(0.2); opacity: 0; }
        }
        @keyframes result-particle-1 {
          0% { transform: translateY(0) scale(0.7); opacity: 0; }
          15% { opacity: 1; }
          100% { transform: translateY(-65px) translateX(18px) scale(0.25); opacity: 0; }
        }
        @keyframes result-particle-2 {
          0% { transform: translateY(0) scale(0.7); opacity: 0; }
          15% { opacity: 1; }
          100% { transform: translateY(-80px) translateX(9px) scale(0.2); opacity: 0; }
        }
        @keyframes result-particle-3 {
          0% { transform: translateY(0) scale(0.7); opacity: 0; }
          15% { opacity: 1; }
          100% { transform: translateY(-58px) translateX(-10px) scale(0.2); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

function EjectionCinematic({
  result,
  onComplete,
  lastMessage,
}: {
  result: VoteResult;
  onComplete: () => void;
  lastMessage?: string;
}) {
  const [phase, setPhase] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // phase 0: Initial silence/vignette
    // phase 1: Video starts + Name appears
    // phase 2: Video reaches climax + Role Reveal
    // phase 3: Transition out
    const t1 = setTimeout(() => {
      setPhase(1);
      playMechanicalChunk();
      if (videoRef.current) {
        videoRef.current.currentTime = 0;
        videoRef.current.play().catch(e => console.error("Video play failed:", e));
      }
    }, 800);
    
    const t2 = setTimeout(() => {
      setPhase(2);
      playBassDrop();
    }, 3800);
    
    const t3 = setTimeout(() => setPhase(3), 7200);
    const t4 = setTimeout(onComplete, 7800);
    
    return () => { 
      clearTimeout(t1); 
      clearTimeout(t2); 
      clearTimeout(t3); 
      clearTimeout(t4); 
    };
  }, [onComplete]);

  const roleDef = ROLES.find((r) => r.id === result.eliminatedRole);
  const isAlien = roleDef?.team === "alien";
  const isChaotic = roleDef?.team === "chaotic";
  
  const themeColor = isAlien ? 'hsl(0 75% 55%)' : isChaotic ? 'hsl(270 70% 60%)' : 'hsl(185 100% 50%)';
  const themeGlow = isAlien ? 'hsl(0 75% 60% / 0.5)' : isChaotic ? 'hsl(270 70% 65% / 0.5)' : 'hsl(185 100% 60% / 0.5)';

  return (
    <div className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden bg-black transition-opacity duration-700 ${phase === 3 ? 'opacity-0' : 'opacity-100'}`}>
      
      {/* Cinematic Overlays */}
      <div className="absolute inset-0 pointer-events-none z-50">
        {/* Vignette */}
        <div className="absolute inset-0 shadow-[inset_0_0_150px_rgba(0,0,0,1)]" />
        {/* CRT Scanlines */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ background: "linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06))", backgroundSize: "100% 4px, 3px 100%" }} />
      </div>

      {/* Background Ambience */}
      <div className="absolute inset-0 opacity-40" style={{ background: `radial-gradient(circle at center, ${themeColor}11, transparent 70%)` }} />

      {result.eliminatedId ? (
        <div className="relative z-10 w-full max-w-4xl flex flex-col items-center justify-center px-6 gap-2 sm:gap-6">
          
          {/* Main Visual: Video Container */}
          <div 
            className={`relative aspect-square h-[40vh] sm:h-[55vh] max-w-full mx-auto rounded-lg overflow-hidden border-2 transition-all duration-1000 ${phase >= 1 ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}
            style={{ 
              borderColor: `${themeColor}44`,
              boxShadow: `0 0 40px ${themeColor}22`,
            }}
          >
            {roleDef && (
              <video
                ref={videoRef}
                src={roleDef.evictionVideo}
                className="w-full h-full object-contain"
                muted
                playsInline
              />
            )}
            
            {/* Cinematic HUD Elements */}
            <div className="absolute top-4 left-4 flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
                <div className="font-mono text-[10px] text-white/60 tracking-widest uppercase">REC // EXTERIOR_HATCH_04</div>
              </div>
              <div className="font-mono text-[8px] text-white/40 tracking-tighter">COORD: 42.091 // -11.084 // SPD: 0.00km/s</div>
            </div>

            {/* Glitch Overlay on Reveal */}
            <div className={`absolute inset-0 bg-white pointer-events-none z-20 mix-blend-overlay transition-opacity duration-300 ${phase === 2 ? 'opacity-20 animate-glitch-flash' : 'opacity-0'}`} />
          </div>

          {/* Text Information Container */}
          <div className="text-center flex flex-col items-center w-full gap-2 sm:gap-4">
            
            {/* Last Transmission */}
            <div className={`h-12 flex flex-col items-center justify-center transition-all duration-1000 ${phase >= 1 ? 'opacity-100' : 'opacity-0'}`}>
              {lastMessage ? (
                <div className="relative">
                  <div className="italic text-cyan-200/60 text-xs tracking-[0.2em] uppercase font-light max-w-md line-clamp-1" style={{ fontFamily: "'Exo 2', sans-serif" }}>
                    " {lastMessage} "
                  </div>
                  <div className="text-[7px] mt-1 text-cyan-400/40 tracking-[0.4em] font-bold">LAST TRANSMISSION INTERCEPTED</div>
                </div>
              ) : (
                <div className="text-[7px] text-white/20 tracking-[0.5em] font-bold">COMMUNICATION LINK SEVERED</div>
              )}
            </div>

            {/* Subject Name */}
            <div className="relative group">
              <div 
                className={`font-orbitron font-black text-3xl sm:text-5xl tracking-[0.3em] uppercase transition-all duration-1000 ${phase >= 1 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
                style={{ 
                  color: "white", 
                  textShadow: `0 0 30px ${themeColor}`,
                }}
              >
                {result.eliminatedName}
              </div>
              {/* Decorative side brackets */}
              <div className={`absolute -left-8 top-1/2 -translate-y-1/2 w-4 h-full border-l-2 border-t-2 border-b-2 transition-all duration-1000 delay-300 ${phase >= 1 ? 'opacity-30 scale-y-100' : 'opacity-0 scale-y-0'}`} style={{ borderColor: themeColor }} />
              <div className={`absolute -right-8 top-1/2 -translate-y-1/2 w-4 h-full border-r-2 border-t-2 border-b-2 transition-all duration-1000 delay-300 ${phase >= 1 ? 'opacity-30 scale-y-100' : 'opacity-0 scale-y-0'}`} style={{ borderColor: themeColor }} />
            </div>

            {/* Status Text */}
            <div className={`font-orbitron font-bold text-[10px] sm:text-sm tracking-[0.5em] uppercase transition-all duration-1000 delay-500 ${phase >= 1 ? 'opacity-60' : 'opacity-0'}`} style={{ color: "hsl(0 0% 90%)" }}>
              REMOVED FROM SYSTEM
            </div>

            {/* Role Reveal */}
            <div className="h-12 sm:h-16 flex items-center justify-center">
              <div 
                className={`relative px-8 py-2 sm:py-3 flex items-center gap-4 sm:gap-6 transition-all duration-700 ${phase >= 2 ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}
              >
                {/* Reveal Background Glow */}
                <div className="absolute inset-0 blur-2xl opacity-20" style={{ background: themeColor }} />
                
                {/* Left Line */}
                <div className="w-16 h-[1px] opacity-40" style={{ background: `linear-gradient(90deg, transparent, ${themeColor})` }} />
                
                <div className="flex flex-col items-center">
                  <div className="font-orbitron font-black text-2xl tracking-[0.4em] uppercase" style={{ color: themeColor, textShadow: `0 0 15px ${themeGlow}` }}>
                    {isAlien ? "ALIEN" : isChaotic ? "CHAOTIC" : "CREWMEMBER"}
                  </div>
                  <div className="text-[9px] tracking-[0.8em] font-bold text-white/40 mt-1 uppercase">VERIFIED IDENTITY</div>
                </div>

                {/* Right Line */}
                <div className="w-16 h-[1px] opacity-40" style={{ background: `linear-gradient(90deg, ${themeColor}, transparent)` }} />
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="relative z-10 text-center px-6">
          <div className="w-24 h-24 mx-auto mb-8 relative">
            <div className="absolute inset-0 rounded-full border-4 border-white/10 animate-ping" />
            <div className="absolute inset-0 rounded-full border-2 border-white/20 flex items-center justify-center">
              <div className="w-12 h-1 bg-white/40 rotate-45" />
              <div className="absolute w-12 h-1 bg-white/40 -rotate-45" />
            </div>
          </div>
          <div className={`font-orbitron font-black text-3xl tracking-[0.5em] uppercase transition-all duration-1000 ${phase >= 1 ? 'opacity-100' : 'opacity-0'}`} style={{ color: "hsl(210 30% 60%)" }}>
            EJECTION ABORTED
          </div>
          <div className={`mt-6 font-orbitron font-bold text-lg tracking-[0.3em] uppercase transition-all duration-1000 delay-300 ${phase >= 2 ? 'opacity-100' : 'opacity-0'}`} style={{ color: "hsl(210 30% 40%)" }}>
            STALEMATE DETECTED
          </div>
        </div>
      )}

      <style>{`
        @keyframes glitch-flash {
          0% { opacity: 0; transform: skewX(0deg); }
          20% { opacity: 0.5; transform: skewX(10deg); }
          40% { opacity: 0.3; transform: skewX(-10deg); }
          60% { opacity: 0.6; transform: skewX(5deg); }
          100% { opacity: 0; transform: skewX(0deg); }
        }
        .animate-glitch-flash {
          animation: glitch-flash 0.4s ease-out;
        }
        @keyframes scanline {
          0% { top: 0%; }
          100% { top: 100%; }
        }
        .animate-scanline {
          animation: scanline 4s linear infinite;
        }
      `}</style>
    </div>
  );
}


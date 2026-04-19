import { useState, useEffect, useCallback, useRef } from "react";
import { getSocket } from "@/lib/socket";
import { ROLES } from "@/data/roles";
import { playGameOutcome, playSciFiClick } from "@/lib/sound";
import { useAuth } from "@/hooks/useAuth";
import { useRecordGameResult, determinePlayerWon, generateGameId } from "@/hooks/useRecordGameResult";
import { getSoundEnabled, setSoundEnabled, startLobbyMusic, stopLobbyMusic } from "@/lib/music";
import HamburgerMenu from "@/components/HamburgerMenu";
import SettingsModal from "@/components/SettingsModal";
import StatsDisplay from "@/components/StatsDisplay";
import ProfileModal from "@/components/ProfileModal";
import { TeamIcon } from "@/components/TeamIcon";

interface VoteResult {
  eliminatedId: string | null;
  eliminatedName: string | null;
  eliminatedRole: string | null;
  winTeam: "crew" | "alien" | "tie";
  allRoles: { playerId: string; stablePlayerId?: string; playerName: string; role: string; initialRole: string; alive?: boolean }[];
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
  return sessionStorage.getItem("lp_roomCode") || "------";
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

export default function ResultPage() {
  const roomCode = getRoomCode();
  const { isLoggedIn, userId, isInitialized } = useAuth();
  const { recordResult, personalStats, leaderboard, hasRecorded, fetchLeaderboard } = useRecordGameResult();

  // Host status is derived from the server's session player list — not from
  // sessionStorage — so it is always accurate regardless of page reloads.
  const [isHost, setIsHost] = useState(false);

  const [result, setResult] = useState<VoteResult | null>(null);
  const [summary, setSummary] = useState<RoundSummary | null>(null);
  const [gameId] = useState(() => generateGameId());
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [musicOn, setMusicOn] = useState<boolean>(getSoundEnabled);
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

    const myStablePlayerId = sessionStorage.getItem("lp_playerId");
    const mySocketId = getSocket().id;
    const callsign = (sessionStorage.getItem("lp_callsign") || "").toUpperCase();

    const playerData = voteResult.allRoles.find((p) =>
      (myStablePlayerId && p.stablePlayerId === myStablePlayerId)
      || (!!mySocketId && p.playerId === mySocketId)
      || (!!callsign && p.playerName.toUpperCase() === callsign)
    );

    if (!playerData) return;

    if (!isInitialized) {
      setPendingVoteResult(voteResult);
      return;
    }

    if (!isLoggedIn || !userId) return;

    recordedResultRef.current = true;
    const won = determinePlayerWon(playerData.role, voteResult.winTeam) ? "yes" : "no";
    recordResult({ gameId, role: playerData.role, won });
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
        players?: { id: string; name: string; isHost: boolean }[];
        voteResult?: VoteResult | null;
        roundSummary?: RoundSummary;
      };
    }) => {
      if (resp.success && resp.session) {
        if (resp.session.voteResult) {
          setResult((prev) => JSON.stringify(prev) === JSON.stringify(resp.session.voteResult) ? prev : resp.session.voteResult!);
          if (!resultPlayedRef.current) {
            resultPlayedRef.current = true;
            playGameOutcome(resp.session.voteResult.winTeam);
          }
          maybeRecordMyResult(resp.session.voteResult);
        }
        if (resp.session.roundSummary) setSummary((prev) => JSON.stringify(prev) === JSON.stringify(resp.session.roundSummary) ? prev : resp.session.roundSummary!);

        // Derive host status from the server's player list rather than from
        // sessionStorage.  Match by socket.id (most reliable) or by stable
        // playerId UUID if stored (covers reconnect scenarios where socket.id
        // may differ).  No name-based fallback is used to avoid false matches
        // when two players share the same callsign.
        if (resp.session.players) {
          const mySocketId = socket.id;
          const myPlayerId = sessionStorage.getItem("lp_playerId") ?? null;
          const myPlayer = resp.session.players.find(
            (p) => p.id === mySocketId || (myPlayerId && (p as { playerId?: string }).playerId === myPlayerId),
          );
          if (myPlayer?.isHost === true) setIsHost(true);
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
          players?: { id: string; name: string; isHost: boolean }[];
          voteResult?: VoteResult | null;
          roundSummary?: RoundSummary;
        };
      }) => {
        if (resp.success && resp.session) {
          if (resp.session.voteResult) setResult((prev) => JSON.stringify(prev) === JSON.stringify(resp.session.voteResult) ? prev : resp.session.voteResult!);
          if (resp.session.roundSummary) setSummary((prev) => JSON.stringify(prev) === JSON.stringify(resp.session.roundSummary) ? prev : resp.session.roundSummary!);
          if (resp.session.players) {
            const mySocketId = socket.id;
            const myPlayerId = sessionStorage.getItem("lp_playerId") ?? null;
            const myPlayer = resp.session.players.find(
              (p) => p.id === mySocketId || (myPlayerId && (p as { playerId?: string }).playerId === myPlayerId),
            );
            if (myPlayer?.isHost === true) setIsHost(true);
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

  const winTeam = result?.winTeam ?? "tie";
  const crewWon = winTeam === "crew";
  const alienWon = winTeam === "alien";

  const bannerColor = crewWon ? "hsl(185 100% 50%)" : alienWon ? "hsl(0 75% 55%)" : "hsl(270 70% 60%)";
  const bannerGlow = crewWon ? "hsl(185 100% 50% / 0.4)" : alienWon ? "hsl(0 75% 55% / 0.4)" : "hsl(270 70% 60% / 0.4)";
  const bannerDim = crewWon ? "hsl(185 100% 50% / 0.1)" : alienWon ? "hsl(0 75% 55% / 0.1)" : "hsl(270 70% 60% / 0.1)";
  const bgTint = crewWon ? "hsl(200 30% 6%)" : alienWon ? "hsl(0 40% 6%)" : "hsl(270 30% 6%)";

  const winLabel = crewWon ? "CREW VICTORY" : alienWon ? "ALIEN VICTORY" : "NO CONSENSUS";
  const winSub = crewWon
    ? "The alien has been identified and eliminated."
    : alienWon
      ? "The alien survived. The infestation continues."
      : "No player received enough votes. The alien remains hidden.";

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
    <div className="relative min-h-screen w-full flex flex-col" style={{ background: bgTint, color: "hsl(190 80% 90%)" }}>
      {/* Hamburger Menu */}
      <HamburgerMenu
        onShowSettings={() => setShowSettingsModal(true)}
        onShowProfile={() => setShowProfileModal(true)}
        onShowHowToPlay={() => {}} // No how to play in result
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
        style={{ background: "hsl(220 28% 7%)", borderColor: bannerColor.replace(")", " / 0.25)"), boxShadow: `0 1px 12px ${bannerGlow.replace("0.4", "0.1")}` }}
      >
        <div>
          <div className="font-orbitron font-black text-lg tracking-widest uppercase leading-none" style={{ color: bannerColor, textShadow: `0 0 12px ${bannerGlow}` }}>
            ERROR: NEWFORM
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
              <div className="rounded-md p-4" style={{ background: "hsl(220 28% 9%)", border: "1px solid hsl(210 30% 18%)" }}>
                <div className="font-orbitron text-xs tracking-[0.25em] uppercase mb-3 font-bold" style={{ color: "hsl(210 30% 50%)" }}>
                  ELIMINATED
                </div>
                <div className="flex items-center gap-4">
                  {(() => {
                    const roleDef = ROLES.find((r) => r.id === result.eliminatedRole);
                    return roleDef ? (
                      <img src={roleDef.image} alt={roleDef.name} className="w-14 h-14 rounded-md object-cover shrink-0" loading="lazy" style={{ border: "1px solid hsl(210 30% 25%)" }} />
                    ) : null;
                  })()}
                  <div>
                    <div className="font-orbitron font-black text-xl tracking-widest uppercase" style={{ color: "hsl(190 80% 85%)" }}>
                      {result.eliminatedName}
                    </div>
                    <div className="text-xs tracking-widest uppercase mt-1" style={{ color: "hsl(210 30% 50%)" }}>
                      ROLE: <span className="font-orbitron font-bold" style={{ color: bannerColor }}>
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
                {summary && summary.abilityLog.length > 0 ? (
                  <div className="flex flex-col gap-1.5">
                    {summary.abilityLog.map((entry, idx) => (
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
                          {/* Alive/eliminated badge intentionally disabled for now. */}
                          {isEliminated && (
                            <span className="text-xs shrink-0" style={{ color: "hsl(0 60% 50%)" }}>✕</span>
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
      
      {result && !cinematicPlayed && (
        <EjectionCinematic result={result} onComplete={handleCinematicComplete} />
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
}: {
  result: VoteResult;
  onComplete: () => void;
}) {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    // phase 0: initial blank/stars
    // phase 1: text appears + character drifts
    // phase 2: role reveal text appears
    // phase 3: fade out
    const t1 = setTimeout(() => setPhase(1), 500);
    const t2 = setTimeout(() => setPhase(2), 3000);
    const t3 = setTimeout(() => setPhase(3), 6000);
    const t4 = setTimeout(onComplete, 6500);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
  }, [onComplete]);

  const roleDef = ROLES.find((r) => r.id === result.eliminatedRole);
  const isAlien = roleDef?.team === "alien";

  return (
    <div className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden bg-black transition-opacity duration-500 ${phase === 3 ? 'opacity-0' : 'opacity-100'}`}>
      
      {/* Deep space background */}
      <div className="absolute inset-0 opacity-80" style={{ background: "radial-gradient(circle at center, hsl(210 40% 12%), black 80%)" }} />

      {result.eliminatedId ? (
        <div className="relative z-10 flex flex-col items-center w-full">
          {/* Character drifting across screen */}
          <div className="absolute w-full h-full pointer-events-none flex items-center justify-center">
            {roleDef && (
              <img 
                src={roleDef.image} 
                alt={roleDef.name}
                className={`w-32 h-32 rounded-lg object-cover transition-all ${phase >= 1 ? 'animate-airlock-eject-cinematic' : 'opacity-0'}`}
                style={{ border: `2px solid ${isAlien ? 'hsl(0 75% 55%)' : 'hsl(185 100% 50%)'}`, boxShadow: `0 0 30px ${isAlien ? 'hsl(0 75% 55% / 0.5)' : 'hsl(185 100% 50% / 0.5)'}` }}
              />
            )}
          </div>

          <div className="mt-48 text-center flex flex-col gap-4">
            <div className={`font-orbitron font-black text-2xl tracking-[0.3em] uppercase transition-all duration-1000 ${phase >= 1 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`} style={{ color: "hsl(190 80% 90%)" }}>
              {result.eliminatedName} WAS EJECTED
            </div>
            
            <div className={`font-orbitron font-bold text-xl tracking-[0.2em] uppercase transition-all duration-1000 flex items-center justify-center gap-3 ${phase >= 2 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`} style={{ color: isAlien ? "hsl(0 75% 60%)" : "hsl(185 100% 60%)" }}>
              THEY WERE {isAlien ? "AN ALIEN" : "A CREWMEMBER"} <TeamIcon team={roleDef?.team || "crew"} />
            </div>
          </div>
        </div>
      ) : (
        <div className="relative z-10 text-center">
          <div className={`font-orbitron font-black text-2xl tracking-[0.3em] uppercase transition-all duration-1000 ${phase >= 1 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`} style={{ color: "hsl(210 30% 60%)" }}>
            NO ONE WAS EJECTED
          </div>
          <div className={`mt-4 font-orbitron font-bold text-xl tracking-[0.2em] uppercase transition-all duration-1000 ${phase >= 2 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`} style={{ color: "hsl(210 30% 50%)" }}>
            TIED VOTE
          </div>
        </div>
      )}

      <style>{`
        @keyframes drift-bg {
          0% { transform: scale(1.1) translateX(0); }
          100% { transform: scale(1.1) translateX(-5%); }
        }
        @keyframes airlock-eject-cinematic {
          0% { transform: scale(1.2) translateX(-100vw) rotate(-45deg); opacity: 0; filter: blur(2px); }
          20% { opacity: 1; filter: blur(0px); transform: scale(1) translateX(-30vw) rotate(-15deg); }
          80% { opacity: 1; filter: blur(0px); transform: scale(1) translateX(30vw) rotate(15deg); }
          100% { transform: scale(0.5) translateX(100vw) rotate(120deg); opacity: 0; filter: blur(4px); }
        }
        .animate-airlock-eject-cinematic {
          animation: airlock-eject-cinematic 6s linear forwards;
        }
      `}</style>
    </div>
  );
}

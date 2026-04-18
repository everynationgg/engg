import { useState, useEffect, useCallback, useRef } from "react";
import { getSocket } from "@/lib/socket";
import { ROLES } from "@/data/roles";
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
}

function getRoomCode(): string {
  return sessionStorage.getItem("lp_roomCode") || "------";
}
function getCallsign(): string {
  return sessionStorage.getItem("lp_callsign") || "UNKNOWN";
}
function getInitialRoleId(): string {
  return sessionStorage.getItem("lp_assignedRole") || "crew";
}
function getOrbitResult(): { type: string; data?: unknown } | null {
  try { return JSON.parse(sessionStorage.getItem("lp_orbit_result") ?? "null"); } catch { return null; }
}

export default function DiscussionPage() {
  const roomCode = getRoomCode();
  const callsign = getCallsign();
  const initialRoleId = getInitialRoleId();
  const role = ROLES.find((r) => r.id === initialRoleId) ?? ROLES[6];
  const isAlien = role.team === "alien";
  const isChaotic = role.team === "chaotic";
  const accentColor = isAlien ? "hsl(0 75% 55%)" : isChaotic ? "hsl(300 70% 55%)" : "hsl(185 100% 50%)";
  const accentLight = isAlien ? "hsl(0 75% 70%)" : isChaotic ? "hsl(300 70% 70%)" : "hsl(185 100% 70%)";
  const accentGlow = isAlien ? "hsl(0 75% 55% / 0.4)" : isChaotic ? "hsl(300 70% 55% / 0.4)" : "hsl(185 100% 50% / 0.4)";
  const accentDim = isAlien ? "hsl(0 75% 55% / 0.12)" : isChaotic ? "hsl(300 70% 55% / 0.12)" : "hsl(185 100% 50% / 0.12)";
  const bgTint = isAlien ? "hsl(0 40% 6%)" : isChaotic ? "hsl(290 30% 6%)" : "hsl(200 30% 6%)";
  const bgOverlay = isAlien ? "hsl(0 35% 3% / 0.83)" : isChaotic ? "hsl(290 25% 3% / 0.83)" : "hsl(200 25% 3% / 0.83)";

  const [sessionPlayers, setSessionPlayers] = useState<LivePlayer[]>([]);
  const [orbitResultState, setOrbitResultState] = useState<{ type: string; data?: unknown } | null>(() => getOrbitResult());
  const [roleCounts, setRoleCounts] = useState<Record<string, number>>({});
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [musicOn, setMusicOn] = useState<boolean>(getSoundEnabled);

  const [evPopup, setEvPopup] = useState<{ callerName: string } | null>(null);
  const [evCast, setEvCast] = useState<"yes" | "no" | null>(null);
  const [evResult, setEvResult] = useState<{ passed: boolean; msg: string } | null>(null);
  const [cooldownLeft, setCooldownLeft] = useState<number>(0);
  const [evLoading, setEvLoading] = useState(false);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [roomCopyFeedback, setRoomCopyFeedback] = useState(false);

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

    const handlePhaseUpdate = (session: { phase: string; players: LivePlayer[] }) => {
      const myPlayerId = sessionStorage.getItem("lp_playerId");
      const myId = socket.id;
      setSessionPlayers(session.players.map((p) => ({ ...p, isYou: myPlayerId ? p.playerId === myPlayerId : p.id === myId })));
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
      socket.emit("get_session", { sessionId: roomCode }, (resp: { success: boolean; session?: { phase: string; players: LivePlayer[]; orbitFeedback?: Record<string, unknown>; roleCounts?: Record<string, number> } }) => {
        if (resp.success && resp.session) {
          const myPlayerId = sessionStorage.getItem("lp_playerId");
          const myId = socket.id;
          setSessionPlayers(resp.session.players.map((p) => ({ ...p, isYou: myPlayerId ? p.playerId === myPlayerId : p.id === myId })));

          // Populate roles-in-play from session config
          if (resp.session.roleCounts) setRoleCounts(resp.session.roleCounts);

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

  const abilityResultText = renderOrbitResultSummary(orbitResultState, accentLight);

  return (
    <div
      className="relative min-h-screen w-full flex flex-col"
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
        onShowHowToPlay={() => {}} // No how to play in discussion
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
          <div className="text-xs tracking-widest uppercase mb-1" style={{ color: "hsl(210 30% 50%)" }}>Phase</div>
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
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded"
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
            CREW MANIFEST — {sessionPlayers.length} ABOARD
          </div>
          <div className="flex flex-col gap-2">
            {sessionPlayers.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between px-3 py-2 rounded"
                style={{ background: "hsl(220 28% 12%)", border: p.isYou ? `1px solid ${accentColor.replace(")", " / 0.5)")}` : "1px solid hsl(210 30% 16%)" }}
              >
                <span className="font-orbitron text-sm tracking-wider uppercase" style={{ color: p.isYou ? accentLight : "hsl(190 60% 75%)" }}>
                  {p.name}
                </span>
                <div className="flex items-center gap-2">
                  {/* Status chips (alive/connected) intentionally disabled for now. */}
                  {p.isYou && (
                    <span className="text-xs tracking-widest uppercase" style={{ color: "hsl(210 30% 40%)" }}>YOU</span>
                  )}
                </div>
              </div>
            ))}
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

      </div>

      {/* Emergency vote popup */}
      {evPopup && (
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
): React.ReactNode {
  const muted: React.CSSProperties = { color: "hsl(210 30% 50%)", fontFamily: "'Exo 2', sans-serif" };
  const info: React.CSSProperties = { color: "hsl(190 60% 78%)", fontFamily: "'Exo 2', sans-serif" };
  const warn: React.CSSProperties = { color: "hsl(45 80% 65%)", fontFamily: "'Exo 2', sans-serif" };
  const good: React.CSSProperties = { color: "hsl(140 70% 60%)", fontFamily: "'Exo 2', sans-serif" };

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

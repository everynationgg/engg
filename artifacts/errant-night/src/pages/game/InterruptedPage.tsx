import { useState, useEffect, useCallback } from "react";
import { getSocket } from "@/lib/socket";
import { playSciFiClick } from "@/lib/sound";
import { isPlayerConnected, isPlayerReconnecting, isPlayerDisconnected } from "@/lib/utils";
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
  didQuit?: boolean;
}

function getRoomCode(): string {
  return gameSessionStore.getRoomCode("------");
}

export default function InterruptedPage() {
  const roomCode = getRoomCode();

  const [isHost, setIsHost] = useState(false);
  const [sessionPlayers, setSessionPlayers] = useState<LivePlayer[]>([]);
  const [graceActive, setGraceActive] = useState(false);
  const [restartLoading, setRestartLoading] = useState(false);
  const [endLoading, setEndLoading] = useState(false);
  const [continueLoading, setContinueLoading] = useState(false);

  const accentColor = "hsl(50 100% 50%)";
  const accentGlow = "hsl(50 100% 50% / 0.4)";

  useEffect(() => {
    const socket = getSocket();

    const handlePhaseUpdate = (session: { players: LivePlayer[]; playersInGrace?: string[] }) => {
      if (!session.players) return;
      const me = session.players.find((p) => p.id === socket.id);
      setIsHost(me?.isHost ?? false);
      setSessionPlayers(
        session.players.map((p) => ({
          ...p,
          isYou: p.id === socket.id,
        })),
      );
      setGraceActive((session.playersInGrace?.length ?? 0) > 0);
    };

    const handleGraceUpdate = (data: { playersInGrace: string[] }) => {
      setGraceActive(data.playersInGrace.length > 0);
    };

    socket.on("phase_update", handlePhaseUpdate);
    socket.on("grace_update", handleGraceUpdate);

    // Shared sync helper
    const fetchSession = () => {
      socket.emit(
        "get_session",
        { sessionId: roomCode },
        (resp: { success: boolean; session?: { players: LivePlayer[]; playersInGrace?: string[] } }) => {
          if (resp.success && resp.session) handlePhaseUpdate(resp.session);
        },
      );
    };

    fetchSession();

    // Periodic fallback: poll every 3 seconds so the UI stays in sync even when
    // phase_update socket events are missed.
    const pollId = setInterval(fetchSession, 3000);

    return () => {
      socket.off("phase_update", handlePhaseUpdate);
      socket.off("grace_update", handleGraceUpdate);
      clearInterval(pollId);
    };
  }, [roomCode]);

  const handleRestart = useCallback(() => {
    playSciFiClick();
    const socket = getSocket();
    setRestartLoading(true);
    socket.emit(
      "restart_game",
      { sessionId: roomCode },
      (resp: { success: boolean; error?: string }) => {
        setRestartLoading(false);
        if (!resp.success) {
          console.error("Restart failed:", resp.error);
        }
      },
    );
  }, [roomCode]);

  const handleEndGame = useCallback(() => {
    playSciFiClick();
    const socket = getSocket();
    setEndLoading(true);
    socket.emit(
      "end_game",
      { sessionId: roomCode },
      (resp: { success: boolean; error?: string }) => {
        setEndLoading(false);
        if (!resp.success) {
          console.error("End game failed:", resp.error);
        }
      },
    );
  }, [roomCode]);

  const handleContinue = useCallback(() => {
    playSciFiClick();
    const socket = getSocket();
    setContinueLoading(true);
    socket.emit(
      "continue_game",
      { sessionId: roomCode },
      (resp: { success: boolean; error?: string }) => {
        setContinueLoading(false);
        if (!resp.success) {
          console.error("Continue game failed:", resp.error);
        }
      },
    );
  }, [roomCode]);


  // Exclude quit players from all lists
  const activePlayers = sessionPlayers.filter(p => !p.didQuit);
  const connectedPlayers = activePlayers.filter(isPlayerConnected);
  const reconnectingPlayers = activePlayers.filter(isPlayerReconnecting);
  const disconnectedPlayers = activePlayers.filter(isPlayerDisconnected);

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-8 relative"
      style={{ background: "hsl(50 20% 4%)" }}
    >
      {/* Background pulse */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at center, hsl(50 100% 50% / 0.04) 0%, transparent 70%)`,
        }}
      />

      <div className="relative z-10 w-full max-w-md flex flex-col items-center gap-6">
        {/* Warning icon + title */}
        <div className="text-center">
          <div className="text-5xl mb-3 glitch-text" data-text="⚠️">⚠️</div>
          <h1
            className="font-orbitron font-black text-3xl tracking-[0.2em] uppercase glitch-text"
            data-text="SIGNAL LOST"
            style={{ color: accentColor }}
          >
            SIGNAL LOST
          </h1>
          <p
            className="mt-2 font-orbitron text-xs tracking-[0.1em]"
            style={{ color: "hsl(50 60% 70%)" }}
          >
            A player has disconnected from the server.
          </p>
          <p
            className="mt-1 font-orbitron text-[0.6rem] tracking-[0.1em]"
            style={{ color: "hsl(50 40% 55%)" }}
          >
            Game paused due to player leaving.
          </p>
        </div>

        {/* Players list */}
        <div
          className="w-full rounded-lg p-4"
          style={{
            background: "hsl(220 28% 8%)",
            border: "1px solid hsl(50 100% 50% / 0.3)",
          }}
        >
          <p
            className="font-orbitron text-xs tracking-[0.2em] uppercase mb-3"
            style={{ color: "hsl(210 30% 55%)" }}
          >
            Players in Session
          </p>
          <div className="flex flex-col gap-2">
            {connectedPlayers.map((p) => (
              <div
                key={p.id}
                className="flex items-center gap-2 px-3 py-2 rounded"
                style={{
                  background: p.isYou ? "hsl(185 100% 50% / 0.08)" : "hsl(220 28% 12%)",
                  border: `1px solid ${p.isYou ? "hsl(185 100% 50% / 0.3)" : "hsl(210 30% 20%)"}`,
                }}
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ background: "hsl(120 70% 50%)" }}
                />
                <span
                  className="font-orbitron text-xs tracking-[0.1em] flex-1"
                  style={{ color: "hsl(210 30% 80%)" }}
                >
                  {p.name}
                  {p.isHost && (
                    <span
                      className="ml-2 text-[0.65rem]"
                      style={{ color: "hsl(50 100% 60%)" }}
                    >
                      HOST
                    </span>
                  )}
                  {p.isYou && (
                    <span
                      className="ml-2 text-[0.65rem]"
                      style={{ color: "hsl(185 100% 60%)" }}
                    >
                      YOU
                    </span>
                  )}
                </span>
              </div>
            ))}
            {reconnectingPlayers.map((p) => (
              <div
                key={p.id}
                className="flex items-center gap-2 px-3 py-2 rounded"
                style={{
                  background: "hsl(45 30% 10%)",
                  border: "1px solid hsl(45 90% 55% / 0.4)",
                }}
              >
                <span
                  className="ix-player-dot--reconnecting w-2 h-2 rounded-full"
                  style={{ background: "hsl(45 90% 55%)" }}
                />
                <span
                  className="font-orbitron text-xs tracking-[0.1em] flex-1"
                  style={{ color: "hsl(45 60% 75%)" }}
                >
                  {p.name}
                  <span
                    className="ml-2 text-[0.6rem]"
                    style={{ color: "hsl(45 90% 60%)" }}
                  >
                    RECONNECTING…
                  </span>
                </span>
              </div>
            ))}
            {disconnectedPlayers.map((p) => (
              <div
                key={p.id}
                className="flex items-center gap-2 px-3 py-2 rounded opacity-50"
                style={{
                  background: "hsl(220 28% 10%)",
                  border: "1px solid hsl(0 60% 30% / 0.4)",
                }}
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ background: "hsl(0 70% 50%)" }}
                />
                <span
                  className="font-orbitron text-xs tracking-[0.1em] flex-1"
                  style={{ color: "hsl(210 30% 60%)" }}
                >
                  {p.name}
                  <span
                    className="ml-2 text-[0.6rem]"
                    style={{ color: "hsl(0 70% 60%)" }}
                  >
                    DISCONNECTED
                  </span>
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Host controls */}
        {isHost ? (
          <div className="w-full flex flex-col gap-3">
            {graceActive && (
              <div
                className="w-full rounded-lg px-4 py-3 text-center"
                style={{
                  background: "hsl(40 80% 10% / 0.6)",
                  border: "1px solid hsl(50 100% 50% / 0.4)",
                }}
              >
                <div className="ix-typing-dots mb-1">
                  <span className="inline-block w-1.5 h-1.5 rounded-full mx-0.5" style={{ background: accentColor }} />
                  <span className="inline-block w-1.5 h-1.5 rounded-full mx-0.5" style={{ background: accentColor }} />
                  <span className="inline-block w-1.5 h-1.5 rounded-full mx-0.5" style={{ background: accentColor }} />
                </div>
                <p
                  className="font-orbitron text-[0.6rem] tracking-[0.1em]"
                  style={{ color: "hsl(50 80% 65%)" }}
                >
                  Waiting for player to reconnect…
                </p>
              </div>
            )}
            <p
              className="font-orbitron text-[0.65rem] tracking-[0.15em] text-center uppercase"
              style={{ color: "hsl(50 60% 65%)" }}
            >
              As host, you can continue, restart, or end the game
            </p>
            <button
              onClick={handleContinue}
              disabled={continueLoading}
              className="ix-btn w-full py-3.5 font-orbitron font-bold text-sm tracking-[0.25em] uppercase rounded-md border-2 transition-all duration-150 cursor-pointer"
              style={{
                background: continueLoading
                  ? "hsl(220 28% 8%)"
                  : "hsl(140 70% 40% / 0.12)",
                borderColor: continueLoading
                  ? "hsl(210 30% 20%)"
                  : "hsl(140 70% 50%)",
                color: continueLoading
                  ? "hsl(210 30% 40%)"
                  : "hsl(140 70% 70%)",
                boxShadow: continueLoading
                  ? "none"
                  : "0 0 8px hsl(140 70% 50% / 0.4)",
                cursor: continueLoading ? "not-allowed" : "pointer",
              }}
              onMouseEnter={(e) => {
                if (!continueLoading)
                  e.currentTarget.style.boxShadow =
                    "0 0 18px hsl(140 70% 50% / 0.7)";
              }}
              onMouseLeave={(e) => {
                if (!continueLoading)
                  e.currentTarget.style.boxShadow =
                    "0 0 8px hsl(140 70% 50% / 0.4)";
              }}
            >
              {continueLoading ? "RESUMING..." : "CONTINUE GAME"}
            </button>
            <button
              onClick={handleRestart}
              disabled={restartLoading}
              className="ix-btn w-full py-3.5 font-orbitron font-bold text-sm tracking-[0.25em] uppercase rounded-md border-2 transition-all duration-150 cursor-pointer"
              style={{
                background: restartLoading
                  ? "hsl(220 28% 8%)"
                  : "hsl(185 100% 50% / 0.12)",
                borderColor: restartLoading
                  ? "hsl(210 30% 20%)"
                  : "hsl(185 100% 50%)",
                color: restartLoading
                  ? "hsl(210 30% 40%)"
                  : "hsl(185 100% 70%)",
                boxShadow: restartLoading
                  ? "none"
                  : "0 0 8px hsl(185 100% 50% / 0.4)",
                cursor: restartLoading ? "not-allowed" : "pointer",
              }}
              onMouseEnter={(e) => {
                if (!restartLoading)
                  e.currentTarget.style.boxShadow =
                    "0 0 18px hsl(185 100% 50% / 0.7)";
              }}
              onMouseLeave={(e) => {
                if (!restartLoading)
                  e.currentTarget.style.boxShadow =
                    "0 0 8px hsl(185 100% 50% / 0.4)";
              }}
            >
              {restartLoading ? "RESTARTING..." : "RESTART ROUND"}
            </button>
            <button
              onClick={handleEndGame}
              disabled={endLoading}
              className="ix-btn w-full py-3.5 font-orbitron font-bold text-sm tracking-[0.25em] uppercase rounded-md border-2 transition-all duration-150 cursor-pointer"
              style={{
                background: endLoading
                  ? "hsl(220 28% 8%)"
                  : "hsl(0 70% 50% / 0.12)",
                borderColor: endLoading
                  ? "hsl(210 30% 20%)"
                  : "hsl(0 80% 45%)",
                color: endLoading
                  ? "hsl(210 30% 40%)"
                  : "hsl(0 80% 70%)",
                boxShadow: endLoading
                  ? "none"
                  : "0 0 8px hsl(0 80% 50% / 0.4)",
                cursor: endLoading ? "not-allowed" : "pointer",
              }}
              onMouseEnter={(e) => {
                if (!endLoading)
                  e.currentTarget.style.boxShadow =
                    "0 0 18px hsl(0 80% 50% / 0.7)";
              }}
              onMouseLeave={(e) => {
                if (!endLoading)
                  e.currentTarget.style.boxShadow =
                    "0 0 8px hsl(0 80% 50% / 0.4)";
              }}
            >
              {endLoading ? "ENDING..." : "END GAME"}
            </button>
          </div>
        ) : (
          /* Non-host waiting view */
          <div
            className="w-full rounded-lg p-5 text-center"
            style={{
              background: "hsl(220 28% 8%)",
              border: "1px solid hsl(210 30% 25%)",
            }}
          >
            <div className="ix-typing-dots mb-2">
              <span className="inline-block w-1.5 h-1.5 rounded-full mx-0.5" style={{ background: accentColor }} />
              <span className="inline-block w-1.5 h-1.5 rounded-full mx-0.5" style={{ background: accentColor }} />
              <span className="inline-block w-1.5 h-1.5 rounded-full mx-0.5" style={{ background: accentColor }} />
            </div>
            <p
              className="font-orbitron text-xs tracking-[0.1em]"
              style={{ color: "hsl(210 30% 65%)" }}
            >
              Waiting for host to restart the game...
            </p>
          </div>
        )}

        {/* Room code footer */}
        <div className="text-center mt-2">
          <p
            className="font-orbitron text-[0.6rem] tracking-[0.2em] uppercase"
            style={{ color: "hsl(210 30% 40%)" }}
          >
            ROOM {roomCode}
          </p>
        </div>
      </div>

    </div>
  );
}


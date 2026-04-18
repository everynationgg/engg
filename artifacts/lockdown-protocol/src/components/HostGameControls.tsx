/**
 * HostGameControls — floating overlay for host-only continue/restart controls.
 *
 * Shown during active gameplay phases (not role_config, not interrupted) when:
 *   - The current user is the host
 *   - At least one player is reconnecting or disconnected
 *
 * Provides two buttons:
 *   - CONTINUE GAME  → clears grace, marks reconnecting as disconnected, resumes
 *   - RESTART GAME   → resets to role_config
 */

import { useState, useEffect, useCallback } from "react";
import { getSocket } from "@/lib/socket";
import { playSciFiClick } from "@/lib/sound";
import { isPlayerReconnecting, isPlayerDisconnected } from "@/lib/utils";

interface PlayerInfo {
  id: string;
  name: string;
  isHost: boolean;
  connected?: boolean;
  connectionStatus?: "connected" | "reconnecting" | "disconnected";
  didQuit?: boolean;
}

interface HostGameControlsProps {
  phase: string;
  roomCode: string;
  /** When "inline", renders buttons without the fixed floating wrapper */
  variant?: "floating" | "inline";
}

export default function HostGameControls({ phase, roomCode, variant = "floating" }: HostGameControlsProps) {
  const [isHost, setIsHost] = useState(false);
  const [hasDisconnectedPlayers, setHasDisconnectedPlayers] = useState(false);
  const [continueLoading, setContinueLoading] = useState(false);
  const [restartLoading, setRestartLoading] = useState(false);

  useEffect(() => {
    const socket = getSocket();

    const syncState = (session: {
      players?: PlayerInfo[];
      playersInGrace?: string[];
    }) => {
      if (!session.players) return;
      const me = session.players.find((p) => p.id === socket.id);
      setIsHost(me?.isHost ?? false);
      const hasIssue = session.players.some(
        (p) => !p.didQuit && (isPlayerReconnecting(p) || isPlayerDisconnected(p)),
      );
      setHasDisconnectedPlayers(hasIssue);
    };

    const handlePhaseUpdate = (session: Parameters<typeof syncState>[0]) =>
      syncState(session);
    const handleGraceUpdate = (data: {
      playersInGrace: string[];
      players?: PlayerInfo[];
    }) => {
      if (data.players) {
        syncState({ players: data.players });
      } else {
        // When no player data is provided, derive from grace list
        setHasDisconnectedPlayers(data.playersInGrace.length > 0);
      }
    };

    socket.on("phase_update", handlePhaseUpdate);
    socket.on("grace_update", handleGraceUpdate);

    // Initial state
    socket.emit(
      "get_session",
      { sessionId: roomCode },
      (resp: { success: boolean; session?: Parameters<typeof syncState>[0] }) => {
        if (resp.success && resp.session) syncState(resp.session);
      },
    );

    return () => {
      socket.off("phase_update", handlePhaseUpdate);
      socket.off("grace_update", handleGraceUpdate);
    };
  }, [roomCode]);

  const handleContinue = useCallback(() => {
    if (continueLoading) return;
    playSciFiClick();
    const socket = getSocket();
    setContinueLoading(true);
    socket.emit(
      "continue_game",
      { sessionId: roomCode },
      (resp: { success: boolean; error?: string }) => {
        setContinueLoading(false);
        if (!resp.success) {
          console.error("Continue failed:", resp.error);
        }
      },
    );
  }, [roomCode, continueLoading]);

  const handleRestart = useCallback(() => {
    if (restartLoading) return;
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
  }, [roomCode, restartLoading]);

  // Floating variant: only show during the "interrupted" phase.
  // Inline variant (inside ReconnectGraceBanner): show whenever the host has
  // disconnected/reconnecting players during any active game phase.
  if (!isHost) return null;
  if (variant === "floating" && phase !== "interrupted") return null;
  if (variant === "inline" && !hasDisconnectedPlayers && phase !== "interrupted") return null;

  const buttons = (
    <>
      <button
        onClick={handleContinue}
        disabled={continueLoading || restartLoading}
        className="ix-btn px-4 py-2 font-orbitron font-bold text-[0.65rem] tracking-[0.2em] uppercase rounded-md border transition-all duration-150 cursor-pointer"
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
            : "0 0 6px hsl(140 70% 50% / 0.3)",
          cursor: continueLoading || restartLoading ? "not-allowed" : "pointer",
        }}
        onMouseEnter={(e) => {
          if (!continueLoading && !restartLoading)
            e.currentTarget.style.boxShadow =
              "0 0 14px hsl(140 70% 50% / 0.6)";
        }}
        onMouseLeave={(e) => {
          if (!continueLoading && !restartLoading)
            e.currentTarget.style.boxShadow =
              "0 0 6px hsl(140 70% 50% / 0.3)";
        }}
      >
        {continueLoading ? "RESUMING…" : "CONTINUE GAME"}
      </button>
      <button
        onClick={handleRestart}
        disabled={restartLoading || continueLoading}
        className="ix-btn px-4 py-2 font-orbitron font-bold text-[0.65rem] tracking-[0.2em] uppercase rounded-md border transition-all duration-150 cursor-pointer"
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
            : "0 0 6px hsl(185 100% 50% / 0.3)",
          cursor: restartLoading || continueLoading ? "not-allowed" : "pointer",
        }}
        onMouseEnter={(e) => {
          if (!restartLoading && !continueLoading)
            e.currentTarget.style.boxShadow =
              "0 0 14px hsl(185 100% 50% / 0.6)";
        }}
        onMouseLeave={(e) => {
          if (!restartLoading && !continueLoading)
            e.currentTarget.style.boxShadow =
              "0 0 6px hsl(185 100% 50% / 0.3)";
        }}
      >
        {restartLoading ? "RESTARTING…" : "RESTART GAME"}
      </button>
    </>
  );

  if (variant === "inline") return buttons;

  return (
    <div
      className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[9990] flex gap-2 px-4 py-3 rounded-lg ix-modal-enter"
      style={{
        background: "hsl(220 28% 6% / 0.95)",
        border: "1px solid hsl(50 100% 50% / 0.3)",
        boxShadow: "0 0 20px hsl(50 100% 50% / 0.15)",
        backdropFilter: "blur(8px)",
      }}
    >
      {buttons}
    </div>
  );
}

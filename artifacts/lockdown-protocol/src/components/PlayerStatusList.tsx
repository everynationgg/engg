/**
 * PlayerStatusList — lightweight player presence overlay.
 *
 * Shows each player's name alongside a colored status dot:
 *   connected    → green dot (steady)
 *   reconnecting → yellow pulsing dot
 *   disconnected → red dimmed dot
 *
 * Designed to be subtle during active gameplay and more prominent
 * during the interrupted phase.
 */

import { useState, useEffect, useRef } from "react";
import { getSocket } from "@/lib/socket";

export type PlayerConnectionStatus = "connected" | "reconnecting" | "disconnected";

export interface PlayerPresence {
  id: string;
  name: string;
  connectionStatus: PlayerConnectionStatus;
  isHost?: boolean;
  isYou?: boolean;
}

function deriveConnectionStatus(
  player: { connected?: boolean; connectionStatus?: PlayerConnectionStatus },
  graceSet: Set<string>,
  playerId: string,
): PlayerConnectionStatus {
  if (player.connectionStatus) return player.connectionStatus;
  if (graceSet.has(playerId)) return "reconnecting";
  if (player.connected === false) return "disconnected";
  return "connected";
}

interface PlayerStatusListProps {
  /** Current game phase — controls visual emphasis. */
  phase: string;
  /** Room code for session queries. */
  roomCode: string;
}

export default function PlayerStatusList({ phase, roomCode }: PlayerStatusListProps) {
  const [players, setPlayers] = useState<PlayerPresence[]>([]);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    const socket = getSocket();

    const syncPlayers = (session: {
      players?: Array<{
        id: string;
        name: string;
        isHost?: boolean;
        connected?: boolean;
        connectionStatus?: PlayerConnectionStatus;
        didQuit?: boolean;
      }>;
      playersInGrace?: string[];
    }) => {
      if (!session.players || !mountedRef.current) return;
      const graceSet = new Set(session.playersInGrace ?? []);
      setPlayers(
        session.players
          .filter((p) => !p.didQuit)
          .map((p) => ({
            id: p.id,
            name: p.name,
            isHost: p.isHost,
            isYou: p.id === socket.id,
            connectionStatus: deriveConnectionStatus(p, graceSet, p.id),
          })),
      );
    };

    const handlePhaseUpdate = (session: Parameters<typeof syncPlayers>[0]) => syncPlayers(session);
    const handleGraceUpdate = (data: {
      playersInGrace: string[];
      players?: Array<{ id: string; name: string; connectionStatus?: PlayerConnectionStatus; isHost?: boolean; didQuit?: boolean }>;
    }) => {
      if (!mountedRef.current) return;
      // If the server sent full player connection statuses, use them directly
      if (data.players?.length) {
        setPlayers(
          data.players
            .filter((p) => !p.didQuit)
            .map((p) => ({
              id: p.id,
              name: p.name,
              isHost: p.isHost,
              isYou: p.id === socket.id,
              connectionStatus: p.connectionStatus ?? "connected",
            })),
        );
        return;
      }
      // Fallback: derive from grace set
      const graceSet = new Set(data.playersInGrace);
      setPlayers((prev) =>
        prev.map((p) => ({
          ...p,
          connectionStatus: graceSet.has(p.id)
            ? "reconnecting"
            : p.connectionStatus === "reconnecting"
              ? "connected"
              : p.connectionStatus,
        })),
      );
    };

    socket.on("phase_update", handlePhaseUpdate);
    socket.on("grace_update", handleGraceUpdate);

    // Shared sync helper
    const fetchSession = () => {
      socket.emit(
        "get_session",
        { sessionId: roomCode },
        (resp: { success: boolean; session?: Parameters<typeof syncPlayers>[0] }) => {
          if (resp.success && resp.session) syncPlayers(resp.session);
        },
      );
    };

    // Initial fetch
    fetchSession();

    // Periodic fallback: poll every 3 seconds so player statuses stay in sync even
    // when phase_update socket events are missed.
    const pollId = setInterval(fetchSession, 3000);

    return () => {
      mountedRef.current = false;
      socket.off("phase_update", handlePhaseUpdate);
      socket.off("grace_update", handleGraceUpdate);
      clearInterval(pollId);
    };
  }, [roomCode]);

  if (players.length === 0) return null;

  const isInterrupted = phase === "interrupted";

  // Stable ordering: host first, then reconnecting → connected → disconnected
  const sortedPlayers = [...players].sort((a, b) => {
    if (a.isHost !== b.isHost) return a.isHost ? -1 : 1;
    const order: Record<PlayerConnectionStatus, number> = {
      reconnecting: 0,
      connected: 1,
      disconnected: 2,
    };
    return order[a.connectionStatus] - order[b.connectionStatus];
  });

  return (
    <div
      className={`ix-player-status-list ${isInterrupted ? "ix-player-status-list--interrupted" : ""}`}
    >
      {sortedPlayers.map((p) => (
        <div
          key={p.id}
          className={`ix-player-status-item ${p.connectionStatus !== "connected" ? "ix-player-status-item--inactive" : ""}`}
        >
          <span className={`ix-player-dot ix-player-dot--${p.connectionStatus}`} />
          <span className="ix-player-status-name">
            {p.name}
            {p.isHost && <span className="ix-player-status-badge ix-player-status-badge--host">H</span>}
            {p.isYou && <span className="ix-player-status-badge ix-player-status-badge--you">YOU</span>}
          </span>
        </div>
      ))}
    </div>
  );
}

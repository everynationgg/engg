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
  const [typingPlayers, setTypingPlayers] = useState<Set<string>>(new Set());
  const mountedRef = useRef(true);
  const typingTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

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

    const handleChatTyping = (evt: { username: string; isTyping: boolean }) => {
      if (!mountedRef.current) return;
      const name = evt.username;
      if (evt.isTyping) {
        setTypingPlayers((prev) => new Set([...prev, name]));
        const prevTimer = typingTimersRef.current.get(name);
        if (prevTimer) clearTimeout(prevTimer);
        const timer = setTimeout(() => {
          setTypingPlayers((prev) => {
            const next = new Set(prev);
            next.delete(name);
            return next;
          });
          typingTimersRef.current.delete(name);
        }, 3000);
        typingTimersRef.current.set(name, timer);
      } else {
        const prevTimer = typingTimersRef.current.get(name);
        if (prevTimer) clearTimeout(prevTimer);
        typingTimersRef.current.delete(name);
        setTypingPlayers((prev) => {
          const next = new Set(prev);
          next.delete(name);
          return next;
        });
      }
    };

    socket.on("phase_update", handlePhaseUpdate);
    socket.on("grace_update", handleGraceUpdate);
    socket.on("chat_typing", handleChatTyping);

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
      socket.off("chat_typing", handleChatTyping);
      for (const timer of typingTimersRef.current.values()) clearTimeout(timer);
      typingTimersRef.current.clear();
      clearInterval(pollId);
    };
  }, [roomCode]);

  const [tags, setTags] = useState<Record<string, string>>({});

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem("lp_detective_notes");
      if (stored) setTags(JSON.parse(stored));
    } catch {}
  }, []);

  const handleTagClick = (name: string, isYou: boolean) => {
    if (isYou || phase === "lobby" || phase === "interrupted" || phase === "result") return;
    
    setTags((prev) => {
      const current = prev[name];
      let next = "";
      if (!current) next = "safe";
      else if (current === "safe") next = "unsure";
      else if (current === "unsure") next = "suspect";
      else next = "";

      const updated = { ...prev };
      if (!next) {
        delete updated[name];
      } else {
        updated[name] = next;
      }
      
      sessionStorage.setItem("lp_detective_notes", JSON.stringify(updated));
      return updated;
    });
    import("@/lib/sound").then(m => m.playSciFiClick(0.5));
  };

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
      {sortedPlayers.map((p) => {
        const tag = tags[p.name];
        const isInteractive = !p.isYou && phase !== "lobby" && phase !== "interrupted" && phase !== "result";
        return (
        <div
          key={p.id}
          className={`ix-player-status-item ${p.connectionStatus !== "connected" ? "ix-player-status-item--inactive" : ""} ${isInteractive ? "cursor-pointer hover:bg-white/10" : ""}`}
          onClick={() => handleTagClick(p.name, !!p.isYou)}
        >
          <span className={`ix-player-dot ix-player-dot--${p.connectionStatus}`} />
          <span className="ix-player-status-name flex items-center">
            {p.name}
            {p.isHost && <span className="ix-player-status-badge ix-player-status-badge--host">H</span>}
            {p.isYou && <span className="ix-player-status-badge ix-player-status-badge--you">YOU</span>}
            {tag === "safe" && <span className="ml-1.5 text-[0.8rem]">🟢</span>}
            {tag === "unsure" && <span className="ml-1.5 text-[0.8rem]">🟡</span>}
            {tag === "suspect" && <span className="ml-1.5 text-[0.8rem]">🔴</span>}
          </span>
        </div>
      )})}
    </div>
  );
}

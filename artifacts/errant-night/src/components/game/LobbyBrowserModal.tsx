import React, { useState, useEffect, useCallback, useRef } from "react";
import { getSocket } from "@/lib/socket";
import { playSciFiClick } from "@/lib/sound";
import { gameSessionStore } from "@/lib/gameSessionStore";
import { systemToast } from "@/components/common/SystemToast";

interface PublicLobby {
  sessionId: string;
  hostName: string;
  playerCount: number;
  maxPlayers: number;
  phase: string;
  isPublic: boolean;
  difficulty: "easy" | "medium" | "hard" | "extreme";
  createdAt: number;
}

interface LobbyBrowserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJoinRoom: (roomCode: string) => void;
  savedCallsign?: string;
}

export default function LobbyBrowserModal({
  isOpen,
  onClose,
  onJoinRoom,
  savedCallsign = "",
}: LobbyBrowserModalProps) {
  const [lobbies, setLobbies] = useState<PublicLobby[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchLobbies = useCallback(() => {
    setLoading(true);
    setError(null);
    const socket = getSocket();

    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    let responded = false;
    timeoutRef.current = setTimeout(() => {
      if (!responded) {
        setLoading(false);
        setError("Unable to reach mission server. Tap Retry Scan.");
      }
    }, 4000);

    socket.emit("list_public_lobbies", {}, (resp: { success: boolean; lobbies?: PublicLobby[]; error?: string }) => {
      responded = true;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setLoading(false);
      if (resp?.success && Array.isArray(resp.lobbies)) {
        setLobbies(resp.lobbies);
      } else {
        setError(resp?.error || "Could not retrieve mission lobbies");
      }
    });
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchLobbies();
      const interval = setInterval(fetchLobbies, 5000);
      return () => {
        clearInterval(interval);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
      };
    }
  }, [isOpen, fetchLobbies]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity duration-300"
        onClick={() => {
          playSciFiClick();
          onClose();
        }}
      />

      {/* Modal Dialog */}
      <div
        className="relative z-10 w-full max-w-lg bg-[#0b101d] border border-cyan-500/40 rounded-xl shadow-[0_0_50px_rgba(0,243,255,0.2)] overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_#00f3ff]" />
            <div>
              <h3 className="font-orbitron font-bold text-base sm:text-lg tracking-widest text-cyan-300 uppercase">
                PUBLIC LOBBIES
              </h3>
              <p className="font-mono text-[10px] text-white/50 tracking-wider uppercase">
                Active Sector Transmissions
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                playSciFiClick();
                fetchLobbies();
              }}
              disabled={loading}
              className="px-3 py-1.5 rounded border border-cyan-500/30 bg-cyan-950/40 hover:bg-cyan-900/60 text-cyan-300 font-mono text-xs active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
              title="Refresh lobby list"
            >
              <span className={loading ? "animate-spin" : ""}>⟳</span>
              <span>REFRESH</span>
            </button>
            <button
              onClick={() => {
                playSciFiClick();
                onClose();
              }}
              className="w-8 h-8 rounded border border-white/20 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white font-mono text-sm flex items-center justify-center active:scale-95 transition-all cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-3 custom-scrollbar">
          {loading && lobbies.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-center">
              <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mb-3 shadow-[0_0_12px_rgba(6,182,212,0.4)]" />
              <p className="font-orbitron text-xs tracking-wider text-cyan-300 uppercase">
                Scanning Sector Channels...
              </p>
            </div>
          ) : error ? (
            <div className="p-4 rounded border border-red-500/30 bg-red-950/20 text-center">
              <p className="text-red-400 text-xs font-mono">{error}</p>
              <button
                onClick={fetchLobbies}
                className="mt-3 px-4 py-1.5 rounded bg-red-900/50 hover:bg-red-800/60 border border-red-500/40 text-red-200 text-xs font-orbitron"
              >
                RETRY SCAN
              </button>
            </div>
          ) : lobbies.length === 0 ? (
            <div className="py-10 px-4 text-center border border-white/5 rounded-lg bg-white/[0.01]">
              <div className="font-orbitron text-3xl mb-2 opacity-30">🛸</div>
              <h4 className="font-orbitron font-bold text-sm tracking-widest text-white/80 uppercase mb-1">
                No Open Public Lobbies
              </h4>
              <p className="text-xs text-white/50 max-w-sm mx-auto mb-4 font-mono">
                No commanders are currently broadcasting open signals. Create your own lobby or invite friends with a room link!
              </p>
            </div>
          ) : (
            lobbies.map((lobby) => (
              <div
                key={lobby.sessionId}
                className="p-3.5 rounded-lg border border-white/10 hover:border-cyan-500/40 bg-white/[0.02] hover:bg-cyan-950/20 transition-all flex items-center justify-between gap-3 group"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-orbitron font-bold text-sm text-cyan-300 tracking-wider">
                      {lobby.sessionId}
                    </span>
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-mono tracking-wider uppercase bg-cyan-950/60 border border-cyan-500/30 text-cyan-300">
                      HOST: {lobby.hostName}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] font-mono text-white/50">
                    <span>
                      PLAYERS:{" "}
                      <strong className="text-cyan-400">
                        {lobby.playerCount}/{lobby.maxPlayers}
                      </strong>
                    </span>
                    <span>•</span>
                    <span className="uppercase text-amber-300">
                      {lobby.difficulty || "MEDIUM"}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    playSciFiClick();
                    onJoinRoom(lobby.sessionId);
                  }}
                  className="px-4 py-2 rounded font-orbitron text-xs font-bold tracking-widest uppercase bg-cyan-500 hover:bg-cyan-400 text-black shadow-[0_0_12px_rgba(6,182,212,0.5)] active:scale-95 transition-all shrink-0 cursor-pointer"
                >
                  JOIN
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 border-t border-white/10 bg-white/[0.01] flex items-center justify-between text-[11px] font-mono text-white/40">
          <span>{lobbies.length} public {lobbies.length === 1 ? "room" : "rooms"} available</span>
          <span className="text-cyan-400/70">Auto-refresh: 4s</span>
        </div>
      </div>
    </div>
  );
}

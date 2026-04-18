import React from "react";
import { GameState, SpectatorInfo } from "../hooks/useSpectator";

interface SpectatorViewProps {
  gameState: GameState | null;
  spectators: SpectatorInfo[];
  isLoading?: boolean;
  onLeave?: () => void;
}

const roleColors: Record<string, string> = {
  crew: "bg-blue-900 border-blue-600 text-blue-300",
  alien: "bg-red-900 border-red-600 text-red-300",
  commander: "bg-cyan-900 border-cyan-600 text-cyan-300",
  scanner: "bg-purple-900 border-purple-600 text-purple-300",
  sentinel: "bg-green-900 border-green-600 text-green-300",
  shifter: "bg-orange-900 border-orange-600 text-orange-300",
  warper: "bg-yellow-900 border-yellow-600 text-yellow-300",
  disruptor: "bg-pink-900 border-pink-600 text-pink-300",
  parasite: "bg-indigo-900 border-indigo-600 text-indigo-300",
  seeker: "bg-teal-900 border-teal-600 text-teal-300",
};

export function SpectatorView({
  gameState,
  spectators,
  isLoading = false,
  onLeave,
}: SpectatorViewProps) {
  if (isLoading || !gameState) {
    return (
      <div className="min-h-screen text-white p-6" style={{ background: "hsl(220 28% 4%)" }}>
        <h1 className="text-3xl font-bold font-orbitron tracking-widest">SPECTATING</h1>
        <div className="text-center py-12 text-gray-500">Loading game state...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white p-6" style={{ background: "hsl(220 28% 4%)" }}>
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-orbitron font-bold text-4xl tracking-[0.3em] uppercase mb-2">
              Spectating Game
            </h1>
            <p className="font-orbitron text-sm tracking-[0.2em] uppercase" style={{ color: "hsl(185 100% 50%)" }}>
              Game ID: {gameState.gameId}
            </p>
          </div>
          {onLeave && (
            <button
              onClick={onLeave}
              className="px-6 py-3 font-orbitron font-bold text-xs tracking-[0.2em] uppercase rounded-md border-2 transition-all duration-150"
              style={{
                borderColor: "hsl(0 75% 55%)",
                color: "hsl(0 75% 65%)",
                background: "hsl(220 28% 9%)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "hsl(0 75% 70%)";
                e.currentTarget.style.color = "hsl(0 75% 80%)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "hsl(0 75% 55%)";
                e.currentTarget.style.color = "hsl(0 75% 65%)";
              }}
            >
              LEAVE
            </button>
          )}
        </div>

        {/* Divider */}
        <div className="h-px mb-8" style={{ background: "linear-gradient(90deg, hsl(210 30% 25%) 0%, hsl(210 30% 35%) 50%, hsl(210 30% 25%) 100%)" }} />

        {/* Game Status */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="rounded-lg p-4" style={{ background: "hsl(220 28% 9%)", border: "1px solid hsl(210 30% 25%)" }}>
            <div className="font-orbitron text-xs tracking-[0.1em] uppercase text-gray-600 mb-2">Players</div>
            <div className="font-orbitron font-bold text-3xl" style={{ color: "hsl(185 100% 50%)" }}>
              {gameState.playerCount}
            </div>
          </div>

          <div className="rounded-lg p-4" style={{ background: "hsl(220 28% 9%)", border: "1px solid hsl(210 30% 25%)" }}>
            <div className="font-orbitron text-xs tracking-[0.1em] uppercase text-gray-600 mb-2">Spectators</div>
            <div className="font-orbitron font-bold text-3xl" style={{ color: "hsl(270 70% 60%)" }}>
              {gameState.spectatorCount}
            </div>
          </div>

          <div className="rounded-lg p-4" style={{ background: "hsl(220 28% 9%)", border: "1px solid hsl(210 30% 25%)" }}>
            <div className="font-orbitron text-xs tracking-[0.1em] uppercase text-gray-600 mb-2">Status</div>
            <div className="font-orbitron font-bold text-sm" style={{
              color: gameState.gameComplete
                ? gameState.winner === "crew"
                  ? "hsl(100 75% 50%)"
                  : "hsl(0 75% 50%)"
                : "hsl(55 100% 50%)"
            }}>
              {gameState.gameComplete
                ? gameState.winner === "crew"
                  ? "CREW WINS"
                  : gameState.winner === "aliens"
                    ? "ALIENS WIN"
                    : "GAME OVER"
                : "IN PROGRESS"}
            </div>
          </div>
        </div>
      </div>

      {/* Players Grid */}
      <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-12">
        {gameState.players.map((player) => {
          const colorClass = roleColors[player.role] || roleColors.crew;
          return (
            <div
              key={player.userId}
              className={`p-4 rounded-lg border-2 flex flex-col gap-2 ${colorClass}`}
            >
              <div className="font-semibold text-sm">{player.username}</div>
              <div className="text-xs font-bold uppercase">{player.role}</div>
              <div className="mt-auto pt-2 border-t border-current border-opacity-30">
                <span className="text-xs font-bold">
                  {player.won ? "✓ WON" : "✗ LOST"}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Spectators List */}
      {spectators.length > 0 && (
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold font-orbitron tracking-widest mb-4">
            👁️ SPECTATORS ({spectators.length})
          </h2>
          <div className="space-y-2">
            {spectators.map((spectator) => (
              <div
                key={spectator.id}
                className="p-3 rounded-lg bg-gray-800 border border-gray-600 flex items-center justify-between"
              >
                <div>
                  <div className="font-semibold text-sm">{spectator.username}</div>
                  <div className="text-xs text-gray-400">
                    Watching since {new Date(spectator.joinedAt).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

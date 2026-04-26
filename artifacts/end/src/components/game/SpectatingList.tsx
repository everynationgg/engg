import React from "react";
import { SpectatingGame } from "@/hooks/useSpectator";

interface SpectatingListProps {
  games: SpectatingGame[];
  isLoading?: boolean;
  onJoinGame?: (gameId: string) => void;
}

export function SpectatingList({
  games,
  isLoading = false,
  onJoinGame,
}: SpectatingListProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">👁️ SPECTATING</h2>
        <div className="text-center py-8 text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">👁️ SPECTATING</h2>
        {games.length > 0 && (
          <div className="text-sm font-semibold text-gray-600">
            {games.length} game{games.length !== 1 ? "s" : ""}
          </div>
        )}
      </div>

      {games.length > 0 ? (
        <div className="space-y-3">
          {games.map((game) => (
            <div
              key={game.gameId}
              className="p-4 rounded-lg bg-gray-700/50 border border-gray-600 flex items-center justify-between hover:bg-gray-700 transition-colors"
            >
              <div className="flex-1">
                <div className="font-semibold text-sm font-orbitron">{game.gameId}</div>
                <div className="text-xs text-gray-400 mt-1">
                  {game.playerCount} player{game.playerCount !== 1 ? "s" : ""} • Joined{" "}
                  {new Date(game.joinedAt).toLocaleTimeString()}
                </div>
              </div>
              <button
                onClick={() => onJoinGame?.(game.gameId)}
                className="px-4 py-2 text-sm rounded bg-cyan-600 hover:bg-cyan-500 text-white transition-colors"
              >
                Watch
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          You're not spectating any games. Join one to watch!
        </div>
      )}
    </div>
  );
}

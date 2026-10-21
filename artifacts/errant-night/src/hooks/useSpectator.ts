import { useState, useCallback, useEffect } from "react";
import { useAuth } from "./useAuth";

export interface SpectatorInfo {
  id: string;
  username: string;
  joinedAt: string;
}

export interface PlayerInfo {
  userId: string;
  username: string;
  role: string;
  won: boolean;
}

export interface GameState {
  gameId: string;
  gameComplete: boolean;
  winner: "crew" | "aliens" | "pending";
  playerCount: number;
  spectatorCount: number;
  players: PlayerInfo[];
}

export interface SpectatingGame {
  gameId: string;
  joinedAt: string;
  playerCount: number;
}

export function useSpectator() {
  const { token } = useAuth();
  const [spectators, setSpectators] = useState<SpectatorInfo[]>([]);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [spectatingGames, setSpectatingGames] = useState<SpectatingGame[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const joinSpectator = useCallback(
    async (gameId: string) => {
      if (!token) {
        setError("Not authenticated");
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/api/games/${gameId}/join-spectator`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Failed to join as spectator");
        }

        // Fetch updated game state
        await fetchGameState(gameId);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to join as spectator";
        setError(message);
      } finally {
        setIsLoading(false);
      }
    },
    [token]
  );

  const leaveSpectator = useCallback(
    async (gameId: string) => {
      if (!token) {
        setError("Not authenticated");
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/api/games/${gameId}/leave-spectator`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Failed to leave spectator");
        }

        setGameState(null);
        await fetchSpectatingGames();
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to leave spectator";
        setError(message);
      } finally {
        setIsLoading(false);
      }
    },
    [token]
  );

  const fetchGameState = useCallback(
    async (gameId: string) => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/api/games/${gameId}/state`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch game state");
        }

        const data = await response.json();
        setGameState(data);

        // Fetch spectators
        const spectatorsResponse = await fetch(
          `${import.meta.env.VITE_API_URL}/api/games/${gameId}/spectators`
        );

        if (spectatorsResponse.ok) {
          const spectatorsData = await spectatorsResponse.json();
          setSpectators(spectatorsData.spectators);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to fetch game state";
        setError(message);
      }
    },
    []
  );

  const fetchSpectatingGames = useCallback(async () => {
    if (!token) {
      setError("Not authenticated");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/user/spectating`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch spectating games");
      }

      const data = await response.json();
      setSpectatingGames(data.games);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch spectating games";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  // Polling for live game state updates
  useEffect(() => {
    if (!gameState?.gameId) return;

    const interval = setInterval(() => {
      fetchGameState(gameState.gameId);
    }, 3000); // Update every 3 seconds

    return () => clearInterval(interval);
  }, [gameState?.gameId, fetchGameState]);

  return {
    spectators,
    gameState,
    spectatingGames,
    isLoading,
    error,
    joinSpectator,
    leaveSpectator,
    fetchGameState,
    fetchSpectatingGames,
  };
}

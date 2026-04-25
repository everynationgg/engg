import { useEffect, useState, useCallback } from "react";
import { useAuth } from "./useAuth";
import { ROLES } from "@/data/roles";

export interface PlayerStats {
  id: string;
  userId: string;
  gamesPlayed: number;
  gamesWon: number;
  gamesLost: number;
  winRate: number;
}

export interface RoleStats {
  role: string;
  gamesPlayed: number;
  gamesWon: number;
  gamesLost: number;
  winRate: number;
}

export interface GameHistoryEntry {
  id: string;
  gameId: string;
  role: string;
  won: "yes" | "no" | "draw";
  playedAt: string;
}

export interface LeaderboardEntry {
  userId: string;
  username: string;
  gamesPlayed: number;
  gamesWon: number;
  winRate: number;
  rank: number;
}

export interface GameResultData {
  gameId: string;
  role: string;
  won: "yes" | "no";
}

export function useRecordGameResult() {
  const { isLoggedIn, userId } = useAuth();
  const [personalStats, setPersonalStats] = useState<PlayerStats | null>(null);
  const [roleStats, setRoleStats] = useState<RoleStats[]>([]);
  const [gameHistory, setGameHistory] = useState<GameHistoryEntry[]>([]);
  const [gameHistoryTotal, setGameHistoryTotal] = useState(0);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasRecorded, setHasRecorded] = useState(false);

  /**
   * Record a game result and fetch updated stats + leaderboard
   */
  const recordResult = useCallback(
    async (gameResultData: GameResultData) => {
      if (!isLoggedIn || !userId) {
        setError("Not logged in");
        return;
      }

      setIsRecording(true);
      setError(null);

      try {
        // Record the game result
        const recordResponse = await fetch(`${import.meta.env.VITE_API_URL}/api/stats/record-game`, {
        method: "POST",
        headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem("lp_auth_token")}`,
        },
        body: JSON.stringify(gameResultData),
});

        if (!recordResponse.ok) {
          throw new Error("Failed to record game result");
        }

        // Fetch updated personal stats
        const statsResponse = await fetch(`${import.meta.env.VITE_API_URL}/api/stats/my-stats`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("lp_auth_token")}`,
          },
        });

        if (statsResponse.ok) {
          const stats = await statsResponse.json();
          setPersonalStats(stats);
        }

        // Fetch leaderboard
        const leaderRes = await fetch(`${import.meta.env.VITE_API_URL}/api/stats/leaderboard?limit=10`, {
          method: "GET",
        });

        if (leaderRes.ok) {
          const data = await leaderRes.json();
          setLeaderboard(data.entries || []);
        }

        setHasRecorded(true);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to record result";
        setError(message);
      } finally {
        setIsRecording(false);
      }
    },
    [isLoggedIn, userId]
  );

  /**
   * Fetch personal stats (without recording a game)
   */
  const fetchPersonalStats = useCallback(async () => {
    if (!isLoggedIn || !userId) return;

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/stats/my-stats`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("lp_auth_token")}`,
        },
      });

      if (response.ok) {
        const stats = await response.json();
        setPersonalStats(stats);
      }
    } catch (err) {
      console.error("Failed to fetch personal stats:", err);
    }
  }, [isLoggedIn, userId]);

  /**
   * Fetch leaderboard
   */
  const fetchLeaderboard = useCallback(async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/stats/leaderboard?limit=10`, {
        method: "GET",
      });

      if (response.ok) {
        const data = await response.json();
        setLeaderboard(data.entries || []);
      }
    } catch (err) {
      console.error("Failed to fetch leaderboard:", err);
    }
  }, []);

  /**
   * Fetch role-based stats
   */
  const fetchRoleStats = useCallback(async () => {
    if (!isLoggedIn || !userId) return;

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/stats/my-stats-by-role`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("lp_auth_token")}`,
        },
      });

      if (response.ok) {
        const stats = await response.json();
        setRoleStats(stats);
      }
    } catch (err) {
      console.error("Failed to fetch role stats:", err);
    }
  }, [isLoggedIn, userId]);

  /**
   * Fetch game history
   */
  const fetchGameHistory = useCallback(async (limit = 20, offset = 0) => {
    if (!isLoggedIn || !userId) return;

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/stats/game-history?limit=${limit}&offset=${offset}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("lp_auth_token")}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setGameHistory(data.games || []);
        setGameHistoryTotal(data.total || 0);
      }
    } catch (err) {
      console.error("Failed to fetch game history:", err);
    }
  }, [isLoggedIn, userId]);

  return {
    recordResult,
    fetchPersonalStats,
    fetchLeaderboard,
    fetchRoleStats,
    fetchGameHistory,
    personalStats,
    roleStats,
    gameHistory,
    gameHistoryTotal,
    leaderboard,
    isRecording,
    error,
    hasRecorded,
  };
}

/**
 * Determine if a player won based on their role and the winning team
 */
export function determinePlayerWon(
  playerRole: string,
  winTeam: "crew" | "alien" | "tie"
): boolean {
  if (winTeam === "tie") return false;

  const roleObj = ROLES.find((r) => r.id === playerRole);
  if (!roleObj) return false;

  const playerTeam = roleObj.team; // "crew" | "alien" | "chaotic"
  
  // Crew roles win if crew wins
  if (playerTeam === "crew" && winTeam === "crew") return true;
  // Alien roles (including parasite) win if alien wins
  if (playerTeam === "alien" && winTeam === "alien") return true;
  // Chaotic roles don't win in these outcomes
  
  return false;
}

/**
 * Generate a game ID (timestamp-based)
 */
export function generateGameId(): string {
  return `game_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

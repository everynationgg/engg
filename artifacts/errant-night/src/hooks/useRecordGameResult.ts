import { useEffect, useState, useCallback, useRef } from "react";
import { useAuth } from "./useAuth";

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
  alignment?: string;
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

export interface RoundResultIdentity { roundId: string; playerId: string }

export function useRecordGameResult() {
  const { isLoggedIn, userId, token } = useAuth();
  const authRef = useRef({ userId, token });
  authRef.current = { userId, token };
  const inFlight = useRef(new Set<string>());
  const [personalStats, setPersonalStats] = useState<PlayerStats | null>(null);
  const [roleStats, setRoleStats] = useState<RoleStats[]>([]);
  const [gameHistory, setGameHistory] = useState<GameHistoryEntry[]>([]);
  const [gameHistoryTotal, setGameHistoryTotal] = useState(0);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasRecorded, setHasRecorded] = useState(false);
  const [lastRewards, setLastRewards] = useState<{ xp: number; credits: number } | null>(null);

  useEffect(() => {
    setHasRecorded(false); setLastRewards(null); setPersonalStats(null);
    setRoleStats([]); setGameHistory([]); setGameHistoryTotal(0); setError(null); setIsRecording(false);
  }, [userId, token]);

  // Reading a receipt cannot create a reward. Ignore responses from an old login.
  const fetchResultReceipt = useCallback(async ({ roundId, playerId }: RoundResultIdentity) => {
    if (!isLoggedIn || !userId || !token) return;
    const key = [roundId, playerId, userId, token].join(":");
    if (inFlight.current.has(key)) return;
    inFlight.current.add(key); setIsRecording(true); setError(null);
    const stillCurrent = () => authRef.current.userId === userId && authRef.current.token === token;
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/stats/rounds/${encodeURIComponent(roundId)}/players/${encodeURIComponent(playerId)}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (!response.ok) return; // Pending or unentitled: show the game, never fabricate rewards.
      const receipt = await response.json();
      if (!stillCurrent()) return;
      if (receipt.roundId !== roundId || receipt.playerId !== playerId) return;
      setLastRewards(receipt.rewards); setHasRecorded(true);
      const stats = await fetch(`${import.meta.env.VITE_API_URL}/api/stats/my-stats`, { headers: { Authorization: `Bearer ${token}` } });
      if (stats.ok) { const data = await stats.json(); if (stillCurrent()) setPersonalStats(data); }
    } catch (err) {
      if (stillCurrent()) setError(err instanceof Error ? err.message : "Failed to load result");
    } finally {
      inFlight.current.delete(key); if (stillCurrent()) setIsRecording(false);
    }
  }, [isLoggedIn, userId, token]);

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
    fetchResultReceipt,
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
    lastRewards,
  };
}

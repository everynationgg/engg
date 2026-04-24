import { useState, useCallback, useEffect } from "react";
import { useAuth } from "./useAuth";

export interface Achievement {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon: string;
  rarity: "common" | "rare" | "epic" | "legendary";
  pointsRequired: number;
  unlocked?: boolean;
  unlockedAt?: string | null;
}

export interface AchievementsData {
  totalAchievements: number;
  unlockedCount: number;
  achievements: Achievement[];
}

export function useAchievements() {
  const { token } = useAuth();
  const [achievements, setAchievements] = useState<AchievementsData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAchievements = useCallback(async () => {
    if (!token) {
      setError("Not authenticated");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/user/achievements`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch achievements");
      }

      const data = await response.json();
      setAchievements(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch achievements";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  // Fetch achievements on mount
  useEffect(() => {
    if (token && !achievements) {
      fetchAchievements();
    }
  }, [token, achievements, fetchAchievements]);

  return {
    achievements,
    isLoading,
    error,
    fetchAchievements,
  };
}

import { useState, useCallback, useEffect } from "react";
import { useAuth } from "./useAuth";

interface UserPrefs {
  userId: string;
  musicVolume: number;
  sfxVolume: number;
  theme: "dark" | "light";
  notificationsEnabled: boolean;
  colorblindMode: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export function usePreferences() {
  const { token } = useAuth();
  const [preferences, setPreferences] = useState<UserPrefs | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPreferences = useCallback(async () => {
    if (!token) {
      setError("Not authenticated");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/user/preferences`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch preferences");
      }

      const data = await response.json();
        setPreferences(data);
        // Apply theme to DOM
        if (data.theme) {
        document.documentElement.classList.remove("dark", "light");
        document.documentElement.classList.add(data.theme);
        }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch preferences";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  const updatePreferences = useCallback(
    async (updates: Partial<Omit<UserPrefs, "userId" | "createdAt" | "updatedAt">>) => {
      if (!token) {
        setError("Not authenticated");
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/user/preferences`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(updates),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Failed to update preferences");
        }

        const data = await response.json();
        setPreferences(data);
        return data;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to update preferences";
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [token]
  );

  const updateMusicVolume = useCallback((volume: number) => {
    return updatePreferences({ musicVolume: Math.max(0, Math.min(100, volume)) });
  }, [updatePreferences]);

  const updateSfxVolume = useCallback((volume: number) => {
    return updatePreferences({ sfxVolume: Math.max(0, Math.min(100, volume)) });
  }, [updatePreferences]);

  const updateTheme = useCallback((theme: "dark" | "light") => {
    document.documentElement.classList.remove("dark", "light");
    document.documentElement.classList.add(theme);
    return updatePreferences({ theme });
    }, [updatePreferences]);

  const updateNotifications = useCallback((enabled: boolean) => {
    return updatePreferences({ notificationsEnabled: enabled });
  }, [updatePreferences]);

  const updateColorblindMode = useCallback((enabled: boolean) => {
    return updatePreferences({ colorblindMode: enabled });
  }, [updatePreferences]);

  // Fetch preferences on mount
  useEffect(() => {
    if (token && !preferences) {
      fetchPreferences();
    }
  }, [token, preferences, fetchPreferences]);

  return {
    preferences,
    isLoading,
    error,
    fetchPreferences,
    updatePreferences,
    updateMusicVolume,
    updateSfxVolume,
    updateTheme,
    updateNotifications,
    updateColorblindMode,
  };
}

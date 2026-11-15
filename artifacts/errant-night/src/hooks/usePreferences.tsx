import { useState, useCallback, useEffect, createContext, useContext } from "react";
import { useAuth } from "./useAuth";
import { STORAGE_KEYS, DEFAULTS } from "@/lib/constants";

export interface UserPrefs {
  userId: string;
  musicVolume: number;
  sfxVolume: number;
  theme: "dark" | "light";
  notificationsEnabled: boolean;
  colorblindMode: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

interface PreferencesContextType {
  preferences: UserPrefs | null;
  isLoading: boolean;
  error: string | null;
  fetchPreferences: () => Promise<void>;
  updatePreferences: (updates: Partial<Omit<UserPrefs, "userId" | "createdAt" | "updatedAt">>) => Promise<any>;
  updateMusicVolume: (volume: number) => Promise<any>;
  updateSfxVolume: (volume: number) => Promise<any>;
  updateTheme: (theme: "dark" | "light") => Promise<any>;
  updateNotifications: (enabled: boolean) => Promise<any>;
  updateColorblindMode: (enabled: boolean) => Promise<any>;
}

const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined);

export function PreferencesProvider({ children }: { children: React.ReactNode }) {
  const { token } = useAuth();
  const [preferences, setPreferences] = useState<UserPrefs | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPreferences = useCallback(async () => {
    if (!token) {
      try {
        const localPrefs = typeof localStorage !== "undefined" ? localStorage.getItem(STORAGE_KEYS.guestPreferences) : null;
        if (localPrefs) {
          const parsed = JSON.parse(localPrefs);
          if (parsed && typeof parsed === "object") {
            parsed.musicVolume = Number.isFinite(parsed.musicVolume) ? Math.max(0, Math.min(100, Math.round(parsed.musicVolume))) : DEFAULTS.musicVolume;
            parsed.sfxVolume = Number.isFinite(parsed.sfxVolume) ? Math.max(0, Math.min(100, Math.round(parsed.sfxVolume))) : DEFAULTS.sfxVolume;
            setPreferences(parsed);
            if (parsed.theme) {
              document.documentElement.classList.remove("dark", "light");
              document.documentElement.classList.add(parsed.theme);
            }
            return;
          }
        }
      } catch (e) {
        // ignore
      }
      setPreferences({
        userId: "guest",
        musicVolume: DEFAULTS.musicVolume,
        sfxVolume: DEFAULTS.sfxVolume,
        theme: DEFAULTS.theme,
        notificationsEnabled: DEFAULTS.notificationsEnabled,
        colorblindMode: DEFAULTS.colorblindMode,
      });
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
      if (data && typeof data === "object") {
        data.musicVolume = Number.isFinite(data.musicVolume) ? Math.max(0, Math.min(100, Math.round(data.musicVolume))) : DEFAULTS.musicVolume;
        data.sfxVolume = Number.isFinite(data.sfxVolume) ? Math.max(0, Math.min(100, Math.round(data.sfxVolume))) : DEFAULTS.sfxVolume;
      }
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
      // Optimistically update local state immediately so UI and audio are completely responsive
      setPreferences((prev) => {
        const defaultPrefs: UserPrefs = {
          userId: token ? "user" : "guest",
          musicVolume: DEFAULTS.musicVolume,
          sfxVolume: DEFAULTS.sfxVolume,
          theme: DEFAULTS.theme,
          notificationsEnabled: DEFAULTS.notificationsEnabled,
          colorblindMode: DEFAULTS.colorblindMode,
        };
        const nextPrefs = { ...(prev || defaultPrefs), ...updates } as UserPrefs;
        if (!token) {
          try {
            if (typeof localStorage !== "undefined") {
              localStorage.setItem(STORAGE_KEYS.guestPreferences, JSON.stringify(nextPrefs));
            }
          } catch (e) {
            console.warn("[usePreferences] Local storage save failed:", e);
          }
        }
        return nextPrefs;
      });

      if (!token) {
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
          const data = await response.json().catch(() => ({}));
          console.warn("[usePreferences] Server rejected preferences update:", data.error || response.statusText);
          return;
        }

        const data = await response.json();
        setPreferences(data);
        return data;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to update preferences";
        setError(message);
        console.warn("[usePreferences] Network error updating preferences:", message);
        // Do not rethrow so UI doesn't crash into ErrorBoundary
      } finally {
        setIsLoading(false);
      }
    },
    [token]
  );

  const updateMusicVolume = useCallback((volume: number) => {
    const parsed = Number(volume);
    const safeVol = Number.isFinite(parsed) ? Math.max(0, Math.min(100, Math.round(parsed))) : DEFAULTS.musicVolume;
    return updatePreferences({ musicVolume: safeVol });
  }, [updatePreferences]);

  const updateSfxVolume = useCallback((volume: number) => {
    const parsed = Number(volume);
    const safeVol = Number.isFinite(parsed) ? Math.max(0, Math.min(100, Math.round(parsed))) : DEFAULTS.sfxVolume;
    return updatePreferences({ sfxVolume: safeVol });
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

  // Colorblind mode: toggle class on <body>
  useEffect(() => {
    if (preferences?.colorblindMode) {
      document.body.classList.add('colorblind');
    } else {
      document.body.classList.remove('colorblind');
    }
  }, [preferences?.colorblindMode]);

  return (
    <PreferencesContext.Provider
      value={{
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
      }}
    >
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences() {
  const context = useContext(PreferencesContext);
  if (context === undefined) {
    throw new Error("usePreferences must be used within a PreferencesProvider");
  }
  return context;
}

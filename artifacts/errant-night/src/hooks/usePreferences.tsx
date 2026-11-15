import { useState, useCallback, useEffect, createContext, useContext } from "react";
import { useAuth } from "./useAuth";
import { STORAGE_KEYS, DEFAULTS } from "@/lib/constants";
import { setMusicVolume, stopLobbyMusic } from "@/lib/music";
import { setSfxVolume } from "@/lib/sound";

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

function clampVolume(val: unknown, fallback: number): number {
  const num = Number(val);
  return Number.isFinite(num) ? Math.max(0, Math.min(100, Math.round(num))) : fallback;
}

function readLocalPreferences(): UserPrefs {
  const fallback: UserPrefs = {
    userId: "guest",
    musicVolume: DEFAULTS.musicVolume,
    sfxVolume: DEFAULTS.sfxVolume,
    theme: DEFAULTS.theme,
    notificationsEnabled: DEFAULTS.notificationsEnabled,
    colorblindMode: DEFAULTS.colorblindMode,
  };
  try {
    if (typeof localStorage === "undefined") return fallback;
    const raw = localStorage.getItem(STORAGE_KEYS.guestPreferences);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return fallback;
    return {
      userId: typeof parsed.userId === "string" ? parsed.userId : "guest",
      musicVolume: clampVolume(parsed.musicVolume, DEFAULTS.musicVolume),
      sfxVolume: clampVolume(parsed.sfxVolume, DEFAULTS.sfxVolume),
      theme: parsed.theme === "light" ? "light" : "dark",
      notificationsEnabled:
        typeof parsed.notificationsEnabled === "boolean"
          ? parsed.notificationsEnabled
          : DEFAULTS.notificationsEnabled,
      colorblindMode:
        typeof parsed.colorblindMode === "boolean"
          ? parsed.colorblindMode
          : DEFAULTS.colorblindMode,
    };
  } catch {
    return fallback;
  }
}

function writeLocalPreferences(prefs: UserPrefs): void {
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(STORAGE_KEYS.guestPreferences, JSON.stringify(prefs));
    }
  } catch (e) {
    console.warn("[usePreferences] Local storage save failed:", e);
  }
}

function mergePrefs(
  base: UserPrefs,
  serverData?: Partial<UserPrefs> | null,
  explicitUpdates?: Partial<Omit<UserPrefs, "userId" | "createdAt" | "updatedAt">>
): UserPrefs {
  const isGuestServerResponse = Boolean(
    serverData?.userId && String(serverData.userId).startsWith("guest_")
  );

  // For guest tokens, the backend returns stateless dummy values (70/70 on GET,
  // or partial req.body on POST). Always preserve local base state unless explicitly updated.
  const s = isGuestServerResponse ? undefined : serverData;

  return {
    userId: serverData?.userId ?? base.userId ?? "guest",
    musicVolume:
      explicitUpdates?.musicVolume !== undefined
        ? clampVolume(explicitUpdates.musicVolume, base.musicVolume)
        : s?.musicVolume !== undefined
          ? clampVolume(s.musicVolume, base.musicVolume)
          : base.musicVolume,
    sfxVolume:
      explicitUpdates?.sfxVolume !== undefined
        ? clampVolume(explicitUpdates.sfxVolume, base.sfxVolume)
        : s?.sfxVolume !== undefined
          ? clampVolume(s.sfxVolume, base.sfxVolume)
          : base.sfxVolume,
    theme:
      explicitUpdates?.theme ??
      (s?.theme === "light" || s?.theme === "dark" ? s.theme : base.theme),
    notificationsEnabled:
      typeof explicitUpdates?.notificationsEnabled === "boolean"
        ? explicitUpdates.notificationsEnabled
        : typeof s?.notificationsEnabled === "boolean"
          ? s.notificationsEnabled
          : base.notificationsEnabled,
    colorblindMode:
      typeof explicitUpdates?.colorblindMode === "boolean"
        ? explicitUpdates.colorblindMode
        : typeof s?.colorblindMode === "boolean"
          ? s.colorblindMode
          : base.colorblindMode,
  };
}

export function PreferencesProvider({ children }: { children: React.ReactNode }) {
  const { token } = useAuth();
  const [preferences, setPreferences] = useState<UserPrefs>(() => {
    const initial = readLocalPreferences();
    setMusicVolume(initial.musicVolume);
    setSfxVolume(initial.sfxVolume);
    if (initial.musicVolume <= 0) {
      stopLobbyMusic();
    }
    return initial;
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPreferences = useCallback(async () => {
    const localPrefs = readLocalPreferences();

    if (!token) {
      setPreferences(localPrefs);
      setMusicVolume(localPrefs.musicVolume);
      setSfxVolume(localPrefs.sfxVolume);
      if (localPrefs.theme) {
        document.documentElement.classList.remove("dark", "light");
        document.documentElement.classList.add(localPrefs.theme);
      }
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
      setPreferences((prev) => {
        const merged = mergePrefs(prev || localPrefs, data);
        writeLocalPreferences(merged);
        setMusicVolume(merged.musicVolume);
        setSfxVolume(merged.sfxVolume);
        if (merged.theme) {
          document.documentElement.classList.remove("dark", "light");
          document.documentElement.classList.add(merged.theme);
        }
        return merged;
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch preferences";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  const updatePreferences = useCallback(
    async (updates: Partial<Omit<UserPrefs, "userId" | "createdAt" | "updatedAt">>) => {
      // Optimistically merge and persist locally immediately so partial updates (like sfxVolume)
      // NEVER wipe out other fields (like musicVolume: 0).
      setPreferences((prev) => {
        const base = prev || readLocalPreferences();
        const nextPrefs = mergePrefs(base, null, updates);
        writeLocalPreferences(nextPrefs);
        setMusicVolume(nextPrefs.musicVolume);
        setSfxVolume(nextPrefs.sfxVolume);
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
        // Merge server response with previous state and explicit updates so partial
        // guest responses ({ userId, sfxVolume }) NEVER overwrite musicVolume!
        setPreferences((prev) => {
          const base = prev || readLocalPreferences();
          const merged = mergePrefs(base, data, updates);
          writeLocalPreferences(merged);
          setMusicVolume(merged.musicVolume);
          setSfxVolume(merged.sfxVolume);
          return merged;
        });
        return data;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to update preferences";
        setError(message);
        console.warn("[usePreferences] Network error updating preferences:", message);
      } finally {
        setIsLoading(false);
      }
    },
    [token]
  );

  const updateMusicVolume = useCallback((volume: number) => {
    const safeVol = clampVolume(volume, DEFAULTS.musicVolume);
    return updatePreferences({ musicVolume: safeVol });
  }, [updatePreferences]);

  const updateSfxVolume = useCallback((volume: number) => {
    const safeVol = clampVolume(volume, DEFAULTS.sfxVolume);
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

  // Fetch preferences when token changes
  useEffect(() => {
    fetchPreferences();
  }, [token, fetchPreferences]);

  // Colorblind mode: toggle class on <body>
  useEffect(() => {
    if (preferences?.colorblindMode) {
      document.body.classList.add("colorblind");
    } else {
      document.body.classList.remove("colorblind");
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

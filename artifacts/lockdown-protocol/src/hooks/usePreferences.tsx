import { useState, useCallback, useEffect, createContext, useContext } from "react";
import { useAuth } from "./useAuth";

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
      const localPrefs = localStorage.getItem("lp_guest_preferences");
      if (localPrefs) {
        try {
          const parsed = JSON.parse(localPrefs);
          setPreferences(parsed);
          if (parsed.theme) {
            document.documentElement.classList.remove("dark", "light");
            document.documentElement.classList.add(parsed.theme);
          }
        } catch (e) {
          // ignore
        }
      } else {
        setPreferences({
          userId: "guest",
          musicVolume: 70,
          sfxVolume: 70,
          theme: "dark",
          notificationsEnabled: true,
          colorblindMode: false,
        });
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
        return new Promise<any>((resolve) => {
          setPreferences((prev) => {
            const defaultPrefs: UserPrefs = {
              userId: "guest",
              musicVolume: 70,
              sfxVolume: 70,
              theme: "dark",
              notificationsEnabled: true,
              colorblindMode: false,
            };
            const nextPrefs = { ...(prev || defaultPrefs), ...updates } as UserPrefs;
            localStorage.setItem("lp_guest_preferences", JSON.stringify(nextPrefs));
            resolve(nextPrefs);
            return nextPrefs;
          });
        });
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

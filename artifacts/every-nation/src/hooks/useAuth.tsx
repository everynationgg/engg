import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  ReactNode,
} from "react";

interface AuthUser {
  id: string | null;
  username: string | null;
  email: string | null;
  isVerified: boolean;
  credits: number;
  xp: number;
  level: number;
}

interface AuthContextType {
  isLoggedIn: boolean;
  userId: string | null;
  username: string | null;
  token: string | null;
  email: string | null;
  isVerified: boolean;
  credits: number;
  xp: number;
  level: number;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, username: string, password: string) => Promise<void>;
  verify: (code: string) => Promise<void>;
  resendVerification: () => Promise<void>;
  logout: (reason?: string) => void;
  refreshUser: () => Promise<void>;
  devLogin: (customUsername?: string, customEmail?: string) => void;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
  user: AuthUser | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY_TOKEN = "lp_auth_token";
const STORAGE_KEY_USER_ID = "lp_user_id";
const STORAGE_KEY_USERNAME = "lp_username";
const STORAGE_KEY_EMAIL = "lp_email";
const STORAGE_KEY_IS_VERIFIED = "lp_is_verified";
const STORAGE_KEY_CREDITS = "lp_credits";
const STORAGE_KEY_XP = "lp_xp";
const STORAGE_KEY_LEVEL = "lp_level";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [isVerified, setIsVerified] = useState(false);
  const [credits, setCredits] = useState(0);
  const [xp, setXp] = useState(0);
  const [level, setLevel] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const isInitializingRef = useRef(false);
  const hasInitializedRef = useRef(false);

  const logout = useCallback((reason?: string) => {
    localStorage.removeItem(STORAGE_KEY_TOKEN);
    localStorage.removeItem(STORAGE_KEY_USER_ID);
    localStorage.removeItem(STORAGE_KEY_USERNAME);
    localStorage.removeItem(STORAGE_KEY_EMAIL);
    localStorage.removeItem(STORAGE_KEY_IS_VERIFIED);
    localStorage.removeItem(STORAGE_KEY_CREDITS);
    localStorage.removeItem(STORAGE_KEY_XP);
    localStorage.removeItem(STORAGE_KEY_LEVEL);

    setToken(null);
    setUserId(null);
    setUsername(null);
    setEmail(null);
    setIsVerified(false);
    setCredits(0);
    setXp(0);
    setLevel(1);
    setIsLoggedIn(false);
    setError(reason || null);
  }, []);

  const refreshUser = useCallback(async () => {
    const currentToken = localStorage.getItem(STORAGE_KEY_TOKEN) || token;
    if (!currentToken) return;
    if (currentToken.startsWith("dev_")) {
      if (!import.meta.env.DEV) {
        logout();
      } else {
        setCredits(parseInt(localStorage.getItem(STORAGE_KEY_CREDITS) || "0", 10));
        setXp(parseInt(localStorage.getItem(STORAGE_KEY_XP) || "0", 10));
        setLevel(parseInt(localStorage.getItem(STORAGE_KEY_LEVEL) || "1", 10));
      }
      return;
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || ""}/api/auth/me`, {
        headers: { Authorization: `Bearer ${currentToken}` },
      });

      if (response.ok) {
        const data = await response.json();
        setIsVerified(data.isVerified === true);
        setCredits(data.credits || 0);
        setXp((prev) => (typeof data.xp === "number" ? data.xp : prev));
        setLevel((prev) => (typeof data.level === "number" ? data.level : prev));
        setUsername(data.username);

        localStorage.setItem(STORAGE_KEY_IS_VERIFIED, String(data.isVerified));
        localStorage.setItem(STORAGE_KEY_CREDITS, String(data.credits || 0));
        if (typeof data.xp === "number") localStorage.setItem(STORAGE_KEY_XP, String(data.xp));
        if (typeof data.level === "number") localStorage.setItem(STORAGE_KEY_LEVEL, String(data.level));
        localStorage.setItem(STORAGE_KEY_USERNAME, data.username);
      } else if (response.status === 401) {
        const isGuest = (localStorage.getItem(STORAGE_KEY_USER_ID) || "").startsWith("guest_");
        if (isGuest) {
          logout();
        } else {
          logout("Session expired. Please sign in again.");
        }
      }
    } catch (err) {
      console.error("Failed to refresh user:", err);
    }
  }, [token, logout]);

  const initAnonymous = useCallback(async () => {
    if (isInitializingRef.current) return;
    const currentToken = localStorage.getItem(STORAGE_KEY_TOKEN);
    if (currentToken) return;

    isInitializingRef.current = true;
    setIsLoading(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || "";
      const resp = await fetch(`${apiUrl}/api/auth/anonymous`, {
        method: "POST",
      });
      if (resp.ok) {
        const data = await resp.json();
        localStorage.setItem(STORAGE_KEY_TOKEN, data.token);
        localStorage.setItem(STORAGE_KEY_USER_ID, data.id);
        localStorage.setItem(STORAGE_KEY_USERNAME, data.username);
        setToken(data.token);
        setUserId(data.id);
        setUsername(data.username);
        setIsLoggedIn(false);
      } else {
        const fallbackGuestId = `guest_${Math.random().toString(36).substring(2, 9)}`;
        const fallbackUsername = `Guest_${Math.random().toString(36).substring(2, 6)}`;
        localStorage.setItem(STORAGE_KEY_USER_ID, fallbackGuestId);
        localStorage.setItem(STORAGE_KEY_USERNAME, fallbackUsername);
        setUserId(fallbackGuestId);
        setUsername(fallbackUsername);
        setIsLoggedIn(false);
      }
    } catch {
      const fallbackGuestId = `guest_${Math.random().toString(36).substring(2, 9)}`;
      const fallbackUsername = `Guest_${Math.random().toString(36).substring(2, 6)}`;
      localStorage.setItem(STORAGE_KEY_USER_ID, fallbackGuestId);
      localStorage.setItem(STORAGE_KEY_USERNAME, fallbackUsername);
      setUserId(fallbackGuestId);
      setUsername(fallbackUsername);
      setIsLoggedIn(false);
    } finally {
      setIsLoading(false);
      setIsInitialized(true);
    }
  }, []);

  useEffect(() => {
    if (hasInitializedRef.current) return;
    hasInitializedRef.current = true;

    const savedToken = localStorage.getItem(STORAGE_KEY_TOKEN);
    const savedUserId = localStorage.getItem(STORAGE_KEY_USER_ID);
    const savedUsername = localStorage.getItem(STORAGE_KEY_USERNAME);
    let savedEmail = localStorage.getItem(STORAGE_KEY_EMAIL);
    if (savedEmail && savedEmail.toLowerCase().endsWith("@everynation.gg")) {
      localStorage.removeItem(STORAGE_KEY_EMAIL);
      savedEmail = null;
    }
    const savedIsVerified = localStorage.getItem(STORAGE_KEY_IS_VERIFIED) === "true";
    const savedCredits = parseInt(localStorage.getItem(STORAGE_KEY_CREDITS) || "0", 10);
    const savedXp = parseInt(localStorage.getItem(STORAGE_KEY_XP) || "0", 10);
    const savedLevel = parseInt(localStorage.getItem(STORAGE_KEY_LEVEL) || "1", 10);

    if (savedToken && savedToken.startsWith("dev_") && !import.meta.env.DEV) {
      logout();
      initAnonymous();
      return;
    }

    if (savedToken && savedUserId) {
      setToken(savedToken);
      setUserId(savedUserId);
      setUsername(savedUsername);
      setEmail(savedEmail);
      setIsVerified(savedIsVerified);
      setCredits(savedCredits);
      setXp(savedXp);
      setLevel(savedLevel);

      const isGuest = savedUserId.startsWith("guest_");
      setIsLoggedIn(!isGuest);

      if (!isGuest) {
        refreshUser();
      }
      setIsInitialized(true);
    } else {
      initAnonymous();
    }
  }, [refreshUser, initAnonymous, logout]);

  const devLogin = useCallback((customUsername = "meowionly", customEmail = "") => {
    if (!import.meta.env.DEV) {
      return;
    }
    const devToken = `dev_token_${Date.now()}`;
    const devId = `dev_usr_${Date.now()}`;
    const devCredits = 500;
    const devXp = 250;
    const devLevel = 2;

    localStorage.setItem(STORAGE_KEY_TOKEN, devToken);
    localStorage.setItem(STORAGE_KEY_USER_ID, devId);
    localStorage.setItem(STORAGE_KEY_USERNAME, customUsername);
    if (customEmail) {
      localStorage.setItem(STORAGE_KEY_EMAIL, customEmail);
    } else {
      localStorage.removeItem(STORAGE_KEY_EMAIL);
    }
    localStorage.setItem(STORAGE_KEY_IS_VERIFIED, "true");
    localStorage.setItem(STORAGE_KEY_CREDITS, String(devCredits));
    localStorage.setItem(STORAGE_KEY_XP, String(devXp));
    localStorage.setItem(STORAGE_KEY_LEVEL, String(devLevel));

    setToken(devToken);
    setUserId(devId);
    setUsername(customUsername);
    setEmail(customEmail || null);
    setIsVerified(true);
    setCredits(devCredits);
    setXp(devXp);
    setLevel(devLevel);
    setIsLoggedIn(true);
    setError(null);
  }, []);

  const login = useCallback(async (emailInput: string, passwordInput: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || ""}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailInput, password: passwordInput }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Invalid username/email or password");
      }

      const data = await response.json();
      localStorage.setItem(STORAGE_KEY_TOKEN, data.token);
      localStorage.setItem(STORAGE_KEY_USER_ID, data.id);
      localStorage.setItem(STORAGE_KEY_USERNAME, data.username);
      localStorage.setItem(STORAGE_KEY_EMAIL, emailInput);
      localStorage.setItem(STORAGE_KEY_IS_VERIFIED, String(data.isVerified));
      localStorage.setItem(STORAGE_KEY_CREDITS, String(data.credits || 0));
      localStorage.setItem(STORAGE_KEY_XP, String(data.xp || 0));
      localStorage.setItem(STORAGE_KEY_LEVEL, String(data.level || 1));

      setToken(data.token);
      setUserId(data.id);
      setUsername(data.username);
      setEmail(emailInput);
      setIsVerified(data.isVerified === true);
      setCredits(data.credits || 0);
      setXp(data.xp || 0);
      setLevel(data.level || 1);
      setIsLoggedIn(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Sign in failed";
      setError(message);
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(
    async (emailInput: string, usernameInput: string, passwordInput: string) => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL || ""}/api/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: emailInput,
            username: usernameInput,
            password: passwordInput,
          }),
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error || "Registration failed");
        }

        const data = await response.json();
        localStorage.setItem(STORAGE_KEY_TOKEN, data.token);
        localStorage.setItem(STORAGE_KEY_USER_ID, data.id);
        localStorage.setItem(STORAGE_KEY_USERNAME, data.username);
        localStorage.setItem(STORAGE_KEY_EMAIL, emailInput);
        localStorage.setItem(STORAGE_KEY_IS_VERIFIED, "false");
        localStorage.setItem(STORAGE_KEY_CREDITS, String(data.credits || 0));
        localStorage.setItem(STORAGE_KEY_XP, "0");
        localStorage.setItem(STORAGE_KEY_LEVEL, "1");

        setToken(data.token);
        setUserId(data.id);
        setUsername(data.username);
        setEmail(emailInput);
        setIsVerified(false);
        setCredits(data.credits || 0);
        setXp(0);
        setLevel(1);
        setIsLoggedIn(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Registration failed");
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const verify = useCallback(
    async (code: string) => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL || ""}/api/auth/verify`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ code }),
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error || "Verification failed");
        }

        setIsVerified(true);
        localStorage.setItem(STORAGE_KEY_IS_VERIFIED, "true");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Verification failed");
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [token]
  );

  const resendVerification = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || ""}/api/auth/resend`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Unable to resend verification code");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to resend verification code");
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  const user = useMemo<AuthUser | null>(
    () =>
      isLoggedIn
        ? {
            id: userId,
            username,
            email,
            isVerified,
            credits,
            xp,
            level,
          }
        : null,
    [isLoggedIn, userId, username, email, isVerified, credits, xp, level]
  );

  const contextValue = useMemo<AuthContextType>(
    () => ({
      isLoggedIn,
      userId,
      username,
      token,
      email,
      isVerified,
      credits,
      xp,
      level,
      login,
      register,
      verify,
      resendVerification,
      logout,
      refreshUser,
      devLogin,
      isLoading,
      error,
      isInitialized,
      user,
    }),
    [
      isLoggedIn,
      userId,
      username,
      token,
      email,
      isVerified,
      credits,
      xp,
      level,
      login,
      register,
      verify,
      resendVerification,
      logout,
      refreshUser,
      devLogin,
      isLoading,
      error,
      isInitialized,
      user,
    ]
  );

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

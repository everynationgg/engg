import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";

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
  logout: () => void;
  refreshUser: () => Promise<void>;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
  user: {
    id: string | null;
    username: string | null;
    email: string | null;
    isVerified: boolean;
    credits: number;
    xp: number;
    level: number;
  } | null;
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

  const refreshUser = useCallback(async () => {
    const currentToken = localStorage.getItem(STORAGE_KEY_TOKEN) || token;
    if (!currentToken) return;

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${currentToken}` },
      });

      if (response.ok) {
        const data = await response.json();
        setIsVerified(data.isVerified === true);
        setCredits(data.credits || 0);
        setXp(data.xp || 0);
        setLevel(data.level || 1);
        setUsername(data.username);
        
        localStorage.setItem(STORAGE_KEY_IS_VERIFIED, String(data.isVerified));
        localStorage.setItem(STORAGE_KEY_CREDITS, String(data.credits || 0));
        localStorage.setItem(STORAGE_KEY_XP, String(data.xp || 0));
        localStorage.setItem(STORAGE_KEY_LEVEL, String(data.level || 1));
        localStorage.setItem(STORAGE_KEY_USERNAME, data.username);
      } else if (response.status === 401) {
        logout();
      }
    } catch (err) {
      console.error("Failed to refresh user:", err);
    }
  }, [token]);

  useEffect(() => {
    const savedToken = localStorage.getItem(STORAGE_KEY_TOKEN);
    const savedUserId = localStorage.getItem(STORAGE_KEY_USER_ID);
    const savedUsername = localStorage.getItem(STORAGE_KEY_USERNAME);
    const savedEmail = localStorage.getItem(STORAGE_KEY_EMAIL);
    const savedIsVerified = localStorage.getItem(STORAGE_KEY_IS_VERIFIED) === "true";
    const savedCredits = parseInt(localStorage.getItem(STORAGE_KEY_CREDITS) || "0", 10);
    const savedXp = parseInt(localStorage.getItem(STORAGE_KEY_XP) || "0", 10);
    const savedLevel = parseInt(localStorage.getItem(STORAGE_KEY_LEVEL) || "1", 10);
    
    if (savedToken && savedUserId) {
      setToken(savedToken);
      setUserId(savedUserId);
      setUsername(savedUsername);
      setEmail(savedEmail);
      setIsVerified(savedIsVerified);
      setCredits(savedCredits);
      setXp(savedXp);
      setLevel(savedLevel);
      setIsLoggedIn(true);
      refreshUser();
    }
    setIsInitialized(true);
  }, [refreshUser]);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) throw new Error("Invalid credentials");

      const data = await response.json();
      localStorage.setItem(STORAGE_KEY_TOKEN, data.token);
      localStorage.setItem(STORAGE_KEY_USER_ID, data.id);
      localStorage.setItem(STORAGE_KEY_USERNAME, data.username);
      localStorage.setItem(STORAGE_KEY_EMAIL, email);
      localStorage.setItem(STORAGE_KEY_IS_VERIFIED, String(data.isVerified));
      localStorage.setItem(STORAGE_KEY_CREDITS, String(data.credits || 0));
      localStorage.setItem(STORAGE_KEY_XP, String(data.xp || 0));
      localStorage.setItem(STORAGE_KEY_LEVEL, String(data.level || 1));

      setToken(data.token);
      setUserId(data.id);
      setUsername(data.username);
      setEmail(email);
      setIsVerified(data.isVerified === true);
      setCredits(data.credits || 0);
      setXp(data.xp || 0);
      setLevel(data.level || 1);
      setIsLoggedIn(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (email: string, username: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, username, password }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Registration failed");
      }

      const data = await response.json();
      localStorage.setItem(STORAGE_KEY_TOKEN, data.token);
      localStorage.setItem(STORAGE_KEY_USER_ID, data.id);
      localStorage.setItem(STORAGE_KEY_USERNAME, data.username);
      localStorage.setItem(STORAGE_KEY_EMAIL, email);
      localStorage.setItem(STORAGE_KEY_IS_VERIFIED, "false");
      localStorage.setItem(STORAGE_KEY_CREDITS, String(data.credits || 0));
      localStorage.setItem(STORAGE_KEY_XP, "0");
      localStorage.setItem(STORAGE_KEY_LEVEL, "1");

      setToken(data.token);
      setUserId(data.id);
      setUsername(data.username);
      setEmail(email);
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
  }, []);

  const verify = useCallback(async (code: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/verify`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ code }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Verification failed");
      }

      setIsVerified(true);
      localStorage.setItem(STORAGE_KEY_IS_VERIFIED, "true");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed");
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  const resendVerification = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/resend`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Resend failed");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Resend failed");
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  const logout = useCallback(() => {
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
  }, []);

  const user = isLoggedIn ? {
    id: userId,
    username,
    email,
    isVerified,
    credits,
    xp,
    level
  } : null;

  return (
    <AuthContext.Provider
      value={{
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
        isLoading,
        error,
        isInitialized,
        user
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

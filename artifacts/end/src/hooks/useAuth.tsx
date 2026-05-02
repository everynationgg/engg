import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import { setAuthTokenGetter } from "@workspace/api-client-react";

interface AuthContextType {
  isLoggedIn: boolean;
  userId: string | null;
  username: string | null;
  token: string | null;
  email: string | null;
  isVerified: boolean;
  isAdmin: boolean;
  credits: number;
  xp: number;
  level: number;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, username: string, password: string) => Promise<void>;
  logout: () => void;
  resendVerificationEmail: () => Promise<void>;
  refreshUser: () => Promise<void>;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY_TOKEN = "lp_auth_token";
const STORAGE_KEY_REFRESH_TOKEN = "lp_refresh_token";
const STORAGE_KEY_USER_ID = "lp_user_id";
const STORAGE_KEY_USERNAME = "lp_username";
const STORAGE_KEY_EMAIL = "lp_email";
const STORAGE_KEY_IS_VERIFIED = "lp_is_verified";
const STORAGE_KEY_IS_ADMIN = "lp_is_admin";
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
  const [isAdmin, setIsAdmin] = useState(false);
  const [credits, setCredits] = useState(0);
  const [xp, setXp] = useState(0);
  const [level, setLevel] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Set up auth token getter for API client
  useEffect(() => {
    setAuthTokenGetter(() => token);
  }, [token]);

  const refreshUser = useCallback(async () => {
    const currentToken = localStorage.getItem(STORAGE_KEY_TOKEN) || token;
    if (!currentToken) return;

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${currentToken}` },
      });

      if (response.ok) {
        const data = await response.json();
        const newIsVerified = data.isVerified === true;
        
        setIsVerified(newIsVerified);
        localStorage.setItem(STORAGE_KEY_IS_VERIFIED, String(newIsVerified));
        
        const newIsAdmin = data.isAdmin === true;
        setIsAdmin(newIsAdmin);
        localStorage.setItem(STORAGE_KEY_IS_ADMIN, String(newIsAdmin));
        
        if (data.credits !== undefined) {
          setCredits(data.credits);
          localStorage.setItem(STORAGE_KEY_CREDITS, String(data.credits));
        }

        if (data.xp !== undefined) {
          setXp(data.xp);
          localStorage.setItem(STORAGE_KEY_XP, String(data.xp));
        }

        if (data.level !== undefined) {
          setLevel(data.level);
          localStorage.setItem(STORAGE_KEY_LEVEL, String(data.level));
        }
        
        if (data.username) {
          setUsername(data.username);
          localStorage.setItem(STORAGE_KEY_USERNAME, data.username);
        }
      } else if (response.status === 401) {
        const isGuest = (localStorage.getItem(STORAGE_KEY_USER_ID) || "").startsWith("guest_");
        if (isGuest) {
          logout();
        } else {
          // Attempt to refresh if unauthorized
          await performTokenRefresh();
        }
      }
    } catch (err) {
      console.error("Failed to refresh user:", err);
      if (!(localStorage.getItem(STORAGE_KEY_USER_ID) || "").startsWith("guest_")) {
         logout("Tactical sync failed. Please re-authenticate.");
      }
    }
  }, [token]);

  const initAnonymous = useCallback(async () => {
    if (isLoading || isLoggedIn || token) return;
    setIsLoading(true);
    try {
      const resp = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/anonymous`, {
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
      }
    } catch (err) {
      console.error("Anonymous init failed:", err);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, isLoggedIn, token]);

  const performTokenRefresh = useCallback(async () => {
    const refreshToken = localStorage.getItem(STORAGE_KEY_REFRESH_TOKEN);
    if (!refreshToken) {
      logout();
      return;
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });

      if (response.ok) {
        const data = await response.json();
        const newToken = data.token;
        setToken(newToken);
        localStorage.setItem(STORAGE_KEY_TOKEN, newToken);
        return newToken;
      } else {
        logout("Session expired. Identity handshake required.");
      }
    } catch (err) {
      console.error("Token rotation failed:", err);
      logout("Network disruption. Session terminated.");
    }
  }, []);

  // Auto-refresh timer to keep session alive
  useEffect(() => {
    if (!isLoggedIn) return;
    
    // Refresh access token every 20 hours (before it expires at 24h)
    const interval = setInterval(performTokenRefresh, 20 * 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, [isLoggedIn, performTokenRefresh]);

  // Initialize from localStorage on mount
  useEffect(() => {
    const savedToken = localStorage.getItem(STORAGE_KEY_TOKEN);
    const savedUserId = localStorage.getItem(STORAGE_KEY_USER_ID);
    const savedUsername = localStorage.getItem(STORAGE_KEY_USERNAME);
    const savedEmail = localStorage.getItem(STORAGE_KEY_EMAIL);
    const savedIsVerified = localStorage.getItem(STORAGE_KEY_IS_VERIFIED) === "true";
    const savedIsAdmin = localStorage.getItem(STORAGE_KEY_IS_ADMIN) === "true";
    const savedCredits = parseInt(localStorage.getItem(STORAGE_KEY_CREDITS) || "0", 10);
    const savedXp = parseInt(localStorage.getItem(STORAGE_KEY_XP) || "0", 10);
    const savedLevel = parseInt(localStorage.getItem(STORAGE_KEY_LEVEL) || "1", 10);
    
    if (savedToken && savedUserId) {
      setToken(savedToken);
      setUserId(savedUserId);
      setUsername(savedUsername);
      setEmail(savedEmail);
      setIsVerified(savedIsVerified);
      setIsAdmin(savedIsAdmin);
      setCredits(savedCredits);
      setXp(savedXp);
      setLevel(savedLevel);
      
      const isGuest = savedUserId.startsWith("guest_");
      setIsLoggedIn(!isGuest);
      
      if (!isGuest) {
        refreshUser();
      }
    } else {
      initAnonymous();
    }
    // Always mark as initialized — including the logged-out/guest path
    setIsInitialized(true);
  }, [refreshUser, initAnonymous]);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Invalid credentials");
      }

      const data = await response.json();
      const newToken = data.token;
      const newRefreshToken = data.refreshToken;
      const newUserId = data.id;
      const newUsername = data.username;
      const newIsVerified = data.isVerified === true;

      const newIsAdmin = data.isAdmin === true;

      // Save to localStorage
      localStorage.setItem(STORAGE_KEY_TOKEN, newToken);
      localStorage.setItem(STORAGE_KEY_REFRESH_TOKEN, newRefreshToken);
      localStorage.setItem(STORAGE_KEY_USER_ID, newUserId);
      localStorage.setItem(STORAGE_KEY_USERNAME, newUsername);
      localStorage.setItem(STORAGE_KEY_EMAIL, email);
      localStorage.setItem(STORAGE_KEY_IS_VERIFIED, String(newIsVerified));
      localStorage.setItem(STORAGE_KEY_IS_ADMIN, String(newIsAdmin));
      localStorage.setItem(STORAGE_KEY_CREDITS, String(data.credits || 0));
      localStorage.setItem(STORAGE_KEY_XP, String(data.xp || 0));
      localStorage.setItem(STORAGE_KEY_LEVEL, String(data.level || 1));

      // Update state
      setToken(newToken);
      setUserId(newUserId);
      setUsername(newUsername);
      setEmail(email);
      setIsVerified(newIsVerified);
      setIsAdmin(newIsAdmin);
      setCredits(data.credits || 0);
      setXp(data.xp || 0);
      setLevel(data.level || 1);
      setIsLoggedIn(true);
      
    } catch (err) {
      const message = err instanceof Error ? err.message : "Login failed";
      setError(message);
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
      const newToken = data.token;
      const newRefreshToken = data.refreshToken;
      const newUserId = data.id;
      const newUsername = data.username;
      const newIsVerified = data.isVerified === true;

      const newIsAdmin = data.isAdmin === true;

      // Save to localStorage
      localStorage.setItem(STORAGE_KEY_TOKEN, newToken);
      localStorage.setItem(STORAGE_KEY_REFRESH_TOKEN, newRefreshToken);
      localStorage.setItem(STORAGE_KEY_USER_ID, newUserId);
      localStorage.setItem(STORAGE_KEY_USERNAME, newUsername);
      localStorage.setItem(STORAGE_KEY_EMAIL, email);
      localStorage.setItem(STORAGE_KEY_IS_VERIFIED, String(newIsVerified));
      localStorage.setItem(STORAGE_KEY_IS_ADMIN, String(newIsAdmin));
      localStorage.setItem(STORAGE_KEY_CREDITS, String(data.credits || 0));
      localStorage.setItem(STORAGE_KEY_XP, String(data.xp || 0));
      localStorage.setItem(STORAGE_KEY_LEVEL, String(data.level || 1));

      // Update state
      setToken(newToken);
      setUserId(newUserId);
      setUsername(newUsername);
      setEmail(email);
      setIsVerified(newIsVerified);
      setIsAdmin(newIsAdmin);
      setCredits(data.credits || 0);
      setXp(data.xp || 0);
      setLevel(data.level || 1);
      setIsLoggedIn(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Registration failed";
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback((reason?: string) => {
    const refreshToken = localStorage.getItem(STORAGE_KEY_REFRESH_TOKEN);
    if (refreshToken) {
      fetch(`${import.meta.env.VITE_API_URL}/api/auth/logout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      }).catch(err => console.error("Logout notification failed:", err));
    }

    localStorage.removeItem(STORAGE_KEY_TOKEN);
    localStorage.removeItem(STORAGE_KEY_REFRESH_TOKEN);
    localStorage.removeItem(STORAGE_KEY_USER_ID);
    localStorage.removeItem(STORAGE_KEY_USERNAME);
    localStorage.removeItem(STORAGE_KEY_EMAIL);
    localStorage.removeItem(STORAGE_KEY_IS_VERIFIED);
    localStorage.removeItem(STORAGE_KEY_IS_ADMIN);
    localStorage.removeItem(STORAGE_KEY_CREDITS);
    localStorage.removeItem(STORAGE_KEY_XP);
    localStorage.removeItem(STORAGE_KEY_LEVEL);

    setToken(null);
    setUserId(null);
    setUsername(null);
    setEmail(null);
    setIsVerified(false);
    setIsAdmin(false);
    setCredits(0);
    setXp(0);
    setLevel(1);
    setIsLoggedIn(false);
    if (reason) {
      setError(reason);
    } else {
      setError(null);
    }
  }, []);

  const resendVerificationEmail = useCallback(async () => {
    if (!email) {
      setError("No email found");
      throw new Error("No email found");
    }

    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/resend-verification-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to resend verification email");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to resend verification email";
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [email, token]);

  return (
    <AuthContext.Provider
      value={{
        isLoggedIn,
        userId,
        username,
        token,
        email,
        isVerified,
        isAdmin,
        credits,
        xp,
        level,
        login,
        register,
        logout,
        resendVerificationEmail,
        refreshUser,
        isLoading,
        error,
        isInitialized,
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

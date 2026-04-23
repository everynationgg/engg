import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import { setAuthTokenGetter } from "@workspace/api-client-react";

interface AuthContextType {
  isLoggedIn: boolean;
  userId: string | null;
  username: string | null;
  token: string | null;
  email: string | null;
  isVerified: boolean;
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
const STORAGE_KEY_USER_ID = "lp_user_id";
const STORAGE_KEY_USERNAME = "lp_username";
const STORAGE_KEY_EMAIL = "lp_email";
const STORAGE_KEY_IS_VERIFIED = "lp_is_verified";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [isVerified, setIsVerified] = useState(false);
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
        
        if (data.username) {
          setUsername(data.username);
          localStorage.setItem(STORAGE_KEY_USERNAME, data.username);
        }
      }
    } catch (err) {
      console.error("Failed to refresh user:", err);
    }
  }, [token]);

  // Initialize from localStorage on mount
  useEffect(() => {
    const savedToken = localStorage.getItem(STORAGE_KEY_TOKEN);
    const savedUserId = localStorage.getItem(STORAGE_KEY_USER_ID);
    const savedUsername = localStorage.getItem(STORAGE_KEY_USERNAME);
    const savedEmail = localStorage.getItem(STORAGE_KEY_EMAIL);
    const savedIsVerified = localStorage.getItem(STORAGE_KEY_IS_VERIFIED) === "true";
    
    if (savedToken && savedUserId) {
      setToken(savedToken);
      setUserId(savedUserId);
      setUsername(savedUsername);
      setEmail(savedEmail);
      setIsVerified(savedIsVerified);
      setIsLoggedIn(true);
      
      // Refresh user data from server to sync verification status
      refreshUser();
    }
    // Always mark as initialized — including the logged-out/guest path
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

      if (!response.ok) {
        throw new Error("Invalid credentials");
      }

      const data = await response.json();
      const newToken = data.token;
      const newUserId = data.id;
      const newUsername = data.username;
      const newIsVerified = data.isVerified === true;

      // Save to localStorage
      localStorage.setItem(STORAGE_KEY_TOKEN, newToken);
      localStorage.setItem(STORAGE_KEY_USER_ID, newUserId);
      localStorage.setItem(STORAGE_KEY_USERNAME, newUsername);
      localStorage.setItem(STORAGE_KEY_EMAIL, email);
      localStorage.setItem(STORAGE_KEY_IS_VERIFIED, String(newIsVerified));

      // Update state
      setToken(newToken);
      setUserId(newUserId);
      setUsername(newUsername);
      setEmail(email);
      setIsVerified(newIsVerified);
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
      const newUserId = data.id;
      const newUsername = data.username;
      const newIsVerified = data.isVerified === true;

      // Save to localStorage
      localStorage.setItem(STORAGE_KEY_TOKEN, newToken);
      localStorage.setItem(STORAGE_KEY_USER_ID, newUserId);
      localStorage.setItem(STORAGE_KEY_USERNAME, newUsername);
      localStorage.setItem(STORAGE_KEY_EMAIL, email);
      localStorage.setItem(STORAGE_KEY_IS_VERIFIED, String(newIsVerified));

      // Update state
      setToken(newToken);
      setUserId(newUserId);
      setUsername(newUsername);
      setEmail(email);
      setIsVerified(newIsVerified);
      setIsLoggedIn(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Registration failed";
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY_TOKEN);
    localStorage.removeItem(STORAGE_KEY_USER_ID);
    localStorage.removeItem(STORAGE_KEY_USERNAME);
    localStorage.removeItem(STORAGE_KEY_EMAIL);
    localStorage.removeItem(STORAGE_KEY_IS_VERIFIED);

    setToken(null);
    setUserId(null);
    setUsername(null);
    setEmail(null);
    setIsVerified(false);
    setIsLoggedIn(false);
    setError(null);
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

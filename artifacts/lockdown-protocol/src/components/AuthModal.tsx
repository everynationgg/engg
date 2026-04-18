import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import ForgotPasswordModal from "./ForgotPasswordModal";
import { playSciFiClick } from "@/lib/sound";

type AuthMode = "login" | "register";

interface AuthModalProps {
  onClose: () => void;
  onSuccess?: () => void;
}

export default function AuthModal({ onClose, onSuccess }: AuthModalProps) {
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [localError, setLocalError] = useState("");
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const { login, register, isLoading } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError("");
    playSciFiClick();

    try {
      if (mode === "login") {
        await login(email, password);
      } else {
        await register(email, username, password);
      }
      onSuccess?.();
      onClose();
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : "An error occurred");
    }
  };

  const toggleMode = () => {
    setMode(mode === "login" ? "register" : "login");
    setLocalError("");
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6 ix-backdrop ix-backdrop-blur"
      style={{ background: "hsl(220 30% 4% / 0.9)" }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-lg p-8 ix-modal-enter"
        style={{
          border: "1px solid hsl(270 80% 55% / 0.4)",
          boxShadow: "0 0 40px hsl(270 80% 55% / 0.2)",
          background: "hsl(220 28% 10%)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={() => {
            setShowForgotPassword(false);
            onClose();
          }}
          className="absolute top-4 right-4 text-xs font-orbitron"
          style={{ color: "hsl(270 80% 55%)" }}
        >
          ✕
        </button>

        {/* Title */}
        <h2
          className="font-orbitron font-bold text-xl tracking-[0.15em] mb-6 text-center"
          style={{ color: "hsl(270 80% 70%)" }}
        >
          {showForgotPassword ? "RESET PASSWORD" : mode === "login" ? "LOGIN" : "REGISTER"}
        </h2>

        {/* Forgot Password Modal */}
        {showForgotPassword ? (
          <div>
            <ForgotPasswordModal
              onClose={() => {
                setShowForgotPassword(false);
              }}
            />
            <button
              onClick={() => setShowForgotPassword(false)}
              className="w-full mt-4 py-2 rounded font-orbitron text-sm tracking-[0.1em] uppercase transition-all duration-150"
              style={{
                background: "hsl(220 28% 15%)",
                color: "hsl(210 30% 60%)",
                border: "1px solid hsl(210 30% 25%)",
              }}
            >
              BACK TO LOGIN
            </button>
          </div>
        ) : (
          <>
            {/* Error message */}
            {localError && (
              <div
                className="mb-4 p-3 rounded text-sm font-mono"
                style={{
                  background: "hsl(0 100% 50% / 0.15)",
                  borderLeft: "2px solid hsl(0 100% 50%)",
                  color: "hsl(0 100% 70%)",
                }}
              >
                {localError}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div>
                <label
                  className="block text-xs font-orbitron tracking-[0.1em] mb-2"
                  style={{ color: "hsl(185 100% 60%)" }}
                >
                  EMAIL
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded border text-sm font-mono ix-input"
                  style={{
                    background: "hsl(220 28% 5%)",
                    borderColor: "hsl(270 80% 55% / 0.3)",
                    color: "hsl(0 0% 95%)",
                  }}
                  placeholder="user@example.com"
                />
              </div>

              {/* Username (register only) */}
              {mode === "register" && (
                <div>
                  <label
                    className="block text-xs font-orbitron tracking-[0.1em] mb-2"
                    style={{ color: "hsl(185 100% 60%)" }}
                  >
                    USERNAME
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required={mode === "register"}
                    className="w-full px-3 py-2 rounded border text-sm font-mono ix-input"
                    style={{
                      background: "hsl(220 28% 5%)",
                      borderColor: "hsl(270 80% 55% / 0.3)",
                      color: "hsl(0 0% 95%)",
                    }}
                    placeholder="your_username"
                    minLength={3}
                  />
                </div>
              )}

              {/* Password */}
              <div>
                <label
                  className="block text-xs font-orbitron tracking-[0.1em] mb-2"
                  style={{ color: "hsl(185 100% 60%)" }}
                >
                  PASSWORD
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded border text-sm font-mono ix-input"
                  style={{
                    background: "hsl(220 28% 5%)",
                    borderColor: "hsl(270 80% 55% / 0.3)",
                    color: "hsl(0 0% 95%)",
                  }}
                  placeholder="••••••••"
                  minLength={6}
                />
                {/* Forgot Password link (login only) */}
                {mode === "login" && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      setShowForgotPassword(true);
                    }}
                    className="text-xs mt-2 transition-colors hover:opacity-80"
                    style={{ color: "hsl(40 100% 50%)" }}
                  >
                    Forgot password?
                  </button>
                )}
              </div>

              {/* Submit button */}
              <button
                type="submit"
                disabled={isLoading}
                className="ix-btn w-full py-2 rounded font-orbitron text-sm tracking-[0.1em] uppercase transition-all duration-150 disabled:opacity-50"
                style={{
                  background: "hsl(270 80% 55%)",
                  color: "hsl(220 28% 10%)",
                  cursor: isLoading ? "not-allowed" : "pointer",
                }}
              >
                {isLoading ? "PROCESSING..." : mode === "login" ? "LOGIN" : "CREATE ACCOUNT"}
              </button>
            </form>

            {/* Toggle mode link */}
            <div className="mt-4 text-center text-xs font-mono">
              <span style={{ color: "hsl(210 30% 45%)" }}>
                {mode === "login" ? "Don't have an account? " : "Already have an account? "}
              </span>
              <button
                onClick={toggleMode}
                className="transition-colors hover:opacity-80"
                style={{ color: "hsl(185 100% 60%)" }}
              >
                {mode === "login" ? "Register" : "Login"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

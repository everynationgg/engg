import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import ForgotPasswordModal from "./ForgotPasswordModal";
import { playSciFiClick } from "@/lib/sound";
import { FaEnvelope, FaUser, FaLock } from "react-icons/fa";

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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    const handleBackButton = (e: Event) => {
      e.preventDefault();
      onClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    document.addEventListener("backbutton", handleBackButton);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("backbutton", handleBackButton);
    };
  }, [onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError("");
    playSciFiClick();

    if (mode === "register" && (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password))) {
      setLocalError("Password must contain at least one letter and one number");
      return;
    }

    try {
      if (mode === "login") {
        await login(email, password);
      } else {
        await register(email, username, password);
      }
      onSuccess?.();
      onClose();
    } catch (err: any) {
      setLocalError(err.message || "An error occurred");
    } finally {
      // Any final cleanup if needed
    }
  };

  const toggleMode = () => {
    setMode(mode === "login" ? "register" : "login");
    setLocalError("");
    playSciFiClick();
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 backdrop-blur-sm transition-all duration-300"
      style={{
        background: "hsl(220 30% 2% / 0.85)",
        paddingTop: "max(16px, env(safe-area-inset-top, 16px))",
        paddingBottom: "max(16px, env(safe-area-inset-bottom, 16px))",
      }}
      onClick={() => { playSciFiClick(); onClose(); }}
    >
      <div
        className="relative w-full max-w-md max-h-[90dvh] flex flex-col bg-[#0c1016] border border-white/15 shadow-[0_0_50px_rgba(0,243,255,0.12)] overflow-hidden rounded-xl"
        onClick={(e) => e.stopPropagation()}
        data-no-swipe="true"
      >
        {/* Corner Accents */}
        <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-cyan-500/40 pointer-events-none" />
        <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-cyan-500/40 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-cyan-500/40 pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-cyan-500/40 pointer-events-none" />

        <button
          onClick={() => { playSciFiClick(); onClose(); }}
          className="absolute top-4 right-4 z-20 w-11 h-11 flex items-center justify-center rounded-lg border border-white/15 hover:border-cyan-400/50 hover:bg-cyan-500/10 active:scale-95 transition-all text-white/70 hover:text-cyan-300 font-mono text-lg cursor-pointer"
          style={{ touchAction: "manipulation" }}
          aria-label="Close"
        >
          ✕
        </button>

        <div className="flex-1 overflow-y-auto p-6 sm:p-8">
          {/* Header */}
          <div className="mb-6 relative pr-12">
            <div className="flex items-center gap-3 mb-1.5">
               <div className="w-1.5 h-6 bg-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.5)] rounded-full" />
               <h2 className="font-orbitron font-black text-lg sm:text-xl tracking-[0.2em] uppercase text-white">
                 {showForgotPassword ? "Reset Password" : mode === "login" ? "Sign In" : "Create Account"}
               </h2>
            </div>
            <p className="font-mono text-xs text-white/60">
               {showForgotPassword
                 ? "Recover access to your account"
                 : mode === "login"
                   ? "Sign in with your Every Nation account"
                   : "Create an account to save progress across devices"}
            </p>
          </div>

          {showForgotPassword ? (
            <ForgotPasswordModal onClose={() => setShowForgotPassword(false)} />
          ) : (
            <>
              {localError && (
                <div className="mb-5 p-3.5 rounded-lg bg-red-500/10 border border-red-500/30 flex items-start gap-2.5">
                   <span className="text-red-400 font-bold">!</span>
                   <p className="font-mono text-xs text-red-300 leading-relaxed">{localError}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-xs font-orbitron font-bold uppercase tracking-wider text-cyan-300/90 mb-2">
                    {mode === "login" ? "Email or Username" : "Email Address"}
                  </label>
                  <div className="relative group">
                    <FaEnvelope className="absolute left-3.5 top-1/2 -translate-y-1/2 text-cyan-400/50 group-focus-within:text-cyan-300 transition-colors" />
                    <input
                      type={mode === "login" ? "text" : "email"}
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-black/50 border border-white/15 rounded-lg py-3 pl-10 pr-4 text-base sm:text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-cyan-400/60 transition-all font-mono"
                      placeholder={mode === "login" ? "Enter email or username" : "you@example.com"}
                    />
                  </div>
                </div>

                {mode === "register" && (
                  <div>
                    <label className="block text-xs font-orbitron font-bold uppercase tracking-wider text-cyan-300/90 mb-2">
                      Username
                    </label>
                    <div className="relative group">
                      <FaUser className="absolute left-3.5 top-1/2 -translate-y-1/2 text-cyan-400/50 group-focus-within:text-cyan-300 transition-colors" />
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                        className="w-full bg-black/50 border border-white/15 rounded-lg pl-10 pr-4 py-3 font-mono text-base sm:text-sm text-white placeholder:text-white/30 focus:border-cyan-400/60 outline-none transition-all"
                        placeholder="Choose a username"
                        minLength={3}
                      />
                    </div>
                  </div>
                )}

                <div>
                  <div className="flex justify-between items-end mb-2">
                    <label className="block text-xs font-orbitron font-bold uppercase tracking-wider text-cyan-300/90">
                      Password
                    </label>
                    {mode === "login" && (
                      <button
                        type="button"
                        tabIndex={-1}
                        onClick={() => setShowForgotPassword(true)}
                        className="font-mono text-xs text-amber-400/80 hover:text-amber-300 transition-colors cursor-pointer"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <div className="relative group">
                    <FaLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-cyan-400/50 group-focus-within:text-cyan-300 transition-colors" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="w-full bg-black/50 border border-white/15 rounded-lg pl-10 pr-4 py-3 font-mono text-base sm:text-sm text-white placeholder:text-white/30 focus:border-cyan-400/60 outline-none transition-all"
                      placeholder="••••••••"
                      minLength={8}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  style={{ touchAction: "manipulation" }}
                  className="w-full py-3.5 rounded-lg bg-cyan-500/15 border border-cyan-400/50 text-cyan-300 font-orbitron font-bold text-xs tracking-[0.2em] uppercase hover:bg-cyan-500/25 transition-all disabled:opacity-40 cursor-pointer"
                >
                  {isLoading
                    ? mode === "login"
                      ? "Signing In..."
                      : "Creating Account..."
                    : mode === "login"
                      ? "Sign In"
                      : "Create Account"}
                </button>
              </form>

              <div className="mt-6 text-center">
                <button
                  onClick={toggleMode}
                  style={{ touchAction: "manipulation" }}
                  className="font-mono text-xs text-white/60 hover:text-cyan-300 transition-all cursor-pointer"
                >
                  {mode === "login"
                    ? "Don't have an account? Create one"
                    : "Already have an account? Sign in"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes scan {
          0% { top: 0%; opacity: 0; }
          5% { opacity: 1; }
          95% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
      `}} />
    </div>
  );
}

import { useState } from "react";
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
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-sm transition-all duration-300"
      style={{ background: "hsl(220 30% 2% / 0.85)" }}
      onClick={() => { playSciFiClick(); onClose(); }}
    >
      <div
        className="relative w-full max-w-md bg-[#0c1016] border border-white/10 shadow-[0_0_50px_rgba(0,243,255,0.1)] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HUD Elements */}
        <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-cyan-500/40" />
        <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-cyan-500/40" />
        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-cyan-500/40" />
        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-cyan-500/40" />
        
        {/* Animated Scanline */}
        <div className="absolute inset-x-0 top-0 h-[2px] bg-cyan-500/20 shadow-[0_0_15px_rgba(0,243,255,0.5)] animate-[scan_4s_linear_infinite]" />

        <button
          onClick={() => { playSciFiClick(); onClose(); }}
          className="absolute top-4 right-4 z-20 w-8 h-8 flex items-center justify-center border border-white/10 hover:border-cyan-500/50 hover:bg-cyan-500/10 transition-all text-white/40 hover:text-cyan-400 font-mono text-lg"
          aria-label="Close"
        >
          ✕
        </button>

        <div className="p-8 md:p-10">
          {/* Header */}
          <div className="mb-8 relative">
            <div className="flex items-center gap-4 mb-2">
               <div className="w-1.5 h-6 bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.5)]" />
               <h2 className="font-orbitron font-black text-xl tracking-[0.3em] uppercase">
                 {showForgotPassword ? "RECOVERY" : mode === "login" ? "ACCESS" : "ENLIST"}
               </h2>
            </div>
            <p className="font-mono text-[9px] tracking-[0.2em] uppercase opacity-40">
               {showForgotPassword ? "System Authorization Override" : mode === "login" ? "Identity Verification Required" : "New Operator Protocol Initialized"}
            </p>
          </div>

          {showForgotPassword ? (
            <ForgotPasswordModal onClose={() => setShowForgotPassword(false)} />
          ) : (
            <>
              {localError && (
                <div className="mb-6 p-4 bg-red-500/5 border border-red-500/20 flex items-start gap-3">
                   <span className="text-red-500 font-bold">!</span>
                   <p className="font-mono text-[10px] text-red-400 uppercase tracking-widest leading-relaxed">{localError}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-[10px] font-orbitron uppercase tracking-widest text-cyan-500/60 mb-2">
                      Email or Username
                    </label>
                    <div className="relative group">
                      <FaEnvelope className="absolute left-3 top-1/2 -translate-y-1/2 text-cyan-500/30 group-focus-within:text-cyan-400 transition-colors" />
                      <input
                        type="text"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-black/40 border border-cyan-500/20 rounded py-2.5 pl-10 pr-4 text-sm text-cyan-100 placeholder:text-cyan-900 focus:outline-none focus:border-cyan-500/50 transition-all font-mono"
                        placeholder="IDENTIFIER"
                      />
                    </div>
                </div>

                {mode === "register" && (
                  <div>
                    <label className="block font-mono text-[9px] tracking-[0.2em] uppercase opacity-40 mb-2">Callsign (Username)</label>
                    <div className="relative group">
                      <div className="absolute left-3.5 md:left-4 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
                        <FaUser className="text-cyan-400 opacity-30 group-focus-within:opacity-70 transition-opacity text-[13px] md:text-[14px]" />
                      </div>
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                        className="w-full bg-white/5 border border-white/10 pl-10 md:pl-12 pr-4 py-3 font-mono text-xs focus:border-cyan-500/50 focus:bg-cyan-500/5 outline-none transition-all placeholder:opacity-20 autofill:bg-transparent"
                        placeholder="CHOOSE_CALLSIGN"
                        minLength={3}
                      />
                    </div>
                  </div>
                )}

                <div>
                  <div className="flex justify-between items-end mb-2">
                    <label className="block font-mono text-[9px] tracking-[0.2em] uppercase opacity-40">Secure Key (Password)</label>
                    {mode === "login" && (
                      <button
                        type="button"
                        onClick={() => setShowForgotPassword(true)}
                        className="font-mono text-[8px] uppercase text-amber-500/60 hover:text-amber-500 transition-colors"
                      >
                        Lost Key?
                      </button>
                    )}
                  </div>
                  <div className="relative group">
                    <div className="absolute left-3.5 md:left-4 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
                      <FaLock className="text-cyan-400 opacity-30 group-focus-within:opacity-70 transition-opacity text-[13px] md:text-[14px]" />
                    </div>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="w-full bg-white/5 border border-white/10 pl-10 md:pl-12 pr-4 py-3 font-mono text-xs focus:border-cyan-500/50 focus:bg-cyan-500/5 outline-none transition-all placeholder:opacity-20 autofill:bg-transparent"
                      placeholder="ENCRYPTED"
                      minLength={8}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-4 bg-cyan-500/10 border border-cyan-500/40 text-cyan-400 font-orbitron text-xs tracking-[0.4em] uppercase hover:bg-cyan-500/20 transition-all disabled:opacity-30 relative overflow-hidden group"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                  {isLoading ? "AUTHORIZING..." : mode === "login" ? "AUTHORIZE" : "INITIALIZE"}
                </button>
              </form>

              <div className="mt-8 text-center">
                <button
                  onClick={toggleMode}
                  className="font-mono text-[10px] tracking-[0.1em] uppercase opacity-40 hover:opacity-100 hover:text-cyan-400 transition-all"
                >
                  {mode === "login" ? "Need Authorization? Enlist Here" : "Existing Operator? Authorize"}
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

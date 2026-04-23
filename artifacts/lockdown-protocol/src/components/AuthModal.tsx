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
                  <label className="block font-mono text-[9px] tracking-[0.2em] uppercase opacity-40 mb-2">Network Address (Email)</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full bg-white/5 border border-white/10 px-4 py-3 font-mono text-xs focus:border-cyan-500/50 focus:bg-cyan-500/5 outline-none transition-all placeholder:opacity-20"
                    placeholder="ENTER_ADDRESS"
                  />
                </div>

                {mode === "register" && (
                  <div>
                    <label className="block font-mono text-[9px] tracking-[0.2em] uppercase opacity-40 mb-2">Callsign (Username)</label>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                      className="w-full bg-white/5 border border-white/10 px-4 py-3 font-mono text-xs focus:border-cyan-500/50 focus:bg-cyan-500/5 outline-none transition-all placeholder:opacity-20"
                      placeholder="CHOOSE_CALLSIGN"
                      minLength={3}
                    />
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
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full bg-white/5 border border-white/10 px-4 py-3 font-mono text-xs focus:border-cyan-500/50 focus:bg-cyan-500/5 outline-none transition-all placeholder:opacity-20"
                    placeholder="ENCRYPTED"
                    minLength={6}
                  />
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

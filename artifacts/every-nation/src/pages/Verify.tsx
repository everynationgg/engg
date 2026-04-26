import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { motion, AnimatePresence } from "framer-motion";
import { FaShieldAlt, FaKey, FaArrowRight, FaFingerprint, FaSatelliteDish, FaExclamationTriangle } from "react-icons/fa";
import { useParallax } from "@/hooks/useParallax";
import TacticalSlate from "@/components/common/TacticalSlate";

export default function Verify() {
  const { x, y } = useParallax(15);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resending, setResending] = useState(false);
  const { verify, resendVerification, user } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (user?.isVerified) {
      setLocation("/profile");
    }

    // Auto-verify if token is in URL
    const searchParams = new URLSearchParams(window.location.search);
    const token = searchParams.get("token");
    if (token && !loading && !user?.isVerified) {
      setCode(token);
      (async () => {
        setLoading(true);
        setError(null);
        try {
          await verify(token);
          setLocation("/profile");
        } catch (err: any) {
          setError(err.message || "Auto-verification failed. Manual entry required.");
        } finally {
          setLoading(false);
        }
      })();
    }
  }, [user, setLocation, verify]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await verify(code);
      setLocation("/profile");
    } catch (err: any) {
      setError(err.message || "Authentication Failed: Hash Mismatch");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      await resendVerification();
      // Handle success locally or via toast
    } catch (err) {
      setError("Failed to rebroadcast verification frequency.");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden bg-[#020408] selection:bg-cyan-500/30">
      {/* Biometric Parallax Background */}
      <motion.div 
        className="fixed inset-0 z-0 opacity-20 pointer-events-none"
        style={{ x, y }}
      >
        <div className="absolute inset-0 bg-[url('/background.png')] bg-cover bg-center" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#020408]/60 to-[#020408]" />
      </motion.div>

      {/* Global Scanline Overlay */}
      <div className="fixed inset-0 pointer-events-none z-10 opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%]" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg relative z-20"
      >
        <TacticalSlate color="#eab308">
          <div className="p-12 md:p-16 flex flex-col gap-10">
            {/* Header: Authentication Handshake */}
            <div className="text-center flex flex-col items-center gap-6">
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center relative">
                   <div className="absolute inset-0 border-2 border-yellow-500/40 rounded-full animate-[spin_10s_linear_infinite] border-t-transparent" />
                   <FaFingerprint className="text-3xl text-yellow-500/60" />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <h1 className="font-orbitron text-2xl md:text-3xl font-black tracking-[0.3em] uppercase text-white">
                  Identity <span className="text-yellow-500">Hash</span>
                </h1>
                <p className="font-mono text-[9px] uppercase tracking-[0.5em] text-white/30">
                  Verification_Frequency_Sync
                </p>
              </div>
            </div>

            {/* Error Notification */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-red-500/10 border border-red-500/30 p-4 flex items-center gap-4"
                >
                  <FaExclamationTriangle className="text-red-500 shrink-0" />
                  <span className="font-mono text-[10px] uppercase text-red-400 tracking-widest">{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Form Interface */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-8">
              <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-3">
                  <label className="font-mono text-[8px] uppercase tracking-[0.4em] text-white/30 ml-2">Broadcast_Cipher_Code</label>
                  <div className="relative group">
                    <FaKey className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-yellow-500 transition-colors" />
                    <input
                      type="text"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      className="w-full bg-white/[0.02] border border-white/10 py-5 pr-5 pl-16 tactical-input font-mono text-xl tracking-[1em] text-white outline-none focus:border-yellow-500/50 focus:bg-yellow-500/5 transition-all uppercase"
                      placeholder="XXXXXX"
                      maxLength={6}
                      required
                    />
                  </div>
                  <p className="font-mono text-[8px] uppercase tracking-[0.2em] text-white/20 mt-2 text-center">
                    Check your communication uplink for the synchronization key.
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-6 mt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-6 bg-yellow-500/10 border border-yellow-500/40 hover:bg-yellow-500/20 text-yellow-500 font-orbitron text-[11px] uppercase tracking-[0.6em] font-black transition-all flex items-center justify-center gap-4 relative overflow-hidden group/btn disabled:opacity-50"
                >
                  <div className="absolute inset-0 bg-yellow-500/10 -translate-x-full group-hover/btn:translate-x-0 transition-transform duration-500" />
                  <span className="relative z-10">{loading ? "Validating_Hash..." : "Establish_Connection"}</span>
                  <FaArrowRight className="relative z-10 text-[10px] group-hover/btn:translate-x-1 transition-transform" />
                </button>

                <div className="flex items-center justify-center gap-6">
                   <div className="h-px flex-1 bg-white/5" />
                   <span className="font-mono text-[8px] uppercase tracking-[0.5em] text-white/20 whitespace-nowrap">Retry_Protocol</span>
                   <div className="h-px flex-1 bg-white/5" />
                </div>

                <button 
                  type="button"
                  onClick={handleResend}
                  disabled={resending}
                  className="w-full py-5 border border-white/10 hover:bg-white/5 transition-all flex items-center justify-center gap-4 disabled:opacity-50"
                >
                  <FaSatelliteDish className={`text-[10px] opacity-20 ${resending ? 'animate-pulse' : ''}`} />
                  <span className="font-orbitron text-[9px] uppercase tracking-[0.4em] text-white/40">Rebroadcast_Key</span>
                </button>
              </div>
            </form>
          </div>
        </TacticalSlate>
      </motion.div>

      {/* Footer Info */}
      <div className="fixed bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4 opacity-20 pointer-events-none">
         <span className="font-mono text-[8px] uppercase tracking-[0.8em]">SIGNAL_AUTHENTICITY_VERIFIED</span>
         <div className="w-48 h-px bg-gradient-to-r from-transparent via-yellow-500 to-transparent" />
      </div>
    </div>
  );
}

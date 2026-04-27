import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { motion, AnimatePresence } from "framer-motion";
import { FaKey, FaArrowRight, FaFingerprint, FaSatelliteDish, FaExclamationTriangle } from "react-icons/fa";
import { useParallax } from "@/hooks/useParallax";
import TacticalSlate from "@/components/common/TacticalSlate";
import { HUDOverlay } from "@/components/common/HUDOverlay";

export default function Verify() {
  const { x, y } = useParallax(10);
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
          setError(err.message || "Auto-verification failed.");
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
      setError(err.message || "Hash Mismatch");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      await resendVerification();
    } catch (err) {
      setError("Broadcast failed.");
    } finally {
      setResending(false);
    }
  };

  return (
    <HUDOverlay pageLabel="AUTH_VERIFY">
      <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden bg-[#020408] selection:bg-yellow-500/30">
        {/* Cinematic Background Layer */}
        <motion.div 
          className="fixed inset-0 z-0 opacity-10 pointer-events-none grayscale"
          style={{ x, y }}
        >
          <div className="absolute inset-0 bg-[url('/background.png')] bg-cover bg-center" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#020408]/60 to-[#020408]" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-[420px] relative z-20"
        >
          <TacticalSlate color="#eab308">
            <div className="p-8 md:p-10 flex flex-col gap-8">
              {/* Header: Authentication Handshake */}
              <div className="text-center flex flex-col items-center gap-4">
                <div className="relative">
                  <div className="w-16 h-16 border border-yellow-500/20 flex items-center justify-center relative">
                     <div className="absolute inset-0 border border-yellow-500/40 animate-[spin_10s_linear_infinite] border-t-transparent" />
                     <FaFingerprint className="text-xl text-yellow-500/40" />
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <h1 className="font-orbitron text-xl font-black tracking-[0.4em] uppercase text-white">
                    Identity <span className="text-yellow-500">Hash</span>
                  </h1>
                  <p className="font-mono text-[8px] uppercase tracking-[0.4em] text-white/20">
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
                    className="border border-red-500/30 bg-red-500/5 p-3 flex items-center gap-3"
                  >
                    <FaExclamationTriangle className="text-red-500 text-[10px]" />
                    <span className="font-mono text-[9px] uppercase text-red-400 tracking-wider">{error}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Form Interface */}
              <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-2 text-center">
                    <label className="font-mono text-[7px] uppercase tracking-[0.4em] text-white/20">Cipher_Code</label>
                    <div className="relative group">
                      <FaKey className="absolute left-4 top-1/2 -translate-y-1/2 text-white/10 group-focus-within:text-yellow-500 text-[10px] transition-colors z-20" />
                      <input
                        type="text"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        className="w-full bg-white/[0.02] border border-white/5 py-3 pr-4 pl-10 font-mono text-lg tracking-[0.8em] text-white outline-none focus:border-yellow-500/20 focus:bg-yellow-500/[0.01] transition-all uppercase text-center"
                        placeholder="XXXXXX"
                        maxLength={6}
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-4 mt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-11 bg-yellow-500/10 border border-yellow-500/30 hover:bg-yellow-500/20 text-yellow-500 transition-all duration-300 flex items-center justify-center gap-3 group disabled:opacity-50"
                  >
                    <span className="font-orbitron font-black tracking-[0.2em] text-[10px] uppercase">
                      {loading ? "Validating..." : "Establish_Connection"}
                    </span>
                    {!loading && <FaArrowRight className="text-[10px] group-hover:translate-x-1 transition-transform" />}
                  </button>

                  <div className="flex items-center gap-3">
                     <div className="h-[1px] flex-1 bg-white/5" />
                     <span className="font-mono text-[7px] uppercase tracking-[0.5em] text-white/10">Retry</span>
                     <div className="h-[1px] flex-1 bg-white/5" />
                  </div>

                  <button 
                    type="button"
                    onClick={handleResend}
                    disabled={resending}
                    className="w-full h-10 border border-white/5 hover:border-white/10 text-white/20 hover:text-white/40 transition-all font-mono text-[9px] uppercase tracking-widest flex items-center justify-center gap-3 disabled:opacity-50"
                  >
                    <FaSatelliteDish className={`text-[8px] opacity-40 ${resending ? 'animate-pulse' : ''}`} />
                    Rebroadcast_Key
                  </button>
                </div>
              </form>
            </div>
          </TacticalSlate>
        </motion.div>
      </div>
    </HUDOverlay>
  );
}

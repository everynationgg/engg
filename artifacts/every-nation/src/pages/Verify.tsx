import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  FaKey,
  FaArrowRight,
  FaCheckCircle,
  FaExclamationTriangle,
  FaSatelliteDish,
} from "react-icons/fa";
import {
  CinematicPageShell,
  AccessGate,
} from "@/components/common/PremiumVisuals";

export default function Verify() {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resending, setResending] = useState(false);
  const { verify, resendVerification, user } = useAuth();
  const [, setLocation] = useLocation();
  const reducedMotion = useReducedMotion();
  const shouldReduceMotion = Boolean(reducedMotion);

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
    <CinematicPageShell
      pageLabel="AUTH_VERIFICATION"
      accentColor="rgba(234, 179, 8, 0.12)"
    >
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: shouldReduceMotion ? 0 : 0.45,
          ease: "easeOut",
        }}
        className="w-full max-w-[1080px] relative z-20 px-4 flex justify-center"
      >
        <AccessGate
          title="Verify Identity"
          subtitle="Neural_Link_Verification"
          icon={
            <div className="relative flex items-center justify-center">
              <FaCheckCircle
                className={`text-2xl transition-colors duration-500 ${
                  code.length === 6
                    ? "text-yellow-400 drop-shadow-[0_0_8px_rgba(234,179,8,0.7)]"
                    : "text-white/20"
                }`}
              />
            </div>
          }
          accentColor="#eab308"
          reducedMotion={shouldReduceMotion}
        >
          <div className="p-6 sm:p-8 md:p-10 flex flex-col gap-6">
            {/* Error Notification */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="border border-red-500/20 bg-red-500/5 p-3 flex items-center gap-3"
                >
                  <FaExclamationTriangle className="text-red-500 text-[11px]" />
                  <span className="font-mono text-[11px] uppercase text-red-400 tracking-widest">
                    {error}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-2 text-center">
                  <label className="font-mono text-[11px] uppercase tracking-[0.4em] text-white/30">
                    Cipher_Code
                  </label>
                  <div className="flex items-center bg-white/[0.01] border border-white/5 focus-within:border-yellow-500/30 focus-within:bg-yellow-500/[0.01] transition-all group">
                    <div className="pl-4 pr-3 text-white/20 group-focus-within:text-yellow-500 transition-colors pointer-events-none shrink-0">
                      <FaKey size={12} />
                    </div>
                    <input
                      type="text"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      className="flex-1 py-4 pr-4 bg-transparent font-mono text-xl tracking-[0.6em] text-white outline-none uppercase text-center"
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
                  className="w-full h-13 bg-yellow-500/10 border border-yellow-500/30 hover:bg-yellow-500/20 text-yellow-500 transition-all duration-300 flex items-center justify-center gap-4 group cursor-pointer disabled:opacity-50"
                >
                  <span className="font-orbitron font-black tracking-[0.25em] text-[15px] uppercase">
                    {loading ? "Validating..." : "Establish_Connection"}
                  </span>
                  {!loading && (
                    <FaArrowRight className="text-[11px] group-hover:translate-x-1 transition-transform" />
                  )}
                </button>

                <div className="flex items-center gap-3">
                  <div className="h-[1px] flex-1 bg-white/5" />
                  <span className="font-mono text-[9px] uppercase tracking-[0.5em] text-white/10">
                    Retry
                  </span>
                  <div className="h-[1px] flex-1 bg-white/5" />
                </div>

                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resending}
                  className="w-full h-11 border border-white/5 hover:border-white/10 text-white/30 hover:text-white/60 transition-all font-mono text-[11px] uppercase tracking-widest flex items-center justify-center gap-3 disabled:opacity-50 cursor-pointer"
                >
                  <FaSatelliteDish
                    className={`text-[10px] opacity-40 ${resending ? "animate-pulse" : ""}`}
                  />
                  Rebroadcast_Key
                </button>
              </div>
            </form>
          </div>
        </AccessGate>
      </motion.div>
    </CinematicPageShell>
  );
}

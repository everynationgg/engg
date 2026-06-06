import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  FaLock,
  FaArrowRight,
  FaFingerprint,
  FaTerminal,
  FaIdCard,
} from "react-icons/fa";
import {
  CinematicPageShell,
  AccessGate,
} from "@/components/common/PremiumVisuals";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login, isLoggedIn } = useAuth();
  const [, setLocation] = useLocation();
  const reducedMotion = useReducedMotion();
  const shouldReduceMotion = Boolean(reducedMotion);

  if (isLoggedIn) {
    setLocation("/");
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await login(email, password);
      setLocation("/shop");
    } catch (err: any) {
      setError(err.message || "Authorization Failed: Credential Mismatch");
    } finally {
      setLoading(false);
    }
  };

  return (
    <CinematicPageShell
      pageLabel="AUTH_IDENTITY"
      accentColor="rgba(6, 182, 212, 0.14)"
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
          title="Identity Uplink"
          subtitle="Secure_Handshake_Active"
          icon={
            <div className="relative flex items-center justify-center">
              <FaFingerprint
                className={`text-2xl transition-colors duration-500 ${
                  password.length > 0
                    ? "text-cyan-400 drop-shadow-[0_0_8px_#00f3ff]"
                    : "text-white/20"
                }`}
              />
            </div>
          }
          accentColor="#00f3ff"
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
                  <div className="w-[1.5px] h-4 bg-red-500 shadow-[0_0_8px_#ef4444]" />
                  <span className="font-mono text-[11px] uppercase text-red-400 tracking-widest">
                    {error}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              <div className="flex flex-col gap-5">
                <div className="flex flex-col gap-2">
                  <label className="font-mono text-[11px] uppercase tracking-[0.4em] text-white/30 ml-1">
                    Operator ID (Email or Username)
                  </label>
                  <div className="flex items-center gap-4 bg-white/[0.01] border border-white/5 focus-within:border-cyan-500/30 focus-within:bg-cyan-500/[0.01] transition-all group">
                    <div className="pl-4 text-white/20 group-focus-within:text-cyan-400 transition-colors pointer-events-none shrink-0">
                      <FaIdCard size={12} />
                    </div>
                    <input
                      type="text"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="flex-1 py-4 pr-4 bg-transparent font-mono text-[14px] tracking-wider text-white outline-none"
                      placeholder="IDENTIFIER"
                      required
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center px-1">
                    <label className="font-mono text-[11px] uppercase tracking-[0.4em] text-white/30">
                      Access_Cipher
                    </label>
                    <Link
                      href="/forgot-password"
                      className="font-mono text-[11px] uppercase text-cyan-500/40 hover:text-cyan-400 transition-colors tracking-widest"
                    >
                      Forgotten?
                    </Link>
                  </div>
                  <div className="flex items-center gap-4 bg-white/[0.01] border border-white/5 focus-within:border-cyan-500/30 focus-within:bg-cyan-500/[0.01] transition-all group">
                    <div className="pl-4 text-white/20 group-focus-within:text-cyan-400 transition-colors pointer-events-none shrink-0">
                      <FaLock size={12} />
                    </div>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="flex-1 py-4 pr-4 bg-transparent font-mono text-[14px] tracking-[0.34em] text-white outline-none"
                      placeholder="••••••••"
                      required
                      minLength={6}
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-4 mt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-14 bg-cyan-400/90 hover:bg-cyan-400 text-[#020408] transition-all duration-300 flex items-center justify-center gap-4 group cursor-pointer"
                >
                  <span className="font-orbitron font-black tracking-[0.25em] text-[15px] uppercase">
                    {loading ? "Syncing..." : "Initiate_Handshake"}
                  </span>
                  {!loading && (
                    <FaArrowRight className="text-[12px] group-hover:translate-x-1 transition-transform" />
                  )}
                </button>

                <div className="flex items-center gap-3">
                  <div className="h-[1px] flex-1 bg-white/5" />
                  <span className="font-mono text-[9px] uppercase tracking-[0.5em] text-white/10">
                    Protocols
                  </span>
                  <div className="h-[1px] flex-1 bg-white/5" />
                </div>

                <Link
                  href="/register"
                  className="w-full h-11 border border-white/5 hover:border-cyan-500/20 text-white/30 hover:text-cyan-400 hover:bg-cyan-500/[0.01] transition-all font-mono text-[11px] uppercase tracking-widest flex items-center justify-center gap-3"
                >
                  <FaTerminal className="text-[8px] opacity-40" />
                  Register_Identity
                </Link>
              </div>
            </form>
          </div>
        </AccessGate>
      </motion.div>
    </CinematicPageShell>
  );
}

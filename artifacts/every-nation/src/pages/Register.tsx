import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  FaUser,
  FaEnvelope,
  FaLock,
  FaArrowRight,
  FaShieldAlt,
} from "react-icons/fa";
import {
  CinematicPageShell,
  AccessGate,
} from "@/components/common/PremiumVisuals";

export default function Register() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { register, isLoggedIn } = useAuth();
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
    if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
      setError("Security protocol requires at least one letter and one number");
      setLoading(false);
      return;
    }

    try {
      await register(email, username, password);
      setLocation("/verify");
    } catch (err: any) {
      setError(err.message || "Enrollment Failed: Protocol Disrupted");
    } finally {
      setLoading(false);
    }
  };

  return (
    <CinematicPageShell
      pageLabel="AUTH_REGISTRATION"
      accentColor="rgba(168, 85, 247, 0.14)"
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
          title="Create Identity"
          subtitle="Neural_Network_Registration"
          icon={
            <div className="relative flex items-center justify-center">
              <FaUser
                className={`text-2xl transition-colors duration-500 ${
                  username.length > 0
                    ? "text-purple-400 drop-shadow-[0_0_8px_rgba(168,85,247,0.7)]"
                    : "text-white/20"
                }`}
              />
            </div>
          }
          accentColor="#a855f7"
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
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <label className="font-mono text-[11px] uppercase tracking-[0.4em] text-white/30 ml-1">
                    Codename
                  </label>
                  <div className="flex items-center gap-4 bg-white/[0.01] border border-white/5 focus-within:border-purple-500/30 focus-within:bg-purple-500/[0.01] transition-all group">
                    <div className="pl-4 text-white/20 group-focus-within:text-purple-400 transition-colors pointer-events-none shrink-0">
                      <FaUser size={12} />
                    </div>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="flex-1 py-4 pr-4 bg-transparent font-mono text-[14px] tracking-wider text-white outline-none"
                      placeholder="CALLSIGN"
                      required
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="font-mono text-[11px] uppercase tracking-[0.4em] text-white/30 ml-1">
                    Uplink
                  </label>
                  <div className="flex items-center gap-4 bg-white/[0.01] border border-white/5 focus-within:border-purple-500/30 focus-within:bg-purple-500/[0.01] transition-all group">
                    <div className="pl-4 text-white/20 group-focus-within:text-purple-400 transition-colors pointer-events-none shrink-0">
                      <FaEnvelope size={12} />
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="flex-1 py-4 pr-4 bg-transparent font-mono text-[14px] tracking-wider text-white outline-none"
                      placeholder="EMAIL_ADDR"
                      required
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="font-mono text-[11px] uppercase tracking-[0.4em] text-white/30 ml-1">
                    Cipher
                  </label>
                  <div className="flex items-center gap-4 bg-white/[0.01] border border-white/5 focus-within:border-purple-500/30 focus-within:bg-purple-500/[0.01] transition-all group">
                    <div className="pl-4 text-white/20 group-focus-within:text-purple-400 transition-colors pointer-events-none shrink-0">
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
                  className="w-full h-13 bg-purple-500/10 border border-purple-500/30 hover:bg-purple-500/20 text-purple-400 transition-all duration-300 flex items-center justify-center gap-4 group cursor-pointer"
                >
                  <span className="font-orbitron font-black tracking-[0.25em] text-[15px] uppercase">
                    {loading ? "Syncing..." : "Confirm_Enrollment"}
                  </span>
                  {!loading && (
                    <FaArrowRight className="text-[11px] group-hover:translate-x-1 transition-transform" />
                  )}
                </button>

                <div className="flex items-center gap-3">
                  <div className="h-[1px] flex-1 bg-white/5" />
                  <span className="font-mono text-[9px] uppercase tracking-[0.5em] text-white/10">
                    Existing_ID
                  </span>
                  <div className="h-[1px] flex-1 bg-white/5" />
                </div>

                <Link
                  href="/login"
                  className="w-full h-11 border border-white/5 hover:border-white/10 text-white/30 hover:text-white/60 hover:bg-white/[0.01] transition-all font-mono text-[11px] uppercase tracking-widest flex items-center justify-center gap-3"
                >
                  <FaShieldAlt className="text-[10px] opacity-40" />
                  Access_Portal
                </Link>
              </div>
            </form>
          </div>
        </AccessGate>
      </motion.div>
    </CinematicPageShell>
  );
}

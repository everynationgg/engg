import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { motion, AnimatePresence } from "framer-motion";
import { FaUser, FaEnvelope, FaLock, FaArrowRight, FaIdCard, FaShieldAlt } from "react-icons/fa";
import { useParallax } from "@/hooks/useParallax";
import TacticalSlate from "@/components/common/TacticalSlate";
import { HUDOverlay } from "@/components/common/HUDOverlay";

export default function Register() {
  const { x, y } = useParallax(10);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { register, isLoggedIn } = useAuth();
  const [, setLocation] = useLocation();

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
    <HUDOverlay pageLabel="AUTH_REGISTRATION">
      <div className="min-h-screen flex flex-col items-center pb-12 px-4 md:px-8 relative overflow-x-hidden bg-[#020408] selection:bg-cyan-500/30">
        {/* Header Clearance Spacer */}
        <div className="h-[140px] lg:h-[180px] w-full shrink-0 pointer-events-none" />

        <motion.div 
          className="fixed inset-0 z-0 opacity-10 pointer-events-none grayscale"
          style={{ x, y }}
        >
          <div className="absolute inset-0 bg-[url('/background.png')] bg-cover bg-center" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#020408]/80 via-transparent to-[#020408]" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-[420px] relative z-20 mt-8"
        >
          <TacticalSlate color="#00f3ff">
            <div className="p-8 md:p-10 flex flex-col gap-8">
              {/* Header */}
              <div className="text-center flex flex-col items-center gap-6 px-4 md:px-8">
                <div className="w-16 h-16 border border-cyan-500/20 flex items-center justify-center relative">
                   <div className="absolute inset-0 border border-cyan-500/40 border-t-transparent animate-[spin_20s_linear_infinite]" />
                   <FaUser className="text-xl text-cyan-400/40" />
                </div>
                <div className="flex flex-col gap-2">
                  <h1 className="font-orbitron text-4xl lg:text-5xl font-black tracking-[0.4em] uppercase text-white leading-tight">
                    Create <span className="text-cyan-400">Identity</span>
                  </h1>
                  <p className="font-mono text-[8px] uppercase tracking-[0.4em] text-white/20">
                    Neural_Network_Registration
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
                    <div className="w-[1px] h-4 bg-red-500" />
                    <span className="font-mono text-[9px] uppercase text-red-400 tracking-wider">{error}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Form Interface */}
              <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="font-mono text-[7px] uppercase tracking-[0.4em] text-white/20 ml-1">Codename</label>
                    <div className="relative group">
                      <FaUser className="absolute left-4 top-1/2 -translate-y-1/2 text-white/10 group-focus-within:text-purple-400 text-[10px] transition-colors z-20" />
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full bg-white/[0.02] border border-white/5 py-2.5 pr-4 pl-10 font-mono text-[11px] tracking-wider text-white outline-none focus:border-purple-500/20 focus:bg-purple-500/[0.01] transition-all"
                        placeholder="CALLSIGN"
                        required
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="font-mono text-[7px] uppercase tracking-[0.4em] text-white/20 ml-1">Uplink</label>
                    <div className="relative group">
                      <FaEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 text-white/10 group-focus-within:text-purple-400 text-[10px] transition-colors z-20" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-white/[0.02] border border-white/5 py-2.5 pr-4 pl-10 font-mono text-[11px] tracking-wider text-white outline-none focus:border-purple-500/20 focus:bg-purple-500/[0.01] transition-all"
                        placeholder="EMAIL_ADDR"
                        required
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="font-mono text-[7px] uppercase tracking-[0.4em] text-white/20 ml-1">Cipher</label>
                    <div className="relative group">
                      <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/10 group-focus-within:text-purple-400 text-[10px] transition-colors z-20" />
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-white/[0.02] border border-white/5 py-2.5 pr-4 pl-10 font-mono text-[11px] tracking-[0.4em] text-white outline-none focus:border-purple-500/20 focus:bg-purple-500/[0.01] transition-all"
                        placeholder="••••••••"
                        required
                        minLength={8}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-4 mt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-11 bg-purple-500/10 border border-purple-500/30 hover:bg-purple-500/20 text-purple-400 transition-all duration-300 flex items-center justify-center gap-3 group disabled:opacity-50"
                  >
                    <span className="font-orbitron font-black tracking-[0.2em] text-[10px] uppercase">
                      {loading ? "Syncing..." : "Confirm_Enrollment"}
                    </span>
                    {!loading && <FaArrowRight className="text-[10px] group-hover:translate-x-1 transition-transform" />}
                  </button>

                  <div className="flex items-center gap-3">
                     <div className="h-[1px] flex-1 bg-white/5" />
                     <span className="font-mono text-[7px] uppercase tracking-[0.5em] text-white/10">Existing_ID</span>
                     <div className="h-[1px] flex-1 bg-white/5" />
                  </div>

                  <button 
                    type="button"
                    onClick={() => window.location.href = "/login"}
                    className="w-full h-10 border border-white/5 hover:border-white/10 text-white/20 hover:text-white/40 transition-all font-mono text-[9px] uppercase tracking-widest flex items-center justify-center gap-3"
                  >
                    <FaShieldAlt className="text-[8px] opacity-40" />
                    Access_Portal
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


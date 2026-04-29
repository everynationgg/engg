import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { motion, AnimatePresence } from "framer-motion";
import { FaLock, FaUser, FaArrowRight, FaFingerprint, FaTerminal, FaIdCard } from "react-icons/fa";
import { useParallax } from "@/hooks/useParallax";
import TacticalSlate from "@/components/common/TacticalSlate";
import { SciFiButton } from "@/components/common/SciFiButton";
import { HUDOverlay } from "@/components/common/HUDOverlay";

export default function Login() {
  const { x, y } = useParallax(10);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login, isLoggedIn } = useAuth();
  const [, setLocation] = useLocation();

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
    <HUDOverlay pageLabel="AUTH_IDENTITY">
      <div className="min-h-screen flex flex-col items-center pb-12 px-4 md:px-8 relative overflow-x-hidden bg-[#020408] selection:bg-cyan-500/30">
        {/* Header Clearance Spacer */}
        <div className="h-[104px] w-full shrink-0 pointer-events-none" />

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
          className="w-full max-w-[560px] relative z-20 mt-8"
        >
          <TacticalSlate color="#00f3ff">
            <div className="p-8 md:p-10 flex flex-col gap-8">
              {/* Header: Identity Sync */}
              <div className="text-center flex flex-col items-center gap-6 px-4 md:px-8">
                <div className="relative">
                  <div className="w-16 h-16 border border-cyan-500/20 flex items-center justify-center relative">
                     <div className={`absolute inset-0 border border-cyan-500/40 border-t-transparent transition-all duration-300 ${password.length > 0 ? "animate-[spin_1s_linear_infinite] shadow-[0_0_10px_#00f3ff]" : "animate-[spin_10s_linear_infinite]"}`} />
                     <FaFingerprint className={`text-xl transition-colors ${password.length > 0 ? "text-cyan-300" : "text-cyan-400/40"}`} />
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <h1 className="font-orbitron text-3xl sm:text-4xl lg:text-5xl font-black tracking-[0.4em] uppercase text-white leading-tight">
                    Identity <span className="text-cyan-400">Uplink</span>
                  </h1>
                  <p className="font-mono text-[11px] uppercase tracking-[0.4em] text-white/20">
                    Secure_Handshake_Active
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
                <div className="flex flex-col gap-5">
                  <div className="flex flex-col gap-2">
                    <label className="font-mono text-[10px] uppercase tracking-[0.4em] text-white/20 ml-1">Operator ID (Email or Username)</label>
                    <div className="flex items-center bg-white/[0.02] border border-white/5 focus-within:border-cyan-500/20 focus-within:bg-cyan-500/[0.01] transition-all group">
                      <div className="pl-4 pr-3 text-white/10 group-focus-within:text-cyan-400 transition-colors pointer-events-none shrink-0">
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
                       <label className="font-mono text-[10px] uppercase tracking-[0.4em] text-white/20">Access_Cipher</label>
                       <Link href="/forgot-password" title="Recover Access" className="font-mono text-[10px] uppercase text-cyan-500/20 hover:text-cyan-400 transition-colors tracking-widest">
                          Forgotten?
                       </Link>
                    </div>
                    <div className="flex items-center bg-white/[0.02] border border-white/5 focus-within:border-cyan-500/20 focus-within:bg-cyan-500/[0.01] transition-all group">
                      <div className="pl-4 pr-3 text-white/10 group-focus-within:text-cyan-400 transition-colors pointer-events-none shrink-0">
                        <FaLock size={12} />
                      </div>
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="flex-1 py-4 pr-4 bg-transparent font-mono text-[14px] tracking-[0.4em] text-white outline-none"
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
                    className="w-full h-14 bg-cyan-400/90 hover:bg-cyan-400 text-[#020408] transition-all duration-300 flex items-center justify-center gap-4 group"
                  >
                    <span className="font-orbitron font-black tracking-[0.2em] text-[14px] uppercase">
                      {loading ? "Syncing..." : "Initiate_Handshake"}
                    </span>
                    {!loading && <FaArrowRight className="text-[14px] group-hover:translate-x-1 transition-transform" />}
                  </button>

                  <div className="flex items-center gap-3">
                     <div className="h-[1px] flex-1 bg-white/5" />
                     <span className="font-mono text-[7px] uppercase tracking-[0.5em] text-white/10">Protocols</span>
                     <div className="h-[1px] flex-1 bg-white/5" />
                  </div>

                  <button 
                    type="button"
                    onClick={() => window.location.href = "/register"}
                    className="w-full h-10 border border-white/5 hover:border-white/10 text-white/20 hover:text-white/40 transition-all font-mono text-[9px] uppercase tracking-widest flex items-center justify-center gap-3"
                  >
                    <FaTerminal className="text-[8px] opacity-40" />
                    Register_Identity
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

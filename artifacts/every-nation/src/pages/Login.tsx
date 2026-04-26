import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { motion, AnimatePresence } from "framer-motion";
import { FaShieldAlt, FaLock, FaUser, FaArrowRight, FaFingerprint, FaTerminal } from "react-icons/fa";
import { useParallax } from "@/hooks/useParallax";
import TacticalSlate from "@/components/TacticalSlate";
import { SciFiButton } from "@/components/SciFiButton";

export default function Login() {
  const { x, y } = useParallax(15);
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
    } catch (err) {
      setError("Authorization Failed: Credential Mismatch");
    } finally {
      setLoading(false);
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
        <TacticalSlate color="#00f3ff">
          <div className="p-12 md:p-16 flex flex-col gap-10">
            {/* Header: Identity Sync */}
            <div className="text-center flex flex-col items-center gap-6">
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center relative">
                   <div className={`absolute inset-0 border-2 border-cyan-500/40 rounded-full border-t-transparent transition-all duration-300 ${password.length > 0 ? "animate-[spin_1s_linear_infinite] border-cyan-400 border-4 shadow-[0_0_15px_#00f3ff]" : "animate-[spin_10s_linear_infinite]"}`} />
                   <FaFingerprint className={`text-3xl transition-colors ${password.length > 0 ? "text-cyan-300" : "text-cyan-400/60"}`} />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <h1 className="font-orbitron text-2xl md:text-3xl font-black tracking-[0.3em] uppercase text-white">
                  Identity <span className="text-cyan-500">Uplink</span>
                </h1>
                <p className="font-mono text-[9px] uppercase tracking-[0.5em] text-white/30">
                  Secure_Handshake_Required
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
                  <div className="w-1 h-6 bg-red-500" />
                  <span className="font-mono text-[10px] uppercase text-red-400 tracking-widest">{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Form Interface */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-8">
              <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-3">
                  <label className="font-mono text-[8px] uppercase tracking-[0.4em] text-white/30 ml-2">Operator_ID (Email)</label>
                  <div className="relative group overflow-hidden">
                    <div className="absolute bottom-0 left-0 h-[2px] bg-cyan-400 w-full -translate-x-full group-focus-within:translate-x-0 transition-transform duration-500 z-10 shadow-[0_0_10px_#00f3ff]" />
                    <FaUser className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-cyan-400 transition-colors z-20" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="relative z-0 w-full bg-white/[0.02] border border-white/10 py-5 pr-5 pl-16 tactical-input font-mono text-sm tracking-wider text-white outline-none focus:border-cyan-500/50 focus:bg-cyan-500/5 transition-all"
                      placeholder="ACCESS_EMAIL"
                      required
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <div className="flex justify-between items-center px-2">
                     <label className="font-mono text-[8px] uppercase tracking-[0.4em] text-white/30">Access_Cipher</label>
                     <Link href="/forgot-password" title="Recover Access" className="font-mono text-[8px] uppercase text-cyan-500/40 hover:text-cyan-400 transition-colors tracking-[0.2em]">
                        Forgotten?
                     </Link>
                  </div>
                  <div className="relative group overflow-hidden">
                    <div className="absolute bottom-0 left-0 h-[2px] bg-cyan-400 w-full -translate-x-full group-focus-within:translate-x-0 transition-transform duration-500 z-10 shadow-[0_0_10px_#00f3ff]" />
                    <FaLock className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-cyan-400 transition-colors z-20" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="relative z-0 w-full bg-white/[0.02] border border-white/10 py-5 pr-5 pl-16 tactical-input font-mono text-sm tracking-[0.4em] text-white outline-none focus:border-cyan-500/50 focus:bg-cyan-500/5 transition-all"
                      placeholder="••••••••"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-6 mt-4">
                <SciFiButton
                  type="submit"
                  disabled={loading}
                  variant="ghost"
                  className="w-full border border-cyan-500/40"
                  size="lg"
                >
                  <span className="relative z-10">{loading ? "Establishing_Link..." : "Initiate_Handshake"}</span>
                  <FaArrowRight className="relative z-10 text-[10px] group-hover:translate-x-1 transition-transform" />
                </SciFiButton>

                <div className="flex items-center justify-center gap-6">
                   <div className="h-px flex-1 bg-white/5" />
                   <span className="font-mono text-[8px] uppercase tracking-[0.5em] text-white/20 whitespace-nowrap">External_Protocols</span>
                   <div className="h-px flex-1 bg-white/5" />
                </div>

                <SciFiButton onClick={() => window.location.href = "/register"} variant="outline" className="w-full text-white/40 hover:text-white/80">
                  <FaTerminal className="text-[10px] opacity-20 mr-2" />
                  Register_New_Identity
                </SciFiButton>
              </div>
            </form>
          </div>
        </TacticalSlate>
      </motion.div>

      {/* Footer Info */}
      <div className="fixed bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4 opacity-20 pointer-events-none">
         <span className="font-mono text-[8px] uppercase tracking-[0.8em]">SECURE_TUNNEL_ACTIVE</span>
         <div className="w-48 h-px bg-gradient-to-r from-transparent via-cyan-500 to-transparent" />
      </div>
    </div>
  );
}

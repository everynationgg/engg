import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { motion, AnimatePresence } from "framer-motion";
import { FaUser, FaEnvelope, FaLock, FaArrowRight, FaIdCard, FaShieldAlt } from "react-icons/fa";
import { useParallax } from "@/hooks/useParallax";
import TacticalSlate from "@/components/TacticalSlate";

export default function Register() {
  const { x, y } = useParallax(15);
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
        <TacticalSlate color="#a855f7">
          <div className="p-12 md:p-16 flex flex-col gap-10">
            {/* Header: Newform Enrollment */}
            <div className="text-center flex flex-col items-center gap-6">
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center relative">
                   <div className="absolute inset-0 border-2 border-purple-500/40 rounded-full animate-[spin_10s_linear_infinite] border-t-transparent" />
                   <FaIdCard className="text-3xl text-purple-400/60" />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <h1 className="font-orbitron text-2xl md:text-3xl font-black tracking-[0.3em] uppercase text-white">
                  Neural <span className="text-purple-500">Enrollment</span>
                </h1>
                <p className="font-mono text-[9px] uppercase tracking-[0.5em] text-white/30">
                  Initialising_Biometric_Manifest
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
                  <label className="font-mono text-[8px] uppercase tracking-[0.4em] text-white/30 ml-2">Operative_Codename</label>
                  <div className="relative group">
                    <FaUser className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-purple-400 transition-colors" />
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full bg-white/[0.02] border border-white/10 py-5 pr-5 pl-16 font-mono text-sm tracking-wider text-white outline-none focus:border-purple-500/50 focus:bg-purple-500/5 transition-all"
                      placeholder="CALLSIGN"
                      required
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <label className="font-mono text-[8px] uppercase tracking-[0.4em] text-white/30 ml-2">Communication_Uplink</label>
                  <div className="relative group">
                    <FaEnvelope className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-purple-400 transition-colors" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-white/[0.02] border border-white/10 py-5 pr-5 pl-16 font-mono text-sm tracking-wider text-white outline-none focus:border-purple-500/50 focus:bg-purple-500/5 transition-all"
                      placeholder="EMAIL_ADDR"
                      required
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <label className="font-mono text-[8px] uppercase tracking-[0.4em] text-white/30 ml-2">Access_Cipher</label>
                  <div className="relative group">
                    <FaLock className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-purple-400 transition-colors" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-white/[0.02] border border-white/10 py-5 pr-5 pl-16 font-mono text-sm tracking-[0.4em] text-white outline-none focus:border-purple-500/50 focus:bg-purple-500/5 transition-all"
                      placeholder="••••••••"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-6 mt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-6 bg-purple-500/10 border border-purple-500/40 hover:bg-purple-500/20 text-purple-400 font-orbitron text-[11px] uppercase tracking-[0.6em] font-black transition-all flex items-center justify-center gap-4 relative overflow-hidden group/btn disabled:opacity-50"
                >
                  <div className="absolute inset-0 bg-purple-500/10 -translate-x-full group-hover/btn:translate-x-0 transition-transform duration-500" />
                  <span className="relative z-10">{loading ? "Committing_Data..." : "Confirm_Enrollment"}</span>
                  <FaArrowRight className="relative z-10 text-[10px] group-hover/btn:translate-x-1 transition-transform" />
                </button>

                <div className="flex items-center justify-center gap-6">
                   <div className="h-px flex-1 bg-white/5" />
                   <span className="font-mono text-[8px] uppercase tracking-[0.5em] text-white/20 whitespace-nowrap">Existing_Identity</span>
                   <div className="h-px flex-1 bg-white/5" />
                </div>

                <Link href="/login" className="w-full py-5 border border-white/10 hover:bg-white/5 transition-all flex items-center justify-center gap-4">
                  <FaShieldAlt className="text-[10px] opacity-20" />
                  <span className="font-orbitron text-[9px] uppercase tracking-[0.4em] text-white/40">Access_Portal</span>
                </Link>
              </div>
            </form>
          </div>
        </TacticalSlate>
      </motion.div>

      {/* Footer Info */}
      <div className="fixed bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4 opacity-20 pointer-events-none">
         <span className="font-mono text-[8px] uppercase tracking-[0.8em]">ENCRYPTION_LAYER_ACTIVE</span>
         <div className="w-48 h-px bg-gradient-to-r from-transparent via-purple-500 to-transparent" />
      </div>
    </div>
  );
}

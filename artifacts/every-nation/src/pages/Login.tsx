import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { motion, AnimatePresence } from "framer-motion";
import { FaShieldAlt, FaLock, FaUser, FaArrowRight, FaFingerprint, FaTerminal } from "react-icons/fa";
import AntiGravity3D from "@/components/AntiGravity3D";

export default function Login() {
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
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden bg-[#050510] selection:bg-cyan-500/30">
      <AntiGravity3D />
      
      {/* Soft gradient overlay */}
      <div className="fixed inset-0 z-1 pointer-events-none bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-cyan-900/10 via-[#050510]/60 to-[#050510]" />

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="w-full max-w-lg relative z-20"
      >
        <div className="rounded-[2.5rem] p-12 md:p-16 flex flex-col gap-10 bg-white/5 border border-white/10 backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.5),_0_0_40px_rgba(0,243,255,0.05)]">
            {/* Header: Identity Sync */}
            <div className="text-center flex flex-col items-center gap-6">
              <div className="relative">
                <div className="w-20 h-20 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center relative shadow-[0_0_30px_rgba(0,243,255,0.1)] rotate-3">
                   <FaFingerprint className="text-3xl text-cyan-400/80 -rotate-3" />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <h1 className="font-inter font-bold text-3xl md:text-4xl tracking-tight text-white drop-shadow-md">
                  Identity <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">Uplink</span>
                </h1>
                <p className="font-orbitron text-[10px] uppercase tracking-[0.3em] text-white/40">
                  Secure Handshake Required
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
                  className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center gap-4 overflow-hidden"
                >
                  <div className="w-1 h-6 bg-red-500 rounded-full" />
                  <span className="font-inter text-sm text-red-400">{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Form Interface */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-8">
              <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-3">
                  <label className="font-inter text-xs uppercase tracking-widest text-white/40 ml-2 font-medium">Operator ID (Email)</label>
                  <div className="relative group">
                    <FaUser className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-cyan-400 transition-colors" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-black/20 border border-white/10 rounded-xl py-4 pr-5 pl-14 font-inter text-sm text-white placeholder:text-white/20 outline-none focus:border-cyan-500/50 focus:bg-cyan-500/5 transition-all focus:shadow-[0_0_20px_rgba(0,243,255,0.1)]"
                      placeholder="Enter your access email"
                      required
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <div className="flex justify-between items-center px-2">
                     <label className="font-inter text-xs uppercase tracking-widest text-white/40 font-medium">Access Cipher</label>
                     <Link href="/forgot-password" title="Recover Access" className="font-inter text-xs text-cyan-400/60 hover:text-cyan-400 transition-colors">
                        Forgotten?
                     </Link>
                  </div>
                  <div className="relative group">
                    <FaLock className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-cyan-400 transition-colors" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-black/20 border border-white/10 rounded-xl py-4 pr-5 pl-14 font-mono text-sm tracking-[0.2em] text-white placeholder:text-white/20 placeholder:tracking-normal outline-none focus:border-cyan-500/50 focus:bg-cyan-500/5 transition-all focus:shadow-[0_0_20px_rgba(0,243,255,0.1)]"
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
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white font-inter font-semibold tracking-wide transition-all flex items-center justify-center gap-3 relative overflow-hidden group/btn disabled:opacity-50 shadow-[0_10px_20px_rgba(0,243,255,0.2)] hover:shadow-[0_15px_30px_rgba(138,43,226,0.3)]"
                >
                  <span className="relative z-10">{loading ? "Establishing Link..." : "Initiate Handshake"}</span>
                  <FaArrowRight className="relative z-10 text-xs group-hover/btn:translate-x-1 transition-transform" />
                </button>

                <div className="flex items-center justify-center gap-6 opacity-60">
                   <div className="h-px flex-1 bg-white/10" />
                   <span className="font-inter text-xs uppercase tracking-widest text-white/40 whitespace-nowrap">External Protocols</span>
                   <div className="h-px flex-1 bg-white/10" />
                </div>

                <Link href="/register" className="w-full py-4 rounded-xl border border-white/10 hover:bg-white/5 transition-all flex items-center justify-center gap-3 text-white/60 hover:text-white group">
                  <FaTerminal className="text-xs opacity-50 group-hover:text-cyan-400 transition-colors" />
                  <span className="font-inter font-medium text-sm">Register New Identity</span>
                </Link>
              </div>
            </form>
        </div>
      </motion.div>

      {/* Footer Info */}
      <div className="fixed bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 opacity-30 pointer-events-none">
         <span className="font-orbitron text-[9px] uppercase tracking-[0.5em]">Secure Tunnel Active</span>
      </div>
    </div>
  );
}

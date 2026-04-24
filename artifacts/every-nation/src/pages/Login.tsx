import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { motion } from "framer-motion";
import { FaShieldAlt, FaLock, FaUser, FaArrowRight } from "react-icons/fa";

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
    <div className="min-h-[calc(100vh-80px)] flex items-center justify-center p-6 relative overflow-hidden bg-[#020408]">
      {/* Background FX */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(6,182,212,0.1)_0%,transparent_50%)]" />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="bg-[#0a0f16]/80 border border-white/10 backdrop-blur-2xl p-10 shadow-2xl relative overflow-hidden">
          {/* Decorative Corners */}
          <div className="absolute top-0 left-0 w-12 h-12 border-t-2 border-l-2 border-cyan-500/40" />
          <div className="absolute bottom-0 right-0 w-12 h-12 border-b-2 border-r-2 border-cyan-500/40" />

          <div className="text-center mb-10">
            <div className="w-16 h-16 mx-auto bg-cyan-500/10 border border-cyan-500/30 rounded-full flex items-center justify-center mb-6">
              <FaShieldAlt className="text-2xl text-cyan-400" />
            </div>
            <h1 className="font-orbitron text-2xl font-black tracking-[0.3em] uppercase text-white">
              Identity <span className="text-cyan-400">Portal</span>
            </h1>
            <p className="font-mono text-[9px] uppercase tracking-[0.4em] opacity-30 mt-3">
              Secure_Handshake_Initialised
            </p>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="mb-8 p-4 bg-red-500/10 border border-red-500/30 flex items-center gap-3"
            >
              <div className="w-1 h-4 bg-red-500" />
              <span className="font-mono text-[10px] uppercase text-red-400 tracking-wider">{error}</span>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-2">
              <label className="block font-mono text-[9px] uppercase text-white/40 tracking-[0.2em] ml-1">
                Operator_Email
              </label>
              <div className="relative group">
                <FaUser className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-cyan-400 transition-colors" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white/[0.03] border border-white/10 p-4 pl-12 font-mono text-sm focus:border-cyan-500/50 focus:bg-cyan-500/5 outline-none transition-all text-white"
                  placeholder="name@sector.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-end mb-1">
                <label className="block font-mono text-[9px] uppercase text-white/40 tracking-[0.2em] ml-1">
                  Access_Key
                </label>
                <Link href="/forgot-password" title="Recover Access" className="font-mono text-[8px] uppercase text-cyan-500/50 hover:text-cyan-400 transition-colors tracking-widest">
                  Forgotten?
                </Link>
              </div>
              <div className="relative group">
                <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-cyan-400 transition-colors" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white/[0.03] border border-white/10 p-4 pl-12 font-mono text-sm focus:border-cyan-500/50 focus:bg-cyan-500/5 outline-none transition-all text-white"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-5 bg-cyan-500/10 border border-cyan-500/40 hover:bg-cyan-500/20 hover:border-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-orbitron text-[11px] uppercase tracking-[0.4em] text-cyan-400 relative overflow-hidden group mt-4"
            >
              <span className="relative z-10 flex items-center justify-center gap-3">
                {loading ? "Verifying..." : "Establish Connection"}
                {!loading && <FaArrowRight className="text-[10px] group-hover:translate-x-1 transition-transform" />}
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-400/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
            </button>
          </form>

          <div className="mt-12 text-center pt-8 border-t border-white/5">
            <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-white/30">
              New Operator?{" "}
              <Link href="/register" className="text-cyan-500/60 hover:text-cyan-400 transition-colors font-bold ml-2">
                Register_ID
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

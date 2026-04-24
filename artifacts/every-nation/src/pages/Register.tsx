import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { motion } from "framer-motion";
import { FaUserPlus, FaEnvelope, FaUser, FaLock, FaArrowRight } from "react-icons/fa";

export default function Register() {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
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
      setLocation("/shop");
    } catch (err: any) {
      setError(err.message || "Registration Failed: System Error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] pt-24 flex items-center justify-center p-6 relative overflow-hidden bg-[#020408]">
      {/* Background FX */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(239,68,68,0.1)_0%,transparent_50%)]" />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="bg-[#0a0f16]/80 border border-white/10 backdrop-blur-2xl p-10 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-12 h-12 border-t-2 border-l-2 border-purple-500/40" />
          <div className="absolute bottom-0 right-0 w-12 h-12 border-b-2 border-r-2 border-purple-500/40" />

          <div className="text-center mb-10">
            <div className="w-16 h-16 mx-auto bg-purple-500/10 border border-purple-500/30 rounded-full flex items-center justify-center mb-6">
              <FaUserPlus className="text-2xl text-purple-400" />
            </div>
            <h1 className="font-orbitron text-2xl font-black tracking-[0.3em] uppercase text-white">
              Operator <span className="text-purple-400">Registry</span>
            </h1>
            <p className="font-mono text-[9px] uppercase tracking-[0.4em] opacity-30 mt-3">
              New_Asset_Initialization
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

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="block font-mono text-[9px] uppercase text-white/40 tracking-[0.2em] ml-1">
                Designated_Callsign
              </label>
              <div className="relative group">
                <FaUser className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-purple-400 transition-colors" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-white/[0.03] border border-white/10 p-4 pl-12 font-mono text-sm focus:border-purple-500/50 focus:bg-purple-500/5 outline-none transition-all text-white"
                  placeholder="USER_X"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block font-mono text-[9px] uppercase text-white/40 tracking-[0.2em] ml-1">
                Communication_Link
              </label>
              <div className="relative group">
                <FaEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-purple-400 transition-colors" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white/[0.03] border border-white/10 p-4 pl-12 font-mono text-sm focus:border-purple-500/50 focus:bg-purple-500/5 outline-none transition-all text-white"
                  placeholder="operator@sector.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block font-mono text-[9px] uppercase text-white/40 tracking-[0.2em] ml-1">
                Security_Cipher
              </label>
              <div className="relative group">
                <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-purple-400 transition-colors" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white/[0.03] border border-white/10 p-4 pl-12 font-mono text-sm focus:border-purple-500/50 focus:bg-purple-500/5 outline-none transition-all text-white"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-5 bg-purple-500/10 border border-purple-500/40 hover:bg-purple-500/20 hover:border-purple-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-orbitron text-[11px] uppercase tracking-[0.4em] text-purple-400 relative overflow-hidden group mt-4"
            >
              <span className="relative z-10 flex items-center justify-center gap-3">
                {loading ? "Initializing..." : "Authorize Identity"}
                {!loading && <FaArrowRight className="text-[10px] group-hover:translate-x-1 transition-transform" />}
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-400/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
            </button>
          </form>

          <div className="mt-12 text-center pt-8 border-t border-white/5">
            <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-white/30">
              Already Registered?{" "}
              <Link href="/login" className="text-purple-500/60 hover:text-purple-400 transition-colors font-bold ml-2">
                Establish_Link
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

import { useState } from "react";
import { useLocation, Link } from "wouter";
import { motion } from "framer-motion";
import { FaFingerprint, FaLock, FaArrowRight } from "react-icons/fa";
import { useParallax } from "@/hooks/useParallax";
import TacticalSlate from "@/components/common/TacticalSlate";
import { HUDOverlay } from "@/components/common/HUDOverlay";
import { systemToast } from "@/components/common/SystemToast";

export default function ResetPassword() {
  const { x, y } = useParallax(10);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [, setLocation] = useLocation();

  // Get token from URL
  const queryParams = new URLSearchParams(window.location.search);
  const token = queryParams.get("token");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      systemToast("Cipher_Mismatch: Verification_Failed", "error");
      return;
    }
    
    setLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: password }),
      });
      
      if (response.ok) {
        systemToast("Cipher_Updated: Uplink_Restored", "success");
        setTimeout(() => setLocation("/login"), 2000);
      } else {
        systemToast("Link_Expired: Token_Invalid", "error");
      }
    } catch (err) {
      systemToast("Handshake_Timeout", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <HUDOverlay pageLabel="CIPHER_RESET">
      <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden bg-[#020408] selection:bg-cyan-500/30">
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
          className="w-full max-w-[420px] relative z-20"
        >
          <TacticalSlate color="#00f3ff">
            <div className="p-8 md:p-10 flex flex-col gap-8">
              <div className="text-center flex flex-col items-center gap-4">
                <div className="relative">
                  <div className="w-16 h-16 border border-cyan-500/20 flex items-center justify-center relative">
                     <div className={`absolute inset-0 border border-cyan-500/40 border-t-transparent animate-[spin_1s_linear_infinite] shadow-[0_0_10px_#00f3ff]`} />
                     <FaFingerprint className="text-xl text-cyan-300" />
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <h1 className="font-orbitron text-xl font-black tracking-[0.4em] uppercase text-white">
                    Cipher <span className="text-cyan-400">Reset</span>
                  </h1>
                  <p className="font-mono text-[8px] uppercase tracking-[0.4em] text-white/20">
                    Define_New_Credential
                  </p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                <div className="flex flex-col gap-5">
                  <div className="flex flex-col gap-2">
                    <label className="font-mono text-[7px] uppercase tracking-[0.4em] text-white/20 ml-1">New_Access_Cipher</label>
                    <div className="relative group">
                      <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/10 group-focus-within:text-cyan-400 text-[10px] transition-colors z-20" />
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-white/[0.02] border border-white/5 py-3 pr-4 pl-10 font-mono text-[11px] tracking-[0.4em] text-white outline-none focus:border-cyan-500/20 focus:bg-cyan-500/[0.01] transition-all"
                        placeholder="••••••••"
                        required
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="font-mono text-[7px] uppercase tracking-[0.4em] text-white/20 ml-1">Confirm_Cipher</label>
                    <div className="relative group">
                      <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/10 group-focus-within:text-cyan-400 text-[10px] transition-colors z-20" />
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full bg-white/[0.02] border border-white/5 py-3 pr-4 pl-10 font-mono text-[11px] tracking-[0.4em] text-white outline-none focus:border-cyan-500/20 focus:bg-cyan-500/[0.01] transition-all"
                        placeholder="••••••••"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-4">
                  <button
                    type="submit"
                    disabled={loading || !token}
                    className="w-full h-11 bg-cyan-400/90 hover:bg-cyan-400 text-[#020408] transition-all duration-300 flex items-center justify-center gap-3 group disabled:opacity-50"
                  >
                    <span className="font-orbitron font-black tracking-[0.2em] text-[10px] uppercase">
                      {loading ? "Updating..." : "Confirm_Reset"}
                    </span>
                    {!loading && <FaArrowRight className="text-[10px] group-hover:translate-x-1 transition-transform" />}
                  </button>

                  {!token && (
                    <div className="border border-red-500/30 bg-red-500/5 p-3">
                      <span className="font-mono text-[9px] uppercase text-red-400 tracking-wider">Invalid_Handshake: Token_Missing</span>
                    </div>
                  )}

                  <Link href="/login" className="font-mono text-[7px] uppercase text-white/20 hover:text-white transition-colors tracking-widest text-center mt-2">
                    Abort_Process
                  </Link>
                </div>
              </form>
            </div>
          </TacticalSlate>
        </motion.div>
      </div>
    </HUDOverlay>
  );
}

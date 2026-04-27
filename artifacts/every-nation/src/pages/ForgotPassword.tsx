import { useState } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { FaFingerprint, FaTerminal, FaEnvelope, FaArrowRight } from "react-icons/fa";
import { useParallax } from "@/hooks/useParallax";
import TacticalSlate from "@/components/common/TacticalSlate";
import { HUDOverlay } from "@/components/common/HUDOverlay";
import { systemToast } from "@/components/common/SystemToast";

export default function ForgotPassword() {
  const { x, y } = useParallax(10);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulate API call
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/request-password-reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      
      if (response.ok) {
        setSubmitted(true);
        systemToast("Recovery_Signal_Sent", "success");
      } else {
        systemToast("Protocol_Error: Target_Not_Found", "error");
      }
    } catch (err) {
      systemToast("Handshake_Timeout", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <HUDOverlay pageLabel="CIPHER_RECOVERY">
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
                     <div className={`absolute inset-0 border border-cyan-500/40 border-t-transparent animate-[spin_10s_linear_infinite]`} />
                     <FaFingerprint className="text-xl text-cyan-400/40" />
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <h1 className="font-orbitron text-xl font-black tracking-[0.4em] uppercase text-white">
                    Access <span className="text-cyan-400">Recovery</span>
                  </h1>
                  <p className="font-mono text-[8px] uppercase tracking-[0.4em] text-white/20">
                    Neural_Link_Lost
                  </p>
                </div>
              </div>

              {!submitted ? (
                <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                  <div className="flex flex-col gap-2">
                    <label className="font-mono text-[7px] uppercase tracking-[0.4em] text-white/20 ml-1">Registered_ID</label>
                    <div className="relative group">
                      <FaEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 text-white/10 group-focus-within:text-cyan-400 text-[10px] transition-colors z-20" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-white/[0.02] border border-white/5 py-3 pr-4 pl-10 font-mono text-[11px] tracking-wider text-white outline-none focus:border-cyan-500/20 focus:bg-cyan-500/[0.01] transition-all"
                        placeholder="ACCESS_EMAIL"
                        required
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-4">
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full h-11 bg-cyan-400/90 hover:bg-cyan-400 text-[#020408] transition-all duration-300 flex items-center justify-center gap-3 group"
                    >
                      <span className="font-orbitron font-black tracking-[0.2em] text-[10px] uppercase">
                        {loading ? "Transmitting..." : "Send_Recovery_Link"}
                      </span>
                      {!loading && <FaArrowRight className="text-[10px] group-hover:translate-x-1 transition-transform" />}
                    </button>

                    <Link href="/login" className="w-full h-10 border border-white/5 hover:border-white/10 text-white/20 hover:text-white/40 transition-all font-mono text-[9px] uppercase tracking-widest flex items-center justify-center gap-3">
                      <FaTerminal className="text-[8px] opacity-40" />
                      Return_to_Login
                    </Link>
                  </div>
                </form>
              ) : (
                <div className="flex flex-col items-center gap-6 text-center">
                  <div className="w-full p-4 border border-cyan-500/10 bg-cyan-500/5">
                    <p className="font-mono text-[10px] text-cyan-400/80 uppercase tracking-widest leading-relaxed">
                      Recovery_Sequence_Initiated. Check your neural uplink (Email) for reset instructions.
                    </p>
                  </div>
                  <Link href="/login" className="w-full h-11 border border-white/10 text-white hover:bg-white/5 transition-all font-orbitron text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center">
                    Acknowledge
                  </Link>
                </div>
              )}
            </div>
          </TacticalSlate>
        </motion.div>
      </div>
    </HUDOverlay>
  );
}

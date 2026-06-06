import { useState } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { FaTerminal, FaEnvelope, FaArrowRight, FaKey } from "react-icons/fa";
import {
  CinematicPageShell,
  AccessGate,
} from "@/components/common/PremiumVisuals";
import { systemToast } from "@/components/common/SystemToast";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const reducedMotion = useReducedMotion();
  const shouldReduceMotion = Boolean(reducedMotion);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/auth/request-password-reset`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        },
      );

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
    <CinematicPageShell
      pageLabel="AUTH_RECOVERY"
      accentColor="rgba(6, 182, 212, 0.12)"
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
          title="Reset Cipher"
          subtitle="Recovery_Protocol_Initialised"
          icon={
            <div className="relative flex items-center justify-center">
              <FaKey
                className={`text-2xl transition-colors duration-500 ${
                  email.length > 5
                    ? "text-cyan-400 drop-shadow-[0_0_8px_#00f3ff]"
                    : "text-white/20"
                }`}
              />
            </div>
          }
          accentColor="#00f3ff"
          reducedMotion={shouldReduceMotion}
        >
          <div className="p-6 sm:p-8 md:p-10 flex flex-col gap-6">
            {!submitted ? (
              <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                <div className="flex flex-col gap-2">
                  <label className="font-mono text-[11px] uppercase tracking-[0.4em] text-white/30 ml-1">
                    Registered_ID
                  </label>
                  <div className="flex items-center gap-4 bg-white/[0.01] border border-white/5 focus-within:border-cyan-500/30 focus-within:bg-cyan-500/[0.01] transition-all group">
                    <div className="pl-4 text-white/20 group-focus-within:text-cyan-400 transition-colors pointer-events-none shrink-0">
                      <FaEnvelope size={12} />
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="flex-1 py-4 pr-4 bg-transparent font-mono text-[14px] tracking-wider text-white outline-none"
                      placeholder="ACCESS_EMAIL"
                      required
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-13 bg-cyan-400/90 hover:bg-cyan-400 text-[#020408] transition-all duration-300 flex items-center justify-center gap-4 group cursor-pointer"
                  >
                    <span className="font-orbitron font-black tracking-[0.25em] text-[15px] uppercase">
                      {loading ? "Transmitting..." : "Send_Recovery_Link"}
                    </span>
                    {!loading && (
                      <FaArrowRight className="text-[11px] group-hover:translate-x-1 transition-transform" />
                    )}
                  </button>

                  <Link
                    href="/login"
                    className="w-full h-11 border border-white/5 hover:border-white/10 text-white/30 hover:text-white/60 hover:bg-white/[0.01] transition-all font-mono text-[11px] uppercase tracking-widest flex items-center justify-center gap-3"
                  >
                    <FaTerminal className="text-[8px] opacity-40" />
                    Return_to_Login
                  </Link>
                </div>
              </form>
            ) : (
              <div className="flex flex-col items-center gap-6 text-center">
                <div className="w-full p-4 border border-cyan-500/10 bg-cyan-500/5">
                  <p className="font-mono text-[11px] text-cyan-400/80 uppercase tracking-widest leading-relaxed">
                    Recovery_Sequence_Initiated. Check your neural uplink
                    (Email) for reset instructions.
                  </p>
                </div>
                <Link
                  href="/login"
                  className="w-full h-11 border border-white/10 text-white hover:bg-white/5 transition-all font-orbitron text-[13px] font-black uppercase tracking-[0.25em] flex items-center justify-center"
                >
                  Acknowledge
                </Link>
              </div>
            )}
          </div>
        </AccessGate>
      </motion.div>
    </CinematicPageShell>
  );
}

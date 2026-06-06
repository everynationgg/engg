import { useState } from "react";
import { useLocation, Link } from "wouter";
import { motion, useReducedMotion } from "framer-motion";
import { FaFingerprint, FaLock, FaArrowRight } from "react-icons/fa";
import {
  CinematicPageShell,
  AccessGate,
} from "@/components/common/PremiumVisuals";
import { systemToast } from "@/components/common/SystemToast";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [, setLocation] = useLocation();
  const reducedMotion = useReducedMotion();
  const shouldReduceMotion = Boolean(reducedMotion);

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
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/auth/reset-password`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, newPassword: password }),
        },
      );

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
    <CinematicPageShell
      pageLabel="CIPHER_RESET"
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
          title="Cipher Reset"
          subtitle="Define_New_Credential"
          icon={
            <div className="relative flex items-center justify-center">
              <FaFingerprint
                className={`text-2xl transition-colors duration-500 ${
                  password.length > 5
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
            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              <div className="flex flex-col gap-5">
                <div className="flex flex-col gap-2">
                  <label className="font-mono text-[11px] uppercase tracking-[0.4em] text-white/30 ml-1">
                    New_Access_Cipher
                  </label>
                  <div className="flex items-center bg-white/[0.01] border border-white/5 focus-within:border-cyan-500/30 focus-within:bg-cyan-500/[0.01] transition-all group">
                    <div className="pl-4 pr-3 text-white/20 group-focus-within:text-cyan-400 transition-colors pointer-events-none shrink-0">
                      <FaLock size={12} />
                    </div>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="flex-1 py-4 pr-4 bg-transparent font-mono text-[14px] tracking-[0.34em] text-white outline-none"
                      placeholder="••••••••"
                      required
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="font-mono text-[11px] uppercase tracking-[0.4em] text-white/30 ml-1">
                    Confirm_Cipher
                  </label>
                  <div className="flex items-center bg-white/[0.01] border border-white/5 focus-within:border-cyan-500/30 focus-within:bg-cyan-500/[0.01] transition-all group">
                    <div className="pl-4 pr-3 text-white/20 group-focus-within:text-cyan-400 transition-colors pointer-events-none shrink-0">
                      <FaLock size={12} />
                    </div>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="flex-1 py-4 pr-4 bg-transparent font-mono text-[14px] tracking-[0.34em] text-white outline-none"
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
                  className="w-full h-13 bg-cyan-400/90 hover:bg-cyan-400 text-[#020408] transition-all duration-300 flex items-center justify-center gap-4 group cursor-pointer disabled:opacity-50"
                >
                  <span className="font-orbitron font-black tracking-[0.25em] text-[15px] uppercase">
                    {loading ? "Updating..." : "Confirm_Reset"}
                  </span>
                  {!loading && (
                    <FaArrowRight className="text-[11px] group-hover:translate-x-1 transition-transform" />
                  )}
                </button>

                {!token && (
                  <div className="border border-red-500/20 bg-red-500/5 p-3 text-center">
                    <span className="font-mono text-[11px] uppercase text-red-400 tracking-wider">
                      Invalid_Handshake: Token_Missing
                    </span>
                  </div>
                )}

                <Link
                  href="/login"
                  className="font-mono text-[11px] uppercase text-white/20 hover:text-white transition-colors tracking-widest text-center mt-2"
                >
                  Abort_Process
                </Link>
              </div>
            </form>
          </div>
        </AccessGate>
      </motion.div>
    </CinematicPageShell>
  );
}

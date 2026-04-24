import { useState, useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { FaShieldAlt, FaKey, FaEnvelope, FaExclamationTriangle, FaCheckCircle, FaTerminal } from "react-icons/fa";
import { useAuth } from "@/hooks/useAuth";

export default function Verify() {
  const { token: authToken, email, refreshUser } = useAuth();
  const [location, setLocation] = useLocation();
  const search = useSearch();
  const queryToken = new URLSearchParams(search).get("token");

  const [status, setStatus] = useState<"idle" | "verifying" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (queryToken) {
      handleVerify(queryToken);
    }
  }, [queryToken]);

  const handleVerify = async (vToken: string) => {
    setStatus("verifying");
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/verify-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: vToken })
      });
      const data = await res.json();
      if (data.success) {
        setStatus("success");
        setMessage("Identity Confirmed. Neural Handshake Complete.");
        if (refreshUser) refreshUser();
        setTimeout(() => setLocation("/profile"), 3000);
      } else {
        setStatus("error");
        setMessage(data.error || "Decryption Failed. Invalid Key.");
      }
    } catch (err) {
      setStatus("error");
      setMessage("Uplink Interrupted. Connection Lost.");
    }
  };

  const resendCode = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/resend-verification-email`, {
        method: "POST",
        headers: { 
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json" 
        }
      });
      const data = await res.json();
      if (data.success) {
        setMessage("New Decryption Key transmitted to your terminal.");
      } else {
        setMessage(data.error || "Transmission Failed.");
      }
    } catch (err) {
      setMessage("Network Congestion. Try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020408] text-white flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Grids & FX */}
      <div className="absolute inset-0 opacity-20 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(6,182,212,0.1)_0%,transparent_70%)]" />

      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative z-10 w-full max-w-[500px] bg-[#0a0b1e]/80 border border-white/10 p-12 backdrop-blur-3xl shadow-[0_0_50px_rgba(0,0,0,0.5)]"
      >
        {/* HUD Elements */}
        <div className="absolute -top-1 -left-1 w-8 h-8 border-t-2 border-l-2 border-cyan-500/30" />
        <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-2 border-r-2 border-cyan-500/30" />

        <div className="flex flex-col items-center text-center">
          <div className="relative mb-8">
            <div className={`w-24 h-24 rounded-full border-2 flex items-center justify-center transition-all duration-700 ${
              status === 'success' ? 'border-green-500 bg-green-500/10 shadow-[0_0_30px_rgba(34,197,94,0.3)]' :
              status === 'error' ? 'border-red-500 bg-red-500/10 shadow-[0_0_30px_rgba(239,68,68,0.3)]' :
              'border-cyan-500/30 bg-cyan-500/5'
            }`}>
              <AnimatePresence mode="wait">
                {status === 'success' ? (
                  <motion.div key="success" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                    <FaCheckCircle className="text-4xl text-green-400" />
                  </motion.div>
                ) : status === 'error' ? (
                  <motion.div key="error" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                    <FaExclamationTriangle className="text-4xl text-red-400" />
                  </motion.div>
                ) : (
                  <motion.div key="idle" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="animate-pulse">
                    <FaShieldAlt className="text-4xl text-cyan-400" />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            {status === 'verifying' && (
              <div className="absolute inset-0 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
            )}
          </div>

          <div className="flex flex-col gap-2 mb-8">
            <div className="flex items-center justify-center gap-2">
              <div className="w-2 h-2 bg-cyan-500 animate-pulse" />
              <span className="font-orbitron text-[10px] uppercase tracking-[0.5em] text-cyan-400">Security_Override</span>
            </div>
            <h1 className="font-orbitron text-3xl font-black tracking-widest uppercase">Identity_Verification</h1>
          </div>

          <p className="font-mono text-xs uppercase tracking-widest text-white/40 leading-relaxed mb-10">
            {status === 'idle' && !queryToken && "Verification protocol engaged. Transmission of decryption key required to access premium subsystems."}
            {status === 'verifying' && "Executing neural handshake. Validating encrypted credentials..."}
            {status === 'success' && message}
            {status === 'error' && message}
          </p>

          {status === 'idle' && !queryToken && (
            <div className="w-full space-y-6">
              <div className="p-6 bg-white/5 border border-white/10 text-left relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-30 transition-opacity">
                  <FaEnvelope className="text-4xl" />
                </div>
                <span className="block font-mono text-[9px] uppercase tracking-widest text-white/30 mb-2">Target_Address</span>
                <span className="block font-mono text-sm text-white">{email || "NOT_LOGGED_IN"}</span>
              </div>

              <button 
                onClick={resendCode}
                disabled={loading}
                className="w-full py-4 bg-cyan-500/10 border border-cyan-500/40 hover:bg-cyan-500 hover:text-white transition-all font-orbitron text-[10px] uppercase tracking-[0.4em] relative overflow-hidden group"
              >
                <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                {loading ? "Transmitting..." : "Transmit_Key"}
              </button>

              <div className="flex items-center gap-4 py-4">
                <div className="flex-1 h-px bg-white/5" />
                <span className="font-mono text-[8px] uppercase tracking-widest text-white/20">OR</span>
                <div className="flex-1 h-px bg-white/5" />
              </div>

              <div className="relative">
                <FaKey className="absolute left-4 top-1/2 -translate-y-1/2 text-cyan-500/50" />
                <input 
                  type="text" 
                  placeholder="Manual_Entry_Key"
                  className="w-full bg-white/5 border border-white/10 p-4 pl-12 font-mono text-xs uppercase tracking-widest text-white focus:border-cyan-500 focus:outline-none transition-all"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleVerify((e.target as HTMLInputElement).value);
                    }
                  }}
                />
              </div>
            </div>
          )}

          {status === 'error' && (
            <button 
              onClick={() => setStatus('idle')}
              className="px-8 py-3 bg-white/5 border border-white/10 hover:border-white/30 transition-all font-orbitron text-[9px] uppercase tracking-[0.4em]"
            >
              Retry_Uplink
            </button>
          )}
        </div>

        {/* Footer Telemetry */}
        <div className="mt-12 pt-8 border-t border-white/5 flex justify-between items-center opacity-20 font-mono text-[8px] uppercase tracking-widest">
          <div className="flex items-center gap-2">
            <FaTerminal />
            <span>NODE_V7 // SECURE</span>
          </div>
          <span>KEY_ROTATION: 24H</span>
        </div>
      </motion.div>
    </div>
  );
}

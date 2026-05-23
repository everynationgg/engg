import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { playSciFiClick } from "@/lib/sound";
import { FaCoins } from "react-icons/fa";

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  const { username, userId, credits, logout, refreshUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const modalRef = useRef<HTMLDivElement>(null);

  // Recovery States
  const [recoveryEmail, setRecoveryEmail] = useState("");
  const [recoveryCode, setRecoveryCode] = useState("");
  const [recoveryStep, setRecoveryStep] = useState(0); // 0 = email, 1 = code
  const [isRecovering, setIsRecovering] = useState(false);
  const [recoveryError, setRecoveryError] = useState<string | null>(null);
  const [recoverySuccess, setRecoverySuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      playSciFiClick();
      refreshUser().finally(() => setLoading(false));
    }
  }, [isOpen, refreshUser]);

  const handleRequestCode = async () => {
    playSciFiClick();
    if (!recoveryEmail || !recoveryEmail.includes("@")) {
      setRecoveryError("Valid email address required");
      return;
    }
    setIsRecovering(true);
    setRecoveryError(null);
    try {
      const baseUrl = import.meta.env.VITE_API_URL || "";
      const response = await fetch(`${baseUrl}/api/auth/recover-request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: recoveryEmail }),
      });
      const data = await response.json();
      if (response.ok) {
        setRecoveryStep(1);
      } else {
        setRecoveryError(data.error || "Verification request failed");
      }
    } catch (err) {
      setRecoveryError("Handshake failure");
    } finally {
      setIsRecovering(false);
    }
  };

  const handleVerifyCode = async () => {
    playSciFiClick();
    if (!recoveryCode) {
      setRecoveryError("Restoration code required");
      return;
    }
    setIsRecovering(true);
    setRecoveryError(null);
    try {
      const baseUrl = import.meta.env.VITE_API_URL || "";
      const response = await fetch(`${baseUrl}/api/auth/recover-verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: recoveryEmail,
          code: recoveryCode,
          currentGuestId: userId
        }),
      });
      const data = await response.json();
      if (response.ok) {
        setRecoverySuccess(true);
        await refreshUser();
        setTimeout(() => {
          setRecoverySuccess(false);
          setRecoveryStep(0);
          setRecoveryEmail("");
          setRecoveryCode("");
        }, 3000);
      } else {
        setRecoveryError(data.error || "Restoration verification failed");
      }
    } catch (err) {
      setRecoveryError("Restoration verification failure");
    } finally {
      setIsRecovering(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[10001] flex items-center justify-center p-4 backdrop-blur-sm transition-all duration-300"
      style={{ background: "hsl(220 30% 2% / 0.85)" }}
      onClick={() => { playSciFiClick(); onClose(); }}
    >
      <div
        ref={modalRef}
        className="relative w-full max-w-lg bg-[#0c1016] border border-white/10 shadow-[0_0_50px_rgba(0,243,255,0.1)] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HUD Elements */}
        <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-cyan-500/40" />
        <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-cyan-500/40" />
        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-cyan-500/40" />
        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-cyan-500/40" />
        
        {/* Animated Scanline */}
        <div className="absolute inset-x-0 top-0 h-[2px] bg-cyan-500/20 shadow-[0_0_15px_rgba(0,243,255,0.5)] animate-[scan_4s_linear_infinite]" />

        <button
          onClick={() => { playSciFiClick(); onClose(); }}
          className="absolute top-4 right-4 z-20 w-8 h-8 flex items-center justify-center border border-white/10 hover:border-cyan-500/50 hover:bg-cyan-500/10 transition-all text-white/40 hover:text-cyan-400 font-mono text-lg"
          aria-label="Close"
        >
          ✕
        </button>

        <div className="p-8">
          {/* Header */}
          <div className="mb-10 relative">
            <div className="flex items-center gap-4 mb-2">
               <div className="w-1.5 h-6 bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.5)]" />
               <h2 className="font-orbitron font-black text-xl tracking-[0.3em] uppercase">
                 Profile
               </h2>
            </div>
            <div className="flex items-baseline gap-3">
              <span className="font-mono text-2xl text-cyan-400 tracking-wider">{username}</span>
              <div className="flex items-center gap-2 px-2 py-0.5 bg-cyan-500/10 border border-cyan-500/30 rounded-sm">
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                <span className="font-mono text-[8px] tracking-widest uppercase text-cyan-400/80">
                  GUEST SESSION
                </span>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-12 h-12 border-2 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin" />
              <p className="mt-4 font-mono text-[10px] tracking-widest uppercase opacity-40">Accessing Data...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Identity & Coin Balance HUD */}
              <div className="p-6 bg-white/5 border border-white/5 relative">
                <div className="absolute top-0 right-0 p-2 font-mono text-[8px] opacity-20">IDENTITY_v2.5</div>
                <h3 className="font-orbitron text-[10px] tracking-[0.3em] uppercase opacity-40 mb-6 border-b border-white/5 pb-2">Guest Account Data</h3>
                
                <div className="space-y-4">
                  <div>
                    <p className="font-mono text-[9px] uppercase opacity-40 mb-1">Guest UUID</p>
                    <p className="font-mono text-xs text-white/80 break-all select-all">
                      {userId}
                    </p>
                  </div>
                  <div className="pt-2">
                    <p className="font-mono text-[9px] uppercase opacity-40 mb-1">Balance</p>
                    <div className="flex items-center gap-3">
                      <FaCoins className="text-cyan-500/40 text-xs" />
                      <p className="font-orbitron text-2xl text-cyan-400 font-black">
                        {credits} <span className="text-xs text-cyan-500/40 font-bold text-sm">CC</span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Restoration Protocol */}
              <div className="p-6 bg-white/[0.02] border border-white/5 relative">
                <h3 className="font-orbitron text-[10px] tracking-[0.3em] uppercase opacity-40 mb-4 border-b border-white/5 pb-2">Coin Restoration Protocol</h3>
                
                {!recoveryStep ? (
                  <div className="space-y-3">
                    <p className="font-mono text-[8px] leading-relaxed uppercase text-white/40">
                      Enter the email address used during PayPal or GCash checkout to recover and restore your coin balance.
                    </p>
                    <input
                      type="email"
                      placeholder="ENTER BILLING EMAIL..."
                      value={recoveryEmail}
                      onChange={(e) => setRecoveryEmail(e.target.value)}
                      className="w-full py-2.5 px-3 bg-black/60 border border-white/10 text-cyan-400 font-mono text-[10px] outline-none tracking-widest"
                    />
                    <button
                      type="button"
                      onClick={handleRequestCode}
                      disabled={isRecovering}
                      className="w-full py-2.5 bg-cyan-950 border border-cyan-500/40 text-cyan-400 font-orbitron font-bold text-[9px] tracking-widest uppercase hover:bg-cyan-500/10 transition-all disabled:opacity-40"
                    >
                      {isRecovering ? "DISPATCHING CODE..." : "SEND RESTORATION CODE"}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="font-mono text-[8px] leading-relaxed uppercase text-amber-500/80">
                      Restoration protocol initialized. Enter the 6-digit code sent to {recoveryEmail}.
                    </p>
                    <input
                      type="text"
                      placeholder="ENTER 6-DIGIT CODE..."
                      maxLength={6}
                      value={recoveryCode}
                      onChange={(e) => setRecoveryCode(e.target.value)}
                      className="w-full py-2.5 px-3 bg-black/60 border border-white/10 text-cyan-400 font-mono text-[10px] text-center outline-none tracking-widest"
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => { playSciFiClick(); setRecoveryStep(0); setRecoveryCode(""); }}
                        className="py-2.5 border border-white/10 font-orbitron text-[9px] tracking-widest text-white/40 uppercase hover:bg-white/5"
                      >
                        Back
                      </button>
                      <button
                        type="button"
                        onClick={handleVerifyCode}
                        disabled={isRecovering}
                        className="py-2.5 bg-cyan-600 border border-cyan-400 text-white font-orbitron font-bold text-[9px] tracking-widest uppercase hover:bg-cyan-500 transition-all disabled:opacity-40"
                      >
                        {isRecovering ? "VERIFYING..." : "RESTORE BALANCE"}
                      </button>
                    </div>
                  </div>
                )}
                
                {recoveryError && (
                  <div className="mt-3 p-2 bg-red-500/10 border border-red-500/20 text-center">
                    <p className="font-mono text-[8px] text-red-400 uppercase font-bold">{recoveryError}</p>
                  </div>
                )}
                {recoverySuccess && (
                  <div className="mt-3 p-2 bg-green-500/10 border border-green-500/20 text-center">
                    <p className="font-mono text-[8px] text-green-400 uppercase font-bold">Protocol successful. Coins merged!</p>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-3 mt-8">
                <button
                  onClick={() => { playSciFiClick(); onClose(); }}
                  className="w-full py-3 border border-white/10 hover:border-cyan-500/40 font-orbitron text-[10px] tracking-[0.4em] uppercase hover:bg-cyan-500/5 transition-all text-white/60 hover:text-white"
                >
                  Close Terminal
                </button>
                <button
                  onClick={() => {
                    playSciFiClick();
                    logout();
                    onClose();
                    window.location.reload();
                  }}
                  className="w-full py-3 border border-red-500/20 hover:border-red-500/50 font-orbitron text-[10px] tracking-[0.4em] uppercase hover:bg-red-500/10 transition-all text-red-500/60 hover:text-red-500"
                >
                  Reset Guest Profile
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes scan {
          0% { top: 0%; opacity: 0; }
          5% { opacity: 1; }
          95% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
      `}} />
    </div>
  );
}

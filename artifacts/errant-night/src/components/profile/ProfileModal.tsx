import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { playSciFiClick } from "@/lib/sound";
import { FaCoins } from "react-icons/fa";

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  const { username, userId, credits, isGuest, logout, refreshUser } = useAuth();
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
      setRecoveryError("Connection failed. Please try again.");
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

  // ESC and Android back button listener
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };

    const handleBackButton = (e: Event) => {
      e.preventDefault();
      onClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    document.addEventListener("backbutton", handleBackButton);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("backbutton", handleBackButton);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[10001] flex items-center justify-center p-3 sm:p-4 backdrop-blur-sm transition-all duration-300"
      style={{
        background: "hsl(220 30% 2% / 0.85)",
        paddingTop: "max(16px, env(safe-area-inset-top, 16px))",
        paddingBottom: "max(16px, env(safe-area-inset-bottom, 16px))",
      }}
      onClick={() => { playSciFiClick(); onClose(); }}
    >
      <div
        ref={modalRef}
        className="relative w-full max-w-lg max-h-[90dvh] flex flex-col bg-[#0c1016] border border-white/15 shadow-[0_0_50px_rgba(0,243,255,0.12)] overflow-hidden rounded-xl"
        onClick={(e) => e.stopPropagation()}
        data-no-swipe="true"
      >
        {/* Corner Accents */}
        <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-cyan-500/40 pointer-events-none" />
        <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-cyan-500/40 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-cyan-500/40 pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-cyan-500/40 pointer-events-none" />

        <button
          onClick={() => { playSciFiClick(); onClose(); }}
          className="absolute top-4 right-4 z-20 w-11 h-11 flex items-center justify-center rounded-lg border border-white/15 hover:border-cyan-400/50 hover:bg-cyan-500/10 active:scale-95 transition-all text-white/70 hover:text-cyan-300 font-mono text-lg cursor-pointer"
          style={{ touchAction: "manipulation" }}
          aria-label="Close profile"
        >
          ✕
        </button>

        <div className="flex-1 overflow-y-auto p-5 sm:p-8 custom-scrollbar">
          {/* Header */}
          <div className="mb-6 sm:mb-8 relative pr-12">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-1.5 h-6 bg-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.5)] rounded-full" />
              <h2 className="font-orbitron font-black text-lg sm:text-xl tracking-[0.2em] uppercase text-white">
                Profile
              </h2>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-mono text-xl sm:text-2xl text-cyan-300 font-bold tracking-wider break-all">
                {username}
              </span>
              <div className="flex items-center gap-2 px-2.5 py-0.5 bg-cyan-500/10 border border-cyan-500/30 rounded">
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                <span className="font-mono text-[10px] tracking-wider uppercase text-cyan-300">
                  {isGuest ? "Guest Session" : "Verified Account"}
                </span>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-10 h-10 border-2 border-cyan-500/20 border-t-cyan-400 rounded-full animate-spin" />
              <p className="mt-4 font-mono text-xs tracking-wider uppercase text-white/60">Loading profile...</p>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Account Details & Credit Balance */}
              <div className="p-4 sm:p-5 rounded-xl bg-white/[0.03] border border-white/10">
                <h3 className="font-orbitron font-bold text-xs tracking-[0.15em] uppercase text-cyan-300 mb-4 border-b border-white/10 pb-2">
                  Account Details
                </h3>

                <div className="space-y-4">
                  <div>
                    <p className="font-mono text-[10px] uppercase text-white/50 mb-1">Player ID</p>
                    <p className="font-mono text-xs text-white/85 break-all select-all">
                      {userId}
                    </p>
                  </div>
                  <div className="pt-1">
                    <p className="font-mono text-[10px] uppercase text-white/50 mb-1">Credit Balance</p>
                    <div className="flex items-center gap-2.5">
                      <FaCoins className="text-cyan-400 text-sm" />
                      <p className="font-orbitron text-xl sm:text-2xl text-cyan-300 font-black">
                        {credits} <span className="text-xs text-cyan-400/70 font-bold">CC</span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Restore Purchased Credits */}
              <div className="p-4 sm:p-5 rounded-xl bg-white/[0.02] border border-white/10">
                <h3 className="font-orbitron font-bold text-xs tracking-[0.15em] uppercase text-cyan-300 mb-3 border-b border-white/10 pb-2">
                  Restore Purchased Credits
                </h3>

                {!recoveryStep ? (
                  <div className="space-y-3">
                    <p className="text-xs leading-relaxed text-white/65">
                      Enter the email address used during PayPal or GCash checkout to restore your purchased credits.
                    </p>
                    <input
                      type="email"
                      placeholder="Billing email address"
                      value={recoveryEmail}
                      onChange={(e) => setRecoveryEmail(e.target.value)}
                      className="w-full py-2.5 px-3 rounded-lg bg-black/60 border border-white/15 focus:border-cyan-400/60 text-cyan-200 font-mono text-base sm:text-xs outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleRequestCode}
                      disabled={isRecovering}
                      style={{ touchAction: "manipulation" }}
                      className="w-full py-3 rounded-lg bg-cyan-950 border border-cyan-500/40 text-cyan-300 font-orbitron font-bold text-xs tracking-wider uppercase hover:bg-cyan-500/15 transition-all disabled:opacity-40 cursor-pointer"
                    >
                      {isRecovering ? "Sending Code..." : "Send Verification Code"}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-xs leading-relaxed text-amber-300/90">
                      Enter the 6-digit verification code sent to <strong>{recoveryEmail}</strong>.
                    </p>
                    <input
                      type="text"
                      placeholder="6-digit code"
                      maxLength={6}
                      value={recoveryCode}
                      onChange={(e) => setRecoveryCode(e.target.value)}
                      className="w-full py-2.5 px-3 rounded-lg bg-black/60 border border-white/15 focus:border-cyan-400/60 text-cyan-200 font-mono text-base sm:text-sm text-center outline-none tracking-widest"
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => { playSciFiClick(); setRecoveryStep(0); setRecoveryCode(""); }}
                        style={{ touchAction: "manipulation" }}
                        className="py-2.5 rounded-lg border border-white/15 font-orbitron text-xs tracking-wider text-white/70 uppercase hover:bg-white/5 cursor-pointer"
                      >
                        Back
                      </button>
                      <button
                        type="button"
                        onClick={handleVerifyCode}
                        disabled={isRecovering}
                        style={{ touchAction: "manipulation" }}
                        className="py-2.5 rounded-lg bg-cyan-600 border border-cyan-400 text-white font-orbitron font-bold text-xs tracking-wider uppercase hover:bg-cyan-500 transition-all disabled:opacity-40 cursor-pointer"
                      >
                        {isRecovering ? "Verifying..." : "Restore Credits"}
                      </button>
                    </div>
                  </div>
                )}

                {recoveryError && (
                  <div className="mt-3 p-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-center">
                    <p className="font-mono text-xs text-red-300 font-semibold">{recoveryError}</p>
                  </div>
                )}
                {recoverySuccess && (
                  <div className="mt-3 p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-center">
                    <p className="font-mono text-xs text-emerald-300 font-semibold">Credits restored to your account!</p>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2.5 pt-2">
                <button
                  onClick={() => { playSciFiClick(); onClose(); }}
                  style={{ touchAction: "manipulation" }}
                  className="w-full py-3 rounded-lg border border-white/15 hover:border-cyan-400/40 font-orbitron font-bold text-xs tracking-[0.2em] uppercase hover:bg-cyan-500/10 transition-all text-white/80 hover:text-white cursor-pointer"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    playSciFiClick();
                    logout();
                    onClose();
                    window.location.reload();
                  }}
                  style={{ touchAction: "manipulation" }}
                  className="w-full py-3 rounded-lg border border-red-500/25 hover:border-red-500/50 font-orbitron font-bold text-xs tracking-[0.2em] uppercase hover:bg-red-500/10 transition-all text-red-400 hover:text-red-300 cursor-pointer"
                >
                  {isGuest ? "Reset Guest Profile" : "Sign Out"}
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

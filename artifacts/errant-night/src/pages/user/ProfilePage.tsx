import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import SettingsModal from "@/components/system/SettingsModal";
import { playSciFiClick } from "@/lib/sound";
import { FaCoins } from "react-icons/fa";
import ShopModal from "@/components/shop/ShopModal";
import { useEffect, useState } from "react";
import LandingNavbar from "@/components/system/LandingNavbar";

export default function ProfilePage() {
  const [, setLocation] = useLocation();
  const { isLoggedIn, isGuest, username, userId, logout, credits, refreshUser } = useAuth();
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showShopModal, setShowShopModal] = useState(false);

  // Recovery States
  const [recoveryEmail, setRecoveryEmail] = useState("");
  const [recoveryCode, setRecoveryCode] = useState("");
  const [recoveryStep, setRecoveryStep] = useState(0); // 0 = email, 1 = code
  const [isRecovering, setIsRecovering] = useState(false);
  const [recoveryError, setRecoveryError] = useState<string | null>(null);
  const [recoverySuccess, setRecoverySuccess] = useState(false);

  useEffect(() => {
    if (!isLoggedIn) {
      setLocation("/");
      return;
    }
    refreshUser();
  }, [isLoggedIn, setLocation, refreshUser]);

  const handleLogout = () => {
    playSciFiClick();
    logout();
    window.location.reload();
  };

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

  return (
    <div className="min-h-screen text-white relative flex flex-col" style={{ background: "hsl(220 30% 2%)" }}>
      {/* Cinematic Overlays */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.02] z-0" 
        style={{ backgroundImage: "linear-gradient(#00f3ff 1px, transparent 1px), linear-gradient(90deg, #00f3ff 1px, transparent 1px)", backgroundSize: "120px 120px" }} 
      />
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(circle_at_50%_0%,rgba(6,182,212,0.05),transparent)]" />

      <LandingNavbar
        onShowSettings={() => setShowSettingsModal(true)}
        onShowProfile={() => refreshUser()}
        onShowHowToPlay={() => {}}
      />

      <div className="h-[var(--nav-height)] shrink-0" />

      {/* --- ATTENTION-DRIVEN HERO HUB --- */}
      <div className="max-w-xl mx-auto w-full px-4 sm:px-6 pt-12 sm:pt-16 pb-24 relative z-10 flex flex-col items-center text-center">
        
        {/* 1. Identity Header */}
        <div className="mb-8">
           <div className="w-1.5 h-6 bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.5)] mx-auto mb-4" />
           <h2 className="font-orbitron font-black text-xl tracking-[0.25em] uppercase text-white/80 mb-2">
             Profile
           </h2>
        </div>

        {/* 2. Identity card */}
        <div className="w-full p-6 sm:p-8 bg-white/[0.02] border border-white/10 rounded-xl mb-6 text-left relative space-y-5">
          <div className="flex items-center gap-4 sm:gap-6">
            <div className="w-16 h-16 border border-white/10 bg-white/[0.02] p-1 overflow-hidden shrink-0 rounded-lg">
               <img 
                src={`https://api.dicebear.com/7.x/bottts/svg?seed=${username ?? 'operator'}&backgroundColor=transparent`} 
                alt={username ?? 'Player'}
                className="w-full h-full object-cover opacity-80"
               />
            </div>
            <div className="min-w-0">
               <h1 className="font-orbitron font-bold text-xl sm:text-2xl tracking-[0.1em] uppercase text-white truncate">{username}</h1>
               <div className="inline-flex items-center gap-2 mt-1.5 px-2.5 py-0.5 bg-cyan-500/10 border border-cyan-500/25 rounded">
                 <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                 <span className="font-mono text-[10px] tracking-wider uppercase text-cyan-300">
                   {isGuest ? "Guest Session" : "Verified Account"}
                 </span>
               </div>
            </div>
          </div>

          <div className="h-px bg-white/10" />

          <div className="space-y-4">
            <div>
              <p className="font-mono text-[10px] tracking-wider uppercase text-white/50 mb-1">Player ID</p>
              <p className="font-mono text-xs text-white/80 break-all select-all leading-relaxed">
                {userId}
              </p>
            </div>

            <div>
              <p className="font-mono text-[10px] tracking-wider uppercase text-white/50 mb-1">Credit Balance</p>
              <div className="flex items-center justify-between gap-3 px-4 py-3 bg-white/[0.03] border border-white/10 rounded-lg">
                <div className="flex items-center gap-3">
                  <FaCoins className="text-cyan-400 text-sm" />
                  <span className="font-orbitron text-xl font-black text-white tracking-tight">
                    {credits?.toLocaleString()} <span className="text-cyan-400/70 font-bold text-sm">CC</span>
                  </span>
                </div>
                <button 
                  onClick={() => setShowShopModal(true)} 
                  className="w-9 h-9 rounded-lg flex items-center justify-center bg-cyan-500/15 hover:bg-cyan-400 border border-cyan-500/40 hover:text-black transition-all text-base font-orbitron font-black cursor-pointer"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Restoration Panel */}
        <div className="w-full p-6 sm:p-8 bg-white/[0.02] border border-white/10 rounded-xl mb-8 text-left relative">
          <h3 className="font-orbitron text-sm font-bold tracking-[0.15em] uppercase text-cyan-300 mb-4 pb-2 border-b border-white/10">
            Restore Purchased Credits
          </h3>

          {!recoveryStep ? (
            <div className="space-y-4">
              <p className="text-xs leading-relaxed text-white/65">
                Enter the email address used during PayPal or GCash checkout to recover and restore your credit balance.
              </p>
              <input
                type="email"
                placeholder="Billing email address"
                value={recoveryEmail}
                onChange={(e) => setRecoveryEmail(e.target.value)}
                className="w-full py-3 px-4 rounded-lg bg-black/60 border border-white/15 text-cyan-300 font-mono text-base sm:text-xs outline-none"
              />
              <button
                type="button"
                onClick={handleRequestCode}
                disabled={isRecovering}
                className="w-full py-3.5 rounded-lg bg-cyan-950 border border-cyan-500/40 text-cyan-300 font-orbitron font-bold text-xs tracking-wider uppercase hover:bg-cyan-500/15 transition-all disabled:opacity-40 cursor-pointer"
              >
                {isRecovering ? "Sending Verification Code..." : "Send Verification Code"}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-xs leading-relaxed text-amber-300/90">
                Enter the 6-digit verification code sent to <strong>{recoveryEmail}</strong>.
              </p>
              <input
                type="text"
                placeholder="6-digit code"
                maxLength={6}
                value={recoveryCode}
                onChange={(e) => setRecoveryCode(e.target.value)}
                className="w-full py-3 px-4 rounded-lg bg-black/60 border border-white/15 text-cyan-300 font-mono text-base sm:text-sm text-center outline-none tracking-widest"
              />
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => { playSciFiClick(); setRecoveryStep(0); setRecoveryCode(""); }}
                  className="py-3 rounded-lg border border-white/15 font-orbitron text-xs tracking-wider text-white/70 uppercase hover:bg-white/5 cursor-pointer"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleVerifyCode}
                  disabled={isRecovering}
                  className="py-3 rounded-lg bg-cyan-600 border border-cyan-400 text-white font-orbitron font-bold text-xs tracking-wider uppercase hover:bg-cyan-500 transition-all disabled:opacity-40 cursor-pointer"
                >
                  {isRecovering ? "Verifying..." : "Restore Credits"}
                </button>
              </div>
            </div>
          )}

          {recoveryError && (
            <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-center">
              <p className="font-mono text-xs text-red-300 font-semibold">{recoveryError}</p>
            </div>
          )}
          {recoverySuccess && (
            <div className="mt-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-center">
              <p className="font-mono text-xs text-emerald-300 font-semibold">Credits restored to your account!</p>
            </div>
          )}
        </div>

        {/* 4. Actions */}
        <div className="w-full space-y-4">
          <button
            onClick={() => setLocation("/orbit")}
            className="w-full relative group overflow-hidden rounded-xl bg-white text-black font-orbitron font-black text-base sm:text-lg tracking-[0.25em] py-5 uppercase transition-all shadow-[0_0_40px_rgba(255,255,255,0.15)] hover:shadow-[0_0_60px_rgba(255,255,255,0.3)] active:scale-[0.98] cursor-pointer"
          >
            <div className="absolute inset-0 bg-cyan-400 translate-x-[-101%] group-hover:translate-x-0 transition-transform duration-[400ms] ease-out" />
            <span className="relative z-10">Play Errant Night</span>
          </button>
          
          <button
            onClick={handleLogout}
            className="w-full py-4 rounded-xl border border-red-500/25 hover:border-red-500/50 font-orbitron font-bold text-xs tracking-[0.25em] uppercase hover:bg-red-500/10 transition-all text-red-400 hover:text-red-300 cursor-pointer"
          >
            {isGuest ? "Reset Guest Profile" : "Sign Out"}
          </button>
        </div>
      </div>

      <ShopModal isOpen={showShopModal} onClose={() => setShowShopModal(false)} />
      <SettingsModal isOpen={showSettingsModal} onClose={() => setShowSettingsModal(false)} />

      {/* Scanline Effect Overlay */}
      <div className="fixed inset-0 pointer-events-none z-50 opacity-[0.05] overflow-hidden">
        <div className="w-full h-1 bg-cyan-500 absolute -top-1 animate-[scan_8s_linear_infinite]" />
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes scan {
          from { top: -2%; }
          to { top: 102%; }
        }
      `}} />
    </div>
  );
}

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
  const { isLoggedIn, username, userId, logout, credits, refreshUser } = useAuth();
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
      <div className="max-w-xl mx-auto w-full px-6 pt-16 pb-24 relative z-10 flex flex-col items-center text-center">
        
        {/* 1. Identity Header */}
        <div className="mb-8">
           <div className="w-1.5 h-6 bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.5)] mx-auto mb-4" />
           <h2 className="font-orbitron font-black text-xl tracking-[0.3em] uppercase opacity-40 mb-2">
             Profile Terminal
           </h2>
        </div>

        {/* 2. Identity card */}
        <div className="w-full p-8 bg-white/[0.02] border border-white/10 rounded-sm mb-6 text-left relative">
          <div className="absolute top-0 right-0 p-3 font-mono text-[8px] opacity-25">OPERATOR_LOG</div>
          
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 border border-white/10 bg-white/[0.02] p-1 overflow-hidden shrink-0">
               <img 
                src={`https://api.dicebear.com/7.x/bottts/svg?seed=${username ?? 'operator'}&backgroundColor=transparent`} 
                alt={username ?? 'Operator'}
                className="w-full h-full object-cover opacity-60"
               />
            </div>
            <div className="min-w-0">
               <h1 className="font-orbitron font-bold text-2xl tracking-[0.1em] uppercase text-white/90 truncate">{username}</h1>
               <div className="inline-flex items-center gap-2 mt-1 px-2 py-0.5 bg-cyan-500/10 border border-cyan-500/20 rounded-sm">
                 <div className="w-1 h-1 rounded-full bg-cyan-400 animate-pulse" />
                 <span className="font-mono text-[8px] tracking-widest uppercase text-cyan-400/80">
                   GUEST SESSION
                 </span>
               </div>
            </div>
          </div>

          <div className="h-px bg-white/5" />

          <div className="space-y-4">
            <div>
              <p className="font-mono text-[8px] tracking-widest uppercase opacity-30 mb-1">Guest UUID</p>
              <p className="font-mono text-[11px] text-white/70 break-all select-all leading-relaxed">
                {userId}
              </p>
            </div>

            <div>
              <p className="font-mono text-[8px] tracking-widest uppercase opacity-30 mb-1">Balance</p>
              <div className="flex items-center justify-between gap-3 px-4 py-3 bg-white/[0.02] border border-white/5">
                <div className="flex items-center gap-3">
                  <FaCoins className="text-cyan-500/40 text-xs" />
                  <span className="font-orbitron text-xl font-black text-white/90 tracking-tighter">
                    {credits?.toLocaleString()} <span className="text-cyan-500/40 font-bold text-sm">CC</span>
                  </span>
                </div>
                <button 
                  onClick={() => setShowShopModal(true)} 
                  className="w-8 h-8 flex items-center justify-center bg-cyan-500/10 hover:bg-cyan-500 border border-cyan-500/30 hover:text-black transition-all text-sm font-orbitron font-black"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Restoration Panel */}
        <div className="w-full p-8 bg-white/[0.02] border border-white/10 rounded-sm mb-8 text-left relative">
          <div className="absolute top-0 right-0 p-3 font-mono text-[8px] opacity-25">RECOVERY_TERMINAL</div>
          <h3 className="font-orbitron text-sm font-bold tracking-[0.2em] uppercase text-white/80 mb-4 pb-2 border-b border-white/5">
            Coin Restoration
          </h3>

          {!recoveryStep ? (
            <div className="space-y-4">
              <p className="font-mono text-[9px] leading-relaxed uppercase text-white/40">
                Enter the email address used during PayPal or GCash checkout to recover and restore your coin balance.
              </p>
              <input
                type="email"
                placeholder="ENTER BILLING EMAIL..."
                value={recoveryEmail}
                onChange={(e) => setRecoveryEmail(e.target.value)}
                className="w-full py-3 px-4 bg-black/60 border border-white/10 text-cyan-400 font-mono text-xs outline-none tracking-widest uppercase"
              />
              <button
                type="button"
                onClick={handleRequestCode}
                disabled={isRecovering}
                className="w-full py-3.5 bg-cyan-950 border border-cyan-500/40 text-cyan-400 font-orbitron font-bold text-[11px] tracking-widest uppercase hover:bg-cyan-500/10 transition-all disabled:opacity-40"
              >
                {isRecovering ? "DISPATCHING RESTORATION CODE..." : "SEND RESTORATION CODE"}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="font-mono text-[9px] leading-relaxed uppercase text-amber-500/80">
                Restoration protocol initialized. Enter the 6-digit code sent to {recoveryEmail}.
              </p>
              <input
                type="text"
                placeholder="ENTER 6-DIGIT CODE..."
                maxLength={6}
                value={recoveryCode}
                onChange={(e) => setRecoveryCode(e.target.value)}
                className="w-full py-3 px-4 bg-black/60 border border-white/10 text-cyan-400 font-mono text-sm text-center outline-none tracking-widest"
              />
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => { playSciFiClick(); setRecoveryStep(0); setRecoveryCode(""); }}
                  className="py-3 border border-white/10 font-orbitron text-[10px] tracking-widest text-white/40 uppercase hover:bg-white/5"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleVerifyCode}
                  disabled={isRecovering}
                  className="py-3 bg-cyan-600 border border-cyan-400 text-white font-orbitron font-bold text-[10px] tracking-widest uppercase hover:bg-cyan-500 transition-all disabled:opacity-40"
                >
                  {isRecovering ? "VERIFYING..." : "RESTORE BALANCE"}
                </button>
              </div>
            </div>
          )}

          {recoveryError && (
            <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 text-center">
              <p className="font-mono text-[10px] text-red-400 uppercase font-bold">{recoveryError}</p>
            </div>
          )}
          {recoverySuccess && (
            <div className="mt-4 p-3 bg-green-500/10 border border-green-500/20 text-center">
              <p className="font-mono text-[10px] text-green-400 uppercase font-bold">Protocol successful. Coins merged!</p>
            </div>
          )}
        </div>

        {/* 4. Actions */}
        <div className="w-full space-y-4">
          <button
            onClick={() => setLocation("/orbit")}
            className="w-full relative group overflow-hidden bg-white text-black font-orbitron font-black text-base sm:text-lg tracking-[0.4em] sm:tracking-[0.8em] py-6 uppercase transition-all shadow-[0_0_50px_rgba(255,255,255,0.15)] hover:shadow-[0_0_80px_rgba(255,255,255,0.3)] active:scale-[0.97]"
          >
            <div className="absolute inset-0 bg-cyan-400 translate-x-[-101%] group-hover:translate-x-0 transition-transform duration-[400ms] ease-out" />
            <span className="relative z-10">Deploy_To_Orbit</span>
          </button>
          
          <button
            onClick={handleLogout}
            className="w-full py-4 border border-red-500/20 hover:border-red-500/50 font-orbitron text-[10px] tracking-[0.4em] uppercase hover:bg-red-500/10 transition-all text-red-500/60 hover:text-red-500"
          >
            Reset Guest Profile
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

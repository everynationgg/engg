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

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      playSciFiClick();
      refreshUser().finally(() => setLoading(false));
    }
  }, [isOpen, refreshUser]);

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
                        {credits} <span className="text-xs text-cyan-500/40 font-bold">CC</span>
                      </p>
                    </div>
                  </div>
                </div>
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

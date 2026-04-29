import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRecordGameResult } from "@/hooks/useRecordGameResult";
import { useAchievements } from "@/hooks/useAchievements";
import { ROLES } from "@/data/roles";
import { playSciFiClick } from "@/lib/sound";

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function formatRoleName(roleId?: string | null): string {
  if (!roleId) return "Unknown";
  const role = ROLES.find((r) => r.id === roleId);
  if (role) return role.name;
  return roleId
    .split(/[_-]/g)
    .map((part) => part ? part[0].toUpperCase() + part.slice(1) : "")
    .join(" ");
}

export default function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  const { username, userId, isVerified, logout, resendVerificationEmail, refreshUser, isLoading: authLoading } = useAuth();
  const { personalStats, roleStats, fetchPersonalStats, fetchRoleStats } = useRecordGameResult();
  const { achievements } = useAchievements();
  const [loading, setLoading] = useState(true);
  const [resendError, setResendError] = useState<string | null>(null);
  const [resendSuccess, setResendSuccess] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      playSciFiClick();
      // Always refresh user identity state to prevent stale verification status
      Promise.all([refreshUser(), fetchPersonalStats(), fetchRoleStats()]).finally(() => setLoading(false));
    }
  }, [isOpen, refreshUser, fetchPersonalStats, fetchRoleStats]);

  const handleResendVerificationEmail = async () => {
    setResendError(null);
    setResendSuccess(false);
    try {
      await resendVerificationEmail();
      setResendSuccess(true);
      setTimeout(() => setResendSuccess(false), 5000);
    } catch (err) {
      setResendError(err instanceof Error ? err.message : "Failed to resend email");
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
              <div className="flex items-center gap-2 px-2 py-0.5 bg-white/5 border border-white/10 rounded-sm">
                <div className={`w-1.5 h-1.5 rounded-full ${isVerified ? "bg-cyan-500 animate-pulse" : "bg-amber-500"}`} />
                <span className="font-mono text-[8px] tracking-widest uppercase opacity-40">
                  {isVerified ? "SECURED" : "PENDING"}
                </span>
              </div>
            </div>

            {!isVerified && (
              <div className="mt-6 p-4 bg-amber-500/5 border border-amber-500/20 flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-orbitron text-[9px] tracking-[0.1em] uppercase text-amber-500 mb-1">
                    Identity Unverified
                  </p>
                  {resendError && <p className="font-mono text-[8px] text-red-400">{resendError.toUpperCase()}</p>}
                  {resendSuccess && <p className="font-mono text-[8px] text-cyan-400">TRANSMISSION SENT</p>}
                </div>
                <button
                  onClick={handleResendVerificationEmail}
                  disabled={authLoading}
                  className="px-4 py-1.5 border border-amber-500/40 text-amber-500 font-orbitron text-[9px] tracking-[0.2em] uppercase hover:bg-amber-500/10 transition-all disabled:opacity-30"
                >
                  {authLoading ? "---" : "REVERIFY"}
                </button>
              </div>
            )}
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-12 h-12 border-2 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin" />
              <p className="mt-4 font-mono text-[10px] tracking-widest uppercase opacity-40">Accessing Data...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Overall Stats HUD */}
              <div className="p-6 bg-white/5 border border-white/5 relative">
                <div className="absolute top-0 right-0 p-2 font-mono text-[8px] opacity-20">STATS_v2.1</div>
                <h3 className="font-orbitron text-[10px] tracking-[0.3em] uppercase opacity-40 mb-6 border-b border-white/5 pb-2">Operational Data</h3>
                
                <div className="grid grid-cols-2 gap-8">
                  <div>
                    <p className="font-mono text-[9px] uppercase opacity-40 mb-1">Win Rate</p>
                    <p className="font-orbitron text-2xl text-cyan-400">
                      {(personalStats?.winRate ?? 0).toFixed(1)}%
                    </p>
                    <div className="h-1 w-full bg-white/5 mt-2 overflow-hidden">
                       <div className="h-full bg-cyan-500" style={{ width: `${personalStats?.winRate ?? 0}%` }} />
                    </div>
                  </div>
                  <div>
                    <p className="font-mono text-[9px] uppercase opacity-40 mb-1">Engagements</p>
                    <p className="font-orbitron text-2xl">{personalStats?.gamesPlayed ?? 0}</p>
                    <div className="flex gap-4 mt-2 font-mono text-[9px]">
                       <span className="text-cyan-400/60">W: {personalStats?.gamesWon ?? 0}</span>
                       <span className="text-red-400/60">L: {personalStats?.gamesLost ?? 0}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Achievements HUD */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-white/5 border border-white/5">
                  <p className="font-mono text-[9px] uppercase opacity-40 mb-1">Achievements</p>
                  <p className="font-orbitron text-lg text-cyan-400">
                    {achievements?.unlockedCount}/{achievements?.totalAchievements}
                  </p>
                </div>
                {roleStats && roleStats.length > 0 && (
                  <div className="p-4 bg-white/5 border border-white/5">
                    <p className="font-mono text-[9px] uppercase opacity-40 mb-1">Top Role</p>
                    <p className="font-orbitron text-lg truncate">
                      {formatRoleName([...roleStats].sort((a, b) => (b.gamesPlayed || 0) - (a.gamesPlayed || 0))[0]?.role)}
                    </p>
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
                    window.location.href = "/?login=true";
                  }}
                  className="w-full py-3 border border-red-500/20 hover:border-red-500/50 font-orbitron text-[10px] tracking-[0.4em] uppercase hover:bg-red-500/10 transition-all text-red-500/60 hover:text-red-500"
                >
                  Terminate_Session
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

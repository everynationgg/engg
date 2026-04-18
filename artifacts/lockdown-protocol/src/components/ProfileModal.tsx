import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRecordGameResult } from "@/hooks/useRecordGameResult";
import { useAchievements } from "@/hooks/useAchievements";
import { ROLES } from "@/data/roles";

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
  const { username, userId, isVerified, resendVerificationEmail, isLoading: authLoading } = useAuth();
  const { personalStats, roleStats, fetchPersonalStats, fetchRoleStats } = useRecordGameResult();
  const { achievements } = useAchievements();
  const [loading, setLoading] = useState(true);
  const [resendError, setResendError] = useState<string | null>(null);
  const [resendSuccess, setResendSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      Promise.all([fetchPersonalStats(), fetchRoleStats()]).finally(() => setLoading(false));
    }
  }, [isOpen, fetchPersonalStats, fetchRoleStats]);

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
      className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6"
      style={{ background: "hsl(220 30% 4% / 0.9)" }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg max-h-96 overflow-y-auto rounded-lg"
        style={{
          border: "1px solid hsl(185 100% 50% / 0.4)",
          boxShadow: "0 0 40px hsl(185 100% 50% / 0.2)",
          background: "hsl(220 28% 4%)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded font-orbitron font-bold text-sm cursor-pointer hover:opacity-80 transition-opacity"
          style={{
            background: "hsl(220 28% 10% / 0.9)",
            border: "1px solid hsl(210 30% 25%)",
            color: "hsl(190 60% 70%)",
          }}
          aria-label="Close"
        >
          ✕
        </button>

        {/* Content */}
        <div className="p-6">
          {/* Header */}
          <div className="mb-6">
            <h2 className="font-orbitron font-bold text-2xl tracking-[0.2em] uppercase" style={{ color: "hsl(185 100% 50%)" }}>
              📊 PROFILE
            </h2>
            <p className="font-orbitron text-lg tracking-[0.2em] uppercase mt-2" style={{ color: "hsl(185 100% 60%)" }}>
              {username}
            </p>
            {!isVerified && (
              <div className="mt-3 rounded p-3" style={{ background: "hsl(40 90% 12%)", border: "1px solid hsl(40 100% 50%)" }}>
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="font-orbitron text-xs tracking-[0.1em] uppercase" style={{ color: "hsl(40 100% 60%)" }}>
                      ⚠️ Email not verified
                    </p>
                    {resendError && <p className="font-orbitron text-xs text-red-400 mt-1">{resendError}</p>}
                    {resendSuccess && <p className="font-orbitron text-xs text-cyan-400 mt-1">✓ Verification email sent!</p>}
                  </div>
                  <button
                    onClick={handleResendVerificationEmail}
                    disabled={authLoading}
                    className="px-3 py-1 font-orbitron text-xs tracking-[0.1em] uppercase rounded border transition-all whitespace-nowrap disabled:opacity-50"
                    style={{
                      borderColor: "hsl(40 100% 50%)",
                      color: "hsl(40 100% 60%)",
                      background: "hsl(220 28% 12%)",
                    }}
                    onMouseEnter={(e) => {
                      if (!authLoading) {
                        e.currentTarget.style.borderColor = "hsl(40 100% 70%)";
                        e.currentTarget.style.color = "hsl(40 100% 70%)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "hsl(40 100% 50%)";
                      e.currentTarget.style.color = "hsl(40 100% 60%)";
                    }}
                  >
                    {authLoading ? "SENDING..." : "REVERIFY"}
                  </button>
                </div>
              </div>
            )}
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div
                className="w-6 h-6 mx-auto mb-3 border-3 border-transparent rounded-full animate-spin"
                style={{
                  borderTopColor: "hsl(185 100% 50%)",
                  borderRightColor: "hsl(270 70% 60%)",
                }}
              />
              <p className="font-orbitron text-xs" style={{ color: "hsl(210 30% 60%)" }}>
                Loading profile...
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Personal Stats */}
              {personalStats && (
                <div className="rounded-lg p-3" style={{ background: "hsl(220 28% 9%)", border: "1px solid hsl(210 30% 25%)" }}>
                  <h3 className="font-orbitron text-xs tracking-[0.1em] uppercase mb-3" style={{ color: "hsl(185 100% 60%)" }}>
                    Overall Stats
                  </h3>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <p style={{ color: "hsl(210 30% 60%)" }}>Games Played</p>
                      <p className="font-orbitron font-bold text-lg" style={{ color: "hsl(185 100% 50%)" }}>
                        {personalStats.gamesPlayed || 0}
                      </p>
                    </div>
                    <div>
                      <p style={{ color: "hsl(210 30% 60%)" }}>Win Rate</p>
                      <p className="font-orbitron font-bold text-lg" style={{ color: "hsl(120 100% 50%)" }}>
                        {personalStats.winRate ? `${(personalStats.winRate * 100).toFixed(1)}%` : "0%"}
                      </p>
                    </div>
                    <div>
                      <p style={{ color: "hsl(210 30% 60%)" }}>Wins</p>
                      <p className="font-orbitron font-bold" style={{ color: "hsl(120 100% 50%)" }}>
                        {personalStats.gamesWon || 0}
                      </p>
                    </div>
                    <div>
                      <p style={{ color: "hsl(210 30% 60%)" }}>Losses</p>
                      <p className="font-orbitron font-bold" style={{ color: "hsl(0 75% 60%)" }}>
                        {personalStats.gamesLost || 0}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Achievements Preview */}
              {achievements && (
                <div className="rounded-lg p-3" style={{ background: "hsl(220 28% 9%)", border: "1px solid hsl(210 30% 25%)" }}>
                  <h3 className="font-orbitron text-xs tracking-[0.1em] uppercase mb-2" style={{ color: "hsl(270 100% 60%)" }}>
                    Achievements
                  </h3>
                  <p className="font-orbitron text-sm" style={{ color: "hsl(185 100% 50%)" }}>
                    {achievements.unlockedCount}/{achievements.totalAchievements}
                  </p>
                </div>
              )}
            {/* Top Role Stats */}
            {roleStats && roleStats.length > 0 && (
            <div className="rounded-lg p-3" style={{ background: "hsl(220 28% 9%)", border: "1px solid hsl(210 30% 25%)" }}>
                <h3 className="font-orbitron text-xs tracking-[0.1em] uppercase mb-2" style={{ color: "hsl(270 100% 60%)" }}>
                Most Played Role
                </h3>
                <div className="space-y-1 text-xs">
                {[...roleStats]
                    .sort((a, b) => (b.gamesPlayed || 0) - (a.gamesPlayed || 0))
                    .slice(0, 3)
                    .map((stats) => (
                    <div key={stats.role} className="flex justify-between">
                      <span style={{ color: "hsl(210 30% 60%)" }}>{formatRoleName(stats.role)}</span>
                        <span style={{ color: "hsl(185 100% 50%)" }}>
                      {stats.gamesPlayed || 0} games · {stats.winRate ? `${(stats.winRate * 100).toFixed(0)}%` : "0%"} WR
                        </span>
                    </div>
                    ))}
                </div>
            </div>
            )}
              {/* Close Button */}
              <div className="pt-2">
                <button
                  onClick={onClose}
                  className="w-full py-2 font-orbitron font-bold text-xs tracking-[0.2em] uppercase rounded border-2 transition-all duration-150"
                  style={{
                    background: "hsl(210 30% 20%)",
                    borderColor: "hsl(210 30% 35%)",
                    color: "hsl(210 30% 60%)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "hsl(210 30% 25%)";
                    e.currentTarget.style.borderColor = "hsl(210 30% 50%)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "hsl(210 30% 20%)";
                    e.currentTarget.style.borderColor = "hsl(210 30% 35%)";
                  }}
                >
                  CLOSE
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

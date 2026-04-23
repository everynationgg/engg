import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useRecordGameResult } from "@/hooks/useRecordGameResult";
import { useAchievements } from "@/hooks/useAchievements";
import { useFriends } from "@/hooks/useFriends";
import RoleStatsDisplay from "@/components/RoleStatsDisplay";
import GameHistoryDisplay from "@/components/GameHistoryDisplay";
import AggregateStats from "@/components/AggregateStats";
import { AchievementsDisplay } from "@/components/AchievementsDisplay";
import { FriendsDisplay } from "@/components/FriendsDisplay";
import HamburgerMenu from "@/components/HamburgerMenu";
import SettingsModal from "@/components/SettingsModal";
import { playSciFiClick } from "@/lib/sound";
import { getSoundEnabled, setSoundEnabled, startLobbyMusic, stopLobbyMusic } from "@/lib/music";
import { useEffect, useState, useMemo } from "react";

export default function ProfilePage() {
  const [, setLocation] = useLocation();
  const { isLoggedIn, username, userId, logout, isVerified, resendVerificationEmail, refreshUser, isLoading: authLoading } = useAuth();
  const { personalStats, roleStats, gameHistory, gameHistoryTotal, leaderboard, fetchLeaderboard, fetchPersonalStats, fetchRoleStats, fetchGameHistory } = useRecordGameResult();
  const { achievements, isLoading: achievementsLoading } = useAchievements();
  const { friends, friendRequests, searchResults, isLoading: friendsLoading, isSearching, sendFriendRequest, acceptFriendRequest, declineFriendRequest, removeFriend, searchFriends } = useFriends();
  const [historyPage, setHistoryPage] = useState(0);
  const [resendError, setResendError] = useState<string | null>(null);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [musicOn, setMusicOn] = useState<boolean>(getSoundEnabled);

  const handleToggleMusic = () => {
    const next = !musicOn;
    setMusicOn(next);
    setSoundEnabled(next);
    if (next) {
      startLobbyMusic();
    } else {
      stopLobbyMusic();
    }
  };

  useEffect(() => {
    if (!isLoggedIn) {
      setLocation("/");
      return;
    }
    refreshUser();
    fetchPersonalStats();
    fetchRoleStats();
    fetchLeaderboard();
    fetchGameHistory(20, 0);
  }, [isLoggedIn, setLocation, refreshUser, fetchLeaderboard, fetchPersonalStats, fetchRoleStats, fetchGameHistory]);

  const handleLogout = () => {
    playSciFiClick();
    logout();
    setLocation("/");
  };

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

  if (!isLoggedIn) return null;

  return (
    <div className="min-h-screen text-white p-4 md:p-8 relative overflow-x-hidden" style={{ background: "hsl(220 28% 2%)" }}>
      {/* Cinematic Overlays */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] z-0" 
        style={{ backgroundImage: "linear-gradient(#00f3ff 1px, transparent 1px), linear-gradient(90deg, #00f3ff 1px, transparent 1px)", backgroundSize: "60px 60px" }} 
      />
      <div className="fixed inset-0 pointer-events-none bg-gradient-to-b from-transparent via-cyan-500/5 to-transparent animate-pulse" />

      <HamburgerMenu
        onShowSettings={() => setShowSettingsModal(true)}
        onShowProfile={() => {}}
        onShowHowToPlay={() => {}}
        musicOn={musicOn}
        onToggleMusic={handleToggleMusic}
        playSound={playSciFiClick}
      />

      <SettingsModal isOpen={showSettingsModal} onClose={() => setShowSettingsModal(false)} />

      {/* --- HUD HEADER --- */}
      <div className="max-w-6xl mx-auto mb-12 relative z-10">
        <div className="flex flex-col md:flex-row items-end justify-between gap-6 pb-6 border-b border-white/10">
          <div className="relative group">
            <div className="absolute -left-6 top-1/2 -translate-y-1/2 w-1 h-12 bg-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.5)]" />
            <h1 className="font-orbitron font-black text-4xl md:text-6xl tracking-[0.2em] uppercase mb-1 drop-shadow-sm">
              Operator
            </h1>
            <div className="flex items-center gap-4">
              <span className="font-mono text-cyan-400 text-lg tracking-[0.5em] uppercase">
                {username}
              </span>
              <div className="flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-sm">
                <div className={`w-2 h-2 rounded-full ${isVerified ? "bg-cyan-500 animate-pulse" : "bg-amber-500"}`} />
                <span className="font-mono text-[9px] tracking-widest uppercase opacity-60">
                  {isVerified ? "Identity Verified" : "Verification Pending"}
                </span>
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => { playSciFiClick(); setLocation("/"); }}
              className="px-8 py-3 font-orbitron text-[10px] tracking-[0.3em] uppercase border border-white/20 hover:border-cyan-500/50 hover:bg-cyan-500/5 transition-all"
            >
              Command Center
            </button>
            <button
              onClick={handleLogout}
              className="px-8 py-3 font-orbitron text-[10px] tracking-[0.3em] uppercase border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-all"
            >
              Sign Out
            </button>
          </div>
        </div>

        {/* Verification Warning HUD */}
        {!isVerified && (
          <div className="mt-6 p-6 bg-amber-500/5 border border-amber-500/20 rounded-sm flex flex-col md:flex-row items-center justify-between gap-4 animate-in fade-in slide-in-from-top-4">
            <div className="flex items-center gap-4">
              <div className="text-2xl text-amber-500">⚠️</div>
              <div>
                <p className="font-orbitron text-xs tracking-widest uppercase text-amber-500 mb-1">Critical: Identity Desync Detected</p>
                <p className="font-mono text-[10px] opacity-60 uppercase">Secure your connection via email link to unlock full operator privileges.</p>
                {resendError && <p className="text-[10px] text-red-500 mt-2 font-mono">ERROR: {resendError.toUpperCase()}</p>}
                {resendSuccess && <p className="text-[10px] text-cyan-400 mt-2 font-mono">LINK TRANSMITTED. CHECK TERMINAL.</p>}
              </div>
            </div>
            <button
              onClick={handleResendVerificationEmail}
              disabled={authLoading}
              className="px-6 py-2 bg-amber-500/10 border border-amber-500/40 text-amber-500 font-orbitron text-[10px] tracking-[0.2em] uppercase hover:bg-amber-500/20 transition-all disabled:opacity-30"
            >
              {authLoading ? "Transmitting..." : "Re-Initialize Link"}
            </button>
          </div>
        )}
      </div>

      {/* --- MAIN GRID --- */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10">
        
        {/* LEFT COLUMN: PRIMARY STATS */}
        <div className="lg:col-span-4 space-y-8">
          {/* Identity HUD Card */}
          <div className="p-8 relative bg-white/5 border border-white/10 backdrop-blur-md overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 border-t border-r border-cyan-500/30" />
            <h2 className="font-orbitron text-xs tracking-[0.4em] uppercase opacity-40 mb-8 border-b border-white/5 pb-2">Status Readout</h2>
            
            <div className="space-y-6">
              <div>
                <p className="font-mono text-[9px] text-white/30 uppercase mb-2">Operational Win Rate</p>
                <div className="flex items-end gap-3">
                  <span className="font-orbitron text-4xl text-cyan-400 drop-shadow-[0_0_10px_rgba(6,182,212,0.3)]">
                    {(personalStats?.winRate ?? 0).toFixed(1)}%
                  </span>
                  <div className="flex-1 h-1 bg-white/10 mb-2 relative overflow-hidden">
                    <div 
                      className="absolute inset-y-0 left-0 bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.5)] transition-all duration-1000"
                      style={{ width: `${personalStats?.winRate ?? 0}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
                <div>
                  <p className="font-mono text-[9px] text-white/30 uppercase mb-1">Engagements</p>
                  <p className="font-orbitron text-xl">{personalStats?.gamesPlayed ?? 0}</p>
                </div>
                <div>
                  <p className="font-mono text-[9px] text-white/30 uppercase mb-1">Successes</p>
                  <p className="font-orbitron text-xl text-cyan-400">{personalStats?.gamesWon ?? 0}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Leaderboard Panel */}
          <div className="bg-black/20 border border-white/5 p-6">
            <h2 className="font-orbitron text-[10px] tracking-[0.4em] uppercase opacity-40 mb-6 flex justify-between items-center">
              Global Standings
              <span className="animate-pulse text-cyan-500">Live</span>
            </h2>
            <div className="space-y-2">
              {leaderboard?.slice(0, 5).map((entry) => (
                <div key={entry.userId} className={`p-3 border flex items-center justify-between transition-all ${entry.userId === userId ? "border-cyan-500/50 bg-cyan-500/5" : "border-white/5 bg-white/5"}`}>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-[10px] w-4 opacity-40">#{entry.rank}</span>
                    <span className="font-mono text-xs tracking-tight">{entry.username}</span>
                  </div>
                  <span className="font-mono text-[10px] text-cyan-400">{entry.winRate.toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: DETAILED DATA */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Aggregate Stats Section */}
          <div className="bg-white/5 border border-white/10 p-1">
            <AggregateStats personalStats={personalStats} roleStats={roleStats} />
          </div>

          {/* Network (Friends) Node */}
          <div className="p-8 bg-white/5 border border-white/10 relative">
             <div className="absolute top-0 right-0 p-2 font-mono text-[8px] opacity-20">REL_ADDR: 0x21A</div>
             <FriendsDisplay
                friends={friends}
                friendRequests={friendRequests}
                isLoading={friendsLoading}
                onRemoveFriend={removeFriend}
                onAcceptRequest={acceptFriendRequest}
                onDeclineRequest={declineFriendRequest}
                onSendRequest={sendFriendRequest}
                onSearchChange={searchFriends}
                searchResults={searchResults}
                isSearching={isSearching}
              />
          </div>

          {/* Achievement Vault */}
          <div className="bg-white/5 border border-white/10">
            {achievements && (
              <AchievementsDisplay
                totalAchievements={achievements.totalAchievements}
                unlockedCount={achievements.unlockedCount}
                achievements={achievements.achievements}
                isLoading={achievementsLoading}
              />
            )}
          </div>

          {/* Historical Logs */}
          <div className="bg-white/5 border border-white/10">
             <GameHistoryDisplay
              games={gameHistory}
              canLoadMore={(historyPage + 1) * 20 < gameHistoryTotal}
              onLoadMore={() => {
                const nextPage = historyPage + 1;
                setHistoryPage(nextPage);
                fetchGameHistory(20, nextPage * 20);
              }}
            />
          </div>
        </div>
      </div>

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

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
      <div className="max-w-6xl mx-auto mb-16 relative z-10">
        <div className="flex flex-col lg:flex-row items-start lg:items-end justify-between gap-10 pb-10 border-b border-white/5 relative">
          {/* Decorative HUD line */}
          <div className="absolute bottom-0 left-0 w-1/3 h-[2px] bg-cyan-500/50 shadow-[0_0_15px_rgba(0,243,255,0.3)]" />
          
          <div className="relative group">
            <div className="flex items-center gap-6 mb-4">
               <div className="w-1.5 h-12 bg-cyan-500 shadow-[0_0_20px_rgba(6,182,212,0.6)]" />
               <div>
                  <h1 className="font-orbitron font-black text-5xl md:text-7xl tracking-[0.3em] uppercase leading-none drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]">
                    Operator
                  </h1>
                  <p className="font-mono text-[10px] tracking-[0.5em] uppercase opacity-30 mt-2">Authenticated_Session_Active</p>
               </div>
            </div>

            <div className="flex flex-wrap items-center gap-6">
              <span className="font-mono text-cyan-400 text-2xl tracking-[0.4em] uppercase border-b border-cyan-500/20 pb-1">
                {username}
              </span>
              
              {/* Premium Verification Stamp */}
              <div className={`relative px-6 py-2 flex items-center gap-3 overflow-hidden transition-all duration-500 ${isVerified ? "bg-cyan-500/10 border border-cyan-500/30" : "bg-amber-500/10 border border-amber-500/30"}`}>
                 {/* Stamp HUD Brackets */}
                 <div className={`absolute top-0 left-0 w-2 h-2 border-t border-l ${isVerified ? "border-cyan-400" : "border-amber-400"}`} />
                 <div className={`absolute top-0 right-0 w-2 h-2 border-t border-r ${isVerified ? "border-cyan-400" : "border-amber-400"}`} />
                 <div className={`absolute bottom-0 left-0 w-2 h-2 border-b border-l ${isVerified ? "border-cyan-400" : "border-amber-400"}`} />
                 <div className={`absolute bottom-0 right-0 w-2 h-2 border-b border-r ${isVerified ? "border-cyan-400" : "border-amber-400"}`} />
                 
                 <div className={`w-2 h-2 rounded-full ${isVerified ? "bg-cyan-400 shadow-[0_0_10px_#00f3ff] animate-pulse" : "bg-amber-400 shadow-[0_0_10px_#ffaa00]"}`} />
                 <span className={`font-orbitron text-[9px] font-bold tracking-[0.3em] uppercase ${isVerified ? "text-cyan-400" : "text-amber-400"}`}>
                   {isVerified ? "Identity_Certified" : "Identity_Unverified"}
                 </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 w-full lg:w-auto">
            <button
              onClick={() => { playSciFiClick(); setLocation("/"); }}
              className="flex-1 lg:flex-none px-10 py-4 bg-white/5 border border-white/10 text-white/60 font-orbitron text-[10px] tracking-[0.4em] uppercase hover:bg-cyan-500/10 hover:border-cyan-500/40 hover:text-cyan-400 transition-all group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              HQ_Terminal
            </button>
            <button
              onClick={handleLogout}
              className="flex-1 lg:flex-none px-10 py-4 bg-red-500/5 border border-red-500/20 text-red-400/60 font-orbitron text-[10px] tracking-[0.4em] uppercase hover:bg-red-500/10 hover:border-red-500/40 hover:text-red-400 transition-all"
            >
              Terminate_Session
            </button>
          </div>
        </div>

        {/* Verification Warning HUD */}
        {!isVerified && (
          <div className="mt-8 p-8 bg-amber-500/5 border border-amber-500/10 relative overflow-hidden group animate-in fade-in slide-in-from-top-4">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,170,0,0.05),transparent)] opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
              <div className="flex items-center gap-6">
                <div className="w-12 h-12 flex items-center justify-center border border-amber-500/30 bg-amber-500/10 rounded-full animate-pulse text-amber-500">
                   ⚠️
                </div>
                <div>
                  <h3 className="font-orbitron text-sm tracking-[0.3em] uppercase text-amber-500 mb-2">Critical: Identity Desync Detected</h3>
                  <p className="font-mono text-[10px] opacity-40 uppercase tracking-widest leading-relaxed max-w-xl">
                    Secure your connection via encrypted email handshake to unlock full operator privileges and global classification data.
                  </p>
                  {resendError && <p className="text-[10px] text-red-500 mt-3 font-mono border-l-2 border-red-500 pl-3 uppercase tracking-tighter">Handshake_Error: {resendError}</p>}
                  {resendSuccess && <p className="text-[10px] text-cyan-400 mt-3 font-mono border-l-2 border-cyan-500 pl-3 uppercase tracking-tighter">Link_Transmitted. Check_Terminal.</p>}
                </div>
              </div>
              <button
                onClick={handleResendVerificationEmail}
                disabled={authLoading}
                className="w-full md:w-auto px-10 py-4 bg-amber-500/10 border border-amber-500/40 text-amber-500 font-orbitron text-[10px] tracking-[0.4em] uppercase hover:bg-amber-500/20 transition-all disabled:opacity-20 relative overflow-hidden"
              >
                {authLoading ? "Synchronizing..." : "Re-Initialize_Link"}
              </button>
            </div>
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

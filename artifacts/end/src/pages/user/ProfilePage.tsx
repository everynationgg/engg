import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useRecordGameResult } from "@/hooks/useRecordGameResult";
import { useAchievements } from "@/hooks/useAchievements";
import { useFriends } from "@/hooks/useFriends";
import RoleStatsDisplay from "@/components/profile/RoleStatsDisplay";
import GameHistoryDisplay from "@/components/profile/GameHistoryDisplay";
import AggregateStats from "@/components/profile/AggregateStats";
import { AchievementsDisplay } from "@/components/profile/AchievementsDisplay";
import { FriendsDisplay } from "@/components/profile/FriendsDisplay";
import SettingsModal from "@/components/system/SettingsModal";
import { playSciFiClick } from "@/lib/sound";
import { FaCoins } from "react-icons/fa";
import ShopModal from "@/components/shop/ShopModal";
import { useEffect, useState, useMemo } from "react";
import LandingNavbar from "@/components/system/LandingNavbar";
import { usePreferences } from "@/hooks/usePreferences";

export default function ProfilePage() {
  const [, setLocation] = useLocation();
  const { isLoggedIn, username, userId, logout, isVerified, credits, resendVerificationEmail, refreshUser, isLoading: authLoading } = useAuth();
  const { personalStats, roleStats, gameHistory, gameHistoryTotal, leaderboard, fetchLeaderboard, fetchPersonalStats, fetchRoleStats, fetchGameHistory } = useRecordGameResult();
  const { achievements, isLoading: achievementsLoading } = useAchievements();
  const { friends, friendRequests, searchResults, isLoading: friendsLoading, isSearching, sendFriendRequest, acceptFriendRequest, declineFriendRequest, removeFriend, searchFriends } = useFriends();
  const [historyPage, setHistoryPage] = useState(0);
  const [resendError, setResendError] = useState<string | null>(null);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showShopModal, setShowShopModal] = useState(false);
  const { preferences, updateMusicVolume } = usePreferences();
  const musicOn = (preferences?.musicVolume ?? 0) > 0;
  
  const handleToggleMusic = () => {
    updateMusicVolume(musicOn ? 0 : 100);
  };

  // --- PROGRESSION LOGIC ---
  const currentXP = useMemo(() => (personalStats?.gamesPlayed ?? 0) * 125, [personalStats]);
  const nextLevelXP = 1000;
  const currentLevel = Math.floor(currentXP / nextLevelXP) + 1;
  const progressPercent = (currentXP % nextLevelXP) / nextLevelXP * 100;
  
  // Reward for next level milestone
  const nextMilestone = useMemo(() => {
    if (currentLevel < 5) return { level: 5, reward: "Prototype_Neural_Link", type: "Role" };
    if (currentLevel < 10) return { level: 10, reward: "+500 CC Operational_Bonus", type: "Currency" };
    return { level: 20, reward: "Vanguard_Elite_Casing", type: "Skin" };
  }, [currentLevel]);

  // Mock Missions
  const missions = [
    { id: 1, title: "Orbital_Success", desc: "Win a match as any role", reward: "50 CC", progress: 0, total: 1 },
    { id: 2, title: "Stealth_Protocol", desc: "Win a match without being detected", reward: "120 CC", progress: 0, total: 1 },
  ];

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
    window.location.href = "/?login=true";
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
        onShowAuth={() => {}}
      />

      <div className="h-[var(--nav-height)] shrink-0" />

      {/* --- ATTENTION-DRIVEN HERO HUB --- */}
      <div className="max-w-4xl mx-auto w-full px-6 pt-16 pb-24 relative z-10 flex flex-col items-center text-center">
        
        {/* 1. Identity & Resource Cluster (Anchors) */}
        <div className="w-full flex items-center justify-between mb-12">
          <div className="flex items-center gap-6">
             <div className="relative">
                <div className="w-20 h-20 border border-white/10 bg-white/[0.02] p-1 overflow-hidden">
                   <img 
                    src={`https://api.dicebear.com/7.x/bottts/svg?seed=${username ?? 'operator'}&backgroundColor=transparent`} 
                    alt={username ?? 'Operator'}
                    className="w-full h-full object-cover opacity-60 hover:opacity-100 transition-opacity"
                   />
                </div>
                <div className="absolute -bottom-1 -right-1 bg-white text-black font-orbitron font-black text-[9px] px-2 py-0.5">
                   LVL {currentLevel}
                </div>
             </div>
             <div className="text-left">
                <h1 className="font-orbitron font-bold text-2xl tracking-[0.2em] uppercase text-white/90">{username}</h1>
                <p className="font-mono text-[9px] tracking-[0.4em] uppercase text-cyan-500/60 font-bold">
                  {currentLevel < 5 ? "Novice_Operator" : "Neural_Specialist"}
                </p>
             </div>
          </div>

          <div className="text-right flex flex-col items-end gap-2">
             <p className="font-mono text-[8px] tracking-[0.4em] uppercase opacity-20">Operational_Resource</p>
             <div className="flex items-center gap-3 px-4 py-2 bg-white/[0.03] border border-white/10 rounded-sm group hover:border-cyan-500/40 transition-colors">
                <FaCoins className="text-cyan-500/40 text-xs" />
                <span className="font-orbitron text-lg font-black text-white/90 tracking-tighter">{credits?.toLocaleString()} <span className="text-cyan-500/40 font-bold">CC</span></span>
                <button onClick={() => setShowShopModal(true)} className="ml-2 w-5 h-5 flex items-center justify-center bg-white/5 hover:bg-cyan-500 hover:text-black transition-all text-[10px]">+</button>
             </div>
          </div>
        </div>

        {/* 2. PROGRESSION (Primary Focal Point) */}
        <div className="w-full space-y-4 mb-16 relative">
          <div className="flex justify-between items-end px-1">
             <div className="text-left">
                <span className="font-orbitron text-[10px] tracking-[0.4em] uppercase text-white/40">Progress_Track</span>
             </div>
             
             {/* Milestone Unified with Text */}
             <div className="flex items-center gap-3">
                <span className="font-mono text-[9px] tracking-[0.4em] uppercase text-amber-500/60 font-bold animate-pulse">Next_Unlock:</span>
                <span className="font-orbitron text-[11px] font-black tracking-[0.2em] text-amber-400 uppercase border-b border-amber-500/20">{nextMilestone.reward}</span>
             </div>
          </div>

          {/* High-Impact XP Bar */}
          <div className="relative h-16 bg-white/[0.02] border border-white/10 p-1.5 group">
             <div 
              className="h-full bg-cyan-500/90 transition-all duration-1000 ease-out relative shadow-[0_0_40px_rgba(6,182,212,0.2)]"
              style={{ width: `${progressPercent}%` }}
             >
                <div className="absolute top-0 right-0 h-full w-[3px] bg-white shadow-[0_0_20px_#fff] animate-[leading-pulse_2s_infinite]" />
             </div>
             
             <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className="font-orbitron text-[13px] font-black tracking-[0.8em] text-white mix-blend-difference opacity-80 uppercase">
                  {currentXP % nextLevelXP} / {nextLevelXP} XP
                </span>
             </div>
          </div>

          <div className="flex justify-between font-mono text-[8px] tracking-[0.5em] uppercase opacity-20">
             <span>RANK_{currentLevel}</span>
             <span>TARGET_RANK_{currentLevel + 1}</span>
          </div>
        </div>

        {/* 3. MISSIONS PREVIEW (The Fuel) */}
        <div className="w-full grid grid-cols-2 gap-4 mb-16">
          {missions.map(mission => (
             <div key={mission.id} className="p-4 bg-white/[0.01] border border-white/5 flex flex-col items-center gap-2 group hover:bg-white/[0.03] transition-all cursor-pointer">
                <span className="font-orbitron text-[9px] font-bold tracking-widest text-white/40 uppercase group-hover:text-cyan-500/60 transition-colors">{mission.title}</span>
                <div className="w-full h-1 bg-white/5 relative overflow-hidden">
                   <div className="absolute inset-y-0 left-0 bg-cyan-500/40" style={{ width: `${(mission.progress/mission.total)*100}%` }} />
                </div>
                <span className="font-mono text-[8px] text-white/20 uppercase">Reward: {mission.reward}</span>
             </div>
          ))}
        </div>

        {/* 4. DEPLOY (The Destination) */}
        <div className="w-full">
           <button
            onClick={() => setLocation("/orbit")}
            className="w-full relative group overflow-hidden bg-white text-black font-orbitron font-black text-xl tracking-[1em] py-8 uppercase transition-all shadow-[0_0_50px_rgba(255,255,255,0.15)] hover:shadow-[0_0_80px_rgba(255,255,255,0.3)] active:scale-[0.97]"
           >
              <div className="absolute inset-0 bg-cyan-400 translate-x-[-101%] group-hover:translate-x-0 transition-transform duration-[400ms] ease-out" />
              <div className="absolute inset-0 opacity-0 group-hover:opacity-20 bg-[linear-gradient(45deg,transparent,white,transparent)] translate-x-[-100%] group-hover:translate-x-[100%] transition-all duration-[600ms]" />
              <span className="relative z-10 flex items-center justify-center gap-4">
                 <span className="opacity-0 group-hover:opacity-100 transition-opacity translate-x-2 group-hover:translate-x-0 transition-transform">❯</span>
                 Deploy_To_Orbit
                 <span className="opacity-0 group-hover:opacity-100 transition-opacity translate-x-[-8px] group-hover:translate-x-0 transition-transform">❮</span>
              </span>
           </button>
           <p className="mt-4 font-mono text-[9px] tracking-[0.5em] text-white/10 uppercase italic">Awaiting Operator Confirmation...</p>
        </div>
      </div>

      {/* --- FOOTER ANALYTICS (Background) --- */}
      <div className="max-w-4xl mx-auto w-full px-6 grid grid-cols-2 gap-12 border-t border-white/5 pt-12 pb-24 relative z-10 opacity-40 hover:opacity-100 transition-opacity">
         <div className="space-y-6">
            <h3 className="font-orbitron text-[10px] tracking-[0.4em] uppercase text-white/30 border-l-2 border-white/10 pl-4">Performance_Metrics</h3>
            <AggregateStats personalStats={personalStats} roleStats={roleStats} />
         </div>
         <div className="space-y-6">
            <h3 className="font-orbitron text-[10px] tracking-[0.4em] uppercase text-white/30 border-l-2 border-white/10 pl-4">Network_Topology</h3>
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
      </div>

      <ShopModal isOpen={showShopModal} onClose={() => setShowShopModal(false)} />
      <SettingsModal isOpen={showSettingsModal} onClose={() => setShowSettingsModal(false)} />

      {/* Global CSS for XP leading pulse */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes leading-pulse {
          0% { opacity: 0.4; }
          50% { opacity: 1; box-shadow: 0 0 25px #fff; }
          100% { opacity: 0.4; }
        }
      `}} />

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


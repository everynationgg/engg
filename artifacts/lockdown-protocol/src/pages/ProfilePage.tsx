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
import { useEffect, useState } from "react";

export default function ProfilePage() {
  const [, setLocation] = useLocation();
  const { isLoggedIn, username, userId, logout, isVerified, resendVerificationEmail, isLoading } = useAuth();
  const { personalStats, roleStats, gameHistory, gameHistoryTotal, leaderboard, fetchLeaderboard, fetchPersonalStats, fetchRoleStats, fetchGameHistory } = useRecordGameResult();
  const { achievements, isLoading: achievementsLoading } = useAchievements();
  const { friends, friendRequests, searchResults, isLoading: friendsLoading, isSearching, sendFriendRequest, acceptFriendRequest, declineFriendRequest, removeFriend, searchFriends } = useFriends();
  const [historyPage, setHistoryPage] = useState(0);
  const [resendError, setResendError] = useState<string | null>(null);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showHowToPlay, setShowHowToPlay] = useState(false);
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

  // Redirect to home if not logged in
  useEffect(() => {
    if (!isLoggedIn) {
      setLocation("/");
      return;
    }
    // Fetch personal stats, role stats, and leaderboard when page loads
    fetchPersonalStats();
    fetchRoleStats();
    fetchLeaderboard();
    // Fetch game history (first page)
    fetchGameHistory(20, 0);
  }, [isLoggedIn, setLocation, fetchLeaderboard, fetchPersonalStats, fetchRoleStats, fetchGameHistory]);

  if (!isLoggedIn) {
    return null;
  }

  const handleLogout = () => {
    logout();
    setLocation("/");
  };

  const handleBackHome = () => {
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

  return (
    <div className="min-h-screen text-white p-6 relative" style={{ background: "hsl(220 28% 4%)" }}>
      {/* Hamburger Menu */}
      <HamburgerMenu
        onShowSettings={() => setShowSettingsModal(true)}
        onShowProfile={() => {}} // Already on profile page
        onShowHowToPlay={() => setShowHowToPlay(true)}
        musicOn={musicOn}
        onToggleMusic={handleToggleMusic}
        playSound={playSciFiClick}
      />

      {/* Settings Modal */}
      <SettingsModal isOpen={showSettingsModal} onClose={() => setShowSettingsModal(false)} />

      {/* Header */}
      <div className="max-w-4xl mx-auto mb-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-orbitron font-bold text-4xl tracking-[0.3em] uppercase mb-2">
              Player Profile
            </h1>
            <p className="font-orbitron text-lg tracking-[0.2em] uppercase" style={{ color: "hsl(185 100% 50%)" }}>
              {username}
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleBackHome}
              className="px-6 py-3 font-orbitron font-bold text-xs tracking-[0.2em] uppercase rounded-md border-2 transition-all duration-150"
              style={{
                borderColor: "hsl(210 30% 35%)",
                color: "hsl(210 30% 60%)",
                background: "hsl(220 28% 9%)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "hsl(210 30% 50%)";
                e.currentTarget.style.color = "hsl(210 30% 80%)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "hsl(210 30% 35%)";
                e.currentTarget.style.color = "hsl(210 30% 60%)";
              }}
            >
              BACK HOME
            </button>
            <button
              onClick={handleLogout}
              className="px-6 py-3 font-orbitron font-bold text-xs tracking-[0.2em] uppercase rounded-md border-2 transition-all duration-150"
              style={{
                borderColor: "hsl(0 75% 55%)",
                color: "hsl(0 75% 65%)",
                background: "hsl(220 28% 9%)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "hsl(0 75% 70%)";
                e.currentTarget.style.color = "hsl(0 75% 80%)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "hsl(0 75% 55%)";
                e.currentTarget.style.color = "hsl(0 75% 65%)";
              }}
            >
              LOGOUT
            </button>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px mb-8" style={{ background: "linear-gradient(90deg, hsl(210 30% 25%) 0%, hsl(210 30% 35%) 50%, hsl(210 30% 25%) 100%)" }} />

        {/* Email Verification Banner */}
        {!isVerified && (
          <div className="rounded-lg p-4 mb-8 border-l-4" style={{ background: "hsl(40 90% 10%)", borderColor: "hsl(40 100% 50%)" }}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-orbitron font-bold text-sm tracking-[0.1em] uppercase mb-1" style={{ color: "hsl(40 100% 60%)" }}>
                  ⚠️ Email Not Verified
                </h3>
                <p className="font-orbitron text-xs" style={{ color: "hsl(40 100% 50%)" }}>
                  Check your inbox for a verification email or request a new one
                </p>
                {resendError && <p className="font-orbitron text-xs text-red-400 mt-2">{resendError}</p>}
                {resendSuccess && <p className="font-orbitron text-xs text-cyan-400 mt-2">✓ Verification email sent!</p>}
              </div>
              <button
                onClick={handleResendVerificationEmail}
                disabled={isLoading}
                className="px-4 py-2 font-orbitron text-xs tracking-[0.1em] uppercase rounded border transition-all whitespace-nowrap ml-4 disabled:opacity-50"
                style={{
                  borderColor: "hsl(40 100% 50%)",
                  color: "hsl(40 100% 60%)",
                  background: "hsl(220 28% 12%)",
                }}
                onMouseEnter={(e) => {
                  if (!isLoading) {
                    e.currentTarget.style.borderColor = "hsl(40 100% 70%)";
                    e.currentTarget.style.color = "hsl(40 100% 70%)";
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "hsl(40 100% 50%)";
                  e.currentTarget.style.color = "hsl(40 100% 60%)";
                }}
              >
                {isLoading ? "SENDING..." : "RESEND"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Stats Content */}
      <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Personal Stats */}
        <div className="rounded-lg p-6" style={{ background: "hsl(220 28% 9%)", border: "1px solid hsl(210 30% 25%)" }}>
          <h2 className="font-orbitron font-bold text-xl tracking-[0.2em] uppercase mb-6" style={{ color: "hsl(185 100% 50%)" }}>
            YOUR STATS
          </h2>

          <div className="space-y-4">
            <div className="flex justify-between items-center pb-3 border-b" style={{ borderColor: "hsl(210 30% 20%)" }}>
              <span className="font-orbitron text-sm tracking-[0.1em] uppercase" style={{ color: "hsl(210 30% 60%)" }}>
                Games Played
              </span>
              <span className="font-orbitron font-bold text-lg" style={{ color: "hsl(210 30% 80%)" }}>
                {personalStats?.gamesPlayed ?? 0}
              </span>
            </div>

            <div className="flex justify-between items-center pb-3 border-b" style={{ borderColor: "hsl(210 30% 20%)" }}>
              <span className="font-orbitron text-sm tracking-[0.1em] uppercase" style={{ color: "hsl(210 30% 60%)" }}>
                Games Won
              </span>
              <span className="font-orbitron font-bold text-lg" style={{ color: "hsl(185 100% 50%)" }}>
                {personalStats?.gamesWon ?? 0}
              </span>
            </div>

            <div className="flex justify-between items-center pb-3 border-b" style={{ borderColor: "hsl(210 30% 20%)" }}>
              <span className="font-orbitron text-sm tracking-[0.1em] uppercase" style={{ color: "hsl(210 30% 60%)" }}>
                Games Lost
              </span>
              <span className="font-orbitron font-bold text-lg" style={{ color: "hsl(0 75% 60%)" }}>
                {personalStats?.gamesLost ?? 0}
              </span>
            </div>

            <div className="flex justify-between items-center pt-2">
              <span className="font-orbitron text-sm tracking-[0.1em] uppercase" style={{ color: "hsl(210 30% 60%)" }}>
                Win Rate
              </span>
              <span className="font-orbitron font-bold text-2xl" style={{ color: "hsl(270 70% 60%)" }}>
                {(personalStats?.winRate ?? 0).toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

        {/* Leaderboard */}
        <div className="rounded-lg p-6" style={{ background: "hsl(220 28% 9%)", border: "1px solid hsl(210 30% 25%)" }}>
          <h2 className="font-orbitron font-bold text-xl tracking-[0.2em] uppercase mb-6" style={{ color: "hsl(185 100% 50%)" }}>
            TOP PLAYERS
          </h2>

          <div className="space-y-2">
            {leaderboard && leaderboard.length > 0 ? (
              leaderboard.map((entry) => (
                <div
                  key={entry.userId}
                  className="flex items-center justify-between p-3 rounded transition-all duration-150"
                  style={{
                    background: entry.userId === userId ? "hsl(270 70% 20%)" : "hsl(220 28% 12%)",
                    border: entry.userId === userId ? "1px solid hsl(270 70% 50%)" : "1px solid hsl(210 30% 20%)",
                  }}
                >
                  <div className="flex items-center gap-3 flex-1">
                    <span className="font-orbitron font-bold w-6 text-center" style={{ color: entry.rank === 1 ? "hsl(55 100% 50%)" : entry.rank === 2 ? "hsl(210 30% 70%)" : entry.rank === 3 ? "hsl(25 100% 60%)" : "hsl(210 30% 60%)" }}>
                      #{entry.rank}
                    </span>
                    <span className="font-orbitron text-sm" style={{ color: "hsl(210 30% 80%)" }}>
                      {entry.username || "UNKNOWN"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-right">
                    <span className="font-orbitron text-xs" style={{ color: "hsl(210 30% 60%)" }}>
                      {entry.gamesPlayed} games
                    </span>
                    <span className="font-orbitron font-bold text-sm" style={{ color: "hsl(270 70% 60%)" }}>
                      {entry.winRate.toFixed(1)}%
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center py-8" style={{ color: "hsl(210 30% 50%)" }}>
                Loading leaderboard...
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Aggregate Stats Display */}
      <div className="max-w-4xl mx-auto">
        <AggregateStats personalStats={personalStats} roleStats={roleStats} />
      </div>

      {/* Achievements Display */}
      {achievements && (
        <div className="max-w-4xl mx-auto">
          <AchievementsDisplay
            totalAchievements={achievements.totalAchievements}
            unlockedCount={achievements.unlockedCount}
            achievements={achievements.achievements}
            isLoading={achievementsLoading}
          />
        </div>
      )}

      {/* Friends Display */}
      <div className="max-w-4xl mx-auto">
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

      {/* Role Stats Display */}
      <div className="max-w-4xl mx-auto">
        <RoleStatsDisplay roleStats={roleStats} />
      </div>

      {/* Game History Display */}
      <div className="max-w-4xl mx-auto">
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
  );
}

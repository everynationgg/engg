import { useAuth } from "@/hooks/useAuth";
import { LeaderboardEntry, PlayerStats } from "@/hooks/useRecordGameResult";

interface StatsDisplayProps {
  personalStats: PlayerStats | null;
  leaderboard: LeaderboardEntry[];
  isLoggedIn: boolean;
}

export default function StatsDisplay({
  personalStats,
  leaderboard,
  isLoggedIn,
}: StatsDisplayProps) {
  const { username } = useAuth();

  if (!isLoggedIn) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Personal Stats */}
      <div className="rounded-md p-4" style={{ background: "hsl(220 28% 9%)", border: "1px solid hsl(210 30% 18%)" }}>
        <div className="font-orbitron text-xs tracking-[0.25em] uppercase mb-4 font-bold" style={{ color: "hsl(185 100% 60%)" }}>
          YOUR STATS
        </div>

        {personalStats ? (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between px-3 py-2 rounded" style={{ background: "hsl(220 28% 12%)", border: "1px solid hsl(210 30% 16%)" }}>
              <span className="text-xs tracking-widest uppercase" style={{ color: "hsl(210 30% 50%)" }}>
                PLAYER
              </span>
              <span className="font-orbitron font-bold text-sm" style={{ color: "hsl(190 80% 85%)" }}>
                {username?.toUpperCase()}
              </span>
            </div>

            <div className="flex items-center justify-between px-3 py-2 rounded" style={{ background: "hsl(220 28% 12%)", border: "1px solid hsl(210 30% 16%)" }}>
              <span className="text-xs tracking-widest uppercase" style={{ color: "hsl(210 30% 50%)" }}>
                GAMES PLAYED
              </span>
              <span className="font-orbitron font-bold text-lg" style={{ color: "hsl(185 100% 60%)" }}>
                {personalStats.gamesPlayed}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="px-3 py-2 rounded" style={{ background: "hsl(220 28% 12%)", border: "1px solid hsl(120 60% 30%)" }}>
                <div className="text-xs tracking-widest uppercase mb-1" style={{ color: "hsl(120 60% 50%)" }}>
                  WINS
                </div>
                <div className="font-orbitron font-black text-lg" style={{ color: "hsl(120 100% 60%)" }}>
                  {personalStats.gamesWon}
                </div>
              </div>
              <div className="px-3 py-2 rounded" style={{ background: "hsl(220 28% 12%)", border: "1px solid hsl(0 60% 30%)" }}>
                <div className="text-xs tracking-widest uppercase mb-1" style={{ color: "hsl(0 60% 50%)" }}>
                  LOSSES
                </div>
                <div className="font-orbitron font-black text-lg" style={{ color: "hsl(0 100% 60%)" }}>
                  {personalStats.gamesLost}
                </div>
              </div>
            </div>

            <div className="px-3 py-2 rounded" style={{ background: "hsl(220 28% 12%)", border: "1px solid hsl(270 70% 30%)" }}>
              <div className="text-xs tracking-widest uppercase mb-1" style={{ color: "hsl(270 70% 50%)" }}>
                WIN RATE
              </div>
              <div className="font-orbitron font-black text-xl" style={{ color: "hsl(270 100% 65%)" }}>
                {personalStats.winRate.toFixed(1)}%
              </div>
            </div>
          </div>
        ) : (
          <p className="text-sm" style={{ color: "hsl(210 30% 40%)", fontFamily: "'Exo 2', sans-serif" }}>
            No stats available yet. Play your first game!
          </p>
        )}
      </div>

      {/* Leaderboard */}
      <div className="rounded-md p-4" style={{ background: "hsl(220 28% 9%)", border: "1px solid hsl(210 30% 18%)" }}>
        <div className="font-orbitron text-xs tracking-[0.25em] uppercase mb-4 font-bold" style={{ color: "hsl(185 100% 60%)" }}>
          LEADERBOARD
        </div>

        {leaderboard && leaderboard.length > 0 ? (
          <div className="flex flex-col gap-1.5">
            {leaderboard.map((entry, idx) => {
              const isCurrentPlayer = entry.username === username;
              return (
                <div
                  key={entry.userId}
                  className="flex items-center gap-2 px-3 py-2 rounded"
                  style={{
                    background: isCurrentPlayer ? "hsl(270 70% 15%)" : "hsl(220 28% 12%)",
                    border: isCurrentPlayer ? "1px solid hsl(270 70% 40%)" : "1px solid hsl(210 30% 16%)",
                  }}
                >
                  <div className="font-orbitron font-bold text-sm shrink-0 w-6 text-center" style={{ color: "hsl(270 70% 60%)" }}>
                    #{entry.rank}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-orbitron text-xs font-bold truncate" style={{ color: isCurrentPlayer ? "hsl(270 100% 70%)" : "hsl(190 80% 85%)" }}>
                      {entry.username.toUpperCase()}
                    </div>
                    <div className="text-xs" style={{ color: "hsl(210 30% 40%)" }}>
                      {entry.gamesPlayed} games • {entry.winRate.toFixed(1)}% WR
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-orbitron font-bold text-sm" style={{ color: "hsl(120 100% 60%)" }}>
                      {entry.gamesWon}W
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm" style={{ color: "hsl(210 30% 40%)", fontFamily: "'Exo 2', sans-serif" }}>
            No leaderboard data yet. Play some games!
          </p>
        )}
      </div>
    </div>
  );
}

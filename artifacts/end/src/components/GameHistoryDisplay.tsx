import { GameHistoryEntry } from "@/hooks/useRecordGameResult";
import { ROLES } from "@/data/roles";

interface GameHistoryDisplayProps {
  games: GameHistoryEntry[];
  onLoadMore?: () => void;
  canLoadMore?: boolean;
}

export default function GameHistoryDisplay({ games, onLoadMore, canLoadMore }: GameHistoryDisplayProps) {
  if (!games || games.length === 0) {
    return (
      <div className="rounded-lg p-6 mt-8" style={{ background: "hsl(220 28% 9%)", border: "1px solid hsl(210 30% 25%)" }}>
        <h2 className="font-orbitron font-bold text-xl tracking-[0.2em] uppercase mb-6" style={{ color: "hsl(185 100% 50%)" }}>
          GAME HISTORY
        </h2>
        <p className="text-center py-8" style={{ color: "hsl(210 30% 50%)" }}>
          No games played yet
        </p>
      </div>
    );
  }

  // Get role display info
  const getRoleInfo = (roleId: string) => {
    const role = ROLES.find((r) => r.id === roleId);
    return {
      name: role?.name || roleId,
      team: role?.team || "unknown",
      color:
        role?.team === "crew"
          ? "hsl(185 100% 50%)"
          : role?.team === "alien"
            ? "hsl(0 75% 60%)"
            : "hsl(270 70% 60%)",
    };
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const isToday = date.toDateString() === today.toDateString();
    const isYesterday = date.toDateString() === yesterday.toDateString();

    if (isToday) {
      return `Today at ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
    } else if (isYesterday) {
      return `Yesterday at ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
    } else {
      return date.toLocaleDateString([], { month: "short", day: "numeric", year: date.getFullYear() !== today.getFullYear() ? "numeric" : undefined });
    }
  };

  return (
    <div className="rounded-lg p-6 mt-8" style={{ background: "hsl(220 28% 9%)", border: "1px solid hsl(210 30% 25%)" }}>
      <h2 className="font-orbitron font-bold text-xl tracking-[0.2em] uppercase mb-6" style={{ color: "hsl(185 100% 50%)" }}>
        GAME HISTORY
      </h2>

      <div className="space-y-2">
        {games.map((game) => {
          const roleInfo = getRoleInfo(game.role);
          return (
            <div
              key={game.id}
              className="rounded p-4 transition-all duration-150 hover:border-opacity-100 flex items-center justify-between"
              style={{
                background: 
                  game.won === "yes" ? "hsl(185 100% 8%)" : 
                  game.won === "draw" ? "hsl(30 100% 8%)" : 
                  "hsl(0 75% 8%)",
                border: `1px solid ${
                  game.won === "yes" ? "hsl(185 100% 25%)" : 
                  game.won === "draw" ? "hsl(30 100% 25%)" : 
                  "hsl(0 75% 25%)"
                }`,
              }}
            >
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  {game.won === "yes" ? (
                    <span className="font-orbitron text-[9px] tracking-[0.2em] uppercase px-2 py-1 rounded border border-cyan-500/30" style={{ background: "hsl(185 100% 15%)", color: "hsl(185 100% 50%)" }}>
                      ✓ Victory
                    </span>
                  ) : game.won === "draw" ? (
                    <span className="font-orbitron text-[9px] tracking-[0.2em] uppercase px-2 py-1 rounded border border-orange-500/30" style={{ background: "hsl(30 100% 15%)", color: "hsl(30 100% 50%)" }}>
                      – DRAW
                    </span>
                  ) : (
                    <span className="font-orbitron text-[9px] tracking-[0.2em] uppercase px-2 py-1 rounded border border-red-500/30" style={{ background: "hsl(0 75% 15%)", color: "hsl(0 75% 60%)" }}>
                      ✗ Defeat
                    </span>
                  )}
                  <span className="font-orbitron text-sm" style={{ color: roleInfo.color }}>
                    {roleInfo.name}
                  </span>
                </div>
                <p className="font-orbitron text-xs" style={{ color: "hsl(210 30% 50%)" }}>
                  {formatDate(game.playedAt)}
                </p>
              </div>

              <div className="text-right">
                <span className="font-orbitron text-xs uppercase tracking-[0.1em]" style={{ color: "hsl(210 30% 60%)" }}>
                  Game ID
                </span>
                <p className="font-mono text-xs" style={{ color: "hsl(210 30% 70%)" }}>
                  {game.gameId.substring(0, 8)}...
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {canLoadMore && onLoadMore && (
        <button
          onClick={onLoadMore}
          className="w-full mt-4 py-2 font-orbitron text-xs tracking-[0.1em] uppercase rounded border transition-all duration-150"
          style={{
            borderColor: "hsl(185 100% 40%)",
            color: "hsl(185 100% 50%)",
            background: "hsl(220 28% 12%)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "hsl(185 100% 60%)";
            e.currentTarget.style.color = "hsl(185 100% 70%)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "hsl(185 100% 40%)";
            e.currentTarget.style.color = "hsl(185 100% 50%)";
          }}
        >
          LOAD MORE
        </button>
      )}
    </div>
  );
}

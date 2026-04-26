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
              className="rounded p-4 transition-all duration-150 hover:border-opacity-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0"
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
              <div className="flex-1 w-full">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  {game.won === "yes" ? (
                    <span className="font-orbitron text-[8px] tracking-[0.2em] uppercase px-1.5 py-0.5 rounded border border-cyan-500/30" style={{ background: "hsl(185 100% 15%)", color: "hsl(185 100% 50%)" }}>
                      ✓ Victory
                    </span>
                  ) : game.won === "draw" ? (
                    <span className="font-orbitron text-[8px] tracking-[0.2em] uppercase px-1.5 py-0.5 rounded border border-orange-500/30" style={{ background: "hsl(30 100% 15%)", color: "hsl(30 100% 50%)" }}>
                      – DRAW
                    </span>
                  ) : (
                    <span className="font-orbitron text-[8px] tracking-[0.2em] uppercase px-1.5 py-0.5 rounded border border-red-500/30" style={{ background: "hsl(0 75% 15%)", color: "hsl(0 75% 60%)" }}>
                      ✗ Defeat
                    </span>
                  )}
                  <span className="font-orbitron text-xs font-bold" style={{ color: roleInfo.color }}>
                    {roleInfo.name}
                  </span>
                  {game.alignment && (
                    <span 
                      className="font-orbitron text-[8px] px-1.5 py-0.5 rounded border ml-1 uppercase"
                      style={{ 
                        background: game.alignment === "Bad" ? "hsl(0 100% 50% / 0.1)" : "hsl(185 100% 50% / 0.1)",
                        borderColor: game.alignment === "Bad" ? "hsl(0 100% 50% / 0.3)" : "hsl(185 100% 50% / 0.3)",
                        color: game.alignment === "Bad" ? "hsl(0 100% 70%)" : "hsl(185 100% 70%)"
                      }}
                    >
                      {game.alignment}
                    </span>
                  )}
                </div>
                <p className="font-mono text-[9px] uppercase opacity-40">
                  {formatDate(game.playedAt)}
                </p>
              </div>

              <div className="text-left sm:text-right w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-0 border-white/5 flex sm:block justify-between items-center">
                <span className="font-mono text-[8px] uppercase opacity-20 block sm:inline">
                  Log_Ref
                </span>
                <p className="font-mono text-[10px] sm:text-xs opacity-40 ml-2 sm:ml-0">
                  {game.gameId.substring(0, 6)}
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

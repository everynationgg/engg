import { RoleStats } from "@/hooks/useRecordGameResult";
import { ROLES } from "@/data/roles";

interface RoleStatsDisplayProps {
  roleStats: RoleStats[];
}

export default function RoleStatsDisplay({ roleStats }: RoleStatsDisplayProps) {
  if (!roleStats || roleStats.length === 0) {
    return null;
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

  return (
    <div className="rounded-lg p-6 mt-8" style={{ background: "hsl(220 28% 9%)", border: "1px solid hsl(210 30% 25%)" }}>
      <h2 className="font-orbitron font-bold text-xl tracking-[0.2em] uppercase mb-6" style={{ color: "hsl(185 100% 50%)" }}>
        STATS BY ROLE
      </h2>

      <div className="space-y-2">
        {roleStats.map((stat) => {
          const roleInfo = getRoleInfo(stat.role);
          return (
            <div
              key={stat.role}
              className="rounded p-4 transition-all duration-150"
              style={{
                background: "hsl(220 28% 12%)",
                border: `1px solid ${roleInfo.color}`,
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <span
                  className="font-orbitron font-bold text-sm tracking-[0.1em] uppercase"
                  style={{ color: roleInfo.color }}
                >
                  {roleInfo.name}
                </span>
                <span className="font-orbitron text-xs" style={{ color: "hsl(210 30% 60%)" }}>
                  {stat.gamesPlayed} {stat.gamesPlayed === 1 ? "game" : "games"}
                </span>
              </div>

              <div className="flex items-center justify-between gap-4">
                <div className="flex gap-4 text-xs">
                  <div>
                    <span style={{ color: "hsl(210 30% 60%)" }}>Wins: </span>
                    <span style={{ color: "hsl(185 100% 50%)" }} className="font-bold">
                      {stat.gamesWon}
                    </span>
                  </div>
                  <div>
                    <span style={{ color: "hsl(210 30% 60%)" }}>Losses: </span>
                    <span style={{ color: "hsl(0 75% 60%)" }} className="font-bold">
                      {stat.gamesLost}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="font-orbitron font-bold text-lg" style={{ color: "hsl(270 70% 60%)" }}>
                    {stat.winRate.toFixed(1)}%
                  </span>
                </div>
              </div>

              {/* Win rate progress bar */}
              <div
                className="mt-2 h-1 rounded-full"
                style={{
                  background: "hsl(210 30% 20%)",
                  overflow: "hidden",
                }}
              >
                <div
                  className="h-full transition-all duration-500"
                  style={{
                    width: `${stat.winRate}%`,
                    background: `linear-gradient(90deg, hsl(185 100% 50%), hsl(270 70% 60%))`,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

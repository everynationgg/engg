interface AggregateStatsProps {
  roleStats: any[];
  personalStats: any;
}

export default function AggregateStats({ roleStats, personalStats }: AggregateStatsProps) {
  if (!personalStats || !roleStats || roleStats.length === 0) {
    return null;
  }

  // Calculate best and worst roles
  const bestRole = [...roleStats].sort((a, b) => b.winRate - a.winRate)[0];
  const worstRole = [...roleStats].sort((a, b) => a.winRate - b.winRate)[0];

  // Calculate role distribution by games played
  const totalRoles = roleStats.length;
  const mostPlayedRole = [...roleStats].sort((a, b) => b.gamesPlayed - a.gamesPlayed)[0];

  // Calculate crew vs alien wins
  const crewStats = roleStats.filter((r) => r.role === "crew" || r.role === "commander" || r.role === "scanner" || r.role === "sentinel" || r.role === "shifter");
  const alienStats = roleStats.filter((r) => r.role === "alien" || r.role === "parasite" || r.role === "warper" || r.role === "disruptor" || r.role === "seeker");

  const crewWins = crewStats.reduce((acc, r) => acc + r.gamesWon, 0);
  const alienWins = alienStats.reduce((acc, r) => acc + r.gamesWon, 0);

  return (
    <div className="rounded-lg p-6 mt-8" style={{ background: "hsl(220 28% 9%)", border: "1px solid hsl(210 30% 25%)" }}>
      <h2 className="font-orbitron font-bold text-xl tracking-[0.2em] uppercase mb-6" style={{ color: "hsl(185 100% 50%)" }}>
        AGGREGATE STATS
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Best & Worst Roles */}
        <div className="space-y-4">
          <div className="rounded p-4" style={{ background: "hsl(220 28% 12%)", border: "1px solid hsl(185 100% 30%)" }}>
            <p className="font-orbitron text-xs tracking-[0.1em] uppercase" style={{ color: "hsl(210 30% 60%)" }}>
              Best Role
            </p>
            <div className="flex items-baseline gap-2 mt-1">
              <p className="font-orbitron text-lg font-bold" style={{ color: "hsl(185 100% 50%)" }}>
                {bestRole.role}
              </p>
              <p className="font-orbitron text-sm" style={{ color: "hsl(270 70% 60%)" }}>
                {bestRole.winRate.toFixed(1)}%
              </p>
            </div>
            <p className="font-orbitron text-xs mt-2" style={{ color: "hsl(210 30% 50%)" }}>
              {bestRole.gamesWon}W - {bestRole.gamesLost}L
            </p>
          </div>

          <div className="rounded p-4" style={{ background: "hsl(220 28% 12%)", border: "1px solid hsl(0 75% 30%)" }}>
            <p className="font-orbitron text-xs tracking-[0.1em] uppercase" style={{ color: "hsl(210 30% 60%)" }}>
              Worst Role
            </p>
            <div className="flex items-baseline gap-2 mt-1">
              <p className="font-orbitron text-lg font-bold" style={{ color: "hsl(0 75% 60%)" }}>
                {worstRole.role}
              </p>
              <p className="font-orbitron text-sm" style={{ color: "hsl(270 70% 60%)" }}>
                {worstRole.winRate.toFixed(1)}%
              </p>
            </div>
            <p className="font-orbitron text-xs mt-2" style={{ color: "hsl(210 30% 50%)" }}>
              {worstRole.gamesWon}W - {worstRole.gamesLost}L
            </p>
          </div>
        </div>

        {/* Team Performance */}
        <div className="space-y-4">
          <div className="rounded p-4" style={{ background: "hsl(220 28% 12%)", border: "1px solid hsl(185 100% 30%)" }}>
            <p className="font-orbitron text-xs tracking-[0.1em] uppercase" style={{ color: "hsl(210 30% 60%)" }}>
              Crew Wins
            </p>
            <p className="font-orbitron text-2xl font-bold mt-1" style={{ color: "hsl(185 100% 50%)" }}>
              {crewWins}
            </p>
            <p className="font-orbitron text-xs mt-2" style={{ color: "hsl(210 30% 50%)" }}>
              across {crewStats.length} roles
            </p>
          </div>

          <div className="rounded p-4" style={{ background: "hsl(220 28% 12%)", border: "1px solid hsl(0 75% 30%)" }}>
            <p className="font-orbitron text-xs tracking-[0.1em] uppercase" style={{ color: "hsl(210 30% 60%)" }}>
              Alien Wins
            </p>
            <p className="font-orbitron text-2xl font-bold mt-1" style={{ color: "hsl(0 75% 60%)" }}>
              {alienWins}
            </p>
            <p className="font-orbitron text-xs mt-2" style={{ color: "hsl(210 30% 50%)" }}>
              across {alienStats.length} roles
            </p>
          </div>
        </div>
      </div>

      {/* Role Distribution Chart */}
      <div className="mt-6 pt-6 border-t" style={{ borderColor: "hsl(210 30% 20%)" }}>
        <p className="font-orbitron text-sm tracking-[0.1em] uppercase mb-4" style={{ color: "hsl(210 30% 60%)" }}>
          Role Distribution
        </p>
        <div className="space-y-2">
          {[...roleStats]
            .sort((a, b) => b.gamesPlayed - a.gamesPlayed)
            .slice(0, 5)
            .map((role) => (
              <div key={role.role}>
                <div className="flex justify-between mb-1 text-xs">
                  <span className="font-orbitron" style={{ color: "hsl(210 30% 70%)" }}>
                    {role.role}
                  </span>
                  <span style={{ color: "hsl(210 30% 50%)" }}>
                    {role.gamesPlayed} games
                  </span>
                </div>
                <div
                  className="h-2 rounded"
                  style={{
                    background: "hsl(210 30% 15%)",
                    overflow: "hidden",
                  }}
                >
                  <div
                    className="h-full transition-all duration-500"
                    style={{
                      width: `${(role.gamesPlayed / personalStats.gamesPlayed) * 100}%`,
                      background: `linear-gradient(90deg, hsl(185 100% 40%), hsl(270 70% 50%))`,
                    }}
                  />
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Quick Facts */}
      <div className="mt-6 pt-6 border-t" style={{ borderColor: "hsl(210 30% 20%)" }}>
        <p className="font-orbitron text-sm tracking-[0.1em] uppercase mb-4" style={{ color: "hsl(210 30% 60%)" }}>
          Quick Facts
        </p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
          <div>
            <p style={{ color: "hsl(210 30% 50%)" }}>Roles Played</p>
            <p className="font-orbitron font-bold text-lg mt-1" style={{ color: "hsl(185 100% 50%)" }}>
              {totalRoles}
            </p>
          </div>
          <div>
            <p style={{ color: "hsl(210 30% 50%)" }}>Most Played</p>
            <p className="font-orbitron font-bold mt-1" style={{ color: "hsl(185 100% 50%)" }}>
              {mostPlayedRole.role}
            </p>
          </div>
          <div>
            <p style={{ color: "hsl(210 30% 50%)" }}>Avg Win Rate</p>
            <p className="font-orbitron font-bold text-lg mt-1" style={{ color: "hsl(270 70% 60%)" }}>
              {(roleStats.reduce((acc, r) => acc + r.winRate, 0) / roleStats.length).toFixed(1)}%
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

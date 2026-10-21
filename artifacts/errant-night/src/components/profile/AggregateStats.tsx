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

  // Calculate faction performance
  const crewRoles = ["crew", "commander", "scanner", "sentinel", "seeker"];
  const alienRoles = ["alien", "parasite", "virus"];
  const chaoticRoles = ["warper", "disruptor", "shifter", "router"];

  const crewWins = roleStats.filter(r => crewRoles.includes(r.role)).reduce((acc, r) => acc + r.gamesWon, 0);
  const alienWins = roleStats.filter(r => alienRoles.includes(r.role)).reduce((acc, r) => acc + r.gamesWon, 0);
  const chaoticWins = roleStats.filter(r => chaoticRoles.includes(r.role)).reduce((acc, r) => acc + r.gamesWon, 0);

  return (
    <div className="p-8 bg-white/5 border border-white/10 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent" />
      
      <h2 className="font-orbitron text-xs tracking-[0.4em] uppercase opacity-40 mb-8 flex items-center gap-4">
        Tactical Analysis
        <div className="h-px flex-1 bg-white/5" />
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Best & Worst Roles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 bg-black/20 border border-cyan-500/20 relative group">
            <div className="absolute top-0 right-0 p-1 font-mono text-[8px] text-cyan-500 opacity-40">OPT_MAX</div>
            <p className="font-mono text-[9px] uppercase opacity-40 mb-2">Primary Asset</p>
            <p className="font-orbitron text-lg font-bold text-cyan-400 uppercase tracking-wider">{bestRole.role}</p>
            <p className="font-mono text-xs text-cyan-500/60 mt-1">{bestRole.winRate.toFixed(1)}% Efficiency</p>
          </div>

          <div className="p-4 bg-black/20 border border-red-500/20 relative">
             <div className="absolute top-0 right-0 p-1 font-mono text-[8px] text-red-500 opacity-40">OPT_MIN</div>
            <p className="font-mono text-[9px] uppercase opacity-40 mb-2">Risk Factor</p>
            <p className="font-orbitron text-lg font-bold text-red-400 uppercase tracking-wider">{worstRole.role}</p>
            <p className="font-mono text-xs text-red-500/60 mt-1">{worstRole.winRate.toFixed(1)}% Efficiency</p>
          </div>
        </div>

        {/* Team Performance Readout */}
        <div className="flex flex-col justify-between p-5 md:p-8 bg-black/40 border border-white/5 relative group">
          <div className="absolute top-0 right-0 p-2 font-mono text-[8px] opacity-10">FACTION_SYNC</div>
          
          <div className="flex flex-row justify-between items-end gap-2 sm:gap-4">
            <div className="flex-1">
              <p className="font-mono text-[8px] uppercase opacity-40 mb-1">Crew</p>
              <p className="font-orbitron text-lg sm:text-2xl text-cyan-400">{crewWins}</p>
            </div>
            <div className="flex-1 text-center">
              <p className="font-mono text-[8px] uppercase opacity-40 mb-1">Infiltration</p>
              <p className="font-orbitron text-lg sm:text-2xl text-red-400">{alienWins}</p>
            </div>
            <div className="flex-1 text-right">
              <p className="font-mono text-[8px] uppercase opacity-40 mb-1">Chaos</p>
              <p className="font-orbitron text-lg sm:text-2xl text-purple-400">{chaoticWins}</p>
            </div>
          </div>
          
          <div className="h-1.5 w-full bg-white/5 mt-6 flex overflow-hidden rounded-full">
             <div className="h-full bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.5)]" style={{ width: `${(crewWins / (crewWins + alienWins + chaoticWins || 1)) * 100}%` }} />
             <div className="h-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]" style={{ width: `${(alienWins / (crewWins + alienWins + chaoticWins || 1)) * 100}%` }} />
             <div className="h-full bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]" style={{ width: `${(chaoticWins / (crewWins + alienWins + chaoticWins || 1)) * 100}%` }} />
          </div>
          <p className="font-mono text-[8px] uppercase opacity-20 mt-4 text-center tracking-[0.2em]">Operational Alignment Analysis</p>
        </div>
      </div>

      {/* Role Distribution Chart */}
      <div className="mt-12">
        <h3 className="font-mono text-[9px] uppercase opacity-40 mb-6 tracking-[0.2em] flex items-center gap-3">
          Operational Distribution
          <div className="h-[1px] w-8 bg-white/10" />
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
          {[...roleStats]
            .sort((a, b) => b.gamesPlayed - a.gamesPlayed)
            .slice(0, 5)
            .map((role) => (
              <div key={role.role} className="p-4 bg-black/40 border border-white/5 relative overflow-hidden group">
                <div className="absolute bottom-0 left-0 h-0.5 bg-cyan-500/50 shadow-[0_0_8px_rgba(6,182,212,0.4)] transition-all duration-700" style={{ width: `${(role.gamesPlayed / (personalStats.gamesPlayed || 1)) * 100}%` }} />
                <div className="flex justify-between items-center mb-1">
                   <span className="font-orbitron text-[10px] uppercase tracking-wider text-white/80">{role.role}</span>
                   <span className="font-mono text-[9px] opacity-30">{role.gamesPlayed}</span>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}

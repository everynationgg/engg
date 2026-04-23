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
  const crewStats = roleStats.filter((r) => ["crew", "commander", "scanner", "sentinel", "shifter"].includes(r.role));
  const alienStats = roleStats.filter((r) => ["alien", "parasite", "warper", "disruptor", "seeker"].includes(r.role));

  const crewWins = crewStats.reduce((acc, r) => acc + r.gamesWon, 0);
  const alienWins = alienStats.reduce((acc, r) => acc + r.gamesWon, 0);

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
        <div className="flex flex-col justify-between p-6 bg-white/5 border border-white/5">
          <div className="flex justify-between items-end">
            <div>
              <p className="font-mono text-[9px] uppercase opacity-40 mb-1">Crew Allegiance</p>
              <p className="font-orbitron text-2xl text-cyan-400">{crewWins} <span className="text-xs opacity-40 ml-1">WINS</span></p>
            </div>
            <div className="text-right">
              <p className="font-mono text-[9px] uppercase opacity-40 mb-1">Alien Infiltration</p>
              <p className="font-orbitron text-2xl text-red-400">{alienWins} <span className="text-xs opacity-40 ml-1">WINS</span></p>
            </div>
          </div>
          <div className="h-1.5 w-full bg-white/5 mt-4 flex overflow-hidden">
             <div className="h-full bg-cyan-500" style={{ width: `${(crewWins / (crewWins + alienWins || 1)) * 100}%` }} />
             <div className="h-full bg-red-500" style={{ width: `${(alienWins / (crewWins + alienWins || 1)) * 100}%` }} />
          </div>
        </div>
      </div>

      {/* Role Distribution Chart */}
      <div className="mt-12">
        <h3 className="font-mono text-[9px] uppercase opacity-40 mb-6 tracking-[0.2em]">Operational Distribution</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {[...roleStats]
            .sort((a, b) => b.gamesPlayed - a.gamesPlayed)
            .slice(0, 5)
            .map((role) => (
              <div key={role.role} className="p-3 bg-white/5 border border-white/5 relative overflow-hidden group">
                <div className="absolute bottom-0 left-0 h-0.5 bg-cyan-500/50 transition-all duration-500" style={{ width: `${(role.gamesPlayed / personalStats.gamesPlayed) * 100}%` }} />
                <div className="flex justify-between items-center mb-1">
                   <span className="font-orbitron text-[10px] uppercase tracking-wider">{role.role}</span>
                   <span className="font-mono text-[9px] opacity-40">{role.gamesPlayed}</span>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}

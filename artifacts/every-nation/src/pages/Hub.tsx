import { motion } from "framer-motion";
import { Link } from "wouter";
import { FaGamepad, FaLock, FaExternalLinkAlt, FaSignal, FaMicrochip, FaShieldAlt } from "react-icons/fa";

interface GameCardProps {
  title: string;
  description: string;
  image: string;
  href?: string;
  status: "online" | "offline";
  tags: string[];
}

function GameCard({ title, description, image, href, status, tags }: GameCardProps) {
  const isOffline = status === "offline";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={!isOffline ? { scale: 1.02, y: -5 } : {}}
      className={`relative group overflow-hidden border ${
        isOffline 
          ? "border-white/5 bg-white/[0.01] grayscale opacity-60" 
          : "border-cyan-500/30 bg-cyan-500/5 hover:border-cyan-400 hover:shadow-[0_0_40px_rgba(6,182,212,0.15)]"
      } transition-all duration-500`}
    >
      {/* Background Image with Overlay */}
      <div className="relative h-64 overflow-hidden">
        <img 
          src={image} 
          alt={title} 
          className={`w-full h-full object-cover transition-transform duration-700 ${
            !isOffline && "group-hover:scale-110"
          }`}
        />
        <div className={`absolute inset-0 bg-gradient-to-t ${
          isOffline ? "from-black/90 to-transparent" : "from-[#020408] via-transparent to-transparent"
        }`} />
        
        {/* Status Badge */}
        <div className={`absolute top-4 right-4 px-3 py-1 flex items-center gap-2 border backdrop-blur-md ${
          isOffline ? "border-white/10 bg-black/60 text-white/30" : "border-cyan-500/40 bg-cyan-500/10 text-cyan-400"
        }`}>
          <div className={`w-1.5 h-1.5 rounded-full ${isOffline ? "bg-white/20" : "bg-cyan-400 animate-pulse"}`} />
          <span className="font-mono text-[8px] uppercase tracking-widest">
            {isOffline ? "Status: Offline" : "Status: Active"}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-8 relative">
        <div className="flex flex-wrap gap-2 mb-4">
          {tags.map(tag => (
            <span key={tag} className="font-mono text-[8px] uppercase tracking-widest text-white/20 border border-white/5 px-2 py-0.5">
              {tag}
            </span>
          ))}
        </div>
        
        <h3 className={`font-orbitron text-xl font-black tracking-[0.2em] uppercase mb-3 ${
          isOffline ? "text-white/40" : "text-white group-hover:text-cyan-400"
        } transition-colors`}>
          {title}
        </h3>
        <p className="font-mono text-[10px] text-white/30 uppercase tracking-widest leading-relaxed mb-8">
          {description}
        </p>

        {isOffline ? (
          <div className="flex items-center gap-3 text-white/20">
            <FaLock className="text-xs" />
            <span className="font-orbitron text-[9px] uppercase tracking-[0.4em]">Connection Encrypted</span>
          </div>
        ) : (
          <Link 
            href={href || "#"} 
            className="inline-flex items-center gap-3 text-cyan-400 group-hover:text-cyan-300 transition-colors"
          >
            <span className="font-orbitron text-[10px] uppercase tracking-[0.5em] font-bold">Initialize Deployment</span>
            <FaExternalLinkAlt className="text-[10px] group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
          </Link>
        )}
      </div>

      {/* Decorative HUD Elements */}
      <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent" />
      <div className="absolute top-0 left-0 w-8 h-8 border-t border-l border-white/10" />
      <div className="absolute bottom-0 right-0 w-8 h-8 border-b border-r border-white/10" />
    </motion.div>
  );
}

export default function Hub() {
  const games = [
    {
      title: "Lockdown Protocol",
      description: "A high-stakes social deduction engine. Identify the Virus before the system collapses.",
      image: "lockdown_protocol_hub_preview_1777038039576.png",
      href: "/end",
      status: "online" as const,
      tags: ["Social Deduction", "Multiplayer", "Competitive"]
    },
    {
      title: "Triple Triad Online",
      description: "Strategic card warfare. Collect, trade, and dominate the digital grid.",
      image: "triple_triad_hub_preview_1777038061966.png",
      status: "offline" as const,
      tags: ["TCG", "Strategy", "Turn-Based"]
    },
    {
      title: "Tower Defense",
      description: "Coordinate orbital defenses. Protect the core from relentless machine swarms.",
      image: "tower_defense_hub_preview_1777038087223.png",
      status: "offline" as const,
      tags: ["Real-Time", "Defense", "PvE"]
    }
  ];

  return (
    <div className="min-h-screen bg-[#020408] text-white pt-32 pb-24 px-6 md:px-12 relative overflow-hidden font-inter">
      {/* Background FX */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(6,182,212,0.15)_0%,transparent_70%)]" />
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('data:image/svg+xml,%3Csvg%20viewBox=%220%200%20200%20200%22%20xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter%20id=%22noiseFilter%22%3E%3CfeTurbulence%20type=%22fractalNoise%22%20baseFrequency=%220.65%22%20numOctaves=%223%22%20stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect%20width=%22100%25%22%20height=%22100%25%22%20filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E')]" />
      
      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header HUD */}
        <header className="mb-20">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            className="relative"
          >
            <div className="flex items-center gap-6 mb-4">
              <FaGamepad className="text-4xl text-cyan-400 drop-shadow-[0_0_15px_#00f3ff]" />
              <h1 className="font-orbitron font-black text-4xl md:text-6xl tracking-[0.5em] uppercase">
                Gaming <span className="text-cyan-400">Hub</span>
              </h1>
            </div>
            <div className="flex items-center gap-8 pl-14">
              <div className="flex items-center gap-3">
                <FaSignal className="text-[10px] text-cyan-500" />
                <span className="font-mono text-[9px] uppercase tracking-[0.4em] text-white/40">Node: Central_Relay_01</span>
              </div>
              <div className="flex items-center gap-3 border-l border-white/10 pl-8">
                <FaMicrochip className="text-[10px] text-purple-500" />
                <span className="font-mono text-[9px] uppercase tracking-[0.4em] text-white/40">Core: EveryNation_OS v4.2</span>
              </div>
              <div className="flex items-center gap-3 border-l border-white/10 pl-8">
                <FaShieldAlt className="text-[10px] text-green-500" />
                <span className="font-mono text-[9px] uppercase tracking-[0.4em] text-white/40">Encryption: AES-256</span>
              </div>
            </div>
          </motion.div>
        </header>

        {/* Game Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {games.map((game, i) => (
            <GameCard key={game.title} {...game} />
          ))}
        </div>

        {/* Footer HUD */}
        <footer className="mt-24 pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-6">
            <div className="flex flex-col gap-1">
              <span className="font-mono text-[8px] uppercase tracking-[0.3em] text-white/20">System_Status</span>
              <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-cyan-500/60 animate-pulse">All_Systems_Stable</span>
            </div>
          </div>
          <div className="flex items-center gap-12 font-mono text-[8px] uppercase tracking-[0.4em] text-white/10">
            <span>Transmission_Stable</span>
            <span>Uptime: 99.98%</span>
            <span>Latency: 12ms</span>
          </div>
        </footer>
      </div>
    </div>
  );
}

import { motion } from "framer-motion";
import { FaExternalLinkAlt, FaLock, FaTerminal, FaShieldAlt, FaCubes } from "react-icons/fa";
import AlliesSidebar from "@/components/AlliesSidebar";

interface GameCardProps {
  title: string;
  description: string;
  image: string;
  href?: string;
  status: "online" | "offline";
  subtitle?: string;
  index: number;
}

function GameCard({ title, description, image, href, status, subtitle, index }: GameCardProps) {
  const isOffline = status === "offline";

  const handleEntry = () => {
    if (!isOffline && href) {
      window.location.href = href;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: index * 0.15 }}
      onClick={handleEntry}
      className={`relative group flex flex-col w-full max-w-[400px] aspect-[10/14] transition-all duration-700 ${isOffline ? "cursor-not-allowed grayscale" : "cursor-pointer"
        }`}
    >
      {/* Decorative HUD Corner Bracket (Top Right) */}
      <div className="absolute -top-1 -right-1 w-12 h-12 border-t-2 border-r-2 border-cyan-500/30 group-hover:border-cyan-400 z-30 transition-colors" />
      <div className="absolute -bottom-1 -left-1 w-12 h-12 border-b-2 border-l-2 border-cyan-500/30 group-hover:border-cyan-400 z-30 transition-colors" />

      {/* Main Image Container */}
      <div className="absolute inset-0 z-0 overflow-hidden rounded-sm border border-white/10 bg-[#0a0b1e]">
        <img
          src={image}
          alt={title}
          className={`w-full h-full object-cover transition-transform duration-[2000ms] ease-out ${!isOffline && "group-hover:scale-110"
            }`}
        />
        {/* Gradients & Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-90" />
        <div className="absolute inset-0 bg-cyan-950/10 group-hover:bg-transparent transition-colors duration-700" />
        
        {/* Offline Overlay */}
        {isOffline && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-[4px] z-10">
            <div className="p-4 rounded-full border border-white/10 bg-white/5 mb-4">
              <FaLock className="text-white/20 text-2xl" />
            </div>
            <span className="font-mono text-[9px] uppercase tracking-[0.4em] text-white/40">Access_Denied</span>
          </div>
        )}

        {/* Scanline Effect inside Card */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.05] z-10 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%]" />
      </div>

      {/* Content HUD Overlays */}
      <div className="relative z-20 mt-auto p-8 flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className={`w-1.5 h-1.5 rounded-full ${isOffline ? "bg-red-500/40" : "bg-cyan-500 shadow-[0_0_10px_#00f3ff] animate-pulse"}`} />
          <span className="font-mono text-[9px] uppercase tracking-[0.5em] text-white/40">
            {isOffline ? "Status: Offline" : "Status: Operational"}
          </span>
        </div>

        <div className="flex flex-col gap-1">
          <h2 className="font-orbitron font-black text-2xl tracking-[0.1em] uppercase text-white group-hover:text-cyan-400 transition-colors">
            {title}
          </h2>
          <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-cyan-500/60 font-bold">
            {subtitle}
          </span>
        </div>

        <p className="font-mono text-[11px] uppercase tracking-wider text-white/50 leading-relaxed max-w-[90%] opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-500">
          {description}
        </p>

        {!isOffline && (
          <div className="mt-4 flex items-center gap-4 text-cyan-400 opacity-60 group-hover:opacity-100 transition-all">
            <span className="font-orbitron text-[10px] uppercase tracking-[0.5em] font-bold">Initialize Deployment</span>
            <div className="flex-1 h-px bg-cyan-500/20" />
            <FaExternalLinkAlt className="text-[10px] group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
          </div>
        )}
      </div>

      {/* Background Glow */}
      <div className="absolute inset-0 -z-10 bg-cyan-500/0 group-hover:bg-cyan-500/5 blur-[80px] transition-all duration-700 rounded-full scale-50 group-hover:scale-100" />
    </motion.div>
  );
}

export default function Hub() {
  const games = [
    {
      title: "Lockdown Protocol",
      subtitle: "Social Deduction Engine",
      description: "A high-stakes network defense simulator. Identify the Virus before core breach.",
      image: "/hub_lockdown.png",
      href: "/end",
      status: "online" as const
    },
    {
      title: "Triple Triad",
      subtitle: "Strategic Card Duel",
      description: "Neural card warfare on the digital grid. Collect, trade, and dominate.",
      image: "/hub_triad.png",
      status: "offline" as const
    },
    {
      title: "Tower Defense",
      subtitle: "Orbital Swarm Defense",
      description: "Coordinate orbital batteries to protect the colony from machine swarms.",
      image: "/hub_td.png",
      status: "offline" as const
    }
  ];

  return (
    <div className="min-h-screen bg-[#020408] text-white pt-24 relative flex flex-col items-center overflow-x-hidden selection:bg-cyan-500/30">
      <AlliesSidebar />
      {/* Cinematic Background Layer */}
      <div
        className="fixed inset-0 z-0 bg-cover bg-center transition-transform duration-[10000ms] scale-110 animate-slow-drift"
        style={{ backgroundImage: "url('/hub_bg.png')" }}
      />
      <div className="fixed inset-0 z-1 bg-gradient-to-b from-[#020408]/80 via-[#020408]/40 to-[#020408]/90" />
      
      {/* Global HUD Scanning Line */}
      <div className="fixed inset-0 pointer-events-none z-20 scanline" />

      {/* Header Overlay */}
      <header className="relative z-10 w-full max-w-[1440px] px-8 md:px-16 pt-16 md:pt-24 flex flex-col gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-[2px] bg-cyan-500 shadow-[0_0_15px_#00f3ff]" />
          <span className="font-mono text-[10px] uppercase tracking-[0.8em] text-cyan-500">Mission_Select</span>
        </div>
        <h1 className="font-orbitron font-black text-4xl md:text-6xl tracking-[0.2em] uppercase text-white">
          Gaming <span className="text-cyan-400">Hub</span>
        </h1>
        <div className="flex items-center gap-6 mt-4 opacity-30">
          <div className="flex items-center gap-2">
            <FaTerminal className="text-[10px]" />
            <span className="font-mono text-[9px] uppercase tracking-widest">Sys_Status: Ready</span>
          </div>
          <div className="flex items-center gap-2">
            <FaShieldAlt className="text-[10px]" />
            <span className="font-mono text-[9px] uppercase tracking-widest">Network: Secure</span>
          </div>
          <div className="flex items-center gap-2">
            <FaCubes className="text-[10px]" />
            <span className="font-mono text-[9px] uppercase tracking-widest">Nodes: 3_Detected</span>
          </div>
        </div>
      </header>

      {/* Main Mission Deck */}
      <div className="relative z-10 w-full max-w-[1440px] px-8 md:px-16 py-20 md:py-32">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 lg:gap-16 justify-items-center">
          {games.map((game, i) => (
            <GameCard key={game.title} {...game} index={i} />
          ))}
        </div>
      </div>

      {/* System Footer Info */}
      <footer className="relative z-10 mt-auto w-full border-t border-white/5 bg-black/40 backdrop-blur-md py-8">
        <div className="max-w-[1440px] mx-auto px-8 flex justify-between items-center opacity-30">
          <span className="font-orbitron text-[9px] uppercase tracking-[0.6em]">ENGG // CENTRAL_RELAY</span>
          <div className="flex items-center gap-8">
            <span className="font-mono text-[8px] uppercase tracking-widest">Uptime: 99.98%</span>
            <span className="font-mono text-[8px] uppercase tracking-widest">Encryption: AES-256</span>
          </div>
        </div>
      </footer>

      <style dangerouslySetInnerHTML={{
        __html: `
        .scanline {
          position: fixed;
          inset: 0;
          background: linear-gradient(
            to bottom,
            transparent 50%,
            rgba(0, 0, 0, 0.1) 50%
          );
          background-size: 100% 4px;
          z-index: 50;
          pointer-events: none;
          opacity: 0.5;
        }
        @keyframes slow-drift {
          0%, 100% { transform: scale(1.1) translate(0, 0); }
          50% { transform: scale(1.15) translate(-1%, -1%); }
        }
        .animate-slow-drift {
          animation: slow-drift 30s infinite ease-in-out;
        }
      `}} />
    </div>
  );
}

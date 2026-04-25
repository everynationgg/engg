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
      className={`relative group flex flex-col w-full max-w-[420px] aspect-[10/16] transition-all duration-700 p-1 ${isOffline ? "cursor-not-allowed grayscale" : "cursor-pointer"
        }`}
    >
      {/* Title Header (Top Aligned as per reference) */}
      <div className="relative z-20 mb-4 px-2">
         <h2 className="font-orbitron font-black text-sm md:text-base tracking-[0.2em] uppercase text-white group-hover:text-cyan-400 transition-colors">
            {title}
         </h2>
         <div className="w-full h-px bg-gradient-to-r from-white/20 via-white/5 to-transparent mt-2" />
      </div>

      {/* Main Tactical Container */}
      <div className="flex-1 relative overflow-hidden">
        {/* Asymmetric Clipped Background */}
        <div className="absolute inset-0 bg-[#0a0f1e]/40 backdrop-blur-sm border border-white/5 transition-all duration-700 group-hover:bg-cyan-500/5 group-hover:border-cyan-500/20"
             style={{ clipPath: "polygon(0 0, 75% 0, 100% 20%, 100% 100%, 25% 100%, 0 80%)" }} />
        
        {/* Image Container with matching ClipPath */}
        <div className="absolute inset-2 z-0 overflow-hidden" 
             style={{ clipPath: "polygon(0 0, 75% 0, 100% 20%, 100% 100%, 25% 100%, 0 80%)" }}>
          <img
            src={image}
            alt={title}
            className={`w-full h-full object-cover transition-transform duration-[3000ms] ease-out ${!isOffline && "group-hover:scale-110"
              }`}
          />
          {/* HUD Gradients */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#020408] via-transparent to-transparent opacity-80" />
          
          {/* Offline Overlay */}
          {isOffline && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 backdrop-blur-[2px] z-10">
              <FaLock className="text-white/10 text-4xl mb-4" />
              <span className="font-mono text-[8px] uppercase tracking-[0.5em] text-white/30">Sector_Locked</span>
            </div>
          )}
        </div>

        {/* Tactical HUD Accents */}
        <div className="absolute top-4 right-10 w-2 h-2 bg-cyan-500/40 rounded-full animate-pulse" />
        <div className="absolute bottom-10 left-4 flex flex-col gap-1 opacity-40 group-hover:opacity-100 transition-opacity">
           <div className="w-6 h-0.5 bg-cyan-500" />
           <div className="w-4 h-0.5 bg-cyan-500/40" />
        </div>

        {/* Card Content Overlay */}
        <div className="absolute inset-x-8 bottom-8 z-20 flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className={`w-1.5 h-1.5 rounded-full ${isOffline ? "bg-red-500/40" : "bg-cyan-500 shadow-[0_0_10px_#00f3ff]"}`} />
            <span className="font-mono text-[8px] uppercase tracking-[0.4em] text-white/40">
              {subtitle}
            </span>
          </div>

          <p className="font-mono text-[10px] uppercase tracking-wider text-white/50 leading-relaxed line-clamp-3 group-hover:text-white/80 transition-colors">
            {description}
          </p>

          {!isOffline && (
            <div className="mt-4 flex items-center gap-3 text-cyan-400">
              <span className="font-orbitron text-[9px] uppercase tracking-[0.4em] font-bold">Deploy_Link</span>
              <FaExternalLinkAlt className="text-[8px]" />
            </div>
          )}
        </div>
      </div>

      {/* Outer Glow */}
      <div className="absolute inset-0 -z-10 bg-cyan-500/0 group-hover:bg-cyan-500/10 blur-[60px] transition-all duration-1000 scale-75 group-hover:scale-110" />
    </motion.div>
  );
}

export default function Hub() {
  const games = [
    {
      title: "Error Newform Detected",
      subtitle: "Newform Neural Engine",
      description: "A high-stakes network defense simulator. Identify the Newform anomaly before system compromise.",
      image: "/hub_newform.png",
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
    <div className="min-h-screen bg-[#020408] text-white pt-8 md:pt-12 relative flex flex-col items-center overflow-x-hidden selection:bg-cyan-500/30">
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
      <header className="relative z-10 w-full max-w-[1440px] px-8 md:px-16 pt-16 md:pt-24 flex flex-col gap-4 mb-8 md:mb-0">
        <div className="flex items-center gap-4">
          <div className="w-12 h-[2px] bg-cyan-500 shadow-[0_0_15px_#00f3ff]" />
          <span className="font-mono text-[10px] uppercase tracking-[0.8em] text-cyan-500">Mission_Select</span>
        </div>
        <h1 className="font-orbitron font-black text-3xl md:text-6xl tracking-[0.2em] uppercase text-white">
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
      <div className="relative z-10 w-full max-w-[1440px] px-8 md:px-16 pt-12 pb-20 md:py-32">
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

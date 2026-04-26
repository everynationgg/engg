import { motion, useScroll, useTransform } from "framer-motion";
import { FaExternalLinkAlt, FaLock, FaTerminal, FaShieldAlt, FaCubes, FaArrowLeft } from "react-icons/fa";
import AlliesSidebar from "@/components/AlliesSidebar";
import TacticalSlate from "@/components/common/TacticalSlate";
import { useParallax } from "@/hooks/useParallax";
import { useRef } from "react";
import { SciFiButton } from "@/components/common/SciFiButton";

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
  const { x, y } = useParallax(15);

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
      style={{ x, y }}
      onClick={handleEntry}
      className={`relative group w-full max-w-[420px] aspect-[10/16] transition-all duration-700 ${isOffline ? "cursor-not-allowed grayscale" : "cursor-pointer"}`}
    >
      <TacticalSlate color={isOffline ? "#ffffff40" : "#00f3ff"} className="h-full">
        {/* Title Header */}
        <div className="relative z-20 mb-4 px-6 pt-6">
           <h2 className="font-orbitron font-black text-sm md:text-base tracking-[0.2em] uppercase text-white group-hover:text-cyan-400 transition-colors">
              {title}
           </h2>
           <div className="w-full h-px bg-gradient-to-r from-cyan-500/40 via-cyan-500/5 to-transparent mt-2" />
        </div>

        {/* Image Container */}
        <div className="absolute inset-0 z-0 opacity-40 group-hover:opacity-60 transition-opacity duration-700">
          <img
            src={image}
            alt={title}
            className={`w-full h-full object-cover transition-transform duration-[3000ms] ease-out ${!isOffline && "group-hover:scale-110"}`}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#020408] via-transparent to-transparent opacity-90" />
        </div>

        {/* Content Overlay */}
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
              <FaExternalLinkAlt className="text-[8px] group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
            </div>
          )}

          {isOffline && (
            <div className="mt-4 flex items-center gap-2 text-white/20">
              <FaLock className="text-[10px]" />
              <span className="font-orbitron text-[9px] uppercase tracking-[0.4em]">Sector_Locked</span>
            </div>
          )}
        </div>
      </TacticalSlate>
    </motion.div>
  );
}

export default function Hub() {
  const { x, y } = useParallax(30); // Stronger parallax for background

  const games = [
    {
      title: "Errant Night",
      subtitle: "Neural Defense Protocol",
      description: "A high-stakes network defense simulator. Trace the anomaly through the digital ether before system-wide compromise.",
      image: "/hub_errant.webp",
      href: "/end",
      status: "online" as const
    },
    {
      title: "Engraved Nether",
      subtitle: "Sub-Surface Extraction",
      description: "Descend into the encrypted depths of the Nether. Harvest exotic matter while evading the ancient sentinels of the deep.",
      image: "/hub_engraved.webp",
      status: "offline" as const
    },
    {
      title: "Epsilon Nine",
      subtitle: "Orbital Command",
      description: "Coordinate the defense of the Epsilon Nine station. Manage energy grids and orbital batteries against incoming threats.",
      image: "/hub_epsilon.webp",
      status: "offline" as const
    }
  ];

  return (
    <div className="min-h-screen bg-[#020408] text-white pt-8 md:pt-12 relative flex flex-col items-center overflow-x-hidden selection:bg-cyan-500/30">
      <AlliesSidebar />
      {/* Cinematic Background Layer */}
      <motion.div
        className="fixed inset-0 z-0 bg-cover bg-center transition-transform duration-[1000ms] ease-out scale-110"
        style={{ backgroundImage: "url('/hub_bg.png')", x, y }}
      />
      <div className="fixed inset-0 z-1 bg-gradient-to-b from-[#020408]/80 via-[#020408]/40 to-[#020408]/90" />
      
      {/* Global HUD Scanning Line */}
      <div className="fixed inset-0 pointer-events-none z-20 scanline" />

      {/* Main Content Area */}
      <main className="relative z-20 w-full max-w-[1440px] px-8 md:px-16 pt-52 flex flex-col items-center">
        {/* Navigation Action - Non-sticky */}
        <div className="w-full mb-8">
           <SciFiButton variant="outline" onClick={() => window.location.href = "/"} className="bg-white/5 border-white/10">
             <FaArrowLeft className="text-xs group-hover:-translate-x-1 transition-transform mr-2" />
             Return_Home
           </SciFiButton>
        </div>

        {/* Header Overlay */}
        <header className="w-full flex flex-col gap-4 mb-8 md:mb-0">
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
    </main>

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

import { motion } from "framer-motion";
import { FaExternalLinkAlt, FaLock, FaTerminal, FaShieldAlt, FaCubes } from "react-icons/fa";
import AlliesSidebar from "@/components/AlliesSidebar";
import AntiGravity3D from "@/components/AntiGravity3D";

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
      className={`relative group w-full max-w-[420px] aspect-[10/16] transition-all duration-700 ${isOffline ? "cursor-not-allowed grayscale opacity-60" : "cursor-pointer hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(0,243,255,0.15)]"} rounded-3xl overflow-hidden bg-white/5 border border-white/10 backdrop-blur-md`}
    >
        {/* Title Header */}
        <div className="absolute top-0 inset-x-0 z-20 px-8 pt-8 pb-4 bg-gradient-to-b from-black/80 to-transparent">
           <h2 className="font-inter font-semibold text-xl md:text-2xl tracking-wide text-white group-hover:text-cyan-400 transition-colors">
              {title}
           </h2>
        </div>

        {/* Image Container */}
        <div className="absolute inset-0 z-0 transition-opacity duration-700">
          <img
            src={image}
            alt={title}
            className={`w-full h-full object-cover transition-transform duration-[3000ms] ease-out ${!isOffline && "group-hover:scale-105"}`}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#050510] via-[#050510]/60 to-transparent opacity-90" />
        </div>

        {/* Content Overlay */}
        <div className="absolute inset-x-8 bottom-8 z-20 flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className={`w-2 h-2 rounded-full ${isOffline ? "bg-red-500/40" : "bg-cyan-500 shadow-[0_0_10px_#00f3ff]"}`} />
            <span className="font-orbitron text-[10px] uppercase tracking-[0.2em] text-cyan-400/80">
              {subtitle}
            </span>
          </div>

          <p className="font-inter text-sm text-white/60 leading-relaxed line-clamp-3 group-hover:text-white/90 transition-colors">
            {description}
          </p>

          {!isOffline && (
            <div className="mt-4 flex items-center gap-3 text-cyan-400 font-medium">
              <span className="font-inter text-sm tracking-wide">Deploy Link</span>
              <FaExternalLinkAlt className="text-xs group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
            </div>
          )}

          {isOffline && (
            <div className="mt-4 flex items-center gap-2 text-white/30">
              <FaLock className="text-xs" />
              <span className="font-inter text-sm tracking-wide">Sector Locked</span>
            </div>
          )}
        </div>
    </motion.div>
  );
}

export default function Hub() {
  const games = [
    {
      title: "Error: Newform Detected",
      subtitle: "Neural Defense Protocol",
      description: "A high-stakes network defense simulator. Trace the anomaly through the digital ether before system-wide compromise.",
      image: "/hub_newform.webp",
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
    <div className="min-h-screen bg-[#050510] text-white pt-8 md:pt-12 relative flex flex-col items-center overflow-x-hidden selection:bg-cyan-500/30">
      <AlliesSidebar />
      
      {/* 3D AntiGravity Background */}
      <AntiGravity3D />
      
      {/* Soft gradient overlay */}
      <div className="fixed inset-0 z-1 pointer-events-none bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/10 via-[#050510]/80 to-[#050510]" />

      {/* Header Overlay */}
      <header className="relative z-10 w-full max-w-[1440px] px-8 md:px-16 pt-16 md:pt-24 flex flex-col gap-6 mb-8 md:mb-0 items-center text-center">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-4 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
          <span className="font-orbitron text-[10px] uppercase tracking-[0.3em] text-cyan-400">Mission Select</span>
        </motion.div>
        <motion.h1 initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }} className="font-inter font-bold text-5xl md:text-7xl tracking-tight text-white drop-shadow-2xl">
          Gaming <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">Hub</span>
        </motion.h1>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="flex items-center gap-8 mt-6 opacity-50">
          <div className="flex items-center gap-3">
            <FaTerminal className="text-sm" />
            <span className="font-inter text-sm tracking-wide">Sys Status: Ready</span>
          </div>
          <div className="flex items-center gap-3">
            <FaShieldAlt className="text-sm" />
            <span className="font-inter text-sm tracking-wide">Network: Secure</span>
          </div>
          <div className="flex items-center gap-3">
            <FaCubes className="text-sm" />
            <span className="font-inter text-sm tracking-wide">Nodes: 3 Detected</span>
          </div>
        </motion.div>
      </header>

      {/* Main Mission Deck */}
      <div className="relative z-10 w-full max-w-[1440px] px-8 md:px-16 pt-16 pb-20 md:py-24">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 lg:gap-12 justify-items-center">
          {games.map((game, i) => (
            <GameCard key={game.title} {...game} index={i} />
          ))}
        </div>
      </div>

      {/* System Footer Info */}
      <footer className="relative z-10 mt-auto w-full border-t border-white/5 bg-black/20 backdrop-blur-2xl py-8">
        <div className="max-w-[1440px] mx-auto px-8 flex justify-between items-center opacity-40">
          <span className="font-orbitron text-xs uppercase tracking-[0.4em]">ENGG // CENTRAL RELAY</span>
          <div className="flex items-center gap-8">
            <span className="font-inter text-xs uppercase tracking-widest">Uptime: 99.98%</span>
            <span className="font-inter text-xs uppercase tracking-widest">Encryption: AES-256</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

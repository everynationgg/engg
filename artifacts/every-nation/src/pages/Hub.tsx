import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaExternalLinkAlt, FaLock, FaTerminal, FaShieldAlt, FaCubes, FaHistory, FaCheckCircle, FaClock } from "react-icons/fa";
import AlliesSidebar from "@/components/AlliesSidebar";
import TacticalSlate from "@/components/common/TacticalSlate";
import { useParallax } from "@/hooks/useParallax";
import { HUDOverlay } from "@/components/common/HUDOverlay";
import { SciFiButton } from "@/components/common/SciFiButton";
import { useAuth } from "@/hooks/useAuth";

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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      style={{ x, y }}
      onClick={handleEntry}
      className={`relative group w-full max-w-[420px] aspect-[10/16] transition-all duration-700 ${isOffline ? "cursor-not-allowed grayscale" : "cursor-pointer"}`}
    >
      <TacticalSlate color={isOffline ? "#ffffff20" : "#00f3ff"} className="h-full">
        {/* Title Header */}
        <div className="relative z-20 mb-4 px-6 pt-6">
           <h2 className="font-orbitron font-black text-[12px] tracking-[0.3em] uppercase text-white/80 group-hover:text-cyan-400 transition-colors">
              {title}
           </h2>
           <div className="w-full h-px bg-gradient-to-r from-cyan-500/20 via-cyan-500/5 to-transparent mt-2" />
        </div>

        {/* Image Container */}
        <div className="absolute inset-0 z-0 opacity-20 group-hover:opacity-40 transition-opacity duration-700">
          <img
            src={image}
            alt={title}
            className={`w-full h-full object-cover transition-transform duration-[3000ms] ease-out ${!isOffline && "group-hover:scale-105"}`}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#020408] via-transparent to-transparent opacity-90" />
        </div>

        {/* Content Overlay */}
        <div className="absolute inset-x-8 bottom-8 z-20 flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className={`w-1 h-1 rounded-full ${isOffline ? "bg-red-500/40" : "bg-cyan-500"}`} />
            <span className="font-mono text-[7px] uppercase tracking-[0.4em] text-white/30">
              {subtitle}
            </span>
          </div>

          <p className="font-mono text-[9px] uppercase tracking-wider text-white/30 leading-relaxed line-clamp-3 group-hover:text-white/60 transition-colors">
            {description}
          </p>

          {!isOffline && (
            <div className="mt-4 flex items-center gap-3 text-cyan-400/60 group-hover:text-cyan-400 transition-colors">
              <span className="font-orbitron text-[8px] uppercase tracking-[0.4em] font-bold">Deploy_Link</span>
              <FaExternalLinkAlt className="text-[7px]" />
            </div>
          )}

          {isOffline && (
            <div className="mt-4 flex items-center gap-2 text-white/10">
              <FaLock className="text-[9px]" />
              <span className="font-orbitron text-[8px] uppercase tracking-[0.4em]">Sector_Locked</span>
            </div>
          )}
        </div>
      </TacticalSlate>
    </motion.div>
  );
}

export default function Hub() {
  const { x, y } = useParallax(20);
  const { token, refreshUser } = useAuth();
  const [claiming, setClaiming] = useState(false);
  const [claimed, setClaimed] = useState(false);
  const [activities, setActivities] = useState<any[]>([]);

  useEffect(() => {
    if (token) {
      fetch(`${import.meta.env.VITE_API_URL}/api/user/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => {
        setActivities(data.activities || []);
        // Source of Truth 1: Explicit field from DB
        if (data.lastClaimedAt) {
          const hoursSince = (Date.now() - new Date(data.lastClaimedAt).getTime()) / (1000 * 60 * 60);
          if (hoursSince < 24) setClaimed(true);
        } else {
          // Source of Truth 2: Activity logs (Fallback/Redundancy)
          const lastDaily = data.activities?.find((a: any) => 
            a.description.includes("Daily_Tactical_Sync") || 
            a.description.includes("Daily_Sync_Success")
          );
          if (lastDaily) {
            const hoursSince = (Date.now() - new Date(lastDaily.timestamp).getTime()) / (1000 * 60 * 60);
            if (hoursSince < 24) setClaimed(true);
          }
        }
      });
    }
  }, [token]);

  const handleClaim = async () => {
    if (claimed || claiming || !token) return;
    setClaiming(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/user/claim-daily`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setClaimed(true);
        refreshUser();
      }
    } finally {
      setClaiming(false);
    }
  };

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
    <HUDOverlay pageLabel="MISSION_HUB">
      <div className="min-h-screen relative flex flex-col items-center overflow-x-hidden selection:bg-cyan-500/30">
        <AlliesSidebar />
        
        {/* Cinematic Background Layer */}
        <motion.div
          className="fixed inset-0 z-0 bg-cover bg-center opacity-40 grayscale"
          style={{ backgroundImage: "url('/hub_bg.png')", x, y }}
        />
        <div className="fixed inset-0 z-1 bg-gradient-to-b from-[#020408]/90 via-[#020408]/60 to-[#020408]/95" />
        
        {/* Main Content Area */}
        <main className="relative z-20 w-full max-w-[1600px] px-6 md:px-12 xl:px-16 pb-32 flex flex-col lg:flex-row gap-16 items-start">
          
          <div className="flex-1 flex flex-col w-full">
            {/* Header Clearance Spacer */}
            <div className="h-[140px] lg:h-[180px] w-full shrink-0 pointer-events-none" />

            {/* Header Overlay */}
            <header className="w-full flex flex-col items-center lg:items-start gap-4 mb-12 text-center lg:text-left px-4 md:px-8">
              <div className="flex items-center gap-3">
                <div className="w-8 h-[1px] bg-cyan-500/40" />
                <span className="font-mono text-[9px] uppercase tracking-[0.6em] text-cyan-400/60">Node_Selection</span>
              </div>
              <h1 className="font-orbitron font-black text-4xl lg:text-5xl tracking-[0.4em] uppercase text-white leading-tight">
                Gaming <span className="text-cyan-400">Hub</span>
              </h1>
            </header>

            {/* Daily Tactical Briefing */}
            <div className="relative z-30">
              <TacticalSlate>
               <div className="p-8 flex flex-col md:flex-row items-center justify-between gap-8">
                  <div className="flex items-center gap-6">
                    <div className="w-12 h-12 border border-cyan-500/20 flex items-center justify-center relative">
                       <div className="absolute inset-0 bg-cyan-400/5 animate-pulse" />
                       <FaTerminal className="text-cyan-400 text-xl" />
                    </div>
                    <div className="flex flex-col gap-1">
                       <h3 className="font-orbitron text-[14px] font-black uppercase tracking-[0.3em] text-white">Daily Tactical Briefing</h3>
                       <span className="font-mono text-[10px] uppercase tracking-[0.4em] text-white/30">Status: {claimed ? "IDENTITY SYNCED" : "SYNC REQUIRED"}</span>
                    </div>
                  </div>
                  
                  <SciFiButton 
                    variant={claimed ? "ghost" : "primary"}
                    disabled={claimed || claiming}
                    onClick={handleClaim}
                    className="min-w-[200px]"
                  >
                    {claiming ? "SYNCING..." : claimed ? "PROTOCOL COMPLETE" : "CLAIM DAILY"}
                  </SciFiButton>
               </div>
              </TacticalSlate>
            </div>

            {/* Main Mission Deck */}
            <div className="relative z-10 w-full pb-32">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 justify-items-center">
                {games.map((game, i) => (
                  <GameCard key={game.title} {...game} index={i} />
                ))}
              </div>
            </div>
          </div>

          {/* Operation History Sidebar */}
          <aside className="w-full lg:w-[320px] sticky top-40 flex flex-col gap-6">
             <div className="flex items-center gap-3 mb-2">
                <FaHistory className="text-cyan-400/40 text-xs" />
                <span className="font-mono text-[9px] uppercase tracking-[0.4em] text-white/40">Recent_Operations</span>
             </div>
             
             <div className="flex flex-col gap-3">
                {activities.length === 0 ? (
                   <div className="p-6 border border-white/5 bg-white/[0.02] flex flex-col items-center gap-4">
                      <FaClock className="text-white/5 text-xl" />
                      <span className="font-mono text-[7px] uppercase tracking-[0.4em] text-white/10 text-center">No_Operational_History_Detected</span>
                   </div>
                ) : (
                  activities.map((act, i) => (
                    <motion.div
                      key={act.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="p-4 border border-white/5 bg-white/[0.02] group hover:bg-white/[0.05] transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-mono text-[6px] uppercase tracking-widest text-cyan-400/60">{act.type}</span>
                        <span className="font-mono text-[6px] text-white/10">{new Date(act.timestamp).toLocaleDateString()}</span>
                      </div>
                      <p className="font-mono text-[8px] uppercase tracking-wider text-white/40 group-hover:text-white/80 transition-colors">
                        {act.description}
                      </p>
                      {act.amount && (
                        <div className="mt-2 flex items-center gap-1">
                          <span className="font-orbitron text-[8px] font-bold text-cyan-400">+{act.amount}</span>
                          <span className="font-mono text-[6px] text-cyan-400/40 uppercase">Credits</span>
                        </div>
                      )}
                    </motion.div>
                  ))
                )}
             </div>
          </aside>
        </main>
      </div>
    </HUDOverlay>
  );
}

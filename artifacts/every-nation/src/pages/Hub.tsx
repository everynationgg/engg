import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FaTerminal } from "react-icons/fa";
import TacticalSlate from "@/components/common/TacticalSlate";
import { useParallax } from "@/hooks/useParallax";
import { HUDOverlay } from "@/components/common/HUDOverlay";
import { SciFiButton } from "@/components/common/SciFiButton";
import { useAuth } from "@/hooks/useAuth";
import { HeroSection } from "@/components/ui/feature-carousel";


export default function Hub() {
  const { x, y } = useParallax(20);
  const { token, refreshUser, isLoggedIn } = useAuth();
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
      image: "/ERRANT.png",
      href: "/end",
      status: "online" as const
    },
    {
      title: "Engraved Nether",
      subtitle: "Sub-Surface Extraction",
      description: "Descend into the encrypted depths of the Nether. Harvest exotic matter while evading the ancient sentinels of the deep.",
      image: "/hub_engraved.webp",
      href: "https://triple-triad-theta.vercel.app",
      status: "online" as const
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

        {/* Cinematic Background Layer */}
        <motion.div
          className="fixed inset-0 z-0 bg-cover bg-center opacity-40 grayscale"
          style={{ backgroundImage: "url('/hub_bg.png')", x, y }}
        />
        <div className="fixed inset-0 z-1 bg-gradient-to-b from-[#020408]/90 via-[#020408]/60 to-[#020408]/95" />

        {/* Main Content Area */}
        <main className="relative z-20 w-full max-w-[1400px] px-6 md:px-12 xl:px-16 pb-32 flex flex-col items-center">

          <div className="flex-1 flex flex-col w-full">
            {/* Header Clearance Spacer */}
            <div className="h-[104px] w-full shrink-0 pointer-events-none" />

            {/* Header Overlay */}
            <header className="w-full flex flex-col items-center gap-4 mb-12 text-center px-4 md:px-8">
              <div className="flex items-center gap-3">
                <div className="w-8 h-[1px] bg-cyan-500/40" />
                <span className="font-mono text-[9px] uppercase tracking-[0.6em] text-cyan-400/60">Node_Selection</span>
              </div>
              <h1 className="font-orbitron font-black text-2xl sm:text-3xl lg:text-4xl tracking-[0.4em] uppercase text-white leading-tight">
                Gaming <span className="text-cyan-400">Hub</span>
              </h1>
            </header>

            {/* Daily Tactical Briefing */}
            {isLoggedIn && (
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
            )}

            {/* Main Mission Deck */}
            <div className="relative z-10 w-full pb-32">
              <HeroSection
                title={<>SELECT <span className="text-cyan-400">GAME</span></>}
                subtitle="Select a sector to deploy your squad."
                images={games.map(g => ({
                    src: g.image,
                    alt: g.title,
                    status: g.status,
                    onClick: () => {
                        if (g.status !== 'offline' && g.href) {
                            window.location.href = g.href;
                        }
                    }
                }))}
              />
            </div>
          </div>


        </main>
      </div>
    </HUDOverlay>
  );
}

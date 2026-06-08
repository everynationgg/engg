import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FaTerminal } from "react-icons/fa";
import TacticalSlate from "@/components/common/TacticalSlate";
import { useParallax } from "@/hooks/useParallax";
import { HUDOverlay } from "@/components/common/HUDOverlay";
import { SciFiButton } from "@/components/common/SciFiButton";
import { useAuth } from "@/hooks/useAuth";
import PortalDeck from "@/components/hub/PortalDeck";
import { gameCatalog } from "@/lib/gameCatalog";


export default function Hub() {
  const { x, y } = useParallax(20);
  const { token, refreshUser, isLoggedIn } = useAuth();
  const [claiming, setClaiming] = useState(false);
  const [claimed, setClaimed] = useState(false);
  const [activities, setActivities] = useState<any[]>([]);
  const [motionProfile, setMotionProfile] = useState<"reduced" | "mobile" | "desktop">("reduced");

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    let lastWidth = window.innerWidth;

    const handleUpdate = (force = false) => {
      const currentWidth = window.innerWidth;
      if (!force && currentWidth === lastWidth) return;
      lastWidth = currentWidth;

      if (mediaQuery.matches) {
        setMotionProfile("reduced");
      } else {
        const isMobileDevice = currentWidth < 1024 || "ontouchstart" in window || navigator.maxTouchPoints > 0;
        setMotionProfile(isMobileDevice ? "mobile" : "desktop");
      }
    };

    handleUpdate(true);

    const mediaChangeListener = () => {
      if (mediaQuery.matches) {
        setMotionProfile("reduced");
      } else {
        const isMobileDevice = window.innerWidth < 1024 || "ontouchstart" in window || navigator.maxTouchPoints > 0;
        setMotionProfile(isMobileDevice ? "mobile" : "desktop");
      }
    };

    const handleResize = () => {
      handleUpdate(false);
    };

    mediaQuery.addEventListener("change", mediaChangeListener);
    window.addEventListener("resize", handleResize);
    return () => {
      mediaQuery.removeEventListener("change", mediaChangeListener);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

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

  const games = gameCatalog;

  return (
    <HUDOverlay pageLabel="MISSION_HUB">
      <div className="h-[100svh] relative flex flex-col items-center overflow-hidden selection:bg-cyan-500/30 w-full select-none">

        {/* Cinematic Background Layer */}
        {motionProfile === "desktop" ? (
          <motion.div
            className="fixed inset-0 z-0 bg-cover bg-center opacity-40 grayscale"
            style={{ backgroundImage: "url('/hub_bg.png')", x, y }}
          />
        ) : motionProfile === "mobile" ? (
          <motion.div
            className="fixed inset-0 z-0 bg-cover bg-center opacity-40 grayscale"
            style={{ backgroundImage: "url('/hub_bg.png')" }}
            animate={{ scale: [1.02, 1.06, 1.02], x: [-6, 6, -6], y: [-4, 4, -4] }}
            transition={{ duration: 24, repeat: Infinity, ease: "easeInOut" }}
          />
        ) : (
          <div
            className="fixed inset-0 z-0 bg-cover bg-center opacity-40 grayscale"
            style={{ backgroundImage: "url('/hub_bg.png')" }}
          />
        )}
        <div className="fixed inset-0 z-1 bg-gradient-to-b from-[#020408]/90 via-[#020408]/60 to-[#020408]/95" />

        {/* Main Content Area */}
        <main className="relative z-20 w-full max-w-[1400px] px-4 sm:px-6 md:px-12 xl:px-16 flex-1 flex flex-col items-center min-h-0 overflow-hidden pb-4">

          <div className="flex-1 flex flex-col w-full min-h-0 overflow-hidden">
            {/* Header Clearance Spacer */}
            <div className="h-14 sm:h-20 lg:h-24 w-full shrink-0 pointer-events-none" />

            {/* Header Overlay */}
            <header className="w-full flex flex-col items-center gap-1 sm:gap-2 mb-2 sm:mb-4 text-center px-4 md:px-8 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-6 h-[1px] bg-cyan-500/40" />
                <span className="font-mono text-[9px] uppercase tracking-[0.6em] text-cyan-300/75">Node_Selection</span>
              </div>
              <h1 className="font-orbitron font-black text-lg sm:text-2xl lg:text-3xl tracking-[0.4em] uppercase text-white leading-tight">
                Gaming <span className="text-cyan-400">Hub</span>
              </h1>
              <p className="max-w-xl text-[10px] uppercase tracking-[0.22em] text-white/65 sm:text-xs">
                Choose a live operation and deploy into the network.
              </p>
            </header>

            {/* Daily Tactical Briefing */}
            {isLoggedIn && (
              <div className="relative z-30 shrink-0 mb-3 sm:mb-4 w-full">
                <TacticalSlate>
                  <div className="p-3 sm:p-5 flex flex-col md:flex-row items-center justify-between gap-4 sm:gap-6">
                    <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 text-center sm:text-left">
                      <div className="w-10 h-10 border border-cyan-500/20 flex items-center justify-center relative shrink-0">
                        <div className="absolute inset-0 bg-cyan-400/5 animate-pulse" />
                        <FaTerminal className="text-cyan-400 text-lg" />
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <h3 className="font-orbitron text-[14px] font-black uppercase tracking-[0.3em] text-white">Daily Tactical Briefing</h3>
                        <span className="font-mono text-[10px] uppercase tracking-[0.4em] text-white/30">Status: {claimed ? "IDENTITY SYNCED" : "SYNC REQUIRED"}</span>
                      </div>
                    </div>

                    <SciFiButton
                      variant={claimed ? "ghost" : "primary"}
                      disabled={claimed || claiming}
                      onClick={handleClaim}
                      className="min-w-[180px] h-9 sm:h-10 text-xs"
                    >
                      {claiming ? "SYNCING..." : claimed ? "PROTOCOL COMPLETE" : "CLAIM DAILY"}
                    </SciFiButton>
                  </div>
                </TacticalSlate>
              </div>
            )}

            {/* Main Mission Deck */}
            <div className="relative z-10 w-full flex-1 min-h-0">
              <PortalDeck games={games} />
            </div>
          </div>

        </main>
      </div>
    </HUDOverlay>
  );
}

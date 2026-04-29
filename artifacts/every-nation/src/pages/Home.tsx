import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { HUDOverlay } from "@/components/common/HUDOverlay";
import { SciFiButton } from "@/components/common/SciFiButton";

export default function Home() {
  const [, navigate] = useLocation();
  const [uiVisible, setUiVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setUiVisible(true), 1000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <HUDOverlay pageLabel="INITIAL_LINK" showVignette={false}>
      <div className="landing-root h-screen relative overflow-hidden">
        <video
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
          src="/bg-video.mp4"
          autoPlay
          muted
          playsInline
        />


        {/* Cinematic Bottom Vignette for Legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none z-10" />

        {/* BOTTOM NAVIGATION HUB - Cinematic Control Panel */}
        <div className="absolute bottom-10 md:bottom-20 left-1/2 -translate-x-1/2 z-20 px-6">
          <AnimatePresence>
            {uiVisible && (
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
                className="flex flex-wrap justify-center gap-4 md:gap-8"
              >
                {/* DISCORD */}
                <SciFiButton
                  variant="outline"
                  className="w-[200px] md:w-[280px] h-12"
                  onClick={() => window.open("https://discord.gg/everynation", "_blank")}
                >
                  <div className="flex flex-col items-center leading-tight">
                    <span className="text-[10px] md:text-[12px] font-black tracking-[0.2em]">DISCORD</span>
                    <span className="font-mono text-[6px] md:text-[7px] text-white/20 tracking-[0.2em]">Link_Discord</span>
                  </div>
                </SciFiButton>

                {/* ENTER (PRIMARY) */}
                <SciFiButton
                  variant="primary"
                  className="w-[200px] md:w-[280px] h-14"
                  onClick={() => navigate("/hub")}
                >
                  <div className="flex flex-col items-center leading-tight">
                    <span className="text-[10px] md:text-[12px] font-black tracking-[0.2em]">ENTER</span>
                    <span className="font-mono text-[6px] md:text-[7px] opacity-40 tracking-[0.2em]">Deploy_Unit</span>
                  </div>
                </SciFiButton>

                {/* SOCIALS */}
                <SciFiButton
                  variant="outline"
                  className="w-[200px] md:w-[280px] h-12"
                  onClick={() => window.open("https://linktr.ee/everynationgg", "_blank")}
                >
                  <div className="flex flex-col items-center leading-tight">
                    <span className="text-[10px] md:text-[12px] font-black tracking-[0.2em]">SOCIALS</span>
                    <span className="font-mono text-[6px] md:text-[7px] text-white/20 tracking-[0.2em]">Link_Nexus</span>
                  </div>
                </SciFiButton>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        {/* System Readout */}
        <div className="absolute bottom-4 left-0 right-0 flex justify-center items-center gap-4 opacity-10 z-10">
          <div className="h-[1px] w-6 bg-white" />
          <span className="font-mono text-[7px] uppercase tracking-[0.8em]">System_Readout_Active</span>
          <div className="h-[1px] w-6 bg-white" />
        </div>
      </div>
    </HUDOverlay>
  );
}

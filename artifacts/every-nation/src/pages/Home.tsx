// v1.0.2
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { HUDOverlay } from "@/components/common/HUDOverlay";
import AuroraShader from "@/components/ui/animated-shader-background";
import LandingNav from "@/components/ui/gradient-menu";

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
        {/* Base: original video background */}
        <video
          className="absolute inset-0 w-full h-full object-cover pointer-events-none scale-[0.9] md:scale-100 origin-center transition-transform"
          src="/bg-video.mp4"
          autoPlay
          muted
          playsInline
        />

        {/* Overlay: shader on top at reduced opacity */}
        <div className="absolute inset-0 w-full h-full pointer-events-none" style={{ opacity: 0.45 }}>
          <AuroraShader />
        </div>

        {/* Cinematic Bottom Vignette for Legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none z-10" />

        {/* BOTTOM NAVIGATION HUB */}
        <div className="absolute bottom-8 md:bottom-16 left-1/2 -translate-x-1/2 z-20 px-4 w-full flex justify-center">
          <AnimatePresence>
            {uiVisible && (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              >
                <LandingNav
                  onDiscord={() => window.open("https://discord.gg/everynation", "_blank")}
                  onEnter={() => navigate("/hub")}
                  onSocials={() => window.open("https://linktr.ee/everynationgg", "_blank")}
                />
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

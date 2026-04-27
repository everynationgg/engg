import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HUDOverlay } from "@/components/common/HUDOverlay";
import { SciFiButton } from "@/components/common/SciFiButton";

export default function Home() {
  const [uiVisible, setUiVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setUiVisible(true), 1000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <HUDOverlay pageLabel="INITIAL_LINK">
      <div className="landing-root h-screen relative overflow-hidden">
        <video
          className="absolute inset-0 w-full h-full object-cover opacity-30 grayscale pointer-events-none"
          src="/bg-video.mp4"
          autoPlay
          muted
          loop
          playsInline
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#020408] via-transparent to-[#020408]/80 pointer-events-none" />

        <div className="absolute inset-0 flex flex-col items-center justify-end pb-32 z-10 px-6">
          <AnimatePresence>
            {uiVisible && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="w-full flex flex-col items-center gap-12"
              >
                <div className="flex flex-wrap justify-center gap-3 w-full max-w-[1200px]">
                  <div className="w-[240px]">
                    <SciFiButton
                      variant="outline"
                      className="w-full"
                      onClick={() => window.open("https://discord.gg/everynation", "_blank")}
                    >
                      <div className="flex flex-col items-center gap-1 py-1">
                        <span className="text-[10px]">Community</span>
                        <span className="font-mono text-[7px] text-white/20 tracking-widest">Link_Discord</span>
                      </div>
                    </SciFiButton>
                  </div>
                  <div className="w-[240px]">
                    <SciFiButton
                      variant="primary"
                      className="w-full"
                      onClick={() => window.location.href = "/hub"}
                    >
                      <div className="flex flex-col items-center gap-1 py-1">
                        <span className="text-[10px]">Gaming Hub</span>
                        <span className="font-mono text-[7px] text-[#020408]/40 tracking-widest uppercase">Deploy_Unit</span>
                      </div>
                    </SciFiButton>
                  </div>
                  <div className="w-[240px]">
                    <SciFiButton
                      variant="outline"
                      className="w-full"
                      onClick={() => window.location.href = "/shop"}
                    >
                      <div className="flex flex-col items-center gap-1 py-1">
                        <span className="text-[10px]">Credit Shop</span>
                        <span className="font-mono text-[7px] text-white/20 tracking-widest">Asset_Market</span>
                      </div>
                    </SciFiButton>
                  </div>
                  <div className="w-[240px]">
                    <SciFiButton
                      variant="outline"
                      className="w-full"
                      onClick={() => window.open("https://linktr.ee/everynationgg", "_blank")}
                    >
                      <div className="flex flex-col items-center gap-1 py-1">
                        <span className="text-[10px]">Socials</span>
                        <span className="font-mono text-[7px] text-white/20 tracking-widest">Link_Nexus</span>
                      </div>
                    </SciFiButton>
                  </div>
                </div>

                {/* System Readout */}
                <div className="flex items-center gap-4 opacity-10">
                  <div className="h-[1px] w-6 bg-white" />
                  <span className="font-mono text-[7px] uppercase tracking-[0.8em]">System_Readout_Active</span>
                  <div className="h-[1px] w-6 bg-white" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </HUDOverlay>
  );
}


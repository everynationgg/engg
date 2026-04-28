import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HUDOverlay } from "@/components/common/HUDOverlay";
import { TacticalButton } from "@/components/common/TacticalButton";

export default function Home() {
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

        <div className="absolute inset-0 flex flex-col items-center justify-center z-10 px-6 pt-10 md:pt-20">
          <AnimatePresence>
            {uiVisible && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1.2, ease: "easeOut" }}
                className="w-full flex flex-col items-center gap-12"
              >
                <div className="flex flex-wrap justify-center gap-8 w-full max-w-[1200px]">
                  {/* DISCORD */}
                  <div className="w-[300px]">
                    <TacticalButton
                      className="w-full h-[44px] md:h-[52px] pl-[60px] md:pl-[72px]"
                      onClick={() => window.open("https://discord.gg/everynation", "_blank")}
                    >
                      <div className="flex flex-col items-start leading-tight">
                        <span className="text-[12px] font-black tracking-[0.2em]">DISCORD</span>
                        <span className="font-mono text-[7px] text-white/30 tracking-[0.2em]">Link_Discord</span>
                      </div>
                    </TacticalButton>
                  </div>

                  {/* ENTER (PRIMARY) */}
                  <div className="w-[300px]">
                    <TacticalButton
                      active
                      className="w-full h-[44px] md:h-[52px] pl-[60px] md:pl-[72px]"
                      onClick={() => window.location.href = "/hub"}
                    >
                      <div className="flex flex-col items-start leading-tight">
                        <span className="text-[12px] font-black text-cyan-400 group-hover:text-white tracking-[0.2em]">ENTER</span>
                        <span className="font-mono text-[7px] text-cyan-400/30 group-hover:text-white/30 tracking-[0.2em]">Deploy_Unit</span>
                      </div>
                    </TacticalButton>
                  </div>

                  {/* SOCIALS */}
                  <div className="w-[300px]">
                    <TacticalButton
                      className="w-full h-[44px] md:h-[52px] pl-[60px] md:pl-[72px]"
                      onClick={() => window.open("https://linktr.ee/everynationgg", "_blank")}
                    >
                      <div className="flex flex-col items-start leading-tight">
                        <span className="text-[12px] font-black tracking-[0.2em]">SOCIALS</span>
                        <span className="font-mono text-[7px] text-white/30 tracking-[0.2em]">Link_Nexus</span>
                      </div>
                    </TacticalButton>
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

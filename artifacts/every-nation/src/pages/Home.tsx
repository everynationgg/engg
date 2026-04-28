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
    <HUDOverlay pageLabel="INITIAL_LINK">
      <div className="landing-root h-screen relative overflow-hidden">
        {/* BACKGROUND VIDEO */}
        <video
          className="absolute inset-0 w-full h-full object-cover opacity-30 pointer-events-none"
          src="/_asset/EN_PAGE_BACKGROUND.webm"
          autoPlay
          muted
          loop
          playsInline
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#020408]/60 pointer-events-none" />

        {/* LOGO, WELCOME TEXT & PRIMARY BUTTON */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-0 mt-[-5vh]">
          <video
            className="w-[260px] h-[260px] object-contain opacity-90"
            src="/_asset/en_page_logo.webm"
            autoPlay
            muted
            loop
            playsInline
          />
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 1 }}
            className="flex flex-col items-center mt-[-30px]"
          >
            <h1 className="font-orbitron text-xl font-black tracking-[0.4em] text-white/80 drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
              WELCOME TO EVERYNATION
            </h1>
            <div className="h-[1px] w-32 bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent mt-4 mb-8" />
            
            <div className="pointer-events-auto">
              <TacticalButton
                active
                className="w-[280px]"
                onClick={() => window.location.href = "/hub"}
              >
                <span className="font-bold tracking-[0.05em] text-white">ENTER</span>
              </TacticalButton>
            </div>
          </motion.div>
        </div>

        <div className="absolute inset-0 flex flex-col items-center justify-end pb-32 z-10 px-6">
          <AnimatePresence>
            {uiVisible && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="w-full flex flex-col items-center gap-12"
              >
                <div className="flex flex-wrap justify-center gap-10 w-full max-w-[1200px]">
                  {/* DISCORD */}
                  <div className="w-[300px]">
                    <TacticalButton
                      className="w-full"
                      onClick={() => window.open("https://discord.gg/everynation", "_blank")}
                    >
                      <span className="font-bold tracking-[0.05em]">DISCORD</span>
                    </TacticalButton>
                  </div>

                  {/* SOCIALS */}
                  <div className="w-[300px]">
                    <TacticalButton
                      className="w-full"
                      onClick={() => window.open("https://linktr.ee/everynationgg", "_blank")}
                    >
                      <span className="font-bold tracking-[0.05em]">SOCIALS</span>
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


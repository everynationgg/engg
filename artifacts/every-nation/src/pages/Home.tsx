// v1.0.2
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { HUDOverlay } from "@/components/common/HUDOverlay";



interface PngButtonProps {
  src: string;
  alt: string;
  onClick: () => void;
  width?: number;
  delay?: number;
}

function PngButton({ src, alt, onClick, width = 260, delay = 0 }: PngButtonProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay, ease: "easeOut" }}
    >
      <motion.button
        onClick={onClick}
        whileHover={{
          scale: 1.1,
          filter:
            "brightness(1.35) drop-shadow(0 0 18px rgba(120, 200, 255, 0.75)) drop-shadow(0 0 6px rgba(255,255,255,0.4))",
        }}
        whileTap={{ scale: 0.94 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        style={{
          background: "transparent",
          border: "none",
          cursor: "pointer",
          padding: 0,
          display: "block",
          width: `${width}px`,
        }}
      >
        <img
          src={src}
          alt={alt}
          draggable={false}
          style={{ width: "100%", height: "auto", display: "block", userSelect: "none", opacity: 0.65 }}
        />
      </motion.button>
    </motion.div>
  );
}

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

        {/* BOTTOM NAVIGATION HUB - PNG Button Row */}
        <div className="absolute bottom-10 md:bottom-16 left-1/2 -translate-x-1/2 z-20 px-6">
          <AnimatePresence>
            {uiVisible && (
              <div className="flex flex-nowrap justify-center items-center gap-2 md:gap-4">
                <PngButton
                  src="/DISCORD.svg"
                  alt="Discord"
                  onClick={() => window.open("https://discord.gg/everynation", "_blank")}
                  width={240}
                  delay={0.3}
                />
                <PngButton
                  src="/ENTER.svg"
                  alt="Enter"
                  onClick={() => navigate("/hub")}
                  width={276}
                  delay={0.1}
                />
                <PngButton
                  src="/SOCIALS.svg"
                  alt="Socials"
                  onClick={() => window.open("https://linktr.ee/everynationgg", "_blank")}
                  width={240}
                  delay={0.3}
                />
              </div>
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

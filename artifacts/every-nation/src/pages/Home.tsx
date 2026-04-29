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
  className?: string;
}

function PngButton({ src, alt, onClick, width = 260, delay = 0, className = "" }: PngButtonProps) {
  return (
    <motion.div
      className={className}
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
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          width: "100%",
          maxWidth: `${width}px`,
        }}
      >
        <div style={{ width: "100%", height: "85px", display: "flex", justifyContent: "center", alignItems: "center" }}>
          <img
            src={src}
            alt={alt}
            draggable={false}
            style={{ width: "100%", height: "auto", display: "block", userSelect: "none", opacity: 0.65, pointerEvents: "none" }}
          />
        </div>
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
          className="absolute inset-0 w-full h-full object-cover pointer-events-none scale-[0.9] md:scale-100 origin-center transition-transform"
          src="/bg-video.mp4"
          autoPlay
          muted
          playsInline
        />

        {/* Cinematic Bottom Vignette for Legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none z-10" />

        {/* BOTTOM NAVIGATION HUB - Responsive Order */}
        <div className="absolute bottom-8 md:bottom-16 left-1/2 -translate-x-1/2 z-20 px-4 w-full md:w-auto">
          <AnimatePresence>
            {uiVisible && (
              <div className="flex flex-col md:flex-row flex-nowrap justify-center items-center gap-4 md:gap-4">
                <PngButton
                  src="/DISCORD.svg"
                  alt="Discord"
                  onClick={() => window.open("https://discord.gg/everynation", "_blank")}
                  width={240}
                  delay={0.3}
                  className="order-2 md:order-1 w-[45%] md:w-auto flex justify-center relative right-6 md:right-auto"
                />
                <PngButton
                  src="/ENTER.svg"
                  alt="Enter"
                  onClick={() => navigate("/hub")}
                  width={276}
                  delay={0.1}
                  className="order-1 md:order-2 w-[55%] md:w-auto flex justify-center"
                />
                <PngButton
                  src="/SOCIALS.svg"
                  alt="Socials"
                  onClick={() => window.open("https://linktr.ee/everynationgg", "_blank")}
                  width={240}
                  delay={0.3}
                  className="order-3 md:order-3 w-[45%] md:w-auto flex justify-center relative left-6 bottom-4 md:left-auto md:bottom-auto"
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

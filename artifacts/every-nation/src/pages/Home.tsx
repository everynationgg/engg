import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

function playHoverSound() {
  try {
    const ctx = new AudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(900, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(680, ctx.currentTime + 0.09);
    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.07, ctx.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.13);
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.16);
  } catch {
  }
}

interface ButtonProps {
  label: string;
  subtext?: string;
  onClick?: () => void;
  variant?: "primary" | "default";
}

function GlassButton({ label, subtext, onClick, variant = "default" }: ButtonProps) {
  return (
    <button
      className={`glass-btn ${variant === "primary" ? "glass-btn--primary" : ""}`}
      onClick={onClick}
      onMouseEnter={playHoverSound}
    >
      <div className="flex flex-col items-center gap-1">
        <span className="font-orbitron text-[11px] md:text-[13px] font-bold tracking-[0.2em] uppercase text-white">
          {label}
        </span>
        {subtext && (
          <span className="font-mono text-[8px] md:text-[9px] tracking-[0.1em] uppercase text-white/40">
            {subtext}
          </span>
        )}
      </div>
      <div className="btn-shimmer" />
      <div className="btn-corner btn-corner--tl" />
      <div className="btn-corner btn-corner--tr" />
      <div className="btn-corner btn-corner--bl" />
      <div className="btn-corner btn-corner--br" />
    </button>
  );
}

export default function Home() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [uiVisible, setUiVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setUiVisible(true), 1500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="landing-root overflow-hidden">
      <video
        ref={videoRef}
        className="bg-video"
        src="/bg-video.mp4"
        autoPlay
        muted
        loop
        playsInline
      />
      <div className="bg-overlay" />

      <div className="absolute inset-0 flex flex-col items-center justify-between py-12 md:py-24 z-10 px-6">
        {/* Animated Logo */}
        <AnimatePresence>
          {uiVisible && (
            <motion.div
              initial={{ opacity: 0, y: -50, scale: 0.8 }}
              animate={{ 
                opacity: 1, 
                y: 0, 
                scale: 1,
                filter: ["drop-shadow(0 0 20px rgba(239, 68, 68, 0.2))", "drop-shadow(0 0 40px rgba(6, 182, 212, 0.4))", "drop-shadow(0 0 20px rgba(239, 68, 68, 0.2))"]
              }}
              transition={{ 
                duration: 1.2, 
                filter: { duration: 4, repeat: Infinity } 
              }}
              className="relative w-48 md:w-80 lg:w-96"
            >
              <div className="flex flex-col items-center">
                <h1 className="font-orbitron font-black text-6xl md:text-8xl tracking-[0.3em] uppercase text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.2)]">
                  ENGG
                </h1>
                <div className="w-24 h-px bg-gradient-to-r from-transparent via-cyan-500 to-transparent mt-4" />
                <span className="font-mono text-[10px] tracking-[0.8em] uppercase text-white/30 mt-4">Every Nation Gaming</span>
              </div>
              {/* Lightning/Fire Flickering Overlays */}
              <motion.div 
                animate={{ opacity: [0, 0.3, 0, 0.5, 0] }}
                transition={{ duration: 0.2, repeat: Infinity, repeatDelay: 3 }}
                className="absolute inset-0 bg-cyan-400/10 mix-blend-overlay rounded-full blur-3xl"
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Buttons Row */}
        <AnimatePresence>
          {uiVisible && (
            <motion.div 
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="w-full flex flex-col items-center gap-8"
            >
              <div className="buttons-row w-full max-w-[800px] flex flex-wrap justify-center gap-4 md:gap-6">
                <div className="w-full sm:w-[calc(50%-12px)] lg:w-[calc(25%-18px)]">
                  <GlassButton
                    label="Community"
                    subtext="Join Discord"
                    onClick={() => window.open("https://discord.gg/engg", "_blank")}
                  />
                </div>
                <div className="w-full sm:w-[calc(50%-12px)] lg:w-[calc(25%-18px)]">
                  <GlassButton
                    label="Gaming Hub"
                    subtext="Enter Mission Control"
                    variant="primary"
                    onClick={() => window.location.href = "/hub"}
                  />
                </div>
                <div className="w-full sm:w-[calc(50%-12px)] lg:w-[calc(25%-18px)]">
                  <GlassButton
                    label="Credit Shop"
                    subtext="Acquire CC Assets"
                    onClick={() => window.location.href = "/shop"}
                  />
                </div>
                <div className="w-full sm:w-[calc(50%-12px)] lg:w-[calc(25%-18px)]">
                  <GlassButton
                    label="Socials"
                    subtext="Connect with ENGG"
                    onClick={() => window.open("https://linktr.ee/engg", "_blank")}
                  />
                </div>
              </div>

              {/* System Footer Info */}
              <div className="flex items-center gap-6 opacity-20 hidden md:flex">
                <span className="font-mono text-[9px] uppercase tracking-[0.5em]">System_Log: 0XFF2A9</span>
                <div className="w-12 h-px bg-white/20" />
                <span className="font-mono text-[9px] uppercase tracking-[0.5em]">Rebranding: ENGG_INIT</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

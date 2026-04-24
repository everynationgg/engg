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
      <div className="flex flex-col items-center justify-center gap-2 relative z-10 w-full">
        <div className="font-orbitron text-[11px] md:text-[12px] font-black tracking-[0.4em] uppercase text-white/90 group-hover:text-white transition-colors text-center w-full">
          {label}
        </div>
        {subtext && (
          <div className="font-mono text-[8px] md:text-[9px] tracking-[0.2em] uppercase text-white/30 group-hover:text-cyan-400/60 transition-colors text-center w-full">
            {subtext}
          </div>
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

      <div className="absolute inset-0 flex flex-col items-center justify-end pb-24 md:pb-32 z-10 px-6">
        {/* Buttons Row */}
        <AnimatePresence>
          {uiVisible && (
            <motion.div 
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="w-full flex flex-col items-center gap-16 md:gap-24"
            >
              {/* Welcome Text */}
              <div className="flex flex-col items-center gap-4">
                <motion.div
                  initial={{ opacity: 0, letterSpacing: "0.2em" }}
                  animate={{ opacity: 1, letterSpacing: "0.8em" }}
                  transition={{ duration: 2, ease: "easeOut" }}
                  className="font-orbitron text-xs md:text-sm uppercase text-white/40 font-bold text-center"
                >
                  Welcome to Every Nation
                </motion.div>
                <div className="w-24 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
              </div>

              <div className="grid grid-cols-2 lg:flex lg:flex-row justify-center gap-4 md:gap-8 w-full max-w-[1400px]">
                <div className="w-full lg:w-[280px]">
                  <GlassButton
                    label="Community"
                    subtext="Join Discord"
                    onClick={() => window.open("https://discord.gg/engg", "_blank")}
                  />
                </div>
                <div className="w-full lg:w-[280px]">
                  <GlassButton
                    label="Gaming Hub"
                    subtext="Enter Mission Control"
                    variant="primary"
                    onClick={() => window.location.href = "/hub"}
                  />
                </div>
                <div className="w-full lg:w-[280px]">
                  <GlassButton
                    label="Credit Shop"
                    subtext="Acquire CC Assets"
                    onClick={() => window.location.href = "/shop"}
                  />
                </div>
                <div className="w-full lg:w-[280px]">
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

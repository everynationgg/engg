import React from "react";
import { motion } from "framer-motion";

export type OrbState = "idle" | "thinking" | "speaking" | "waiting";

interface EnosOrbProps {
  state?: OrbState;
  size?: number; // size in pixels
  className?: string;
  onClick?: () => void;
  interactive?: boolean;
}

export const EnosOrb: React.FC<EnosOrbProps> = ({
  state = "idle",
  size = 120,
  className = "",
  onClick,
  interactive = false,
}) => {
  const stateGlowColors: Record<OrbState, string> = {
    idle: "rgba(124, 58, 237, 0.35)",
    thinking: "rgba(245, 158, 11, 0.45)",
    speaking: "rgba(168, 85, 247, 0.55)",
    waiting: "rgba(59, 130, 246, 0.4)",
  };

  const currentGlow = stateGlowColors[state];

  return (
    <div
      onClick={onClick}
      className={`relative flex items-center justify-center select-none ${interactive ? "cursor-pointer group" : "pointer-events-none"} ${className}`}
      style={{
        width: `${size}px`,
        height: `${size}px`,
      }}
      aria-label={`VISIEN AI Guide (${state})`}
    >
      <motion.div
        animate={{
          scale: state === "speaking" ? [1, 1.25, 1] : state === "thinking" ? [1, 1.15, 1] : [1, 1.08, 1],
          opacity: state === "speaking" ? [0.6, 0.9, 0.6] : [0.4, 0.7, 0.4],
        }}
        transition={{
          duration: state === "thinking" ? 1.4 : state === "speaking" ? 1.8 : 3.5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute inset-[-20%] rounded-full filter blur-xl transition-all duration-700 pointer-events-none"
        style={{
          background: `radial-gradient(circle, ${currentGlow} 0%, rgba(245, 158, 11, 0.2) 45%, transparent 75%)`,
        }}
      />

      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 16, repeat: Infinity, ease: "linear" }}
        className="absolute inset-[-5%] rounded-full border border-purple-500/25 border-dashed pointer-events-none"
      />

      <motion.div
        animate={{
          scale: state === "speaking" ? [1, 1.06, 0.98, 1.04, 1] : [1, 1.02, 1],
        }}
        transition={{
          duration: state === "speaking" ? 1.2 : 3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="relative w-full h-full rounded-full overflow-hidden shadow-2xl flex items-center justify-center transition-all duration-500"
        style={{
          background: "radial-gradient(circle at 35% 35%, #9333ea 0%, #6d28d9 45%, #1e1b4b 100%)",
          boxShadow: `0 0 32px ${currentGlow}, inset 0 0 16px rgba(255, 255, 255, 0.45)`,
        }}
      >
        <motion.div
          animate={{ rotate: 360, scale: [0.95, 1.08, 0.95] }}
          transition={{
            rotate: { duration: 9, repeat: Infinity, ease: "linear" },
            scale: { duration: 3.5, repeat: Infinity, ease: "easeInOut" },
          }}
          className="absolute inset-1 rounded-full opacity-70 filter blur-xs"
          style={{
            background:
              "conic-gradient(from 0deg, rgba(245, 158, 11, 0.8) 0deg, rgba(168, 85, 247, 0.8) 120deg, rgba(234, 88, 12, 0.8) 240deg, rgba(245, 158, 11, 0.8) 360deg)",
          }}
        />

        <div className="absolute top-2 left-3 w-1/3 h-1/4 rounded-full bg-white/40 filter blur-xs transform -rotate-25 pointer-events-none" />

        <motion.div
          animate={{
            scale: state === "thinking" ? [0.8, 1.4, 0.8] : [0.9, 1.15, 0.9],
            opacity: [0.7, 1, 0.7],
          }}
          transition={{
            duration: state === "thinking" ? 0.9 : 2.2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="relative z-10 w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-white shadow-[0_0_15px_#fff,0_0_30px_#f59e0b]"
        />
      </motion.div>

      {interactive && (
        <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-bold uppercase tracking-wider text-purple-700 bg-white/95 px-2 py-0.5 rounded-full shadow-xs border border-purple-200/80 opacity-0 group-hover:opacity-100 transition-opacity">
          Enos AI • {state}
        </span>
      )}
    </div>
  );
};

export default EnosOrb;

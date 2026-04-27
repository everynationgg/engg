import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function GlobalHUD({ isWarping = false }) {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({
        x: (e.clientX / window.innerWidth) - 0.5,
        y: (e.clientY / window.innerHeight) - 0.5
      });
    };
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        window.location.href = "/hub";
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <>
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-[-1]">
      {/* Background Deep Space */}
      <div className="absolute inset-0 bg-[#020408]" />

      {/* Layer 1: Massive Deep Background (Planets/Nebula) */}
      <motion.div 
        className="absolute inset-[-10%] opacity-10"
        style={{
          x: mousePos.x * 10,
          y: mousePos.y * 10,
          background: "radial-gradient(circle at 70% 30%, #1e1b4b 0%, transparent 50%), radial-gradient(circle at 20% 80%, #0c4a6e 0%, transparent 40%)"
        }}
      />

      {/* Layer 2: Deep Stars (Slowest) */}
      <motion.div 
        className="absolute inset-[-10%] opacity-20"
        style={{
          x: mousePos.x * 20,
          y: mousePos.y * 20,
          background: `radial-gradient(1px 1px at 10% 10%, white, transparent),
                       radial-gradient(1.5px 1.5px at 20% 50%, white, transparent),
                       radial-gradient(1px 1px at 40% 20%, white, transparent),
                       radial-gradient(2px 2px at 60% 80%, white, transparent),
                       radial-gradient(1px 1px at 80% 40%, white, transparent)`,
          backgroundSize: "400px 400px"
        }}
      />

      {/* Layer 3: Mid-Depth Stars (Medium) */}
      <motion.div 
        className="absolute inset-[-15%] opacity-40"
        animate={isWarping ? { scaleX: 10, opacity: 0.8, x: -500 } : { scaleX: 1, opacity: 0.4, x: mousePos.x * 40 }}
        transition={isWarping ? { duration: 0.8, ease: "circIn" } : { type: "spring", damping: 30 }}
        style={{
          y: mousePos.y * 40,
          background: `radial-gradient(1px 1px at 15% 15%, #06b6d4, transparent),
                       radial-gradient(1.5px 1.5px at 35% 65%, #06b6d4, transparent),
                       radial-gradient(1px 1px at 55% 25%, #06b6d4, transparent),
                       radial-gradient(1.5px 1.5px at 75% 85%, #06b6d4, transparent)`,
          backgroundSize: "300px 300px"
        }}
      />

      {/* Layer 4: Floating Space Dust & Micro-Particles (Fastest) */}
      <motion.div 
        className="absolute inset-[-20%] opacity-60"
        animate={isWarping ? { scaleX: 20, x: -1000, opacity: 1 } : { scaleX: 1, x: mousePos.x * 80 }}
        transition={isWarping ? { duration: 0.5, ease: "circIn" } : { type: "spring", damping: 20 }}
        style={{
          y: mousePos.y * 80,
          background: `radial-gradient(1px 1px at 5% 5%, white, transparent),
                       radial-gradient(1px 1px at 25% 45%, white, transparent),
                       radial-gradient(1px 1px at 45% 15%, white, transparent),
                       radial-gradient(1px 1px at 65% 75%, white, transparent),
                       radial-gradient(1px 1px at 85% 35%, white, transparent)`,
          backgroundSize: "200px 200px"
        }}
      />

      {/* Warp Streaks (Visible only during warp) */}
      <AnimatePresence>
        {isWarping && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-10"
            style={{
              background: "linear-gradient(90deg, transparent, rgba(6, 182, 212, 0.2), transparent)",
              backgroundSize: "200% 100%"
            }}
          />
        )}
      </AnimatePresence>

      {/* Corner HUD Elements */}
      <div className="absolute inset-0 flex flex-col justify-between p-4 mix-blend-overlay opacity-30">
        <div className="flex justify-between items-start font-mono text-[10px] tracking-tighter text-cyan-400">
          <div className="flex flex-col">
            <span>SEC_ID: PX-928</span>
            <span className="animate-pulse">STATUS: LINK_ACTIVE</span>
          </div>
          <div className="flex flex-col text-right">
            <span>COORD_X: {(mousePos.x * 100).toFixed(2)}</span>
            <span>COORD_Y: {(mousePos.y * 100).toFixed(2)}</span>
          </div>
        </div>

        <div className="flex justify-between items-end font-mono text-[10px] tracking-tighter text-cyan-400">
          <div className="flex flex-col">
            <span>ERRANT_NIGHT_OS v2.4.2</span>
            <div className="flex gap-1 mt-1">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="w-1 h-1 bg-cyan-500 animate-pulse" style={{ animationDelay: `${i * 0.2}s` }} />
              ))}
            </div>
          </div>
          <div className="text-right">
            <span>AUTH_HASH: 0x82A..F9</span>
          </div>
        </div>
      </div>

      {/* Vignette Overlay */}
      <div className="absolute inset-0 shadow-[inset_0_0_150px_rgba(0,0,0,0.8)] pointer-events-none" />
      
      {/* Subtle Scanline Overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03]" 
           style={{ background: "linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06))", backgroundSize: "100% 2px, 3px 100%" }} />
    </div>

    {/* EXIT INTERFACE (Active Layer) */}
    <div className="fixed top-6 left-6 z-[9999] pointer-events-auto">
      <motion.button
        onClick={() => window.location.href = "/hub"}
        className="group flex flex-col items-start gap-1 p-2"
        initial={{ opacity: 0.3 }}
        whileHover={{ opacity: 1 }}
      >
        <div className="flex items-center gap-3">
          <div className="w-4 h-4 border border-cyan-500/40 flex items-center justify-center relative group-hover:border-cyan-400 transition-colors">
            <div className="w-1 h-1 bg-cyan-400/40 group-hover:bg-cyan-400" />
            {/* Tactical Corners */}
            <div className="absolute -top-[1px] -left-[1px] w-[2px] h-[2px] bg-cyan-400" />
            <div className="absolute -bottom-[1px] -right-[1px] w-[2px] h-[2px] bg-cyan-400" />
          </div>
          <span className="font-orbitron text-[10px] font-black uppercase tracking-[0.4em] text-white/40 group-hover:text-white transition-colors">
            Nexus_Uplink
          </span>
        </div>
        <div className="flex items-center gap-2 ml-7">
           <span className="font-mono text-[7px] uppercase tracking-[0.3em] text-white/10 group-hover:text-cyan-400/40 transition-colors">
              Return_to_Hub
           </span>
           <div className="w-8 h-[1px] bg-white/5 group-hover:bg-cyan-500/20 transition-all" />
           <span className="font-mono text-[6px] text-white/5 group-hover:text-white/20 transition-colors">
             [ESC]
           </span>
        </div>
      </motion.button>
    </div>
    </>
  );
}

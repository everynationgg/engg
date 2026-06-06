import React from "react";
import { motion } from "framer-motion";

interface HUDOverlayProps {
  children: React.ReactNode;
  pageLabel: string;
  showVignette?: boolean;
}

export function HUDOverlay({ children, pageLabel, showVignette = true }: HUDOverlayProps) {
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#020408] text-white">
      {/* GLOBAL HUD FRAME */}
      <div className="fixed inset-0 pointer-events-none z-[80] border-[1px] border-white/5 m-4 md:m-8" />
      
      {/* CORNER BRACKETS */}
      <div className="fixed top-4 left-4 md:top-8 md:left-8 w-8 h-8 border-t-2 border-l-2 border-cyan-500/30 z-[81] pointer-events-none" />
      <div className="fixed top-4 right-4 md:top-8 md:right-8 w-8 h-8 border-t-2 border-r-2 border-cyan-500/30 z-[81] pointer-events-none" />
      <div className="fixed bottom-4 left-4 md:bottom-8 md:left-8 w-8 h-8 border-b-2 border-l-2 border-cyan-500/30 z-[81] pointer-events-none" />
      <div className="fixed bottom-4 right-4 md:bottom-8 md:right-8 w-8 h-8 border-b-2 border-r-2 border-cyan-500/30 z-[81] pointer-events-none" />

      {/* LATERAL TELEMETRY (TOP LEFT) */}
      <div className="fixed top-12 left-12 hidden xl:flex flex-col gap-1 z-[81] opacity-20 pointer-events-none">
        <span className="font-mono text-[9px] tracking-[0.4em] uppercase">Protocol: ENGG_NEXUS</span>
        <span className="font-mono text-[9px] tracking-[0.4em] uppercase text-cyan-400">Status: ACTIVE</span>
      </div>

      {/* LATERAL TELEMETRY (TOP RIGHT) */}
      <div className="fixed top-12 right-12 hidden xl:flex flex-col items-end gap-1 z-[81] opacity-20 pointer-events-none">
        <span className="font-mono text-[9px] tracking-[0.4em] uppercase">Node: {pageLabel}</span>
        <span className="font-mono text-[9px] tracking-[0.4em] uppercase">Region: ALPHA_01</span>
      </div>

      {/* DYNAMIC SCANLINE */}
      <div className="fixed inset-0 pointer-events-none z-[85] scanline opacity-[0.03]" />
      
      {/* VIGNETTE */}
      {showVignette && (
        <div className="fixed inset-0 pointer-events-none z-[82] bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)]" />
      )}

      {/* MAIN CONTENT CONTENT */}
      <motion.main 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative z-10 w-full min-h-screen"
      >
        {children}
      </motion.main>

      <style dangerouslySetInnerHTML={{
        __html: `
        .scanline {
          background: linear-gradient(
            to bottom,
            transparent 50%,
            rgba(6, 182, 212, 0.2) 50%
          );
          background-size: 100% 4px;
          animation: scanline-move 60s linear infinite;
        }
        @keyframes scanline-move {
          0% { background-position: 0 0; }
          100% { background-position: 0 100%; }
        }
      `}} />
    </div>
  );
}

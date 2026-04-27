import { motion } from "framer-motion";
import React from "react";
import HolographicScanner from "./HUDRenderer";

interface TacticalSlateProps {
  children: React.ReactNode;
  className?: string;
  color?: string;
  showScanner?: boolean;
}

/**
 * TacticalSlate
 * The primary container for the ENGG ecosystem. 
 * Features the signature asymmetric clipped corners and tactical HUD accents.
 */
export default function TacticalSlate({ 
  children, 
  className = "", 
  color = "#00f3ff",
  showScanner = true 
}: TacticalSlateProps) {
  // Use fixed pixel values (e.g., 30px) for the chamfer to prevent the cut from growing too large on tall/wide boxes,
  // which was causing the content inside (with normal padding) to touch the edges.
  const clipPath = "polygon(0 0, calc(100% - 30px) 0, 100% 30px, 100% 100%, 30px 100%, 0 calc(100% - 30px))";

  return (
    <div className={`relative group ${className}`}>
      {/* Outer Border Layer */}
      <div 
        className="absolute inset-0 bg-white/[0.02] border border-white/10 transition-all duration-500 group-hover:border-cyan-400/40"
        style={{ clipPath }}
      />
      
      {/* Main Glass Content */}
      <div 
        className="relative z-10 h-full w-full bg-[#0a0f16]/60 overflow-hidden transition-all duration-500 group-hover:bg-cyan-500/[0.02]"
        style={{ clipPath }}
      >
        {showScanner && <HolographicScanner color={color} />}
        
        {/* Internal Content */}
        <div className="relative z-20 h-full w-full">
          {children}
        </div>

        {/* Decorative HUD Accents */}
        <div className="absolute top-0 left-8 w-12 h-[1px] bg-cyan-400/20" />
        <div className="absolute bottom-8 right-0 w-[1px] h-12 bg-cyan-400/20" />
        <div className="absolute top-4 right-4 w-1 h-1 bg-white/20 group-hover:bg-cyan-400 transition-colors" />
      </div>

      {/* Atmospheric Glow (Reduced blur for sharpness) */}
      <div 
        className="absolute inset-0 -z-10 bg-cyan-500/0 group-hover:bg-cyan-500/5 blur-[20px] transition-all duration-700 scale-95 group-hover:scale-100"
      />
    </div>

  );
}

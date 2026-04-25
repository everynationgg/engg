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
  const clipPath = "polygon(0 0, 85% 0, 100% 15%, 100% 100%, 15% 100%, 0 85%)";

  return (
    <div className={`relative group ${className}`}>
      {/* Outer Border Layer */}
      <div 
        className="absolute inset-0 bg-white/5 border border-white/10 transition-all duration-500 group-hover:border-white/20"
        style={{ clipPath }}
      />
      
      {/* Main Glass Content */}
      <div 
        className="relative z-10 h-full w-full bg-[#0a0f16]/40 backdrop-blur-md overflow-hidden transition-all duration-500 group-hover:bg-cyan-500/[0.03]"
        style={{ clipPath }}
      >
        {showScanner && <HolographicScanner color={color} />}
        
        {/* Internal Content */}
        <div className="relative z-20 h-full w-full">
          {children}
        </div>

        {/* Decorative HUD Accents */}
        <div className="absolute top-2 left-8 w-12 h-[1px] bg-white/10" />
        <div className="absolute bottom-8 right-2 w-[1px] h-12 bg-white/10" />
        <div className="absolute top-4 right-4 w-1.5 h-1.5 bg-white/20 rounded-full group-hover:bg-cyan-500 transition-colors" />
      </div>

      {/* Atmospheric Glow */}
      <div 
        className="absolute inset-0 -z-10 bg-cyan-500/0 group-hover:bg-cyan-500/5 blur-[40px] transition-all duration-700 scale-90 group-hover:scale-100"
      />
    </div>
  );
}

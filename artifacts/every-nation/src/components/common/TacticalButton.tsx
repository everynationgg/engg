import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { FaChevronUp } from "react-icons/fa";

interface TacticalButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  active?: boolean;
}

export const TacticalButton: React.FC<TacticalButtonProps> = ({ 
  children, 
  className, 
  active = false,
  ...props 
}) => {
  return (
    <button
      className={cn(
        "relative group flex items-center transition-all duration-300 active:scale-95 select-none",
        className
      )}
      {...props}
    >
      {/* LEFT ACCENT TAB */}
      <div className="relative z-20 h-10 w-10 shrink-0 overflow-hidden">
        <div 
          className={cn(
            "absolute inset-0 bg-white transition-all duration-300 group-hover:bg-cyan-400",
            active ? "bg-cyan-400" : "bg-white/90"
          )}
          style={{
            clipPath: "polygon(25% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 25%)"
          }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <FaChevronUp className={cn(
            "text-[#020408] text-xs transition-transform duration-300 group-hover:scale-110",
            active && "scale-110"
          )} />
        </div>
      </div>

      {/* MAIN BODY CONTAINER */}
      <div className="relative -ml-3 flex-grow h-10 flex items-center overflow-hidden">
        {/* Background Video Layer */}
        <div className="absolute inset-0 z-0">
          <video
            src="/home_btn.webm"
            autoPlay
            muted
            loop
            playsInline
            className="w-full h-full object-cover opacity-60"
          />
        </div>

        {/* Background Overlay Layer */}
        <div 
          className={cn(
            "absolute inset-0 bg-[#020408]/40 backdrop-blur-sm border-y border-r border-white/10 transition-all duration-300 group-hover:bg-cyan-500/10 group-hover:border-cyan-500/30",
            active && "bg-cyan-500/20 border-cyan-500/40"
          )}
          style={{
            clipPath: "polygon(10px 0%, 100% 0%, 100% 100%, 0% 100%)"
          }}
        />

        {/* Top Highlight Stripe */}
        <div className="absolute top-0 left-2.5 right-0 h-[1px] bg-white/20 group-hover:bg-cyan-400/40" />

        {/* Inner Content Area */}
        <div className="relative z-10 w-full pl-6 pr-8 flex items-center justify-center font-orbitron text-[10px] uppercase tracking-[0.3em] text-white group-hover:text-cyan-400 transition-colors drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]">
          {children}
        </div>

        {/* Right Edge Detail */}
        <div className="absolute right-0 top-0 bottom-0 w-[2px] bg-white/5 group-hover:bg-cyan-400/20" />
      </div>

      {/* Subtle Hover Glow (Bottom) */}
      <div className="absolute -bottom-1 left-10 right-2 h-[2px] bg-cyan-400/0 group-hover:bg-cyan-400/20 blur-[2px] transition-all duration-500" />
    </button>
  );
};

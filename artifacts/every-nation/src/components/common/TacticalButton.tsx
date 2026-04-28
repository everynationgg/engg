import React from "react";
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
        "relative group flex items-center h-12 transition-all duration-300 active:scale-95 select-none",
        className
      )}
      {...props}
    >
      {/* THE WHITE TAB (LEFT ACCENT) */}
      <div 
        className={cn(
          "absolute left-0 top-1 h-[28px] w-[50px] z-20 flex items-center justify-center transition-colors duration-300",
          active ? "bg-white" : "bg-white/90 group-hover:bg-white"
        )}
        style={{
          clipPath: "polygon(0 0, 85% 0, 100% 100%, 0 100%)"
        }}
      >
        <FaChevronUp className="text-[#020408] text-[8px] mt-0.5" />
      </div>

      {/* THE MAIN BODY */}
      <div className="relative ml-10 flex-grow h-[34px] flex items-center">
        {/* Background Layer (Matte Dark) */}
        <div 
          className={cn(
            "absolute inset-0 bg-[#2d2a33] border-r border-white/10 transition-all duration-300",
            active ? "bg-[#3d3a43]" : "group-hover:bg-[#35323b]"
          )}
          style={{
            clipPath: "polygon(14px 0, 100% 0, 100% 100%, 0 100%)"
          }}
        />

        {/* Top Highlight Stripe */}
        <div className="absolute top-0 left-[14px] right-0 h-[1px] bg-white/20" />
        
        {/* Content Area */}
        <div className="relative z-10 w-full pl-6 pr-8 flex items-center justify-center font-orbitron font-bold text-[14px] uppercase tracking-[0.1em] text-white/90 group-hover:text-white transition-colors">
          {children}
        </div>

        {/* Right Detail (Thin edge) */}
        <div className="absolute right-0 top-1 bottom-1 w-[1px] bg-white/10" />
      </div>

      {/* Subtle Drop Shadow for depth */}
      <div className="absolute inset-0 bg-black/40 blur-[8px] -z-10 translate-y-1 scale-95 opacity-50" />
    </button>
  );
};

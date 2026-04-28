import React from "react";
import { cn } from "@/lib/utils";

interface TacticalButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  active?: boolean;
}

export const TacticalButton: React.FC<TacticalButtonProps> = ({
  children,
  className,
  ...props
}) => {
  return (
    <button
      className={cn(
        "relative group flex items-center justify-start transition-all duration-300 active:scale-95 select-none overflow-hidden h-[44px] md:h-[52px] w-full max-w-[280px] md:max-w-none",
        className
      )}
      {...props}
    >
      {/* Background Image (The actual button asset) */}
      <div className="absolute inset-0 z-0">
        <img
          src="/home_btn.webp"
          className="w-full h-full object-fill"
          alt="button frame"
        />
      </div>

      {/* Hover Highlight Overlay */}
      <div className="absolute inset-0 z-1 bg-cyan-400/0 group-hover:bg-cyan-400/5 transition-colors duration-300" />

      {/* Content Area - Offset to the right to clear the chevron icon in the asset */}
      <div className="relative z-10 w-full pl-[60px] md:pl-[72px] pr-4 flex flex-col items-start justify-center font-orbitron text-[9px] md:text-[10px] uppercase tracking-[0.2em] md:tracking-[0.3em] text-white group-hover:text-cyan-400 transition-colors drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]">
        {children}
      </div>
    </button>
  );
};

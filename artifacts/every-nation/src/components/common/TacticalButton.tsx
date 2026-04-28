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
        "relative group flex items-center justify-center transition-all duration-300 active:scale-95 select-none overflow-hidden h-20 w-full max-w-[320px] md:max-w-none",
        className
      )}
      {...props}
    >
      {/* Background Image (The actual button asset) */}
      <div className="absolute inset-0 z-0">
        <img
          src="/home_btn.webp"
          className="w-full h-full object-contain"
          alt="button frame"
        />
      </div>

      {/* Hover Highlight Overlay */}
      <div className="absolute inset-0 z-1 bg-cyan-400/0 group-hover:bg-cyan-400/5 transition-colors duration-300" />

      {/* Content Area */}
      <div className="relative z-10 w-full px-12 flex flex-col items-center justify-center font-orbitron text-[11px] md:text-[12px] uppercase tracking-[0.3em] text-white group-hover:text-cyan-400 transition-colors drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]">
        {children}
      </div>
    </button>
  );
};

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
        "relative group transition-all duration-300 active:scale-95 select-none overflow-hidden w-[280px] md:w-[360px] aspect-[4.3/1]",
        className
      )}
      {...props}
    >
      {/* Precision Background Image */}
      <div className="absolute inset-0 z-0">
        <img
          src="/home_btn.webp"
          className="w-full h-full object-contain"
          alt="tactical button frame"
        />
      </div>

      {/* Hover Highlight Overlay - Only on the usable panel area */}
      <div className="absolute left-[28%] right-[8%] inset-y-[15%] z-1 bg-cyan-400/0 group-hover:bg-cyan-400/5 transition-colors duration-300 rounded-sm" />

      {/* Content Area - Optically anchored to the right panel zone */}
      <div className="absolute left-[28%] right-[8%] h-full z-10 flex flex-col items-center justify-center font-orbitron text-white group-hover:text-cyan-400 transition-colors drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]">
        {children}
      </div>
    </button>
  );
};

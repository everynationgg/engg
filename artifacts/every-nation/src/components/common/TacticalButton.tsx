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
        "relative group transition-all duration-300 active:scale-95 select-none overflow-hidden w-[280px] md:w-[400px] aspect-[3/1]",
        className
      )}
      {...props}
    >
      {/* 1. Precision Background Image */}
      <img
        src="/btn_asset.svg"
        className="absolute inset-0 w-full h-full object-fill opacity-90 group-hover:opacity-100 transition-opacity"
        alt="tactical button frame"
      />

      {/* 2. Hover Highlight Overlay - Constrained to the right panel */}
      <div className="absolute left-[28%] right-[8%] inset-y-[15%] z-1 bg-cyan-400/0 group-hover:bg-cyan-400/5 transition-colors duration-300 rounded-sm" />

      {/* 3. Zoned Content Layer - Anchored to the asset's coordinate system */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        <div className="absolute left-[28%] right-[8%] top-0 bottom-0 flex items-center justify-center">
          <div className="font-orbitron text-white group-hover:text-cyan-400 transition-colors drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]">
            {children}
          </div>
        </div>
      </div>
    </button>
  );
};

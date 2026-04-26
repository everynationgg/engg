import React, { forwardRef } from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const sciFiButtonVariants = cva(
  "relative group inline-flex items-center transition-all duration-300 font-orbitron uppercase tracking-[0.3em] active:scale-95 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "text-cyan-400 hover:text-cyan-300",
        primary: "text-[#020408] font-bold",
        danger: "text-red-400 hover:text-red-300",
        outline: "text-white/70 hover:text-white",
        ghost: "text-cyan-500/70 hover:text-cyan-400",
      },
      size: {
        sm: "h-10 px-6 text-[10px]",
        default: "h-12 px-8 text-xs",
        lg: "h-14 px-12 text-sm",
        icon: "h-12 w-12",
      },
      justify: {
        start: "justify-start",
        center: "justify-center",
        end: "justify-end",
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      justify: "center",
    },
  }
);

export interface SciFiButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof sciFiButtonVariants> {
  asChild?: boolean;
}

const SciFiButton = forwardRef<HTMLButtonElement, SciFiButtonProps>(
  ({ className, variant, size, justify, asChild = false, children, ...props }, ref) => {
    
    // The inner clip path for the chamfered look
    const chamferStyle = {
      clipPath: "polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)"
    };

    const Comp = asChild ? Slot : "button";

    return (
      <Comp
        ref={ref}
        className={cn(sciFiButtonVariants({ variant, size, justify, className }))}
        {...props}
      >
        {/* Outer glowing border effect container */}
        <div 
          className={cn(
            "absolute inset-0 transition-all duration-500 group-hover:scale-[1.02]",
            variant === "default" && "bg-cyan-500/10 group-hover:bg-cyan-500/20",
            variant === "primary" && "bg-cyan-400 group-hover:bg-cyan-300 shadow-[0_0_30px_rgba(6,182,212,0.5)]",
            variant === "danger" && "bg-red-500/10 group-hover:bg-red-500/20",
            variant === "outline" && "bg-white/[0.03] border border-white/10 group-hover:border-white/30",
            variant === "ghost" && "bg-transparent group-hover:bg-cyan-500/05"
          )}
          style={chamferStyle}
        />

        {/* Tactical Corner Brackets (Bottom-Left) */}
        <div className="absolute bottom-0 left-0 w-2 h-2 border-l border-b border-cyan-500/40 opacity-0 group-hover:opacity-100 transition-opacity" />
        {/* Tactical Corner Brackets (Top-Right) */}
        <div className="absolute top-0 right-0 w-2 h-2 border-r border-t border-cyan-500/40 opacity-0 group-hover:opacity-100 transition-opacity" />
        
        {/* Accent Bar (left) */}
        {variant !== "ghost" && variant !== "outline" && (
          <div 
            className={cn(
              "absolute left-0 top-1/2 -translate-y-1/2 w-1 h-3/5 bg-opacity-80 transition-all duration-300 group-hover:h-4/5",
              variant === "default" && "bg-cyan-400",
              variant === "primary" && "bg-white",
              variant === "danger" && "bg-red-400",
            )}
          />
        )}

        {/* Holographic Scanline Effect */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none" style={chamferStyle}>
          <div className="absolute top-0 left-0 w-full h-[2px] bg-white/20 blur-[1px] -translate-y-full group-hover:animate-[scanline_2s_linear_infinite]" />
        </div>

        {/* Content */}
        <span className={cn(
          "relative z-10 flex items-center gap-3",
          justify === "start" && "pl-8",
          justify === "end" && "pr-8"
        )}>
          {children}
        </span>
      </Comp>
    );
  }
);
SciFiButton.displayName = "SciFiButton";

export { SciFiButton, sciFiButtonVariants };

// Add scanline animation to global styles via a side effect or ensure it's in index.css
// @keyframes scanline { 0% { transform: translateY(-100%); } 100% { transform: translateY(500%); } }

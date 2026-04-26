import React, { forwardRef } from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const sciFiButtonVariants = cva(
  "relative group inline-flex items-center justify-center transition-all duration-300 font-orbitron uppercase tracking-[0.3em] active:scale-95 disabled:pointer-events-none disabled:opacity-50",
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
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface SciFiButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof sciFiButtonVariants> {
  asChild?: boolean;
}

const SciFiButton = forwardRef<HTMLButtonElement, SciFiButtonProps>(
  ({ className, variant, size, asChild = false, children, ...props }, ref) => {
    
    // The inner clip path for the chamfered look
    const chamferStyle = {
      clipPath: "polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)"
    };

    const Comp = asChild ? Slot : "button";

    return (
      <Comp
        ref={ref}
        className={cn(sciFiButtonVariants({ variant, size, className }))}
        {...props}
      >
        {/* Outer glowing border effect container */}
        <div 
          className={cn(
            "absolute inset-0 transition-all duration-500 group-hover:scale-[1.02]",
            variant === "default" && "bg-cyan-500/20 group-hover:bg-cyan-500/40",
            variant === "primary" && "bg-cyan-400 group-hover:bg-cyan-300 shadow-[0_0_20px_rgba(6,182,212,0.4)]",
            variant === "danger" && "bg-red-500/20 group-hover:bg-red-500/40",
            variant === "outline" && "bg-white/5 border border-white/20 group-hover:border-white/50",
            variant === "ghost" && "bg-transparent group-hover:bg-cyan-500/10"
          )}
          style={chamferStyle}
        />
        
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

        {/* Content */}
        <span className="relative z-10 flex items-center gap-3">
          {children}
        </span>
      </Comp>
    );
  }
);
SciFiButton.displayName = "SciFiButton";

export { SciFiButton, sciFiButtonVariants };

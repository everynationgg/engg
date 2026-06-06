import React, { forwardRef } from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const sciFiButtonVariants = cva(
  "relative group inline-flex items-center transition-all duration-300 font-orbitron uppercase tracking-[0.4em] active:scale-95 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "text-cyan-400 hover:text-cyan-300",
        primary: "text-cyan-400 hover:text-white font-bold",
        danger: "text-red-400 hover:text-red-300",
        outline: "text-white/60 hover:text-white",
        ghost: "text-cyan-500/50 hover:text-cyan-400",
      },
      size: {
        sm: "h-8 px-4 text-[11px]",
        default: "h-10 px-6 text-[13px]",
        lg: "h-12 px-10 text-[15px]",
        icon: "h-10 w-10",
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
    
    // Sharper clip path for controlled look
    const chamferStyle = {
      clipPath: "polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)"
    };

    const Comp = asChild ? Slot : "button";

    return (
      <Comp
        ref={ref}
        className={cn(sciFiButtonVariants({ variant, size, justify, className }))}
        {...props}
      >
        {/* Background layer */}
        <div 
          className={cn(
            "absolute inset-0 transition-all duration-300",
            variant === "default" && "bg-cyan-500/5 border border-cyan-500/10 group-hover:bg-cyan-500/10 group-hover:border-cyan-500/20",
            variant === "primary" && "bg-gradient-to-br from-cyan-400/20 to-cyan-500/10 border border-cyan-400/30 group-hover:from-cyan-400/30 group-hover:to-cyan-500/20 shadow-[0_0_20px_rgba(6,182,212,0.15)]",
            variant === "danger" && "bg-red-500/5 border border-red-500/10 group-hover:bg-red-500/10 group-hover:border-red-500/20",
            variant === "outline" && "bg-white/[0.01] border border-white/5 group-hover:border-white/20 group-hover:bg-white/[0.03]",
            variant === "ghost" && "bg-transparent group-hover:bg-cyan-500/[0.03]"
          )}
          style={chamferStyle}
        />

        {/* Technical Accents (Visible only on hover for minimal feel) */}
        <div className="absolute top-0 right-0 w-1.5 h-1.5 border-r border-t border-cyan-500/40 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-1 -translate-y-1 group-hover:translate-x-0 group-hover:translate-y-0" />
        <div className="absolute bottom-0 left-0 w-1.5 h-1.5 border-l border-b border-cyan-500/40 opacity-0 group-hover:opacity-100 transition-all duration-300 -translate-x-1 translate-y-1 group-hover:translate-x-0 group-hover:translate-y-0" />
        
        {/* Content */}
        <span className={cn(
          "relative z-10 flex items-center gap-2",
          justify === "start" && "pl-6",
          justify === "end" && "pr-6"
        )}>
          {children}
        </span>
      </Comp>
    );
  }
);
SciFiButton.displayName = "SciFiButton";

export { SciFiButton, sciFiButtonVariants };

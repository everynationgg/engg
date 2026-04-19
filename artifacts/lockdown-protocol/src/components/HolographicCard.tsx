import { useState, MouseEvent, ReactNode, useRef } from "react";
import { usePerformanceMode } from "@/hooks/usePerformanceMode";

interface HolographicCardProps {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
  disabled?: boolean;
  onMouseEnter?: (e: MouseEvent<HTMLButtonElement | HTMLDivElement>) => void;
  onMouseLeave?: (e: MouseEvent<HTMLButtonElement | HTMLDivElement>) => void;
  isButton?: boolean;
  "data-testid"?: string;
  isPulsing?: boolean;
}

export default function HolographicCard({
  children,
  className = "",
  style,
  onClick,
  disabled,
  onMouseEnter,
  onMouseLeave,
  isButton = true,
  "data-testid": dataTestId,
  isPulsing = false,
}: HolographicCardProps) {
  const { lowGraphics } = usePerformanceMode();
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const cardRef = useRef<HTMLElement>(null);

  const handleMouseMove = (e: MouseEvent) => {
    if (lowGraphics || disabled || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Calculate rotation between -10deg and 10deg
    const rX = -((y / rect.height) - 0.5) * 20;
    const rY = ((x / rect.width) - 0.5) * 20;
    
    setRotateX(rX);
    setRotateY(rY);
  };

  const handleMouseLeaveInner = (e: MouseEvent<any>) => {
    if (!lowGraphics && !disabled) {
      setRotateX(0);
      setRotateY(0);
    }
    if (onMouseLeave) onMouseLeave(e);
  };

  const transformStyle = !lowGraphics && !disabled && !isPulsing
    ? `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)` 
    : "none";

  const Component = isButton ? "button" : "div";

  return (
    <Component
      // @ts-ignore
      ref={cardRef}
      className={`relative overflow-hidden ${className} ${isPulsing ? "animate-heartbeat border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.8)]" : ""}`}
      style={{
        ...style,
        transform: isPulsing ? undefined : transformStyle,
        transition: "transform 0.1s ease-out, box-shadow 0.2s ease-out",
        transformStyle: "preserve-3d"
      }}
      onClick={onClick}
      disabled={disabled}
      onMouseMove={handleMouseMove}
      onMouseEnter={onMouseEnter}
      onMouseLeave={handleMouseLeaveInner}
      data-testid={dataTestId}
    >
      {/* Hologram scanline base effect */}
      {!lowGraphics && (
        <div 
          className="absolute inset-0 pointer-events-none opacity-20"
          style={{
            background: "linear-gradient(transparent 50%, rgba(255, 255, 255, 0.2) 50%)",
            backgroundSize: "100% 4px",
            transform: "translateZ(5px)"
          }}
        />
      )}
      
      {/* Hologram glow base */}
      {!lowGraphics && !disabled && (
        <div 
          className="absolute bottom-0 left-0 right-0 h-1/3 pointer-events-none opacity-40 mix-blend-screen"
          style={{
            background: "linear-gradient(to top, currentColor, transparent)",
            transform: "translateZ(-5px)"
          }}
        />
      )}
      
      {/* Content wrapper */}
      <div style={{ transform: !lowGraphics ? "translateZ(15px)" : "none", position: "relative", zIndex: 10 }}>
        {children}
      </div>
    </Component>
  );
}

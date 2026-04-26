import { useEffect, useState } from "react";
import { usePerformanceMode } from "@/hooks/usePerformanceMode";

export default function ParallaxBackground() {
  const { lowGraphics } = usePerformanceMode();
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (lowGraphics) return;

    let ticking = false;
    const handleMouseMove = (e: MouseEvent) => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const centerX = window.innerWidth / 2;
          const centerY = window.innerHeight / 2;
          const x = (e.clientX - centerX) / centerX; // -1 to 1
          const y = (e.clientY - centerY) / centerY; // -1 to 1
          setOffset({ x, y });
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [lowGraphics]);

  if (lowGraphics) return null;

  return (
    <div className="fixed inset-0 -z-50 pointer-events-none overflow-hidden ix-bg-alive">
      {/* Deep grid layer */}
      <div 
        className="absolute inset-[-30%] opacity-10"
        style={{
          backgroundImage: "linear-gradient(rgba(0, 255, 255, 0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 255, 255, 0.3) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
          transform: `translate(${offset.x * -10}px, ${offset.y * -10}px) perspective(1000px) rotateX(60deg) translateY(-100px)`,
          transition: "transform 0.4s ease-out"
        }}
      />
      
      {/* Middle dust layer (soft radial gradients) */}
      <div 
        className="absolute inset-[-20%] opacity-30 mix-blend-screen"
        style={{
          backgroundImage: "radial-gradient(circle at 30% 40%, rgba(6, 182, 212, 0.15) 0%, transparent 40%), radial-gradient(circle at 70% 60%, rgba(168, 85, 247, 0.1) 0%, transparent 50%)",
          transform: `translate(${offset.x * -30}px, ${offset.y * -30}px)`,
          transition: "transform 0.3s ease-out"
        }}
      />
      
      {/* Vignette foreground layer */}
      <div 
        className="absolute inset-[-10%] opacity-60"
        style={{
          background: "radial-gradient(circle at center, transparent 40%, rgba(0, 0, 0, 0.8) 100%)",
          transform: `translate(${offset.x * -60}px, ${offset.y * -60}px)`,
          transition: "transform 0.2s ease-out"
        }}
      />
      
      {/* Dynamic tension lighting overlay (managed via CSS variables globally, but we'll add a red hue placeholder that can be controlled) */}
      <div 
        id="tension-vignette"
        className="absolute inset-0 opacity-0 transition-opacity duration-1000 mix-blend-overlay pointer-events-none"
        style={{
          background: "radial-gradient(circle at center, transparent 30%, rgba(239, 68, 68, 0.5) 100%)"
        }}
      />
    </div>
  );
}

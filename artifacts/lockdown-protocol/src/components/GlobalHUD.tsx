import { useState, useEffect } from "react";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";

export default function GlobalHUD() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Normalize to -0.5 to 0.5
      setMousePos({
        x: (e.clientX / window.innerWidth) - 0.5,
        y: (e.clientY / window.innerHeight) - 0.5
      });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-[-1]">
      {/* Background Deep Space */}
      <div className="absolute inset-0 bg-[#020408]" />

      {/* Layer 1: Slow Drift Stars */}
      <motion.div 
        className="absolute inset-[-10%] opacity-20"
        style={{
          x: mousePos.x * 20,
          y: mousePos.y * 20,
          background: `radial-gradient(1px 1px at 10% 10%, white, transparent),
                       radial-gradient(1.5px 1.5px at 20% 50%, white, transparent),
                       radial-gradient(1px 1px at 40% 20%, white, transparent),
                       radial-gradient(2px 2px at 60% 80%, white, transparent),
                       radial-gradient(1px 1px at 80% 40%, white, transparent),
                       radial-gradient(1.5px 1.5px at 90% 10%, white, transparent)`,
          backgroundSize: "400px 400px"
        }}
      />

      {/* Layer 2: Faster Parallax Stars */}
      <motion.div 
        className="absolute inset-[-20%] opacity-40"
        style={{
          x: mousePos.x * 45,
          y: mousePos.y * 45,
          background: `radial-gradient(1px 1px at 15% 15%, #06b6d4, transparent),
                       radial-gradient(1px 1px at 35% 65%, #06b6d4, transparent),
                       radial-gradient(1px 1px at 55% 25%, #06b6d4, transparent),
                       radial-gradient(1px 1px at 75% 85%, #06b6d4, transparent),
                       radial-gradient(1px 1px at 85% 45%, #06b6d4, transparent)`,
          backgroundSize: "300px 300px"
        }}
      />

      {/* Corner HUD Elements */}
      <div className="absolute inset-0 flex flex-col justify-between p-4 mix-blend-overlay opacity-30">
        <div className="flex justify-between items-start font-mono text-[10px] tracking-tighter text-cyan-400">
          <div className="flex flex-col">
            <span>SEC_ID: PX-928</span>
            <span className="animate-pulse">STATUS: LINK_ACTIVE</span>
          </div>
          <div className="flex flex-col text-right">
            <span>COORD_X: {(mousePos.x * 100).toFixed(2)}</span>
            <span>COORD_Y: {(mousePos.y * 100).toFixed(2)}</span>
          </div>
        </div>

        <div className="flex justify-between items-end font-mono text-[10px] tracking-tighter text-cyan-400">
          <div className="flex flex-col">
            <span>ENFESTATION_OS v2.4.1</span>
            <div className="flex gap-1 mt-1">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="w-1 h-1 bg-cyan-500 animate-pulse" style={{ animationDelay: `${i * 0.2}s` }} />
              ))}
            </div>
          </div>
          <div className="text-right">
            <span>AUTH_HASH: 0x82A..F9</span>
          </div>
        </div>
      </div>

      {/* Vignette Overlay */}
      <div className="absolute inset-0 shadow-[inset_0_0_150px_rgba(0,0,0,0.8)] pointer-events-none" />
      
      {/* Subtle Scanline Overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03]" 
           style={{ background: "linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06))", backgroundSize: "100% 2px, 3px 100%" }} />
    </div>
  );
}

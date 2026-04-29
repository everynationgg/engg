import { motion } from "framer-motion";
import { useEffect, useState } from "react";

/**
 * HolographicScanner
 * A high-fidelity overlay that adds a scanning laser, digital noise, 
 * and moving telemetry to any container.
 */
export default function HolographicScanner({ active = true, color = "#00f3ff" }) {
  const [telemetry, setTelemetry] = useState("");

  // Generate shifting hex codes for the telemetry edge
  useEffect(() => {
    if (!active) return;
    const interval = setInterval(() => {
      const hex = Math.random().toString(16).substring(2, 8).toUpperCase();
      setTelemetry(`0x${hex}`);
    }, 150);
    return () => clearInterval(interval);
  }, [active]);

  if (!active) return null;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
      {/* Moving Laser Line */}
      <motion.div
        animate={{ top: ["-10%", "110%"] }}
        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
        className="absolute left-0 right-0 h-[2px] z-30"
        style={{ 
          background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
          boxShadow: `0 0 15px ${color}` 
        }}
      />

      {/* Shifting Telemetry Text */}
      <div className="absolute top-2 right-2 flex flex-col items-end gap-1 opacity-20 group-hover:opacity-60 transition-opacity">
        <span className="font-mono text-[7px] tracking-[0.2em]">{telemetry}</span>
        <div className="w-12 h-[1px]" style={{ backgroundColor: color }} />
      </div>

      {/* Digital Noise / Scanline Effect */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{ 
          backgroundImage: `linear-gradient(transparent 50%, rgba(0,0,0,0.5) 50%)`,
          backgroundSize: '100% 4px'
        }}
      />
    </div>
  );
}

/**
 * HUDFilters
 * Global SVG filters for Chromatic Aberration and Refractive Blur.
 * Render this once in App.tsx.
 */
export function HUDFilters() {
  return (
    <svg className="hidden">
      <defs>
        <filter id="refractive-glass">
          <feGaussianBlur in="SourceGraphic" stdDeviation="1.5" result="blur" />
          <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -10" result="goo" />
          <feComposite in="SourceGraphic" in2="goo" operator="atop" />
        </filter>
        <filter id="chromatic-aberration">
          <feColorMatrix in="SourceGraphic" type="matrix" values="1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0" result="red" />
          <feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 1 0" result="green" />
          <feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0 0 1 0" result="blue" />
          <feOffset in="red" dx="1.5" dy="0" result="red-offset" />
          <feOffset in="blue" dx="-1.5" dy="0" result="blue-offset" />
          <feBlend in="red-offset" in2="green" mode="screen" result="temp" />
          <feBlend in="temp" in2="blue-offset" mode="screen" />
        </filter>
      </defs>
    </svg>
  );
}

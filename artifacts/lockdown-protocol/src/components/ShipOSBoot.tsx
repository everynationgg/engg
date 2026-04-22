import { useEffect, useState } from "react";
import { usePerformanceMode } from "@/hooks/usePerformanceMode";

export default function ShipOSBoot() {
  const [lines, setLines] = useState<string[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  const [isFading, setIsFading] = useState(false);
  const { lowGraphics } = usePerformanceMode();

  const bootSequence = [
    "INITIATING SHIP OS v9.4.2...",
    "CHECKING LIFE SUPPORT SYSTEMS... [OK]",
    "CONNECTING TO ORBITAL RELAY... [OK]",
    "DECRYPTING SECURE COMM CHANNELS... [OK]",
    "SCANNING FOR BIO-ANOMALIES...",
    "WARNING: UNIDENTIFIED SIGNATURES DETECTED.",
    "ENGAGING LOCKDOWN PROTOCOL...",
    "SYSTEM READY."
  ];

  useEffect(() => {
    // If low graphics or already booted this session, skip
    if (lowGraphics || sessionStorage.getItem("lp_booted") === "true") {
      setIsComplete(true);
      return;
    }

    let currentIndex = 0;
    let isMounted = true;

    // Defensive: clear lines if remounting
    setLines([]);

    const addLine = () => {
      if (!isMounted) return;
      // Defensive: prevent duplicate lines
      if (currentIndex < bootSequence.length && lines.length < bootSequence.length) {
        setLines(prev => {
          // Only add if not already present
          if (prev.length > currentIndex) return prev;
          return [...prev, bootSequence[currentIndex]];
        });
        currentIndex++;
        const nextDelay = Math.random() * 200 + 100; // 100-300ms
        setTimeout(addLine, nextDelay);
      } else {
        setTimeout(() => {
          if (!isMounted) return;
          setIsFading(true);
          sessionStorage.setItem("lp_booted", "true");
          setTimeout(() => setIsComplete(true), 500); // Wait for fade out
        }, 600);
      }
    };

    const initialDelay = setTimeout(addLine, 300);
    return () => {
      isMounted = false;
      clearTimeout(initialDelay);
      setLines([]); // Defensive: clear on unmount
    };
  }, [lowGraphics]);

  if (isComplete) {
    return null;
  }

  return (
    <div 
      className="fixed inset-0 z-[9999] bg-black text-cyan-500 font-orbitron p-8 text-sm sm:text-base flex flex-col justify-end pb-24 overflow-hidden"
      style={{
        opacity: isFading ? 0 : 1,
        transition: "opacity 500ms ease-in-out",
        pointerEvents: isFading ? "none" : "auto"
      }}
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-cyan-900/10 via-black to-black pointer-events-none" />
      <div className="relative z-10 space-y-2">
        {lines.map((line, i) => (
          <div key={i} className={`font-mono tracking-wider ${line?.includes("WARNING") ? "text-red-500" : ""}`} style={{ textShadow: line?.includes("WARNING") ? "0 0 10px rgba(239,68,68,0.8)" : "0 0 10px rgba(6,182,212,0.8)" }}>
            {line}
          </div>
        ))}
        {!isFading && <div className="w-3 h-5 bg-cyan-500 animate-pulse mt-2" />}
      </div>
      
      {/* Scanline overlay */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          background: "linear-gradient(transparent 50%, rgba(0, 0, 0, 0.25) 50%)",
          backgroundSize: "100% 4px"
        }}
      />
    </div>
  );
}

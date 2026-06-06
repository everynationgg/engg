// v1.0.2
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import LandingNav from "@/components/ui/gradient-menu";

function usePrefersReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => setPrefersReducedMotion(query.matches);
    updatePreference();
    query.addEventListener("change", updatePreference);
    return () => query.removeEventListener("change", updatePreference);
  }, []);

  return prefersReducedMotion;
}

export default function Home() {
  const [, navigate] = useLocation();
  const prefersReducedMotion = usePrefersReducedMotion();

  return (
    <div className="landing-root relative h-screen min-h-[100dvh] overflow-hidden bg-black">
      {/* Dark premium gradient background fallback */}
      <div
        className="absolute inset-0 bg-gradient-to-b from-[#080d16] via-[#020408] to-[#000102]"
        aria-hidden="true"
      />

      {!prefersReducedMotion && (
        <video
          className="absolute inset-0 h-full w-full object-cover origin-center pointer-events-none"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          aria-hidden="true"
        >
          <source src="/bg-video.mp4" type="video/mp4" />
        </video>
      )}

      {/* BOTTOM NAVIGATION HUB */}
      <div className="absolute bottom-8 md:bottom-16 left-1/2 -translate-x-1/2 z-30 px-4 w-full flex justify-center">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: "easeOut", delay: 0.08 }}
        >
          <LandingNav
            onDiscord={() => window.open("https://discord.gg/everynation", "_blank")}
            onEnter={() => navigate("/hub")}
            onSocials={() => window.open("https://linktr.ee/everynationgg", "_blank")}
          />
        </motion.div>
      </div>
    </div>
  );
}

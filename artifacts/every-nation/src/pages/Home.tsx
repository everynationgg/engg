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
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/opengraph.jpg')" }}
        aria-hidden="true"
      />

      {!prefersReducedMotion && (
        <video
          className="absolute inset-0 h-full w-full scale-[0.9] object-cover origin-center pointer-events-none md:scale-100"
          poster="/opengraph.jpg"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          aria-hidden="true"
        >
          <source src="/bg-video.mp4" type="video/mp4" />
          <source src="/EN_PAGE_BACKGROUND.webm" type="video/webm" />
        </video>
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent pointer-events-none z-10" />

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

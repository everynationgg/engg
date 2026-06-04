// v1.0.2
import { lazy, Suspense, useEffect, useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { HUDOverlay } from "@/components/common/HUDOverlay";
import LandingNav from "@/components/ui/gradient-menu";

const AuroraShader = lazy(() => import("@/components/ui/animated-shader-background"));

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

function canUseWebGLEnhancement() {
  const navigatorWithHints = navigator as Navigator & {
    deviceMemory?: number;
  };

  if (navigatorWithHints.deviceMemory && navigatorWithHints.deviceMemory < 4) {
    return false;
  }

  if (navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4) {
    return false;
  }

  return window.matchMedia("(min-width: 768px)").matches;
}

export default function Home() {
  const [, navigate] = useLocation();
  const prefersReducedMotion = usePrefersReducedMotion();
  const [mediaEnabled, setMediaEnabled] = useState(false);
  const [shaderEnabled, setShaderEnabled] = useState(false);

  useEffect(() => {
    if (prefersReducedMotion) {
      setMediaEnabled(false);
      return;
    }

    let started = false;
    const startMedia = () => {
      if (started) return;
      started = true;
      setMediaEnabled(true);
    };

    const timer = window.setTimeout(startMedia, 900);
    window.addEventListener("pointerdown", startMedia, { once: true, passive: true });
    window.addEventListener("keydown", startMedia, { once: true });

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("pointerdown", startMedia);
      window.removeEventListener("keydown", startMedia);
    };
  }, [prefersReducedMotion]);

  useEffect(() => {
    if (!mediaEnabled || prefersReducedMotion || !canUseWebGLEnhancement()) {
      setShaderEnabled(false);
      return;
    }

    const timer = window.setTimeout(() => setShaderEnabled(true), 500);
    return () => clearTimeout(timer);
  }, [mediaEnabled, prefersReducedMotion]);

  return (
    <HUDOverlay pageLabel="INITIAL_LINK" showVignette={false}>
      <div className="landing-root h-screen relative overflow-hidden">
        {/* LCP-first static layer. Video and WebGL are progressive enhancements. */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              "linear-gradient(180deg, rgba(1,4,12,0.18) 0%, rgba(1,4,12,0.42) 44%, rgba(0,0,0,0.86) 100%), url('/opengraph.jpg')",
          }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_28%,rgba(34,211,238,0.28),transparent_32%),radial-gradient(circle_at_18%_76%,rgba(168,85,247,0.24),transparent_30%),linear-gradient(135deg,rgba(3,7,18,0.35),rgba(8,47,73,0.12),rgba(0,0,0,0.35))]" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(6,182,212,0.08)_1px,transparent_1px),linear-gradient(180deg,rgba(6,182,212,0.05)_1px,transparent_1px)] bg-[size:72px_72px] opacity-25" />

        {mediaEnabled && (
          <video
            className="absolute inset-0 w-full h-full object-cover pointer-events-none scale-[0.94] md:scale-100 origin-center opacity-45 mix-blend-screen transition-opacity duration-700"
            src="/bg-video.mp4"
            poster="/opengraph.jpg"
            autoPlay
            muted
            loop
            playsInline
            preload="none"
            aria-hidden="true"
          />
        )}

        <div className="absolute inset-0 w-full h-full pointer-events-none opacity-45">
          {shaderEnabled && (
            <Suspense fallback={null}>
              <AuroraShader />
            </Suspense>
          )}
        </div>

        {/* Cinematic Bottom Vignette for Legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent pointer-events-none z-10" />

        <main className="relative z-20 mx-auto flex h-full min-h-[100dvh] w-full max-w-6xl flex-col items-center justify-center px-6 pb-36 pt-20 text-center md:pb-44 md:pt-24">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: "easeOut" }}
            className="flex max-w-4xl flex-col items-center"
          >
            <div className="mb-5 flex items-center gap-3 text-cyan-200/80">
              <span className="h-px w-8 bg-cyan-400/40" />
              <span className="font-mono text-[9px] uppercase tracking-[0.55em]">
                Network Online
              </span>
              <span className="h-px w-8 bg-cyan-400/40" />
            </div>
            <h1 className="font-orbitron text-4xl font-black uppercase tracking-[0.28em] text-white drop-shadow-[0_0_30px_rgba(34,211,238,0.3)] sm:text-5xl md:text-7xl">
              Every <span className="text-cyan-300">Nation</span>
            </h1>
            <p className="mt-6 max-w-2xl text-sm leading-7 text-white/80 md:text-base">
              A tactical gaming network for social deception, squad play, and
              experimental cyberpunk worlds.
            </p>
            <div className="mt-8 grid w-full max-w-3xl grid-cols-1 gap-3 sm:grid-cols-3">
              {["Errant Night Live", "Squads Assembling", "Hub Access Ready"].map((label) => (
                <div
                  key={label}
                  className="border border-cyan-300/15 bg-black/35 px-4 py-3 backdrop-blur-sm"
                >
                  <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-cyan-100/80">
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        </main>

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


        {/* System Readout */}
        <div className="absolute bottom-4 left-0 right-0 flex justify-center items-center gap-4 opacity-10 z-10">
          <div className="h-[1px] w-6 bg-white" />
          <span className="font-mono text-[7px] uppercase tracking-[0.8em]">System_Readout_Active</span>
          <div className="h-[1px] w-6 bg-white" />
        </div>
      </div>
    </HUDOverlay>
  );
}

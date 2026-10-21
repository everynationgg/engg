import React, { useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { FaDiscord, FaCompass, FaGamepad, FaRocket, FaTools, FaUsers, FaStore } from "react-icons/fa";
import HomeHeroNav from "@/components/home/HomeHeroNav";
import HomeValueDock from "@/components/home/HomeValueDock";
import { DISCORD_INVITE_URL, PROJECT_STUDIO_URL, launchErrantNight } from "@/lib/externalLinks";

export default function Home() {
  const [, setLocation] = useLocation();

  // Active slide index (0 to 3)
  const [activeIdx, setActiveIdx] = useState(0);
  const [direction, setDirection] = useState(1);

  const slides = [
    {
      id: "community",
      eyebrow: "S T R O N G   C O M M U N I T Y",
      headlineParts: [
        { text: "Gaming.", color: "text-[#7c3aed]" },
        { text: "Community.", color: "text-neutral-900" },
        { text: "Studio.", color: "text-[#f97316]" },
      ],
      subtitle:
        "Connect, play, and build with players worldwide. We are an independent game studio, player community, and software engineering team.",
      buttons: [
        {
          label: "JOIN DISCORD",
          mobileLabel: "DISCORD",
          icon: FaDiscord,
          style: "primary-purple",
          action: () => window.open(DISCORD_INVITE_URL, "_blank", "noopener,noreferrer"),
        },
        {
          label: "EXPLORE GAMES",
          mobileLabel: "GAMES",
          icon: FaCompass,
          style: "glass-white",
          action: () => setLocation("/hub"),
        },
        {
          label: "WHO WE ARE",
          mobileLabel: "WHO WE ARE",
          icon: FaUsers,
          iconColor: "text-[#7c3aed]",
          style: "glass-white",
          action: () => setLocation("/about/who-we-are"),
        },
      ],
    },
    {
      id: "gaming",
      eyebrow: "G A M I N G   H U B",
      headlineParts: [
        { text: "Multiplayer.", color: "text-[#7c3aed]" },
        { text: "Social.", color: "text-neutral-900" },
        { text: "Real-Time.", color: "text-[#f97316]" },
      ],
      subtitle:
        "Jump straight into live matches. Crew vs. Alien social deduction in Errant Night, tactical card battles in Engraved Nether, and community lobbies.",
      buttons: [
        {
          label: "PLAY ERRANT NIGHT",
          mobileLabel: "ERRANT NIGHT",
          icon: FaGamepad,
          style: "primary-purple",
          action: () => launchErrantNight(),
        },
        {
          label: "GAME HUB",
          mobileLabel: "GAME HUB",
          icon: FaCompass,
          style: "glass-white",
          action: () => setLocation("/hub"),
        },
        {
          label: "JOIN DISCORD",
          mobileLabel: "DISCORD",
          icon: FaDiscord,
          iconColor: "text-[#5865F2]",
          style: "glass-white",
          action: () => window.open(DISCORD_INVITE_URL, "_blank", "noopener,noreferrer"),
        },
      ],
    },
    {
      id: "project-studio",
      eyebrow: "P R O J E C T   S T U D I O",
      headlineParts: [
        { text: "Scope.", color: "text-[#7c3aed]" },
        { text: "Prototype.", color: "text-neutral-900" },
        { text: "Ship.", color: "text-[#f97316]" },
      ],
      subtitle:
        "Plan your web or mobile application with clear technical specifications, interactive roadmaps, and direct collaboration with our engineers.",
      buttons: [
        {
          label: "START A PROJECT",
          mobileLabel: "START PROJECT",
          icon: FaRocket,
          style: "primary-purple",
          action: () => window.open(PROJECT_STUDIO_URL, "_blank", "noopener,noreferrer"),
        },
        {
          label: "WHAT WE DO",
          mobileLabel: "WHAT WE DO",
          icon: FaTools,
          style: "glass-white",
          action: () => setLocation("/about/what-we-do"),
        },
        {
          label: "JOIN DISCORD",
          mobileLabel: "DISCORD",
          icon: FaDiscord,
          iconColor: "text-[#5865F2]",
          style: "glass-white",
          action: () => window.open(DISCORD_INVITE_URL, "_blank", "noopener,noreferrer"),
        },
      ],
    },
    {
      id: "software-solutions",
      eyebrow: "A P P S   &   S O F T W A R E",
      headlineParts: [
        { text: "Web.", color: "text-[#7c3aed]" },
        { text: "Mobile.", color: "text-neutral-900" },
        { text: "Built to Last.", color: "text-[#f97316]" },
      ],
      subtitle:
        "Download official Android builds or explore the custom web applications, client portals, and multiplayer systems built by our studio.",
      buttons: [
        {
          label: "BROWSE MARKETPLACE",
          mobileLabel: "MARKETPLACE",
          icon: FaStore,
          style: "primary-purple",
          action: () => setLocation("/marketplace"),
        },
        {
          label: "WHAT WE DO",
          mobileLabel: "WHAT WE DO",
          icon: FaTools,
          style: "glass-white",
          action: () => setLocation("/about/what-we-do"),
        },
        {
          label: "GAME HUB",
          mobileLabel: "GAME HUB",
          icon: FaGamepad,
          iconColor: "text-[#7c3aed]",
          style: "glass-white",
          action: () => setLocation("/hub"),
        },
      ],
    },
  ];

  const currentSlide = slides[activeIdx];

  const handlePrev = () => {
    setDirection(-1);
    setActiveIdx((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setDirection(1);
    setActiveIdx((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
  };

  const handleGoTo = (idx: number) => {
    setDirection(idx > activeIdx ? 1 : -1);
    setActiveIdx(idx);
  };

  // Drag & Swipe gesture handler
  const handleDragEnd = (_: unknown, info: { offset: { x: number }; velocity: { x: number } }) => {
    const swipeThreshold = 45;
    const velocityThreshold = 120;

    if (info.offset.x < -swipeThreshold || info.velocity.x < -velocityThreshold) {
      handleNext();
    } else if (info.offset.x > swipeThreshold || info.velocity.x > velocityThreshold) {
      handlePrev();
    }
  };

  const slideVariants = {
    initial: (dir: number) => ({
      x: dir > 0 ? 60 : -60,
      opacity: 0,
      scale: 0.98,
    }),
    animate: {
      x: 0,
      opacity: 1,
      scale: 1,
      transition: {
        x: { type: "spring" as const, stiffness: 350, damping: 30 },
        opacity: { duration: 0.25 },
        scale: { duration: 0.25 },
      },
    },
    exit: (dir: number) => ({
      x: dir > 0 ? -60 : 60,
      opacity: 0,
      scale: 0.98,
      transition: {
        x: { type: "spring" as const, stiffness: 350, damping: 30 },
        opacity: { duration: 0.2 },
      },
    }),
  };

  return (
    <div className="min-h-screen lg:h-screen lg:max-h-screen flex flex-col justify-start lg:justify-between overflow-x-hidden overflow-y-auto lg:overflow-hidden bg-black text-[#1d1d1f] font-sans antialiased selection:bg-[#7c3aed]/20 selection:text-black">
      {/* ── 1. Top Header Navigation ─────────────────────────────────────── */}
      <HomeHeroNav />

      {/* ── 2. Center Stage with Extended Dual-Zone Studio Backdrop ───────── */}
      <main
        className="sm:flex-1 flex-initial relative flex flex-col justify-end items-center px-3 sm:px-6 h-[460px] sm:h-auto pt-0 pb-3 sm:pb-2 lg:pb-1.5 2xl:pb-2 select-none home-stage-backdrop min-h-0 sm:min-h-[580px] lg:min-h-0"
        style={{
          backgroundImage: `url('/images/home/home-dual-studio-master.webp?v=17')`,
        }}
      >
        {/* Soft floor ambient gradient to ensure crystal-clear text readability over floor reflections */}
        <div className="hidden sm:block absolute inset-x-0 bottom-0 h-56 lg:h-64 2xl:h-80 bg-gradient-to-t from-white via-white/60 to-transparent pointer-events-none z-0" />

        {/* ── Swipeable / Draggable Stage Content ── */}
        <div className="relative z-10 max-w-3xl lg:max-w-4xl xl:max-w-5xl 2xl:max-w-6xl w-full mx-auto flex flex-col items-center text-center mt-0 sm:mt-auto">
          {/* ── The 4 Pagination Dots Pill (Compact Indicator) ───────────── */}
          <div className="flex items-center gap-1.5 2xl:gap-2 mb-1.5 sm:mb-2 bg-white/85 backdrop-blur-md px-3 py-1 rounded-full border border-neutral-200/80 shadow-2xs">
            {slides.map((_, idx) => (
              <button
                key={idx}
                onClick={() => handleGoTo(idx)}
                aria-label={`Go to slide ${idx + 1}`}
                className={`h-1.5 sm:h-1.5 2xl:h-2 rounded-full transition-all duration-300 ${
                  activeIdx === idx
                    ? "w-4 sm:w-5 2xl:w-6 bg-[#f97316] shadow-xs"
                    : "w-1.5 sm:w-1.5 2xl:w-2 bg-neutral-300 hover:bg-neutral-400"
                }`}
              />
            ))}
          </div>

          {/* Interactive Drag & Swipe Floating Content */}
          <motion.div
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.15}
            onDragEnd={handleDragEnd}
            className="w-full cursor-grab active:cursor-grabbing focus:outline-none flex flex-col items-center"
          >
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={currentSlide.id}
                custom={direction}
                variants={slideVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="w-full flex flex-col items-center"
              >
                {/* Spaced Eyebrow Title */}
                <span className="text-[10px] sm:text-[11px] 2xl:text-xs font-semibold tracking-[0.22em] text-neutral-600 mb-0.5 2xl:mb-1 uppercase drop-shadow-[0_1px_1px_rgba(255,255,255,0.9)]">
                  {currentSlide.eyebrow}
                </span>

                {/* Triple-Value Proposition Headline */}
                <h1 className="text-[clamp(1.15rem,1.7vw+0.25rem,2.45rem)] font-black tracking-tight leading-none mb-1 sm:mb-1.5 2xl:mb-2 flex items-center justify-center gap-1.5 sm:gap-2 whitespace-nowrap drop-shadow-[0_1px_2px_rgba(255,255,255,0.85)]">
                  {currentSlide.headlineParts.map((part, i) => (
                    <span key={i} className={part.color}>
                      {part.text}
                    </span>
                  ))}
                </h1>

                {/* Mission Subtitle */}
                <p className="text-[11px] sm:text-xs 2xl:text-[13px] text-neutral-700 font-medium max-w-sm sm:max-w-lg lg:max-w-xl mx-auto leading-snug line-clamp-2 sm:line-clamp-none mb-2 sm:mb-2.5 2xl:mb-3 drop-shadow-[0_1px_1px_rgba(255,255,255,0.9)]">
                  {currentSlide.subtitle}
                </p>

                {/* 3 Action Pill Buttons */}
                <div
                  onPointerDown={(e) => e.stopPropagation()}
                  className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2.5 2xl:gap-3 w-full"
                >
                  {currentSlide.buttons.map((btn, bIdx) => {
                    const Icon = btn.icon;
                    const isPrimary = btn.style === "primary-purple";

                    return (
                      <button
                        key={bIdx}
                        onClick={btn.action}
                        className={`min-h-[34px] sm:min-h-[38px] 2xl:min-h-[42px] px-3 sm:px-5 2xl:px-6 py-1.5 sm:py-1.5 2xl:py-2 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-all duration-200 shadow-md active:scale-95 flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer ${
                          isPrimary
                            ? "bg-[#7c3aed] hover:bg-[#6d28d9] text-white shadow-[#7c3aed]/20"
                            : "bg-white/95 hover:bg-white text-neutral-800 border border-neutral-200/90 hover:border-neutral-300 shadow-sm"
                        }`}
                      >
                        <Icon className={`w-3 h-3 sm:w-3.5 sm:h-3.5 2xl:w-4 2xl:h-4 ${btn.iconColor || (isPrimary ? "text-white" : "text-neutral-700")}`} />
                        <span>
                          {btn.mobileLabel ? (
                            <>
                              <span className="inline sm:hidden">{btn.mobileLabel}</span>
                              <span className="hidden sm:inline">{btn.label}</span>
                            </>
                          ) : (
                            btn.label
                          )}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </div>
      </main>

      {/* ── 3. Bottom 4-Pillar Value Dock ────────────────────────────────── */}
      <HomeValueDock activeSlide={activeIdx} onSelectSlide={handleGoTo} />
    </div>
  );
}

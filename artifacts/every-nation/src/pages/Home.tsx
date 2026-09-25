import React, { useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { FaDiscord, FaCompass, FaBriefcase, FaGamepad, FaCode, FaRocket, FaTools } from "react-icons/fa";
import HomeHeroNav from "@/components/home/HomeHeroNav";
import HomeValueDock from "@/components/home/HomeValueDock";

export default function Home() {
  const [, setLocation] = useLocation();

  // Active slide index (0 to 4)
  const [activeIdx, setActiveIdx] = useState(0);
  const [direction, setDirection] = useState(1);

  const slides = [
    {
      id: "community",
      eyebrow: "S T R O N G   C O M M U N I T Y",
      headlineParts: [
        { text: "Gaming.", color: "text-[#7c3aed]" },
        { text: "Community.", color: "text-neutral-900" },
        { text: "Innovation.", color: "text-[#f97316]" },
      ],
      subtitle:
        "Connect, play, and grow with gamers worldwide. We are a gaming community, an AI-powered ecosystem, and a digital software studio.",
      buttons: [
        {
          label: "JOIN DISCORD",
          icon: FaDiscord,
          style: "primary-purple",
          action: () => window.open("https://discord.gg/everynation", "_blank", "noopener,noreferrer"),
          hasBadge: true,
        },
        {
          label: "EXPLORE ENOS",
          icon: FaCompass,
          style: "glass-white",
          action: () => setLocation("/hub"),
          hasBadge: true,
        },
        {
          label: "WORK WITH US",
          icon: FaBriefcase,
          iconColor: "text-[#f97316]",
          style: "glass-white",
          action: () => setLocation("/contact"),
          hasBadge: false,
        },
      ],
    },
    {
      id: "gaming",
      eyebrow: "G A M I N G   H U B",
      headlineParts: [
        { text: "Multiplayer.", color: "text-[#7c3aed]" },
        { text: "High-Stakes.", color: "text-neutral-900" },
        { text: "Real-Time.", color: "text-[#f97316]" },
      ],
      subtitle:
        "All games. All players. One epic experience. Tactical social deduction in Errant Night, competitive strategy, and live community multiplayer lobbies.",
      buttons: [
        {
          label: "PLAY ERRANT NIGHT",
          icon: FaGamepad,
          style: "primary-purple",
          action: () => setLocation("/errant-night"),
          hasBadge: true,
        },
        {
          label: "CENTRAL GAMING HUB",
          icon: FaCompass,
          style: "glass-white",
          action: () => setLocation("/hub"),
          hasBadge: true,
        },
        {
          label: "JOIN DISCORD",
          icon: FaDiscord,
          iconColor: "text-[#5865F2]",
          style: "glass-white",
          action: () => window.open("https://discord.gg/everynation", "_blank", "noopener,noreferrer"),
          hasBadge: false,
        },
      ],
    },
    {
      id: "ai-automation",
      eyebrow: "A I   &   A U T O M A T I O N",
      headlineParts: [
        { text: "Intelligent.", color: "text-[#7c3aed]" },
        { text: "Configurators.", color: "text-neutral-900" },
        { text: "Automated.", color: "text-[#f97316]" },
      ],
      subtitle:
        "Smarter systems, better experiences, endless possibilities. Interactive product configurators, step-by-step logic builders, and automated utilities.",
      buttons: [
        {
          label: "OPEN BUILDER TOOL",
          icon: FaTools,
          style: "primary-purple",
          action: () => setLocation("/estimate"),
          hasBadge: true,
        },
        {
          label: "CUSTOM TOOLS MATRIX",
          icon: FaCode,
          style: "glass-white",
          action: () => setLocation("/services/custom-tools"),
          hasBadge: true,
        },
        {
          label: "WORK WITH US",
          icon: FaBriefcase,
          iconColor: "text-[#f97316]",
          style: "glass-white",
          action: () => setLocation("/contact"),
          hasBadge: false,
        },
      ],
    },
    {
      id: "software-solutions",
      eyebrow: "S O F T W A R E   S O L U T I O N S",
      headlineParts: [
        { text: "Web.", color: "text-[#7c3aed]" },
        { text: "Mobile.", color: "text-neutral-900" },
        { text: "Scalable.", color: "text-[#f97316]" },
      ],
      subtitle:
        "Web. Mobile. Scalable. Built for the future. We architect production SaaS dashboards, bespoke web applications, high-performance APIs, and modern digital tools.",
      buttons: [
        {
          label: "START A PROJECT",
          icon: FaBriefcase,
          style: "primary-purple",
          action: () => setLocation("/contact"),
          hasBadge: true,
        },
        {
          label: "BUILDER ESTIMATOR",
          icon: FaTools,
          style: "glass-white",
          action: () => setLocation("/estimate"),
          hasBadge: true,
        },
        {
          label: "SERVICES MATRIX",
          icon: FaCode,
          iconColor: "text-[#f97316]",
          style: "glass-white",
          action: () => setLocation("/services"),
          hasBadge: false,
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
  const handleDragEnd = (_: any, info: { offset: { x: number }; velocity: { x: number } }) => {
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
    <div className="min-h-screen lg:h-screen lg:max-h-screen flex flex-col justify-between overflow-x-hidden overflow-y-auto lg:overflow-hidden bg-white text-[#1d1d1f] font-sans antialiased selection:bg-[#7c3aed]/20 selection:text-black">
      {/* ── 1. Top Header Navigation ─────────────────────────────────────── */}
      <HomeHeroNav />

      {/* ── 2. Center Stage with Extended Dual-Zone Studio Backdrop ───────── */}
      <main
        className="flex-1 relative flex flex-col justify-end items-center px-4 sm:px-6 pb-4 lg:pb-6 select-none bg-no-repeat bg-white bg-cover bg-[position:center_top] min-h-[520px] sm:min-h-[560px] lg:min-h-0"
        style={{
          backgroundImage: `url('/images/home/home-dual-studio-master.jpg?v=5')`,
        }}
      >
        {/* ── Swipeable / Draggable Stage Content ───────────────────────── */}
        <div className="relative z-10 max-w-3xl w-full mx-auto flex flex-col items-center text-center mt-auto">
          {/* ── The 5 Pagination Dots (Drag indicator) ─────────────────── */}
          <div className="flex items-center gap-1.5 mb-2.5 bg-white/80 backdrop-blur-md px-3 py-1 rounded-full border border-neutral-200/80 shadow-xs">
            {slides.map((_, idx) => (
              <button
                key={idx}
                onClick={() => handleGoTo(idx)}
                aria-label={`Go to slide ${idx + 1}`}
                className={`h-2 rounded-full transition-all duration-300 ${
                  activeIdx === idx
                    ? "w-6 bg-[#f97316] shadow-xs"
                    : "w-2 bg-neutral-300 hover:bg-neutral-400"
                }`}
              />
            ))}
          </div>

          {/* Interactive Drag & Swipe Card */}
          <motion.div
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.15}
            onDragEnd={handleDragEnd}
            className="w-full cursor-grab active:cursor-grabbing focus:outline-none"
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
                <span className="text-[11px] sm:text-xs font-semibold tracking-[0.25em] text-neutral-600 mb-1.5 uppercase">
                  {currentSlide.eyebrow}
                </span>

                {/* Triple-Value Proposition Headline */}
                <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black tracking-tight leading-[1.1] mb-2 sm:mb-2.5 flex items-center justify-center gap-1.5 sm:gap-2 flex-wrap">
                  {currentSlide.headlineParts.map((part, i) => (
                    <span key={i} className={part.color}>
                      {part.text}
                    </span>
                  ))}
                </h1>

                {/* Mission Subtitle */}
                <p className="text-xs sm:text-sm text-neutral-600 font-normal max-w-lg lg:max-w-xl mx-auto leading-relaxed mb-3 sm:mb-4 lg:mb-5">
                  {currentSlide.subtitle}
                </p>

                {/* 3 Action Pill Buttons */}
                <div
                  onPointerDown={(e) => e.stopPropagation()}
                  className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 w-full"
                >
                  {currentSlide.buttons.map((btn, bIdx) => {
                    const Icon = btn.icon;
                    const isPrimary = btn.style === "primary-purple";

                    return (
                      <button
                        key={bIdx}
                        onClick={btn.action}
                        className={`min-h-[44px] sm:min-h-[48px] px-5 sm:px-6 py-2.5 rounded-full text-xs sm:text-xs font-bold uppercase tracking-wider transition-all duration-200 shadow-md active:scale-95 flex items-center justify-center gap-2.5 ${
                          isPrimary
                            ? "bg-[#7c3aed] hover:bg-[#6d28d9] text-white shadow-[#7c3aed]/20"
                            : "bg-white/90 hover:bg-white text-neutral-800 border border-neutral-200/90 hover:border-neutral-300 shadow-sm"
                        }`}
                      >
                        <Icon className={`w-4 h-4 ${btn.iconColor || (isPrimary ? "text-white" : "text-neutral-700")}`} />
                        <span>{btn.label}</span>
                        {btn.hasBadge && (
                          <span className={`text-[10px] ${isPrimary ? "text-white/80" : "text-neutral-400"}`}>
                            ⬡
                          </span>
                        )}
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

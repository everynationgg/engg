import React, { useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { FaDiscord, FaCompass, FaGamepad, FaCode, FaRocket, FaTools, FaUsers } from "react-icons/fa";
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
          label: "WHO WE ARE",
          icon: FaUsers,
          iconColor: "text-[#7c3aed]",
          style: "glass-white",
          action: () => setLocation("/about/who-we-are"),
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
          label: "VISIEN DISCOVERY",
          icon: FaRocket,
          style: "primary-purple",
          action: () => window.open("https://visien-gray.vercel.app/", "_blank", "noopener,noreferrer"),
          hasBadge: true,
        },
        {
          label: "WHAT WE DO",
          icon: FaTools,
          style: "glass-white",
          action: () => setLocation("/about/what-we-do"),
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
          label: "WHAT WE DO",
          icon: FaRocket,
          style: "primary-purple",
          action: () => setLocation("/about/what-we-do"),
          hasBadge: true,
        },
        {
          label: "LAUNCH VISIEN",
          icon: FaTools,
          style: "glass-white",
          action: () => window.open("https://visien-gray.vercel.app/", "_blank", "noopener,noreferrer"),
          hasBadge: true,
        },
        {
          label: "CENTRAL GAMING HUB",
          icon: FaGamepad,
          iconColor: "text-[#7c3aed]",
          style: "glass-white",
          action: () => setLocation("/hub"),
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
        className="flex-1 relative flex flex-col justify-end items-center px-4 sm:px-6 pb-1 sm:pb-1.5 lg:pb-2 2xl:pb-2 select-none bg-no-repeat bg-white bg-cover bg-[position:center_22px] sm:bg-[position:center_top] lg:bg-[position:center_-45px] 2xl:bg-[position:center_-50px] min-h-[500px] sm:min-h-[540px] lg:min-h-0"
        style={{
          backgroundImage: `url('/images/home/home-dual-studio-master.jpg?v=5')`,
        }}
      >
        {/* ── Swipeable / Draggable Stage Content (Pure Floating, Zero White Box) ── */}
        <div className="relative z-10 max-w-3xl lg:max-w-4xl xl:max-w-5xl 2xl:max-w-6xl w-full mx-auto flex flex-col items-center text-center mt-auto">
          {/* ── The 4 Pagination Dots Pill (Compact Indicator) ───────────── */}
          <div className="flex items-center gap-1.5 2xl:gap-2 mb-1 sm:mb-1.5 bg-white/85 backdrop-blur-md px-2.5 2xl:px-3 py-0.5 rounded-full border border-neutral-200/80 shadow-2xs">
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
                <span className="text-[9px] sm:text-[10px] 2xl:text-xs font-semibold tracking-[0.25em] text-neutral-600 mb-0.5 2xl:mb-1 uppercase drop-shadow-[0_1px_1px_rgba(255,255,255,0.9)]">
                  {currentSlide.eyebrow}
                </span>

                {/* Triple-Value Proposition Headline (Single line at all viewports, zero EN icon overlap) */}
                <h1 className="text-[clamp(1.1rem,1.8vw+0.2rem,2.45rem)] font-black tracking-tight leading-none mb-1 sm:mb-1.5 2xl:mb-1.5 flex items-center justify-center gap-1 sm:gap-1.5 md:gap-2 lg:gap-2 whitespace-nowrap drop-shadow-[0_1px_2px_rgba(255,255,255,0.8)]">
                  {currentSlide.headlineParts.map((part, i) => (
                    <span key={i} className={part.color}>
                      {part.text}
                    </span>
                  ))}
                </h1>

                {/* Mission Subtitle */}
                <p className="text-[11px] sm:text-xs 2xl:text-[13px] text-neutral-700 font-medium max-w-md sm:max-w-lg lg:max-w-xl mx-auto leading-normal mb-2 sm:mb-2.5 2xl:mb-3 drop-shadow-[0_1px_1px_rgba(255,255,255,0.9)]">
                  {currentSlide.subtitle}
                </p>

                {/* 3 Action Pill Buttons */}
                <div
                  onPointerDown={(e) => e.stopPropagation()}
                  className="flex flex-wrap items-center justify-center gap-2 sm:gap-2.5 2xl:gap-3 w-full"
                >
                  {currentSlide.buttons.map((btn, bIdx) => {
                    const Icon = btn.icon;
                    const isPrimary = btn.style === "primary-purple";

                    return (
                      <button
                        key={bIdx}
                        onClick={btn.action}
                        className={`min-h-[36px] sm:min-h-[38px] 2xl:min-h-[42px] px-4 sm:px-5 2xl:px-6 py-1.5 2xl:py-2 rounded-full text-[11px] sm:text-xs font-bold uppercase tracking-wider transition-all duration-200 shadow-md active:scale-95 flex items-center justify-center gap-2 ${
                          isPrimary
                            ? "bg-[#7c3aed] hover:bg-[#6d28d9] text-white shadow-[#7c3aed]/20"
                            : "bg-white/90 hover:bg-white text-neutral-800 border border-neutral-200/90 hover:border-neutral-300 shadow-sm"
                        }`}
                      >
                        <Icon className={`w-3.5 h-3.5 sm:w-3.5 sm:h-3.5 2xl:w-4 2xl:h-4 ${btn.iconColor || (isPrimary ? "text-white" : "text-neutral-700")}`} />
                        <span>{btn.label}</span>
                        {btn.hasBadge && (
                          <span className={`text-[9px] 2xl:text-[10px] ${isPrimary ? "text-white/80" : "text-neutral-400"}`}>
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

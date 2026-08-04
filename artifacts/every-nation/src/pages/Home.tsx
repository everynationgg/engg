import React, { useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import StudioLayout from "@/components/StudioLayout";

export default function Home() {
  const [, setLocation] = useLocation();

  // Active Unified Slide Index (0: Websites, 1: Web Apps, 2: Games, 3: Engines, 4: Tools)
  const [activeIdx, setActiveIdx] = useState(1);
  const [weeks, setWeeks] = useState(3);
  const [direction, setDirection] = useState(1); // 1: next, -1: prev

  const slides = [
    {
      id: "website",
      icon: "🌐",
      categoryName: "Bespoke Websites",
      headline: "We design & build high-converting websites.",
      subtitle: "Fast, responsive product launch sites, Apple-grade corporate web design, and high-impact landing pages.",
      boxTitle: "Bespoke Website & Landing Page",
      boxDesc: "Custom React UI, mobile-fluid layouts, Framer Motion micro-animations, and SEO meta infrastructure.",
      calcBudget: (w: number) => `$${(w * 2500).toLocaleString()} – $${(w * 3500).toLocaleString()}`,
      stack: "React, Vite, Tailwind CSS, Framer Motion, Vercel Edge",
    },
    {
      id: "webapp",
      icon: "💻",
      categoryName: "Web Applications",
      headline: "We design & build custom web apps & SaaS.",
      subtitle: "Full-stack web applications, SaaS dashboards, client portals, Stripe billing, and automated business workflows.",
      boxTitle: "Custom Full-Stack Web Application",
      boxDesc: "Full-stack architecture with authenticated user roles, REST APIs, and production PostgreSQL database.",
      calcBudget: (w: number) => `$${(w * 3500).toLocaleString()} – $${(w * 5000).toLocaleString()}`,
      stack: "React, TypeScript, Node.js, Express, PostgreSQL, Drizzle",
    },
    {
      id: "games",
      icon: "🎮",
      categoryName: "Games & Interactive Systems",
      headline: "We design & build web games & interactive systems.",
      subtitle: "Web-based multiplayer gaming hubs, Socket.IO real-time game state relays, canvas engines, and leaderboards.",
      boxTitle: "Web Games & Interactive Engine",
      boxDesc: "Real-time multiplayer lobbies, WebSockets synchronization, canvas graphics, and high-throughput leaderboards.",
      calcBudget: (w: number) => `$${(w * 4000).toLocaleString()} – $${(w * 6000).toLocaleString()}`,
      stack: "React, TypeScript, Socket.IO, Canvas/WebGL, Node.js, Redis",
    },
    {
      id: "engine",
      icon: "⚡",
      categoryName: "Real-Time Event Engines",
      headline: "We architect real-time event engines & APIs.",
      subtitle: "Sub-50ms WebSocket event servers, Redis Pub/Sub, live data feeds, and global Fly.io edge microservices.",
      boxTitle: "Real-Time Engine & API Architecture",
      boxDesc: "Low-latency streaming backends, rate-limited Express REST APIs, and global edge container deployments.",
      calcBudget: (w: number) => `$${(w * 4000).toLocaleString()} – $${(w * 5500).toLocaleString()}`,
      stack: "Socket.IO, Redis Pub/Sub, Fly.io Edge Relay, PostgreSQL",
    },
    {
      id: "tool",
      icon: "🛠️",
      categoryName: "Custom Tools & Configurators",
      headline: "We build personalized tools & software configurators.",
      subtitle: "Interactive business software, dynamic product configurators, calculators, and specialized web utilities.",
      boxTitle: "Personalized Configurator & Tool",
      boxDesc: "Tailored business software with interactive canvas controls, step-by-step logic builders, and data exporters.",
      calcBudget: (w: number) => `$${(w * 3000).toLocaleString()} – $${(w * 4500).toLocaleString()}`,
      stack: "Interactive Canvas, Custom Logic Builder, Data Exporters",
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

  const handleApplyEstimate = (e: React.MouseEvent) => {
    e.stopPropagation();
    const summary = `${currentSlide.boxTitle} (~${weeks} Weeks) - Est. Budget: ${currentSlide.calcBudget(weeks)}`;
    sessionStorage.setItem("engg_project_summary", summary);
    setLocation("/contact");
  };

  // Drag End Gesture Handler for Framer Motion Touch/Mouse Swipe
  const handleDragEnd = (_: any, info: { offset: { x: number }; velocity: { x: number } }) => {
    const swipeThreshold = 50;
    const velocityThreshold = 150;

    if (info.offset.x < -swipeThreshold || info.velocity.x < -velocityThreshold) {
      handleNext();
    } else if (info.offset.x > swipeThreshold || info.velocity.x > velocityThreshold) {
      handlePrev();
    }
  };

  // Slide Animation Variants with Spring Physics
  const slideVariants = {
    initial: (dir: number) => ({
      x: dir > 0 ? 80 : -80,
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
      x: dir > 0 ? -80 : 80,
      opacity: 0,
      scale: 0.98,
      transition: {
        x: { type: "spring" as const, stiffness: 350, damping: 30 },
        opacity: { duration: 0.2 },
      },
    }),
  };

  return (
    <StudioLayout>
      <div className="max-w-3xl mx-auto px-6 w-full flex flex-col justify-center my-auto py-1">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentSlide.id}
            custom={direction}
            variants={slideVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="w-full"
          >
            {/* ── 1. Dynamic Hero Title & Subtitle (Swipes with active slide) ───── */}
            <div className="text-center mb-3">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-neutral-100 border border-neutral-200/80 mb-2 text-[10px] font-medium text-neutral-700">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Available for client contracts
              </div>

              <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-neutral-900 leading-[1.08] mb-2">
                {currentSlide.headline}
              </h1>

              <p className="text-xs sm:text-sm text-neutral-600 font-normal max-w-lg mx-auto leading-relaxed">
                {currentSlide.subtitle}
              </p>
            </div>

            {/* ── 2. 🎮 Drag & Swipe Interactive Apple Showcase Card ───── */}
            <motion.div
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.15}
              onDragEnd={handleDragEnd}
              className="bg-[#f5f5f7] rounded-3xl p-5 sm:p-7 border border-neutral-200/90 shadow-lg cursor-grab active:cursor-grabbing select-none"
            >
              {/* Top Bar with Slide Counter & Apple-Style Floating Pagination Dots */}
              <div className="flex items-center justify-between border-b border-neutral-200/80 pb-2.5 mb-4">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
                  <span className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                  <span className="w-2.5 h-2.5 rounded-full bg-green-400" />
                  <span className="ml-2 font-mono text-[11px] text-neutral-500 font-semibold flex items-center gap-1">
                    <span>{currentSlide.icon}</span>
                    <span className="text-neutral-900 font-bold">{currentSlide.categoryName}</span>
                  </span>
                </div>

                {/* Apple-Style Floating Pagination Dots (Replaces Tacky Arrow Buttons) */}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-neutral-400 font-bold hidden sm:inline-block mr-1">
                    Swipe or Drag ← →
                  </span>
                  <div className="flex items-center gap-1.5">
                    {slides.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleGoTo(idx);
                        }}
                        aria-label={`Go to slide ${idx + 1}`}
                        className={`h-2 rounded-full transition-all duration-300 ${
                          activeIdx === idx
                            ? "w-5 bg-neutral-900 shadow-xs"
                            : "w-2 bg-neutral-300 hover:bg-neutral-400"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Card Body */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-stretch">
                {/* Left Side: Scope Details & Timeline Slider */}
                <div className="md:col-span-7 space-y-3 flex flex-col justify-between">
                  <div>
                    <h2 className="text-base font-bold text-neutral-900 mb-1">
                      {currentSlide.boxTitle}
                    </h2>
                    <p className="text-[11px] text-neutral-600 leading-relaxed">
                      {currentSlide.boxDesc}
                    </p>
                  </div>

                  <div
                    onPointerDown={(e) => e.stopPropagation()}
                    className="bg-white rounded-2xl p-3 border border-neutral-200/80"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500">
                        Timeline Scope
                      </label>
                      <span className="text-[11px] font-bold text-neutral-900 bg-[#f5f5f7] px-2 py-0.5 rounded border border-neutral-200">
                        {weeks} {weeks === 1 ? "Week" : "Weeks"}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="6"
                      value={weeks}
                      onChange={(e) => setWeeks(parseInt(e.target.value))}
                      className="w-full h-1.5 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-neutral-900"
                    />
                    <div className="flex items-center justify-between text-[9px] text-neutral-400 font-semibold mt-1">
                      <span>1 Wk (MVP)</span>
                      <span>3 Wks (Standard)</span>
                      <span>6+ Wks (Enterprise)</span>
                    </div>
                  </div>
                </div>

                {/* Right Side: Calculated Estimate Output */}
                <div className="md:col-span-5 bg-white rounded-2xl p-4 border border-neutral-200/90 flex flex-col justify-between shadow-sm">
                  <div>
                    <div className="text-[9px] font-mono uppercase tracking-wider text-neutral-400 mb-1">
                      Calculated Estimate
                    </div>

                    <div className="grid grid-cols-2 gap-1.5 mb-2.5">
                      <div className="p-2 rounded-xl bg-[#f5f5f7]">
                        <div className="text-[9px] text-neutral-500 font-semibold mb-0.5">Est. Timeline</div>
                        <div className="text-xs font-bold text-neutral-900">~{weeks} {weeks === 1 ? "Week" : "Weeks"}</div>
                      </div>

                      <div className="p-2 rounded-xl bg-[#f5f5f7]">
                        <div className="text-[9px] text-neutral-500 font-semibold mb-0.5">Est. Investment</div>
                        <div className="text-xs font-bold text-emerald-600">{currentSlide.calcBudget(weeks)}</div>
                      </div>
                    </div>

                    <div className="text-[9px] text-neutral-500 font-semibold mb-1">Tech Stack:</div>
                    <div className="text-[9px] font-mono text-neutral-700 bg-[#f5f5f7] p-2 rounded-lg border border-neutral-200/80 mb-3 truncate">
                      {currentSlide.stack}
                    </div>
                  </div>

                  <button
                    onClick={handleApplyEstimate}
                    onPointerDown={(e) => e.stopPropagation()}
                    className="w-full bg-neutral-900 hover:bg-black text-white rounded-xl py-2.5 text-xs font-semibold transition-all shadow active:scale-95 flex items-center justify-center gap-1.5"
                  >
                    Apply & Start Project
                    <span>→</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </div>
    </StudioLayout>
  );
}

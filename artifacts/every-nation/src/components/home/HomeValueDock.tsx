import React from "react";
import { useLocation } from "wouter";
import { FaUsers, FaGamepad, FaBrain, FaCode } from "react-icons/fa";

interface HomeValueDockProps {
  activeSlide: number;
  onSelectSlide: (index: number) => void;
}

export default function HomeValueDock({ activeSlide, onSelectSlide }: HomeValueDockProps) {
  const [, setLocation] = useLocation();

  const pillars = [
    {
      id: "community",
      title: "STRONG COMMUNITY",
      desc: "Connect, play, and grow with gamers worldwide.",
      icon: FaUsers,
      slideIndex: 0,
      linkAction: () => onSelectSlide(0),
    },
    {
      id: "gaming",
      title: "GAMING HUB",
      desc: "All games. All players. One epic experience.",
      icon: FaGamepad,
      slideIndex: 1,
      linkAction: () => onSelectSlide(1),
    },
    {
      id: "ai",
      title: "AI & AUTOMATION",
      desc: "Smarter systems, better experiences, endless possibilities.",
      icon: FaBrain,
      slideIndex: 2,
      linkAction: () => onSelectSlide(2),
    },
    {
      id: "solutions",
      title: "SOFTWARE SOLUTIONS",
      desc: "Web. Mobile. Scalable. Built for the future.",
      icon: FaCode,
      slideIndex: 3,
      linkAction: () => onSelectSlide(3),
    },
  ];

  return (
    <div className="shrink-0 w-full bg-black/95 text-white border-t border-white/10 backdrop-blur-md z-30 transition-all">
      {/* 4 Feature Value Pillars */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-3 sm:py-5 grid grid-cols-2 lg:grid-cols-4 gap-y-3 gap-x-1 lg:gap-0">
        {pillars.map((pillar, idx) => {
          const Icon = pillar.icon;
          const isActive = activeSlide === pillar.slideIndex;

          return (
            <button
              key={pillar.id}
              onClick={pillar.linkAction}
              className={`text-center px-2 sm:px-6 py-2 group transition-all duration-200 focus:outline-none flex flex-col items-center justify-center ${
                idx % 2 === 0 ? "border-r border-white/10 lg:border-r-0" : ""
              } ${
                idx < pillars.length - 1 ? "lg:border-r lg:border-white/10" : ""
              } ${isActive ? "opacity-100 scale-102" : "opacity-80 hover:opacity-100"}`}
            >
              <div
                className={`w-7 h-7 rounded-lg mb-1.5 flex items-center justify-center transition-all ${
                  isActive
                    ? "text-[#f97316] bg-[#f97316]/15 scale-110"
                    : "text-white/70 group-hover:text-white group-hover:bg-white/10"
                }`}
              >
                <Icon className="w-4 sm:w-5 h-4 sm:h-5" />
              </div>
              <h4
                className={`text-[10px] sm:text-xs font-bold tracking-wider uppercase mb-0.5 transition-colors ${
                  isActive ? "text-[#f97316]" : "text-white group-hover:text-[#f97316]"
                }`}
              >
                {pillar.title}
              </h4>
              <p className="text-[9px] sm:text-[11px] text-neutral-400 font-normal leading-snug max-w-[190px]">
                {pillar.desc}
              </p>
            </button>
          );
        })}
      </div>

      {/* Sub-Footer Legal & Brand Bar */}
      <div className="border-t border-white/5 bg-black/40 py-2.5 px-4 sm:px-6 text-[10px] text-neutral-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2.5">
          {/* Left Mini Brand */}
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="ENGG" className="h-5 w-auto object-contain brightness-200" />
            <span className="font-bold text-white text-[11px]">ENGG</span>
            <span className="text-neutral-500">|</span>
            <span className="text-[10px]">
              <span className="text-[#8b5cf6] font-semibold">Gaming.</span>{" "}
              <span className="text-white/80 font-semibold">Community.</span>{" "}
              <span className="text-[#f97316] font-semibold">Innovation.</span>
            </span>
          </div>

          {/* Right Links & Copyright */}
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-5 text-neutral-400">
            <span>© 2026 ENGG. All rights reserved.</span>
            <button onClick={() => setLocation("/about")} className="hover:text-white transition-colors">
              Privacy Policy
            </button>
            <button onClick={() => setLocation("/about")} className="hover:text-white transition-colors">
              Terms of Service
            </button>
            <button onClick={() => setLocation("/about")} className="hover:text-white transition-colors">
              Community Guidelines
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

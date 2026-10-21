import React from "react";
import { FaUsers, FaGamepad, FaRobot, FaStore } from "react-icons/fa";
import SiteSubFooter from "@/components/common/SiteSubFooter";

interface HomeValueDockProps {
  activeSlide: number;
  onSelectSlide: (index: number) => void;
}

export default function HomeValueDock({ activeSlide, onSelectSlide }: HomeValueDockProps) {
  const pillars = [
    {
      id: "community",
      title: "STRONG COMMUNITY",
      desc: "Connect, play, and grow with gamers worldwide.",
      icon: FaUsers,
      slideIndex: 0,
      badge: "Social",
      linkAction: () => onSelectSlide(0),
    },
    {
      id: "gaming",
      title: "ENOS GAMING HUB",
      desc: "Live cross-play games, social deduction & card battles.",
      icon: FaGamepad,
      slideIndex: 1,
      badge: "ENOS",
      linkAction: () => onSelectSlide(1),
    },
    {
      id: "ai",
      title: "AI & VISIEN",
      desc: "Enos AI discovery, idea-to-blueprint & project tracker.",
      icon: FaRobot,
      slideIndex: 2,
      badge: "VISIEN AI",
      linkAction: () => onSelectSlide(2),
    },
    {
      id: "solutions",
      title: "SOFTWARE & APK STORE",
      desc: "Official Android APKs, web apps & bespoke software.",
      icon: FaStore,
      slideIndex: 3,
      badge: "Marketplace",
      linkAction: () => onSelectSlide(3),
    },
  ];

  return (
    <div className="shrink-0 w-full bg-black/95 text-white border-t border-white/10 backdrop-blur-md z-30 transition-all">
      {/* 4 Feature Value Pillars */}
      <div className="max-w-7xl 2xl:max-w-[1600px] mx-auto px-3 sm:px-6 2xl:px-10 py-2 sm:py-2.5 lg:py-3 2xl:py-4 grid grid-cols-2 lg:grid-cols-4 gap-y-2.5 gap-x-1 lg:gap-0">
        {pillars.map((pillar, idx) => {
          const Icon = pillar.icon;
          const isActive = activeSlide === pillar.slideIndex;

          return (
            <button
              key={pillar.id}
              onClick={pillar.linkAction}
              aria-label={`Switch to ${pillar.title} slide`}
              className={`text-center px-2 sm:px-6 2xl:px-8 py-2 2xl:py-3 group transition-all duration-200 focus:outline-none flex flex-col items-center justify-center cursor-pointer ${
                idx % 2 === 0 ? "border-r border-white/10 lg:border-r-0" : ""
              } ${
                idx < pillars.length - 1 ? "lg:border-r lg:border-white/10" : ""
              } ${isActive ? "opacity-100 scale-102" : "opacity-80 hover:opacity-100"}`}
            >
              <div
                className={`w-7 h-7 2xl:w-8 2xl:h-8 rounded-lg mb-1.5 flex items-center justify-center transition-all ${
                  isActive
                    ? "text-[#f97316] bg-[#f97316]/15 scale-110"
                    : "text-white/70 group-hover:text-white group-hover:bg-white/10"
                }`}
              >
                <Icon className="w-4 sm:w-5 2xl:w-5.5 h-4 sm:h-5 2xl:h-5.5" />
              </div>
              <h4
                className={`text-[10px] sm:text-xs 2xl:text-sm font-bold tracking-wider uppercase mb-0.5 transition-colors ${
                  isActive ? "text-[#f97316]" : "text-white group-hover:text-[#f97316]"
                }`}
              >
                {pillar.title}
              </h4>
              <p className="text-[9px] sm:text-[11px] 2xl:text-xs text-neutral-400 font-normal leading-snug max-w-[190px] 2xl:max-w-[240px]">
                {pillar.desc}
              </p>
            </button>
          );
        })}
      </div>

      {/* Sub-Footer Legal & Brand Bar */}
      <SiteSubFooter />
    </div>
  );
}

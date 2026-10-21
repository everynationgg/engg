import React from "react";
import { useLocation } from "wouter";
import HomeHeroNav from "@/components/home/HomeHeroNav";
import SiteSubFooter from "@/components/common/SiteSubFooter";
import { STUDIO_SITE_URL } from "@/lib/externalLinks";
import { FaCheck } from "react-icons/fa";

interface StudioLayoutProps {
  children: React.ReactNode;
}

const ABOUT_PHASES = [
  {
    index: 0,
    num: "01",
    label: "Who We Are",
    shortDesc: "Founders & Studio Pipeline",
    path: "/about/who-we-are",
    matchPaths: ["/about", "/about/who-we-are", "/who-we-are"],
  },
  {
    index: 1,
    num: "02",
    label: "What We Do",
    shortDesc: "Games, Software & Community",
    path: "/about/what-we-do",
    matchPaths: ["/about/what-we-do", "/what-we-do"],
  },
  {
    index: 2,
    num: "03",
    label: "Mission & Vision",
    shortDesc: "Horizon & Studio Principles",
    path: "/about/mission-and-vision",
    matchPaths: ["/about/mission-and-vision", "/mission-and-vision"],
  },
];

export function getActiveAboutPhaseIndex(location: string): number {
  const found = ABOUT_PHASES.find((p) => p.matchPaths.includes(location));
  return found ? found.index : 0;
}

export default function StudioLayout({ children }: StudioLayoutProps) {
  const [location, setLocation] = useLocation();
  const isHomePage = location === "/" || location === "";

  const isAboutRoute =
    location.startsWith("/about") ||
    location === "/who-we-are" ||
    location === "/what-we-do" ||
    location === "/mission-and-vision";

  const activePhaseIndex = getActiveAboutPhaseIndex(location);
  const progressPercent = ((activePhaseIndex + 1) / ABOUT_PHASES.length) * 100;

  const jsonLdSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Every Nation Games & Studio",
    description:
      "Every Nation is an independent game studio, player community, and software engineering team building multiplayer social games and custom web & mobile applications.",
    url: STUDIO_SITE_URL,
    logo: `${STUDIO_SITE_URL}/logo.png`,
    sameAs: ["https://github.com/everynationgg"],
    knowsAbout: [
      "Multiplayer Web & Mobile Games",
      "Full-Stack Web Application Engineering",
      "React & TypeScript",
      "Real-Time Socket.IO Systems",
      "PostgreSQL & Node.js",
    ],
  };

  return (
    <div
      className={`bg-white text-[#1d1d1f] font-sans antialiased selection:bg-neutral-200 selection:text-black ${
        isHomePage
          ? "min-h-screen lg:h-screen lg:max-h-screen flex flex-col justify-between lg:overflow-hidden"
          : "min-h-screen flex flex-col justify-between"
      }`}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdSchema) }}
      />

      {/* ── Unified Top Navigation Bar ─────────────── */}
      <HomeHeroNav />

      {/* ── Interactive 3-Phase Stepper Bar (Rendered for About pages) ── */}
      {isAboutRoute && (
        <div className="shrink-0 bg-white/95 backdrop-blur-md border-b border-neutral-200/80 shadow-2xs sticky top-16 z-30">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between gap-4 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            <div className="flex items-center gap-2 sm:gap-3 min-w-max">
              <span className="text-neutral-400 font-extrabold uppercase tracking-wider text-[10px] hidden sm:inline">
                Studio Profile
              </span>
              <span className="text-neutral-300 hidden sm:inline">/</span>

              {ABOUT_PHASES.map((phase, idx) => {
                const isActive = idx === activePhaseIndex;
                const isCompleted = idx < activePhaseIndex;
                return (
                  <React.Fragment key={phase.path}>
                    <button
                      onClick={() => {
                        setLocation(phase.path);
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                      className={`group flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs transition-all whitespace-nowrap cursor-pointer ${
                        isActive
                          ? "bg-[#7c3aed] text-white font-bold shadow-xs"
                          : isCompleted
                            ? "bg-[#7c3aed]/10 text-[#7c3aed] font-semibold hover:bg-[#7c3aed]/15"
                            : "text-neutral-600 font-medium hover:text-neutral-900 hover:bg-neutral-100"
                      }`}
                    >
                      <span
                        className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold transition-colors ${
                          isActive
                            ? "bg-white/20 text-white"
                            : isCompleted
                              ? "bg-[#7c3aed] text-white"
                              : "bg-neutral-200 text-neutral-600 group-hover:bg-neutral-300"
                        }`}
                      >
                        {isCompleted ? <FaCheck className="w-2 h-2" /> : phase.num}
                      </span>
                      <span>{phase.label}</span>
                    </button>
                    {idx < ABOUT_PHASES.length - 1 && (
                      <div
                        className={`w-4 sm:w-6 h-0.5 rounded-full transition-colors ${
                          idx < activePhaseIndex ? "bg-[#7c3aed]/50" : "bg-neutral-200"
                        }`}
                      />
                    )}
                  </React.Fragment>
                );
              })}
            </div>

            <div className="hidden md:flex items-center gap-2 text-[11px] text-neutral-400 font-medium shrink-0">
              <span>Phase {activePhaseIndex + 1} of 3</span>
              <span className="text-neutral-300">•</span>
              <span className="bg-neutral-100 border border-neutral-200/80 text-neutral-500 px-2 py-0.5 rounded text-[10px] font-mono">
                ← / → keys
              </span>
            </div>
          </div>

          {/* Animated Phase Progress Bar */}
          <div className="h-0.5 w-full bg-neutral-100 overflow-hidden">
            <div
              className="h-full bg-[#7c3aed] transition-all duration-500 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* ── Page Content ─────────────────────────────────────────────────── */}
      <main className={`flex-1 ${isHomePage ? "flex flex-col justify-center py-1" : ""}`}>
        {children}
      </main>

      {/* ── Global Sub-Footer Brand & Legal Strip ───────────────────────── */}
      <SiteSubFooter />
    </div>
  );
}

import React from "react";
import { useLocation } from "wouter";
import HomeHeroNav from "@/components/home/HomeHeroNav";
import SiteSubFooter from "@/components/common/SiteSubFooter";
import { STUDIO_SITE_URL } from "@/lib/externalLinks";

interface StudioLayoutProps {
  children: React.ReactNode;
}

export default function StudioLayout({ children }: StudioLayoutProps) {
  const [location, setLocation] = useLocation();
  const isHomePage = location === "/" || location === "";

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

      {/* ── Sub-Page Navigation Bar (Rendered for About pages) ── */}
      {(location.startsWith("/about") ||
        location === "/who-we-are" ||
        location === "/what-we-do" ||
        location === "/mission-and-vision") && (
        <div className="shrink-0 bg-white/90 backdrop-blur-md border-b border-neutral-200/80 shadow-2xs py-2.5 px-4 sm:px-6 text-xs font-medium text-neutral-600 overflow-x-auto sticky top-16 z-30 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          <div className="max-w-7xl mx-auto flex items-center gap-3 sm:gap-4 min-w-max">
            <span className="text-neutral-400 font-bold uppercase tracking-wider text-[10px]">
              About:
            </span>
            <button
              onClick={() => {
                setLocation("/about/who-we-are");
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className={`px-3 py-1 rounded-full transition-all whitespace-nowrap cursor-pointer ${
                location === "/about" ||
                location === "/about/who-we-are" ||
                location === "/who-we-are"
                  ? "bg-[#7c3aed] text-white font-bold shadow-xs"
                  : "hover:text-neutral-900 hover:bg-neutral-200/50"
              }`}
            >
              1. Who We Are
            </button>
            <button
              onClick={() => {
                setLocation("/about/what-we-do");
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className={`px-3 py-1 rounded-full transition-all whitespace-nowrap cursor-pointer ${
                location === "/about/what-we-do" || location === "/what-we-do"
                  ? "bg-[#7c3aed] text-white font-bold shadow-xs"
                  : "hover:text-neutral-900 hover:bg-neutral-200/50"
              }`}
            >
              2. What We Do
            </button>
            <button
              onClick={() => {
                setLocation("/about/mission-and-vision");
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className={`px-3 py-1 rounded-full transition-all whitespace-nowrap cursor-pointer ${
                location === "/about/mission-and-vision" || location === "/mission-and-vision"
                  ? "bg-[#7c3aed] text-white font-bold shadow-xs"
                  : "hover:text-neutral-900 hover:bg-neutral-200/50"
              }`}
            >
              3. Mission &amp; Vision
            </button>
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

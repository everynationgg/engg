import React from "react";
import { useLocation } from "wouter";
import HomeHeroNav from "@/components/home/HomeHeroNav";
import SiteSubFooter from "@/components/common/SiteSubFooter";

interface StudioLayoutProps {
  children: React.ReactNode;
}

export default function StudioLayout({ children }: StudioLayoutProps) {
  const [location, setLocation] = useLocation();
  const isHomePage = location === "/" || location === "";

  // JSON-LD Structured Data for AEO (Answer Engine Optimization) & GEO (Generative Engine Optimization)
  const jsonLdSchema = {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    "name": "ENGG Software Studio",
    "description": "ENGG is an independent software development studio building custom websites, web applications, games, real-time systems, and specialized digital tools.",
    "url": "https://engg.studio",
    "logo": "https://engg.studio/logo.png",
    "sameAs": [
      "https://github.com/everynationgg"
    ],
    "serviceType": [
      "Bespoke Website Development",
      "Full-Stack Web Application Engineering",
      "Web Games & Interactive Systems",
      "Real-Time WebSocket Engine Architecture",
      "Custom Software & Configurator Tools"
    ],
    "areaServed": "Global",
    "knowsAbout": [
      "React",
      "TypeScript",
      "Node.js",
      "PostgreSQL",
      "Socket.IO",
      "Tailwind CSS",
      "Supabase",
      "Stripe",
      "Sentry",
      "Fly.io",
      "Vercel"
    ]
  };

  return (
    <div className={`bg-white text-[#1d1d1f] font-sans antialiased selection:bg-neutral-200 selection:text-black ${isHomePage ? "min-h-screen lg:h-screen lg:max-h-screen flex flex-col justify-between lg:overflow-hidden" : "min-h-screen flex flex-col justify-between"}`}>
      {/* Inject JSON-LD Schema for AI / GEO Search Engines */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdSchema) }}
      />

      {/* ── Unified Top Navigation Bar (Identical to Home page) ─────────────── */}
      <HomeHeroNav />

      {/* ── Sub-Page Navigation Bar (Rendered for About pages) ── */}
      {(location.startsWith("/about") ||
        location === "/who-we-are" ||
        location === "/what-we-do" ||
        location === "/mission-and-vision") && (
        <div className="shrink-0 bg-[#f5f5f7] border-b border-neutral-200/80 py-2.5 px-4 sm:px-6 text-xs font-medium text-neutral-600 overflow-x-auto sticky top-16 z-30 backdrop-blur-md bg-white/90 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          <div className="max-w-7xl mx-auto flex items-center gap-3 sm:gap-4 min-w-max">
            <span className="text-neutral-400 font-bold uppercase tracking-wider text-[10px]">About:</span>
            <button
              onClick={() => {
                setLocation("/about/who-we-are");
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className={`px-3 py-1 rounded-full transition-all whitespace-nowrap ${
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
              className={`px-3 py-1 rounded-full transition-all whitespace-nowrap ${
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
              className={`px-3 py-1 rounded-full transition-all whitespace-nowrap ${
                location === "/about/mission-and-vision" || location === "/mission-and-vision"
                  ? "bg-[#7c3aed] text-white font-bold shadow-xs"
                  : "hover:text-neutral-900 hover:bg-neutral-200/50"
              }`}
            >
              3. Mission & Vision
            </button>
          </div>
        </div>
      )}

      {/* ── Page Content ─────────────────────────────────────────────────── */}
      <main className={`flex-1 ${isHomePage ? "flex flex-col justify-center py-1" : ""}`}>{children}</main>

      {/* ── Global Sub-Footer Brand & Legal Strip ───────────────────────── */}
      <SiteSubFooter />
    </div>
  );
}

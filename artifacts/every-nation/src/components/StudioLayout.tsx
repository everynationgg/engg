import React from "react";
import { useLocation } from "wouter";

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

      {/* ── Apple-Style Translucent Header ───────────────────────────────── */}
      <header className="shrink-0 bg-white/90 backdrop-blur-md border-b border-neutral-200/80 transition-all z-50">
        <div className="max-w-7xl mx-auto px-6 h-12 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setLocation("/")}
              className="text-lg font-bold tracking-tight text-neutral-900 hover:opacity-80 transition-opacity"
            >
              ENGG
            </button>
            <span className="hidden sm:inline-block h-3.5 w-[1px] bg-neutral-300" />
            <span className="hidden sm:inline-block text-[11px] font-medium text-neutral-500">
              Software Studio
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-7 text-xs font-medium text-neutral-600">
            <button
              onClick={() => setLocation("/")}
              className={`hover:text-neutral-900 transition-colors ${location === "/" ? "text-neutral-900 font-bold" : ""}`}
            >
              Home
            </button>
            <button
              onClick={() => setLocation("/about")}
              className={`hover:text-neutral-900 transition-colors ${location === "/about" ? "text-neutral-900 font-bold" : ""}`}
            >
              About
            </button>
            <button
              onClick={() => setLocation("/services")}
              className={`hover:text-neutral-900 transition-colors ${location.startsWith("/services") ? "text-neutral-900 font-bold" : ""}`}
            >
              Services
            </button>
            <button
              onClick={() => setLocation("/estimate")}
              className={`hover:text-neutral-900 transition-colors ${location === "/estimate" ? "text-neutral-900 font-bold" : ""}`}
            >
              Builder Tool
            </button>
            <button
              onClick={() => setLocation("/hub")}
              className={`hover:text-neutral-900 transition-colors ${location === "/hub" ? "text-neutral-900 font-bold" : ""}`}
            >
              Live Demo
            </button>
          </nav>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setLocation("/contact")}
              className="bg-neutral-900 text-white hover:bg-black rounded-full px-4 py-1.5 text-xs font-medium transition-all duration-200 shadow-sm active:scale-95"
            >
              Start a Project
            </button>
          </div>
        </div>
      </header>

      {/* ── Sub-Page Navigation Bar (Rendered when in /services or sub-pages) ── */}
      {location.startsWith("/services") && (
        <div className="shrink-0 bg-[#f5f5f7] border-b border-neutral-200/80 py-2 px-6 text-xs font-medium text-neutral-600 overflow-x-auto">
          <div className="max-w-7xl mx-auto flex items-center gap-6">
            <span className="text-neutral-400 font-bold uppercase tracking-wider text-[10px]">Services:</span>
            <button
              onClick={() => setLocation("/services")}
              className={`hover:text-neutral-900 whitespace-nowrap ${location === "/services" ? "text-neutral-900 font-bold underline" : ""}`}
            >
              Overview
            </button>
            <button
              onClick={() => setLocation("/services/websites")}
              className={`hover:text-neutral-900 whitespace-nowrap ${location === "/services/websites" ? "text-neutral-900 font-bold underline" : ""}`}
            >
              Websites
            </button>
            <button
              onClick={() => setLocation("/services/web-apps")}
              className={`hover:text-neutral-900 whitespace-nowrap ${location === "/services/web-apps" ? "text-neutral-900 font-bold underline" : ""}`}
            >
              Web Apps & SaaS
            </button>
            <button
              onClick={() => setLocation("/services/realtime-engines")}
              className={`hover:text-neutral-900 whitespace-nowrap ${location === "/services/realtime-engines" ? "text-neutral-900 font-bold underline" : ""}`}
            >
              Real-Time Engines
            </button>
            <button
              onClick={() => setLocation("/services/custom-tools")}
              className={`hover:text-neutral-900 whitespace-nowrap ${location === "/services/custom-tools" ? "text-neutral-900 font-bold underline" : ""}`}
            >
              Custom Tools
            </button>
          </div>
        </div>
      )}

      {/* ── Page Content ─────────────────────────────────────────────────── */}
      <main className={`flex-1 ${isHomePage ? "flex flex-col justify-center py-1" : ""}`}>{children}</main>

      {/* ── Full 4-Column Studio Footer (Fitted to Single PC Viewport) ── */}
      <footer className="shrink-0 bg-white border-t border-neutral-200 py-4 text-[11px] text-neutral-500">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
          <div>
            <div className="font-bold text-neutral-900 text-sm mb-1">ENGG</div>
            <p className="text-neutral-500 leading-snug text-[11px]">
              Independent custom software and web development studio.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-neutral-900 mb-1.5 uppercase tracking-wider text-[10px]">Pages</h4>
            <ul className="space-y-1 text-[11px]">
              <li><button onClick={() => setLocation("/")} className="hover:text-neutral-900">Home</button></li>
              <li><button onClick={() => setLocation("/about")} className="hover:text-neutral-900">About Studio</button></li>
              <li><button onClick={() => setLocation("/services")} className="hover:text-neutral-900">Services Matrix</button></li>
              <li><button onClick={() => setLocation("/estimate")} className="hover:text-neutral-900">Builder & Estimator</button></li>
              <li><button onClick={() => setLocation("/contact")} className="hover:text-neutral-900">Start a Project</button></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-neutral-900 mb-1.5 uppercase tracking-wider text-[10px]">Services</h4>
            <ul className="space-y-1 text-[11px]">
              <li><button onClick={() => setLocation("/services/websites")} className="hover:text-neutral-900">Websites & Landing Pages</button></li>
              <li><button onClick={() => setLocation("/services/web-apps")} className="hover:text-neutral-900">Web Applications & SaaS</button></li>
              <li><button onClick={() => setLocation("/services/realtime-engines")} className="hover:text-neutral-900">Real-Time Engines</button></li>
              <li><button onClick={() => setLocation("/services/custom-tools")} className="hover:text-neutral-900">Custom Tools & Configurators</button></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-neutral-900 mb-1.5 uppercase tracking-wider text-[10px]">Live Demos</h4>
            <ul className="space-y-1 text-[11px]">
              <li><button onClick={() => setLocation("/hub")} className="hover:text-neutral-900">ENGG Central Hub Engine</button></li>
              <li><a href="/sitemap.xml" target="_blank" className="hover:text-neutral-900">XML Sitemap Index</a></li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 pt-2 border-t border-neutral-100 flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px]">
          <div>© 2026 ENGG Studio. All rights reserved.</div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Available for Client Contracts</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

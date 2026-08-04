import React from "react";
import { useLocation } from "wouter";

interface StudioLayoutProps {
  children: React.ReactNode;
}

export default function StudioLayout({ children }: StudioLayoutProps) {
  const [location, setLocation] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
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
      <header className="shrink-0 bg-white/90 backdrop-blur-md border-b border-neutral-200/80 transition-all z-50 sticky top-0">
        <div className="max-w-7xl mx-auto px-6 h-12 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => { setLocation("/"); setMobileMenuOpen(false); }}
              className="flex items-center hover:opacity-80 transition-opacity"
            >
              <img src="/logo.png" alt="ENGG Logo" className="h-7 w-auto" />
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
              onClick={() => { setLocation("/contact"); setMobileMenuOpen(false); }}
              className="hidden sm:inline-block bg-neutral-900 text-white hover:bg-black rounded-full px-4 py-1.5 text-xs font-medium transition-all duration-200 shadow-sm active:scale-95"
            >
              Start a Project
            </button>

            {/* Mobile Hamburger Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-1.5 rounded-md text-neutral-700 hover:text-neutral-900 hover:bg-neutral-100 transition-colors focus:outline-none"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* ── Responsive Mobile Navigation Menu Drawer ── */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-neutral-200 bg-white/95 backdrop-blur-md px-6 py-4 space-y-3 shadow-lg">
            <button
              onClick={() => { setLocation("/"); setMobileMenuOpen(false); }}
              className={`block w-full text-left py-2 text-sm font-medium border-b border-neutral-100 ${location === "/" ? "text-neutral-900 font-bold" : "text-neutral-600"}`}
            >
              Home
            </button>
            <button
              onClick={() => { setLocation("/about"); setMobileMenuOpen(false); }}
              className={`block w-full text-left py-2 text-sm font-medium border-b border-neutral-100 ${location === "/about" ? "text-neutral-900 font-bold" : "text-neutral-600"}`}
            >
              About Studio
            </button>
            <button
              onClick={() => { setLocation("/services"); setMobileMenuOpen(false); }}
              className={`block w-full text-left py-2 text-sm font-medium border-b border-neutral-100 ${location.startsWith("/services") ? "text-neutral-900 font-bold" : "text-neutral-600"}`}
            >
              Services Matrix
            </button>
            <div className="pl-4 space-y-2 py-1 text-xs text-neutral-500">
              <button onClick={() => { setLocation("/services/websites"); setMobileMenuOpen(false); }} className="block w-full text-left py-1 hover:text-neutral-900">
                • Websites & Landing Pages
              </button>
              <button onClick={() => { setLocation("/services/web-apps"); setMobileMenuOpen(false); }} className="block w-full text-left py-1 hover:text-neutral-900">
                • Web Applications & SaaS
              </button>
              <button onClick={() => { setLocation("/services/realtime-engines"); setMobileMenuOpen(false); }} className="block w-full text-left py-1 hover:text-neutral-900">
                • Real-Time Engines
              </button>
              <button onClick={() => { setLocation("/services/custom-tools"); setMobileMenuOpen(false); }} className="block w-full text-left py-1 hover:text-neutral-900">
                • Custom Tools
              </button>
            </div>
            <button
              onClick={() => { setLocation("/estimate"); setMobileMenuOpen(false); }}
              className={`block w-full text-left py-2 text-sm font-medium border-b border-neutral-100 ${location === "/estimate" ? "text-neutral-900 font-bold" : "text-neutral-600"}`}
            >
              Builder & Estimator
            </button>
            <button
              onClick={() => { setLocation("/hub"); setMobileMenuOpen(false); }}
              className={`block w-full text-left py-2 text-sm font-medium border-b border-neutral-100 ${location === "/hub" ? "text-neutral-900 font-bold" : "text-neutral-600"}`}
            >
              Live Interactive Demo
            </button>
            <div className="pt-2">
              <button
                onClick={() => { setLocation("/contact"); setMobileMenuOpen(false); }}
                className="w-full bg-neutral-900 text-white hover:bg-black rounded-full py-2.5 text-xs font-semibold text-center transition-all shadow-sm active:scale-95"
              >
                Start a Project
              </button>
            </div>
          </div>
        )}
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
            <div className="mb-1"><img src="/logo.png" alt="ENGG" className="h-7 w-auto" /></div>
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

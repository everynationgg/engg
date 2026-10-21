import React, { useState } from "react";
import { useLocation } from "wouter";
import { AnimatePresence, motion } from "framer-motion";
import StudioLayout from "@/components/StudioLayout";
import { DISCORD_INVITE_URL, VISIEN_AI_URL, launchErrantNight } from "@/lib/externalLinks";
import {
  FaArrowLeft,
  FaArrowRight,
  FaLaptopCode,
  FaServer,
  FaRobot,
  FaGamepad,
  FaTools,
  FaUsers,
  FaSlidersH,
  FaExternalLinkAlt,
  FaCheckCircle,
} from "react-icons/fa";

interface WhatWeDoProps {
  embedded?: boolean;
  onNavigate?: (path: string) => void;
}

export function WhatWeDoContent({ onNavigate }: { onNavigate: (path: string) => void }) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const capabilities = [
    {
      id: "products",
      num: "01",
      title: "Custom Digital Products & Platforms",
      badge: "ENOS & Web Platforms",
      icon: FaLaptopCode,
      summary: "Digital products and platforms designed around specific purposes, audiences, and experiences.",
      paragraphs: [
        "We conceptualize and develop digital products designed around specific purposes, audiences, and experiences—including the ENOS platform, web applications, productivity tools, and interactive systems that help users accomplish more.",
        "We value thoughtful functionality, usability, and flexibility. Where appropriate, we go beyond generic implementations by building features, workflows, and experiences tailored to their intended users.",
      ],
      deliverables: [
        "ENOS Unified Account, Wallet & Portal Ecosystem",
        "Custom Web Platforms & Interactive Applications",
        "Cross-Platform Web & Android Experiences",
        "Tailored User Workflows & Design Systems",
      ],
      techStack: ["ENOS Platform", "React 19", "TypeScript", "Tailwind CSS", "Capacitor 7"],
      cta: {
        label: "Explore ENOS Hub",
        action: () => onNavigate("/hub"),
        secondaryLabel: "Browse Marketplace",
        secondaryAction: () => onNavigate("/marketplace"),
      },
    },
    {
      id: "services",
      num: "02",
      title: "Bespoke IT Services & VISIEN Discovery",
      badge: "VISIEN AI",
      icon: FaServer,
      summary: "Custom workflows, specialized applications, and connected systems built around how you operate.",
      paragraphs: [
        "Not every problem can be solved by an off-the-shelf product. Individuals and businesses often need a custom workflow, specialized application, connected system, or digital solution built around how they actually operate.",
        "Our reach spans individuals, entrepreneurs, small businesses, and growing organizations. Through the VISIEN AI Discovery Platform (Vision Inspired by Story and Idea), clients work with Enos AI to turn their concept into a clear architectural blueprint and track project milestones in real time.",
      ],
      deliverables: [
        "VISIEN AI Guided Discovery & Blueprint Generation",
        "Bespoke Business Portals, Booking & POS Systems",
        "Live Session & Milestone Tracking (VISIEN Companion)",
        "Accessible Personal Attention for Small & Growing Teams",
      ],
      techStack: ["VISIEN AI", "Enos AI Guide", "Node.js", "PostgreSQL", "Drizzle ORM"],
      highlight: {
        title: "VISIEN AI Discovery Platform",
        desc: "Vision Inspired by Story and Idea — Turn ideas into architectural blueprints through Enos AI-guided discovery.",
        link: VISIEN_AI_URL,
      },
      cta: {
        label: "Launch VISIEN AI",
        action: () => window.open(VISIEN_AI_URL, "_blank", "noopener,noreferrer"),
        isExternal: true,
        secondaryLabel: "View Showcase Apps",
        secondaryAction: () => onNavigate("/marketplace"),
      },
    },
    {
      id: "ai",
      num: "03",
      title: "Artificial Intelligence & Automation",
      badge: "Enos AI & Smart Tools",
      icon: FaRobot,
      summary: "Practical AI-powered experiences and automation that solve real needs.",
      paragraphs: [
        "Artificial intelligence creates opportunities to make technology more capable, responsive, and useful. ENGG develops AI-powered experiences—such as VISIEN AI and our Enos AI conversational guide—that support users, streamline project scoping, and introduce smarter ways to interact with software.",
        "We see AI as a practical capability rather than a feature added for novelty. Combined with thoughtful automation, our goal is to reduce repetitive work, improve consistency, and help individuals and organizations accomplish more.",
      ],
      deliverables: [
        "Enos AI Conversational Discovery & Scoping Assistant",
        "Automated Blueprint, Timeline & Architecture Structuring",
        "Intelligent Game Bots & Interactive Voice/TTS Systems",
        "Workflow Automation for Client Business Operations",
      ],
      techStack: ["VISIEN AI", "Enos AI", "Automated Workflows", "Intelligent Configurators"],
      cta: {
        label: "Try VISIEN Discovery",
        action: () => window.open(VISIEN_AI_URL, "_blank", "noopener,noreferrer"),
        isExternal: true,
      },
    },
    {
      id: "gaming",
      num: "04",
      title: "Gaming & Interactive Experiences",
      badge: "Web + Android Cross-Play",
      icon: FaGamepad,
      summary: "Original multiplayer games, progression systems, and connected player experiences.",
      paragraphs: [
        "Gaming is a flagship pillar of the ENGG ecosystem. It brings together technology, creativity, entertainment, competition, and shared experiences that encourage people to participate and connect.",
        "Our games—including Errant Night (real-time sci-fi social deduction for Web and Android APK) and Engraved Nether (tactical grid card battles)—connect directly to the ENOS hub for shared accounts, credits, achievements, and live lobbies.",
      ],
      deliverables: [
        "Errant Night (12+ Roles, Unified Web & Android APK Cross-Play)",
        "Engraved Nether (Tactical 3x3 Card Battler)",
        "ENOS Progression, Daily Rewards, Credits & Achievements",
        "Real-Time Socket.IO Lobbies & Universal Room Invite Links",
      ],
      techStack: ["Socket.IO", "React 19", "Capacitor 7", "Android SDK 35", "ENOS Hub"],
      cta: {
        label: "Play Errant Night",
        action: () => launchErrantNight(),
        secondaryLabel: "Open ENOS Hub",
        secondaryAction: () => onNavigate("/hub"),
      },
    },
    {
      id: "tools",
      num: "05",
      title: "Digital Tools & Practical Technology",
      badge: "Focused Utilities",
      icon: FaTools,
      summary: "Streamlined digital tools that remove friction and give users more control.",
      paragraphs: [
        "We create tools that make digital tasks easier, address specific challenges, and provide practical capabilities—either as standalone products or integrated into the ENOS and VISIEN platforms.",
        "Useful technology does not always need to be complicated. Often, the most valuable solution removes unnecessary steps, simplifies a workflow, or gives users direct control over how they work.",
      ],
      deliverables: [
        "Standalone Web Utilities & Companion Mobile APKs",
        "ENOS Portal Deck & Cross-Device Session Sync",
        "Streamlined Admin, Audit & Operations Dashboards",
        "Lightweight, Fast-Loading Interfaces",
      ],
      techStack: ["TypeScript", "Vite", "REST APIs", "Mobile Companion APKs"],
      cta: {
        label: "Explore Marketplace",
        action: () => onNavigate("/marketplace"),
      },
    },
    {
      id: "community",
      num: "06",
      title: "Community & Connected Experiences",
      badge: "Discord & Allies",
      icon: FaUsers,
      summary: "Shared environments where players, creators, and clients connect and collaborate.",
      paragraphs: [
        "Technology is not only about what people use; it is also about how people connect. Community creates opportunities for shared experiences, collaboration, learning, and participation.",
        "Through our Discord server and the built-in ENOS Allies & messaging system, players and clients can join live gaming sessions, exchange ideas, and directly shape what ENGG builds next.",
      ],
      deliverables: [
        "Active Every Nation GG Discord Server & Playtests",
        "ENOS Allies System with Real-Time Presence & Direct Chat",
        "Community Lobbies, Events & Feedback Channels",
        "Connected Experience Across Games & Studio Products",
      ],
      techStack: ["Discord Community", "ENOS Allies", "Live Presence", "Direct Messaging"],
      cta: {
        label: "Join Our Discord",
        action: () => window.open(DISCORD_INVITE_URL, "_blank", "noopener,noreferrer"),
        isExternal: true,
      },
    },
    {
      id: "customization",
      num: "07",
      title: "Customization at the Core",
      badge: "Tailored by Design",
      icon: FaSlidersH,
      summary: "Pushing beyond fixed templates to shape technology around real requirements.",
      paragraphs: [
        "Across everything we do, customization remains a defining principle. We explore what is possible when products and services are shaped around real requirements rather than limited to fixed templates.",
        "We want ENGG to be the place people turn to when existing tools are not enough, when an idea needs a technical foundation, or when a particular need calls for a more personal approach.",
      ],
      deliverables: [
        "Personalized Workflows & Custom Feature Engineering",
        "Flexible Scope Scaled to Individuals, Startups & Businesses",
        "Direct Collaboration with Yog & Meowi",
        "Long-Term Adaptability as Your Needs Grow",
      ],
      techStack: ["Bespoke Architecture", "VISIEN AI Scoping", "Tailored UI/UX", "Modular Code"],
      cta: {
        label: "Start with VISIEN AI",
        action: () => window.open(VISIEN_AI_URL, "_blank", "noopener,noreferrer"),
        isExternal: true,
      },
    },
  ];

  const activeCap = capabilities[selectedIndex];
  const ActiveIcon = activeCap.icon;

  return (
    <div className="py-12 sm:py-16 max-w-5xl mx-auto px-6">
      {/* Category Pill */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-[11px] font-bold uppercase tracking-wider text-[#7c3aed] bg-[#7c3aed]/10 px-3 py-1 rounded-full">
          PHASE 02 • ABOUT EVERY NATION GG
        </span>
        <span className="text-xs text-neutral-400">•</span>
        <span className="text-xs font-semibold text-neutral-500">Part 2 of 3</span>
      </div>

      {/* Page Title & Tagline */}
      <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-neutral-900 leading-tight mb-4">
        WHAT WE DO
      </h1>
      <p className="text-xl sm:text-2xl font-medium text-[#7c3aed] leading-snug mb-6">
        One Ecosystem. Multiple Possibilities.
      </p>

      {/* Intro */}
      <div className="space-y-4 text-base sm:text-lg text-neutral-700 leading-relaxed max-w-4xl border-b border-neutral-200 pb-10 mb-10">
        <p>
          ENGG brings together technology, digital products, customized services, VISIEN AI, gaming, and community. Select any of our 7 capabilities below to explore how our ecosystem works.
        </p>
      </div>

      {/* Interactive Split-Screen Capability Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-14 items-start">
        {/* Left Column: 7 Selectable Capability Cards */}
        <div className="lg:col-span-5 flex flex-col gap-2.5">
          {capabilities.map((cap, idx) => {
            const Icon = cap.icon;
            const isSelected = idx === selectedIndex;
            return (
              <button
                key={cap.id}
                onClick={() => setSelectedIndex(idx)}
                className={`w-full text-left rounded-2xl p-4 border transition-all cursor-pointer flex items-center gap-3.5 ${
                  isSelected
                    ? "bg-neutral-900 text-white border-neutral-900 shadow-md"
                    : "bg-[#f5f5f7] text-neutral-800 border-neutral-200/80 hover:bg-neutral-100 hover:border-neutral-300"
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center text-base shrink-0 transition-colors ${
                    isSelected
                      ? "bg-[#7c3aed] text-white"
                      : "bg-[#7c3aed]/15 text-[#7c3aed]"
                  }`}
                >
                  <Icon />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <span
                      className={`text-[10px] font-extrabold uppercase tracking-wider ${
                        isSelected ? "text-purple-300" : "text-[#7c3aed]"
                      }`}
                    >
                      Capability {cap.num}
                    </span>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        isSelected
                          ? "bg-white/15 text-white"
                          : "bg-white text-neutral-500 border border-neutral-200"
                      }`}
                    >
                      {cap.badge}
                    </span>
                  </div>
                  <h2 className="font-bold text-sm sm:text-base leading-snug truncate">
                    {cap.title}
                  </h2>
                </div>
              </button>
            );
          })}
        </div>

        {/* Right Column: Animated Live Inspector Panel */}
        <div className="lg:col-span-7 lg:sticky lg:top-32">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeCap.id}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="bg-[#f5f5f7] rounded-3xl p-7 sm:p-9 border border-neutral-200/90 shadow-xs flex flex-col justify-between"
            >
              <div>
                {/* Header */}
                <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-5 border-b border-neutral-200/80">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-[#7c3aed] text-white flex items-center justify-center text-xl shrink-0">
                      <ActiveIcon />
                    </div>
                    <div>
                      <span className="text-[11px] font-bold tracking-wider text-[#7c3aed] uppercase">
                        Capability {activeCap.num} of 07 • {activeCap.badge}
                      </span>
                      <h3 className="text-xl sm:text-2xl font-extrabold text-neutral-900 tracking-tight">
                        {activeCap.title}
                      </h3>
                    </div>
                  </div>
                </div>

                {/* Narrative */}
                <p className="text-base font-semibold text-neutral-900 mb-3">
                  {activeCap.summary}
                </p>
                <div className="space-y-3 text-sm sm:text-base text-neutral-700 leading-relaxed mb-6">
                  {activeCap.paragraphs.map((p, idx) => (
                    <p key={idx}>{p}</p>
                  ))}
                </div>

                {/* Optional VISIEN Highlight Box */}
                {activeCap.highlight && (
                  <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white rounded-2xl p-5 border border-purple-200 shadow-2xs">
                    <div>
                      <div className="text-xs font-extrabold uppercase tracking-wider text-[#7c3aed]">
                        {activeCap.highlight.title}
                      </div>
                      <div className="text-xs text-neutral-600 mt-1 leading-relaxed">
                        {activeCap.highlight.desc}
                      </div>
                    </div>
                    <a
                      href={activeCap.highlight.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-xs font-bold text-[#7c3aed] hover:bg-[#7c3aed] hover:text-white whitespace-nowrap bg-[#7c3aed]/10 px-4 py-2.5 rounded-full transition-colors shrink-0"
                    >
                      <span>Launch VISIEN</span>
                      <FaExternalLinkAlt className="w-2.5 h-2.5" />
                    </a>
                  </div>
                )}

                {/* Deliverables Box */}
                <div className="bg-white rounded-2xl p-5 border border-neutral-200/80 mb-6">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-3">
                    Key Capabilities &amp; Deliverables
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {activeCap.deliverables.map((item) => (
                      <div
                        key={item}
                        className="flex items-start gap-2 text-xs text-neutral-700 leading-relaxed"
                      >
                        <FaCheckCircle className="w-3.5 h-3.5 text-[#7c3aed] shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tech Stack Pills */}
                <div className="mb-7">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-2">
                    Ecosystem &amp; Technologies
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {activeCap.techStack.map((tech) => (
                      <span
                        key={tech}
                        className="text-xs font-semibold bg-white text-neutral-700 border border-neutral-200 px-3 py-1 rounded-full"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Actions + Next Capability cycler */}
              <div className="pt-5 border-t border-neutral-200/80 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    onClick={activeCap.cta.action}
                    className="inline-flex items-center gap-2 text-xs font-bold text-white bg-[#7c3aed] hover:bg-[#6d28d9] px-5 py-2.5 rounded-full transition-colors cursor-pointer"
                  >
                    <span>{activeCap.cta.label}</span>
                    {activeCap.cta.isExternal ? (
                      <FaExternalLinkAlt className="w-2.5 h-2.5" />
                    ) : (
                      <FaArrowRight className="w-2.5 h-2.5" />
                    )}
                  </button>
                  {activeCap.cta.secondaryLabel && activeCap.cta.secondaryAction && (
                    <button
                      onClick={activeCap.cta.secondaryAction}
                      className="inline-flex items-center gap-2 text-xs font-bold text-neutral-700 bg-white hover:bg-neutral-100 border border-neutral-200 px-4 py-2.5 rounded-full transition-colors cursor-pointer"
                    >
                      <span>{activeCap.cta.secondaryLabel}</span>
                    </button>
                  )}
                </div>

                <button
                  onClick={() =>
                    setSelectedIndex((prev) => (prev + 1) % capabilities.length)
                  }
                  className="text-xs font-bold text-neutral-600 hover:text-neutral-900 inline-flex items-center gap-1.5 px-3 py-2 rounded-full hover:bg-neutral-200/60 transition-colors cursor-pointer"
                >
                  <span>
                    Next Capability ({capabilities[(selectedIndex + 1) % capabilities.length].num})
                  </span>
                  <FaArrowRight className="w-2.5 h-2.5" />
                </button>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Interactive Phase Switcher Dock */}
      <div className="border-t border-neutral-200 pt-8">
        <div className="bg-neutral-900 text-white rounded-3xl p-7 sm:p-9 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-purple-300">
              Up Next • Phase 03 of 03
            </span>
            <h3 className="text-xl sm:text-2xl font-extrabold text-white mt-1">
              Mission, Vision &amp; Guiding Principles
            </h3>
            <p className="text-sm text-neutral-300 mt-1 max-w-xl">
              Discover our guiding purpose and long-term vision for the Every Nation GG ecosystem.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto shrink-0">
            <button
              onClick={() => onNavigate("/about/who-we-are")}
              className="inline-flex items-center justify-center gap-2.5 bg-white/10 hover:bg-white/15 text-white border border-white/15 px-5 py-3.5 rounded-full text-xs font-semibold transition-all cursor-pointer"
            >
              <FaArrowLeft className="w-3 h-3" />
              <span>Phase 01</span>
            </button>
            <button
              onClick={() => onNavigate("/about/mission-and-vision")}
              className="inline-flex items-center justify-center gap-3 bg-[#7c3aed] hover:bg-[#6d28d9] text-white px-6 py-3.5 rounded-full text-sm font-bold transition-all shadow-sm active:scale-95 cursor-pointer"
            >
              <span>Advance to Phase 03</span>
              <FaArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function WhatWeDo({ embedded = false, onNavigate }: WhatWeDoProps) {
  const [, setLocation] = useLocation();
  const handleNavigate = (path: string) => {
    if (onNavigate) {
      onNavigate(path);
    } else {
      setLocation(path);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  if (embedded) {
    return <WhatWeDoContent onNavigate={handleNavigate} />;
  }

  return (
    <StudioLayout>
      <WhatWeDoContent onNavigate={handleNavigate} />
    </StudioLayout>
  );
}

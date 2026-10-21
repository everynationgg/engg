import React, { useState } from "react";
import { useLocation } from "wouter";
import { AnimatePresence, motion } from "framer-motion";
import StudioLayout from "@/components/StudioLayout";
import { DISCORD_INVITE_URL, PROJECT_STUDIO_URL, launchErrantNight } from "@/lib/externalLinks";
import {
  FaArrowLeft,
  FaArrowRight,
  FaLaptopCode,
  FaGamepad,
  FaUsers,
  FaLayerGroup,
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
      id: "games",
      num: "01",
      title: "Original Multiplayer Games",
      shortTitle: "Multiplayer Games",
      badge: "Web + Android Cross-Play",
      icon: FaGamepad,
      summary: "Real-time social deduction and tactical browser & mobile games.",
      paragraphs: [
        "We design, build, and host original multiplayer games backed by our own low-latency Socket.IO engine. Our flagship title, Errant Night, pits a deep-space crew against a hidden Alien impostor across tense night-action and emergency-voting phases.",
        "Alongside Errant Night, we develop tactical browser games like Engraved Nether and maintain a unified player profile system so your account, friends list, match stats, and credits carry across our releases.",
      ],
      deliverables: [
        "Errant Night (12+ Roles, Web & Android APK Cross-Play)",
        "Engraved Nether (Tactical 3x3 Grid Card Battler)",
        "Authoritative Socket.IO Rooms & Reconnection Recovery",
        "Unified Studio Account, Friends List & Daily Rewards",
      ],
      techStack: ["React 19", "TypeScript", "Socket.IO", "Capacitor 7", "Android SDK 35"],
      cta: {
        label: "Play Errant Night",
        action: () => launchErrantNight(),
        secondaryLabel: "Open Game Hub",
        secondaryAction: () => onNavigate("/hub"),
      },
    },
    {
      id: "software",
      num: "02",
      title: "Custom Web & Mobile Engineering",
      shortTitle: "Custom Engineering",
      badge: "Full-Stack Production",
      icon: FaLaptopCode,
      summary: "Production web apps, business portals, and native Android builds.",
      paragraphs: [
        "Not every business or creator fits inside an off-the-shelf template. We partner with clients to design and engineer custom web applications, customer portals, booking & inventory systems, and Android APK builds tailored to how they actually work.",
        "Our stack centers on modern, battle-tested technologies—React, TypeScript, Node.js, PostgreSQL, Drizzle ORM, and Capacitor—delivering fast load times, clean interfaces, and maintainable architecture.",
      ],
      deliverables: [
        "Custom Client Portals, Dashboards & Booking Systems",
        "REST & Real-Time WebSocket APIs on Node.js + PostgreSQL",
        "Responsive Web Apps & Packaged Android APK Releases",
        "Clean TypeScript Codebases Built for Long-Term Maintenance",
      ],
      techStack: ["React", "TypeScript", "Node.js", "PostgreSQL", "Drizzle ORM", "Tailwind CSS"],
      cta: {
        label: "Browse Marketplace",
        action: () => onNavigate("/marketplace"),
      },
    },
    {
      id: "scoping",
      num: "03",
      title: "Project Scoping & Architecture Studio",
      shortTitle: "Project Studio",
      badge: "Interactive Blueprints",
      icon: FaLayerGroup,
      summary: "Turn product ideas into clear technical specs, milestones, and roadmaps.",
      paragraphs: [
        "Software projects succeed when the scope is clear before a single line of production code is written. Through our interactive Project Studio, we help founders and teams map out user flows, select the right technical architecture, and break builds into transparent milestones.",
        "Clients can review specifications, track active development chapters, and collaborate directly with our engineering team from prototype to launch.",
      ],
      deliverables: [
        "Interactive Feature & User-Flow Scoping",
        "Database Schema & API Contract Planning",
        "Milestone Breakdown with Transparent Deliverables",
        "Direct Collaboration with Yog & Meowi",
      ],
      techStack: ["System Architecture", "UI/UX Wireframing", "API Design", "Milestone Planning"],
      cta: {
        label: "Open Project Studio",
        action: () => window.open(PROJECT_STUDIO_URL, "_blank", "noopener,noreferrer"),
        isExternal: true,
      },
    },
    {
      id: "community",
      num: "04",
      title: "Player Community & Live Events",
      shortTitle: "Player Community",
      badge: "Live Lobbies & Discord",
      icon: FaUsers,
      summary: "Active Discord lobbies, playtests, and community-driven updates.",
      paragraphs: [
        "Games and digital tools are always better when built alongside an active community. Our Discord server and in-platform friend system connect players for custom lobbies, weekend tournaments, and early feature playtests.",
        "Player feedback directly shapes our balance patches, new role designs, and quality-of-life updates.",
      ],
      deliverables: [
        "Custom Lobbies & Universal Room Invite Links",
        "In-App Friends List, Presence & Direct Messaging",
        "Community Playtests & Role Balance Updates",
        "Direct Developer Access on Discord",
      ],
      techStack: ["Discord Community", "Live Matchmaking", "Player Telemetry", "Open Playtests"],
      cta: {
        label: "Join Our Discord",
        action: () => window.open(DISCORD_INVITE_URL, "_blank", "noopener,noreferrer"),
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
          PHASE 02 • ABOUT EVERY NATION
        </span>
        <span className="text-xs text-neutral-400">•</span>
        <span className="text-xs font-semibold text-neutral-500">Capabilities &amp; Products</span>
      </div>

      {/* Page Title & Tagline */}
      <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-neutral-900 leading-tight mb-4">
        WHAT WE DO
      </h1>
      <p className="text-xl sm:text-2xl font-medium text-[#7c3aed] leading-snug mb-6">
        Multiplayer Games, Custom Software, and Community Tools.
      </p>

      {/* Intro */}
      <div className="space-y-4 text-base sm:text-lg text-neutral-700 leading-relaxed max-w-4xl border-b border-neutral-200 pb-10 mb-10">
        <p>
          Every Nation operates at the intersection of interactive entertainment and custom software engineering. Select any pillar below to inspect what we build, the technology behind it, and how you can jump in.
        </p>
      </div>

      {/* Interactive Split-Screen Capability Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-14 items-start">
        {/* Left Column: 4 Selectable Capability Cards */}
        <div className="lg:col-span-5 flex flex-col gap-3">
          {capabilities.map((cap, idx) => {
            const Icon = cap.icon;
            const isSelected = idx === selectedIndex;
            return (
              <button
                key={cap.id}
                onClick={() => setSelectedIndex(idx)}
                className={`w-full text-left rounded-2xl p-5 border transition-all cursor-pointer flex items-start gap-4 ${
                  isSelected
                    ? "bg-neutral-900 text-white border-neutral-900 shadow-md"
                    : "bg-[#f5f5f7] text-neutral-800 border-neutral-200/80 hover:bg-neutral-100 hover:border-neutral-300"
                }`}
              >
                <div
                  className={`w-11 h-11 rounded-xl flex items-center justify-center text-lg shrink-0 transition-colors ${
                    isSelected
                      ? "bg-[#7c3aed] text-white"
                      : "bg-[#7c3aed]/15 text-[#7c3aed]"
                  }`}
                >
                  <Icon />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span
                      className={`text-[10px] font-extrabold uppercase tracking-wider ${
                        isSelected ? "text-purple-300" : "text-[#7c3aed]"
                      }`}
                    >
                      Pillar {cap.num}
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
                  <h2 className="font-bold text-base leading-snug mb-1">
                    {cap.title}
                  </h2>
                  <p
                    className={`text-xs leading-relaxed line-clamp-2 ${
                      isSelected ? "text-neutral-300" : "text-neutral-500"
                    }`}
                  >
                    {cap.summary}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Right Column: Animated Live Inspector Panel */}
        <div className="lg:col-span-7">
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
                        Pillar {activeCap.num} of 04 • {activeCap.badge}
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

                {/* Deliverables Box */}
                <div className="bg-white rounded-2xl p-5 border border-neutral-200/80 mb-6">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-3">
                    What We Ship in This Pillar
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
                    Core Stack &amp; Tools
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

              {/* Actions + Next Pillar cycler */}
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
                    Next Pillar ({capabilities[(selectedIndex + 1) % capabilities.length].num})
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
              Mission, Vision &amp; Studio Principles
            </h3>
            <p className="text-sm text-neutral-300 mt-1 max-w-xl">
              See our long-term horizon and the four core engineering principles behind everything we release.
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

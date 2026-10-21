import React, { useState } from "react";
import { useLocation } from "wouter";
import { AnimatePresence, motion } from "framer-motion";
import StudioLayout from "@/components/StudioLayout";
import {
  FaArrowRight,
  FaUsers,
  FaGamepad,
  FaCode,
  FaComments,
  FaCheckCircle,
  FaLayerGroup,
  FaServer,
  FaRocket,
} from "react-icons/fa";

interface WhoWeAreProps {
  embedded?: boolean;
  onNavigate?: (path: string) => void;
}

const STUDIO_HIGHLIGHTS = [
  {
    id: "games",
    icon: FaGamepad,
    title: "Original Multiplayer Games",
    metric: "Web + Android Cross-Play",
    desc: "We design and operate real-time social and tactical games like Errant Night and Engraved Nether—built for instant browser and Android play.",
  },
  {
    id: "community",
    icon: FaComments,
    title: "Player-First Community",
    metric: "Live Lobbies & Events",
    desc: "Every Nation started with players. Our Discord and Game Hub bring friends together for nightly lobbies, playtests, and community tournaments.",
  },
  {
    id: "software",
    icon: FaCode,
    title: "Custom Software Engineering",
    metric: "Full-Stack Web & Mobile",
    desc: "Alongside our games, we partner with founders, creators, and businesses to design and ship dependable custom web and mobile software.",
  },
];

const BUILD_STAGES = [
  {
    step: "01",
    title: "Product Vision & Game Design",
    lead: "Led by Yog • Founder & Product Lead",
    icon: FaLayerGroup,
    summary:
      "Every game and client application starts with clear rules, intuitive user flows, and zero filler.",
    detail:
      "Before writing production code, we map out exactly how the product should feel in the hands of real people—whether balancing 12+ hidden roles and night-phase abilities in Errant Night or scoping a custom business portal with a client.",
    deliverables: [
      "Core game mechanics, role balance & win conditions",
      "Clean, high-contrast UI/UX wireframes & component systems",
      "Interactive technical specifications via Project Studio",
    ],
  },
  {
    step: "02",
    title: "Full-Stack & Real-Time Engineering",
    lead: "Led by Meowi • Co-Founder & Lead Engineer",
    icon: FaServer,
    summary:
      "Turning game rules and product blueprints into fast, resilient production architecture.",
    detail:
      "We engineer authoritative multiplayer servers and full-stack web & mobile applications using React 19, TypeScript, Node.js, Socket.IO, PostgreSQL, and Capacitor 7—built so browser and Android players share the exact same real-time rooms.",
    deliverables: [
      "Authoritative Socket.IO multiplayer rooms & reconnection recovery",
      "PostgreSQL + Drizzle ORM data models & REST APIs",
      "Unified Web + native Android APK builds from one codebase",
    ],
  },
  {
    step: "03",
    title: "Live Operations & Community Iteration",
    lead: "Joint Studio Operations • Yog & Meowi",
    icon: FaRocket,
    summary:
      "Shipping regularly, testing openly with our community, and standing behind what we build.",
    detail:
      "Launch is just the beginning. We host live game servers, run Discord playtests with our community, ship balance and quality-of-life updates, and support our business clients as their operations grow.",
    deliverables: [
      "Unified Every Nation account (Credits, XP, Friends & Achievements)",
      "Direct APK distribution & instant browser play",
      "Ongoing balance updates, performance tuning & client support",
    ],
  },
];

const FOUNDERS = [
  {
    id: "yog",
    initial: "Y",
    name: "Yog",
    roleBadge: "Founder & Product Lead",
    badgeClass: "text-[#7c3aed] bg-[#7c3aed]/10 border-[#7c3aed]/20",
    avatarClass: "bg-neutral-900 text-white",
    subtitle: "Game Design, Product Direction & Studio Strategy",
    bio: [
      "Yog leads product vision, game design, and user experience across Every Nation. From designing the core social deduction mechanics and role interactions in Errant Night to scoping custom client applications, Yog focuses on how every screen, rule, and workflow feels in the hands of real users.",
      "Rather than settling for generic templates, Yog works closely with players and clients to define what makes a project worth building—ensuring that our games stay tense and replayable, and our client software solves real operational problems cleanly.",
    ],
    focusAreas: [
      "Social Deduction & Tactical Game Mechanics",
      "Product Scoping & Client Discovery",
      "Interface Clarity & Design Systems",
      "Community Playtesting & Direction",
    ],
  },
  {
    id: "meowi",
    initial: "M",
    name: "Meowi",
    roleBadge: "Co-Founder & Lead Engineer",
    badgeClass: "text-emerald-700 bg-emerald-50 border-emerald-200",
    avatarClass: "bg-[#7c3aed] text-white",
    subtitle: "Full-Stack Architecture, Multiplayer Systems & Mobile Builds",
    bio: [
      "Meowi architects the engineering foundations that power Every Nation's games and software. Working across React, TypeScript, Node.js, Socket.IO, PostgreSQL, and Android Capacitor, Meowi turns game rules and product blueprints into fast, resilient production systems.",
      "From real-time multiplayer state synchronization and reconnection handling to database design and mobile APK packaging, Meowi ensures that everything the studio designs is built on solid, maintainable code.",
    ],
    focusAreas: [
      "Real-Time Socket.IO Game Engines",
      "React 19, TypeScript & Node.js APIs",
      "PostgreSQL & Drizzle ORM Architecture",
      "Android Capacitor APK Packaging",
    ],
  },
];

export function WhoWeAreContent({ onNavigate }: { onNavigate: (path: string) => void }) {
  const [activeStageIndex, setActiveStageIndex] = useState(0);
  const [selectedFounderId, setSelectedFounderId] = useState<string>("yog");

  const activeStage = BUILD_STAGES[activeStageIndex];
  const StageIcon = activeStage.icon;

  return (
    <div className="py-12 sm:py-16 max-w-5xl mx-auto px-6">
      {/* Breadcrumb / Phase Tag */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-[11px] font-bold uppercase tracking-wider text-[#7c3aed] bg-[#7c3aed]/10 px-3 py-1 rounded-full">
          PHASE 01 • ABOUT EVERY NATION
        </span>
        <span className="text-xs text-neutral-400">•</span>
        <span className="text-xs font-semibold text-neutral-500">Studio Identity &amp; Founders</span>
      </div>

      {/* Page Title & Subtitle */}
      <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-neutral-900 leading-tight mb-4">
        WHO WE ARE
      </h1>
      <p className="text-xl sm:text-2xl font-medium text-[#7c3aed] leading-snug mb-8">
        An Independent Game Studio, Player Community, and Software Team.
      </p>

      {/* Core Narrative */}
      <div className="space-y-5 text-base sm:text-lg text-neutral-700 leading-relaxed max-w-4xl mb-12">
        <p className="text-lg sm:text-xl font-medium text-neutral-900 leading-relaxed">
          Every Nation (ENGG) began with a simple conviction: great games and great software come from teams that actually care about the people using them.
        </p>
        <p>
          What started as a close-knit gaming community has grown into an independent studio where we build our own multiplayer titles—such as <strong>Errant Night</strong>, our real-time sci-fi social deduction game, and <strong>Engraved Nether</strong>, our tactical grid card battler—while also engineering custom web and mobile applications for clients.
        </p>
      </div>

      {/* 3 Core Pillars Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pb-14 border-b border-neutral-200">
        {STUDIO_HIGHLIGHTS.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.id}
              className="bg-[#f5f5f7] hover:bg-white rounded-2xl p-6 border border-neutral-200/80 hover:border-[#7c3aed]/40 hover:shadow-sm transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-[#7c3aed]/15 text-[#7c3aed] flex items-center justify-center">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 bg-white px-2.5 py-1 rounded-full border border-neutral-200/80">
                    {item.metric}
                  </span>
                </div>
                <h3 className="text-base font-bold text-neutral-900 mb-2">{item.title}</h3>
                <p className="text-sm text-neutral-600 leading-relaxed">{item.desc}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Interactive 3-Stage Build Pipeline */}
      <div className="py-14 border-b border-neutral-200">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#7c3aed]">
              Interactive Workflow
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 tracking-tight mt-1">
              HOW EVERY NATION BUILDS
            </h2>
            <p className="text-sm sm:text-base text-neutral-500 mt-1">
              Click each stage below to see how an idea moves from concept to live production.
            </p>
          </div>
          <div className="flex items-center gap-1.5 bg-[#f5f5f7] p-1.5 rounded-full border border-neutral-200/80 self-start">
            {BUILD_STAGES.map((stage, idx) => (
              <button
                key={stage.step}
                onClick={() => setActiveStageIndex(idx)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  activeStageIndex === idx
                    ? "bg-[#7c3aed] text-white shadow-xs"
                    : "text-neutral-600 hover:text-neutral-900"
                }`}
              >
                Stage {stage.step}
              </button>
            ))}
          </div>
        </div>

        {/* Stage Selector Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {BUILD_STAGES.map((stage, idx) => {
            const isSelected = idx === activeStageIndex;
            return (
              <button
                key={stage.step}
                onClick={() => setActiveStageIndex(idx)}
                className={`text-left rounded-2xl p-5 border transition-all cursor-pointer ${
                  isSelected
                    ? "bg-neutral-900 text-white border-neutral-900 shadow-md"
                    : "bg-[#f5f5f7] text-neutral-800 border-neutral-200/80 hover:border-neutral-300 hover:bg-neutral-100"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={`text-[11px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                      isSelected
                        ? "bg-[#7c3aed] text-white"
                        : "bg-white text-neutral-600 border border-neutral-200"
                    }`}
                  >
                    Stage {stage.step}
                  </span>
                  <span
                    className={`text-xs font-semibold ${
                      isSelected ? "text-purple-300" : "text-neutral-400"
                    }`}
                  >
                    {isSelected ? "Active" : "Click to inspect"}
                  </span>
                </div>
                <h3 className="font-bold text-base mb-1">{stage.title}</h3>
                <p
                  className={`text-xs leading-relaxed ${
                    isSelected ? "text-neutral-300" : "text-neutral-500"
                  }`}
                >
                  {stage.lead}
                </p>
              </button>
            );
          })}
        </div>

        {/* Animated Stage Detail Inspector */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeStage.step}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="bg-[#f5f5f7] rounded-3xl p-7 sm:p-9 border border-neutral-200/90"
          >
            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-8">
              <div className="max-w-2xl">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-11 h-11 rounded-2xl bg-[#7c3aed] text-white flex items-center justify-center text-lg shrink-0">
                    <StageIcon />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#7c3aed]">
                      Stage {activeStage.step} • {activeStage.lead}
                    </span>
                    <h3 className="text-xl sm:text-2xl font-extrabold text-neutral-900">
                      {activeStage.title}
                    </h3>
                  </div>
                </div>
                <p className="text-base font-semibold text-neutral-900 mb-2">
                  {activeStage.summary}
                </p>
                <p className="text-sm sm:text-base text-neutral-700 leading-relaxed">
                  {activeStage.detail}
                </p>
              </div>

              <div className="lg:w-80 shrink-0 bg-white rounded-2xl p-5 border border-neutral-200/80">
                <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-3">
                  Stage {activeStage.step} Deliverables
                </div>
                <ul className="space-y-2.5 mb-5">
                  {activeStage.deliverables.map((d) => (
                    <li key={d} className="flex items-start gap-2.5 text-xs text-neutral-700 leading-relaxed">
                      <FaCheckCircle className="w-3.5 h-3.5 text-[#7c3aed] shrink-0 mt-0.5" />
                      <span>{d}</span>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() =>
                    setActiveStageIndex((prev) => (prev + 1) % BUILD_STAGES.length)
                  }
                  className="w-full inline-flex items-center justify-center gap-2 text-xs font-bold text-[#7c3aed] bg-[#7c3aed]/10 hover:bg-[#7c3aed]/15 px-4 py-2.5 rounded-xl transition-colors cursor-pointer"
                >
                  <span>
                    {activeStageIndex < BUILD_STAGES.length - 1
                      ? `Next: Stage 0${activeStageIndex + 2}`
                      : "Back to Stage 01"}
                  </span>
                  <FaArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* The Founders Section */}
      <div className="pt-14 pb-12">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-lg bg-[#7c3aed]/15 text-[#7c3aed] flex items-center justify-center font-bold text-sm">
            <FaUsers className="w-4 h-4" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 tracking-tight">
            THE FOUNDERS
          </h2>
        </div>
        <p className="text-neutral-500 text-sm sm:text-base mb-8 max-w-2xl">
          Product direction and hands-on engineering working side by side. Click either founder card to highlight their core specialties.
        </p>

        {/* Leaders Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          {FOUNDERS.map((founder) => {
            const isSelected = selectedFounderId === founder.id;
            return (
              <div
                key={founder.id}
                onClick={() => setSelectedFounderId(founder.id)}
                className={`rounded-3xl p-7 sm:p-8 border transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? "bg-white border-[#7c3aed] ring-2 ring-[#7c3aed]/15 shadow-sm"
                    : "bg-[#f5f5f7] border-neutral-200/80 hover:border-neutral-300"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg ${founder.avatarClass}`}
                    >
                      {founder.initial}
                    </div>
                    <span
                      className={`text-[11px] font-bold tracking-wider uppercase px-3 py-1 rounded-full border ${founder.badgeClass}`}
                    >
                      {founder.roleBadge}
                    </span>
                  </div>
                  <h3 className="text-2xl font-bold text-neutral-900 mb-1">
                    {founder.name}
                  </h3>
                  <p className="text-sm font-semibold text-neutral-500 mb-5">
                    {founder.subtitle}
                  </p>

                  <div className="space-y-3.5 text-sm text-neutral-700 leading-relaxed mb-6">
                    {founder.bio.map((paragraph, i) => (
                      <p key={i}>{paragraph}</p>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-neutral-200/80">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-2.5">
                    Core Focus Areas
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {founder.focusAreas.map((area) => (
                      <span
                        key={area}
                        className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border ${
                          isSelected
                            ? "bg-[#7c3aed]/10 text-[#7c3aed] border-[#7c3aed]/20"
                            : "bg-white text-neutral-600 border-neutral-200"
                        }`}
                      >
                        {area}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Interactive Next Phase Transition Card */}
      <div className="border-t border-neutral-200 pt-8">
        <div className="bg-neutral-900 text-white rounded-3xl p-7 sm:p-9 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-purple-300">
              Up Next • Phase 02 of 03
            </span>
            <h3 className="text-xl sm:text-2xl font-extrabold text-white mt-1">
              What We Do: Games, Software &amp; Studio Capabilities
            </h3>
            <p className="text-sm text-neutral-300 mt-1 max-w-xl">
              Explore our interactive capability showcase—from real-time multiplayer games to custom web &amp; Android engineering.
            </p>
          </div>
          <button
            onClick={() => onNavigate("/about/what-we-do")}
            className="w-full sm:w-auto shrink-0 inline-flex items-center justify-center gap-3 bg-[#7c3aed] hover:bg-[#6d28d9] text-white px-6 py-3.5 rounded-full text-sm font-bold transition-all shadow-sm active:scale-95 cursor-pointer"
          >
            <span>Advance to Phase 02</span>
            <FaArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function WhoWeAre({ embedded = false, onNavigate }: WhoWeAreProps) {
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
    return <WhoWeAreContent onNavigate={handleNavigate} />;
  }

  return (
    <StudioLayout>
      <WhoWeAreContent onNavigate={handleNavigate} />
    </StudioLayout>
  );
}

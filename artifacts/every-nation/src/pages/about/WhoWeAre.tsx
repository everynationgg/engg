import React, { useState } from "react";
import { useLocation } from "wouter";
import { AnimatePresence, motion } from "framer-motion";
import StudioLayout from "@/components/StudioLayout";
import {
  FaArrowRight,
  FaUsers,
  FaGamepad,
  FaRobot,
  FaCode,
  FaCheckCircle,
  FaLightbulb,
  FaServer,
  FaRocket,
} from "react-icons/fa";

interface WhoWeAreProps {
  embedded?: boolean;
  onNavigate?: (path: string) => void;
}

const STUDIO_HIGHLIGHTS = [
  {
    id: "enos",
    icon: FaGamepad,
    title: "ENOS & Multiplayer Gaming",
    metric: "ENOS Hub • Web + Android",
    desc: "Our unified Every Nation Operating System (ENOS) connects players across live multiplayer titles like Errant Night and Engraved Nether with one shared identity.",
  },
  {
    id: "visien",
    icon: FaRobot,
    title: "VISIEN AI & Automation",
    metric: "Enos AI Guided Discovery",
    desc: "Vision Inspired by Story and Idea. VISIEN AI uses our conversational Enos AI guide to turn raw ideas into architectural blueprints, roadmaps, and live project tracking.",
  },
  {
    id: "bespoke",
    icon: FaCode,
    title: "Bespoke Digital Products & IT",
    metric: "Tailored Web & Mobile",
    desc: "We don't force people or businesses into fixed templates. We engineer custom web platforms, mobile APKs, and digital tools shaped around real workflows.",
  },
];

const BUILD_STAGES = [
  {
    step: "01",
    title: "Vision, Concepts & VISIEN AI Discovery",
    lead: "Led by Yog • Founder & Vision Lead",
    icon: FaLightbulb,
    summary:
      "Defining why a product should exist, who it should serve, and how it should feel—powered by VISIEN AI.",
    detail:
      "Every initiative begins with understanding the person or organization behind a need. Whether conceptualizing original games and the ENOS ecosystem or guiding clients through VISIEN AI (with our Enos AI discovery assistant), Yog shapes raw ideas into purposeful, personalized product blueprints.",
    deliverables: [
      "VISIEN AI & Enos AI guided concept-to-blueprint discovery",
      "Original game concepts, role systems & user experiences",
      "Tailored product workflows designed beyond generic templates",
    ],
  },
  {
    step: "02",
    title: "Technical Foundation & Implementation",
    lead: "Led by Meowi • Technical Partner",
    icon: FaServer,
    summary:
      "Translating ENGG's concepts and VISIEN blueprints into functioning, resilient digital systems.",
    detail:
      "Ideas require thoughtful technical foundations to become reality. Working alongside Yog, Meowi engineers the full-stack systems, real-time Socket.IO game servers, PostgreSQL data models, and native Android APK builds that bring ENOS, Errant Night, and client solutions to life.",
    deliverables: [
      "Full-stack React, TypeScript, Node.js & PostgreSQL systems",
      "Real-time multiplayer state sync & cross-play Android APKs",
      "Bespoke client web applications, portals & practical tools",
    ],
  },
  {
    step: "03",
    title: "The Connected ENOS Ecosystem & Community",
    lead: "Yog & Meowi • Long-Term Evolution",
    icon: FaRocket,
    summary:
      "Products, AI tools, bespoke services, and player communities reinforcing one another.",
    detail:
      "ENGG is built for the long term. Through the ENOS hub, our Discord community, and VISIEN project tracking, our games, AI tools, and custom software evolve continuously alongside the individuals, creators, and businesses who use them.",
    deliverables: [
      "Unified ENOS identity, credits, allies & cross-game progression",
      "Live VISIEN milestone tracking & ongoing client iteration",
      "Active Discord community, playtests & continuous updates",
    ],
  },
];

const FOUNDERS = [
  {
    id: "yog",
    initial: "Y",
    name: "Yog",
    roleBadge: "Founder & Vision Lead",
    badgeClass: "text-[#7c3aed] bg-[#7c3aed]/10 border-[#7c3aed]/20",
    avatarClass: "bg-neutral-900 text-white",
    subtitle: "Founder & Vision Lead • Creator of VISIEN AI & ENOS",
    bio: [
      "Yog is the mind behind ENGG's direction, concepts, and ambitions. Yog drives the vision, conceptualizes products and services—including VISIEN AI and the ENOS ecosystem—shapes user experiences, and determines how individual ideas contribute to the wider Every Nation GG ecosystem.",
      "From imagining new digital experiences to defining how products should function and feel, Yog considers both the end user and the broader product vision. The objective is not simply to create something that works, but to understand why it should exist, who it should serve, and how it can deliver meaningful value.",
      "For Yog, ENGG is an evolving ecosystem in which products, services, gaming, AI, and community complement one another with a consistent philosophy: build with purpose, make technology personal, and leave room for ideas to become more than they were initially imagined to be.",
    ],
    focusAreas: [
      "VISIEN AI & Enos AI Concept",
      "ENOS Ecosystem & Product Strategy",
      "Game Design & User Experience",
      "Bespoke Client Customization",
    ],
  },
  {
    id: "meowi",
    initial: "M",
    name: "Meowi",
    roleBadge: "Technical Partner",
    badgeClass: "text-emerald-700 bg-emerald-50 border-emerald-200",
    avatarClass: "bg-[#7c3aed] text-white",
    subtitle: "Technical Partner • Systems & Full-Stack Engineering",
    bio: [
      "Meowi is the technical partner who helps transform ENGG's ideas and concepts into functioning digital experiences. Working alongside Yog, Meowi contributes to the development and implementation that turn plans into practical products, tools, and services.",
      "Ideas require more than imagination to become reality. They need technical foundations, thoughtful implementation, problem-solving, and a willingness to work through the challenges of building digital systems. Meowi helps bridge the gap between what ENGG envisions and what can be delivered.",
      "Together, Yog and Meowi represent two complementary sides of the same ambition: defining what should be built and working toward making it possible.",
    ],
    focusAreas: [
      "Full-Stack Web & Mobile Systems",
      "ENOS & Real-Time Multiplayer Engines",
      "Database & API Architecture",
      "Android Capacitor APK Builds",
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
          PHASE 01 • ABOUT EVERY NATION GG
        </span>
        <span className="text-xs text-neutral-400">•</span>
        <span className="text-xs font-semibold text-neutral-500">Part 1 of 3</span>
      </div>

      {/* Page Title & Subtitle */}
      <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-neutral-900 leading-tight mb-4">
        WHO WE ARE
      </h1>
      <p className="text-xl sm:text-2xl font-medium text-[#7c3aed] leading-snug mb-8">
        Built on Ideas. Driven by People. Powered by Technology.
      </p>

      {/* Core Narrative */}
      <div className="space-y-5 text-base sm:text-lg text-neutral-700 leading-relaxed max-w-4xl mb-12">
        <p className="text-lg sm:text-xl font-normal text-neutral-900 leading-relaxed">
          Every Nation GG (ENGG) is a growing technology and digital innovation studio built on the belief that technology should be personal, accessible, and adaptable to the people who use it.
        </p>
        <p>
          Through multiplayer gaming, our unified <strong>ENOS</strong> platform, <strong>VISIEN AI</strong> guided project discovery, and bespoke IT solutions, we bring multiple areas of technology together under one connected ecosystem. At the heart of ENGG is a commitment to personalization: we do not believe every person, creator, or business should have to settle for off-the-shelf templates simply because they are readily available.
        </p>
        <p className="font-medium text-neutral-900">
          A small idea deserves thoughtful consideration just as much as a large-scale project. ENGG is built for the long term—to be a dependable technology partner, a creator of original games and AI tools, and a place where ideas develop into real, working solutions.
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
              Interactive Ecosystem Flow
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 tracking-tight mt-1">
              HOW ENGG TURNS VISION INTO REALITY
            </h2>
            <p className="text-sm sm:text-base text-neutral-500 mt-1">
              Click each stage below to explore how VISIEN AI, engineering, and ENOS work together.
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
                  Stage {activeStage.step} Focus
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

      {/* The People Behind ENGG */}
      <div className="pt-14 pb-12">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-lg bg-[#7c3aed]/15 text-[#7c3aed] flex items-center justify-center font-bold text-sm">
            <FaUsers className="w-4 h-4" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 tracking-tight">
            THE PEOPLE BEHIND ENGG
          </h2>
        </div>
        <p className="text-neutral-500 text-sm sm:text-base mb-8 max-w-2xl">
          Two complementary sides of the same ambition: defining what should be built and working toward making it possible.
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
              What We Do: One Ecosystem. Multiple Possibilities.
            </h3>
            <p className="text-sm text-neutral-300 mt-1 max-w-xl">
              Explore our 7 core capabilities—including VISIEN AI discovery, ENOS gaming, AI automation, and bespoke IT solutions.
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

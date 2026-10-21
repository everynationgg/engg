import React, { useState } from "react";
import { useLocation } from "wouter";
import { AnimatePresence, motion } from "framer-motion";
import StudioLayout from "@/components/StudioLayout";
import { VISIEN_AI_URL } from "@/lib/externalLinks";
import {
  FaArrowLeft,
  FaCompass,
  FaEye,
  FaGamepad,
  FaCheckCircle,
  FaShieldAlt,
  FaChevronRight,
  FaRobot,
} from "react-icons/fa";

interface MissionVisionProps {
  embedded?: boolean;
  onNavigate?: (path: string) => void;
}

const HORIZON_TABS = [
  {
    id: "mission",
    badge: "Guiding Purpose",
    title: "OUR MISSION",
    icon: FaCompass,
    headline:
      "To make technology accessible, reliable, and deeply personal by creating customizable digital products, intelligent tools, and bespoke IT services that empower individuals, businesses, and communities.",
    detail:
      "Through innovation, practical problem-solving, and meaningful relationships, we transform ideas into useful solutions tailored to the people who use them. Whether developing our own products—like ENOS, VISIEN AI, and Errant Night—or working toward a customized solution for a client, we aim to understand the problem, explore what is possible, and build something that makes a difference.",
    commitments: [
      "Customizable digital products & the connected ENOS platform",
      "Intelligent discovery & project planning through VISIEN AI",
      "Bespoke IT services tailored to individuals, startups & businesses",
    ],
  },
  {
    id: "vision",
    badge: "Long-Term Horizon",
    title: "OUR VISION",
    icon: FaEye,
    headline:
      "To become a trusted, all-in-one technology ecosystem connecting gaming, artificial intelligence, digital products, services, and community—serving organizations of every scale without leaving individuals and smaller businesses behind.",
    detail:
      "We envision an ENGG that continues to expand its products, capabilities, and reach while remaining grounded in accessibility, reliability, customization, and personal connection. Our long-term ambition is to establish ENGG as a dependable destination where ideas can grow into lasting digital experiences.",
    commitments: [
      "An all-in-one ecosystem uniting ENOS, VISIEN AI, games & custom software",
      "Growing to serve any scale while keeping personal attention for small teams",
      "Fostering an active community where people and technology move forward together",
    ],
  },
  {
    id: "standard",
    badge: "How We Deliver",
    title: "OUR ECOSYSTEM PROMISE",
    icon: FaShieldAlt,
    headline:
      "Every product and client solution in the Every Nation GG ecosystem is built with purpose, shaped around real users, and engineered to stand on its own.",
    detail:
      "From Enos AI guiding a founder through their first technical blueprint in VISIEN to ten players sharing a cross-play lobby in Errant Night, we hold every release to the same standard of clarity, reliability, and craft.",
    commitments: [
      "Unified Web & Android cross-play backed by real-time infrastructure",
      "Transparent project blueprints & milestone tracking via VISIEN AI",
      "Clean, maintainable engineering designed to evolve over time",
    ],
  },
];

const PRINCIPLES = [
  {
    id: "personal",
    title: "Personal & Customizable by Design",
    desc: "We do not believe every person or business should have to settle for fixed templates when their goals and workflows are unique.",
    inPractice:
      "In Practice: Through VISIEN AI and our bespoke IT services, we scope and tailor every workflow, interface, and architecture around the specific person or organization we are serving.",
  },
  {
    id: "practical-ai",
    title: "Practical AI & Intelligent Tools",
    desc: "We treat artificial intelligence and automation as practical capabilities that solve real problems rather than novelty buzzwords.",
    inPractice:
      "In Practice: Inside VISIEN Discovery, our Enos AI assistant guides founders and business owners step-by-step from raw concept to a structured technical blueprint and live project tracker.",
  },
  {
    id: "accessible",
    title: "Accessible Across Every Scale & Device",
    desc: "A small idea deserves thoughtful consideration just as much as an enterprise project, and our experiences run where people actually are.",
    inPractice:
      "In Practice: Errant Night and our ENOS platform run seamlessly across desktop web browsers and native Android APK builds with full real-time cross-play.",
  },
  {
    id: "connected",
    title: "One Connected Ecosystem",
    desc: "Gaming, AI, digital products, and community reinforce one another under the Every Nation GG umbrella.",
    inPractice:
      "In Practice: Your ENOS identity connects your games library, credits, allies list, and marketplace downloads in one unified portal.",
  },
];

export function MissionVisionContent({ onNavigate }: { onNavigate: (path: string) => void }) {
  const [activeHorizonId, setActiveHorizonId] = useState("mission");
  const [selectedPrincipleId, setSelectedPrincipleId] = useState("personal");

  const activeHorizon =
    HORIZON_TABS.find((t) => t.id === activeHorizonId) ?? HORIZON_TABS[0];
  const HorizonIcon = activeHorizon.icon;

  return (
    <div className="py-12 sm:py-16 max-w-5xl mx-auto px-6">
      {/* Category Pill */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-[11px] font-bold uppercase tracking-wider text-[#7c3aed] bg-[#7c3aed]/10 px-3 py-1 rounded-full">
          PHASE 03 • ABOUT EVERY NATION GG
        </span>
        <span className="text-xs text-neutral-400">•</span>
        <span className="text-xs font-semibold text-neutral-500">Part 3 of 3</span>
      </div>

      {/* Page Title */}
      <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-neutral-900 leading-tight mb-4">
        MISSION AND VISION
      </h1>
      <p className="text-xl sm:text-2xl font-medium text-[#7c3aed] leading-snug mb-8">
        Purpose-Driven Innovation. Grounded in Long-Term Value.
      </p>

      {/* Interactive Horizon Switcher Tabs */}
      <div className="mb-12">
        <div className="flex flex-wrap items-center gap-2 mb-5">
          {HORIZON_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = tab.id === activeHorizonId;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveHorizonId(tab.id)}
                className={`inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  isActive
                    ? "bg-neutral-900 text-white shadow-sm"
                    : "bg-[#f5f5f7] text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/70 border border-neutral-200/80"
                }`}
              >
                <Icon className={isActive ? "text-purple-300" : "text-[#7c3aed]"} />
                <span>{tab.title}</span>
              </button>
            );
          })}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeHorizon.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className={`rounded-3xl p-8 sm:p-11 border shadow-xs ${
              activeHorizon.id === "vision"
                ? "bg-neutral-900 text-white border-neutral-800"
                : "bg-[#f5f5f7] text-neutral-900 border-neutral-200/80"
            }`}
          >
            <div
              className={`flex items-center gap-4 mb-6 pb-6 border-b ${
                activeHorizon.id === "vision"
                  ? "border-neutral-800"
                  : "border-neutral-200/80"
              }`}
            >
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shrink-0 ${
                  activeHorizon.id === "vision"
                    ? "bg-white/10 text-purple-300 border border-white/10"
                    : "bg-[#7c3aed] text-white"
                }`}
              >
                <HorizonIcon />
              </div>
              <div>
                <span
                  className={`text-[11px] font-bold tracking-wider uppercase ${
                    activeHorizon.id === "vision" ? "text-purple-300" : "text-[#7c3aed]"
                  }`}
                >
                  {activeHorizon.badge}
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                  {activeHorizon.title}
                </h2>
              </div>
            </div>

            <div className="space-y-4 text-base sm:text-lg leading-relaxed mb-8">
              <p className="font-semibold text-lg sm:text-xl leading-relaxed">
                {activeHorizon.headline}
              </p>
              <p
                className={
                  activeHorizon.id === "vision" ? "text-neutral-300" : "text-neutral-700"
                }
              >
                {activeHorizon.detail}
              </p>
            </div>

            <div
              className={`rounded-2xl p-5 border ${
                activeHorizon.id === "vision"
                  ? "bg-white/5 border-white/10"
                  : "bg-white border-neutral-200/80"
              }`}
            >
              <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-3">
                Core Pillars of {activeHorizon.title}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {activeHorizon.commitments.map((c) => (
                  <div key={c} className="flex items-start gap-2.5 text-xs leading-relaxed">
                    <FaCheckCircle
                      className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${
                        activeHorizon.id === "vision"
                          ? "text-purple-300"
                          : "text-[#7c3aed]"
                      }`}
                    />
                    <span
                      className={
                        activeHorizon.id === "vision"
                          ? "text-neutral-200"
                          : "text-neutral-700"
                      }
                    >
                      {c}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Interactive Studio Principles */}
      <div className="mb-14">
        <div className="mb-6">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#7c3aed]">
            Interactive Philosophy
          </span>
          <h3 className="text-xl sm:text-2xl font-extrabold text-neutral-900 tracking-tight mt-1">
            HOW OUR PHILOSOPHY WORKS IN PRACTICE
          </h3>
          <p className="text-sm text-neutral-500 mt-1">
            Click any principle below to see how VISIEN AI, ENOS, and our games put it into action.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {PRINCIPLES.map((p) => {
            const isSelected = selectedPrincipleId === p.id;
            return (
              <button
                key={p.id}
                onClick={() => setSelectedPrincipleId(p.id)}
                className={`text-left rounded-2xl p-6 border transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? "bg-white border-[#7c3aed] ring-2 ring-[#7c3aed]/15 shadow-sm"
                    : "bg-[#f5f5f7] border-neutral-200/90 hover:bg-white hover:border-neutral-300"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2.5">
                      <FaCheckCircle className="text-[#7c3aed] w-4 h-4 shrink-0" />
                      <h4 className="font-bold text-neutral-900 text-base">
                        {p.title}
                      </h4>
                    </div>
                    <FaChevronRight
                      className={`w-3 h-3 transition-transform ${
                        isSelected
                          ? "rotate-90 text-[#7c3aed]"
                          : "text-neutral-400"
                      }`}
                    />
                  </div>
                  <p className="text-sm text-neutral-600 leading-relaxed">
                    {p.desc}
                  </p>
                </div>

                <AnimatePresence initial={false}>
                  {isSelected && (
                    <motion.div
                      initial={{ opacity: 0, height: 0, marginTop: 0 }}
                      animate={{ opacity: 1, height: "auto", marginTop: 14 }}
                      exit={{ opacity: 0, height: 0, marginTop: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="pt-3 border-t border-neutral-200/80 text-xs font-medium text-[#7c3aed] bg-[#7c3aed]/5 rounded-xl p-3 leading-relaxed">
                        {p.inPractice}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </button>
            );
          })}
        </div>
      </div>

      {/* Final Phase Completion & Studio Launch Dock */}
      <div className="border-t border-neutral-200 pt-8">
        <div className="bg-neutral-900 text-white rounded-3xl p-7 sm:p-9 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
              Profile Complete • Phase 03 of 03
            </span>
            <h3 className="text-xl sm:text-2xl font-extrabold text-white mt-1">
              Explore the Every Nation GG Ecosystem
            </h3>
            <p className="text-sm text-neutral-300 mt-1 max-w-xl">
              Jump into the ENOS Gaming Hub or launch VISIEN AI to turn your own idea into a working blueprint.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto shrink-0">
            <button
              onClick={() => onNavigate("/about/what-we-do")}
              className="inline-flex items-center justify-center gap-2.5 bg-white/10 hover:bg-white/15 text-white border border-white/15 px-5 py-3.5 rounded-full text-xs font-semibold transition-all cursor-pointer"
            >
              <FaArrowLeft className="w-3 h-3" />
              <span>Phase 02</span>
            </button>
            <button
              onClick={() => window.open(VISIEN_AI_URL, "_blank", "noopener,noreferrer")}
              className="inline-flex items-center justify-center gap-2.5 bg-white text-neutral-900 hover:bg-neutral-100 px-5 py-3.5 rounded-full text-xs font-bold transition-all cursor-pointer"
            >
              <FaRobot className="w-3.5 h-3.5 text-[#7c3aed]" />
              <span>Launch VISIEN AI</span>
            </button>
            <button
              onClick={() => onNavigate("/hub")}
              className="inline-flex items-center justify-center gap-3 bg-[#7c3aed] hover:bg-[#6d28d9] text-white px-6 py-3.5 rounded-full text-sm font-bold transition-all shadow-sm active:scale-95 cursor-pointer"
            >
              <FaGamepad className="w-4 h-4" />
              <span>Explore ENOS Hub</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MissionVision({ embedded = false, onNavigate }: MissionVisionProps) {
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
    return <MissionVisionContent onNavigate={handleNavigate} />;
  }

  return (
    <StudioLayout>
      <MissionVisionContent onNavigate={handleNavigate} />
    </StudioLayout>
  );
}

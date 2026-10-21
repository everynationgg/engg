import React, { useState } from "react";
import { useLocation } from "wouter";
import { AnimatePresence, motion } from "framer-motion";
import StudioLayout from "@/components/StudioLayout";
import {
  FaArrowLeft,
  FaCompass,
  FaEye,
  FaGamepad,
  FaCheckCircle,
  FaShieldAlt,
  FaChevronRight,
} from "react-icons/fa";

interface MissionVisionProps {
  embedded?: boolean;
  onNavigate?: (path: string) => void;
}

const HORIZON_TABS = [
  {
    id: "mission",
    badge: "Our Purpose Today",
    title: "OUR MISSION",
    icon: FaCompass,
    headline:
      "To create memorable multiplayer games, welcoming player communities, and dependable custom software that help people connect, play, and get real work done.",
    detail:
      "Whether we are shipping a new role update for Errant Night or building a custom web application for a partner business, our standard is the same: understand the goal clearly, engineer it cleanly, and make the experience effortless for the end user.",
    commitments: [
      "Zero pay-to-win or bloated dark patterns in our games",
      "Direct cross-play between Web browsers and Android APK builds",
      "Custom client software engineered from clean, maintainable TypeScript",
    ],
  },
  {
    id: "vision",
    badge: "Long-Term Horizon",
    title: "OUR VISION",
    icon: FaEye,
    headline:
      "To grow Every Nation into a trusted independent studio known for original multiplayer games and high-craft custom software—serving players, creators, and businesses of every size without losing our personal touch.",
    detail:
      "As our catalog of games and client software expands, we remain committed to keeping our games accessible, our engineering transparent, and our community at the center of everything we ship.",
    commitments: [
      "Expanding our catalog of original browser & mobile multiplayer titles",
      "Long-term technical partnerships with founders and growing businesses",
      "Open community development driven by real player feedback",
    ],
  },
  {
    id: "standard",
    badge: "Engineering Standard",
    title: "OUR QUALITY BAR",
    icon: FaShieldAlt,
    headline:
      "Every release—whether a ten-player social deduction lobby or a client business portal—is built to be fast, resilient, and straightforward to use.",
    detail:
      "We test our systems under real multiplayer load, keep our bundle sizes lean, and ensure that accounts, credits, and real-time sessions stay synchronized across every device.",
    commitments: [
      "Sub-second page transitions and low-latency Socket.IO state sync",
      "Strict server-side validation and secure account recovery flows",
      "Responsive layouts tuned for both desktop monitors and mobile screens",
    ],
  },
];

const PRINCIPLES = [
  {
    id: "craft",
    title: "Craft Over Hype",
    desc: "We focus on responsive gameplay, clear user interfaces, and reliable engineering rather than buzzwords or bloated features.",
    inPractice:
      "In Practice: We stripped out heavy unused libraries and buzzword filler across our platform, cutting bundle overhead while focusing 100% on fast load times and clear typography.",
  },
  {
    id: "tailored",
    title: "Tailored to Real Needs",
    desc: "Every game mode and client application is shaped around the people actually using it—from small teams to global lobbies.",
    inPractice:
      "In Practice: Through our Project Studio and custom engineering work, we scope every client workflow from scratch rather than forcing businesses into rigid templates.",
  },
  {
    id: "accessible",
    title: "Accessible Across Devices",
    desc: "Our games and web tools are designed to run smoothly across desktop browsers, mobile web, and Android devices.",
    inPractice:
      "In Practice: Errant Night runs from a unified codebase across Web (engg.online/errant-night) and native Android APK—allowing mobile and PC players to share the exact same room code.",
  },
  {
    id: "community",
    title: "Community Connected",
    desc: "We build in the open with our players and clients, shipping continuous improvements backed by direct feedback.",
    inPractice:
      "In Practice: Our built-in Allies sidebar, live lobby browser, and Discord community let players squad up, message friends in real time, and shape upcoming updates.",
  },
];

export function MissionVisionContent({ onNavigate }: { onNavigate: (path: string) => void }) {
  const [activeHorizonId, setActiveHorizonId] = useState("mission");
  const [selectedPrincipleId, setSelectedPrincipleId] = useState("craft");

  const activeHorizon =
    HORIZON_TABS.find((t) => t.id === activeHorizonId) ?? HORIZON_TABS[0];
  const HorizonIcon = activeHorizon.icon;

  return (
    <div className="py-12 sm:py-16 max-w-5xl mx-auto px-6">
      {/* Category Pill */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-[11px] font-bold uppercase tracking-wider text-[#7c3aed] bg-[#7c3aed]/10 px-3 py-1 rounded-full">
          PHASE 03 • ABOUT EVERY NATION
        </span>
        <span className="text-xs text-neutral-400">•</span>
        <span className="text-xs font-semibold text-neutral-500">Horizon &amp; Studio Principles</span>
      </div>

      {/* Page Title */}
      <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-neutral-900 leading-tight mb-4">
        MISSION AND VISION
      </h1>
      <p className="text-xl sm:text-2xl font-medium text-[#7c3aed] leading-snug mb-8">
        Built for Players. Engineered to Last.
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
              <div
                className={`text-[11px] font-bold uppercase tracking-wider mb-3 ${
                  activeHorizon.id === "vision" ? "text-neutral-400" : "text-neutral-400"
                }`}
              >
                Core Commitments
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
            Interactive Principles
          </span>
          <h3 className="text-xl sm:text-2xl font-extrabold text-neutral-900 tracking-tight mt-1">
            STUDIO PRINCIPLES IN PRACTICE
          </h3>
          <p className="text-sm text-neutral-500 mt-1">
            Click any principle below to inspect how we apply it in our live games and client software.
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
              Ready to Jump In?
            </h3>
            <p className="text-sm text-neutral-300 mt-1 max-w-xl">
              Launch into our live multiplayer Game Hub or browse our custom apps and Android APK releases in the Marketplace.
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
              onClick={() => onNavigate("/hub")}
              className="inline-flex items-center justify-center gap-3 bg-[#7c3aed] hover:bg-[#6d28d9] text-white px-6 py-3.5 rounded-full text-sm font-bold transition-all shadow-sm active:scale-95 cursor-pointer"
            >
              <FaGamepad className="w-4 h-4" />
              <span>Explore Game Hub</span>
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

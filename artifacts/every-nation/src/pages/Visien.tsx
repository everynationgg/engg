import React, { useState } from "react";
import { useLocation } from "wouter";
import StudioLayout from "@/components/StudioLayout";
import EnosOrb, { OrbState } from "@/components/visien/EnosOrb";
import VisienChat from "@/components/visien/VisienChat";
import VisienSessionTracker from "@/components/visien/VisienSessionTracker";
import {
  FaRobot,
  FaSearch,
  FaInfoCircle,
  FaStore,
  FaMagic,
  FaArrowRight,
} from "react-icons/fa";

export default function VisienPage() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<"chat" | "tracker" | "about">("chat");
  const [orbState, setOrbState] = useState<OrbState>("idle");
  const [preloadedPrompt, setPreloadedPrompt] = useState<string | undefined>(undefined);

  const handleAskAboutProject = (appName: string) => {
    setActiveTab("chat");
    setPreloadedPrompt(`Can you give me a status update and breakdown for "${appName}"?`);
  };

  return (
    <StudioLayout>
      <div className="max-w-6xl 2xl:max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="flex flex-col items-center text-center mb-8 sm:mb-12">
          <div className="mb-4">
            <EnosOrb
              state={orbState}
              size={130}
              interactive={true}
              onClick={() => {
                const nextStates: OrbState[] = ["idle", "thinking", "speaking", "waiting"];
                const currIdx = nextStates.indexOf(orbState);
                setOrbState(nextStates[(currIdx + 1) % nextStates.length]);
              }}
            />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#7c3aed]/10 text-[#7c3aed] text-xs font-bold uppercase tracking-wider mb-2">
            <FaMagic className="text-amber-500 text-[11px]" />
            <span>Every Nation GG • AI Assistant Platform</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-neutral-900 mb-2">
            VISIEN
          </h1>
          <p className="text-sm sm:text-base font-semibold text-[#f97316] uppercase tracking-wider mb-3">
            Vision Inspired by Story and Idea
          </p>

          <p className="text-xs sm:text-sm text-neutral-600 max-w-2xl mx-auto leading-relaxed">
            Welcome to ENGG's intelligent client discovery and customer consultation system.
            Brainstorm custom application ideas, scope requirements for mobile APKs or web systems,
            and monitor live development milestones.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 mt-5">
            <a
              href="https://visien-gray.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-[#7c3aed] hover:bg-[#6d28d9] text-white px-5 py-2 rounded-full text-xs font-bold uppercase tracking-wider shadow-md hover:shadow-lg transition-all active:scale-95"
            >
              <FaRobot className="text-amber-300" />
              <span>Launch Official VISIEN Portal ↗</span>
            </a>
            <button
              onClick={() => setLocation("/marketplace")}
              className="inline-flex items-center gap-2 bg-neutral-900 hover:bg-neutral-800 text-white px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm transition-all active:scale-95"
            >
              <FaStore className="text-amber-400" />
              <span>Browse Marketplace & APKs</span>
            </button>
            <a
              href="https://discord.gg/everynation"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all"
            >
              <span>Join Studio Discord</span>
            </a>
          </div>
        </div>

        <div className="flex justify-center mb-6">
          <div className="bg-neutral-100/90 p-1 rounded-2xl flex items-center gap-1 shadow-inner max-w-md w-full">
            <button
              onClick={() => setActiveTab("chat")}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                activeTab === "chat"
                  ? "bg-white text-[#7c3aed] shadow-sm font-extrabold"
                  : "text-neutral-600 hover:text-neutral-900"
              }`}
            >
              <FaRobot className="w-3.5 h-3.5" />
              <span>AI Guide & Discovery</span>
            </button>

            <button
              onClick={() => setActiveTab("tracker")}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                activeTab === "tracker"
                  ? "bg-white text-[#7c3aed] shadow-sm font-extrabold"
                  : "text-neutral-600 hover:text-neutral-900"
              }`}
            >
              <FaSearch className="w-3.5 h-3.5" />
              <span>Live Build Tracker</span>
            </button>

            <button
              onClick={() => setActiveTab("about")}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                activeTab === "about"
                  ? "bg-white text-[#7c3aed] shadow-sm font-extrabold"
                  : "text-neutral-600 hover:text-neutral-900"
              }`}
            >
              <FaInfoCircle className="w-3.5 h-3.5" />
              <span>How We Build</span>
            </button>
          </div>
        </div>

        {activeTab === "chat" && (
          <div className="max-w-3xl mx-auto">
            <VisienChat
              onStateChange={(st) => setOrbState(st)}
              preloadedPrompt={preloadedPrompt}
            />
          </div>
        )}

        {activeTab === "tracker" && (
          <div className="max-w-3xl mx-auto">
            <VisienSessionTracker onAskAboutProject={handleAskAboutProject} />
          </div>
        )}

        {activeTab === "about" && (
          <div className="max-w-3xl mx-auto bg-white rounded-2xl border border-neutral-200/90 shadow-xl p-6 sm:p-8 space-y-6">
            <div>
              <h3 className="text-xl font-black text-neutral-900 mb-2">
                From Raw Idea to Production Application
              </h3>
              <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">
                At Every Nation GG, we engineer custom software, mobile APKs, and interactive platforms.
                Here is our step-by-step process:
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex gap-4 p-4 rounded-xl bg-purple-50/60 border border-purple-100">
                <div className="w-8 h-8 rounded-full bg-[#7c3aed] text-white flex items-center justify-center font-bold text-xs shrink-0">
                  1
                </div>
                <div>
                  <h4 className="text-sm font-bold text-neutral-900">1. Discovery with VISIEN</h4>
                  <p className="text-xs text-neutral-600 mt-0.5">
                    We map out your core audience, workflows, and must-have features. VISIEN synthesizes this into an actionable engineering blueprint.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 p-4 rounded-xl bg-amber-50/60 border border-amber-100">
                <div className="w-8 h-8 rounded-full bg-[#f97316] text-white flex items-center justify-center font-bold text-xs shrink-0">
                  2
                </div>
                <div>
                  <h4 className="text-sm font-bold text-neutral-900">2. Interactive Prototyping & UX</h4>
                  <p className="text-xs text-neutral-600 mt-0.5">
                    We design clean, intuitive, modern interfaces tailored to your brand identity, testing touch targets and mobile ergonomics.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 p-4 rounded-xl bg-blue-50/60 border border-blue-100">
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                  3
                </div>
                <div>
                  <h4 className="text-sm font-bold text-neutral-900">3. Mobile APK & Web Packaging</h4>
                  <p className="text-xs text-neutral-600 mt-0.5">
                    We compile standalone Android APKs for direct sideloading or internal distribution, alongside production web deployment.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 p-4 rounded-xl bg-emerald-50/60 border border-emerald-100">
                <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                  4
                </div>
                <div>
                  <h4 className="text-sm font-bold text-neutral-900">4. Live Tracker & Milestone Delivery</h4>
                  <p className="text-xs text-neutral-600 mt-0.5">
                    You receive a private session token to watch live milestone deliverables, download test APK builds, and submit feedback.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-neutral-200 flex flex-wrap items-center justify-between gap-3">
              <button
                onClick={() => setActiveTab("chat")}
                className="bg-[#7c3aed] hover:bg-[#6d28d9] text-white px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-sm active:scale-95 flex items-center gap-2"
              >
                <span>Start Project Discovery</span>
                <FaArrowRight className="text-xs" />
              </button>

              <button
                onClick={() => setLocation("/marketplace")}
                className="text-neutral-700 hover:text-neutral-900 font-bold text-xs flex items-center gap-1.5"
              >
                <span>Check Marketplace Apps</span>
                <FaArrowRight className="text-xs" />
              </button>
            </div>
          </div>
        )}
      </div>
    </StudioLayout>
  );
}

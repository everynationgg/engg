import React from "react";
import { useLocation } from "wouter";
import StudioLayout from "@/components/StudioLayout";
import { FaArrowLeft, FaCompass, FaEye, FaGamepad, FaCheckCircle } from "react-icons/fa";

export default function MissionVision() {
  const [, setLocation] = useLocation();

  const principles = [
    {
      title: "Craft Over Hype",
      desc: "We focus on responsive gameplay, clear user interfaces, and reliable engineering rather than buzzwords or bloated features.",
    },
    {
      title: "Tailored to Real Needs",
      desc: "Every game mode and client application is shaped around the people actually using it—from small teams to global lobbies.",
    },
    {
      title: "Accessible Across Devices",
      desc: "Our games and web tools are designed to run smoothly across desktop browsers, mobile web, and Android devices.",
    },
    {
      title: "Community Connected",
      desc: "We build in the open with our players and clients, shipping continuous improvements backed by direct feedback.",
    },
  ];

  return (
    <StudioLayout>
      <div className="py-14 sm:py-20 max-w-5xl mx-auto px-6">
        {/* Category Pill */}
        <div className="flex items-center gap-2 mb-4">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#7c3aed] bg-[#7c3aed]/10 px-3 py-1 rounded-full">
            ABOUT EVERY NATION
          </span>
          <span className="text-xs text-neutral-400">•</span>
          <span className="text-xs font-semibold text-neutral-500">Part 3 of 3</span>
        </div>

        {/* Page Title */}
        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-neutral-900 leading-tight mb-4">
          MISSION AND VISION
        </h1>
        <p className="text-xl sm:text-2xl font-medium text-[#7c3aed] leading-snug mb-12">
          Built for Players. Engineered to Last.
        </p>

        {/* Mission Card */}
        <div className="bg-[#f5f5f7] rounded-3xl p-8 sm:p-12 border border-neutral-200/80 shadow-xs mb-10">
          <div className="flex items-center gap-4 mb-6 pb-6 border-b border-neutral-200/80">
            <div className="w-12 h-12 rounded-2xl bg-[#7c3aed] text-white flex items-center justify-center text-xl shrink-0">
              <FaCompass />
            </div>
            <div>
              <span className="text-[11px] font-bold tracking-wider text-[#7c3aed] uppercase">
                Our Purpose
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 tracking-tight">
                OUR MISSION
              </h2>
            </div>
          </div>

          <div className="space-y-5 text-base sm:text-lg text-neutral-800 leading-relaxed">
            <p className="font-semibold text-neutral-900 text-lg sm:text-xl leading-relaxed">
              To create memorable multiplayer games, welcoming player communities, and dependable custom software that help people connect, play, and get real work done.
            </p>
            <p className="text-neutral-700">
              Whether we are shipping a new role update for <em>Errant Night</em> or building a custom web application for a partner business, our standard is the same: understand the goal clearly, engineer it cleanly, and make the experience effortless for the end user.
            </p>
          </div>
        </div>

        {/* Vision Card */}
        <div className="bg-neutral-900 text-white rounded-3xl p-8 sm:p-12 shadow-md mb-12">
          <div className="flex items-center gap-4 mb-6 pb-6 border-b border-neutral-800">
            <div className="w-12 h-12 rounded-2xl bg-white/10 text-[#7c3aed] border border-white/10 flex items-center justify-center text-xl shrink-0">
              <FaEye />
            </div>
            <div>
              <span className="text-[11px] font-bold tracking-wider text-purple-300 uppercase">
                Long-Term Horizon
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                OUR VISION
              </h2>
            </div>
          </div>

          <div className="space-y-5 text-base sm:text-lg text-neutral-300 leading-relaxed">
            <p className="font-medium text-white text-lg sm:text-xl leading-relaxed">
              To grow Every Nation into a trusted independent studio known for original multiplayer games and high-craft custom software—serving players, creators, and businesses of every size without losing our personal touch.
            </p>
            <p>
              As our catalog of games and client software expands, we remain committed to keeping our games accessible, our engineering transparent, and our community at the center of everything we ship.
            </p>
          </div>
        </div>

        {/* Studio Principles */}
        <div className="mb-14">
          <h3 className="text-xl sm:text-2xl font-extrabold text-neutral-900 tracking-tight mb-6">
            STUDIO PRINCIPLES
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {principles.map((p) => (
              <div
                key={p.title}
                className="bg-white rounded-2xl p-6 border border-neutral-200/90 shadow-2xs flex items-start gap-3.5"
              >
                <FaCheckCircle className="text-[#7c3aed] w-5 h-5 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-neutral-900 text-base mb-1">{p.title}</h4>
                  <p className="text-sm text-neutral-600 leading-relaxed">{p.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Page Switcher Navigation */}
        <div className="border-t border-neutral-200 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <button
            onClick={() => {
              setLocation("/about/what-we-do");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-3 bg-white hover:bg-neutral-100 text-neutral-800 border border-neutral-200 px-6 py-3 rounded-full text-sm font-semibold transition-all shadow-xs active:scale-95 cursor-pointer"
          >
            <FaArrowLeft className="w-3.5 h-3.5" />
            <span>Back to What We Do</span>
          </button>

          <button
            onClick={() => {
              setLocation("/hub");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-3 bg-[#7c3aed] hover:bg-[#6d28d9] text-white px-6 py-3 rounded-full text-sm font-semibold transition-all shadow-sm active:scale-95 cursor-pointer"
          >
            <FaGamepad className="w-4 h-4" />
            <span>Explore Game Hub</span>
          </button>
        </div>
      </div>
    </StudioLayout>
  );
}

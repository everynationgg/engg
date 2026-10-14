import React from "react";
import { useLocation } from "wouter";
import StudioLayout from "@/components/StudioLayout";
import { FaArrowLeft, FaCompass, FaEye } from "react-icons/fa";

export default function MissionVision() {
  const [, setLocation] = useLocation();

  return (
    <StudioLayout>
      <div className="py-16 sm:py-24 max-w-5xl mx-auto px-6">
        {/* Category Pill */}
        <div className="flex items-center gap-2 mb-4">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#7c3aed] bg-[#7c3aed]/10 px-3 py-1 rounded-full">
            ABOUT EVERY NATION GG
          </span>
          <span className="text-xs text-neutral-400">•</span>
          <span className="text-xs font-semibold text-neutral-500">Part 3</span>
        </div>

        {/* Page Title */}
        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-neutral-900 leading-tight mb-4">
          MISSION AND VISION
        </h1>
        <p className="text-xl sm:text-2xl font-medium text-[#7c3aed] leading-snug mb-12">
          Purpose-Driven Innovation. Grounded in Long-Term Value.
        </p>

        {/* Mission Card */}
        <div className="bg-[#f5f5f7] rounded-3xl p-8 sm:p-12 border border-neutral-200/80 shadow-xs mb-10">
          <div className="flex items-center gap-4 mb-6 pb-6 border-b border-neutral-200/80">
            <div className="w-12 h-12 rounded-2xl bg-[#7c3aed] text-white flex items-center justify-center text-xl shrink-0">
              <FaCompass />
            </div>
            <div>
              <span className="text-[11px] font-bold tracking-wider text-[#7c3aed] uppercase">
                Guiding Purpose
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 tracking-tight">
                OUR MISSION
              </h2>
            </div>
          </div>

          <div className="space-y-6 text-base sm:text-lg text-neutral-800 leading-relaxed">
            <p className="font-semibold text-neutral-900 text-lg sm:text-xl leading-relaxed">
              To make technology accessible, reliable, and deeply personal by creating customizable digital products, intelligent tools, and bespoke IT services that empower individuals, businesses, and communities. Through innovation, practical problem-solving, and meaningful relationships, we transform ideas into useful solutions tailored to the people who use them.
            </p>
            <p className="text-neutral-700">
              We strive to provide technology that serves a purpose, adapts to different needs, and creates meaningful value. Whether developing our own products or working toward a customized solution for a client, we aim to understand the problem, explore what is possible, and build something that makes a difference.
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

          <div className="space-y-6 text-base sm:text-lg text-neutral-300 leading-relaxed">
            <p className="font-medium text-white text-lg sm:text-xl leading-relaxed">
              To become a trusted, all-in-one technology ecosystem connecting gaming, artificial intelligence, digital products, services, and community—growing from our beginnings as a small business into a technology partner capable of serving organizations of every scale without leaving individuals and smaller businesses behind.
            </p>
            <p>
              We envision an ENGG that continues to expand its products, capabilities, and reach while remaining grounded in accessibility, reliability, customization, and personal connection. As technology evolves and new opportunities emerge, we aspire to build solutions that help people and businesses move forward, regardless of where they begin or how large they become.
            </p>
            <p>
              Our long-term ambition is to establish ENGG as a dependable destination for people seeking information technology, practical digital tools, customized services, and new experiences. We want to build products that stand on their own, provide services that respond to real needs, and foster a community that grows alongside the ecosystem.
            </p>
            <p>
              Growth should not mean leaving our foundations behind. It should mean gaining the ability to serve more people, solve more complex problems, and create greater value while preserving the personal touch that defines our approach.
            </p>
            <p className="font-semibold text-white pt-2">
              We want to build technology that grows with people, adapts to their needs, and makes more possible.
            </p>
          </div>
        </div>

        {/* Page Switcher Navigation */}
        <div className="border-t border-neutral-200 pt-8 flex items-center justify-between">
          <button
            onClick={() => {
              setLocation("/about/what-we-do");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className="inline-flex items-center justify-center gap-3 bg-white hover:bg-neutral-100 text-neutral-800 border border-neutral-200 px-6 py-3 rounded-full text-sm font-semibold transition-all shadow-xs active:scale-95"
          >
            <FaArrowLeft className="w-3.5 h-3.5" />
            <span>Back to What We Do</span>
          </button>
        </div>
      </div>
    </StudioLayout>
  );
}

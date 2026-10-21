import React from "react";
import { useLocation } from "wouter";
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
} from "react-icons/fa";

export default function WhatWeDo() {
  const [, setLocation] = useLocation();

  const capabilities = [
    {
      id: "games",
      num: "01",
      title: "ORIGINAL MULTIPLAYER GAMES",
      icon: FaGamepad,
      summary: "Real-time social deduction and tactical browser & mobile games.",
      paragraphs: [
        "We design, build, and host original multiplayer games backed by our own low-latency Socket.IO engine. Our flagship title, Errant Night, pits a deep-space crew against a hidden Alien impostor across tense night-action and emergency-voting phases.",
        "Alongside Errant Night, we develop tactical browser games like Engraved Nether and maintain a unified player profile system so your account, friends list, match stats, and credits carry across our releases.",
      ],
      cta: {
        label: "Play Errant Night",
        action: () => launchErrantNight(),
        secondaryLabel: "Open Game Hub",
        secondaryAction: () => setLocation("/hub"),
      },
    },
    {
      id: "software",
      num: "02",
      title: "CUSTOM WEB & MOBILE ENGINEERING",
      icon: FaLaptopCode,
      summary: "Production web apps, business portals, and native Android builds.",
      paragraphs: [
        "Not every business or creator fits inside an off-the-shelf template. We partner with clients to design and engineer custom web applications, customer portals, booking & inventory systems, and Android APK builds tailored to how they actually work.",
        "Our stack centers on modern, battle-tested technologies—React, TypeScript, Node.js, PostgreSQL, Drizzle ORM, and Capacitor—delivering fast load times, clean interfaces, and maintainable architecture.",
      ],
      cta: {
        label: "Browse Marketplace",
        action: () => setLocation("/marketplace"),
      },
    },
    {
      id: "scoping",
      num: "03",
      title: "PROJECT SCOPING & ARCHITECTURE STUDIO",
      icon: FaLayerGroup,
      summary: "Turn product ideas into clear technical specs, milestones, and roadmaps.",
      paragraphs: [
        "Software projects succeed when the scope is clear before a single line of production code is written. Through our interactive Project Studio, we help founders and teams map out user flows, select the right technical architecture, and break builds into transparent milestones.",
        "Clients can review specifications, track active development chapters, and collaborate directly with our engineering team from prototype to launch.",
      ],
      cta: {
        label: "Open Project Studio",
        action: () => window.open(PROJECT_STUDIO_URL, "_blank", "noopener,noreferrer"),
        isExternal: true,
      },
    },
    {
      id: "community",
      num: "04",
      title: "PLAYER COMMUNITY & LIVE EVENTS",
      icon: FaUsers,
      summary: "Active Discord lobbies, playtests, and community-driven updates.",
      paragraphs: [
        "Games and digital tools are always better when built alongside an active community. Our Discord server and in-platform friend system connect players for custom lobbies, weekend tournaments, and early feature playtests.",
        "Player feedback directly shapes our balance patches, new role designs, and quality-of-life updates.",
      ],
      cta: {
        label: "Join Our Discord",
        action: () => window.open(DISCORD_INVITE_URL, "_blank", "noopener,noreferrer"),
        isExternal: true,
      },
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
          <span className="text-xs font-semibold text-neutral-500">Part 2 of 3</span>
        </div>

        {/* Page Title & Tagline */}
        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-neutral-900 leading-tight mb-4">
          WHAT WE DO
        </h1>
        <p className="text-xl sm:text-2xl font-medium text-[#7c3aed] leading-snug mb-8">
          Multiplayer Games, Custom Software, and Community Tools.
        </p>

        {/* Intro */}
        <div className="space-y-4 text-base sm:text-lg text-neutral-700 leading-relaxed max-w-4xl border-b border-neutral-200 pb-12 mb-12">
          <p>
            Every Nation operates at the intersection of interactive entertainment and custom software engineering. The same real-time engineering discipline that keeps our multiplayer game servers responsive powers the web and mobile applications we build for clients.
          </p>
        </div>

        {/* 4 Core Studio Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          {capabilities.map((cap) => {
            const Icon = cap.icon;
            return (
              <div
                key={cap.id}
                className="bg-[#f5f5f7] rounded-3xl p-8 border border-neutral-200/80 shadow-xs hover:border-[#7c3aed]/30 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-4 mb-5 pb-5 border-b border-neutral-200/80">
                    <div className="w-12 h-12 rounded-2xl bg-[#7c3aed]/15 text-[#7c3aed] flex items-center justify-center text-xl shrink-0">
                      <Icon />
                    </div>
                    <div>
                      <span className="text-[11px] font-bold tracking-wider text-[#7c3aed] uppercase">
                        Pillar {cap.num}
                      </span>
                      <h2 className="text-lg sm:text-xl font-extrabold text-neutral-900 tracking-tight">
                        {cap.title}
                      </h2>
                    </div>
                  </div>

                  <p className="text-sm font-semibold text-neutral-900 mb-3">
                    {cap.summary}
                  </p>

                  <div className="space-y-3 text-sm text-neutral-700 leading-relaxed mb-6">
                    {cap.paragraphs.map((p, idx) => (
                      <p key={idx}>{p}</p>
                    ))}
                  </div>
                </div>

                {cap.cta && (
                  <div className="pt-4 border-t border-neutral-200/80 flex flex-wrap items-center gap-2.5">
                    <button
                      onClick={cap.cta.action}
                      className="inline-flex items-center gap-2 text-xs font-bold text-white bg-[#7c3aed] hover:bg-[#6d28d9] px-4 py-2.5 rounded-full transition-colors cursor-pointer"
                    >
                      <span>{cap.cta.label}</span>
                      {cap.cta.isExternal ? (
                        <FaExternalLinkAlt className="w-2.5 h-2.5" />
                      ) : (
                        <FaArrowRight className="w-2.5 h-2.5" />
                      )}
                    </button>
                    {cap.cta.secondaryLabel && cap.cta.secondaryAction && (
                      <button
                        onClick={cap.cta.secondaryAction}
                        className="inline-flex items-center gap-2 text-xs font-bold text-neutral-700 bg-white hover:bg-neutral-100 border border-neutral-200 px-4 py-2.5 rounded-full transition-colors cursor-pointer"
                      >
                        <span>{cap.cta.secondaryLabel}</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Page Switcher Navigation */}
        <div className="border-t border-neutral-200 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <button
            onClick={() => {
              setLocation("/about/who-we-are");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-3 bg-white hover:bg-neutral-100 text-neutral-800 border border-neutral-200 px-6 py-3 rounded-full text-sm font-semibold transition-all shadow-xs active:scale-95 cursor-pointer"
          >
            <FaArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Who We Are</span>
          </button>

          <button
            onClick={() => {
              setLocation("/about/mission-and-vision");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-3 bg-[#7c3aed] hover:bg-[#6d28d9] text-white px-6 py-3 rounded-full text-sm font-semibold transition-all shadow-sm active:scale-95 cursor-pointer"
          >
            <span>Continue to Mission &amp; Vision</span>
            <FaArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </StudioLayout>
  );
}

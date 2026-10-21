import React from "react";
import { useLocation } from "wouter";
import StudioLayout from "@/components/StudioLayout";
import { FaArrowRight, FaUsers, FaGamepad, FaCode, FaComments } from "react-icons/fa";

export default function WhoWeAre() {
  const [, setLocation] = useLocation();

  const studioHighlights = [
    {
      icon: FaGamepad,
      title: "Original Multiplayer Games",
      desc: "We design and operate real-time social and tactical games like Errant Night and Engraved Nether—built for browser and Android play.",
    },
    {
      icon: FaComments,
      title: "Player-First Community",
      desc: "Every Nation started with players. Our Discord and Game Hub bring friends together for nightly lobbies, playtests, and community events.",
    },
    {
      icon: FaCode,
      title: "Custom Software Engineering",
      desc: "Alongside our games, we partner with founders, creators, and businesses to design and ship dependable custom web and mobile software.",
    },
  ];

  return (
    <StudioLayout>
      <div className="py-14 sm:py-20 max-w-5xl mx-auto px-6">
        {/* Breadcrumb / Category Tag */}
        <div className="flex items-center gap-2 mb-4">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#7c3aed] bg-[#7c3aed]/10 px-3 py-1 rounded-full">
            ABOUT EVERY NATION
          </span>
          <span className="text-xs text-neutral-400">•</span>
          <span className="text-xs font-semibold text-neutral-500">Part 1 of 3</span>
        </div>

        {/* Page Title & Subtitle */}
        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-neutral-900 leading-tight mb-4">
          WHO WE ARE
        </h1>
        <p className="text-xl sm:text-2xl font-medium text-[#7c3aed] leading-snug mb-10">
          An Independent Game Studio, Player Community, and Software Team.
        </p>

        {/* Core Narrative */}
        <div className="space-y-6 text-base sm:text-lg text-neutral-700 leading-relaxed max-w-4xl mb-12">
          <p className="text-lg sm:text-xl font-normal text-neutral-900 leading-relaxed">
            Every Nation (ENGG) began with a simple conviction: great games and great software come from teams that actually care about the people using them.
          </p>

          <p>
            What started as a close-knit gaming community has grown into an independent studio where we build our own multiplayer titles—such as <strong>Errant Night</strong>, our real-time sci-fi social deduction game, and <strong>Engraved Nether</strong>, our tactical grid card battler—while also engineering custom web and mobile applications for clients.
          </p>

          <p>
            We don&apos;t believe in forcing players or businesses into cookie-cutter templates. Whether we are tuning hidden-role balance for a ten-player lobby or architecting a custom web portal for a growing business, we focus on clean design, fast performance, and software that feels tailor-made for its purpose.
          </p>
        </div>

        {/* 3 Core Pillars Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-16 border-b border-neutral-200">
          {studioHighlights.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className="bg-[#f5f5f7] rounded-2xl p-6 border border-neutral-200/80"
              >
                <div className="w-10 h-10 rounded-xl bg-[#7c3aed]/15 text-[#7c3aed] flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-neutral-900 mb-2">{item.title}</h3>
                <p className="text-sm text-neutral-600 leading-relaxed">{item.desc}</p>
              </div>
            );
          })}
        </div>

        {/* The People Behind Every Nation */}
        <div className="pt-16 pb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-[#7c3aed]/15 text-[#7c3aed] flex items-center justify-center font-bold text-sm">
              <FaUsers className="w-4 h-4" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 tracking-tight">
              THE FOUNDERS
            </h2>
          </div>
          <p className="text-neutral-500 text-sm sm:text-base mb-10 max-w-2xl">
            Product direction and hands-on engineering working side by side from concept to release.
          </p>

          {/* Leaders Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            {/* Yog Card */}
            <div className="bg-[#f5f5f7] rounded-3xl p-8 border border-neutral-200/80 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-neutral-900 text-white flex items-center justify-center font-bold text-lg">
                    Y
                  </div>
                  <span className="text-[11px] font-bold tracking-wider uppercase text-[#7c3aed] bg-[#7c3aed]/10 px-3 py-1 rounded-full">
                    Founder &amp; Product Lead
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-neutral-900 mb-1">Yog</h3>
                <p className="text-sm font-semibold text-neutral-500 mb-6">
                  Game Design, Product Direction &amp; Studio Strategy
                </p>

                <div className="space-y-4 text-sm text-neutral-700 leading-relaxed">
                  <p>
                    Yog leads product vision, game design, and user experience across Every Nation. From designing the core social deduction mechanics and role interactions in <em>Errant Night</em> to scoping custom client applications, Yog focuses on how every screen, rule, and workflow feels in the hands of real users.
                  </p>
                  <p>
                    Rather than settling for generic templates, Yog works closely with players and clients to define what makes a project worth building—ensuring that our games stay tense and replayable, and our client software solves real operational problems cleanly.
                  </p>
                </div>
              </div>
            </div>

            {/* Meowi Card */}
            <div className="bg-[#f5f5f7] rounded-3xl p-8 border border-neutral-200/80 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#7c3aed] text-white flex items-center justify-center font-bold text-lg">
                    M
                  </div>
                  <span className="text-[11px] font-bold tracking-wider uppercase text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                    Co-Founder &amp; Lead Engineer
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-neutral-900 mb-1">Meowi</h3>
                <p className="text-sm font-semibold text-neutral-500 mb-6">
                  Full-Stack Architecture, Multiplayer Systems &amp; Mobile Builds
                </p>

                <div className="space-y-4 text-sm text-neutral-700 leading-relaxed">
                  <p>
                    Meowi architects the engineering foundations that power Every Nation&apos;s games and software. Working across React, TypeScript, Node.js, Socket.IO, PostgreSQL, and Android Capacitor, Meowi turns game rules and product blueprints into fast, resilient production systems.
                  </p>
                  <p>
                    From real-time multiplayer state synchronization and reconnection handling to database design and mobile APK packaging, Meowi ensures that everything the studio designs is built on solid, maintainable code.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Closing Banner */}
          <div className="bg-neutral-900 text-white rounded-3xl p-8 sm:p-10">
            <h4 className="text-lg sm:text-xl font-bold mb-2 text-neutral-100">
              Built for the Long Run
            </h4>
            <p className="text-neutral-300 text-sm sm:text-base leading-relaxed">
              Every Nation is an active, shipping studio. We iterate openly with our community, ship regular game updates, and take pride in building software that stands up to real-world use.
            </p>
          </div>
        </div>

        {/* Page Switcher / Next Card */}
        <div className="border-t border-neutral-200 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-sm text-neutral-500">
            Next in About Every Nation:
          </div>
          <button
            onClick={() => {
              setLocation("/about/what-we-do");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-3 bg-[#7c3aed] hover:bg-[#6d28d9] text-white px-6 py-3 rounded-full text-sm font-semibold transition-all shadow-sm active:scale-95 cursor-pointer"
          >
            <span>Continue to What We Do</span>
            <FaArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </StudioLayout>
  );
}

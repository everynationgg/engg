import React from "react";
import { useLocation } from "wouter";
import StudioLayout from "@/components/StudioLayout";
import {
  FaArrowLeft,
  FaArrowRight,
  FaLaptopCode,
  FaServer,
  FaRobot,
  FaGamepad,
  FaTools,
  FaUsers,
  FaSlidersH,
  FaExternalLinkAlt,
} from "react-icons/fa";

export default function WhatWeDo() {
  const [, setLocation] = useLocation();

  const capabilities = [
    {
      id: "products",
      num: "01",
      title: "CUSTOM DIGITAL PRODUCTS AND PLATFORMS",
      icon: FaLaptopCode,
      paragraphs: [
        "We conceptualize and develop digital products designed around specific purposes, audiences, and experiences. These may include web applications, platforms, productivity tools, interactive systems, and other software products that help users accomplish more.",
        "We value thoughtful functionality, usability, and flexibility. Where appropriate, we go beyond generic implementations by building features, workflows, and experiences tailored to their intended users. Our own products also allow us to explore ideas, experiment with new capabilities, and improve the way we approach digital development.",
      ],
    },
    {
      id: "services",
      num: "02",
      title: "BESPOKE IT SERVICES AND SOLUTIONS",
      icon: FaServer,
      paragraphs: [
        "Not every problem can be solved by an off-the-shelf product. Individuals and businesses may need a custom workflow, specialized application, connected system, or digital solution built around how they operate.",
        "ENGG aims to serve these needs through bespoke technology services. We seek to understand project requirements and develop solutions that fit their purpose rather than forcing clients to reshape their processes around unsuitable tools.",
        "Our intended reach spans individuals, entrepreneurs, small businesses, growing organizations, and larger companies. As our capabilities expand, we aim to accommodate increasingly complex requirements while preserving the accessibility and personal attention smaller clients deserve.",
      ],
      highlight: {
        title: "VISIEN AI Discovery Platform",
        desc: "Turn ideas into architectural blueprints through AI-guided discovery.",
        link: "https://visien-gray.vercel.app/",
      },
    },
    {
      id: "ai",
      num: "03",
      title: "ARTIFICIAL INTELLIGENCE AND AUTOMATION",
      icon: FaRobot,
      paragraphs: [
        "Artificial intelligence creates opportunities to make technology more capable, responsive, and useful. ENGG explores AI-powered experiences and tools that can support users, streamline tasks, enhance digital products, and introduce new ways to interact with technology.",
        "We see AI as a practical capability rather than a feature added for novelty. Its value lies in how effectively it addresses a real need, improves an experience, or enables something that would otherwise be difficult to achieve.",
        "Automation can also reduce repetitive work, improve consistency, and help individuals and organizations use their time and resources more effectively. Our goal is to explore these technologies thoughtfully and integrate them where they provide meaningful benefits.",
      ],
    },
    {
      id: "gaming",
      num: "04",
      title: "GAMING AND INTERACTIVE EXPERIENCES",
      icon: FaGamepad,
      paragraphs: [
        "Gaming is an important part of the ENGG ecosystem. It brings together technology, creativity, entertainment, competition, and shared experiences that encourage people to participate and connect.",
        "Through gaming-related products, interactive systems, and community experiences, ENGG can combine software development with engagement and entertainment. These experiences also provide opportunities to explore progression systems, digital economies, AI-driven features, and other interactive concepts.",
        "Our interest extends beyond games themselves to the tools, systems, and communities that make gaming more engaging and accessible.",
      ],
    },
    {
      id: "tools",
      num: "05",
      title: "DIGITAL TOOLS AND PRACTICAL TECHNOLOGY",
      icon: FaTools,
      paragraphs: [
        "We aim to create tools that make digital tasks easier, address specific challenges, and provide useful capabilities. These tools may be standalone products or components of a larger platform, depending on the needs they are designed to meet.",
        "Useful technology does not always need to be complicated. Sometimes, the most valuable solution removes unnecessary steps, simplifies a process, or gives users more control over how they work.",
        "Our approach is to identify opportunities where thoughtful development can produce practical value, then build solutions that can evolve alongside the people who depend on them.",
      ],
    },
    {
      id: "community",
      num: "06",
      title: "COMMUNITY AND CONNECTED EXPERIENCES",
      icon: FaUsers,
      paragraphs: [
        "Technology is not only about what people use; it is also about how people connect. Community creates opportunities for shared experiences, collaboration, learning, and participation.",
        "We aim to develop environments where people can engage with our products, take part in gaming experiences, exchange ideas, and become part of something larger than an individual application or service.",
        "As the ecosystem grows, products, services, and community experiences can reinforce one another, creating a more connected relationship between ENGG and the people it serves.",
      ],
    },
    {
      id: "customization",
      num: "07",
      title: "CUSTOMIZATION AT THE CORE",
      icon: FaSlidersH,
      paragraphs: [
        "Across everything we do, customization remains a defining principle.",
        "We want to explore what is possible when products and services are shaped around real requirements rather than limited to fixed templates. This means considering individual preferences, specialized workflows, unique business needs, and features that make a solution more useful to its intended audience.",
        "The depth of customization depends on technical feasibility, resources, security requirements, and project scope. Within those considerations, our ambition is to push beyond standard solutions whenever doing so creates genuine value.",
        "We want ENGG to be a place people can turn to when existing tools are not enough, when an idea needs a technical foundation, or when a particular need calls for a more personal approach.",
      ],
    },
  ];

  return (
    <StudioLayout>
      <div className="py-16 sm:py-24 max-w-5xl mx-auto px-6">
        {/* Category Pill */}
        <div className="flex items-center gap-2 mb-4">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#7c3aed] bg-[#7c3aed]/10 px-3 py-1 rounded-full">
            ABOUT EVERY NATION GG
          </span>
          <span className="text-xs text-neutral-400">•</span>
          <span className="text-xs font-semibold text-neutral-500">Part 2</span>
        </div>

        {/* Page Title & Tagline */}
        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-neutral-900 leading-tight mb-4">
          WHAT WE DO
        </h1>
        <p className="text-xl sm:text-2xl font-medium text-[#7c3aed] leading-snug mb-8">
          One Ecosystem. Multiple Possibilities.
        </p>

        {/* Intro */}
        <div className="space-y-4 text-base sm:text-lg text-neutral-700 leading-relaxed max-w-4xl border-b border-neutral-200 pb-12 mb-12">
          <p>
            ENGG brings together technology, digital products, customized services, gaming, and community. Rather than limiting ourselves to a single category of technology, we aim to build an ecosystem where different capabilities can coexist, complement one another, and address a wide range of needs.
          </p>
          <p className="font-medium text-neutral-900">
            Our work begins with understanding the person or organization behind a need and determining how technology can provide a practical solution.
          </p>
        </div>

        {/* Capabilities Grid / List */}
        <div className="space-y-8 mb-16">
          {capabilities.map((cap) => {
            const Icon = cap.icon;
            return (
              <div
                key={cap.id}
                className="bg-[#f5f5f7] rounded-3xl p-8 sm:p-10 border border-neutral-200/80 shadow-xs hover:border-[#7c3aed]/30 transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-neutral-200/80">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-[#7c3aed]/15 text-[#7c3aed] flex items-center justify-center text-xl shrink-0">
                      <Icon />
                    </div>
                    <div>
                      <span className="text-[11px] font-bold tracking-wider text-[#7c3aed] uppercase">
                        Capability {cap.num}
                      </span>
                      <h2 className="text-xl sm:text-2xl font-extrabold text-neutral-900 tracking-tight">
                        {cap.title}
                      </h2>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 text-sm sm:text-base text-neutral-700 leading-relaxed">
                  {cap.paragraphs.map((p, idx) => (
                    <p key={idx}>{p}</p>
                  ))}
                </div>

                {/* Optional Highlight (VISIEN) */}
                {cap.highlight && (
                  <div className="mt-6 pt-6 border-t border-neutral-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white/70 rounded-2xl p-5 border border-purple-100">
                    <div>
                      <div className="text-xs font-bold uppercase tracking-wider text-[#7c3aed]">
                        {cap.highlight.title}
                      </div>
                      <div className="text-xs text-neutral-600 mt-0.5">
                        {cap.highlight.desc}
                      </div>
                    </div>
                    <a
                      href={cap.highlight.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-xs font-bold text-[#7c3aed] hover:underline whitespace-nowrap bg-[#7c3aed]/10 px-4 py-2 rounded-full transition-colors"
                    >
                      <span>Launch Discovery</span>
                      <FaExternalLinkAlt className="w-2.5 h-2.5" />
                    </a>
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
            className="w-full sm:w-auto inline-flex items-center justify-center gap-3 bg-white hover:bg-neutral-100 text-neutral-800 border border-neutral-200 px-6 py-3 rounded-full text-sm font-semibold transition-all shadow-xs active:scale-95"
          >
            <FaArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Who We Are</span>
          </button>

          <button
            onClick={() => {
              setLocation("/about/mission-and-vision");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-3 bg-[#7c3aed] hover:bg-[#6d28d9] text-white px-6 py-3 rounded-full text-sm font-semibold transition-all shadow-sm active:scale-95"
          >
            <span>Continue to Mission & Vision</span>
            <FaArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </StudioLayout>
  );
}

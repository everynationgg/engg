import React from "react";
import { useLocation } from "wouter";
import StudioLayout from "@/components/StudioLayout";
import { FaArrowRight, FaUsers, FaLightbulb, FaCogs, FaRocket } from "react-icons/fa";

export default function WhoWeAre() {
  const [, setLocation] = useLocation();

  return (
    <StudioLayout>
      <div className="py-16 sm:py-24 max-w-5xl mx-auto px-6">
        {/* Breadcrumb / Category Tag */}
        <div className="flex items-center gap-2 mb-4">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#7c3aed] bg-[#7c3aed]/10 px-3 py-1 rounded-full">
            ABOUT EVERY NATION GG
          </span>
          <span className="text-xs text-neutral-400">•</span>
          <span className="text-xs font-semibold text-neutral-500">Part 1</span>
        </div>

        {/* Page Title & Subtitle */}
        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-neutral-900 leading-tight mb-4">
          WHO WE ARE
        </h1>
        <p className="text-xl sm:text-2xl font-medium text-[#7c3aed] leading-snug mb-10">
          Built on Ideas. Driven by People. Powered by Technology.
        </p>

        {/* Core Narrative */}
        <div className="space-y-6 text-base sm:text-lg text-neutral-700 leading-relaxed max-w-4xl border-b border-neutral-200 pb-16">
          <p className="text-lg sm:text-xl font-normal text-neutral-900 leading-relaxed">
            Every Nation GG (ENGG) is a growing technology and digital innovation initiative built on the belief that technology should be personal, accessible, and adaptable to the people who use it.
          </p>

          <p>
            We see technology as more than software, applications, or digital tools. It is a way to bring ideas to life, solve everyday problems, create new opportunities, connect people, and build experiences that would otherwise remain possibilities. Through gaming, artificial intelligence, digital products, and customized IT solutions, our goal is to make technology work for people in ways that genuinely matter.
          </p>

          <p>
            ENGG brings together multiple areas of technology and digital experiences under one ecosystem. We develop our own products, explore emerging technologies, create tools that address practical needs, and provide personalized services for individuals and businesses. We also value the communities that grow around these experiences, recognizing that technology becomes more meaningful when it brings people together.
          </p>

          <p>
            At the heart of ENGG is a commitment to personalization. We do not believe every person, business, or organization should have to settle for the same solutions simply because they are readily available. Different people have different goals, workflows, preferences, and challenges. We want to create solutions that reflect those differences, with customization extending as far as our technical capabilities, resources, and each project's practical requirements allow.
          </p>

          <p>
            A small idea deserves thoughtful consideration just as much as a large-scale project. A solution does not need to serve thousands of users to be valuable, and a business does not need to be an enterprise to benefit from well-designed technology. As ENGG grows, we intend to expand our capabilities and reach without losing sight of individuals, smaller businesses, and communities.
          </p>

          <p className="font-medium text-neutral-900">
            ENGG is being built for the long term: to become a dependable technology partner, a creator of useful digital products, and a place where ideas can develop into real, working solutions.
          </p>
        </div>

        {/* The People Behind ENGG */}
        <div className="pt-16 pb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-[#7c3aed]/15 text-[#7c3aed] flex items-center justify-center font-bold text-sm">
              <FaUsers className="w-4 h-4" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 tracking-tight">
              THE PEOPLE BEHIND ENGG
            </h2>
          </div>
          <p className="text-neutral-500 text-sm sm:text-base mb-10 max-w-2xl">
            Two complementary sides of the same ambition: defining what should be built and working toward making it possible.
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
                    Founder & Vision Lead
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-neutral-900 mb-1">Yog</h3>
                <p className="text-sm font-semibold text-neutral-500 mb-6">
                  Founder & Vision Lead
                </p>

                <div className="space-y-4 text-sm text-neutral-700 leading-relaxed">
                  <p>
                    Yog is the mind behind ENGG's direction, concepts, and ambitions. Yog drives the vision, conceptualizes products and services, shapes user experiences, and determines how individual ideas can contribute to the wider ENGG ecosystem.
                  </p>
                  <p>
                    From imagining new digital experiences to defining how products should function and feel, Yog considers both the end user and the broader product vision. The objective is not simply to create something that works, but to understand why it should exist, who it should serve, and how it can deliver meaningful value.
                  </p>
                  <p>
                    Yog brings together creativity, strategic thinking, product planning, and a strong emphasis on customization. This approach challenges the team to look beyond conventional templates and explore what can be built when technology is shaped around a specific purpose.
                  </p>
                  <p className="font-medium text-neutral-900">
                    For Yog, ENGG is more than a collection of projects. It is an evolving ecosystem in which products, services, gaming, AI, and community can complement one another while maintaining a consistent philosophy: build with purpose, make technology personal, and leave room for ideas to become more than they were initially imagined to be.
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
                    Technical Partner
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-neutral-900 mb-1">Meowi</h3>
                <p className="text-sm font-semibold text-neutral-500 mb-6">
                  Technical Partner
                </p>

                <div className="space-y-4 text-sm text-neutral-700 leading-relaxed">
                  <p>
                    Meowi is the technical partner who helps transform ENGG's ideas and concepts into functioning digital experiences. Working alongside Yog, Meowi contributes to the development and implementation that turn plans into practical products, tools, and services.
                  </p>
                  <p>
                    Ideas require more than imagination to become reality. They need technical foundations, thoughtful implementation, problem-solving, and a willingness to work through the challenges of building digital systems. Meowi helps bridge the gap between what ENGG envisions and what can be delivered.
                  </p>
                  <p>
                    As ENGG develops its products and expands its capabilities, this technical partnership supports the process of translating concepts into usable technology and refining solutions in response to changing requirements and new opportunities.
                  </p>
                  <p className="font-medium text-neutral-900">
                    Together, Yog and Meowi represent two complementary sides of the same ambition: defining what should be built and working toward making it possible. Their collaboration provides the foundation for ENGG to develop its own products, serve clients, explore emerging technologies, and pursue a broader vision.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Collaborative Closing Statement */}
          <div className="bg-neutral-900 text-white rounded-3xl p-8 sm:p-10 mb-12">
            <h4 className="text-lg sm:text-xl font-bold mb-3 text-neutral-100">
              An Evolving Digital Ecosystem
            </h4>
            <p className="text-neutral-300 text-sm sm:text-base leading-relaxed">
              ENGG remains a work in progress by design. Its identity is shaped not only by what has already been created, but also by the ideas, lessons, and opportunities that will influence what comes next.
            </p>
          </div>
        </div>

        {/* Page Switcher / Next Card */}
        <div className="border-t border-neutral-200 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-sm text-neutral-500">
            Next in About Every Nation GG:
          </div>
          <button
            onClick={() => {
              setLocation("/about/what-we-do");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-3 bg-[#7c3aed] hover:bg-[#6d28d9] text-white px-6 py-3 rounded-full text-sm font-semibold transition-all shadow-sm active:scale-95"
          >
            <span>Continue to What We Do</span>
            <FaArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </StudioLayout>
  );
}

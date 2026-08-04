import React from "react";
import { useLocation } from "wouter";
import StudioLayout from "@/components/StudioLayout";

export default function About() {
  const [, setLocation] = useLocation();

  return (
    <StudioLayout>
      <section className="py-24 max-w-4xl mx-auto px-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-100 border border-neutral-200/80 mb-6 text-xs font-medium text-neutral-700">
          About ENGG Studio
        </div>

        <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-neutral-900 leading-tight mb-8">
          An independent software development & engineering studio.
        </h1>

        <p className="text-xl text-neutral-600 leading-relaxed mb-12">
          ENGG builds custom web applications, high-converting websites, real-time systems, and specialized digital tools. We partner directly with founders and companies to ship clean, production-ready code.
        </p>

        <div className="space-y-12 border-t border-neutral-200 pt-12">
          <div>
            <h2 className="text-2xl font-bold text-neutral-900 mb-3">Our Core Engineering Principles</h2>
            <p className="text-neutral-600 leading-relaxed text-base mb-6">
              We do not delegate work to non-technical project managers or hide behind agency bureaucracy. You collaborate directly with lead engineers who write, test, and deploy your software.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-[#f5f5f7] rounded-2xl p-6 border border-neutral-200/80">
              <h3 className="text-lg font-bold text-neutral-900 mb-2">1. Zero Code Bloat</h3>
              <p className="text-sm text-neutral-600 leading-relaxed">
                We build with modern React, TypeScript, and native CSS. We keep bundle sizes small so your web app loads under 100ms.
              </p>
            </div>

            <div className="bg-[#f5f5f7] rounded-2xl p-6 border border-neutral-200/80">
              <h3 className="text-lg font-bold text-neutral-900 mb-2">2. Direct Communication</h3>
              <p className="text-sm text-neutral-600 leading-relaxed">
                No account managers or telephone games. You communicate directly with the engineers designing and coding your platform.
              </p>
            </div>

            <div className="bg-[#f5f5f7] rounded-2xl p-6 border border-neutral-200/80">
              <h3 className="text-lg font-bold text-neutral-900 mb-2">3. 100% Code Ownership</h3>
              <p className="text-sm text-neutral-600 leading-relaxed">
                You own all code, repositories, and assets upon completion. We provide automated CI/CD pipelines and full handover docs.
              </p>
            </div>

            <div className="bg-[#f5f5f7] rounded-2xl p-6 border border-neutral-200/80">
              <h3 className="text-lg font-bold text-neutral-900 mb-2">4. Production Security</h3>
              <p className="text-sm text-neutral-600 leading-relaxed">
                JWT auth, bcrypt password hashing, HSTS strict security headers, sanitized APIs, and automated SSL configurations.
              </p>
            </div>
          </div>

          <div className="bg-neutral-900 text-white rounded-3xl p-8 sm:p-12 text-center mt-16">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4">Ready to build your next web application?</h2>
            <p className="text-neutral-400 text-base max-w-xl mx-auto mb-8">
              Tell us about your project requirements and we will provide an architectural scope within 24 hours.
            </p>
            <button
              onClick={() => setLocation("/contact")}
              className="bg-white text-neutral-900 hover:bg-neutral-100 rounded-full px-8 py-3 text-base font-medium transition-all shadow active:scale-95"
            >
              Start a Project
            </button>
          </div>
        </div>
      </section>
    </StudioLayout>
  );
}

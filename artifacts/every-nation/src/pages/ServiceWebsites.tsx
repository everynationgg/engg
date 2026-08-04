import React from "react";
import { useLocation } from "wouter";
import StudioLayout from "@/components/StudioLayout";

export default function ServiceWebsites() {
  const [, setLocation] = useLocation();

  return (
    <StudioLayout>
      <section className="py-24 max-w-4xl mx-auto px-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-100 border border-neutral-200/80 mb-6 text-xs font-medium text-neutral-700">
          Service Deep Dive // 01
        </div>

        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-neutral-900 leading-tight mb-6">
          Bespoke Websites & High-Impact Landing Pages
        </h1>

        <p className="text-xl text-neutral-600 leading-relaxed mb-12">
          We design and build fast, responsive websites for product launches, corporate brand presence, and high conversion.
        </p>

        <div className="space-y-12 border-t border-neutral-200 pt-12">
          <div>
            <h2 className="text-2xl font-bold text-neutral-900 mb-4">What We Build</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="bg-[#f5f5f7] p-6 rounded-2xl border border-neutral-200/80">
                <h3 className="font-bold text-neutral-900 mb-2">Product Launch Landing Pages</h3>
                <p className="text-xs text-neutral-600 leading-relaxed">
                  High-converting single-page and multi-page sites designed to showcase your SaaS or software product.
                </p>
              </div>
              <div className="bg-[#f5f5f7] p-6 rounded-2xl border border-neutral-200/80">
                <h3 className="font-bold text-neutral-900 mb-2">Corporate Brand Sites</h3>
                <p className="text-xs text-neutral-600 leading-relaxed">
                  Apple-grade corporate websites with responsive typography, clear hierarchy, and fast page loads.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-neutral-900 text-white rounded-3xl p-8 text-center">
            <h3 className="text-2xl font-bold mb-3">Need a website for your company or product?</h3>
            <p className="text-neutral-400 text-sm mb-6 max-w-lg mx-auto">
              Get an instant scope and timeline estimate using our interactive builder tool.
            </p>
            <button
              onClick={() => setLocation("/estimate")}
              className="bg-white text-neutral-900 hover:bg-neutral-100 rounded-full px-6 py-2.5 text-sm font-medium transition-all"
            >
              Open Builder Tool
            </button>
          </div>
        </div>
      </section>
    </StudioLayout>
  );
}

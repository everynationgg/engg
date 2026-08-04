import React from "react";
import { useLocation } from "wouter";
import StudioLayout from "@/components/StudioLayout";

export default function ServiceWebApps() {
  const [, setLocation] = useLocation();

  return (
    <StudioLayout>
      <section className="py-24 max-w-4xl mx-auto px-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-100 border border-neutral-200/80 mb-6 text-xs font-medium text-neutral-700">
          Service Deep Dive // 02
        </div>

        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-neutral-900 leading-tight mb-6">
          Custom Web Applications & SaaS Platforms
        </h1>

        <p className="text-xl text-neutral-600 leading-relaxed mb-12">
          We engineer full-stack web applications, SaaS products, client portals, and internal business tools using React, Node.js, and PostgreSQL.
        </p>

        <div className="space-y-12 border-t border-neutral-200 pt-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="bg-[#f5f5f7] p-6 rounded-2xl border border-neutral-200/80">
              <h3 className="font-bold text-neutral-900 mb-2">SaaS Applications</h3>
              <p className="text-xs text-neutral-600 leading-relaxed">
                Multi-tenant web apps with Stripe subscriptions, user authentication, role permissions, and dashboards.
              </p>
            </div>
            <div className="bg-[#f5f5f7] p-6 rounded-2xl border border-neutral-200/80">
              <h3 className="font-bold text-neutral-900 mb-2">Internal Portals & Admin Tools</h3>
              <p className="text-xs text-neutral-600 leading-relaxed">
                Custom administrative panels, data management tables, and internal workflow tools tailored to your business.
              </p>
            </div>
          </div>

          <div className="bg-neutral-900 text-white rounded-3xl p-8 text-center">
            <h3 className="text-2xl font-bold mb-3">Planning a custom web application?</h3>
            <p className="text-neutral-400 text-sm mb-6 max-w-lg mx-auto">
              Configure your web app features and calculate an instant quote using our builder tool.
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

import React from "react";
import { useLocation } from "wouter";
import StudioLayout from "@/components/StudioLayout";

export default function ServiceRealtime() {
  const [, setLocation] = useLocation();

  return (
    <StudioLayout>
      <section className="py-24 max-w-4xl mx-auto px-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-100 border border-neutral-200/80 mb-6 text-xs font-medium text-neutral-700">
          Service Deep Dive // 03
        </div>

        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-neutral-900 leading-tight mb-6">
          Real-Time Engines & API Architectures
        </h1>

        <p className="text-xl text-neutral-600 leading-relaxed mb-12">
          We build low-latency Socket.IO event servers, live data feeds, chat systems, and scalable backend infrastructure hosted on global Fly.io edge servers.
        </p>

        <div className="space-y-12 border-t border-neutral-200 pt-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="bg-[#f5f5f7] p-6 rounded-2xl border border-neutral-200/80">
              <h3 className="font-bold text-neutral-900 mb-2">WebSocket Event Servers</h3>
              <p className="text-xs text-neutral-600 leading-relaxed">
                Sub-50ms event streaming, state synchronization, live chat, and collaborative tools powered by Socket.IO & Redis.
              </p>
            </div>
            <div className="bg-[#f5f5f7] p-6 rounded-2xl border border-neutral-200/80">
              <h3 className="font-bold text-neutral-900 mb-2">REST & GraphQL APIs</h3>
              <p className="text-xs text-neutral-600 leading-relaxed">
                Sanitized, rate-limited, high-throughput Express APIs connected to PostgreSQL & Drizzle ORM.
              </p>
            </div>
          </div>

          <div className="bg-neutral-900 text-white rounded-3xl p-8 text-center">
            <h3 className="text-2xl font-bold mb-3">Need real-time infrastructure or custom APIs?</h3>
            <p className="text-neutral-400 text-sm mb-6 max-w-lg mx-auto">
              Explore our live in-house multi-project real-time hub demo.
            </p>
            <button
              onClick={() => setLocation("/hub")}
              className="bg-white text-neutral-900 hover:bg-neutral-100 rounded-full px-6 py-2.5 text-sm font-medium transition-all"
            >
              Open Live Hub Demo
            </button>
          </div>
        </div>
      </section>
    </StudioLayout>
  );
}

import React from "react";
import { useLocation } from "wouter";
import StudioLayout from "@/components/StudioLayout";

export default function ServicesPage() {
  const [, setLocation] = useLocation();

  const services = [
    {
      id: "websites",
      icon: "🌐",
      title: "Bespoke Websites & Landing Pages",
      desc: "Fast, responsive websites designed for product launches, corporate brand presence, and high conversion.",
      path: "/services/websites",
      deliverables: ["Custom React UI", "Mobile Responsive", "Framer Motion", "SEO & Meta Setup"],
    },
    {
      id: "web-apps",
      icon: "💻",
      title: "Custom Web Applications & SaaS",
      desc: "Full-stack web applications, SaaS platforms, client portals, and internal business workflow automation.",
      path: "/services/web-apps",
      deliverables: ["React / TypeScript", "Node.js REST APIs", "PostgreSQL Database", "Auth & Permissions"],
    },
    {
      id: "realtime",
      icon: "⚡",
      title: "Real-Time Engines & APIs",
      desc: "Low-latency Socket.IO event servers, live data feeds, chat systems, and cloud backend infrastructure.",
      path: "/services/realtime-engines",
      deliverables: ["Socket.IO WebSockets", "Redis Pub/Sub", "Fly.io Edge Deployment", "Sub-50ms Latency"],
    },
    {
      id: "custom-tools",
      icon: "🛠️",
      title: "Personalized Builders & Tools",
      desc: "Interactive product configurators, custom software builders, calculators, and specialized web software.",
      path: "/services/custom-tools",
      deliverables: ["Interactive Canvas", "Custom Logic Builders", "PDF/Data Exporters", "Tailored Workflows"],
    },
  ];

  return (
    <StudioLayout>
      <section className="py-24 max-w-6xl mx-auto px-6">
        <div className="max-w-3xl mb-16">
          <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-2 block">
            Services & Deliverables
          </span>
          <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-neutral-900 leading-tight mb-6">
            Engineering capabilities tailored to your goals.
          </h1>
          <p className="text-lg text-neutral-600 leading-relaxed">
            Select a service category to view detailed technical specifications, deliverables, and sample architectures.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {services.map((svc) => (
            <div
              key={svc.id}
              className="bg-[#f5f5f7] rounded-3xl p-8 border border-neutral-200/80 hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="text-3xl mb-4">{svc.icon}</div>
                <h2 className="text-2xl font-bold text-neutral-900 mb-3">{svc.title}</h2>
                <p className="text-neutral-600 text-sm leading-relaxed mb-6">{svc.desc}</p>

                <div className="border-t border-neutral-200 pt-4 mb-6">
                  <div className="text-xs font-semibold uppercase text-neutral-400 mb-3">Key Deliverables:</div>
                  <div className="grid grid-cols-2 gap-2">
                    {svc.deliverables.map((item, idx) => (
                      <span key={idx} className="text-xs text-neutral-700 font-medium flex items-center gap-1.5">
                        <span className="text-emerald-500 font-bold">✓</span> {item}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setLocation(svc.path)}
                className="w-full bg-white hover:bg-neutral-100 text-neutral-900 font-medium rounded-xl py-3 text-sm border border-neutral-200 transition-all flex items-center justify-center gap-2"
              >
                View Detailed Specifications
                <span>→</span>
              </button>
            </div>
          ))}
        </div>
      </section>
    </StudioLayout>
  );
}

import React, { useState } from "react";
import { useLocation } from "wouter";
import StudioLayout from "@/components/StudioLayout";

export default function Estimator() {
  const [, setLocation] = useLocation();

  const [selectedType, setSelectedType] = useState<"website" | "webapp" | "engine" | "builder">("webapp");
  const [selectedTier, setSelectedTier] = useState<"mvp" | "growth" | "enterprise">("growth");
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>(["auth", "api", "database"]);

  const toggleFeature = (id: string) => {
    if (selectedFeatures.includes(id)) {
      setSelectedFeatures(selectedFeatures.filter((f) => f !== id));
    } else {
      setSelectedFeatures([...selectedFeatures, id]);
    }
  };

  const featureOptions = [
    { id: "auth", label: "User Authentication & Roles", estDays: 2 },
    { id: "database", label: "PostgreSQL Database & ORM", estDays: 3 },
    { id: "api", label: "REST / GraphQL API Layer", estDays: 3 },
    { id: "realtime", label: "WebSocket Real-Time Engine", estDays: 4 },
    { id: "stripe", label: "Stripe Subscription Checkout", estDays: 2 },
    { id: "cms", label: "CMS Content Integration", estDays: 2 },
    { id: "sentry", label: "Sentry Error Monitoring", estDays: 1 },
    { id: "analytics", label: "Vercel / Umami Analytics", estDays: 1 },
  ];

  const typeNames = {
    website: "Bespoke Website / Landing Page",
    webapp: "Custom Web Application / SaaS",
    engine: "Real-Time Engine & API Architecture",
    builder: "Personalized Configurator & Custom Tool",
  };

  const baseBudgets = {
    website: { mvp: "$3,000 – $5,000", growth: "$5,000 – $12,000", enterprise: "$15,000+" },
    webapp: { mvp: "$5,000 – $10,000", growth: "$15,000 – $25,000", enterprise: "$30,000+" },
    engine: { mvp: "$5,000 – $12,000", growth: "$15,000 – $28,000", enterprise: "$30,000+" },
    builder: { mvp: "$4,000 – $8,000", growth: "$10,000 – $20,000", enterprise: "$25,000+" },
  };

  const totalEstDays = selectedFeatures.reduce((acc, featId) => {
    const feat = featureOptions.find((f) => f.id === featId);
    return acc + (feat ? feat.estDays : 0);
  }, selectedTier === "mvp" ? 7 : selectedTier === "growth" ? 14 : 21);

  const handleProceedToContact = () => {
    const projectSummary = `${typeNames[selectedType]} (${selectedTier.toUpperCase()}) - Features: ${selectedFeatures.join(", ")}`;
    sessionStorage.setItem("engg_project_summary", projectSummary);
    setLocation("/contact");
  };

  return (
    <StudioLayout>
      <section className="py-24 max-w-5xl mx-auto px-6">
        <div className="max-w-2xl mb-12">
          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full inline-block mb-3">
            Interactive Client Tool
          </span>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-neutral-900 mb-4">
            Project Scope & Cost Configurator
          </h1>
          <p className="text-neutral-600 text-base leading-relaxed">
            Select your software requirements to configure estimated timelines, tech stack components, and investment ranges.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Controls Column */}
          <div className="lg:col-span-7 space-y-8">
            {/* Step 1: Type */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-3">
                1. Select Project Type
              </label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { id: "website", label: "Bespoke Website" },
                  { id: "webapp", label: "Web Application" },
                  { id: "engine", label: "Real-Time Engine" },
                  { id: "builder", label: "Configurator / Tool" },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setSelectedType(item.id as any)}
                    className={`p-4 rounded-xl text-xs font-semibold text-left transition-all border ${
                      selectedType === item.id
                        ? "bg-neutral-900 text-white border-neutral-900 shadow"
                        : "bg-[#f5f5f7] text-neutral-700 border-neutral-200 hover:border-neutral-300"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Step 2: Scale */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-3">
                2. Select Scope & Scale
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: "mvp", label: "MVP / Startup" },
                  { id: "growth", label: "Growth / Pro" },
                  { id: "enterprise", label: "Enterprise" },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setSelectedTier(item.id as any)}
                    className={`p-3 rounded-xl text-xs font-semibold text-center transition-all border ${
                      selectedTier === item.id
                        ? "bg-neutral-900 text-white border-neutral-900 shadow"
                        : "bg-[#f5f5f7] text-neutral-700 border-neutral-200 hover:border-neutral-300"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Step 3: Feature Module Selection */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-3">
                3. Select Feature Modules
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {featureOptions.map((feat) => {
                  const isChecked = selectedFeatures.includes(feat.id);
                  return (
                    <button
                      key={feat.id}
                      onClick={() => toggleFeature(feat.id)}
                      className={`p-3.5 rounded-xl text-xs font-medium text-left flex items-center justify-between border transition-all ${
                        isChecked
                          ? "bg-emerald-50 border-emerald-300 text-emerald-950 font-semibold"
                          : "bg-[#f5f5f7] border-neutral-200 text-neutral-700 hover:border-neutral-300"
                      }`}
                    >
                      <span>{feat.label}</span>
                      <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${isChecked ? "bg-emerald-600 text-white" : "bg-neutral-200 text-neutral-500"}`}>
                        {isChecked ? "✓" : "+"}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Configurator Output Card */}
          <div className="lg:col-span-5 bg-neutral-900 text-white rounded-3xl p-6 sm:p-8 flex flex-col justify-between shadow-xl">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">
                Configured Output
              </div>
              <h2 className="text-2xl font-bold mb-4">{typeNames[selectedType]}</h2>

              <div className="space-y-4 mb-6">
                <div className="bg-neutral-800/80 rounded-xl p-4 border border-neutral-700/80">
                  <div className="text-xs text-neutral-400 font-semibold mb-1">Est. Development Time</div>
                  <div className="text-xl font-bold text-white">~{Math.ceil(totalEstDays / 5)} Weeks ({totalEstDays} Days)</div>
                </div>

                <div className="bg-neutral-800/80 rounded-xl p-4 border border-neutral-700/80">
                  <div className="text-xs text-neutral-400 font-semibold mb-1">Est. Investment Range</div>
                  <div className="text-xl font-bold text-emerald-400">{baseBudgets[selectedType][selectedTier]}</div>
                </div>
              </div>

              <div className="text-xs text-neutral-400 font-semibold mb-2">Selected Feature Modules ({selectedFeatures.length}):</div>
              <div className="flex flex-wrap gap-1.5 mb-8">
                {selectedFeatures.map((fid) => {
                  const feat = featureOptions.find((f) => f.id === fid);
                  return (
                    <span key={fid} className="px-2.5 py-1 rounded-md bg-neutral-800 text-[11px] text-neutral-300 border border-neutral-700">
                      {feat?.label}
                    </span>
                  );
                })}
              </div>
            </div>

            <button
              onClick={handleProceedToContact}
              className="w-full bg-white hover:bg-neutral-100 text-neutral-900 rounded-xl py-3.5 text-sm font-bold transition-all shadow active:scale-95 flex items-center justify-center gap-2"
            >
              Submit Brief & Request Quote
              <span>→</span>
            </button>
          </div>
        </div>
      </section>
    </StudioLayout>
  );
}

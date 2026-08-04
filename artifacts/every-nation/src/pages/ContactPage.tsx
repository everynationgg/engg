import React, { useState, useEffect } from "react";
import StudioLayout from "@/components/StudioLayout";

export default function ContactPage() {
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    projectType: "Website",
    budget: "$5,000 - $15,000",
    message: "",
  });

  useEffect(() => {
    const savedSummary = sessionStorage.getItem("engg_project_summary");
    if (savedSummary) {
      setFormData((prev) => ({ ...prev, message: `Configured Brief: ${savedSummary}` }));
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email) return;
    setFormSubmitted(true);
  };

  return (
    <StudioLayout>
      <section className="py-24 max-w-3xl mx-auto px-6">
        <div className="text-center mb-12">
          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full inline-block mb-3">
            Response SLA: Under 24 Hours
          </span>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-neutral-900 mb-3">
            Start a project
          </h1>
          <p className="text-neutral-600 text-base max-w-md mx-auto">
            Tell us about what you want to build. We will review your scope and respond with an architectural proposal within 24 hours.
          </p>
        </div>

        {formSubmitted ? (
          <div className="bg-[#f5f5f7] border border-neutral-200 rounded-3xl p-10 text-center max-w-md mx-auto">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-4 text-xl font-bold">
              ✓
            </div>
            <h2 className="text-2xl font-bold text-neutral-900 mb-2">Inquiry Received!</h2>
            <p className="text-sm text-neutral-600 leading-relaxed">
              Thank you, <strong>{formData.name}</strong>. Our engineering team will review your inquiry and reach out to <strong>{formData.email}</strong> shortly.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-8 sm:p-10 border border-neutral-200/80 shadow-md space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-2">
                  Your Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Alex Morgan"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-neutral-200 text-neutral-900 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  placeholder="alex@company.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-neutral-200 text-neutral-900 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-2">
                  Project Category
                </label>
                <select
                  value={formData.projectType}
                  onChange={(e) => setFormData({ ...formData, projectType: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-neutral-200 text-neutral-900 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
                >
                  <option value="Website">Website / Landing Page</option>
                  <option value="Web Application">Web Application / SaaS</option>
                  <option value="Real-Time System">Real-Time System & API</option>
                  <option value="Custom Tool">Custom Tool / Configurator</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-2">
                  Budget Range
                </label>
                <select
                  value={formData.budget}
                  onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-neutral-200 text-neutral-900 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
                >
                  <option value="$3,000 - $5,000">$3,000 - $5,000</option>
                  <option value="$5,000 - $15,000">$5,000 - $15,000</option>
                  <option value="$15,000 - $30,000">$15,000 - $30,000</option>
                  <option value="$30,000+">$30,000+</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-2">
                Project Details & Requirements
              </label>
              <textarea
                rows={4}
                placeholder="Briefly describe what you want to build..."
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-neutral-200 text-neutral-900 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
              />
            </div>

            <button
              type="submit"
              className="w-full min-h-[50px] bg-neutral-900 hover:bg-black text-white font-bold rounded-xl text-base transition-all duration-200 shadow-md active:scale-95"
            >
              Submit Project Inquiry
            </button>
          </form>
        )}
      </section>
    </StudioLayout>
  );
}

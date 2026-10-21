import React from "react";
import { useLocation } from "wouter";
import StudioLayout from "@/components/StudioLayout";
import { FaCompass, FaHome, FaGamepad, FaStore } from "react-icons/fa";

export default function NotFound() {
  const [, setLocation] = useLocation();

  return (
    <StudioLayout>
      <div className="py-16 sm:py-24 max-w-2xl mx-auto px-6 flex flex-col items-center text-center">
        <div className="w-14 h-14 rounded-2xl bg-[#7c3aed]/10 text-[#7c3aed] flex items-center justify-center mb-5">
          <FaCompass className="w-7 h-7" />
        </div>

        <span className="text-[11px] font-bold uppercase tracking-wider text-[#7c3aed] bg-[#7c3aed]/10 px-3.5 py-1 rounded-full mb-3">
          404 • Page Not Found
        </span>

        <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-neutral-900 mb-4">
          We couldn&apos;t find that page.
        </h1>

        <p className="text-sm sm:text-base text-neutral-600 leading-relaxed mb-8 max-w-md">
          The link you followed may be outdated, or the page may have moved to a new address.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={() => setLocation("/")}
            className="inline-flex items-center gap-2 bg-[#7c3aed] hover:bg-[#6d28d9] text-white px-6 py-3 rounded-full text-xs sm:text-sm font-bold uppercase tracking-wider transition-all shadow-sm active:scale-95 cursor-pointer"
          >
            <FaHome className="w-4 h-4" />
            <span>Back to Home</span>
          </button>

          <button
            onClick={() => setLocation("/hub")}
            className="inline-flex items-center gap-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 px-6 py-3 rounded-full text-xs sm:text-sm font-bold uppercase tracking-wider transition-all cursor-pointer"
          >
            <FaGamepad className="w-4 h-4 text-[#7c3aed]" />
            <span>Game Hub</span>
          </button>

          <button
            onClick={() => setLocation("/marketplace")}
            className="inline-flex items-center gap-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 px-6 py-3 rounded-full text-xs sm:text-sm font-bold uppercase tracking-wider transition-all cursor-pointer"
          >
            <FaStore className="w-4 h-4 text-[#f97316]" />
            <span>Marketplace</span>
          </button>
        </div>
      </div>
    </StudioLayout>
  );
}

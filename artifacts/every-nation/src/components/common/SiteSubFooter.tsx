import React from "react";
import { useLocation } from "wouter";

interface SiteSubFooterProps {
  className?: string;
}

export default function SiteSubFooter({ className = "" }: SiteSubFooterProps) {
  const [, setLocation] = useLocation();

  return (
    <div
      className={`shrink-0 border-t border-white/5 bg-black/95 py-2.5 px-4 sm:px-6 2xl:px-10 text-[10px] 2xl:text-xs text-neutral-400 select-none z-30 ${className}`}
    >
      <div className="max-w-7xl 2xl:max-w-[1600px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2.5">
        {/* Left Mini Brand */}
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="ENGG" className="h-5 w-auto object-contain brightness-200" />
          <span className="font-bold text-white text-[11px] 2xl:text-xs">ENGG</span>
          <span className="text-neutral-500">|</span>
          <span className="text-[10px] 2xl:text-xs">
            <span className="text-[#8b5cf6] font-semibold">Gaming.</span>{" "}
            <span className="text-white/80 font-semibold">Community.</span>{" "}
            <span className="text-[#f97316] font-semibold">Innovation.</span>
          </span>
        </div>

        {/* Right Links */}
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-5 text-neutral-400">
          <span>© 2026 ENGG. All rights reserved.</span>
          <button
            onClick={() => {
              setLocation("/about");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className="hover:text-white transition-colors"
          >
            Privacy Policy
          </button>
          <button
            onClick={() => {
              setLocation("/about");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className="hover:text-white transition-colors"
          >
            Terms of Service
          </button>
          <button
            onClick={() => {
              setLocation("/about");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className="hover:text-white transition-colors"
          >
            Community Guidelines
          </button>
        </div>
      </div>
    </div>
  );
}

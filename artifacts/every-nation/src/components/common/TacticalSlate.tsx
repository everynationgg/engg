import React from "react";

interface TacticalSlateProps {
  children: React.ReactNode;
  className?: string;
  color?: string;
  showScanner?: boolean;
}

export default function TacticalSlate({
  children,
  className = "",
}: TacticalSlateProps) {
  return (
    <div className={`relative group rounded-2xl bg-[#111520]/80 border border-white/10 overflow-hidden transition-all duration-300 hover:border-purple-500/30 ${className}`}>
      <div className="relative z-20 h-full w-full">
        {children}
      </div>
    </div>
  );
}

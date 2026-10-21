import React from "react";
import { useLocation } from "wouter";
import StudioLayout from "@/components/StudioLayout";
import { FaLock, FaShoppingBag, FaGamepad, FaHome } from "react-icons/fa";

type PausedScreenProps = {
  badge: string;
  title: string;
  message: string;
  icon: React.ComponentType<{ className?: string }>;
};

function PausedScreen({ badge, title, message, icon: Icon }: PausedScreenProps) {
  const [, setLocation] = useLocation();

  return (
    <StudioLayout>
      <div className="py-16 sm:py-24 max-w-2xl mx-auto px-6 flex flex-col items-center text-center">
        <div className="w-14 h-14 rounded-2xl bg-[#7c3aed]/10 text-[#7c3aed] flex items-center justify-center mb-5 shadow-2xs">
          <Icon className="w-6 h-6" />
        </div>

        <span className="text-[11px] font-bold uppercase tracking-wider text-[#7c3aed] bg-[#7c3aed]/10 px-3.5 py-1 rounded-full mb-4">
          {badge}
        </span>

        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-neutral-900 mb-4">
          {title}
        </h1>

        <p className="text-sm sm:text-base text-neutral-600 leading-relaxed mb-8 max-w-xl">
          {message}
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={() => setLocation("/hub")}
            className="inline-flex items-center gap-2 bg-[#7c3aed] hover:bg-[#6d28d9] text-white px-6 py-3 rounded-full text-xs sm:text-sm font-bold uppercase tracking-wider transition-all shadow-sm active:scale-95 cursor-pointer"
          >
            <FaGamepad className="w-4 h-4" />
            <span>Open Game Hub</span>
          </button>

          <button
            onClick={() => setLocation("/")}
            className="inline-flex items-center gap-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 px-6 py-3 rounded-full text-xs sm:text-sm font-bold uppercase tracking-wider transition-all cursor-pointer"
          >
            <FaHome className="w-4 h-4" />
            <span>Back to Home</span>
          </button>
        </div>
      </div>
    </StudioLayout>
  );
}

export function AuthAccessPaused() {
  return (
    <PausedScreen
      badge="Maintenance"
      title="Account Sign-In Temporarily Unavailable"
      message="Account registration and sign-in are briefly offline while we complete scheduled maintenance. You can still browse the studio, explore the Marketplace, and play games as a guest."
      icon={FaLock}
    />
  );
}

export function ShopOffline() {
  return (
    <PausedScreen
      badge="Store Maintenance"
      title="Credit Store Temporarily Offline"
      message="Credit pack purchases are currently paused while we update our store checkout. Your existing credit balance and account items remain safe."
      icon={FaShoppingBag}
    />
  );
}

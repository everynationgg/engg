import React, { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import {
  FaHome,
  FaInfo,
  FaGamepad,
  FaUsers,
  FaShareAlt,
  FaBars,
  FaTimes,
  FaDiscord,
  FaTwitter,
  FaGithub,
  FaYoutube,
} from "react-icons/fa";

export default function HomeHeroNav() {
  const [location, setLocation] = useLocation();
  const { isLoggedIn, user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [socialsModalOpen, setSocialsModalOpen] = useState(false);

  const navItems = [
    {
      id: "home",
      label: "Home",
      icon: FaHome,
      action: () => {
        setLocation("/");
        setMobileMenuOpen(false);
      },
      active: location === "/" || location === "",
    },
    {
      id: "about",
      label: "About",
      icon: FaInfo,
      action: () => {
        setLocation("/about");
        setMobileMenuOpen(false);
      },
      active: location === "/about",
    },
    {
      id: "gaming",
      label: "Gaming",
      icon: FaGamepad,
      action: () => {
        setLocation("/hub");
        setMobileMenuOpen(false);
      },
      active: location === "/hub",
    },
    {
      id: "community",
      label: "Community",
      icon: FaUsers,
      action: () => {
        window.open("https://discord.gg/everynation", "_blank", "noopener,noreferrer");
        setMobileMenuOpen(false);
      },
      active: false,
    },
    {
      id: "socials",
      label: "Socials",
      icon: FaShareAlt,
      action: () => {
        setSocialsModalOpen(true);
        setMobileMenuOpen(false);
      },
      active: false,
    },
  ];

  return (
    <>
      <header className="shrink-0 w-full bg-white/90 backdrop-blur-md border-b border-neutral-200/80 z-40 sticky top-0 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Brand Logo - Preserves existing official ENGG logo */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setLocation("/")}
              className="flex items-center hover:opacity-85 transition-opacity"
              aria-label="ENGG Home"
            >
              <img
                src="/logo.png"
                alt="ENGG Logo"
                className="h-9 sm:h-10 w-auto object-contain"
              />
            </button>
            <span className="hidden sm:inline-block h-4 w-[1px] bg-neutral-300" />
            <span className="hidden sm:inline-block text-[11px] font-semibold tracking-wider uppercase text-neutral-500">
              Gaming & Software Studio
            </span>
          </div>

          {/* Desktop Nav Items with Circular Purple Badges */}
          <nav className="hidden md:flex items-center gap-6">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={item.action}
                  className="flex flex-col items-center group py-1 focus:outline-none"
                >
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center transition-all duration-200 shadow-xs ${
                      item.active
                        ? "bg-[#7c3aed] text-white ring-2 ring-[#7c3aed]/30 scale-105"
                        : "bg-[#7c3aed]/15 text-[#7c3aed] group-hover:bg-[#7c3aed] group-hover:text-white group-hover:scale-105"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <span
                    className={`text-[10px] font-semibold mt-1 tracking-tight transition-colors ${
                      item.active
                        ? "text-[#7c3aed] font-bold"
                        : "text-neutral-600 group-hover:text-neutral-900"
                    }`}
                  >
                    {item.label}
                  </span>
                </button>
              );
            })}

            {/* Login / Profile CTA Pill Button */}
            <div className="ml-2">
              {isLoggedIn ? (
                <button
                  onClick={() => setLocation("/profile")}
                  className="bg-[#7c3aed] hover:bg-[#6d28d9] text-white rounded-full px-5 py-2 text-xs font-bold uppercase tracking-wider transition-all shadow-sm active:scale-95 flex items-center gap-2"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>{user?.username || "Profile"}</span>
                </button>
              ) : (
                <button
                  onClick={() => setLocation("/login")}
                  className="bg-[#8b5cf6] hover:bg-[#7c3aed] text-white rounded-full px-6 py-2 text-xs font-bold uppercase tracking-wider transition-all shadow-md active:scale-95"
                >
                  LOGIN
                </button>
              )}
            </div>
          </nav>

          {/* Mobile Hamburger Menu Button */}
          <div className="flex items-center gap-2 md:hidden">
            {isLoggedIn ? (
              <button
                onClick={() => setLocation("/profile")}
                className="bg-[#7c3aed] text-white rounded-full px-3 py-1.5 text-[11px] font-bold uppercase"
              >
                Profile
              </button>
            ) : (
              <button
                onClick={() => setLocation("/login")}
                className="bg-[#8b5cf6] text-white rounded-full px-4 py-1.5 text-[11px] font-bold uppercase"
              >
                LOGIN
              </button>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-neutral-700 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
              aria-label="Toggle navigation"
            >
              {mobileMenuOpen ? <FaTimes className="w-5 h-5" /> : <FaBars className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Responsive Mobile Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-neutral-200 bg-white/95 backdrop-blur-md px-6 py-4 space-y-3 shadow-xl animate-in slide-in-from-top-2 duration-200">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={item.action}
                  className="flex items-center gap-3 w-full py-2.5 text-left border-b border-neutral-100 last:border-none group"
                >
                  <div className="w-7 h-7 rounded-full bg-[#7c3aed]/15 text-[#7c3aed] flex items-center justify-center group-hover:bg-[#7c3aed] group-hover:text-white transition-colors">
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-sm font-semibold text-neutral-800 group-hover:text-neutral-900">
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </header>

      {/* Socials Modal */}
      {socialsModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setSocialsModalOpen(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-neutral-200 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-neutral-900 flex items-center gap-2">
                <FaShareAlt className="text-[#7c3aed]" />
                <span>ENGG Community & Socials</span>
              </h3>
              <button
                onClick={() => setSocialsModalOpen(false)}
                className="text-neutral-400 hover:text-neutral-700 p-1"
              >
                <FaTimes />
              </button>
            </div>
            <div className="space-y-2.5 text-sm">
              <a
                href="https://discord.gg/everynation"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 rounded-xl bg-[#5865F2]/10 hover:bg-[#5865F2]/20 text-[#5865F2] font-semibold transition-all"
              >
                <FaDiscord className="text-lg" />
                <span>Join Discord Community</span>
              </a>
              <a
                href="https://github.com/everynationgg"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-semibold transition-all"
              >
                <FaGithub className="text-lg" />
                <span>GitHub @everynationgg</span>
              </a>
              <a
                href="https://x.com/everynationgg"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-semibold transition-all"
              >
                <FaTwitter className="text-lg text-sky-500" />
                <span>Official X / Twitter</span>
              </a>
              <a
                href="https://youtube.com/@everynationgg"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-semibold transition-all"
              >
                <FaYoutube className="text-lg text-red-500" />
                <span>YouTube Channel</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

import React, { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { DISCORD_INVITE_URL, PROJECT_STUDIO_URL } from "@/lib/externalLinks";
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
  FaChevronDown,
  FaCompass,
  FaLayerGroup,
  FaStore,
  FaUser,
  FaSignOutAlt,
  FaShieldAlt,
  FaMobileAlt,
  FaShoppingBag,
} from "react-icons/fa";

export default function HomeHeroNav() {
  const [location, setLocation] = useLocation();
  const { isLoggedIn, user, username, credits, level, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [socialsModalOpen, setSocialsModalOpen] = useState(false);
  const [aboutDropdownOpen, setAboutDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [mobileAboutExpanded, setMobileAboutExpanded] = useState(
    location.startsWith("/about") ||
    location === "/who-we-are" ||
    location === "/what-we-do" ||
    location === "/mission-and-vision"
  );
  const aboutTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const aboutContainerRef = useRef<HTMLDivElement | null>(null);
  const userTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const userContainerRef = useRef<HTMLDivElement | null>(null);

  const effectiveUsername = user?.username || username || "Player";
  const effectiveCredits = user?.credits ?? credits ?? 0;
  const effectiveLevel = user?.level ?? level ?? 1;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        aboutContainerRef.current &&
        !aboutContainerRef.current.contains(event.target as Node)
      ) {
        setAboutDropdownOpen(false);
      }
      if (
        userContainerRef.current &&
        !userContainerRef.current.contains(event.target as Node)
      ) {
        setUserDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      if (aboutTimeoutRef.current) clearTimeout(aboutTimeoutRef.current);
      if (userTimeoutRef.current) clearTimeout(userTimeoutRef.current);
    };
  }, []);

  const handleAboutMouseEnter = () => {
    if (aboutTimeoutRef.current) {
      clearTimeout(aboutTimeoutRef.current);
      aboutTimeoutRef.current = null;
    }
    setAboutDropdownOpen(true);
  };

  const handleAboutMouseLeave = () => {
    aboutTimeoutRef.current = setTimeout(() => {
      setAboutDropdownOpen(false);
    }, 200);
  };

  const handleUserMouseEnter = () => {
    if (userTimeoutRef.current) {
      clearTimeout(userTimeoutRef.current);
      userTimeoutRef.current = null;
    }
    setUserDropdownOpen(true);
  };

  const handleUserMouseLeave = () => {
    userTimeoutRef.current = setTimeout(() => {
      setUserDropdownOpen(false);
    }, 220);
  };

  const handleSignOut = () => {
    setUserDropdownOpen(false);
    setMobileMenuOpen(false);
    logout();
  };

  const handleNavigate = (path: string) => {
    setLocation(path);
    setAboutDropdownOpen(false);
    setUserDropdownOpen(false);
    setMobileMenuOpen(false);
  };

  const isAboutActive =
    location.startsWith("/about") ||
    location === "/who-we-are" ||
    location === "/what-we-do" ||
    location === "/mission-and-vision";

  const navItems = [
    {
      id: "home",
      label: "Home",
      icon: FaHome,
      action: () => handleNavigate("/"),
      active: location === "/" || location === "",
    },
    {
      id: "about",
      label: "About",
      icon: FaInfo,
      action: () => handleNavigate("/about"),
      active: isAboutActive,
    },
    {
      id: "gaming",
      label: "Games",
      icon: FaGamepad,
      action: () => handleNavigate("/hub"),
      active: location === "/hub",
    },
    {
      id: "marketplace",
      label: "Marketplace",
      icon: FaStore,
      action: () => handleNavigate("/marketplace"),
      active: location === "/marketplace",
    },
    {
      id: "studio",
      label: "Project Studio",
      icon: FaLayerGroup,
      action: () => {
        window.open(PROJECT_STUDIO_URL, "_blank", "noopener,noreferrer");
        setMobileMenuOpen(false);
      },
      active: false,
    },
    {
      id: "community",
      label: "Community",
      icon: FaUsers,
      action: () => {
        window.open(DISCORD_INVITE_URL, "_blank", "noopener,noreferrer");
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
        <div className="max-w-7xl 2xl:max-w-[1600px] mx-auto px-4 sm:px-6 2xl:px-10 h-16 flex items-center justify-between">
          {/* Brand Logo */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleNavigate("/")}
              className="flex items-center hover:opacity-85 transition-opacity cursor-pointer"
              aria-label="Every Nation Home"
            >
              <img
                src="/logo.png"
                alt="Every Nation Logo"
                className="h-9 sm:h-10 w-auto object-contain"
              />
            </button>
            <span className="hidden sm:inline-block h-4 w-[1px] bg-neutral-300" />
            <span className="hidden sm:inline-block text-[11px] font-semibold tracking-wider uppercase text-neutral-500">
              Games &amp; Software Studio
            </span>
          </div>

          {/* Desktop Nav Items with Circular Purple Badges */}
          <nav className="hidden md:flex items-center gap-6">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isAbout = item.id === "about";

              if (isAbout) {
                return (
                  <div
                    key={item.id}
                    ref={aboutContainerRef}
                    className="relative flex flex-col items-center group py-1"
                    onMouseEnter={handleAboutMouseEnter}
                    onMouseLeave={handleAboutMouseLeave}
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setAboutDropdownOpen((prev) => !prev);
                      }}
                      className="flex flex-col items-center focus:outline-none cursor-pointer"
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
                      <div className="flex items-center gap-1 mt-1">
                        <span
                          className={`text-[10px] font-semibold tracking-tight transition-colors ${
                            item.active
                              ? "text-[#7c3aed] font-bold"
                              : "text-neutral-600 group-hover:text-neutral-900"
                          }`}
                        >
                          {item.label}
                        </span>
                        <FaChevronDown
                          className={`w-2 h-2 transition-transform duration-200 ${
                            aboutDropdownOpen
                              ? "rotate-180 text-[#7c3aed]"
                              : item.active
                                ? "text-[#7c3aed]"
                                : "text-neutral-400 group-hover:text-neutral-700"
                          }`}
                        />
                      </div>
                    </button>

                    {/* Desktop Submenu Dropdown */}
                    {aboutDropdownOpen && (
                      <div className="absolute top-full left-1/2 -translate-x-1/2 pt-2 z-50 w-[340px] animate-in fade-in zoom-in-95 duration-150">
                        <div className="bg-white/95 backdrop-blur-xl border border-neutral-200/90 rounded-2xl shadow-2xl p-3 text-left">
                          {/* Top Header Badge */}
                          <div className="flex items-center justify-between px-2 pb-2 mb-2 border-b border-neutral-100">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                              About the Studio
                            </span>
                            <span className="text-[10px] font-semibold text-[#7c3aed] bg-[#7c3aed]/10 px-2 py-0.5 rounded-full">
                              Every Nation
                            </span>
                          </div>

                          <div className="space-y-1">
                            {/* 1. Who We Are */}
                            <button
                              onClick={() => handleNavigate("/about/who-we-are")}
                              className={`w-full flex items-start gap-3 p-2.5 rounded-xl transition-all cursor-pointer ${
                                location === "/about" ||
                                location === "/about/who-we-are" ||
                                location === "/who-we-are"
                                  ? "bg-[#7c3aed]/10 text-[#7c3aed]"
                                  : "hover:bg-neutral-100/80 text-neutral-800"
                              }`}
                            >
                              <div className="w-8 h-8 rounded-lg bg-[#7c3aed]/15 text-[#7c3aed] flex items-center justify-center shrink-0 mt-0.5">
                                <FaUsers className="w-3.5 h-3.5" />
                              </div>
                              <div>
                                <div className="text-xs font-bold leading-tight">1. Who We Are</div>
                                <div className="text-[11px] text-neutral-500 leading-snug mt-0.5">
                                  Our story, our community &amp; the founders
                                </div>
                              </div>
                            </button>

                            {/* 2. What We Do */}
                            <button
                              onClick={() => handleNavigate("/about/what-we-do")}
                              className={`w-full flex items-start gap-3 p-2.5 rounded-xl transition-all cursor-pointer ${
                                location === "/about/what-we-do" || location === "/what-we-do"
                                  ? "bg-[#7c3aed]/10 text-[#7c3aed]"
                                  : "hover:bg-neutral-100/80 text-neutral-800"
                              }`}
                            >
                              <div className="w-8 h-8 rounded-lg bg-blue-500/15 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                                <FaLayerGroup className="w-3.5 h-3.5" />
                              </div>
                              <div>
                                <div className="text-xs font-bold leading-tight">2. What We Do</div>
                                <div className="text-[11px] text-neutral-500 leading-snug mt-0.5">
                                  Multiplayer games, community &amp; custom software
                                </div>
                              </div>
                            </button>

                            {/* 3. Mission & Vision */}
                            <button
                              onClick={() => handleNavigate("/about/mission-and-vision")}
                              className={`w-full flex items-start gap-3 p-2.5 rounded-xl transition-all cursor-pointer ${
                                location === "/about/mission-and-vision" || location === "/mission-and-vision"
                                  ? "bg-[#7c3aed]/10 text-[#7c3aed]"
                                  : "hover:bg-neutral-100/80 text-neutral-800"
                              }`}
                            >
                              <div className="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                                <FaCompass className="w-3.5 h-3.5" />
                              </div>
                              <div>
                                <div className="text-xs font-bold leading-tight">3. Mission &amp; Vision</div>
                                <div className="text-[11px] text-neutral-500 leading-snug mt-0.5">
                                  Our core values &amp; long-term direction
                                </div>
                              </div>
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              }

              return (
                <button
                  key={item.id}
                  onClick={item.action}
                  className="flex flex-col items-center group py-1 focus:outline-none cursor-pointer"
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

            {/* User Account Menu Pill */}
            <div ref={userContainerRef} className="relative ml-2">
              {isLoggedIn ? (
                <>
                  <button
                    onClick={() => setUserDropdownOpen((prev) => !prev)}
                    onMouseEnter={handleUserMouseEnter}
                    onMouseLeave={handleUserMouseLeave}
                    className="bg-[#7c3aed] hover:bg-[#6d28d9] text-white rounded-full pl-2 pr-3.5 py-1.5 text-xs font-semibold tracking-wide transition-all shadow-xs active:scale-95 flex items-center gap-2 cursor-pointer"
                    aria-label="User Account Menu"
                    aria-expanded={userDropdownOpen}
                  >
                    <div className="w-5 h-5 rounded-full bg-white/25 flex items-center justify-center text-[10px] font-bold text-white uppercase shrink-0">
                      {effectiveUsername.charAt(0)}
                    </div>
                    <span className="max-w-[120px] truncate">{effectiveUsername}</span>
                    <FaChevronDown
                      className={`w-2.5 h-2.5 transition-transform duration-200 shrink-0 ${
                        userDropdownOpen ? "rotate-180 text-white" : "text-white/70"
                      }`}
                    />
                  </button>

                  {/* Account Menu Dropdown */}
                  {userDropdownOpen && (
                    <div
                      onMouseEnter={handleUserMouseEnter}
                      onMouseLeave={handleUserMouseLeave}
                      className="absolute top-full right-0 pt-2 z-50 w-[260px] animate-in fade-in zoom-in-95 duration-150"
                    >
                      <div className="bg-white/95 backdrop-blur-2xl border border-neutral-200/80 rounded-2xl shadow-xl p-3 text-left">
                        {/* 1. Header: Avatar + User Info */}
                        <div className="flex items-center gap-3 p-1.5 pb-2.5 border-b border-neutral-100">
                          <div className="w-9 h-9 rounded-full bg-[#7c3aed] text-white flex items-center justify-center text-xs font-bold uppercase shrink-0 shadow-xs">
                            {effectiveUsername.charAt(0)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="font-bold text-sm text-neutral-900 truncate">
                              {effectiveUsername}
                            </div>
                            <div className="text-xs text-neutral-500 font-medium">
                              Level {effectiveLevel} • {effectiveCredits.toLocaleString()} Credits
                            </div>
                          </div>
                        </div>

                        {/* 2. Navigation Links */}
                        <div className="py-1 space-y-0.5">
                          <button
                            onClick={() => handleNavigate("/profile")}
                            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-neutral-700 hover:text-neutral-900 hover:bg-neutral-100/80 transition-colors text-xs font-semibold cursor-pointer"
                          >
                            <FaUser className="w-3.5 h-3.5 text-neutral-400" />
                            <span>Profile Overview</span>
                          </button>

                          <button
                            onClick={() => handleNavigate("/profile?tab=apps")}
                            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-neutral-700 hover:text-neutral-900 hover:bg-neutral-100/80 transition-colors text-xs font-semibold cursor-pointer"
                          >
                            <FaMobileAlt className="w-3.5 h-3.5 text-neutral-400" />
                            <span>Apps &amp; Downloads</span>
                          </button>

                          <button
                            onClick={() => handleNavigate("/profile?tab=games")}
                            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-neutral-700 hover:text-neutral-900 hover:bg-neutral-100/80 transition-colors text-xs font-semibold cursor-pointer"
                          >
                            <FaGamepad className="w-3.5 h-3.5 text-neutral-400" />
                            <span>Games Library</span>
                          </button>

                          <button
                            onClick={() => handleNavigate("/marketplace")}
                            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-neutral-700 hover:text-neutral-900 hover:bg-neutral-100/80 transition-colors text-xs font-semibold cursor-pointer"
                          >
                            <FaShoppingBag className="w-3.5 h-3.5 text-neutral-400" />
                            <span>Marketplace</span>
                          </button>

                          <button
                            onClick={() => handleNavigate("/profile?tab=security")}
                            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-neutral-700 hover:text-neutral-900 hover:bg-neutral-100/80 transition-colors text-xs font-semibold cursor-pointer"
                          >
                            <FaShieldAlt className="w-3.5 h-3.5 text-neutral-400" />
                            <span>Settings &amp; Security</span>
                          </button>
                        </div>

                        {/* 3. Footer: Sign Out */}
                        <div className="pt-1.5 border-t border-neutral-100">
                          <button
                            onClick={handleSignOut}
                            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-red-600 hover:bg-red-50/80 transition-colors text-xs font-semibold cursor-pointer"
                          >
                            <FaSignOutAlt className="w-3.5 h-3.5" />
                            <span>Sign Out</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <button
                  onClick={() => handleNavigate("/login")}
                  className="bg-[#8b5cf6] hover:bg-[#7c3aed] text-white rounded-full px-6 py-2 text-xs font-bold uppercase tracking-wider transition-all shadow-md active:scale-95 cursor-pointer"
                >
                  SIGN IN
                </button>
              )}
            </div>
          </nav>

          {/* Mobile Hamburger Menu Button */}
          <div className="flex items-center gap-2 md:hidden">
            {isLoggedIn ? (
              <button
                onClick={() => setMobileMenuOpen((prev) => !prev)}
                className="bg-[#7c3aed] text-white rounded-full pl-2 pr-3 py-1.5 text-[11px] font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <div className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center text-[9px] font-bold text-white uppercase shrink-0">
                  {effectiveUsername.charAt(0)}
                </div>
                <span>{effectiveUsername}</span>
              </button>
            ) : (
              <button
                onClick={() => handleNavigate("/login")}
                className="bg-[#8b5cf6] text-white rounded-full px-4 py-1.5 text-[11px] font-bold uppercase cursor-pointer"
              >
                SIGN IN
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
          <div className="md:hidden border-t border-neutral-200 bg-white/95 backdrop-blur-md px-6 py-4 space-y-3 shadow-xl max-h-[calc(100dvh-4rem)] overflow-y-auto animate-in slide-in-from-top-2 duration-200">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isAbout = item.id === "about";

              if (isAbout) {
                return (
                  <div key={item.id} className="border-b border-neutral-100 pb-2">
                    <div className="flex items-center justify-between w-full py-2">
                      <button
                        onClick={item.action}
                        className="flex items-center gap-3 text-left group flex-1"
                      >
                        <div className="w-7 h-7 rounded-full bg-[#7c3aed]/15 text-[#7c3aed] flex items-center justify-center group-hover:bg-[#7c3aed] group-hover:text-white transition-colors">
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-sm font-semibold text-neutral-800">
                          {item.label}
                        </span>
                      </button>
                      <button
                        onClick={() => setMobileAboutExpanded(!mobileAboutExpanded)}
                        className="p-1.5 text-neutral-500 hover:text-neutral-900 focus:outline-none"
                        aria-label="Toggle About Submenu"
                      >
                        <FaChevronDown
                          className={`w-3.5 h-3.5 transition-transform duration-200 ${
                            mobileAboutExpanded ? "rotate-180 text-[#7c3aed]" : ""
                          }`}
                        />
                      </button>
                    </div>

                    {/* Mobile Submenu Accordion */}
                    {mobileAboutExpanded && (
                      <div className="pl-10 pr-2 py-2 space-y-2 bg-neutral-50/80 rounded-xl mt-1 text-xs text-neutral-700">
                        <button
                          onClick={() => handleNavigate("/about/who-we-are")}
                          className={`block w-full text-left py-1 font-semibold ${
                            location === "/about" ||
                            location === "/about/who-we-are" ||
                            location === "/who-we-are"
                              ? "text-[#7c3aed]"
                              : "hover:text-neutral-900"
                          }`}
                        >
                          • 1. Who We Are
                        </button>
                        <button
                          onClick={() => handleNavigate("/about/what-we-do")}
                          className={`block w-full text-left py-1 font-semibold ${
                            location === "/about/what-we-do" || location === "/what-we-do"
                              ? "text-[#7c3aed]"
                              : "hover:text-neutral-900"
                          }`}
                        >
                          • 2. What We Do
                        </button>
                        <button
                          onClick={() => handleNavigate("/about/mission-and-vision")}
                          className={`block w-full text-left py-1 font-semibold ${
                            location === "/about/mission-and-vision" || location === "/mission-and-vision"
                              ? "text-[#7c3aed]"
                              : "hover:text-neutral-900"
                          }`}
                        >
                          • 3. Mission &amp; Vision
                        </button>
                      </div>
                    )}
                  </div>
                );
              }

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

            {/* Mobile Logged In Player Card */}
            {isLoggedIn && (
              <div className="pt-3 mt-2 border-t border-neutral-200/80 space-y-2">
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-purple-50/70 border border-purple-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-[#7c3aed] text-white flex items-center justify-center text-xs font-bold uppercase">
                      {effectiveUsername.charAt(0)}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-neutral-900">{effectiveUsername}</div>
                      <div className="text-[10px] text-[#7c3aed] font-semibold">
                        Level {effectiveLevel} • {effectiveCredits.toLocaleString()} Credits
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleNavigate("/profile")}
                    className="text-xs font-bold text-[#7c3aed] px-2.5 py-1 rounded-lg bg-white shadow-2xs"
                  >
                    Profile
                  </button>
                </div>
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center justify-center gap-2 p-2 rounded-xl text-red-600 bg-red-50 text-xs font-bold"
                >
                  <FaSignOutAlt className="w-3 h-3" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
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
                <span>Every Nation Community &amp; Socials</span>
              </h3>
              <button
                onClick={() => setSocialsModalOpen(false)}
                className="text-neutral-400 hover:text-neutral-700 p-1 cursor-pointer"
              >
                <FaTimes />
              </button>
            </div>
            <div className="space-y-2.5 text-sm">
              <a
                href={DISCORD_INVITE_URL}
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

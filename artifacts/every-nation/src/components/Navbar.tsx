import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { motion, AnimatePresence } from "framer-motion";
import { FaUser, FaSignOutAlt, FaBars, FaTimes, FaUserFriends, FaCog, FaVolumeUp, FaTerminal, FaFingerprint } from "react-icons/fa";
import { SciFiButton } from "@/components/common/SciFiButton";

export default function Navbar() {
  const { isLoggedIn, username, credits, xp, level, logout } = useAuth();
  const [location, navigate] = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Calculate XP progress (500 XP per level)
  const xpProgress = (xp % 500) / 500;

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setIsOpen(false);
  }, [location]);

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "Gaming Hub", href: "/hub" },
    { name: "Credit Shop", href: "/shop" },
  ];

  const showSolidBg = scrolled || isOpen;

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-300 border-b overflow-visible ${showSolidBg ? "bg-black/95 backdrop-blur-md border-white/5 py-3" : "bg-transparent border-transparent py-5"
          }`}
      >
        <div className="w-full max-w-[1800px] mx-auto px-4 lg:px-8 xl:px-12 flex items-center justify-between gap-4">

          {/* LEFT: LOGO (Locked Left) */}
          <Link href="/" className="group flex items-center gap-3 shrink-0 z-10">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 sm:w-8 sm:h-8 border border-white/10 bg-white/5 flex items-center justify-center relative">
                <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 bg-white/80" />
              </div>
              <div className="flex flex-col">
                <span className="font-orbitron font-black text-sm sm:text-base lg:text-lg tracking-[0.2em] uppercase text-white">
                  ENGG
                </span>
                <span className="font-mono text-[6px] tracking-[0.4em] uppercase text-white/20 hidden sm:block">
                  Operational_Nexus
                </span>
              </div>
            </div>
          </Link>

          {/* CENTER: NAV (Balanced Center) */}
          <div className="hidden lg:flex flex-1 items-center justify-center gap-8 xl:gap-12 mx-4 overflow-hidden">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className={`font-orbitron text-[9px] uppercase tracking-[0.3em] transition-all whitespace-nowrap ${location === link.href ? "text-cyan-400" : "text-white/40 hover:text-white"
                  }`}
              >
                {link.name}
              </Link>
            ))}
          </div>

          {/* RIGHT: USER (Locked Right) */}
          <div className="hidden lg:flex items-center gap-4 sm:gap-6 lg:gap-8 shrink-0 justify-end z-10 min-w-[200px]">
            {isLoggedIn ? (
              <div className="flex items-center gap-4 sm:gap-6 lg:gap-8">
                {/* 1. ASSET MODULE (Credits) - Refined HUD */}
                <div className="hidden sm:flex items-center gap-4 px-5 py-2 bg-white/[0.02] border border-white/10 rounded-sm group/credits hover:border-cyan-500/40 hover:bg-cyan-500/[0.04] transition-all duration-200 ease-out cursor-default relative overflow-hidden backdrop-blur-md">
                  {/* Holographic Scanline - Ultra Subtle Hover Only */}
                  <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-cyan-400/[0.03] to-transparent -translate-y-full group-hover/credits:animate-[scanline_1.5s_ease-in-out_infinite] opacity-0 group-hover/credits:opacity-100 transition-opacity duration-500" />
                  
                  <div className="flex flex-col items-start leading-none relative z-10">
                    <span className="font-mono text-[7px] text-white/20 uppercase tracking-[0.4em] mb-1 group-hover/credits:text-cyan-400/50 transition-colors duration-200">Asset_Uplink</span>
                    <div className="flex items-baseline gap-2">
                      <span className="font-orbitron text-sm lg:text-base text-white/90 group-hover/credits:text-cyan-400 font-black tracking-wider transition-colors duration-200">
                        {credits.toLocaleString()}
                      </span>
                      <span className="text-[9px] text-white/20 font-mono font-bold tracking-widest group-hover/credits:text-cyan-400/30 transition-colors duration-200">CC</span>
                    </div>
                  </div>

                  {/* Tech Corner Accents - Subtle IDLE */}
                  <div className="absolute top-0 right-0 w-1.5 h-1.5 border-t border-r border-white/5 group-hover/credits:border-cyan-400/30 transition-colors duration-200" />
                  <div className="absolute bottom-0 left-0 w-1.5 h-1.5 border-b border-l border-white/5 group-hover/credits:border-cyan-400/30 transition-colors duration-200" />
                </div>

                {/* 2. IDENTITY MODULE - High-Contrast HUD */}
                <div className="flex items-center gap-4 min-w-0">
                  {/* Static Divider */}
                  <div className="h-8 w-[1px] bg-white/5 hidden xl:block" />

                  <Link href="/profile" className="flex items-center gap-4 group/user min-w-0">
                    <div className="relative shrink-0">
                      {/* Avatar Container - Controlled Glow */}
                      <div className="w-11 h-11 rounded-full border border-white/10 p-[1px] flex items-center justify-center bg-white/[0.02] group-hover/user:border-cyan-500/40 group-hover/user:bg-cyan-500/[0.06] transition-all duration-200 ease-out relative overflow-hidden">
                        <div className="w-full h-full rounded-full bg-[#020408] flex items-center justify-center overflow-hidden relative">
                           <FaUser className="text-white/20 text-[16px] group-hover/user:text-cyan-400 transition-all duration-200" />
                        </div>
                      </div>

                      {/* Status Indicator - High Contrast Solid */}
                      <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-[#020408] rounded-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-cyan-500 rounded-full shadow-[0_0_8px_#00f3ff]" />
                      </div>
                    </div>

                    <div className="flex flex-col gap-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[12px] text-white/70 font-black uppercase tracking-[0.15em] truncate max-w-[90px] lg:max-w-[130px] group-hover/user:text-white transition-colors duration-200">
                          {username}
                        </span>
                        <div className="px-2 py-0.5 bg-white/5 border border-white/10 rounded-sm shrink-0 group-hover/user:border-cyan-500/30 group-hover/user:bg-cyan-500/10 transition-all duration-200">
                          <span className="font-orbitron text-[9px] font-black text-white/40 group-hover/user:text-cyan-400">LV_{level}</span>
                        </div>
                      </div>
                      
                      {/* Integrated Tactical XP Bar */}
                      <div className="hidden xl:flex items-center gap-2 w-full opacity-30 group-hover/user:opacity-100 transition-all duration-300">
                         <div className="flex-1 h-[2px] bg-white/5 relative overflow-hidden rounded-full">
                           <motion.div
                             className="absolute inset-y-0 left-0 bg-cyan-500"
                             initial={{ width: 0 }}
                             animate={{ width: `${xpProgress * 100}%` }}
                             transition={{ duration: 2, ease: "easeOut" }}
                           />
                         </div>
                         <span className="font-mono text-[6px] text-white/20 uppercase tracking-tighter">{Math.round(xpProgress * 100)}%</span>
                      </div>
                    </div>
                  </Link>
                </div>

                {/* 3. CONTROL MODULE - Precision Interface */}
                <div className="flex items-center gap-3">
                  <div className="h-8 w-[1px] bg-white/5" />

                  {/* Allies Trigger */}
                  <button
                    onClick={() => {
                      const alliesBtn = document.querySelector('[data-allies-trigger]') as HTMLButtonElement;
                      if (alliesBtn) alliesBtn.click();
                    }}
                    className="p-3 bg-white/[0.02] border border-white/10 text-white/40 hover:text-cyan-400 hover:border-cyan-500/40 hover:bg-cyan-500/[0.06] transition-all duration-200 shrink-0 rounded-sm group/btn relative"
                    title="Allies Network"
                  >
                    <FaUserFriends size={16} className="group-hover/btn:scale-110 transition-transform relative z-10 duration-200" />
                  </button>

                  {/* System Settings */}
                  <div className="relative shrink-0">
                    <button
                      onClick={() => setShowSettings(!showSettings)}
                      className={`p-3 border transition-all duration-200 rounded-sm group/settings relative ${showSettings
                        ? "bg-cyan-500/10 border-cyan-500/50 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.2)]"
                        : "bg-white/[0.02] border-white/10 text-white/40 hover:text-white hover:border-white/30"
                        }`}
                    >
                      <FaCog size={16} className={`relative z-10 ${showSettings ? "animate-[spin_4s_linear_infinite]" : "group-hover/settings:rotate-90 transition-transform duration-500"}`} />
                    </button>

                    <AnimatePresence>
                      {showSettings && (
                        <>
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[299]"
                            onClick={() => setShowSettings(false)}
                          />
                          <motion.div
                            initial={{ opacity: 0, y: 8, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 8, scale: 0.98 }}
                            transition={{ duration: 0.15, ease: "easeOut" }}
                            className="absolute top-full right-0 mt-5 w-52 bg-[#020408]/98 border border-white/10 p-5 shadow-2xl backdrop-blur-md z-[300]"
                          >
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-2 mb-3">
                                 <div className="w-1 h-1 bg-cyan-500 shadow-[0_0_5px_#00f3ff]" />
                                 <span className="font-mono text-[7px] uppercase tracking-[0.5em] text-white/20">System_Directives</span>
                              </div>

                              <button className="flex items-center justify-between w-full p-3 text-left hover:bg-white/5 group transition-all duration-150 border border-transparent hover:border-white/5">
                                <div className="flex items-center gap-3">
                                   <FaVolumeUp size={10} className="text-white/20 group-hover:text-cyan-400 transition-colors" />
                                   <span className="font-orbitron text-[9px] uppercase tracking-widest text-white/60 group-hover:text-white transition-colors">Audio_Engine</span>
                                </div>
                                <div className="w-1 h-1 bg-white/10 rounded-full group-hover:bg-cyan-500/40 transition-colors" />
                              </button>

                              <button className="flex items-center justify-between w-full p-3 text-left hover:bg-white/5 group transition-all duration-150 border border-transparent hover:border-white/5">
                                <div className="flex items-center gap-3">
                                   <FaTerminal size={10} className="text-white/20 group-hover:text-cyan-400 transition-colors" />
                                   <span className="font-orbitron text-[9px] uppercase tracking-widest text-white/60 group-hover:text-white transition-colors">Preferences</span>
                                </div>
                                <div className="w-1 h-1 bg-white/10 rounded-full group-hover:bg-cyan-500/40 transition-colors" />
                              </button>

                              <div className="h-[1px] bg-white/5 my-3" />

                              <button
                                onClick={logout}
                                className="flex items-center gap-3 w-full p-3 text-left hover:bg-red-500/10 group transition-all duration-150"
                              >
                                <FaSignOutAlt size={10} className="text-white/20 group-hover:text-red-500 transition-colors" />
                                <span className="font-orbitron text-[9px] uppercase tracking-widest text-white/60 group-hover:text-red-500 transition-colors">TERMINATE_SESSION</span>
                              </button>
                            </div>
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                 <div className="h-8 w-[1px] bg-white/5" />
                 <SciFiButton
                   variant="primary"
                   size="sm"
                   onClick={() => navigate("/login")}
                   className="relative group/login overflow-hidden"
                 >
                   <div className="absolute inset-0 bg-white/5 translate-x-[-100%] group-hover/login:translate-x-[100%] transition-transform duration-700 ease-in-out" />
                   <span className="relative z-10 flex items-center gap-2">
                      <FaFingerprint className="text-[10px]" />
                      AUTHORIZE_ACCESS
                   </span>
                 </SciFiButton>
              </div>
            )}
          </div>

          {/* MOBILE TOGGLE */}
          <button className="lg:hidden text-cyan-400/40 hover:text-cyan-400 transition-colors" onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <FaTimes size={18} /> : <FaBars size={18} />}
          </button>
        </div>

        {/* TACTICAL BREADCRUMBS */}
        {/* FIX: removed overflow-hidden so the settings dropdown can escape the navbar bounds */}
        <div className="w-full border-t border-white/5 bg-black/40 backdrop-blur-sm h-6 flex items-center px-6 md:px-12">
          <div className="flex items-center gap-3 opacity-30">
            <span className="font-mono text-[7px] uppercase tracking-[0.2em] text-cyan-400">Path:</span>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[7px] uppercase tracking-widest text-white">Root</span>
              <span className="text-[6px] text-white/40">&gt;</span>
              <span className="font-mono text-[7px] uppercase tracking-widest text-cyan-400">
                {location === "/" ? "Home" : location.slice(1).replace("-", "_").toUpperCase()}
              </span>
            </div>
          </div>
        </div>
      </nav>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsOpen(false)} className="fixed inset-0 z-[999] bg-black/90 lg:hidden" />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 bottom-0 left-0 w-[300px] lg:hidden z-[1000] bg-[#020408] border-r border-white/5 flex flex-col overflow-y-auto"
              style={{ paddingTop: "env(safe-area-inset-top, 2rem)" }}
            >
              <div className="p-8 border-b border-white/5 flex items-center justify-between shrink-0">
                <span className="font-orbitron font-black text-xl tracking-tighter text-white">ENGG</span>
                <button onClick={() => setIsOpen(false)} className="text-white/40 hover:text-white transition-colors p-2">
                  <FaTimes size={20} />
                </button>
              </div>

              <div className="flex flex-col p-4 mt-4">
                {navLinks.map((link) => (
                  <Link
                    key={link.name}
                    href={link.href}
                    className={`p-5 font-orbitron text-[10px] uppercase tracking-[0.3em] transition-all border-l-2 mb-2 min-h-[52px] flex items-center ${location === link.href
                      ? "text-cyan-400 border-cyan-400 bg-cyan-400/5"
                      : "text-white/40 border-transparent hover:text-white hover:bg-white/5"
                      }`}
                  >
                    {link.name}
                  </Link>
                ))}

                {!isLoggedIn && (
                  <button
                    onClick={() => navigate("/login")}
                    className="mt-8 mx-4 min-h-[52px] border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 font-orbitron text-[10px] uppercase tracking-[0.4em] hover:bg-cyan-500/20 transition-all flex items-center justify-center"
                  >
                    Authorize_Access
                  </button>
                )}
              </div>

              {isLoggedIn && (
                <div className="mt-auto p-8 border-t border-white/5 bg-white/[0.02] mb-safe">
                  <div className="flex flex-col gap-4 mb-8">
                    <div className="flex flex-col gap-1">
                      <span className="font-mono text-[6px] text-cyan-400/40 uppercase tracking-[0.4em]">Operational_Assets</span>
                      <span className="font-orbitron text-base text-cyan-400 font-black tracking-wider">
                        {credits.toLocaleString()} <span className="text-[10px] opacity-40">CC</span>
                      </span>
                    </div>
                    <div className="h-[1px] bg-white/5 w-full" />
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full border border-cyan-500/20 flex items-center justify-center bg-cyan-500/5 shadow-[0_0_15px_rgba(6,182,212,0.1)]">
                        <FaUser className="text-cyan-400/60" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[11px] text-white font-black uppercase tracking-widest">{username}</span>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[8px] text-cyan-400 font-mono">LVL_{level}</span>
                          <div className="w-12 h-1 bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.5)]" style={{ width: `${xpProgress * 100}%` }} />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={logout}
                    className="w-full flex items-center justify-center gap-3 min-h-[52px] border border-red-500/30 text-red-400 font-orbitron text-[8px] uppercase tracking-[0.3em] hover:bg-red-500/10 transition-all"
                  >
                    <FaSignOutAlt size={12} />
                    TERMINATE_SESSION
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
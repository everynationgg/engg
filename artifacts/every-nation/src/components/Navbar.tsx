import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { motion, AnimatePresence } from "framer-motion";
import { FaUser, FaSignOutAlt, FaBars, FaTimes, FaUserFriends, FaCog, FaVolumeUp, FaTerminal } from "react-icons/fa";
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
        <div className="w-full max-w-[1800px] mx-auto px-4 md:px-8 xl:px-12 flex items-center justify-between gap-4">

          {/* LEFT: LOGO (High Priority) */}
          <Link href="/" className="group flex items-center gap-3 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 sm:w-8 sm:h-8 border border-white/10 bg-white/5 flex items-center justify-center relative">
                <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 bg-white/80" />
              </div>
              <div className="flex flex-col">
                <span className="font-orbitron font-black text-base sm:text-lg tracking-[0.2em] uppercase text-white">
                  ENGG
                </span>
                <span className="font-mono text-[6px] tracking-[0.4em] uppercase text-white/20 hidden sm:block">
                  Operational_Nexus
                </span>
              </div>
            </div>
          </Link>

          {/* CENTER: NAV (Medium Priority) */}
          <div className="hidden lg:flex items-center gap-4 xl:gap-10 mx-4 overflow-hidden">
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

          {/* RIGHT: USER (High Priority / Constrained) */}
          <div className="flex items-center gap-2 sm:gap-3 lg:gap-4 shrink-0 max-w-[50%] lg:max-w-[42%] justify-end overflow-hidden">
            {isLoggedIn ? (
              <div className="flex items-center gap-3 sm:gap-3 lg:gap-4">
                {/* CREDITS (Always Visible) */}
                <div className="flex flex-col items-end">
                  <span className="font-mono text-[7px] text-white/20 uppercase tracking-widest hidden xl:block mb-0.5">Assets</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-orbitron text-xs sm:text-sm text-cyan-400 font-bold whitespace-nowrap truncate max-w-[90px]">{credits.toLocaleString()}</span>
                    <span className="text-[8px] text-cyan-400/40 font-mono">CC</span>
                  </div>
                </div>

                {/* USER CLUSTER */}
                <Link href="/profile" className="flex items-center gap-2 sm:gap-3 group/user min-w-0">
                  <div className="w-8 h-8 rounded-full border border-white/5 flex items-center justify-center bg-white/[0.02] group-hover/user:border-cyan-500/30 transition-all shrink-0">
                    <FaUser className="text-white/30 text-[10px] group-hover/user:text-cyan-400" />
                  </div>
                  <div className="flex flex-col gap-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] sm:text-[11px] text-white font-bold uppercase tracking-[0.1em] sm:tracking-[0.2em] truncate max-w-[60px] sm:max-w-[100px]">{username}</span>
                      <div className="px-1.5 py-0.5 bg-cyan-500/10 border border-cyan-500/30 rounded-sm shrink-0">
                        <span className="font-orbitron text-[7px] sm:text-[8px] font-black text-cyan-400">L_{level}</span>
                      </div>
                    </div>
                    {/* XP bar: hidden on small screens */}
                    <div className="hidden 2xl:block w-24 h-1 bg-white/5 relative overflow-hidden rounded-full">
                      <motion.div
                        className="absolute inset-y-0 left-0 bg-cyan-500"
                        initial={{ width: 0 }}
                        animate={{ width: `${xpProgress * 100}%` }}
                        transition={{ duration: 1.5 }}
                      />
                    </div>
                  </div>
                </Link>

                {/* ALLIES TRIGGER */}
                <button
                  onClick={() => {
                    const alliesBtn = document.querySelector('[data-allies-trigger]') as HTMLButtonElement;
                    if (alliesBtn) alliesBtn.click();
                  }}
                  className="p-1.5 sm:p-2 bg-white/5 border border-white/5 text-white/40 hover:text-cyan-400 transition-all shrink-0"
                  title="Allies Network"
                >
                  <FaUserFriends size={12} />
                </button>

                {/* SYSTEM CONTROLS */}
                {/* FIX: z-index raised to z-[300] so dropdown clears Allies panel and other overlays */}
                <div className="relative shrink-0">
                  <button
                    onClick={() => setShowSettings(!showSettings)}
                    className={`p-1.5 sm:p-2 border transition-all ${showSettings
                      ? "bg-cyan-500/20 border-cyan-500 text-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.3)]"
                      : "bg-white/5 border-white/5 text-white/40 hover:text-white"
                      }`}
                  >
                    <FaCog size={12} className={showSettings ? "animate-[spin_4s_linear_infinite]" : ""} />
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
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.95 }}
                          // FIX: bumped from z-[110] → z-[300] to sit above Allies panel
                          className="absolute top-full right-0 mt-4 w-48 bg-[#020408] border border-white/10 p-4 shadow-2xl backdrop-blur-xl z-[300]"
                        >
                          <div className="flex flex-col gap-1">
                            <span className="font-mono text-[6px] uppercase tracking-[0.4em] text-white/20 mb-2">System_Directives</span>

                            <button className="flex items-center gap-3 w-full p-2 text-left hover:bg-white/5 group transition-colors">
                              <FaVolumeUp size={10} className="text-white/20 group-hover:text-cyan-400" />
                              <span className="font-orbitron text-[8px] uppercase tracking-widest text-white/60 group-hover:text-white">Audio_Engine</span>
                            </button>

                            <button className="flex items-center gap-3 w-full p-2 text-left hover:bg-white/5 group transition-colors">
                              <FaTerminal size={10} className="text-white/20 group-hover:text-cyan-400" />
                              <span className="font-orbitron text-[8px] uppercase tracking-widest text-white/60 group-hover:text-white">Preferences</span>
                            </button>

                            <div className="h-[1px] bg-white/5 my-2" />

                            <button
                              onClick={logout}
                              className="flex items-center gap-3 w-full p-2 text-left hover:bg-red-500/10 group transition-colors"
                            >
                              <FaSignOutAlt size={10} className="text-white/20 group-hover:text-red-500" />
                              <span className="font-orbitron text-[8px] uppercase tracking-widest text-white/60 group-hover:text-red-500">Terminate_Session</span>
                            </button>
                          </div>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            ) : (
              <SciFiButton
                variant="primary"
                size="sm"
                onClick={() => navigate("/login")}
              >
                Initialize
              </SciFiButton>
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
              initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }}
              transition={{ type: "tween", duration: 0.3 }}
              className="fixed top-0 bottom-0 left-0 w-[300px] lg:hidden z-[1000] bg-[#020408] border-r border-white/5 flex flex-col"
            >
              <div className="p-8 border-b border-white/5 flex items-center justify-between">
                <span className="font-orbitron font-black text-xl tracking-tighter text-white">ENGG</span>
                <button onClick={() => setIsOpen(false)} className="text-white/40 hover:text-white transition-colors">
                  <FaTimes size={20} />
                </button>
              </div>

              <div className="flex flex-col p-4 mt-4">
                {navLinks.map((link) => (
                  <Link
                    key={link.name}
                    href={link.href}
                    className={`p-4 font-orbitron text-[10px] uppercase tracking-[0.3em] transition-all border-l-2 mb-2 ${location === link.href
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
                    className="mt-8 mx-4 p-4 border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 font-orbitron text-[10px] uppercase tracking-[0.4em]"
                  >
                    Authorize_Access
                  </button>
                )}
              </div>

              {isLoggedIn && (
                <div className="mt-auto p-8 border-t border-white/5 bg-white/[0.02]">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center bg-white/5">
                      <FaUser className="text-white/40" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] text-white font-bold uppercase tracking-widest">{username}</span>
                      <span className="text-[8px] text-cyan-400 font-mono">LVL_{level}</span>
                    </div>
                  </div>
                  <button
                    onClick={logout}
                    className="w-full flex items-center justify-center gap-3 p-4 border border-red-500/30 text-red-400 font-orbitron text-[8px] uppercase tracking-[0.3em] hover:bg-red-500/10 transition-all"
                  >
                    <FaSignOutAlt size={12} />
                    LOGOUT
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
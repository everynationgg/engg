import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { motion, AnimatePresence } from "framer-motion";
import { FaUser, FaSignOutAlt, FaUserFriends, FaCog, FaChevronRight, FaFingerprint } from "react-icons/fa";
import { useUI } from "@/context/UIContext";
import { AUTH_PUBLIC_ACCESS_ENABLED, SHOP_ENABLED } from "@/lib/productAccess";

export default function Navbar() {
  const { isLoggedIn, username, credits, level, logout } = useAuth();
  const { activePanel, togglePanel, closeAll } = useUI();
  const [location, navigate] = useLocation();
  const [isOpen, setIsOpen] = useState(false); // Mobile menu
  const [scrolled, setScrolled] = useState(false);


  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeAll();
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [closeAll]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    setIsOpen(false);
    closeAll();
  }, [location, closeAll]);

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "Gaming Hub", href: "/hub" },
    ...(SHOP_ENABLED ? [{ name: "Credit Shop", href: "/shop" }] : []),
  ];


  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 transition-all duration-300 border-b ${scrolled || isOpen ? "bg-black/95 backdrop-blur-md border-white/5 py-3" : "bg-transparent border-transparent py-5"
          } ${activePanel !== "none" ? "z-[90]" : "z-[50]"}`}
      >
        <div className="relative w-full pl-6 md:pl-12 xl:pl-16 pr-10 md:pr-16 xl:pr-24 h-12 flex items-center justify-between pointer-events-auto">

          {/* LEFT: BRAND */}
          <Link href="/" className="flex items-center gap-3 group h-12">
            <div className="w-10 h-10 flex items-center justify-center overflow-hidden">
              <video
                src="/attached_assets/en_page_logo.webm"
                autoPlay
                muted
                loop
                playsInline
                className="w-full h-auto scale-150"
              />
            </div>
            <div className="hidden sm:flex flex-col border-l border-white/10 pl-3">
              <span className="font-orbitron font-black text-sm tracking-[0.2em] text-white/90">EVERY_NATION</span>
              <span className="font-mono text-[10px] text-white/20 uppercase tracking-[0.4em]">Unit_01</span>
            </div>
          </Link>

          {/* CENTER: NAVIGATION */}
          <div className="hidden lg:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className={`px-3 py-2 font-orbitron text-[13px] uppercase tracking-[0.2em] transition-all duration-200 relative outline-none focus-visible:text-cyan-400 ${location === link.href ? "text-cyan-400" : "text-white/60 hover:text-white"
                  }`}
              >
                {link.name}
                {location === link.href && (
                  <motion.div layoutId="nav-underline" className="absolute bottom-0 left-0 right-0 h-[2px] bg-cyan-400" />
                )}
              </Link>
            ))}
          </div>

          {/* RIGHT: IDENTITY + CONTROLS */}
          <div className="flex items-center gap-6">
            {AUTH_PUBLIC_ACCESS_ENABLED && (
              !isLoggedIn ? (
                <button
                  onClick={() => navigate("/login")}
                  className="flex items-center gap-3 px-6 py-3 bg-white/5 border border-white/10 rounded-sm hover:bg-cyan-500/10 hover:border-cyan-500/50 transition-all group"
                >
                  <FaFingerprint className="text-white/40 group-hover:text-cyan-400 text-sm" />
                  <span className="font-orbitron text-[14px] font-bold tracking-[0.2em] text-white">LOGIN</span>
                </button>
              ) : (
                <div className="flex items-center gap-6">
                  {/* Identity Trigger (Clickable Username) */}
                  <button
                    onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); togglePanel("settings"); }}
                    className={`hidden md:block font-orbitron text-[13px] font-black tracking-widest uppercase transition-all duration-200 outline-none focus-visible:text-cyan-400 ${activePanel === "settings" ? "text-cyan-400" : "text-white/60 hover:text-white cursor-pointer"}`}
                  >
                    {username}
                  </button>

                  {/* Allies Trigger */}
                  <button
                    onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); togglePanel("allies"); }}
                    className={`w-9 h-9 flex items-center justify-center rounded-sm border transition-all duration-200 outline-none focus-visible:ring-1 focus-visible:ring-cyan-400 ${activePanel === "allies"
                      ? "bg-cyan-500/10 border-cyan-500/50 text-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.1)]"
                      : "bg-white/5 border-white/10 text-white/40 hover:text-white hover:border-white/30"
                      }`}
                    title="Allies Network"
                  >
                    <FaUserFriends size={14} />
                  </button>

                  {/* Settings Dropdown Trigger */}
                  <div className="relative">
                    <button
                      onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); togglePanel("settings"); }}
                      className={`w-9 h-9 flex items-center justify-center rounded-sm border transition-all ${activePanel === "settings"
                        ? "bg-cyan-500/10 border-cyan-500/50 text-cyan-400"
                        : "bg-white/5 border-white/10 text-white/40 hover:text-white hover:border-white/30"
                        }`}
                    >
                      <FaCog size={14} className={activePanel === "settings" ? "animate-spin-slow" : ""} />
                    </button>

                    <AnimatePresence>
                      {activePanel === "settings" && (
                        <>
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[80]"
                            onClick={() => closeAll()}
                          />
                          <motion.div
                            initial={{ opacity: 0, y: 8, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 8, scale: 0.98 }}
                            transition={{ duration: 0.15, ease: "easeOut" }}
                            onClick={(e) => e.stopPropagation()}
                            className="absolute top-full right-0 mt-4 w-52 bg-[#020408] border border-white/10 p-4 shadow-2xl rounded-md z-[110]"
                          >
                             {/* ASSETS */}
                            <div className="mb-4">
                              <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-white/20 block mb-2 px-1">Assets</span>
                              <div className="flex items-baseline gap-2 px-1">
                                <span className="font-orbitron text-xl font-black text-white leading-none">{credits.toLocaleString()}</span>
                                <span className="font-mono text-[11px] text-cyan-400/40 font-bold tracking-widest uppercase">CC</span>
                              </div>
                            </div>

                            <div className="h-[1px] bg-white/5 my-4" />

                            {/* ACCOUNT */}
                            <div className="flex flex-col gap-1">
                              <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-white/20 block mb-2 px-1">Account</span>
                              <Link href="/profile" className="flex items-center justify-between p-2.5 rounded-sm hover:bg-white/5 transition-colors group">
                                <div className="flex items-center gap-3">
                                  <FaUser size={10} className="text-white/20 group-hover:text-cyan-400" />
                                  <span className="font-orbitron text-[12px] uppercase tracking-widest text-white/60 group-hover:text-white">Profile</span>
                                </div>
                                <FaChevronRight size={8} className="text-white/10 group-hover:text-white/40" />
                              </Link>

                              <button
                                onClick={logout}
                                className="flex items-center gap-3 p-2.5 rounded-sm hover:bg-red-500/10 transition-colors group mt-2"
                              >
                                <FaSignOutAlt size={10} className="text-white/20 group-hover:text-red-500" />
                                <span className="font-orbitron text-[12px] uppercase tracking-widest text-white/60 group-hover:text-red-500">Logout</span>
                              </button>
                            </div>

                            <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between opacity-20">
                              <span className="font-mono text-[9px] uppercase tracking-widest text-white">LVL_{level}</span>
                              <span className="font-mono text-[9px] uppercase tracking-widest text-white">SECURE_LINK</span>
                            </div>
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              )
            )}

            {/* Mobile menu toggle */}
            <button
              className={`lg:hidden relative w-11 h-11 flex items-center justify-center border transition-all duration-300 ml-2 focus:outline-none focus-visible:ring-1 focus-visible:ring-cyan-400 ${
                isOpen
                  ? "bg-cyan-500/15 border-cyan-400 text-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.25)]"
                  : "bg-white/5 border-white/10 text-white/40 hover:text-white hover:border-white/20"
              }`}
              onClick={() => setIsOpen(!isOpen)}
              aria-label="Toggle Navigation Menu"
            >
              {/* Sci-Fi brackets */}
              <span className="absolute top-0 left-0 w-1.5 h-1.5 border-t border-l border-current opacity-70" />
              <span className="absolute top-0 right-0 w-1.5 h-1.5 border-t border-r border-current opacity-70" />
              <span className="absolute bottom-0 left-0 w-1.5 h-1.5 border-b border-l border-current opacity-70" />
              <span className="absolute bottom-0 right-0 w-1.5 h-1.5 border-b border-r border-current opacity-70" />

              <div className="w-5 h-4 flex flex-col justify-between relative z-10">
                <span className={`h-[2px] w-full bg-current transition-all duration-300 origin-left ${isOpen ? "rotate-45 translate-x-[3px] translate-y-[-1px]" : ""}`} />
                <span className={`h-[2px] w-[70%] bg-current transition-all duration-300 ${isOpen ? "opacity-0 translate-x-3" : ""}`} />
                <span className={`h-[2px] w-full bg-current transition-all duration-300 origin-left ${isOpen ? "-rotate-45 translate-x-[3px] translate-y-[1px]" : ""}`} />
              </div>
            </button>
          </div>
        </div>

        {/* BREADCRUMB BAR (Clean version) */}
        <div className="w-full border-t border-white/5 bg-black/20 h-6 flex items-center px-6">
          <div className="flex items-center gap-3 opacity-30">
            <span className="font-mono text-[9px] uppercase tracking-widest text-white">PATH: ROOT</span>
            <span className="text-[6px] text-white/40">&gt;</span>
            <span className="font-mono text-[9px] uppercase tracking-widest text-cyan-400">
              {location === "/" ? "HOME" : location.slice(1).replace("-", "_").toUpperCase()}
            </span>
          </div>
        </div>
      </nav>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsOpen(false)} className="fixed inset-0 z-[999] bg-black/90 lg:hidden" />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="fixed top-0 bottom-0 right-0 w-[300px] lg:hidden z-[1000] bg-[#020408]/95 border-l border-cyan-500/20 flex flex-col shadow-[0_0_50px_rgba(0,0,0,0.85)] overflow-hidden backdrop-blur-lg"
            >
              {/* Scanline element */}
              <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%] opacity-25" />
              <div
                className="absolute inset-0 pointer-events-none opacity-[0.03]"
                style={{
                  backgroundImage: "radial-gradient(circle at 100% 50%, var(--portal-accent, #06b6d4) 0%, transparent 60%)",
                }}
              />

              {/* Animated HUD line */}
              <motion.div
                className="absolute left-0 w-px h-full bg-gradient-to-b from-cyan-400 via-purple-500 to-cyan-400"
                animate={{
                  y: ["-100%", "100%"],
                }}
                transition={{
                  repeat: Infinity,
                  duration: 8,
                  ease: "linear"
                }}
              />

              {/* HEADER */}
              <div className="p-6 border-b border-white/5 flex items-center justify-between relative bg-black/40">
                <div className="flex flex-col">
                  <span className="font-orbitron font-black text-lg tracking-[0.15em] text-white">COMMAND</span>
                  <span className="font-mono text-[9px] tracking-[0.3em] text-cyan-400/60 uppercase">OPERATIONS_CONSOLE</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_#22d3ee]" />
                  <span className="font-mono text-[9px] text-cyan-400/80 tracking-widest uppercase">ONLINE</span>
                </div>
              </div>

              {/* NAVIGATION LINKS */}
              <div className="flex-1 flex flex-col p-6 gap-4 overflow-y-auto">
                <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-white/20 mb-2">ACCESS_CHANNELS</span>
                {navLinks.map((link, idx) => {
                  const isActive = location === link.href;
                  return (
                    <Link
                      key={link.name}
                      href={link.href}
                      className={`relative px-4 py-3.5 border transition-all duration-300 flex flex-col gap-0.5 group outline-none ${
                        isActive
                          ? "bg-cyan-500/10 border-cyan-400/50 text-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.1)]"
                          : "bg-white/[0.02] border-white/5 text-white/50 hover:bg-white/5 hover:border-white/10 hover:text-white"
                      }`}
                      style={{
                        clipPath: "polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px))"
                      }}
                    >
                      {/* Interactive brackets */}
                      <span className="absolute top-0 left-0 w-1 h-1 border-t border-l border-current opacity-40" />
                      <span className="absolute bottom-0 right-0 w-1 h-1 border-b border-r border-current opacity-40" />

                      <div className="flex items-center justify-between">
                        <span className="font-orbitron text-[13px] font-black uppercase tracking-[0.15em]">
                          {link.name}
                        </span>
                        <span className="font-mono text-[9px] opacity-40">
                          {isActive ? "ACTIVE" : `0${idx + 1}`}
                        </span>
                      </div>
                      <span className="font-mono text-[8px] tracking-[0.2em] opacity-40">
                        {isActive ? "NODE_ESTABLISHED" : "LINK_STANDBY"}
                      </span>
                    </Link>
                  );
                })}

                {AUTH_PUBLIC_ACCESS_ENABLED && !isLoggedIn && (
                  <button
                    onClick={() => navigate("/login")}
                    className="relative mt-8 mx-2 py-4 border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 font-orbitron text-[13px] uppercase tracking-widest hover:bg-cyan-500/20 hover:border-cyan-400 transition-all duration-300"
                    style={{
                      clipPath: "polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px))"
                    }}
                  >
                    <span className="absolute top-0 left-0 w-1 h-1 border-t border-l border-current opacity-40" />
                    <span className="absolute bottom-0 right-0 w-1 h-1 border-b border-r border-current opacity-40" />
                    AUTHORIZE_ACCESS
                  </button>
                )}
              </div>

              {/* FOOTER METRICS */}
              <div className="p-6 border-t border-white/5 bg-black/40 flex flex-col gap-3">
                {AUTH_PUBLIC_ACCESS_ENABLED && isLoggedIn && (
                  <div className="flex flex-col gap-4 mb-2">
                    <div className="flex flex-col gap-1">
                      <span className="font-mono text-[9.5px] text-white/30 uppercase tracking-[0.4em]">Operational_Assets</span>
                      <span className="font-orbitron text-base text-white font-black">{credits.toLocaleString()} CC</span>
                    </div>
                    <button
                      onClick={logout}
                      className="w-full py-3 border border-red-500/30 text-red-400 font-orbitron text-[11px] uppercase tracking-[0.2em] hover:bg-red-500/10 hover:text-red-500 transition-all duration-300"
                      style={{
                        clipPath: "polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px))"
                      }}
                    >
                      TERMINATE_SESSION
                    </button>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[9px] uppercase tracking-wider text-white/30">SYSTEM_COMMS</span>
                  <span className="font-mono text-[9px] uppercase tracking-wider text-cyan-400/50">SECURE_CHANNEL</span>
                </div>
                <div className="font-mono text-[8px] text-white/20 uppercase tracking-widest leading-normal">
                  SYS_VER: 1.0.2 // UNIT: 01<br />
                  SYS_STATUS: OPTIMAL
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

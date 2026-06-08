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
  const [scrolled, setScrolled] = useState(false);


  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    closeAll();
  }, [location, closeAll]);

  const navLinks = [
    { name: "Home", href: "/", subtitle: "RETURN_TO_ORIGIN" },
    { name: "Gaming Hub", href: "/hub", subtitle: "ACTIVE_OPERATION" },
    ...(SHOP_ENABLED ? [{ name: "Credit Shop", href: "/shop", subtitle: "ASSET_ACQUISITION" }] : []),
  ];


  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 transition-all duration-300 border-b ${scrolled ? "bg-black/95 backdrop-blur-md border-white/5 py-3" : "bg-transparent border-transparent py-5"
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

            {/* MOBILE NAVIGATION TABS (Inline HUD Segmented Control) */}
            <div className="lg:hidden flex items-center absolute left-1/2 -translate-x-1/2">
              <div
                className="flex items-center gap-1 border border-cyan-500/20 bg-[#020408]/80 backdrop-blur-sm p-1 rounded-sm"
                style={{
                  clipPath: "polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))"
                }}
              >
                {navLinks.map((link) => {
                  const isActive = location === link.href;
                  return (
                    <Link
                      key={link.name}
                      href={link.href}
                      className={`px-3 py-1 font-orbitron text-[10px] sm:text-[11px] uppercase tracking-[0.15em] transition-all duration-200 relative outline-none ${
                        isActive ? "text-cyan-400 font-black bg-cyan-500/10" : "text-white/40 hover:text-white"
                      }`}
                      style={{
                        clipPath: isActive ? "polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 6px 100%, 0 calc(100% - 6px))" : undefined
                      }}
                    >
                      {isActive && (
                        <>
                          <span className="absolute top-0 left-0 w-1 h-1 border-t border-l border-cyan-400" />
                          <span className="absolute bottom-0 right-0 w-1 h-1 border-b border-r border-cyan-400" />
                        </>
                      )}
                      {link.name}
                    </Link>
                  );
                })}
              </div>
            </div>
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
    </>
  );
}

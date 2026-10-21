import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { motion, AnimatePresence } from "framer-motion";
import { FaUser, FaSignOutAlt, FaUserFriends, FaCog, FaChevronRight } from "react-icons/fa";
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
    { name: "Home", href: "/" },
    { name: "Game Hub", href: "/hub" },
    { name: "Marketplace", href: "/marketplace" },
    { name: "About", href: "/about/who-we-are" },
    ...(SHOP_ENABLED ? [{ name: "Credit Store", href: "/shop" }] : []),
  ];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 transition-all duration-300 border-b ${
        scrolled
          ? "bg-black/95 backdrop-blur-md border-white/10 py-3"
          : "bg-black/60 backdrop-blur-sm border-white/5 py-3.5"
      } ${activePanel !== "none" ? "z-[90]" : "z-[50]"}`}
    >
      <div className="relative w-full px-4 sm:px-8 xl:px-14 h-12 flex items-center justify-between pointer-events-auto">
        {/* LEFT: BRAND */}
        <Link href="/" className="flex items-center gap-3 group h-12">
          <img
            src="/logo.png"
            alt="Every Nation"
            className="h-9 w-auto object-contain brightness-150"
          />
          <div className="hidden sm:flex flex-col border-l border-white/15 pl-3">
            <span className="font-orbitron font-black text-xs sm:text-sm tracking-[0.15em] text-white/95">
              EVERY NATION
            </span>
            <span className="font-sans text-[10px] text-white/50 uppercase tracking-wider">
              Games &amp; Studio
            </span>
          </div>
        </Link>

        {/* CENTER: NAVIGATION */}
        <div className="hidden lg:flex items-center gap-7 absolute left-1/2 -translate-x-1/2">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className={`px-3 py-2 font-orbitron text-xs uppercase tracking-[0.16em] transition-all duration-200 relative outline-none focus-visible:text-cyan-400 ${
                location === link.href ? "text-cyan-400 font-bold" : "text-white/70 hover:text-white"
              }`}
            >
              {link.name}
              {location === link.href && (
                <motion.div
                  layoutId="nav-underline"
                  className="absolute bottom-0 left-0 right-0 h-[2px] bg-cyan-400"
                />
              )}
            </Link>
          ))}
        </div>

        {/* RIGHT: ACCOUNT + FRIENDS */}
        <div className="flex items-center gap-4 sm:gap-5">
          {AUTH_PUBLIC_ACCESS_ENABLED &&
            (!isLoggedIn ? (
              <button
                onClick={() => navigate("/login")}
                className="flex items-center gap-2 px-5 py-2 bg-[#7c3aed] hover:bg-[#6d28d9] rounded-full transition-all cursor-pointer"
              >
                <span className="font-sans text-xs font-bold tracking-wider uppercase text-white">
                  Sign In
                </span>
              </button>
            ) : (
              <div className="flex items-center gap-3 sm:gap-4">
                <button
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    togglePanel("settings");
                  }}
                  className={`hidden md:block font-orbitron text-xs font-bold tracking-wider uppercase transition-all duration-200 outline-none ${
                    activePanel === "settings"
                      ? "text-cyan-400"
                      : "text-white/80 hover:text-white cursor-pointer"
                  }`}
                >
                  {username}
                </button>

                {/* Friends Trigger */}
                <button
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    togglePanel("allies");
                  }}
                  className={`w-9 h-9 flex items-center justify-center rounded-lg border transition-all duration-200 outline-none cursor-pointer ${
                    activePanel === "allies"
                      ? "bg-cyan-500/15 border-cyan-500/50 text-cyan-400"
                      : "bg-white/5 border-white/10 text-white/60 hover:text-white hover:border-white/30"
                  }`}
                  title="Friends & Messages"
                  aria-label="Friends & Messages"
                >
                  <FaUserFriends size={14} />
                </button>

                {/* Account Menu Trigger */}
                <div className="relative">
                  <button
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      togglePanel("settings");
                    }}
                    className={`w-9 h-9 flex items-center justify-center rounded-lg border transition-all cursor-pointer ${
                      activePanel === "settings"
                        ? "bg-cyan-500/15 border-cyan-500/50 text-cyan-400"
                        : "bg-white/5 border-white/10 text-white/60 hover:text-white hover:border-white/30"
                    }`}
                    aria-label="Account Menu"
                  >
                    <FaCog size={14} />
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
                          className="absolute top-full right-0 mt-3 w-56 bg-[#0b101b] border border-white/15 p-4 shadow-2xl rounded-xl z-[110]"
                        >
                          <div className="mb-3">
                            <span className="font-sans text-[11px] uppercase tracking-wider text-white/40 block mb-1 px-1">
                              Balance
                            </span>
                            <div className="flex items-baseline gap-2 px-1">
                              <span className="font-orbitron text-xl font-black text-white leading-none">
                                {credits.toLocaleString()}
                              </span>
                              <span className="font-sans text-xs text-cyan-400 font-semibold">
                                Credits
                              </span>
                            </div>
                          </div>

                          <div className="h-[1px] bg-white/10 my-3" />

                          <div className="flex flex-col gap-1">
                            <Link
                              href="/profile"
                              className="flex items-center justify-between p-2.5 rounded-lg hover:bg-white/5 transition-colors group"
                            >
                              <div className="flex items-center gap-3">
                                <FaUser size={11} className="text-white/40 group-hover:text-cyan-400" />
                                <span className="font-sans text-xs font-semibold text-white/80 group-hover:text-white">
                                  Account Profile
                                </span>
                              </div>
                              <FaChevronRight size={9} className="text-white/20 group-hover:text-white/60" />
                            </Link>

                            <button
                              onClick={() => logout()}
                              className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-red-500/10 transition-colors group mt-1 cursor-pointer"
                            >
                              <FaSignOutAlt size={11} className="text-white/40 group-hover:text-red-400" />
                              <span className="font-sans text-xs font-semibold text-white/80 group-hover:text-red-400">
                                Sign Out
                              </span>
                            </button>
                          </div>

                          <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between text-white/40 text-[11px]">
                            <span>Level {level}</span>
                            <span>Every Nation</span>
                          </div>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            ))}

          {/* MOBILE NAVIGATION TABS */}
          <div className="lg:hidden flex items-center">
            <div className="flex items-center gap-1 border border-white/15 bg-black/70 backdrop-blur-sm p-1 rounded-lg">
              {navLinks.slice(0, 3).map((link) => {
                const isActive = location === link.href;
                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    className={`px-2.5 py-1 font-sans text-[11px] font-semibold rounded-md transition-all duration-200 ${
                      isActive
                        ? "text-cyan-300 bg-cyan-500/15"
                        : "text-white/60 hover:text-white"
                    }`}
                  >
                    {link.name}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}

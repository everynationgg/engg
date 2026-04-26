import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { motion, AnimatePresence } from "framer-motion";
import { FaUser, FaSignOutAlt, FaBars, FaTimes } from "react-icons/fa";
import { SciFiButton } from "@/components/common/SciFiButton";

export default function Navbar() {
  const { isLoggedIn, username, credits, logout } = useAuth();
  const [location, navigate] = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

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

  const isGamePage = location.startsWith("/end") || location.startsWith("/room");
  const isShopPage = location.startsWith("/shop");
  const showSolidBg = scrolled || isOpen || isGamePage;
  const isHidden = false; // Always show navbar as per user request

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-500 border-b ${isHidden
          ? "-translate-y-full opacity-0 pointer-events-none"
          : "translate-y-0 opacity-100"
        } ${showSolidBg
          ? "bg-black/90 backdrop-blur-xl border-white/10 py-4"
          : "bg-transparent border-transparent py-6"
        }`}
    >
      <div className="w-full max-w-[1800px] mx-auto px-6 md:px-16 flex items-center justify-between min-w-0 gap-4">

        {/* LEFT: LOGO */}
        <Link href="/" className="group flex items-center gap-4 min-w-0 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 border-2 border-white/20 bg-white/5 flex items-center justify-center relative overflow-hidden">
              <div className="w-5 h-5 bg-white" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-orbitron font-black text-xl tracking-[0.2em] uppercase text-white truncate">
                ENGG
              </span>
              <span className="font-mono text-[7px] tracking-[0.4em] uppercase text-white/30 truncate">
                Operational_Unit
              </span>
            </div>
          </div>

          {/* TELEMETRY */}
          <div className="hidden 2xl:flex items-center gap-4 ml-6 pl-6 border-l border-white/5 opacity-30">
            <div className="flex flex-col">
              <span className="font-mono text-[7px] uppercase">Protocol</span>
              <span className="font-mono text-[7px] text-cyan-400 font-bold">
                WSS_SECURE
              </span>
            </div>
            <div className="w-[1px] h-4 bg-white/20" />
            <div className="flex flex-col">
              <span className="font-mono text-[7px] uppercase">Signal</span>
              <span className="font-mono text-[7px] text-cyan-400 font-bold">
                12ms_LAT
              </span>
            </div>
          </div>
        </Link>

        {/* CENTER: NAV */}
        <div className="hidden lg:flex items-center gap-6 xl:gap-10 min-w-0">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className={`font-orbitron text-[10px] uppercase tracking-[0.25em] whitespace-nowrap ${location === link.href
                  ? "text-cyan-400"
                  : "text-white/60 hover:text-white"
                }`}
            >
              {link.name}
            </Link>
          ))}
        </div>

        {/* RIGHT: USER */}
        <div className="hidden lg:flex items-center gap-4 xl:gap-6 pl-6 border-l border-white/10 min-w-0 shrink-0">
          {isLoggedIn ? (
            <div className="flex items-center gap-4 xl:gap-6">

              {/* CREDITS */}
              <div className="flex flex-col items-end">
                <span className="font-mono text-[9px] text-white/30 uppercase">
                  Balance
                </span>
                <div className="flex items-center gap-1">
                  <span className="font-orbitron text-sm text-cyan-400 font-bold">
                    {credits.toLocaleString()}
                  </span>
                  <span className="text-[9px] text-cyan-400/50">CC</span>
                </div>
              </div>

              {/* USER */}
              <Link href="/profile" className="flex items-center gap-2 min-w-0">
                <div className="w-9 h-9 rounded-full border border-white/10 flex items-center justify-center">
                  <FaUser className="text-white/50" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-[9px] text-white/60 truncate max-w-[120px]">
                    {username}
                  </span>
                  <span className="text-[8px] text-cyan-400/60 uppercase">
                    Verified
                  </span>
                </div>
              </Link>

              {/* LOGOUT */}
              <button
                onClick={() => {
                  logout();
                  navigate("/?login=true");
                }}
                className="p-2 text-white/40 hover:text-red-400"
              >
                <FaSignOutAlt />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <div className="hidden xl:flex flex-col items-end opacity-30 group-hover:opacity-60 transition-opacity">
                <span className="font-mono text-[7px] tracking-[0.3em] uppercase">Auth_Gate_01</span>
                <span className="font-mono text-[7px] tracking-[0.3em] uppercase text-cyan-500/60">Level_Alpha</span>
              </div>
              <SciFiButton 
                variant="outline" 
                size="sm" 
                justify="start"
                onClick={() => navigate("/login")}
                className="border-white/10 bg-white/5"
              >
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse" />
                    <div className="absolute inset-0 blur-[3px] bg-cyan-400 animate-pulse" />
                  </div>
                  <span className="font-orbitron font-black text-[10px] tracking-[0.2em] text-white/90 group-hover:text-white transition-colors">
                    Initialize
                  </span>
                </div>
              </SciFiButton>
            </div>
          )}
        </div>

        {/* MOBILE TOGGLE */}
        <button
          className="lg:hidden p-2 text-white/60"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <FaTimes /> : <FaBars />}
        </button>
      </div>

      {/* MOBILE MENU */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-black/95 border-t border-white/10"
          >
            <div className="px-6 py-10 flex flex-col gap-6">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className="text-sm uppercase text-white/70"
                >
                  {link.name}
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
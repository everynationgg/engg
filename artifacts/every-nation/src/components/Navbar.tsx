import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { motion, AnimatePresence } from "framer-motion";
import { FaUser, FaSignOutAlt, FaBars, FaTimes, FaArrowRight } from "react-icons/fa";
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
              <button 
                onClick={() => navigate("/login")}
                className="group relative px-8 py-2.5 overflow-hidden border border-cyan-500/30 bg-cyan-500/5 hover:bg-cyan-500/15 transition-all duration-300 shadow-[0_0_15px_rgba(6,182,212,0.1)] hover:shadow-[0_0_25px_rgba(6,182,212,0.25)] hover:border-cyan-400/50"
                style={{ clipPath: "polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)" }}
              >
                {/* Scanning line effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-400/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
                
                {/* Glowing corner bracket */}
                <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-cyan-400" />
                <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-cyan-400" />
                
                <div className="flex items-center justify-center gap-4 relative z-10">
                  <div className="relative flex items-center justify-center w-3 h-3">
                    <div className="w-1.5 h-1.5 bg-cyan-400 shadow-[0_0_10px_#22d3ee] animate-pulse" />
                    <div className="absolute inset-0 w-4 h-4 border border-cyan-400/40 rounded-full animate-[spin_3s_linear_infinite]" />
                  </div>
                  <span className="font-orbitron font-black text-[11px] tracking-[0.3em] text-cyan-50 uppercase drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]">
                    Initialize
                  </span>
                </div>
              </button>
            </div>
          )}
        </div>

        {/* MOBILE TOGGLE */}
        <button
          className="lg:hidden p-4 text-cyan-400/60 hover:text-cyan-400 transition-colors"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <FaTimes className="text-xl" /> : <FaBars className="text-xl" />}
        </button>
      </div>

      {/* MOBILE MENU */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, x: "100%" }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: "100%" }}
            className="fixed inset-0 top-[72px] lg:hidden z-[1000] bg-[#020408]/95 backdrop-blur-xl border-l border-white/5"
          >
            <div className="p-10 flex flex-col h-full gap-12">
               {/* Nav Links */}
               <div className="flex flex-col gap-8">
                  <span className="font-mono text-[9px] uppercase tracking-[0.6em] text-white/20">Navigation_Nodes</span>
                  {navLinks.map((link) => (
                    <Link
                      key={link.name}
                      href={link.href}
                      onClick={() => setIsOpen(false)}
                      className="group flex items-center justify-between py-2"
                    >
                      <span className="font-orbitron text-2xl font-black uppercase tracking-[0.1em] text-white/60 group-hover:text-cyan-400 transition-colors">
                        {link.name}
                      </span>
                      <FaArrowRight className="text-white/10 group-hover:text-cyan-400/40 group-hover:translate-x-2 transition-all" />
                    </Link>
                  ))}
               </div>

               {/* Auth Section */}
               <div className="mt-auto border-t border-white/5 pt-12 flex flex-col gap-8">
                  {isLoggedIn ? (
                    <div className="flex flex-col gap-8">
                       <div className="flex items-center gap-6">
                          <div className="w-12 h-12 rounded-full border border-cyan-500/20 bg-cyan-500/5 flex items-center justify-center">
                             <FaUser className="text-cyan-400/40" />
                          </div>
                          <div className="flex flex-col">
                             <span className="font-mono text-[9px] uppercase tracking-widest text-white/20">Authenticated_Op</span>
                             <span className="font-orbitron font-black text-white text-lg">{username}</span>
                          </div>
                       </div>
                       <SciFiButton 
                          onClick={() => { navigate("/profile"); setIsOpen(false); }}
                          variant="primary" className="w-full"
                       >
                          Open_Command_Nexus
                       </SciFiButton>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-6">
                       <span className="font-mono text-[9px] uppercase tracking-[0.6em] text-white/20 text-center">Identity_Required</span>
                       <SciFiButton 
                          onClick={() => { navigate("/login"); setIsOpen(false); }}
                          variant="primary" className="w-full"
                       >
                          Initialize_Identity
                       </SciFiButton>
                    </div>
                  )}
               </div>

               {/* Footer Decoration */}
               <div className="flex items-center justify-between mt-8">
                  <div className="flex flex-col gap-1">
                     <span className="font-mono text-[7px] uppercase tracking-widest text-white/10">System_Clock</span>
                     <span className="font-mono text-[8px] text-white/30">{new Date().toLocaleTimeString()}</span>
                  </div>
                  <div className="w-32 h-px bg-gradient-to-r from-transparent to-white/5" />
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { motion, AnimatePresence } from "framer-motion";
import { FaUser, FaSignOutAlt, FaBars, FaTimes, FaHome, FaGamepad, FaStore, FaBook, FaCog, FaVolumeUp, FaTerminal, FaUserFriends, FaHeadset } from "react-icons/fa";
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
      className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-300 border-b ${
        showSolidBg ? "bg-black/95 backdrop-blur-md border-white/5 py-3" : "bg-transparent border-transparent py-5"
      }`}
    >
      <div className="w-full max-w-[1800px] mx-auto px-6 md:px-12 flex items-center justify-between gap-4">

        {/* LEFT: LOGO */}
        <Link href="/" className="group flex items-center gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 border border-white/10 bg-white/5 flex items-center justify-center relative">
              <div className="w-4 h-4 bg-white/80" />
            </div>
            <div className="flex flex-col">
              <span className="font-orbitron font-black text-lg tracking-[0.2em] uppercase text-white">
                ENGG
              </span>
              <span className="font-mono text-[6px] tracking-[0.4em] uppercase text-white/20">
                Operational_Nexus
              </span>
            </div>
          </div>

          {/* TELEMETRY */}
          <div className="hidden xl:flex items-center gap-4 ml-4 pl-4 border-l border-white/5 opacity-20">
            <div className="flex flex-col">
              <span className="font-mono text-[6px] uppercase">Signal</span>
              <span className="font-mono text-[7px] text-cyan-400">12ms_LAT</span>
            </div>
          </div>
        </Link>

        {/* CENTER: NAV */}
        <div className="hidden lg:flex items-center gap-8 xl:gap-12">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className={`font-orbitron text-[9px] uppercase tracking-[0.3em] transition-all ${
                location === link.href ? "text-cyan-400" : "text-white/40 hover:text-white"
              }`}
            >
              {link.name}
            </Link>
          ))}
        </div>

        {/* RIGHT: USER */}
        <div className="hidden lg:flex items-center gap-4 xl:gap-6 pl-6 border-l border-white/5 shrink-0">
          {isLoggedIn ? (
            <div className="flex items-center gap-5">
              {/* CREDITS */}
              <div className="flex flex-col items-end mr-2">
                <span className="font-mono text-[8px] text-white/20 uppercase tracking-widest">Assets</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-orbitron text-sm text-cyan-400 font-bold">{credits.toLocaleString()}</span>
                  <span className="text-[10px] text-cyan-400/40">CC</span>
                </div>
              </div>

              {/* USER */}
              <Link href="/profile" className="flex items-center gap-2 group/user">
                <div className="w-8 h-8 rounded-full border border-white/5 flex items-center justify-center bg-white/[0.02] group-hover/user:border-cyan-500/30 transition-all">
                  <FaUser className="text-white/20 text-xs group-hover/user:text-cyan-400/40" />
                </div>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] text-white font-bold uppercase tracking-[0.2em]">{username}</span>
                    <div className="px-2 py-0.5 bg-cyan-500/10 border border-cyan-500/30 rounded-sm">
                      <span className="font-orbitron text-[9px] font-black text-cyan-400">LVL_{level}</span>
                    </div>
                  </div>
                  <div className="w-24 h-1.5 bg-white/5 relative overflow-hidden">
                    <motion.div 
                      className="absolute inset-y-0 left-0 bg-cyan-500 shadow-[0_0_8px_#06b6d4]"
                      initial={{ width: 0 }}
                      animate={{ width: `${xpProgress * 100}%` }}
                      transition={{ duration: 1 }}
                    />
                  </div>
                  <span className="text-[7px] text-cyan-400/40 uppercase font-mono tracking-widest">Uplink_Syncing... {Math.floor(xpProgress * 100)}%</span>
                </div>
              </Link>

              {/* ALLIES LINK */}
              <button 
                onClick={() => {
                  // Find the AlliesSidebar button and click it, or we could use a custom event
                  const alliesBtn = document.querySelector('[data-allies-trigger]') as HTMLButtonElement;
                  if (alliesBtn) alliesBtn.click();
                }}
                className="p-2 bg-white/5 border border-white/5 text-white/40 hover:text-cyan-400 hover:border-cyan-500/30 transition-all group"
                title="Allies_Network"
              >
                <FaUserFriends size={12} />
              </button>

              {/* SYSTEM CONTROLS CLUSTER */}
              <div className="relative">
                <button 
                  onClick={() => setShowSettings(!showSettings)}
                  className={`p-2 border transition-all ${
                    showSettings 
                      ? "bg-cyan-500/20 border-cyan-500 text-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.3)]" 
                      : "bg-white/5 border-white/5 text-white/40 hover:text-white hover:border-white/10"
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
                        className="fixed inset-0 z-[-1]"
                        onClick={() => setShowSettings(false)}
                      />
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute top-full right-0 mt-4 w-48 bg-[#020408] border border-white/10 p-4 shadow-2xl backdrop-blur-xl"
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
            <div className="flex items-center gap-4">
              <div className="hidden xl:flex flex-col items-end opacity-10">
                <span className="font-mono text-[6px] tracking-[0.3em] uppercase">Auth_Gate</span>
                <span className="font-mono text-[6px] tracking-[0.3em] uppercase text-cyan-500">Alpha</span>
              </div>
              <SciFiButton 
                variant="primary" 
                size="sm" 
                onClick={() => navigate("/login")}
              >
                Initialize
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
      <div className="w-full border-t border-white/5 bg-black/40 backdrop-blur-sm h-6 flex items-center px-6 md:px-12 overflow-hidden">
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
            <div className="p-8 flex flex-col h-full">
              <div className="flex items-start justify-between mb-12">
                <div className="flex flex-col">
                  <span className="font-orbitron font-black text-sm tracking-[0.3em] text-white">ENGG.</span>
                  <span className="font-mono text-[7px] text-cyan-400/20 uppercase tracking-[0.4em] mt-1">Operational_Unit</span>
                </div>
                <button onClick={() => setIsOpen(false)} className="text-white/10 hover:text-white"><FaTimes size={16} /></button>
              </div>

              <div className="flex flex-col gap-1">
                <span className="font-mono text-[7px] uppercase tracking-[0.6em] text-white/10 mb-4 px-3">System_Nodes</span>
                {[
                  { name: "Home", href: "/", icon: <FaHome />, desc: "Root_Initialize" },
                  { name: "Gaming Hub", href: "/hub", icon: <FaGamepad />, desc: "Deploy_Unit" },
                  { name: "Credit Shop", href: "/shop", icon: <FaStore />, desc: "Asset_Market" },
                ].map((link) => (
                  <Link
                    key={link.name} href={link.href} onClick={() => setIsOpen(false)}
                    className={`flex items-center gap-4 py-4 px-4 transition-all border-b border-white/[0.02] ${
                      location === link.href ? "bg-cyan-500/5 text-cyan-400 border-l-2 border-l-cyan-400" : "text-white/30 hover:text-white"
                    }`}
                  >
                    <span className="text-[10px]">{link.icon}</span>
                    <div className="flex flex-col">
                      <span className="font-orbitron text-[10px] uppercase tracking-widest leading-none">{link.name}</span>
                      <span className="font-mono text-[6px] uppercase tracking-[0.2em] opacity-40 mt-1">{link.desc}</span>
                    </div>
                  </Link>
                ))}
                
                <div className="h-[1px] bg-white/5 my-4 mx-3" />
                
                <button
                  onClick={() => { setShowSettings(true); setIsOpen(false); }}
                  className="flex items-center gap-4 py-4 px-4 text-white/30 hover:text-white transition-all border-b border-white/[0.02]"
                >
                  <FaCog className="text-[10px]" />
                  <div className="flex flex-col">
                    <span className="font-orbitron text-[10px] uppercase tracking-widest leading-none">System_Settings</span>
                    <span className="font-mono text-[6px] uppercase tracking-[0.2em] opacity-40 mt-1">Configure_Interface</span>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setIsOpen(false);
                    const alliesBtn = document.querySelector('[data-allies-trigger]') as HTMLButtonElement;
                    if (alliesBtn) alliesBtn.click();
                  }}
                  className="flex items-center gap-4 py-4 px-4 text-white/30 hover:text-white transition-all border-b border-white/[0.02]"
                >
                  <FaUserFriends className="text-[10px]" />
                  <div className="flex flex-col">
                    <span className="font-orbitron text-[10px] uppercase tracking-widest leading-none">Allies_Net</span>
                    <span className="font-mono text-[6px] uppercase tracking-[0.2em] opacity-40 mt-1">Secure_Comms</span>
                  </div>
                </button>
              </div>

              <div className="mt-auto">
                {isLoggedIn ? (
                  <div className="p-4 bg-white/[0.01] border border-white/5">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-7 h-7 bg-cyan-500/5 border border-cyan-500/10 flex items-center justify-center">
                        <FaUser className="text-cyan-400/20 text-[10px]" />
                      </div>
                    <div className="flex flex-col gap-1">
                      <span className="font-orbitron font-bold text-white/80 text-[10px] uppercase truncate">{username}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[7px] text-cyan-400/40 uppercase">Operator_Rank:</span>
                        <span className="font-orbitron text-[8px] font-black text-cyan-400">LVL_{level}</span>
                      </div>
                    </div>
                    </div>
                    <SciFiButton variant="outline" size="sm" className="w-full" onClick={() => { navigate("/profile"); setIsOpen(false); }}>Profile</SciFiButton>
                  </div>
                ) : (
                  <SciFiButton variant="primary" size="default" className="w-full" onClick={() => { navigate("/login"); setIsOpen(false); }}>Initialize_ID</SciFiButton>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  </>
  );
}
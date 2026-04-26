import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import HowToPlayModal from "@/components/game/HowToPlayModal";
import { playMechanicalChunk } from "@/lib/sound";

interface LandingSidebarProps {
  onShowSettings: () => void;
  onShowProfile: () => void;
  onShowHowToPlay?: () => void;
  onShowAuth?: () => void;
  musicOn: boolean;
  onToggleMusic: () => void;
  playSound: () => void;
}

export default function LandingSidebar({
  onShowSettings,
  onShowProfile,
  onShowAuth,
  musicOn,
  onToggleMusic,
  playSound,
}: LandingSidebarProps) {
  const { isLoggedIn, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [showHowToPlay, setShowHowToPlay] = useState(false);

  // Lock background scroll when menu is open
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [menuOpen]);

  const closeMenu = useCallback(() => {
    if (!menuOpen) return;
    playMechanicalChunk();
    setMenuOpen(false);
  }, [menuOpen]);

  useEffect(() => {
    if (!menuOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        closeMenu();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [menuOpen, closeMenu]);

  const handleMenuItemClick = (callback: () => void) => {
    playSound();
    closeMenu();
    callback();
  };

  const handleLogout = () => {
    playSound();
    closeMenu();
    logout();
    window.location.href = "/?login=true";
  };

  const toggleMenu = () => {
    playSound();
    playMechanicalChunk();
    setMenuOpen(!menuOpen);
  };

  const menuItems = [];

  if (isLoggedIn) {
    menuItems.push({
      id: "profile",
      icon: <ProfileIcon />,
      label: "PROFILE",
      onClick: () => handleMenuItemClick(onShowProfile),
    });
  } else if (onShowAuth) {
    menuItems.push({
      id: "login",
      icon: <LoginIcon />,
      label: "LOGIN",
      onClick: () => handleMenuItemClick(onShowAuth),
    });
  }

  menuItems.push({
    id: "settings",
    icon: <SettingsIcon />,
    label: "SETTINGS",
    onClick: () => handleMenuItemClick(onShowSettings),
  });

  menuItems.push({
    id: "howtoplay",
    icon: <ManualIcon />,
    label: "MANUAL",
    onClick: () => { playSound(); closeMenu(); setShowHowToPlay(true); },
  });

  menuItems.push({
    id: "sound",
    icon: musicOn ? <SoundOnIcon /> : <SoundOffIcon />,
    label: musicOn ? "AUDIO ON" : "AUDIO OFF",
    onClick: () => { playSound(); onToggleMusic(); },
  });

  return (
    <>
      {/* --- Hamburger Trigger Button --- */}
      <div className="fixed top-6 left-6 z-[60] sm:hidden">
        <button
          onClick={toggleMenu}
          className="group relative flex items-center justify-center w-12 h-12 rounded-lg border border-cyan-500/30 transition-all duration-300 hover:scale-110 hover:brightness-125 active:scale-95"
          style={{
            background: "rgba(10, 15, 30, 0.8)",
            boxShadow: "0 0 15px rgba(0, 243, 255, 0.15)",
          }}
        >
          <div className="absolute inset-0 rounded-lg bg-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity blur-md" />
          
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-cyan-400">
            <line x1="4" y1="8" x2="20" y2="8" />
            <line x1="4" y1="12" x2="20" y2="12" />
            <line x1="4" y1="16" x2="16" y2="16" />
          </svg>
        </button>
      </div>

      {/* --- Sidebar Menu --- */}
      <AnimatePresence>
        {menuOpen && (
          <>
            {/* Dark Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeMenu}
              className="fixed inset-0 z-[70] bg-black/40 backdrop-blur-[2px]"
            />

            {/* Sidebar Content */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 left-0 h-full w-[280px] sm:w-[320px] z-[80] flex flex-col border-r border-cyan-500/30"
              style={{
                background: "#0a0f1e", // Solid deep navy/black
                boxShadow: "10px 0 30px rgba(0,0,0,0.5)",
              }}
            >
              {/* Decorative Accent Strip */}
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-cyan-500 via-cyan-400 to-cyan-600 shadow-[0_0_15px_rgba(6,182,212,0.5)]" />

              {/* Sidebar Header */}
              <div className="flex items-center justify-between p-6 border-b border-white/10" style={{ background: "#161c2d" }}>
                <div className="flex flex-col">
                  <span className="font-orbitron font-black text-xl tracking-widest text-white">
                    ENGG<span className="text-cyan-400">.</span>
                  </span>
                  <span className="text-[7px] font-orbitron tracking-[0.5em] text-cyan-400/60 uppercase">Operational_Nexus</span>
                </div>
                
                <button 
                  onClick={closeMenu}
                  className="p-2 text-white/40 hover:text-white transition-colors hover:bg-white/10 rounded-lg"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>

              {/* Navigation Nodes */}
              <div className="flex-1 overflow-y-auto py-8 px-4 space-y-3">
                <div className="text-[9px] font-orbitron tracking-[0.3em] text-cyan-500/40 mb-6 px-4 uppercase flex items-center gap-2">
                  <div className="w-4 h-px bg-cyan-500/20" />
                  Main_Nodes
                </div>
                
                {menuItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={item.onClick}
                    className="w-full flex items-center gap-4 px-5 py-4 rounded-xl transition-all duration-300 hover:bg-[#1a2138] group relative overflow-hidden"
                  >
                    <div className="text-white opacity-40 group-hover:opacity-100 group-hover:text-cyan-400 transition-all duration-300 transform group-hover:scale-110">
                      {item.icon}
                    </div>
                    <span className="font-orbitron text-[11px] tracking-[0.15em] text-white/60 group-hover:text-white transition-colors uppercase font-bold">
                      {item.label}
                    </span>
                    
                    {/* Active Glow State */}
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-0.5 h-0 bg-cyan-400 transition-all duration-300 group-hover:h-3/4 shadow-[0_0_10px_#22d3ee]" />
                  </button>
                ))}
              </div>

              {/* Bottom Actions */}
              <div className="p-6 border-t border-white/10 space-y-4" style={{ background: "#080c16" }}>
                {isLoggedIn && (
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-4 px-5 py-3 rounded-xl transition-all duration-300 hover:bg-[#2d1212] group border border-transparent hover:border-red-500/20"
                  >
                    <LogoutIcon className="text-red-500/60 group-hover:text-red-500" />
                    <span className="font-orbitron text-[10px] tracking-widest text-red-500/60 group-hover:text-red-500 uppercase font-bold">TERMINATE_SESSION</span>
                  </button>
                )}
                
                <div className="pt-4 text-center">
                  <div className="text-[7px] font-orbitron tracking-[0.4em] text-white/10 uppercase">
                    &copy; 2026 ENGG | Secure_Channel_v1
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {showHowToPlay && <HowToPlayModal onClose={() => setShowHowToPlay(false)} />}
    </>
  );
}

function ProfileIcon() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>; }
function LogoutIcon({ className }: { className?: string }) { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>; }
function LoginIcon() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" /><polyline points="10 17 5 12 10 7" /><line x1="15" y1="12" x2="5" y2="12" /></svg>; }
function SettingsIcon() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>; }
function ManualIcon() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></svg>; }
function SoundOnIcon() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><path d="M19.07 4.93a10 10 0 0 1 0 14.14" /><path d="M15.54 8.46a5 5 0 0 1 0 7.07" /></svg>; }
function SoundOffIcon() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><line x1="23" y1="9" x2="17" y2="15" /><line x1="17" y1="9" x2="23" y2="15" /></svg>; }

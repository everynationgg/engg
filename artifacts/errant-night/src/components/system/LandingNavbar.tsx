import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { playSciFiClick } from "@/lib/sound";

interface LandingNavbarProps {
  onShowSettings: () => void;
  onShowProfile: () => void;
  onShowHowToPlay: () => void;
  onShowAuth?: () => void;
  onShowMenu?: () => void;
}

export default function LandingNavbar({
  onShowSettings,
  onShowProfile,
  onShowHowToPlay,
  onShowAuth,
  onShowMenu,
}: LandingNavbarProps) {
  const { isLoggedIn } = useAuth();

  return (
    <nav 
      className="fixed top-0 left-0 right-0 z-50 hidden lg:flex items-center justify-between px-8 bg-black/20 backdrop-blur-md border-b border-white/5 overflow-x-auto overflow-y-hidden whitespace-nowrap scrollbar-none"
      style={{ isolation: "isolate", height: "var(--nav-height)" }}
    >
      {/* Brand */}
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
          <span className="font-orbitron font-black text-cyan-400 text-lg">E</span>
        </div>
        <div className="flex flex-col">
          <span className="font-orbitron font-black text-white text-base tracking-widest uppercase">
            ENGG<span className="text-cyan-400">.</span>
          </span>
          <span className="font-orbitron text-[8px] text-cyan-400/40 tracking-[0.4em] uppercase font-bold">
            Ops_Nexus_Terminal
          </span>
        </div>
      </div>

      {/* Nav Links */}
      <div className="flex items-center gap-8">
        <NavbarLink label="HOW TO PLAY" onClick={onShowHowToPlay} />
        <NavbarLink label="SETTINGS" onClick={onShowSettings} />
        <NavbarLink label="PROFILE" onClick={onShowProfile} />
        <div className="w-px h-4 bg-white/10 mx-2" />
        
        {onShowMenu && (
          <button
            onClick={() => { playSciFiClick(); onShowMenu(); }}
            className="px-6 py-2 rounded border border-white/10 text-white/40 font-orbitron text-[10px] font-black tracking-[0.3em] hover:bg-white/5 hover:text-white transition-all uppercase"
          >
            MENU
          </button>
        )}
      </div>
    </nav>
  );
}

function NavbarLink({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={() => { playSciFiClick(); onClick(); }}
      className="font-orbitron text-[12px] font-black tracking-[0.3em] text-white/40 hover:text-white transition-colors relative group py-2"
    >
      {label}
      <span className="absolute -bottom-1 left-0 w-0 h-[2px] bg-cyan-400 transition-all group-hover:w-full shadow-[0_0_8px_#00f3ff]" />
    </button>
  );
}

// Icons
function ProfileIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

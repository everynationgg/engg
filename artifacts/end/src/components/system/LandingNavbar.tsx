import { useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { playSciFiClick } from "@/lib/sound";

interface LandingNavbarProps {
  onShowSettings: () => void;
  onShowProfile: () => void;
  onShowHowToPlay: () => void;
  onShowAuth: () => void;
  musicOn: boolean;
  onToggleMusic: () => void;
}

export default function LandingNavbar({
  onShowSettings,
  onShowProfile,
  onShowHowToPlay,
  onShowAuth,
  musicOn,
  onToggleMusic,
}: LandingNavbarProps) {
  const { isLoggedIn, logout } = useAuth();

  const handleLogout = () => {
    playSciFiClick();
    logout();
    window.location.href = "/?login=true";
  };

  return (
    <nav 
      className="fixed top-0 left-0 right-0 z-50 hidden lg:flex items-center justify-between px-8 py-4 bg-black/20 backdrop-blur-md border-b border-white/5"
      style={{ isolation: "isolate" }}
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
        
        <div className="w-px h-4 bg-white/10 mx-2" />
        
        {/* Audio Toggle */}
        <button 
          onClick={() => { playSciFiClick(); onToggleMusic(); }}
          className="flex items-center gap-3 text-white/40 hover:text-cyan-400 transition-colors group px-2"
        >
          {musicOn ? <SoundOnIcon /> : <SoundOffIcon />}
          <span className="font-orbitron text-[11px] tracking-widest uppercase font-bold">{musicOn ? "AUDIO_ON" : "AUDIO_OFF"}</span>
        </button>

        {isLoggedIn ? (
          <div className="flex items-center gap-4">
            <button
              onClick={() => { playSciFiClick(); onShowProfile(); }}
              className="flex items-center gap-3 px-6 py-2.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 hover:bg-cyan-500/20 hover:border-cyan-500/40 transition-all group"
            >
              <ProfileIcon />
              <span className="font-orbitron text-[12px] font-black tracking-widest text-cyan-400">PROFILE</span>
            </button>
            <button
              onClick={handleLogout}
              className="text-white/20 hover:text-red-500/60 transition-colors"
              title="Logout"
            >
              <LogoutIcon />
            </button>
          </div>
        ) : (
          <button
            onClick={() => { playSciFiClick(); onShowAuth(); }}
            className="px-8 py-3 rounded-lg border border-cyan-500/50 text-cyan-400 font-orbitron text-[12px] font-black tracking-[0.3em] hover:bg-cyan-500/15 transition-all shadow-[0_0_20px_rgba(6,182,212,0.15)] uppercase"
          >
            Authenticate
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

// Re-using icons for consistency
function ProfileIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

function SoundOnIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
    </svg>
  );
}

function SoundOffIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <line x1="23" y1="9" x2="17" y2="15" />
      <line x1="17" y1="9" x2="23" y2="15" />
    </svg>
  );
}

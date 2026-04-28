import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
        
        <SystemNexusDropdown 
          onShowSettings={onShowSettings}
          onShowProfile={onShowProfile}
          musicOn={musicOn}
          onToggleMusic={onToggleMusic}
          isLoggedIn={isLoggedIn}
          onLogout={handleLogout}
        />

        {!isLoggedIn && (
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

function SettingsIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

function RestartIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 4v6h-6" />
      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
    </svg>
  );
}

function SystemNexusDropdown({ 
  onShowSettings, 
  onShowProfile, 
  musicOn, 
  onToggleMusic, 
  isLoggedIn, 
  onLogout
}: { 
  onShowSettings: () => void;
  onShowProfile: () => void;
  musicOn: boolean;
  onToggleMusic: () => void;
  isLoggedIn: boolean;
  onLogout: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative" onMouseLeave={() => setOpen(false)}>
      <button 
        onMouseEnter={() => setOpen(true)}
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-3 px-5 py-2.5 rounded-lg border transition-all duration-300 group ${open ? 'bg-cyan-500/20 border-cyan-500/50 shadow-[0_0_20px_rgba(6,182,212,0.2)]' : 'bg-white/5 border-white/10 hover:border-cyan-500/30'}`}
      >
        <SettingsIcon />
        <span className="font-orbitron text-[11px] font-black tracking-[0.2em] text-white/70 group-hover:text-cyan-400">SYSTEM_NEXUS</span>
        <svg 
          width="10" height="6" viewBox="0 0 10 6" fill="none" 
          className={`transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
        >
          <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute top-full right-0 mt-2 w-64 bg-black/90 backdrop-blur-xl border border-cyan-500/30 rounded-xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.8)] z-[100]"
          >
            <div className="p-2 flex flex-col gap-1">
              {isLoggedIn && (
                <DropdownItem 
                  icon={<ProfileIcon />} 
                  label="Profile_Records" 
                  onClick={() => { setOpen(false); onShowProfile(); }} 
                />
              )}
              
              <DropdownItem 
                icon={<SettingsIcon />} 
                label="Core_Settings" 
                onClick={() => { setOpen(false); onShowSettings(); }} 
              />
              
              <DropdownItem 
                icon={musicOn ? <SoundOnIcon /> : <SoundOffIcon />} 
                label={musicOn ? "Audio_Link: ACTIVE" : "Audio_Link: OFFLINE"} 
                onClick={() => onToggleMusic()} 
                active={musicOn}
              />

              <div className="h-px bg-white/10 my-1 mx-2" />

              {isLoggedIn && (
                <DropdownItem 
                  icon={<LogoutIcon />} 
                  label="TERMINATE_SESSION" 
                  onClick={() => { setOpen(false); onLogout(); }} 
                  variant="danger"
                />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function DropdownItem({ 
  icon, 
  label, 
  onClick, 
  active = false, 
  variant = 'default' 
}: { 
  icon: React.ReactNode; 
  label: string; 
  onClick: () => void; 
  active?: boolean;
  variant?: 'default' | 'warning' | 'danger';
}) {
  const colors = {
    default: active ? 'text-cyan-400 bg-cyan-500/10' : 'text-white/60 hover:text-white hover:bg-white/5',
    warning: 'text-amber-500/80 hover:text-amber-400 hover:bg-amber-500/10',
    danger: 'text-red-500/80 hover:text-red-400 hover:bg-red-500/10'
  };

  return (
    <button
      onClick={(e) => { playSciFiClick(); onClick(); }}
      className={`w-full flex items-center gap-4 px-4 py-3 rounded-lg font-orbitron text-[10px] tracking-widest uppercase transition-all duration-200 ${colors[variant]}`}
    >
      <span className="shrink-0">{icon}</span>
      <span className="font-bold">{label}</span>
    </button>
  );
}

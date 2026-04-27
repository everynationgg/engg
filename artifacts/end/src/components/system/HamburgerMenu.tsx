import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import HowToPlayModal from "@/components/game/HowToPlayModal";
import { useQuitGame } from "@/components/system/QuitGameButton";
import ConfirmModal from "@/components/common/ConfirmModal";
import { playMechanicalChunk } from "@/lib/sound";

interface HamburgerMenuProps {
  onShowSettings: () => void;
  onShowProfile: () => void;
  onShowHowToPlay?: () => void;
  onShowAuth?: () => void;
  musicOn: boolean;
  onToggleMusic: () => void;
  playSound: () => void;
  showQuitButton?: boolean;
  isHost?: boolean;
  onRestartRound?: () => void;
}

export default function HamburgerMenu({
  onShowSettings,
  onShowProfile,
  onShowAuth,
  musicOn,
  onToggleMusic,
  playSound,
  showQuitButton = false,
  isHost = false,
  onRestartRound,
}: HamburgerMenuProps) {
  const { isLoggedIn, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuClosing, setMenuClosing] = useState(false);
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const { midGame, showConfirm, openConfirm, closeConfirm, handleConfirmQuit } = useQuitGame(isHost);

  const closeMenu = useCallback(() => {
    if (!menuOpen || menuClosing) return;
    playMechanicalChunk();
    setMenuClosing(true);
    setTimeout(() => {
      setMenuOpen(false);
      setMenuClosing(false);
    }, 400);
  }, [menuOpen, menuClosing]);

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
    if (menuOpen) {
      closeMenu();
    } else {
      playMechanicalChunk();
      setMenuOpen(true);
    }
  };

  const menuItems = [];

  if (isLoggedIn) {
    menuItems.push({
      id: "profile",
      icon: <ProfileIcon />,
      label: "PROFILE",
      tooltip: "Access service records and personal identity data.",
      onClick: () => handleMenuItemClick(onShowProfile),
      color: "#00f3ff"
    });
    menuItems.push({
      id: "logout",
      icon: <LogoutIcon />,
      label: "LOGOUT",
      tooltip: "Terminate current authenticated session.",
      onClick: handleLogout,
      color: "#ffaa00"
    });
  } else if (onShowAuth) {
    menuItems.push({
      id: "login",
      icon: <LoginIcon />,
      label: "LOGIN",
      tooltip: "Establish a secure identity handshake.",
      onClick: () => handleMenuItemClick(onShowAuth),
      color: "#ffaa00"
    });
  }

  menuItems.push({
    id: "settings",
    icon: <SettingsIcon />,
    label: "SETTINGS",
    tooltip: "Adjust mission parameters and interface aesthetics.",
    onClick: () => handleMenuItemClick(onShowSettings),
    color: "#c084fc"
  });

  menuItems.push({
    id: "howtoplay",
    icon: <ManualIcon />,
    label: "MANUAL",
    tooltip: "Consult the operative's tactical field manual.",
    onClick: () => { playSound(); closeMenu(); setShowHowToPlay(true); },
    color: "#00f3ff"
  });

  menuItems.push({
    id: "sound",
    icon: musicOn ? <SoundOnIcon /> : <SoundOffIcon />,
    label: "AUDIO",
    tooltip: "Toggle acoustic feedback protocols.",
    onClick: () => { playSound(); onToggleMusic(); },
    color: musicOn ? "#00f3ff" : "rgba(255,255,255,0.3)"
  });

  if (showQuitButton) {
    menuItems.push({
      id: "quit",
      icon: <ExitIcon />,
      label: midGame ? "QUIT GAME" : "QUIT",
      tooltip: midGame ? "Abort active mission and retreat." : "Exit current sector.",
      onClick: () => { playSound(); closeMenu(); openConfirm(); },
      color: "#ff4e4e"
    });
  }

  if (isHost && onRestartRound) {
    menuItems.push({
      id: "restart",
      icon: <RestartIcon />,
      label: "RESTART",
      tooltip: "Re-initialize current mission cycle.",
      onClick: () => handleMenuItemClick(onRestartRound),
      color: "#00f3ff"
    });
  }

  // --- DESKTOP VS MOBILE FILTERING ---
  const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 1024;
  const filteredItems = isDesktop 
    ? menuItems.filter(item => ["restart", "logout"].includes(item.id)) 
    : menuItems;

  // Global ESC listener for desktop (opens the menu)
  useEffect(() => {
    if (!isDesktop) return;
    const handleGlobalEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !menuOpen) {
        e.preventDefault();
        toggleMenu();
      }
    };
    window.addEventListener("keydown", handleGlobalEsc);
    return () => window.removeEventListener("keydown", handleGlobalEsc);
  }, [isDesktop, menuOpen]);

  return (
    <div
      className="fixed z-50 right-4 bottom-12 sm:right-12 sm:bottom-12"
    >
      {/* Backdrop overlay */}
      {menuOpen && (
        <div
          className={`fixed inset-0 -z-10 transition-all duration-500 ${menuClosing ? "opacity-0" : "opacity-100 backdrop-blur-[2px] bg-black/40"}`}
          onClick={closeMenu}
        />
      )}

      {menuOpen && (
        <div className="absolute inset-0 pointer-events-none z-10 flex items-center justify-center">
          {/* Tactical Ring Background */}
          <div className={`absolute w-[280px] h-[280px] sm:w-[400px] sm:h-[400px] border border-cyan-500/10 rounded-full transition-all duration-700 ${menuClosing ? "scale-0 opacity-0" : "scale-100 opacity-100"}`}>
            <div className="absolute inset-0 border-t-2 border-cyan-500/20 rounded-full animate-[spin_20s_linear_infinite]" />
            <div className="absolute inset-4 border border-white/5 rounded-full" />
          </div>

          {filteredItems.map((item, index) => {
            const arcAngle = isDesktop ? 60 : 90; // Tighter arc for desktop interrupt panel
            const startAngle = isDesktop ? 210 : 180; 
            const angleOffset = filteredItems.length > 1 ? arcAngle / (filteredItems.length - 1) : 0;
            const angle = startAngle + (index * angleOffset);
            const radius = typeof window !== 'undefined' && window.innerWidth < 640 ? 140 : 200;
            const rad = angle * (Math.PI / 180);
            const x = radius * Math.cos(rad);
            const y = radius * Math.sin(rad);

            return (
              <button
                key={item.id}
                onClick={item.onClick}
                className="absolute flex items-center justify-center w-14 h-14 rounded-full cursor-pointer pointer-events-auto group"
                style={{
                  background: "rgb(12, 16, 22)",
                  border: `1px solid ${item.color}40`,
                  color: item.color,
                  backdropFilter: "blur(10px)",
                  boxShadow: `0 0 20px ${item.color}15`,
                  transform: menuClosing ? "translate(0px, 0px) scale(0) rotate(-90deg)" : `translate(${x}px, ${y}px) scale(1) rotate(0deg)`,
                  transition: `transform 0.5s cubic-bezier(0.19, 1, 0.22, 1) ${menuClosing ? 0 : index * 0.04}s, border-color 0.2s, box-shadow 0.2s`,
                  opacity: menuClosing ? 0 : 1,
                }}
              >
                {/* Animated Scanline for each button */}
                <div className="absolute inset-x-0 top-0 h-px bg-white/20 shadow-[0_0_5px_white] animate-[scan_2s_linear_infinite]" />

                <div className="relative z-10 transition-transform group-hover:scale-110">
                  {item.icon}
                </div>

                <div className="absolute inset-0 rounded-full overflow-hidden pointer-events-none">
                  {/* Animated Scanline for each button */}
                  <div className="absolute inset-x-0 top-0 h-px bg-white/20 shadow-[0_0_5px_white] animate-[scan_2s_linear_infinite]" />
                  <div className="absolute inset-0 bg-white/0 group-hover:bg-white/5 transition-colors" />
                </div>

                {/* Hover Label */}
                <div className="absolute whitespace-nowrap flex flex-row items-center transition-all duration-300 pointer-events-none opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 z-50"
                  style={{
                    right: "120%",
                    top: "50%",
                    transform: "translateY(-50%)",
                    textShadow: "0 0 10px rgba(0,0,0,0.8)"
                  }}>
                  <span className="px-3 py-1 bg-black/95 border border-white/20 text-[9px] font-orbitron tracking-[0.3em] shadow-[0_0_20px_rgba(0,0,0,0.8)]"
                    style={{ color: item.color, borderRightColor: item.color, borderRightWidth: '2px' }}>
                    {item.label}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Main Hamburger Trigger */}
      <button
        onClick={toggleMenu}
        className="flex items-center justify-center w-16 h-16 rounded-full border border-white/10 relative group z-10 overflow-hidden transition-all duration-300 lg:hidden"
        style={{
          background: menuOpen ? "rgba(0, 243, 255, 0.1)" : "rgba(12, 16, 22, 0.8)",
          borderColor: menuOpen ? "#00f3ff" : "rgba(255,255,255,0.1)",
          boxShadow: menuOpen ? "0 0 30px rgba(0, 243, 255, 0.2), inset 0 0 10px rgba(0, 243, 255, 0.1)" : "0 0 15px rgba(0,0,0,0.3)",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/5 to-transparent" />

        <svg viewBox="0 0 100 100" width="28" height="28" className="relative z-10 transition-all duration-500" style={{ transform: menuOpen ? "rotate(180deg)" : "rotate(0deg)" }}>
          {menuOpen ? (
            <path d="M30 30 L70 70 M70 30 L30 70" stroke={menuOpen ? "#00f3ff" : "white"} strokeWidth="6" strokeLinecap="square" />
          ) : (
            <>
              <path d="M20 35 L80 35" stroke="white" strokeWidth="4" strokeLinecap="square" className="opacity-40" />
              <path d="M20 50 L80 50" stroke="#00f3ff" strokeWidth="4" strokeLinecap="square" />
              <path d="M20 65 L50 65" stroke="white" strokeWidth="4" strokeLinecap="square" className="opacity-40" />
            </>
          )}
        </svg>

        {/* Pulse Effect when closed */}
        {!menuOpen && (
          <div className="absolute inset-0 border border-cyan-500/20 rounded-full animate-ping opacity-20" />
        )}
      </button>

      {showHowToPlay && <HowToPlayModal onClose={() => setShowHowToPlay(false)} />}

      {showQuitButton && (
        <ConfirmModal
          isOpen={showConfirm}
          title="TERMINATE SESSION"
          message="Confirm intentional disconnect from current operation?"
          warning={
            isHost
              ? "WARNING: HOST_STATUS ACTIVE. SESSION WILL TERMINATE FOR ALL OPERATORS."
              : midGame
                ? "WARNING: MID_ENGAGEMENT. DISCONNECT WILL IMPACT UNIT COHESION."
                : undefined
          }
          confirmLabel="TERMINATE"
          cancelLabel="RESUME"
          onConfirm={handleConfirmQuit}
          onCancel={closeConfirm}
        />
      )}

      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes scan {
          0% { top: 0%; opacity: 0; }
          5% { opacity: 1; }
          95% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
      `}} />
    </div>
  );
}

/* --- High Fidelity SVG Icons --- */
function ProfileIcon() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /><path d="M20 8l-2 2-2-2" opacity="0.4" /></svg>; }
function LogoutIcon() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>; }
function LoginIcon() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" /><polyline points="10 17 5 12 10 7" /><line x1="15" y1="12" x2="5" y2="12" /></svg>; }
function SettingsIcon() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>; }
function ManualIcon() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></svg>; }
function SoundOnIcon() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><path d="M19.07 4.93a10 10 0 0 1 0 14.14" /><path d="M15.54 8.46a5 5 0 0 1 0 7.07" /></svg>; }
function SoundOffIcon() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><line x1="23" y1="9" x2="17" y2="15" /><line x1="17" y1="9" x2="23" y2="15" /></svg>; }
function ExitIcon() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter"><path d="M18.36 6.64a9 9 0 1 1-12.73 0" /><line x1="12" y1="2" x2="12" y2="12" /></svg>; }
function RestartIcon() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter"><polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" /></svg>; }

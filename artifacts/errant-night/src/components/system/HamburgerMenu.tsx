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
  const { isLoggedIn, isGuest, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const { midGame, showConfirm, openConfirm, closeConfirm, handleConfirmQuit } = useQuitGame(isHost);

  const closeMenu = useCallback(() => {
    if (!menuOpen) return;
    playMechanicalChunk();
    setMenuOpen(false);
  }, [menuOpen]);

  // Hardware Back & Escape handlers
  useEffect(() => {
    if (!menuOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        closeMenu();
      }
    };

    const handleBackButton = (e: Event) => {
      e.preventDefault();
      closeMenu();
    };

    window.addEventListener("keydown", handleKeyDown);
    document.addEventListener("backbutton", handleBackButton);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("backbutton", handleBackButton);
    };
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
    window.location.reload();
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

  interface MenuItem {
    id: string;
    icon: React.ReactNode;
    label: string;
    tooltip: string;
    onClick: () => void;
    color: string;
    badge?: string;
  }

  const menuItems: MenuItem[] = [];

  menuItems.push({
    id: "resume",
    icon: <PlayIcon />,
    label: "RESUME",
    tooltip: "Return to the current match.",
    onClick: closeMenu,
    color: "#00f3ff",
  });

  if (isLoggedIn) {
    menuItems.push({
      id: "profile",
      icon: <ProfileIcon />,
      label: "PROFILE",
      tooltip: "View account details and restore credits.",
      onClick: () => handleMenuItemClick(onShowProfile),
      color: "#00f3ff",
    });
    menuItems.push({
      id: "logout",
      icon: <LogoutIcon />,
      label: isGuest ? "RESET GUEST" : "SIGN OUT",
      tooltip: isGuest ? "Reset guest session and reload." : "Sign out of your account.",
      onClick: handleLogout,
      color: "#ffaa00",
    });
  }

  menuItems.push({
    id: "settings",
    icon: <SettingsIcon />,
    label: "SETTINGS",
    tooltip: "Adjust audio, graphics, and accessibility.",
    onClick: () => handleMenuItemClick(onShowSettings),
    color: "#c084fc",
  });

  menuItems.push({
    id: "howtoplay",
    icon: <ManualIcon />,
    label: "HOW TO PLAY",
    tooltip: "Read rules, game phases, and role abilities.",
    onClick: () => {
      playSound();
      closeMenu();
      setShowHowToPlay(true);
    },
    color: "#00f3ff",
  });

  menuItems.push({
    id: "sound",
    icon: musicOn ? <SoundOnIcon /> : <SoundOffIcon />,
    label: "MUSIC",
    tooltip: musicOn ? "Background music is on" : "Background music is muted",
    onClick: () => {
      playSound();
      onToggleMusic();
    },
    color: musicOn ? "#00f3ff" : "rgba(255,255,255,0.4)",
    badge: musicOn ? "ON" : "OFF",
  });

  if (showQuitButton) {
    menuItems.push({
      id: "quit",
      icon: <ExitIcon />,
      label: midGame ? "LEAVE MATCH" : "LEAVE LOBBY",
      tooltip: midGame ? "Leave the active match and return to the lobby." : "Return to the main screen.",
      onClick: () => {
        playSound();
        closeMenu();
        openConfirm();
      },
      color: "#ff4e4e",
    });
  }

  if (isHost && onRestartRound) {
    menuItems.push({
      id: "restart",
      icon: <RestartIcon />,
      label: "RESTART ROUND",
      tooltip: "Return all players to role selection.",
      onClick: () => handleMenuItemClick(onRestartRound),
      color: "#00f3ff",
    });
  }

  return (
    <>
      {/* Floating Trigger Button (Bottom-Right) */}
      <div
        className="fixed z-[65] pointer-events-auto"
        style={{
          right: "max(16px, calc(env(safe-area-inset-right, 16px) + 8px))",
          bottom: "max(16px, calc(env(safe-area-inset-bottom, 16px) + 12px))",
        }}
      >
        <button
          onClick={toggleMenu}
          aria-label={menuOpen ? "Close mission menu" : "Open mission menu"}
          className="flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-full border relative group overflow-hidden transition-all duration-200 active:scale-90 cursor-pointer shadow-lg active:shadow-cyan-500/40"
          style={{
            background: menuOpen ? "hsl(185 80% 15% / 0.95)" : "hsl(220 30% 12% / 0.95)",
            borderColor: menuOpen ? "#00f3ff" : "rgba(0, 243, 255, 0.45)",
            boxShadow: menuOpen
              ? "0 0 25px rgba(0, 243, 255, 0.5), inset 0 0 10px rgba(0, 243, 255, 0.3)"
              : "0 0 15px rgba(0, 243, 255, 0.25), 0 4px 20px rgba(0,0,0,0.6)",
            touchAction: "manipulation",
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/10 to-transparent" />

          <svg
            viewBox="0 0 100 100"
            width="26"
            height="26"
            className="relative z-10 transition-transform duration-300"
            style={{ transform: menuOpen ? "rotate(90deg)" : "rotate(0deg)" }}
          >
            {menuOpen ? (
              <path
                d="M30 30 L70 70 M70 30 L30 70"
                stroke="#00f3ff"
                strokeWidth="7"
                strokeLinecap="round"
              />
            ) : (
              <>
                <path d="M22 34 L78 34" stroke="white" strokeWidth="5" strokeLinecap="round" className="opacity-60" />
                <path d="M22 50 L78 50" stroke="#00f3ff" strokeWidth="5" strokeLinecap="round" />
                <path d="M22 66 L55 66" stroke="white" strokeWidth="5" strokeLinecap="round" className="opacity-60" />
              </>
            )}
          </svg>

          {/* Subtle pulse effect when idle */}
          {!menuOpen && (
            <div className="absolute inset-0 border border-cyan-500/30 rounded-full animate-ping opacity-25 pointer-events-none" />
          )}
        </button>
      </div>

      {/* Tactical Bottom Sheet Menu Modal */}
      {menuOpen && (
        <div className="fixed inset-0 z-[100] flex flex-col justify-end sm:items-end sm:justify-end sm:p-6">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity duration-300"
            onClick={closeMenu}
          />

          {/* Sheet Container */}
          <div
            className="relative z-10 w-full sm:max-w-md bg-[#0a0f1d] border-t sm:border border-cyan-500/30 rounded-t-2xl sm:rounded-2xl shadow-[0_-10px_50px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col max-h-[85vh] animate-in slide-in-from-bottom duration-250"
            onClick={(e) => e.stopPropagation()}
            style={{
              boxShadow: "0 0 50px rgba(0, 243, 255, 0.15), 0 -10px 40px rgba(0,0,0,0.8)",
            }}
          >
            {/* HUD Corner Accents */}
            <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-cyan-500/50 pointer-events-none" />
            <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-cyan-500/50 pointer-events-none" />

            {/* Header */}
            <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between shrink-0 bg-white/[0.02]">
              <div className="flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_#00f3ff]" />
                <div>
                  <h3 className="font-orbitron font-bold text-sm tracking-[0.2em] text-cyan-300 uppercase">
                    Game Menu
                  </h3>
                  <p className="font-mono text-[10px] text-white/55 tracking-widest uppercase">
                    Match Controls &amp; Options
                  </p>
                </div>
              </div>

              {/* Close Button */}
              <button
                onClick={closeMenu}
                aria-label="Close menu"
                className="w-11 h-11 flex items-center justify-center rounded-lg border border-cyan-500/40 bg-cyan-500/10 hover:bg-cyan-500/20 active:scale-95 text-cyan-300 font-mono text-xl transition-all cursor-pointer"
                style={{ touchAction: "manipulation" }}
              >
                ✕
              </button>
            </div>

            {/* Action Items List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2.5 custom-scrollbar">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={item.onClick}
                  className="w-full flex items-center gap-3.5 p-3.5 rounded-xl border transition-all text-left group active:scale-[0.97] active:bg-cyan-500/20 cursor-pointer"
                  style={{
                    background: "hsl(220 28% 10% / 0.8)",
                    borderColor: `${item.color}35`,
                    touchAction: "manipulation",
                  }}
                >
                  <div
                    className="w-11 h-11 rounded-lg flex items-center justify-center shrink-0 transition-transform group-hover:scale-105"
                    style={{
                      background: `${item.color}15`,
                      border: `1px solid ${item.color}50`,
                      color: item.color,
                      boxShadow: `0 0 12px ${item.color}20`,
                    }}
                  >
                    {item.icon}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className="font-orbitron text-xs sm:text-sm font-bold tracking-wider"
                        style={{ color: item.color }}
                      >
                        {item.label}
                      </span>
                      {item.badge && (
                        <span
                          className="px-2 py-0.5 rounded text-[9px] font-mono tracking-widest font-bold"
                          style={{ background: `${item.color}25`, color: item.color }}
                        >
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <p className="font-mono text-[10px] text-white/50 truncate mt-0.5">
                      {item.tooltip}
                    </p>
                  </div>

                  <span className="text-white/30 group-hover:text-cyan-400 group-hover:translate-x-0.5 transition-all text-lg font-mono">
                    ›
                  </span>
                </button>
              ))}
            </div>

            {/* Bottom Safe Area & Dismiss Bar */}
            <div
              className="p-4 pt-2 border-t border-white/5 shrink-0 bg-white/[0.01]"
              style={{
                paddingBottom: "max(16px, calc(env(safe-area-inset-bottom, 16px) + 8px))",
              }}
            >
              <button
                onClick={closeMenu}
                className="w-full py-3.5 rounded-xl border border-cyan-500/40 bg-cyan-500/10 hover:bg-cyan-500/20 active:scale-[0.98] text-cyan-300 font-orbitron text-xs tracking-[0.2em] uppercase font-bold transition-all cursor-pointer flex items-center justify-center gap-2"
                style={{ touchAction: "manipulation" }}
              >
                <span>RESUME GAME</span>
                <span className="text-sm">↩</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {showHowToPlay && <HowToPlayModal onClose={() => setShowHowToPlay(false)} />}

      {showQuitButton && (
        <ConfirmModal
          isOpen={showConfirm}
          title="LEAVE MATCH"
          message="Are you sure you want to leave the current match?"
          warning={
            isHost
              ? "You are the host. Leaving will end the match for everyone in the lobby."
              : midGame
                ? "Leaving during an active match will forfeit the round for your team."
                : undefined
          }
          confirmLabel="LEAVE MATCH"
          cancelLabel="STAY"
          onConfirm={handleConfirmQuit}
          onCancel={closeConfirm}
        />
      )}
    </>
  );
}

/* --- High Fidelity SVG Icons --- */
function ProfileIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

function ManualIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  );
}

function SoundOnIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
    </svg>
  );
}

function SoundOffIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <line x1="23" y1="9" x2="17" y2="15" />
      <line x1="17" y1="9" x2="23" y2="15" />
    </svg>
  );
}

function ExitIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square">
      <path d="M18.36 6.64a9 9 0 1 1-12.73 0" />
      <line x1="12" y1="2" x2="12" y2="12" />
    </svg>
  );
}

function RestartIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square">
      <polyline points="23 4 23 10 17 10" />
      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square">
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  );
}

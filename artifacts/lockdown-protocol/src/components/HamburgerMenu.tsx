import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import HowToPlayModal from "@/components/HowToPlayModal";
import { useQuitGame } from "@/components/QuitGameButton";
import ConfirmModal from "@/components/ConfirmModal";

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
}: HamburgerMenuProps) {
  const { isLoggedIn, logout, username } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuClosing, setMenuClosing] = useState(false);
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const { midGame, showConfirm, openConfirm, closeConfirm, handleConfirmQuit } = useQuitGame(isHost);

  const closeMenu = useCallback(() => {
    if (!menuOpen || menuClosing) return;
    setMenuClosing(true);
    setTimeout(() => {
      setMenuOpen(false);
      setMenuClosing(false);
    }, 400); // Wait for radial animation to finish
  }, [menuOpen, menuClosing]);

  // Close on ESC key
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
  };

  const toggleMenu = () => {
    playSound();
    if (menuOpen) {
      closeMenu();
    } else {
      setMenuOpen(true);
    }
  };

  const menuItems = [];

  if (isLoggedIn) {
    menuItems.push({
      id: "profile",
      icon: "📊",
      label: "PROFILE",
      onClick: () => handleMenuItemClick(onShowProfile),
      color: "hsl(185 100% 50%)"
    });
    menuItems.push({
      id: "logout",
      icon: "👤",
      label: "LOGOUT",
      onClick: handleLogout,
      color: "hsl(50 100% 50%)"
    });
  } else if (onShowAuth) {
    menuItems.push({
      id: "login",
      icon: "🔐",
      label: "LOGIN",
      onClick: () => handleMenuItemClick(onShowAuth),
      color: "hsl(50 100% 50%)"
    });
  }

  menuItems.push({
    id: "settings",
    icon: "⚙️",
    label: "SETTINGS",
    onClick: () => handleMenuItemClick(onShowSettings),
    color: "hsl(270 80% 55%)"
  });

  menuItems.push({
    id: "howtoplay",
    icon: "📖",
    label: "HOW TO PLAY",
    onClick: () => { playSound(); closeMenu(); setShowHowToPlay(true); },
    color: "hsl(270 80% 55%)"
  });

  menuItems.push({
    id: "sound",
    icon: musicOn ? "🔊" : "🔇",
    label: "SOUND",
    onClick: () => { playSound(); onToggleMusic(); },
    color: musicOn ? "hsl(185 100% 50%)" : "hsl(210 30% 50%)"
  });

  if (showQuitButton) {
    menuItems.push({
      id: "quit",
      icon: "🚪",
      label: "QUIT",
      onClick: () => { playSound(); closeMenu(); openConfirm(); },
      color: "hsl(0 75% 55%)"
    });
  }

  return (
    <div
      className="fixed z-50"
      style={{
        right: "calc(0.75rem + env(safe-area-inset-right, 0px))",
        bottom: "calc(0.75rem + env(safe-area-inset-bottom, 0px))",
      }}
    >
      {/* Backdrop overlay — click outside to close */}
      {menuOpen && (
        <div
          className={`fixed inset-0 -z-10 ${menuClosing ? "ix-backdrop" : "ix-backdrop ix-backdrop-blur"}`}
          style={{
            background: "rgba(0, 0, 0, 0.5)",
            animation: menuClosing ? "ix-fade-out 200ms ease-in both" : undefined,
          }}
          onClick={closeMenu}
        />
      )}

      {/* Radial Menu Items */}
      {menuOpen && (
        <div className="absolute inset-0 pointer-events-none -z-10 flex items-center justify-center">
          {menuItems.map((item, index) => {
            // Spread evenly from 180deg (Left) to 270deg (Top)
            const angleOffset = menuItems.length > 1 ? 90 / (menuItems.length - 1) : 0;
            const angle = 180 + (index * angleOffset);
            const radius = 130; // Distance from center
            const rad = angle * (Math.PI / 180);
            
            // Offset logic so it works on mobile devices too
            const x = radius * Math.cos(rad);
            const y = radius * Math.sin(rad);

            return (
              <button
                key={item.id}
                onClick={item.onClick}
                className="absolute flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-full cursor-pointer pointer-events-auto ix-btn group/item"
                style={{
                  background: "hsl(220 28% 10% / 0.85)",
                  border: `2px solid ${item.color}`,
                  color: item.color,
                  backdropFilter: "blur(6px)",
                  boxShadow: `0 0 15px ${item.color.replace(')', ' / 0.2)')}, inset 0 0 5px ${item.color.replace(')', ' / 0.1)')}`,
                  transform: menuClosing ? "translate(0px, 0px) scale(0)" : `translate(${x}px, ${y}px) scale(1)`,
                  transition: `transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) ${menuClosing ? 0 : index * 0.05}s, box-shadow 0.2s, background 0.2s`,
                  opacity: menuClosing ? 0 : 1,
                  transformOrigin: "center"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = item.color.replace(')', ' / 0.2)');
                  e.currentTarget.style.boxShadow = `0 0 20px ${item.color.replace(')', ' / 0.4)')}, inset 0 0 10px ${item.color.replace(')', ' / 0.2)')}`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "hsl(220 28% 10% / 0.85)";
                  e.currentTarget.style.boxShadow = `0 0 15px ${item.color.replace(')', ' / 0.2)')}, inset 0 0 5px ${item.color.replace(')', ' / 0.1)')}`;
                }}
                title={item.label}
              >
                <span style={{ fontSize: "1.4em" }}>{item.icon}</span>
                
                {/* Tooltip label (Desktop only) */}
                <span className="hidden sm:block absolute whitespace-nowrap px-2 py-1 bg-black/80 rounded border text-[10px] font-orbitron tracking-widest opacity-0 group-hover/item:opacity-100 transition-opacity pointer-events-none shadow-lg"
                      style={{ 
                        borderColor: item.color,
                        color: item.color,
                        top: "-35px",
                        left: "50%",
                        transform: "translateX(-50%)",
                        boxShadow: `0 0 10px ${item.color.replace(')', ' / 0.3)')}`
                      }}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Hamburger Button */}
      <button
        onClick={toggleMenu}
        className="ix-btn flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-full border-2 font-orbitron cursor-pointer relative group z-10"
        style={{
          background: menuOpen ? "hsl(185 100% 15%)" : "hsl(220 28% 8% / 0.85)",
          borderColor: menuOpen ? "hsl(185 100% 50%)" : "hsl(210 30% 35%)",
          color: menuOpen ? "hsl(185 100% 60%)" : "hsl(210 30% 60%)",
          backdropFilter: "blur(6px)",
          boxShadow: menuOpen ? "0 0 20px hsl(185 100% 50% / 0.4), inset 0 0 10px hsl(185 100% 50% / 0.1)" : "0 0 10px hsl(210 30% 35% / 0.2)",
          transition: "box-shadow 300ms ease, background-color 300ms ease, border-color 300ms ease, color 300ms ease",
        }}
        aria-label="Toggle menu"
      >
        <svg viewBox="0 0 100 100" width="30" height="30" className="stroke-current fill-none transition-transform duration-300" style={{ transform: menuOpen ? "rotate(180deg)" : "rotate(0deg)" }}>
           {menuOpen ? (
              <>
                 <line x1="30" y1="30" x2="70" y2="70" strokeWidth="8" strokeLinecap="round" />
                 <line x1="70" y1="30" x2="30" y2="70" strokeWidth="8" strokeLinecap="round" />
              </>
           ) : (
              <>
                 <line x1="20" y1="35" x2="80" y2="35" strokeWidth="8" strokeLinecap="round" />
                 <line x1="20" y1="50" x2="80" y2="50" strokeWidth="8" strokeLinecap="round" />
                 <line x1="20" y1="65" x2="50" y2="65" strokeWidth="8" strokeLinecap="round" />
              </>
           )}
        </svg>
      </button>

      {/* Menu label on hover */}
      {!menuOpen && (
        <div className="absolute top-[-30px] right-0 bg-black/80 text-cyan-400 px-2 py-1 rounded border border-cyan-500/50 text-[10px] font-orbitron tracking-[0.1em] opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none"
          style={{ boxShadow: "0 0 10px hsl(185 100% 50% / 0.3)" }}>
          MENU
        </div>
      )}

      {/* How to Play Modal */}
      {showHowToPlay && <HowToPlayModal onClose={() => setShowHowToPlay(false)} />}

      {/* Quit Game Confirm Modal */}
      {showQuitButton && (
        <ConfirmModal
          isOpen={showConfirm}
          title="Quit Game?"
          message="Are you sure you want to leave this game?"
          warning={
            isHost
              ? "⚠ You are the host. Quitting may end the game for all players."
              : midGame
                ? "⚠ Leaving will interrupt the game for all players."
                : undefined
          }
          confirmLabel="Quit"
          cancelLabel="Cancel"
          onConfirm={handleConfirmQuit}
          onCancel={closeConfirm}
        />
      )}
    </div>
  );
}
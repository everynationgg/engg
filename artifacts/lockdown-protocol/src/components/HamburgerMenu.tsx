import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import howToPlayImg from "@assets/How_to_Play.webp";
import { QuitGameButtonInner, useQuitGame } from "@/components/QuitGameButton";
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
    }, 180);
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

  // Track stagger index for menu items
  let staggerIndex = 0;

  return (
    <div
      className="fixed z-20"
      style={{
        right: "calc(0.75rem + env(safe-area-inset-right, 0px))",
        bottom: "calc(0.75rem + env(safe-area-inset-bottom, 0px))",
      }}
    >
      {/* Hamburger Button */}
      <button
        onClick={toggleMenu}
        className="ix-btn flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded border font-orbitron text-xl sm:text-2xl cursor-pointer relative group"
        style={{
          background: menuOpen ? "hsl(185 100% 15%)" : "hsl(220 28% 8% / 0.85)",
          borderColor: menuOpen ? "hsl(185 100% 50%)" : "hsl(210 30% 35%)",
          color: menuOpen ? "hsl(185 100% 60%)" : "hsl(210 30% 60%)",
          backdropFilter: "blur(6px)",
          boxShadow: menuOpen ? "0 0 20px hsl(185 100% 50% / 0.4), inset 0 0 10px hsl(185 100% 50% / 0.1)" : "0 0 10px hsl(210 30% 35% / 0.2)",
          transition: "box-shadow 220ms ease, background-color 220ms ease, border-color 220ms ease, color 220ms ease",
        }}
        aria-label="Toggle menu"
        title={menuOpen ? "Close menu" : "Open menu"}
      >
        ☰
      </button>

      {/* Menu label on hover */}
      {!menuOpen && (
        <div className="absolute bottom-16 right-0 bg-gray-900 text-cyan-400 px-2 py-1 rounded text-xs font-orbitron tracking-[0.1em] opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none"
          style={{ borderBottom: "1px solid hsl(185 100% 50% / 0.3)" }}>
          MENU
        </div>
      )}

      {/* Backdrop overlay — click outside to close */}
      {menuOpen && (
        <div
          className={`fixed inset-0 z-10 ${menuClosing ? "ix-backdrop" : "ix-backdrop ix-backdrop-blur"}`}
          style={{
            background: "rgba(0, 0, 0, 0.5)",
            animation: menuClosing ? "ix-fade-out 180ms ease-in both" : undefined,
          }}
          onClick={closeMenu}
        />
      )}

      {/* Dropdown Menu Panel */}
      {menuOpen && (
        <div
          className={`absolute bottom-16 right-0 rounded border flex flex-col gap-3 p-4 w-56 shadow-2xl z-50 ${
            menuClosing ? "ix-menu-panel-exit" : "ix-menu-panel-enter"
          }`}
          style={{
            background: "linear-gradient(135deg, hsl(220 28% 10%) 0%, hsl(220 28% 12%) 100%)",
            borderColor: "hsl(185 100% 50% / 0.6)",
            backdropFilter: "blur(10px)",
            boxShadow: "0 10px 40px hsl(185 100% 50% / 0.2), inset 0 1px 0 hsl(185 100% 50% / 0.1)",
            transformOrigin: "bottom right",
          }}
        >
          {/* Section Label */}
          <div
            className="px-2 py-1 border-b ix-stagger-item"
            style={{ borderColor: "hsl(210 30% 25%)", "--ix-stagger-index": staggerIndex++ } as React.CSSProperties}
          >
            <p className="font-orbitron text-xs tracking-[0.2em] uppercase" style={{ color: "hsl(210 30% 50%)" }}>
              🎮 MENU
            </p>
          </div>

          {/* Login/Profile section */}
          {isLoggedIn ? (
            <>
              <button
                onClick={() => handleMenuItemClick(onShowProfile)}
                className="ix-btn ix-stagger-item flex items-center gap-3 px-3 py-2.5 rounded border text-left font-orbitron text-xs tracking-[0.1em] uppercase hover:translate-x-1"
                style={{
                  background: "hsl(185 80% 20%)",
                  borderColor: "hsl(185 100% 40%)",
                  color: "hsl(185 100% 70%)",
                  transition: "background 200ms ease, box-shadow 200ms ease, transform 180ms ease-out",
                  "--ix-stagger-index": staggerIndex++,
                } as React.CSSProperties}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "hsl(185 85% 25%)";
                  e.currentTarget.style.boxShadow = "0 0 15px hsl(185 100% 50% / 0.4), inset 0 0 10px hsl(185 100% 50% / 0.1)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "hsl(185 80% 20%)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <span style={{ fontSize: "1.2em" }}>📊</span>
                <span className="flex-1">PROFILE</span>
                <span style={{ fontSize: "0.8em", opacity: 0.6 }}>→</span>
              </button>
              <button
                onClick={handleLogout}
                className="ix-btn ix-stagger-item flex items-center gap-3 px-3 py-2.5 rounded border text-left font-orbitron text-xs tracking-[0.1em] uppercase hover:translate-x-1"
                style={{
                  background: "hsl(50 70% 20%)",
                  borderColor: "hsl(50 100% 40%)",
                  color: "hsl(50 100% 70%)",
                  transition: "background 200ms ease, box-shadow 200ms ease, transform 180ms ease-out",
                  "--ix-stagger-index": staggerIndex++,
                } as React.CSSProperties}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "hsl(50 80% 25%)";
                  e.currentTarget.style.boxShadow = "0 0 15px hsl(50 100% 50% / 0.4), inset 0 0 10px hsl(50 100% 50% / 0.1)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "hsl(50 70% 20%)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <span style={{ fontSize: "1.2em" }}>👤</span>
                <span className="flex-1 truncate">LOGOUT</span>
                <span style={{ fontSize: "0.7em", opacity: 0.5 }} title={username || "user"}>({(username || "user").slice(0, 4)}...)</span>
              </button>
            </>
          ) : onShowAuth ? (
            <button
              onClick={() => handleMenuItemClick(onShowAuth)}
              className="ix-btn ix-stagger-item flex items-center gap-3 px-3 py-2.5 rounded border text-left font-orbitron text-xs tracking-[0.1em] uppercase hover:translate-x-1"
              style={{
                background: "hsl(50 70% 20%)",
                borderColor: "hsl(50 100% 40%)",
                color: "hsl(50 100% 70%)",
                transition: "background 200ms ease, box-shadow 200ms ease, transform 180ms ease-out",
                "--ix-stagger-index": staggerIndex++,
              } as React.CSSProperties}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "hsl(50 80% 25%)";
                e.currentTarget.style.boxShadow = "0 0 15px hsl(50 100% 50% / 0.4), inset 0 0 10px hsl(50 100% 50% / 0.1)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "hsl(50 70% 20%)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <span style={{ fontSize: "1.2em" }}>🔐</span>
              <span className="flex-1">LOGIN</span>
              <span style={{ fontSize: "0.8em", opacity: 0.6 }}>→</span>
            </button>
          ) : (
            <div
              className="px-3 py-2 rounded text-xs font-orbitron tracking-[0.1em] text-center ix-stagger-item"
              style={{ color: "hsl(210 30% 60%)", "--ix-stagger-index": staggerIndex++ } as React.CSSProperties}
            >
              Login via landing page
            </div>
          )}

          {/* Settings — available to all users */}
          <button
            onClick={() => handleMenuItemClick(onShowSettings)}
            className="ix-btn ix-stagger-item flex items-center gap-3 px-3 py-2.5 rounded border text-left font-orbitron text-xs tracking-[0.1em] uppercase group/item hover:translate-x-1"
            style={{
              background: "hsl(270 70% 20%)",
              borderColor: "hsl(270 80% 30%)",
              color: "hsl(270 80% 70%)",
              transition: "background 200ms ease, box-shadow 200ms ease, transform 180ms ease-out",
              "--ix-stagger-index": staggerIndex++,
            } as React.CSSProperties}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "hsl(270 80% 25%)";
              e.currentTarget.style.boxShadow = "0 0 15px hsl(270 80% 50% / 0.4), inset 0 0 10px hsl(270 80% 50% / 0.1)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "hsl(270 70% 20%)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            <span style={{ fontSize: "1.2em" }}>⚙️</span>
            <span className="flex-1">SETTINGS</span>
            <span style={{ fontSize: "0.8em", opacity: 0.6 }}>→</span>
          </button>

          {/* Quit Game button - only shown on game pages */}
          {showQuitButton && (
            <div className="ix-stagger-item" style={{ "--ix-stagger-index": staggerIndex++ } as React.CSSProperties}>
              <QuitGameButtonInner
                playSound={playSound}
                onRequestQuit={() => {
                  closeMenu();
                  openConfirm();
                }}
              />
            </div>
          )}

          {/* Divider */}
          <div style={{ borderTop: "1px solid hsl(210 30% 25%)", margin: "4px 0" }} />

          {/* How to Play button */}
          <button
            onClick={() => {
              playSound();
              closeMenu();
              setShowHowToPlay(true);
            }}
            className="ix-btn ix-stagger-item flex items-center gap-3 px-3 py-2.5 rounded border text-left font-orbitron text-xs tracking-[0.1em] uppercase hover:translate-x-1"
            style={{
              background: "hsl(270 70% 20%)",
              borderColor: "hsl(270 80% 30%)",
              color: "hsl(270 80% 70%)",
              transition: "background 200ms ease, box-shadow 200ms ease, transform 180ms ease-out",
              "--ix-stagger-index": staggerIndex++,
            } as React.CSSProperties}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "hsl(270 80% 25%)";
              e.currentTarget.style.boxShadow = "0 0 15px hsl(270 80% 50% / 0.4), inset 0 0 10px hsl(270 80% 50% / 0.1)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "hsl(270 70% 20%)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            <span style={{ fontSize: "1.2em" }}>📖</span>
            <span className="flex-1">HOW TO PLAY</span>
            <span style={{ fontSize: "0.8em", opacity: 0.6 }}>→</span>
          </button>

          {/* Music toggle */}
          <button
            onClick={() => {
              playSound();
              onToggleMusic();
            }}
            className="ix-btn ix-stagger-item flex items-center gap-3 px-3 py-2.5 rounded border text-left font-orbitron text-xs tracking-[0.1em] uppercase hover:translate-x-1"
            style={{
              background: musicOn ? "hsl(185 70% 20%)" : "hsl(210 20% 25%)",
              borderColor: musicOn ? "hsl(185 100% 40%)" : "hsl(210 30% 35%)",
              color: musicOn ? "hsl(185 100% 60%)" : "hsl(210 30% 45%)",
              transition: "background 200ms ease, box-shadow 200ms ease, transform 180ms ease-out",
              "--ix-stagger-index": staggerIndex++,
            } as React.CSSProperties}
            onMouseEnter={(e) => {
              if (musicOn) {
                e.currentTarget.style.background = "hsl(185 80% 25%)";
                e.currentTarget.style.boxShadow = "0 0 15px hsl(185 100% 50% / 0.4), inset 0 0 10px hsl(185 100% 50% / 0.1)";
              } else {
                e.currentTarget.style.background = "hsl(210 25% 30%)";
                e.currentTarget.style.boxShadow = "0 0 15px hsl(210 30% 50% / 0.3), inset 0 0 10px hsl(210 30% 50% / 0.05)";
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = musicOn ? "hsl(185 70% 20%)" : "hsl(210 20% 25%)";
              e.currentTarget.style.boxShadow = "none";
            }}
            aria-label={musicOn ? "Mute music" : "Unmute music"}
          >
            <span style={{ fontSize: "1.2em" }}>{musicOn ? "🔊" : "🔇"}</span>
            <span className="flex-1">SOUND</span>
            <span style={{ fontSize: "0.7em", fontWeight: "bold", opacity: 0.8 }}>{musicOn ? "ON" : "OFF"}</span>
          </button>
        </div>
      )}

      {/* How to Play Modal */}
      {showHowToPlay && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6 ix-backdrop ix-backdrop-blur"
          style={{ background: "hsl(220 30% 4% / 0.9)" }}
          onClick={() => setShowHowToPlay(false)}
        >
          <div
            className="relative w-full max-w-sm max-h-full overflow-y-auto rounded-lg ix-modal-enter"
            style={{ border: "1px solid hsl(270 80% 55% / 0.4)", boxShadow: "0 0 40px hsl(270 80% 55% / 0.2)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowHowToPlay(false)}
              className="ix-btn absolute top-2 right-2 z-10 w-8 h-8 flex items-center justify-center rounded font-orbitron font-bold text-sm cursor-pointer"
              style={{
                background: "hsl(220 28% 10% / 0.9)",
                border: "1px solid hsl(210 30% 25%)",
                color: "hsl(190 60% 70%)",
              }}
              aria-label="Close"
            >
              ✕
            </button>
            <img
              src={howToPlayImg}
              alt="How to Play"
              className="w-full block rounded-lg"
              draggable={false}
              loading="lazy"
            />
          </div>
        </div>
      )}

      {/* Quit Game Confirm Modal - rendered outside dropdown so it persists after menu closes */}
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
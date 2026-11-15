import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import HowToPlayModal from "@/components/game/HowToPlayModal";
import ConfirmModal from "@/components/common/ConfirmModal";
import { playMechanicalChunk } from "@/lib/sound";
import { backNavigation } from "@/lib/backNavigation";

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
  const { isLoggedIn, isGuest, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

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

  // Android Back & Escape handlers via backNavigation (Priority 40)
  useEffect(() => {
    if (!menuOpen) return;
    return backNavigation.register(() => {
      closeMenu();
      return true;
    }, 40);
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
    playMechanicalChunk();
    setMenuOpen(!menuOpen);
  };

  const menuItems: {
    id: string;
    icon: React.ReactNode;
    label: string;
    onClick: () => void;
  }[] = [];

  // All users have guest profiles by default now, so always show PROFILE link
  menuItems.push({
    id: "profile",
    icon: <ProfileIcon />,
    label: "PROFILE",
    onClick: () => handleMenuItemClick(onShowProfile),
  });

  menuItems.push({
    id: "settings",
    icon: <SettingsIcon />,
    label: "SETTINGS",
    onClick: () => handleMenuItemClick(onShowSettings),
  });

  menuItems.push({
    id: "howtoplay",
    icon: <ManualIcon />,
    label: "HOW TO PLAY",
    onClick: () => {
      playSound();
      closeMenu();
      setShowHowToPlay(true);
    },
  });

  menuItems.push({
    id: "sound",
    icon: musicOn ? <SoundOnIcon /> : <SoundOffIcon />,
    label: musicOn ? "AUDIO ON" : "AUDIO OFF",
    onClick: () => {
      try { playSound(); } catch {}
      try { onToggleMusic(); } catch {}
    },
  });

  menuItems.push({
    id: "hub",
    icon: <LoginIcon />,
    label: "BACK TO HUB",
    onClick: () => {
      playSound();
      closeMenu();
      window.location.href = "/hub";
    },
  });

  return (
    <>
      {/* Hamburger Trigger Button */}
      <div
        style={{
          position: "fixed",
          top: "max(16px, calc(env(safe-area-inset-top, 24px) + 8px))",
          left: "max(16px, calc(env(safe-area-inset-left, 16px) + 8px))",
          zIndex: 60,
        }}
        className="lg:hidden"
      >
        <button
          onClick={toggleMenu}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "48px",
            height: "48px",
            borderRadius: "8px",
            border: "1px solid rgba(6,182,212,0.3)",
            backgroundColor: "rgb(10,15,30)",
            boxShadow: "0 0 15px rgba(0,243,255,0.15)",
            cursor: "pointer",
            transition: "transform 0.3s, filter 0.3s",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform = "scale(1.1)";
            (e.currentTarget as HTMLButtonElement).style.filter = "brightness(1.25)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)";
            (e.currentTarget as HTMLButtonElement).style.filter = "brightness(1)";
          }}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#22d3ee"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <line x1="4" y1="8" x2="20" y2="8" />
            <line x1="4" y1="12" x2="20" y2="12" />
            <line x1="4" y1="16" x2="16" y2="16" />
          </svg>
        </button>
      </div>

      <AnimatePresence>
        {menuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeMenu}
              style={{
                position: "fixed",
                inset: 0,
                zIndex: 70,
                backgroundColor: "rgba(0,0,0,0.65)",
                // NO backdrop-filter here — it causes bleed-through
              }}
            />

            {/* Sidebar — nuclear solid background */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                height: "100%",
                width: "280px",
                zIndex: 80,
                display: "flex",
                flexDirection: "column",
                // All solid — no transparency anywhere
                backgroundColor: "#0a0f1e",
                background: "#0a0f1e",
                isolation: "isolate",
                willChange: "transform",
                WebkitTransform: "translateZ(0)",
                transform: "translateZ(0)",
                boxShadow: "10px 0 40px rgba(0,0,0,0.95)",
                borderRight: "1px solid rgba(6,182,212,0.3)",
              }}
            >
              {/* Premium Texture Overlay */}
              <div style={{ 
                position: "absolute", 
                inset: 0, 
                opacity: 0.05, 
                pointerEvents: "none", 
                background: "url('https://grainy-gradients.vercel.app/noise.svg')",
                mixBlendMode: "overlay"
              }} />
              
              {/* Subtle Depth Gradient */}
              <div style={{ 
                position: "absolute", 
                inset: 0, 
                background: "radial-gradient(circle at 0% 0%, rgba(6,182,212,0.1), transparent 70%)",
                pointerEvents: "none"
              }} />
              {/* Cyan accent strip */}
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: "3px",
                  background:
                    "linear-gradient(to bottom, #06b6d4, #22d3ee, #0891b2)",
                  boxShadow: "0 0 15px rgba(6,182,212,0.5)",
                  zIndex: 1,
                }}
              />

              {/* Header */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "16px 20px",
                  paddingTop: "max(18px, var(--app-safe-top, 36px))",
                  backgroundColor: "hsl(220 30% 9%)",
                  borderBottom: "1px solid hsl(210 30% 18%)",
                  flexShrink: 0,
                }}
              >
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <span
                    className="font-orbitron"
                    style={{
                      fontWeight: 900,
                      fontSize: "18px",
                      letterSpacing: "0.15em",
                      color: "#ffffff",
                    }}
                  >
                    ENGG
                    <span style={{ color: "#22d3ee" }}>.</span>
                  </span>
                  <span
                    className="font-orbitron"
                    style={{
                      fontSize: "8px",
                      letterSpacing: "0.25em",
                      color: "rgba(34,211,238,0.75)",
                      textTransform: "uppercase",
                      fontWeight: 600,
                    }}
                  >
                    Every Nation Games
                  </span>
                </div>

                <button
                  onClick={closeMenu}
                  aria-label="Close navigation"
                  style={{
                    padding: "8px",
                    color: "rgba(255,255,255,0.6)",
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "8px",
                    cursor: "pointer",
                    transition: "color 0.2s, background 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.color = "#fff";
                    (e.currentTarget as HTMLButtonElement).style.background =
                      "rgba(255,255,255,0.15)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.color =
                      "rgba(255,255,255,0.6)";
                    (e.currentTarget as HTMLButtonElement).style.background =
                      "rgba(255,255,255,0.05)";
                  }}
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>

              {/* Nav Items */}
              <div
                style={{
                  flex: 1,
                  overflowY: "auto",
                  padding: "16px 12px",
                  backgroundColor: "hsl(220 30% 6%)",
                  touchAction: "pan-y",
                  WebkitOverflowScrolling: "touch",
                }}
              >
                {/* Section Label */}
                <div
                  className="font-orbitron"
                  style={{
                    fontSize: "9px",
                    letterSpacing: "0.25em",
                    color: "rgba(6,182,212,0.6)",
                    marginBottom: "14px",
                    paddingLeft: "12px",
                    textTransform: "uppercase",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    fontWeight: 700,
                  }}
                >
                  <div
                    style={{
                      width: "12px",
                      height: "1px",
                      backgroundColor: "rgba(6,182,212,0.4)",
                    }}
                  />
                  Navigation
                </div>

                <div
                  style={{ display: "flex", flexDirection: "column", gap: "3px" }}
                >
                  {menuItems.map((item) => (
                    <SidebarNavItem
                      key={item.id}
                      icon={item.icon}
                      label={item.label}
                      onClick={item.onClick}
                    />
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div
                style={{
                  padding: "16px 18px",
                  paddingBottom: "max(16px, var(--app-safe-bottom, 24px))",
                  borderTop: "1px solid hsl(210 30% 16%)",
                  backgroundColor: "hsl(220 30% 7%)",
                  flexShrink: 0,
                }}
              >
                {isLoggedIn && (
                  <button
                    onClick={() => {
                      if (isGuest) {
                        setShowResetConfirm(true);
                      } else {
                        handleLogout();
                      }
                    }}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      padding: "10px 16px",
                      borderRadius: "8px",
                      background: "rgba(239,68,68,0.06)",
                      border: "1px solid rgba(239,68,68,0.2)",
                      cursor: "pointer",
                      marginBottom: "12px",
                      transition: "background 0.2s, border-color 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                        "rgba(239,68,68,0.15)";
                      (e.currentTarget as HTMLButtonElement).style.borderColor =
                        "rgba(239,68,68,0.4)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                        "rgba(239,68,68,0.06)";
                      (e.currentTarget as HTMLButtonElement).style.borderColor =
                        "rgba(239,68,68,0.2)";
                    }}
                  >
                    <span style={{ color: "rgba(239,68,68,0.8)", display: "flex" }}>
                      <LogoutIcon />
                    </span>
                    <span
                      className="font-orbitron"
                      style={{
                        fontSize: "10px",
                        letterSpacing: "0.15em",
                        color: "rgba(239,68,68,0.9)",
                        textTransform: "uppercase",
                        fontWeight: 700,
                      }}
                    >
                      {isGuest ? "Reset Guest Profile" : "Sign Out"}
                    </span>
                  </button>
                )}

                <div style={{ textAlign: "center", paddingTop: "8px" }}>
                  <span
                    className="font-orbitron"
                    style={{
                      fontSize: "8px",
                      letterSpacing: "0.2em",
                      color: "rgba(255,255,255,0.3)",
                      textTransform: "uppercase",
                    }}
                  >
                    &copy; 2026 Every Nation Games
                  </span>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {showHowToPlay && (
        <HowToPlayModal onClose={() => setShowHowToPlay(false)} />
      )}

      <ConfirmModal
        isOpen={showResetConfirm}
        title="Reset Guest Profile?"
        message="All unlinked guest progress, statistics, and local preferences on this device will be permanently erased."
        warning="This action cannot be reversed."
        confirmLabel="Reset Profile"
        cancelLabel="Keep Profile"
        onConfirm={() => {
          setShowResetConfirm(false);
          handleLogout();
        }}
        onCancel={() => setShowResetConfirm(false)}
      />
    </>
  );
}

// Isolated nav item to avoid inline onMouseEnter repetition
function SidebarNavItem({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        gap: "16px",
        padding: "16px 20px",
        borderRadius: "12px",
        background: hovered ? "#1a2138" : "none",
        border: "none",
        cursor: "pointer",
        transition: "background 0.3s",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <span
        style={{
          color: hovered ? "#22d3ee" : "rgba(255,255,255,0.4)",
          display: "flex",
          transition: "color 0.3s",
          transform: hovered ? "scale(1.1)" : "scale(1)",
        }}
      >
        {icon}
      </span>
      <span
        className="font-orbitron"
        style={{
          fontSize: "11px",
          letterSpacing: "0.15em",
          color: hovered ? "#ffffff" : "rgba(255,255,255,0.6)",
          textTransform: "uppercase",
          fontWeight: 700,
          transition: "color 0.3s",
        }}
      >
        {label}
      </span>

      {/* Right glow bar on hover */}
      <div
        style={{
          position: "absolute",
          right: 0,
          top: "50%",
          transform: "translateY(-50%)",
          width: "2px",
          height: hovered ? "75%" : "0%",
          backgroundColor: "#22d3ee",
          boxShadow: "0 0 10px #22d3ee",
          transition: "height 0.3s",
        }}
      />
    </button>
  );
}

function ProfileIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

function LoginIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
      <polyline points="10 17 5 12 10 7" />
      <line x1="15" y1="12" x2="5" y2="12" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

function ManualIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  );
}

function SoundOnIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
    </svg>
  );
}

function SoundOffIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <line x1="23" y1="9" x2="17" y2="15" />
      <line x1="17" y1="9" x2="23" y2="15" />
    </svg>
  );
}

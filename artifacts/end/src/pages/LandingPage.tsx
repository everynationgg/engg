import { useState, useCallback, useEffect } from "react";
import { useLocation } from "wouter";
import wallpaperImg from "@assets/wallpaper-landing-page.webp";
import { playSciFiClick } from "@/lib/sound";
import { startLobbyMusic, stopLobbyMusic, getSoundEnabled, setSoundEnabled } from "@/lib/music";
import { useAuth } from "@/hooks/useAuth";
import AuthModal from "@/components/AuthModal";
import HamburgerMenu from "@/components/HamburgerMenu";
import SettingsModal from "@/components/SettingsModal";
import ProfileModal from "@/components/ProfileModal";
import HowToPlayModal from "@/components/HowToPlayModal";
import howToPlayImg from "@assets/How_to_Play.webp";

function generateRoomCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

type LandingView = "main" | "create" | "join";

export default function LandingPage() {
  const [view, setView] = useState<LandingView>("main");
  const [callsign, setCallsign] = useState("");
  const [roomCodeInput, setRoomCodeInput] = useState("");
  const [isCreatingLobby, setIsCreatingLobby] = useState(false);
  const [, setLocation] = useLocation();
  const [musicOn, setMusicOn] = useState<boolean>(getSoundEnabled);
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const { isLoggedIn, username, userId, logout } = useAuth();

  useEffect(() => {
    startLobbyMusic();
    
    // Check for login redirect from logout
    const params = new URLSearchParams(window.location.search);
    if (params.get("login") === "true") {
      setShowAuthModal(true);
      // Clean up URL without refreshing
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const handleToggleMusic = useCallback(() => {
    const next = !musicOn;
    setMusicOn(next);
    setSoundEnabled(next);
    if (next) {
      startLobbyMusic();
    } else {
      stopLobbyMusic();
    }
  }, [musicOn]);

  const handleCreateLobby = useCallback(() => {
    playSciFiClick();
    setView("create");
  }, []);

  const handleJoinGame = useCallback(() => {
    playSciFiClick();
    setView("join");
  }, []);

  const handleBack = useCallback(() => {
    playSciFiClick();
    setView("main");
    setCallsign("");
    setRoomCodeInput("");
  }, []);

  const handleGenerateLobby = useCallback(() => {
    if (!callsign.trim() || isCreatingLobby) return;
    playSciFiClick();
    setIsCreatingLobby(true);
    const roomCode = generateRoomCode();
    sessionStorage.setItem("lp_callsign", callsign.trim().toUpperCase());
    sessionStorage.setItem("lp_roomCode", roomCode);
    sessionStorage.setItem("lp_isCreating", "true");
    if (userId) {
      sessionStorage.setItem("lp_userId", userId);
    }
    setTimeout(() => {
      setLocation(`/room/${roomCode}`);
      setIsCreatingLobby(false); // no-op if component unmounted after navigation
    }, 150);
  }, [callsign, isCreatingLobby, userId, setLocation]);

  const handleJoinLobby = useCallback(() => {
    if (!callsign.trim() || !roomCodeInput.trim()) return;
    playSciFiClick();
    sessionStorage.setItem("lp_callsign", callsign.trim().toUpperCase());
    sessionStorage.setItem("lp_roomCode", roomCodeInput.trim().toUpperCase());
    if (userId) {
      sessionStorage.setItem("lp_userId", userId);
    }
    setLocation(`/room/${roomCodeInput.trim().toUpperCase()}`);
  }, [callsign, roomCodeInput, userId, setLocation]);

  return (
    <article className="relative w-full h-screen overflow-hidden flex items-end justify-center">
      {/* Full-width background */}
      <div
        className="absolute inset-0"
        aria-hidden="true"
        style={{
          backgroundImage: `url(${wallpaperImg})`,
          backgroundSize: "cover",
          backgroundPosition: "center top",
        }}
      />

      {/* Bottom fade so content is readable */}
      <div
        className="absolute inset-0"
        aria-hidden="true"
        style={{
          background: "linear-gradient(to bottom, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.15) 40%, rgba(0,0,0,0.82) 75%, rgba(0,0,0,0.95) 100%)",
        }}
      />

      {/* Scanline effect */}
      <div
        className="absolute inset-0 pointer-events-none opacity-10"
        aria-hidden="true"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,255,0.03) 2px, rgba(0,255,255,0.03) 4px)",
        }}
      />

{/* Hamburger Menu */}
      <HamburgerMenu
        onShowSettings={() => setShowSettingsModal(true)}
        onShowProfile={() => setShowProfileModal(true)}
        onShowHowToPlay={() => setShowHowToPlay(true)}
        onShowAuth={() => setShowAuthModal(true)}
        musicOn={musicOn}
        onToggleMusic={handleToggleMusic}
        playSound={playSciFiClick}
      />
      {/* How to Play modal */}
      {showHowToPlay && (
        <HowToPlayModal onClose={() => setShowHowToPlay(false)} />
      )}

      {/* Bottom content */}
      <section className="relative z-10 flex flex-col items-center text-center px-6 max-w-lg w-full pb-24 sm:pb-12">
        {view === "main" && (
          <div className="ix-page-enter">
            {/* Title */}
            <div className="flex flex-col items-center">
            <h1 className="mb-1" data-testid="title-lockdown">
              <span
                className="block font-orbitron font-black text-3xl sm:text-4xl tracking-widest uppercase leading-none"
                style={{ color: "hsl(185 100% 55%)", textShadow: "0 0 16px hsl(185 100% 50% / 0.9), 0 0 40px hsl(185 100% 50% / 0.4)" }}
              >
                ERROR:
              </span>
              <span
                className="block font-orbitron font-black text-3xl sm:text-4xl tracking-widest uppercase leading-none mt-1"
                style={{ color: "hsl(185 100% 55%)", textShadow: "0 0 16px hsl(185 100% 50% / 0.9), 0 0 40px hsl(185 100% 50% / 0.4)" }}
              >
                NEWFORM
              </span>
            </h1>
            <div
              className="font-orbitron font-bold text-lg sm:text-xl tracking-[0.3em] uppercase mb-3"
              style={{ color: "hsl(270 80% 70%)", textShadow: "0 0 10px hsl(270 80% 55% / 0.9), 0 0 30px hsl(270 80% 55% / 0.4)" }}
            >
              DETECTED
            </div>

            {/* Divider line */}
            <div
              className="w-36 h-px mb-4"
              style={{ background: "linear-gradient(90deg, transparent, hsl(185 100% 50%), transparent)" }}
            />

            {/* Subtitle */}
            <p
              className="text-xs sm:text-sm tracking-wider mb-6 leading-relaxed"
              style={{ color: "hsl(190 60% 70%)", fontFamily: "'Exo 2', sans-serif" }}
              data-testid="subtitle-text"
            >
              A real-time social deduction game. Find the alien before it's too late.
            </p>

            {/* Buttons */}
            <nav className="flex flex-col gap-4 w-full max-w-xs" aria-label="Game actions">
              <button
                onClick={handleCreateLobby}
                data-testid="button-create-lobby"
                className="ix-btn relative w-full py-4 font-orbitron font-bold text-sm tracking-[0.25em] uppercase rounded-md border-2 transition-all duration-200 cursor-pointer"
                style={{
                  background: "linear-gradient(135deg, hsl(185 100% 20% / 0.8), hsl(185 100% 10% / 0.9))",
                  borderColor: "hsl(185 100% 50%)",
                  color: "hsl(185 100% 70%)",
                  boxShadow: "0 0 10px hsl(185 100% 50% / 0.4), 0 0 20px hsl(185 100% 50% / 0.2), inset 0 0 10px hsl(185 100% 50% / 0.05)",
                }}
                onMouseEnter={(e) => {
                  const btn = e.currentTarget;
                  btn.style.boxShadow = "0 0 18px hsl(185 100% 50% / 0.7), 0 0 40px hsl(185 100% 50% / 0.4), inset 0 0 14px hsl(185 100% 50% / 0.1)";
                  btn.style.color = "hsl(185 100% 90%)";
                }}
                onMouseLeave={(e) => {
                  const btn = e.currentTarget;
                  btn.style.boxShadow = "0 0 10px hsl(185 100% 50% / 0.4), 0 0 20px hsl(185 100% 50% / 0.2), inset 0 0 10px hsl(185 100% 50% / 0.05)";
                  btn.style.color = "hsl(185 100% 70%)";
                }}
              >
                CREATE LOBBY
              </button>

              <button
                onClick={handleJoinGame}
                data-testid="button-join-game"
                className="ix-btn relative w-full py-4 font-orbitron font-bold text-sm tracking-[0.25em] uppercase rounded-md border-2 transition-all duration-200 cursor-pointer"
                style={{
                  background: "linear-gradient(135deg, hsl(270 80% 20% / 0.8), hsl(270 80% 10% / 0.9))",
                  borderColor: "hsl(270 80% 55%)",
                  color: "hsl(270 80% 75%)",
                  boxShadow: "0 0 10px hsl(270 80% 55% / 0.4), 0 0 20px hsl(270 80% 55% / 0.2), inset 0 0 10px hsl(270 80% 55% / 0.05)",
                }}
                onMouseEnter={(e) => {
                  const btn = e.currentTarget;
                  btn.style.boxShadow = "0 0 18px hsl(270 80% 55% / 0.7), 0 0 40px hsl(270 80% 55% / 0.4), inset 0 0 14px hsl(270 80% 55% / 0.1)";
                  btn.style.color = "hsl(270 80% 90%)";
                }}
                onMouseLeave={(e) => {
                  const btn = e.currentTarget;
                  btn.style.boxShadow = "0 0 10px hsl(270 80% 55% / 0.4), 0 0 20px hsl(270 80% 55% / 0.2), inset 0 0 10px hsl(270 80% 55% / 0.05)";
                  btn.style.color = "hsl(270 80% 75%)";
                }}
              >
                JOIN GAME
              </button>

              <a
                href="/"
                onClick={() => playSciFiClick()}
                className="ix-btn relative w-full py-4 font-orbitron font-bold text-sm tracking-[0.25em] uppercase rounded-md border-2 transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 text-center"
                style={{
                  background: "rgba(0, 0, 0, 0.4)",
                  borderColor: "rgba(255, 255, 255, 0.15)",
                  color: "rgba(255, 255, 255, 0.5)",
                  boxShadow: "0 0 10px rgba(255, 255, 255, 0.05)",
                }}
                onMouseEnter={(e) => {
                  const btn = e.currentTarget;
                  btn.style.borderColor = "rgba(255, 255, 255, 0.4)";
                  btn.style.color = "rgba(255, 255, 255, 0.9)";
                  btn.style.boxShadow = "0 0 15px rgba(255, 255, 255, 0.15)";
                  btn.style.background = "rgba(255, 255, 255, 0.05)";
                }}
                onMouseLeave={(e) => {
                  const btn = e.currentTarget;
                  btn.style.borderColor = "rgba(255, 255, 255, 0.15)";
                  btn.style.color = "rgba(255, 255, 255, 0.5)";
                  btn.style.boxShadow = "0 0 10px rgba(255, 255, 255, 0.05)";
                  btn.style.background = "rgba(0, 0, 0, 0.4)";
                }}
              >
                RETURN TO BASE
              </a>
            </nav>
            </div>
          </div>
        )}

        {view === "create" && (
          <div className="ix-page-enter flex flex-col items-center">
            <h2
              className="font-orbitron font-black text-3xl sm:text-4xl tracking-widest uppercase mb-2"
              style={{ color: "hsl(185 100% 55%)", textShadow: "0 0 16px hsl(185 100% 50% / 0.8), 0 0 40px hsl(185 100% 50% / 0.3)" }}
            >
              CREATE LOBBY
            </h2>
            <div
              className="w-32 h-px mb-8"
              style={{ background: "linear-gradient(90deg, transparent, hsl(185 100% 50%), transparent)" }}
            />

            {/* Callsign input */}
            <div className="w-full max-w-xs mb-6">
              <label
                htmlFor="callsign"
                className="block font-orbitron text-xs tracking-[0.25em] uppercase mb-2"
                style={{ color: "hsl(185 100% 60%)" }}
              >
                Your Callsign
              </label>
              <input
                id="callsign"
                type="text"
                value={callsign}
                onChange={(e) => setCallsign(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleGenerateLobby()}
                placeholder="ENTER CALLSIGN..."
                maxLength={20}
                data-testid="input-callsign"
                className="w-full py-3 px-4 rounded-md font-orbitron text-sm tracking-wider uppercase outline-none transition-all duration-200 ix-input"
                style={{
                  background: "hsl(220 28% 8% / 0.9)",
                  border: "1px solid hsl(185 100% 50% / 0.4)",
                  color: "hsl(185 100% 80%)",
                  boxShadow: "0 0 6px hsl(185 100% 50% / 0.2), inset 0 0 6px hsl(185 100% 50% / 0.05)",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.border = "1px solid hsl(185 100% 50%)";
                  e.currentTarget.style.boxShadow = "0 0 12px hsl(185 100% 50% / 0.4), inset 0 0 8px hsl(185 100% 50% / 0.08)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.border = "1px solid hsl(185 100% 50% / 0.4)";
                  e.currentTarget.style.boxShadow = "0 0 6px hsl(185 100% 50% / 0.2), inset 0 0 6px hsl(185 100% 50% / 0.05)";
                }}
              />
            </div>

            <nav className="flex flex-col gap-4 w-full max-w-xs" aria-label="Create lobby actions">
              <button
                onClick={handleGenerateLobby}
                disabled={!callsign.trim() || isCreatingLobby}
                data-testid="button-generate-lobby"
                className={`ix-btn relative w-full py-4 font-orbitron font-bold text-sm tracking-[0.25em] uppercase rounded-md border-2 transition-all duration-200 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed${isCreatingLobby ? " ix-btn-loading" : ""}`}
                style={{
                  background: "linear-gradient(135deg, hsl(185 100% 20% / 0.8), hsl(185 100% 10% / 0.9))",
                  borderColor: "hsl(185 100% 50%)",
                  color: "hsl(185 100% 70%)",
                  boxShadow: "0 0 10px hsl(185 100% 50% / 0.4), 0 0 20px hsl(185 100% 50% / 0.2)",
                }}
                onMouseEnter={(e) => {
                  if (!callsign.trim() || isCreatingLobby) return;
                  const btn = e.currentTarget;
                  btn.style.boxShadow = "0 0 18px hsl(185 100% 50% / 0.7), 0 0 40px hsl(185 100% 50% / 0.4)";
                  btn.style.color = "hsl(185 100% 90%)";
                }}
                onMouseLeave={(e) => {
                  const btn = e.currentTarget;
                  btn.style.boxShadow = "0 0 10px hsl(185 100% 50% / 0.4), 0 0 20px hsl(185 100% 50% / 0.2)";
                  btn.style.color = "hsl(185 100% 70%)";
                }}
              >
                {isCreatingLobby ? (
                  <>
                    CREATING
                    <span className="ix-typing-dots ml-0.5" aria-hidden="true">
                      <span>.</span><span>.</span><span>.</span>
                    </span>
                  </>
                ) : (
                  "GENERATE LOBBY"
                )}
              </button>

              <button
                onClick={handleBack}
                data-testid="button-back"
                className="ix-btn w-full py-3 font-orbitron text-xs tracking-[0.25em] uppercase rounded-md border transition-all duration-200 cursor-pointer"
                style={{
                  background: "transparent",
                  borderColor: "hsl(210 30% 30%)",
                  color: "hsl(210 30% 55%)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "hsl(210 30% 50%)";
                  e.currentTarget.style.color = "hsl(210 30% 75%)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "hsl(210 30% 30%)";
                  e.currentTarget.style.color = "hsl(210 30% 55%)";
                }}
              >
                BACK
              </button>
            </nav>
          </div>
        )}

        {view === "join" && (
          <div className="ix-page-enter flex flex-col items-center">
            <h2
              className="font-orbitron font-black text-3xl sm:text-4xl tracking-widest uppercase mb-2"
              style={{ color: "hsl(270 80% 70%)", textShadow: "0 0 16px hsl(270 80% 55% / 0.8), 0 0 40px hsl(270 80% 55% / 0.3)" }}
            >
              JOIN GAME
            </h2>
            <div
              className="w-32 h-px mb-8"
              style={{ background: "linear-gradient(90deg, transparent, hsl(270 80% 55%), transparent)" }}
            />

            {/* Room code input */}
            <div className="w-full max-w-xs mb-4">
              <label
                htmlFor="roomcode"
                className="block font-orbitron text-xs tracking-[0.25em] uppercase mb-2"
                style={{ color: "hsl(270 80% 65%)" }}
              >
                Room Code
              </label>
              <input
                id="roomcode"
                type="text"
                value={roomCodeInput}
                onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
                placeholder="ENTER ROOM CODE..."
                maxLength={6}
                data-testid="input-roomcode"
                className="w-full py-3 px-4 rounded-md font-orbitron text-sm tracking-wider uppercase outline-none transition-all duration-200 ix-input"
                style={{
                  background: "hsl(220 28% 8% / 0.9)",
                  border: "1px solid hsl(270 80% 55% / 0.4)",
                  color: "hsl(270 80% 80%)",
                  boxShadow: "0 0 6px hsl(270 80% 55% / 0.2), inset 0 0 6px hsl(270 80% 55% / 0.05)",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.border = "1px solid hsl(270 80% 55%)";
                  e.currentTarget.style.boxShadow = "0 0 12px hsl(270 80% 55% / 0.4), inset 0 0 8px hsl(270 80% 55% / 0.08)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.border = "1px solid hsl(270 80% 55% / 0.4)";
                  e.currentTarget.style.boxShadow = "0 0 6px hsl(270 80% 55% / 0.2), inset 0 0 6px hsl(270 80% 55% / 0.05)";
                }}
              />
            </div>

            {/* Callsign input */}
            <div className="w-full max-w-xs mb-6">
              <label
                htmlFor="join-callsign"
                className="block font-orbitron text-xs tracking-[0.25em] uppercase mb-2"
                style={{ color: "hsl(270 80% 65%)" }}
              >
                Your Callsign
              </label>
              <input
                id="join-callsign"
                type="text"
                value={callsign}
                onChange={(e) => setCallsign(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleJoinLobby()}
                placeholder="ENTER CALLSIGN..."
                maxLength={20}
                data-testid="input-join-callsign"
                className="w-full py-3 px-4 rounded-md font-orbitron text-sm tracking-wider uppercase outline-none transition-all duration-200 ix-input"
                style={{
                  background: "hsl(220 28% 8% / 0.9)",
                  border: "1px solid hsl(270 80% 55% / 0.4)",
                  color: "hsl(270 80% 80%)",
                  boxShadow: "0 0 6px hsl(270 80% 55% / 0.2), inset 0 0 6px hsl(270 80% 55% / 0.05)",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.border = "1px solid hsl(270 80% 55%)";
                  e.currentTarget.style.boxShadow = "0 0 12px hsl(270 80% 55% / 0.4), inset 0 0 8px hsl(270 80% 55% / 0.08)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.border = "1px solid hsl(270 80% 55% / 0.4)";
                  e.currentTarget.style.boxShadow = "0 0 6px hsl(270 80% 55% / 0.2), inset 0 0 6px hsl(270 80% 55% / 0.05)";
                }}
              />
            </div>

            <nav className="flex flex-col gap-4 w-full max-w-xs" aria-label="Join game actions">
              <button
                onClick={handleJoinLobby}
                disabled={!callsign.trim() || !roomCodeInput.trim()}
                data-testid="button-join-lobby"
                className="ix-btn relative w-full py-4 font-orbitron font-bold text-sm tracking-[0.25em] uppercase rounded-md border-2 transition-all duration-200 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  background: "linear-gradient(135deg, hsl(270 80% 20% / 0.8), hsl(270 80% 10% / 0.9))",
                  borderColor: "hsl(270 80% 55%)",
                  color: "hsl(270 80% 75%)",
                  boxShadow: "0 0 10px hsl(270 80% 55% / 0.4), 0 0 20px hsl(270 80% 55% / 0.2)",
                }}
                onMouseEnter={(e) => {
                  if (!callsign.trim() || !roomCodeInput.trim()) return;
                  const btn = e.currentTarget;
                  btn.style.boxShadow = "0 0 18px hsl(270 80% 55% / 0.7), 0 0 40px hsl(270 80% 55% / 0.4)";
                  btn.style.color = "hsl(270 80% 90%)";
                }}
                onMouseLeave={(e) => {
                  const btn = e.currentTarget;
                  btn.style.boxShadow = "0 0 10px hsl(270 80% 55% / 0.4), 0 0 20px hsl(270 80% 55% / 0.2)";
                  btn.style.color = "hsl(270 80% 75%)";
                }}
              >
                JOIN LOBBY
              </button>

              <button
                onClick={handleBack}
                data-testid="button-back-join"
                className="ix-btn w-full py-3 font-orbitron text-xs tracking-[0.25em] uppercase rounded-md border transition-all duration-200 cursor-pointer"
                style={{
                  background: "transparent",
                  borderColor: "hsl(210 30% 30%)",
                  color: "hsl(210 30% 55%)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "hsl(210 30% 50%)";
                  e.currentTarget.style.color = "hsl(210 30% 75%)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "hsl(210 30% 30%)";
                  e.currentTarget.style.color = "hsl(210 30% 55%)";
                }}
              >
                BACK
              </button>
            </nav>
          </div>
        )}
      </section>

      {/* Auth Modal */}
      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}

      {/* Settings Modal */}
      <SettingsModal isOpen={showSettingsModal} onClose={() => setShowSettingsModal(false)} />

      {/* Profile Modal */}
      <ProfileModal isOpen={showProfileModal} onClose={() => setShowProfileModal(false)} />
    </article>
  );
}

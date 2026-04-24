import { useState, useCallback, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import crewLeftImg from "@assets/crew-left.webp";
import alienRightImg from "@assets/alien-right.webp";
import { playSciFiClick } from "@/lib/sound";
import { startLobbyMusic, stopLobbyMusic, getSoundEnabled, setSoundEnabled } from "@/lib/music";
import howToPlayImg from "@assets/How_to_Play.webp";
import HowToPlayModal from "@/components/HowToPlayModal";

export default function JoinPage() {
  const params = useParams<{ roomCode: string }>();
  const roomCode = params.roomCode?.toUpperCase() ?? "";
  const [callsign, setCallsign] = useState("");
  const [, setLocation] = useLocation();
  const [musicOn, setMusicOn] = useState<boolean>(getSoundEnabled);
  const [showHowToPlay, setShowHowToPlay] = useState(false);

  useEffect(() => {
    startLobbyMusic();
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

  const handleJoin = useCallback(() => {
    if (!callsign.trim()) return;
    playSciFiClick();
    sessionStorage.setItem("lp_callsign", callsign.trim().toUpperCase());
    sessionStorage.setItem("lp_roomCode", roomCode);
    setLocation(`/room/${roomCode}`);
  }, [callsign, roomCode, setLocation]);

  const handleBack = useCallback(() => {
    playSciFiClick();
    setLocation("/");
  }, [setLocation]);

  return (
    <div className="relative w-full h-screen overflow-hidden flex items-center justify-center">
      {/* Split background */}
      <div
        className="absolute inset-0 left-0 right-1/2"
        style={{
          backgroundImage: `url(${crewLeftImg})`,
          backgroundSize: "cover",
          backgroundPosition: "center right",
        }}
      />
      <div
        className="absolute inset-0 left-1/2 right-0"
        style={{
          backgroundImage: `url(${alienRightImg})`,
          backgroundSize: "cover",
          backgroundPosition: "center left",
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/80 to-black/60" />
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 80% at 50% 50%, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.65) 100%)",
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none opacity-10"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,255,0.03) 2px, rgba(0,255,255,0.03) 4px)",
        }}
      />

      <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-lg w-full ix-page-enter">
        <div
          className="font-orbitron font-black text-3xl sm:text-4xl tracking-widest uppercase mb-2"
          style={{ color: "hsl(270 80% 70%)", textShadow: "0 0 16px hsl(270 80% 55% / 0.8), 0 0 40px hsl(270 80% 55% / 0.3)" }}
        >
          JOIN LOBBY
        </div>
        <div
          className="w-32 h-px mb-4"
          style={{ background: "linear-gradient(90deg, transparent, hsl(270 80% 55%), transparent)" }}
        />

        {/* Room code display */}
        <div className="mb-6">
          <div className="text-xs tracking-widest uppercase mb-1" style={{ color: "hsl(210 30% 45%)" }}>Joining Room</div>
          <div
            className="font-orbitron font-black text-2xl tracking-[0.3em]"
            style={{ color: "hsl(185 100% 60%)", textShadow: "0 0 10px hsl(185 100% 50% / 0.6)" }}
          >
            {roomCode}
          </div>
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
            onKeyDown={(e) => e.key === "Enter" && handleJoin()}
            placeholder="ENTER CALLSIGN..."
            maxLength={20}
            autoFocus
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

        <div className="flex flex-col gap-4 w-full max-w-xs">
          <button
            onClick={handleJoin}
            disabled={!callsign.trim()}
            data-testid="button-join"
            className="ix-btn relative w-full py-4 font-orbitron font-bold text-sm tracking-[0.25em] uppercase rounded-md border-2 transition-all duration-200 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: "linear-gradient(135deg, hsl(270 80% 20% / 0.8), hsl(270 80% 10% / 0.9))",
              borderColor: "hsl(270 80% 55%)",
              color: "hsl(270 80% 75%)",
              boxShadow: "0 0 10px hsl(270 80% 55% / 0.4), 0 0 20px hsl(270 80% 55% / 0.2)",
            }}
            onMouseEnter={(e) => {
              if (!callsign.trim()) return;
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
            JOIN
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
        </div>
      </div>

      {/* How to Play modal */}
      {showHowToPlay && (
        <HowToPlayModal onClose={() => setShowHowToPlay(false)} />
      )}
    </div>
  );
}

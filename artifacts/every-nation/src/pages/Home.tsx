import { useEffect, useRef, useState } from "react";

function playHoverSound() {
  try {
    const ctx = new AudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(900, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(680, ctx.currentTime + 0.09);
    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.07, ctx.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.13);
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.16);
  } catch {
  }
}

interface ButtonProps {
  label: string;
  subtext?: string;
  onClick?: () => void;
  variant?: "primary" | "default";
}

function GlassButton({ label, subtext, onClick, variant = "default" }: ButtonProps) {
  return (
    <button
      className={`glass-btn ${variant === "primary" ? "glass-btn--primary" : ""}`}
      onClick={onClick}
      onMouseEnter={playHoverSound}
    >
      <div className="btn-inner">
        <span className="btn-label">{label}</span>
        {subtext && <span className="btn-subtext">{subtext}</span>}
      </div>
      <div className="btn-shimmer" />
      <div className="btn-corner btn-corner--tl" />
      <div className="btn-corner btn-corner--tr" />
      <div className="btn-corner btn-corner--bl" />
      <div className="btn-corner btn-corner--br" />
    </button>
  );
}

export default function Home() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [buttonsVisible, setButtonsVisible] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      if (video.currentTime >= 2) {
        setButtonsVisible(true);
      }
    };

    video.addEventListener("timeupdate", handleTimeUpdate);
    return () => video.removeEventListener("timeupdate", handleTimeUpdate);
  }, []);

  return (
    <div className="landing-root">
      <video
        ref={videoRef}
        className="bg-video"
        src="/bg-video.mp4"
        autoPlay
        muted
        playsInline
      />
      <div className="bg-overlay" />

      <div className={`content-wrapper ${buttonsVisible ? "content-wrapper--visible" : ""}`}>
        <div className="buttons-row">
          <GlassButton
            label="Community"
            subtext="discord.gg/everynation"
            onClick={() => window.open("https://discord.gg/everynation", "_blank")}
          />
          <GlassButton
            label="Gaming Hub"
            subtext="Access Mission Control"
            variant="primary"
            onClick={() => window.location.href = "/hub"}
          />
          <GlassButton
            label="Credit Shop"
            subtext="Buy Operational Credits"
            onClick={() => window.location.href = "/shop"}
          />
          <GlassButton
            label="Socials"
            subtext="follow us"
            onClick={() => window.open("https://linktr.ee/everynationgg", "_blank")}
          />
        </div>
      </div>
    </div>
  );
}

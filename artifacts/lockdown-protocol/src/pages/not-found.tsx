import { useEffect, useState } from "react";

const LOG_LINES = [
  "initializing recovery protocol...",
  "scanning routes...",
  "page not found",
  "redirect recommended",
];

const REDIRECT_URL = "https://engg.online";
const COUNTDOWN_START = 5;

interface Ripple {
  id: number;
  x: number;
  y: number;
  size: number;
}

export default function NotFound() {
  const [visibleLines, setVisibleLines] = useState(0);
  const [countdown, setCountdown] = useState(COUNTDOWN_START);
  const [redirecting, setRedirecting] = useState(false);
  const [ripples, setRipples] = useState<Ripple[]>([]);

  // Inject Share Tech Mono font once
  useEffect(() => {
    const id = "nf-font-link";
    if (document.getElementById(id)) return;
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Share+Tech+Mono&display=swap";
    document.head.appendChild(link);
  }, []);

  // Reveal log lines one by one
  useEffect(() => {
    if (visibleLines >= LOG_LINES.length) return;
    const t = setTimeout(() => setVisibleLines((v) => v + 1), 700);
    return () => clearTimeout(t);
  }, [visibleLines]);

  // Start countdown after all lines are shown
  useEffect(() => {
    if (visibleLines < LOG_LINES.length) return;
    const id = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(id);
          setRedirecting(true);
          window.location.href = REDIRECT_URL;
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [visibleLines]);

  function addRipple(e: React.MouseEvent<HTMLAnchorElement>) {
    const btn = e.currentTarget;
    const rect = btn.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const ripple: Ripple = {
      id: Date.now(),
      x: e.clientX - rect.left - size / 2,
      y: e.clientY - rect.top - size / 2,
      size,
    };
    setRipples((prev) => [...prev, ripple]);
    setTimeout(() => setRipples((prev) => prev.filter((r) => r.id !== ripple.id)), 500);
  }

  return (
    <>
      <style>{`
        /* ── Scanlines overlay ─────────────────────────────────────── */
        .nf-scanlines::before {
          content: '';
          position: fixed;
          inset: 0;
          background: repeating-linear-gradient(
            to bottom,
            transparent 0px,
            transparent 3px,
            rgba(0,0,0,0.18) 3px,
            rgba(0,0,0,0.18) 4px
          );
          pointer-events: none;
          z-index: 0;
        }

        /* ── Animated gradient background ─────────────────────────── */
        .nf-bg {
          background: linear-gradient(135deg, #020b18 0%, #040d1a 40%, #070a15 70%, #020b18 100%);
          background-size: 400% 400%;
          animation: nf-bgshift 12s ease infinite;
        }
        @keyframes nf-bgshift {
          0%   { background-position: 0% 50%; }
          50%  { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        /* ── 404 glitch ────────────────────────────────────────────── */
        .nf-glitch {
          font-family: 'Orbitron', monospace;
          font-size: clamp(5rem, 20vw, 10rem);
          font-weight: 900;
          color: #00e5ff;
          text-shadow:
            0 0 10px #00e5ff,
            0 0 30px #00e5ff,
            0 0 60px #00aaff;
          position: relative;
          display: inline-block;
          animation: nf-flicker 3s infinite;
          letter-spacing: 0.05em;
        }
        .nf-glitch::before,
        .nf-glitch::after {
          content: '404';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
        }
        .nf-glitch::before {
          color: #ff003c;
          clip-path: polygon(0 15%, 100% 15%, 100% 35%, 0 35%);
          animation: nf-glitch-before 2.5s infinite steps(1);
          opacity: 0.8;
        }
        .nf-glitch::after {
          color: #00ff9f;
          clip-path: polygon(0 60%, 100% 60%, 100% 80%, 0 80%);
          animation: nf-glitch-after 2.5s infinite steps(1);
          opacity: 0.8;
        }
        @keyframes nf-flicker {
          0%, 97%, 100% { opacity: 1; }
          98%            { opacity: 0.6; }
          99%            { opacity: 0.9; }
        }
        @keyframes nf-glitch-before {
          0%,  80%, 100% { transform: translate(0); }
          82%            { transform: translate(-4px, 1px); }
          84%            { transform: translate(4px, -1px); }
          86%            { transform: translate(0); }
        }
        @keyframes nf-glitch-after {
          0%,  80%, 100% { transform: translate(0); }
          82%            { transform: translate(4px, 2px); }
          84%            { transform: translate(-4px, -2px); }
          86%            { transform: translate(0); }
        }

        /* ── Terminal log ──────────────────────────────────────────── */
        .nf-terminal {
          font-family: 'Share Tech Mono', 'Courier New', monospace;
          background: rgba(0,229,255,0.04);
          border: 1px solid rgba(0,229,255,0.18);
          border-radius: 6px;
          padding: 1rem 1.25rem;
          text-align: left;
          max-width: 420px;
          width: 100%;
        }
        .nf-terminal-line {
          color: #7efff5;
          font-size: 0.85rem;
          line-height: 1.8;
          opacity: 0;
          animation: nf-fadein 0.4s forwards;
        }
        .nf-terminal-line::before { content: '> '; color: #00e5ff; }
        .nf-terminal-line.error   { color: #ff6b6b; }
        .nf-terminal-line.warn    { color: #ffd166; }
        @keyframes nf-fadein {
          from { opacity: 0; transform: translateX(-6px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        .nf-cursor {
          display: inline-block;
          width: 8px;
          height: 1em;
          background: #00e5ff;
          vertical-align: text-bottom;
          animation: nf-blink 1s step-start infinite;
          margin-left: 2px;
        }
        @keyframes nf-blink {
          50% { opacity: 0; }
        }

        /* ── Glow button ───────────────────────────────────────────── */
        .nf-btn {
          font-family: 'Orbitron', monospace;
          font-size: clamp(0.85rem, 2.5vw, 1rem);
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #00e5ff;
          background: transparent;
          border: 2px solid #00e5ff;
          border-radius: 4px;
          padding: 0.9em 2.2em;
          cursor: pointer;
          text-decoration: none;
          display: inline-block;
          position: relative;
          overflow: hidden;
          box-shadow:
            0 0 10px rgba(0,229,255,0.4),
            0 0 20px rgba(0,229,255,0.2),
            inset 0 0 10px rgba(0,229,255,0.05);
          animation: nf-pulse 3s ease-in-out infinite;
          transition: transform 0.15s, box-shadow 0.15s, background 0.15s, color 0.15s;
          min-height: 48px;
          min-width: 200px;
          text-align: center;
        }
        .nf-btn:hover {
          transform: scale(1.05);
          background: rgba(0,229,255,0.12);
          box-shadow:
            0 0 18px rgba(0,229,255,0.8),
            0 0 40px rgba(0,229,255,0.4),
            inset 0 0 16px rgba(0,229,255,0.1);
          color: #fff;
        }
        .nf-btn:active {
          transform: scale(0.97);
        }
        .nf-btn-ripple {
          position: absolute;
          border-radius: 50%;
          background: rgba(0,229,255,0.35);
          transform: scale(0);
          animation: nf-ripple 0.5s linear;
          pointer-events: none;
        }
        @keyframes nf-ripple {
          to { transform: scale(4); opacity: 0; }
        }
        @keyframes nf-pulse {
          0%, 100% {
            box-shadow:
              0 0 10px rgba(0,229,255,0.4),
              0 0 20px rgba(0,229,255,0.2),
              inset 0 0 10px rgba(0,229,255,0.05);
          }
          50% {
            box-shadow:
              0 0 20px rgba(0,229,255,0.7),
              0 0 50px rgba(0,229,255,0.35),
              inset 0 0 16px rgba(0,229,255,0.1);
          }
        }

        /* ── Countdown ─────────────────────────────────────────────── */
        .nf-countdown {
          font-family: 'Share Tech Mono', monospace;
          font-size: 0.8rem;
          color: rgba(0,229,255,0.55);
          letter-spacing: 0.08em;
          margin-top: 0.5rem;
        }
        .nf-countdown span { color: #00e5ff; font-weight: 700; }
      `}</style>

      <div
        className="nf-bg nf-scanlines"
        style={{
          minHeight: "100dvh",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "2rem 1rem",
          gap: "1.5rem",
          position: "relative",
          zIndex: 0,
        }}
      >
        {/* 404 glitch heading */}
        <div style={{ position: "relative", zIndex: 1, textAlign: "center" }}>
          <h1 className="nf-glitch">404</h1>
        </div>

        {/* Subtitle */}
        <div style={{ position: "relative", zIndex: 1, textAlign: "center" }}>
          <h2
            style={{
              fontFamily: "'Orbitron', monospace",
              fontSize: "clamp(1rem, 4vw, 1.5rem)",
              fontWeight: 600,
              color: "#ff6b6b",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              textShadow: "0 0 12px rgba(255,107,107,0.6)",
              margin: 0,
            }}
          >
            Error: Signal Lost
          </h2>
          <p
            style={{
              fontFamily: "'Share Tech Mono', monospace",
              color: "rgba(0,229,255,0.6)",
              fontSize: "0.85rem",
              marginTop: "0.5rem",
              maxWidth: "380px",
              lineHeight: 1.6,
            }}
          >
            The requested page cannot be found. The system has lost track of its location.
          </p>
        </div>

        {/* Terminal log */}
        <div style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: "420px", display: "flex", justifyContent: "center" }}>
          <div className="nf-terminal">
            {LOG_LINES.slice(0, visibleLines).map((line, i) => (
              <div
                key={i}
                className={`nf-terminal-line${i === 2 ? " error" : i === 3 ? " warn" : ""}`}
              >
                {line}
              </div>
            ))}
            {visibleLines < LOG_LINES.length && <span className="nf-cursor" />}
          </div>
        </div>

        {/* CTA button */}
        <div style={{ position: "relative", zIndex: 1, textAlign: "center" }}>
          <a
            href={REDIRECT_URL}
            className="nf-btn"
            onClick={addRipple}
          >
            {ripples.map((r) => (
              <span
                key={r.id}
                className="nf-btn-ripple"
                style={{ width: r.size, height: r.size, left: r.x, top: r.y }}
              />
            ))}
            {redirecting ? "Reconnecting..." : "Return to Main Page"}
          </a>

          {visibleLines >= LOG_LINES.length && (
            <div className="nf-countdown">
              {redirecting
                ? "Redirecting..."
                : <>Auto-redirect in <span>{countdown}s</span></>}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

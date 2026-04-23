import { useEffect, useState, useRef } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { playSciFiClick } from "@/lib/sound";

export default function VerifyEmailPage() {
  const [, setLocation] = useLocation();
  const [status, setStatus] = useState<"verifying" | "success" | "error">("verifying");
  const [logs, setLogs] = useState<string[]>(["INITIALIZING SECURE HANDSHAKE..."]);
  const { refreshUser } = useAuth();
  const logsEndRef = useRef<HTMLDivElement>(null);

  const addLog = (msg: string) => {
    setLogs(prev => [...prev, `> ${msg}`].slice(-8));
  };

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  useEffect(() => {
    const verifyEmail = async () => {
      const params = new URLSearchParams(window.location.search);
      const token = params.get("token");

      if (!token) {
        setStatus("error");
        addLog("CRITICAL ERROR: TOKEN_MISSING");
        return;
      }

      try {
        addLog("DECRYPTING IDENTITY TOKEN...");
        await new Promise(r => setTimeout(r, 800)); // Cinematic delay
        addLog("ESTABLISHING ENCRYPTED LINK...");
        
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/verify-email`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });

        if (response.ok) {
          addLog("HANDSHAKE SUCCESSFUL.");
          addLog("SYNCHRONIZING OPERATOR DATA...");
          setStatus("success");
          refreshUser();
          
          setTimeout(() => {
            addLog("REDIRECTING TO COMMAND CENTER...");
            setTimeout(() => setLocation("/profile"), 1000);
          }, 1500);
        } else {
          const data = await response.json();
          addLog(`HANDSHAKE FAILED: ${data.error?.toUpperCase() || "ACCESS_DENIED"}`);
          setStatus("error");
        }
      } catch (error) {
        addLog("NETWORK ANOMALY DETECTED.");
        setStatus("error");
        console.error("Verification error:", error);
      }
    };

    verifyEmail();
  }, [setLocation]);

  return (
    <div className="min-h-screen text-white p-6 flex items-center justify-center overflow-hidden" style={{ background: "hsl(220 28% 2%)" }}>
      {/* Background Grid Effect */}
      <div className="absolute inset-0 opacity-10 pointer-events-none" 
        style={{ 
          backgroundImage: "linear-gradient(hsl(185 100% 50% / 0.1) 1px, transparent 1px), linear-gradient(90deg, hsl(185 100% 50% / 0.1) 1px, transparent 1px)",
          backgroundSize: "40px 40px"
        }} 
      />

      <div className="max-w-md w-full relative z-10">
        {/* HUD Corner Brackets */}
        <div className="absolute -top-4 -left-4 w-12 h-12 border-t-2 border-l-2 opacity-50" style={{ borderColor: status === "error" ? "hsl(0 100% 50%)" : "hsl(185 100% 50%)" }} />
        <div className="absolute -top-4 -right-4 w-12 h-12 border-t-2 border-r-2 opacity-50" style={{ borderColor: status === "error" ? "hsl(0 100% 50%)" : "hsl(185 100% 50%)" }} />
        <div className="absolute -bottom-4 -left-4 w-12 h-12 border-b-2 border-l-2 opacity-50" style={{ borderColor: status === "error" ? "hsl(0 100% 50%)" : "hsl(185 100% 50%)" }} />
        <div className="absolute -bottom-4 -right-4 w-12 h-12 border-b-2 border-r-2 opacity-50" style={{ borderColor: status === "error" ? "hsl(0 100% 50%)" : "hsl(185 100% 50%)" }} />

        <div className="rounded-sm p-10 relative overflow-hidden" style={{ background: "hsl(220 28% 6% / 0.8)", border: "1px solid hsl(210 30% 20%)", backdropFilter: "blur(10px)" }}>
          {/* Header */}
          <div className="mb-10 text-center">
            <h1 className="font-orbitron font-bold text-sm tracking-[0.4em] uppercase opacity-60 mb-2">
              Identity Verification
            </h1>
            <div className="h-px w-full bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />
          </div>

          <div className="flex flex-col items-center">
            {/* Main Visual */}
            <div className="relative mb-10">
              {status === "verifying" && (
                <div className="w-24 h-24 border-2 border-dashed rounded-full animate-[spin_10s_linear_infinite]" style={{ borderColor: "hsl(185 100% 50% / 0.3)" }}>
                  <div className="absolute inset-2 border-2 border-cyan-500 rounded-full animate-pulse" />
                </div>
              )}
              {status === "success" && (
                <div className="w-24 h-24 border-2 border-cyan-500 rounded-full flex items-center justify-center animate-[bounce_0.5s_ease-out]">
                  <div className="text-4xl text-cyan-500 drop-shadow-[0_0_10px_rgba(6,182,212,0.5)]">✓</div>
                </div>
              )}
              {status === "error" && (
                <div className="w-24 h-24 border-2 border-red-500 rounded-full flex items-center justify-center">
                  <div className="text-4xl text-red-500 drop-shadow-[0_0_10px_rgba(239,68,68,0.5)]">✗</div>
                </div>
              )}
            </div>

            {/* Technical Logs */}
            <div className="w-full bg-black/40 p-4 font-mono text-[10px] tracking-wider mb-8 border border-white/5 h-32 overflow-hidden">
              {logs.map((log, i) => (
                <div key={i} className="mb-1 animate-[fadeIn_0.2s_ease-out]" style={{ color: log.includes("ERROR") ? "#ff4444" : "#00f3ff" }}>
                  {log}
                </div>
              ))}
              <div ref={logsEndRef} />
            </div>

            {status === "error" && (
              <button
                onClick={() => {
                  playSciFiClick();
                  setLocation("/");
                }}
                className="group relative px-8 py-3 font-orbitron text-[10px] tracking-[0.3em] uppercase transition-all duration-300"
              >
                <div className="absolute inset-0 border border-red-500/50 group-hover:border-red-400 bg-red-500/5" />
                <span className="relative text-red-400 group-hover:text-red-300">Abort & Return</span>
              </button>
            )}
            
            {status === "success" && (
              <div className="font-orbitron text-[10px] tracking-[0.3em] uppercase text-cyan-500 animate-pulse">
                Access Granted
              </div>
            )}
          </div>
        </div>

        {/* HUD Elements */}
        <div className="mt-6 flex justify-between items-center px-4 font-mono text-[9px] text-white/20 tracking-tighter">
          <div>NODE: ENF_SRV_09</div>
          <div className="animate-pulse">SYSTEM STATUS: {status.toUpperCase()}</div>
          <div>EST: 2026.04.23</div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(5px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}} />
    </div>
  );
}

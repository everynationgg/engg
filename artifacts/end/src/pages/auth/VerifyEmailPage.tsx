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
    setLogs(prev => [...prev, `> ${msg}`].slice(-10));
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
        await new Promise(r => setTimeout(r, 1000));
        addLog("ESTABLISHING ENCRYPTED LINK...");
        await new Promise(r => setTimeout(r, 800));
        
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/verify-email`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });

        if (response.ok) {
          addLog("HANDSHAKE SUCCESSFUL.");
          addLog("SYNCHRONIZING OPERATOR DATA...");
          setStatus("success");
          await refreshUser();
          
          setTimeout(() => {
            addLog("IDENTITY_SYNC_COMPLETE.");
            addLog("REDIRECTING TO COMMAND CENTER...");
            setTimeout(() => setLocation("/profile"), 1500);
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
  }, [setLocation, refreshUser]);

  return (
    <div className="min-h-screen text-white p-6 flex flex-col items-center justify-center overflow-hidden" style={{ background: "hsl(220 30% 2%)" }}>
      {/* Background HUD elements */}
      <div className="absolute inset-0 opacity-10 pointer-events-none" 
        style={{ 
          backgroundImage: "linear-gradient(hsl(185 100% 50% / 0.1) 1px, transparent 1px), linear-gradient(90deg, hsl(185 100% 50% / 0.1) 1px, transparent 1px)",
          backgroundSize: "60px 60px"
        }} 
      />
      
      {/* Scanning lines */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
         <div className="absolute inset-x-0 h-1/4 bg-gradient-to-b from-cyan-500/0 via-cyan-500/5 to-cyan-500/0 -top-full animate-[scan-slow_8s_linear_infinite]" />
      </div>

      <div className="max-w-2xl w-full relative z-10">
        {/* Terminal Header */}
        <div className="flex items-center justify-between mb-4 px-2">
           <div className="flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full animate-pulse ${status === "error" ? "bg-red-500" : "bg-cyan-500"}`} />
              <span className="font-orbitron text-[10px] tracking-[0.4em] uppercase opacity-40">Identity_Verification_Node_7</span>
           </div>
           <span className="font-mono text-[9px] opacity-20 uppercase tracking-widest">TS: {new Date().toISOString()}</span>
        </div>

        <div className="bg-[#0c1016] border border-white/10 p-8 md:p-12 shadow-[0_0_50px_rgba(0,243,255,0.05)] relative overflow-hidden min-h-[400px] flex flex-col items-center justify-center">
           {/* HUD Brackets */}
           <div className="absolute top-0 left-0 w-8 h-8 border-t border-l border-white/20" />
           <div className="absolute top-0 right-0 w-8 h-8 border-t border-r border-white/20" />
           <div className="absolute bottom-0 left-0 w-8 h-8 border-b border-l border-white/20" />
           <div className="absolute bottom-0 right-0 w-8 h-8 border-b border-r border-white/20" />

           {/* Biometric Visualizer */}
           <div className="relative mb-12">
              {status === "verifying" && (
                <div className="w-32 h-32 flex items-center justify-center">
                   <div className="absolute inset-0 border border-cyan-500/20 rounded-full animate-[spin_10s_linear_infinite]" />
                   <div className="absolute inset-2 border-t-2 border-cyan-500 rounded-full animate-spin" />
                   <div className="absolute inset-6 border border-cyan-500/10 rounded-full animate-pulse" />
                   <div className="w-4 h-4 bg-cyan-500 shadow-[0_0_15px_#00f3ff]" />
                </div>
              )}
              {status === "success" && (
                <div className="w-32 h-32 flex items-center justify-center animate-[success-pop_0.5s_ease-out]">
                   <div className="absolute inset-0 border border-cyan-500/40 rounded-full" />
                   <div className="absolute inset-0 bg-cyan-500/5 rounded-full animate-pulse" />
                   <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#00f3ff" strokeWidth="3" strokeLinecap="square" className="drop-shadow-[0_0_10px_rgba(0,243,255,0.5)]">
                      <polyline points="20 6 9 17 4 12" />
                   </svg>
                </div>
              )}
              {status === "error" && (
                <div className="w-32 h-32 flex items-center justify-center animate-[shake_0.4s_ease-in-out]">
                   <div className="absolute inset-0 border border-red-500/40 rounded-full" />
                   <div className="absolute inset-0 bg-red-500/5 rounded-full" />
                   <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ff4e4e" strokeWidth="3" strokeLinecap="square" className="drop-shadow-[0_0_10px_rgba(255,78,78,0.5)]">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                   </svg>
                </div>
              )}
           </div>

           {/* Console Log */}
           <div className="w-full max-w-md bg-black/40 border border-white/5 p-6 font-mono text-[11px] leading-relaxed relative group">
              <div className="absolute -top-3 left-4 px-2 bg-[#0c1016] text-[9px] tracking-widest uppercase opacity-40">System_Logs</div>
              <div className="space-y-1">
                 {logs.map((log, i) => (
                    <div key={i} className={`flex gap-3 ${i === logs.length - 1 ? "animate-pulse" : "opacity-40"}`}>
                       <span className="text-cyan-600">[{new Date().toLocaleTimeString().split(' ')[0]}]</span>
                       <span className={status === "error" && log.includes("FAILED") ? "text-red-400" : status === "success" && log.includes("SUCCESSFUL") ? "text-cyan-400" : ""}>
                          {log}
                       </span>
                    </div>
                 ))}
              </div>
              <div ref={logsEndRef} />
           </div>
        </div>
        
        {status === "error" && (
           <div className="mt-8 flex justify-center">
              <button 
                onClick={() => setLocation("/")}
                className="px-10 py-4 bg-white/5 border border-white/10 hover:border-red-500/50 text-white/40 hover:text-white font-orbitron text-[10px] tracking-[0.4em] uppercase transition-all"
              >
                 Return_to_Login
              </button>
           </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes scan-slow {
          0% { transform: translateY(0); }
          100% { transform: translateY(800vh); }
        }
        @keyframes success-pop {
          0% { transform: scale(0.8); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
      `}} />
    </div>
  );
}

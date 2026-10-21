import { useEffect, useState } from "react";
import { ALIEN_ROLES, CREW_ROLES, CHAOTIC_ROLES, Role } from "@/data/roles";
import howToPlayImg from "@assets/How_to_Play.webp";
import { TeamIcon } from "@/components/common/TeamIcon";
import { playSciFiClick } from "@/lib/sound";

interface HowToPlayModalProps {
  onClose: () => void;
}

export default function HowToPlayModal({ onClose }: HowToPlayModalProps) {
  const [activeTab, setActiveTab] = useState<"phases" | "roles" | "image">("phases");
  const [zoomImage, setZoomImage] = useState(false);

  // Close on ESC or Android back button
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        if (zoomImage) {
          setZoomImage(false);
        } else {
          onClose();
        }
      }
    };
    const handleBackButton = (e: Event) => {
      e.preventDefault();
      if (zoomImage) {
        setZoomImage(false);
      } else {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    document.addEventListener("backbutton", handleBackButton);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("backbutton", handleBackButton);
    };
  }, [onClose, zoomImage]);

  const handleTabChange = (tab: "phases" | "roles" | "image") => {
    playSciFiClick();
    setActiveTab(tab);
  };

  return (
    <div
      className="fixed inset-0 z-[10001] flex items-center justify-center p-3 sm:p-4 backdrop-blur-sm transition-all duration-300"
      style={{
        background: "hsl(220 30% 2% / 0.85)",
        paddingTop: "max(16px, env(safe-area-inset-top, 16px))",
        paddingBottom: "max(16px, env(safe-area-inset-bottom, 16px))",
      }}
      onClick={() => { playSciFiClick(); onClose(); }}
    >
      <div
        className="relative w-full max-w-4xl h-[88vh] bg-[#0c1016] border border-white/10 shadow-[0_0_50px_rgba(0,243,255,0.1)] overflow-hidden flex flex-col rounded-lg"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HUD Elements */}
        <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-cyan-500/40 pointer-events-none" />
        <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-cyan-500/40 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-cyan-500/40 pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-cyan-500/40 pointer-events-none" />
        
        {/* Animated Scanline */}
        <div className="absolute inset-x-0 top-0 h-[2px] bg-cyan-500/20 shadow-[0_0_15px_rgba(0,243,255,0.5)] animate-[scan_6s_linear_infinite] pointer-events-none" />

        {/* Header */}
        <div className="p-5 sm:p-8 md:p-10 border-b border-white/5 shrink-0 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 sm:gap-4 mb-1">
               <div className="w-1.5 h-6 bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.5)]" />
               <h2 className="font-orbitron font-black text-xl sm:text-2xl tracking-[0.25em] uppercase">
                 Field Manual
               </h2>
            </div>
            <p className="font-mono text-[9px] tracking-[0.3em] uppercase opacity-40">Tactical Operation Guidelines v4.0</p>
          </div>
          <button
            onClick={() => { playSciFiClick(); onClose(); }}
            className="w-11 h-11 flex items-center justify-center rounded-lg border border-white/10 hover:border-cyan-500/50 hover:bg-cyan-500/10 active:scale-95 transition-all text-white/50 hover:text-cyan-400 font-mono text-xl cursor-pointer"
            style={{ touchAction: "manipulation" }}
            aria-label="Close manual"
          >
            ✕
          </button>
        </div>

        {/* Tactical Tabs */}
        <div className="px-8 flex gap-8 shrink-0 bg-white/[0.02]">
          <TabButton 
             active={activeTab === "phases"} 
             onClick={() => handleTabChange("phases")}
             label="Mission Phases"
          />
          <TabButton 
             active={activeTab === "roles"} 
             onClick={() => handleTabChange("roles")}
             label="Entity Glossary"
          />
          <TabButton 
             active={activeTab === "image"} 
             onClick={() => handleTabChange("image")}
             label="Visual Briefing"
          />
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-8 md:p-10 custom-scrollbar">
          {activeTab === "phases" ? (
            <div className="max-w-2xl space-y-12">
              <div className="p-6 bg-white/5 border-l-2 border-cyan-500/50">
                 <p className="font-mono text-xs leading-relaxed text-cyan-100/70 uppercase tracking-widest">
                    Errant Night is a high-stakes social deduction engagement. Identify anomalies, synchronize with your unit, and prevent system-wide infestation.
                 </p>
              </div>

              <div className="space-y-10">
                <PhaseStep step={1} title="Lobby Initialization" desc="Commanders establish a secure frequency. Operators join via encrypted callsigns." />
                <PhaseStep step={2} title="Protocol Configuration" desc="Define role parameters. Ensure extra identity cards are staged in the core (center)." />
                <PhaseStep step={3} title="Identity Imprinting" desc="Receive your entity assignment. WIN_CONDITION and ABILITY set to active." />
                <PhaseStep step={4} title="Orbit Phase [ACTIVE]" desc="Deploy abilities. High-level entity swaps and scans occur during this blackout." />
                <PhaseStep step={5} title="System Discussion" desc="Analyze anomalies. Deceive or expose. Roles may have drifted from original owners." />
                <PhaseStep step={6} title="Verification Vote" desc="Designate one suspect for removal. Stalemate occurs if no clear majority is reached." />
                <PhaseStep step={7} title="Final Resolution" desc="Full reveal of all identities. Crew victory upon Alien neutralization." />
              </div>
            </div>
          ) : activeTab === "roles" ? (
            <div className="space-y-16">
              <RoleSection team="Crew" color="#00f3ff" roles={CREW_ROLES} />
              <RoleSection team="Alien" color="#ff4e4e" roles={ALIEN_ROLES} />
              <RoleSection team="Chaotic" color="#c084fc" roles={CHAOTIC_ROLES} />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-4 sm:py-8 space-y-3">
              <div
                className="relative p-2 bg-white/5 border border-cyan-500/30 rounded-lg group shadow-[0_0_25px_rgba(0,243,255,0.1)] cursor-pointer"
                onClick={() => setZoomImage(true)}
              >
                <img
                  src={howToPlayImg}
                  alt="Quick Guide"
                  className="w-full max-w-lg transition-all duration-300 rounded"
                />
                <div className="absolute inset-0 bg-cyan-500/5 opacity-0 hover:opacity-100 transition-opacity rounded flex items-center justify-center pointer-events-none">
                  <span className="px-3 py-1 bg-black/80 border border-cyan-400 text-cyan-300 text-[10px] font-orbitron tracking-widest uppercase rounded">
                    Tap to Expand
                  </span>
                </div>
              </div>
              <p className="font-mono text-[9px] text-white/40 uppercase tracking-widest text-center">
                Tap visual briefing to zoom in / expand
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Full-Screen Zoom Overlay */}
      {zoomImage && (
        <div
          className="fixed inset-0 z-[10005] bg-black/95 flex flex-col items-center justify-center p-3 animate-in fade-in duration-200"
          onClick={() => setZoomImage(false)}
        >
          <div className="w-full max-w-2xl flex justify-between items-center mb-2 px-2">
            <span className="font-orbitron text-xs text-cyan-300 tracking-widest uppercase">
              Field Manual Visual Briefing
            </span>
            <button
              onClick={() => setZoomImage(false)}
              className="w-11 h-11 rounded-lg bg-black/80 border border-cyan-500/50 text-cyan-300 font-mono text-xl flex items-center justify-center cursor-pointer active:scale-95"
              style={{ touchAction: "manipulation" }}
            >
              ✕
            </button>
          </div>
          <div className="flex-1 w-full max-w-2xl overflow-y-auto flex items-center justify-center">
            <img
              src={howToPlayImg}
              alt="Quick Guide Full"
              className="w-full object-contain max-h-[85vh] rounded border border-white/10 shadow-2xl"
            />
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes scan {
          0% { top: 0%; opacity: 0; }
          5% { opacity: 1; }
          95% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(0,243,255,0.2); }
      `}} />
    </div>
  );
}

function TabButton({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`py-4 font-orbitron text-[10px] tracking-[0.3em] uppercase transition-all relative ${active ? "text-cyan-400" : "text-white/30 hover:text-white/60"}`}
    >
      {label}
      {active && (
        <div className="absolute bottom-0 left-0 w-full h-[2px] bg-cyan-500 shadow-[0_0_10px_rgba(0,243,255,0.5)]" />
      )}
    </button>
  );
}

function PhaseStep({ step, title, desc }: { step: number; title: string; desc: string }) {
  return (
    <div className="flex gap-6 group">
      <div className="w-10 h-10 border border-white/10 flex items-center justify-center font-orbitron text-xs text-cyan-400 shrink-0 group-hover:border-cyan-500/50 transition-colors">
        0{step}
      </div>
      <div>
        <h3 className="font-orbitron font-bold text-xs tracking-widest uppercase mb-1 group-hover:text-cyan-400 transition-colors">{title}</h3>
        <p className="font-mono text-[11px] leading-relaxed opacity-40">{desc}</p>
      </div>
    </div>
  );
}

function RoleSection({ team, color, roles }: { team: string; color: string; roles: Role[] }) {
  return (
    <div className="space-y-8">
      <h3 className="font-orbitron font-black text-sm tracking-[0.5em] uppercase flex items-center gap-4" style={{ color }}>
        {team} <TeamIcon team={team} className="w-4 h-4" />
        <div className="h-px flex-1" style={{ background: `${color}20` }} />
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {roles.map((role) => (
          <div key={role.id} className="p-4 bg-white/[0.03] border border-white/5 flex gap-5 hover:bg-white/[0.05] hover:border-white/10 transition-all group">
            <div className="w-20 h-20 shrink-0 relative overflow-hidden">
               <img src={role.image} alt={role.name} className="w-full h-full object-cover grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-500" />
               <div className="absolute inset-0 border border-white/10" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="font-orbitron font-bold text-[11px] tracking-widest uppercase">{role.name}</span>
                <span className="font-mono text-[8px] px-2 py-0.5 border opacity-40" style={{ borderColor: color, color }}>{role.winCondition}</span>
              </div>
              <p className="font-mono text-[9px] text-cyan-400/60 uppercase mb-2 tracking-tighter">Ability: {role.ability || "None"}</p>
              <p className="font-mono text-[10px] opacity-40 leading-relaxed line-clamp-2">{role.lore.split("\n")[0]}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


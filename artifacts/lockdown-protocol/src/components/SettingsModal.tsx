import { useState, useEffect } from "react";
import { usePreferences } from "@/hooks/usePreferences";
import { setMusicVolume } from "@/lib/music";
import { setSfxVolume, playSciFiClick } from "@/lib/sound";
import { STORAGE_KEYS, DEFAULTS } from "@/lib/constants";
import { usePerformanceMode } from "@/hooks/usePerformanceMode";
import { useReducedMotion } from "@/hooks/useReducedMotion";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { preferences, isLoading, updateMusicVolume, updateSfxVolume, updateNotifications, updateColorblindMode } = usePreferences();
  const [localMusicVolume, setLocalMusicVolume] = useState(DEFAULTS.musicVolume);
  const [localSfxVolume, setLocalSfxVolume] = useState(DEFAULTS.sfxVolume);
  const [localNotifications, setLocalNotifications] = useState(DEFAULTS.notificationsEnabled);
  const [localColorblindMode, setLocalColorblindMode] = useState(DEFAULTS.colorblindMode);
  const { lowGraphics, setLowGraphics } = usePerformanceMode();
  const [localLowGraphics, setLocalLowGraphics] = useState(lowGraphics);
  const { reducedMotion, setReducedMotion } = useReducedMotion();
  const [localReducedMotion, setLocalReducedMotion] = useState(reducedMotion);
  const [saveMessage, setSaveMessage] = useState("");

  useEffect(() => {
    if (preferences) {
      setLocalMusicVolume(preferences.musicVolume);
      setLocalSfxVolume(preferences.sfxVolume);
      setLocalNotifications(preferences.notificationsEnabled);
      setLocalColorblindMode(preferences.colorblindMode);
    }
  }, [preferences]);

  const handleSaveSettings = async () => {
    playSciFiClick();
    try {
      await updateMusicVolume(localMusicVolume);
      await updateSfxVolume(localSfxVolume);
      await updateNotifications(localNotifications);
      await updateColorblindMode(localColorblindMode);
      setLowGraphics(localLowGraphics);
      setReducedMotion(localReducedMotion);

      setSaveMessage("SYSTEM_SYNC_SUCCESSFUL");
      setTimeout(() => {
        setSaveMessage("");
        onClose();
      }, 1500);
    } catch (error) {
      setSaveMessage("SYNC_FAILURE_RETRY");
      setTimeout(() => setSaveMessage(""), 3000);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center p-4 backdrop-blur-sm transition-all duration-300"
      style={{ background: "hsl(220 30% 2% / 0.85)" }}
      onClick={() => { playSciFiClick(); onClose(); }}
    >
      <div
        className="relative w-full max-w-xl bg-[#0c1016] border border-white/10 shadow-[0_0_50px_rgba(0,243,255,0.1)] overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HUD Elements */}
        <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-cyan-500/40" />
        <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-cyan-500/40" />
        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-cyan-500/40" />
        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-cyan-500/40" />
        
        {/* Animated Scanline */}
        <div className="absolute inset-x-0 top-0 h-[2px] bg-cyan-500/20 shadow-[0_0_15px_rgba(0,243,255,0.5)] animate-[scan_5s_linear_infinite]" />

        {/* Header */}
        <div className="p-8 border-b border-white/5 shrink-0 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-4 mb-1">
               <div className="w-1.5 h-6 bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.5)]" />
               <h2 className="font-orbitron font-black text-xl tracking-[0.3em] uppercase">
                 Settings
               </h2>
            </div>
            <p className="font-mono text-[9px] tracking-[0.4em] uppercase opacity-40">System Configuration Override</p>
          </div>
          <button
            onClick={() => { playSciFiClick(); onClose(); }}
            className="w-10 h-10 flex items-center justify-center border border-white/10 hover:border-cyan-500/50 hover:bg-cyan-500/10 transition-all text-white/40 hover:text-cyan-400 font-mono text-xl"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-10">
          {/* Audio Section */}
          <section className="space-y-6">
             <div className="flex items-center gap-4 mb-4">
                <span className="font-orbitron text-[10px] tracking-[0.3em] uppercase text-cyan-400">Audio_Link</span>
                <div className="h-px flex-1 bg-white/5" />
             </div>
             
             <div className="space-y-8">
                <Slider 
                   label="Background Transmission (Music)"
                   value={localMusicVolume}
                   onChange={(val) => { setLocalMusicVolume(val); setMusicVolume(val); }}
                />
                <Slider 
                   label="Feedback Pings (SFX)"
                   value={localSfxVolume}
                   onChange={(val) => { setLocalSfxVolume(val); setSfxVolume(val); playSciFiClick(val/100); }}
                />
             </div>
          </section>

          {/* Visual/Performance Section */}
          <section className="space-y-6">
             <div className="flex items-center gap-4 mb-4">
                <span className="font-orbitron text-[10px] tracking-[0.3em] uppercase text-cyan-400">Visual_Override</span>
                <div className="h-px flex-1 bg-white/5" />
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Toggle 
                   label="Colorblind Calibration"
                   desc="Add distinct symbolic anchors to teams"
                   checked={localColorblindMode}
                   onChange={setLocalColorblindMode}
                />
                <Toggle 
                   label="Performance Mode"
                   desc="Minimize heavy kinetic processing"
                   checked={localLowGraphics}
                   onChange={setLocalLowGraphics}
                />
                <Toggle 
                   label="Reduced Motion"
                   desc="Stabilize UI transitions"
                   checked={localReducedMotion}
                   onChange={setLocalReducedMotion}
                />
                <Toggle 
                   label="Encrypted Alerts"
                   desc="Enable incoming transmissions"
                   checked={localNotifications}
                   onChange={setLocalNotifications}
                />
             </div>
          </section>

          {saveMessage && (
            <div className="p-4 bg-cyan-500/5 border border-cyan-500/20 text-center">
               <p className="font-mono text-[10px] tracking-[0.3em] text-cyan-400 uppercase animate-pulse">{saveMessage}</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="p-8 border-t border-white/5 bg-white/[0.02] flex gap-4">
           <button
             onClick={handleSaveSettings}
             className="flex-1 py-4 bg-cyan-500/10 border border-cyan-500/40 text-cyan-400 font-orbitron text-xs tracking-[0.4em] uppercase hover:bg-cyan-500/20 transition-all relative overflow-hidden group"
           >
             <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
             Sync_Changes
           </button>
           <button
             onClick={() => { playSciFiClick(); onClose(); }}
             className="px-8 py-4 bg-white/5 border border-white/10 text-white/40 font-orbitron text-xs tracking-[0.4em] uppercase hover:bg-white/10 hover:text-white transition-all"
           >
             Dismiss
           </button>
        </div>
      </div>

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

function Slider({ label, value, onChange }: { label: string; value: number; onChange: (val: number) => void }) {
  return (
    <div className="space-y-4">
       <div className="flex justify-between items-end">
          <label className="font-mono text-[9px] tracking-[0.2em] uppercase opacity-40">{label}</label>
          <span className="font-orbitron text-xs text-cyan-400">{value}%</span>
       </div>
       <div className="relative h-6 flex items-center group">
          <div className="absolute inset-x-0 h-px bg-white/10" />
          <div className="absolute left-0 h-px bg-cyan-500 shadow-[0_0_10px_#00f3ff]" style={{ width: `${value}%` }} />
          <input
            type="range"
            min="0"
            max="100"
            value={value}
            onChange={(e) => onChange(Number(e.target.value))}
            className="absolute inset-x-0 w-full opacity-0 cursor-pointer z-10"
          />
          <div 
             className="absolute w-1 h-4 bg-cyan-400 shadow-[0_0_10px_#00f3ff] transition-all group-hover:scale-y-150"
             style={{ left: `calc(${value}% - 2px)` }}
          />
       </div>
    </div>
  );
}

function Toggle({ label, desc, checked, onChange }: { label: string; desc: string; checked: boolean; onChange: (val: boolean) => void }) {
  return (
    <button 
      onClick={() => { playSciFiClick(); onChange(!checked); }}
      className="flex gap-4 p-4 bg-white/5 border border-white/5 hover:border-white/10 transition-all text-left group"
    >
       <div className={`w-5 h-5 border transition-all flex items-center justify-center shrink-0 ${checked ? "border-cyan-500 bg-cyan-500/20" : "border-white/10"}`}>
          {checked && <div className="w-2 h-2 bg-cyan-400 shadow-[0_0_5px_#00f3ff]" />}
       </div>
       <div>
          <h4 className={`font-orbitron text-[10px] tracking-widest uppercase transition-colors ${checked ? "text-cyan-400" : "opacity-60 group-hover:opacity-100"}`}>{label}</h4>
          <p className="font-mono text-[9px] opacity-30 mt-1 leading-tight uppercase">{desc}</p>
       </div>
    </button>
  );
}

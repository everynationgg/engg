import { useState, useEffect, useRef } from "react";
import { usePreferences } from "@/hooks/usePreferences";
import { setMusicVolume } from "@/lib/music";
import { setSfxVolume, playSciFiClick } from "@/lib/sound";
import { DEFAULTS } from "@/lib/constants";
import { usePerformanceMode } from "@/hooks/usePerformanceMode";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { Volume2, VolumeX } from "lucide-react";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { preferences, updateMusicVolume, updateSfxVolume, updateNotifications, updateColorblindMode } = usePreferences();
  const [localMusicVolume, setLocalMusicVolume] = useState(DEFAULTS.musicVolume);
  const [localSfxVolume, setLocalSfxVolume] = useState(DEFAULTS.sfxVolume);
  const [prevMusicVolume, setPrevMusicVolume] = useState(70);
  const [prevSfxVolume, setPrevSfxVolume] = useState(70);
  const [localNotifications, setLocalNotifications] = useState(DEFAULTS.notificationsEnabled);
  const [localColorblindMode, setLocalColorblindMode] = useState(DEFAULTS.colorblindMode);
  const { lowGraphics, setLowGraphics } = usePerformanceMode();
  const [localLowGraphics, setLocalLowGraphics] = useState(lowGraphics);
  const { reducedMotion, setReducedMotion } = useReducedMotion();
  const [localReducedMotion, setLocalReducedMotion] = useState(reducedMotion);
  const [savedNotice, setSavedNotice] = useState(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (preferences) {
      setLocalMusicVolume(preferences.musicVolume);
      setLocalSfxVolume(preferences.sfxVolume);
      if (preferences.musicVolume > 0) setPrevMusicVolume(preferences.musicVolume);
      if (preferences.sfxVolume > 0) setPrevSfxVolume(preferences.sfxVolume);
      setLocalNotifications(preferences.notificationsEnabled);
      setLocalColorblindMode(preferences.colorblindMode);
    }
  }, [preferences]);

  useEffect(() => {
    setLocalLowGraphics(lowGraphics);
  }, [lowGraphics]);

  useEffect(() => {
    setLocalReducedMotion(reducedMotion);
  }, [reducedMotion]);

  const showSavedFlash = () => {
    setSavedNotice(true);
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => setSavedNotice(false), 1600);
  };

  // Back button and ESC key handler
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };

    const handleBackButton = (e: Event) => {
      e.preventDefault();
      onClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    document.addEventListener("backbutton", handleBackButton);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("backbutton", handleBackButton);
    };
  }, [isOpen, onClose]);

  const handleMusicChange = (val: number) => {
    setLocalMusicVolume(val);
    if (val > 0) setPrevMusicVolume(val);
    setMusicVolume(val);
    void updateMusicVolume(val);
    showSavedFlash();
  };

  const handleSfxChange = (val: number) => {
    setLocalSfxVolume(val);
    if (val > 0) setPrevSfxVolume(val);
    setSfxVolume(val);
    if (val > 0) playSciFiClick(val / 100);
    void updateSfxVolume(val);
    showSavedFlash();
  };

  const handleToggleColorblind = (val: boolean) => {
    setLocalColorblindMode(val);
    void updateColorblindMode(val);
    showSavedFlash();
  };

  const handleToggleLowGraphics = (val: boolean) => {
    setLocalLowGraphics(val);
    setLowGraphics(val);
    showSavedFlash();
  };

  const handleToggleReducedMotion = (val: boolean) => {
    setLocalReducedMotion(val);
    setReducedMotion(val);
    showSavedFlash();
  };

  const handleToggleNotifications = (val: boolean) => {
    setLocalNotifications(val);
    void updateNotifications(val);
    showSavedFlash();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[10001] flex items-center justify-center p-2.5 sm:p-4 backdrop-blur-sm transition-all duration-300"
      style={{
        background: "hsl(220 30% 2% / 0.85)",
        paddingTop: "max(12px, env(safe-area-inset-top, 12px))",
        paddingBottom: "max(12px, env(safe-area-inset-bottom, 12px))",
      }}
      onClick={() => { playSciFiClick(); onClose(); }}
    >
      <div
        className="relative w-full max-w-xl bg-[#0c1016] border border-white/15 shadow-[0_0_50px_rgba(0,243,255,0.12)] overflow-hidden flex flex-col max-h-[90dvh] rounded-xl"
        onClick={(e) => e.stopPropagation()}
        data-no-swipe="true"
      >
        {/* Corner Accents */}
        <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-cyan-500/40 pointer-events-none" />
        <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-cyan-500/40 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-cyan-500/40 pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-cyan-500/40 pointer-events-none" />

        {/* Header */}
        <div className="px-4 py-4 sm:px-8 sm:py-6 border-b border-white/10 shrink-0 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-1.5 h-6 bg-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.5)] rounded-full" />
              <h2 className="font-orbitron font-black text-lg sm:text-xl tracking-[0.18em] uppercase text-white">
                Settings
              </h2>
              {savedNotice && (
                <span className="px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 font-mono text-[10px] uppercase tracking-wider">
                  ✓ Saved
                </span>
              )}
            </div>
            <p className="font-mono text-[11px] sm:text-xs tracking-[0.12em] uppercase text-white/60">
              Audio, Graphics &amp; Accessibility
            </p>
          </div>
          <button
            onClick={() => { playSciFiClick(); onClose(); }}
            className="w-11 h-11 flex items-center justify-center rounded-lg border border-white/15 hover:border-cyan-400/50 hover:bg-cyan-500/10 active:scale-95 transition-all text-white/70 hover:text-cyan-300 font-mono text-lg cursor-pointer"
            style={{ touchAction: "manipulation" }}
            aria-label="Close settings"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 custom-scrollbar space-y-8">
          {/* Audio Section */}
          <section className="space-y-5">
            <div className="flex items-center gap-3">
              <span className="font-orbitron font-bold text-xs tracking-[0.2em] uppercase text-cyan-300">
                Audio
              </span>
              <div className="h-px flex-1 bg-white/10" />
            </div>

            <div className="space-y-6">
              <Slider
                label="Music Volume"
                value={localMusicVolume}
                onChange={handleMusicChange}
                onToggleMute={() => handleMusicChange(localMusicVolume > 0 ? 0 : prevMusicVolume || 70)}
              />
              <Slider
                label="Sound Effects"
                value={localSfxVolume}
                onChange={handleSfxChange}
                onToggleMute={() => handleSfxChange(localSfxVolume > 0 ? 0 : prevSfxVolume || 70)}
              />
            </div>
          </section>

          {/* Graphics & Accessibility Section */}
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="font-orbitron font-bold text-xs tracking-[0.2em] uppercase text-cyan-300">
                Graphics &amp; Accessibility
              </span>
              <div className="h-px flex-1 bg-white/10" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <Toggle
                label="Colorblind Mode"
                desc="Display team icons alongside role colors"
                checked={localColorblindMode}
                onChange={handleToggleColorblind}
              />
              <Toggle
                label="Performance Mode"
                desc="Reduce background visual effects for smoother frame rates"
                checked={localLowGraphics}
                onChange={handleToggleLowGraphics}
              />
              <Toggle
                label="Reduced Motion"
                desc="Minimize screen shake and transition animations"
                checked={localReducedMotion}
                onChange={handleToggleReducedMotion}
              />
              <Toggle
                label="Notifications"
                desc="Receive alerts for lobby invites and match events"
                checked={localNotifications}
                onChange={handleToggleNotifications}
              />
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="p-4 sm:px-8 sm:py-5 border-t border-white/10 bg-white/[0.02] flex items-center justify-between gap-4">
          <span className="text-xs text-white/55">
            Changes are saved automatically
          </span>
          <button
            onClick={() => { playSciFiClick(); onClose(); }}
            className="px-6 py-3 rounded-lg bg-cyan-500/15 border border-cyan-400/50 text-cyan-300 font-orbitron font-bold text-xs tracking-[0.15em] uppercase hover:bg-cyan-500/25 active:scale-[0.98] transition-all cursor-pointer"
            style={{ touchAction: "manipulation" }}
          >
            Done
          </button>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.12); border-radius: 9999px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(0,243,255,0.3); }
      `}} />
    </div>
  );
}

function Slider({
  label,
  value,
  onChange,
  onToggleMute,
}: {
  label: string;
  value: number;
  onChange: (val: number) => void;
  onToggleMute: () => void;
}) {
  const isMuted = value === 0;
  return (
    <div
      className="p-3.5 sm:p-4 rounded-xl bg-white/[0.03] border border-white/10 space-y-3"
      onTouchStart={(e) => e.stopPropagation()}
      onTouchMove={(e) => e.stopPropagation()}
    >
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => {
              playSciFiClick();
              onToggleMute();
            }}
            style={{ touchAction: "manipulation" }}
            className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-colors cursor-pointer ${
              isMuted
                ? "border-rose-500/40 bg-rose-500/10 text-rose-400"
                : "border-cyan-500/30 bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20"
            }`}
            aria-label={isMuted ? `Unmute ${label}` : `Mute ${label}`}
            title={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
          <label className="font-orbitron font-bold text-xs tracking-[0.1em] uppercase text-white/90">
            {label}
          </label>
        </div>
        <span className="font-mono font-bold text-xs sm:text-sm text-cyan-300">
          {isMuted ? "Muted" : `${value}%`}
        </span>
      </div>

      <div className="relative h-7 flex items-center">
        <div className="absolute inset-x-0 h-2 rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-cyan-500 to-cyan-300 rounded-full"
            style={{ width: `${value}%` }}
          />
        </div>
        <input
          type="range"
          min="0"
          max="100"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          style={{ touchAction: "pan-y" }}
          className="absolute inset-x-0 w-full h-7 opacity-0 cursor-pointer z-10"
        />
        <div
          className="absolute w-4 h-4 rounded-full bg-white border-2 border-cyan-400 shadow-[0_0_10px_#00f3ff] pointer-events-none transition-transform"
          style={{ left: `calc(${value}% - 8px)` }}
        />
      </div>
    </div>
  );
}

function Toggle({
  label,
  desc,
  checked,
  onChange,
}: {
  label: string;
  desc: string;
  checked: boolean;
  onChange: (val: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => {
        playSciFiClick();
        onChange(!checked);
      }}
      style={{ touchAction: "manipulation" }}
      className={`flex items-start gap-3.5 p-3.5 sm:p-4 rounded-xl border transition-all text-left cursor-pointer ${
        checked
          ? "bg-cyan-500/[0.08] border-cyan-400/40"
          : "bg-white/[0.03] border-white/10 hover:border-white/20"
      }`}
    >
      <div
        className={`w-5 h-5 mt-0.5 rounded border transition-all flex items-center justify-center shrink-0 ${
          checked ? "border-cyan-400 bg-cyan-400/20" : "border-white/25 bg-black/30"
        }`}
      >
        {checked && <div className="w-2.5 h-2.5 rounded-xs bg-cyan-300 shadow-[0_0_6px_#00f3ff]" />}
      </div>
      <div>
        <h4
          className={`font-orbitron font-bold text-xs tracking-[0.08em] uppercase transition-colors ${
            checked ? "text-cyan-300" : "text-white/85"
          }`}
        >
          {label}
        </h4>
        <p className="text-xs text-white/60 mt-1 leading-snug">{desc}</p>
      </div>
    </button>
  );
}

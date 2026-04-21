import { useState, useEffect } from "react";
import { usePreferences } from "@/hooks/usePreferences";
import { setMusicVolume } from "@/lib/music";
import { setSfxVolume, playSciFiClick } from "@/lib/sound";
import { STORAGE_KEYS, DEFAULTS } from "@/lib/constants";
import { usePerformanceMode } from "@/hooks/usePerformanceMode";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useFocusTrap } from "@/hooks/useFocusTrap";

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

  // Sync local state with preferences
  useEffect(() => {
    if (preferences) {
      setLocalMusicVolume(preferences.musicVolume);
      setLocalSfxVolume(preferences.sfxVolume);
      setLocalNotifications(preferences.notificationsEnabled);
      setLocalColorblindMode(preferences.colorblindMode);
    }
  }, [preferences]);

  const handleSaveSettings = async () => {
    try {
      const updates: Record<string, any> = {};

      if (localMusicVolume !== preferences?.musicVolume) {
        updates.musicVolume = localMusicVolume;
      }
      if (localSfxVolume !== preferences?.sfxVolume) {
        updates.sfxVolume = localSfxVolume;
      }
      if (localNotifications !== preferences?.notificationsEnabled) {
        updates.notificationsEnabled = localNotifications;
      }
      if (localColorblindMode !== preferences?.colorblindMode) {
        updates.colorblindMode = localColorblindMode;
      }

      if (Object.keys(updates).length === 0) {
        setSaveMessage("No changes to save");
        setTimeout(() => setSaveMessage(""), 3000);
        return;
      }

      await updateMusicVolume(localMusicVolume);
      await updateSfxVolume(localSfxVolume);
      if ('notificationsEnabled' in updates) await updateNotifications(localNotifications);
      if ('colorblindMode' in updates) await updateColorblindMode(localColorblindMode);
      

      if (localLowGraphics !== lowGraphics) {
        setLowGraphics(localLowGraphics);
      }
      if (localReducedMotion !== reducedMotion) {
        setReducedMotion(localReducedMotion);
      }
              {/* Reduced Motion Toggle */}
              <div className="mt-6 border-t pt-4" style={{ borderColor: "hsl(210 30% 25%)" }}>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={localReducedMotion}
                    onChange={e => setLocalReducedMotion(e.target.checked)}
                    className="w-5 h-5 rounded"
                    style={{ accentColor: "hsl(185 100% 50%)" }}
                  />
                  <span className="font-orbitron text-xs tracking-[0.1em] uppercase" style={{ color: "hsl(210 30% 60%)" }}>
                    Reduced Motion
                  </span>
                </label>
                <p className="font-orbitron text-xs mt-2 leading-relaxed" style={{ color: "hsl(210 30% 45%)" }}>
                  Disables most UI animations and transitions for accessibility and comfort.
                </p>
              </div>

      setSaveMessage("✓ Settings saved!");
      setTimeout(() => {
        setSaveMessage("");
        onClose();
      }, 1500);
    } catch (error) {
      setSaveMessage("✗ Failed to save settings");
      setTimeout(() => setSaveMessage(""), 3000);
    }
  };

  const modalRef = useFocusTrap(isOpen);
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-2 py-2 sm:px-4 sm:py-6 ix-backdrop ix-backdrop-blur"
      style={{ background: "hsl(220 30% 4% / 0.9)" }}
      onClick={onClose}
    >
      <div
        ref={modalRef}
        className="relative w-full max-w-[98vw] sm:max-w-lg rounded-lg ix-modal-enter ix-modal-bg max-h-[98vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        tabIndex={-1}
        aria-modal="true"
        role="dialog"
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded font-orbitron font-bold text-sm cursor-pointer hover:opacity-80 transition-opacity ix-modal-close"
          aria-label="Close"
        >
          ✕
        </button>

        {/* Content */}
        <div className="p-6">
          <h2 className="font-orbitron font-bold text-2xl tracking-[0.2em] uppercase mb-6 ix-accent-text">
            ⚙️ Settings
          </h2>

          {isLoading && !preferences ? (
            <div className="text-center py-12">
              <div className="w-8 h-8 mx-auto mb-4 border-4 border-transparent rounded-full animate-spin ix-spinner" />
              <p className="font-orbitron text-sm" style={{ color: "hsl(210 30% 60%)" }}>
                Loading settings...
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Audio Settings */}
              <div className="rounded-lg p-4 ix-modal-section">
                <h3 className="font-orbitron font-bold text-lg tracking-[0.2em] uppercase mb-4 ix-accent-text">
                  🎵 Audio
                </h3>

                <div className="space-y-4">
                  {/* Music Volume */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="font-orbitron text-xs tracking-[0.1em] uppercase ix-label-text">
                        Music Volume
                      </label>
                      <span className="font-orbitron font-bold ix-accent-text">
                        {localMusicVolume}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={localMusicVolume}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setLocalMusicVolume(val);
                        setMusicVolume(val);
                      }}
                      className="w-full h-2 rounded-lg appearance-none cursor-pointer ix-slider"
                    />
                  </div>

                  {/* SFX Volume */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="font-orbitron text-xs tracking-[0.1em] uppercase ix-label-text">
                        Sound Effects Volume
                      </label>
                      <span className="font-orbitron font-bold ix-accent-text">
                        {localSfxVolume}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={localSfxVolume}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setLocalSfxVolume(val);
                        setSfxVolume(val);
                        playSciFiClick(val / 100);
                      }}
                      className="w-full h-2 rounded-lg appearance-none cursor-pointer ix-slider"
                    />
                  </div>
                </div>
              </div>

              {/* Notification Settings */}
              <div className="rounded-lg p-4 ix-modal-section">
                <h3 className="font-orbitron font-bold text-lg tracking-[0.2em] uppercase mb-4 ix-accent-text">
                  🔔 Notifications
                </h3>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={localNotifications}
                    onChange={(e) => setLocalNotifications(e.target.checked)}
                    className="w-5 h-5 rounded"
                    style={{
                      accentColor: "hsl(185 100% 50%)",
                    }}
                  />
                  <span className="font-orbitron text-xs tracking-[0.1em] uppercase ix-label-text">
                    Enable notifications
                  </span>
                </label>
                <p className="font-orbitron text-xs mt-2 ix-desc-text">
                  Receive alerts for game invites and messages
                </p>
              </div>

              {/* Accessibility Settings */}
              <div className="rounded-lg p-4 ix-modal-section">
                <h3 className="font-orbitron font-bold text-lg tracking-[0.2em] uppercase mb-4 ix-accent-text">
                  👁️ Accessibility
                </h3>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={localColorblindMode}
                    onChange={(e) => setLocalColorblindMode(e.target.checked)}
                    className="w-5 h-5 rounded"
                    style={{
                      accentColor: "hsl(185 100% 50%)",
                    }}
                  />
                  <span className="font-orbitron text-xs tracking-[0.1em] uppercase ix-label-text">
                    Colorblind Mode
                  </span>
                </label>
                <p className="font-orbitron text-xs mt-2 leading-relaxed ix-desc-text">
                  Add distinct icons to teams and roles to help differentiate alignments without relying entirely on color.
                </p>

                <div className="mt-6 border-t pt-4 ix-modal-divider">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={localLowGraphics}
                      onChange={(e) => setLocalLowGraphics(e.target.checked)}
                      className="w-5 h-5 rounded"
                      style={{
                        accentColor: "hsl(185 100% 50%)",
                      }}
                    />
                    <span className="font-orbitron text-xs tracking-[0.1em] uppercase ix-label-text">
                      Performance Mode (Low Graphics)
                    </span>
                  </label>
                  <p className="font-orbitron text-xs mt-2 leading-relaxed ix-desc-text">
                    Disables heavy animations (parallax, 3D tilt, screen shakes) to save battery and improve performance on older devices.
                  </p>
                </div>
              </div>

              {/* Save Message */}
              {saveMessage && (
                <div className={`rounded-lg p-3 text-center font-orbitron text-sm ix-save-message ${saveMessage.includes("✓") ? "ix-save-success" : "ix-save-fail"}`}>{saveMessage}</div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleSaveSettings}
                  className="ix-btn flex-1 py-2.5 font-orbitron text-xs tracking-[0.2em] uppercase rounded border-2 transition-all duration-150 ix-save-btn"
                >✓ SAVE</button>
                <button
                  onClick={onClose}
                  className="ix-btn flex-1 py-2.5 font-orbitron text-xs tracking-[0.2em] uppercase rounded border-2 transition-all duration-150 ix-close-btn"
                >CLOSE</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

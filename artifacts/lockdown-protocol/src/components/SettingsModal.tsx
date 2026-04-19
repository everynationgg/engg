import { useState, useEffect } from "react";
import { usePreferences } from "@/hooks/usePreferences";
import { setMusicVolume } from "@/lib/music";
import { setSfxVolume, playSciFiClick } from "@/lib/sound";
import { usePerformanceMode } from "@/hooks/usePerformanceMode";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { preferences, isLoading, updateMusicVolume, updateSfxVolume, updateNotifications, updateColorblindMode } = usePreferences();
  const [localMusicVolume, setLocalMusicVolume] = useState(70);
  const [localSfxVolume, setLocalSfxVolume] = useState(70);
  const [localNotifications, setLocalNotifications] = useState(true);
  const [localColorblindMode, setLocalColorblindMode] = useState(false);
  const { lowGraphics, setLowGraphics } = usePerformanceMode();
  const [localLowGraphics, setLocalLowGraphics] = useState(lowGraphics);
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

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6 ix-backdrop ix-backdrop-blur"
      style={{ background: "hsl(220 30% 4% / 0.9)" }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg rounded-lg ix-modal-enter"
        style={{
          border: "1px solid hsl(270 80% 55% / 0.4)",
          boxShadow: "0 0 40px hsl(270 80% 55% / 0.2)",
          background: "hsl(220 28% 4%)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded font-orbitron font-bold text-sm cursor-pointer hover:opacity-80 transition-opacity"
          style={{
            background: "hsl(220 28% 10% / 0.9)",
            border: "1px solid hsl(210 30% 25%)",
            color: "hsl(190 60% 70%)",
          }}
          aria-label="Close"
        >
          ✕
        </button>

        {/* Content */}
        <div className="p-6">
          <h2 className="font-orbitron font-bold text-2xl tracking-[0.2em] uppercase mb-6" style={{ color: "hsl(185 100% 50%)" }}>
            ⚙️ Settings
          </h2>

          {isLoading && !preferences ? (
            <div className="text-center py-12">
              <div
                className="w-8 h-8 mx-auto mb-4 border-4 border-transparent rounded-full animate-spin"
                style={{
                  borderTopColor: "hsl(185 100% 50%)",
                  borderRightColor: "hsl(270 70% 60%)",
                }}
              />
              <p className="font-orbitron text-sm" style={{ color: "hsl(210 30% 60%)" }}>
                Loading settings...
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Audio Settings */}
              <div className="rounded-lg p-4" style={{ background: "hsl(220 28% 9%)", border: "1px solid hsl(210 30% 25%)" }}>
                <h3 className="font-orbitron font-bold text-lg tracking-[0.2em] uppercase mb-4" style={{ color: "hsl(185 100% 50%)" }}>
                  🎵 Audio
                </h3>

                <div className="space-y-4">
                  {/* Music Volume */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="font-orbitron text-xs tracking-[0.1em] uppercase" style={{ color: "hsl(210 30% 60%)" }}>
                        Music Volume
                      </label>
                      <span className="font-orbitron font-bold" style={{ color: "hsl(185 100% 50%)" }}>
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
                      className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                      style={{
                        background: `linear-gradient(to right, hsl(185 100% 50%) 0%, hsl(185 100% 50%) ${localMusicVolume}%, hsl(210 30% 25%) ${localMusicVolume}%, hsl(210 30% 25%) 100%)`,
                      }}
                    />
                  </div>

                  {/* SFX Volume */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="font-orbitron text-xs tracking-[0.1em] uppercase" style={{ color: "hsl(210 30% 60%)" }}>
                        Sound Effects Volume
                      </label>
                      <span className="font-orbitron font-bold" style={{ color: "hsl(185 100% 50%)" }}>
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
                      className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                      style={{
                        background: `linear-gradient(to right, hsl(185 100% 50%) 0%, hsl(185 100% 50%) ${localSfxVolume}%, hsl(210 30% 25%) ${localSfxVolume}%, hsl(210 30% 25%) 100%)`,
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Notification Settings */}
              <div className="rounded-lg p-4" style={{ background: "hsl(220 28% 9%)", border: "1px solid hsl(210 30% 25%)" }}>
                <h3 className="font-orbitron font-bold text-lg tracking-[0.2em] uppercase mb-4" style={{ color: "hsl(185 100% 50%)" }}>
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
                  <span className="font-orbitron text-xs tracking-[0.1em] uppercase" style={{ color: "hsl(210 30% 60%)" }}>
                    Enable notifications
                  </span>
                </label>
                <p className="font-orbitron text-xs mt-2" style={{ color: "hsl(210 30% 45%)" }}>
                  Receive alerts for game invites and messages
                </p>
              </div>

              {/* Accessibility Settings */}
              <div className="rounded-lg p-4" style={{ background: "hsl(220 28% 9%)", border: "1px solid hsl(210 30% 25%)" }}>
                <h3 className="font-orbitron font-bold text-lg tracking-[0.2em] uppercase mb-4" style={{ color: "hsl(185 100% 50%)" }}>
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
                  <span className="font-orbitron text-xs tracking-[0.1em] uppercase" style={{ color: "hsl(210 30% 60%)" }}>
                    Colorblind Mode
                  </span>
                </label>
                <p className="font-orbitron text-xs mt-2 leading-relaxed" style={{ color: "hsl(210 30% 45%)" }}>
                  Add distinct icons to teams and roles to help differentiate alignments without relying entirely on color.
                </p>

                <div className="mt-6 border-t pt-4" style={{ borderColor: "hsl(210 30% 25%)" }}>
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
                    <span className="font-orbitron text-xs tracking-[0.1em] uppercase" style={{ color: "hsl(210 30% 60%)" }}>
                      Performance Mode (Low Graphics)
                    </span>
                  </label>
                  <p className="font-orbitron text-xs mt-2 leading-relaxed" style={{ color: "hsl(210 30% 45%)" }}>
                    Disables heavy animations (parallax, 3D tilt, screen shakes) to save battery and improve performance on older devices.
                  </p>
                </div>
              </div>

              {/* Save Message */}
              {saveMessage && (
                <div
                  className="rounded-lg p-3 text-center font-orbitron text-sm"
                  style={{
                    background: saveMessage.includes("✓") ? "hsl(120 70% 20%)" : "hsl(0 70% 20%)",
                    color: saveMessage.includes("✓") ? "hsl(120 100% 60%)" : "hsl(0 100% 60%)",
                    border: `1px solid ${saveMessage.includes("✓") ? "hsl(120 100% 40%)" : "hsl(0 100% 40%)"}`,
                  }}
                >
                  {saveMessage}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleSaveSettings}
                  className="ix-btn flex-1 py-2.5 font-orbitron font-bold text-xs tracking-[0.2em] uppercase rounded border-2 transition-all duration-150"
                  style={{
                    background: "hsl(120 70% 20%)",
                    borderColor: "hsl(120 100% 40%)",
                    color: "hsl(120 100% 60%)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "hsl(120 75% 25%)";
                    e.currentTarget.style.boxShadow = "0 0 15px hsl(120 100% 50% / 0.4)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "hsl(120 70% 20%)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  ✓ SAVE
                </button>
                <button
                  onClick={onClose}
                  className="ix-btn flex-1 py-2.5 font-orbitron font-bold text-xs tracking-[0.2em] uppercase rounded border-2 transition-all duration-150"
                  style={{
                    background: "hsl(210 30% 20%)",
                    borderColor: "hsl(210 30% 35%)",
                    color: "hsl(210 30% 60%)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "hsl(210 30% 25%)";
                    e.currentTarget.style.borderColor = "hsl(210 30% 50%)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "hsl(210 30% 20%)";
                    e.currentTarget.style.borderColor = "hsl(210 30% 35%)";
                  }}
                >
                  CLOSE
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

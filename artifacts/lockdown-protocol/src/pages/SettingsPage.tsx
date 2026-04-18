import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { usePreferences } from "@/hooks/usePreferences";
import { useState, useEffect } from "react";
// SettingsPage.tsx
import { playSciFiClick } from "@/lib/sound"; // Add playLobbyMusic here
import { setMusicVolume } from "@/lib/music";

// localStorage keys for guest (not-logged-in) settings
const GUEST_MUSIC_VOL_KEY = "lp_guest_music_volume";
const GUEST_SFX_VOL_KEY = "lp_guest_sfx_volume";
const GUEST_NOTIFICATIONS_KEY = "lp_guest_notifications";
const DEFAULT_VOLUME = 70;

export default function SettingsPage() {
  const [, setLocation] = useLocation();
  const { isLoggedIn, logout } = useAuth();
  const { preferences, isLoading, updateMusicVolume, updateSfxVolume, updateNotifications } = usePreferences();
  
  const [localMusicVolume, setLocalMusicVolume] = useState(DEFAULT_VOLUME);
  const [localSfxVolume, setLocalSfxVolume] = useState(DEFAULT_VOLUME);
  const [localNotifications, setLocalNotifications] = useState(true);
  const [saveMessage, setSaveMessage] = useState("");

  // Sync local state with server preferences (logged-in users)
  useEffect(() => {
    if (preferences) {
      setLocalMusicVolume(preferences.musicVolume);
      setLocalSfxVolume(preferences.sfxVolume);
      setLocalNotifications(preferences.notificationsEnabled);
    }
  }, [preferences]);

  // Load guest settings from localStorage when not logged in
  useEffect(() => {
    if (!isLoggedIn) {
      const savedMusic = parseInt(localStorage.getItem(GUEST_MUSIC_VOL_KEY) ?? String(DEFAULT_VOLUME), 10);
      const savedSfx = parseInt(localStorage.getItem(GUEST_SFX_VOL_KEY) ?? String(DEFAULT_VOLUME), 10);
      const savedNotifications = localStorage.getItem(GUEST_NOTIFICATIONS_KEY) !== "false";
      setLocalMusicVolume(isNaN(savedMusic) ? DEFAULT_VOLUME : savedMusic);
      setLocalSfxVolume(isNaN(savedSfx) ? DEFAULT_VOLUME : savedSfx);
      setLocalNotifications(savedNotifications);
    }
  }, [isLoggedIn]);

  // Helper to provide audio feedback when sliding
  const previewSfx = (volume: number) => {
    playSciFiClick(volume / 100);
  };

  const handleSaveSettings = async () => {
    // Guest save — persist to localStorage only
    if (!isLoggedIn) {
      localStorage.setItem(GUEST_MUSIC_VOL_KEY, String(localMusicVolume));
      localStorage.setItem(GUEST_SFX_VOL_KEY, String(localSfxVolume));
      localStorage.setItem(GUEST_NOTIFICATIONS_KEY, String(localNotifications));
      setSaveMessage("✓ Settings saved locally!");
      setTimeout(() => setSaveMessage(""), 3000);
      return;
    }

    try {
      const tasks = [];

      if (localMusicVolume !== preferences?.musicVolume) {
        tasks.push(updateMusicVolume(localMusicVolume));
      }
      if (localSfxVolume !== preferences?.sfxVolume) {
        tasks.push(updateSfxVolume(localSfxVolume));
      }
      if (localNotifications !== preferences?.notificationsEnabled) {
        tasks.push(updateNotifications(localNotifications));
      }

      if (tasks.length === 0) {
        setSaveMessage("No changes to save");
        setTimeout(() => setSaveMessage(""), 3000);
        return;
      }

      await Promise.all(tasks);

      setSaveMessage("✓ Settings saved!");
      setTimeout(() => setSaveMessage(""), 3000);
    } catch (error) {
      setSaveMessage("✗ Failed to save settings");
      setTimeout(() => setSaveMessage(""), 3000);
    }
  };

  return (
    <div className="min-h-screen text-white p-6" style={{ background: "hsl(220 28% 4%)" }}>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="font-orbitron font-bold text-4xl tracking-[0.3em] uppercase mb-2">
                Settings
              </h1>
              <p className="font-orbitron text-sm tracking-[0.1em] uppercase" style={{ color: "hsl(210 30% 60%)" }}>
                Customize your experience
              </p>
            </div>
            <button
              onClick={() => setLocation("/")}
              className="px-6 py-3 font-orbitron font-bold text-xs tracking-[0.2em] uppercase rounded-md border-2 transition-all duration-150"
              style={{
                borderColor: "hsl(210 30% 35%)",
                color: "hsl(210 30% 60%)",
                background: "hsl(220 28% 9%)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "hsl(210 30% 50%)";
                e.currentTarget.style.color = "hsl(210 30% 80%)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "hsl(210 30% 35%)";
                e.currentTarget.style.color = "hsl(210 30% 60%)";
              }}
            >
              ← BACK
            </button>
          </div>

          <div className="h-px" style={{ background: "linear-gradient(90deg, hsl(210 30% 25%) 0%, hsl(210 30% 35%) 50%, hsl(210 30% 25%) 100%)" }} />
        </div>

        {/* Loading State — only while fetching server preferences */}
        {isLoggedIn && isLoading && !preferences && (
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
        )}

        {/* Settings Content — always rendered for guests; for logged-in users, wait for preferences */}
        {(!isLoggedIn || preferences) && (
          <div className="space-y-6">
            {/* Audio Settings */}
            <div className="rounded-lg p-6" style={{ background: "hsl(220 28% 9%)", border: "1px solid hsl(210 30% 25%)" }}>
              <h2 className="font-orbitron font-bold text-xl tracking-[0.2em] uppercase mb-6" style={{ color: "hsl(185 100% 50%)" }}>
                🎵 Audio
              </h2>

              <div className="space-y-6">
                {/* Music Volume */}
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <label className="font-orbitron text-sm tracking-[0.1em] uppercase" style={{ color: "hsl(210 30% 60%)" }}>
                      Music Volume
                    </label>
                    <span className="font-orbitron font-bold text-lg" style={{ color: "hsl(185 100% 50%)" }}>
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
                      // Trigger the actual audio update
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
                  <div className="flex justify-between items-center mb-3">
                    <label className="font-orbitron text-sm tracking-[0.1em] uppercase" style={{ color: "hsl(210 30% 60%)" }}>
                      Sound Effects Volume
                    </label>
                    <span className="font-orbitron font-bold text-lg" style={{ color: "hsl(185 100% 50%)" }}>
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
                      previewSfx(val);
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
            <div className="rounded-lg p-6" style={{ background: "hsl(220 28% 9%)", border: "1px solid hsl(210 30% 25%)" }}>
              <h2 className="font-orbitron font-bold text-xl tracking-[0.2em] uppercase mb-6" style={{ color: "hsl(185 100% 50%)" }}>
                🔔 Notifications
              </h2>

              <div>
                <label className="flex items-center gap-4 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={localNotifications}
                    onChange={(e) => setLocalNotifications(e.target.checked)}
                    className="w-5 h-5 rounded"
                    style={{ accentColor: "hsl(185 100% 50%)" }}
                  />
                  <span className="font-orbitron text-sm tracking-[0.1em] uppercase" style={{ color: "hsl(210 30% 60%)" }}>
                    Enable notifications
                  </span>
                </label>
                <p className="font-orbitron text-xs mt-3" style={{ color: "hsl(210 30% 45%)" }}>
                  Receive alerts for game invites and messages
                </p>
              </div>
            </div>

            {/* Save Message */}
            {saveMessage && (
              <div
                className="rounded-lg p-4 text-center font-orbitron text-sm"
                style={{
                  background: saveMessage.includes("✓") ? "hsl(120 70% 15%)" : "hsl(0 75% 15%)",
                  color: saveMessage.includes("✓") ? "hsl(120 100% 50%)" : "hsl(0 75% 60%)",
                  border: `1px solid ${saveMessage.includes("✓") ? "hsl(120 100% 40%)" : "hsl(0 75% 40%)"}`,
                }}
              >
                {saveMessage}
              </div>
            )}

            {/* Save Button */}
            <button
              onClick={handleSaveSettings}
              disabled={isLoggedIn && isLoading}
              className="w-full py-3 font-orbitron font-bold text-sm tracking-[0.1em] uppercase rounded-md border-2 transition-all disabled:opacity-50"
              style={{
                borderColor: "hsl(185 100% 50%)",
                color: "hsl(185 100% 50%)",
                background: "hsl(220 28% 12%)",
              }}
              onMouseEnter={(e) => {
                if (!e.currentTarget.disabled) {
                  e.currentTarget.style.borderColor = "hsl(185 100% 70%)";
                  e.currentTarget.style.color = "hsl(185 100% 70%)";
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "hsl(185 100% 50%)";
                e.currentTarget.style.color = "hsl(185 100% 50%)";
              }}
            >
              {isLoggedIn && isLoading ? "SAVING..." : "SAVE SETTINGS"}
            </button>

            {/* Logout Button — only for logged-in users */}
            {isLoggedIn && (
            <button
              onClick={() => {
                logout();
                setLocation("/");
              }}
              className="w-full py-3 font-orbitron font-bold text-sm tracking-[0.1em] uppercase rounded-md border-2 transition-all"
              style={{
                borderColor: "hsl(0 75% 55%)",
                color: "hsl(0 75% 65%)",
                background: "hsl(220 28% 9%)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "hsl(0 75% 70%)";
                e.currentTarget.style.color = "hsl(0 75% 80%)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "hsl(0 75% 55%)";
                e.currentTarget.style.color = "hsl(0 75% 65%)";
              }}
            >
              LOGOUT
            </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
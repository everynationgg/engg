// Centralized magic strings and numbers for the app

// Storage keys
export const STORAGE_KEYS = {
  guestPreferences: "lp_guest_preferences",
  lowGraphics: "lp_lowGraphics",
  reducedMotion: "lp_reducedMotion",
  musicVolume: "lp_music_volume",
  sfxVolume: "lp_sfx_volume",
  notifications: "lp_notifications",
  colorblindMode: "lp_colorblind_mode",
  booted: "lp_booted",
  // ...add more as needed
};

// Default values
export const DEFAULTS = {
  musicVolume: 70,
  sfxVolume: 70,
  theme: "dark" as const,
  notificationsEnabled: true,
  colorblindMode: false,
  // ...add more as needed
};

// API endpoints
export const API = {
  userPreferences: "/api/user/preferences",
  // ...add more as needed
};

// UI constants
export const UI = {
  modalBorder: "1px solid hsl(270 80% 55% / 0.4)",
  modalShadow: "0 0 40px hsl(270 80% 55% / 0.2)",
  accentColor: "hsl(185 100% 50%)",
  toastLimit: 3, // Max visible toasts
  toastDuration: 3000, // Default toast duration in ms
  // ...add more as needed
};

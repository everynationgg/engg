const STORAGE_KEY = "lp_musicEnabled";
const PREFS_STORAGE_KEY = "errant_guest_preferences";

function readInitialMusicVolume(): number {
  try {
    if (typeof localStorage === "undefined") return 70;
    const raw = localStorage.getItem(PREFS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Number.isFinite(Number(parsed.musicVolume))) {
        return Math.max(0, Math.min(100, Math.round(Number(parsed.musicVolume))));
      }
    }
    const enabled = localStorage.getItem(STORAGE_KEY);
    if (enabled === "false") return 0;
  } catch {}
  return 70;
}

let audio: HTMLAudioElement | null = null;
let unlockListenersAttached = false;
let musicVolume = readInitialMusicVolume(); // 0-100, updated by setMusicVolume
let wasPlayingBeforeHidden = false;

export function getSoundEnabled(): boolean {
  try {
    if (musicVolume <= 0) return false;
    if (typeof localStorage === "undefined") return true;
    const val = localStorage.getItem(STORAGE_KEY);
    return val === null ? true : val === "true";
  } catch {
    return musicVolume > 0;
  }
}

export function setSoundEnabled(enabled: boolean): void {
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(STORAGE_KEY, String(enabled));
    }
  } catch {}
  if (!enabled) {
    stopLobbyMusic();
  }
}

export function setMusicVolume(volume: number): void {
  try {
    const safeVolume = Number.isFinite(volume) ? Math.max(0, Math.min(100, Math.round(volume))) : 70;
    musicVolume = safeVolume;
    try {
      if (typeof localStorage !== "undefined") {
        localStorage.setItem(STORAGE_KEY, String(safeVolume > 0));
      }
    } catch {}
    if (audio) {
      try {
        audio.volume = Math.max(0, Math.min(1, safeVolume / 100));
      } catch {
        // Guard against mobile WebViews/browsers that restrict programmatic volume mutation
      }
    }
    // 30-year rule: volume === 0 means pause audio hardware stream immediately
    if (musicVolume === 0) {
      stopLobbyMusic();
    } else if (getSoundEnabled() && !documentHidden() && audio && audio.paused) {
      tryPlay();
    }
  } catch {}
}

function documentHidden(): boolean {
  try {
    return typeof document !== "undefined" && document.hidden;
  } catch {
    return false;
  }
}

function getAudio(): HTMLAudioElement | null {
  try {
    if (!audio) {
      if (typeof Audio === "undefined") return null;
      audio = new Audio(import.meta.env.BASE_URL + "lobby-music.mp3");
      audio.loop = true;
      try {
        audio.volume = Math.max(0, Math.min(1, musicVolume / 100));
      } catch {}
    }
    return audio;
  } catch {
    return null;
  }
}

function tryPlay(): void {
  try {
    // Never play if muted or document is in background
    if (musicVolume <= 0 || !getSoundEnabled() || documentHidden()) return;

    const a = getAudio();
    if (!a) return;
    try {
      a.volume = Math.max(0, Math.min(1, musicVolume / 100));
    } catch {}
    if (!a.paused) return;

    const promise = a.play();
    if (promise !== undefined && typeof promise.catch === "function") {
      promise.catch(() => {
        if (unlockListenersAttached) return;
        unlockListenersAttached = true;
        const unlock = () => {
          unlockListenersAttached = false;
          try {
            if (getSoundEnabled() && musicVolume > 0 && !documentHidden()) {
              a.play().catch(() => {});
            }
          } catch {}
          if (typeof document !== "undefined") {
            document.removeEventListener("click", unlock);
            document.removeEventListener("touchstart", unlock);
          }
        };
        if (typeof document !== "undefined") {
          document.addEventListener("click", unlock);
          document.addEventListener("touchstart", unlock);
        }
      });
    }
  } catch {}
}

export function startLobbyMusic(): void {
  try {
    if (!getSoundEnabled() || musicVolume <= 0 || documentHidden()) return;
    tryPlay();
  } catch {}
}

export function stopLobbyMusic(): void {
  try {
    if (!audio) return;
    try {
      audio.pause();
    } catch {}
    try {
      // readyState > 0 ensures audio metadata is loaded before seeking currentTime to 0,
      // avoiding DOMException: Failed to set the 'currentTime' property on 'HTMLMediaElement': The element's readyState is HAVE_NOTHING.
      if (audio.readyState > 0) {
        audio.currentTime = 0;
      }
    } catch {}
    wasPlayingBeforeHidden = false;
  } catch {}
}

// ── Mobile App Lifecycle: Android Home Screen / Backgrounding ───────────────
if (typeof document !== "undefined") {
  const handleVisibilityChange = () => {
    try {
      if (document.hidden) {
        // App went to background (user pressed Android Home button or switched apps)
        if (audio && !audio.paused) {
          try { audio.pause(); } catch {}
          wasPlayingBeforeHidden = true;
        }
      } else {
        // App returned to foreground
        if (wasPlayingBeforeHidden && getSoundEnabled() && musicVolume > 0) {
          wasPlayingBeforeHidden = false;
          tryPlay();
        }
      }
    } catch {}
  };

  document.addEventListener("visibilitychange", handleVisibilityChange);
  window.addEventListener("pagehide", () => {
    try {
      if (audio && !audio.paused) {
        try { audio.pause(); } catch {}
        wasPlayingBeforeHidden = true;
      }
    } catch {}
  });
}

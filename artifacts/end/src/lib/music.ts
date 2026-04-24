const STORAGE_KEY = "lp_musicEnabled";

let audio: HTMLAudioElement | null = null;
let unlockListenersAttached = false;
let musicVolume = 100; // 0-100, updated by setMusicVolume

export function getSoundEnabled(): boolean {
  const val = localStorage.getItem(STORAGE_KEY);
  return val === null ? true : val === "true";
}

export function setSoundEnabled(enabled: boolean): void {
  localStorage.setItem(STORAGE_KEY, String(enabled));
}

export function setMusicVolume(volume: number): void {
  musicVolume = Math.max(0, Math.min(100, volume));
  if (audio) {
    audio.volume = musicVolume / 100;
  }
}

function getAudio(): HTMLAudioElement {
  if (!audio) {
    audio = new Audio(import.meta.env.BASE_URL + "lobby-music.mp3");
    audio.loop = true;
    audio.volume = musicVolume / 100;
  }
  return audio;
}

function tryPlay(): void {
  const a = getAudio();
  if (!a.paused) return;
  a.play().catch(() => {
    if (unlockListenersAttached) return;
    unlockListenersAttached = true;
    const unlock = () => {
      unlockListenersAttached = false;
      if (getSoundEnabled()) {
        a.play().catch(() => {});
      }
      document.removeEventListener("click", unlock);
      document.removeEventListener("touchstart", unlock);
    };
    document.addEventListener("click", unlock);
    document.addEventListener("touchstart", unlock);
  });
}

export function startLobbyMusic(): void {
  if (!getSoundEnabled()) return;
  tryPlay();
}

export function stopLobbyMusic(): void {
  if (!audio) return;
  audio.pause();
  audio.currentTime = 0;
}

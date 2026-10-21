import { useState, useCallback, useEffect, useRef } from "react";

const TTS_STORAGE_KEY = "lp_tts_enabled";

/** Returns true when the Web Speech API is available in this browser. */
function isTTSBrowserSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

/** Fallback: speak text using the browser's Web Speech API. */
function speakViaBrowser(text: string) {
  if (!isTTSBrowserSupported()) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 1.0;
  utterance.pitch = 1.0;
  utterance.volume = 0.9;
  window.speechSynthesis.speak(utterance);
}

/**
 * Text-to-speech hook backed by the OpenAI TTS API (via backend proxy).
 * Falls back to the browser Web Speech API when the API call fails.
 * Preference is persisted in localStorage under `lp_tts_enabled`.
 * Defaults to ON.
 */
export function useTTS() {
  const [ttsEnabled, setTtsEnabled] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem(TTS_STORAGE_KEY);
      // Default to true when no preference has been saved yet.
      return stored === null ? true : stored === "true";
    } catch {
      return true;
    }
  });

  // Keep a ref so the `speak` callback always reads the latest enabled state.
  const ttsEnabledRef = useRef(ttsEnabled);
  useEffect(() => {
    ttsEnabledRef.current = ttsEnabled;
  }, [ttsEnabled]);

  // Track the current Audio element so we can cancel it before playing a new one.
  const audioRef = useRef<HTMLAudioElement | null>(null);
  // Debounce: store a timeout ref so rapid calls only fire the last one.
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const speak = useCallback((text: string) => {
    if (!ttsEnabledRef.current) return;

    // Cancel any pending debounced call.
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Small debounce so rapid message bursts only speak the last one.
    debounceRef.current = setTimeout(async () => {
      debounceRef.current = null;

      // Stop any currently playing audio.
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }

      const apiUrl = import.meta.env.VITE_API_URL ?? "";

      try {
        const response = await fetch(`${apiUrl}/api/tts`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
        });

        if (!response.ok) {
          throw new Error(`TTS API returned ${response.status}`);
        }

        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        audioRef.current = audio;
        audio.onended = () => {
          URL.revokeObjectURL(url);
          if (audioRef.current === audio) {
            audioRef.current = null;
          }
        };
        await audio.play();
      } catch (err) {
        // Graceful fallback to browser speech synthesis.
        console.error("OpenAI TTS failed, falling back to browser speech:", err);
        speakViaBrowser(text);
      }
    }, 120);
  }, []);

  const toggleTTS = useCallback(() => {
    setTtsEnabled((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(TTS_STORAGE_KEY, String(next));
      } catch {
        // ignore
      }
      if (!next) {
        // Stop any in-progress speech immediately.
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current = null;
        }
        if (isTTSBrowserSupported()) {
          window.speechSynthesis.cancel();
        }
      }
      return next;
    });
  }, []);

  // Clean up on unmount.
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (isTTSBrowserSupported()) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  return { ttsEnabled, toggleTTS, speak, isTTSSupported: true };
}

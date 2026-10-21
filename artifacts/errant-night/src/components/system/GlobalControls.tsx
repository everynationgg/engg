import { useEffect } from "react";
import { useLocation } from "wouter";
import { usePreferences } from "@/hooks/usePreferences";
import { startLobbyMusic, stopLobbyMusic, setMusicVolume } from "@/lib/music";
import { setSfxVolume } from "@/lib/sound";

export default function GlobalControls() {
  const { preferences } = usePreferences();
  const [location] = useLocation();

  useEffect(() => {
    // 1. Unified Route Logic
    // If we are on role-reveal, kill the music immediately.
    if (location === "/role-reveal") {
      stopLobbyMusic();
      return; 
    }

    // 2. Unified Volume Logic
    // Apply saved volume preferences and start music if not already playing.
    if (preferences) {
      setMusicVolume(preferences.musicVolume);
      setSfxVolume(preferences.sfxVolume);
      startLobbyMusic();
    }
  }, [location, preferences]);

  return null;
}
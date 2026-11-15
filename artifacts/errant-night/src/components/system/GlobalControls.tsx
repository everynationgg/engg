import { useEffect } from "react";
import { useLocation } from "wouter";
import { usePreferences } from "@/hooks/usePreferences";
import { startLobbyMusic, stopLobbyMusic, setMusicVolume } from "@/lib/music";
import { setSfxVolume } from "@/lib/sound";

export default function GlobalControls() {
  const { preferences } = usePreferences();
  const [location] = useLocation();

  useEffect(() => {
    try {
      // 1. Route Scope: Lobby music only plays on landing/lobby screens.
      // If we are in an active match room or role-reveal, stop lobby music.
      if (location === "/role-reveal" || location.startsWith("/room/")) {
        stopLobbyMusic();
        return;
      }

      // 2. Volume & Playback Logic
      if (preferences) {
        const musicVol = Number.isFinite(preferences.musicVolume) ? preferences.musicVolume : 70;
        const sfxVol = Number.isFinite(preferences.sfxVolume) ? preferences.sfxVolume : 70;
        setMusicVolume(musicVol);
        setSfxVolume(sfxVol);

        // Only start music if volume is above 0%
        if (musicVol > 0) {
          startLobbyMusic();
        } else {
          stopLobbyMusic();
        }
      }
    } catch (e) {
      console.warn("[GlobalControls] Audio effect caught error:", e);
    }
  }, [location, preferences]);

  return null;
}

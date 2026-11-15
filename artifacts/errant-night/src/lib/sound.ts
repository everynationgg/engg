let audioCtx: AudioContext | null = null;

let sfxVolume = 100; // 0-100, updated by setSfxVolume

export function setSfxVolume(volume: number): void {
  try {
    const safeVolume = Number.isFinite(volume) ? Math.max(0, Math.min(100, Math.round(volume))) : 70;
    sfxVolume = safeVolume;
  } catch {}
}

function getAudioContext(): AudioContext | null {
  try {
    if (typeof window === "undefined") return null;
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return null;
    if (!audioCtx || audioCtx.state === "closed") {
      audioCtx = new AudioContextClass();
    }
    if (audioCtx.state === "suspended") {
      audioCtx.resume().catch(() => {});
    }
    return audioCtx;
  } catch {
    return null;
  }
}

const lastPlayed: Record<string, number> = {};

function debounced(key: string, minMs: number, fn: () => void) {
  try {
    const now = Date.now();
    if ((lastPlayed[key] ?? 0) + minMs > now) return;
    lastPlayed[key] = now;
    fn();
  } catch {}
}

function safeGain(multiplier: number, v: number): number {
  if (!Number.isFinite(v) || v <= 0) return 0.001;
  const val = multiplier * v;
  return Number.isFinite(val) && val > 0.001 ? val : 0.001;
}

export function playSciFiClick(volume: number = sfxVolume / 100) {
  try {
    if (!Number.isFinite(volume) || volume <= 0) return;
    const safeVol = Math.max(0.001, Math.min(1, volume));
    debounced("click", 80, () => {
      try {
        const ctx = getAudioContext();
        if (!ctx) return;
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscillator.type = "sine";
        oscillator.frequency.setValueAtTime(880, ctx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.08);

        // Web Audio requires non-zero finite start value before exponential ramp
        const startGain = safeGain(0.15, safeVol);
        gainNode.gain.setValueAtTime(startGain, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);

        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.18);
      } catch {}
    });
  } catch {}
}

export function playActionConfirm() {
  try {
    if (!Number.isFinite(sfxVolume) || sfxVolume <= 0) return;
    const v = Math.max(0.001, Math.min(1, sfxVolume / 100));
    debounced("actionConfirm", 300, () => {
      try {
        const ctx = getAudioContext();
        if (!ctx) return;
        const t = ctx.currentTime;

        const osc1 = ctx.createOscillator();
        const g1 = ctx.createGain();
        osc1.connect(g1);
        g1.connect(ctx.destination);
        osc1.type = "sine";
        osc1.frequency.setValueAtTime(523, t);
        g1.gain.setValueAtTime(safeGain(0.18, v), t);
        g1.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
        osc1.start(t);
        osc1.stop(t + 0.12);

        const osc2 = ctx.createOscillator();
        const g2 = ctx.createGain();
        osc2.connect(g2);
        g2.connect(ctx.destination);
        osc2.type = "sine";
        osc2.frequency.setValueAtTime(784, t + 0.1);
        g2.gain.setValueAtTime(0.001, t);
        g2.gain.setValueAtTime(safeGain(0.2, v), t + 0.1);
        g2.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
        osc2.start(t);
        osc2.stop(t + 0.3);
      } catch {}
    });
  } catch {}
}

export function playPhaseTransition() {
  try {
    if (!Number.isFinite(sfxVolume) || sfxVolume <= 0) return;
    const v = Math.max(0.001, Math.min(1, sfxVolume / 100));
    debounced("phaseTransition", 800, () => {
      try {
        const ctx = getAudioContext();
        if (!ctx) return;
        const t = ctx.currentTime;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = "sine";
        osc.frequency.setValueAtTime(200, t);
        osc.frequency.exponentialRampToValueAtTime(600, t + 0.25);
        gain.gain.setValueAtTime(0.001, t);
        gain.gain.linearRampToValueAtTime(safeGain(0.22, v), t + 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.38);
        osc.start(t);
        osc.stop(t + 0.38);
      } catch {}
    });
  } catch {}
}

export function playVoteCast() {
  try {
    if (!Number.isFinite(sfxVolume) || sfxVolume <= 0) return;
    const v = Math.max(0.001, Math.min(1, sfxVolume / 100));
    debounced("voteCast", 300, () => {
      try {
        const ctx = getAudioContext();
        if (!ctx) return;
        const t = ctx.currentTime;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = "triangle";
        osc.frequency.setValueAtTime(660, t);
        osc.frequency.exponentialRampToValueAtTime(440, t + 0.15);
        gain.gain.setValueAtTime(safeGain(0.2, v), t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
        osc.start(t);
        osc.stop(t + 0.22);
      } catch {}
    });
  } catch {}
}

export function playResult() {
  try {
    if (!Number.isFinite(sfxVolume) || sfxVolume <= 0) return;
    const v = Math.max(0.001, Math.min(1, sfxVolume / 100));
    debounced("result", 1000, () => {
      try {
        const ctx = getAudioContext();
        if (!ctx) return;
        const t = ctx.currentTime;

        const osc1 = ctx.createOscillator();
        const g1 = ctx.createGain();
        osc1.connect(g1);
        g1.connect(ctx.destination);
        osc1.type = "sine";
        osc1.frequency.setValueAtTime(196, t);
        g1.gain.setValueAtTime(0.001, t);
        g1.gain.linearRampToValueAtTime(safeGain(0.25, v), t + 0.06);
        g1.gain.exponentialRampToValueAtTime(0.001, t + 0.75);
        osc1.start(t);
        osc1.stop(t + 0.75);

        const osc2 = ctx.createOscillator();
        const g2 = ctx.createGain();
        osc2.connect(g2);
        g2.connect(ctx.destination);
        osc2.type = "sine";
        osc2.frequency.setValueAtTime(294, t + 0.05);
        g2.gain.setValueAtTime(0.001, t);
        g2.gain.setValueAtTime(safeGain(0.2, v), t + 0.05);
        g2.gain.exponentialRampToValueAtTime(0.001, t + 0.75);
        osc2.start(t);
        osc2.stop(t + 0.75);
      } catch {}
    });
  } catch {}
}

export function playEmergencyVoteCalled() {
  try {
    if (!Number.isFinite(sfxVolume) || sfxVolume <= 0) return;
    const v = Math.max(0.001, Math.min(1, sfxVolume / 100));
    debounced("emergencyVoteCalled", 600, () => {
      try {
        const ctx = getAudioContext();
        if (!ctx) return;
        const t = ctx.currentTime;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = "square";
        osc.frequency.setValueAtTime(980, t);
        osc.frequency.exponentialRampToValueAtTime(420, t + 0.22);
        gain.gain.setValueAtTime(0.001, t);
        gain.gain.linearRampToValueAtTime(safeGain(0.2, v), t + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
        osc.start(t);
        osc.stop(t + 0.3);
      } catch {}
    });
  } catch {}
}

export function playLobbyJoin() {
  try {
    if (!Number.isFinite(sfxVolume) || sfxVolume <= 0) return;
    const v = Math.max(0.001, Math.min(1, sfxVolume / 100));
    debounced("lobbyJoin", 250, () => {
      try {
        const ctx = getAudioContext();
        if (!ctx) return;
        const t = ctx.currentTime;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = "triangle";
        osc.frequency.setValueAtTime(392, t);
        osc.frequency.exponentialRampToValueAtTime(784, t + 0.16);
        gain.gain.setValueAtTime(safeGain(0.14, v), t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
        osc.start(t);
        osc.stop(t + 0.2);
      } catch {}
    });
  } catch {}
}

export function playGameOutcome(team: "crew" | "alien" | "tie") {
  try {
    if (team === "tie") {
      playResult();
      return;
    }
    if (!Number.isFinite(sfxVolume) || sfxVolume <= 0) return;
    const v = Math.max(0.001, Math.min(1, sfxVolume / 100));
    debounced(`outcome_${team}`, 1200, () => {
      try {
        const ctx = getAudioContext();
        if (!ctx) return;
        const t = ctx.currentTime;

        const notes = team === "crew"
          ? [392, 523, 659]
          : [330, 247, 165];

        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const start = t + idx * 0.11;
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.type = team === "crew" ? "sine" : "sawtooth";
          osc.frequency.setValueAtTime(freq, start);
          gain.gain.setValueAtTime(0.001, start);
          gain.gain.linearRampToValueAtTime(safeGain(0.18, v), start + 0.03);
          gain.gain.exponentialRampToValueAtTime(0.001, start + 0.26);
          osc.start(start);
          osc.stop(start + 0.26);
        });
      } catch {}
    });
  } catch {}
}

export function playMechanicalChunk() {
  try {
    if (!Number.isFinite(sfxVolume) || sfxVolume <= 0) return;
    const v = Math.max(0.001, Math.min(1, sfxVolume / 100));
    debounced("mechanicalChunk", 150, () => {
      try {
        const ctx = getAudioContext();
        if (!ctx) return;
        const t = ctx.currentTime;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.type = "square";
        osc.frequency.setValueAtTime(150, t);
        osc.frequency.exponentialRampToValueAtTime(40, t + 0.1);
        
        gain.gain.setValueAtTime(safeGain(0.4, v), t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
        
        osc.start(t);
        osc.stop(t + 0.15);
        
        const bufferSize = ctx.sampleRate * 0.1; 
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
        }
        
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        const noiseFilter = ctx.createBiquadFilter();
        noiseFilter.type = "lowpass";
        noiseFilter.frequency.value = 1000;
        
        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(safeGain(0.3, v), t);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
        
        noise.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(ctx.destination);
        
        noise.start(t);
      } catch {}
    });
  } catch {}
}

export function playBassDrop() {
  try {
    if (!Number.isFinite(sfxVolume) || sfxVolume <= 0) return;
    const v = Math.max(0.001, Math.min(1, sfxVolume / 100));
    debounced("bassDrop", 2000, () => {
      try {
        const ctx = getAudioContext();
        if (!ctx) return;
        const t = ctx.currentTime;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.type = "sine";
        
        osc.frequency.setValueAtTime(120, t);
        osc.frequency.exponentialRampToValueAtTime(30, t + 1.5);
        
        gain.gain.setValueAtTime(0.001, t);
        gain.gain.linearRampToValueAtTime(safeGain(0.6, v), t + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 2.0);
        
        osc.start(t);
        osc.stop(t + 2.0);
      } catch {}
    });
  } catch {}
}

export function playHeartbeatPulse(intensity: number = 1) {
  try {
    if (!Number.isFinite(sfxVolume) || sfxVolume <= 0) return;
    const safeIntensity = Number.isFinite(intensity) ? Math.min(1, Math.max(0.3, intensity)) : 1;
    const v = Math.max(0.001, Math.min(1, (sfxVolume / 100) * safeIntensity));
    debounced("heartbeat", 350, () => {
      try {
        const ctx = getAudioContext();
        if (!ctx) return;
        const t = ctx.currentTime;

        // Double thump (thump... thump)
        const osc1 = ctx.createOscillator();
        const g1 = ctx.createGain();
        osc1.connect(g1);
        g1.connect(ctx.destination);
        osc1.type = "sine";
        osc1.frequency.setValueAtTime(65, t);
        osc1.frequency.exponentialRampToValueAtTime(35, t + 0.12);
        g1.gain.setValueAtTime(safeGain(0.25, v), t);
        g1.gain.exponentialRampToValueAtTime(0.001, t + 0.14);
        osc1.start(t);
        osc1.stop(t + 0.14);

        const osc2 = ctx.createOscillator();
        const g2 = ctx.createGain();
        osc2.connect(g2);
        g2.connect(ctx.destination);
        osc2.type = "sine";
        osc2.frequency.setValueAtTime(80, t + 0.15);
        osc2.frequency.exponentialRampToValueAtTime(40, t + 0.28);
        g2.gain.setValueAtTime(0.001, t);
        g2.gain.setValueAtTime(safeGain(0.35, v), t + 0.15);
        g2.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
        osc2.start(t + 0.15);
        osc2.stop(t + 0.3);

        // Phone vibration trigger
        if (typeof navigator !== "undefined" && "vibrate" in navigator) {
          try {
            navigator.vibrate([40, 60, 50]);
          } catch {}
        }
      } catch {}
    });
  } catch {}
}

// ── Mobile App Lifecycle: Android Home Screen / Backgrounding ───────────────
if (typeof document !== "undefined") {
  document.addEventListener("visibilitychange", () => {
    try {
      if (!audioCtx) return;
      if (document.hidden) {
        if (audioCtx.state === "running") {
          audioCtx.suspend().catch(() => {});
        }
      } else {
        if (audioCtx.state === "suspended") {
          audioCtx.resume().catch(() => {});
        }
      }
    } catch {}
  });

  window.addEventListener("pagehide", () => {
    try {
      if (audioCtx && audioCtx.state === "running") {
        audioCtx.suspend().catch(() => {});
      }
    } catch {}
  });
}

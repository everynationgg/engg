let audioCtx: AudioContext | null = null;

let sfxVolume = 100; // 0-100, updated by setSfxVolume

export function setSfxVolume(volume: number): void {
  sfxVolume = Math.max(0, Math.min(100, volume));
}

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  }
  return audioCtx;
}

const lastPlayed: Record<string, number> = {};

function debounced(key: string, minMs: number, fn: () => void) {
  const now = Date.now();
  if ((lastPlayed[key] ?? 0) + minMs > now) return;
  lastPlayed[key] = now;
  fn();
}

export function playSciFiClick(volume: number = sfxVolume / 100) {
  if (volume <= 0) return;
  debounced("click", 80, () => {
    try {
      const ctx = getAudioContext();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(880, ctx.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.08);

      // Multiply base gain (0.15) by the passed volume
      gainNode.gain.setValueAtTime(0.15 * volume, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.18);
    } catch {}
  });
}

export function playActionConfirm() {
  if (sfxVolume === 0) return;
  const v = sfxVolume / 100;
  debounced("actionConfirm", 300, () => {
    try {
      const ctx = getAudioContext();
      const t = ctx.currentTime;

      const osc1 = ctx.createOscillator();
      const g1 = ctx.createGain();
      osc1.connect(g1);
      g1.connect(ctx.destination);
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(523, t);
      g1.gain.setValueAtTime(0.18 * v, t);
      g1.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
      osc1.start(t);
      osc1.stop(t + 0.12);

      const osc2 = ctx.createOscillator();
      const g2 = ctx.createGain();
      osc2.connect(g2);
      g2.connect(ctx.destination);
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(784, t + 0.1);
      g2.gain.setValueAtTime(0, t);
      g2.gain.setValueAtTime(0.2 * v, t + 0.1);
      g2.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
      osc2.start(t);
      osc2.stop(t + 0.3);
    } catch {
    }
  });
}

export function playPhaseTransition() {
  if (sfxVolume === 0) return;
  const v = sfxVolume / 100;
  debounced("phaseTransition", 800, () => {
    try {
      const ctx = getAudioContext();
      const t = ctx.currentTime;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(200, t);
      osc.frequency.exponentialRampToValueAtTime(600, t + 0.25);
      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(0.22 * v, t + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.38);
      osc.start(t);
      osc.stop(t + 0.38);
    } catch {
    }
  });
}

export function playVoteCast() {
  if (sfxVolume === 0) return;
  const v = sfxVolume / 100;
  debounced("voteCast", 300, () => {
    try {
      const ctx = getAudioContext();
      const t = ctx.currentTime;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "triangle";
      osc.frequency.setValueAtTime(660, t);
      osc.frequency.exponentialRampToValueAtTime(440, t + 0.15);
      gain.gain.setValueAtTime(0.2 * v, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
      osc.start(t);
      osc.stop(t + 0.22);
    } catch {
    }
  });
}

export function playResult() {
  if (sfxVolume === 0) return;
  const v = sfxVolume / 100;
  debounced("result", 1000, () => {
    try {
      const ctx = getAudioContext();
      const t = ctx.currentTime;

      const osc1 = ctx.createOscillator();
      const g1 = ctx.createGain();
      osc1.connect(g1);
      g1.connect(ctx.destination);
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(196, t);
      g1.gain.setValueAtTime(0.001, t);
      g1.gain.linearRampToValueAtTime(0.25 * v, t + 0.06);
      g1.gain.exponentialRampToValueAtTime(0.001, t + 0.75);
      osc1.start(t);
      osc1.stop(t + 0.75);

      const osc2 = ctx.createOscillator();
      const g2 = ctx.createGain();
      osc2.connect(g2);
      g2.connect(ctx.destination);
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(294, t + 0.05);
      g2.gain.setValueAtTime(0, t);
      g2.gain.setValueAtTime(0.2 * v, t + 0.05);
      g2.gain.exponentialRampToValueAtTime(0.001, t + 0.75);
      osc2.start(t);
      osc2.stop(t + 0.75);
    } catch {
    }
  });
}

export function playEmergencyVoteCalled() {
  if (sfxVolume === 0) return;
  const v = sfxVolume / 100;
  debounced("emergencyVoteCalled", 600, () => {
    try {
      const ctx = getAudioContext();
      const t = ctx.currentTime;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "square";
      osc.frequency.setValueAtTime(980, t);
      osc.frequency.exponentialRampToValueAtTime(420, t + 0.22);
      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(0.2 * v, t + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
      osc.start(t);
      osc.stop(t + 0.3);
    } catch {
    }
  });
}

export function playLobbyJoin() {
  if (sfxVolume === 0) return;
  const v = sfxVolume / 100;
  debounced("lobbyJoin", 250, () => {
    try {
      const ctx = getAudioContext();
      const t = ctx.currentTime;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "triangle";
      osc.frequency.setValueAtTime(392, t);
      osc.frequency.exponentialRampToValueAtTime(784, t + 0.16);
      gain.gain.setValueAtTime(0.14 * v, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
      osc.start(t);
      osc.stop(t + 0.2);
    } catch {
    }
  });
}

export function playGameOutcome(team: "crew" | "alien" | "tie") {
  if (team === "tie") {
    playResult();
    return;
  }
  if (sfxVolume === 0) return;
  const v = sfxVolume / 100;
  debounced(`outcome_${team}`, 1200, () => {
    try {
      const ctx = getAudioContext();
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
        gain.gain.linearRampToValueAtTime(0.18 * v, start + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.26);
        osc.start(start);
        osc.stop(start + 0.26);
      });
    } catch {
    }
  });
}

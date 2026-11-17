// Procedural sound for Lumenhold: every effect is synthesised with the
// Web Audio API, so the game ships no audio files and needs no network.
// All calls are safe before the first user gesture and when audio is
// unavailable: they simply do nothing.

const NOTE = {
  C4: 261.63, D4: 293.66, E4: 329.63, G4: 392.0, A4: 440.0, C5: 523.25,
  D5: 587.33, E5: 659.25, G5: 783.99, A5: 880.0, C6: 1046.5, E6: 1318.5,
};

export class SoundEngine {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.muted = false;
    this.ambientTimer = null;
    this.lastShotAt = 0;
    this.unlocked = false;
  }

  // Browsers require a user gesture before audio starts; call from clicks/keys.
  unlock() {
    if (this.unlocked) {
      if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
      return;
    }
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.5;
      this.master.connect(this.ctx.destination);
      this.unlocked = true;
    } catch {
      this.ctx = null;
    }
  }

  setMuted(muted) {
    this.muted = muted;
    if (this.master && this.ctx) {
      this.master.gain.setTargetAtTime(muted ? 0 : 0.5, this.ctx.currentTime, 0.02);
    }
  }

  tone(freq, { type = 'sine', at = 0, dur = 0.15, vol = 0.2, slideTo = null } = {}) {
    if (!this.ctx || this.muted) return;
    try {
      const t0 = this.ctx.currentTime + at;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, t0);
      if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), t0 + dur);
      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      osc.connect(gain).connect(this.master);
      osc.start(t0);
      osc.stop(t0 + dur + 0.05);
    } catch {
      // Audio is decoration; never let it break the game.
    }
  }

  noise({ at = 0, dur = 0.2, vol = 0.15, low = 400 } = {}) {
    if (!this.ctx || this.muted) return;
    try {
      const t0 = this.ctx.currentTime + at;
      const len = Math.max(1, Math.floor(this.ctx.sampleRate * dur));
      const buffer = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < len; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
      const src = this.ctx.createBufferSource();
      src.buffer = buffer;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = low;
      const gain = this.ctx.createGain();
      gain.gain.value = vol;
      src.connect(filter).connect(gain).connect(this.master);
      src.start(t0);
    } catch {
      // Ignore audio failures.
    }
  }

  play(name) {
    if (!this.ctx || this.muted) return;
    switch (name) {
      case 'click':
        this.tone(NOTE.G4, { type: 'triangle', dur: 0.07, vol: 0.12 });
        break;
      case 'place':
        this.tone(NOTE.C5, { type: 'triangle', dur: 0.12, vol: 0.2 });
        this.tone(NOTE.G5, { type: 'sine', at: 0.06, dur: 0.18, vol: 0.16 });
        break;
      case 'deny':
        this.tone(160, { type: 'square', dur: 0.12, vol: 0.08, slideTo: 110 });
        break;
      case 'shoot':
        // Shots are frequent; throttle so they stay a texture, not a buzz.
        if (performance.now() - this.lastShotAt < 70) return;
        this.lastShotAt = performance.now();
        this.tone(880, { type: 'sine', dur: 0.06, vol: 0.05, slideTo: 520 });
        break;
      case 'mortar':
        this.tone(220, { type: 'sine', dur: 0.18, vol: 0.14, slideTo: 90 });
        break;
      case 'burst':
        this.noise({ dur: 0.22, vol: 0.18, low: 900 });
        this.tone(140, { type: 'sine', dur: 0.2, vol: 0.14, slideTo: 55 });
        break;
      case 'pop':
        this.tone(520, { type: 'sine', dur: 0.1, vol: 0.13, slideTo: 940 });
        break;
      case 'leak':
        this.tone(196, { type: 'sawtooth', dur: 0.3, vol: 0.12, slideTo: 70 });
        this.noise({ dur: 0.25, vol: 0.1, low: 300 });
        break;
      case 'upgrade':
        this.tone(NOTE.E5, { type: 'triangle', dur: 0.1, vol: 0.16 });
        this.tone(NOTE.A5, { type: 'triangle', at: 0.07, dur: 0.14, vol: 0.16 });
        this.tone(NOTE.C6, { type: 'triangle', at: 0.14, dur: 0.2, vol: 0.16 });
        break;
      case 'wave':
        this.tone(NOTE.C4, { type: 'triangle', dur: 0.25, vol: 0.18 });
        this.tone(NOTE.G4, { type: 'triangle', at: 0.12, dur: 0.3, vol: 0.18 });
        break;
      case 'clear':
        this.tone(NOTE.E5, { type: 'sine', dur: 0.14, vol: 0.16 });
        this.tone(NOTE.G5, { type: 'sine', at: 0.1, dur: 0.22, vol: 0.16 });
        break;
      case 'victory':
        [NOTE.C5, NOTE.E5, NOTE.G5, NOTE.C6, NOTE.E6].forEach((f, i) => {
          this.tone(f, { type: 'triangle', at: i * 0.13, dur: 0.35, vol: 0.18 });
        });
        break;
      case 'defeat':
        [NOTE.A4, NOTE.G4, NOTE.E4, NOTE.C4].forEach((f, i) => {
          this.tone(f, { type: 'triangle', at: i * 0.22, dur: 0.4, vol: 0.16 });
        });
        break;
      default:
        break;
    }
  }

  // A slow, soft night pad: two detuned sines per chord, scheduled ahead.
  startAmbient() {
    if (this.ambientTimer || !this.ctx) return;
    const chords = [
      [NOTE.C4, NOTE.G4, NOTE.E5],
      [NOTE.A4, NOTE.E5, NOTE.C5],
      [NOTE.G4, NOTE.D5, NOTE.G5],
      [NOTE.E4, NOTE.G4, NOTE.C5],
    ];
    let step = 0;
    const playChord = () => {
      if (this.muted) return;
      chords[step % chords.length].forEach((f) => {
        this.tone(f, { type: 'sine', dur: 3.4, vol: 0.035 });
        this.tone(f * 1.005, { type: 'sine', dur: 3.4, vol: 0.02 });
      });
      step += 1;
    };
    playChord();
    this.ambientTimer = setInterval(playChord, 3600);
  }

  stopAmbient() {
    if (this.ambientTimer) {
      clearInterval(this.ambientTimer);
      this.ambientTimer = null;
    }
  }
}

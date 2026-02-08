/**
 * AudioManager — procedural sound engine using Web Audio API.
 * Generates all sounds synthetically: no audio files required.
 * Singleton so audio context persists across Phaser scenes.
 */
export class AudioManager {
  private static instance: AudioManager;
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private muted = false;
  private _musicPlaying = false;
  private musicTimer: number | null = null;
  private musicNodes: AudioNode[] = [];

  private constructor() {}

  static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  /** Must be called from a user gesture (tap/click) to unlock audio on iOS. */
  unlock(): void {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return;
    }
    this.ctx = new AudioContext();
    this.masterGain = this.ctx.createGain();
    this.masterGain.connect(this.ctx.destination);
    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.value = 0.3;
    this.musicGain.connect(this.masterGain);
    this.sfxGain = this.ctx.createGain();
    this.sfxGain.gain.value = 0.5;
    this.sfxGain.connect(this.masterGain);
  }

  private ensureCtx(): AudioContext | null {
    if (!this.ctx) return null;
    if (this.ctx.state === 'suspended') this.ctx.resume();
    return this.ctx;
  }

  // ─── Mute toggle ───

  toggleMute(): boolean {
    this.muted = !this.muted;
    if (this.masterGain) {
      this.masterGain.gain.value = this.muted ? 0 : 1;
    }
    return this.muted;
  }

  isMuted(): boolean {
    return this.muted;
  }

  // ─── Music ───

  isMusicPlaying(): boolean {
    return this._musicPlaying;
  }

  playMusic(): void {
    const ctx = this.ensureCtx();
    if (!ctx || !this.musicGain || this._musicPlaying) return;
    this._musicPlaying = true;
    this.loopMusic();
  }

  stopMusic(): void {
    this._musicPlaying = false;
    if (this.musicTimer !== null) {
      clearTimeout(this.musicTimer);
      this.musicTimer = null;
    }
    for (const node of this.musicNodes) {
      try { (node as OscillatorNode).stop?.(); } catch { /* already stopped */ }
    }
    this.musicNodes = [];
  }

  private loopMusic(): void {
    if (!this._musicPlaying) return;
    const ctx = this.ensureCtx();
    if (!ctx || !this.musicGain) return;

    // Upbeat chiptune-style loop — 8 bars, ~4 seconds
    const bpm = 140;
    const beat = 60 / bpm;

    // Melody (lead) — catchy, energetic
    const melody = [
      'E5', 'E5', 'R', 'E5', 'R', 'C5', 'E5', 'G5',
      'G4', 'R', 'R', 'R', 'C5', 'R', 'G4', 'R',
      'E4', 'R', 'R', 'A4', 'R', 'B4', 'R', 'Bb4',
      'A4', 'G4', 'E5', 'G5', 'A5', 'F5', 'G5', 'R',
    ];

    // Bass line — driving
    const bass = [
      'C3', 'C3', 'G3', 'G3', 'E3', 'E3', 'A2', 'A2',
      'F2', 'F2', 'C3', 'C3', 'G2', 'G2', 'G2', 'B2',
      'C3', 'C3', 'G3', 'G3', 'E3', 'E3', 'A2', 'A2',
      'F2', 'F2', 'C3', 'C3', 'G2', 'G2', 'G2', 'G2',
    ];

    const now = ctx.currentTime + 0.05;
    const noteLen = beat * 0.5;

    for (let i = 0; i < melody.length; i++) {
      const t = now + i * noteLen;

      // Lead melody
      if (melody[i] !== 'R') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        osc.frequency.value = this.noteToFreq(melody[i]);
        gain.gain.setValueAtTime(0.12, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + noteLen * 0.9);
        osc.connect(gain);
        gain.connect(this.musicGain);
        osc.start(t);
        osc.stop(t + noteLen);
        this.musicNodes.push(osc);
      }

      // Bass
      if (bass[i] !== 'R') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.value = this.noteToFreq(bass[i]);
        gain.gain.setValueAtTime(0.18, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + noteLen * 0.9);
        osc.connect(gain);
        gain.connect(this.musicGain);
        osc.start(t);
        osc.stop(t + noteLen);
        this.musicNodes.push(osc);
      }

      // Percussion (hi-hat on every beat)
      if (i % 2 === 0) {
        this.scheduleNoise(ctx, this.musicGain, t, 0.04, 0.06);
      }
    }

    const loopDuration = melody.length * noteLen * 1000;
    this.musicTimer = window.setTimeout(() => {
      this.musicNodes = [];
      this.loopMusic();
    }, loopDuration - 50);
  }

  private scheduleNoise(ctx: AudioContext, dest: AudioNode, time: number, duration: number, vol: number): void {
    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1);
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    // High-pass filter to make it sound like a hi-hat
    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 8000;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(vol, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(dest);
    noise.start(time);
    noise.stop(time + duration);
    this.musicNodes.push(noise);
  }

  // ─── Sound Effects ───

  playJump(): void {
    const ctx = this.ensureCtx();
    if (!ctx || !this.sfxGain) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    const now = ctx.currentTime;
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.exponentialRampToValueAtTime(600, now + 0.15);
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.2);
  }

  playSlide(): void {
    const ctx = this.ensureCtx();
    if (!ctx || !this.sfxGain) return;
    // Whoosh — filtered noise sweep down
    const duration = 0.25;
    const bufSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    const now = ctx.currentTime;
    filter.frequency.setValueAtTime(2000, now);
    filter.frequency.exponentialRampToValueAtTime(300, now + duration);
    filter.Q.value = 2;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);
    noise.start(now);
    noise.stop(now + duration);
  }

  playCollect(): void {
    const ctx = this.ensureCtx();
    if (!ctx || !this.sfxGain) return;
    const now = ctx.currentTime;
    // Two-tone ding
    [880, 1320].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      const t = now + i * 0.07;
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.25, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(t);
      osc.stop(t + 0.15);
    });
  }

  playHit(): void {
    const ctx = this.ensureCtx();
    if (!ctx || !this.sfxGain) return;
    const now = ctx.currentTime;
    // Crunchy impact: low noise burst + descending tone
    const duration = 0.3;
    const bufSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 600;
    const nGain = ctx.createGain();
    nGain.gain.setValueAtTime(0.4, now);
    nGain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    noise.connect(filter);
    filter.connect(nGain);
    nGain.connect(this.sfxGain);
    noise.start(now);
    noise.stop(now + duration);

    // Descending tone
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(200, now);
    osc.frequency.exponentialRampToValueAtTime(60, now + 0.25);
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.25);
  }

  playGameOver(): void {
    const ctx = this.ensureCtx();
    if (!ctx || !this.sfxGain) return;
    const now = ctx.currentTime;
    // Descending "wah wah" tones
    const notes = [440, 370, 311, 220];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      const t = now + i * 0.3;
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.15, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(t);
      osc.stop(t + 0.35);
    });
  }

  playLevelUp(): void {
    const ctx = this.ensureCtx();
    if (!ctx || !this.sfxGain) return;
    const now = ctx.currentTime;
    // Ascending fanfare
    const notes = [523, 659, 784, 1047];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      const t = now + i * 0.1;
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.15, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(t);
      osc.stop(t + 0.2);
    });
  }

  playPlatformLand(): void {
    const ctx = this.ensureCtx();
    if (!ctx || !this.sfxGain) return;
    const now = ctx.currentTime;
    // Bouncy spring sound
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(200, now);
    osc.frequency.exponentialRampToValueAtTime(800, now + 0.08);
    osc.frequency.exponentialRampToValueAtTime(400, now + 0.2);
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.25);
  }

  playBarSlide(): void {
    const ctx = this.ensureCtx();
    if (!ctx || !this.sfxGain) return;
    const now = ctx.currentTime;
    // Quick rising swoosh
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(500, now + 0.15);
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.2);
  }

  playClick(): void {
    const ctx = this.ensureCtx();
    if (!ctx || !this.sfxGain) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 660;
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.08);
  }

  // ─── Helpers ───

  private noteToFreq(note: string): number {
    const notes: Record<string, number> = {
      'C2': 65.41, 'D2': 73.42, 'E2': 82.41, 'F2': 87.31, 'G2': 98.00, 'A2': 110.0, 'B2': 123.47,
      'C3': 130.81, 'D3': 146.83, 'E3': 164.81, 'F3': 174.61, 'G3': 196.00, 'A3': 220.0, 'Bb3': 233.08, 'B3': 246.94,
      'C4': 261.63, 'D4': 293.66, 'E4': 329.63, 'F4': 349.23, 'G4': 392.00, 'A4': 440.0, 'Bb4': 466.16, 'B4': 493.88,
      'C5': 523.25, 'D5': 587.33, 'E5': 659.25, 'F5': 698.46, 'G5': 783.99, 'A5': 880.0, 'Bb5': 932.33, 'B5': 987.77,
    };
    return notes[note] || 440;
  }
}

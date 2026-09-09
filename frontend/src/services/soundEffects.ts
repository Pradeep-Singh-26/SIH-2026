/**
 * Tactical Web Audio Synthesizer for Hydro-Breach Simulator
 * Pure zero-dependency audio generation using standard Web Audio API
 */

class SoundEffectsService {
  private ctx: AudioContext | null = null;
  private muted: boolean = false;
  private waterNoiseNode: AudioNode | null = null;
  private waterGainNode: GainNode | null = null;

  constructor() {
    // Check if muted was previously saved in localStorage
    const saved = localStorage.getItem('hydro_sim_muted');
    if (saved !== null) {
      this.muted = saved === 'true';
    }
  }

  private initCtx(): AudioContext | null {
    if (this.muted) return null;
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public setMuted(muted: boolean): void {
    this.muted = muted;
    localStorage.setItem('hydro_sim_muted', String(muted));
    if (muted) {
      this.stopWaterAmbience();
    }
  }

  public toggleMute(): boolean {
    this.setMuted(!this.muted);
    return this.muted;
  }

  /**
   * Crisp futuristic UI click blip
   */
  public playClickSound(): void {
    if (this.muted) return;
    try {
      const ctx = this.initCtx();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.04);

      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.05);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.05);
    } catch {
      // Ignore audio policy errors
    }
  }

  /**
   * Emergency breach klaxon / siren warning pulse
   */
  public playAlarmSound(): void {
    if (this.muted) return;
    try {
      const ctx = this.initCtx();
      if (!ctx) return;

      // Two-tone rising sweep siren
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      const now = ctx.currentTime;
      
      // Pulse 1
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.linearRampToValueAtTime(880, now + 0.25);
      osc.frequency.linearRampToValueAtTime(440, now + 0.5);
      // Pulse 2
      osc.frequency.linearRampToValueAtTime(880, now + 0.75);
      osc.frequency.linearRampToValueAtTime(440, now + 1.0);

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.linearRampToValueAtTime(0.22, now + 0.5);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 1.25);
    } catch {
      // Ignore audio policy errors
    }
  }

  /**
   * Sci-fi chime for state reset / camera switch / export
   */
  public playChimeSound(): void {
    if (this.muted) return;
    try {
      const ctx = this.initCtx();
      if (!ctx) return;

      const freqs = [523.25, 659.25, 783.99]; // C5, E5, G5 major triad
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.05);

        gain.gain.setValueAtTime(0.06, ctx.currentTime + idx * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + idx * 0.05 + 0.25);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(ctx.currentTime + idx * 0.05);
        osc.stop(ctx.currentTime + idx * 0.05 + 0.3);
      });
    } catch {
      // Ignore audio policy errors
    }
  }

  /**
   * Continuous low-pass filtered brown noise for rushing water ambiance
   */
  public startWaterAmbience(): void {
    if (this.muted || this.waterNoiseNode) return;
    try {
      const ctx = this.initCtx();
      if (!ctx) return;

      const bufferSize = ctx.sampleRate * 2;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      let lastOut = 0.0;

      // Brown noise generator (integrated white noise)
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        lastOut = (lastOut + 0.02 * white) / 1.02;
        data[i] = lastOut * 3.5;
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      noise.loop = true;

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(420, ctx.currentTime);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.04, ctx.currentTime + 1.0); // Gentle fade-in

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      noise.start();
      this.waterNoiseNode = noise;
      this.waterGainNode = gain;
    } catch {
      // Ignore audio policy errors
    }
  }

  public stopWaterAmbience(): void {
    if (this.waterGainNode && this.ctx) {
      try {
        const gain = this.waterGainNode;
        gain.gain.linearRampToValueAtTime(0.0001, this.ctx.currentTime + 0.5);
        setTimeout(() => {
          if (this.waterNoiseNode) {
            (this.waterNoiseNode as AudioBufferSourceNode).stop();
            this.waterNoiseNode.disconnect();
            this.waterNoiseNode = null;
          }
          this.waterGainNode = null;
        }, 550);
      } catch {
        this.waterNoiseNode = null;
        this.waterGainNode = null;
      }
    }
  }
}

export const soundEffects = new SoundEffectsService();

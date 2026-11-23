// Minimal Web Audio API ambient score generator for the 60-second Theater Preview
class AmbientScoreEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private intervalId: number | null = null;
  private step = 0;
  private isPlaying = false;

  // F# minor / A major inspiring ambient progression frequencies
  private readonly chords = [
    [220.0, 277.18, 329.63, 440.0], // A maj
    [185.0, 220.0, 277.18, 369.99], // F#m
    [146.83, 220.0, 277.18, 329.63], // D maj9
    [164.81, 246.94, 329.63, 415.3], // E6
  ];

  public start(): void {
    if (this.isPlaying) return;
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;

    if (!this.ctx) {
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.08;
      this.masterGain.connect(this.ctx.destination);
    }

    if (this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }

    this.isPlaying = true;
    this.triggerPulse();
    this.intervalId = window.setInterval(() => {
      this.triggerPulse();
    }, 1800);
  }

  public stop(): void {
    this.isPlaying = false;
    if (this.intervalId !== null) {
      window.clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private triggerPulse(): void {
    if (!this.ctx || !this.masterGain || !this.isPlaying) return;
    const now = this.ctx.currentTime;
    const chord = this.chords[this.step % this.chords.length];
    this.step += 1;

    chord.forEach((freq, idx) => {
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = idx === 0 ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(freq, now);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(950, now);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(idx === 0 ? 0.25 : 0.14, now + 0.45);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.2);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 2.3);
    });
  }
}

export const ambientScore = new AmbientScoreEngine();

/**
 * SoundEngine: Hybrid Web Audio API Synthesizer & Natural Breath Acoustics
 * Plays human breath in / breath out audio cues (strictly once per phase, non-repeating)
 * combined with calming singing bowl and zen chime harmonics.
 */

export type BreathingPhase = 'INHALE' | 'HOLD_IN' | 'EXHALE' | 'HOLD_OUT' | 'COMPLETE';

class ZenSoundEngine {
  private audioCtx: AudioContext | null = null;
  private isMuted: boolean = false;
  private masterVolume: number = 0.28;
  private inhaleAudio: HTMLAudioElement | null = null;
  private exhaleAudio: HTMLAudioElement | null = null;

  constructor() {
    // Lazily initialized on first user interaction to comply with browser autoplay policies
  }

  private initAudioElements(): void {
    if (typeof window === 'undefined') return;

    if (!this.inhaleAudio) {
      // Primary normalized path with fallback
      this.inhaleAudio = new Audio('/breath-in.mp3');
      this.inhaleAudio.preload = 'auto';
      this.inhaleAudio.loop = false;
    }

    if (!this.exhaleAudio) {
      this.exhaleAudio = new Audio('/breath-out.mp3');
      this.exhaleAudio.preload = 'auto';
      this.exhaleAudio.loop = false;
    }
  }

  private initContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;

    if (!this.audioCtx) {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }

    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }

    this.initAudioElements();
    return this.audioCtx;
  }

  public setMuted(muted: boolean): void {
    this.isMuted = muted;
    if (muted) {
      this.stopBreathSounds();
    } else {
      this.initContext();
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public toggleMute(): boolean {
    this.setMuted(!this.isMuted);
    return this.isMuted;
  }

  /**
   * Stop all playing breath audio and reset playback position
   */
  public stopBreathSounds(): void {
    if (this.inhaleAudio) {
      this.inhaleAudio.pause();
      this.inhaleAudio.currentTime = 0;
    }
    if (this.exhaleAudio) {
      this.exhaleAudio.pause();
      this.exhaleAudio.currentTime = 0;
    }
  }

  /**
   * Play Breath In sound exactly once (non-repeating)
   */
  public playInhale(): void {
    if (this.isMuted) return;
    this.initAudioElements();

    // Stop any exhale sound immediately
    if (this.exhaleAudio) {
      this.exhaleAudio.pause();
      this.exhaleAudio.currentTime = 0;
    }

    if (this.inhaleAudio) {
      this.inhaleAudio.pause();
      this.inhaleAudio.currentTime = 0;
      this.inhaleAudio.loop = false; // Strictly non-repeating
      this.inhaleAudio.play().catch(() => {});
    }
  }

  /**
   * Play Breath Out sound exactly once (non-repeating)
   */
  public playExhale(): void {
    if (this.isMuted) return;
    this.initAudioElements();

    // Stop any inhale sound immediately
    if (this.inhaleAudio) {
      this.inhaleAudio.pause();
      this.inhaleAudio.currentTime = 0;
    }

    if (this.exhaleAudio) {
      this.exhaleAudio.pause();
      this.exhaleAudio.currentTime = 0;
      this.exhaleAudio.loop = false; // Strictly non-repeating
      this.exhaleAudio.play().catch(() => {});
    }
  }

  /**
   * Synthesize a zen singing bowl tone with warm harmonic overtones
   */
  private playHarmonicBowl(baseFreq: number, decaySec: number = 1.6, intensity: number = 1.0): void {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(this.masterVolume * intensity, now);
      masterGain.connect(ctx.destination);

      const harmonics: [number, number][] = [
        [1.0, 0.75],    // Fundamental
        [2.0, 0.25],    // 1st Octave
        [2.76, 0.18],   // Tibetan bowl signature minor 7th overtone
        [4.0, 0.08],    // 2nd Octave
      ];

      harmonics.forEach(([mult, relGain]) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(baseFreq * mult, now);

        if (mult === 1.0) {
          const lfo = ctx.createOscillator();
          const lfoGain = ctx.createGain();
          lfo.frequency.setValueAtTime(4.2, now);
          lfoGain.gain.setValueAtTime(1.5, now);
          lfo.connect(osc.frequency);
          lfo.start(now);
          lfo.stop(now + decaySec);
        }

        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.linearRampToValueAtTime(relGain, now + 0.018);
        gain.gain.exponentialRampToValueAtTime(0.00001, now + decaySec);

        osc.connect(gain);
        gain.connect(masterGain);

        osc.start(now);
        osc.stop(now + decaySec + 0.05);
      });
    } catch {
      // Audio playback failsafe
    }
  }

  /**
   * Play appropriate audio cue based on breathing phase
   */
  public playPhaseCue(phase: BreathingPhase): void {
    if (this.isMuted) return;

    switch (phase) {
      case 'INHALE':
        // 1. Play Breath In sound once (not repeating)
        this.playInhale();
        // 2. Subtle harmonic accompaniment
        this.playHarmonicBowl(528, 1.8, 0.5);
        break;

      case 'HOLD_IN':
        // Cease breath sounds during retention
        this.stopBreathSounds();
        // Centering calm singing bowl chime
        this.playHarmonicBowl(660, 1.5, 0.8);
        break;

      case 'EXHALE':
        // 1. Play Breath Out sound once (not repeating)
        this.playExhale();
        // 2. Subtle grounding accompaniment
        this.playHarmonicBowl(396, 2.0, 0.5);
        break;

      case 'HOLD_OUT':
        // Cease breath sounds during retention
        this.stopBreathSounds();
        // Grounded still chime
        this.playHarmonicBowl(330, 1.5, 0.8);
        break;

      case 'COMPLETE':
        this.stopBreathSounds();
        this.playHarmonicBowl(528, 2.0, 0.9);
        setTimeout(() => this.playHarmonicBowl(660, 2.0, 0.75), 180);
        setTimeout(() => this.playHarmonicBowl(792, 2.4, 0.65), 360);
        break;
    }
  }
}

export const soundEngine = new ZenSoundEngine();

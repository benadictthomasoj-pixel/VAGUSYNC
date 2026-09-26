// Professional Clinical Audio Synthesizer and High-Clarity Natural Voice Engine for VagusSync

class SoundManager {
  private ctx: AudioContext | null = null;
  private soundEnabled: boolean = true;
  private voicesLoaded: boolean = false;
  private selectedVoice: SpeechSynthesisVoice | null = null;
  private selectedTamilVoice: SpeechSynthesisVoice | null = null;
  private isSpeaking: boolean = false;
  private speechQueue: Array<{ text: string; lang: 'en' | 'ta'; enabled: boolean }> = [];

  constructor() {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      this.initVoices();
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = () => this.initVoices();
      }
    }
  }

  private initVoices() {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    const voices = window.speechSynthesis.getVoices();
    if (!voices || voices.length === 0) return;

    this.voicesLoaded = true;

    // Prefer high-clarity natural human English voices
    this.selectedVoice =
      voices.find((v) => v.name.includes('Google US English') || v.name.includes('Natural') || v.name.includes('Samantha') || v.name.includes('Karen') || v.name.includes('Victoria')) ||
      voices.find((v) => v.lang === 'en-US' || v.lang === 'en_US') ||
      voices.find((v) => v.lang.startsWith('en')) ||
      voices[0];
  }

  private initCtx() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  /**
   * Gentle, pleasant wooden pop sound for balloon popping / item interactions
   */
  public playPop() {
    if (!this.soundEnabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(720, now + 0.05);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.18, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.09);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.09);
    } catch {
      // Ignore audio context errors
    }
  }

  /**
   * Bright, crystal-clear success chime (C5 -> E5 -> G5)
   */
  public playTargetSuccess() {
    if (!this.soundEnabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const freqs = [523.25, 659.25, 783.99]; // C5, E5, G5

      freqs.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        const t = now + idx * 0.06;
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t);

        gain.gain.setValueAtTime(0.001, t);
        gain.gain.linearRampToValueAtTime(0.14, t + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.28);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(t);
        osc.stop(t + 0.28);
      });
    } catch {
      // Ignore
    }
  }

  /**
   * Harmonic fruit catch chime
   */
  public playFruitCatch() {
    if (!this.soundEnabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.exponentialRampToValueAtTime(880.0, now + 0.08); // A5

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.16, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.16);
    } catch {
      // Ignore
    }
  }

  /**
   * Melodic shape match sound
   */
  public playShapeMatch() {
    if (!this.soundEnabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const freqs = [659.25, 1046.5]; // E5 -> C6

      freqs.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        const t = now + idx * 0.07;
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t);

        gain.gain.setValueAtTime(0.001, t);
        gain.gain.linearRampToValueAtTime(0.15, t + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.24);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(t);
        osc.stop(t + 0.24);
      });
    } catch {
      // Ignore
    }
  }

  /**
   * Gentle, soft alert chime (replaces harsh sawtooth noise)
   */
  public playWarning() {
    if (!this.soundEnabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const freqs = [440, 370]; // A4 -> F#4 warm alert

      freqs.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        const t = now + idx * 0.1;
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t);

        gain.gain.setValueAtTime(0.001, t);
        gain.gain.linearRampToValueAtTime(0.12, t + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(t);
        osc.stop(t + 0.22);
      });
    } catch {
      // Ignore
    }
  }

  /**
   * Soothing clinical safety tone
   */
  public playSafetyAlarm() {
    if (!this.soundEnabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      for (let i = 0; i < 2; i++) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        const startTime = now + i * 0.16;
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, startTime); // D5

        gain.gain.setValueAtTime(0.001, startTime);
        gain.gain.linearRampToValueAtTime(0.15, startTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.14);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + 0.14);
      }
    } catch {
      // Ignore
    }
  }

  /**
   * Rich celebratory arpeggio for session completion
   */
  public playSessionComplete() {
    if (!this.soundEnabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      const now = this.ctx.currentTime;

      notes.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        const t = now + idx * 0.11;
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t);

        gain.gain.setValueAtTime(0.001, t);
        gain.gain.linearRampToValueAtTime(0.16, t + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.4);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(t);
        osc.stop(t + 0.4);
      });
    } catch {
      // Ignore
    }
  }

  /**
   * Crystal-Clear Natural Voice Text-To-Speech with queue & clean articulation
   */
  public speak(text: string, lang: 'en' | 'ta' = 'en', enabled: boolean = true) {
    if (!enabled || typeof window === 'undefined' || !window.speechSynthesis) return;

    try {
      if (!this.voicesLoaded) {
        this.initVoices();
      }

      // Safe clean text
      const cleanText = text.replace(/[*_#~`]/g, '').trim();
      if (!cleanText) return;

      // Cancel prior speech cleanly
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.rate = 0.95; // Calm, clear, clinical speed
      utterance.pitch = 1.0;
      utterance.volume = 0.9;
      utterance.lang = 'en-US';

      if (this.selectedVoice) {
        utterance.voice = this.selectedVoice;
      }

      utterance.onstart = () => {
        this.isSpeaking = true;
      };

      utterance.onend = () => {
        this.isSpeaking = false;
      };

      utterance.onerror = () => {
        this.isSpeaking = false;
      };

      // Speak with tiny timeout to let previous utterance clear on Mac/Chromium
      setTimeout(() => {
        try {
          window.speechSynthesis.speak(utterance);
        } catch {
          // Ignore
        }
      }, 50);
    } catch {
      // Speech synthesis fallback
    }
  }
}

export const soundManager = new SoundManager();

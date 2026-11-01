/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Procedural pulse, triangle, and noise synthesis for a GBA-inspired sound palette.
export class RetroAudio {
  private ctx: AudioContext | null = null;
  public musicEnabled: boolean = true;
  public sfxEnabled: boolean = true;
  public currentTrack: 'village' | 'forest' | 'town' | 'road' | 'boss' | null = null;
  private musicTimer: number | null = null;
  private stepCounter: number = 0;
  private audioErrorReported = false;

  public init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext ||
        (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) {
        this.reportAudioError(new Error('Web Audio is not supported by this browser.'));
        return;
      }
      try {
        this.ctx = new AudioCtx();
      } catch (error) {
        this.reportAudioError(error);
        return;
      }
    }
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume().catch(error => this.reportAudioError(error));
    }
  }

  private reportAudioError(error: unknown) {
    if (this.audioErrorReported) return;
    this.audioErrorReported = true;
    console.warn('Game audio is unavailable.', error);
  }

  // Generate a square / pulse wave (Game Boy Channels 1 & 2)
  public playPulse(freq: number, duration: number, type: OscillatorType = 'square', gainVal = 0.1, pitchDrop = 0) {
    if (!this.sfxEnabled) return;
    this.init();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, now);
      if (pitchDrop !== 0) {
        osc.frequency.exponentialRampToValueAtTime(Math.max(20, freq + pitchDrop), now + duration);
      }

      const attack = Math.min(0.012, duration * 0.25);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(gainVal, now + attack);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + duration);
    } catch (error) {
      this.reportAudioError(error);
    }
  }

  // Generate 8-bit Noise (Game Boy Channel 4 - for slashes, hits, steps, metallic clangs)
  public playNoise(duration: number, filterFreq = 1000, gainVal = 0.15) {
    if (!this.sfxEnabled) return;
    this.init();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const bufferSize = Math.floor(this.ctx.sampleRate * duration);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);

      let last = 0;
      for (let i = 0; i < bufferSize; i++) {
        if (i % 2 === 0) {
          last = Math.random() * 2 - 1;
        }
        data[i] = last;
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(filterFreq, now);
      filter.frequency.exponentialRampToValueAtTime(Math.max(100, filterFreq * 0.3), now + duration);

      const gain = this.ctx.createGain();
      const attack = Math.min(0.008, duration * 0.2);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(gainVal, now + attack);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      noise.start(now);
      noise.stop(now + duration);
    } catch (error) {
      this.reportAudioError(error);
    }
  }

  // Sound Effects
  public playTextBlip() {
    const f = 780 + Math.random() * 120;
    this.playPulse(f, 0.035, 'square', 0.04);
  }

  public playStep() {
    this.stepCounter++;
    if (this.stepCounter % 14 === 0) {
      this.playNoise(0.03, 400, 0.03);
    }
  }

  public playSword() {
    this.playNoise(0.16, 3200, 0.12);
    this.playPulse(660, 0.11, 'triangle', 0.055, -420);
    this.playPulse(330, 0.09, 'sine', 0.025, -120);
  }

  // Metallic Shield Block Clang!
  public playShieldBlock() {
    this.playPulse(1760, 0.16, 'triangle', 0.16, -520);
    this.playPulse(880, 0.2, 'square', 0.11, -260);
    this.playNoise(0.1, 3600, 0.16);
  }

  public playHit() {
    this.playNoise(0.14, 1200, 0.2);
    this.playPulse(180, 0.12, 'square', 0.14, -100);
  }

  public playEnemyDefeat() {
    this.playNoise(0.2, 800, 0.22);
    this.playPulse(240, 0.18, 'triangle', 0.1, -160);
  }

  public playPlayerHurt() {
    this.playPulse(140, 0.22, 'sawtooth', 0.18, -60);
  }

  public playHeartPickup() {
    const notes = [440, 660, 880];
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        this.playPulse(freq, 0.08, 'sine', 0.1);
      }, idx * 60);
    });
  }

  public playCoinsCollect() {
    setTimeout(() => { this.playPulse(784, 0.06, 'triangle', 0.12); }, 0);
    setTimeout(() => { this.playPulse(988, 0.08, 'triangle', 0.14); }, 65);
  }

  public playItemGet() {
    const notes = [392, 523.25, 659.25, 783.99];
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        this.playPulse(freq, 0.18, 'square', 0.12);
      }, idx * 120);
    });
  }

  public playSwordUpgrade() {
    const notes = [440, 554.37, 659.25, 880, 1108.7];
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        this.playPulse(freq, 0.15, 'triangle', 0.16);
      }, idx * 90);
    });
  }

  public playQuestDone() {
    const notes = [523.25, 659.25, 783.99, 1046.5, 987.77, 1046.5];
    const times = [0, 110, 220, 330, 480, 600];
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        this.playPulse(freq, 0.2, 'square', 0.15);
      }, times[idx]);
    });
  }

  public playBossShockwave() {
    this.playNoise(0.35, 600, 0.25);
    this.playPulse(90, 0.4, 'sawtooth', 0.2, -40);
  }

  // GBA Pegasus Dash Sound
  public playDash() {
    this.playNoise(0.14, 2200, 0.12);
    this.playPulse(300, 0.12, 'triangle', 0.075, 340);
    this.playPulse(600, 0.08, 'sine', 0.025, 180);
  }

  // 360 Spin Attack Whirlwind Sound
  public playSpinAttack() {
    this.playNoise(0.22, 3400, 0.22);
    this.playPulse(440, 0.18, 'sawtooth', 0.14, 440);
    setTimeout(() => {
      this.playPulse(880, 0.15, 'triangle', 0.12, -220);
    }, 60);
  }

  // Blade Charging Hum
  public playChargeHold() {
    this.playPulse(520, 0.05, 'sine', 0.04);
  }

  // Foliage / Bush Cut Slice
  public playGrassCut() {
    this.playNoise(0.08, 3800, 0.14);
    this.playPulse(680, 0.06, 'triangle', 0.08, -300);
  }

  // Treasure Chest Unlocking Fanfare
  public playChestOpen() {
    const notes = [440, 554.37, 659.25, 880];
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        this.playPulse(freq, 0.12, 'square', 0.12);
      }, idx * 75);
    });
  }

  public playButtonClick() {
    this.playPulse(440, 0.04, 'square', 0.08);
  }

  public playGameOverJingle() {
    const notes = [523.25, 440, 349.23, 293.66, 261.63];
    const delays = [0, 200, 400, 580, 760];
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        this.playPulse(freq, 0.18, 'sawtooth', 0.13);
      }, delays[idx]);
    });
  }

  public playVictory() {
    const sequence = [
      { f: 523.25, d: 150 },
      { f: 523.25, d: 150 },
      { f: 523.25, d: 150 },
      { f: 659.25, d: 350 },
      { f: 783.99, d: 350 },
      { f: 1046.5, d: 700 }
    ];
    let t = 0;
    sequence.forEach(s => {
      setTimeout(() => {
        this.playPulse(s.f, s.d / 1000, 'square', 0.18);
        this.playPulse(s.f / 2, s.d / 1000, 'triangle', 0.18);
      }, t);
      t += s.d + 30;
    });
  }

  // Sequenced chiptune loops with layered pulse leads and triangle bass.
  public startMusic(trackName: 'village' | 'forest' | 'town' | 'road' | 'boss') {
    if (this.currentTrack === trackName) return;
    this.stopMusic();
    this.currentTrack = trackName;
    if (!this.musicEnabled) return;

    let step = 0;
    let notes: number[] = [];
    let interval = 250;

    if (trackName === 'village') {
      notes = [
        261.63, 329.63, 392.00, 329.63,
        261.63, 349.23, 392.00, 349.23,
        293.66, 349.23, 440.00, 349.23,
        246.94, 293.66, 392.00, 293.66
      ];
      interval = 250;
    } else if (trackName === 'forest') {
      notes = [
        220.00, 261.63, 329.63, 261.63,
        293.66, 349.23, 440.00, 349.23,
        261.63, 329.63, 392.00, 329.63,
        196.00, 246.94, 293.66, 246.94
      ];
      interval = 240;
    } else if (trackName === 'town') {
      notes = [
        349.23, 440.00, 523.25, 440.00,
        392.00, 493.88, 587.33, 493.88,
        440.00, 523.25, 659.25, 523.25,
        392.00, 440.00, 349.23, 329.63
      ];
      interval = 210;
    } else if (trackName === 'road') {
      notes = [
        293.66, 369.99, 440.00, 369.99,
        329.63, 392.00, 493.88, 392.00,
        349.23, 440.00, 523.25, 440.00,
        293.66, 440.00, 369.99, 293.66
      ];
      interval = 200;
    } else if (trackName === 'boss') {
      notes = [
        146.83, 174.61, 220.00, 293.66,
        138.59, 164.81, 207.65, 277.18,
        130.81, 155.56, 196.00, 261.63,
        146.83, 220.00, 293.66, 369.99
      ];
      interval = 140;
    }

    this.musicTimer = window.setInterval(() => {
      if (!this.musicEnabled) return;
      const freq = notes[step % notes.length];
      const bassFreq = freq / 2;

      if (trackName === 'boss') {
        this.playPulse(freq, 0.09, 'sawtooth', 0.045);
        this.playPulse(bassFreq, 0.16, 'triangle', 0.055);
        if (step % 2 === 0) this.playPulse(freq * 1.5, 0.055, 'square', 0.018);
        if (step % 4 === 0) {
          this.playNoise(0.04, 300, 0.08);
        }
      } else {
        this.playPulse(freq, 0.11, 'square', 0.026);
        this.playPulse(bassFreq, 0.19, 'triangle', 0.035);
        if (step % 4 === 2) this.playPulse(freq * 1.5, 0.06, 'triangle', 0.016);
        if (step % 4 === 0) this.playPulse(freq * 2, 0.045, 'sine', 0.01);
      }
      step++;
    }, interval);
  }

  public stopMusic() {
    if (this.musicTimer) {
      clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
    this.currentTrack = null;
  }

  public toggleMusic(): boolean {
    this.musicEnabled = !this.musicEnabled;
    if (!this.musicEnabled) {
      const selectedTrack = this.currentTrack;
      this.stopMusic();
      this.currentTrack = selectedTrack;
    } else if (this.currentTrack) {
      const track = this.currentTrack;
      this.currentTrack = null;
      this.startMusic(track);
    }
    return this.musicEnabled;
  }
}

export const audioManager = new RetroAudio();

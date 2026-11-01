// audio.js - 8-Bit Retro Sound Synthesizer (Web Audio API)
// Provides authentic Game Boy style sounds without any external files.

class RetroAudio {
  constructor() {
    this.ctx = null;
    this.musicEnabled = true;
    this.sfxEnabled = true;
    this.currentTrack = null;
    this.musicTimer = null;
    this.stepCounter = 0;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Generate a square wave pulse (Game Boy Channel 1 & 2)
  playPulse(freq, duration, type = 'square', gainVal = 0.1, pitchDrop = 0) {
    if (!this.sfxEnabled || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, now);
      if (pitchDrop !== 0) {
        osc.frequency.exponentialRampToValueAtTime(Math.max(20, freq + pitchDrop), now + duration);
      }

      gain.gain.setValueAtTime(gainVal, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + duration);
    } catch (e) {
      // Audio context may need user gesture
    }
  }

  // Generate 8-bit Noise (Game Boy Channel 4 - for slashes, hits, steps, clangs)
  playNoise(duration, filterFreq = 1000, gainVal = 0.15) {
    if (!this.sfxEnabled || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const bufferSize = Math.floor(this.ctx.sampleRate * duration);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);

      // 8-bit lo-fi noise
      let last = 0;
      for (let i = 0; i < bufferSize; i++) {
        if (i % 2 === 0) {
          last = (Math.random() * 2 - 1);
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
      gain.gain.setValueAtTime(gainVal, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      noise.start(now);
      noise.stop(now + duration);
    } catch (e) {}
  }

  // Sound Effects:
  playTextBlip() {
    this.init();
    const f = 780 + Math.random() * 120;
    this.playPulse(f, 0.035, 'square', 0.04);
  }

  playStep() {
    this.init();
    this.stepCounter++;
    if (this.stepCounter % 14 === 0) {
      this.playNoise(0.03, 400, 0.03);
    }
  }

  playSword() {
    this.init();
    this.playNoise(0.12, 2800, 0.16);
    this.playPulse(520, 0.08, 'sawtooth', 0.06, -300);
  }

  // Metallic Shield Block Clang!
  playShieldBlock() {
    this.init();
    // High metallic ping + crisp noise burst
    this.playPulse(1760, 0.14, 'triangle', 0.18, -400);
    this.playPulse(880, 0.18, 'square', 0.12, -200);
    this.playNoise(0.08, 4200, 0.22);
  }

  playHit() {
    this.init();
    this.playNoise(0.14, 1200, 0.2);
    this.playPulse(180, 0.12, 'square', 0.14, -100);
  }

  playEnemyDefeat() {
    this.init();
    this.playNoise(0.2, 800, 0.22);
    this.playPulse(240, 0.18, 'triangle', 0.1, -160);
  }

  playPlayerHurt() {
    this.init();
    this.playPulse(140, 0.22, 'sawtooth', 0.18, -60);
  }

  playHeartPickup() {
    this.init();
    const notes = [440, 660, 880];
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        this.playPulse(freq, 0.08, 'sine', 0.1);
      }, idx * 60);
    });
  }

  playItemGet() {
    this.init();
    // Classic 4-note ascending fanfare
    const notes = [392, 523.25, 659.25, 783.99];
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        this.playPulse(freq, 0.18, 'square', 0.12);
      }, idx * 120);
    });
  }

  // Sword hone / upgrade chime
  playSwordUpgrade() {
    this.init();
    const notes = [440, 554.37, 659.25, 880, 1108.7];
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        this.playPulse(freq, 0.15, 'triangle', 0.16);
      }, idx * 90);
    });
  }

  playQuestDone() {
    this.init();
    const notes = [523.25, 659.25, 783.99, 1046.5, 987.77, 1046.5];
    const times = [0, 110, 220, 330, 480, 600];
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        this.playPulse(freq, 0.2, 'square', 0.15);
      }, times[idx]);
    });
  }

  playBossShockwave() {
    this.init();
    this.playNoise(0.35, 600, 0.25);
    this.playPulse(90, 0.4, 'sawtooth', 0.2, -40);
  }

  playVictory() {
    this.init();
    // Majestic Royal Liberation Fanfare
    const sequence = [
      { f: 523.25, d: 150 }, // C5
      { f: 523.25, d: 150 }, // C5
      { f: 523.25, d: 150 }, // C5
      { f: 659.25, d: 350 }, // E5
      { f: 783.99, d: 350 }, // G5
      { f: 1046.5, d: 700 }  // C6
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

  // Coin collect: quick rising 2-note chime
  playCoinsCollect() {
    this.init();
    setTimeout(() => { this.playPulse(784, 0.06, 'triangle', 0.12); }, 0);
    setTimeout(() => { this.playPulse(988, 0.08, 'triangle', 0.14); }, 65);
  }

  // Button click: short crisp pulse
  playButtonClick() {
    this.init();
    this.playPulse(440, 0.04, 'square', 0.08);
  }

  // Game Over jingle: descending mournful 5-note sequence
  playGameOverJingle() {
    this.init();
    const notes = [523.25, 440, 349.23, 293.66, 261.63];
    const delays = [0, 200, 400, 580, 760];
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        this.playPulse(freq, 0.18, 'sawtooth', 0.13);
      }, delays[idx]);
    });
  }

  // Ambient Chiptune Background Music (Gentle 8-bit loops)
  startMusic(trackName) {
    if (this.currentTrack === trackName) return;
    this.stopMusic();
    this.currentTrack = trackName;
    if (!this.musicEnabled) return;

    let step = 0;
    let notes = [];
    let interval = 250;

    if (trackName === 'village') {
      // Peaceful, warm village tune (F major / C major)
      notes = [
        261.63, 329.63, 392.00, 329.63,
        261.63, 349.23, 392.00, 349.23,
        293.66, 349.23, 440.00, 349.23,
        246.94, 293.66, 392.00, 293.66
      ];
      interval = 250;
    } else if (trackName === 'forest') {
      // Mysterious, gentle forest tune (A minor / D minor)
      notes = [
        220.00, 261.63, 329.63, 261.63,
        293.66, 349.23, 440.00, 349.23,
        261.63, 329.63, 392.00, 329.63,
        196.00, 246.94, 293.66, 246.94
      ];
      interval = 240;
    } else if (trackName === 'town') {
      // Lively 15th-century French market / medieval town theme
      notes = [
        349.23, 440.00, 523.25, 440.00,
        392.00, 493.88, 587.33, 493.88,
        440.00, 523.25, 659.25, 523.25,
        392.00, 440.00, 349.23, 329.63
      ];
      interval = 210;
    } else if (trackName === 'road') {
      // Adventurous, tense march (D minor / G minor / F major)
      notes = [
        293.66, 369.99, 440.00, 369.99,
        329.63, 392.00, 493.88, 392.00,
        349.23, 440.00, 523.25, 440.00,
        293.66, 440.00, 369.99, 293.66
      ];
      interval = 200;
    } else if (trackName === 'boss') {
      // Intense, aggressive fast-paced Boss Battle theme for King Raymond IV!
      notes = [
        146.83, 174.61, 220.00, 293.66,
        138.59, 164.81, 207.65, 277.18,
        130.81, 155.56, 196.00, 261.63,
        146.83, 220.00, 293.66, 369.99
      ];
      interval = 140; // Very fast tempo for epic showdown!
    }

    this.musicTimer = setInterval(() => {
      if (!this.musicEnabled) return;
      const freq = notes[step % notes.length];
      const bassFreq = freq / 2;

      if (trackName === 'boss') {
        this.playPulse(freq, 0.09, 'sawtooth', 0.06);
        this.playPulse(bassFreq, 0.12, 'square', 0.05);
        if (step % 4 === 0) {
          this.playNoise(0.04, 300, 0.08); // Retro hi-hat beat
        }
      } else {
        this.playPulse(freq, 0.12, 'triangle', 0.04);
        if (step % 2 === 0) {
          this.playPulse(bassFreq, 0.18, 'square', 0.02);
        }
      }
      step++;
    }, interval);
  }

  stopMusic() {
    if (this.musicTimer) {
      clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
    this.currentTrack = null;
  }

  toggleMusic() {
    this.musicEnabled = !this.musicEnabled;
    if (!this.musicEnabled) {
      this.stopMusic();
    } else if (this.currentTrack) {
      const track = this.currentTrack;
      this.currentTrack = null;
      this.startMusic(track);
    }
    return this.musicEnabled;
  }
}

// Global audio singleton
const audioManager = new RetroAudio();

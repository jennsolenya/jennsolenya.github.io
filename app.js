/**
 * VOID // 001 - Creative Playground & Art Experiment
 * 100% Pitch-Black Interactive Experience
 * Features: Three.js 3D Orbit, HRTF Spatial Audio, Mac Force Touch, Keyboard Synth & Auto-Arpeggiator
 */

// --- 1. Sound Engine with Binaural HRTF Spatial Audio ---
class SpatialSoundEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.filter = null;
    this.droneGain = null;
    this.droneOsc1 = null;
    this.droneOsc2 = null;
    this.subBassOsc = null;
    this.subBassGain = null;
    this.spatialPanner = null;
    this.analyser = null;
    this.isMuted = true;
    this.initialized = false;
  }

  init() {
    if (this.initialized) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();

      // Master Gain (increased from 0.42 to 0.62 for club-volume feel)
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0, this.ctx.currentTime);

      // Sidechain Ducking Bus (Amelie Lens pump effect)
      // Bass/acid elements route through this node; kick triggers rapid duck + release
      this.sidechainGain = this.ctx.createGain();
      this.sidechainGain.gain.setValueAtTime(1.0, this.ctx.currentTime);
      this.sidechainGain.connect(this.masterGain);

      // Lowpass Filter
      this.filter = this.ctx.createBiquadFilter();
      this.filter.type = 'lowpass';
      this.filter.frequency.setValueAtTime(450, this.ctx.currentTime);
      this.filter.Q.setValueAtTime(3.5, this.ctx.currentTime);

      // HRTF 3D Spatial Panner (binaural ear-simulation for AirPods / Headphones)
      if (this.ctx.createPanner) {
        this.spatialPanner = this.ctx.createPanner();
        this.spatialPanner.panningModel = 'HRTF';
        this.spatialPanner.distanceModel = 'inverse';
        this.spatialPanner.refDistance = 1;
        this.spatialPanner.maxDistance = 10000;
        this.spatialPanner.rolloffFactor = 1;
        this.spatialPanner.coneInnerAngle = 360;

        this.updateSpatialPosition(0, 0, 2);
      }

      // Audio Frequency Analyser for Audio-Reactive visuals
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 64;
      this.analyser.smoothingTimeConstant = 0.8;

      // Heavy Bass Boost EQ (Lowshelf +11dB at 80Hz for devastating sub pressure)
      this.bassBoost = this.ctx.createBiquadFilter();
      this.bassBoost.type = 'lowshelf';
      this.bassBoost.frequency.setValueAtTime(80, this.ctx.currentTime);
      this.bassBoost.gain.setValueAtTime(11.0, this.ctx.currentTime);

      // High-Shelf Presence Boost (+4dB at 8kHz for hat/percussion clarity on headphones)
      this.presenceEQ = this.ctx.createBiquadFilter();
      this.presenceEQ.type = 'highshelf';
      this.presenceEQ.frequency.setValueAtTime(8000, this.ctx.currentTime);
      this.presenceEQ.gain.setValueAtTime(4.0, this.ctx.currentTime);

      // Waveshaper Overdrive & Distortion (harder curve: 35 for aggressive analog bite)
      this.distortion = this.ctx.createWaveShaper();
      this.distortion.curve = this.makeDistortionCurve(35);
      this.distortion.oversample = '4x';

      // DynamicsCompressor (Limiter) to prevent clipping at louder master volume
      this.compressor = this.ctx.createDynamicsCompressor();
      this.compressor.threshold.setValueAtTime(-6, this.ctx.currentTime);
      this.compressor.knee.setValueAtTime(3, this.ctx.currentTime);
      this.compressor.ratio.setValueAtTime(12, this.ctx.currentTime);
      this.compressor.attack.setValueAtTime(0.002, this.ctx.currentTime);
      this.compressor.release.setValueAtTime(0.15, this.ctx.currentTime);

      // Routing: MasterGain -> BassBoost -> PresenceEQ -> Distortion -> Filter -> SpatialPanner -> Analyser -> Compressor -> Destination
      this.masterGain.connect(this.bassBoost);
      this.bassBoost.connect(this.presenceEQ);
      this.presenceEQ.connect(this.distortion);
      this.distortion.connect(this.filter);

      if (this.spatialPanner) {
        this.filter.connect(this.spatialPanner);
        this.spatialPanner.connect(this.analyser);
      } else {
        this.filter.connect(this.analyser);
      }
      this.analyser.connect(this.compressor);
      this.compressor.connect(this.ctx.destination);

      // Ambient Drone Oscillators
      this.droneGain = this.ctx.createGain();
      this.droneGain.gain.setValueAtTime(0.12, this.ctx.currentTime);

      this.droneOsc1 = this.ctx.createOscillator();
      this.droneOsc1.type = 'sine';
      this.droneOsc1.frequency.setValueAtTime(55, this.ctx.currentTime); // A1

      this.droneOsc2 = this.ctx.createOscillator();
      this.droneOsc2.type = 'triangle';
      this.droneOsc2.frequency.setValueAtTime(110, this.ctx.currentTime); // A2

      // Force Touch Sub-Bass Oscillator
      this.subBassGain = this.ctx.createGain();
      this.subBassGain.gain.setValueAtTime(0, this.ctx.currentTime);

      this.subBassOsc = this.ctx.createOscillator();
      this.subBassOsc.type = 'sine';
      this.subBassOsc.frequency.setValueAtTime(36.7, this.ctx.currentTime); // D1 Sub-bass

      this.droneOsc1.connect(this.droneGain);
      this.droneOsc2.connect(this.droneGain);
      this.droneGain.connect(this.masterGain);

      this.subBassOsc.connect(this.subBassGain);
      this.subBassGain.connect(this.masterGain);

      this.droneOsc1.start();
      this.droneOsc2.start();
      this.subBassOsc.start();

      // Atmospheric Noise Texture Generator (continuous per-genre filtered noise wash)
      this.atmosphereGain = this.ctx.createGain();
      this.atmosphereGain.gain.setValueAtTime(0, this.ctx.currentTime);
      this.atmosphereFilter = this.ctx.createBiquadFilter();
      this.atmosphereFilter.type = 'lowpass';
      this.atmosphereFilter.frequency.setValueAtTime(200, this.ctx.currentTime);
      this.atmosphereFilter.Q.setValueAtTime(0.7, this.ctx.currentTime);

      // Create a 2-second looping noise buffer for atmosphere
      const noiseLen = 2 * this.ctx.sampleRate;
      const noiseBuf = this.ctx.createBuffer(1, noiseLen, this.ctx.sampleRate);
      const noiseData = noiseBuf.getChannelData(0);
      for (let i = 0; i < noiseLen; i++) {
        noiseData[i] = Math.random() * 2 - 1;
      }
      this.atmosphereSource = this.ctx.createBufferSource();
      this.atmosphereSource.buffer = noiseBuf;
      this.atmosphereSource.loop = true;
      this.atmosphereSource.connect(this.atmosphereFilter);
      this.atmosphereFilter.connect(this.atmosphereGain);
      this.atmosphereGain.connect(this.masterGain);
      this.atmosphereSource.start();

      this.genre = 'techno'; // 'techno' (Acid) | 'dnb' | 'dubstep' | 'ambient'
      this.initialized = true;
    } catch (e) {
      console.warn('Web Audio initialization:', e);
    }
  }

  makeDistortionCurve(amount = 20) {
    const k = typeof amount === 'number' ? amount : 20;
    const n_samples = 44100;
    const curve = new Float32Array(n_samples);
    const deg = Math.PI / 180;
    for (let i = 0; i < n_samples; ++i) {
      const x = (i * 2) / n_samples - 1;
      curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
    }
    return curve;
  }

  setGenre(genreName) {
    this.genre = genreName;
    if (this.isMuted || !this.ctx) return;
    const now = this.ctx.currentTime;

    if (genreName === 'techno' || genreName === 'acid') {
      // 135 BPM Warehouse Acid Techno (Charlotte de Witte / Amelie Lens / 999999999)
      this.filter.frequency.setTargetAtTime(2200, now, 0.15);
      this.filter.Q.setValueAtTime(8.5, now);
      this.droneOsc1.type = 'sawtooth';
      this.droneOsc2.type = 'triangle';
      this.subBassOsc.frequency.setValueAtTime(43.65, now); // F1
      // Atmosphere: dark rumble texture (lowpass 200Hz)
      if (this.atmosphereGain) this.atmosphereGain.gain.setTargetAtTime(0.035, now, 0.3);
      if (this.atmosphereFilter) {
        this.atmosphereFilter.type = 'lowpass';
        this.atmosphereFilter.frequency.setTargetAtTime(200, now, 0.2);
      }
      // Harder distortion for acid
      if (this.distortion) this.distortion.curve = this.makeDistortionCurve(40);
      this.triggerChime(110, 'sawtooth', 0.4, 0, 0);
    } else if (genreName === 'dnb') {
      // 174 BPM Neurofunk & Amen Breaks (Chase & Status / Noisia / Mefjus)
      this.filter.frequency.setTargetAtTime(1400, now, 0.12);
      this.filter.Q.setValueAtTime(6.0, now);
      this.droneOsc1.type = 'sawtooth';
      this.droneOsc2.type = 'sawtooth';
      this.subBassOsc.frequency.setValueAtTime(41.2, now); // E1
      // Atmosphere: mid-frequency industrial hiss (bandpass 2-4kHz)
      if (this.atmosphereGain) this.atmosphereGain.gain.setTargetAtTime(0.02, now, 0.3);
      if (this.atmosphereFilter) {
        this.atmosphereFilter.type = 'bandpass';
        this.atmosphereFilter.frequency.setTargetAtTime(3000, now, 0.2);
        this.atmosphereFilter.Q.setValueAtTime(1.5, now);
      }
      if (this.distortion) this.distortion.curve = this.makeDistortionCurve(28);
      this.triggerChime(164.81, 'sawtooth', 0.35, 0, 0);
    } else if (genreName === 'dubstep' || genreName === 'bass') {
      // 145 BPM Heavy Bass & Vocal Formant Growls (Skrillex / Space Laces / Virtual Riot)
      this.filter.frequency.setTargetAtTime(1200, now, 0.1);
      this.filter.Q.setValueAtTime(10.0, now);
      this.droneOsc1.type = 'sawtooth';
      this.droneOsc2.type = 'square';
      this.subBassOsc.frequency.setValueAtTime(36.7, now); // D1
      // Atmosphere: dark sub-noise (lowpass 80Hz, barely audible but felt)
      if (this.atmosphereGain) this.atmosphereGain.gain.setTargetAtTime(0.04, now, 0.3);
      if (this.atmosphereFilter) {
        this.atmosphereFilter.type = 'lowpass';
        this.atmosphereFilter.frequency.setTargetAtTime(80, now, 0.2);
      }
      if (this.distortion) this.distortion.curve = this.makeDistortionCurve(45);
      this.triggerChime(55, 'sawtooth', 0.7, 0, 0);
    } else if (genreName === 'bounce') {
      // The Big Bounce
      if (this.atmosphereGain) this.atmosphereGain.gain.setTargetAtTime(0.01, now, 0.3);
      if (this.distortion) this.distortion.curve = this.makeDistortionCurve(25);
      this.playBigBounceChord();
    } else {
      // Ambient Void
      this.filter.frequency.setTargetAtTime(480, now, 0.2);
      this.filter.Q.setValueAtTime(2.5, now);
      this.droneOsc1.type = 'sine';
      this.droneOsc2.type = 'triangle';
      this.subBassOsc.frequency.setValueAtTime(36.7, now);
      // Atmosphere: ethereal wash (lowpass 400Hz, very quiet)
      if (this.atmosphereGain) this.atmosphereGain.gain.setTargetAtTime(0.015, now, 0.3);
      if (this.atmosphereFilter) {
        this.atmosphereFilter.type = 'lowpass';
        this.atmosphereFilter.frequency.setTargetAtTime(400, now, 0.2);
      }
      if (this.distortion) this.distortion.curve = this.makeDistortionCurve(12);
      this.triggerChime(440, 'sine', 0.6, 0, 0);
    }
  }

  playBigBounceChord() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    const chord = [261.63, 329.63, 392.00, 523.25, 659.25]; // C major 9th cosmic rebirth chord
    chord.forEach((freq, idx) => {
      const panX = (idx - 2) * 0.4;
      this.triggerChime(freq, 'sine', 0.75, panX, 0);
    });
  }

  playSubDrop() {
    if (!this.ctx || this.isMuted) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(130, now);
      osc.frequency.exponentialRampToValueAtTime(32, now + 0.65);

      gain.gain.setValueAtTime(0.7, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);

      osc.connect(gain);
      gain.connect(this.bassBoost || this.masterGain);
      osc.start(now);
      osc.stop(now + 0.7);
    } catch (e) {}
  }

  toggle() {
    this.init();
    if (!this.ctx) return false;
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    this.isMuted = !this.isMuted;
    const now = this.ctx.currentTime;
    if (this.isMuted) {
      this.playPowerDownSound();
      this.masterGain.gain.setTargetAtTime(0, now + 0.15, 0.12);
      if (typeof cosmicEngine !== 'undefined' && cosmicEngine.isMusicPlaying) {
        cosmicEngine.stopPlayback();
      }
    } else {
      this.masterGain.gain.setTargetAtTime(0.62, now, 0.1);
      this.playPowerUpSound();
      if (typeof cosmicEngine !== 'undefined' && !cosmicEngine.isMusicPlaying) {
        cosmicEngine.startPlayback();
      }
    }
    syncAudioButtons(!this.isMuted);
    return !this.isMuted;
  }

  playPowerUpSound() {
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      // Dual futuristic rising chime
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.28);

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.35);
    } catch (e) {}
  }

  playPowerDownSound() {
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(550, now);
      osc.frequency.exponentialRampToValueAtTime(110, now + 0.22);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.25);
    } catch (e) {}
  }

  updateSpatialPosition(x, y, z) {
    if (!this.spatialPanner || !this.ctx) return;
    const now = this.ctx.currentTime;
    if (this.spatialPanner.positionX) {
      this.spatialPanner.positionX.setTargetAtTime(x, now, 0.05);
      this.spatialPanner.positionY.setTargetAtTime(y, now, 0.05);
      this.spatialPanner.positionZ.setTargetAtTime(z, now, 0.05);
    } else if (this.spatialPanner.setPosition) {
      this.spatialPanner.setPosition(x, y, z);
    }
  }

  modulateWithCursor(normX, normY, force = 0) {
    if (!this.filter || this.isMuted || !this.ctx) return;
    const now = this.ctx.currentTime;
    // Modulate cutoff frequency + force boost
    let baseFreq = 260 + normX * 1200 + (1 - normY) * 700;
    if (this.genre === 'dubstep') {
      // Skrillex wobble style: cursor modulates wobble rate and heavy filter resonance
      const wobble = Math.sin(now * 12) * 800;
      baseFreq = Math.max(150, baseFreq + wobble);
    }

    const targetFreq = Math.min(7500, baseFreq + force * 2800);
    this.filter.frequency.setTargetAtTime(targetFreq, now, 0.05);

    // Force Touch Sub-Bass swell
    if (this.subBassGain) {
      this.subBassGain.gain.setTargetAtTime(force * 0.35, now, 0.04);
    }
  }

  triggerChime(freq = 440, type = 'sine', duration = 0.6, posX = 0, posY = 0) {
    if (this.isMuted || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const noteGain = this.ctx.createGain();

      // Adapt waveform and envelope based on genre
      let chosenType = type;
      let noteDuration = duration;
      let peakGain = 0.24;

      if (this.genre === 'techno') {
        chosenType = type === 'sine' ? 'sawtooth' : type;
        noteDuration = Math.min(0.45, duration * 0.7);
        peakGain = 0.28;
      } else if (this.genre === 'dubstep') {
        chosenType = 'sawtooth';
        peakGain = 0.32;
      }

      osc.type = chosenType;
      osc.frequency.setValueAtTime(freq, now);

      noteGain.gain.setValueAtTime(peakGain, now);
      noteGain.gain.exponentialRampToValueAtTime(0.0001, now + noteDuration);

      if (this.ctx.createPanner) {
        const chimePanner = this.ctx.createPanner();
        chimePanner.panningModel = 'HRTF';
        if (chimePanner.positionX) {
          chimePanner.positionX.setValueAtTime(posX * 3.5, now);
          chimePanner.positionY.setValueAtTime(posY * 2.5, now);
          chimePanner.positionZ.setValueAtTime(1.5, now);
        }
        osc.connect(noteGain);
        noteGain.connect(chimePanner);
        chimePanner.connect(this.masterGain);
      } else {
        osc.connect(noteGain);
        noteGain.connect(this.masterGain);
      }

      osc.start(now);
      osc.stop(now + noteDuration);
    } catch (err) {
      // Ignored
    }
  }

  playKick(time) {
    if (this.isMuted || !this.ctx) return;
    const t = time || this.ctx.currentTime;
    try {
      // 1. Sub boom (38Hz body)
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(175, t);
      osc.frequency.exponentialRampToValueAtTime(42, t + 0.08);
      osc.frequency.exponentialRampToValueAtTime(28, t + 0.24);

      gain.gain.setValueAtTime(0.75, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.32);

      osc.connect(gain);
      gain.connect(this.bassBoost || this.masterGain);
      osc.start(t);
      osc.stop(t + 0.32);

      // 2. High transient click for 909 club punch
      const click = this.ctx.createOscillator();
      const clickGain = this.ctx.createGain();
      click.type = 'triangle';
      click.frequency.setValueAtTime(1200, t);
      click.frequency.exponentialRampToValueAtTime(120, t + 0.015);

      clickGain.gain.setValueAtTime(0.35, t);
      clickGain.gain.exponentialRampToValueAtTime(0.001, t + 0.02);

      click.connect(clickGain);
      clickGain.connect(this.masterGain);
      click.start(t);
      click.stop(t + 0.025);

      // Pulse 3D wireframe mesh on kick
      if (typeof wireframeMesh !== 'undefined' && wireframeMesh) {
        wireframeMesh.scale.set(1.28, 1.28, 1.28);
      }
    } catch (e) {}
  }

  playSnare(time, snappy = false) {
    if (this.isMuted || !this.ctx) return;
    const t = time || this.ctx.currentTime;
    try {
      // Noise burst
      const duration = snappy ? 0.08 : 0.14;
      const bufferSize = Math.floor(this.ctx.sampleRate * duration);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const noiseFilter = this.ctx.createBiquadFilter();
      noiseFilter.type = 'highpass';
      noiseFilter.frequency.setValueAtTime(snappy ? 1400 : 900, t);

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.4, t);
      noiseGain.gain.exponentialRampToValueAtTime(0.01, t + duration);

      noise.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(this.distortion || this.masterGain);

      // Tonal punch
      const osc = this.ctx.createOscillator();
      const oscGain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(snappy ? 240 : 190, t);
      osc.frequency.exponentialRampToValueAtTime(80, t + 0.08);

      oscGain.gain.setValueAtTime(0.35, t);
      oscGain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);

      osc.connect(oscGain);
      oscGain.connect(this.masterGain);

      noise.start(t);
      osc.start(t);
      osc.stop(t + duration);
    } catch (e) {}
  }

  playHiHat(open = false, time) {
    if (this.isMuted || !this.ctx) return;
    const t = time || this.ctx.currentTime;
    try {
      const duration = open ? 0.22 : 0.038;
      const bufferSize = Math.floor(this.ctx.sampleRate * duration);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(open ? 6500 : 8000, t);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(open ? 0.26 : 0.16, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      noise.start(t);
    } catch (e) {}
  }

  // Roland TB-303 Acid Bassline Synthesizer (Amelie Lens / 999999999 / Charlotte de Witte)
  play303Acid(freq, time, accent = false, slide = false, targetFreq = null) {
    if (this.isMuted || !this.ctx) return;
    const t = time || this.ctx.currentTime;
    try {
      const osc = this.ctx.createOscillator();
      const noteFilter = this.ctx.createBiquadFilter();
      const noteGain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, t);
      if (slide && targetFreq) {
        osc.frequency.exponentialRampToValueAtTime(targetFreq, t + 0.12);
      }

      noteFilter.type = 'lowpass';
      const baseQ = accent ? 13.5 : 9.0;
      noteFilter.Q.setValueAtTime(baseQ, t);

      const baseCutoff = accent ? 4200 : 1800;
      noteFilter.frequency.setValueAtTime(baseCutoff, t);
      noteFilter.frequency.exponentialRampToValueAtTime(140, t + (accent ? 0.16 : 0.11));

      const gainLvl = accent ? 0.45 : 0.28;
      noteGain.gain.setValueAtTime(gainLvl, t);
      noteGain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);

      osc.connect(noteFilter);
      noteFilter.connect(noteGain);
      noteGain.connect(this.sidechainGain || this.distortion || this.masterGain);

      osc.start(t);
      osc.stop(t + 0.18);
    } catch (e) {}
  }

  // Neurofunk Reese Bass (Chase & Status / Noisia)
  playReese(freq, time, duration = 0.32) {
    if (this.isMuted || !this.ctx) return;
    const t = time || this.ctx.currentTime;
    try {
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const filter = this.ctx.createBiquadFilter();
      const gain = this.ctx.createGain();

      osc1.type = 'sawtooth';
      osc2.type = 'sawtooth';
      osc1.frequency.setValueAtTime(freq, t);
      osc2.frequency.setValueAtTime(freq * 1.014, t); // Detuned saw pair for beating

      filter.type = 'lowpass';
      filter.Q.setValueAtTime(6.0, t);
      filter.frequency.setValueAtTime(850, t);
      filter.frequency.exponentialRampToValueAtTime(160, t + duration);

      gain.gain.setValueAtTime(0.42, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(gain);      gain.connect(this.sidechainGain || this.bassBoost || this.masterGain);
      osc1.start(t);
      osc2.start(t);
      osc1.stop(t + duration);
      osc2.stop(t + duration);
    } catch (e) {}
  }

  // Skrillex Formant Throat Growl Bass
  playSkrillexGrowl(freq, time, duration = 0.28) {
    if (this.isMuted || !this.ctx) return;
    const t = time || this.ctx.currentTime;
    try {
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const formantFilter = this.ctx.createBiquadFilter();
      const gain = this.ctx.createGain();

      osc1.type = 'sawtooth';
      osc2.type = 'square';
      osc1.frequency.setValueAtTime(freq, t);
      osc2.frequency.setValueAtTime(freq * 0.5, t); // Sub-octave grit

      formantFilter.type = 'bandpass';
      formantFilter.Q.setValueAtTime(7.5, t);
      formantFilter.frequency.setValueAtTime(450, t);
      formantFilter.frequency.exponentialRampToValueAtTime(2600, t + duration * 0.4);
      formantFilter.frequency.exponentialRampToValueAtTime(320, t + duration);

      gain.gain.setValueAtTime(0.55, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

      osc1.connect(formantFilter);
      osc2.connect(formantFilter);
      formantFilter.connect(gain);      gain.connect(this.sidechainGain || this.distortion || this.masterGain);
      osc1.start(t);
      osc2.start(t);
      osc1.stop(t + duration);
      osc2.stop(t + duration);
    } catch (e) {}
  }

  playWobble(freq = 55, time) {
    this.playSkrillexGrowl(freq, time, 0.26);
  }

  // --- Rumble Kick with Reverb Tail (Ben Klock / Charlotte de Witte) ---
  // Synthetic reverb tail: short noise buffer with exponential decay, lowpass filtered to sub-rumble
  playRumbleKick(time) {
    if (this.isMuted || !this.ctx) return;
    const t = time || this.ctx.currentTime;
    try {
      // Standard kick first
      this.playKick(t);

      // Trigger sidechain duck on bass bus
      this.triggerSidechain(t);

      // Rumble tail: filtered noise with exponential decay
      const tailDuration = 0.35;
      const bufferSize = Math.floor(this.ctx.sampleRate * tailDuration);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        // Exponentially decaying noise shaped as sub-rumble
        const decay = Math.exp(-i / (bufferSize * 0.25));
        data[i] = (Math.random() * 2 - 1) * decay;
      }
      const rumbleNoise = this.ctx.createBufferSource();
      rumbleNoise.buffer = buffer;

      // Lowpass at 120Hz to keep only sub-rumble (Ben Klock style)
      const rumbleFilter = this.ctx.createBiquadFilter();
      rumbleFilter.type = 'lowpass';
      rumbleFilter.frequency.setValueAtTime(120, t);
      rumbleFilter.Q.setValueAtTime(2.5, t);

      // Drive through distortion for warmth
      const rumbleDistortion = this.ctx.createWaveShaper();
      rumbleDistortion.curve = this.makeDistortionCurve(30);

      const rumbleGain = this.ctx.createGain();
      rumbleGain.gain.setValueAtTime(0.5, t);
      rumbleGain.gain.exponentialRampToValueAtTime(0.001, t + tailDuration);

      rumbleNoise.connect(rumbleFilter);
      rumbleFilter.connect(rumbleDistortion);
      rumbleDistortion.connect(rumbleGain);
      rumbleGain.connect(this.bassBoost || this.masterGain);

      rumbleNoise.start(t + 0.015); // Slight delay after transient
    } catch (e) {}
  }

  // --- Sidechain Ducking (Amelie Lens pump effect) ---
  // Rapidly duck sidechainGain when kick fires, release smoothly
  triggerSidechain(time) {
    if (!this.sidechainGain || !this.ctx) return;
    const t = time || this.ctx.currentTime;
    // Duck to near-zero in 8ms
    this.sidechainGain.gain.cancelScheduledValues(t);
    this.sidechainGain.gain.setValueAtTime(1.0, t);
    this.sidechainGain.gain.linearRampToValueAtTime(0.05, t + 0.008);
    // Release back to 1.0 over 80ms
    this.sidechainGain.gain.linearRampToValueAtTime(1.0, t + 0.09);
  }

  // --- Dual 303 Acid Stacking (999999999: double detuned 303 voices) ---
  playDual303Acid(freq, time, accent = false, slide = false, targetFreq = null) {
    if (this.isMuted || !this.ctx) return;
    const t = time || this.ctx.currentTime;
    // Primary 303 voice
    this.play303Acid(freq, t, accent, slide, targetFreq);
    // Second detuned voice (+7 cents sharp) for 999999999 stacking
    try {
      const detuneRatio = Math.pow(2, 7 / 1200); // +7 cents
      const osc = this.ctx.createOscillator();
      const noteFilter = this.ctx.createBiquadFilter();
      const noteGain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq * detuneRatio, t);
      if (slide && targetFreq) {
        osc.frequency.exponentialRampToValueAtTime(targetFreq * detuneRatio, t + 0.12);
      }

      noteFilter.type = 'lowpass';
      const baseQ = accent ? 18.0 : 11.0; // Screaming resonance on accents
      noteFilter.Q.setValueAtTime(baseQ, t);
      const baseCutoff = accent ? 5200 : 2200;
      noteFilter.frequency.setValueAtTime(baseCutoff, t);
      noteFilter.frequency.exponentialRampToValueAtTime(120, t + (accent ? 0.22 : 0.14));

      const gainLvl = accent ? 0.38 : 0.22;
      noteGain.gain.setValueAtTime(gainLvl, t);
      noteGain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

      osc.connect(noteFilter);
      noteFilter.connect(noteGain);
      noteGain.connect(this.sidechainGain || this.masterGain);

      osc.start(t);
      osc.stop(t + 0.22);
    } catch (e) {}
  }

  // --- Ride Cymbal (Amelie Lens rolling energy) ---
  playRideCymbal(time) {
    if (this.isMuted || !this.ctx) return;
    const t = time || this.ctx.currentTime;
    try {
      const duration = 0.15;
      const bufferSize = Math.floor(this.ctx.sampleRate * duration);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      // Metallic bandpass at 4.5kHz for shimmery ride character
      const rideFilter = this.ctx.createBiquadFilter();
      rideFilter.type = 'bandpass';
      rideFilter.frequency.setValueAtTime(4500, t);
      rideFilter.Q.setValueAtTime(3.0, t);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.12, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

      noise.connect(rideFilter);
      rideFilter.connect(gain);
      gain.connect(this.masterGain);

      noise.start(t);
    } catch (e) {}
  }

  // --- Metallic Percussion Clank (Kobosil industrial stab) ---
  playMetalClank(time) {
    if (this.isMuted || !this.ctx) return;
    const t = time || this.ctx.currentTime;
    try {
      // Ring modulation: two oscillators at inharmonic frequencies
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const ringGain = this.ctx.createGain();
      const outputGain = this.ctx.createGain();

      osc1.type = 'square';
      osc1.frequency.setValueAtTime(340, t);
      osc2.type = 'square';
      osc2.frequency.setValueAtTime(587, t); // Inharmonic ratio for metallic timbre

      // Simulate ring mod: osc1 modulates ringGain which processes osc2
      ringGain.gain.setValueAtTime(0, t);
      osc1.connect(ringGain.gain); // osc1 modulates gain
      osc2.connect(ringGain);

      outputGain.gain.setValueAtTime(0.18, t);
      outputGain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);

      ringGain.connect(outputGain);
      outputGain.connect(this.distortion || this.masterGain);

      osc1.start(t);
      osc2.start(t);
      osc1.stop(t + 0.07);
      osc2.stop(t + 0.07);
    } catch (e) {}
  }

  // --- FM Synthesis Bass (Mefjus / Noisia: evolving metallic wobble) ---
  playFMBass(carrierFreq, modFreq, modDepth, time, duration = 0.35) {
    if (this.isMuted || !this.ctx) return;
    const t = time || this.ctx.currentTime;
    try {
      const carrier = this.ctx.createOscillator();
      const modulator = this.ctx.createOscillator();
      const modGain = this.ctx.createGain();
      const outputGain = this.ctx.createGain();
      const fmFilter = this.ctx.createBiquadFilter();

      carrier.type = 'sawtooth';
      carrier.frequency.setValueAtTime(carrierFreq, t);

      modulator.type = 'sine';
      modulator.frequency.setValueAtTime(modFreq, t);

      // Modulation depth sweeps for evolving timbre
      modGain.gain.setValueAtTime(modDepth, t);
      modGain.gain.exponentialRampToValueAtTime(modDepth * 0.1, t + duration);

      // Connect modulator -> modGain -> carrier.frequency (FM synthesis)
      modulator.connect(modGain);
      modGain.connect(carrier.frequency);

      // Filter sweep
      fmFilter.type = 'lowpass';
      fmFilter.frequency.setValueAtTime(2400, t);
      fmFilter.frequency.exponentialRampToValueAtTime(200, t + duration);
      fmFilter.Q.setValueAtTime(8.0, t);

      outputGain.gain.setValueAtTime(0.48, t);
      outputGain.gain.exponentialRampToValueAtTime(0.001, t + duration);

      carrier.connect(fmFilter);
      fmFilter.connect(outputGain);
      outputGain.connect(this.sidechainGain || this.masterGain);

      carrier.start(t);
      modulator.start(t);
      carrier.stop(t + duration);
      modulator.stop(t + duration);
    } catch (e) {}
  }

  // --- Enhanced Skrillex Growl with LFO Chop (Virtual Riot / Must Die!) ---
  playSkrillexGrowlAdvanced(freq, time, duration = 0.32) {
    if (this.isMuted || !this.ctx) return;
    const t = time || this.ctx.currentTime;
    try {
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const osc3 = this.ctx.createOscillator(); // Ring mod harmonic layer (Must Die!)

      // Stage 1: Dual oscillator core
      osc1.type = 'sawtooth';
      osc2.type = 'square';
      osc1.frequency.setValueAtTime(freq, t);
      osc2.frequency.setValueAtTime(freq * 0.5, t); // Sub-octave

      // Stage 2: Ring modulation metallic layer
      osc3.type = 'square';
      osc3.frequency.setValueAtTime(freq * 2.73, t); // Inharmonic for metallic upper harmonics

      // Formant filter 1: Primary vowel sweep (AH -> EE)
      const formant1 = this.ctx.createBiquadFilter();
      formant1.type = 'bandpass';
      formant1.Q.setValueAtTime(8.0, t);
      formant1.frequency.setValueAtTime(450, t);
      formant1.frequency.exponentialRampToValueAtTime(2800, t + duration * 0.35);

      // Formant filter 2: Secondary vowel sweep (EE -> OW) for "OW-EE-AH" compound
      const formant2 = this.ctx.createBiquadFilter();
      formant2.type = 'bandpass';
      formant2.Q.setValueAtTime(5.5, t);
      formant2.frequency.setValueAtTime(2800, t + duration * 0.35);
      formant2.frequency.exponentialRampToValueAtTime(320, t + duration);

      // LFO Chop (Virtual Riot tempo-synced amplitude stutter)
      const lfo = this.ctx.createOscillator();
      const lfoGain = this.ctx.createGain();
      const chopGain = this.ctx.createGain();
      lfo.type = 'square';
      lfo.frequency.setValueAtTime(16, t); // 16th note rate stutter
      lfoGain.gain.setValueAtTime(0.4, t); // Depth: chops between 0.6 and 1.0
      chopGain.gain.setValueAtTime(0.6, t); // Baseline
      lfo.connect(lfoGain);
      lfoGain.connect(chopGain.gain);
      lfo.start(t);
      lfo.stop(t + duration);

      const outputGain = this.ctx.createGain();
      outputGain.gain.setValueAtTime(0.55, t);
      outputGain.gain.exponentialRampToValueAtTime(0.001, t + duration);

      // Routing: oscs -> formant1 -> formant2 -> chopGain -> outputGain -> distortion
      osc1.connect(formant1);
      osc2.connect(formant1);
      osc3.connect(formant1); // metallic harmonics into formant chain
      formant1.connect(formant2);
      formant2.connect(chopGain);
      chopGain.connect(outputGain);
      outputGain.connect(this.distortion || this.masterGain);

      osc1.start(t);
      osc2.start(t);
      osc3.start(t);
      osc1.stop(t + duration);
      osc2.stop(t + duration);
      osc3.stop(t + duration);
    } catch (e) {}
  }

  // --- 808 Sub Layer (Trampa: devastating sub pressure underneath growl bass) ---
  play808Sub(freq, time, duration = 0.5) {
    if (this.isMuted || !this.ctx) return;
    const t = time || this.ctx.currentTime;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine'; // Pure sub
      osc.frequency.setValueAtTime(freq, t);
      // Gentle pitch bend down for weight
      osc.frequency.exponentialRampToValueAtTime(freq * 0.85, t + duration);

      gain.gain.setValueAtTime(0.6, t);
      gain.gain.setValueAtTime(0.6, t + duration * 0.6); // Long sustain
      gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

      osc.connect(gain);
      gain.connect(this.bassBoost || this.masterGain);
      osc.start(t);
      osc.stop(t + duration);
    } catch (e) {}
  }

  // --- Ghost Snare (Paula Temple: low-velocity off-beat ghost hits) ---
  playGhostSnare(time) {
    if (this.isMuted || !this.ctx) return;
    const t = time || this.ctx.currentTime;
    try {
      const duration = 0.04;
      const bufferSize = Math.floor(this.ctx.sampleRate * duration);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1800 + Math.random() * 1200, t);
      filter.Q.setValueAtTime(2.0, t);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.06 + Math.random() * 0.06, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      noise.start(t);
    } catch (e) {}
  }
}

const audio = new SpatialSoundEngine();

// --- 2. Spotlight Canvas Grid with Mac Force Sensitivity ---
const gridCanvas = document.getElementById('grid-canvas');
const gCtx = gridCanvas.getContext('2d');

let width = (gridCanvas.width = window.innerWidth);
let height = (gridCanvas.height = window.innerHeight);

let trackpadForce = 0; // 0.0 to 2.0 (Apple Force Touch standard)

const mouse = {
  x: width / 2,
  y: height / 2,
  targetX: width / 2,
  targetY: height / 2,
  baseRadius: 240,
  currentRadius: 240,
};

const ripples = [];

class Ripple {
  constructor(x, y, power = 1) {
    this.x = x;
    this.y = y;
    this.radius = 10;
    this.maxRadius = Math.max(width, height) * 0.7 * power;
    this.opacity = 0.85 * power;
    this.speed = 12 * power;
  }
  update() {
    this.radius += this.speed;
    this.opacity *= 0.94;
  }
  draw(ctx) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(255, 255, 255, ${this.opacity * 0.4})`;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();
  }
}

// Background ambient dust particles
const dustCount = 85;
const dustParticles = [];
for (let i = 0; i < dustCount; i++) {
  dustParticles.push({
    x: Math.random() * width,
    y: Math.random() * height,
    vx: (Math.random() - 0.5) * 0.35,
    vy: (Math.random() - 0.5) * 0.35,
    size: Math.random() * 1.6 + 0.5,
  });
}

function drawGrid() {
  gCtx.fillStyle = '#000000';
  gCtx.fillRect(0, 0, width, height);

  // Smooth mouse lerp
  mouse.x += (mouse.targetX - mouse.x) * 0.08;
  mouse.y += (mouse.targetY - mouse.y) * 0.08;

  // Dynamic radius expansion with Mac Force Touch pressure
  const targetRadius = mouse.baseRadius * (1 + trackpadForce * 0.85);
  mouse.currentRadius += (targetRadius - mouse.currentRadius) * 0.1;

  // Render ripples
  for (let i = ripples.length - 1; i >= 0; i--) {
    const r = ripples[i];
    r.update();
    r.draw(gCtx);
    if (r.opacity < 0.02) ripples.splice(i, 1);
  }

  // Draw coordinate grid revealed in spotlight
  const gridSize = 48;
  const rad = mouse.currentRadius;
  const startX = Math.floor((mouse.x - rad) / gridSize) * gridSize;
  const endX = Math.ceil((mouse.x + rad) / gridSize) * gridSize;
  const startY = Math.floor((mouse.y - rad) / gridSize) * gridSize;
  const endY = Math.ceil((mouse.y + rad) / gridSize) * gridSize;

  for (let x = startX; x <= endX; x += gridSize) {
    for (let y = startY; y <= endY; y += gridSize) {
      const dist = Math.hypot(x - mouse.x, y - mouse.y);
      if (dist < rad) {
        const alpha = Math.pow(1 - dist / rad, 1.8) * (0.35 + trackpadForce * 0.4);

        gCtx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        gCtx.fillRect(x - 1, y - 1, 2, 2);

        if (dist < rad * 0.65) {
          const lineAlpha = (1 - dist / (rad * 0.65)) * (0.12 + trackpadForce * 0.2);
          gCtx.strokeStyle = `rgba(255, 255, 255, ${lineAlpha})`;
          gCtx.lineWidth = 0.5;

          gCtx.beginPath();
          gCtx.moveTo(x - 6, y);
          gCtx.lineTo(x + 6, y);
          gCtx.moveTo(x, y - 6);
          gCtx.lineTo(x, y + 6);
          gCtx.stroke();
        }
      }
    }
  }

  // Ambient dust particles
  dustParticles.forEach((p) => {
    p.x = (p.x + p.vx + width) % width;
    p.y = (p.y + p.vy + height) % height;

    const dist = Math.hypot(p.x - mouse.x, p.y - mouse.y);
    if (dist < rad * 1.3) {
      const alpha = (1 - dist / (rad * 1.3)) * (0.6 + trackpadForce * 0.4);
      gCtx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
      gCtx.beginPath();
      gCtx.arc(p.x, p.y, p.size * (1 + trackpadForce * 0.5), 0, Math.PI * 2);
      gCtx.fill();
    }
  });

  requestAnimationFrame(drawGrid);
}
drawGrid();

// --- 3. Three.js 3D Wireframe with Orbit Drag & Zoom ---
let scene, camera, renderer, wireframeMesh, outerRing, innerCore, starField;
let currentGeoIndex = 0;
const geometries = [];
const geometryNames = [
  '1/4: ICOSAHEDRON',
  '2/4: TORUS KNOT',
  '3/4: OCTAHEDRON',
  '4/4: DODECAHEDRON',
];

// Orbit drag variables
let isDragging = false;
let previousPointerPos = { x: 0, y: 0 };
const rotationVelocity = { x: 0, y: 0 };
let targetCameraZ = 7.0;

function initThreeJS() {
  const container = document.getElementById('webgl-canvas');
  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.z = 7.0;

  renderer = new THREE.WebGLRenderer({
    canvas: container,
    alpha: true,
    antialias: true,
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  // 1,500 Starfield for Scrollytelling Cosmic Depth
  const starGeo = new THREE.BufferGeometry();
  const starCount = 1500;
  const starPositions = new Float32Array(starCount * 3);
  for (let i = 0; i < starCount * 3; i += 3) {
    starPositions[i] = (Math.random() - 0.5) * 90;
    starPositions[i + 1] = (Math.random() - 0.5) * 90;
    starPositions[i + 2] = (Math.random() - 0.5) * 120 - 20;
  }
  starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
  const starMat = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 0.12,
    transparent: true,
    opacity: 0.5,
  });
  starField = new THREE.Points(starGeo, starMat);
  scene.add(starField);

  // Geometries list
  geometries.push(new THREE.IcosahedronGeometry(2.1, 1));
  geometries.push(new THREE.TorusKnotGeometry(1.4, 0.4, 100, 16));
  geometries.push(new THREE.OctahedronGeometry(2.4, 2));
  geometries.push(new THREE.DodecahedronGeometry(2.2, 1));

  // Wireframe material
  const wireMat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    wireframe: true,
    transparent: true,
    opacity: 0.45,
  });

  wireframeMesh = new THREE.Mesh(geometries[0], wireMat);
  scene.add(wireframeMesh);

  // Glowing inner core
  const coreMat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    wireframe: true,
    transparent: true,
    opacity: 0.18,
  });
  innerCore = new THREE.Mesh(new THREE.SphereGeometry(1.1, 12, 12), coreMat);
  scene.add(innerCore);

  // Outer orbital ring
  const ringMat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    wireframe: true,
    transparent: true,
    opacity: 0.22,
  });
  outerRing = new THREE.Mesh(new THREE.TorusGeometry(3.3, 0.02, 16, 80), ringMat);
  outerRing.rotation.x = Math.PI / 2.8;
  scene.add(outerRing);

  setupOrbitControls(container);
  animateThreeJS();
}

// Orbit Drag & Zoom handlers
function setupOrbitControls(canvas) {
  canvas.addEventListener('pointerdown', (e) => {
    isDragging = true;
    canvas.classList.add('grabbing');
    previousPointerPos = { x: e.clientX, y: e.clientY };
  });

  window.addEventListener('pointermove', (e) => {
    if (!isDragging) return;
    const deltaX = e.clientX - previousPointerPos.x;
    const deltaY = e.clientY - previousPointerPos.y;

    rotationVelocity.y += deltaX * 0.005;
    rotationVelocity.x += deltaY * 0.005;

    previousPointerPos = { x: e.clientX, y: e.clientY };

    if (typeof cosmicEngine !== 'undefined') {
      cosmicEngine.addEntropy(0.08, 'drag');
    }
  });

  window.addEventListener('pointerup', () => {
    isDragging = false;
    canvas.classList.remove('grabbing');
  });

  // Trackpad 2-finger gestures & Pinch zoom
  window.addEventListener('wheel', (e) => {
    if (e.ctrlKey) {
      // 2-Finger Pinch-to-zoom on Mac trackpad
      targetCameraZ = Math.min(11.5, Math.max(3.8, targetCameraZ + e.deltaY * 0.02));
    } else {
      // 2-Finger swipe on trackpad spins the 3D model!
      rotationVelocity.y += e.deltaX * 0.0016;
      rotationVelocity.x += e.deltaY * 0.0016;
    }

    if (typeof cosmicEngine !== 'undefined') {
      cosmicEngine.addEntropy(0.04, 'wheel');
    }
  }, { passive: true });
}

let scrollY = 0;
window.addEventListener('scroll', () => {
  scrollY = window.scrollY;
  const maxScroll = document.body.scrollHeight - window.innerHeight;
  const progress = Math.min(1, Math.max(0, scrollY / (maxScroll || 1)));

  const coordTracker = document.getElementById('coords');
  if (coordTracker) {
    coordTracker.textContent = `X: ${Math.round(mouse.targetX)} | Y: ${Math.round(mouse.targetY)} | DEPTH: ${(progress * 100).toFixed(0)}%`;
  }

  if (typeof cosmicEngine !== 'undefined') {
    cosmicEngine.addEntropy(0.03, 'scroll');
  }
});

const freqBuffer = new Uint8Array(32);

function animateThreeJS() {
  requestAnimationFrame(animateThreeJS);

  const normX = (mouse.x / width) * 2 - 1;
  const normY = -(mouse.y / height) * 2 + 1;

  // --- Scrollytelling 3D Camera Voyage ---
  const maxScroll = Math.max(1, document.body.scrollHeight - window.innerHeight);
  const scrollProg = Math.min(1, Math.max(0, scrollY / maxScroll));

  // Multi-chapter camera depth journey through deep space:
  // Chapter 00 (Hero: 0.0 -> 0.22): Observational distance (Z = 7.0 -> 3.8, plunging toward singularity)
  // Chapter 01 (Collider Lab: 0.22 -> 0.55): Core inspection inside particle horizon (Z = 3.8 -> 5.2)
  // Chapter 02 (Stellar Nucleosynthesis: 0.55 -> 0.78): Orbital geometry vantage (Z = 5.2 -> 6.5)
  // Chapter 03 (Cyclic Big Bounce: 0.78 -> 1.0): Expansive cosmic perspective (Z = 6.5 -> 8.8)
  let scrollyTargetZ = 7.0;
  if (scrollProg < 0.22) {
    const t = scrollProg / 0.22;
    scrollyTargetZ = 7.0 - t * 3.2; // Plunge forward into the core!
  } else if (scrollProg < 0.55) {
    const t = (scrollProg - 0.22) / 0.33;
    scrollyTargetZ = 3.8 + t * 1.4;
  } else if (scrollProg < 0.78) {
    const t = (scrollProg - 0.55) / 0.23;
    scrollyTargetZ = 5.2 + t * 1.3;
  } else {
    const t = (scrollProg - 0.78) / 0.22;
    scrollyTargetZ = 6.5 + t * 2.3; // Wide expansive cosmology
  }

  // Combine scrollytelling path with user 2-finger trackpad zoom offset
  const userZoomOffset = targetCameraZ - 7.0;
  const effectiveCameraZ = scrollyTargetZ + userZoomOffset;
  camera.position.z += (effectiveCameraZ - camera.position.z) * 0.08;

  // Starfield gentle drift and dynamic parallax depth
  if (starField) {
    starField.rotation.y += 0.0003;
    starField.rotation.x += 0.00015;
    starField.position.y = scrollY * 0.002;
    starField.position.z = (scrollY * 0.008) % 30;
  }

  // Audio-reactive frequency sampling
  let bassFactor = 0;
  if (audio.analyser && !audio.isMuted) {
    audio.analyser.getByteFrequencyData(freqBuffer);
    // Average first 4 frequency bins for bass
    const bass = (freqBuffer[0] + freqBuffer[1] + freqBuffer[2] + freqBuffer[3]) / 4;
    bassFactor = bass / 255;
  }

  if (wireframeMesh) {
    // Apply inertia and dragging velocity
    wireframeMesh.rotation.y += rotationVelocity.y;
    wireframeMesh.rotation.x += rotationVelocity.x;

    rotationVelocity.x *= 0.92;
    rotationVelocity.y *= 0.92;

    // Default gentle drift + cursor tracking
    wireframeMesh.rotation.y += 0.003;
    wireframeMesh.rotation.x += 0.0015;

    wireframeMesh.rotation.x += (normY * 0.35 - wireframeMesh.rotation.x) * 0.02;
    wireframeMesh.rotation.y += (normX * 0.45 - wireframeMesh.rotation.y) * 0.02;

    // Smooth lateral translation based on chapter journey
    const lateralShift = Math.sin(scrollProg * Math.PI * 2) * 1.2;
    wireframeMesh.position.x += (lateralShift - wireframeMesh.position.x) * 0.05;
    wireframeMesh.position.y = -scrollY * 0.0008;

    // Audio Reactive Scale + Mac Force Touch Expansion + Cosmological Epoch Scale
    const epochScale = (typeof cosmicEngine !== 'undefined') ? cosmicEngine.getVisualScale() : 1.0;
    const scale = (1 + bassFactor * 0.22 + trackpadForce * 0.38) * epochScale;
    wireframeMesh.scale.set(scale, scale, scale);

    // Outer orbital ring rotation & pulse
    if (outerRing) {
      outerRing.rotation.z += 0.004;
      outerRing.rotation.y = normX * 0.3 + scrollProg * 1.5;
      const ringScale = 1 + bassFactor * 0.15 + trackpadForce * 0.25;
      outerRing.scale.set(ringScale, ringScale, ringScale);
    }

    if (innerCore) {
      innerCore.rotation.y -= 0.006;
      const coreScale = 1 + bassFactor * 0.4;
      innerCore.scale.set(coreScale, coreScale, coreScale);
    }

    // Update 3D Spatial Audio coordinates based on mesh rotation & position
    if (audio.spatialPanner) {
      const spatialX = Math.sin(wireframeMesh.rotation.y) * 3;
      const spatialZ = Math.cos(wireframeMesh.rotation.y) * 3;
      audio.updateSpatialPosition(spatialX, wireframeMesh.position.y, spatialZ);
    }
  }

  renderer.render(scene, camera);
}

// Morph to next 3D geometry and update HUD badges
function morphGeometry() {
  currentGeoIndex = (currentGeoIndex + 1) % geometries.length;
  wireframeMesh.geometry = geometries[currentGeoIndex];

  const currentName = geometryNames[currentGeoIndex];
  const activeGeoText = document.getElementById('active-geo-text');
  const cardGeoStatus = document.getElementById('card-geo-status');
  const stellarGeoIndicator = document.getElementById('stellar-geo-indicator');
  const geoSpecName = document.getElementById('geo-spec-name');

  if (activeGeoText) activeGeoText.textContent = currentName;
  if (cardGeoStatus) cardGeoStatus.textContent = currentName;
  if (geoSpecName) geoSpecName.textContent = currentName;
  if (stellarGeoIndicator) {
    stellarGeoIndicator.textContent = currentName.replace(/^\d\/\d:\s*/, '');
  }

  audio.triggerChime(587.33, 'triangle', 0.6, 0, 0); // D5
}

// --- 4. Mac Force Touch Trackpad Integration ---
const forceMeter = document.getElementById('force-meter');
const cursorRing = document.getElementById('cursor-ring');

function updateForce(rawForce) {
  // Calibrate analog pressure curve:
  // Pre-click / touch: 0% to 49%
  // Standard click threshold: 50%
  // Deep WebKit Force Touch (1.0 to 2.0): 50% to 100%
  let normalized = 0;
  if (rawForce > 1.0) {
    // Deep Apple Force Touch press
    normalized = 0.5 + Math.min(1.0, rawForce - 1.0) * 0.5;
  } else if (rawForce > 0) {
    // Light touch before click or standard pointer pressure
    normalized = rawForce * 0.5;
  }
  trackpadForce = Math.max(0, Math.min(1.0, normalized));

  if (forceMeter) {
    if (trackpadForce > 0.02) {
      forceMeter.classList.add('active');
      forceMeter.textContent = `FORCE: ${(trackpadForce * 100).toFixed(0)}%`;
    } else {
      forceMeter.classList.remove('active');
      forceMeter.textContent = `FORCE: 0%`;
    }
  }

  if (cursorRing) {
    if (trackpadForce > 0.02) {
      cursorRing.style.borderWidth = `${1 + trackpadForce * 3}px`;
      cursorRing.style.boxShadow = `0 0 ${20 * trackpadForce}px rgba(255, 255, 255, 0.85)`;
      cursorRing.style.borderColor = '#ffffff';
    } else {
      cursorRing.style.borderWidth = '1px';
      cursorRing.style.boxShadow = 'none';
      cursorRing.style.borderColor = 'rgba(255, 255, 255, 0.3)';
    }
  }

  audio.modulateWithCursor(mouse.targetX / width, mouse.targetY / height, trackpadForce);
  if (typeof cosmicEngine !== 'undefined' && trackpadForce > 0.05) {
    cosmicEngine.addEntropy(trackpadForce * 0.15, 'force');
  }
}

// Safari / WebKit Apple Force Touch Events
window.addEventListener('webkitmouseforcechanged', (e) => {
  updateForce(e.webkitForce || 0);
});

window.addEventListener('webkitmouseforcedown', () => {
  ripples.push(new Ripple(mouse.x, mouse.y, 1.8));
  audio.triggerChime(329.63, 'triangle', 0.9, 0, 0); // E4
  if (typeof cosmicEngine !== 'undefined') cosmicEngine.addEntropy(0.5, 'forcedown');
});

window.addEventListener('webkitmouseforceup', () => {
  updateForce(0);
});

// W3C Pointer Events Pressure fallback
window.addEventListener('pointermove', (e) => {
  if (e.pressure > 0) {
    updateForce(e.pressure);
  }
});

window.addEventListener('pointerup', () => {
  updateForce(0);
});

// --- 5. Custom Cursor & Spotlight Tracking ---
const cursorDot = document.getElementById('cursor-dot');

window.addEventListener('mousemove', (e) => {
  mouse.targetX = e.clientX;
  mouse.targetY = e.clientY;

  if (cursorDot) {
    cursorDot.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
  }
  if (cursorRing && !isDragging) {
    cursorRing.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
  }

  const coordTracker = document.getElementById('coords');
  if (coordTracker) {
    coordTracker.textContent = `X: ${e.clientX} | Y: ${e.clientY}`;
  }

  audio.modulateWithCursor(e.clientX / width, e.clientY / height, trackpadForce);
  if (typeof cosmicEngine !== 'undefined') {
    cosmicEngine.addEntropy(0.025, 'move');
  }
});

// Click shockwave ripple
window.addEventListener('click', (e) => {
  if (e.target.closest('button, a, .controls-drawer, .universe-drawer, .timeline-drawer')) return;
  ripples.push(new Ripple(e.clientX, e.clientY, 1.2));
  audio.triggerChime(523.25, 'sine', 0.7, (e.clientX / width) * 2 - 1, (e.clientY / height) * 2 - 1);
  if (typeof cosmicEngine !== 'undefined') {
    cosmicEngine.addEntropy(0.65, 'click');
  }
});

// --- 6. Sound Toggle, Hero Button Sync & Auto-Arpeggiator ---
function syncAudioButtons(isPlaying) {
  const soundToggle = document.getElementById('sound-toggle');
  const heroSoundToggle = document.getElementById('hero-sound-toggle');
  const cosmicMusicBtn = document.getElementById('cosmic-music-btn');
  const cosmicMusicLabel = document.getElementById('cosmic-music-label');
  const beatTrackBtn = document.getElementById('beat-track-toggle');
  const beatTrackStatus = document.getElementById('beat-track-status');
  const beatTrackIcon = document.getElementById('beat-track-icon');

  if (soundToggle) {
    if (isPlaying) {
      soundToggle.classList.add('active');
      const stateSpan = soundToggle.querySelector('.sound-state');
      if (stateSpan) stateSpan.textContent = 'SOUND: ON';
    } else {
      soundToggle.classList.remove('active');
      const stateSpan = soundToggle.querySelector('.sound-state');
      if (stateSpan) stateSpan.textContent = 'SOUND: OFF';
    }
  }

  if (heroSoundToggle) {
    if (isPlaying) {
      heroSoundToggle.classList.add('active');
      heroSoundToggle.textContent = 'DEACTIVATE AUDIO';
      heroSoundToggle.style.borderColor = '#ffffff';
      heroSoundToggle.style.backgroundColor = 'rgba(255, 255, 255, 0.12)';
      heroSoundToggle.style.boxShadow = '0 0 20px rgba(255, 255, 255, 0.2)';
    } else {
      heroSoundToggle.classList.remove('active');
      heroSoundToggle.textContent = 'ACTIVATE AUDIO';
      heroSoundToggle.style.borderColor = 'var(--border-subtle)';
      heroSoundToggle.style.backgroundColor = 'transparent';
      heroSoundToggle.style.boxShadow = 'none';
    }
  }

  if (cosmicMusicBtn) {
    if (isPlaying) {
      cosmicMusicBtn.classList.add('active');
      if (cosmicMusicLabel) cosmicMusicLabel.textContent = 'STOP COSMIC MUSIC';
    } else {
      cosmicMusicBtn.classList.remove('active');
      if (cosmicMusicLabel) cosmicMusicLabel.textContent = 'START COSMIC MUSIC';
    }
  }

  if (beatTrackBtn) {
    if (isPlaying) {
      beatTrackBtn.classList.add('active');
      if (beatTrackStatus) beatTrackStatus.textContent = 'GENERATIVE STREAM: ACTIVE';
      if (beatTrackIcon) beatTrackIcon.textContent = '||';
    } else {
      beatTrackBtn.classList.remove('active');
      if (beatTrackStatus) beatTrackStatus.textContent = 'GENERATIVE STREAM: OFF';
      if (beatTrackIcon) beatTrackIcon.textContent = '>';
    }
  }
}

const soundToggle = document.getElementById('sound-toggle');
if (soundToggle) {
  soundToggle.addEventListener('click', () => {
    audio.toggle();
  });
}

const heroSoundToggle = document.getElementById('hero-sound-toggle');
if (heroSoundToggle) {
  heroSoundToggle.addEventListener('click', () => {
    audio.toggle();
  });
}


// Auto-Arpeggiator loop
let arpTimer = null;
let isArpActive = false;
const arpNotes = [130.81, 164.81, 220, 277.18, 329.63, 440, 329.63, 220];
let arpIndex = 0;

function toggleArpeggiator() {
  audio.init();
  if (audio.isMuted) audio.toggle();

  isArpActive = !isArpActive;
  const arpBtn = document.getElementById('arp-toggle');
  const arpStatus = document.getElementById('arp-status');

  if (isArpActive) {
    if (arpBtn) arpBtn.classList.add('active');
    if (arpStatus) arpStatus.textContent = 'ARPEGGIATOR: ON';

    arpTimer = setInterval(() => {
      const freq = arpNotes[arpIndex % arpNotes.length];
      const panX = Math.sin((arpIndex / arpNotes.length) * Math.PI * 2);
      audio.triggerChime(freq, 'sine', 0.45, panX, 0);

      // Flash corresponding button visually
      const matchingKey = document.querySelector(`.synth-key[data-freq="${freq}"]`);
      if (matchingKey) {
        matchingKey.classList.add('active-key');
        setTimeout(() => matchingKey.classList.remove('active-key'), 160);
      }

      arpIndex++;
    }, 240);
  } else {
    if (arpBtn) arpBtn.classList.remove('active');
    if (arpStatus) arpStatus.textContent = 'ARPEGGIATOR: OFF';
    clearInterval(arpTimer);
    arpTimer = null;
  }
}

const arpBtn = document.getElementById('arp-toggle');
if (arpBtn) {
  arpBtn.addEventListener('click', toggleArpeggiator);
}

// --- 6B. Ever-Evolving Cosmic Universe Music Engine & Memories ---

const COSMIC_EPOCHS = [
  {
    id: 0,
    key: 'ambient',
    name: '00 // AMBIENT VOID',
    time: 'T + 0.00 GYR',
    bpm: 70,
    title: 'Ambient Void',
    desc: 'Deep sub-frequency meditation (36.7Hz) and generative spatial chimes.',
    visualScale: 0.65
  },
  {
    id: 1,
    key: 'dnb',
    name: '01 // DNB NEUROFUNK',
    time: 'T + 2.50 GYR',
    bpm: 174,
    title: 'Neurofunk & Amen Breaks',
    desc: 'Rapid 174 BPM syncopated breakbeats and detuned Reese sub-bass (Chase & Status / Noisia).',
    visualScale: 1.2
  },
  {
    id: 2,
    key: 'techno',
    name: '02 // ACID WAREHOUSE',
    time: 'T + 4.50 GYR',
    bpm: 135,
    title: 'Warehouse Acid Techno',
    desc: 'Driving 909 kicks, distorted 303 acid bassline squelches, and rolling hats (Charlotte de Witte / 999999999 / Amelie Lens).',
    visualScale: 1.0
  },
  {
    id: 3,
    key: 'dubstep',
    name: '03 // SKRILLEX BASS',
    time: 'T + 9.80 GYR',
    bpm: 145,
    title: 'Heavy Formant Bass & Dubstep',
    desc: 'Aggressive vocal throat growls, half-time riddim, and 808 sub drops (Skrillex / Space Laces).',
    visualScale: 1.3
  },
  {
    id: 4,
    key: 'bounce',
    name: '04 // THE BIG BOUNCE',
    time: 'T + 13.80 GYR',
    bpm: 128,
    title: 'The Big Bounce & Rebirth',
    desc: 'Cyclic contraction glissando rebounding into higher-dimensional rebirth!',
    visualScale: 1.45
  }
];

class CosmicUniverseEngine {
  constructor() {
    this.epochIndex = 2; // Start in Epoch 2 (Stellar Techno) for immediate musical delight
    this.entropy = 15.0; // Starts at 15%
    this.isPaused = false;
    this.isMusicPlaying = false;
    this.aeonCycle = 1;
    this.beatStep = 0;
    this.beatTimer = null;
    this.bounceProgress = 0;
    this.memories = [];
    this.speechSynth = window.speechSynthesis || null;

    this.loadSavedState();
  }

  getCurrentEpoch() {
    return COSMIC_EPOCHS[this.epochIndex];
  }

  getVisualScale() {
    const ep = this.getCurrentEpoch();
    if (this.epochIndex === 4) {
      // Big bounce pulsating oscillation
      return 0.2 + Math.abs(Math.sin(Date.now() * 0.003)) * 1.3;
    }
    if (this.epochIndex === 3) {
      // Turbulent wobble jitter
      return ep.visualScale + Math.sin(Date.now() * 0.015) * 0.12;
    }
    return ep.visualScale;
  }

  addEntropy(amount, source) {
    if (this.isPaused) return;

    // Modulate entropy increment
    this.entropy += amount;

    if (this.entropy >= 100) {
      this.entropy = 0;
      this.advanceEpoch();
    } else {
      this.updateTelemetryHUD();
    }
  }

  advanceEpoch() {
    const prevEpoch = this.epochIndex;
    this.epochIndex = (this.epochIndex + 1) % COSMIC_EPOCHS.length;

    if (this.epochIndex === 0) {
      this.aeonCycle++;
      // The Big Bounce complete: Reborn in higher octave
      audio.playBigBounceChord();
      if (typeof morphGeometry === 'function') morphGeometry();
    } else if (this.epochIndex === 1) {
      audio.playSubDrop();
    }

    const newEpoch = this.getCurrentEpoch();
    audio.setGenre(newEpoch.key);
    this.syncGenrePills(newEpoch.key);
    this.announceEpoch(newEpoch);
    this.updateTelemetryHUD();

    // Trigger visual matrix shockwave
    ripples.push(new Ripple(width / 2, height / 2, 2.4));
  }

  setEpoch(index, announce = true) {
    this.epochIndex = Math.max(0, Math.min(COSMIC_EPOCHS.length - 1, index));
    this.entropy = 0;
    const epoch = this.getCurrentEpoch();
    audio.setGenre(epoch.key);
    this.syncGenrePills(epoch.key);
    if (announce) this.announceEpoch(epoch);
    this.updateTelemetryHUD();
  }

  announceEpoch(epoch) {
    // 1. Play musical epoch transition chord
    if (!audio.isMuted) {
      const chords = [
        [55, 110, 220],
        [130.81, 196.0, 261.63],
        [220, 277.18, 329.63, 440],
        [73.4, 110, 146.8],
        [261.63, 329.63, 392.00, 523.25]
      ];
      const chord = chords[epoch.id] || chords[0];
      chord.forEach((f, i) => {
        setTimeout(() => audio.triggerChime(f, 'sine', 0.65, (i - 1) * 0.4, 0), i * 60);
      });
    }

    // 2. Synthetic voice announcement (subtle futuristic computer voice)
    if (this.speechSynth && !audio.isMuted) {
      try {
        this.speechSynth.cancel();
        const utterance = new SpeechSynthesisUtterance(`${epoch.title} initialized`);
        utterance.rate = 1.05;
        utterance.pitch = 0.85;
        utterance.volume = 0.35;
        this.speechSynth.speak(utterance);
      } catch (e) {}
    }
  }

  togglePause() {
    this.isPaused = !this.isPaused;
    this.updateTelemetryHUD();

    const pauseLabel = document.getElementById('cosmic-pause-label');
    const freezeStatus = document.getElementById('freeze-evolution-status');
    const heroSoundBtn = document.getElementById('hero-pause-toggle');

    if (this.isPaused) {
      if (pauseLabel) pauseLabel.textContent = 'RESUME EVOLUTION';
      if (freezeStatus) freezeStatus.textContent = 'RESUME TIME';
      audio.triggerChime(329.63, 'triangle', 0.4, 0, 0);
    } else {
      if (pauseLabel) pauseLabel.textContent = 'FREEZE EVOLUTION';
      if (freezeStatus) freezeStatus.textContent = 'FREEZE TIME';
      audio.triggerChime(554.37, 'sine', 0.4, 0, 0);
    }
  }

  updateTelemetryHUD() {
    const epoch = this.getCurrentEpoch();
    this.syncGenrePills(epoch.key);

    const epochBadge = document.getElementById('epoch-name-badge');
    if (epochBadge) {
      epochBadge.textContent = `${epoch.name} [AEON ${this.aeonCycle}]`;
    }

    const timeBadge = document.getElementById('cosmic-time-badge');
    if (timeBadge) {
      timeBadge.textContent = epoch.time;
    }

    const statusBadge = document.getElementById('cosmic-status-badge');
    if (statusBadge) {
      if (this.isPaused) {
        statusBadge.textContent = 'TIME FROZEN';
        statusBadge.className = 'stat-pill status-frozen';
      } else {
        statusBadge.textContent = this.isMusicPlaying ? 'EVOLVING ACTIVE' : 'OBSERVING';
        statusBadge.className = 'stat-pill status-active';
      }
    }

    const entropyVal = document.getElementById('entropy-text-val');
    if (entropyVal) {
      entropyVal.textContent = `${this.entropy.toFixed(1)}%`;
    }

    const entropyFill = document.getElementById('entropy-bar-fill');
    if (entropyFill) {
      entropyFill.style.width = `${Math.min(100, Math.max(0, this.entropy))}%`;
    }
  }

  syncGenrePills(genreKey) {
    document.querySelectorAll('.genre-pill').forEach((pill) => {
      const pGenre = pill.getAttribute('data-genre');
      if (pGenre === genreKey || (pGenre === 'techno' && genreKey === 'stellar') || (pGenre === 'ambient' && genreKey === 'inflation') || (pGenre === 'dubstep' && genreKey === 'turbulence')) {
        pill.classList.add('active');
      } else {
        pill.classList.remove('active');
      }
    });
  }

  // --- Cosmic Memories Bank ---
  loadSavedState() {
    const saved = localStorage.getItem('void_cosmic_memories');
    if (saved) {
      try {
        this.memories = JSON.parse(saved);
      } catch (e) {
        this.memories = [];
      }
    }

    // Seed default baseline memories if empty
    if (!this.memories || this.memories.length === 0) {
      this.memories = [
        { id: 'mem-1', name: 'Memory α: The Primordial Singularity', epochIndex: 0, entropy: 10, time: '0.00 GYR', date: 'Genesis' },
        { id: 'mem-2', name: 'Memory β: Inflation Shockwave', epochIndex: 1, entropy: 45, time: '0.01 GYR', date: 'Inflation' },
        { id: 'mem-3', name: 'Memory γ: Galactic Cyber Techno', epochIndex: 2, entropy: 68, time: '4.50 GYR', date: 'Galactic Dawn' }
      ];
      this.saveMemoriesToStorage();
    }

    this.renderMemoryShelf();
  }

  saveMemory(customName) {
    const epoch = this.getCurrentEpoch();
    const count = this.memories.length + 1;
    const name = customName || `Memory ${count}: ${epoch.title.split('&')[0].trim()}`;

    const memoryItem = {
      id: `mem-${Date.now()}`,
      name: name,
      epochIndex: this.epochIndex,
      entropy: Math.round(this.entropy),
      time: epoch.time,
      date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    this.memories.unshift(memoryItem);
    if (this.memories.length > 8) this.memories.pop(); // Keep top 8 memories
    this.saveMemoriesToStorage();
    this.renderMemoryShelf();

    // Confirmation chime
    audio.triggerChime(880, 'sine', 0.5, 0, 0);

    const lastKeyHud = document.getElementById('last-key-hud');
    if (lastKeyHud) {
      lastKeyHud.textContent = `MEMORY SAVED: [ ${name.slice(0, 18)}... ]`;
      lastKeyHud.classList.add('flash');
      setTimeout(() => lastKeyHud.classList.remove('flash'), 300);
    }
  }

  restoreMemory(id) {
    const mem = this.memories.find((m) => m.id === id);
    if (!mem) return;

    this.epochIndex = mem.epochIndex;
    this.entropy = mem.entropy || 0;
    const epoch = this.getCurrentEpoch();

    audio.init();
    if (audio.isMuted) audio.toggle();
    audio.setGenre(epoch.key);
    this.syncGenrePills(epoch.key);
    this.updateTelemetryHUD();

    // Warp frequency glissando
    audio.triggerChime(329.63, 'sawtooth', 0.4, -0.5, 0);
    setTimeout(() => audio.triggerChime(659.25, 'sine', 0.5, 0.5, 0), 100);

    this.renderMemoryShelf(id);
    ripples.push(new Ripple(width / 2, height / 2, 2.0));
  }

  deleteMemory(id, e) {
    if (e) e.stopPropagation();
    this.memories = this.memories.filter((m) => m.id !== id);
    this.saveMemoriesToStorage();
    this.renderMemoryShelf();
    audio.triggerChime(220, 'sine', 0.2, 0, 0);
  }

  saveMemoriesToStorage() {
    try {
      localStorage.setItem('void_cosmic_memories', JSON.stringify(this.memories));
    } catch (e) {}
  }

  renderMemoryShelf(activeId) {
    const shelf = document.getElementById('memory-shelf');
    const badge = document.getElementById('memory-count-badge');
    if (!shelf) return;

    if (badge) badge.textContent = `${this.memories.length} MEMORIES`;
    shelf.innerHTML = '';

    this.memories.forEach((mem) => {
      const chip = document.createElement('button');
      chip.className = `memory-chip ${mem.id === activeId ? 'active' : ''}`;
      chip.setAttribute('aria-label', `Restore ${mem.name}`);
      chip.innerHTML = `
        <span class="chip-index">//</span>
        <span>${mem.name} [${mem.time}]</span>
        <span class="memory-delete-btn" title="Delete memory">&times;</span>
      `;

      chip.addEventListener('click', () => this.restoreMemory(mem.id));
      const delBtn = chip.querySelector('.memory-delete-btn');
      if (delBtn) {
        delBtn.addEventListener('click', (ev) => this.deleteMemory(mem.id, ev));
      }

      shelf.appendChild(chip);
    });
  }

  // --- Step Routine & Playback Engine ---
  startPlayback() {
    audio.init();
    if (audio.isMuted) audio.toggle();
    if (audio.ctx && audio.ctx.state === 'suspended') {
      audio.ctx.resume();
    }

    this.isMusicPlaying = true;
    this.syncTransportButtons(true);

    const getStepInterval = () => {
      const ep = this.getCurrentEpoch();
      if (ep.bpm === 174) return 86;   // 174 BPM 16th notes (DnB)
      if (ep.bpm === 145) return 103;  // 145 BPM 16th notes (Dubstep)
      if (ep.bpm === 135) return 111;  // 135 BPM 16th notes (Acid Techno)
      if (ep.bpm === 128) return 117;  // 128 BPM (Bounce)
      if (ep.bpm === 70) return 214;   // 70 BPM (Ambient Void)
      return 115;
    };

    const stepRoutine = () => {
      if (!this.isMusicPlaying) return;
      const s = this.beatStep % 16;
      const measure = Math.floor(this.beatStep / 16) % 32; // 32-bar macro cycle
      const section = Math.floor(measure / 8); // 0: Intro, 1: Build, 2: Peak, 3: Breakdown
      const localBar = measure % 8;
      const now = audio.ctx.currentTime;
      const ep = this.getCurrentEpoch();

      // Subtle interaction-free baseline cosmic drift (+0.04 entropy per beat)
      if (!this.isPaused) {
        this.addEntropy(0.04, 'auto-drift');
      }

      // Update live parameter & bar tracker with 32-bar section awareness
      const barTracker = document.getElementById('live-bar-tracker');
      if (barTracker && s === 0) {
        const sectionNames = ['INTRO GROOVE', 'BUILD TENSION', 'PEAK ENERGY', 'BREAKDOWN'];
        const sectionName = sectionNames[section] || 'EVOLVING';
        if (localBar === 7) {
          barTracker.textContent = `BAR: ${measure + 1}/32 // ${sectionName} TURNAROUND`;
          barTracker.style.color = '#ffffff';
        } else if (section === 2) {
          barTracker.textContent = `BAR: ${measure + 1}/32 // ${sectionName}`;
          barTracker.style.color = '#ffffff';
        } else {
          barTracker.textContent = `BAR: ${measure + 1}/32 // ${sectionName}`;
          barTracker.style.color = 'var(--text-secondary)';
        }
      }

      if (ep.key === 'techno' || ep.key === 'acid') {
        // --- 135 BPM ACID WAREHOUSE ---
        // Charlotte de Witte / Amelie Lens / 999999999 / Ben Klock / Kobosil / FJAAK / Dax J

        // Kick: rumble kick on peak section, standard on others
        if (s === 0 || s === 4 || s === 8 || s === 12) {
          if (section >= 1) {
            audio.playRumbleKick(now); // Ben Klock rumble tail + sidechain duck
          } else {
            audio.playKick(now);
            audio.triggerSidechain(now);
          }
        }

        // Hats: velocity-varied rolling 16ths with open offbeats (Amelie Lens)
        if (s === 2 || s === 6 || s === 10 || s === 14) {
          audio.playHiHat(true, now);
        } else {
          audio.playHiHat(false, now);
        }

        // Ride cymbal: introduced in Build section and beyond (Amelie Lens rolling energy)
        if (section >= 1 && (s === 0 || s === 4 || s === 8 || s === 12)) {
          audio.playRideCymbal(now);
        }

        // Metallic percussion clank on offbeats during Peak (Kobosil industrial texture)
        if (section === 2 && (s === 3 || s === 11)) {
          audio.playMetalClank(now);
        }

        // Ghost snares on random steps during Build and Peak (Paula Temple chaos)
        if (section >= 1 && Math.random() < 0.15 && s % 2 === 1) {
          audio.playGhostSnare(now);
        }

        // TB-303 Acid Bassline: dual stacking on Peak section (999999999)
        const acidNotes = [55, 55, 110, 55, 73.4, 55, 110, 82.4, 55, 55, 130.8, 110, 55, 82.4, 110, 55];
        let noteFreq = acidNotes[s];
        // FJAAK melodic variation: wider note range on Build section
        if (section === 1) {
          const buildNotes = [55, 65.4, 110, 82.4, 73.4, 98, 110, 130.8, 55, 73.4, 130.8, 110, 65.4, 82.4, 110, 55];
          noteFreq = buildNotes[s];
        }
        // Harmonic shift on bars 4 and 8 of each section
        if (localBar === 3 || localBar === 7) {
          noteFreq *= 1.5; // Perfect 5th
        }
        // Transpose up on Peak for maximum energy
        if (section === 2) noteFreq *= 1.25;

        const isAccent = (s === 2 || s === 6 || s === 10 || s === 14);
        const isSlide = (s === 7 || s === 14);
        const targetSlideFreq = isSlide ? noteFreq * 1.33 : null;

        if (section === 2) {
          // PEAK: dual 303 stacking (999999999 double acid voices)
          audio.playDual303Acid(noteFreq, now, isAccent, isSlide, targetSlideFreq);
        } else if (section === 3 && localBar >= 4) {
          // Breakdown: strip acid on last 4 bars, let rumble breathe
          if (s % 4 === 0) {
            audio.play303Acid(noteFreq * 0.5, now, false, false, null);
          }
        } else {
          audio.play303Acid(noteFreq, now, isAccent, isSlide, targetSlideFreq);
        }

        // Climax turnaround snare roll on last bar of each section
        if (localBar === 7 && s >= 12) {
          audio.playSnare(now, true);
        }

        // Breakdown noise sweep riser on section 3 bars 6-7
        if (section === 3 && localBar >= 6 && s === 0) {
          audio.playSubDrop();
        }

      } else if (ep.key === 'dnb') {
        // --- 174 BPM DNB NEUROFUNK ---
        // Chase & Status / Noisia / Mefjus / Camo & Krooked / Current Value

        // Syncopated Amen breakbeat
        if (s === 0 || s === 7 || s === 10) {
          audio.playKick(now);
          audio.triggerSidechain(now);
        }
        if (s === 4 || s === 12) {
          audio.playSnare(now, false);
        }

        // Rapid 16th hats with velocity variation
        const hatOpen = s % 4 === 2;
        audio.playHiHat(hatOpen, now);

        // Ghost snare hits on random offbeats for controlled chaos (Current Value)
        if (section >= 1 && Math.random() < 0.2 && s % 2 === 1) {
          audio.playGhostSnare(now);
        }

        // Bass: alternate between Reese (classic) and FM bass (Mefjus) by section
        if (s === 0 || s === 8) {
          const bassNotes = [55, 65.4, 73.4, 49.0, 61.7, 55, 82.4, 49.0];
          const bassFreq = bassNotes[measure % bassNotes.length];

          if (section === 0 || section === 3) {
            // Intro & Breakdown: classic Reese (Chase & Status)
            audio.playReese(bassFreq, now, 0.38);
          } else {
            // Build & Peak: FM bass (Mefjus / Noisia metallic wobble)
            const modFreq = bassFreq * (2 + Math.random() * 3);
            const modDepth = 200 + section * 150;
            audio.playFMBass(bassFreq, modFreq, modDepth, now, 0.4);
          }
        }

        // Reese pad layer underneath on Peak (Camo & Krooked warmth)
        if (section === 2 && s === 0 && localBar % 2 === 0) {
          audio.playReese(110, now, 0.6); // Long pad-like Reese
        }

        // Ride on build and peak sections
        if (section >= 1 && section <= 2 && s % 4 === 0) {
          audio.playRideCymbal(now);
        }

        // Snare rush turnaround
        if (localBar === 7 && s >= 12) {
          audio.playSnare(now, true);
        }

        // Sub drop on breakdown transition
        if (section === 3 && localBar === 7 && s === 0) {
          audio.playSubDrop();
        }

      } else if (ep.key === 'dubstep') {
        // --- 145 BPM SKRILLEX BASS & GROWL ---
        // Skrillex / Space Laces / Virtual Riot / Must Die! / Trampa

        // Half-time beat
        if (s === 0 || s === 10) {
          audio.playKick(now);
          audio.triggerSidechain(now);
        }
        if (s === 8) audio.playSnare(now, false);

        // Ghost hats with velocity variation
        if (s % 2 === 0) {
          audio.playHiHat(s === 4 || s === 12, now);
        }

        // Bass design varies by 32-bar section
        if (s === 2 || s === 4 || s === 6 || s === 12 || s === 14) {
          const growlNotes = [55, 73.4, 82.4, 55, 65.4, 49.0, 73.4, 82.4];
          const growlFreq = growlNotes[(s / 2 + measure) % growlNotes.length];

          if (section === 2) {
            // PEAK: Advanced growl with LFO chop + ring mod (Virtual Riot / Must Die!)
            audio.playSkrillexGrowlAdvanced(growlFreq, now, 0.28);
          } else {
            // Standard Skrillex formant growl
            audio.playSkrillexGrowl(growlFreq, now, 0.25);
          }
        }

        // 808 sub layer underneath growls on all sections (Trampa devastating sub)
        if (s === 0 && localBar % 2 === 0) {
          const subNotes = [36.7, 41.2, 32.7, 36.7];
          audio.play808Sub(subNotes[section], now, 0.55);
        }

        // Metallic clank on peak section (Must Die! industrial texture)
        if (section === 2 && (s === 5 || s === 13)) {
          audio.playMetalClank(now);
        }

        // Sub-drop on bar transitions
        if (localBar === 7 && s === 0) {
          audio.playSubDrop();
        }

        // Ghost snares during build and peak
        if (section >= 1 && Math.random() < 0.12 && s % 2 === 1) {
          audio.playGhostSnare(now);
        }

      } else if (ep.key === 'bounce') {
        // The Big Bounce crunch into celestial rebirth
        if (s < 8) {
          const crunchFreqs = [440, 392, 329.63, 261.63, 196, 164.8, 130.8, 82.4];
          audio.triggerChime(crunchFreqs[s], 'sawtooth', 0.15, 0, 0);
          if (s % 2 === 0) audio.playKick(now);
        } else if (s === 8 || s === 9 || s === 10 || s === 11) {
          // Silence vacuum
        } else if (s === 12) {
          audio.playBigBounceChord();
          audio.playKick(now);
        }
      } else {
        // Ambient Void (70 BPM)
        if (s === 0 || s === 8) audio.playKick(now);
        if (s % 4 === 0) audio.playHiHat(true, now);
        const ambNotes = [130.81, 164.81, 196.0, 261.63, 220.0, 293.66, 174.61, 246.94];
        if (s % 4 === 2) {
          audio.triggerChime(ambNotes[(s / 4 + measure) % ambNotes.length], 'sine', 0.7, (s - 8) / 8, 0);
        }
      }

      this.beatStep++;
      this.beatTimer = setTimeout(stepRoutine, getStepInterval());
    };

    stepRoutine();
  }

  stopPlayback() {
    this.isMusicPlaying = false;
    if (this.beatTimer) clearTimeout(this.beatTimer);
    this.beatTimer = null;
    this.syncTransportButtons(false);
  }

  togglePlayback() {
    if (this.isMusicPlaying) {
      this.stopPlayback();
    } else {
      this.startPlayback();
    }
  }

  syncTransportButtons(isPlaying) {
    syncAudioButtons(isPlaying);
    this.updateTelemetryHUD();
  }
}

const cosmicEngine = new CosmicUniverseEngine();

// Connect Transport & Deck Buttons
const cosmicMusicBtn = document.getElementById('cosmic-music-btn');
if (cosmicMusicBtn) cosmicMusicBtn.addEventListener('click', () => cosmicEngine.togglePlayback());

const cosmicPauseBtn = document.getElementById('cosmic-pause-btn');
if (cosmicPauseBtn) cosmicPauseBtn.addEventListener('click', () => cosmicEngine.togglePause());

const freezeEvolutionToggle = document.getElementById('freeze-evolution-toggle');
if (freezeEvolutionToggle) freezeEvolutionToggle.addEventListener('click', () => cosmicEngine.togglePause());

const cosmicMemoryBtn = document.getElementById('cosmic-memory-btn');
if (cosmicMemoryBtn) cosmicMemoryBtn.addEventListener('click', () => cosmicEngine.saveMemory());

const saveMemorySecondaryBtn = document.getElementById('save-memory-secondary-btn');
if (saveMemorySecondaryBtn) saveMemorySecondaryBtn.addEventListener('click', () => cosmicEngine.saveMemory());

const headerMusicToggle = document.getElementById('header-music-toggle');
if (headerMusicToggle) headerMusicToggle.addEventListener('click', () => cosmicEngine.togglePlayback());

const beatTrackBtn = document.getElementById('beat-track-toggle');
if (beatTrackBtn) beatTrackBtn.addEventListener('click', () => cosmicEngine.togglePlayback());

// Filter Cutoff & Resonance Real-Time Studio Sliders
const filterCutoffSlider = document.getElementById('filter-cutoff-slider');
const filterCutoffVal = document.getElementById('filter-cutoff-val');
const filterResSlider = document.getElementById('filter-res-slider');
const filterResVal = document.getElementById('filter-res-val');

if (filterCutoffSlider) {
  filterCutoffSlider.addEventListener('input', (e) => {
    const freq = parseFloat(e.target.value);
    if (filterCutoffVal) filterCutoffVal.textContent = `${Math.round(freq)} HZ`;
    if (audio.filter && audio.ctx) {
      audio.filter.frequency.setTargetAtTime(freq, audio.ctx.currentTime, 0.02);
    }
  });
}

if (filterResSlider) {
  filterResSlider.addEventListener('input', (e) => {
    const q = parseFloat(e.target.value);
    if (filterResVal) filterResVal.textContent = `Q: ${q.toFixed(1)}`;
    if (audio.filter && audio.ctx) {
      audio.filter.Q.setTargetAtTime(q, audio.ctx.currentTime, 0.02);
    }
  });
}

// Genre / Epoch Selector Pills
document.querySelectorAll('.genre-pill').forEach((pill) => {
  pill.addEventListener('click', () => {
    const genre = pill.getAttribute('data-genre') || 'techno';
    const epochMap = {
      'ambient': 0,
      'singularity': 0,
      'dnb': 1,
      'inflation': 1,
      'techno': 2,
      'stellar': 2,
      'dubstep': 3,
      'turbulence': 3,
      'bounce': 4
    };
    const targetEpoch = epochMap[genre] !== undefined ? epochMap[genre] : 2;
    cosmicEngine.setEpoch(targetEpoch);
    if (!cosmicEngine.isMusicPlaying) {
      cosmicEngine.startPlayback();
    }
    const epoch = cosmicEngine.getCurrentEpoch();
    const lastKeyHud = document.getElementById('last-key-hud');
    if (lastKeyHud) {
      lastKeyHud.textContent = `EPOCH: [ ${epoch.name} ] (${epoch.bpm} BPM)`;
      lastKeyHud.classList.add('flash');
      setTimeout(() => lastKeyHud.classList.remove('flash'), 350);
    }
  });
});

// --- 7. Full Keyboard Synthesis (AZERTY & QWERTY Universal Layout Hub) ---
let currentLayout = localStorage.getItem('void_keyboard_layout') || 'AZERTY';

const azertyKeyMap = {
  // Numbers Row (High Crystalline Octave)
  '1': { freq: 523.25, note: 'C5', type: 'sine' },
  '2': { freq: 587.33, note: 'D5', type: 'sine' },
  '3': { freq: 659.25, note: 'E5', type: 'sine' },
  '4': { freq: 698.46, note: 'F5', type: 'sine' },
  '5': { freq: 783.99, note: 'G5', type: 'sine' },
  '6': { freq: 880.00, note: 'A5', type: 'sine' },
  '7': { freq: 987.77, note: 'B5', type: 'sine' },
  '8': { freq: 1046.50, note: 'C6', type: 'sine' },
  '9': { freq: 1174.66, note: 'D6', type: 'sine' },
  '0': { freq: 1318.51, note: 'E6', type: 'sine' },

  // Top letter row (AZERTY Melodic Core: A Z E R T Y U I O P)
  'a': { freq: 261.63, note: 'C4', type: 'sawtooth' },
  'z': { freq: 293.66, note: 'D4', type: 'sawtooth' },
  'e': { freq: 329.63, note: 'E4', type: 'sawtooth' },
  'r': { freq: 349.23, note: 'F4', type: 'sawtooth' },
  't': { freq: 392.00, note: 'G4', type: 'sawtooth' },
  'y': { freq: 440.00, note: 'A4', type: 'triangle' },
  'u': { freq: 493.88, note: 'B4', type: 'triangle' },
  'i': { freq: 523.25, note: 'C5', type: 'sine' },
  'o': { freq: 587.33, note: 'D5', type: 'sine' },
  'p': { freq: 659.25, note: 'E5', type: 'sine' },

  // Middle letter row (AZERTY Harmonic Bass: Q S D F G H J K L M)
  'q': { freq: 174.61, note: 'F3', type: 'triangle' },
  's': { freq: 196.00, note: 'G3', type: 'triangle' },
  'd': { freq: 220.00, note: 'A3', type: 'sawtooth' },
  'f': { freq: 246.94, note: 'B3', type: 'sawtooth' },
  'g': { freq: 261.63, note: 'C4', type: 'square' },
  'h': { freq: 293.66, note: 'D4', type: 'square' },
  'j': { freq: 329.63, note: 'E4', type: 'sawtooth' },
  'k': { freq: 349.23, note: 'F4', type: 'triangle' },
  'l': { freq: 392.00, note: 'G4', type: 'sine' },
  'm': { freq: 440.00, note: 'A4', type: 'sine' },

  // Bottom letter row (AZERTY Sub-Bass: W X C V B N)
  'w': { freq: 55.00,  note: 'SUB A1', type: 'sine' },
  'x': { freq: 65.41,  note: 'SUB C2', type: 'sine' },
  'c': { freq: 73.42,  note: 'SUB D2', type: 'sine' },
  'v': { freq: 82.41,  note: 'SUB E2', type: 'triangle' },
  'b': { freq: 98.00,  note: 'BASS G2', type: 'triangle' },
  'n': { freq: 110.00, note: 'BASS A2', type: 'sawtooth' },

  // Spacebar
  ' ': { freq: 43.65, note: 'DROP F1', type: 'sine' }
};

const qwertyKeyMap = {
  // Numbers Row (High Crystalline Octave)
  '1': { freq: 523.25, note: 'C5', type: 'sine' },
  '2': { freq: 587.33, note: 'D5', type: 'sine' },
  '3': { freq: 659.25, note: 'E5', type: 'sine' },
  '4': { freq: 698.46, note: 'F5', type: 'sine' },
  '5': { freq: 783.99, note: 'G5', type: 'sine' },
  '6': { freq: 880.00, note: 'A5', type: 'sine' },
  '7': { freq: 987.77, note: 'B5', type: 'sine' },
  '8': { freq: 1046.50, note: 'C6', type: 'sine' },
  '9': { freq: 1174.66, note: 'D6', type: 'sine' },
  '0': { freq: 1318.51, note: 'E6', type: 'sine' },

  // Top letter row (QWERTY Melodic Core: Q W E R T Y U I O P)
  'q': { freq: 261.63, note: 'C4', type: 'sawtooth' },
  'w': { freq: 293.66, note: 'D4', type: 'sawtooth' },
  'e': { freq: 329.63, note: 'E4', type: 'sawtooth' },
  'r': { freq: 349.23, note: 'F4', type: 'sawtooth' },
  't': { freq: 392.00, note: 'G4', type: 'sawtooth' },
  'y': { freq: 440.00, note: 'A4', type: 'triangle' },
  'u': { freq: 493.88, note: 'B4', type: 'triangle' },
  'i': { freq: 523.25, note: 'C5', type: 'sine' },
  'o': { freq: 587.33, note: 'D5', type: 'sine' },
  'p': { freq: 659.25, note: 'E5', type: 'sine' },

  // Middle letter row (QWERTY Harmonic Bass: A S D F G H J K L)
  'a': { freq: 174.61, note: 'F3', type: 'triangle' },
  's': { freq: 196.00, note: 'G3', type: 'triangle' },
  'd': { freq: 220.00, note: 'A3', type: 'sawtooth' },
  'f': { freq: 246.94, note: 'B3', type: 'sawtooth' },
  'g': { freq: 261.63, note: 'C4', type: 'square' },
  'h': { freq: 293.66, note: 'D4', type: 'square' },
  'j': { freq: 329.63, note: 'E4', type: 'sawtooth' },
  'k': { freq: 349.23, note: 'F4', type: 'triangle' },
  'l': { freq: 392.00, note: 'G4', type: 'sine' },

  // Bottom letter row (QWERTY Sub-Bass: Z X C V B N M)
  'z': { freq: 55.00,  note: 'SUB A1', type: 'sine' },
  'x': { freq: 65.41,  note: 'SUB C2', type: 'sine' },
  'c': { freq: 73.42,  note: 'SUB D2', type: 'sine' },
  'v': { freq: 82.41,  note: 'SUB E2', type: 'triangle' },
  'b': { freq: 98.00,  note: 'BASS G2', type: 'triangle' },
  'n': { freq: 110.00, note: 'BASS A2', type: 'sawtooth' },
  'm': { freq: 123.47, note: 'BASS B2', type: 'sawtooth' },

  // Spacebar
  ' ': { freq: 43.65, note: 'DROP F1', type: 'sine' }
};

function applyLayout(layout) {
  currentLayout = layout;
  try {
    localStorage.setItem('void_keyboard_layout', layout);
  } catch (e) {}

  // 1. Update Segmented Control Buttons
  const azertyBtn = document.getElementById('btn-layout-azerty');
  const qwertyBtn = document.getElementById('btn-layout-qwerty');

  if (azertyBtn && qwertyBtn) {
    if (layout === 'AZERTY') {
      azertyBtn.classList.add('active');
      azertyBtn.setAttribute('aria-selected', 'true');
      qwertyBtn.classList.remove('active');
      qwertyBtn.setAttribute('aria-selected', 'false');
    } else {
      qwertyBtn.classList.add('active');
      qwertyBtn.setAttribute('aria-selected', 'true');
      azertyBtn.classList.remove('active');
      azertyBtn.setAttribute('aria-selected', 'false');
    }
  }

  // 2. Update Layout Descriptions
  const activeDesc = document.getElementById('layout-hub-active-desc');
  if (activeDesc) {
    activeDesc.textContent = layout === 'AZERTY' ? 'CURRENT: AZERTY (BELGIAN / FRENCH)' : 'CURRENT: QWERTY (US / UNIVERSAL)';
  }

  const heroIndicator = document.getElementById('hero-layout-indicator');
  if (heroIndicator) {
    heroIndicator.textContent = `${layout} MATRIX ACTIVE`;
  }

  const hintMsg = document.getElementById('layout-hint-message');
  if (hintMsg) {
    if (layout === 'AZERTY') {
      hintMsg.innerHTML = 'Melody row mapped to <strong>[A Z E R T Y]</strong> &bull; Core bass to <strong>[Q S D F G H J K L M]</strong> &bull; Sub-bass to <strong>[W X C V B N]</strong> &bull; Space: Sub-Drop';
    } else {
      hintMsg.innerHTML = 'Melody row mapped to <strong>[Q W E R T Y]</strong> &bull; Core bass to <strong>[A S D F G H J K L]</strong> &bull; Sub-bass to <strong>[Z X C V B N M]</strong> &bull; Space: Sub-Drop';
    }
  }

  // 3. Dynamically update on-screen Synth Button badges!
  const keys = layout === 'AZERTY' ? ['A', 'Z', 'E', 'R', 'T', 'Y'] : ['Q', 'W', 'E', 'R', 'T', 'Y'];
  for (let i = 1; i <= 6; i++) {
    const badge = document.getElementById(`key-badge-${i}`);
    if (badge) {
      badge.textContent = `${i} / ${keys[i - 1]}`;
    }
    const btn = document.querySelector(`.synth-key:nth-child(${i})`);
    if (btn) {
      btn.setAttribute('data-key', String(i));
      btn.setAttribute('data-key-alt', keys[i - 1].toLowerCase());
    }
  }

  // Play audio confirmation
  audio.triggerChime(554.37, 'sine', 0.2, 0, 0);
}

// Layout Switcher Event Listeners
const btnLayoutAzerty = document.getElementById('btn-layout-azerty');
if (btnLayoutAzerty) {
  btnLayoutAzerty.addEventListener('click', () => applyLayout('AZERTY'));
}

const btnLayoutQwerty = document.getElementById('btn-layout-qwerty');
if (btnLayoutQwerty) {
  btnLayoutQwerty.addEventListener('click', () => applyLayout('QWERTY'));
}

applyLayout(currentLayout);

function triggerNoteByKey(keyChar, physicalCode) {
  const activeMap = currentLayout === 'AZERTY' ? azertyKeyMap : qwertyKeyMap;
  let noteData = activeMap[keyChar.toLowerCase()];

  // If not found directly, check physical keycode mappings for AZERTY/QWERTY cross-compatibility
  if (!noteData && physicalCode) {
    if (physicalCode === 'KeyQ') noteData = activeMap['q'] || activeMap['a'];
    if (physicalCode === 'KeyW') noteData = activeMap['w'] || activeMap['z'];
    if (physicalCode === 'KeyA') noteData = activeMap['a'] || activeMap['q'];
    if (physicalCode === 'KeyZ') noteData = activeMap['z'] || activeMap['w'];
  }

  if (!noteData) return;

  audio.init();
  if (audio.isMuted) audio.toggle();

  const panX = (Math.random() - 0.5) * 2;
  audio.triggerChime(noteData.freq, noteData.type, 0.75, panX, 0);

  // Interaction accelerates cosmic evolution
  cosmicEngine.addEntropy(0.45, 'key');

  // Update HUD Display with note details
  const lastKeyHud = document.getElementById('last-key-hud');
  if (lastKeyHud) {
    const displayKey = keyChar === ' ' ? 'SPACE' : keyChar.toUpperCase();
    lastKeyHud.textContent = `KEY: [ ${displayKey} ] → ${noteData.note} (${noteData.freq.toFixed(0)}Hz)`;
    lastKeyHud.classList.add('flash');
    setTimeout(() => lastKeyHud.classList.remove('flash'), 180);
  }

  // Find and flash matching key button on screen if present
  const button = document.querySelector(`.synth-key[data-key="${keyChar.toLowerCase()}"]`) ||
                 document.querySelector(`.synth-key[data-key-alt="${keyChar.toLowerCase()}"]`);
  if (button) {
    button.classList.add('active-key');
    setTimeout(() => button.classList.remove('active-key'), 180);
  }

  // Visual shockwave ripple
  const power = keyChar === ' ' ? 2.2 : 0.8;
  ripples.push(new Ripple(mouse.x, mouse.y, power));
}

window.addEventListener('keydown', (e) => {
  // Prevent spacebar from scrolling page when interacting with synth
  if (e.key === ' ' && !e.target.closest('input, textarea')) {
    e.preventDefault();
  }

  if (e.repeat) return;
  const key = e.key.toLowerCase();

  // Auto-detect layout from physical code vs character
  if (e.code === 'KeyQ' && key === 'a' && currentLayout !== 'AZERTY') {
    applyLayout('AZERTY');
  } else if (e.code === 'KeyQ' && key === 'q' && currentLayout !== 'QWERTY') {
    applyLayout('QWERTY');
  }

  // Escape closes all open modals
  if (key === 'escape') {
    closeControlsModal();
    closeTimelineModal();
    closeUniverseModal();
    return;
  }

  // '?' toggles controls
  if (key === '?') {
    toggleControlsModal();
    return;
  }

  // Shift + U toggles Universe Story
  if (e.shiftKey && (key === 'u' || e.code === 'KeyU')) {
    toggleUniverseModal();
    return;
  }

  // Shift + T toggles Chronicles Timeline
  if (e.shiftKey && (key === 't' || e.code === 'KeyT')) {
    toggleTimelineModal();
    return;
  }

  // Shift + P freezes / resumes cosmic evolution
  if (e.shiftKey && (key === 'p' || e.code === 'KeyP')) {
    cosmicEngine.togglePause();
    return;
  }

  // Shift + S captures a cosmic memory state
  if (e.shiftKey && (key === 's' || e.code === 'KeyS')) {
    cosmicEngine.saveMemory();
    return;
  }

  // Shift + M toggles master audio
  if (e.shiftKey && (key === 'm' || e.code === 'KeyM')) {
    audio.toggle();
    return;
  }

  // Spacebar drops deep sub-bass hit
  if (key === ' ' || e.code === 'Space') {
    audio.playSubDrop();
    ripples.push(new Ripple(width / 2, height / 2, 2.5));
    cosmicEngine.addEntropy(0.8, 'sub-drop');
    return;
  }

  const activeMap = currentLayout === 'AZERTY' ? azertyKeyMap : qwertyKeyMap;
  if (activeMap[key] || ['keyq', 'keyw', 'keya', 'keyz'].includes(e.code.toLowerCase())) {
    triggerNoteByKey(key, e.code);
  }
});

// Click listener for synth keys
document.querySelectorAll('.synth-key').forEach((keyEl) => {
  keyEl.addEventListener('click', () => {
    audio.init();
    if (audio.isMuted) audio.toggle();

    const freq = parseFloat(keyEl.getAttribute('data-freq') || '440');
    const type = keyEl.getAttribute('data-type') || 'sine';
    audio.triggerChime(freq, type, 0.75, 0, 0);

    const rect = keyEl.getBoundingClientRect();
    ripples.push(new Ripple(rect.left + rect.width / 2, rect.top + rect.height / 2, 0.9));
  });
});

// --- 8. 3D Perspective Card Tilt ---
document.querySelectorAll('.tilt-card').forEach((card) => {
  card.addEventListener('mousemove', (e) => {
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = -((y - centerY) / centerY) * 10;
    const rotateY = ((x - centerX) / centerX) * 10;

    card.style.setProperty('--mouse-x', `${x}px`);
    card.style.setProperty('--mouse-y', `${y}px`);
    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`;
  });

  card.addEventListener('mouseenter', () => {
    if (cursorRing) {
      cursorRing.style.width = '64px';
      cursorRing.style.height = '64px';
      cursorRing.style.borderColor = '#ffffff';
    }
    audio.triggerChime(659.25, 'sine', 0.35, 0.5, 0); // E5
  });

  card.addEventListener('mouseleave', () => {
    card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0px)';
    if (cursorRing) {
      cursorRing.style.width = '44px';
      cursorRing.style.height = '44px';
      cursorRing.style.borderColor = 'rgba(255, 255, 255, 0.3)';
    }
  });
});

// --- 8. Stellar Nucleosynthesis Manifold Action ---
const cardMorphAction = document.getElementById('card-morph-action');
if (cardMorphAction) {
  cardMorphAction.addEventListener('click', morphGeometry);
}

// --- 8b. Cosmic Particle Collider & Quantum Foam Sandbox ---
class ParticleColliderLab {
  constructor() {
    this.canvas = document.getElementById('particle-sandbox-canvas');
    if (!this.canvas) return;

    this.ctx = this.canvas.getContext('2d');
    this.particles = [];
    this.numParticles = 2500;
    this.mode = 'inflation'; // 'inflation' | 'vortex' | 'accretion' | 'quantum'
    this.isDragging = false;
    this.attractor = { x: 0, y: 0, active: false };
    this.shockwaves = [];
    this.isCollapsing = false;
    this.collapseTimer = 0;
    this.gravityMult = 1.0;
    this.time = 0;

    // Badges
    this.modeBadge = document.getElementById('sandbox-mode-badge');
    this.particlesBadge = document.getElementById('sandbox-particles-badge');
    this.gravityBadge = document.getElementById('sandbox-gravity-badge');
    this.velocityBadge = document.getElementById('sandbox-velocity-badge');

    this.initCanvas();
    this.initParticles();
    this.bindEvents();
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  initCanvas() {
    const parent = this.canvas.parentElement;
    if (!parent) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.width = parent.clientWidth || 800;
    this.height = parent.clientHeight || 450;

    this.canvas.width = this.width * dpr;
    this.canvas.height = this.height * dpr;
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;

    this.ctx.scale(dpr, dpr);
    this.centerX = this.width / 2;
    this.centerY = this.height / 2;
    this.attractor.x = this.centerX;
    this.attractor.y = this.centerY;
  }

  initParticles() {
    this.particles = [];
    for (let i = 0; i < this.numParticles; i++) {
      this.particles.push(this.createParticle());
    }
  }

  createParticle() {
    const angle = Math.random() * Math.PI * 2;
    const radius = Math.random() * Math.min(this.width, this.height) * 0.45;
    const speed = 0.6 + Math.random() * 2.2;

    return {
      x: this.centerX + Math.cos(angle) * radius,
      y: this.centerY + Math.sin(angle) * radius,
      vx: Math.cos(angle) * speed * (Math.random() - 0.2),
      vy: Math.sin(angle) * speed * (Math.random() - 0.2),
      size: Math.random() < 0.08 ? 2.0 : (0.8 + Math.random() * 0.9),
      alpha: 0.25 + Math.random() * 0.7,
      orbitRadius: 30 + Math.random() * (Math.min(this.width, this.height) * 0.44),
      orbitAngle: Math.random() * Math.PI * 2,
      orbitSpeed: (0.015 + Math.random() * 0.035) * (Math.random() < 0.5 ? 1 : -1),
      mass: 0.6 + Math.random() * 0.8,
    };
  }

  setMode(modeName) {
    this.mode = modeName;
    const modeTitles = {
      inflation: 'MODE: INFLATION (EXPANSION)',
      vortex: 'MODE: VORTEX (GRAVITY)',
      accretion: 'MODE: ACCRETION (ORBITS)',
      quantum: 'MODE: QUANTUM FOAM',
    };
    if (this.modeBadge) this.modeBadge.textContent = modeTitles[modeName] || modeName.toUpperCase();

    // Visual feedback & harmonic interval
    const freqs = { inflation: 523.25, vortex: 392.0, accretion: 659.25, quantum: 783.99 };
    if (typeof audio !== 'undefined') {
      audio.triggerChime(freqs[modeName] || 440, 'triangle', 0.65, 0, 0);
    }

    if (modeName === 'inflation') {
      this.triggerPulse(this.centerX, this.centerY, 12);
    } else if (modeName === 'quantum') {
      this.particles.forEach(p => {
        p.vx = (Math.random() - 0.5) * 3;
        p.vy = (Math.random() - 0.5) * 3;
      });
    }
  }

  triggerPulse(originX, originY, force = 9) {
    this.shockwaves.push({
      x: originX,
      y: originY,
      radius: 4,
      maxRadius: Math.max(this.width, this.height) * 0.9,
      speed: 16,
      opacity: 0.9,
    });

    this.particles.forEach(p => {
      const dx = p.x - originX;
      const dy = p.y - originY;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const push = (force * 38) / Math.max(25, dist);
      p.vx += (dx / dist) * push;
      p.vy += (dy / dist) * push;
    });

    if (typeof cosmicEngine !== 'undefined') {
      cosmicEngine.addEntropy(0.12, 'collider-pulse');
    }
  }

  triggerCollapse() {
    this.isCollapsing = true;
    this.collapseTimer = 160;
    if (typeof audio !== 'undefined') {
      audio.playSubDrop();
      audio.triggerChime(65.41, 'sawtooth', 0.9, 0, 0); // C2
    }
    if (typeof cosmicEngine !== 'undefined') {
      cosmicEngine.addEntropy(0.25, 'singularity-collapse');
    }
  }

  resetField() {
    this.isCollapsing = false;
    this.shockwaves = [];
    this.initParticles();
    if (typeof audio !== 'undefined') {
      audio.triggerChime(440, 'sine', 0.5, 0, 0);
    }
  }

  bindEvents() {
    window.addEventListener('resize', () => this.initCanvas());

    this.canvas.addEventListener('pointerdown', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;
      this.isDragging = true;
      this.attractor.x = clickX;
      this.attractor.y = clickY;
      this.attractor.active = true;

      // Click shockwave
      this.triggerPulse(clickX, clickY, 8);
      const panX = ((clickX / this.width) * 2 - 1) * 0.8;
      if (typeof audio !== 'undefined') {
        const pitch = 300 + (1 - clickY / this.height) * 600;
        audio.triggerChime(pitch, 'triangle', 0.7, panX, 0);
      }
    });

    this.canvas.addEventListener('pointermove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.attractor.x = e.clientX - rect.left;
      this.attractor.y = e.clientY - rect.top;
      this.attractor.active = true;
    });

    this.canvas.addEventListener('pointerup', () => {
      this.isDragging = false;
    });

    this.canvas.addEventListener('pointerleave', () => {
      this.isDragging = false;
      this.attractor.active = false;
    });

    // Wire mode selector pills
    document.querySelectorAll('.sandbox-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        document.querySelectorAll('.sandbox-pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        const mode = pill.getAttribute('data-mode');
        this.setMode(mode);
      });
    });

    // Wire action buttons
    const btnPulse = document.getElementById('btn-collider-pulse');
    if (btnPulse) {
      btnPulse.addEventListener('click', () => {
        this.triggerPulse(this.centerX, this.centerY, 14);
        if (typeof audio !== 'undefined') audio.triggerChime(523.25, 'sawtooth', 0.8, 0, 0);
      });
    }

    const btnCollapse = document.getElementById('btn-collider-collapse');
    if (btnCollapse) {
      btnCollapse.addEventListener('click', () => {
        this.triggerCollapse();
      });
    }

    const btnReset = document.getElementById('btn-collider-reset');
    if (btnReset) {
      btnReset.addEventListener('click', () => {
        this.resetField();
      });
    }
  }

  animate() {
    requestAnimationFrame(this.animate);
    this.time += 0.016;

    // Semi-transparent void fade for motion trails
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
    this.ctx.fillRect(0, 0, this.width, this.height);

    // Gravity calculation from trackpad force + drag + collapse
    let currentGrav = 1.0;
    if (typeof trackpadForce !== 'undefined' && trackpadForce > 0.05) {
      currentGrav += trackpadForce * 6.0;
    }
    if (this.isDragging) {
      currentGrav += 2.5;
    }
    if (this.isCollapsing) {
      currentGrav += 12.0;
      this.collapseTimer--;
      if (this.collapseTimer <= 0) {
        this.isCollapsing = false;
        // Rebound explosion after black hole collapse
        this.triggerPulse(this.centerX, this.centerY, 18);
        if (typeof audio !== 'undefined') audio.playBigBounceChord();
      }
    }
    this.gravityMult = currentGrav;

    // Default attractor drift if pointer inactive
    const targetAttractorX = this.attractor.active ? this.attractor.x : (this.centerX + Math.sin(this.time * 0.8) * (this.width * 0.2));
    const targetAttractorY = this.attractor.active ? this.attractor.y : (this.centerY + Math.cos(this.time * 0.6) * (this.height * 0.18));

    // Render shockwaves
    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      const sw = this.shockwaves[i];
      sw.radius += sw.speed;
      sw.opacity *= 0.94;

      this.ctx.beginPath();
      this.ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
      this.ctx.strokeStyle = `rgba(255, 255, 255, ${sw.opacity.toFixed(3)})`;
      this.ctx.lineWidth = 1.5;
      this.ctx.stroke();

      if (sw.opacity < 0.01 || sw.radius > sw.maxRadius) {
        this.shockwaves.splice(i, 1);
      }
    }

    // Attractor visual core
    this.ctx.beginPath();
    this.ctx.arc(targetAttractorX, targetAttractorY, 3 + currentGrav * 0.6, 0, Math.PI * 2);
    this.ctx.fillStyle = this.isCollapsing ? '#ffffff' : 'rgba(255, 255, 255, 0.4)';
    this.ctx.fill();

    let sumVelocitySq = 0;
    const len = this.particles.length;

    // Update & Render Particles
    for (let i = 0; i < len; i++) {
      const p = this.particles[i];

      if (this.mode === 'inflation') {
        // High radial outward expansion
        const dx = p.x - this.centerX;
        const dy = p.y - this.centerY;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        p.vx += (dx / dist) * 0.08;
        p.vy += (dy / dist) * 0.08;

        // Attractor gravitational pull
        const adx = targetAttractorX - p.x;
        const ady = targetAttractorY - p.y;
        const adist = Math.sqrt(adx * adx + ady * ady) || 1;
        if (adist < 220) {
          const force = (currentGrav * 15) / (adist * p.mass);
          p.vx += (adx / adist) * force;
          p.vy += (ady / adist) * force;
        }

        p.vx *= 0.985;
        p.vy *= 0.985;
        p.x += p.vx;
        p.y += p.vy;

        // Toroidal bounds wrapping
        if (p.x < 0) p.x = this.width;
        if (p.x > this.width) p.x = 0;
        if (p.y < 0) p.y = this.height;
        if (p.y > this.height) p.y = 0;

      } else if (this.mode === 'vortex') {
        // Spiral gravitational vortex
        const dx = targetAttractorX - p.x;
        const dy = targetAttractorY - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;

        const radialForce = (currentGrav * 25) / (dist * p.mass);
        const tangentForce = (currentGrav * 32) / (Math.max(30, dist) * p.mass);

        p.vx += (dx / dist) * radialForce + (-dy / dist) * tangentForce;
        p.vy += (dy / dist) * radialForce + (dx / dist) * tangentForce;

        p.vx *= 0.975;
        p.vy *= 0.975;
        p.x += p.vx;
        p.y += p.vy;

        if (dist < 8 && !this.isCollapsing) {
          const throwAngle = Math.random() * Math.PI * 2;
          p.x = targetAttractorX + Math.cos(throwAngle) * 50;
          p.y = targetAttractorY + Math.sin(throwAngle) * 50;
          p.vx = Math.cos(throwAngle) * 3;
          p.vy = Math.sin(throwAngle) * 3;
        }

      } else if (this.mode === 'accretion') {
        // Keplerian accretion disk orbits
        p.orbitAngle += p.orbitSpeed * (1 + currentGrav * 0.4);
        const currentR = this.isCollapsing ? p.orbitRadius * (this.collapseTimer / 160) : p.orbitRadius;
        const targetPx = targetAttractorX + Math.cos(p.orbitAngle) * currentR;
        const targetPy = targetAttractorY + Math.sin(p.orbitAngle) * (currentR * 0.45);

        p.vx = (targetPx - p.x) * 0.12;
        p.vy = (targetPy - p.y) * 0.12;
        p.x += p.vx;
        p.y += p.vy;

      } else if (this.mode === 'quantum') {
        // Brownian quantum foam fluctuation
        p.vx += (Math.random() - 0.5) * 1.8;
        p.vy += (Math.random() - 0.5) * 1.8;

        const adx = targetAttractorX - p.x;
        const ady = targetAttractorY - p.y;
        const adist = Math.sqrt(adx * adx + ady * ady) || 1;
        if (adist < 180) {
          p.vx += (adx / adist) * (currentGrav * 0.8);
          p.vy += (ady / adist) * (currentGrav * 0.8);
        }

        p.vx *= 0.92;
        p.vy *= 0.92;
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = this.width;
        if (p.x > this.width) p.x = 0;
        if (p.y < 0) p.y = this.height;
        if (p.y > this.height) p.y = 0;
      }

      // Sample RMS velocity
      if (i < 100) {
        sumVelocitySq += (p.vx * p.vx + p.vy * p.vy);
      }

      this.ctx.fillStyle = `rgba(255, 255, 255, ${p.alpha})`;
      this.ctx.fillRect(p.x, p.y, p.size, p.size);
    }

    // Update Telemetry Badges
    if (this.gravityBadge) {
      this.gravityBadge.textContent = `GRAV CONST: ${currentGrav.toFixed(2)}x`;
      if (currentGrav > 3.0) {
        this.gravityBadge.style.color = '#ffffff';
        this.gravityBadge.style.borderColor = '#ffffff';
      } else {
        this.gravityBadge.style.color = 'var(--text-secondary)';
        this.gravityBadge.style.borderColor = 'rgba(255, 255, 255, 0.2)';
      }
    }

    if (this.velocityBadge && Math.random() < 0.2) {
      const rms = Math.sqrt(sumVelocitySq / 100);
      const cFrac = Math.min(0.99, (rms / 8.0)).toFixed(2);
      this.velocityBadge.textContent = `RMS VELOCITY: ${cFrac} c`;
    }
  }
}

let colliderLab;
try {
  colliderLab = new ParticleColliderLab();
} catch (err) {
  console.warn('ParticleColliderLab initialization:', err);
}

// --- 9. Audio Visualizer Canvas ---
const visCanvas = document.getElementById('audio-visualizer');
if (visCanvas) {
  const vCtx = visCanvas.getContext('2d');
  function resizeVis() {
    visCanvas.width = visCanvas.parentElement.clientWidth;
    visCanvas.height = visCanvas.parentElement.clientHeight;
  }
  resizeVis();
  window.addEventListener('resize', resizeVis);

  const freqData = new Uint8Array(32);

  function drawVisualizer() {
    requestAnimationFrame(drawVisualizer);
    vCtx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    vCtx.fillRect(0, 0, visCanvas.width, visCanvas.height);

    if (audio.analyser && !audio.isMuted) {
      audio.analyser.getByteFrequencyData(freqData);
    } else {
      for (let i = 0; i < freqData.length; i++) {
        freqData[i] = Math.max(0, freqData[i] * 0.9);
      }
    }

    const barWidth = visCanvas.width / freqData.length;
    for (let i = 0; i < freqData.length; i++) {
      const val = freqData[i] / 255;
      const barHeight = Math.max(3, val * visCanvas.height * 0.85);
      const x = i * barWidth;
      const y = visCanvas.height - barHeight;

      const alpha = 0.2 + val * 0.8;
      vCtx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
      vCtx.fillRect(x + 1, y, barWidth - 2, barHeight);
    }
  }
  drawVisualizer();
}

// --- 10. Mechanics & Controls Modal Logic ---
// --- 10. Mechanics & Controls Modal Logic ---
const controlsModal = document.getElementById('controls-modal');
const controlsToggle = document.getElementById('controls-toggle');
const closeControls = document.getElementById('close-controls');
const controlsBackdrop = document.getElementById('controls-backdrop');

function openControlsModal() {
  closeTimelineModal();
  closeUniverseModal();
  if (controlsModal) controlsModal.classList.add('open');
  if (audio && audio.ctx && !audio.isMuted) {
    audio.triggerChime(554.37, 'sine', 0.3, 0, 0);
  }
}

function closeControlsModal() {
  if (controlsModal) controlsModal.classList.remove('open');
}

function toggleControlsModal() {
  if (controlsModal && controlsModal.classList.contains('open')) {
    closeControlsModal();
  } else {
    openControlsModal();
  }
}

if (controlsToggle) {
  controlsToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleControlsModal();
  });
}
if (closeControls) {
  closeControls.addEventListener('click', (e) => {
    e.stopPropagation();
    closeControlsModal();
  });
}
if (controlsBackdrop) {
  controlsBackdrop.addEventListener('click', (e) => {
    e.stopPropagation();
    closeControlsModal();
  });
}

// --- 11. Chronicles // Timeline Modal Logic ---
const timelineModal = document.getElementById('timeline-modal');
const timelineToggle = document.getElementById('timeline-toggle');
const closeTimeline = document.getElementById('close-timeline');
const timelineBackdrop = document.getElementById('timeline-backdrop');

function openTimelineModal() {
  closeControlsModal();
  closeUniverseModal();
  if (timelineModal) timelineModal.classList.add('open');
  if (audio && audio.ctx && !audio.isMuted) {
    audio.triggerChime(659.25, 'triangle', 0.4, 0, 0); // E5
  }
}

function closeTimelineModal() {
  if (timelineModal) timelineModal.classList.remove('open');
}

function toggleTimelineModal() {
  if (timelineModal && timelineModal.classList.contains('open')) {
    closeTimelineModal();
  } else {
    openTimelineModal();
  }
}

if (timelineToggle) {
  timelineToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleTimelineModal();
  });
}
if (closeTimeline) {
  closeTimeline.addEventListener('click', (e) => {
    e.stopPropagation();
    closeTimelineModal();
  });
}
if (timelineBackdrop) {
  timelineBackdrop.addEventListener('click', (e) => {
    e.stopPropagation();
    closeTimelineModal();
  });
}

// --- 12. Universe Creation & Theories Modal Logic ---
const universeModal = document.getElementById('universe-modal');
const universeStoryToggle = document.getElementById('universe-story-toggle');
const cosmicStoryBtn = document.getElementById('cosmic-story-btn');
const closeUniverse = document.getElementById('close-universe');
const universeBackdrop = document.getElementById('universe-backdrop');

function openUniverseModal() {
  closeControlsModal();
  closeTimelineModal();
  if (universeModal) universeModal.classList.add('open');
  if (audio && audio.ctx && !audio.isMuted) {
    audio.triggerChime(783.99, 'sine', 0.45, 0, 0); // G5
  }
}

function closeUniverseModal() {
  if (universeModal) universeModal.classList.remove('open');
}

function toggleUniverseModal() {
  if (universeModal && universeModal.classList.contains('open')) {
    closeUniverseModal();
  } else {
    openUniverseModal();
  }
}

if (universeStoryToggle) {
  universeStoryToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleUniverseModal();
  });
}
if (cosmicStoryBtn) {
  cosmicStoryBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleUniverseModal();
  });
}
if (closeUniverse) {
  closeUniverse.addEventListener('click', (e) => {
    e.stopPropagation();
    closeUniverseModal();
  });
}
if (universeBackdrop) {
  universeBackdrop.addEventListener('click', (e) => {
    e.stopPropagation();
    closeUniverseModal();
  });
}

// Sound effects on timeline nodes
document.querySelectorAll('.timeline-node').forEach((node, i) => {
  node.addEventListener('mouseenter', () => {
    const freqs = [329.63, 440, 554.37, 659.25];
    audio.triggerChime(freqs[i % freqs.length], 'sine', 0.25, 0.4, 0);
  });
});

// Window resize
window.addEventListener('resize', () => {
  width = gridCanvas.width = window.innerWidth;
  height = gridCanvas.height = window.innerHeight;

  if (camera && renderer) {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }
});

// Start Three.js on DOM ready
window.addEventListener('DOMContentLoaded', () => {
  if (typeof THREE !== 'undefined') {
    initThreeJS();
  }
});

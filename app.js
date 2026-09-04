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

      // Master Gain
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0, this.ctx.currentTime);

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

      // Heavy Bass Boost EQ (Lowshelf +8dB at 80Hz for AirPods Pro 3 & High-end Headphones)
      this.bassBoost = this.ctx.createBiquadFilter();
      this.bassBoost.type = 'lowshelf';
      this.bassBoost.frequency.setValueAtTime(80, this.ctx.currentTime);
      this.bassBoost.gain.setValueAtTime(8.5, this.ctx.currentTime);

      // Routing: MasterGain -> BassBoost -> Filter -> SpatialPanner -> Analyser -> Destination
      this.masterGain.connect(this.bassBoost);
      this.bassBoost.connect(this.filter);

      if (this.spatialPanner) {
        this.filter.connect(this.spatialPanner);
        this.spatialPanner.connect(this.analyser);
      } else {
        this.filter.connect(this.analyser);
      }
      this.analyser.connect(this.ctx.destination);

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

      this.genre = 'ambient'; // 'ambient' | 'techno' | 'dubstep'
      this.initialized = true;
    } catch (e) {
      console.warn('Web Audio initialization:', e);
    }
  }

  setGenre(genreName) {
    this.genre = genreName;
    if (this.isMuted || !this.ctx) return;
    const now = this.ctx.currentTime;

    if (genreName === 'singularity') {
      // Epoch 0: Primordial Singularity
      this.filter.frequency.setTargetAtTime(180, now, 0.2);
      this.filter.Q.setValueAtTime(1.5, now);
      this.droneOsc1.type = 'sine';
      this.droneOsc2.type = 'sine';
      this.subBassOsc.frequency.setValueAtTime(36.7, now);
      this.triggerChime(73.4, 'sine', 0.5, 0, 0);
    } else if (genreName === 'techno' || genreName === 'stellar') {
      // Epoch 2: Stellar Nucleosynthesis & Techno order
      this.filter.frequency.setTargetAtTime(1600, now, 0.15);
      this.filter.Q.setValueAtTime(5.5, now);
      this.droneOsc1.type = 'sawtooth';
      this.droneOsc2.type = 'triangle';
      this.triggerChime(110, 'sawtooth', 0.45, 0, 0);
    } else if (genreName === 'dubstep' || genreName === 'turbulence') {
      // Epoch 3: Cosmic Turbulence & Chaos
      this.filter.frequency.setTargetAtTime(950, now, 0.1);
      this.filter.Q.setValueAtTime(11.0, now);
      this.droneOsc1.type = 'sawtooth';
      this.droneOsc2.type = 'sawtooth';
      this.triggerChime(55, 'sawtooth', 0.85, 0, 0);
    } else if (genreName === 'bounce') {
      // Epoch 4: The Big Bounce
      this.playBigBounceChord();
    } else {
      // Epoch 1: Cosmic Inflation / Ambient
      this.filter.frequency.setTargetAtTime(650, now, 0.2);
      this.filter.Q.setValueAtTime(3.5, now);
      this.droneOsc1.type = 'sine';
      this.droneOsc2.type = 'triangle';
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
      this.masterGain.gain.setTargetAtTime(0.42, now, 0.1);
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
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(160, t);
      osc.frequency.exponentialRampToValueAtTime(34, t + 0.18);

      gain.gain.setValueAtTime(0.6, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);

      osc.connect(gain);
      gain.connect(this.bassBoost || this.masterGain);
      osc.start(t);
      osc.stop(t + 0.28);

      // Pulse 3D wireframe mesh on kick
      if (typeof wireframeMesh !== 'undefined' && wireframeMesh) {
        wireframeMesh.scale.set(1.28, 1.28, 1.28);
      }
    } catch (e) {}
  }

  playSnare(time) {
    if (this.isMuted || !this.ctx) return;
    const t = time || this.ctx.currentTime;
    try {
      // Noise burst
      const bufferSize = Math.floor(this.ctx.sampleRate * 0.12);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const noiseFilter = this.ctx.createBiquadFilter();
      noiseFilter.type = 'highpass';
      noiseFilter.frequency.setValueAtTime(900, t);

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.35, t);
      noiseGain.gain.exponentialRampToValueAtTime(0.01, t + 0.12);

      noise.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(this.masterGain);

      // Tonal punch
      const osc = this.ctx.createOscillator();
      const oscGain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(200, t);
      osc.frequency.exponentialRampToValueAtTime(70, t + 0.08);

      oscGain.gain.setValueAtTime(0.3, t);
      oscGain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);

      osc.connect(oscGain);
      oscGain.connect(this.masterGain);

      noise.start(t);
      osc.start(t);
      osc.stop(t + 0.12);
    } catch (e) {}
  }

  playHiHat(open = false, time) {
    if (this.isMuted || !this.ctx) return;
    const t = time || this.ctx.currentTime;
    try {
      const duration = open ? 0.2 : 0.04;
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
      filter.frequency.setValueAtTime(7000, t);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(open ? 0.22 : 0.15, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      noise.start(t);
    } catch (e) {}
  }

  playWobble(freq = 55, time) {
    if (this.isMuted || !this.ctx) return;
    const t = time || this.ctx.currentTime;
    try {
      const osc = this.ctx.createOscillator();
      const filter = this.ctx.createBiquadFilter();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, t);

      filter.type = 'lowpass';
      filter.Q.setValueAtTime(10.5, t);
      filter.frequency.setValueAtTime(180, t);
      filter.frequency.exponentialRampToValueAtTime(1900, t + 0.11);
      filter.frequency.exponentialRampToValueAtTime(220, t + 0.24);

      gain.gain.setValueAtTime(0.42, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.26);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.bassBoost || this.masterGain);

      osc.start(t);
      osc.stop(t + 0.26);
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

  if (activeGeoText) activeGeoText.textContent = currentName;
  if (cardGeoStatus) cardGeoStatus.textContent = currentName;
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
      if (beatTrackStatus) beatTrackStatus.textContent = 'PLAY MUSIC: ON';
      if (beatTrackIcon) beatTrackIcon.innerHTML = '&#9632;';
    } else {
      beatTrackBtn.classList.remove('active');
      if (beatTrackStatus) beatTrackStatus.textContent = 'PLAY MUSIC: OFF';
      if (beatTrackIcon) beatTrackIcon.innerHTML = '&#9654;';
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
    key: 'singularity',
    name: 'EPOCH 00 // PRIMORDIAL SINGULARITY',
    time: 'T + 0.00 GYR',
    bpm: 65,
    title: 'Primordial Singularity',
    desc: 'Pure quantum vacuum fluctuations & minimal entropy in the infinite void.',
    visualScale: 0.45
  },
  {
    id: 1,
    key: 'ambient',
    name: 'EPOCH 01 // COSMIC INFLATION',
    time: 'T + 0.01 GYR',
    bpm: 85,
    title: 'Cosmic Inflation & Big Bang',
    desc: 'Superluminal spacetime expansion & explosive photon decoupling.',
    visualScale: 1.25
  },
  {
    id: 2,
    key: 'techno',
    name: 'EPOCH 02 // STELLAR NUCLEOSYNTHESIS',
    time: 'T + 4.50 GYR',
    bpm: 128,
    title: 'Stellar Nucleosynthesis & Galactic Dawn',
    desc: 'Gravitational fusion, planetary orbits, and driving Cyber Techno rhythm.',
    visualScale: 1.0
  },
  {
    id: 3,
    key: 'dubstep',
    name: 'EPOCH 03 // COSMIC TURBULENCE',
    time: 'T + 9.80 GYR',
    bpm: 140,
    title: 'Cosmic Turbulence & Black Hole Mergers',
    desc: 'Dark energy acceleration, gravitational ripples, and heavy wobble bass.',
    visualScale: 1.15
  },
  {
    id: 4,
    key: 'bounce',
    name: 'EPOCH 04 // THE BIG BOUNCE',
    time: 'T + 13.80 GYR',
    bpm: 120,
    title: 'The Big Bounce & Cyclic Rebirth',
    desc: 'Gravitational contraction glissando rebounding into higher-dimensional rebirth!',
    visualScale: 1.4
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
        <span>✦</span>
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
      if (ep.bpm === 140) return 107; // Dubstep
      if (ep.bpm === 128) return 117; // Techno
      if (ep.bpm === 85) return 175;  // Inflation
      if (ep.bpm === 65) return 230;  // Singularity
      return 125;
    };

    const stepRoutine = () => {
      if (!this.isMusicPlaying) return;
      const s = this.beatStep % 16;
      const now = audio.ctx.currentTime;
      const ep = this.getCurrentEpoch();

      // Subtle interaction-free baseline cosmic drift (+0.02 entropy per beat)
      if (!this.isPaused) {
        this.addEntropy(0.04, 'auto-drift');
      }

      if (ep.key === 'techno' || ep.key === 'stellar') {
        // 4-on-the-floor warehouse techno kick
        if (s === 0 || s === 4 || s === 8 || s === 12) audio.playKick(now);
        // Offbeat open hat & rolling 16ths
        if (s === 2 || s === 6 || s === 10 || s === 14) {
          audio.playHiHat(true, now);
        } else {
          audio.playHiHat(false, now);
        }
        // Rolling acid bass sequence
        const technoNotes = [55, 55, 110, 55, 82.4, 55, 110, 73.4];
        audio.triggerChime(technoNotes[s % 8], 'sawtooth', 0.14, (s % 4 - 1.5) * 0.45, 0);
      } else if (ep.key === 'dubstep' || ep.key === 'turbulence') {
        // Half-time Skrillex dubstep break
        if (s === 0 || s === 10) audio.playKick(now);
        if (s === 8) audio.playSnare(now);
        if (s % 2 === 0) audio.playHiHat(s === 4 || s === 12, now);
        // Syncopated heavy wobble bass
        if (s === 2 || s === 4 || s === 6 || s === 12 || s === 14) {
          const wobbleFreqs = [55, 73.4, 82.4, 55, 65.4];
          audio.playWobble(wobbleFreqs[(s / 2) % wobbleFreqs.length], now);
        }
      } else if (ep.key === 'singularity') {
        // Epoch 0: Primordial Singularity (quiet 36Hz pulse and dark chimes)
        if (s === 0) audio.playKick(now);
        if (s === 8) audio.triggerChime(73.42, 'sine', 0.4, 0, 0);
      } else if (ep.key === 'bounce') {
        // Epoch 4: The Big Bounce (crunch into rebirth)
        if (s < 8) {
          // Acoustic crunch downsweep
          const crunchFreqs = [440, 392, 329.63, 261.63, 196, 164.8, 130.8, 82.4];
          audio.triggerChime(crunchFreqs[s], 'sawtooth', 0.15, 0, 0);
          if (s % 2 === 0) audio.playKick(now);
        } else if (s === 8 || s === 9 || s === 10 || s === 11) {
          // Silence vacuum (Zero gravity crunch)
        } else if (s === 12) {
          // Celestial Rebirth chord explosion
          audio.playBigBounceChord();
          audio.playKick(now);
        }
      } else {
        // Epoch 1: Cosmic Inflation / Ambient
        if (s === 0 || s === 8) audio.playKick(now);
        if (s % 4 === 0) audio.playHiHat(true, now);
        const ambNotes = [130.81, 164.81, 196.0, 261.63];
        if (s % 4 === 2) {
          audio.triggerChime(ambNotes[(s / 4) % ambNotes.length], 'sine', 0.7, (s - 8) / 8, 0);
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

// Genre / Epoch Selector Pills
document.querySelectorAll('.genre-pill').forEach((pill) => {
  pill.addEventListener('click', () => {
    const genre = pill.getAttribute('data-genre') || 'techno';
    const epochMap = {
      'singularity': 0,
      'ambient': 1,
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

// Card 1: Morph Geometry
const cardMorph = document.getElementById('card-morph');
if (cardMorph) {
  cardMorph.addEventListener('click', morphGeometry);
}

// Card 2: Send Shockwave Ripple
const cardRipple = document.getElementById('card-ripple');
if (cardRipple) {
  cardRipple.addEventListener('click', () => {
    const rect = cardRipple.getBoundingClientRect();
    ripples.push(new Ripple(rect.left + rect.width / 2, rect.top + rect.height / 2, 1.8));
    audio.triggerChime(392.0, 'triangle', 0.8, -0.6, 0); // G4
  });
}

// Card 3: Resonant Chime Chord
const cardResonance = document.getElementById('card-resonance');
if (cardResonance) {
  cardResonance.addEventListener('click', () => {
    [440, 554.37, 659.25, 880].forEach((freq, i) => {
      setTimeout(() => {
        const panX = ((i - 1.5) / 1.5) * 2;
        audio.triggerChime(freq, 'sine', 0.9, panX, 0);
      }, i * 140);
    });
  });
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

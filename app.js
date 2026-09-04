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

      // Routing: MasterGain -> Filter -> SpatialPanner -> Analyser -> Destination
      if (this.spatialPanner) {
        this.masterGain.connect(this.filter);
        this.filter.connect(this.spatialPanner);
        this.spatialPanner.connect(this.analyser);
      } else {
        this.masterGain.connect(this.filter);
        this.filter.connect(this.analyser);
      }
      this.analyser.connect(this.ctx.destination);

      // Ambient Drone Oscillators
      this.droneGain = this.ctx.createGain();
      this.droneGain.gain.setValueAtTime(0.09, this.ctx.currentTime);

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

      this.initialized = true;
    } catch (e) {
      console.warn('Web Audio initialization:', e);
    }
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
      this.masterGain.gain.setTargetAtTime(0, now, 0.15);
    } else {
      this.masterGain.gain.setTargetAtTime(0.38, now, 0.15);
      this.triggerChime(440, 'sine', 0.8, 0, 0);
    }
    return !this.isMuted;
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
    const baseFreq = 260 + normX * 1100 + (1 - normY) * 600;
    const targetFreq = Math.min(6000, baseFreq + force * 2400);
    this.filter.frequency.setTargetAtTime(targetFreq, now, 0.08);

    // Force Touch Sub-Bass swell
    if (this.subBassGain) {
      this.subBassGain.gain.setTargetAtTime(force * 0.25, now, 0.05);
    }
  }

  triggerChime(freq = 440, type = 'sine', duration = 0.6, posX = 0, posY = 0) {
    if (this.isMuted || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const noteGain = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, now);

      noteGain.gain.setValueAtTime(0.2, now);
      noteGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      // Create localized spatial panner for each chime if supported
      if (this.ctx.createPanner) {
        const chimePanner = this.ctx.createPanner();
        chimePanner.panningModel = 'HRTF';
        if (chimePanner.positionX) {
          chimePanner.positionX.setValueAtTime(posX * 3, now);
          chimePanner.positionY.setValueAtTime(posY * 2, now);
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
      osc.stop(now + duration);
    } catch (err) {
      // Ignored
    }
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
let scene, camera, renderer, wireframeMesh, outerRing, innerCore;
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
  });

  window.addEventListener('pointerup', () => {
    isDragging = false;
    canvas.classList.remove('grabbing');
  });

  // Wheel zoom
  window.addEventListener('wheel', (e) => {
    // Zoom if hovering near canvas or holding shift / trackpad pinch
    targetCameraZ = Math.min(11.5, Math.max(3.8, targetCameraZ + e.deltaY * 0.005));
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
});

const freqBuffer = new Uint8Array(32);

function animateThreeJS() {
  requestAnimationFrame(animateThreeJS);

  const normX = (mouse.x / width) * 2 - 1;
  const normY = -(mouse.y / height) * 2 + 1;

  // Camera smooth zoom
  camera.position.z += (targetCameraZ - camera.position.z) * 0.1;

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

    wireframeMesh.rotation.x += (normY * 0.4 - wireframeMesh.rotation.x) * 0.02;
    wireframeMesh.rotation.y += (normX * 0.5 - wireframeMesh.rotation.y) * 0.02;

    // Scroll depth translation
    wireframeMesh.position.z = -scrollY * 0.003;
    wireframeMesh.position.y = -scrollY * 0.001;

    // Audio Reactive Scale + Mac Force Touch Expansion
    const scale = 1 + bassFactor * 0.22 + trackpadForce * 0.38;
    wireframeMesh.scale.set(scale, scale, scale);

    // Outer orbital ring rotation & pulse
    if (outerRing) {
      outerRing.rotation.z += 0.004;
      outerRing.rotation.y = normX * 0.3;
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

  if (activeGeoText) activeGeoText.textContent = currentName;
  if (cardGeoStatus) cardGeoStatus.textContent = currentName;

  audio.triggerChime(587.33, 'triangle', 0.6, 0, 0); // D5
}

// --- 4. Mac Force Touch Trackpad Integration ---
const forceMeter = document.getElementById('force-meter');
const cursorRing = document.getElementById('cursor-ring');

function updateForce(force) {
  trackpadForce = Math.max(0, Math.min(2.0, force));

  if (forceMeter) {
    if (trackpadForce > 0.05) {
      forceMeter.classList.add('active');
      forceMeter.textContent = `FORCE: ${(trackpadForce * 100).toFixed(0)}%`;
    } else {
      forceMeter.classList.remove('active');
      forceMeter.textContent = `FORCE: 0%`;
    }
  }

  if (cursorRing) {
    if (trackpadForce > 0.05) {
      cursorRing.style.borderWidth = `${1 + trackpadForce * 3}px`;
      cursorRing.style.boxShadow = `0 0 ${16 * trackpadForce}px rgba(255, 255, 255, 0.8)`;
      cursorRing.style.borderColor = '#ffffff';
    } else {
      cursorRing.style.borderWidth = '1px';
      cursorRing.style.boxShadow = 'none';
      cursorRing.style.borderColor = 'rgba(255, 255, 255, 0.3)';
    }
  }

  audio.modulateWithCursor(mouse.targetX / width, mouse.targetY / height, trackpadForce);
}

// Safari / WebKit Apple Force Touch Events
window.addEventListener('webkitmouseforcechanged', (e) => {
  updateForce(e.webkitForce || 0);
});

window.addEventListener('webkitmouseforcedown', () => {
  ripples.push(new Ripple(mouse.x, mouse.y, 1.8));
  audio.triggerChime(329.63, 'triangle', 0.9, 0, 0); // E4
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
});

// Click shockwave ripple
window.addEventListener('click', (e) => {
  if (e.target.closest('button, a, .controls-drawer')) return;
  ripples.push(new Ripple(e.clientX, e.clientY, 1.2));
  audio.triggerChime(523.25, 'sine', 0.7, (e.clientX / width) * 2 - 1, (e.clientY / height) * 2 - 1);
});

// --- 6. Sound Toggle & Auto-Arpeggiator ---
const soundToggle = document.getElementById('sound-toggle');
if (soundToggle) {
  soundToggle.addEventListener('click', () => {
    const isPlaying = audio.toggle();
    if (isPlaying) {
      soundToggle.classList.add('active');
      soundToggle.querySelector('.sound-state').textContent = 'SOUND: ON';
    } else {
      soundToggle.classList.remove('active');
      soundToggle.querySelector('.sound-state').textContent = 'SOUND: OFF';
    }
  });
}

// Auto-Arpeggiator loop
let arpTimer = null;
let isArpActive = false;
const arpNotes = [220, 277.18, 329.63, 440, 554.37, 440, 329.63, 277.18];
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
      audio.triggerChime(freq, 'sine', 0.5, panX, 0);

      // Flash corresponding button visually
      const matchingKey = document.querySelector(`.synth-key[data-freq="${freq}"]`);
      if (matchingKey) {
        matchingKey.classList.add('active-key');
        setTimeout(() => matchingKey.classList.remove('active-key'), 160);
      }

      arpIndex++;
    }, 280);
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

// --- 7. Playable Computer Keyboard Synthesis ---
const keyNoteMap = {
  '1': { freq: 220, type: 'triangle' },
  'a': { freq: 220, type: 'triangle' },
  '2': { freq: 277.18, type: 'sine' },
  's': { freq: 277.18, type: 'sine' },
  '3': { freq: 329.63, type: 'sine' },
  'd': { freq: 329.63, type: 'sine' },
  '4': { freq: 440, type: 'triangle' },
  'f': { freq: 440, type: 'triangle' },
  '5': { freq: 554.37, type: 'sine' },
  'g': { freq: 554.37, type: 'sine' },
};

function triggerNoteByKey(keyChar) {
  const noteData = keyNoteMap[keyChar.toLowerCase()];
  if (!noteData) return;

  audio.init();
  if (audio.isMuted) audio.toggle();

  audio.triggerChime(noteData.freq, noteData.type, 0.75, 0, 0);

  // Find and flash key button
  const button = document.querySelector(`.synth-key[data-key="${keyChar}"]`) ||
                 document.querySelector(`.synth-key[data-key-alt="${keyChar.toLowerCase()}"]`);
  if (button) {
    button.classList.add('active-key');
    setTimeout(() => button.classList.remove('active-key'), 180);
  }

  // Small visual ripple
  ripples.push(new Ripple(mouse.x, mouse.y, 0.8));
}

window.addEventListener('keydown', (e) => {
  if (e.repeat) return;
  const key = e.key.toLowerCase();

  // Escape key closes open modals
  if (key === 'escape') {
    closeControlsModal();
    closeTimelineModal();
    return;
  }

  // Question mark toggles controls
  if (key === '?') {
    toggleControlsModal();
    return;
  }

  // 't' key toggles Chronicles Timeline
  if (key === 't') {
    toggleTimelineModal();
    return;
  }

  // 'm' key toggles mute
  if (key === 'm') {
    if (soundToggle) soundToggle.click();
    return;
  }

  if (keyNoteMap[key]) {
    triggerNoteByKey(key);
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
  if (controlsModal) controlsModal.classList.add('open');
  audio.triggerChime(554.37, 'sine', 0.3, 0, 0);
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

if (controlsToggle) controlsToggle.addEventListener('click', toggleControlsModal);
if (closeControls) closeControls.addEventListener('click', closeControlsModal);
if (controlsBackdrop) controlsBackdrop.addEventListener('click', closeControlsModal);

// --- 11. Chronicles // Timeline Modal Logic ---
const timelineModal = document.getElementById('timeline-modal');
const timelineToggle = document.getElementById('timeline-toggle');
const closeTimeline = document.getElementById('close-timeline');
const timelineBackdrop = document.getElementById('timeline-backdrop');

function openTimelineModal() {
  closeControlsModal();
  if (timelineModal) timelineModal.classList.add('open');
  audio.triggerChime(659.25, 'triangle', 0.4, 0, 0); // E5
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

if (timelineToggle) timelineToggle.addEventListener('click', toggleTimelineModal);
if (closeTimeline) closeTimeline.addEventListener('click', closeTimelineModal);
if (timelineBackdrop) timelineBackdrop.addEventListener('click', closeTimelineModal);

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

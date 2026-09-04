/**
 * VOID // 001 - Creative Playground & Art Experiment
 * 100% Pitch-Black Interactive Experience
 */

// --- 1. Sound Engine (Web Audio API) ---
class SoundEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.filter = null;
    this.droneOsc1 = null;
    this.droneOsc2 = null;
    this.droneGain = null;
    this.analyser = null;
    this.isMuted = true;
    this.initialized = false;
  }

  init() {
    if (this.initialized) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0, this.ctx.currentTime);

      this.filter = this.ctx.createBiquadFilter();
      this.filter.type = 'lowpass';
      this.filter.frequency.setValueAtTime(450, this.ctx.currentTime);
      this.filter.Q.setValueAtTime(4, this.ctx.currentTime);

      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 64;

      this.masterGain.connect(this.filter);
      this.filter.connect(this.analyser);
      this.analyser.connect(this.ctx.destination);

      // Start ambient drone oscillators
      this.droneGain = this.ctx.createGain();
      this.droneGain.gain.setValueAtTime(0.08, this.ctx.currentTime);

      this.droneOsc1 = this.ctx.createOscillator();
      this.droneOsc1.type = 'sine';
      this.droneOsc1.frequency.setValueAtTime(55, this.ctx.currentTime); // A1 note

      this.droneOsc2 = this.ctx.createOscillator();
      this.droneOsc2.type = 'triangle';
      this.droneOsc2.frequency.setValueAtTime(110, this.ctx.currentTime); // A2 note

      this.droneOsc1.connect(this.droneGain);
      this.droneOsc2.connect(this.droneGain);
      this.droneGain.connect(this.masterGain);

      this.droneOsc1.start();
      this.droneOsc2.start();

      this.initialized = true;
    } catch (e) {
      console.warn('Web Audio API not supported or blocked:', e);
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
      this.masterGain.gain.setTargetAtTime(0.35, now, 0.15);
      this.triggerChime(440, 'sine', 0.8);
    }
    return !this.isMuted;
  }

  modulateWithCursor(normX, normY) {
    if (!this.filter || this.isMuted) return;
    const now = this.ctx.currentTime;
    const targetFreq = 250 + normX * 1200 + (1 - normY) * 600;
    this.filter.frequency.setTargetAtTime(targetFreq, now, 0.08);
  }

  triggerChime(freq = 440, type = 'sine', duration = 0.6) {
    if (this.isMuted || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const noteGain = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, now);

      noteGain.gain.setValueAtTime(0.18, now);
      noteGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      osc.connect(noteGain);
      noteGain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + duration);
    } catch (err) {
      // Ignored if audio not yet primed
    }
  }
}

const audio = new SoundEngine();

// --- 2. Spotlight Canvas Grid & Particles ---
const gridCanvas = document.getElementById('grid-canvas');
const gCtx = gridCanvas.getContext('2d');

let width = (gridCanvas.width = window.innerWidth);
let height = (gridCanvas.height = window.innerHeight);

const mouse = {
  x: width / 2,
  y: height / 2,
  targetX: width / 2,
  targetY: height / 2,
  radius: 240,
};

const ripples = [];

class Ripple {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.radius = 10;
    this.maxRadius = Math.max(width, height) * 0.7;
    this.opacity = 0.8;
  }
  update() {
    this.radius += 14;
    this.opacity *= 0.95;
  }
  draw(ctx) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(255, 255, 255, ${this.opacity * 0.35})`;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();
  }
}

// Background ambient dust particles
const dustCount = 80;
const dustParticles = [];
for (let i = 0; i < dustCount; i++) {
  dustParticles.push({
    x: Math.random() * width,
    y: Math.random() * height,
    vx: (Math.random() - 0.5) * 0.3,
    vy: (Math.random() - 0.5) * 0.3,
    size: Math.random() * 1.5 + 0.5,
  });
}

function drawGrid() {
  gCtx.fillStyle = '#000000';
  gCtx.fillRect(0, 0, width, height);

  // Smooth mouse lerp
  mouse.x += (mouse.targetX - mouse.x) * 0.08;
  mouse.y += (mouse.targetY - mouse.y) * 0.08;

  // Render ripples
  for (let i = ripples.length - 1; i >= 0; i--) {
    const r = ripples[i];
    r.update();
    r.draw(gCtx);
    if (r.opacity < 0.02) ripples.splice(i, 1);
  }

  // Draw grid only illuminated by cursor spotlight
  const gridSize = 48;
  const rad = mouse.radius;
  const startX = Math.floor((mouse.x - rad) / gridSize) * gridSize;
  const endX = Math.ceil((mouse.x + rad) / gridSize) * gridSize;
  const startY = Math.floor((mouse.y - rad) / gridSize) * gridSize;
  const endY = Math.ceil((mouse.y + rad) / gridSize) * gridSize;

  for (let x = startX; x <= endX; x += gridSize) {
    for (let y = startY; y <= endY; y += gridSize) {
      const dist = Math.hypot(x - mouse.x, y - mouse.y);
      if (dist < rad) {
        const alpha = Math.pow(1 - dist / rad, 1.8) * 0.35;

        // Subtle crosshair / dot at grid intersection
        gCtx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        gCtx.fillRect(x - 1, y - 1, 2, 2);

        // Thin lines radiating out near cursor
        if (dist < rad * 0.65) {
          const lineAlpha = (1 - dist / (rad * 0.65)) * 0.12;
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

  // Ambient dust particles revealed in spotlight
  dustParticles.forEach((p) => {
    p.x = (p.x + p.vx + width) % width;
    p.y = (p.y + p.vy + height) % height;

    const dist = Math.hypot(p.x - mouse.x, p.y - mouse.y);
    if (dist < rad * 1.3) {
      const alpha = (1 - dist / (rad * 1.3)) * 0.6;
      gCtx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
      gCtx.beginPath();
      gCtx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      gCtx.fill();
    }
  });

  requestAnimationFrame(drawGrid);
}
drawGrid();

// --- 3. Three.js 3D Wireframe Scene ---
let scene, camera, renderer, wireframeMesh, outerRing, innerCore;
let currentGeoIndex = 0;
const geometries = [];

function initThreeJS() {
  const container = document.getElementById('webgl-canvas');
  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.z = 7;

  renderer = new THREE.WebGLRenderer({
    canvas: container,
    alpha: true,
    antialias: true,
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  // Geometries to cycle through
  geometries.push(new THREE.IcosahedronGeometry(2.1, 1));
  geometries.push(new THREE.TorusKnotGeometry(1.4, 0.4, 100, 16));
  geometries.push(new THREE.OctahedronGeometry(2.4, 2));
  geometries.push(new THREE.DodecahedronGeometry(2.2, 1));

  // Main wireframe material
  const wireMat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    wireframe: true,
    transparent: true,
    opacity: 0.45,
  });

  wireframeMesh = new THREE.Mesh(geometries[0], wireMat);
  scene.add(wireframeMesh);

  // Inner glowing core
  const coreMat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    wireframe: true,
    transparent: true,
    opacity: 0.15,
  });
  innerCore = new THREE.Mesh(new THREE.SphereGeometry(1.2, 12, 12), coreMat);
  scene.add(innerCore);

  // Outer orbital ring
  const ringMat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    wireframe: true,
    transparent: true,
    opacity: 0.2,
  });
  outerRing = new THREE.Mesh(new THREE.TorusGeometry(3.3, 0.02, 16, 80), ringMat);
  outerRing.rotation.x = Math.PI / 2.8;
  scene.add(outerRing);

  animateThreeJS();
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

function animateThreeJS() {
  requestAnimationFrame(animateThreeJS);

  const normX = (mouse.x / width) * 2 - 1;
  const normY = -(mouse.y / height) * 2 + 1;

  if (wireframeMesh) {
    // Base constant spin + smooth mouse tracking
    wireframeMesh.rotation.y += 0.003;
    wireframeMesh.rotation.x += 0.002;

    wireframeMesh.rotation.x += (normY * 0.6 - wireframeMesh.rotation.x) * 0.04;
    wireframeMesh.rotation.y += (normX * 0.8 - wireframeMesh.rotation.y) * 0.04;

    // Scroll effect: move back and rotate faster with scroll
    wireframeMesh.position.z = -scrollY * 0.003;
    wireframeMesh.position.y = -scrollY * 0.001;

    // Outer ring counter-rotation
    if (outerRing) {
      outerRing.rotation.z += 0.004;
      outerRing.rotation.y = normX * 0.3;
    }

    if (innerCore) {
      innerCore.rotation.y -= 0.005;
    }
  }

  renderer.render(scene, camera);
}

// Morph to next 3D geometry
function morphGeometry() {
  currentGeoIndex = (currentGeoIndex + 1) % geometries.length;
  wireframeMesh.geometry = geometries[currentGeoIndex];
  audio.triggerChime(587.33, 'triangle', 0.5); // D5
}

// --- 4. Interactive Event Listeners ---
const cursorDot = document.getElementById('cursor-dot');
const cursorRing = document.getElementById('cursor-ring');

window.addEventListener('mousemove', (e) => {
  mouse.targetX = e.clientX;
  mouse.targetY = e.clientY;

  if (cursorDot) {
    cursorDot.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
  }
  if (cursorRing) {
    cursorRing.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
  }

  const coordTracker = document.getElementById('coords');
  if (coordTracker) {
    coordTracker.textContent = `X: ${e.clientX} | Y: ${e.clientY}`;
  }

  // Modulate audio filter with cursor
  audio.modulateWithCursor(e.clientX / width, e.clientY / height);
});

// Click ripple shockwave
window.addEventListener('click', (e) => {
  // Avoid triggering duplicate click sound on interactive buttons
  if (e.target.closest('button, a')) return;
  ripples.push(new Ripple(e.clientX, e.clientY));
  audio.triggerChime(523.25, 'sine', 0.7); // C5
});

// Sound Toggle Button
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

// 3D Perspective Card Tilt
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
    audio.triggerChime(659.25, 'sine', 0.35); // E5
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
  cardMorph.addEventListener('click', () => {
    morphGeometry();
  });
}

// Card 2: Send Shockwave Ripple
const cardRipple = document.getElementById('card-ripple');
if (cardRipple) {
  cardRipple.addEventListener('click', (e) => {
    const rect = cardRipple.getBoundingClientRect();
    ripples.push(new Ripple(rect.left + rect.width / 2, rect.top + rect.height / 2));
    audio.triggerChime(392.0, 'triangle', 0.8); // G4
  });
}

// Card 3: Resonant Chime Chord
const cardResonance = document.getElementById('card-resonance');
if (cardResonance) {
  cardResonance.addEventListener('click', () => {
    [440, 554.37, 659.25, 880].forEach((freq, i) => {
      setTimeout(() => audio.triggerChime(freq, 'sine', 0.9), i * 140);
    });
  });
}

// Synth Interactive Playground Keys
document.querySelectorAll('.synth-key').forEach((key) => {
  key.addEventListener('click', () => {
    audio.init();
    if (audio.isMuted) audio.toggle();
    const freq = parseFloat(key.getAttribute('data-freq') || '440');
    const type = key.getAttribute('data-type') || 'sine';
    audio.triggerChime(freq, type, 0.75);

    // Also trigger miniature canvas ripple
    const rect = key.getBoundingClientRect();
    ripples.push(new Ripple(rect.left + rect.width / 2, rect.top + rect.height / 2));
  });
});

// Audio Visualizer Canvas
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
      // Idle ambient baseline
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

// Window resize handler
window.addEventListener('resize', () => {
  width = gridCanvas.width = window.innerWidth;
  height = gridCanvas.height = window.innerHeight;

  if (camera && renderer) {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }
});

// Initialize Three.js when script loads
window.addEventListener('DOMContentLoaded', () => {
  if (typeof THREE !== 'undefined') {
    initThreeJS();
  }
});

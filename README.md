# VOID // Creative Playground & Art Experiment

> A minimalist, 100% pitch-black (`#000000`) interactive art experiment in pure darkness, dimensional 3D wireframe geometry, Apple Force Touch trackpad dynamics, and binaural HRTF spatial audio synthesis.

Live site: [jennsolenya.github.io](https://jennsolenya.github.io)

---

## Project Evolution Timeline

```
  v0.0.0 [Genesis]             v0.1.0 [Void Foundation]              v0.2.0 [Spatial & Tactile Leap]          v0.3.0+ [Roadmap]
  Hello World init             Pitch-black matrix                    Mac Force Touch & 3D Orbit               Radar Mode
        │                              │                                           │                                │
  [2026-09-04]                   [2026-09-04]                                [2026-09-04]                        [Upcoming]
        ├──────────────────────────────┼───────────────────────────────────────────┼────────────────────────────────┤
   • Repo created                • Pure #000000 void palette                • Apple Force Touch trackpad pressure • Radar scan mode
   • GitHub Pages initialized    • Canvas cursor spotlight grid             • Direct 3D orbit drag & zoom inertia • Multi-touch particles
                                 • Three.js wireframe sculpture             • Binaural HRTF Spatial Audio (AirPods) • Shader wave ripples
                                 • Web Audio ambient drone synth            • Audio-reactive wireframe pulsing   • Custom preset saves
                                 • 3D perspective tilt cards                • Physical keyboard synth (1-5 / A-G)
                                 • Google Fonts typography                  • Auto-arpeggiator generative loop
                                                                            • Slide-out Controls guide drawer
```

### Visual Milestone Breakdown

| Milestone | Release Tag | Date | Key Capabilities Added |
| :--- | :--- | :--- | :--- |
| **Phase 0: Genesis** | [`init`](https://github.com/jennsolenya/jennsolenya.github.io/commit/ed61790) | 2026-09-04 | Clean repository initialization and GitHub Pages baseline. |
| **Phase 1: Void Foundation** | [`v0.1.0`](https://github.com/jennsolenya/jennsolenya.github.io/commit/fefbb25) | 2026-09-04 | • 100% pitch-black background (`#000000`) with zero bleed.<br>• Interactive cursor spotlight revealing hidden coordinate matrix & dust.<br>• Floating 3D wireframe geometric sculpture with Three.js.<br>• Web Audio API ambient drone and interactive sine chimes.<br>• 3D perspective card tilt on hover. |
| **Phase 2: Tactile & Spatial Leap** | [`v0.2.0-spatial-orbit`](https://github.com/jennsolenya.github.io/releases/tag/v0.2.0-spatial-orbit) | 2026-09-04 | • **Mac Force Touch Trackpad**: pressure sensitivity expands spotlight, triggers sub-bass (`36.7Hz D1`), and grows 3D shape.<br>• **Direct 3D Orbit & Zoom**: click-and-drag rotation with momentum + pinch/wheel zoom.<br>• **Active Geometry HUD**: real-time `[ 1/4: ICOSAHEDRON ]` badge.<br>• **Binaural HRTF Spatial Audio**: calibrated for AirPods Pro 3 & stereo headphones; sound rotates in 3D around head.<br>• **Audio-Reactive Mesh**: wireframe pulses to live audio frequencies.<br>• **Physical Keyboard Synthesis**: play keys `1-5` or `A-G` directly.<br>• **Auto-Arpeggiator**: generative ambient loop.<br>• **Mechanics Guide**: accessible `[ ? CONTROLS ]` drawer overlay. |
| **Phase 2.3: Generative Beat Engine** | [`v0.2.3-beat-engine`](https://github.com/jennsolenya.github.io/releases/tag/v0.2.3-beat-engine) | 2026-09-04 | • **Generative Electronic Beat Sequencer**: procedural 16-step drum machine with Kick, Snare, Hi-Hats, and Wobble Bass.<br>• **Genre Modes**: 130 BPM Industrial Techno, 140 BPM Skrillex-style Wobble Dubstep, and 85 BPM Ambient.<br>• **AZERTY / QWERTY Toggle**: physical layout switcher + auto-detection heuristic on keystroke.<br>• **Calibrated Force Touch**: smooth analog pressure curve (0-50% touch/click, 50-100% deep force).<br>• **Trackpad 2-Finger Orbit**: two-finger swipe spins 3D models with momentum. |
| **Phase 3: Upcoming Horizons** | `v0.3.0` | In Progress | • 360° Radar Scan mode for matrix exploration.<br>• Vertex wave shader distortion.<br>• Mobile multi-touch gravitational particles.<br>• Tone customization & recording export. |

---

## Interactive Mechanics & Controls

| Input | Target | Action |
| :--- | :--- | :--- |
| **Cursor Move** | Viewport | Casts a radial spotlight revealing hidden grid coordinates and cosmic dust. Modulates audio filter cutoff frequency. |
| **Click & Drag / 2-Finger Swipe** | 3D WebGL Canvas | Rotates the 3D wireframe manifold freely in 3D space with fluid inertia. |
| **Pinch / Scroll** | 3D WebGL Canvas | Zooms camera closer (`z: 3.8`) or further into the deep void (`z: 11.5`). |
| **Trackpad Force** | Mac Trackpad | Calibrated analog pressure: light touch (0-49%), click (50%), deep press (50-100%). Surges spotlight radius, sub-bass, and wireframe scale. |
| **Click** | Canvas / Background | Sends expanding kinetic shockwave rings across the coordinate grid. |
| **Keys `A – Z` / `0 – 9`** | Keyboard Synth | Musically mapped 3-octave keyboard across AZERTY or QWERTY layouts with real-time HUD tracker. |
| **Spacebar** | Sound Engine | Drops a massive sub-bass 808 hit (`43.65Hz F1`) and sends a high-power shockwave across the void. |
| **Key `B` or Button** | Music Engine | Toggles the 16-step generative electronic beat sequencer (Techno, Dubstep, or Ambient). |
| **Key `M`** | Sound Engine | Toggles global audio mute / unmute with synchronized power-up/down transitions. |
| **Key `T` or Button** | System Log | Opens / closes the in-app **SYSTEM LOG // CHRONICLES** evolution timeline drawer. |
| **Key `?` or Button** | HUD Guide | Opens / closes the slide-out Mechanics & Controls drawer. |
| **Key `Esc`** | Modals | Closes open drawers or overlays. |

---

## Acoustic Architecture

- **Binaural HRTF 3D Panner**: Web Audio `PannerNode` with `panningModel: 'HRTF'`, simulating head-related transfer function for genuine 3D acoustic immersion on AirPods Pro 3 and high-end stereo headphones.
- **Ambient Drone Generator**: Dual sine & triangle oscillators tuned to `55Hz (A1)` and `110Hz (A2)`.
- **Force Touch Sub-Bass**: Dedicated `36.7Hz (D1)` sub-bass oscillator activated proportionally by trackpad pressure.
- **Dynamic Biquad Filter**: Real-time cutoff modulation sweeping between `260Hz` and `6000Hz`.
- **Audio Analyser FFT**: 64-band frequency analyzer driving real-time 3D geometry vibration and canvas visualizer waveforms.

---

## Technology Stack

- **Core**: Vanilla HTML5, Vanilla JavaScript (ES6+), Vanilla CSS3 (Custom properties, 3D transforms, Glassmorphism).
- **3D Graphics**: [Three.js](https://threejs.org/) (r128).
- **Sound Synthesis**: Native Browser [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API) (HRTF Spatial Panner, BiquadFilter, AnalyserNode, Oscillators).
- **Hardware Integrations**: Apple WebKit Force Touch API (`webkitmouseforcechanged`), W3C Pointer Events.
- **Typography**: [Space Grotesk](https://fonts.google.com/specimen/Space+Grotesk) & [JetBrains Mono](https://fonts.google.com/specimen/JetBrains+Mono).
- **Hosting**: GitHub Pages (Zero build step, 100% static & blazing fast).

---

## Local Development

Preview the site locally with any static HTTP server:

```bash
# Using Python 3 (built into macOS)
python3 -m http.server 8080
```

Then visit [`http://localhost:8080`](http://localhost:8080) in Safari or Chrome.

---

## Versioning & Git Checkpoints

Every major evolution milestone is tagged in git for instant rollback:

```bash
# View all milestone releases
git tag -l

# Roll back / inspect a specific checkpoint
git checkout v0.2.0-spatial-orbit
```

License: MIT

# AGENTS.md // Guidelines for AI Agents (Jules, Antigravity & Contributors)

Welcome! This repository hosts **VOID**, an audio-kinetic generative laboratory and electronic music sound architect studio deployed on GitHub Pages (`jennsolenya.github.io`).

Whether you are **Jules** (background security, performance & code health watchdog), **Antigravity** (live creative features & audio-visual systems architect), or any other agent/developer, please adhere strictly to these architectural rules.

---

## 1. Project Philosophy & Stack
- **Architecture**: Zero-build, vanilla web stack designed for native browser execution.
  - `index.html`: Semantic HTML5 document structure.
  - `style.css`: Obsidian-void design system with CSS custom properties (`--bg-void`, `--neon-cyan`, etc.).
  - `app.js`: Web Audio API procedural synthesizer + Three.js 3D wireframe topology + 2D HTML5 Canvas particle collider physics.
- **Hosting**: GitHub Pages static hosting. Do not introduce heavy npm bundler dependencies (Webpack, Vite, Tailwind, etc.) unless explicitly requested by the user.

---

## 2. Strict Design Directives

### 🚫 ZERO-EMOJI POLICY (Absolute Rule)
- **Emojis are strictly prohibited** in code, comments, UI text, HUD badges, and logs.
- Instead, use **technical monospace glyphs**, geometric line symbols, and architectural brackets:
  - Play: `>`
  - Pause / Freeze: `||`
  - Action / Add: `[ + ]`
  - Index / Chapter prefix: `//`
  - Telemetry: Monospace brackets (e.g. `[ 01 // ACID WAREHOUSE • 135 BPM ]`)
  - Cross / Close: `&times;` or `[ X ]`

### 🎨 Obsidian & Technical Aesthetics
- Maintain high-contrast, minimalist pitch-black aesthetics (`#000000`, `#050505`).
- Keep micro-animations snappy and GPU-accelerated (use `transform` and `opacity`).
- Never introduce chaotic overstimulating popups or unformatted alerts.

---

## 3. Web Audio Engine Guardrails (`app.js`)

The sound engine in `SpatialSoundEngine` and `CosmicUniverseEngine` is a precision Web Audio graph modeled after world-class electronic music producers (Charlotte de Witte, Amelie Lens, 999999999, Noisia, Mefjus, Skrillex):

1. **Master Dynamics Limiter**:
   - `this.compressor` (`DynamicsCompressorNode`) sits between the analyser and destination. **Never bypass or disconnect it**; it prevents digital clipping at higher master gains (`0.62`).
2. **Pumping Sidechain Bus**:
   - Bass and acid synths route through `this.sidechainGain`. Kicks trigger `triggerSidechain(time)` to create the characteristic warehouse pumping effect. Do not route bass lines directly to master without sidechain.
3. **Synthesis Modes**:
   - **Techno / Acid**: Dual 303 sawtooth stacking (+7 cents detune), resonant decay ($Q \le 18.0$), Ben Klock rumble kicks.
   - **DnB**: 174 BPM syncopated breakbeats, Mefjus FM bass, detuned Reese bass.
   - **Dubstep**: 145 BPM half-time riddim, Virtual Riot formant vowel growls with 16th-note LFO chop, Trampa sub-808s.
4. **User Gesture Requirement**:
   - Browsers block `AudioContext` until a user gesture occurs. Always initialize or resume `audio.ctx` within click/keydown event handlers.

---

## 4. Resilience & Defensive Programming

1. **DOM Queries**:
   - Always verify elements exist before attaching listeners or mutating properties:
     ```javascript
     const el = document.getElementById('element-id');
     if (el) el.addEventListener('click', handler);
     ```
2. **WebGL / Three.js Fallbacks**:
   - Wrap `initThreeJS()` in `try/catch`.
   - In `morphGeometry()`, verify `wireframeMesh` and `geometries[currentGeoIndex]` exist before updating `.geometry`. Non-WebGL environments must not crash surrounding UI or audio engines.
3. **Security (DOM XSS)**:
   - When rendering dynamic or stored user data (e.g., in `localStorage` memory shelf), never assign unsanitized strings directly to `innerHTML`. Use `textContent` or create DOM nodes safely.

---

## 5. Automated Verification & Testing

Before opening or merging any PR, all agents must verify that changes pass:

1. **Syntax Check**:
   ```bash
   deno check app.js
   ```
2. **Browser Execution & Zero Console Errors**:
   - Ensure the app loads without uncaught exceptions or broken event handlers.
   - Verify modal classes use `.open` (e.g., `#universe-modal.open`, `#timeline-modal.open`, `#controls-modal.open`).
3. **Regression Tests**:
   ```bash
   node test_xss.js
   ```

---

## 6. Multi-Agent Collaboration Protocol

- **Jules**: Proactively identifies security risks, edge cases, performance optimizations (e.g., DOM query caching), and clean code refactors.
- **Antigravity**: Handles live pair-programming, major creative feature expansions, WebGL/Three.js additions, audio synthesis, and local browser testing.
- **PR Etiquette**:
  - Keep PRs atomic and focused on a single responsibility.
  - Write clear commit messages and PR summaries explaining *why* a change is made.

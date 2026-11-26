const fs = require('fs');

const app = fs.readFileSync('app.js', 'utf8');
const html = fs.readFileSync('index.html', 'utf8');

function assert(condition, message) {
  if (!condition) throw new Error(`Runtime diagnostics gate failed: ${message}`);
}

assert(app.includes("get('diagnostics') === '1'"), 'diagnostics must be explicitly opt-in');
assert(app.includes('window.__VOID_RUNTIME_DIAGNOSTICS__'), 'browser diagnostics must be inspectable');
for (const frameType of ['three', 'collider', 'visualizer']) {
  assert(app.includes(`recordFrame('${frameType}'`), `${frameType} frame timing must be recorded`);
}
for (const metric of ['particles', 'memory', 'visibilityChanges', 'resizes', 'unhandledRejections', 'highWater']) {
  assert(app.includes(metric), `${metric} must have a runtime metric`);
}
assert(app.includes("['createOscillator', 'createBufferSource']"), 'audio source creation must be measurable');
assert(app.includes('this.shockwaves.length'), 'particle shockwave cost must be measurable');
assert(app.includes('this.numParticles = isMobile ? 800 : 2000'), 'particle budgets must remain bounded by viewport class');
assert(app.includes('const dpr = Math.min(window.devicePixelRatio || 1, 1.25)'), 'collider pixel ratio must be capped for high-DPI efficiency');
assert(app.includes('const maxRatio = 1.25'), 'Three.js pixel ratio must be capped for high-DPI efficiency');
assert(app.includes('if (this.shockwaves.length >= 12) this.shockwaves.shift()'), 'shockwave queue must remain bounded');
assert(app.includes('if (prefersReducedMotion || this.animationRunning || !isDocumentVisible || this.isOffscreen) return;'), 'offscreen and reduced-motion animation must stop');
assert((app.match(/fallback\.hidden = false/g) || []).length >= 2, 'WebGL fallback must cover missing and failed renderer paths');
assert(html.includes('id="runtime-diagnostics"'), 'diagnostics must have a browser-visible output surface');
assert(html.includes('id="webgl-fallback"'), 'browser fallback surface must remain present');

console.log('Runtime diagnostics contract passed.');

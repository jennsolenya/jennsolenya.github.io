const fs = require('fs');

const app = fs.readFileSync('app.js', 'utf8');
const html = fs.readFileSync('index.html', 'utf8');

function assert(condition, message) {
  if (!condition) throw new Error(`Visual story gate failed: ${message}`);
}

assert(app.includes('this.events = new Map()'), 'director must retain bounded event types');
assert(app.includes('getEvent(type)'), 'visual systems must be able to read a specific event pulse');
assert(app.includes("eventStrength('drop', 900)"), 'drop energy must reach visual systems');
assert(app.includes("audioVisualDirector.getEvent('drop')"), 'drops must trigger a one-shot visual transition');
assert(app.includes("if (this.shockwaves.length >= 12) this.shockwaves.shift()"), 'shockwaves must have a bounded queue');
for (const mode of ['inflation', 'accretion', 'vortex', 'quantum']) {
  assert(app.includes(`'${mode}'`), `collider story must include ${mode} mode`);
}
assert(app.includes("'INTRO GROOVE': 'inflation'"), 'intro must map to inflation');
assert(app.includes("'BUILD TENSION': 'accretion'"), 'build must map to accretion');
assert(app.includes("'PEAK ENERGY': 'vortex'"), 'peak must map to vortex');
assert(app.includes('BREAKDOWN: \'quantum\''), 'breakdown must map to quantum foam');
assert(html.includes('The field follows the music'), 'collider narrative must explain the audiovisual arc');

console.log('Visual story gate passed.');

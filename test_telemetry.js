const fs = require('fs');

const app = fs.readFileSync('app.js', 'utf8');

function assert(condition, message) {
  if (!condition) throw new Error(`Telemetry contract failed: ${message}`);
}

for (const key of ['rms', 'bass', 'mid', 'high', 'energy', 'beatPhase', 'section', 'genre', 'lastEvent']) {
  assert(app.includes(`${key}:`), `shared state must define ${key}`);
}

assert(app.includes('class AudioVisualDirector'), 'director class must exist');
assert(app.includes('sampleAnalyser(analyser'), 'director must own analyser sampling');
assert((app.match(/getByteFrequencyData\(/g) || []).length === 1, 'analyser data must be sampled in one shared location');
for (const eventName of ['beat', 'kick', 'snare', 'riser', 'section-change', 'silence']) {
  assert(app.includes(`'${eventName}'`), `sequencer must emit ${eventName} events`);
}
assert(app.includes('audioVisualDirector.subscribe'), 'collider must subscribe to shared events');
assert(app.includes('audioVisualDirector.eventStrength'), 'collider must react to event strength');

console.log('Audio-visual telemetry contract passed.');

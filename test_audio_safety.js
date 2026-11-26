const fs = require('fs');

const app = fs.readFileSync('app.js', 'utf8');

function assert(condition, message) {
  if (!condition) throw new Error(`Audio safety gate failed: ${message}`);
}

for (const method of ['playClap', 'playRiser', 'playTranceChord', 'playTranceArp', 'playDropImpact']) {
  const start = app.indexOf(`  ${method}(`);
  const end = app.indexOf('\n  }', start);
  assert(start >= 0 && end > start, `${method} must exist`);
  assert(app.slice(start, end).includes('.stop('), `${method} must stop every scheduled voice`);
}

const growlStart = app.indexOf('  playSkrillexGrowlAdvanced(');
const growlEnd = app.indexOf('\n  }', growlStart);
assert(growlStart >= 0 && growlEnd > growlStart, 'advanced growl must exist');
assert(app.slice(growlStart, growlEnd).includes('this.sidechainGain || this.masterGain'), 'advanced growl must use sidechain routing');
assert(app.includes('this.analyser.connect(this.compressor)'), 'analyser must remain upstream of compressor');
assert(app.includes('this.compressor.connect(this.ctx.destination)'), 'compressor must remain the final protection stage');
assert(app.includes('clearTimeout(this.beatTimer)'), 'sequencer timer must be cleared on stop');
assert(app.includes('clearInterval(arpTimer)'), 'arpeggiator interval must be cleared on stop');
assert(app.includes('arpTimer = null'), 'arpeggiator interval handle must be released');
assert(app.includes('this.subBassBus = this.ctx.createGain()'), 'sub-bass layer must have a dedicated bus');
assert(app.includes('this.midBassBus = this.ctx.createGain()'), 'mid-bass layer must have a dedicated bus');
assert(/this\.initialized = false;\s*this\.voiceStats = [^;]+;\s*this\.genre = 'techno';/.test(app), 'audio must have a stable default genre before the first gesture');
assert(app.includes('audio.setGenre(this.getCurrentEpoch().key)'), 'startup must reapply the selected genre after AudioContext creation');
assert(app.includes('Math.floor(measure / 2) + section'), 'modern bass patterns must vary in memorable two-bar phrases');

console.log('Audio safety gate passed.');

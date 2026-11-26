const fs = require('fs');

const html = fs.readFileSync('index.html', 'utf8');
const app = fs.readFileSync('app.js', 'utf8');

function assert(condition, message) {
  if (!condition) {
    throw new Error(`Security gate failed: ${message}`);
  }
}

assert(html.includes('Content-Security-Policy'), 'index.html must declare a Content-Security-Policy');
assert(html.includes('<meta name="referrer" content="no-referrer">'), 'index.html must minimize referrer leakage');
assert(!/<\w+[^>]+\son[a-z]+\s*=/i.test(html), 'HTML must not contain inline event-handler attributes');
assert(!/\sstyle\s*=/.test(html), 'HTML must not contain inline style attributes');

for (const match of html.matchAll(/<a\b[^>]*target="_blank"[^>]*>/gi)) {
  assert(/\brel="[^"]*\bnoopener\b[^"]*\bnoreferrer\b[^"]*"/i.test(match[0]), 'new-tab links must include noopener and noreferrer');
}

assert(app.includes('function getSavedKeyboardLayout()'), 'keyboard layout storage must use a guarded reader');
assert(!app.includes('let currentLayout = localStorage.getItem'), 'keyboard layout must not read localStorage at module scope');
assert(!/document\.cookie\b/.test(app), 'runtime must not access document.cookie');
assert(!/\beval\s*\(/.test(app), 'runtime must not use eval');
assert(!/\bnew\s+Function\s*\(/.test(app), 'runtime must not construct executable strings');
assert(!/\b(?:fetch|WebSocket)\s*\(/.test(app), 'runtime must not add unreviewed network execution paths');

console.log('Static security gate passed.');

const fs = require('fs');

const html = fs.readFileSync('index.html', 'utf8');
const app = fs.readFileSync('app.js', 'utf8');
const workflow = fs.readFileSync('.github/workflows/ci.yml', 'utf8');

function assert(condition, message) {
  if (!condition) {
    throw new Error(`Security gate failed: ${message}`);
  }
}

assert(html.includes('Content-Security-Policy'), 'index.html must declare a Content-Security-Policy');
assert(html.includes('<meta name="referrer" content="no-referrer">'), 'index.html must minimize referrer leakage');
assert(!/<\w+[^>]+\son[a-z]+\s*=/i.test(html), 'HTML must not contain inline event-handler attributes');
assert(!/\sstyle\s*=/.test(html), 'HTML must not contain inline style attributes');

for (const match of html.matchAll(/<script\b[^>]*src="https?:\/\/[^" ]+"[^>]*>/gi)) {
  assert(/\bintegrity="sha(?:256|384|512)-[A-Za-z0-9+/=]+"/i.test(match[0]), 'external scripts must use SRI integrity metadata');
}

for (const match of html.matchAll(/<a\b[^>]*target="_blank"[^>]*>/gi)) {
  assert(/\brel="[^"]*\bnoopener\b[^"]*\bnoreferrer\b[^"]*"/i.test(match[0]), 'new-tab links must include noopener and noreferrer');
}

assert(app.includes('function getSavedKeyboardLayout()'), 'keyboard layout storage must use a guarded reader');
assert(!app.includes('let currentLayout = localStorage.getItem'), 'keyboard layout must not read localStorage at module scope');
assert(app.includes('normalizeSavedMemories'), 'stored memories must be normalized before use');
assert(/this\.memories\s*=\s*this\.normalizeSavedMemories\(this\.memories\)/.test(app), 'stored memories must pass through normalization');
assert(!/document\.cookie\b/.test(app), 'runtime must not access document.cookie');
assert(!/\beval\s*\(/.test(app), 'runtime must not use eval');
assert(!/\bnew\s+Function\s*\(/.test(app), 'runtime must not construct executable strings');
assert(!/\b(?:fetch|WebSocket)\s*\(/.test(app), 'runtime must not add unreviewed network execution paths');
assert(!/(?:sk-[A-Za-z0-9]{20,}|gh[pousr]_[A-Za-z0-9_]{20,}|AKIA[0-9A-Z]{16})/.test(`${html}\n${app}\n${workflow}`), 'tracked source must not contain common credential formats');
assert(!/\buses:\s*[^\s#]+@(?![0-9a-f]{40}\b)[^\s#]+/i.test(workflow), 'GitHub Actions must use immutable commit SHAs');
assert(/permissions:\s*\n\s+contents:\s+read/i.test(workflow), 'workflow must grant only read access to repository contents');
assert(!/permissions:\s*write-all/i.test(workflow), 'workflow must not request write-all permissions');
assert(!/\b(?:curl|wget)\b[^\n]*(?:\||;|&&)\s*(?:bash|sh)\b/i.test(workflow), 'workflow must not pipe downloaded scripts to a shell');

console.log('Static security gate passed.');

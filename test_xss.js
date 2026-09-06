const fs = require('fs');

// Simple DOM environment mock for testing renderMemoryShelf
class MockElement {
  constructor(tagName) {
    this.tagName = tagName;
    this.children = [];
    this.childNodes = [];
    this.attributes = {};
    this.className = '';
    this.title = '';
    this._textContent = '';
    this.eventListeners = {};
  }

  setAttribute(name, value) {
    this.attributes[name] = value;
  }

  getAttribute(name) {
    return this.attributes[name];
  }

  appendChild(child) {
    if (typeof child === 'string' || child.nodeType === 3) {
      this.childNodes.push(child);
      this._textContent += typeof child === 'string' ? child : child.textContent;
    } else {
      this.children.push(child);
      this.childNodes.push(child);
      this._textContent += child.textContent;
    }
    return child;
  }

  addEventListener(event, fn) {
    this.eventListeners[event] = this.eventListeners[event] || [];
    this.eventListeners[event].push(fn);
  }

  set textContent(val) {
    this._textContent = val;
    this.children = [];
    this.childNodes = [val];
  }

  get textContent() {
    return this._textContent;
  }

  set innerHTML(val) {
    if (val === '') {
      this._textContent = '';
      this.children = [];
      this.childNodes = [];
    }
  }

  get innerHTML() {
    return this.childNodes.map(node => {
      if (typeof node === 'string') return node;
      if (node.nodeType === 3) return node.textContent;
      let attrs = Object.entries(node.attributes).map(([k, v]) => `${k}="${v}"`).join(' ');
      if (node.className) attrs += ` class="${node.className}"`;
      if (node.title) attrs += ` title="${node.title}"`;
      const attrStr = attrs.trim() ? ' ' + attrs.trim() : '';
      return `<${node.tagName.toLowerCase()}${attrStr}>${node.innerHTML}</${node.tagName.toLowerCase()}>`;
    }).join('');
  }

  querySelector(selector) {
    if (selector.startsWith('.')) {
      const cls = selector.slice(1);
      return this.children.find(c => c.className.split(' ').includes(cls)) || null;
    }
    return null;
  }

  querySelectorAll(selector) {
    if (selector === 'span') {
      return this.children.filter(c => c.tagName === 'SPAN');
    }
    return [];
  }
}

class MockTextNode {
  constructor(text) {
    this.nodeType = 3;
    this.textContent = text;
  }
}

class MockDocument {
  constructor() {
    this.elements = {
      'memory-shelf': new MockElement('DIV'),
      'memory-count-badge': new MockElement('SPAN')
    };
  }

  getElementById(id) {
    return this.elements[id] || null;
  }

  createElement(tagName) {
    return new MockElement(tagName.toUpperCase());
  }

  createTextNode(text) {
    return new MockTextNode(text);
  }
}

global.document = new MockDocument();
global.localStorage = { getItem: () => null, setItem: () => {} };
global.window = { speechSynthesis: null };

// Read app.js and extract CosmicUniverseEngine
const appCode = fs.readFileSync('./app.js', 'utf8');

// Mock dependent global classes to allow loading
global.SpatialSoundEngine = class { constructor() {} };
global.audio = new global.SpatialSoundEngine();
global.COSMIC_EPOCHS = [
  { id: 0, key: 'ambient', name: '00', time: '0.00 GYR', bpm: 70, title: 'Ambient', desc: '', visualScale: 1 }
];

// Load and eval app.js with mocked DOM context
eval(`
${appCode.substring(appCode.indexOf('class CosmicUniverseEngine'), appCode.indexOf('const cosmicEngine = new CosmicUniverseEngine();'))}
global.CosmicUniverseEngine = CosmicUniverseEngine;
`);

console.log('--- RUNNING SECURITY TESTS FOR DOM XSS ---');

const engine = new global.CosmicUniverseEngine();
const shelf = global.document.getElementById('memory-shelf');

// Test Injection Payload
const payloadName = '<img src=x onerror=alert(1)>';
const payloadTime = '<script>alert(2)</script>';

engine.memories = [
  { id: 'test-mem-1', name: payloadName, time: payloadTime, epochIndex: 0, entropy: 10 }
];

engine.renderMemoryShelf('test-mem-1');

const chip = shelf.children[0];
const labelSpan = chip.querySelectorAll('span')[1];

console.log('Label Span textContent:', labelSpan.textContent);
console.log('Label Span innerHTML:', labelSpan.innerHTML);

let passed = true;

// Assert labelSpan contains literally the payload without executing or creating inner HTML tags
if (labelSpan.children.length > 0) {
  console.error('FAIL: Children elements were created inside labelSpan (HTML was parsed)!');
  passed = false;
} else if (labelSpan.textContent !== `${payloadName} [${payloadTime}]`) {
  console.error('FAIL: textContent does not match expected literal string!');
  passed = false;
} else {
  console.log('SUCCESS: Payload rendered purely as text string. No HTML execution path.');
}

if (!passed) {
  process.exit(1);
} else {
  console.log('ALL TESTS PASSED SUCCESSFULLY.');
}

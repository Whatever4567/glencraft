#!/usr/bin/env node
/* Re-inject hands-sculpt-1249.js and held-frame-1251.js into index.html.
   Does not bump version.json and does not publish. */
'use strict';
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const indexPath = path.join(root, 'index.html');
let s = fs.readFileSync(indexPath, 'utf8');
const before = s.length;

function replaceBlock(s, startNeedle, endNeedle, sourceRel) {
  const src = fs.readFileSync(path.join(__dirname, sourceRel), 'utf8').trim() + '\n';
  const i = s.indexOf(startNeedle);
  if (i < 0) throw new Error('start missing: ' + startNeedle + ' in ' + sourceRel);
  const j = s.indexOf(endNeedle, i);
  if (j < 0) throw new Error('end missing after ' + startNeedle);
  return s.slice(0, i) + src + s.slice(j + endNeedle.length);
}

const END = ")(typeof window !== 'undefined' ? window : this);\n";
s = replaceBlock(s, '(function handsSculpt1249', END, 'pilot-model-source/hands-sculpt-1249.js');
s = replaceBlock(s, '(function heldFrame1251', END, 'pilot-model-source/held-frame-1251.js');

if (!s.includes('handsSculpt1249') || !s.includes('heldFrame1251')) {
  throw new Error('inject lost a block');
}
if (!s.includes("version: '1.2.57-sculpt")) {
  // version string is inside the sculpt IIFE; warn but don't fail if format changes
  console.warn('note: sculpt version string 1.2.57-sculpt not found (check source)');
}
fs.writeFileSync(indexPath, s);
console.log('injected sculpt+frame into index.html', before, '->', s.length);

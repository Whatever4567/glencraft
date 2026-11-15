#!/usr/bin/env node
/* Inject or replace GLX-SCULPT1281 in index.html. Does not bump version.json. */
'use strict';
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const indexPath = path.join(root, 'index.html');
const srcPath = path.join(root, 'tools/content-source/sculpt-1281.js');
let html = fs.readFileSync(indexPath, 'utf8');
const src = fs.readFileSync(srcPath, 'utf8').trim() + '\n';
if (!src.includes('GLX-SCULPT1281')) throw new Error('sculpt-1281.js missing banner');

const START = '/* GLX-SCULPT1281';
const END = '})();\n';
if (html.includes(START)) {
  const i = html.indexOf(START);
  const j = html.indexOf(END, i);
  if (j < 0) throw new Error('existing SCULPT1281 has no end');
  html = html.slice(0, i) + src + html.slice(j + END.length);
} else {
  const needle = "  setInterval(function () { try { install(); } catch (e) { ERR('tick', e); } }, 1000);\n})();\n";
  // Insert after the last sculpt1280 tail (the last occurrence of sculpt1280's interval).
  const marker = '(function sculpt1280()';
  const s1280 = html.lastIndexOf(marker);
  if (s1280 < 0) throw new Error('sculpt1280 not found');
  const k = html.indexOf(needle, s1280);
  if (k < 0) throw new Error('sculpt1280 tail not found');
  const insertAt = k + needle.length;
  html = html.slice(0, insertAt) + src + html.slice(insertAt);
}

if (!html.includes('GLX-SCULPT1281')) throw new Error('inject lost SCULPT1281');
if ((html.split('(function sculpt1281()').length - 1) !== 1) throw new Error('duplicate sculpt1281');
if (!html.includes('GLX-SCULPT1280')) throw new Error('SCULPT1280 missing after inject');
if (!html.includes("version: '1.2.59-frame-torch'")) throw new Error('torch jitter frame marker missing after inject');
if (!html.includes('/* GLX-FIX1279 (v1.2.79):')) throw new Error('FIX1279 missing after inject');
fs.writeFileSync(indexPath, html);
console.log('injected sculpt-1281 into index.html, bytes', html.length);

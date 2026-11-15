#!/usr/bin/env node
/* Inject or replace GLX-SCULPT1282 in index.html. Does not bump version.json. */
'use strict';
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const indexPath = path.join(root, 'index.html');
const srcPath = path.join(root, 'tools/content-source/sculpt-1282.js');
let html = fs.readFileSync(indexPath, 'utf8');
const src = fs.readFileSync(srcPath, 'utf8').trim() + '\n';
if (!src.includes('GLX-SCULPT1282')) throw new Error('sculpt-1282.js missing banner');

const START = '/* GLX-SCULPT1282';
const END = '})();\n';
if (html.includes(START)) {
  const i = html.indexOf(START);
  const j = html.indexOf(END, i);
  if (j < 0) throw new Error('existing SCULPT1282 has no end');
  html = html.slice(0, i) + src + html.slice(j + END.length);
} else {
  const needle = "  setInterval(function () { try { install(); } catch (e) { ERR('tick', e); } }, 1000);\n})();\n";
  const marker = '(function sculpt1281()';
  const s1281 = html.lastIndexOf(marker);
  if (s1281 < 0) throw new Error('sculpt1281 not found');
  const k = html.indexOf(needle, s1281);
  if (k < 0) throw new Error('sculpt1281 tail not found');
  const insertAt = k + needle.length;
  html = html.slice(0, insertAt) + src + html.slice(insertAt);
}

if (!html.includes('GLX-SCULPT1282')) throw new Error('inject lost SCULPT1282');
if ((html.split('(function sculpt1282()').length - 1) !== 1) throw new Error('duplicate sculpt1282');
if (!html.includes('GLX-SCULPT1281')) throw new Error('SCULPT1281 missing after inject');
if (!html.includes("const GAME_VERSION = '1.2.81';")) throw new Error('GAME_VERSION left 1.2.81');
if (!html.includes("version: '1.2.59-frame-torch'")) throw new Error('torch jitter frame marker missing after inject');
fs.writeFileSync(indexPath, html);
console.log('injected sculpt-1282 into index.html, bytes', html.length);

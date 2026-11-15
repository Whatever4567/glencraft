#!/usr/bin/env node
/* Inject or replace GLX-HANDSTP1282 in index.html, right after GLX-SCULPT1282. */
'use strict';
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const indexPath = path.join(root, 'index.html');
const src = fs.readFileSync(path.join(root, 'tools/content-source/hands-tp-1282.js'), 'utf8').trim() + '\n';
if (!src.includes('GLX-HANDSTP1282')) throw new Error('banner missing');
let html = fs.readFileSync(indexPath, 'utf8');
const START = '/* GLX-HANDSTP1282';
const END = '})();\n';
if (html.includes(START)) {
  const i = html.indexOf(START);
  const j = html.indexOf(END, i);
  if (j < 0) throw new Error('existing HANDSTP1282 has no end');
  html = html.slice(0, i) + src + html.slice(j + END.length);
} else {
  const s = html.indexOf('(function sculpt1282()');
  if (s < 0) throw new Error('sculpt1282 not found');
  const k = html.indexOf(END, s);
  /* sculpt1282 body may contain inner IIFEs; find the block's closing at line start */
  const re = /\n\}\)\(\);\n/g; re.lastIndex = s;
  const m = re.exec(html);
  if (!m) throw new Error('sculpt1282 tail not found');
  const at = m.index + m[0].length;
  html = html.slice(0, at) + src + html.slice(at);
}
if ((html.split('(function handsTp1282()').length - 1) !== 1) throw new Error('duplicate handsTp1282');
if (!html.includes('GLX-SCULPT1282') || !html.includes('GLX-PERF1282')) throw new Error('lost earlier blocks');
fs.writeFileSync(indexPath, html);
console.log('injected hands-tp-1282, bytes', html.length);

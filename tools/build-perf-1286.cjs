#!/usr/bin/env node
'use strict';
/* GLX-PERF1286 (feature/v1.2.86-perf): frame-rate fixes on top of 1.2.85. No version bump.
   - sculpt1280/1281/1282 updateMatrixWorld wrappers: wrapped-flag per rig (WeakSet) so the 1s
     install ticks stop re-wrapping each other (+3 wrappers/s, unbounded).
   - corner-recipe interval only rebuilds the craft grid when RECIPES really changed.
   - perf-1286.js: bone-texture upload dedupe + display-rate quality governor. */
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
function must(c, m) { if (!c) { console.error('FAIL:', m); process.exit(1); } }
let html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

for (const n of [1280, 1281, 1282]) {
  const src = fs.readFileSync(path.join(root, 'tools/content-source/sculpt-' + n + '.js'), 'utf8');
  must(src.includes('WRAPPED' + n + '.has(R)') && !src.includes('if (!R.updateMatrixWorld.__sculpt' + n + ')'), 'sculpt-' + n + ' source has the per-rig guard');
  const old = '    if (!R.updateMatrixWorld.__sculpt' + n + ') {';
  if (html.includes(old)) {
    must(html.split(old).length === 2, 'one old guard ' + n);
    html = html.replace(old, "    /* GLX-PERF1286: the wrapped flag lives on the rig (WeakSet), not on the outermost function.\n       Before, sculpt1280/1281/1282 each saw the other's wrapper on top every 1s install tick and\n       wrapped again, so R.updateMatrixWorld grew by 3 wrappers a second and frame cost kept rising. */\n    if (!WRAPPED" + n + ".has(R)) {\n      WRAPPED" + n + ".add(R);");
    const gi = html.indexOf('if (!WRAPPED' + n + '.has(R))');
    const ii = html.lastIndexOf('  function install() {', gi);
    must(ii > 0, 'install() for ' + n);
    html = html.slice(0, ii) + "  const WRAPPED" + n + " = (typeof WeakSet === 'function') ? new WeakSet() : { _a: [], has(o) { return this._a.indexOf(o) >= 0; }, add(o) { this._a.push(o); } };\n" + html.slice(ii);
  }
  must(html.split('if (!WRAPPED' + n + '.has(R))').length === 2, 'per-rig guard ' + n + ' in page');
  must(html.split('const WRAPPED' + n + ' = ').length === 2, 'one WRAPPED' + n);
}
must(!/if \(!R\.updateMatrixWorld\.__sculpt128[0-2]\)/.test(html), 'no function-flag guards left');

{
  const a = "setInterval(() => { try { if (recipes()) { const g = $('recGrid');";
  const b = "setInterval(() => { try { const n0 = RECIPES.length; recipes(); if (RECIPES.length !== n0) { /* GLX-PERF1286: corner recipes are filtered out by RECIPES.push, so recipes() reported a change every 2s and rebuilt the whole craft grid forever */ const g = $('recGrid');";
  if (html.includes(a)) html = html.replace(a, b);
  must(html.split(b).length === 2, 'craft grid rebuild only on real change');
}

{
  const src = fs.readFileSync(path.join(root, 'tools/content-source/perf-1286.js'), 'utf8').trim() + '\n';
  must(src.startsWith('/* GLX-PERF1286'), 'perf-1286 banner');
  const START = '/* GLX-PERF1286: frame-rate work';
  const TAIL = "\n})(typeof window !== 'undefined' ? window : this);\n";
  const i = html.indexOf(START);
  if (i >= 0) {
    const j = html.indexOf(TAIL, i);
    must(j > i, 'perf1286 tail');
    html = html.slice(0, i) + src + html.slice(j + TAIL.length);
  } else {
    const L = html.indexOf('/* GLX-LOAD1285');
    must(L > 0, 'LOAD1285 present');
    const j = html.indexOf(TAIL, L);
    must(j > L, 'LOAD1285 tail');
    html = html.slice(0, j + TAIL.length) + src + html.slice(j + TAIL.length);
  }
  must(html.includes(src.trim()), 'perf1286 in page');
  must(html.split('(function perf1286(WIN)').length === 2, 'one perf1286');
  if (!html.includes('<!-- glencraft-build: perf1286 -->')) {
    must(html.includes('<!-- glencraft-build: load1285 -->'), 'load1285 marker');
    html = html.replace('<!-- glencraft-build: load1285 -->', '<!-- glencraft-build: load1285 -->\n<!-- glencraft-build: perf1286 -->');
  }
}

must(html.includes("const GAME_VERSION = '1.2.85';"), 'no version bump');
must(html.includes("version: '1.2.59-frame-torch'"), 'torch jitter frame marker stays');
must(html.includes('/* GLX-SCULPT1280') && html.includes('/* GLX-SCULPT1281') && html.includes('/* GLX-SCULPT1282'), 'sculpt chain stays');
must(html.includes('/* GLX-HANDSFP1285') && html.includes('/* GLX-TORSO1262') && html.includes('V1SIDES: 1'), 'hands + chest sides stay');
fs.writeFileSync(path.join(root, 'index.html'), html);
console.log('build perf1286 ok, index bytes', html.length);

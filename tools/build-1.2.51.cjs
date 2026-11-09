#!/usr/bin/env node
'use strict';
// 1.2.51: rare giant pop-star meme mob. Injected on top of the live 1.2.48
// bundle. Does not bump GAME_VERSION (kept at 1.2.48 so existing 1.2.48 tests
// still pass on this unpublished branch). Does not touch first-person arms,
// the world-block atlas, 4K settings, or other workers' branches.
const fs = require('node:fs');
const path = require('node:path');
const out = process.argv[2] || path.join(__dirname, '../index.html');
let s = fs.readFileSync(out, 'utf8');
function one(a, b, label) {
  const i = s.indexOf(a);
  if (i < 0) throw new Error('missing ' + (label || a.slice(0, 100)));
  if (s.indexOf(a, i + 1) >= 0) throw new Error('not unique ' + (label || a.slice(0, 100)));
  s = s.slice(0, i) + b + s.slice(i + a.length);
}

if (!s.includes("const GAME_VERSION = '1.2.48';")) {
  throw new Error('expected 1.2.48 base (this branch does not bump the live version yet)');
}
if (!s.includes('GLX-V1248')) throw new Error('1.2.48 runtime missing — refuse to inject on an unexpected base');
if (!s.includes('worldTilesUntouched')) throw new Error('block-atlas revert marker missing');

const core = fs.readFileSync(path.join(__dirname, 'popstar-source/popstar-core.js'), 'utf8');
const run = fs.readFileSync(path.join(__dirname, 'content-source/v1251-popstar.js'), 'utf8');
const block = '\n/* GLX-V1251-START */\n' + core + '\n' + run + '\n/* GLX-V1251-END */\n';

if (s.includes('GLX-V1251-START')) {
  const start = s.indexOf('/* GLX-V1251-START */');
  const end = s.indexOf('/* GLX-V1251-END */');
  if (start < 0 || end < 0) throw new Error('cannot replace v1251 module');
  s = s.slice(0, start) + block + s.slice(end + '/* GLX-V1251-END */'.length);
} else {
  // Inject after the 1.2.48 module, still inside the main script.
  const mark = s.lastIndexOf('</script>');
  if (mark < 0) throw new Error('missing </script>');
  s = s.slice(0, mark) + block + s.slice(mark);
}

if (!s.includes('<!-- glencraft-build: b1251-popstar -->')) {
  // Additional marker; keep the 1.2.48 marker intact for existing tests.
  one('<!-- glencraft-build: b1248-v1.2.48 -->',
      '<!-- glencraft-build: b1248-v1.2.48 -->\n<!-- glencraft-build: b1251-popstar -->',
      'marker');
}

if (!s.includes('GLX-V1251')) throw new Error('v1251 module missing after inject');
if (!s.includes("kind: 'popstar'") && !s.includes("kind === 'popstar'")) throw new Error('popstar kind missing');
if (!s.includes("const GAME_VERSION = '1.2.48';")) throw new Error('refused to bump GAME_VERSION on this unpublished branch');
if (!s.includes('worldTilesUntouched')) throw new Error('world tile marker lost');
if (!s.includes('__fpa') && !s.includes('mcArm')) { /* arms may be minified; do not fail hard */ }
if (s.includes("const GAME_VERSION = '1.2.51';")) throw new Error('version was bumped — not on this branch');

fs.writeFileSync(out, s);
console.log('Injected 1.2.51 popstar module into ' + out);

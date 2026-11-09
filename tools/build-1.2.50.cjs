#!/usr/bin/env node
'use strict';
// 1.2.50: ship the 10829a3 first-person held-item progress on top of live
// 1.2.49, plus a Teleport to Pop Star entry in the pause-menu Teleport list.
// Does not touch world-block atlas style, adaptive 4K, v12 armour, or Sunny.
const fs = require('node:fs');
const path = require('node:path');
const {execFileSync} = require('node:child_process');
const out = process.argv[2] || path.join(__dirname, '../index.html');

// Refresh held-item modules from the 1.2.49 held-repair sources (idempotent,
// stays at GAME_VERSION 1.2.49 if that is the current version).
execFileSync(process.execPath, [path.join(__dirname, 'build-1.2.49.cjs'), out], {stdio: 'inherit'});

let s = fs.readFileSync(out, 'utf8');
function one(a, b, label) {
  const i = s.indexOf(a);
  if (i < 0) throw new Error('missing ' + (label || a.slice(0, 100)));
  if (s.indexOf(a, i + 1) >= 0) throw new Error('not unique ' + (label || a.slice(0, 100)));
  s = s.slice(0, i) + b + s.slice(i + a.length);
}
function maybeOnce(a, b) {
  if (!s.includes(a)) return false;
  const i = s.indexOf(a);
  if (s.indexOf(a, i + 1) >= 0) {
    // replace all identical cache tags
    s = s.split(a).join(b);
    return true;
  }
  s = s.slice(0, i) + b + s.slice(i + a.length);
  return true;
}

if (!s.includes("const GAME_VERSION = '1.2.49';") && !s.includes("const GAME_VERSION = '1.2.50';")) {
  throw new Error('expected 1.2.49 or 1.2.50 base');
}

if (s.includes("const GAME_VERSION = '1.2.49';")) {
  one("const GAME_VERSION = '1.2.49';", "const GAME_VERSION = '1.2.50';", 'ver');
}
if (!s.includes('<!-- glencraft-build: b1250-held-popstar -->')) {
  const host = s.includes('<!-- glencraft-build: b1250-v1.2.50 -->')
    ? '<!-- glencraft-build: b1250-v1.2.50 -->'
    : '<!-- glencraft-build: b1249-v1.2.49 -->';
  one(host, host + '\n<!-- glencraft-build: b1250-held-popstar -->', 'marker');
}
if (!s.includes('"v":"v1.2.50"') && !s.includes('"v": "v1.2.50"')) {
  one('window.PATCH_NOTES = [', 'window.PATCH_NOTES = [\n' + JSON.stringify({
    v: 'v1.2.50', d: '2026-11-09', notes: [
      'First-person hands and held items are improved: a dedicated viewmodel, a slender curved purple pickaxe, and tighter grips on tools and guns.',
      'The pause-menu Teleport list now has Teleport to Pop Star. If the giant singing pop star is not in the world, she appears nearby, then you are placed on solid ground a few blocks in front of her, facing her dance and song.'
    ]
  }) + ',\n', 'notes');
} else if (!s.includes('Teleport to Pop Star')) {
  // A leftover 1.2.50 remix-only notes block: prepend a fresh 1.2.50 ship entry.
  one('window.PATCH_NOTES = [', 'window.PATCH_NOTES = [\n' + JSON.stringify({
    v: 'v1.2.50', d: '2026-11-09', notes: [
      'First-person hands and held items are improved: a dedicated viewmodel, a slender curved purple pickaxe, and tighter grips on tools and guns.',
      'The pause-menu Teleport list now has Teleport to Pop Star. If the giant singing pop star is not in the world, she appears nearby, then you are placed on solid ground a few blocks in front of her, facing her dance and song.'
    ]
  }) + ',\n', 'notes-extra');
}
maybeOnce("?v=1.2.49'", "?v=1.2.50'");
maybeOnce('?v=1.2.49"', '?v=1.2.50"');

// Re-embed the teleport list (ui-1222).
{
  const src = fs.readFileSync(path.join(__dirname, 'content-source/ui-1222.js'), 'utf8');
  const startTok = '/* GLX-UI1222';
  const endTok = '/* GLX-VOX1222';
  const i = s.indexOf(startTok);
  const j = s.indexOf(endTok, i);
  if (i < 0 || j < 0) throw new Error('ui-1222 replace failed');
  s = s.slice(0, i) + src.trim() + '\n' + s.slice(j);
}

// Re-embed the pop-star runtime (keeps the core, replaces the GLX-V1251 block).
{
  const core = fs.readFileSync(path.join(__dirname, 'popstar-source/popstar-core.js'), 'utf8');
  const run = fs.readFileSync(path.join(__dirname, 'content-source/v1251-popstar.js'), 'utf8');
  const block = '/* GLX-V1251-START */\n' + core + '\n' + run + '\n/* GLX-V1251-END */';
  if (s.includes('GLX-V1251-START')) {
    const start = s.indexOf('/* GLX-V1251-START */');
    const end = s.indexOf('/* GLX-V1251-END */');
    if (start < 0 || end < 0) throw new Error('cannot replace v1251 module');
    s = s.slice(0, start) + block + s.slice(end + '/* GLX-V1251-END */'.length);
  } else {
    throw new Error('v1251 popstar block missing on this 1.2.49+ base');
  }
}

if (!s.includes("const GAME_VERSION = '1.2.50';")) throw new Error('missing 1.2.50 version');
if (s.includes("const GAME_VERSION = '1.2.51';")) throw new Error('version was bumped to 1.2.51');
if (s.includes("const GAME_VERSION = '1.2.49';")) throw new Error('GAME_VERSION still 1.2.49');
if (!s.includes('<!-- glencraft-build: b1250-held-popstar -->')) throw new Error('ship marker missing');
if (!s.includes('<!-- glencraft-build: b1249-v1.2.49 -->')) throw new Error('lost 1.2.49 marker');
if (!s.includes('<!-- glencraft-build: b1251-popstar -->')) throw new Error('lost popstar marker');
if (!s.includes('worldTilesUntouched')) throw new Error('block-atlas revert marker missing');
if (!s.includes('fpVm1259') || !s.includes('__fpVm1259')) throw new Error('fp-vm 1259 missing');
if (!s.includes('__fpa') && !s.includes('mcArm')) throw new Error('first-person arm hooks missing');
if (!s.includes('tpmPopstar') || !s.includes('Teleport to Pop Star')) throw new Error('Teleport to Pop Star button missing');
if (!s.includes('U.teleportTo = function') && !s.includes('U.teleportTo=function')) throw new Error('popstar teleportTo missing');
if (!s.includes('hardcore_remix.mp3')) throw new Error('remix soundtrack missing');
if (!s.includes("kind: 'popstar'") && !s.includes("kind === 'popstar'")) throw new Error('popstar kind missing');

fs.writeFileSync(out, s);
fs.writeFileSync(path.join(path.dirname(path.resolve(out)), 'version.json'), JSON.stringify({v: '1.2.50'}) + '\n');
console.log('Built 1.2.50 held-item progress + pop-star teleport: ' + out);

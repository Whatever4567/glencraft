#!/usr/bin/env node
'use strict';
// 1.2.51: the giant pop star is fully visible (no fog/fade, opaque, uncullable,
// self-lit) and only walks/spawns/teleports on dry land. Built on live 1.2.50
// (e9ce84f). Does not pull later held-repair work, world-atlas restyle,
// adaptive 4K, v12 armour, or Sunny.
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
function maybeOnce(a, b) {
  if (!s.includes(a)) return false;
  const i = s.indexOf(a);
  if (s.indexOf(a, i + 1) >= 0) {
    s = s.split(a).join(b);
    return true;
  }
  s = s.slice(0, i) + b + s.slice(i + a.length);
  return true;
}

if (!s.includes("const GAME_VERSION = '1.2.50';") && !s.includes("const GAME_VERSION = '1.2.51';")) {
  throw new Error('expected 1.2.50 or 1.2.51 base (do not run this on older trees)');
}
if (s.includes("const GAME_VERSION = '1.2.50';")) {
  one("const GAME_VERSION = '1.2.50';", "const GAME_VERSION = '1.2.51';", 'ver');
}
if (!s.includes('<!-- glencraft-build: b1251-visible-land -->')) {
  const host = s.includes('<!-- glencraft-build: b1250-held-popstar -->')
    ? '<!-- glencraft-build: b1250-held-popstar -->'
    : '<!-- glencraft-build: b1251-popstar -->';
  one(host, host + '\n<!-- glencraft-build: b1251-visible-land -->', 'marker');
}
if (!s.includes('"v":"v1.2.51"') && !s.includes('"v": "v1.2.51"')) {
  one('window.PATCH_NOTES = [', 'window.PATCH_NOTES = [\n' + JSON.stringify({
    v: 'v1.2.51', d: '2026-11-09', notes: [
      'The giant pop star is fully visible at any distance: her materials ignore scene fog, stay opaque, and are not faded or culled, with her own fill light so the gold dress and blonde hair stay vivid.',
      'She only spawns and wanders on solid dry land (never water, lava, leaves or air), turns back from steep drops, and keeps her feet snapped to the ground. Teleport to Pop Star places you both on dry land at a distance where her whole body fits in view, facing her.'
    ]
  }) + ',\n', 'notes');
}
maybeOnce("?v=1.2.50'", "?v=1.2.51'");
maybeOnce('?v=1.2.50"', '?v=1.2.51"');

// Re-embed pop-star core + runtime (visibility + land-only walking).
{
  const core = fs.readFileSync(path.join(__dirname, 'popstar-source/popstar-core.js'), 'utf8');
  const run = fs.readFileSync(path.join(__dirname, 'content-source/v1251-popstar.js'), 'utf8');
  const block = '/* GLX-V1251-START */\n' + core + '\n' + run + '\n/* GLX-V1251-END */';
  if (!s.includes('GLX-V1251-START')) throw new Error('v1251 popstar block missing on this 1.2.50+ base');
  const start = s.indexOf('/* GLX-V1251-START */');
  const end = s.indexOf('/* GLX-V1251-END */');
  if (start < 0 || end < 0) throw new Error('cannot replace v1251 module');
  s = s.slice(0, start) + block + s.slice(end + '/* GLX-V1251-END */'.length);
}

if (!s.includes("const GAME_VERSION = '1.2.51';")) throw new Error('missing 1.2.51 version');
if (s.includes("const GAME_VERSION = '1.2.50';")) throw new Error('GAME_VERSION still 1.2.50');
if (!s.includes('<!-- glencraft-build: b1251-visible-land -->')) throw new Error('ship marker missing');
if (!s.includes('<!-- glencraft-build: b1250-held-popstar -->')) throw new Error('lost 1.2.50 marker');
if (!s.includes('<!-- glencraft-build: b1249-v1.2.49 -->')) throw new Error('lost 1.2.49 marker');
if (!s.includes('<!-- glencraft-build: b1251-popstar -->')) throw new Error('lost popstar marker');
if (!s.includes('worldTilesUntouched')) throw new Error('block-atlas revert marker missing');
if (!s.includes('fpVm1259') || !s.includes('__fpVm1259')) throw new Error('fp-vm 1259 missing');
if (!s.includes('__fpa') && !s.includes('mcArm')) throw new Error('first-person arm hooks missing');
if (!s.includes('tpmPopstar') || !s.includes('Teleport to Pop Star')) throw new Error('Teleport to Pop Star button missing');
if (!s.includes('U.teleportTo = function') && !s.includes('U.teleportTo=function')) throw new Error('popstar teleportTo missing');
if (!s.includes('U.proposeStep') && !s.includes('U.proposeStep=')) throw new Error('land-only proposeStep missing');
if (!s.includes('fog: false') && !s.includes('fog:false')) throw new Error('fog:false missing from popstar materials');
if (!s.includes('hardcore_remix.mp3')) throw new Error('remix soundtrack missing');
if (!s.includes("kind: 'popstar'") && !s.includes("kind === 'popstar'")) throw new Error('popstar kind missing');

fs.writeFileSync(out, s);
fs.writeFileSync(path.join(path.dirname(path.resolve(out)), 'version.json'), JSON.stringify({v: '1.2.51'}) + '\n');
console.log('Built 1.2.51 pop-star visible + land-only: ' + out);

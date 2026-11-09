#!/usr/bin/env node
'use strict';
// 1.2.44: remove adaptive 4K scaler / weak-boot cap (restore 1.2.41 4K);
// restore procedural FP arms (undo Held1240-as-main + hideProceduralFp retirement);
// retexture procedural arms from character skin + cream sleeve.
// Keep: world-tile prism no-op, safe-mode removal, 1.2.43 load/menu speedups.
// Restore cosmetic menu glass blur. Keep orbit rate-cap + invGrid cache.
const fs = require('node:fs');
const path = require('node:path');
const out = process.argv[2] || path.join(__dirname, '../index.html');
let s = fs.readFileSync(out, 'utf8');
function one(a, b, label) {
  const i = s.indexOf(a);
  if (i < 0) throw new Error('missing seam ' + (label || a.slice(0, 100)));
  if (s.indexOf(a, i + 1) >= 0) throw new Error('seam not unique ' + (label || a.slice(0, 100)));
  s = s.slice(0, i) + b + s.slice(i + a.length);
}
function replaceBlock(startMark, endMark, body, label) {
  const i = s.indexOf(startMark);
  if (i < 0) throw new Error('missing start ' + label);
  const j = s.indexOf(endMark, i);
  if (j < 0) throw new Error('missing end ' + label);
  s = s.slice(0, i) + body + s.slice(j);
}

one("const GAME_VERSION = '1.2.43';", "const GAME_VERSION = '1.2.44';", 'GAME_VERSION');
one('<!-- glencraft-build: b1243-v1.2.43 -->', '<!-- glencraft-build: b1244-v1.2.44 -->', 'build marker');

// Patch notes
one('window.PATCH_NOTES = [', 'window.PATCH_NOTES = [\n' + JSON.stringify({
  v: 'v1.2.44', d: '2026-11-09', notes: [
    '4K UHD is back to exactly how it rendered in 1.2.41 on every device — the adaptive scaler and weak-device pixel-ratio cap from 1.2.42 are gone.',
    'First-person arms use the working procedural rig again (swing, place, reload, gun and swim animations, held items visible in the fist). The Held1240FpArms clone is no longer the main arms.',
    'Those restored arms are retextured from the new character: skin from the hand meshes and the cream linen sleeve from the outfit.',
    'Menu glass blur is restored. The 1.2.43 faster world load and lighter inventory/orbit-menu work stay.'
  ]
}) + ',', 'notes');

one(
  "fetch('assets/models/scottish-base-v2/'+(far?'scottish-far.glb':'scottish-base-with-jetpack.glb')+'?v=1.2.43'),fetch('assets/models/scottish-base-v2/'+(far?'crystal-armour-far.glb':'crystal-armour.glb')+'?v=1.2.43')",
  "fetch('assets/models/scottish-base-v2/'+(far?'scottish-far.glb':'scottish-base-with-jetpack.glb')+'?v=1.2.44'),fetch('assets/models/scottish-base-v2/'+(far?'crystal-armour-far.glb':'crystal-armour.glb')+'?v=1.2.44')",
  'model cache bust'
);

// Restore 1.2.41 pixel ratio (remove weakBoot cap)
one(
  "renderer.setPixelRatio(PERF ? Math.max(0.55, Math.min(DPR, 1.5) * 0.7) : HIGH ? Math.min(DPR, __weakBoot1242 ? 1.25 : 2.5) : Math.min(DPR, 2));",
  "renderer.setPixelRatio(PERF ? Math.max(0.55, Math.min(DPR, 1.5) * 0.7) : HIGH ? DPR : Math.min(DPR, 2));",
  'pixelRatio'
);

// Remove weakBoot const (may span one long line)
{
  const re = /const __weakBoot1242 = !!\([\s\S]*?\);\n/;
  if (!re.test(s)) throw new Error('missing __weakBoot1242 const');
  s = s.replace(re, '/* 1.2.44: __weakBoot1242 removed — 4K UHD matches 1.2.41 on all devices */\n');
}

// Restore glass blur (cosmetic)
one(
  '.glass{background:var(--glass);border:2px solid var(--line);border-radius:10px;-webkit-backdrop-filter:none;backdrop-filter:none}/* 1.2.43 menu blur off */',
  '.glass{background:var(--glass);border:2px solid var(--line);border-radius:10px;-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px)}/* 1.2.44 menu blur restored */',
  'glass'
);

// Replace inlined held-fp helper
{
  const heldSrc = fs.readFileSync(path.join(__dirname, 'pilot-model-source/held-fp-1240.js'), 'utf8');
  const start = '(function heldFp1240';
  const end = ")(typeof window !== 'undefined' ? window : this);\n";
  const i = s.indexOf(start);
  if (i < 0) throw new Error('missing heldFp1240');
  const j = s.indexOf(end, i);
  if (j < 0) throw new Error('missing heldFp1240 end');
  s = s.slice(0, i) + heldSrc.trim() + '\n' + s.slice(j + end.length);
}

// Replace inlined adaptive helper with stub
{
  const adaptSrc = fs.readFileSync(path.join(__dirname, 'visuals-source/adaptive-4k-1242.js'), 'utf8');
  const start = '/* v1.2.42: adaptive 4K UHD preset.';
  // also accept if already stubbed
  let i = s.indexOf(start);
  if (i < 0) i = s.indexOf('/* v1.2.44: adaptive 4K UHD scaler REMOVED.');
  if (i < 0) i = s.indexOf('(function adaptive4k1242');
  if (i < 0) throw new Error('missing adaptive4k block');
  // find end of this IIFE
  const end = ")(typeof window !== 'undefined' ? window : this);\n";
  const j = s.indexOf(end, i);
  if (j < 0) throw new Error('missing adaptive end');
  s = s.slice(0, i) + adaptSrc.trim() + '\n' + s.slice(j + end.length);
}


// Allow .glass blur through the global backdrop-filter kill switches
{
  const old = "body *{-webkit-backdrop-filter:none!important;backdrop-filter:none!important}";
  const neu = "/* 1.2.44: allow .glass blur again */ body *:not(.glass){-webkit-backdrop-filter:none!important;backdrop-filter:none!important}";
  if (s.includes(old)) s = s.split(old).join(neu);
}

// Sanity
if (!s.includes("const GAME_VERSION = '1.2.44';")) throw new Error('version not set');
if (!s.includes('b1244-v1.2.44')) throw new Error('marker not set');
if (s.includes('__weakBoot1242 ? 1.25')) throw new Error('weakBoot still caps PR');
if (!s.includes("version: '1.2.44'") || !s.includes('retextureProceduralArms')) throw new Error('held-fp 1.2.44 not embedded');
if (!s.includes('adaptive 4K UHD scaler REMOVED') && !s.includes('disabled: 1')) throw new Error('adaptive stub not embedded');
if (!s.includes('worldTilesUntouched')) throw new Error('lost world tile no-op');
if (!s.includes('LOAD_R') || !s.includes('__invSig')) throw new Error('lost 1.2.43 load/menu cuts');

fs.writeFileSync(out, s);
fs.writeFileSync(path.join(path.dirname(path.resolve(out)), 'version.json'), JSON.stringify({v: '1.2.44'}) + '\n');
console.log('Built 1.2.44: 4K=1.2.41, procedural FP arms + character retexture: ' + out);

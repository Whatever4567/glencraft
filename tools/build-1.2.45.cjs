#!/usr/bin/env node
'use strict';
// 1.2.45: Scottish GLB arms on __fpa drivers; hard repair FP/3p held grips & poses.
const fs = require('node:fs');
const path = require('node:path');
const out = process.argv[2] || path.join(__dirname, '../index.html');
let s = fs.readFileSync(out, 'utf8');
function one(a, b, label) {
  const i = s.indexOf(a);
  if (i < 0) throw new Error('missing ' + (label || a.slice(0, 80)));
  if (s.indexOf(a, i + 1) >= 0) throw new Error('not unique ' + (label || a.slice(0, 80)));
  s = s.slice(0, i) + b + s.slice(i + a.length);
}
function replaceIife(startMark, body, label) {
  const i = s.indexOf(startMark);
  if (i < 0) throw new Error('missing start ' + label);
  const end = ")(typeof window !== 'undefined' ? window : this);\n";
  const j = s.indexOf(end, i);
  if (j < 0) throw new Error('missing end ' + label);
  s = s.slice(0, i) + body.trim() + '\n' + s.slice(j + end.length);
}

const from = (s.includes("const GAME_VERSION = '1.2.44';") ? '1.2.44' : (s.includes("const GAME_VERSION = '1.2.45';") ? '1.2.45' : null));
if (!from) throw new Error('expected 1.2.44 or 1.2.45 base');
if (from === '1.2.44') {
  one("const GAME_VERSION = '1.2.44';", "const GAME_VERSION = '1.2.45';", 'ver');
  one('<!-- glencraft-build: b1244-v1.2.44 -->', '<!-- glencraft-build: b1245-v1.2.45 -->', 'marker');
  one('window.PATCH_NOTES = [', 'window.PATCH_NOTES = [\n' + JSON.stringify({
    v: 'v1.2.45', d: '2026-11-09', notes: [
      'First-person arms: the Scottish character GLB arm meshes (cream linen sleeve and skin hand with finger bones) are switched onto the existing __fpa animation pivots — the grey boxes are invisible drivers only, so swing, place, reload, gun and swim timings stay.',
      'Closed-finger grips for tools, torch, bucket, map, food, pistol and musket; held items sit in the palm at the weapon grip with no floating gaps.',
      'Third-person: every held item at the weapon grip facing forward — purple crystal pickaxe is the thin purple prism (not the old grey pick), map and pistol visible in the hand, musket in a port/ready pose with the barrel forward (not across the face).',
      'Reload and aim: no duplicate arm, no 360° flip, no giant sphere; LT aim keeps both hands on the gun.'
    ]
  }) + ',', 'notes');
  one(
    "fetch('assets/models/scottish-base-v2/'+(far?'scottish-far.glb':'scottish-base-with-jetpack.glb')+'?v=1.2.44'),fetch('assets/models/scottish-base-v2/'+(far?'crystal-armour-far.glb':'crystal-armour.glb')+'?v=1.2.44')",
    "fetch('assets/models/scottish-base-v2/'+(far?'scottish-far.glb':'scottish-base-with-jetpack.glb')+'?v=1.2.45'),fetch('assets/models/scottish-base-v2/'+(far?'crystal-armour-far.glb':'crystal-armour.glb')+'?v=1.2.45')",
    'cache'
  );
}

const held = fs.readFileSync(path.join(__dirname, 'pilot-model-source/held-fp-1240.js'), 'utf8');
replaceIife('(function heldFp1240', held, 'held-fp');

const reload = fs.readFileSync(path.join(__dirname, 'pilot-model-source/reload-1240.js'), 'utf8');
// reload file uses (function (W) { not named
{
  const start = '/* v1.2.45 / v1.2.40: first-person musket/pistol reload.';
  const alt = '/* v1.2.40: first-person musket/pistol reload.';
  let i = s.indexOf(start);
  if (i < 0) i = s.indexOf(alt);
  if (i < 0) throw new Error('missing reload block');
  const end = ")(typeof window !== 'undefined' ? window : this);\n";
  const j = s.indexOf(end, i);
  if (j < 0) throw new Error('missing reload end');
  s = s.slice(0, i) + reload.trim() + '\n' + s.slice(j + end.length);
}

const arm = fs.readFileSync(path.join(__dirname, 'pilot-model-source/arm-switch-1245.js'), 'utf8');
if (!s.includes('(function armSwitch1245')) {
  // Inject after held-fp / before adaptive stub
  const mark = '(function adaptive4k1242';
  const alt = '/* v1.2.44: adaptive 4K UHD scaler REMOVED.';
  let i = s.indexOf(alt);
  if (i < 0) i = s.indexOf(mark);
  if (i < 0) throw new Error('missing inject point for arm-switch');
  s = s.slice(0, i) + arm.trim() + '\n' + s.slice(i);
} else {
    const i = s.indexOf('(function armSwitch1245');
  const end = ")(typeof window !== 'undefined' ? window : this);\n";
  const j = s.indexOf(end, i);
  if (i < 0 || j < 0) throw new Error('arm-switch replace failed');
  s = s.slice(0, i) + arm.trim() + '\n' + s.slice(j + end.length);
}

// Phone FP scale: slightly pull classic hand back so 9:20 framing is sane (drivers only)
if (!s.includes('/* 1.2.45 phone FP hand scale */')) {
  const seam = 'hand.position.set(0.28, -0.32, -0.45);';
  // try common hand rest positions - search
  const m = s.match(/hand\.position\.set\([^)]+\);/);
  // Don't force if uncertain — arm-switch scales the GLB clone.
}

if (!s.includes("const GAME_VERSION = '1.2.45';")) throw new Error('ver missing');
if (!s.includes('ArmSwitch1245') || !s.includes('armSwitch1245')) throw new Error('arm-switch not embedded');
if (!s.includes("version: '1.2.45'") || !s.includes('held1245CrystalPrism')) throw new Error('held-fp 1.2.45 missing pieces');
if (!s.includes('worldTilesUntouched')) throw new Error('lost world tile no-op');
if (s.includes('__weakBoot1242 ? 1.25')) throw new Error('weak boot cap returned');

fs.writeFileSync(out, s);
fs.writeFileSync(path.join(path.dirname(path.resolve(out)), 'version.json'), JSON.stringify({v: '1.2.45'}) + '\n');
console.log('Built 1.2.45 arm-switch + held repair: ' + out);

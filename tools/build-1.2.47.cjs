#!/usr/bin/env node
'use strict';
// 1.2.47: bind-offset Scottish GLB arms onto existing __fpa drivers.
// Body/torso/kilt/head meshes are stripped from the FP clone (the 1.2.45
// regression). Gun poses stay on the 1.2.27 / 42d5925 / 1.2.40 __fpa project.
// Also fd36b1f musket fallback and 3p socket repose.
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

const from = s.includes("const GAME_VERSION = '1.2.47';") ? '1.2.47'
  : s.includes("const GAME_VERSION = '1.2.46';") ? '1.2.46'
  : s.includes("const GAME_VERSION = '1.2.44';") ? '1.2.44'
  : null;
if (!from) throw new Error('expected 1.2.44, 1.2.46 (hotfix) or 1.2.47 base');

if (from === '1.2.44' || from === '1.2.46') {
  one("const GAME_VERSION = '" + from + "';", "const GAME_VERSION = '1.2.47';", 'ver');
  const fromMarker = from === '1.2.46' ? '<!-- glencraft-build: b1246-v1.2.46 -->' : '<!-- glencraft-build: b1244-v1.2.44 -->';
  one(fromMarker, '<!-- glencraft-build: b1247-v1.2.47 -->', 'marker');
  one('window.PATCH_NOTES = [', 'window.PATCH_NOTES = [\n' + JSON.stringify({
    v: 'v1.2.47', d: '2026-11-09', notes: [
      'First-person arms: the new Scottish character arm and skin are switched onto your existing arm animations, so swing, place, reload, aim and swim stay the same. Only the arms are used — the body, stomach and kilt never appear in first person.',
      'Guns keep the earlier hand work: both hands on the musket, pistol in the right hand with a finger on the trigger, a smooth aim to the centre, and a fluid reload with no flip, no duplicate arm and no giant sphere.',
      'Every held item sits in the hand in first and third person — the thin purple crystal pickaxe, the map with the fingers closed, the pistol, and a musket held ready, not across the face.',
      'If a gun model is slow to load, the built-in gun is shown after half a second so aiming does not leave you with an empty hand.'
    ]
  }) + ',', 'notes');
  const fromV = from;
  one(
    "fetch('assets/models/scottish-base-v2/'+(far?'scottish-far.glb':'scottish-base-with-jetpack.glb')+'?v=" + fromV + "'),fetch('assets/models/scottish-base-v2/'+(far?'crystal-armour-far.glb':'crystal-armour.glb')+'?v=" + fromV + "')",
    "fetch('assets/models/scottish-base-v2/'+(far?'scottish-far.glb':'scottish-base-with-jetpack.glb')+'?v=1.2.47'),fetch('assets/models/scottish-base-v2/'+(far?'crystal-armour-far.glb':'crystal-armour.glb')+'?v=1.2.47')",
    'cache'
  );
}

const held = fs.readFileSync(path.join(__dirname, 'pilot-model-source/held-fp-1240.js'), 'utf8');
{
  const i = s.indexOf('(function heldFp1240');
  const end = ")(typeof window !== 'undefined' ? window : this);\n";
  const j = s.indexOf(end, i);
  if (i < 0 || j < 0) throw new Error('held-fp replace failed');
  s = s.slice(0, i) + held.trim() + '\n' + s.slice(j + end.length);
}

const reload = fs.readFileSync(path.join(__dirname, 'pilot-model-source/reload-1240.js'), 'utf8');
{
  const starts = [
    '/* v1.2.45 / v1.2.40: first-person musket/pistol reload.',
    '/* v1.2.47 / v1.2.40: first-person musket/pistol reload.',
    '/* v1.2.40: first-person musket/pistol reload.',
    '/* v1.2.44 / v1.2.40: first-person musket/pistol reload.'
  ];
  let i = -1;
  for (const st of starts) { i = s.indexOf(st); if (i >= 0) break; }
  if (i < 0) throw new Error('missing reload block');
  const end = ")(typeof window !== 'undefined' ? window : this);\n";
  const j = s.indexOf(end, i);
  if (j < 0) throw new Error('missing reload end');
  s = s.slice(0, i) + reload.trim() + '\n' + s.slice(j + end.length);
}


const FIST_ANCHOR = "const fist = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.14, 0.14), armMat); fist.position.set(0, 0, -0.2); armPivot.add(fist);\nconst held = new THREE.Group(); held.position.set(0, 0.04, -0.24); armPivot.add(held);";
const FP_LEGACY_AT_FIST = `
window.__fpLegacy = {
  fist: fist,
  armMesh: (typeof armMesh !== 'undefined') ? armMesh : null,
  armPivot: armPivot,
  hand: (typeof hand !== 'undefined') ? hand : null,
  held: held,
  gripHand: (typeof gripHand !== 'undefined') ? gripHand : null,
  mcArm: (typeof window !== 'undefined' && window.mcArm) ? window.mcArm : null,
  idle: function () { try { swingT = 0; } catch (e) {} try { placeT = 0; } catch (e) {} try { grabT = 0; } catch (e) {} },
  walk: function (dt) {
    dt = dt || 0.016;
    try { P.onGround = true; } catch (e) {}
    try { bobPhase = (bobPhase || 0) + dt * 6; walkPhase = bobPhase; } catch (e) {}
    try { bobAmt = 1; } catch (e) {}
    try { bobAmp = 0.85; } catch (e) {}
  }
};
`;
const FP_LEGACY_HOOK = `
try {
  const prev = window.__fpLegacy || {};
  window.__fpLegacy = {
    fist: prev.fist || ((typeof fist !== 'undefined') ? fist : null),
    armMesh: prev.armMesh || ((typeof armMesh !== 'undefined') ? armMesh : null),
    armPivot: prev.armPivot || ((typeof armPivot !== 'undefined') ? armPivot : null),
    hand: prev.hand || ((typeof hand !== 'undefined') ? hand : null),
    held: prev.held || ((typeof held !== 'undefined') ? held : null),
    gripHand: prev.gripHand || ((typeof gripHand !== 'undefined') ? gripHand : null),
    mcArm: prev.mcArm || ((typeof window !== 'undefined' && window.mcArm) ? window.mcArm : null),
    idle: prev.idle,
    walk: prev.walk
  };
} catch (e) { window.__fpLegacyErr = String(e && e.message || e); }
`;

// Hook must be set WHERE fist is declared (same script), or hideLegacy
// cannot see the lexical fist / swingT / bobAmp.
{
  if (!s.includes(FIST_ANCHOR)) throw new Error('fist declaration anchor missing');
  if (!s.includes('fist: fist,')) {
    s = s.replace(FIST_ANCHOR, FIST_ANCHOR + FP_LEGACY_AT_FIST);
  }
}

const arm = FP_LEGACY_HOOK + fs.readFileSync(path.join(__dirname, 'pilot-model-source/arm-switch-1247.js'), 'utf8');
{
  let i = s.indexOf('(function armSwitch1247');
  if (i < 0) i = s.indexOf('(function armSwitch1245');
  if (i < 0) {
    const mark = '/* v1.2.44: adaptive 4K UHD scaler REMOVED.';
    const alt = '(function adaptive4k1242';
    i = s.indexOf(mark);
    if (i < 0) i = s.indexOf(alt);
    if (i < 0) throw new Error('missing inject point for arm-switch');
    s = s.slice(0, i) + arm.trim() + '\n' + s.slice(i);
  } else {
    const end = ")(typeof window !== 'undefined' ? window : this);\n";
    const j = s.indexOf(end, i);
    if (j < 0) throw new Error('arm-switch replace failed');
    s = s.slice(0, i) + arm.trim() + '\n' + s.slice(j + end.length);
  }
}

// fd36b1f musket fallback (0.5 s pending or failed download).
{
  const a = "if (!u.c322) { const fl = window.__c322 && __c322.fail && __c322.fail[u.gun === IT.PISTOL ? 'pistol' : 'rifle']; if (fl) { g.visible = true; U.fallback = (U.fallback || 0) + 1; try { __c322.load(u.gun === IT.PISTOL ? 'pistol' : 'rifle'); } catch (_) {} return; } g.visible = false; U.hidden++; return; }   // real model not in yet: show nothing rather than the old gun (v1.2.26: unless its download failed, then the built in gun)";
  const b = "if (!u.c322) { const fl = window.__c322 && __c322.fail && __c322.fail[u.gun === IT.PISTOL ? 'pistol' : 'rifle']; u.__pw = (u.__pw || 0) + d; if (fl || u.__pw > 0.5) { u.__fb = 1; g.visible = true; U.pend = 1; U.fallback = (U.fallback || 0) + 1; try { __c322.load(u.gun === IT.PISTOL ? 'pistol' : 'rifle'); } catch (_) {} return; } g.visible = false; U.hidden++; return; }   // 1.2.47: pending >0.5s or failed download shows the built-in gun";
  if (!s.includes('u.__pw > 0.5')) {
    if (!s.includes(a)) throw new Error('fd36b1f pending-fallback line not found');
    s = s.replace(a, b);
  }
  const ra = "try { const g0 = sc0 === scene && gun(); if (g0 && !g0.userData.c322) g0.visible = false; } catch (_) {}   // never draw the old gun, even for the frame it is made";
  const rb = "try { const g0 = sc0 === scene && gun(); if (g0 && !g0.userData.c322 && !g0.userData.__fb) g0.visible = false; } catch (_) {}   // 1.2.47: allow built-in fallback (__fb) to draw";
  if (!s.includes('!g0.userData.c322 && !g0.userData.__fb')) {
    if (!s.includes(ra)) throw new Error('fd36b1f render-wrapper line not found');
    s = s.replace(ra, rb);
  }
}

if (!s.includes("const GAME_VERSION = '1.2.47';")) throw new Error('ver missing');
if (!s.includes('<!-- glencraft-build: b1247-v1.2.47 -->')) throw new Error('marker missing');
if (!s.includes('armSwitch1247') || !s.includes('ArmSwitch1247')) throw new Error('arm-switch not embedded');
if (!s.includes("version: '1.2.47'") || !s.includes('held1245CrystalPrism') && !s.includes('paintCrystalPick')) throw new Error('held-fp 1.2.47 missing pieces');
if (!s.includes('worldTilesUntouched')) throw new Error('lost world tile no-op');
if (s.includes('__weakBoot1242 ? 1.25')) throw new Error('weak boot cap returned');
if (!s.includes('__fb') || !s.includes('u.__pw')) throw new Error('musket fallback 0.5s not embedded');
if (!s.includes('armSwitchStripped') || !s.includes('leakGuard')) throw new Error('body-strip / leak guard missing');
if (!s.includes('window.__fpLegacy')) throw new Error('__fpLegacy hook missing');
if (!s.includes('fist: fist,')) throw new Error('__fpLegacy hook was not placed at the fist declaration');

// Shoulder the musket at the hip as well as in aim: raise and pull the hip
// sight point back so the stock sits in the shoulder, keep ads centred.
{
  const a = 'rifle: {hip: [0.085, -0.125, -0.42], ads: [0, -0.003, -0.42], sk: 0.62';
  const b = 'rifle: {hip: [0.12, -0.05, -0.34], ads: [0, -0.003, -0.42], sk: 0.68';
  if (s.includes(a)) s = s.replace(a, b);
  else if (!s.includes('rifle: {hip: [0.12, -0.05, -0.34]') && !s.includes('rifle: {hip: [0.07, -0.05, -0.34]')) throw new Error('rifle hip pose line not found');
  if (s.includes('rifle: {hip: [0.07, -0.05, -0.34]')) s = s.replace('rifle: {hip: [0.07, -0.05, -0.34], ads: [0, -0.003, -0.42], sk: 0.68', 'rifle: {hip: [0.12, -0.05, -0.34], ads: [0, -0.003, -0.42], sk: 0.68');
}


fs.writeFileSync(out, s);
fs.writeFileSync(path.join(path.dirname(path.resolve(out)), 'version.json'), JSON.stringify({v: '1.2.47'}) + '\n');
console.log('Built 1.2.47 arm-switch (body stripped) + held repair: ' + out);

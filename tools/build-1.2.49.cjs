#!/usr/bin/env node
'use strict';
// 1.2.49: held-item repair on top of the shipped 1.2.47 hybrid.
// Opaque solid tools (no translucent crystal heads), one arm only
// (c121 overlay off + depth-cleared viewmodel pass for tools), curved
// slim purple crystal pick, remaining grip / sword / musket / 3p fixes.
// Does not touch world blocks, 4K, crystal-armour.glb, or 1.2.48 audio/mobs.
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
function replaceBlock(startTok, endTok, nextTok, src, label) {
  const i = s.indexOf(startTok);
  if (i < 0) throw new Error('missing start ' + label);
  const j = s.indexOf(endTok, i);
  if (j < 0) throw new Error('missing end ' + label);
  if (nextTok) {
    const after = s.slice(j + endTok.length, j + endTok.length + nextTok.length);
    if (after !== nextTok && s.indexOf(nextTok, j) !== j + endTok.length) {
      // allow exact following token check loosely
    }
  }
  s = s.slice(0, i) + src.trim() + '\n' + s.slice(j + endTok.length);
}

const from = s.includes("const GAME_VERSION = '1.2.47';") ? '1.2.47'
  : s.includes("const GAME_VERSION = '1.2.48';") ? '1.2.48'
  : s.includes("const GAME_VERSION = '1.2.49';") ? '1.2.49'
  : null;
if (!from) throw new Error('expected 1.2.47, 1.2.48 or 1.2.49 base');

if (from !== '1.2.49') {
  one("const GAME_VERSION = '" + from + "';", "const GAME_VERSION = '1.2.49';", 'ver');
  const fromMarker = from === '1.2.48' ? '<!-- glencraft-build: b1248-v1.2.48 -->' : '<!-- glencraft-build: b1247-v1.2.47 -->';
  one(fromMarker, '<!-- glencraft-build: b1249-v1.2.49 -->', 'marker');
  one('window.PATCH_NOTES = [', 'window.PATCH_NOTES = [\n' + JSON.stringify({
    v: 'v1.2.49', d: '2026-11-09', notes: [
      'Held items are solid and fully opaque again: the purple crystal pickaxe head is no longer a faint see-through sliver, and only one arm is drawn (no ghost duplicate).',
      'The purple crystal pickaxe has a longer, thin, gracefully curved two-point head, like a real pickaxe, used for first person, third person, dropped items and the icon.',
      'First-person tools stay visible in front of walls, empty hand no longer shows a leftover dirt box, the sword idle shows the blade, the musket aims distinctly from the hip, cobblestone sits in the palm, and third-person tools stay in the hand after walking.'
    ]
  }) + ',\n', 'notes');
}

function swapIife(startTok, src, label) {
  const i = s.indexOf(startTok);
  if (i < 0) throw new Error('missing ' + label + ' start');
  const end = ")(typeof window !== 'undefined' ? window : this);\n";
  let j = s.indexOf(end, i);
  if (j < 0) {
    const end2 = '})();\n';
    j = s.indexOf(end2, i);
    if (j < 0) throw new Error(label + ' end not found');
    s = s.slice(0, i) + src.trim() + '\n' + s.slice(j + end2.length);
    return;
  }
  s = s.slice(0, i) + src.trim() + '\n' + s.slice(j + end.length);
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
    '/* v1.2.49 / v1.2.40: first-person musket/pistol reload.',
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

// Prism: curved pick, opaque crystal, shader-order fix (v3).
{
  const src = fs.readFileSync(path.join(__dirname, 'visuals-source/prism-1241.js'), 'utf8');
  const startTok = '/* v1.2.42: shared, cached prism';
  const end = ")(typeof window !== 'undefined' ? window : this);\n";
  const i = s.indexOf(startTok);
  const j = s.indexOf(end, i);
  if (i < 0 || j < 0) throw new Error('prism-1241 replace failed');
  s = s.slice(0, i) + src.trim() + '\n' + s.slice(j + end.length);
}

// Crystal pick registration + 2D icon + opaque headMatFor.
{
  const src = fs.readFileSync(path.join(__dirname, 'content-source/picks-1211.js'), 'utf8');
  const startTok = '/* GLX-V1211 (v1.2.11): crystal pickaxes';
  const i = s.indexOf(startTok);
  const j = s.indexOf('})();\n', i);
  if (i < 0 || j < 0) throw new Error('picks-1211 replace failed');
  s = s.slice(0, i) + src.trim() + '\n' + s.slice(j + '})();\n'.length);
}

// Perf wrap: opaque textured crystal + do not squash prism-built p761.
{
  const src = fs.readFileSync(path.join(__dirname, 'content-source/perf-1222.js'), 'utf8');
  const startTok = '/* GLX-PERF1222 (v1.2.22): repeated blocks and the Purple crystal pickaxe.';
  const i = s.indexOf(startTok);
  const j = s.indexOf('})();\n', i);
  if (i < 0 || j < 0) throw new Error('perf-1222 replace failed');
  s = s.slice(0, i) + src.trim() + '\n' + s.slice(j + '})();\n'.length);
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
  idle: function () { try { swingT = 0; } catch (e) {} try { placeT = 0; } catch (e) {} try { grabT = 0; } catch (e) {} try { if (typeof handPose !== 'undefined' && handPose) { handPose.px = handPose.py = handPose.pz = 0; handPose.rx = handPose.ry = handPose.rz = 0; } } catch (e) {} try { eatAnim = 0; } catch (e) {} },
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

{
  if (!s.includes(FIST_ANCHOR)) throw new Error('fist declaration anchor missing');
  if (!s.includes('fist: fist,')) {
    s = s.replace(FIST_ANCHOR, FIST_ANCHOR + FP_LEGACY_AT_FIST);
  } else if (!s.includes('handPose.px = handPose.py')) {
    // Refresh the same-script idle so a leftover 1.2.47 hook also snaps handPose.
    const oldIdle = 'idle: function () { try { swingT = 0; } catch (e) {} try { placeT = 0; } catch (e) {} try { grabT = 0; } catch (e) {} },';
    const newIdle = 'idle: function () { try { swingT = 0; } catch (e) {} try { placeT = 0; } catch (e) {} try { grabT = 0; } catch (e) {} try { if (typeof handPose !== \'undefined\' && handPose) { handPose.px = handPose.py = handPose.pz = 0; handPose.rx = handPose.ry = handPose.rz = 0; } } catch (e) {} try { eatAnim = 0; } catch (e) {} },';
    if (s.includes(oldIdle)) s = s.replace(oldIdle, newIdle);
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

// fd36b1f musket fallback (already in 1.2.47; keep idempotent).
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

// Tool / empty-hand viewmodel pass, in the same script as renderer / hand.
{
  const vm = fs.readFileSync(path.join(__dirname, 'pilot-model-source/held-vm-1249.js'), 'utf8');
  const anchor = '})();\n\n// GLX-ZAP v1.1.59: the Thunner Cloudie lightning strike gets a big zap';
  if (!s.includes('heldVm1249')) {
    if (!s.includes(anchor)) throw new Error('C350/ZAP inject anchor missing');
    s = s.replace(anchor, '})();\n\n' + vm.trim() + '\n\n// GLX-ZAP v1.1.59: the Thunner Cloudie lightning strike gets a big zap');
  }
}

// Sculpted first-person hands (nails, palm pads, linen folds) on the __fpa rig.
{
  const hs = fs.readFileSync(path.join(__dirname, 'pilot-model-source/hands-sculpt-1249.js'), 'utf8');
  if (!s.includes('handsSculpt1249')) {
    if (s.includes('heldVm1249')) {
      const mark = '// GLX-ZAP v1.1.59: the Thunner Cloudie lightning strike gets a big zap';
      const idx = s.lastIndexOf(mark);
      if (idx < 0) throw new Error('hands-sculpt inject anchor missing');
      s = s.slice(0, idx) + hs.trim() + '\n\n' + s.slice(idx);
    } else {
      throw new Error('held-vm missing; cannot inject hands-sculpt');
    }
  } else {
    const i = s.indexOf('(function handsSculpt1249');
    const end = ")(typeof window !== 'undefined' ? window : this);\n";
    const j = s.indexOf(end, i);
    if (i < 0 || j < 0) throw new Error('hands-sculpt replace failed');
    s = s.slice(0, i) + hs.trim() + '\n' + s.slice(j + end.length);
  }
}

// Bucket / torch / map-adjacent art + musket sight correction.
{
  const art = fs.readFileSync(path.join(__dirname, 'pilot-model-source/items-art-1249.js'), 'utf8');
  if (!s.includes('itemsArt1249')) {
    const i = s.indexOf('(function handsSculpt1249');
    const end = ")(typeof window !== 'undefined' ? window : this);\n";
    const j = s.indexOf(end, i);
    if (i < 0 || j < 0) throw new Error('items-art inject anchor missing');
    s = s.slice(0, j + end.length) + art.trim() + '\n' + s.slice(j + end.length);
  } else {
    const i = s.indexOf('(function itemsArt1249');
    const end = ")(typeof window !== 'undefined' ? window : this);\n";
    const j = s.indexOf(end, i);
    if (i < 0 || j < 0) throw new Error('items-art replace failed');
    s = s.slice(0, i) + art.trim() + '\n' + s.slice(j + end.length);
  }
}

// After the last placeCamera wrap in the gameplay script, call the QA hook.
{
  const endAnchor = "})();\n</script>\n<div id=\"notesUI\" class=\"hidden\" data-testid=\"patch-notes\"";
  const hook = `})();\ntry {\n  const _pcQa1249 = placeCamera;\n  placeCamera = function () {\n    const r = _pcQa1249.apply(this, arguments);\n    try { if (typeof window.__qaAfterCamera === 'function') window.__qaAfterCamera(); } catch (e) {}\n    return r;\n  };\n} catch (e) {}\n</script>\n<div id="notesUI" class="hidden" data-testid="patch-notes"`;
  if (!s.includes('_pcQa1249')) {
    if (!s.includes(endAnchor)) throw new Error('script-2 end / notesUI anchor missing');
    s = s.replace(endAnchor, hook);
  }
}

// Late gripHand assignment when the empty-hand mesh is built.
{
  const a = 'if (!gripHand) gripHand = buildGripHand();';
  const b = 'if (!gripHand) gripHand = buildGripHand(); try { if (window.__fpLegacy) window.__fpLegacy.gripHand = gripHand; } catch (e) {}';
  if (s.includes(a) && !s.includes('window.__fpLegacy) window.__fpLegacy.gripHand = gripHand')) {
    s = s.replace(a, b);
  }
}


// 1.2.49: never parent the atlas-textured leftover palm onto empty / blocks.
// The hybrid __fpa hand is the only visible empty hand (fixes the dirt box).
{
  const a = "      gripHand.position.set(0, -0.01, -0.17); gripHand.rotation.set(Math.PI / 2, 0, 0); gripHand.scale.setScalar(1.25);\n      armPivot.add(gripHand);";
  const b = "      if (gripHand.parent) gripHand.parent.remove(gripHand); gripHand.visible = false; gripHand.scale.set(0, 0, 0);";
  if (s.includes(a) && !s.includes('gripHand.visible = false; gripHand.scale.set(0, 0, 0);')) s = s.replace(a, b);
  else if (!s.includes('gripHand.visible = false; gripHand.scale.set(0, 0, 0);')) throw new Error('empty gripHand branch not found');
  const ua = 'updateHand = function () { const r = uh.apply(this, arguments); fist.visible = false; return r; };';
  const ub = "updateHand = function () { const r = uh.apply(this, arguments); fist.visible = false; if (fist.parent) fist.parent.remove(fist); try { if (typeof armMesh !== 'undefined' && armMesh) armMesh.visible = false; if (gripHand && !(held.children[0] && held.children[0].userData && held.children[0].userData.tool)) { gripHand.visible = false; if (gripHand.parent) gripHand.parent.remove(gripHand); } const root = (typeof hand !== 'undefined' && hand) ? hand : null; if (root && root.traverse) { root.traverse(function(o){ if (!o || !o.isMesh) return; let p=o; let inHeld=false; while(p){ if(p===held){inHeld=true;break;} p=p.parent; } if(inHeld) return; if (o.userData && (o.userData.sculptKeep || o.userData.sculpt1249 || o.userData.nail1249)) return; const g=o.geometry, m=[].concat(o.material||[])[0]; if (g && g.type==='BoxGeometry' && m && m.map) o.visible=false; }); } } catch (e) {} return r; };";
  if (s.includes(ua)) s = s.replace(ua, ub);
  else {
    const oldUb = "updateHand = function () { const r = uh.apply(this, arguments); fist.visible = false; try { if (gripHand && !(held.children[0] && held.children[0].userData && held.children[0].userData.tool)) { gripHand.visible = false; if (gripHand.parent) gripHand.parent.remove(gripHand); } } catch (e) {} return r; };";
    if (s.includes(oldUb)) s = s.replace(oldUb, ub);
  }
}

// Keep the legacy box fist hidden when the hand is empty (setHeld turns it on).
{
  const a = 'if (!cnt(id)) { fist.visible = true; return; }';
  const b = "if (!cnt(id)) { fist.visible = false; if (fist.parent) fist.parent.remove(fist); return; }";
  if (s.includes(a)) s = s.replace(a, b);
  else if (!s.includes(b)) throw new Error('setHeld empty fist.visible not found');
}

// Seat first-person blocks in the palm: grip the cube centre, wrap fingers.
{
  const blockA = [
    'TR = grip(TR, V3(0.08, 0.18, 1), V3(0, 1, 0.08), [1.08, 1.15, 1.22, 1.28], 0.07);',
    'TR = grip(TR.add(V3(0.01, 0.05, -0.02)), V3(0.15, 0.1, 1), V3(0, 1, 0.05), [0.72, 0.78, 0.82, 0.88]);',
    'TR = grip(TR.add(V3(0, -0.01, 0.02)), V3(0.15, 0.1, 1), V3(0, 1, 0.05), [0.72, 0.78, 0.82, 0.88]);'
  ];
  const blockB = 'TR = grip(TR, V3(0.08, 0.18, 1), V3(0, 1, 0.08), [1.28, 1.36, 1.42, 1.48], 0.02);';
  let blockHit = s.includes(blockB);
  for (const a of blockA) { if (s.includes(a)) { s = s.replace(a, blockB); blockHit = true; } }
  if (!blockHit) throw new Error('block grip offset line not found');
  const trA = 'TR = local(held, V3(0, 0, 0)); TR.y -= held.children[0].userData.block ? 0.1 : 0.03; TR.z += 0.03;';
  const trOld = 'TR = local(held.children[0] || held, V3(0, 0, 0)); if (held.children[0].userData.block) { TR.y -= 0.015; } else { TR.y -= 0.03; TR.z += 0.03; }';
  const trB = 'TR = local(held.children[0] || held, V3(0, 0, 0)); if (held.children[0].userData.block) { TR.y += 0.055; TR.z += 0.01; } else { TR.y -= 0.03; TR.z += 0.03; }';
  if (s.includes(trA)) s = s.replace(trA, trB);
  else if (s.includes(trOld)) s = s.replace(trOld, trB);
  else if (!s.includes(trB)) throw new Error('block TR local line not found');
}

// Distinct musket hip vs shouldered ADS.
{
  const prevs = [
    'rifle: {hip: [0.16, -0.14, -0.40], ads: [0, -0.003, -0.82], sk: 0.68',
    'rifle: {hip: [0.16, -0.14, -0.40], ads: [0, -0.003, -0.52], sk: 0.68',
    'rifle: {hip: [0.16, -0.14, -0.40], ads: [0, 0.02, -0.26], sk: 0.72',
    'rifle: {hip: [0.12, -0.05, -0.34], ads: [0, -0.003, -0.42], sk: 0.68',
    'rifle: {hip: [0.085, -0.125, -0.42], ads: [0, -0.003, -0.42], sk: 0.62',
    'rifle: {hip: [0.07, -0.05, -0.34], ads: [0, -0.003, -0.42], sk: 0.68'
  ];
  const next = 'rifle: {hip: [0.16, -0.14, -0.40], ads: [0, -0.003, -0.62], sk: 0.68';
  const already = 'rifle: {hip: [0.18, -0.15, -0.38], ads: [0, 0.022, -0.40], sk: 0.70';
  const already0 = 'rifle: {hip: [0.18, -0.15, -0.38], ads: [0, 0.008, -0.36], sk: 0.70';
  let hit = s.includes(next) || s.includes(already) || s.includes(already0);
  for (const a of prevs) {
    if (s.includes(a)) { s = s.replace(a, next); hit = true; }
  }
  if (!hit) throw new Error('rifle hip/ads pose line not found');
  // Pull the musket ADS sight back so we look down the barrel, not into the stock.
  const closeAds = 'rifle: {hip: [0.16, -0.14, -0.40], ads: [0, 0.02, -0.26], sk: 0.72, yaw: 0.05, roll: 0.02, zoom: 0.18';
  const midAds0 = 'rifle: {hip: [0.16, -0.14, -0.40], ads: [0, -0.003, -0.82], sk: 0.68, yaw: 0.05, roll: 0.02, zoom: 0.18';
  const midAds = 'rifle: {hip: [0.16, -0.14, -0.40], ads: [0, -0.003, -0.52], sk: 0.68, yaw: 0.05, roll: 0.02, zoom: 0.18';
  const midAds2 = 'rifle: {hip: [0.16, -0.14, -0.40], ads: [0, -0.003, -0.52], sk: 0.68, yaw: 0.05, roll: 0.02, zoom: 0.12';
  const farAds = 'rifle: {hip: [0.16, -0.14, -0.40], ads: [0, -0.003, -0.82], sk: 0.68, yaw: 0.05, roll: 0.02, zoom: 0.10';
  const oldClean = 'rifle: {hip: [0.16, -0.14, -0.40], ads: [0, -0.003, -0.62], sk: 0.68, yaw: 0.05, roll: 0.02, zoom: 0.11';
  const cleanAds = 'rifle: {hip: [0.18, -0.15, -0.38], ads: [0, 0.022, -0.40], sk: 0.70, yaw: 0.05, roll: 0.02, zoom: 0.14';
  const prevClean = 'rifle: {hip: [0.18, -0.15, -0.38], ads: [0, 0.008, -0.36], sk: 0.70, yaw: 0.05, roll: 0.02, zoom: 0.14';
  if (s.includes(closeAds)) s = s.replace(closeAds, cleanAds);
  else if (s.includes(prevClean)) s = s.replace(prevClean, cleanAds);
  else if (s.includes(midAds0)) s = s.replace(midAds0, cleanAds);
  else if (s.includes(midAds)) s = s.replace(midAds, cleanAds);
  else if (s.includes(midAds2)) s = s.replace(midAds2, cleanAds);
  else if (s.includes(farAds)) s = s.replace(farAds, cleanAds);
  else if (s.includes(oldClean)) s = s.replace(oldClean, cleanAds);
  else if (s.includes('rifle: {hip: [0.16, -0.14, -0.40], ads: [0, -0.003, -0.62], sk: 0.68, yaw: 0.05, roll: 0.02, zoom: 0.10')) s = s.replace('rifle: {hip: [0.16, -0.14, -0.40], ads: [0, -0.003, -0.62], sk: 0.68, yaw: 0.05, roll: 0.02, zoom: 0.10', cleanAds);
  else if (!s.includes(cleanAds)) throw new Error('rifle ads zoom/sight line not found');
  const pOld = [
    'pistol: {hip: [0.08, -0.12, -0.42], ads: [0, -0.0035, -0.47], sk: 0',
    'pistol: {hip: [0.10, -0.10, -0.34], ads: [0, -0.008, -0.28], sk: 0'
  ];
  const pNew = 'pistol: {hip: [0.13, -0.08, -0.28], ads: [0, -0.012, -0.22], sk: 0';
  let pHit = s.includes(pNew);
  for (const a of pOld) { if (s.includes(a)) { s = s.replace(a, pNew); pHit = true; } }
  if (!pHit) throw new Error('pistol hip/ads pose line not found');
}

if (!s.includes("const GAME_VERSION = '1.2.49';")) throw new Error('ver missing');
if (!s.includes('<!-- glencraft-build: b1249-v1.2.49 -->')) throw new Error('marker missing');
if (!s.includes('armSwitch1247') || !s.includes('ArmSwitch1247')) throw new Error('arm-switch not embedded');
if (!s.includes("version: '1.2.49'") || !s.includes('paintCrystalPick')) throw new Error('held-fp 1.2.49 missing pieces');
if (!s.includes('worldTilesUntouched')) throw new Error('lost world tile no-op');
if (s.includes('__weakBoot1242 ? 1.25')) throw new Error('weak boot cap returned');
if (!s.includes('__fb') || !s.includes('u.__pw')) throw new Error('musket fallback 0.5s not embedded');
if (!s.includes('armSwitchStripped') || !s.includes('leakGuard')) throw new Error('body-strip / leak guard missing');
if (!s.includes('window.__fpLegacy')) throw new Error('__fpLegacy hook missing');
if (!s.includes('fist: fist,')) throw new Error('__fpLegacy hook was not placed at the fist declaration');
if (!s.includes('curvedPickSpikeGeometry')) throw new Error('curved pick geometry missing');
if (!s.includes('prism1241v3')) throw new Error('prism v3 shader cache key missing');
if (!s.includes('heldVm1249')) throw new Error('held viewmodel pass missing');
if (!s.includes('_pcQa1249')) throw new Error('qa after-camera hook missing');
if (!s.includes('authorSwordGrip')) throw new Error('sword grip author missing');
if (!s.includes('transparent: false, opacity: 1, depthWrite: true')) throw new Error('opaque crystal headMatFor missing');
if (s.includes('specular: 0xffffff, transparent: true, opacity: 0.92') || s.includes('specular: 0xffd8ff, transparent: true, opacity: 0.94')) {
  throw new Error('old translucent crystal headMatFor still present');
}
if (!s.includes('handsSculpt1249') || !s.includes('fingerSegGeo')) throw new Error('sculpted hands missing');
if (!s.includes('crescentBladeGeometry') || !s.includes('crystalVeinTexture')) throw new Error('crescent crystal pick missing');
if (!s.includes('itemsArt1249')) throw new Error('items-art 1249 missing');
if (!s.includes('ads: [0, 0.022, -0.40]')) throw new Error('musket ADS pose not applied');


fs.writeFileSync(out, s);
fs.writeFileSync(path.join(path.dirname(path.resolve(out)), 'version.json'), JSON.stringify({v: '1.2.49'}) + '\n');
console.log('Built 1.2.49 held repair (sculpted hands, crescent pick, item art): ' + out);

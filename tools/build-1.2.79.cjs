#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');
const {execSync} = require('child_process');
const root = path.resolve(__dirname, '..');

function must(cond, msg) { if (!cond) { console.error('FAIL:', msg); process.exit(1); } }
function replaceOnce(s, a, b, label) {
  const n = s.split(a).length - 1;
  must(n === 1, label + ': expected 1 match, got ' + n);
  return s.split(a).join(b);
}

let html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const before = html.length;

/* ---- version ---- */
if (html.includes("const GAME_VERSION = '1.2.78';") && !html.includes("const GAME_VERSION = '1.2.79';")) {
  html = replaceOnce(html, "const GAME_VERSION = '1.2.78';", "const GAME_VERSION = '1.2.79';", 'GAME_VERSION');
}
must(html.includes("const GAME_VERSION = '1.2.79';"), 'GAME_VERSION is not 1.2.79');

if (!html.includes('<!-- glencraft-build: b1279-v1.2.79 -->')) {
  must(html.includes('<!-- glencraft-build: b1278-v1.2.78 -->'), 'b1278 marker missing');
  html = replaceOnce(html,
    '<!-- glencraft-build: b1278-v1.2.78 -->',
    '<!-- glencraft-build: b1278-v1.2.78 -->\n<!-- glencraft-build: b1279-v1.2.79 -->',
    'build marker');
}

const NOTE = '{"v":"v1.2.79","d":"2026-11-14","notes":["Map is held in the hand: thumb on the sheet, tilted up so you can read it.","First person: your hands now have forearms and sleeves.","Third person: held items are in the right hand."]},';
if (!html.includes('"v":"v1.2.79"')) {
  html = replaceOnce(html,
    'window.PATCH_NOTES = [\n{"v":"v1.2.78"',
    'window.PATCH_NOTES = [\n' + NOTE + '\n{"v":"v1.2.78"',
    'PATCH_NOTES');
} else {
  const i = html.indexOf('{"v":"v1.2.79"');
  const j = html.indexOf('\n{"v":"v1.2.78"', i);
  must(i >= 0 && j > i, 'cannot re-place 1.2.79 note');
  html = html.slice(0, i) + NOTE + html.slice(j);
}

/* ---- third person: held item and holding arm are the RIGHT hand (pilot rig) ---- */
function swapOnce(a, b, label) { if (html.includes(b)) return; html = replaceOnce(html, a, b, label); }
swapOnce("const side=slot?'L':'R',a=u.arms[slot],el=a.userData.el;\n          a.position.copy(native(near,'upper_arm.'+side).pos);\n          const l1=native(near,'forearm.'+side).pos.distanceTo(a.position),l2=native(near,'hand.'+side).pos.distanceTo(native(near,'forearm.'+side).pos);",
  "const side=slot?'L':'R',aS=slot?'R':'L'/* GLX-TPR1279 */,a=u.arms[slot],el=a.userData.el;\n          a.position.copy(native(near,'upper_arm.'+aS).pos);\n          const l1=native(near,'forearm.'+aS).pos.distanceTo(a.position),l2=native(near,'hand.'+aS).pos.distanceTo(native(near,'forearm.'+aS).pos);", 'TPR setup');
swapOnce("const side=slot?'L':'R',upper=r.bone('upper_arm.'+side),fore=r.bone('forearm.'+side),hand=r.bone('hand.'+side),socket=find(r.root,'weapon_grip_slot'+slot);",
  "const side=slot?'R':'L'/* GLX-TPR1279 */,upper=r.bone('upper_arm.'+side),fore=r.bone('forearm.'+side),hand=r.bone('hand.'+side),socket=find(r.root,'weapon_grip_slot'+(1-slot));", 'TPR ik');
swapOnce("const side=slot?'L':'R',sg=slot?1:-1;", "const side=slot?'R':'L',sg=slot?-1:1/* GLX-TPR1279 */;", 'TPR clavicle');
swapOnce("for(let slot=0;slot<2;slot++){const side=slot?'L':'R';\n        if(!u.arms[slot].userData.pilotTarget)addWorld(r,rootQ,'hand.'+side,",
  "for(let slot=0;slot<2;slot++){const side=slot?'L':'R',aS=slot?'R':'L'/* GLX-TPR1279 */;\n        if(!u.arms[slot].userData.pilotTarget)addWorld(r,rootQ,'hand.'+aS,", 'TPR limbs');
swapOnce("const side=slot?'L':'R',a=u.arms[slot],el=a.userData.el,leg=u.legs[slot],knee=leg.userData.kn;",
  "const side=slot?'L':'R',aS=slot?'R':'L'/* GLX-TPR1279 */,a=u.arms[slot],el=a.userData.el,leg=u.legs[slot],knee=leg.userData.kn;", 'TPR pose side');
swapOnce("rotate('upper_arm.'+side,armDelta);rotate('forearm.'+side,armDelta.multiply(el?el.quaternion:Q()));",
  "rotate('upper_arm.'+aS,armDelta);rotate('forearm.'+aS,armDelta.multiply(el?Q().copy(el.quaternion).set(el.quaternion.x,-el.quaternion.y,-el.quaternion.z,el.quaternion.w):Q()));", 'TPR pose arm');
swapOnce("else {const armDelta=torso.clone().multiply(a.quaternion);rotate('upper_arm.'+aS",
  "else {const armDelta=torso.clone().multiply(Q().set(a.quaternion.x,-a.quaternion.y,-a.quaternion.z,a.quaternion.w)/* mirrored: arms[1] is now the right arm */);rotate('upper_arm.'+aS", 'TPR pose mirror');
swapOnce("r.bone('finger.'+side+'.'+digit+'.0'+part)", "r.bone('finger.'+aS+'.'+digit+'.0'+part)", 'TPR fingers');
swapOnce("r.bone('thumb.'+side+'.0'+part)", "r.bone('thumb.'+aS+'.0'+part)", 'TPR thumb');
swapOnce("&&!u.arms[a].visible)visible=false;", "&&!u.arms[1-a].visible)visible=false;", 'TPR visibility');
swapOnce("socket=find(p.near.root,'weapon_grip_slot'+slot);", "socket=find(p.near.root,'weapon_grip_slot'+(1-slot));", 'TPR sync');
swapOnce("F = V().set(fx, 0, fz), R = V().set(-rx, 0, -rz);", "F = V().set(fx, 0, fz), R = u.pilot ? V().set(rx, 0, rz) : V().set(-rx, 0, -rz);  /* GLX-TPR1279: pilot holds in the right hand */", 'TPR anim side');
swapOnce("    const slot = opts.slot == null ? 1 : opts.slot;\n    const nearRoot = p && p.near && p.near.root;\n    const farRoot = p && p.far && p.far.root;\n    const socket = (nearRoot && find(nearRoot, 'weapon_grip_slot' + slot))\n      || (farRoot && find(farRoot, 'weapon_grip_slot' + slot))\n      || find(model, 'weapon_grip_slot' + slot)\n      || (nearRoot && find(nearRoot, 'weapon_grip_slot' + (slot === 1 ? 0 : 1)))\n      || find(model, 'weapon_grip_slot' + (slot === 1 ? 0 : 1));",
  "    const slot = opts.slot == null ? 1 : opts.slot;\n    const nearRoot = p && p.near && p.near.root;\n    const farRoot = p && p.far && p.far.root;\n    const sk = p ? (slot === 1 ? 0 : 1) : slot;  /* GLX-TPR1279: arms[1] is the pilot's right hand (socket 0) */\n    const socket = (nearRoot && find(nearRoot, 'weapon_grip_slot' + sk))\n      || (farRoot && find(farRoot, 'weapon_grip_slot' + sk))\n      || find(model, 'weapon_grip_slot' + sk)\n      || (nearRoot && find(nearRoot, 'weapon_grip_slot' + (sk === 1 ? 0 : 1)))\n      || find(model, 'weapon_grip_slot' + (sk === 1 ? 0 : 1));", 'TPR poseHeld');

/* Keep every 1.2.73 / 1.2.75 gun and tool-grip guarantee, and the 1.2.77 revert. */

/* 1.2.74–1.2.77 notes were inserted without commas, which is a
   SyntaxError and would stop this script (and the 1.2.78 IIFE) from
   running. Restore commas between adjacent entries. */
{
  const start = html.indexOf('window.PATCH_NOTES = [');
  const end = html.indexOf('\n];', start);
  must(start >= 0 && end > start, 'PATCH_NOTES array not found');
  const arr = html.slice(start, end);
  const fixed = arr.replace(/\}\n\{/g, '},\n{');
  html = html.slice(0, start) + fixed + html.slice(end);
  must(!/\}\n\{/.test(html.slice(html.indexOf('window.PATCH_NOTES = ['), html.indexOf('\n];', html.indexOf('window.PATCH_NOTES = [')))), 'PATCH_NOTES still missing commas');
}

must(html.includes("    pistol: {p: [0, -0.07, 0.05], axis: [0, -0.95, 0.30], palm: [0, 0.050, 0.018], align: 0}"), 'pistol GRIP is unchanged from 1.2.73');
must(html.includes('    p761:   {p: [0, 0.02, 0], axis: [0, 1, 0], palm: [0, 0.058, 0.018], align: 0, errMax: 1.20},\n    pick:'), 'p761 GRIP still matches 1.2.73');
must(html.includes('if (held.userData && held.userData._bladeLock1274)'), 'dressPickHook lock must stay');
must(html.includes('/* GLX-FIX1275 (v1.2.75):'), 'FIX1275 IIFE must stay (potion path + gun skip)');
must(html.includes('/* GLX-FIX1277 (v1.2.77):'), 'FIX1277 revert IIFE must stay');
must(html.includes('/* GLX-FIX1276 (v1.2.76):'), 'FIX1276 map IIFE must stay');
must(!html.includes('/* GLX-FIX1274 (v1.2.74):'), 'FIX1274 IIFE must stay gone');
must(html.includes('/* GLX-HANDS1271'), 'HANDS1271 must stay');
must(html.includes('/* GLX-HANDS1270'), 'HANDS1270 must stay');
must(html.includes('/* GLX-HANDS1266'), 'HANDS1266 must stay');
must(html.includes('/* GLX-HANDS1263'), 'HANDS1263 must stay');
must(html.includes("restoredFrom: '1e9db15'"), '1263 restore must stay');
must(!html.includes('/* GLX-HANDS1261'), 'HANDS1261 must stay removed');
must(!html.includes("['dU', 'dL', 'dR'].forEach"), 'gold D-pad must stay untouched');
must(html.includes('/* GLX-FIX1273'), 'FIX1273 must stay');
must(html.includes('/* GLX-FIX1272'), 'FIX1272 must stay');
must(html.includes('applyPotionPath'), 'potion grip path is present');
must(html.includes('isWeapon'), 'gun exclusion is present');
must(!html.includes('function freezeToolPose'), 'the 1.2.74 snapshot must stay gone');

/* 1.2.75 / 1.2.77 render + chunk lines must stay. */
must(html.includes('const VF = () => clamp(SET.rdist, 3, 16) * 16;'), 'VF not 1.2.75');
must(html.includes('id="rdRange" data-testid="settings-rdist" min="3" max="16"'), 'slider max not 16');
must(html.includes('const setV = v => { SET.rdist = clamp(Math.round(v), 3, 16); saveSet(); sync(); };'), 'setV not 16');
must(html.includes('      else n = isTouch() ? 4 : 8;'), '1261 default not 4 / 8');
must(html.includes('    return Math.max(3, Math.min(16, n));'), '1261 cap not 16');
must(!html.includes('min="3" max="24"'), 'slider must not go to 24');
must(!html.includes('__rdist1276'), '__rdist1276 must stay gone');

/* ---- inject 1.2.79 IIFE just before the closing script tag ---- */
const src = fs.readFileSync(path.join(root, 'tools/content-source/fix-1279.js'), 'utf8').trim() + '\n';
must(src.includes('GLX-FIX1279'), 'fix-1279.js is required');
must(!src.includes('H.apply = function'), '1279 must not wrap H.apply');
must(!src.includes('H.repose = function'), '1279 must not wrap H.repose');
must(!src.includes('renderer.render ='), '1279 must not wrap renderer.render');
must(!src.includes("['dU', 'dL', 'dR'].forEach"), '1279 must not touch the gold D-pad');
must(!src.includes('SET.rdist'), '1279 must not touch render distance');
must(!src.includes('buildChunk'), '1279 must not touch meshing');
must(!src.includes('alert('), '1279 has no popups');
must(html.includes('/* GLX-FIX1278 (v1.2.78):'), 'FIX1278 must stay');

function injectIife(html, bundled) {
  if (html.includes('/* GLX-FIX1279 (v1.2.79):')) {
    const i = html.indexOf('/* GLX-FIX1279 (v1.2.79):');
    const j = html.indexOf('</script>', i);
    must(j > i, 'cannot find </script> after 1279');
    return html.slice(0, i) + bundled + html.slice(j);
  }
  const j = html.lastIndexOf('</script>');
  must(j > 0, 'cannot find closing script tag');
  must(html.lastIndexOf('/* GLX-FIX1278 (v1.2.78):') < j, '1278 is not in the last script');
  return html.slice(0, j) + bundled + html.slice(j);
}
html = injectIife(html, src);

must(html.includes('/* GLX-FIX1279 (v1.2.79):'), 'FIX1279 banner missing');
must((html.split('(function fix1279()').length - 1) === 1, 'duplicate fix1279 IIFEs');
must(html.includes('/* GLX-FIX1278 (v1.2.78):'), 'FIX1278 stayed');
must(html.includes('const SPAWN_RADIUS = 100'), 'SPAWN_RADIUS stayed');
must(html.includes('const DESPAWN_RADIUS = 150'), 'DESPAWN_RADIUS stayed');
must(html.includes('const DIAMOND_PEAK_Y = -200'), 'DIAMOND_PEAK_Y stayed');
must(html.includes('/* GLX-FIX1277 (v1.2.77):'), 'FIX1277 stayed');
must(html.includes('/* GLX-FIX1276 (v1.2.76):'), 'FIX1276 map IIFE stayed');
must(html.includes("const GAME_VERSION = '1.2.79';"), 'version not bumped');
must(html.includes('"v":"v1.2.79"'), 'patch notes missing');
must((html.split('GLX-TPR1279').length - 1) >= 7, 'third-person right-hand edits missing');
/* PATCH_NOTES must parse */
{
  const st = html.indexOf('window.PATCH_NOTES = [');
  const en = html.indexOf('\n];', st);
  const arr = html.slice(st + 'window.PATCH_NOTES = '.length, en + 2);
  try { const a = (new Function('return ' + arr))(); must(Array.isArray(a) && a[0].v === 'v1.2.79', 'PATCH_NOTES[0] is not 1.2.79'); } catch (e) { must(false, 'PATCH_NOTES does not parse: ' + e.message); }
}

/* Forbidden cave / view-distance symbols from 1.2.76 must stay gone. */
const forbidden = [
  'function buildLodChunk',
  'function installCaveFix',
  'function wrapBuildChunk',
  'function idlePump',
  'function tickAdapt',
  'function applyFarPlane',
  'function raiseDefault',
  'function remeshCulledCaves',
  'function bootTerrain',
  'function wrapUpdateSky',
  'function installStream',
  'function ourStreamRadius',
  'function relodRing',
  'function lodStepFor',
  'function rdist1276',
  '__rdist1276',
  'buildChunk._p1276',
];
for (const k of forbidden) {
  must(!html.includes(k), 'forbidden leftover: ' + k);
}

/* The C70 / PERF1261 blocks must still match 1.2.75. */
{
  let html75 = '';
  try {
    html75 = execSync('git show c40f347:index.html', {cwd: root, encoding: 'utf8', maxBuffer: 80 * 1024 * 1024});
  } catch (e) {
    must(false, 'cannot read 1.2.75 index.html from git: ' + e.message);
  }
  const vf75 = "const VF = () => clamp(SET.rdist, 3, 16) * 16;";
  must(html.includes(vf75) && html75.includes(vf75), 'VF line differs from 1.2.75');
  const slider75 = 'id="rdRange" data-testid="settings-rdist" min="3" max="16"';
  must(html.includes(slider75) && html75.includes(slider75), 'slider line differs from 1.2.75');
  const setv75 = 'const setV = v => { SET.rdist = clamp(Math.round(v), 3, 16); saveSet(); sync(); };';
  must(html.includes(setv75) && html75.includes(setv75), 'setV line differs from 1.2.75');
  const rdist75 = '      else n = isTouch() ? 4 : 8;\n    } catch (_) { n = 8; }\n    return Math.max(3, Math.min(16, n));';
  must(html.includes(rdist75) && html75.includes(rdist75), '1261 rdist block differs from 1.2.75');
  const def75 = 'if (typeof SET.rdist !== \'number\') SET.rdist = touchMode ? 4 : 8;';
  must(html.includes(def75) && html75.includes(def75), 'SET.rdist default differs from 1.2.75');
}

fs.writeFileSync(path.join(root, 'index.html'), html);
console.log('index.html', before, '->', html.length);

fs.writeFileSync(path.join(root, 'version.json'), '{"v":"1.2.79"}\n');
console.log('version.json written');

let credits = fs.readFileSync(path.join(root, 'CREDITS.md'), 'utf8');
const block = `## v1.2.79 Map in hand, forearms, right-hand items

- Map is held in the hand: thumb on the sheet, tilted up so you can read it.
- First person: your hands now have forearms and sleeves.
- Third person: held items are in the right hand.

`;
if (!credits.includes('## v1.2.79')) {
  const k = credits.indexOf('## v1.2.78');
  must(k >= 0, 'CREDITS 1.2.78 missing as insert point');
  credits = credits.slice(0, k) + block + credits.slice(k);
} else {
  const a = credits.indexOf('## v1.2.79');
  const b = credits.indexOf('## v1.2.78', a + 1);
  if (a >= 0 && b > a) credits = credits.slice(0, a) + block + credits.slice(b);
}
must(credits.includes('## v1.2.79'), 'CREDITS 1.2.79 missing');
fs.writeFileSync(path.join(root, 'CREDITS.md'), credits);
console.log('CREDITS.md updated');
console.log('build 1.2.79 done');

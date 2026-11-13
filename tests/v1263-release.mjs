// v1.2.63: first-person hands restored to the pre-1.2.60 (1.2.59) version.
import fs from 'node:fs';
import assert from 'node:assert/strict';

const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const ver = JSON.parse(fs.readFileSync(new URL('../version.json', import.meta.url), 'utf8'));
const credits = fs.readFileSync(new URL('../CREDITS.md', import.meta.url), 'utf8');
let n = 0;
const ok = (c, l) => { assert.ok(c, l); console.log('ok ' + (++n) + ' ' + l); };

ok(ver.v === '1.2.71' || ver.v === '1.2.70' || ver.v === '1.2.69' || ver.v === '1.2.68' || ver.v === '1.2.67' || ver.v === '1.2.66' || ver.v === '1.2.65' || ver.v === '1.2.64' || ver.v === '1.2.63', 'version.json is 1.2.63');
ok(html.includes("const GAME_VERSION = '1.2.71';") || html.includes("const GAME_VERSION = '1.2.70';") || html.includes("const GAME_VERSION = '1.2.69';") || html.includes("const GAME_VERSION = '1.2.68';") || html.includes("const GAME_VERSION = '1.2.67';") || html.includes("const GAME_VERSION = '1.2.66';") || html.includes("const GAME_VERSION = '1.2.65';") || html.includes("const GAME_VERSION = '1.2.64';") || html.includes("const GAME_VERSION = '1.2.63';"), 'GAME_VERSION is 1.2.63');
ok(html.includes('<!-- glencraft-build: b1271-v1.2.71 -->') || html.includes('<!-- glencraft-build: b1270-v1.2.70 -->') || html.includes('<!-- glencraft-build: b1269-v1.2.69 -->') || html.includes('<!-- glencraft-build: b1268-v1.2.68 -->') || html.includes('<!-- glencraft-build: b1267-v1.2.67 -->') || html.includes('<!-- glencraft-build: b1266-v1.2.66 -->') || html.includes('<!-- glencraft-build: b1265-v1.2.65 -->') || html.includes('<!-- glencraft-build: b1264-v1.2.64 -->') || html.includes('<!-- glencraft-build: b1263-v1.2.63 -->'), 'build marker b1263');
ok(credits.includes('## v1.2.63 Hands restored to the pre-1.2.60 version'), 'CREDITS has the 1.2.63 hands-restore section');
ok(credits.includes('1e9db15'), 'CREDITS names the 1.2.59 restore commit');

const notesStart = html.indexOf('window.PATCH_NOTES = [');
ok(notesStart > 0, 'PATCH_NOTES present');
const head = html.slice(notesStart, notesStart + 58000);
ok(head.includes('"v":"v1.2.63"') && head.includes('"d":"2026-11-13"'), 'v1.2.63 notes are at the top, dated 2026-11-13');
ok(head.indexOf('"v":"v1.2.63"') < head.indexOf('"v":"v1.2.62"'), '1.2.63 notes sit above 1.2.62');
for (const phrase of [
  'Hands restored to the pre-1.2.60 version',
  '1.2.59 release',
  'In third person the first-person arm stays hidden',
  'Hard-refresh'
]) {
  ok(head.includes(phrase), 'patch notes mention: ' + phrase);
}

ok(html.includes('/* GLX-HANDS1263'), 'HANDS1263 IIFE is in the page');
const i1263 = html.indexOf('/* GLX-HANDS1263');
ok(i1263 > 0, 'HANDS1263 marker found');
const h1263 = html.slice(i1263, i1263 + 12000);
ok(h1263.includes("restoredFrom: '1e9db15'"), '1263 records restore commit 1e9db15');
ok(h1263.includes("restoredFromLabel: '1.2.59'"), '1263 records restore version 1.2.59');
ok(h1263.includes('freezeKinds') && h1263.includes("get() { return 0; }"), '1263 freezes NEW_FP_KINDS at 0 (the 1.2.59 allow-list)');
ok(h1263.includes('drop1259'), '1263 drops the 1.2.60 1259 rig so the 1.2.49 __fpa path is live');
ok(h1263.includes('shiftSkipped') || h1263.includes('shiftPoses = function'), '1263 undoes the 1.2.62 wrist-pose tweak');
ok(h1263.includes('hideInThirdPerson') || h1263.includes('third-person hiding') || h1263.includes('third person'), '1263 keeps third-person view-model hiding');
ok(h1263.includes('gold D-pad is left alone') || h1263.includes('gold D-pad is untouched'), '1263 does not touch the gold D-pad');
ok(!h1263.includes("['dU', 'dL', 'dR'].forEach"), '1263 does not hide the gold D-pad');

ok(!html.includes('/* GLX-HANDS1261'), '1.2.61 voxel-arm IIFE stays removed');
ok(html.includes('/* GLX-HANDS1260'), '1.2.60 hands IIFE stays in the page (neutralized at runtime)');
ok(html.includes('/* GLX-HANDS1262'), 'HANDS1262 stays in the page (pose tweak undone at runtime; TP hide kept)');
ok(html.includes('__fpVm1259') && html.includes("version: '1.2.59-frame-torch'"), '1259 viewmodel IIFE and 1.2.59 torch freeze stay');
ok(html.includes('_seatStable') && html.includes('errMax: 1.20'), '1.2.59 torch-pose freeze is still in the held-frame path');

ok(html.includes('/* GLX-TBOX1262'), 'TBOX1262 IIFE is still in the page');
ok(html.includes('hideLeftovers') && html.includes('hideDoorwaySlab') && html.includes('doorPhysics'), 'door leftover hide and walk-through physics stay');
ok(html.includes('/* GLX-TORSO1262'), 'TORSO1262 IIFE is still in the page');
ok(html.includes('torsoSides1262') && html.includes('attachFpCull') && html.includes('buildSideGeo') && html.includes('visual_torso_outfit'), 'torso side fill, FP cull, and Scottish-GLB hook stay');
ok(html.includes('/* GLX-TBOX1261 (v1.2.61):'), 'TBOX1261 IIFE is still in the page');
ok(html.includes('/* GLX-TBOX1260 (v1.2.60):'), 'TBOX1260 IIFE is still in the page');
ok(html.includes('winH: 17.75'), '1.2.61 larger windows stay');
ok(html.includes('GLX-PERF1261') && html.includes('streamRadius = function') && html.includes("SET.rdist = touchMode ? 4 : 8"), 'render-distance cap stays');
ok(html.includes('GLX-POP1261') && html.includes('Disable pop star') && html.includes('SET.noPopstar'), 'pop-star setting stays');
ok(html.includes('__tbox1261.lookingAtDoor') && html.includes('hookTouchLT'), '1.2.61 door LT hitboxes stay');
ok(!html.includes("['dU', 'dL', 'dR'].forEach") && html.includes('gold D-pad is left alone'), 'gold D-pad is not hidden');
ok(html.includes('__glxSingleHum'), 'single-hum flag stays');

/* 1263 is the last hands IIFE, so it wins the boot race. */
const i1260 = html.indexOf('/* GLX-HANDS1260');
const i1262 = html.indexOf('/* GLX-HANDS1262');
ok(i1263 > i1260 && i1263 > i1262, 'HANDS1263 is injected after 1260 and 1262');

console.log('all ok (' + n + ')');

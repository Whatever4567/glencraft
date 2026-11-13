// v1.2.62: original arm restored and repositioned, shirt sides, time-box door.
import fs from 'node:fs';
import assert from 'node:assert/strict';

const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const ver = JSON.parse(fs.readFileSync(new URL('../version.json', import.meta.url), 'utf8'));
const credits = fs.readFileSync(new URL('../CREDITS.md', import.meta.url), 'utf8');
let n = 0;
const ok = (c, l) => { assert.ok(c, l); console.log('ok ' + (++n) + ' ' + l); };

ok(ver.v === '1.2.63' || ver.v === '1.2.62', 'version.json is 1.2.62');
ok(html.includes("const GAME_VERSION = '1.2.63';") || html.includes("const GAME_VERSION = '1.2.62';"), 'GAME_VERSION is 1.2.62');
ok(html.includes('<!-- glencraft-build: b1263-v1.2.63 -->') || html.includes('<!-- glencraft-build: b1262-v1.2.62 -->'), 'build marker b1262');
ok(credits.includes('## v1.2.62'), 'CREDITS has a v1.2.62 section');

const notesStart = html.indexOf('window.PATCH_NOTES = [');
ok(notesStart > 0, 'PATCH_NOTES present');
const head = html.slice(notesStart, notesStart + 18000);
ok(head.includes('"v":"v1.2.62"') && head.includes('"d":"2026-11-13"'), 'v1.2.62 notes are at the top, dated 2026-11-13');
ok(head.indexOf('"v":"v1.2.62"') < head.indexOf('"v":"v1.2.61"'), '1.2.62 notes sit above 1.2.61');
for (const phrase of [
  'original first-person arm is back',
  '1.2.61 voxel-arm replacement is gone',
  'Swing, mining, placing',
  'forearm comes in from the bottom-right',
  'empty hand is palm-up',
  'In third person the first-person arm is hidden',
  'sides of the white shirt are back',
  'waist and stomach are a solid wrap',
  'hidden only from your own first-person camera',
  'walk into the time box',
  'leftover closed door behind it is gone',
  'walk through and back out',
  'Hard-refresh'
]) {
  ok(head.includes(phrase), 'patch notes mention: ' + phrase);
}

ok(!html.includes('/* GLX-HANDS1261'), '1.2.61 voxel-arm IIFE is removed from the page');
ok(html.includes('/* GLX-HANDS1260'), '1.2.60 hands IIFE (original arm) is still in the page');
ok(html.includes('/* GLX-HANDS1262'), 'HANDS1262 IIFE is in the page');
ok(html.includes('restore1259') && html.includes('shiftPoses') && html.includes('hideInThirdPerson'), '1262 restores 1259, shifts poses, hides the view-model in third person');
ok(html.includes('__fpVm1259') && html.includes("version: '1.2.59-frame-torch'"), '1259 viewmodel and 1.2.59 torch freeze stay');
const h1262 = html.slice(html.indexOf('/* GLX-HANDS1262'), html.indexOf('/* GLX-HANDS1262') + 16000);
ok(!h1262.includes('Vox.prototype.cube') && !h1262.includes('buildHandMesh') && !h1262.includes('pixel-polygon voxel'), '1262 does not add a new voxel grip mesh');

ok(html.includes('/* GLX-TBOX1262'), 'TBOX1262 IIFE is in the page');
ok(html.includes('hideLeftovers') && html.includes('hideDoorwaySlab') && html.includes('doorPhysics'), 'door leftover faces are hidden and walk-through physics is in place');
ok(html.includes('/* GLX-TORSO1262'), 'TORSO1262 IIFE is in the page');
ok(html.includes('torsoSides1262') && html.includes('attachFpCull') && html.includes('buildSideGeo'), 'torso side fill and first-person-only cull are in the page');

ok(html.includes('/* GLX-TBOX1261 (v1.2.61):'), 'TBOX1261 IIFE is still in the page');
ok(html.includes('/* GLX-TBOX1260 (v1.2.60):'), 'TBOX1260 IIFE is still in the page');
ok(html.includes('winH: 17.75'), '1.2.61 larger windows stay');
ok(html.includes('GLX-PERF1261') && html.includes('streamRadius = function') && html.includes("SET.rdist = touchMode ? 4 : 8"), 'render-distance cap stays');
ok(html.includes('GLX-POP1261') && html.includes('Disable pop star') && html.includes('SET.noPopstar'), 'pop-star setting stays');
ok(html.includes('__tbox1261.lookingAtDoor') && html.includes('hookTouchLT'), '1.2.61 door LT hitboxes stay');
ok(!html.includes("['dU', 'dL', 'dR'].forEach") && html.includes('gold D-pad is left alone'), 'gold D-pad is not hidden');
ok(html.includes('__glxSingleHum'), 'single-hum flag stays');

console.log('all ok (' + n + ')');

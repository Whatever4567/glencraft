// v1.2.61: larger police-box windows, dark navy, arm framing, single hum,
// pop-star setting, render-distance cap, touch LT door toggle.
// Source proofs against the shipped index.html.
import fs from 'node:fs';
import assert from 'node:assert/strict';

const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const ver = JSON.parse(fs.readFileSync(new URL('../version.json', import.meta.url), 'utf8'));
const credits = fs.readFileSync(new URL('../CREDITS.md', import.meta.url), 'utf8');
let n = 0;
const ok = (c, l) => { assert.ok(c, l); console.log('ok ' + (++n) + ' ' + l); };

ok(ver.v === '1.2.66' || ver.v === '1.2.65' || ver.v === '1.2.64' || ver.v === '1.2.63' || ver.v === '1.2.62' || ver.v === '1.2.61', 'version.json is 1.2.61');
ok(html.includes("const GAME_VERSION = '1.2.66';") || html.includes("const GAME_VERSION = '1.2.65';") || html.includes("const GAME_VERSION = '1.2.64';") || html.includes("const GAME_VERSION = '1.2.63';") || html.includes("const GAME_VERSION = '1.2.62';") || html.includes("const GAME_VERSION = '1.2.61';"), 'GAME_VERSION is 1.2.61');
ok(html.includes('<!-- glencraft-build: b1266-v1.2.66 -->') || html.includes('<!-- glencraft-build: b1265-v1.2.65 -->') || html.includes('<!-- glencraft-build: b1264-v1.2.64 -->') || html.includes('<!-- glencraft-build: b1263-v1.2.63 -->') || html.includes('<!-- glencraft-build: b1262-v1.2.62 -->') || html.includes('<!-- glencraft-build: b1261-v1.2.61 -->'), 'build marker b1261');
ok(credits.includes('## v1.2.61'), 'CREDITS has a v1.2.61 section');

const notesStart = html.indexOf('window.PATCH_NOTES = [');
ok(notesStart > 0, 'PATCH_NOTES present');
const head = html.slice(notesStart, notesStart + 28000);
ok(head.includes('"v":"v1.2.61"') && head.includes('"d":"2026-11-13"'), 'v1.2.61 notes are at the top, dated 2026-11-13');
ok(head.indexOf('"v":"v1.2.61"') < head.indexOf('"v":"v1.2.60"'), '1.2.61 notes sit above 1.2.60');
for (const phrase of [
  'windows are much larger',
  'six-pane',
  'fifth of its height',
  'very dark navy',
  'no longer a bright royal blue',
  'POLICE PUBLIC CALL BOX',
  'glow from inside',
  'blue roof lamp',
  'base step',
  'huge blank disc is gone',
  'roundels',
  'extra up, down, left and right pad is gone on touch',
  'left stick flies you',
  'Pistols and muskets show',
  'two-handed wrap',
  'sit lower and more centred',
  'palm facing up',
  'linen sleeve cuff',
  'pixel-polygon sculpt',
  'no longer hums twice',
  'on-screen LT button',
  'gamepad LT',
  'door leaf',
  'hitbox is the door itself',
  'giant pop star off in Settings',
  'Teleport to Pop Star is hidden',
  'stays within the Render distance',
  'chunks past that are unloaded',
  'default is a shorter 4 chunks',
  'Hard-refresh'
]) {
  ok(head.includes(phrase), 'patch notes mention: ' + phrase);
}

ok(html.includes('/* GLX-TBOX1261 (v1.2.61):'), 'TBOX1261 IIFE is in the page');
ok(html.includes('/* GLX-HANDS1261 (v1.2.61):') || (html.includes('GLX-HANDS1262') && html.includes('GLX-HANDS1260')), 'HANDS1261 IIFE is in the page (or withdrawn by 1.2.62 in favour of the original arm)');
ok(html.includes('/* GLX-TBOX1260 (v1.2.60):'), 'TBOX1260 IIFE is still in the page');
ok(html.includes('winH: 17.75'), 'windows are two 7 5/8 rows plus bars (17.75")');
ok(html.includes('baseH: 8.0'), 'plinth is a substantial 8" step');
ok(html.includes('MeshBasicMaterial') && html.includes('0x0c1018'), 'shell is MeshBasic near-black navy');
ok(html.includes('POLICE  PUBLIC  CALL  BOX') || html.includes('POLICE  PUBLIC'), 'glowing police-box sign lettering');
ok(html.includes('lamp1261') && (html.includes('0x6af0ff') || html.includes('0x9cffff')), 'blue roof lamp');
ok(html.includes('RingGeometry(holeR') && html.includes('huge blank') || html.includes('not a solid disc') || html.includes('gallery RING'), 'ceiling is a gallery ring, not a solid disc');
ok(html.includes('rotor1261') && html.includes('roundel'), 'rotor room and roundels');
ok(html.includes('__glxSingleHum') && html.includes('humOn(!!(f && f.pilot && T.inside && !window.__glxSingleHum))'), 'v130 hum is gated so the box only hums once');
ok(html.includes('isFlightPad') && html.includes("indexOf('Fwd')") && html.includes('lockHidden'), 'flight pad is hidden by label, not a brittle CSS string');
ok(!html.includes("['dU', 'dL', 'dR'].forEach") && html.includes('gold D-pad is left alone'), 'gold D-pad is not hidden');
ok(html.includes('GLX-PERF1261') && html.includes('streamRadius = function') && html.includes('capChunks') && html.includes("SET.rdist = touchMode ? 4 : 8"), 'render distance caps stream radius; phone default is 4');
ok(html.includes('skippedQs') && html.includes("sel === 'div'"), 'per-frame all-div scan is skipped during render');
ok(html.includes('GLX-POP1261') && html.includes('Disable pop star') && html.includes('settings-popSeg-1') && html.includes('SET.noPopstar') && html.includes('tpmPopstar'), 'Disable pop star setting is in the menu and gates spawn, song and teleport');
ok(html.includes('__tbox1261.lookingAtDoor') && html.includes('intersectObjects') && html.includes('leafL1261') && html.includes('hookTouchLT') && html.includes("getElementById('bPlace')"), 'door hitbox is the leaf mesh; touch LT is hooked like gamepad LT');
ok((html.includes('function buildArm') && html.includes('sleeveMesh') && html.includes('pixel-polygon')) || html.includes('GLX-HANDS1262'), 'voxel hand sculpt (or 1.2.62 original-arm restore)');
ok(html.includes('centre-to-lower-right') || html.includes('center-to-lower-right') || html.includes('cuff: [0.14, -0.305') || html.includes('forearm comes in from the bottom-right'), 'arm framing is lower and centred, cuff at the bottom');
ok(html.includes("version: '1.2.59-frame-torch'"), '1.2.59 torch freeze is still in the page');
ok(html.includes('pick:   {dx:  0.12, dy: -0.06, dz: 0.06') || html.includes('pick:   {dx:  0.12'), '1.2.59 pickaxe rightward shift is still in the page');
ok((html.includes('forceGunVisible') && html.includes('procGun') && html.includes('two-handed')) || (html.includes('GLX-HANDS1260') && html.includes('pistol') && html.includes('two = 1')), 'pistols and muskets use the two-handed wrap');
ok(html.includes('empty: 1, p761: 1, p760: 1, pick: 1'), 'NEW_FP_KINDS is still on');

ok(html.includes('/* GLX-TBOX (v1.1.55):'), 'original TBOX block is still there');
ok(html.includes('/* GLX-TBOX3 (v1.1.82):'), 'original TBOX3 flight block is still there');

console.log('all ok (' + n + ')');

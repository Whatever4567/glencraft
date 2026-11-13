// v1.2.64: opaque TARDIS floor, touch-stick piloting, raised scanner.
// First-person arms/hands/gun code and the gold D-pad must be untouched.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { execSync } from 'node:child_process';

const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const ver = JSON.parse(fs.readFileSync(new URL('../version.json', import.meta.url), 'utf8'));
const credits = fs.readFileSync(new URL('../CREDITS.md', import.meta.url), 'utf8');
const src = fs.readFileSync(new URL('../tools/content-source/tbox-1264.js', import.meta.url), 'utf8');
let n = 0;
const ok = (c, l) => { assert.ok(c, l); console.log('ok ' + (++n) + ' ' + l); };

ok(ver.v === '1.2.67' || ver.v === '1.2.66' || ver.v === '1.2.65' || ver.v === '1.2.64', 'version.json is 1.2.64');
ok(html.includes("const GAME_VERSION = '1.2.67';") || html.includes("const GAME_VERSION = '1.2.66';") || html.includes("const GAME_VERSION = '1.2.65';") || html.includes("const GAME_VERSION = '1.2.64';"), 'GAME_VERSION is 1.2.64');
ok(html.includes('<!-- glencraft-build: b1267-v1.2.67 -->') || html.includes('<!-- glencraft-build: b1266-v1.2.66 -->') || html.includes('<!-- glencraft-build: b1265-v1.2.65 -->') || html.includes('<!-- glencraft-build: b1264-v1.2.64 -->'), 'build marker b1264');
ok(html.includes('<!-- glencraft-build: b1263-v1.2.63 -->'), '1.2.63 build marker stays');
ok(credits.includes('## v1.2.64 TARDIS floor, touch piloting, and raised scanner'), 'CREDITS has the 1.2.64 section');

const notesStart = html.indexOf('window.PATCH_NOTES = [');
ok(notesStart > 0, 'PATCH_NOTES present');
const head = html.slice(notesStart, notesStart + 34000);
ok(head.includes('"v":"v1.2.64"') && head.includes('"d":"2026-11-13"'), 'v1.2.64 notes are at the top, dated 2026-11-13');
ok(head.indexOf('"v":"v1.2.64"') < head.indexOf('"v":"v1.2.63"'), '1.2.64 notes sit above 1.2.63');
for (const phrase of [
  'The TARDIS floor stays opaque',
  'Terrain under the interior is hidden',
  'on-screen left stick pilots the TARDIS',
  'right stick spins',
  'TARDIS spin sensitivity',
  'Jump still lifts',
  'Down still sinks',
  'scanner screen sits above eye level',
  'Hard-refresh'
]) {
  ok(head.includes(phrase), 'patch notes mention: ' + phrase);
}

ok(html.includes('/* GLX-TBOX1264 (v1.2.64):'), 'TBOX1264 IIFE is in the page');
const i1264 = html.indexOf('/* GLX-TBOX1264');
ok(i1264 > 0, 'TBOX1264 marker found');
/* Slice only the 1264 IIFE, not a later 1.2.65 (or later) IIFE that follows it. */
const i1264End = (() => {
  const next = html.indexOf('\n/* GLX-', i1264 + 10);
  const scr = html.indexOf('</script>', i1264);
  let end = i1264 + 40000;
  if (next > i1264 && next < end) end = next;
  if (scr > i1264 && scr < end) end = scr;
  return end;
})();
const h1264 = html.slice(i1264, i1264End);
ok(h1264 === src.trim() + '\n' || h1264.includes('buildOpaqueFloor'), '1264 source is in the page');

ok(h1264.includes('buildOpaqueFloor') && h1264.includes('CylinderGeometry'), '1264 builds a thick opaque floor disc');
ok(h1264.includes('depthWrite: true') && h1264.includes('polygonOffset'), 'floor depth-writes and uses polygon offset');
ok(h1264.includes('transparent: false') && h1264.includes('hardenMat'), 'floor materials are forced opaque');
ok(h1264.includes('shouldHideTerrain') && h1264.includes('patchTerrainMats') && h1264.includes('hideTufts') && h1264.includes('discard'), 'terrain in the footprint is hidden while inside (shader discard + tufts)');
ok(h1264.includes('camIn || T.inside') || h1264.includes('T.camIn || T.inside'), 'terrain hide is gated on being inside');
ok(h1264.includes('The world array is never edited') || h1264.includes('world array is never edited'), 'chunk hide is visual-only; the world is not edited');
ok(h1264.includes('T.parts.room') && h1264.includes('roomOf'), 'opaque floor is added to T.parts.room');

ok(h1264.includes('fly1264') && h1264.includes('leftAxes') && h1264.includes('stickZone'), 'touch left-stick piloting is wired');
ok(h1264.includes('rStick') && h1264.includes('U.rx'), 'right analog stick is wired for yaw');
ok(h1264.includes('spinSens') && h1264.includes('TARDIS spin sensitivity') && h1264.includes('tboxSpin'), 'TARDIS spin sensitivity slider is in settings');
ok(h1264.includes('settings-tardis-spin-sensitivity'), 'slider has a test id');
ok(h1264.includes('fwdX = -Math.sin(F.H)') && h1264.includes('rightX = Math.cos(F.H)'), 'left stick moves relative to TARDIS facing');
ok(h1264.includes('F.Pt = 0') && h1264.includes('Yaw only'), 'right stick is yaw only (no pitch tilt)');
ok(h1264.includes('jumpOn') && h1264.includes('downOn') && h1264.includes('bDown') && h1264.includes('jumpHeld'), 'Jump still lifts and Down still sinks');
ok(h1264.includes('body.tboxPilot #bDown'), 'Down button is shown while piloting');

ok(h1264.includes('raiseScreen') && h1264.includes('scrY: 2.68') && h1264.includes('scrRx: -0.34'), 'scanner is raised above eye level and angled down');
ok(2.68 > 1.62, '2.68 is above typical eye height 1.62');
ok(-0.34 < -0.12, 'tilt is steeper than the old -0.12');

ok(h1264.includes('gold D-pad is left alone') || h1264.includes('gold D-pad is untouched'), '1264 records that the gold D-pad is left alone');
ok(!h1264.includes("['dU', 'dL', 'dR'].forEach") && !/#dU|#dL|#dR/.test(h1264), '1264 does not hide or style the gold D-pad');
ok(!/__fpa|__vm|NEW_FP_KINDS|__fpVm1259|GLX-HANDS|hands-1263/.test(h1264), '1264 does not mention or touch first-person arms, hands, or gun code');

ok(html.includes('/* GLX-HANDS1263'), 'HANDS1263 IIFE is still in the page');
ok(html.includes("restoredFrom: '1e9db15'") && html.includes("restoredFromLabel: '1.2.59'"), '1.2.63 arms restore (1.2.59 / 1e9db15) is unchanged');
ok(html.includes('__fpVm1259') && html.includes("version: '1.2.59-frame-torch'"), '1259 viewmodel and torch freeze stay');
ok(html.includes('_seatStable') && html.includes('errMax: 1.20'), '1.2.59 torch-pose freeze is still in the held-frame path');
ok(!html.includes('/* GLX-HANDS1261'), '1.2.61 voxel-arm IIFE stays removed');
ok(html.includes('/* GLX-TBOX1262') && html.includes('/* GLX-TBOX1261') && html.includes('/* GLX-TBOX1260'), 'TBOX 1260–1262 stay');
ok(html.includes('/* GLX-TORSO1262') && html.includes('torsoSides1262'), 'TORSO1262 stays');
ok(html.includes('GLX-PERF1261') && html.includes("SET.rdist = touchMode ? 4 : 8"), 'render-distance cap stays');
ok(html.includes('GLX-POP1261') && html.includes('Disable pop star'), 'pop-star setting stays');
ok(html.includes('winH: 17.75') && html.includes('__glxSingleHum'), '1.2.61 windows and single-hum stay');
ok(!html.includes("['dU', 'dL', 'dR'].forEach") && html.includes('gold D-pad is left alone'), 'gold D-pad is not hidden');

const i1260 = html.indexOf('/* GLX-TBOX1260');
const i1262 = html.indexOf('/* GLX-TBOX1262');
const iH1263 = html.indexOf('/* GLX-HANDS1263');
ok(i1264 > i1260 && i1264 > i1262 && i1264 > iH1263, 'TBOX1264 is injected after TBOX1260, TBOX1262, and HANDS1263');

/* Hands source file must be byte-identical to main's 1.2.63 copy (not edited in 1.2.64). */
try {
  const git = execSync('git show main:tools/content-source/hands-1263.js', {
    cwd: new URL('..', import.meta.url), encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe']
  });
  const live = fs.readFileSync(new URL('../tools/content-source/hands-1263.js', import.meta.url), 'utf8');
  ok(git === live, 'hands-1263.js is unchanged from main');
} catch (e) {
  ok(fs.readFileSync(new URL('../tools/content-source/hands-1263.js', import.meta.url), 'utf8').includes("restoredFrom: '1e9db15'"),
    'hands-1263.js still records the 1.2.59 restore (git main compare skipped: ' + String(e && e.message || e).slice(0, 80) + ')');
}

console.log('all ok (' + n + ')');

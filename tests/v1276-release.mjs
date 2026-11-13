import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const credits = fs.readFileSync(path.join(root, 'CREDITS.md'), 'utf8');
const ver = JSON.parse(fs.readFileSync(path.join(root, 'version.json'), 'utf8'));
let n = 0;
function ok(cond, msg) {
  n++;
  if (!cond) { console.error('FAIL:', msg); process.exit(1); }
}

ok(ver.v === '1.2.76', 'version.json is 1.2.76');
ok(html.includes("const GAME_VERSION = '1.2.76';"), 'GAME_VERSION is 1.2.76');
ok(html.includes('<!-- glencraft-build: b1276-v1.2.76 -->'), 'build marker is present');
ok(html.includes('<!-- glencraft-build: b1275-v1.2.75 -->'), '1.2.75 marker stays');
ok(html.includes('"v":"v1.2.76"'), 'PATCH_NOTES has 1.2.76');
ok(html.includes('Map is now held in your hand'), 'patch notes: map held in hand');
ok(html.includes('Cave walls no longer go see-through; longer view distance'), 'patch notes: cave + view');
ok(credits.includes('## v1.2.76'), 'CREDITS has 1.2.76');
ok(credits.includes('Map is now held in your hand'), 'CREDITS map note');
ok(credits.includes('Cave walls no longer go see-through; longer view distance'), 'CREDITS cave note');

ok(html.includes('/* GLX-FIX1276'), 'FIX1276 IIFE is injected');
ok(html.includes('/* GLX-FIX1275 (v1.2.75):'), 'FIX1275 IIFE stays (potion path + gun skip)');
ok(!html.includes('/* GLX-FIX1274 (v1.2.74):'), 'FIX1274 IIFE stays removed');
ok(html.includes('/* GLX-FIX1273'), 'FIX1273 stays');
ok(html.includes('/* GLX-FIX1272'), 'FIX1272 stays');

// GRIP / guns / potion path unchanged from 1.2.75
ok(html.includes('    p761:   {p: [0, 0.02, 0], axis: [0, 1, 0], palm: [0, 0.058, 0.018], align: 0, errMax: 1.20},\n    pick:'), 'p761 GRIP matches 1.2.73 (no stable snapshot)');
ok(html.includes('    pick:   {p: [0, 0.02, 0], axis: [0, 1, 0], palm: [0, 0.058, 0.018], align: 0, errMax: 1.20},\n    p760:'), 'pick GRIP matches 1.2.73');
ok(html.includes('    bucket: {p: [0, 0.252, 0], axis: [1, 0, 0], palm: [0, 0.074, 0.012], align: 0, hang: 1, errMax: 1.20},'), 'bucket GRIP matches 1.2.73');
ok(html.includes("    pistol: {p: [0, -0.07, 0.05], axis: [0, -0.95, 0.30], palm: [0, 0.050, 0.018], align: 0}"), 'pistol GRIP matches 1.2.73');
ok(html.includes('applyPotionPath'), 'potion grip path is present');
ok(html.includes('POTION_GRIP_KEYS'), 'potion path keys are listed');
ok(!html.includes('function freezeToolPose'), 'the 1.2.74 pose snapshot is gone');
ok(html.includes('_bladeLock1274'), 'pick head lock is present');
ok(html.includes('function seatLiveMap'), '1275 live map seater is still present');

{
  const i = html.indexOf('GLX-FIX1276');
  const j = html.indexOf('</script>', i);
  const body = html.slice(i, j);
  ok(body.includes('function poseInPalm'), '1276 seats the map in the palm');
  ok(body.includes('holdingHand'), '1276 uses the current __fpa hand');
  ok(body.includes('__c112'), '1276 keeps the live C112 chart');
  ok(body.includes('P.yaw') || html.includes('P.yaw'), 'player heading still updates the marker');
  ok(body.includes('function isUnder'), '1276 detects being underground');
  ok(body.includes('headCovered'), '1276 tests cover to the world top');
  ok(body.includes('__caveCull'), '1276 wraps cave culling');
  ok(body.includes('buildLodChunk'), '1276 has a far LOD mesh');
  ok(body.includes('lodStepFor'), '1276 picks 2x/4x LOD by distance');
  ok(body.includes('tickAdapt') || body.includes('droppedLod'), '1276 drops the far ring if FPS dips');
  ok(body.includes('requestIdleCallback'), '1276 meshes far chunks on idle');
  ok(body.includes('applyFarPlane'), '1276 raises the far plane so vertical is not the limit');
  ok(body.includes('__rdist1276') || html.includes('window.__rdist1276'), 'adaptive rdist hook is installed');
  ok(body.includes('function isWeapon') || body.includes('isWeapon'), '1276 skips weapons');
  ok(!body.includes('H.apply = function'), '1276 does not wrap H.apply');
  ok(!body.includes('H.repose = function'), '1276 does not wrap H.repose');
  ok(!body.includes('renderer.render ='), '1276 does not wrap renderer.render');
  ok(!body.includes('alert('), '1276 does not alert');
  ok(/gold D-pad[\s\S]{0,80}left alone/.test(body), '1276 records that the D-pad is left alone');
  ok(/hands stay hidden in\s+third person/.test(body), '1276 records TP hands stay hidden');
  ok(!body.includes('POTION_GRIP_KEYS'), '1276 does not retouch the potion grip path');
}

ok(html.includes('/* GLX-HANDS1271'), 'HANDS1271 stays');
ok(html.includes('/* GLX-HANDS1270'), 'HANDS1270 stays');
ok(html.includes('/* GLX-HANDS1266'), 'HANDS1266 stays');
ok(html.includes('/* GLX-HANDS1263'), 'HANDS1263 stays');
ok(html.includes("restoredFrom: '1e9db15'"), '1263 restore stays');
ok(!html.includes('/* GLX-HANDS1261'), 'HANDS1261 stays removed');
ok(!html.includes("['dU', 'dL', 'dR'].forEach"), 'gold D-pad is not hidden');
ok(html.includes('id="dU"') || html.includes("id='dU'") || html.includes("('dU')") || html.includes('#dU'), 'D-pad #dU is still in the page');
ok(html.includes('window.__rdist1276'), '1261 rdist is hooked for the raised cap');
ok(html.includes('min="3" max="24"'), 'render-distance slider goes to 24');

console.log('PASS', n, 'checks');

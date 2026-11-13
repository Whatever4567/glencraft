import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const credits = fs.readFileSync(path.join(root, 'CREDITS.md'), 'utf8');
const ver = JSON.parse(fs.readFileSync(path.join(root, 'version.json'), 'utf8'));
let n = 0;
function ok(cond, msg) {
  n++;
  if (!cond) { console.error('FAIL:', msg); process.exit(1); }
}

ok(ver.v === '1.2.75', 'version.json is 1.2.75');
ok(html.includes("const GAME_VERSION = '1.2.75';"), 'GAME_VERSION is 1.2.75');
ok(html.includes('<!-- glencraft-build: b1275-v1.2.75 -->'), 'build marker is present');
ok(html.includes('"v":"v1.2.75"'), 'PATCH_NOTES has 1.2.75');
ok(html.includes('Guns restored to how they were in 1.2.73'), 'patch notes restore guns to 1.2.73');
ok(html.includes('sit still in your hand, on-screen'), 'patch notes mention tools on-screen');
ok(html.includes('working map'), 'patch notes mention the working map');
ok(credits.includes('## v1.2.75'), 'CREDITS has 1.2.75');
ok(credits.includes('Guns restored to how they were in 1.2.73'), 'CREDITS restores guns');

ok(html.includes('/* GLX-FIX1275'), 'FIX1275 IIFE is injected');
ok(!html.includes('/* GLX-FIX1274 (v1.2.74):'), 'FIX1274 IIFE is removed (it leaked into guns)');
ok(html.includes('/* GLX-FIX1273'), 'FIX1273 stays');
ok(html.includes('/* GLX-FIX1272'), 'FIX1272 stays');

// GRIP: 1.2.73 values (no stable snapshot on pick/bucket); pistol unchanged
ok(html.includes('    p761:   {p: [0, 0.02, 0], axis: [0, 1, 0], palm: [0, 0.058, 0.018], align: 0, errMax: 1.20},\n    pick:'), 'p761 GRIP matches 1.2.73 (no stable snapshot)');
ok(html.includes('    pick:   {p: [0, 0.02, 0], axis: [0, 1, 0], palm: [0, 0.058, 0.018], align: 0, errMax: 1.20},\n    p760:'), 'pick GRIP matches 1.2.73 (no stable snapshot)');
ok(html.includes('    bucket: {p: [0, 0.252, 0], axis: [1, 0, 0], palm: [0, 0.074, 0.012], align: 0, hang: 1, errMax: 1.20},'), 'bucket GRIP matches 1.2.73 (no stable snapshot)');
ok(html.includes("    pistol: {p: [0, -0.07, 0.05], axis: [0, -0.95, 0.30], palm: [0, 0.050, 0.018], align: 0}"), 'pistol GRIP matches 1.2.73');
ok(html.includes('torch:') && html.includes('stable: 1'), 'torch GRIP still has its pre-1.2.74 stable flag in the table (IIFE takes it off seatItem)');

// potion path + no snapshot
ok(html.includes('applyPotionPath'), 'potion grip path is present');
ok(html.includes('POTION_GRIP_KEYS'), 'potion path keys are listed');
ok(!html.includes('function freezeToolPose'), 'the 1.2.74 pose snapshot is gone');

// blade + map kept
ok(html.includes('_bladeLock1274'), 'pick head lock is present');
ok(html.includes('function seatLiveMap'), 'live map seater is present');
ok(html.includes('__c112'), 'C112 live chart is reused');
ok(html.includes('P.yaw'), 'player heading updates the marker');

// gun isolation
{
  const i = html.indexOf('GLX-FIX1275');
  const j = html.indexOf('</script>', i);
  const body = html.slice(i, j);
  ok(body.includes('function isWeapon'), '1275 excludes weapons explicitly');
  ok((body.includes('IT.PISTOL') || body.includes('IT_.PISTOL')) && (body.includes('IT.MUSKET') || body.includes('IT_.MUSKET')), '1275 names pistol and musket');
  ok(body.includes('GUN'), '1275 excludes the GUN table');
  ok(body.includes('gun-skip'), '1275 records when it skips a gun');
  ok(!body.includes('H.apply = function'), '1275 does not wrap H.apply');
  ok(!body.includes('H.repose = function'), '1275 does not wrap H.repose');
  ok(!body.includes('renderer.render ='), '1275 does not wrap renderer.render');
  ok(!body.includes('alert('), '1275 does not alert');
  ok(/First-person hands stay hidden in\s+third person/.test(body), '1275 records TP hands stay hidden');
  ok(/gold D-pad[\s\S]{0,40}left alone/.test(body), '1275 records that the D-pad is left alone');
}

// hands / D-pad
ok(html.includes('/* GLX-HANDS1271'), 'HANDS1271 stays');
ok(html.includes('/* GLX-HANDS1270'), 'HANDS1270 stays');
ok(html.includes('/* GLX-HANDS1266'), 'HANDS1266 stays');
ok(html.includes('/* GLX-HANDS1263'), 'HANDS1263 stays');
ok(html.includes("restoredFrom: '1e9db15'"), '1263 restore stays');
ok(!html.includes('/* GLX-HANDS1261'), 'HANDS1261 stays removed');
ok(!html.includes("['dU', 'dL', 'dR'].forEach"), 'gold D-pad is not hidden');
ok(html.includes('id="dU"') || html.includes("id='dU'") || html.includes("('dU')") || html.includes('#dU'), 'D-pad #dU is still in the page');

// Gun code paths vs 1.2.73 (ignore version, notes, IIFE at the end, GRIP tool lines already checked)
try {
  const grip73 = `    pistol: {p: [0, -0.07, 0.05], axis: [0, -0.95, 0.30], palm: [0, 0.050, 0.018], align: 0}`;
  ok(html.includes(grip73), 'pistol GRIP is byte-identical to 1.2.73');
  // magFix / musket ADS / fake mag from 1.2.73 still present
  ok(html.includes('GLX-FIX1273'), '1.2.73 gun fixes stay');
  ok(html.includes('u.mag = isP ? part(/magazine_loaded$/) : new THREE.Group()') ||
     html.includes('isP ? part(/magazine_loaded$/) : new THREE.Group()'), 'musket fake-mag fix from 1.2.73 stays');
} catch (e) {
  ok(false, 'gun-path check: ' + e.message);
}

console.log('PASS ' + n + ' v1275-release checks');

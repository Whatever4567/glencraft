import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {execSync} from 'child_process';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const credits = fs.readFileSync(path.join(root, 'CREDITS.md'), 'utf8');
const ver = JSON.parse(fs.readFileSync(path.join(root, 'version.json'), 'utf8'));
const src = fs.readFileSync(path.join(root, 'tools/content-source/fix-1277.js'), 'utf8');
let n = 0;
function ok(cond, msg) {
  n++;
  if (!cond) { console.error('FAIL:', msg); process.exit(1); }
}

ok(ver.v === '1.2.77', 'version.json is 1.2.77');
ok(html.includes("const GAME_VERSION = '1.2.77';"), 'GAME_VERSION is 1.2.77');
ok(html.includes('<!-- glencraft-build: b1277-v1.2.77 -->'), 'build marker is present');
ok(html.includes('<!-- glencraft-build: b1276-v1.2.76 -->'), '1.2.76 marker stays');
ok(html.includes('<!-- glencraft-build: b1275-v1.2.75 -->'), '1.2.75 marker stays');
ok(html.includes('"v":"v1.2.77"'), 'PATCH_NOTES has 1.2.77');
ok(html.includes('Reverted 1.2.76 cave/view-distance changes (lag)'), 'patch notes: revert cave/view-distance');
ok(credits.includes('## v1.2.77'), 'CREDITS has 1.2.77');
ok(credits.includes('Reverted 1.2.76 cave/view-distance changes (lag)'), 'CREDITS revert note');

ok(html.includes('/* GLX-FIX1277 (v1.2.77):'), 'FIX1277 banner is injected');
ok(html.includes('/* GLX-FIX1276 (v1.2.76):'), 'FIX1276 map IIFE stays (map work only)');
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

/* Map work from 1.2.76 is kept. */
{
  const i = html.indexOf('GLX-FIX1276');
  const j = html.indexOf('</script>', i);
  const body = html.slice(i, j);
  ok(body.includes('function poseInPalm'), '1276 seats the map in the palm (kept)');
  ok(body.includes('holdingHand'), '1276 uses the current __fpa hand (kept)');
  ok(body.includes('__c112'), '1276 keeps the live C112 chart');
  ok(body.includes('function tickMap'), '1276 map tick is kept');
  ok(body.includes('function isWeapon') || body.includes('isWeapon'), 'map path still skips weapons');
  ok(!body.includes('function buildLodChunk'), 'LOD is gone from the 1276 IIFE');
  ok(!body.includes('function installCaveFix'), 'cave-cull wrap is gone');
  ok(!body.includes('function wrapBuildChunk'), 'buildChunk wrap is gone');
  ok(!body.includes('function idlePump'), 'idle far-chunk pump is gone');
  ok(!body.includes('function tickAdapt'), 'adaptive rdist is gone');
  ok(!body.includes('function applyFarPlane'), 'far-plane hook is gone');
  ok(!body.includes('function raiseDefault'), 'raised rdist defaults are gone');
  ok(!body.includes('function isUnder'), 'isUnder is gone');
  ok(!body.includes('function headCovered'), 'headCovered is gone');
  ok(!body.includes('function remeshCulledCaves'), 'cave remesh is gone');
  ok(!body.includes('function bootTerrain'), 'bootTerrain is gone');
  ok(!body.includes('__rdist1276'), 'no __rdist1276 in the IIFE');
  ok(!body.includes('H.apply = function'), 'does not wrap H.apply');
  ok(!body.includes('H.repose = function'), 'does not wrap H.repose');
  ok(!body.includes('renderer.render ='), 'does not wrap renderer.render');
  ok(!body.includes('alert('), 'does not alert');
  ok(!body.includes('POTION_GRIP_KEYS'), 'does not retouch the potion grip path');
  ok(/gold D-pad/.test(body) && /left alone/.test(body), 'records that the D-pad is left alone');
  ok(/hands stay hidden in\s+third person/.test(body), 'records TP hands stay hidden');
}

/* 1.2.77 source file itself is map-only + revert note. */
ok(src.includes('Reverted 1.2.76 cave/view-distance changes (lag)'), 'source records the revert');
ok(src.includes('function poseInPalm'), 'source keeps map seating');
ok(!src.includes('function buildLodChunk'), 'source has no LOD');
ok(!src.includes('function bootTerrain'), 'source has no bootTerrain');
ok(!src.includes('__rdist1276'), 'source has no rdist hook');

/* Render / chunk / view-distance code matches 1.2.75 exactly. */
ok(html.includes('const VF = () => clamp(SET.rdist, 3, 16) * 16;'), 'VF clamp is 16 (1.2.75)');
ok(html.includes('id="rdRange" data-testid="settings-rdist" min="3" max="16"'), 'slider max is 16 (1.2.75)');
ok(html.includes('const setV = v => { SET.rdist = clamp(Math.round(v), 3, 16); saveSet(); sync(); };'), 'setV clamp is 16 (1.2.75)');
ok(html.includes('      else n = isTouch() ? 4 : 8;'), '1261 default is 4/8 (1.2.75)');
ok(html.includes('    return Math.max(3, Math.min(16, n));'), '1261 cap is 16 (1.2.75)');
ok(!html.includes('window.__rdist1276'), 'no __rdist1276 hook');
ok(!html.includes('__rdist1276'), 'no __rdist1276 at all');
ok(!html.includes('min="3" max="24"'), 'slider does not go to 24');
ok(!html.includes('isTouch() ? 8 : 12'), 'raised 8/12 default is gone');
ok(html.includes("if (typeof SET.rdist !== 'number') SET.rdist = touchMode ? 4 : 8;"), 'unset rdist default is 4/8');

{
  const html75 = execSync('git show c40f347:index.html', {cwd: root, encoding: 'utf8', maxBuffer: 80 * 1024 * 1024});
  const needles = [
    'const VF = () => clamp(SET.rdist, 3, 16) * 16;',
    'id="rdRange" data-testid="settings-rdist" min="3" max="16"',
    'const setV = v => { SET.rdist = clamp(Math.round(v), 3, 16); saveSet(); sync(); };',
    '      else n = isTouch() ? 4 : 8;\n    } catch (_) { n = 8; }\n    return Math.max(3, Math.min(16, n));',
    "if (typeof SET.rdist !== 'number') SET.rdist = touchMode ? 4 : 8;",
  ];
  for (const s of needles) {
    ok(html75.includes(s), '1.2.75 has: ' + s.slice(0, 60));
    ok(html.includes(s), '1.2.77 matches 1.2.75: ' + s.slice(0, 60));
  }

  /* Broader: C70 render-distance function and PERF1261 rdist() must
     match 1.2.75 on those exact blocks (no leftover 1.2.76 edits). */
  function block(s, start, endMark) {
    const i = s.indexOf(start);
    ok(i >= 0, 'block start present: ' + start.slice(0, 50));
    const j = s.indexOf(endMark, i);
    ok(j > i, 'block end present after ' + start.slice(0, 40));
    return s.slice(i, j);
  }
  const c70_75 = block(html75, '(function c70() {', 'const rg = row.querySelector(\'#rdRange\')');
  const c70_77 = block(html, '(function c70() {', 'const rg = row.querySelector(\'#rdRange\')');
  ok(c70_75 === c70_77, 'C70 render-distance preamble matches 1.2.75 byte-for-byte');

  const r75 = block(html75, '  const rdist = () => {', '  /* UI unit is "chunks" of 16 blocks');
  const r77 = block(html, '  const rdist = () => {', '  /* UI unit is "chunks" of 16 blocks');
  ok(r75 === r77, 'PERF1261 rdist() matches 1.2.75 byte-for-byte');
}

/* No 1.2.76 cave leftovers anywhere in the page. */
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
  'function relodRing',
  'function lodStepFor',
  'function rdist1276',
  'buildChunk._p1276',
];
for (const k of forbidden) {
  ok(!html.includes(k), 'no leftover: ' + k);
}

ok(html.includes('/* GLX-HANDS1271'), 'HANDS1271 stays');
ok(html.includes('/* GLX-HANDS1270'), 'HANDS1270 stays');
ok(html.includes('/* GLX-HANDS1266'), 'HANDS1266 stays');
ok(html.includes('/* GLX-HANDS1263'), 'HANDS1263 stays');
ok(html.includes("restoredFrom: '1e9db15'"), '1263 restore stays');
ok(!html.includes('/* GLX-HANDS1261'), 'HANDS1261 stays removed');
ok(!html.includes("['dU', 'dL', 'dR'].forEach"), 'gold D-pad is not hidden');
ok(html.includes('id="dU"') || html.includes("id='dU'") || html.includes("('dU')") || html.includes('#dU'), 'D-pad #dU is still in the page');

console.log('PASS', n, 'checks');

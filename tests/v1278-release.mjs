import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {execSync} from 'child_process';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const credits = fs.readFileSync(path.join(root, 'CREDITS.md'), 'utf8');
const ver = JSON.parse(fs.readFileSync(path.join(root, 'version.json'), 'utf8'));
const src = fs.readFileSync(path.join(root, 'tools/content-source/fix-1278.js'), 'utf8');
let n = 0;
function ok(cond, msg) {
  n++;
  if (!cond) { console.error('FAIL:', msg); process.exit(1); }
}

ok(ver.v === '1.2.78', 'version.json is 1.2.78');
ok(html.includes("const GAME_VERSION = '1.2.78';"), 'GAME_VERSION is 1.2.78');
ok(html.includes('<!-- glencraft-build: b1278-v1.2.78 -->'), 'build marker is present');
ok(html.includes('<!-- glencraft-build: b1277-v1.2.77 -->'), '1.2.77 marker stays');
ok(html.includes('<!-- glencraft-build: b1276-v1.2.76 -->'), '1.2.76 marker stays');
ok(html.includes('<!-- glencraft-build: b1275-v1.2.75 -->'), '1.2.75 marker stays');
ok(html.includes('"v":"v1.2.78"'), 'PATCH_NOTES has 1.2.78');
ok(html.includes('Less lag: rain, drops, animations and mobs only run near you'), 'patch notes: lag');
ok(html.includes('Ores get more common the deeper you go; diamonds common near y -200'), 'patch notes: ores');
ok(html.includes('Removed obsidian/gold portal blocks from deep caves'), 'patch notes: portals');
ok(!/1\.2\.78[\s\S]{0,400}Map now gripped/.test(html), 'map-grip note is not in 1.2.78 (grip left out)');
ok(credits.includes('## v1.2.78'), 'CREDITS has 1.2.78');
ok(credits.includes('Less lag: rain, drops, animations and mobs only run near you'), 'CREDITS lag note');
ok(credits.includes('Ores get more common the deeper you go; diamonds common near y -200'), 'CREDITS ore note');
ok(credits.includes('Removed obsidian/gold portal blocks from deep caves'), 'CREDITS portal note');

ok(html.includes('/* GLX-FIX1278 (v1.2.78):'), 'FIX1278 banner is injected');
ok(html.includes('/* GLX-FIX1277 (v1.2.77):'), 'FIX1277 stays');
ok(html.includes('/* GLX-FIX1276 (v1.2.76):'), 'FIX1276 map IIFE stays');
ok(html.includes('/* GLX-FIX1275 (v1.2.75):'), 'FIX1275 IIFE stays');
ok(!html.includes('/* GLX-FIX1274 (v1.2.74):'), 'FIX1274 IIFE stays removed');
ok(html.includes('/* GLX-FIX1273'), 'FIX1273 stays');
ok(html.includes('/* GLX-FIX1272'), 'FIX1272 stays');

/* Named constants. */
ok(src.includes('const SPAWN_RADIUS = 100'), 'source SPAWN_RADIUS=100');
ok(src.includes('const DESPAWN_RADIUS = 150'), 'source DESPAWN_RADIUS=150');
ok(src.includes('const ORE_DEPTH_MIN = 0'), 'source ORE_DEPTH_MIN=0');
ok(src.includes('const ORE_DEPTH_MAX = -236'), 'source ORE_DEPTH_MAX=-236');
ok(src.includes('const DIAMOND_PEAK_Y = -200'), 'source DIAMOND_PEAK_Y=-200');
ok(html.includes('const SPAWN_RADIUS = 100'), 'page SPAWN_RADIUS=100');
ok(html.includes('const DESPAWN_RADIUS = 150'), 'page DESPAWN_RADIUS=150');
ok(html.includes('const ORE_DEPTH_MIN = 0'), 'page ORE_DEPTH_MIN=0');
ok(html.includes('const ORE_DEPTH_MAX = -236'), 'page ORE_DEPTH_MAX=-236');
ok(html.includes('const DIAMOND_PEAK_Y = -200'), 'page DIAMOND_PEAK_Y=-200');

/* 1278 IIFE body: lag, ores, portals; no meshing / guns / map pinch. */
{
  const i = html.indexOf('GLX-FIX1278');
  const j = html.indexOf('</script>', i);
  ok(i >= 0 && j > i, '1278 IIFE bounds');
  const body = html.slice(i, j);
  ok(body.includes('SPAWN_RADIUS'), 'IIFE has spawn radius');
  ok(body.includes('DESPAWN_RADIUS'), 'IIFE has despawn radius');
  ok(body.includes('hellSpawn'), 'IIFE gates Nether spawns');
  ok(body.includes('hellPopulate'), 'IIFE gates Nether populate');
  ok(body.includes('clansman'), 'IIFE covers clansmen');
  ok(body.includes('agsun') || body.includes('agartha'), 'IIFE covers Agartha people');
  ok(body.includes('__c259') || /egypt/i.test(body), 'IIFE covers Egyptian people');
  ok(body.includes('updateRain'), 'IIFE wraps rain');
  ok(body.includes('updateDrops'), 'IIFE wraps drops');
  ok(body.includes('updateMobs'), 'IIFE wraps mob ticks / animations');
  ok(body.includes('maybeOre') && body.includes('diamondAmt'), 'IIFE has ore depth rates');
  ok(body.includes('stripPortalGen') || body.includes('isPortalFluid'), 'IIFE strips deep-cave portals');
  ok(body.includes('773'), 'IIFE knows the gold-portal / ABY id');
  ok(body.includes('scrubNear'), 'IIFE scrubs leftover frames on chunk approach');
  ok(!body.includes('H.apply = function'), 'does not wrap H.apply');
  ok(!body.includes('H.repose = function'), 'does not wrap H.repose');
  ok(!body.includes('renderer.render ='), 'does not wrap renderer.render');
  ok(!body.includes('function wrapBuildChunk'), 'does not wrap buildChunk');
  ok(!body.includes('__rdist1276'), 'no __rdist1276');
  ok(!body.includes('function buildLodChunk'), 'no LOD');
  ok(!body.includes('function applyFarPlane'), 'no far-plane hook');
  ok(!body.includes('function raiseDefault'), 'no raised rdist');
  ok(!body.includes('function poseInPalm'), 'does not retouch the map grip');
  ok(!body.includes('function freezeToolPose'), 'does not retouch tool poses');
  ok(!body.includes("['dU', 'dL', 'dR'].forEach"), 'does not touch the gold D-pad');
  ok(/gold D-pad/.test(body) && /left alone/.test(body), 'records that the D-pad is left alone');
  ok(/hands stay hidden in\s+third person/.test(body), 'records TP hands stay hidden');
  ok(/pinch grip is not in this build/.test(body), 'records map pinch was left out');
}

/* GRIP / guns / potion path unchanged from 1.2.75 */
ok(html.includes('    p761:   {p: [0, 0.02, 0], axis: [0, 1, 0], palm: [0, 0.058, 0.018], align: 0, errMax: 1.20},\n    pick:'), 'p761 GRIP matches 1.2.73');
ok(html.includes('    pick:   {p: [0, 0.02, 0], axis: [0, 1, 0], palm: [0, 0.058, 0.018], align: 0, errMax: 1.20},\n    p760:'), 'pick GRIP matches 1.2.73');
ok(html.includes('    bucket: {p: [0, 0.252, 0], axis: [1, 0, 0], palm: [0, 0.074, 0.012], align: 0, hang: 1, errMax: 1.20},'), 'bucket GRIP matches 1.2.73');
ok(html.includes("    pistol: {p: [0, -0.07, 0.05], axis: [0, -0.95, 0.30], palm: [0, 0.050, 0.018], align: 0}"), 'pistol GRIP matches 1.2.73');
ok(html.includes('applyPotionPath'), 'potion grip path is present');
ok(html.includes('POTION_GRIP_KEYS'), 'potion path keys are listed');
ok(!html.includes('function freezeToolPose'), 'the 1.2.74 pose snapshot is gone');
ok(html.includes('_bladeLock1274'), 'pick head lock is present');
ok(html.includes('function seatLiveMap'), '1275 live map seater is still present');
ok(html.includes('function poseInPalm'), '1276/77 map seating stayed');

/* source file itself */
ok(src.includes('Less lag: rain, drops, animations and mobs only run near you'), 'source lag note');
ok(src.includes('Removed obsidian/gold portal blocks from deep caves'), 'source portal note');
ok(!src.includes('H.apply = function'), 'source does not wrap H.apply');
ok(!src.includes('renderer.render ='), 'source does not wrap renderer.render');
ok(!src.includes('function poseInPalm'), 'source leaves the map grip alone');
ok(!src.includes('function wrapBuildChunk'), 'source does not wrap buildChunk');
ok(!src.includes('__rdist1276'), 'source has no rdist hook');

/* 1.2.75 render / chunk lines must still match byte-for-byte. */
{
  const html75 = execSync('git show c40f347:index.html', {cwd: root, encoding: 'utf8', maxBuffer: 80 * 1024 * 1024});
  const vf75 = "const VF = () => clamp(SET.rdist, 3, 16) * 16;";
  ok(html.includes(vf75) && html75.includes(vf75), 'VF line matches 1.2.75');
  const slider75 = 'id="rdRange" data-testid="settings-rdist" min="3" max="16"';
  ok(html.includes(slider75) && html75.includes(slider75), 'slider line matches 1.2.75');
  const setv75 = 'const setV = v => { SET.rdist = clamp(Math.round(v), 3, 16); saveSet(); sync(); };';
  ok(html.includes(setv75) && html75.includes(setv75), 'setV line matches 1.2.75');
  const rdist75 = '      else n = isTouch() ? 4 : 8;\n    } catch (_) { n = 8; }\n    return Math.max(3, Math.min(16, n));';
  ok(html.includes(rdist75) && html75.includes(rdist75), '1261 rdist block matches 1.2.75');
  const def75 = "if (typeof SET.rdist !== 'number') SET.rdist = touchMode ? 4 : 8;";
  ok(html.includes(def75) && html75.includes(def75), 'SET.rdist default matches 1.2.75');
}

/* Forbidden 1.2.76 leftovers stay gone. */
for (const k of [
  'function buildLodChunk', 'function installCaveFix', 'function wrapBuildChunk',
  'function idlePump', 'function tickAdapt', 'function applyFarPlane',
  'function raiseDefault', 'function remeshCulledCaves', 'function bootTerrain',
  '__rdist1276', 'buildChunk._p1276'
]) {
  ok(!html.includes(k), 'forbidden leftover gone: ' + k);
}


/* PATCH_NOTES must be valid JS (commas between entries) or the 1278 IIFE never runs. */
{
  const start = html.indexOf('window.PATCH_NOTES = [');
  const end = html.indexOf('\n];', start);
  ok(start >= 0 && end > start, 'PATCH_NOTES array found');
  const arr = html.slice(start, end + 2); /* up to closing ] , no semicolon */
  ok(!/\}\n\{/.test(arr), 'PATCH_NOTES entries are comma-separated');
  ok(arr.includes('v1.2.78'), 'array includes 1.2.78');
  let parsed = null;
  try {
    parsed = Function('return (' + arr.slice(arr.indexOf('[')) + ')')();
  } catch (e) {
    ok(false, 'PATCH_NOTES does not parse: ' + e.message);
  }
  ok(Array.isArray(parsed) && parsed[0] && parsed[0].v === 'v1.2.78', 'PATCH_NOTES parses and starts at 1.2.78');
  ok(parsed[0].notes.length === 3, '1.2.78 has three notes');
}

/* Ore formula unit checks (pure, no DOM). */
{
  const depthMult = (y) => {
    if (y > 0 || y < -236) return 1;
    const t = (0 - y) / (0 - (-236));
    return 1 + 3 * Math.max(0, Math.min(1, t));
  };
  const diamondAmt = (y) => {
    if (y > -150 || y < -236) return 0;
    if (y <= -200) return 1;
    return (-150 - y) / (-150 - (-200));
  };
  ok(Math.abs(depthMult(0) - 1) < 1e-9, 'depthMult 1x at y 0');
  ok(Math.abs(depthMult(-236) - 4) < 1e-9, 'depthMult 4x at y -236');
  ok(depthMult(-118) > 2 && depthMult(-118) < 3, 'depthMult mid is between 2x and 3x');
  ok(diamondAmt(-149) === 0, 'diamonds do not ramp above -150');
  ok(Math.abs(diamondAmt(-150)) < 1e-9, 'diamond ramp starts at -150');
  ok(Math.abs(diamondAmt(-200) - 1) < 1e-9, 'diamond peak at -200');
  ok(diamondAmt(-220) === 1 && diamondAmt(-236) === 1, 'diamond peak holds to -236');
  ok(diamondAmt(-175) > 0.4 && diamondAmt(-175) < 0.6, 'diamond mid-ramp around -175');
}

console.log('v1278-release:', n, 'checks passed');

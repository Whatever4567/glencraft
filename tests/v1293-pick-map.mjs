// Held-map visibility (FIX1293 remnant): the live sheet stays on-screen.
// 1.2.95 pick re-seat and 1285 curl mutations are reverted so fingers
// and the pickaxe pose match 1.2.94.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const src = fs.readFileSync(path.join(root, 'tools/content-source/fix-1293-pick-map.js'), 'utf8');
let n = 0, fails = 0;
const ok = (c, m) => { console.log((c ? 'ok   ' : 'FAIL ') + m); if (!c) fails++; else n++; };

ok(html.includes('/* GLX-FIX1293') && html.includes('window.__pickMap1293'), 'fix-1293 is inlined');
ok(html.includes(src.trim()), 'inlined IIFE matches tools/content-source/fix-1293-pick-map.js');
ok(src.includes('function seatMap') && src.includes('sheetInView'), 'map is re-seated and tested for on-screen visibility');
ok(src.includes('C.g') && (src.includes('C.g.visible = false') || src.includes('HUD')), 'C.g HUD overlay is still hidden');
ok(src.includes('No geometry is deleted') || src.includes('no geometry is deleted'), 'geometry is not deleted');
ok(!src.includes('__fpa.rig =') && !src.includes('__handsFp1285 ='), 'does not replace the __fpa rig or the 1.2.85 gloves');
ok(!/worldgen|generateWorld|carveCaves|spawnStructure/.test(src), 'does not touch worldgen');
ok(!src.includes('tightenMapCurl') && !src.includes('POSES.map') && !src.includes('MAP_CURL'),
  'does not mutate the 1285 pose table or tighten finger curls');
ok(!src.includes('applyPickRest') && !src.includes('SHAFT_CAM') && !src.includes('FRAME_PICK') && !src.includes('containPickRig') && !src.includes('nudgeGloveCam') && !src.includes('nudgeMapHand'),
  'does not re-seat the pick or move the glove');
ok(src.includes('mapStash1275') && src.includes('unstash'), 'live sheet is taken back from the 1275 stash when the map is held');
ok(html.includes('/* GLX-SCULPT1281') && html.includes('window.__sculpt1281'), '1281 pick path is still present');
ok(html.includes('/* GLX-FIX1279') && html.includes('window.__fix1279'), '1279 map path is still present');
ok(html.includes('/* GLX-HANDSFP1285') && html.includes('window.__handsFp1285'), '1.2.85 FP gloves are still present');
ok(html.includes('handle1249') && html.includes('GLX-PAD1292'), 'original haft tagging and the 1.2.92 pad fix remain');

const dumpDirs = [
  process.env.DUMP_DIR,
  '/workspace/qa/t1272/after'
].filter(Boolean);

function readDump(dir, name) {
  const p = path.join(dir, name);
  return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf8')) : null;
}

for (const dir of dumpDirs) {
  if (!fs.existsSync(dir)) continue;
  const map = readDump(dir, 'dump-map-held-landscape.json') || readDump(dir, 'dump-map-held.json');
  const measMap = map && map.measure1293;
  if (!map) continue;
  if (measMap) {
    ok(!!measMap.sheetVis, 'after: map sheet is visible');
    ok(!!measMap.sheetInView, 'after: map sheet is inside the view frustum');
    ok(measMap.faceDot == null || measMap.faceDot > 0.6, 'after: map face points at the camera (dot=' + measMap.faceDot + ')');
  } else if (map.c112 && map.c112.sheet) {
    const sh = map.c112.sheet;
    ok(!!sh.vis, 'after: c112 sheet is visible');
    ok(!!sh.inFront && sh.cam && sh.cam[2] < -0.2, 'after: sheet is in front of the camera');
  } else {
    ok(false, 'after map dump is missing the sheet / measure1293');
  }
  break;
}

ok(src.includes('U.measure = measure'), 'runtime measure() is exported for capture / debug');

if (fails) { console.log(fails + ' failing'); process.exit(1); }
console.log('v1293-pick-map ok', n);

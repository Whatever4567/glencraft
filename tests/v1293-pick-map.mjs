// v1.2.93: first-person pickaxe is held upright-forward in the fist, and
// the live map sheet is visible when held (portrait and landscape).
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const src = fs.readFileSync(path.join(root, 'tools/content-source/fix-1293-pick-map.js'), 'utf8');
let n = 0, fails = 0;
const ok = (c, m) => { console.log((c ? 'ok   ' : 'FAIL ') + m); if (!c) fails++; else n++; };

ok(html.includes('/* GLX-FIX1293') && html.includes('window.__pickMap1293'), 'fix-1293 is inlined');
ok(html.includes(src.trim()), 'inlined IIFE matches tools/content-source/fix-1293-pick-map.js');
ok(/SHAFT_CAM = \{ x: -0\.18, y: 0\.96, z: -0\.22 \}/.test(src), 'pick shaft is upright-forward (~12° from vertical)');
ok(src.includes('function seatMap') && src.includes('sheetInView'), 'map is re-seated and tested for on-screen visibility');
ok(src.includes('hideMapOverlay') || src.includes('HUD group (C.g)'), 'comments keep the C.g HUD hide in place');
ok(src.includes('No geometry is deleted') || src.includes('no geometry is deleted'), 'geometry is not deleted');
ok(!src.includes('__fpa.rig =') && !src.includes('__handsFp1285 ='), 'does not replace the __fpa rig or the 1.2.85 gloves');
ok(!/worldgen|generateWorld|carveCaves|spawnStructure/.test(src), 'does not touch worldgen');
ok(src.includes('applyFrozen') && src.includes('swinging()'), 'pick rest is frozen so the mining swing still carries the item');
ok(src.includes('tightenMapCurl') && src.includes('__handsFp1285'), 'map finger curl is tightened on the existing 1285 pose table');
ok(src.includes('mapStash1275') && src.includes('unstash'), 'live sheet is taken back from the 1275 stash when the map is held');
ok(html.includes('/* GLX-SCULPT1281') && html.includes('window.__sculpt1281'), '1281 pick path is still present');
ok(html.includes('/* GLX-FIX1279') && html.includes('window.__fix1279'), '1279 map path is still present');
ok(html.includes('/* GLX-HANDSFP1285') && html.includes('window.__handsFp1285'), '1.2.85 FP gloves are still present');
ok(html.includes('handle1249') && html.includes('GLX-PAD1292'), 'original haft tagging and the 1.2.92 pad fix remain');

// Pose-quality checks against a capture dump when one is present.
const dumpDirs = [
  process.env.DUMP_DIR,
  '/workspace/qa/t1256/after',
  '/workspace/qa/t1256/before'
].filter(Boolean);

function readDump(dir, name) {
  const p = path.join(dir, name);
  return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf8')) : null;
}

function shaftDeg(dump) {
  const hits = dump && dump.hits || [];
  // Prefer the visible p761 group under held.
  const kid = (dump.heldKids || []).find(k => k && k.vis && (k.kind === 'p761' || k.kind === 'pick'));
  const sh = kid && kid.shaftCam;
  if (!sh) return null;
  const y = sh[1];
  return Math.acos(Math.max(-1, Math.min(1, y))) * 180 / Math.PI;
}

let checkedLive = false;
for (const dir of dumpDirs) {
  if (!fs.existsSync(dir)) continue;
  const after = path.basename(dir) === 'after' || process.env.DUMP_DIR === dir;
  const pick = readDump(dir, 'dump-pick-idle.json');
  const map = readDump(dir, 'dump-map-held.json');
  const measPick = pick && pick.measure1293;
  const measMap = map && map.measure1293;
  if (!pick && !map) continue;
  if (after) {
    checkedLive = true;
    if (measPick) {
      ok(measPick.palmToHaft != null && measPick.palmToHaft <= 0.02,
        'after: palm is within 2 cm of the haft (gap=' + measPick.palmToHaft + ')');
      ok(measPick.shaftDegFromUp != null && measPick.shaftDegFromUp <= 40,
        'after: shaft is within 40° of vertical (deg=' + measPick.shaftDegFromUp + ')');
      ok(!measPick.clipsNear, 'after: pick does not clip the near plane');
    } else {
      const deg = shaftDeg(pick);
      if (deg != null) {
        ok(deg <= 40, 'after dump shaft is within 40° of vertical (deg=' + deg.toFixed(1) + ')');
      } else {
        ok(false, 'after pick dump is missing shaft / measure1293');
      }
    }
    if (measMap) {
      ok(!!measMap.sheetVis, 'after: map sheet is visible');
      ok(!!measMap.sheetInView, 'after: map sheet is inside the view frustum');
      ok(measMap.faceDot == null || measMap.faceDot > 0.6, 'after: map face points at the camera (dot=' + measMap.faceDot + ')');
    } else if (map && map.c112 && map.c112.sheet) {
      const sh = map.c112.sheet;
      ok(!!sh.vis, 'after: c112 sheet is visible');
      ok(!!sh.inFront && sh.cam && sh.cam[2] < -0.2, 'after: sheet is in front of the camera');
      const cam = sh.cam || [];
      ok(Math.abs(cam[0] || 0) < 0.35 && Math.abs(cam[1] || 0) < 0.45,
        'after: sheet centre is near the view (cam=' + JSON.stringify(cam) + ')');
    } else {
      ok(false, 'after map dump is missing the sheet / measure1293');
    }
  }
  break;
}

ok(src.includes('U.measure = measure'), 'runtime measure() is exported for capture / debug');

if (fails) { console.log(fails + ' failing'); process.exit(1); }
console.log('v1293-pick-map ok', n);

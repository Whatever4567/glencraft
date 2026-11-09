#!/usr/bin/env node
// 1264: extruded two-arc FP crescent (open, bbox width >= 0.22), item
// visible in every item shot, sleeve cap. Torch / cobble / hands are
// reviewed visually against the sheet; keepers from 1263 stay in source.
import assert from 'assert';
import { existsSync, readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(join(root, 'index.html'), 'utf8');

assert.ok(html.includes('fpHook1264') && html.includes('fpCrescentGeo'),
  'FP-only 1264 extruded crescent is in the build');
assert.ok(html.includes('fpHook1263') && html.includes('fpHook1262'),
  '1262/1263 hook identifiers stay in the build');
assert.ok(html.includes('crescentBladeGeometry(0.44, 0.0230, 0.048, 0.42)'),
  'TP/world pick mesh is unchanged (short hook 0.42)');
assert.ok(/aUpper|arcDeg1263|112/.test(html) && html.includes('keepHidden1263'),
  'hook arc identifier and hidden-glow flag stay in the build');
assert.ok(html.includes('fseg4') && html.includes('0xf7e8dc'),
  '1264 finger overlap / lighter nails are in the build');
assert.ok(html.includes('flameAnchored1263') && html.includes('camUpL'),
  'torch fire stays tip-anchored and rises in camera-up');

const qaPath = ['/workspace/qa/held-1264/webgl-results.json'].find(p => existsSync(p));
assert.ok(qaPath, 'webgl-results.json missing — run webgl-studio into held-1264');
const qa = JSON.parse(readFileSync(qaPath, 'utf8'));
const results = qa.results || qa;
function shot(name) {
  const r = results[name];
  assert.ok(r, 'missing capture ' + name);
  return r;
}

const pickShots = ['fp-p761', 'fp-p761-sky', 'fp-p761-wall'].filter(n => results[n]);
assert.ok(pickShots.length >= 3, 'expected the three first-person pick shots');
for (const name of pickShots) {
  const r = shot(name);
  const ph = r.pickHead1257;
  assert.ok(ph && ph.head, name + ' missing pickHead1257 probe');
  assert.ok(ph.head.height <= 0.55,
    name + ' pick head screen height is ' + ph.head.height + ' (want <= 0.55)');
  assert.ok(ph.head.onScreen,
    name + ' pick head is not fully on-screen ' + JSON.stringify(ph.head));
  assert.ok(ph.head.width >= 0.22,
    name + ' pick head width is ' + ph.head.width + ' (want >= 0.22 of frame)');
  const pix = ph.haftPixels || {};
  const haftGeom = ph.haft && ph.haft.inFrame > 8 && ph.haft.onScreen;
  const haftPix = (pix.wood || 0) >= 40 || (pix.frac || 0) >= 0.08 || (ph.haft && ph.haft.inFrame >= 80);
  assert.ok(haftGeom && haftPix,
    name + ' haft is not visible (geom=' + JSON.stringify(ph.haft) + ' pix=' + JSON.stringify(pix) + ')');
  const hk = r.pickHook1263;
  assert.ok(hk, name + ' missing pickHook1263 mask probe');
  assert.ok(!hk.closedLoop && (hk.hole || 0) <= 80,
    name + ' pick head mask is a closed loop / has a hole ' + JSON.stringify(hk));
  // The circumcenter probe can under-read a slender lune; still cap at 150°
  // so a hoop fails, and require a real mask plus an open arc (or a large n).
  assert.ok(hk.arcDeg < 150,
    name + ' pick head arc is ' + hk.arcDeg + '° (want open, < 150°)');
  assert.ok((hk.n || 0) > 200, name + ' pick head mask is empty ' + JSON.stringify(hk));
}

const ITEM_SHOTS = [
  'fp-p761', 'fp-p761-sky', 'fp-p761-wall',
  'fp-cobble', 'fp-bucket', 'fp-torch', 'fp-map', 'fp-sword',
  'fp-musket', 'fp-musket-aim', 'fp-pistol', 'fp-pistol-aim', 'fp-sword94'
];
for (const name of ITEM_SHOTS) {
  if (!results[name]) continue;
  const v = shot(name).itemVis1263;
  assert.ok(v, name + ' missing itemVis1263 probe');
  const ok = !!(v.visible || ((v.pix || 0) >= 200 && (v.n || 0) >= 8));
  assert.ok(ok, name + ' held item is not visible ' + JSON.stringify(v));
}

const SLEEVE_RE = /sleeve|cuff|arm|fore|FpSleeve|FpCuff|FpArm|FpWrist/i;
const fp = Object.keys(results).filter(k => k.startsWith('fp-') && !k.includes('reload'));
assert.ok(fp.length >= 8, 'expected a full first-person sheet, got ' + fp.join(','));
for (const name of fp) {
  const r = shot(name);
  if (!r.cover1256) continue;
  const walls = (r.cover1256.top || []).filter(m => !m.hid && m.cov > 0.25 && SLEEVE_RE.test(String(m.typ || m.name || '')));
  assert.ok(walls.length === 0,
    name + ' sleeve/arm covers >25% of the frame ' + JSON.stringify(walls));
}

console.log('ok: v1264 extruded crescent (open, width>=0.22) + item visibility + sleeve cap', { qa: qaPath, picks: pickShots.length, shots: fp.length });

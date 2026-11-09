#!/usr/bin/env node
// 1270: Scottish TP-mesh FP arms, plus the 1269 re-framed pick (socket near centre, upright crescent, width >= 0.26,
// both tips inside the frame by >= 3%). v1269 still points at held-1269.
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
assert.ok(html.includes('warmFlameTex1265') && html.includes('fpSock1265'),
  '1265 warm flame texture and wooden socket wrap stay in the build');
assert.ok(html.includes('fpFlint1265') && html.includes('fpFlint1266'),
  '1265 flintlock tag and 1266 side-profile flintlock stay in the build');
assert.ok(html.includes('0xd2a07c') && html.includes('0xc6b399'),
  'warm FP skin color (and the 1262 comment) stay in the build');
assert.ok(html.includes('0xb44cff') || html.includes('tintCrescent'),
  '1266 brighter pick-head tint is in the build');
assert.ok(html.includes('MeshStandardMaterial') && html.includes('fpStd1267'),
  '1267 MeshStandard pick-head material is in the build');
assert.ok(html.includes('fpMusket1267') || html.includes('dressMusketFlintlock'),
  '1267 musket flintlock material dress is in the build');
assert.ok(html.includes('0x4b1f8a') && html.includes('8a4ce0') && html.includes('0x1e0c3a'),
  '1268 deep-violet pick colours are in the build');
assert.ok(html.includes('fpMusketLock1268') && html.includes('skinBumpFp'),
  '1268 musket lock furniture and FP skin bump are in the build');
assert.ok(html.includes('HEAD_SX') && html.includes('HEAD_SY'),
  '1269 anisotropic pick-head scale is in the build');
assert.ok(html.includes('fpTpArm1270') && html.includes('FpTpArm1270'),
  '1270 first-person arms cloned from the live Scottish TP mesh are in the build');

const qaPath = ['/workspace/qa/held-1270/webgl-results.json'].find(p => existsSync(p));
assert.ok(qaPath, 'webgl-results.json missing — run webgl-studio into held-1270');
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
  assert.ok(ph.head.onScreen,
    name + ' pick head is not fully on-screen ' + JSON.stringify(ph.head));
  assert.ok(ph.head.width >= 0.26,
    name + ' pick head width is ' + ph.head.width + ' (want >= 0.26 of frame)');
  const hk = r.pickHook1263;
  assert.ok(hk, name + ' missing pickHook1263 mask probe');
  assert.ok(!hk.closedLoop && (hk.hole || 0) <= 80,
    name + ' pick head mask is a closed loop / has a hole ' + JSON.stringify(hk));
  assert.ok((hk.n || 0) > 200, name + ' pick head mask is empty ' + JSON.stringify(hk));
  // 1267 slender sickle: the v1266 fat-moon area floor of 0.025 cannot be
  // met by a hook that stays on screen at this framing (measured ~0.0095).
  // Width >= 0.18 is kept; area is relaxed only as far as the slimmer blade needs.
  assert.ok((hk.area || 0) >= 0.007,
    name + ' pick head projected area is ' + hk.area + ' (want >= 0.007 of the frame for the slender sickle)');
  // 1269: both tips (and the whole head AABB) stay inside the frame by
  // >= 3%. NDC edges are +/-1, so 3% of the frame is 0.06 NDC.
  const hb = ph.head;
  const margin = 0.06;
  assert.ok(hb.min[0] >= -1 + margin && hb.max[0] <= 1 - margin &&
            hb.min[1] >= -1 + margin && hb.max[1] <= 1 - margin,
    name + ' pick tips are too close to the frame edge ' + JSON.stringify(hb) +
    ' (want all of min/max inside +/-0.94 NDC, 3% margin)');
  // Socket near horizontal centre: the right of the head (socket) at image x ~0.45-0.55.
  if (hb.max && typeof hb.max[0] === 'number') {
    const sockImgX = (hb.max[0] + 1) / 2;
    assert.ok(sockImgX >= 0.40 && sockImgX <= 0.58,
      name + ' pick socket image x=' + sockImgX.toFixed(3) + ' (want ~0.45-0.50, allow 0.40-0.58)');
  }
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

if (results['fp-bucket']) {
  const v = shot('fp-bucket').itemVis1263;
  assert.ok(v && v.visible, 'bucket item is not visible');
  assert.ok((v.width || 0) > 0.15 && (v.width || 0) < 0.85,
    'bucket width is ' + (v && v.width) + ' (clipped or missing)');
}

if (results['fp-empty'] && results['fp-empty'].cover1256) {
  const max = results['fp-empty'].cover1256.max || 0;
  assert.ok(max < 0.20,
    'empty hand/sleeve cover is ' + max + ' (want a small corner hand, < 0.20)');
}

const SLEEVE_RE = /sleeve|cuff|arm|fore|FpSleeve|FpCuff|FpArm|FpWrist/i;
const fp = Object.keys(results).filter(k => k.startsWith('fp-') && !k.includes('reload'));
assert.ok(fp.length >= 8, 'expected a full first-person sheet, got ' + fp.join(','));

// 1270: the live Scottish arm/hand is actually on for empty and pick.
for (const name of ['fp-empty', 'fp-p761']) {
  if (!results[name]) continue;
  const a = results[name].fpTpArm;
  assert.ok(a && a.on, name + ' FP TP arm is not on ' + JSON.stringify(a));
  assert.ok(!a.err, name + ' FP TP arm error ' + (a && a.err));
  assert.ok((a.vis || 0) >= 2, name + ' FP TP arm has no visible meshes ' + JSON.stringify(a));
}

for (const name of fp) {
  const r = shot(name);
  if (!r.cover1256) continue;
  const walls = (r.cover1256.top || []).filter(m => !m.hid && m.cov > 0.25 && SLEEVE_RE.test(String(m.typ || m.name || '')));
  assert.ok(walls.length === 0,
    name + ' sleeve/arm covers >25% of the frame ' + JSON.stringify(walls));
}

console.log('ok: v1270 TP-mesh FP arms; 1269 re-framed upright crescent pick, 3% tip margin, width >= 0.26; keepers hold', { qa: qaPath, picks: pickShots.length, shots: fp.length });

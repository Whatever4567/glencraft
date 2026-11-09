#!/usr/bin/env node
// 1259: dedicated first-person viewmodel — grip-parented items, sleeve-to-wrist
// connection, screen-edge forearms, coverage cap (ADS barrel excepted).
import assert from 'assert';
import { existsSync, readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(join(root, 'index.html'), 'utf8');

assert.ok(html.includes('fpVm1259') && html.includes('__fpVm1259'), '1259 FP viewmodel is in the build');
assert.ok(html.includes('U.buildHand') || html.includes('__hands1249.buildHand') || html.includes('buildHand = function'),
  'sculpted-hand builder is exported for the FP rig');
assert.ok(html.includes('FpGrip') || html.includes('fpGrip1259'), 'grip socket is present');
assert.ok(/fov\s*=\s*70|FP_FOV\s*=\s*70/.test(html), 'FP overlay uses a fixed 70 degree FOV');

const qaPath = [
  '/workspace/qa/held-1259/webgl-results.json',
].find(p => existsSync(p));
assert.ok(qaPath, 'webgl-results.json missing — run webgl-studio into held-1259');
const qa = JSON.parse(readFileSync(qaPath, 'utf8'));
const results = qa.results || qa;
function shot(name) {
  const r = results[name];
  assert.ok(r, 'missing capture ' + name);
  return r;
}

const fp = Object.keys(results).filter(k => k.startsWith('fp-') && !k.includes('reload'));
assert.ok(fp.length >= 8, 'expected a full first-person sheet, got ' + fp.join(','));

for (const name of fp) {
  const r = shot(name);
  const p = r.fpvm1259;
  assert.ok(r.fpvmOn || (p && p.active), name + ' 1259 rig is not active ' + JSON.stringify({err: r.fpvmErr || (p && p.err), p}));
  assert.ok(p, name + ' missing fpvm1259 probe');
  const isGunAds = /pistol-aim|musket-aim/.test(name);
  const hasItem = !/empty/.test(name);

  if (hasItem) {
    // Item is parented to the grip, so contact is exact by construction.
    // Allow 1 cm in world units (the test budget the brief asked for).
    const d = (p.gripItem != null) ? p.gripItem : p.handItem;
    assert.ok(p.chained || (d != null && d <= 0.01),
      name + ' hand/grip-to-item is ' + d + ' (want <= 0.01 or chained) ' + JSON.stringify(p));
  }

  // Sleeve ends at the wrist (cuff and wrist share a point, no gap).
  if (p.sleeveWrist != null) {
    assert.ok(p.sleeveWrist <= 0.02,
      name + ' sleeve-wrist gap is ' + p.sleeveWrist + ' ' + JSON.stringify(p));
  }
  if (p.foreLen != null) {
    assert.ok(p.foreLen + 1e-6 >= (p.minFore || 0.30) * 0.99,
      name + ' forearm shorter than minimum (' + p.foreLen + ')');
  }

  // Forearm enters from a screen edge (bottom / right, or left for two-hand).
  const enters = p.entersEdge || p.entersBR || p.entersEdgeL;
  assert.ok(enters, name + ' forearm does not enter from a screen edge ' + JSON.stringify({
    shNdc: p.shNdc, wrNdc: p.wrNdc, shNdcL: p.shNdcL
  }));

  // No mesh over 25% of the screen except an ADS barrel.
  if (r.cover1256 && !isGunAds) {
    const walls = (r.cover1256.top || []).filter(m => !m.hid && m.cov > 0.25);
    assert.ok(walls.length === 0,
      name + ' mesh covers >25% of the frame ' + JSON.stringify(walls));
  }
}

// Musket aim: both hands, tartan on the left sleeve when the probe recorded it.
{
  const p = shot('fp-musket-aim').fpvm1259;
  if (p && p.two) {
    assert.ok(p.leftTartan || p.entersEdgeL,
      'musket aim should show a left support arm (tartan if dressed) ' + JSON.stringify(p));
  }
}

console.log('ok: v1259 dedicated FP viewmodel', { qa: qaPath, shots: fp.length });

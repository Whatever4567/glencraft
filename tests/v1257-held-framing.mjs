#!/usr/bin/env node
// 1257: pick head is a small on-screen crescent with a visible haft;
// musket ADS is not a stock-wood wall and the barrel/sight sits near centre.
import assert from 'assert';
import { existsSync, readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(join(root, 'index.html'), 'utf8');

assert.ok(/dz:-0\.16, fov: 1\.08/.test(html), 'pick FRAME is pulled back (1257)');
assert.ok(html.includes('crescentBladeGeometry(0.44') && html.includes('0.30') || html.includes('crescentBladeGeometry(0.44, 0.0230, 0.048, 0.42)'),
  'pick crescent uses a short lower hook so the haft stays visible');
assert.ok(/const len = 0\.88/.test(html) || html.includes('const len = 0.88'),
  'crystal pick haft is lengthened');
assert.ok(html.includes("ads: [0, 0.010, -0.34]"), 'musket ADS sight sits 0.34 in front of the camera');
assert.ok(html.includes('setInCam(L, -0.07, -0.16, -0.46)'), 'musket ADS support hand is out of the sights');
assert.ok(html.includes('sleeve1257'), 'linen sleeve shell is in the build');

const qaPath = [
  '/workspace/qa/held-1257/webgl-results.json',
  '/workspace/qa/held-1256/webgl-results.json',
].find(p => existsSync(p));
assert.ok(qaPath, 'webgl-results.json missing — run webgl-studio into held-1257');
const qa = JSON.parse(readFileSync(qaPath, 'utf8'));
const results = qa.results || qa;
function shot(name) {
  const r = results[name];
  assert.ok(r, 'missing capture ' + name);
  return r;
}

for (const name of ['fp-p761', 'fp-p761-sky', 'fp-p761-wall']) {
  const r = shot(name);
  const ph = r.pickHead1257;
  assert.ok(ph && ph.head, name + ' missing pickHead1257 probe');
  assert.ok(ph.head.height <= 0.35,
    name + ' pick head screen height is ' + ph.head.height + ' (want <= 0.35 of the frame)');
  assert.ok(ph.head.onScreen,
    name + ' pick head is not fully on-screen ' + JSON.stringify(ph.head));
  const pix = ph.haftPixels || {};
  const haftGeom = ph.haft && ph.haft.inFrame > 8 && ph.haft.onScreen;
  const haftPix = (pix.wood || 0) >= 40 || (pix.frac || 0) >= 0.08;
  assert.ok(haftGeom && haftPix,
    name + ' haft is not visible (geom=' + JSON.stringify(ph.haft) + ' pix=' + JSON.stringify(pix) + ')');
}

{
  const r = shot('fp-musket-aim');
  const c = r.centre1257;
  assert.ok(c, 'fp-musket-aim missing centre1257 pixel sample');
  assert.ok(c.woodFrac <= 0.60,
    'musket ADS centre-screen is ' + (c.woodFrac * 100).toFixed(1) + '% stock wood (want <= 60%) ' + JSON.stringify(c));
  const darkOrGun = (c.darkFrac || 0) + (c.woodFrac || 0);
  // Barrel / sight near centre: some non-sky structure in the centre band,
  // but not a wood wall.
  assert.ok(darkOrGun >= 0.04 && darkOrGun <= 0.70,
    'musket ADS barrel/sight is not visible near the centre ' + JSON.stringify(c));
}

console.log('ok: v1257 pick head + musket ADS checks', { qa: qaPath });

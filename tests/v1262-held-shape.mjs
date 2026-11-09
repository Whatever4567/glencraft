#!/usr/bin/env node
// 1262: FP-only deep pick hook, desaturated FP skin / off-white folded
// linen, and the 25% cover cap still applies to sleeves and arms.
import assert from 'assert';
import { existsSync, readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(join(root, 'index.html'), 'utf8');

assert.ok(html.includes('fpHook1262') && html.includes('fpCrescentGeo'),
  'FP-only deep crescent hook is in the build');
assert.ok(html.includes('crescentBladeGeometry(0.44, 0.0230, 0.048, 0.42)'),
  'TP/world pick mesh is unchanged (short hook 0.42)');
assert.ok(html.includes('skinMatFp') && html.includes('0xc6b399'),
  'FP skin is a desaturated warm tan, not orange');
assert.ok(html.includes('linenMatFp') && html.includes('0xe8e2d6'),
  'FP linen is off-white #e8e2d6');
assert.ok(html.includes('wrinkleCyl') && html.includes('FpCuffRoll2'),
  'sleeves have fold wrinkling and a 3-fold rolled cuff');
assert.ok(html.includes('flameDressed1262') || html.includes('fpFlame1262'),
  'torch flame is dressed for an orange fire, not a white bloom');
assert.ok(html.includes('crease1262'), 'finger joints have darker crease rings');

const qaPath = ['/workspace/qa/held-1262/webgl-results.json'].find(p => existsSync(p));
assert.ok(qaPath, 'webgl-results.json missing — run webgl-studio into held-1262');
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
  // A deep scythe hook is taller than the 1257 leaf; keep it on-screen
  // with a visible haft, and cap the head at half the frame.
  assert.ok(ph.head.height <= 0.50,
    name + ' pick head screen height is ' + ph.head.height + ' (want <= 0.50)');
  assert.ok(ph.head.onScreen,
    name + ' pick head is not fully on-screen ' + JSON.stringify(ph.head));
  const pix = ph.haftPixels || {};
  const haftGeom = ph.haft && ph.haft.inFrame > 8 && ph.haft.onScreen;
  const haftPix = (pix.wood || 0) >= 40 || (pix.frac || 0) >= 0.08 || (ph.haft && ph.haft.inFrame >= 80);
  assert.ok(haftGeom && haftPix,
    name + ' haft is not visible (geom=' + JSON.stringify(ph.haft) + ' pix=' + JSON.stringify(pix) + ')');
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

console.log('ok: v1262 FP hook + skin/linen + sleeve cap', { qa: qaPath, picks: pickShots.length, shots: fp.length });

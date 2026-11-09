#!/usr/bin/env node
// 1261: pick head is a small on-screen crescent with a visible haft
// (1257-style); the 25% cover cap stays on sleeves and arms, but
// correctly-held long tools are exempt by item type.
import assert from 'assert';
import { existsSync, readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(join(root, 'index.html'), 'utf8');

assert.ok(html.includes('fpVm1259') && html.includes('__fpVm1259'), '1259 FP viewmodel is in the build');
assert.ok(html.includes('flameScaled1261') || html.includes('flameS'), 'torch flame is scaled independently of the stick');
assert.ok(html.includes('held1240Map') && html.includes('buildMapCard'), 'illustrated map card is used in first person');

const qaPath = [
  '/workspace/qa/held-1261/webgl-results.json',
].find(p => existsSync(p));
assert.ok(qaPath, 'webgl-results.json missing — run webgl-studio into held-1261');
const qa = JSON.parse(readFileSync(qaPath, 'utf8'));
const results = qa.results || qa;
function shot(name) {
  const r = results[name];
  assert.ok(r, 'missing capture ' + name);
  return r;
}

const pickShots = ['fp-p761', 'fp-p761-sky', 'fp-p761-wall'].filter(n => results[n]);
assert.ok(pickShots.length >= 3, 'expected the three first-person pick shots, got ' + pickShots.join(','));

for (const name of pickShots) {
  const r = shot(name);
  const ph = r.pickHead1257;
  assert.ok(ph && ph.head, name + ' missing pickHead1257 probe');
  assert.ok(ph.head.height <= 0.35,
    name + ' pick head screen height is ' + ph.head.height + ' (want <= 0.35 of the frame)');
  assert.ok(ph.head.onScreen,
    name + ' pick head is not fully on-screen ' + JSON.stringify(ph.head));
  const pix = ph.haftPixels || {};
  const haftGeom = ph.haft && ph.haft.inFrame > 8 && ph.haft.onScreen;
  const haftPix = (pix.wood || 0) >= 40 || (pix.frac || 0) >= 0.08 || (ph.haft && ph.haft.inFrame >= 80);
  assert.ok(haftGeom && haftPix,
    name + ' haft is not visible (geom=' + JSON.stringify(ph.haft) + ' pix=' + JSON.stringify(pix) + ')');
}

const SLEEVE_RE = /sleeve|cuff|arm|fore|FpSleeve|FpCuff|FpArm|FpWrist/i;
const LONG_TOOL = /p761|pick|sword|musket|torch/;

const fp = Object.keys(results).filter(k => k.startsWith('fp-') && !k.includes('reload'));
assert.ok(fp.length >= 8, 'expected a full first-person sheet, got ' + fp.join(','));

for (const name of fp) {
  const r = shot(name);
  if (!r.cover1256) continue;
  const walls = (r.cover1256.top || []).filter(m => {
    if (m.hid) return false;
    if (!(m.cov > 0.25)) return false;
    const typ = String(m.typ || m.name || '');
    return SLEEVE_RE.test(typ);
  });
  assert.ok(walls.length === 0,
    name + ' sleeve/arm covers >25% of the frame ' + JSON.stringify(walls));

  if (!LONG_TOOL.test(name) && !/map|bucket|pistol|cobble|empty/.test(name)) {
    const other = (r.cover1256.top || []).filter(m => !m.hid && m.cov > 0.25);
    assert.ok(other.length === 0,
      name + ' mesh covers >25% of the frame ' + JSON.stringify(other));
  }
}

console.log('ok: v1261 pick head + sleeve cover cap', { qa: qaPath, picks: pickShots.length, shots: fp.length });

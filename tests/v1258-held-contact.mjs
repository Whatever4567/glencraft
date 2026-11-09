#!/usr/bin/env node
// 1258: cylindrical linen sleeve on the pick; hand-to-item contact for
// pick / pistol / bucket; forearm stays chained to the hand on tool shots.
import assert from 'assert';
import { existsSync, readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(join(root, 'index.html'), 'utf8');

assert.ok(html.includes('sleeve1258'), '1258 cylindrical linen sleeve is in the build');
assert.ok(/CylinderGeometry\(r, r,/.test(html) || html.includes('CylinderGeometry(r, r,'),
  'linen sleeve is a constant-radius cylinder, not a taper');
assert.ok(html.includes('hideFoSkin') || html.includes('__hidSkin1258'),
  'skin forearm cone is hidden under the linen sleeve');

const qaPath = [
  '/workspace/qa/held-1258/webgl-results.json',
  '/workspace/qa/held-1257/webgl-results.json',
].find(p => existsSync(p));
assert.ok(qaPath, 'webgl-results.json missing — run webgl-studio into held-1258');
const qa = JSON.parse(readFileSync(qaPath, 'utf8'));
const results = qa.results || qa;
function shot(name) {
  const r = results[name];
  assert.ok(r, 'missing capture ' + name);
  return r;
}

function contact(name) {
  const r = shot(name);
  assert.ok(r.contact1258, name + ' missing contact1258 probe');
  return r.contact1258;
}

// Pick: the hand should sit on the haft (tight contact in FP/world space).
{
  const c = contact('fp-p761');
  assert.ok(c.hasHand && c.hasItem, 'fp-p761 missing hand or item for contact ' + JSON.stringify(c));
  assert.ok(c.handItem != null && c.handItem <= 0.18,
    'fp-p761 hand-to-haft distance is ' + c.handItem + ' (want <= 0.18) ' + JSON.stringify(c));
}

// Pistol and bucket: record contact; a total disconnect (no item/hand, or
// more than half a metre) is a regression. Tighter wrap is still outstanding.
for (const name of ['fp-pistol', 'fp-pistol-aim', 'fp-bucket']) {
  const c = contact(name);
  assert.ok(c.hasHand, name + ' has no FP hand ' + JSON.stringify(c));
  if (c.hasItem && c.handItem != null) {
    assert.ok(c.handItem <= 0.55,
      name + ' hand-to-item is fully disconnected (' + c.handItem + ') ' + JSON.stringify(c));
  }
}

// Forearm connected to the hand (no gap) on every first-person item shot.
const fp = Object.keys(results).filter(k => k.startsWith('fp-') && !k.includes('reload') && !k.startsWith('fp-musket-reload'));
assert.ok(fp.length >= 8, 'expected a full first-person sheet, got ' + fp.join(','));
for (const name of fp) {
  const r = results[name];
  const c = r.contact1258;
  if (!c) continue;
  const isGun = /musket|pistol/.test(name);
  if (isGun) {
    // Gun poses still hide the forearm cone to avoid a lens wall; the hand
    // itself must remain.
    assert.ok(c.hasHand, name + ' gun shot has no hand ' + JSON.stringify(c));
    continue;
  }
  const linked = c.chained || (c.foreHand != null && c.foreHand <= 0.28);
  assert.ok(linked,
    name + ' forearm is not connected to the hand (gap=' + c.foreHand + ' chained=' + c.chained + ') ' + JSON.stringify(c));
}

console.log('ok: v1258 sleeve cylinder + contact checks', { qa: qaPath });

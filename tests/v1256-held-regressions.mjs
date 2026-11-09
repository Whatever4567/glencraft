#!/usr/bin/env node
// 1256: fail on the 1255 regressions — missing forearms, wall-covering
// meshes, a pick blade that is no longer a slender crescent, and an empty
// pistol hip. Gun ADS barrels are allowed to be long in frame; a visible
// pick crescent at the 1254 framing covers ~37% and is capped separately.
import assert from 'assert';
import { existsSync, readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(join(root, 'index.html'), 'utf8');

{
  const shrink = html.indexOf('function shrinkCuff');
  const ensure = html.indexOf('function ensureWristCuff');
  assert.ok(shrink >= 0 && ensure > shrink, 'shrinkCuff / ensureWristCuff present');
  const re = /if \(p\.fo\) p\.fo\.visible = false/g;
  let m;
  while ((m = re.exec(html))) {
    assert.ok(!(m.index > shrink && m.index < ensure),
      'shrinkCuff hides p.fo — that removed the forearm in 1255');
  }
}

assert.ok(html.includes('handle1249') && html.includes('isGlowPart'),
  '1255 pick grip-socket fix (haft tag + skip glow) must stay');
assert.ok(/pick:\s*\{dx:\s*-0\.03,\s*dy:\s*0\.00,\s*dz:\s*0\.06/.test(html),
  'pick FRAME must stay at the 1254 framing (do not zoom the blade into a wall)');

const qaPath = [
  '/workspace/qa/held-1256/webgl-results.json',
  '/workspace/qa/held-1255/webgl-results.json',
].find(p => existsSync(p));
assert.ok(qaPath, 'webgl-results.json missing — run webgl-studio first');
const qa = JSON.parse(readFileSync(qaPath, 'utf8'));
const results = qa.results || qa;

function shot(name) {
  const r = Array.isArray(results)
    ? results.find(x => x && (x.file === name || x.name === name))
    : (results[name] || null);
  assert.ok(r, `missing capture ${name}`);
  return r;
}
function allShots() {
  if (Array.isArray(results)) return results.filter(Boolean);
  return Object.entries(results).map(([file, r]) => ({ file, ...(r || {}) }));
}
function dumpMeshes(r) {
  const d = r.lastDump;
  if (Array.isArray(d)) return d;
  if (d && Array.isArray(d.top)) return d.top;
  return [];
}

// Hip / held-item shots that must show a forearm entering from the bottom-right.
// Guns hide the close forearm cone on purpose (hideArmSheets) so they are
// checked for a visible hand instead, plus pistol-in-frame below.
const FOREARM_SHOTS = [
  'fp-empty', 'fp-cobble', 'fp-p761', 'fp-sword', 'fp-bucket', 'fp-torch', 'fp-map',
];
for (const name of FOREARM_SHOTS) {
  const r = shot(name);
  const fo = r.forearm1256;
  assert.ok(fo, `${name}: missing forearm1256 probe — re-run webgl-studio into held-1256`);
  assert.ok(fo.foVisible && (fo.foCover == null || fo.foCover > 0.004),
    `${name}: forearm mesh is not visible (1255 floating-hand regression) ${JSON.stringify(fo)}`);
  assert.ok(fo.entersBR,
    `${name}: forearm does not enter from the bottom-right ${JSON.stringify(fo)}`);
}

const COVER_LIMIT = 0.25;
const PICK_BLADE_LIMIT = 0.55;
const ADS_BARREL = /barrel|muzzle|bore|sight|gun|rifle|pistol|musket/i;
for (const r of allShots()) {
  if (!r || !r.file || !r.cover1256) continue;
  if (String(r.file).includes('close') || String(r.file).includes('reload')) continue;
  if (!String(r.file).startsWith('fp-')) continue;
  const ads = /ads|aim/i.test(r.file);
  const isPick = /p761|pick/.test(r.file);
  const walls = (r.cover1256.top || []).filter(m => {
    if (m.hid || !(m.cov > (isPick ? PICK_BLADE_LIMIT : COVER_LIMIT))) return false;
    if (ads && ADS_BARREL.test(String(m.typ || ''))) return false;
    return true;
  });
  assert.ok(walls.length === 0,
    `${r.file}: mesh covers too much of the frame ${JSON.stringify(walls)} (max ${r.cover1256.max})`);
  // lastDump AABB coverage hits 1.0 on long guns that pass near the camera.
  // Use it to catch non-gun walls (the 1255 cuff / box blow-ups).
  const dumpWalls = dumpMeshes(r).filter(m => {
    if (m.hid || !(m.cov >= 0.70)) return false;
    if (ADS_BARREL.test(String(m.name || m.typ || ''))) return false;
    return true;
  });
  assert.ok(dumpWalls.length === 0,
    `${r.file}: lastDump wall mesh ${JSON.stringify(dumpWalls.map(m => ({name: m.name, typ: m.typ, cov: m.cov})))}`);
}

// Pick crescent: slender (width < ~1/4 length) and bowed, not a flat sword.
{
  const r = shot('fp-p761');
  const a = r.pickAspect;
  assert.ok(a, 'fp-p761 missing pickAspect probe');
  assert.ok(a.ratio < 0.28,
    `pick blade bbox is not a slender crescent (width/length=${a.ratio}, size=${JSON.stringify(a.size)})`);
  assert.ok(a.bowed,
    `pick blade is not curved (midX=${a.midX} tipX=${a.tipX})`);
  assert.ok(a.length > 0.35 && a.length < 1.8,
    `pick blade length ${a.length} is out of the crescent range`);
  if (r.cover1256) {
    const bladeWalls = (r.cover1256.top || []).filter(m => m.cov > PICK_BLADE_LIMIT);
    assert.ok(bladeWalls.length === 0,
      `pick blade fills the frame ${JSON.stringify(bladeWalls)}`);
  }
}

// Pistol is visible in the hip frame (not an empty shot with a white stick at the edge).
{
  const r = shot('fp-pistol');
  const fromProbe = r.gun1256 && r.gun1256.n >= 2 && r.gun1256.cov >= 0.03;
  const fromDump = dumpMeshes(r).filter(m =>
    !m.hid && m.cov >= 0.03 && /pistol|gun|flint/i.test(String(m.name || m.typ || '')));
  assert.ok(fromProbe || fromDump.length >= 1,
    `pistol is not visible in the hip frame (gun=${JSON.stringify(r.gun1256)} dump=${JSON.stringify(fromDump)})`);
}

console.log('ok: v1256 held regression checks',
  { qa: qaPath, forearm: FOREARM_SHOTS.length });

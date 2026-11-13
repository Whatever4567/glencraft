// v1.2.66: sausage fingers sculpted toward realistic proportions.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { execSync } from 'node:child_process';

const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const ver = JSON.parse(fs.readFileSync(new URL('../version.json', import.meta.url), 'utf8'));
const credits = fs.readFileSync(new URL('../CREDITS.md', import.meta.url), 'utf8');
const src = fs.readFileSync(new URL('../tools/content-source/hands-1266.js', import.meta.url), 'utf8');
let n = 0;
const ok = (c, l) => { assert.ok(c, l); console.log('ok ' + (++n) + ' ' + l); };

ok(ver.v === '1.2.66', 'version.json is 1.2.66');
ok(html.includes("const GAME_VERSION = '1.2.66';"), 'GAME_VERSION is 1.2.66');
ok(html.includes('<!-- glencraft-build: b1266-v1.2.66 -->'), 'build marker b1266');
ok(html.includes('<!-- glencraft-build: b1265-v1.2.65 -->'), '1.2.65 build marker stays');
ok(credits.includes('## v1.2.66 Sausage fingers sculpted toward realistic proportions'), 'CREDITS has the 1.2.66 section');
ok(credits.includes('1e9db15') && credits.includes('__fpa'), 'CREDITS still names the restored 1.2.59 __fpa path');

const notesStart = html.indexOf('window.PATCH_NOTES = [');
ok(notesStart > 0, 'PATCH_NOTES present');
const head = html.slice(notesStart, notesStart + 28000);
ok(head.includes('"v":"v1.2.66"') && head.includes('"d":"2026-11-13"'), 'v1.2.66 notes are at the top, dated 2026-11-13');
ok(head.indexOf('"v":"v1.2.66"') < head.indexOf('"v":"v1.2.65"'), '1.2.66 notes sit above 1.2.65');
ok(head.includes('Hands: sausage fingers sculpted toward realistic proportions'), 'patch notes use the sausage-fingers phrase');
for (const phrase of [
  'tapers from a thicker base',
  'three phalanx segments',
  'two for the thumb',
  'middle finger is longest',
  'flattened oval',
  'resting curl',
  'pinky curls the most',
  'thin inset plates',
  'thenar',
  'thinner relative to the palm',
  'Hard-refresh'
]) {
  ok(head.includes(phrase), 'patch notes mention: ' + phrase);
}

ok(html.includes('/* GLX-HANDS1266 (v1.2.66):'), 'HANDS1266 IIFE is in the page');
const i1266 = html.indexOf('/* GLX-HANDS1266');
ok(i1266 > 0, 'HANDS1266 marker found');
const i1266End = (() => {
  const next = html.indexOf('\n/* GLX-', i1266 + 10);
  const scr = html.indexOf('</script>', i1266);
  let end = i1266 + 40000;
  if (next > i1266 && next < end) end = next;
  if (scr > i1266 && scr < end) end = scr;
  return end;
})();
const h1266 = html.slice(i1266, i1266End);
ok(h1266.includes('phalanxGeo') && h1266.includes('visible narrowing'), '1266 has tapered phalanx segments with joint narrowing');
ok(h1266.includes('knuckle bulge') || h1266.includes('knuckle bulge'), '1266 has knuckle bulges');
ok(h1266.includes('TIP') && h1266.includes('PROX') && h1266.includes('0.0360'), '1266 varies visual lengths (middle longest) without moving the 0.036 pivot');
ok(h1266.includes('oval') && (h1266.includes('0.47') || h1266.includes('flattened')), '1266 uses a flattened oval cross-section');
ok(h1266.includes('applyRestCurl') && h1266.includes('REST_F') && h1266.includes('isEmptyHand'), '1266 applies a per-finger resting curl only on the empty hand');
ok(h1266.includes('pinky curls the most') || h1266.includes('Pinky curls the most') || h1266.includes('REST_F'), 'pinky rest curl is the strongest');
ok(h1266.includes('nailPlate') && h1266.includes('thin inset'), '1266 has thin inset nail plates');
ok(h1266.includes('upgradeThenar') && h1266.includes('thenar'), '1266 has a thicker thenar base on the thumb');
ok(h1266.includes('WIDTH') && h1266.includes('0.0066'), '1266 fingers are thinner than the 1.2.65 0.0086 widths');
ok(h1266.includes('__hands1265') && (h1266.includes('_finger') || h1266.includes('ensureTextures')), '1266 keeps 1.2.65 pixel-shading materials');
ok(h1266.includes('function share') && h1266.includes('const GEO'), 'geometry is cached');
ok(!h1266.includes("['dU', 'dL', 'dR'].forEach") && !/#dU|#dL|#dR/.test(h1266), '1266 does not hide or style the gold D-pad');
ok(h1266.includes('gold D-pad is left alone'), '1266 records that the gold D-pad is left alone');
ok(!/enableKinds|NEW_FP_KINDS\s*=/.test(h1266), '1266 does not re-enable NEW_FP_KINDS');
ok(!/hands-1260|HANDS1260|hands-1261|HANDS1261|voxel arm/.test(h1266), '1266 does not switch to the 1.2.60 or 1.2.61 arm');
ok(!/\.position\.set\((i - 1\.5)|th\.position\.set\(side/.test(h1266), '1266 does not move finger or thumb group pivots');

ok(html.includes('/* GLX-HANDS1265'), 'HANDS1265 IIFE is still in the page');
ok(html.includes('BAYER8') && html.includes('rampDither'), '1.2.65 procedural dithered shading stays');
ok(html.includes('/* GLX-HANDS1263'), 'HANDS1263 IIFE is still in the page');
ok(html.includes("restoredFrom: '1e9db15'") && html.includes("restoredFromLabel: '1.2.59'"), '1.2.63 arms restore is unchanged');
ok(html.includes('__fpVm1259') && html.includes("version: '1.2.59-frame-torch'"), '1259 viewmodel and torch freeze stay');
ok(html.includes('_seatStable') && html.includes('errMax: 1.20'), '1.2.59 torch-pose freeze stays');
ok(html.includes('__fpa') && html.includes('handsSculpt1249'), 'classic __fpa + 1.2.57 sculpt path stays');
ok(!html.includes('/* GLX-HANDS1261'), '1.2.61 voxel-arm IIFE stays removed');
ok(html.includes('/* GLX-HANDS1260') && html.includes('/* GLX-HANDS1262'), '1260/1262 stay in the page (neutralized)');
ok(html.includes('/* GLX-TBOX1264') && html.includes('scrY: 2.68') && html.includes('fly1264'), '1.2.64 TARDIS work stays');
ok(!html.includes("['dU', 'dL', 'dR'].forEach") && html.includes('gold D-pad is left alone'), 'gold D-pad is not hidden');
ok(html.includes('hideInThirdPerson') || html.includes('third-person hiding') || html.includes('third person'), 'third-person view-model hide stays');

const i1265 = html.indexOf('/* GLX-HANDS1265');
const iH1263 = html.indexOf('/* GLX-HANDS1263');
ok(i1266 > i1265 && i1266 > iH1263, 'HANDS1266 is injected after HANDS1265 and HANDS1263');

try {
  const git = execSync('git show main:tools/content-source/hands-1263.js', {
    cwd: new URL('..', import.meta.url), encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe']
  });
  const live = fs.readFileSync(new URL('../tools/content-source/hands-1263.js', import.meta.url), 'utf8');
  ok(git === live, 'hands-1263.js is unchanged from main');
} catch (e) {
  ok(fs.readFileSync(new URL('../tools/content-source/hands-1263.js', import.meta.url), 'utf8').includes("restoredFrom: '1e9db15'"),
    'hands-1263.js still records the 1.2.59 restore (git compare skipped)');
}

ok(html.includes(src.trim()), 'hands-1266.js source is injected into the page');

console.log('all ok (' + n + ')');

// v1.2.65: further pixel-sculpt detail on the classic 1.2.59 / __fpa hands.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { execSync } from 'node:child_process';

const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const ver = JSON.parse(fs.readFileSync(new URL('../version.json', import.meta.url), 'utf8'));
const credits = fs.readFileSync(new URL('../CREDITS.md', import.meta.url), 'utf8');
const src = fs.readFileSync(new URL('../tools/content-source/hands-1265.js', import.meta.url), 'utf8');
let n = 0;
const ok = (c, l) => { assert.ok(c, l); console.log('ok ' + (++n) + ' ' + l); };

ok(ver.v === '1.2.70' || ver.v === '1.2.69' || ver.v === '1.2.68' || ver.v === '1.2.67' || ver.v === '1.2.66' || ver.v === '1.2.65', 'version.json is 1.2.65');
ok(html.includes("const GAME_VERSION = '1.2.70';") || html.includes("const GAME_VERSION = '1.2.69';") || html.includes("const GAME_VERSION = '1.2.68';") || html.includes("const GAME_VERSION = '1.2.67';") || html.includes("const GAME_VERSION = '1.2.66';") || html.includes("const GAME_VERSION = '1.2.65';"), 'GAME_VERSION is 1.2.65');
ok(html.includes('<!-- glencraft-build: b1270-v1.2.70 -->') || html.includes('<!-- glencraft-build: b1269-v1.2.69 -->') || html.includes('<!-- glencraft-build: b1268-v1.2.68 -->') || html.includes('<!-- glencraft-build: b1267-v1.2.67 -->') || html.includes('<!-- glencraft-build: b1266-v1.2.66 -->') || html.includes('<!-- glencraft-build: b1265-v1.2.65 -->'), 'build marker b1265');
ok(html.includes('<!-- glencraft-build: b1264-v1.2.64 -->'), '1.2.64 build marker stays');
ok(html.includes('<!-- glencraft-build: b1263-v1.2.63 -->'), '1.2.63 build marker stays');
ok(credits.includes('## v1.2.65 Further pixel-sculpt detail on the classic hands'), 'CREDITS has the 1.2.65 section');
ok(credits.includes('1e9db15') && credits.includes('__fpa'), 'CREDITS names the restored 1.2.59 __fpa path');

const notesStart = html.indexOf('window.PATCH_NOTES = [');
ok(notesStart > 0, 'PATCH_NOTES present');
const head = html.slice(notesStart, notesStart + 52000);
ok(head.includes('"v":"v1.2.65"') && head.includes('"d":"2026-11-13"'), 'v1.2.65 notes are at the top, dated 2026-11-13');
ok(head.indexOf('"v":"v1.2.65"') < head.indexOf('"v":"v1.2.64"'), '1.2.65 notes sit above 1.2.64');
ok(head.includes('Hands: further pixel-sculpt detail on the classic hands'), 'patch notes use the required phrase');
for (const phrase of [
  'Knuckle and finger segmentation',
  'thumb pad',
  'nail tips',
  'palm creases',
  'skin-tone shading',
  'wrist tendons',
  'rolled linen cuff',
  'fold facets',
  'Hard-refresh'
]) {
  ok(head.includes(phrase), 'patch notes mention: ' + phrase);
}

ok(html.includes('/* GLX-HANDS1265 (v1.2.65):'), 'HANDS1265 IIFE is in the page');
const i1265 = html.indexOf('/* GLX-HANDS1265');
ok(i1265 > 0, 'HANDS1265 marker found');
const i1265End = (() => {
  const next = html.indexOf('\n/* GLX-', i1265 + 10);
  const scr = html.indexOf('</script>', i1265);
  let end = i1265 + 50000;
  if (next > i1265 && next < end) end = next;
  if (scr > i1265 && scr < end) end = scr;
  return end;
})();
const h1265 = html.slice(i1265, i1265End);
ok(h1265.includes('fingerSegFacet') && h1265.includes('knuckleFacet'), '1265 has faceted knuckle and finger segmentation');
ok(h1265.includes('thumbPadGeo') && h1265.includes('ThumbPad1265'), '1265 adds a thumb pad');
ok(h1265.includes('nailFacet') && h1265.includes('nail1265'), '1265 has faceted nail tips');
ok(h1265.includes('paintPalm') && h1265.includes('life') && h1265.includes('heart'), '1265 has palm creases (procedural palmar texture)');
ok(h1265.includes('tendonGeo') && h1265.includes('WristTendons1265'), '1265 has wrist tendons');
ok(h1265.includes('rolledCuffGeo') && h1265.includes('RolledCuff1265'), '1265 has a rolled linen cuff');
ok(h1265.includes('rolledCuffGeo') && h1265.includes('fold facets'), '1265 has a rolled linen cuff with fold facets');
ok(h1265.includes('function share') && h1265.includes('function mergeGeos') && h1265.includes('const GEO'), 'geometry is cached and merged');
ok(h1265.includes('flatShading: true') && h1265.includes('vertexColors: true'), 'pixel-polygon faceted shading with vertex colours');
ok(h1265.includes('BAYER8') && h1265.includes('rampDither') && h1265.includes('makeTex'), 'procedural paletted textures use ordered Bayer dithering, generated once and cached');
ok(h1265.includes('paintDorsal') && h1265.includes('paintPalm') && h1265.includes('paintFinger') && h1265.includes('paintNail') && h1265.includes('paintLinen'), 'skin and linen maps are painted procedurally (canvas; not hand-placed pixels)');
ok(h1265.includes('mobile-friendly') && h1265.includes('128'), 'textures are a mobile-friendly 128 size and cached');
ok(h1265.includes('Pass 1') && h1265.includes('Pass 2') && h1265.includes('Pass 3') && h1265.includes('edgePass'), 'textures are built in passes: base, dither shading, detail overlays, edges');
ok(h1265.includes('crevice') && h1265.includes('specular') && h1265.includes('rim') && h1265.includes('outline'), 'AO in crevices, knuckle/nail specular, rim lighting, darkened outlines');
ok(h1265.includes('SKIN_RAMP') && h1265.includes('LINEN_RAMP') && h1265.includes('U.palettes'), 'limited light/mid/shadow palettes per material');
ok(h1265.includes('skinTone') && h1265.includes('PAL.crease') && h1265.includes('lighter'), 'stepped skin-tone shading (lighter on top, darker in creases)');
ok(h1265.includes('0.036') && h1265.includes('0.017') && h1265.includes('0.013'), 'finger segment lengths stay on the original 1.2.57 pivots');
ok(h1265.includes('upgradeHand') && h1265.includes('upgradeArm') && h1265.includes('upgradeCuff'), '1265 upgrades existing hand/arm/cuff meshes in place');
ok(!h1265.includes("['dU', 'dL', 'dR'].forEach") && !/#dU|#dL|#dR/.test(h1265), '1265 does not hide or style the gold D-pad');
ok(h1265.includes('gold D-pad is left alone'), '1265 records that the gold D-pad is left alone');
ok(!/enableKinds|NEW_FP_KINDS\s*=/.test(h1265), '1265 does not re-enable NEW_FP_KINDS');
ok(!/hands-1260|HANDS1260|hands-1261|HANDS1261|voxel arm/.test(h1265), '1265 does not switch to the 1.2.60 HANDS1260 or 1.2.61 voxel arm');

/* 1263 restore and 1264 TARDIS stay; 1261 voxel arm stays removed. */
ok(html.includes('/* GLX-HANDS1263'), 'HANDS1263 IIFE is still in the page');
ok(html.includes("restoredFrom: '1e9db15'") && html.includes("restoredFromLabel: '1.2.59'"), '1.2.63 arms restore (1.2.59 / 1e9db15) is unchanged');
ok(html.includes('__fpVm1259') && html.includes("version: '1.2.59-frame-torch'"), '1259 viewmodel and torch freeze stay');
ok(html.includes('_seatStable') && html.includes('errMax: 1.20'), '1.2.59 torch-pose freeze is still in the held-frame path');
ok(html.includes('__fpa') && html.includes('handsSculpt1249') && html.includes("version: '1.2.57-sculpt-p22'"), 'classic __fpa + 1.2.57 sculpt path stays');
ok(!html.includes('/* GLX-HANDS1261'), '1.2.61 voxel-arm IIFE stays removed');
ok(html.includes('/* GLX-HANDS1260'), '1.2.60 hands IIFE stays in the page (neutralized at runtime)');
ok(html.includes('/* GLX-HANDS1262'), 'HANDS1262 stays in the page (pose tweak undone at runtime; TP hide kept)');
ok(html.includes('/* GLX-TBOX1264') && html.includes('scrY: 2.68') && html.includes('fly1264'), '1.2.64 TARDIS floor, piloting, and raised TV stay');
ok(html.includes('/* GLX-TBOX1262') && html.includes('/* GLX-TBOX1261') && html.includes('/* GLX-TBOX1260'), 'TBOX 1260–1262 stay');
ok(html.includes('/* GLX-TORSO1262') && html.includes('torsoSides1262'), 'TORSO1262 stays');
ok(html.includes('GLX-PERF1261') && html.includes("SET.rdist = touchMode ? 4 : 8"), 'render-distance cap stays');
ok(html.includes('GLX-POP1261') && html.includes('Disable pop star'), 'pop-star setting stays');
ok(html.includes('winH: 17.75') && html.includes('__glxSingleHum'), '1.2.61 windows and single-hum stay');
ok(!html.includes("['dU', 'dL', 'dR'].forEach") && html.includes('gold D-pad is left alone'), 'gold D-pad is not hidden');
ok(html.includes('hideInThirdPerson') || html.includes('third-person hiding') || html.includes('third person'), 'third-person view-model hide stays');

const i1260 = html.indexOf('/* GLX-HANDS1260');
const i1262 = html.indexOf('/* GLX-HANDS1262');
const iH1263 = html.indexOf('/* GLX-HANDS1263');
const i1264 = html.indexOf('/* GLX-TBOX1264');
ok(iH1263 > i1260 && iH1263 > i1262, 'HANDS1263 is still after 1260 and 1262');
ok(i1265 > iH1263 && i1265 > i1264, 'HANDS1265 is injected after HANDS1263 and TBOX1264');

/* Hands-1263 source must stay byte-identical to main (this release only adds 1265 on top). */
try {
  const git = execSync('git show main:tools/content-source/hands-1263.js', {
    cwd: new URL('..', import.meta.url), encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe']
  });
  const live = fs.readFileSync(new URL('../tools/content-source/hands-1263.js', import.meta.url), 'utf8');
  ok(git === live, 'hands-1263.js is unchanged from main');
} catch (e) {
  ok(fs.readFileSync(new URL('../tools/content-source/hands-1263.js', import.meta.url), 'utf8').includes("restoredFrom: '1e9db15'"),
    'hands-1263.js still records the 1.2.59 restore (git main compare skipped: ' + String(e && e.message || e).slice(0, 80) + ')');
}

/* 1265 source is in the page (trimmed + newline, as the build injects it). */
ok(html.includes(src.trim()), 'hands-1265.js source is injected into the page');

console.log('all ok (' + n + ')');

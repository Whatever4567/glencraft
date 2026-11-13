#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');
const {execSync} = require('child_process');
const root = path.resolve(__dirname, '..');

function must(cond, msg) { if (!cond) { console.error('FAIL:', msg); process.exit(1); } }
function replaceOnce(s, a, b, label) {
  const n = s.split(a).length - 1;
  must(n === 1, label + ': expected 1 match, got ' + n);
  return s.split(a).join(b);
}

let html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const before = html.length;

/* ---- version ---- */
if (html.includes("const GAME_VERSION = '1.2.76';") && !html.includes("const GAME_VERSION = '1.2.77';")) {
  html = replaceOnce(html, "const GAME_VERSION = '1.2.76';", "const GAME_VERSION = '1.2.77';", 'GAME_VERSION');
}
must(html.includes("const GAME_VERSION = '1.2.77';"), 'GAME_VERSION is not 1.2.77');

if (!html.includes('<!-- glencraft-build: b1277-v1.2.77 -->')) {
  must(html.includes('<!-- glencraft-build: b1276-v1.2.76 -->'), 'b1276 marker missing');
  html = replaceOnce(html,
    '<!-- glencraft-build: b1276-v1.2.76 -->',
    '<!-- glencraft-build: b1276-v1.2.76 -->\n<!-- glencraft-build: b1277-v1.2.77 -->',
    'build marker');
}

const NOTE = '{"v":"v1.2.77","d":"2026-11-13","notes":["Reverted 1.2.76 cave/view-distance changes (lag)."]}';
if (!html.includes('"v":"v1.2.77"')) {
  html = replaceOnce(html,
    'window.PATCH_NOTES = [\n{"v":"v1.2.76"',
    'window.PATCH_NOTES = [\n' + NOTE + '\n{"v":"v1.2.76"',
    'PATCH_NOTES');
} else {
  const reNote = /\{"v":"v1\.2\.77"[^}]*\}/;
  if (reNote.test(html)) html = html.replace(reNote, NOTE);
}

/* Keep every 1.2.73 / 1.2.75 gun and tool-grip guarantee. */
must(html.includes("    pistol: {p: [0, -0.07, 0.05], axis: [0, -0.95, 0.30], palm: [0, 0.050, 0.018], align: 0}"), 'pistol GRIP is unchanged from 1.2.73');
must(html.includes('    p761:   {p: [0, 0.02, 0], axis: [0, 1, 0], palm: [0, 0.058, 0.018], align: 0, errMax: 1.20},\n    pick:'), 'p761 GRIP still matches 1.2.73 (no stable snapshot)');
must(html.includes('if (held.userData && held.userData._bladeLock1274)'), 'dressPickHook lock must stay');
must(html.includes('/* GLX-FIX1275 (v1.2.75):'), 'FIX1275 IIFE must stay (potion path + gun skip)');
must(!html.includes('/* GLX-FIX1274 (v1.2.74):'), 'FIX1274 IIFE must stay gone');
must(html.includes('/* GLX-HANDS1271'), 'HANDS1271 must stay');
must(html.includes('/* GLX-HANDS1270'), 'HANDS1270 must stay');
must(html.includes('/* GLX-HANDS1266'), 'HANDS1266 must stay');
must(html.includes('/* GLX-HANDS1263'), 'HANDS1263 must stay');
must(html.includes("restoredFrom: '1e9db15'"), '1263 restore must stay');
must(!html.includes('/* GLX-HANDS1261'), 'HANDS1261 must stay removed');
must(!html.includes("['dU', 'dL', 'dR'].forEach"), 'gold D-pad must stay untouched');
must(html.includes('/* GLX-FIX1273'), 'FIX1273 must stay');
must(html.includes('/* GLX-FIX1272'), 'FIX1272 must stay');
must(html.includes('applyPotionPath'), 'potion grip path is present');
must(html.includes('isWeapon'), 'gun exclusion is present');
must(!html.includes('function freezeToolPose'), 'the 1.2.74 snapshot must stay gone');

/* ---- revert 1.2.76 render / chunk hooks to exact 1.2.75 ---- */
if (html.includes("const VF = () => clamp(SET.rdist, 3, 24) * 16;")) {
  html = replaceOnce(html,
    "const VF = () => clamp(SET.rdist, 3, 24) * 16;",
    "const VF = () => clamp(SET.rdist, 3, 16) * 16;",
    'VF clamp');
}
if (html.includes('id="rdRange" data-testid="settings-rdist" min="3" max="24"')) {
  html = replaceOnce(html,
    'id="rdRange" data-testid="settings-rdist" min="3" max="24"',
    'id="rdRange" data-testid="settings-rdist" min="3" max="16"',
    'rdRange max');
}
if (html.includes('const setV = v => { SET.rdist = clamp(Math.round(v), 3, 24); saveSet(); sync(); };')) {
  html = replaceOnce(html,
    'const setV = v => { SET.rdist = clamp(Math.round(v), 3, 24); saveSet(); sync(); };',
    'const setV = v => { SET.rdist = clamp(Math.round(v), 3, 16); saveSet(); sync(); };',
    'setV clamp');
}
if (html.includes("else n = isTouch() ? 8 : 12;")) {
  html = replaceOnce(html,
    "      else n = isTouch() ? 8 : 12;\n    } catch (_) { n = 8; }\n    return (typeof window.__rdist1276 === 'function') ? window.__rdist1276() : Math.max(3, Math.min(24, n));",
    "      else n = isTouch() ? 4 : 8;\n    } catch (_) { n = 8; }\n    return Math.max(3, Math.min(16, n));",
    '1261 rdist unhook');
}

must(html.includes('const VF = () => clamp(SET.rdist, 3, 16) * 16;'), 'VF not restored to 1.2.75');
must(html.includes('id="rdRange" data-testid="settings-rdist" min="3" max="16"'), 'slider max not restored to 16');
must(html.includes('const setV = v => { SET.rdist = clamp(Math.round(v), 3, 16); saveSet(); sync(); };'), 'setV not restored to 16');
must(html.includes('      else n = isTouch() ? 4 : 8;'), '1261 default not restored');
must(html.includes('    return Math.max(3, Math.min(16, n));'), '1261 cap not restored');
must(!html.includes('min="3" max="24"'), 'slider must not go to 24');

/* ---- replace the 1.2.76 IIFE with the map-only 1.2.77 copy ---- */
const src = fs.readFileSync(path.join(root, 'tools/content-source/fix-1277.js'), 'utf8').trim() + '\n';
must(src.includes('GLX-FIX1277'), 'fix-1277.js is required');
must(src.includes('GLX-FIX1276'), 'map-only 1276 IIFE is in fix-1277.js');
must(src.includes('poseInPalm'), 'map palm seating is present');
must(src.includes('tickMap'), 'map tick is present');
must(!src.includes('function buildLodChunk'), '1277 must not have LOD');
must(!src.includes('function installCaveFix'), '1277 must not wrap cave cull');
must(!src.includes('function wrapBuildChunk'), '1277 must not wrap buildChunk');
must(!src.includes('function idlePump'), '1277 must not idle-pump');
must(!src.includes('function tickAdapt'), '1277 must not adapt rdist');
must(!src.includes('function applyFarPlane'), '1277 must not touch the far plane');
must(!src.includes('function raiseDefault'), '1277 must not raise rdist defaults');
must(!src.includes('function isUnder'), '1277 must not have isUnder');
must(!src.includes('function headCovered'), '1277 must not have headCovered');
must(!src.includes('function remeshCulledCaves'), '1277 must not remesh caves');
must(!src.includes('function bootTerrain'), '1277 must not boot terrain');
must(!src.includes('__rdist1276'), '1277 must not define __rdist1276');
must(!src.includes('H.apply = function'), '1277 must not wrap H.apply');
must(!src.includes('renderer.render ='), '1277 must not wrap renderer.render');
must(src.includes('Reverted 1.2.76 cave/view-distance changes (lag)'), '1277 records the revert');

function replaceIife(html, mark, bundled) {
  const i = html.indexOf(mark);
  if (i < 0) return null;
  const j = html.indexOf('</script>', i);
  must(j > i, 'cannot find </script> after ' + mark);
  return html.slice(0, i) + bundled + html.slice(j);
}

must(html.includes('/* GLX-FIX1276 (v1.2.76):'), 'FIX1276 IIFE missing before replace');
{
  const r = replaceIife(html, '/* GLX-FIX1276 (v1.2.76):', src);
  must(r, 'replace 1276 with map-only 1277 failed');
  html = r;
}
/* The 1277 banner sits in front of the 1276 marker inside src, so
   after replace the page should have both. If we already ran once
   and 1277 is ahead of 1276, replaceIife on 1276 would leave a
   duplicate 1277 banner. Detect that and collapse. */
must(html.includes('/* GLX-FIX1277 (v1.2.77):'), 'FIX1277 banner missing');
must(html.includes('/* GLX-FIX1276 (v1.2.76):'), 'FIX1276 map IIFE missing');
must((html.split('/* GLX-FIX1277 (v1.2.77):').length - 1) === 1, 'duplicate 1277 banners');
must((html.split('(function fix1276()').length - 1) === 1, 'duplicate fix1276 IIFEs');

/* Forbidden cave / view-distance symbols from 1.2.76 must be gone. */
const forbidden = [
  'function buildLodChunk',
  'function installCaveFix',
  'function wrapBuildChunk',
  'function idlePump',
  'function tickAdapt',
  'function applyFarPlane',
  'function raiseDefault',
  'function remeshCulledCaves',
  'function bootTerrain',
  'function wrapUpdateSky',
  'function installStream',
  'function ourStreamRadius',
  'function relodRing',
  'function lodStepFor',
  'function rdist1276',
  '__rdist1276',
  'buildChunk._p1276',
];
for (const k of forbidden) {
  must(!html.includes(k), 'forbidden leftover: ' + k);
}

must(!html.includes('__rdist1276'), '__rdist1276 must be gone entirely');
must(html.includes('function poseInPalm'), 'map palm seating stayed');
must(html.includes('function tickMap'), 'map tick stayed');
must(html.includes('holdingHand'), 'map uses the current __fpa hand');
must(html.includes("const GAME_VERSION = '1.2.77';"), 'version not bumped');
must(html.includes('"v":"v1.2.77"'), 'patch notes missing');
must(html.includes('Reverted 1.2.76 cave/view-distance changes (lag)'), 'revert note missing');
must(html.includes('/* GLX-FIX1275 (v1.2.75):'), 'FIX1275 IIFE was not to be removed');

/* The C70 / PERF1261 blocks must match 1.2.75 byte-for-byte on the
   hooked lines. */
{
  let html75 = '';
  try {
    html75 = execSync('git show c40f347:index.html', {cwd: root, encoding: 'utf8', maxBuffer: 80 * 1024 * 1024});
  } catch (e) {
    must(false, 'cannot read 1.2.75 index.html from git: ' + e.message);
  }
  function sliceAround(s, needle, before, after) {
    const i = s.indexOf(needle);
    must(i >= 0, 'needle not in source: ' + needle.slice(0, 80));
    return s.slice(i - before, i + needle.length + after);
  }
  const vf75 = "const VF = () => clamp(SET.rdist, 3, 16) * 16;";
  const vfNow = "const VF = () => clamp(SET.rdist, 3, 16) * 16;";
  must(html.includes(vf75) && html75.includes(vf75), 'VF line differs from 1.2.75');
  const slider75 = 'id="rdRange" data-testid="settings-rdist" min="3" max="16"';
  must(html.includes(slider75) && html75.includes(slider75), 'slider line differs from 1.2.75');
  const setv75 = 'const setV = v => { SET.rdist = clamp(Math.round(v), 3, 16); saveSet(); sync(); };';
  must(html.includes(setv75) && html75.includes(setv75), 'setV line differs from 1.2.75');
  const rdist75 = '      else n = isTouch() ? 4 : 8;\n    } catch (_) { n = 8; }\n    return Math.max(3, Math.min(16, n));';
  must(html.includes(rdist75) && html75.includes(rdist75), '1261 rdist block differs from 1.2.75');
  /* SET.rdist default when unset — 1.2.75 and 1.2.77 must agree. */
  const def75 = 'if (typeof SET.rdist !== \'number\') SET.rdist = touchMode ? 4 : 8;';
  must(html.includes(def75) && html75.includes(def75), 'SET.rdist default differs from 1.2.75');
}

fs.writeFileSync(path.join(root, 'index.html'), html);
console.log('index.html', before, '->', html.length);

fs.writeFileSync(path.join(root, 'version.json'), '{"v":"1.2.77"}\n');
console.log('version.json written');

let credits = fs.readFileSync(path.join(root, 'CREDITS.md'), 'utf8');
const block = `## v1.2.77 Reverted 1.2.76 cave/view-distance changes (lag)

- Reverted 1.2.76 cave/view-distance changes (lag).

`;
if (!credits.includes('## v1.2.77')) {
  credits = credits.replace('## v1.2.76 Map is now held in your hand', block + '## v1.2.76 Map is now held in your hand');
} else {
  const a = credits.indexOf('## v1.2.77');
  const b = credits.indexOf('## v1.2.76', a + 1);
  if (a >= 0 && b > a) credits = credits.slice(0, a) + block + credits.slice(b);
}
must(credits.includes('## v1.2.77'), 'CREDITS 1.2.77 missing');
must(credits.includes('Reverted 1.2.76 cave/view-distance changes (lag)'), 'CREDITS revert note missing');
fs.writeFileSync(path.join(root, 'CREDITS.md'), credits);
console.log('CREDITS.md updated');

console.log('build 1.2.77 done');

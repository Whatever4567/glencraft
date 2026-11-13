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
if (html.includes("const GAME_VERSION = '1.2.77';") && !html.includes("const GAME_VERSION = '1.2.78';")) {
  html = replaceOnce(html, "const GAME_VERSION = '1.2.77';", "const GAME_VERSION = '1.2.78';", 'GAME_VERSION');
}
must(html.includes("const GAME_VERSION = '1.2.78';"), 'GAME_VERSION is not 1.2.78');

if (!html.includes('<!-- glencraft-build: b1278-v1.2.78 -->')) {
  must(html.includes('<!-- glencraft-build: b1277-v1.2.77 -->'), 'b1277 marker missing');
  html = replaceOnce(html,
    '<!-- glencraft-build: b1277-v1.2.77 -->',
    '<!-- glencraft-build: b1277-v1.2.77 -->\n<!-- glencraft-build: b1278-v1.2.78 -->',
    'build marker');
}

const NOTE = '{"v":"v1.2.78","d":"2026-11-13","notes":["Less lag: rain, drops, animations and mobs only run near you.","Ores get more common the deeper you go; diamonds common near y -200.","Removed obsidian/gold portal blocks from deep caves."]}';
if (!html.includes('"v":"v1.2.78"')) {
  html = replaceOnce(html,
    'window.PATCH_NOTES = [\n{"v":"v1.2.77"',
    'window.PATCH_NOTES = [\n' + NOTE + '\n{"v":"v1.2.77"',
    'PATCH_NOTES');
} else {
  const reNote = /\{"v":"v1\.2\.78"[^]*?\}/;
  /* non-greedy object — notes contain no raw } besides the end. Use a safer slice. */
  const i = html.indexOf('{"v":"v1.2.78"');
  must(i >= 0, 'v1.2.78 note present but not found for replace');
  const j = html.indexOf('\n{"v":"v1.2.77"', i);
  must(j > i, 'cannot find 1.2.77 note after 1.2.78');
  html = html.slice(0, i) + NOTE + html.slice(j);
}

/* Keep every 1.2.73 / 1.2.75 gun and tool-grip guarantee, and the 1.2.77 revert. */

/* 1.2.74–1.2.77 notes were inserted without commas, which is a
   SyntaxError and would stop this script (and the 1.2.78 IIFE) from
   running. Restore commas between adjacent entries. */
{
  const start = html.indexOf('window.PATCH_NOTES = [');
  const end = html.indexOf('\n];', start);
  must(start >= 0 && end > start, 'PATCH_NOTES array not found');
  const arr = html.slice(start, end);
  const fixed = arr.replace(/\}\n\{/g, '},\n{');
  html = html.slice(0, start) + fixed + html.slice(end);
  must(!/\}\n\{/.test(html.slice(html.indexOf('window.PATCH_NOTES = ['), html.indexOf('\n];', html.indexOf('window.PATCH_NOTES = [')))), 'PATCH_NOTES still missing commas');
}

must(html.includes("    pistol: {p: [0, -0.07, 0.05], axis: [0, -0.95, 0.30], palm: [0, 0.050, 0.018], align: 0}"), 'pistol GRIP is unchanged from 1.2.73');
must(html.includes('    p761:   {p: [0, 0.02, 0], axis: [0, 1, 0], palm: [0, 0.058, 0.018], align: 0, errMax: 1.20},\n    pick:'), 'p761 GRIP still matches 1.2.73');
must(html.includes('if (held.userData && held.userData._bladeLock1274)'), 'dressPickHook lock must stay');
must(html.includes('/* GLX-FIX1275 (v1.2.75):'), 'FIX1275 IIFE must stay (potion path + gun skip)');
must(html.includes('/* GLX-FIX1277 (v1.2.77):'), 'FIX1277 revert IIFE must stay');
must(html.includes('/* GLX-FIX1276 (v1.2.76):'), 'FIX1276 map IIFE must stay');
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

/* 1.2.75 / 1.2.77 render + chunk lines must stay. */
must(html.includes('const VF = () => clamp(SET.rdist, 3, 16) * 16;'), 'VF not 1.2.75');
must(html.includes('id="rdRange" data-testid="settings-rdist" min="3" max="16"'), 'slider max not 16');
must(html.includes('const setV = v => { SET.rdist = clamp(Math.round(v), 3, 16); saveSet(); sync(); };'), 'setV not 16');
must(html.includes('      else n = isTouch() ? 4 : 8;'), '1261 default not 4 / 8');
must(html.includes('    return Math.max(3, Math.min(16, n));'), '1261 cap not 16');
must(!html.includes('min="3" max="24"'), 'slider must not go to 24');
must(!html.includes('__rdist1276'), '__rdist1276 must stay gone');

/* ---- inject 1.2.78 IIFE just before the closing script tag ---- */
const src = fs.readFileSync(path.join(root, 'tools/content-source/fix-1278.js'), 'utf8').trim() + '\n';
must(src.includes('GLX-FIX1278'), 'fix-1278.js is required');
must(src.includes('SPAWN_RADIUS = 100'), 'SPAWN_RADIUS=100');
must(src.includes('DESPAWN_RADIUS = 150'), 'DESPAWN_RADIUS=150');
must(src.includes('ORE_DEPTH_MIN = 0'), 'ORE_DEPTH_MIN=0');
must(src.includes('ORE_DEPTH_MAX = -236'), 'ORE_DEPTH_MAX=-236');
must(src.includes('DIAMOND_PEAK_Y = -200'), 'DIAMOND_PEAK_Y=-200');
must(src.includes('Less lag: rain, drops, animations and mobs only run near you'), 'lag note in source');
must(src.includes('Removed obsidian/gold portal blocks from deep caves'), 'portal note in source');
must(src.includes('Ores get more common the deeper you go; diamonds common near y -200'), 'ore note in source');
must(!src.includes('H.apply = function'), '1278 must not wrap H.apply');
must(!src.includes('H.repose = function'), '1278 must not wrap H.repose');
must(!src.includes('renderer.render ='), '1278 must not wrap renderer.render');
must(!src.includes('function wrapBuildChunk'), '1278 must not wrap buildChunk');
must(!src.includes('__rdist1276'), '1278 must not define __rdist1276');
must(!src.includes('function buildLodChunk'), '1278 must not have LOD');
must(!src.includes('function applyFarPlane'), '1278 must not touch the far plane');
must(!src.includes('function raiseDefault'), '1278 must not raise rdist defaults');
must(!src.includes('function poseInPalm'), '1278 leaves the map grip alone');
must(!src.includes("['dU', 'dL', 'dR'].forEach"), '1278 must not touch the gold D-pad');

function injectIife(html, bundled) {
  if (html.includes('/* GLX-FIX1278 (v1.2.78):')) {
    const i = html.indexOf('/* GLX-FIX1278 (v1.2.78):');
    const j = html.indexOf('</script>', i);
    must(j > i, 'cannot find </script> after 1278');
    return html.slice(0, i) + bundled + html.slice(j);
  }
  const j = html.lastIndexOf('</script>');
  must(j > 0, 'cannot find closing script tag');
  must(html.lastIndexOf('/* GLX-FIX1277 (v1.2.77):') < j, '1277 is not in the last script');
  return html.slice(0, j) + bundled + html.slice(j);
}
html = injectIife(html, src);

must(html.includes('/* GLX-FIX1278 (v1.2.78):'), 'FIX1278 banner missing');
must((html.split('/* GLX-FIX1278 (v1.2.78):').length - 1) === 1, 'duplicate 1278 banners');
must((html.split('(function fix1278()').length - 1) === 1, 'duplicate fix1278 IIFEs');
must(html.includes('/* GLX-FIX1277 (v1.2.77):'), 'FIX1277 stayed');
must(html.includes('/* GLX-FIX1276 (v1.2.76):'), 'FIX1276 map IIFE stayed');
must(html.includes("const GAME_VERSION = '1.2.78';"), 'version not bumped');
must(html.includes('"v":"v1.2.78"'), 'patch notes missing');
must(html.includes('Less lag: rain, drops, animations and mobs only run near you'), 'lag patch note missing');
must(html.includes('Ores get more common the deeper you go; diamonds common near y -200'), 'ore patch note missing');
must(html.includes('Removed obsidian/gold portal blocks from deep caves'), 'portal patch note missing');
must(html.includes('const SPAWN_RADIUS = 100'), 'SPAWN_RADIUS in page');
must(html.includes('const DESPAWN_RADIUS = 150'), 'DESPAWN_RADIUS in page');
must(html.includes('const DIAMOND_PEAK_Y = -200'), 'DIAMOND_PEAK_Y in page');

/* Forbidden cave / view-distance symbols from 1.2.76 must stay gone. */
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

/* The C70 / PERF1261 blocks must still match 1.2.75. */
{
  let html75 = '';
  try {
    html75 = execSync('git show c40f347:index.html', {cwd: root, encoding: 'utf8', maxBuffer: 80 * 1024 * 1024});
  } catch (e) {
    must(false, 'cannot read 1.2.75 index.html from git: ' + e.message);
  }
  const vf75 = "const VF = () => clamp(SET.rdist, 3, 16) * 16;";
  must(html.includes(vf75) && html75.includes(vf75), 'VF line differs from 1.2.75');
  const slider75 = 'id="rdRange" data-testid="settings-rdist" min="3" max="16"';
  must(html.includes(slider75) && html75.includes(slider75), 'slider line differs from 1.2.75');
  const setv75 = 'const setV = v => { SET.rdist = clamp(Math.round(v), 3, 16); saveSet(); sync(); };';
  must(html.includes(setv75) && html75.includes(setv75), 'setV line differs from 1.2.75');
  const rdist75 = '      else n = isTouch() ? 4 : 8;\n    } catch (_) { n = 8; }\n    return Math.max(3, Math.min(16, n));';
  must(html.includes(rdist75) && html75.includes(rdist75), '1261 rdist block differs from 1.2.75');
  const def75 = 'if (typeof SET.rdist !== \'number\') SET.rdist = touchMode ? 4 : 8;';
  must(html.includes(def75) && html75.includes(def75), 'SET.rdist default differs from 1.2.75');
}

fs.writeFileSync(path.join(root, 'index.html'), html);
console.log('index.html', before, '->', html.length);

fs.writeFileSync(path.join(root, 'version.json'), '{"v":"1.2.78"}\n');
console.log('version.json written');

let credits = fs.readFileSync(path.join(root, 'CREDITS.md'), 'utf8');
const block = `## v1.2.78 Less lag, deeper ores, no deep-cave portals

- Less lag: rain, drops, animations and mobs only run near you.
- Ores get more common the deeper you go; diamonds common near y -200.
- Removed obsidian/gold portal blocks from deep caves.

`;
if (!credits.includes('## v1.2.78')) {
  must(credits.includes('## v1.2.77'), 'CREDITS 1.2.77 missing as insert point');
  credits = credits.replace('## v1.2.77 Reverted 1.2.76 cave/view-distance changes (lag)', block + '## v1.2.77 Reverted 1.2.76 cave/view-distance changes (lag)');
} else {
  const a = credits.indexOf('## v1.2.78');
  const b = credits.indexOf('## v1.2.77', a + 1);
  if (a >= 0 && b > a) credits = credits.slice(0, a) + block + credits.slice(b);
}
must(credits.includes('## v1.2.78'), 'CREDITS 1.2.78 missing');
must(credits.includes('Less lag: rain, drops, animations and mobs only run near you'), 'CREDITS lag note missing');
must(credits.includes('Ores get more common the deeper you go; diamonds common near y -200'), 'CREDITS ore note missing');
must(credits.includes('Removed obsidian/gold portal blocks from deep caves'), 'CREDITS portal note missing');
fs.writeFileSync(path.join(root, 'CREDITS.md'), credits);
console.log('CREDITS.md updated');

console.log('build 1.2.78 done');

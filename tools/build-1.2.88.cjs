#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');

function must(cond, msg) { if (!cond) { console.error('FAIL:', msg); process.exit(1); } }
function replaceOnce(s, a, b, label) {
  const n = s.split(a).length - 1;
  must(n === 1, label + ': expected 1 match, got ' + n);
  return s.split(a).join(b);
}

let html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

// Keep the 1-line sculpt-1282 pin inlined with the source file.
if (!html.includes('R.userData.sculpt1282 = 1')) {
  html = replaceOnce(html,
    '      R.updateMatrixWorld.__sculpt1282 = 1;\n      U.hook++;',
    '      R.updateMatrixWorld.__sculpt1282 = 1;\n      R.userData.sculpt1282 = 1;\n      U.hook++;',
    'sculpt1282 userData pin');
}

if (html.includes("const GAME_VERSION = '1.2.87';") && !html.includes("const GAME_VERSION = '1.2.88';")) {
  html = replaceOnce(html, "const GAME_VERSION = '1.2.87';", "const GAME_VERSION = '1.2.88';", 'GAME_VERSION');
}
must(html.includes("const GAME_VERSION = '1.2.88';"), 'GAME_VERSION is not 1.2.88');
must(!html.includes("const GAME_VERSION = '1.2.87';"), 'GAME_VERSION is no longer 1.2.87');

if (!html.includes('<!-- glencraft-build: b1288-v1.2.88 -->')) {
  must(html.includes('<!-- glencraft-build: b1287-v1.2.87 -->'), 'b1287 marker missing');
  html = replaceOnce(html,
    '<!-- glencraft-build: b1287-v1.2.87 -->',
    '<!-- glencraft-build: b1287-v1.2.87 -->\n<!-- glencraft-build: b1288-v1.2.88 -->',
    'build marker');
}

const NOTE = '{"v":"v1.2.88","d":"2026-11-16","notes":["First-person hands are clearer now: the same smooth glove as in third person, with shading for knuckles, tendons, creases and nails instead of blocky pieces. Your own third-person arms stay hidden only from your first-person camera, so they no longer peek into view.","The loading bar keeps moving even while the world is being built, so it never looks frozen."]},';
if (!html.includes('"v":"v1.2.88"')) {
  html = replaceOnce(html,
    'window.PATCH_NOTES = [\n{"v":"v1.2.87"',
    'window.PATCH_NOTES = [\n' + NOTE + '\n{"v":"v1.2.87"',
    'PATCH_NOTES');
} else {
  const i = html.indexOf('{"v":"v1.2.88"');
  const j = html.indexOf('\n{"v":"v1.2.87"', i);
  must(i >= 0 && j > i, 'cannot re-place 1.2.88 note');
  html = html.slice(0, i) + NOTE + html.slice(j);
}

must(html.includes('/* GLX-LOAD1285') && html.includes('<!-- glencraft-build: load1285 -->') && html.includes('liquid1285'), 'liquid loading bar is in the build');
must(html.includes("version: 'load-1288'"), 'load-1288 runtime is in the build');
must(html.includes('will-change:transform') && html.includes('transform:scaleX(0)') && html.includes('function startFillAnim'), 'compositor scaleX fill animation is in the build');
must(html.includes('load1288shine') && html.includes('translateX(-120%)') && html.includes('translateX(280%)'), 'compositor shimmer is in the build');
must(html.includes('function timeCurve') && html.includes('TIMED_AT_T = 97') && html.includes('TIMED_CAP = 99'), 'time-curve fill is in the build');
must(html.includes('8 * (dt / 1000)') && html.includes('TIMED_CAP'), 'hitch catch-up is capped at 8%/s');
must(html.includes('<!-- glencraft-build: perf1286 -->') && html.includes('(function perf1286(WIN)'), 'perf1286 is in the build');
must((html.split('(function perf1286(WIN)').length - 1) === 1, 'one perf1286');
must(!/if \(!R\.updateMatrixWorld\.__sculpt128[0-2]\)/.test(html), 'no function-flag sculpt guards left');
for (const n of [1280, 1281, 1282]) {
  must((html.split('if (!WRAPPED' + n + '.has(R))').length - 1) === 1, 'sculpt' + n + ' wraps once per rig');
}
must(html.includes("const n0 = RECIPES.length; recipes(); if (RECIPES.length !== n0)"), 'craft grid rebuilt only on a real recipe change');
must(html.includes('/* GLX-PERF1286'), 'GLX-PERF1286 runtime');

must(html.includes('/* GLX-SCULPT1280'), 'SCULPT1280 is in the build');
must(html.includes('/* GLX-SCULPT1281'), 'SCULPT1281 is in the build');
must(html.includes('/* GLX-SCULPT1282'), 'SCULPT1282 is in the build');
must(html.includes('R.userData.sculpt1282 = 1'), 'sculpt1282 userData pin is in the build');
must(html.includes('GLX-PERF1282') && html.includes('_fresh1282 = 1;'), 'cullVm perf fix is in the build');
must(html.includes('hideArtefactsOnce'), 'sculpt1281 once-per-frame scan');
must(html.includes('__torso1282') && html.includes('KILT_FP: 1') && html.includes('V1SIDES: 1') && html.includes('ARM_FP: 1'), 'torso FP-only hide, v1 sides, and FP-only TP arm hide');
must((html.split('(function sculpt1280()').length - 1) === 1, 'one sculpt1280');
must((html.split('(function sculpt1281()').length - 1) === 1, 'one sculpt1281');
must((html.split('(function sculpt1282()').length - 1) === 1, 'one sculpt1282');
must(html.includes("version: '1.2.59-frame-torch'"), 'torch jitter frame marker stays');
must(html.includes('/* GLX-FIX1279 (v1.2.79):'), 'FIX1279 stays');
must(html.includes('<!-- glencraft-build: b1287-v1.2.87 -->'), '1.2.87 marker stays');
must(html.includes('<!-- glencraft-build: b1286-v1.2.86 -->'), '1.2.86 marker stays');
must(html.includes('<!-- glencraft-build: b1285-v1.2.85 -->'), '1.2.85 marker stays');
must(html.includes('<!-- glencraft-build: b1284-v1.2.84 -->'), '1.2.84 marker stays');
must(html.includes('<!-- glencraft-build: b1283-v1.2.83 -->'), '1.2.83 marker stays');
must(html.includes("+ '|t1264clip'") && !html.includes("prev.customProgramCacheKey() : '') + 't1264clip'"), 'tartan cache-key fix');
must(html.includes('/* GLX-HANDSTP1282'), 'TP hands');
must(html.includes('/* GLX-HANDSFP1285') && html.includes('__handsFp1285'), 'FP hands 1.2.85');
must(html.includes('prism: 0') && html.includes('cuffFolds: 0'), 'FP prism pieces stay hidden');
must(html.includes('/* GLX-HANDS1266') && html.includes('/* GLX-HANDS1271') && html.includes('const U = window.__fpa'), 'fpa sculpt chain stays');
must(html.includes('function hideSashBack(') && html.includes('SASH_BACK: 1'), 'sash-back hide stays');
must(html.includes('WIDEN: 0') && html.includes('FILL_GLOW: 0') && html.includes('BRIDGE: 0'), 'stitched bridges, glow and widen off');
must(html.includes('SHIRT_|_sewn_torso_with_open_throat'), 'v1 source mesh name embedded');
must(html.includes('<!-- glencraft-build: b1279-v1.2.79 -->'), '1.2.79 marker stays');
{
  const st = html.indexOf('{"v":"v1.2.88"');
  const en = html.indexOf('{"v":"v1.2.87"', st);
  must(st >= 0 && en > st, '1.2.88 note range');
  must(!/haggis|food|sausage|pie\b|bread|meat|stew/i.test(html.slice(st, en)), '1.2.88 notes have no food');
  must(/First-person hands are clearer now/i.test(html.slice(st, en)), '1.2.88 notes mention improved first-person hands');
  must(/never looks frozen/i.test(html.slice(st, en)), '1.2.88 notes mention the loading bar that never looks frozen');
}
must(!/\}\n\{/.test(html.slice(html.indexOf('window.PATCH_NOTES = ['), html.indexOf('\n];', html.indexOf('window.PATCH_NOTES = [')))), 'PATCH_NOTES still missing commas');

const hands = fs.readFileSync(path.join(root, 'tools/content-source/hands-fp-1285.js'), 'utf8');
const torso = fs.readFileSync(path.join(root, 'tools/content-source/torso-1262.js'), 'utf8');
const load = fs.readFileSync(path.join(root, 'tools/content-source/loading-1285.js'), 'utf8');
const s0 = fs.readFileSync(path.join(root, 'tools/content-source/sculpt-1280.js'), 'utf8');
const s2 = fs.readFileSync(path.join(root, 'tools/content-source/sculpt-1282.js'), 'utf8');
must(html.includes(hands.trim()), 'hands-fp-1285 source is inlined');
must(html.includes(torso.trim()), 'torso-1262 source is inlined');
must(html.includes(load.trim()), 'loading-1285 source is inlined');
must(html.includes(s0.trim()), 'sculpt-1280 source is inlined');
must(html.includes(s2.trim()), 'sculpt-1282 source is inlined');

fs.writeFileSync(path.join(root, 'index.html'), html);
fs.writeFileSync(path.join(root, 'version.json'), '{"v":"1.2.88"}\n');

let credits = fs.readFileSync(path.join(root, 'CREDITS.md'), 'utf8');
if (!credits.includes('## v1.2.88')) {
  must(credits.includes('## v1.2.87 Loading bar'), 'CREDITS 1.2.87 heading missing');
  credits = replaceOnce(credits,
    '## v1.2.87 Loading bar',
    '## v1.2.88 First-person hands and loading bar\n\n- First-person hands use the smooth third-person glove mesh with knuckles, tendons, creases and nails shaded into the skin. The older blocky prism pieces stay in the mesh but are hidden. Local third-person arms and gloves are hidden in the first-person camera only; nothing is deleted.\n- The loading bar\'s fill and shimmer run on the compositor, so the meter keeps moving during long tasks instead of looking frozen. The percent label still counts up from elapsed time and glides to 100 when the world is ready.\n\n## v1.2.87 Loading bar',
    'CREDITS');
  fs.writeFileSync(path.join(root, 'CREDITS.md'), credits);
}

must(JSON.parse(fs.readFileSync(path.join(root, 'version.json'), 'utf8')).v === '1.2.88', 'version.json write');
console.log('build 1.2.88 ok, index bytes', html.length);

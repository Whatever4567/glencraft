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

if (html.includes("const GAME_VERSION = '1.2.85';") && !html.includes("const GAME_VERSION = '1.2.86';")) {
  html = replaceOnce(html, "const GAME_VERSION = '1.2.85';", "const GAME_VERSION = '1.2.86';", 'GAME_VERSION');
}
must(html.includes("const GAME_VERSION = '1.2.86';"), 'GAME_VERSION is not 1.2.86');
must(!html.includes("const GAME_VERSION = '1.2.85';"), 'GAME_VERSION is no longer 1.2.85');

if (!html.includes('<!-- glencraft-build: b1286-v1.2.86 -->')) {
  must(html.includes('<!-- glencraft-build: b1285-v1.2.85 -->'), 'b1285 marker missing');
  html = replaceOnce(html,
    '<!-- glencraft-build: b1285-v1.2.85 -->',
    '<!-- glencraft-build: b1285-v1.2.85 -->\n<!-- glencraft-build: b1286-v1.2.86 -->',
    'build marker');
}

const NOTE = '{"v":"v1.2.86","d":"2026-11-16","notes":["The game runs more smoothly. First-person arm movement no longer piles up extra work while you play, and the crafting grid isn\'t rebuilt over and over.","When the game is under strain it eases off a little — slightly softer pixels, and a slightly closer view of the world — so it can stay closer to your screen\'s refresh rate, then puts the extras back when there\'s headroom. There is no frame-rate cap."]},';
if (!html.includes('"v":"v1.2.86"')) {
  html = replaceOnce(html,
    'window.PATCH_NOTES = [\n{"v":"v1.2.85"',
    'window.PATCH_NOTES = [\n' + NOTE + '\n{"v":"v1.2.85"',
    'PATCH_NOTES');
} else {
  const i = html.indexOf('{"v":"v1.2.86"');
  const j = html.indexOf('\n{"v":"v1.2.85"', i);
  must(i >= 0 && j > i, 'cannot re-place 1.2.86 note');
  html = html.slice(0, i) + NOTE + html.slice(j);
}

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
must(html.includes('GLX-PERF1282') && html.includes('_fresh1282 = 1;'), 'cullVm perf fix is in the build');
must(html.includes('hideArtefactsOnce'), 'sculpt1281 once-per-frame scan');
must(html.includes('__torso1282') && html.includes('KILT_FP: 1') && html.includes('V1SIDES: 1'), 'torso FP-only hide and v1 sides');
must((html.split('(function sculpt1280()').length - 1) === 1, 'one sculpt1280');
must((html.split('(function sculpt1281()').length - 1) === 1, 'one sculpt1281');
must(html.includes("version: '1.2.59-frame-torch'"), 'torch jitter frame marker stays');
must(html.includes('/* GLX-FIX1279 (v1.2.79):'), 'FIX1279 stays');
must(html.includes('<!-- glencraft-build: b1285-v1.2.85 -->'), '1.2.85 marker stays');
must(html.includes('<!-- glencraft-build: b1284-v1.2.84 -->'), '1.2.84 marker stays');
must(html.includes('<!-- glencraft-build: b1283-v1.2.83 -->'), '1.2.83 marker stays');
must(html.includes("+ '|t1264clip'") && !html.includes("prev.customProgramCacheKey() : '') + 't1264clip'"), 'tartan cache-key fix');
must(html.includes('/* GLX-HANDSTP1282'), 'TP hands');
must(html.includes('/* GLX-HANDSFP1285') && html.includes('__handsFp1285'), 'FP hands 1.2.85');
must(html.includes('/* GLX-HANDS1266') && html.includes('/* GLX-HANDS1271') && html.includes('const U = window.__fpa'), 'fpa sculpt chain stays');
must(html.includes('function hideSashBack(') && html.includes('SASH_BACK: 1'), 'sash-back hide stays');
must(html.includes('WIDEN: 0') && html.includes('FILL_GLOW: 0') && html.includes('BRIDGE: 0'), 'stitched bridges, glow and widen off');
must(html.includes('SHIRT_|_sewn_torso_with_open_throat'), 'v1 source mesh name embedded');
must(html.includes('<!-- glencraft-build: b1279-v1.2.79 -->'), '1.2.79 marker stays');
must(html.includes('/* GLX-LOAD1285') && html.includes('<!-- glencraft-build: load1285 -->') && html.includes('liquid1285'), 'liquid loading bar is in the build');
{
  const st = html.indexOf('{"v":"v1.2.86"');
  const en = html.indexOf('{"v":"v1.2.85"', st);
  must(st >= 0 && en > st, '1.2.86 note range');
  must(!/haggis|food|sausage|pie\b|bread|meat|stew/i.test(html.slice(st, en)), '1.2.86 notes have no food');
  must(/more smoothly/i.test(html.slice(st, en)), '1.2.86 notes mention smoother performance');
  must(!/loading bar/i.test(html.slice(st, en)), '1.2.86 notes do not claim a loading-bar change (not in this release)');
}
must(!/\}\n\{/.test(html.slice(html.indexOf('window.PATCH_NOTES = ['), html.indexOf('\n];', html.indexOf('window.PATCH_NOTES = [')))), 'PATCH_NOTES still missing commas');

fs.writeFileSync(path.join(root, 'index.html'), html);
fs.writeFileSync(path.join(root, 'version.json'), '{"v":"1.2.86"}\n');

let credits = fs.readFileSync(path.join(root, 'CREDITS.md'), 'utf8');
if (!credits.includes('## v1.2.86')) {
  must(credits.includes('## v1.2.85 Original shirt sides'), 'CREDITS 1.2.85 heading missing');
  credits = replaceOnce(credits,
    '## v1.2.85 Original shirt sides',
    '## v1.2.86 Smoother performance\n\n- The game runs more smoothly: first-person arm movement no longer piles up extra work while you play (the 1.2.80–1.2.82 sculpt wrappers were wrapping each other every second), and the crafting grid is only rebuilt when recipes actually change.\n- Skeleton bone textures are uploaded only when the pose changes.\n- Quality now follows your display\'s refresh rate, with no frame-rate cap: when the GPU is busy the game lowers pixel ratio first, then trims the stream radius by at most one chunk, and restores them when there is headroom. The older c79 dynamic-resolution path stands down.\n\n## v1.2.85 Original shirt sides',
    'CREDITS');
  fs.writeFileSync(path.join(root, 'CREDITS.md'), credits);
}

must(JSON.parse(fs.readFileSync(path.join(root, 'version.json'), 'utf8')).v === '1.2.86', 'version.json write');
console.log('build 1.2.86 ok, index bytes', html.length);

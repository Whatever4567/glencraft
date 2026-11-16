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

if (html.includes("const GAME_VERSION = '1.2.86';") && !html.includes("const GAME_VERSION = '1.2.87';")) {
  html = replaceOnce(html, "const GAME_VERSION = '1.2.86';", "const GAME_VERSION = '1.2.87';", 'GAME_VERSION');
}
must(html.includes("const GAME_VERSION = '1.2.87';"), 'GAME_VERSION is not 1.2.87');
must(!html.includes("const GAME_VERSION = '1.2.86';"), 'GAME_VERSION is no longer 1.2.86');

if (!html.includes('<!-- glencraft-build: b1287-v1.2.87 -->')) {
  must(html.includes('<!-- glencraft-build: b1286-v1.2.86 -->'), 'b1286 marker missing');
  html = replaceOnce(html,
    '<!-- glencraft-build: b1286-v1.2.86 -->',
    '<!-- glencraft-build: b1286-v1.2.86 -->\n<!-- glencraft-build: b1287-v1.2.87 -->',
    'build marker');
}

const NOTE = '{"v":"v1.2.87","d":"2026-11-16","notes":["The loading bar now fills smoothly the whole time a world is loading, and no longer sits still at 84%."]},';
if (!html.includes('"v":"v1.2.87"')) {
  html = replaceOnce(html,
    'window.PATCH_NOTES = [\n{"v":"v1.2.86"',
    'window.PATCH_NOTES = [\n' + NOTE + '\n{"v":"v1.2.86"',
    'PATCH_NOTES');
} else {
  const i = html.indexOf('{"v":"v1.2.87"');
  const j = html.indexOf('\n{"v":"v1.2.86"', i);
  must(i >= 0 && j > i, 'cannot re-place 1.2.87 note');
  html = html.slice(0, i) + NOTE + html.slice(j);
}

must(html.includes('/* GLX-LOAD1285') && html.includes('<!-- glencraft-build: load1285 -->') && html.includes('liquid1285'), 'liquid loading bar is in the build');
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
must(html.includes('GLX-PERF1282') && html.includes('_fresh1282 = 1;'), 'cullVm perf fix is in the build');
must(html.includes('hideArtefactsOnce'), 'sculpt1281 once-per-frame scan');
must(html.includes('__torso1282') && html.includes('KILT_FP: 1') && html.includes('V1SIDES: 1'), 'torso FP-only hide and v1 sides');
must((html.split('(function sculpt1280()').length - 1) === 1, 'one sculpt1280');
must((html.split('(function sculpt1281()').length - 1) === 1, 'one sculpt1281');
must(html.includes("version: '1.2.59-frame-torch'"), 'torch jitter frame marker stays');
must(html.includes('/* GLX-FIX1279 (v1.2.79):'), 'FIX1279 stays');
must(html.includes('<!-- glencraft-build: b1286-v1.2.86 -->'), '1.2.86 marker stays');
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
{
  const st = html.indexOf('{"v":"v1.2.87"');
  const en = html.indexOf('{"v":"v1.2.86"', st);
  must(st >= 0 && en > st, '1.2.87 note range');
  must(!/haggis|food|sausage|pie\b|bread|meat|stew/i.test(html.slice(st, en)), '1.2.87 notes have no food');
  must(/loading bar now fills smoothly the whole time/i.test(html.slice(st, en)), '1.2.87 notes mention the loading bar filling smoothly the whole time');
  must(/84%/.test(html.slice(st, en)), '1.2.87 notes mention not sitting at 84%');
}
must(!/\}\n\{/.test(html.slice(html.indexOf('window.PATCH_NOTES = ['), html.indexOf('\n];', html.indexOf('window.PATCH_NOTES = [')))), 'PATCH_NOTES still missing commas');

fs.writeFileSync(path.join(root, 'index.html'), html);
fs.writeFileSync(path.join(root, 'version.json'), '{"v":"1.2.87"}\n');

let credits = fs.readFileSync(path.join(root, 'CREDITS.md'), 'utf8');
if (!credits.includes('## v1.2.87')) {
  must(credits.includes('## v1.2.86 Smoother performance'), 'CREDITS 1.2.86 heading missing');
  credits = replaceOnce(credits,
    '## v1.2.86 Smoother performance',
    '## v1.2.87 Loading bar\n\n- The loading bar fills on a time curve for the whole load, so it keeps moving instead of sitting at 84% while the world finishes. After a hitch it catches up at most 8% per second, and the last stretch creeps toward 99 until the world is ready.\n\n## v1.2.86 Smoother performance',
    'CREDITS');
  fs.writeFileSync(path.join(root, 'CREDITS.md'), credits);
}

must(JSON.parse(fs.readFileSync(path.join(root, 'version.json'), 'utf8')).v === '1.2.87', 'version.json write');
console.log('build 1.2.87 ok, index bytes', html.length);

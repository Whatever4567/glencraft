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

if (html.includes("const GAME_VERSION = '1.2.83';") && !html.includes("const GAME_VERSION = '1.2.84';")) {
  html = replaceOnce(html, "const GAME_VERSION = '1.2.83';", "const GAME_VERSION = '1.2.84';", 'GAME_VERSION');
}
must(html.includes("const GAME_VERSION = '1.2.84';"), 'GAME_VERSION is not 1.2.84');

if (!html.includes('<!-- glencraft-build: b1284-v1.2.84 -->')) {
  must(html.includes('<!-- glencraft-build: b1283-v1.2.83 -->'), 'b1283 marker missing');
  html = replaceOnce(html,
    '<!-- glencraft-build: b1283-v1.2.83 -->',
    '<!-- glencraft-build: b1283-v1.2.83 -->\n<!-- glencraft-build: b1284-v1.2.84 -->',
    'build marker');
}

const NOTE = '{"v":"v1.2.84","d":"2026-11-15","notes":["Your chest is back in third person with real volume: the shirt\'s open sides and the henley slit are closed using the shirt\'s own edges, and the chest, waist and back are fuller.","The side panels shade to match the front of the shirt, and the sash no longer runs across your back.","Your chest, kilt and sporran stay hidden only from your own first-person camera, so nothing blocks your view when you look down, with or without the jetpack."]},';
if (!html.includes('"v":"v1.2.84"')) {
  html = replaceOnce(html,
    'window.PATCH_NOTES = [\n{"v":"v1.2.83"',
    'window.PATCH_NOTES = [\n' + NOTE + '\n{"v":"v1.2.83"',
    'PATCH_NOTES');
} else {
  const i = html.indexOf('{"v":"v1.2.84"');
  const j = html.indexOf('\n{"v":"v1.2.83"', i);
  must(i >= 0 && j > i, 'cannot re-place 1.2.84 note');
  html = html.slice(0, i) + NOTE + html.slice(j);
}

/* Keep commas between adjacent PATCH_NOTES entries. */
{
  const start = html.indexOf('window.PATCH_NOTES = [');
  const end = html.indexOf('\n];', start);
  must(start >= 0 && end > start, 'PATCH_NOTES array not found');
  const arr = html.slice(start, end);
  const fixed = arr.replace(/\}\n\{/g, '},\n{');
  html = html.slice(0, start) + fixed + html.slice(end);
  must(!/\}\n\{/.test(html.slice(html.indexOf('window.PATCH_NOTES = ['), html.indexOf('\n];', html.indexOf('window.PATCH_NOTES = [')))), 'PATCH_NOTES still missing commas');
}

must(html.includes('/* GLX-SCULPT1280'), 'SCULPT1280 is in the build');
must(html.includes('/* GLX-SCULPT1281'), 'SCULPT1281 is in the build');
must(html.includes('/* GLX-SCULPT1282'), 'SCULPT1282 is in the build');
must(html.includes('GLX-PERF1282') && html.includes('_fresh1282 = 1;'), 'cullVm perf fix is in the build');
must(html.includes('hideArtefactsOnce'), 'sculpt1281 once-per-frame scan');
must(html.includes('__torso1282') && html.includes('SIDES: 1, KILT_FP: 1, BRIDGE: 1'), 'torso FP-only hide and chest restore');
must((html.split('(function sculpt1280()').length - 1) === 1, 'one sculpt1280');
must((html.split('(function sculpt1281()').length - 1) === 1, 'one sculpt1281');
must(html.includes("version: '1.2.59-frame-torch'"), 'torch jitter frame marker stays');
must(html.includes('/* GLX-FIX1279 (v1.2.79):'), 'FIX1279 stays');
must(html.includes('<!-- glencraft-build: b1283-v1.2.83 -->'), '1.2.83 marker stays');
must(html.includes("+ '|t1264clip'") && !html.includes("prev.customProgramCacheKey() : '') + 't1264clip'"), 'tartan cache-key fix');
must(html.includes('KILT_FP: 1'), 'FP kilt hide');
must(html.includes('/* GLX-HANDSTP1282'), 'TP hands');
must(html.includes('function buildBridgeGeo(') && html.includes('function widenMesh(') && html.includes('WIDEN: 1'), 'torso bridge + widen');
must(html.includes('<!-- glencraft-build: b1279-v1.2.79 -->'), '1.2.79 marker stays');
{
  const st = html.indexOf('{"v":"v1.2.84"');
  const en = html.indexOf('{"v":"v1.2.83"', st);
  must(st >= 0 && en > st, '1.2.84 note range');
  must(!/haggis|food|sausage|pie\b|bread|meat|stew/i.test(html.slice(st, en)), '1.2.84 notes have no food');
}

fs.writeFileSync(path.join(root, 'index.html'), html);
fs.writeFileSync(path.join(root, 'version.json'), '{"v":"1.2.84"}\n');

let credits = fs.readFileSync(path.join(root, 'CREDITS.md'), 'utf8');
if (!credits.includes('## v1.2.84')) {
  must(credits.includes('## v1.2.83 Tartan colour, clear first-person view, finished hands'), 'CREDITS 1.2.83 heading missing');
  credits = replaceOnce(credits,
    '## v1.2.83 Tartan colour, clear first-person view, finished hands',
    '## v1.2.84 Chest restored with volume\n\n- The scottish-base-v2 shirt has been a separate front and back panel since 1.2.37 (open sides from hem to armpit, open henley slit). The gaps are now zipped from the shirt\'s own boundary vertices (same positions and skin weights); nothing is rebuilt or deleted.\n- Shirt core widened and deepened by spine/pelvis skin weight (width x1.38, front x1.34, back x1.18); sash and buttons follow the same mapping.\n- Side fill shading matched to the front (edge normals, faint cream glow); sash hidden behind the back mid-plane by discard.\n- Torso fill hidden only for your own first-person camera.\n\n## v1.2.83 Tartan colour, clear first-person view, finished hands',
    'CREDITS');
  fs.writeFileSync(path.join(root, 'CREDITS.md'), credits);
}

must(JSON.parse(fs.readFileSync(path.join(root, 'version.json'), 'utf8')).v === '1.2.84', 'version.json write');
console.log('build 1.2.84 ok, index bytes', html.length);

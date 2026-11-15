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

if (html.includes("const GAME_VERSION = '1.2.81';") && !html.includes("const GAME_VERSION = '1.2.82';")) {
  html = replaceOnce(html, "const GAME_VERSION = '1.2.81';", "const GAME_VERSION = '1.2.82';", 'GAME_VERSION');
}
must(html.includes("const GAME_VERSION = '1.2.82';"), 'GAME_VERSION is not 1.2.82');

if (!html.includes('<!-- glencraft-build: b1282-v1.2.82 -->')) {
  must(html.includes('<!-- glencraft-build: b1281-v1.2.81 -->'), 'b1281 marker missing');
  html = replaceOnce(html,
    '<!-- glencraft-build: b1281-v1.2.81 -->',
    '<!-- glencraft-build: b1281-v1.2.81 -->\n<!-- glencraft-build: b1282-v1.2.82 -->',
    'build marker');
}

const NOTE = '{"v":"v1.2.82","d":"2026-11-15","notes":["First person is smooth again: the 1.2.81 hand update was re-running the arm rig over a hundred times every frame, which made the game a slideshow. Frame time is back to 1.2.80 levels.","Your player\'s chest is back in third person, mirrors and other players\' views: the white shirt and sash look as they did in 1.2.61, with no dark panels over them.","The chest is hidden only from your own first-person camera, so it still never blocks your view when you look down. Nothing on your body is deleted.","Pickaxe fist sits a little lower, and the musket hip no longer shows a dark blob."]},';
if (!html.includes('"v":"v1.2.82"')) {
  html = replaceOnce(html,
    'window.PATCH_NOTES = [\n{"v":"v1.2.81"',
    'window.PATCH_NOTES = [\n' + NOTE + '\n{"v":"v1.2.81"',
    'PATCH_NOTES');
} else {
  const i = html.indexOf('{"v":"v1.2.82"');
  const j = html.indexOf('\n{"v":"v1.2.81"', i);
  must(i >= 0 && j > i, 'cannot re-place 1.2.82 note');
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
must(html.includes('__torso1282') && html.includes('SIDES: 0'), 'torso FP-only hide and chest restore');
must((html.split('(function sculpt1280()').length - 1) === 1, 'one sculpt1280');
must((html.split('(function sculpt1281()').length - 1) === 1, 'one sculpt1281');
must(html.includes("version: '1.2.59-frame-torch'"), 'torch jitter frame marker stays');
must(html.includes('/* GLX-FIX1279 (v1.2.79):'), 'FIX1279 stays');
must(html.includes('<!-- glencraft-build: b1281-v1.2.81 -->'), '1.2.81 marker stays');
must(html.includes('<!-- glencraft-build: b1279-v1.2.79 -->'), '1.2.79 marker stays');
{
  const st = html.indexOf('{"v":"v1.2.82"');
  const en = html.indexOf('{"v":"v1.2.81"', st);
  must(st >= 0 && en > st, '1.2.82 note range');
  must(!/haggis|food|sausage roll|pie\b/i.test(html.slice(st, en)), '1.2.82 notes have no food');
}

fs.writeFileSync(path.join(root, 'index.html'), html);
fs.writeFileSync(path.join(root, 'version.json'), '{"v":"1.2.82"}\n');

let credits = fs.readFileSync(path.join(root, 'CREDITS.md'), 'utf8');
if (!credits.includes('## v1.2.82')) {
  must(credits.includes('## v1.2.81 First-person pickaxe grip'), 'CREDITS 1.2.81 heading missing');
  credits = replaceOnce(credits,
    '## v1.2.81 First-person pickaxe grip',
    '## v1.2.82 Smooth first person, chest restored\n\n- Fixed the first-person slideshow from 1.2.81: the view-model cull no longer re-runs the arm rig for every mesh, and the pickaxe hand pass scans once per frame.\n- The player chest (white shirt and sash) draws as it did in 1.2.61 in third person; it is hidden only from your own first-person camera. No body geometry is deleted.\n- Pickaxe fist a little lower; musket hip dark blob hidden.\n\n## v1.2.81 First-person pickaxe grip',
    'CREDITS');
  fs.writeFileSync(path.join(root, 'CREDITS.md'), credits);
}

must(JSON.parse(fs.readFileSync(path.join(root, 'version.json'), 'utf8')).v === '1.2.82', 'version.json write');
console.log('build 1.2.82 ok, index bytes', html.length);

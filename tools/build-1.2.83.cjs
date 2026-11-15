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

if (html.includes("const GAME_VERSION = '1.2.82';") && !html.includes("const GAME_VERSION = '1.2.83';")) {
  html = replaceOnce(html, "const GAME_VERSION = '1.2.82';", "const GAME_VERSION = '1.2.83';", 'GAME_VERSION');
}
must(html.includes("const GAME_VERSION = '1.2.83';"), 'GAME_VERSION is not 1.2.83');

if (!html.includes('<!-- glencraft-build: b1283-v1.2.83 -->')) {
  must(html.includes('<!-- glencraft-build: b1282-v1.2.82 -->'), 'b1282 marker missing');
  html = replaceOnce(html,
    '<!-- glencraft-build: b1282-v1.2.82 -->',
    '<!-- glencraft-build: b1282-v1.2.82 -->\n<!-- glencraft-build: b1283-v1.2.83 -->',
    'build marker');
}

const NOTE = '{"v":"v1.2.83","d":"2026-11-15","notes":["The kilt and sash tartan show their blue, green, red and gold colours again instead of black. A shader mix-up from 1.2.64 was drawing them without colour correction, and your hands now match your face again.","Your kilt, belt and sporran are hidden only from your own first-person camera, like the shirt, so nothing fills the bottom of the screen when you look down. Nothing on your body is deleted.","Third-person hands now have knuckle creases and fingernails, and crystal gauntlet fingers show their joint seams. This is done with shading, so it adds no triangles and costs no frame rate."]},';
if (!html.includes('"v":"v1.2.83"')) {
  html = replaceOnce(html,
    'window.PATCH_NOTES = [\n{"v":"v1.2.82"',
    'window.PATCH_NOTES = [\n' + NOTE + '\n{"v":"v1.2.82"',
    'PATCH_NOTES');
} else {
  const i = html.indexOf('{"v":"v1.2.83"');
  const j = html.indexOf('\n{"v":"v1.2.82"', i);
  must(i >= 0 && j > i, 'cannot re-place 1.2.83 note');
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
must(html.includes('<!-- glencraft-build: b1282-v1.2.82 -->'), '1.2.82 marker stays');
must(html.includes("+ '|t1264clip'") && !html.includes("prev.customProgramCacheKey() : '') + 't1264clip'"), 'tartan cache-key fix');
must(html.includes('KILT_FP: 1'), 'FP kilt hide');
must(html.includes('/* GLX-HANDSTP1282'), 'TP hands');
must(html.includes('<!-- glencraft-build: b1279-v1.2.79 -->'), '1.2.79 marker stays');
{
  const st = html.indexOf('{"v":"v1.2.83"');
  const en = html.indexOf('{"v":"v1.2.82"', st);
  must(st >= 0 && en > st, '1.2.83 note range');
  must(!/haggis|food|sausage|pie\b|bread|meat|stew/i.test(html.slice(st, en)), '1.2.83 notes have no food');
}

fs.writeFileSync(path.join(root, 'index.html'), html);
fs.writeFileSync(path.join(root, 'version.json'), '{"v":"1.2.83"}\n');

let credits = fs.readFileSync(path.join(root, 'CREDITS.md'), 'utf8');
if (!credits.includes('## v1.2.83')) {
  must(credits.includes('## v1.2.82 Smooth first person, chest restored'), 'CREDITS 1.2.82 heading missing');
  credits = replaceOnce(credits,
    '## v1.2.82 Smooth first person, chest restored',
    '## v1.2.83 Tartan colour, clear first-person view, finished hands\n\n- Kilt and sash tartan no longer render black: the time-box clip patch (1.2.64) dropped each material\'s shader cache key, so the tartan and hand skin shared a world shader without the display colour transfer. The previous key is kept now.\n- Kilt, belt and sporran are hidden only from your own first-person camera, like the torso.\n- Third-person hands: baked knuckle creases, fingernails and gauntlet joint seams through shading, with no added triangles.\n\n## v1.2.82 Smooth first person, chest restored',
    'CREDITS');
  fs.writeFileSync(path.join(root, 'CREDITS.md'), credits);
}

must(JSON.parse(fs.readFileSync(path.join(root, 'version.json'), 'utf8')).v === '1.2.83', 'version.json write');
console.log('build 1.2.83 ok, index bytes', html.length);

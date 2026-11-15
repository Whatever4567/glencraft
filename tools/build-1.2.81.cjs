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

if (html.includes("const GAME_VERSION = '1.2.80';") && !html.includes("const GAME_VERSION = '1.2.81';")) {
  html = replaceOnce(html, "const GAME_VERSION = '1.2.80';", "const GAME_VERSION = '1.2.81';", 'GAME_VERSION');
}
must(html.includes("const GAME_VERSION = '1.2.81';"), 'GAME_VERSION is not 1.2.81');

if (!html.includes('<!-- glencraft-build: b1281-v1.2.81 -->')) {
  must(html.includes('<!-- glencraft-build: b1280-v1.2.80 -->'), 'b1280 marker missing');
  html = replaceOnce(html,
    '<!-- glencraft-build: b1280-v1.2.80 -->',
    '<!-- glencraft-build: b1280-v1.2.80 -->\n<!-- glencraft-build: b1281-v1.2.81 -->',
    'build marker');
}

const NOTE = '{"v":"v1.2.81","d":"2026-11-15","notes":["First-person pickaxe is now held in a closed fist at a proper angle and follows the swing."]},';
if (!html.includes('"v":"v1.2.81"')) {
  html = replaceOnce(html,
    'window.PATCH_NOTES = [\n{"v":"v1.2.80"',
    'window.PATCH_NOTES = [\n' + NOTE + '\n{"v":"v1.2.80"',
    'PATCH_NOTES');
} else {
  const i = html.indexOf('{"v":"v1.2.81"');
  const j = html.indexOf('\n{"v":"v1.2.80"', i);
  must(i >= 0 && j > i, 'cannot re-place 1.2.81 note');
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
must((html.split('(function sculpt1280()').length - 1) === 1, 'one sculpt1280');
must((html.split('(function sculpt1281()').length - 1) === 1, 'one sculpt1281');
must(html.includes("version: '1.2.59-frame-torch'"), 'torch jitter frame marker stays');
must(html.includes('/* GLX-FIX1279 (v1.2.79):'), 'FIX1279 stays');
must(html.includes('<!-- glencraft-build: b1280-v1.2.80 -->'), '1.2.80 marker stays');
must(html.includes('<!-- glencraft-build: b1279-v1.2.79 -->'), '1.2.79 marker stays');
{
  const st = html.indexOf('{"v":"v1.2.81"');
  const en = html.indexOf('{"v":"v1.2.80"', st);
  must(st >= 0 && en > st, '1.2.81 note range');
  must(!/haggis|food|sausage roll|pie\b/i.test(html.slice(st, en)), '1.2.81 notes have no food');
}

fs.writeFileSync(path.join(root, 'index.html'), html);
fs.writeFileSync(path.join(root, 'version.json'), '{"v":"1.2.81"}\n');

let credits = fs.readFileSync(path.join(root, 'CREDITS.md'), 'utf8');
if (!credits.includes('## v1.2.81')) {
  must(credits.includes('## v1.2.80 First-person hands'), 'CREDITS 1.2.80 heading missing');
  credits = replaceOnce(credits,
    '## v1.2.80 First-person hands',
    '## v1.2.81 First-person pickaxe grip\n\n- In first person, the pickaxe is held in a closed fist at a proper angle and follows the mining swing.\n\n## v1.2.80 First-person hands',
    'CREDITS');
  fs.writeFileSync(path.join(root, 'CREDITS.md'), credits);
}

must(JSON.parse(fs.readFileSync(path.join(root, 'version.json'), 'utf8')).v === '1.2.81', 'version.json write');
console.log('build 1.2.81 ok, index bytes', html.length);

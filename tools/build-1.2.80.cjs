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

if (html.includes("const GAME_VERSION = '1.2.79';") && !html.includes("const GAME_VERSION = '1.2.80';")) {
  html = replaceOnce(html, "const GAME_VERSION = '1.2.79';", "const GAME_VERSION = '1.2.80';", 'GAME_VERSION');
}
must(html.includes("const GAME_VERSION = '1.2.80';"), 'GAME_VERSION is not 1.2.80');

if (!html.includes('<!-- glencraft-build: b1280-v1.2.80 -->')) {
  must(html.includes('<!-- glencraft-build: b1279-v1.2.79 -->'), 'b1279 marker missing');
  html = replaceOnce(html,
    '<!-- glencraft-build: b1279-v1.2.79 -->',
    '<!-- glencraft-build: b1279-v1.2.79 -->\n<!-- glencraft-build: b1280-v1.2.80 -->',
    'build marker');
}

const NOTE = '{"v":"v1.2.80","d":"2026-11-15","notes":["First-person hands: the pickaxe fist comes in from the bottom-right corner.","The pistol is lower and bigger in first person.","Tools have cream linen sleeves."]},';
if (!html.includes('"v":"v1.2.80"')) {
  html = replaceOnce(html,
    'window.PATCH_NOTES = [\n{"v":"v1.2.79"',
    'window.PATCH_NOTES = [\n' + NOTE + '\n{"v":"v1.2.79"',
    'PATCH_NOTES');
} else {
  const i = html.indexOf('{"v":"v1.2.80"');
  const j = html.indexOf('\n{"v":"v1.2.79"', i);
  must(i >= 0 && j > i, 'cannot re-place 1.2.80 note');
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
must((html.split('(function sculpt1280()').length - 1) === 1, 'one sculpt1280');
must(html.includes("version: '1.2.59-frame-torch'"), 'torch jitter frame marker stays');
must(html.includes('/* GLX-FIX1279 (v1.2.79):'), 'FIX1279 stays');
must(html.includes('<!-- glencraft-build: b1279-v1.2.79 -->'), '1.2.79 marker stays');

fs.writeFileSync(path.join(root, 'index.html'), html);
fs.writeFileSync(path.join(root, 'version.json'), '{"v":"1.2.80"}\n');

let credits = fs.readFileSync(path.join(root, 'CREDITS.md'), 'utf8');
if (!credits.includes('## v1.2.80')) {
  must(credits.includes('## v1.2.79 Map in hand, forearms, right-hand items'), 'CREDITS 1.2.79 heading missing');
  credits = replaceOnce(credits,
    '## v1.2.79 Map in hand, forearms, right-hand items',
    '## v1.2.80 First-person hands\n\n- In first person, the pickaxe fist comes in from the bottom-right corner.\n- The pistol is lower and bigger in first person.\n- Tools have cream linen sleeves.\n\n## v1.2.79 Map in hand, forearms, right-hand items',
    'CREDITS');
  fs.writeFileSync(path.join(root, 'CREDITS.md'), credits);
}

must(JSON.parse(fs.readFileSync(path.join(root, 'version.json'), 'utf8')).v === '1.2.80', 'version.json write');
console.log('build 1.2.80 ok, index bytes', html.length);

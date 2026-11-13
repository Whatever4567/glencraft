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
const before = html.length;

if (html.includes("const GAME_VERSION = '1.2.74';") && !html.includes("const GAME_VERSION = '1.2.75';")) {
  html = replaceOnce(html, "const GAME_VERSION = '1.2.74';", "const GAME_VERSION = '1.2.75';", 'GAME_VERSION');
}
must(html.includes("const GAME_VERSION = '1.2.75';"), 'GAME_VERSION is not 1.2.75');

if (!html.includes('<!-- glencraft-build: b1275-v1.2.75 -->')) {
  must(html.includes('<!-- glencraft-build: b1274-v1.2.74 -->'), 'b1274 marker missing');
  html = replaceOnce(html,
    '<!-- glencraft-build: b1274-v1.2.74 -->',
    '<!-- glencraft-build: b1274-v1.2.74 -->\n<!-- glencraft-build: b1275-v1.2.75 -->',
    'build marker');
}

const NOTE = '{"v":"v1.2.75","d":"2026-11-13","notes":["Guns restored to how they were in 1.2.73.","Fix: the pickaxe, bucket and torch sit still in your hand, on-screen, and the pickaxe head stays on the handle.","Fix: the map in your hand is still a working map. It shows the land, updates with your position and heading, and is tilted up and close so you can read it."]}';
if (!html.includes('"v":"v1.2.75"')) {
  html = replaceOnce(html,
    'window.PATCH_NOTES = [\n{"v":"v1.2.74"',
    'window.PATCH_NOTES = [\n' + NOTE + '\n{"v":"v1.2.74"',
    'PATCH_NOTES');
} else {
  const reNote = /\{"v":"v1\.2\.75"[^}]*\}/;
  if (reNote.test(html)) html = html.replace(reNote, NOTE);
}

/* Revert the 1.2.74 stable:1 snapshot on pick / crystal picks / bucket
   back to the 1.2.73 GRIP table. The 1275 IIFE then takes those tools
   (and the torch) off seatItem entirely, onto the potion grip path. */
if (html.includes('errMax: 1.20, stable: 1},\n    pick:')) {
  html = replaceOnce(html,
    '    p761:   {p: [0, 0.02, 0], axis: [0, 1, 0], palm: [0, 0.058, 0.018], align: 0, errMax: 1.20, stable: 1},\n    pick:   {p: [0, 0.02, 0], axis: [0, 1, 0], palm: [0, 0.058, 0.018], align: 0, errMax: 1.20, stable: 1},\n    p760:   {p: [0, 0.02, 0], axis: [0, 1, 0], palm: [0, 0.058, 0.018], align: 0, errMax: 1.20, stable: 1},\n    bucket: {p: [0, 0.252, 0], axis: [1, 0, 0], palm: [0, 0.074, 0.012], align: 0, hang: 1, errMax: 1.20, stable: 1},',
    '    p761:   {p: [0, 0.02, 0], axis: [0, 1, 0], palm: [0, 0.058, 0.018], align: 0, errMax: 1.20},\n    pick:   {p: [0, 0.02, 0], axis: [0, 1, 0], palm: [0, 0.058, 0.018], align: 0, errMax: 1.20},\n    p760:   {p: [0, 0.02, 0], axis: [0, 1, 0], palm: [0, 0.058, 0.018], align: 0, errMax: 1.20},\n    bucket: {p: [0, 0.252, 0], axis: [1, 0, 0], palm: [0, 0.074, 0.012], align: 0, hang: 1, errMax: 1.20},',
    'GRIP revert snapshot');
}
must(html.includes('    p761:   {p: [0, 0.02, 0], axis: [0, 1, 0], palm: [0, 0.058, 0.018], align: 0, errMax: 1.20},\n    pick:'), 'p761 GRIP matches 1.2.73');
must(html.includes("    pistol: {p: [0, -0.07, 0.05], axis: [0, -0.95, 0.30], palm: [0, 0.050, 0.018], align: 0}"), 'pistol GRIP is unchanged from 1.2.73');

/* Keep the 1.2.74 dressPickHook lock (pick-only). */
must(html.includes('if (held.userData && held.userData._bladeLock1274)'), 'dressPickHook lock must stay');

must(html.includes('/* GLX-HANDS1271'), 'HANDS1271 must stay');
must(html.includes('/* GLX-HANDS1270'), 'HANDS1270 must stay');
must(html.includes('/* GLX-HANDS1266'), 'HANDS1266 must stay');
must(html.includes('/* GLX-HANDS1263'), 'HANDS1263 must stay');
must(html.includes("restoredFrom: '1e9db15'"), '1263 restore must stay');
must(!html.includes('/* GLX-HANDS1261'), 'HANDS1261 must stay removed');
must(!html.includes("['dU', 'dL', 'dR'].forEach"), 'gold D-pad must stay untouched');
must(html.includes('/* GLX-FIX1273'), 'FIX1273 must stay');
must(html.includes('/* GLX-FIX1272'), 'FIX1272 must stay');

const src = fs.readFileSync(path.join(root, 'tools/content-source/fix-1275.js'), 'utf8').trim() + '\n';
must(src.includes('GLX-FIX1275'), 'fix-1275.js is required');

/* Replace the 1.2.74 IIFE (its global hooks leaked into guns) with 1275.
   If 1274 is already gone and 1275 is present, refresh 1275. */
function replaceIife(html, mark, bundled) {
  const i = html.indexOf(mark);
  if (i < 0) return null;
  const j = html.indexOf('</script>', i);
  must(j > i, 'cannot find </script> after ' + mark);
  return html.slice(0, i) + bundled + html.slice(j);
}

if (html.includes('/* GLX-FIX1275 (v1.2.75):')) {
  const r = replaceIife(html, '/* GLX-FIX1275 (v1.2.75):', src);
  must(r, 'refresh 1275 failed');
  html = r;
} else if (html.includes('/* GLX-FIX1274 (v1.2.74):')) {
  const r = replaceIife(html, '/* GLX-FIX1274 (v1.2.74):', src);
  must(r, 'replace 1274 with 1275 failed');
  html = r;
} else {
  const k = html.lastIndexOf('</script>');
  must(k > 0, 'no closing script');
  html = html.slice(0, k) + '\n' + src + html.slice(k);
}

must(!html.includes('/* GLX-FIX1274 (v1.2.74):'), 'FIX1274 IIFE must be removed (its hooks leaked into guns)');
must(html.includes('/* GLX-FIX1275 (v1.2.75):'), 'FIX1275 IIFE missing');
must(html.includes("const GAME_VERSION = '1.2.75';"), 'version not bumped');
must(html.includes('"v":"v1.2.75"'), 'patch notes missing');
must(html.includes('Guns restored to how they were in 1.2.73'), 'gun restore note missing');
must(html.includes('applyPotionPath'), 'potion grip path is present');
must(html.includes('isWeapon'), 'gun exclusion is present');
must(!html.includes('function freezeToolPose'), 'the 1.2.74 snapshot must be gone');
{
  const i = html.indexOf('GLX-FIX1275');
  const scr = html.indexOf('</script>', i);
  const body = html.slice(i, scr > i ? scr : html.length);
  must(body.includes('POTION_GRIP_KEYS'), '1275 uses the potion grip path');
  must(body.includes('seatLiveMap'), '1275 keeps the live map');
  must(body.includes('__c112'), '1275 reuses the C112 live chart');
  must(body.includes('P.yaw'), '1275 updates player heading');
  must(body.includes('lockPickBlade'), '1275 locks the pick head');
  must(body.includes('Do not wrap apply'), '1275 must not wrap apply/render');
  must(!body.includes('H.apply = function'), '1275 must not wrap H.apply');
  must(!body.includes('renderer.render ='), '1275 must not wrap renderer.render');
  must(!body.includes("['dU', 'dL', 'dR'].forEach"), '1275 must not touch the gold D-pad');
  must(!body.includes('alert('), '1275 must not pop up an alert');
}

fs.writeFileSync(path.join(root, 'index.html'), html);
console.log('index.html', before, '->', html.length);

fs.writeFileSync(path.join(root, 'version.json'), '{"v":"1.2.75"}\n');
console.log('version.json written');

let credits = fs.readFileSync(path.join(root, 'CREDITS.md'), 'utf8');
const block = `## v1.2.75 Guns restored to how they were in 1.2.73

- Guns restored to how they were in 1.2.73.
- Fix: the pickaxe, bucket and torch sit still in your hand, on-screen, and the pickaxe head stays on the handle.
- Fix: the map in your hand is still a working map. It shows the land, updates with your position and heading, and is tilted up and close so you can read it.
- First-person hands stay hidden in third person. The gold D-pad is left alone.

`;
if (!credits.includes('## v1.2.75')) {
  credits = credits.replace('## v1.2.74 Tools sit still', block + '## v1.2.74 Tools sit still');
} else {
  const a = credits.indexOf('## v1.2.75');
  const b = credits.indexOf('## v1.2.74', a + 1);
  if (a >= 0 && b > a) credits = credits.slice(0, a) + block + credits.slice(b);
}
must(credits.includes('## v1.2.75'), 'CREDITS 1.2.75 missing');
must(credits.includes('Guns restored to how they were in 1.2.73'), 'CREDITS gun note missing');
fs.writeFileSync(path.join(root, 'CREDITS.md'), credits);
console.log('CREDITS.md updated');

console.log('build 1.2.75 done');

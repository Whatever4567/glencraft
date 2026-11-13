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

if (html.includes("const GAME_VERSION = '1.2.73';") && !html.includes("const GAME_VERSION = '1.2.74';")) {
  html = replaceOnce(html, "const GAME_VERSION = '1.2.73';", "const GAME_VERSION = '1.2.74';", 'GAME_VERSION');
}
must(html.includes("const GAME_VERSION = '1.2.74';"), 'GAME_VERSION is not 1.2.74');

if (!html.includes('<!-- glencraft-build: b1274-v1.2.74 -->')) {
  must(html.includes('<!-- glencraft-build: b1273-v1.2.73 -->'), 'b1273 marker missing');
  html = replaceOnce(html,
    '<!-- glencraft-build: b1273-v1.2.73 -->',
    '<!-- glencraft-build: b1273-v1.2.73 -->\n<!-- glencraft-build: b1274-v1.2.74 -->',
    'build marker');
}

const NOTE = '{"v":"v1.2.74","d":"2026-11-13","notes":["Fix: the pickaxe, bucket and torch no longer swing on their own. They sit still in your hand, and the pickaxe head stays on the handle.","Fix: the map in your hand is a working map again. It shows the land, updates with your position and heading, and is tilted up and close so you can read it."]}';
if (!html.includes('"v":"v1.2.74"')) {
  html = replaceOnce(html,
    'window.PATCH_NOTES = [\n{"v":"v1.2.73"',
    'window.PATCH_NOTES = [\n' + NOTE + '\n{"v":"v1.2.73"',
    'PATCH_NOTES');
} else {
  const reNote = /\{"v":"v1\.2\.74"[^}]*\}/;
  if (reNote.test(html)) html = html.replace(reNote, NOTE);
}

/* Freeze seating for pick / crystal picks / bucket (torch already stable). */
html = replaceOnce(html,
  '    p761:   {p: [0, 0.02, 0], axis: [0, 1, 0], palm: [0, 0.058, 0.018], align: 0, errMax: 1.20},\n    pick:   {p: [0, 0.02, 0], axis: [0, 1, 0], palm: [0, 0.058, 0.018], align: 0, errMax: 1.20},\n    p760:   {p: [0, 0.02, 0], axis: [0, 1, 0], palm: [0, 0.058, 0.018], align: 0, errMax: 1.20},\n    bucket: {p: [0, 0.252, 0], axis: [1, 0, 0], palm: [0, 0.074, 0.012], align: 0, hang: 1, errMax: 1.20},',
  '    p761:   {p: [0, 0.02, 0], axis: [0, 1, 0], palm: [0, 0.058, 0.018], align: 0, errMax: 1.20, stable: 1},\n    pick:   {p: [0, 0.02, 0], axis: [0, 1, 0], palm: [0, 0.058, 0.018], align: 0, errMax: 1.20, stable: 1},\n    p760:   {p: [0, 0.02, 0], axis: [0, 1, 0], palm: [0, 0.058, 0.018], align: 0, errMax: 1.20, stable: 1},\n    bucket: {p: [0, 0.252, 0], axis: [1, 0, 0], palm: [0, 0.074, 0.012], align: 0, hang: 1, errMax: 1.20, stable: 1},',
  'GRIP stable');

/* Stop the half-finished crescent dresser re-aiming the blade every frame. */
html = replaceOnce(html,
  '    if (already && blade0) {\n      try { dressHaftShaft(); } catch (_) {}\n      alignCrescentFace(blade0);',
  '    if (already && blade0) {\n      if (held.userData && held.userData._bladeLock1274) {\n        try { restoreHaftMats(); } catch (_) {}\n        return;\n      }\n      try { dressHaftShaft(); } catch (_) {}\n      alignCrescentFace(blade0);',
  'dressPickHook lock');

must(html.includes('/* GLX-HANDS1271'), 'HANDS1271 must stay');
must(html.includes('/* GLX-HANDS1270'), 'HANDS1270 must stay');
must(html.includes('/* GLX-HANDS1266'), 'HANDS1266 must stay');
must(html.includes('/* GLX-HANDS1263'), 'HANDS1263 must stay');
must(html.includes("restoredFrom: '1e9db15'"), '1263 restore must stay');
must(!html.includes('/* GLX-HANDS1261'), 'HANDS1261 must stay removed');
must(!html.includes("['dU', 'dL', 'dR'].forEach"), 'gold D-pad must stay untouched');
must(html.includes('/* GLX-FIX1273'), 'FIX1273 must stay');
must(html.includes('/* GLX-FIX1272'), 'FIX1272 must stay');

const files = ['tools/content-source/fix-1274.js'].filter(f => fs.existsSync(path.join(root, f)));
must(files.length === 1, 'fix-1274.js is required');
{
  const bundled = files.map(f => fs.readFileSync(path.join(root, f), 'utf8').trim() + '\n').join('');
  const INJECT_MARK = '/* GLX-FIX1274 (v1.2.74):';
  if (html.includes(INJECT_MARK)) {
    const i = html.indexOf(INJECT_MARK);
    const j = html.indexOf('</script>', i);
    must(j > i, 'cannot find </script> after existing 1274 IIFE');
    html = html.slice(0, i) + bundled + html.slice(j);
  } else {
    const k = html.lastIndexOf('</script>');
    must(k > 0, 'no closing script');
    html = html.slice(0, k) + '\n' + bundled + html.slice(k);
  }
}

must(html.includes("const GAME_VERSION = '1.2.74';"), 'version not bumped');
must(html.includes('"v":"v1.2.74"'), 'patch notes missing');
must(html.includes('GLX-FIX1274'), 'fix 1274 IIFE missing');
must(html.includes('gold D-pad is left alone'), '1274 must record that the gold D-pad is left alone');
must(html.includes('errMax: 1.20, stable: 1},\n    pick:'), 'pick grip is frozen');
must(html.includes('hang: 1, errMax: 1.20, stable: 1}'), 'bucket grip is frozen');
must(html.includes('_bladeLock1274'), 'pick head is locked');
must(html.includes('seatLiveMap'), 'live map seater is present');
must(html.includes('is a working map again') || html.includes('working map again'), 'map patch note present');
{
  const i = html.indexOf('GLX-FIX1274');
  const scr = html.indexOf('</script>', i);
  const body = html.slice(i, scr > i ? scr : html.length);
  must(body.includes('freezeToolPose'), '1274 must freeze tool poses');
  must(body.includes('seatLiveMap'), '1274 must seat the live map');
  must(body.includes('__c112'), '1274 must reuse the C112 live chart');
  must(body.includes('P.yaw'), '1274 must update the player heading');
  must(!body.includes("['dU', 'dL', 'dR'].forEach"), '1274 must not touch the gold D-pad');
  must(!body.includes('alert('), '1274 must not pop up an alert');
}

fs.writeFileSync(path.join(root, 'index.html'), html);
console.log('index.html', before, '->', html.length);

fs.writeFileSync(path.join(root, 'version.json'), '{"v":"1.2.74"}\n');
console.log('version.json written');

let credits = fs.readFileSync(path.join(root, 'CREDITS.md'), 'utf8');
const block = `## v1.2.74 Tools sit still, and the held map is a live map again

- Fix: the pickaxe, bucket and torch no longer swing on their own. They sit still in your hand, and the pickaxe head stays on the handle.
- Fix: the map in your hand is a working map again. It shows the land, updates with your position and heading, and is tilted up and close so you can read it.
- First-person hands stay hidden in third person. The gold D-pad is left alone.

`;
if (!credits.includes('## v1.2.74')) {
  credits = credits.replace('## v1.2.73 Magazine in the gun', block + '## v1.2.73 Magazine in the gun');
} else {
  const a = credits.indexOf('## v1.2.74');
  const b = credits.indexOf('## v1.2.73', a + 1);
  if (a >= 0 && b > a) credits = credits.slice(0, a) + block + credits.slice(b);
}
must(credits.includes('## v1.2.74'), 'CREDITS 1.2.74 missing');
fs.writeFileSync(path.join(root, 'CREDITS.md'), credits);
console.log('CREDITS.md updated');

console.log('build 1.2.74 done');

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

if (html.includes("const GAME_VERSION = '1.2.75';") && !html.includes("const GAME_VERSION = '1.2.76';")) {
  html = replaceOnce(html, "const GAME_VERSION = '1.2.75';", "const GAME_VERSION = '1.2.76';", 'GAME_VERSION');
}
must(html.includes("const GAME_VERSION = '1.2.76';"), 'GAME_VERSION is not 1.2.76');

if (!html.includes('<!-- glencraft-build: b1276-v1.2.76 -->')) {
  must(html.includes('<!-- glencraft-build: b1275-v1.2.75 -->'), 'b1275 marker missing');
  html = replaceOnce(html,
    '<!-- glencraft-build: b1275-v1.2.75 -->',
    '<!-- glencraft-build: b1275-v1.2.75 -->\n<!-- glencraft-build: b1276-v1.2.76 -->',
    'build marker');
}

const NOTE = '{"v":"v1.2.76","d":"2026-11-13","notes":["Map is now held in your hand.","Cave walls no longer go see-through; longer view distance."]}';
if (!html.includes('"v":"v1.2.76"')) {
  html = replaceOnce(html,
    'window.PATCH_NOTES = [\n{"v":"v1.2.75"',
    'window.PATCH_NOTES = [\n' + NOTE + '\n{"v":"v1.2.75"',
    'PATCH_NOTES');
} else {
  const reNote = /\{"v":"v1\.2\.76"[^}]*\}/;
  if (reNote.test(html)) html = html.replace(reNote, NOTE);
}

/* Keep every 1.2.73 / 1.2.75 gun and tool-grip guarantee. */
must(html.includes("    pistol: {p: [0, -0.07, 0.05], axis: [0, -0.95, 0.30], palm: [0, 0.050, 0.018], align: 0}"), 'pistol GRIP is unchanged from 1.2.73');
must(html.includes('    p761:   {p: [0, 0.02, 0], axis: [0, 1, 0], palm: [0, 0.058, 0.018], align: 0, errMax: 1.20},\n    pick:'), 'p761 GRIP still matches 1.2.73 (no stable snapshot)');
must(html.includes('if (held.userData && held.userData._bladeLock1274)'), 'dressPickHook lock must stay');
must(html.includes('/* GLX-FIX1275 (v1.2.75):'), 'FIX1275 IIFE must stay (potion path + gun skip)');
must(!html.includes('/* GLX-FIX1274 (v1.2.74):'), 'FIX1274 IIFE must stay gone');
must(html.includes('/* GLX-HANDS1271'), 'HANDS1271 must stay');
must(html.includes('/* GLX-HANDS1270'), 'HANDS1270 must stay');
must(html.includes('/* GLX-HANDS1266'), 'HANDS1266 must stay');
must(html.includes('/* GLX-HANDS1263'), 'HANDS1263 must stay');
must(html.includes("restoredFrom: '1e9db15'"), '1263 restore must stay');
must(!html.includes('/* GLX-HANDS1261'), 'HANDS1261 must stay removed');
must(!html.includes("['dU', 'dL', 'dR'].forEach"), 'gold D-pad must stay untouched');
must(html.includes('/* GLX-FIX1273'), 'FIX1273 must stay');
must(html.includes('/* GLX-FIX1272'), 'FIX1272 must stay');
must(html.includes('applyPotionPath'), 'potion grip path is present');
must(html.includes('isWeapon'), 'gun exclusion is present');
must(!html.includes('function freezeToolPose'), 'the 1.2.74 snapshot must stay gone');

/* Hook 1261's rdist so the adaptive / raised cap drives evict, stream
   and the fog cap. Unique string — only one occurrence. */
if (!html.includes('window.__rdist1276')) {
  html = replaceOnce(html,
    '      else n = isTouch() ? 4 : 8;\n    } catch (_) { n = 8; }\n    return Math.max(3, Math.min(16, n));',
    '      else n = isTouch() ? 8 : 12;\n    } catch (_) { n = 8; }\n    return (typeof window.__rdist1276 === \'function\') ? window.__rdist1276() : Math.max(3, Math.min(24, n));',
    '1261 rdist hook');
}

/* Slider max 24, default comment path (already-booted SET.rdist is
   raised at runtime by 1276; this catches a fresh unset). */
if (html.includes('id="rdRange" data-testid="settings-rdist" min="3" max="16"')) {
  html = replaceOnce(html,
    'id="rdRange" data-testid="settings-rdist" min="3" max="16"',
    'id="rdRange" data-testid="settings-rdist" min="3" max="24"',
    'rdRange max');
}
if (html.includes('const VF = () => clamp(SET.rdist, 3, 16) * 16;')) {
  html = replaceOnce(html,
    'const VF = () => clamp(SET.rdist, 3, 16) * 16;',
    'const VF = () => clamp(SET.rdist, 3, 24) * 16;',
    'VF clamp');
}
if (html.includes('SET.rdist = clamp(Math.round(v), 3, 16)')) {
  html = replaceOnce(html,
    'SET.rdist = clamp(Math.round(v), 3, 16)',
    'SET.rdist = clamp(Math.round(v), 3, 24)',
    'setV clamp');
}

const src = fs.readFileSync(path.join(root, 'tools/content-source/fix-1276.js'), 'utf8').trim() + '\n';
must(src.includes('GLX-FIX1276'), 'fix-1276.js is required');
must(src.includes('poseInPalm'), 'map palm seating is present');
must(src.includes('isUnder'), 'cave underground path is present');
must(src.includes('buildLodChunk'), 'far LOD is present');
must(!src.includes('H.apply = function'), '1276 must not wrap H.apply');
must(!src.includes('renderer.render ='), '1276 must not wrap renderer.render');

function replaceIife(html, mark, bundled) {
  const i = html.indexOf(mark);
  if (i < 0) return null;
  const j = html.indexOf('</script>', i);
  must(j > i, 'cannot find </script> after ' + mark);
  return html.slice(0, i) + bundled + html.slice(j);
}

if (html.includes('/* GLX-FIX1276 (v1.2.76):')) {
  const r = replaceIife(html, '/* GLX-FIX1276 (v1.2.76):', src);
  must(r, 'refresh 1276 failed');
  html = r;
} else {
  const k = html.lastIndexOf('</script>');
  must(k > 0, 'no closing script');
  html = html.slice(0, k) + '\n' + src + html.slice(k);
}

must(html.includes('/* GLX-FIX1276 (v1.2.76):'), 'FIX1276 IIFE missing');
must(html.includes('/* GLX-FIX1275 (v1.2.75):'), 'FIX1275 IIFE was not to be removed');
must(html.includes("const GAME_VERSION = '1.2.76';"), 'version not bumped');
must(html.includes('"v":"v1.2.76"'), 'patch notes missing');
must(html.includes('Map is now held in your hand'), 'map note missing');
must(html.includes('Cave walls no longer go see-through; longer view distance'), 'cave/view note missing');
must(html.includes('window.__rdist1276'), '1261 rdist hook missing');
{
  const i = html.indexOf('GLX-FIX1276');
  const scr = html.indexOf('</script>', i);
  const body = html.slice(i, scr > i ? scr : html.length);
  must(body.includes('poseInPalm'), '1276 seats the map in the palm');
  must(body.includes('__fpa'), '1276 uses the current __fpa hand');
  must(body.includes('__c112'), '1276 keeps the live C112 chart');
  must(body.includes('isUnder'), '1276 detects being underground');
  must(body.includes('buildLodChunk'), '1276 has a far LOD mesh');
  must(body.includes('Do not wrap') || body.includes('never wraps'), '1276 records that it does not wrap apply/render');
  must(!body.includes('H.apply = function'), '1276 must not wrap H.apply');
  must(!body.includes('H.repose = function'), '1276 must not wrap H.repose');
  must(!body.includes('renderer.render ='), '1276 must not wrap renderer.render');
  must(!body.includes("['dU', 'dL', 'dR'].forEach"), '1276 must not touch the gold D-pad');
  must(!body.includes('alert('), '1276 must not pop up an alert');
  must(!body.includes('POTION_GRIP_KEYS'), '1276 must not retouch the 1.2.75 potion path');
  must(body.includes('gun-skip') || body.includes('isWeapon'), '1276 skips weapons');
}

fs.writeFileSync(path.join(root, 'index.html'), html);
console.log('index.html', before, '->', html.length);

fs.writeFileSync(path.join(root, 'version.json'), '{"v":"1.2.76"}\n');
console.log('version.json written');

let credits = fs.readFileSync(path.join(root, 'CREDITS.md'), 'utf8');
const block = `## v1.2.76 Map is now held in your hand

- Map is now held in your hand.
- Cave walls no longer go see-through; longer view distance.
- First-person hands stay hidden in third person. The gold D-pad is left alone.

`;
if (!credits.includes('## v1.2.76')) {
  credits = credits.replace('## v1.2.75 Guns restored to how they were in 1.2.73', block + '## v1.2.75 Guns restored to how they were in 1.2.73');
} else {
  const a = credits.indexOf('## v1.2.76');
  const b = credits.indexOf('## v1.2.75', a + 1);
  if (a >= 0 && b > a) credits = credits.slice(0, a) + block + credits.slice(b);
}
must(credits.includes('## v1.2.76'), 'CREDITS 1.2.76 missing');
must(credits.includes('Map is now held in your hand'), 'CREDITS map note missing');
must(credits.includes('Cave walls no longer go see-through; longer view distance'), 'CREDITS cave note missing');
fs.writeFileSync(path.join(root, 'CREDITS.md'), credits);
console.log('CREDITS.md updated');

console.log('build 1.2.76 done');

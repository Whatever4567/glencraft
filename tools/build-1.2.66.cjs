#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');

function must(cond, msg) { if (!cond) throw new Error(msg); }
function replaceOnce(s, a, b, label) {
  const n = s.split(a).length - 1;
  must(n === 1, (label || a.slice(0, 50)) + ': expected 1 occurrence, got ' + n);
  return s.split(a).join(b);
}

let html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const before = html.length;

if (html.includes("const GAME_VERSION = '1.2.65';") && !html.includes("const GAME_VERSION = '1.2.66';")) {
  html = replaceOnce(html, "const GAME_VERSION = '1.2.65';", "const GAME_VERSION = '1.2.66';", 'GAME_VERSION');
}
must(html.includes("const GAME_VERSION = '1.2.66';"), 'GAME_VERSION is not 1.2.66');

if (!html.includes('<!-- glencraft-build: b1266-v1.2.66 -->')) {
  must(html.includes('<!-- glencraft-build: b1265-v1.2.65 -->'), 'b1265 marker missing');
  html = replaceOnce(html,
    '<!-- glencraft-build: b1265-v1.2.65 -->',
    '<!-- glencraft-build: b1265-v1.2.65 -->\n<!-- glencraft-build: b1266-v1.2.66 -->',
    'build marker');
}

const NOTE = '{"v":"v1.2.66","d":"2026-11-13","notes":["Hands: sausage fingers sculpted toward realistic proportions. Each finger tapers from a thicker base to a narrower, rounded and slightly flattened tip, in three phalanx segments (two for the thumb) with visible narrowing at the joints and slight knuckle bulges. The middle finger is longest, then the ring and index, then the pinky. The cross-section is a slightly flattened oval. On the empty hand the fingers take a natural resting curl (the pinky curls the most). Nails are thin inset plates. The thumb has a thicker thenar base. Fingers are a bit thinner relative to the palm. 1.2.65 pixel shading (dither, crease AO, knuckle highlights) is kept. Same objects, hierarchy, pivots, grip poses and every animation. The view-model stays hidden in third person.","Hard-refresh to load this build."]},';
if (!html.includes('"v":"v1.2.66"')) {
  html = replaceOnce(html,
    'window.PATCH_NOTES = [\n{"v":"v1.2.65"',
    'window.PATCH_NOTES = [\n' + NOTE + '\n{"v":"v1.2.65"',
    'PATCH_NOTES');
} else {
  const reNote = /\{"v":"v1\.2\.66","d":"2026-11-13","notes":\[[\s\S]*?\]\},/;
  if (reNote.test(html)) html = html.replace(reNote, NOTE);
}

must(html.includes('/* GLX-HANDS1265'), 'HANDS1265 must stay');
must(html.includes('/* GLX-HANDS1263'), 'HANDS1263 must stay');
must(html.includes("restoredFrom: '1e9db15'"), '1263 1.2.59 restore record must stay');
must(html.includes('/* GLX-HANDS1260'), 'HANDS1260 must stay');
must(!html.includes('/* GLX-HANDS1261'), 'HANDS1261 IIFE must stay removed');
must(html.includes('/* GLX-TBOX1264'), 'TBOX1264 must stay');
must(html.includes('__fpVm1259'), '1.2.59 viewmodel must stay');
must(html.includes('__fpa'), '__fpa path must stay');
must(!html.includes("['dU', 'dL', 'dR'].forEach"), 'gold D-pad must stay untouched');

const files = ['tools/content-source/hands-1266.js'].filter(f => fs.existsSync(path.join(root, f)));
must(files.length === 1, 'hands-1266.js is required');
{
  const bundled = files.map(f => fs.readFileSync(path.join(root, f), 'utf8').trim() + '\n').join('');
  const INJECT_MARK = '/* GLX-HANDS1266 (v1.2.66):';
  if (html.includes(INJECT_MARK)) {
    const i = html.indexOf(INJECT_MARK);
    const j = html.indexOf('</script>', i);
    must(j > i, 'cannot find </script> after existing 1266 IIFE');
    html = html.slice(0, i) + bundled + html.slice(j);
  } else {
    const k = html.lastIndexOf('</script>');
    must(k > 0, 'no closing script');
    html = html.slice(0, k) + '\n' + bundled + html.slice(k);
  }
}

must(html.includes("const GAME_VERSION = '1.2.66';"), 'version not bumped');
must(html.includes('"v":"v1.2.66"'), 'patch notes missing');
must(html.includes('Hands: sausage fingers sculpted toward realistic proportions'), 'required patch-notes phrase missing');
must(html.includes('GLX-HANDS1266'), 'hands 1266 IIFE missing');
must(html.includes('phalanxGeo'), '1266 phalanx geometry missing');
must(html.includes('nailPlate'), '1266 thin inset nails missing');
must(html.includes('applyRestCurl'), '1266 resting curl missing');
must(html.includes('upgradeThenar'), '1266 thenar base missing');
must(html.includes('flattened oval') || html.includes('flattened-oval') || html.includes('Flattened-oval'), 'oval cross-section mentioned');
must(html.includes('gold D-pad is left alone'), '1266 must record that the gold D-pad is left alone');
must(!html.includes("['dU', 'dL', 'dR'].forEach"), 'gold D-pad must stay untouched');
{
  const i = html.indexOf('GLX-HANDS1266');
  const slice = html.slice(i, i + 40000);
  must(!/\['dU'/.test(slice) && !/#dU/.test(slice), '1266 must not touch the gold D-pad');
  must(!/enableKinds|NEW_FP_KINDS\s*=/.test(slice), '1266 must not re-enable NEW_FP_KINDS');
  must(!/hands-1260|HANDS1260|hands-1261|HANDS1261|voxel arm/.test(slice), '1266 must not switch to the 1.2.60 or 1.2.61 arm');
}
{
  const i1266 = html.indexOf('/* GLX-HANDS1266');
  const i1265 = html.indexOf('/* GLX-HANDS1265');
  const iH1263 = html.indexOf('/* GLX-HANDS1263');
  must(i1266 > i1265 && i1266 > iH1263, 'HANDS1266 must be after HANDS1265 and HANDS1263');
}

fs.writeFileSync(path.join(root, 'index.html'), html);
console.log('index.html', before, '->', html.length);

fs.writeFileSync(path.join(root, 'version.json'), '{"v":"1.2.66"}\n');

let credits = fs.readFileSync(path.join(root, 'CREDITS.md'), 'utf8');
const block = `## v1.2.66 Sausage fingers sculpted toward realistic proportions

- Hands: sausage fingers sculpted toward realistic proportions, on the existing 1.2.59 \`__fpa\` / 1.2.57 / 1.2.65 classic hands. Each finger tapers from a thicker base to a narrower, rounded and slightly flattened tip, built as three phalanx segments (two for the thumb) with visible narrowing at the joints and slight knuckle bulges. The middle finger is longest, then the ring and index, then the pinky. The cross-section is a slightly flattened oval. On the empty hand the fingers take a natural resting curl (the pinky curls the most); item grip poses are unchanged. Nails are thin inset plates on the last segment. The thumb has a thicker thenar base, visually lower on the palm. Fingers are a bit thinner relative to the palm. 1.2.65 pixel shading (dither, crease AO, knuckle highlights) is kept. Geometry is cached. Same objects, hierarchy, pivots, grip poses and every animation. The 1.2.60 and 1.2.61 arm paths are not used. The view-model stays hidden in third person. The gold D-pad is left alone.

`;
if (!credits.includes('## v1.2.66')) {
  credits = credits.replace('## v1.2.65 Further pixel-sculpt detail on the classic hands', block + '## v1.2.65 Further pixel-sculpt detail on the classic hands');
} else {
  const a = credits.indexOf('## v1.2.66');
  const b = credits.indexOf('## v1.2.65', a + 1);
  if (a >= 0 && b > a) credits = credits.slice(0, a) + block + credits.slice(b);
}
fs.writeFileSync(path.join(root, 'CREDITS.md'), credits);
console.log('CREDITS.md updated');

function patchTests(dir) {
  for (const name of fs.readdirSync(dir)) {
    const fp = path.join(dir, name);
    const st = fs.statSync(fp);
    if (st.isDirectory()) { patchTests(fp); continue; }
    if (!/\.(mjs|cjs|js)$/.test(name)) continue;
    if (/^v1266-/.test(name)) continue;
    let t = fs.readFileSync(fp, 'utf8');
    const orig = t;
    t = t.replaceAll(
      'html.includes("const GAME_VERSION = \'1.2.65\';")',
      'html.includes("const GAME_VERSION = \'1.2.66\';") || html.includes("const GAME_VERSION = \'1.2.65\';")'
    );
    t = t.replaceAll(
      "ver.v === '1.2.65'",
      "ver.v === '1.2.66' || ver.v === '1.2.65'"
    );
    t = t.replaceAll(
      "'<!-- glencraft-build: b1265-v1.2.65 -->'",
      "'<!-- glencraft-build: b1266-v1.2.66 -->') || html.includes('<!-- glencraft-build: b1265-v1.2.65 -->'"
    );
    t = t.replace(/html\.slice\(notesStart, notesStart \+ 22000\)/g, 'html.slice(notesStart, notesStart + 28000)');
    t = t.replace(/html\.slice\(notesStart, notesStart \+ 26000\)/g, 'html.slice(notesStart, notesStart + 28000)');
    if (t !== orig) {
      for (let k = 0; k < 5; k++) {
        t = t.replaceAll("ver.v === '1.2.66' || ver.v === '1.2.66'", "ver.v === '1.2.66'");
        t = t.replaceAll('html.includes("const GAME_VERSION = \'1.2.66\';") || html.includes("const GAME_VERSION = \'1.2.66\';")',
                         'html.includes("const GAME_VERSION = \'1.2.66\';")');
        t = t.replaceAll("html.includes('<!-- glencraft-build: b1266-v1.2.66 -->') || html.includes('<!-- glencraft-build: b1266-v1.2.66 -->')",
                         "html.includes('<!-- glencraft-build: b1266-v1.2.66 -->')");
      }
      if (t !== orig) {
        fs.writeFileSync(fp, t);
        console.log('patched test', fp.slice(root.length + 1));
      }
    }
  }
}
patchTests(path.join(root, 'tests'));

/* v1265 IIFE slice should not include the following 1266 IIFE. */
{
  const fp = path.join(root, 'tests/v1265-release.mjs');
  let t = fs.readFileSync(fp, 'utf8');
  if (t.includes('html.slice(i1265, i1265 + 50000)') && !t.includes('i1265End')) {
    t = t.replace(
      'const h1265 = html.slice(i1265, i1265 + 50000);',
      "const i1265End = (() => {\n  const next = html.indexOf('\\n/* GLX-', i1265 + 10);\n  const scr = html.indexOf('</script>', i1265);\n  let end = i1265 + 50000;\n  if (next > i1265 && next < end) end = next;\n  if (scr > i1265 && scr < end) end = scr;\n  return end;\n})();\nconst h1265 = html.slice(i1265, i1265End);"
    );
    fs.writeFileSync(fp, t);
    console.log('scoped v1265 IIFE slice');
  }
}

console.log('build 1.2.66 done');

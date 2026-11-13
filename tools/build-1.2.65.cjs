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

/* ---- version bump (idempotent) ---- */
if (html.includes("const GAME_VERSION = '1.2.64';") && !html.includes("const GAME_VERSION = '1.2.65';")) {
  html = replaceOnce(html, "const GAME_VERSION = '1.2.64';", "const GAME_VERSION = '1.2.65';", 'GAME_VERSION');
}
must(html.includes("const GAME_VERSION = '1.2.65';"), 'GAME_VERSION is not 1.2.65');

if (!html.includes('<!-- glencraft-build: b1265-v1.2.65 -->')) {
  must(html.includes('<!-- glencraft-build: b1264-v1.2.64 -->'), 'b1264 marker missing');
  html = replaceOnce(html,
    '<!-- glencraft-build: b1264-v1.2.64 -->',
    '<!-- glencraft-build: b1264-v1.2.64 -->\n<!-- glencraft-build: b1265-v1.2.65 -->',
    'build marker');
}

const NOTE = '{"v":"v1.2.65","d":"2026-11-13","notes":["Hands: further pixel-sculpt detail on the classic hands. Knuckle and finger segmentation, a thumb pad, nail tips, palm creases, and skin-tone shading in small faceted steps (lighter on top, warmer and darker in the creases and between the fingers), plus wrist tendons. The sleeve has a rolled linen cuff with fold facets. The same objects, hierarchy, pivots, rig, per-item grips, hold offsets and every animation (swing, mine, place, idle, gun hip and ADS, torch) are kept. The view-model stays hidden in third person.","Hard-refresh to load this build."]},';
if (!html.includes('"v":"v1.2.65"')) {
  html = replaceOnce(html,
    'window.PATCH_NOTES = [\n{"v":"v1.2.64"',
    'window.PATCH_NOTES = [\n' + NOTE + '\n{"v":"v1.2.64"',
    'PATCH_NOTES');
} else {
  const reNote = /\{"v":"v1\.2\.65","d":"2026-11-13","notes":\[[\s\S]*?\]\},/;
  if (reNote.test(html)) html = html.replace(reNote, NOTE);
}

/* ---- keep every 1.2.60–1.2.64 IIFE; never re-enable 1260/1261; never touch the gold D-pad ---- */
must(html.includes('/* GLX-HANDS1263'), 'HANDS1263 must stay (1.2.59 arms)');
must(html.includes("restoredFrom: '1e9db15'"), '1263 1.2.59 restore record must stay');
must(html.includes('/* GLX-HANDS1260'), 'HANDS1260 must stay');
must(html.includes('/* GLX-HANDS1262'), 'HANDS1262 must stay');
must(!html.includes('/* GLX-HANDS1261'), 'HANDS1261 IIFE must stay removed');
must(html.includes('/* GLX-TORSO1262'), 'TORSO1262 must stay');
must(html.includes('/* GLX-TBOX1264'), 'TBOX1264 must stay');
must(html.includes('/* GLX-TBOX1262'), 'TBOX1262 must stay');
must(html.includes('/* GLX-TBOX1261'), 'TBOX1261 must stay');
must(html.includes('/* GLX-TBOX1260'), 'TBOX1260 must stay');
must(html.includes('/* GLX-PERF1261'), 'PERF1261 must stay');
must(html.includes('/* GLX-POP1261'), 'POP1261 must stay');
must(html.includes('__fpVm1259'), '1.2.59 viewmodel must stay');
must(html.includes('__fpa'), '__fpa path must stay');
must(!html.includes("['dU', 'dL', 'dR'].forEach"), 'gold D-pad must stay untouched');

/* ---- inject 1265 sculpt IIFE after HANDS1263 / TBOX1264 ---- */
const files = [
  'tools/content-source/hands-1265.js'
].filter(f => fs.existsSync(path.join(root, f)));
must(files.length === 1, 'hands-1265.js is required');
{
  const bundled = files.map(f => fs.readFileSync(path.join(root, f), 'utf8').trim() + '\n').join('');
  const INJECT_MARK = '/* GLX-HANDS1265 (v1.2.65):';
  if (html.includes(INJECT_MARK)) {
    const i = html.indexOf(INJECT_MARK);
    const j = html.indexOf('</script>', i);
    must(j > i, 'cannot find </script> after existing 1265 IIFE');
    html = html.slice(0, i) + bundled + html.slice(j);
  } else {
    const k = html.lastIndexOf('</script>');
    must(k > 0, 'no closing script');
    html = html.slice(0, k) + '\n' + bundled + html.slice(k);
  }
}

must(html.includes("const GAME_VERSION = '1.2.65';"), 'version not bumped');
must(html.includes('"v":"v1.2.65"'), 'patch notes missing');
must(html.includes('Hands: further pixel-sculpt detail on the classic hands'), 'required patch-notes phrase missing');
must(html.includes('GLX-HANDS1265'), 'hands 1265 IIFE missing');
must(html.includes('GLX-HANDS1263'), 'hands 1263 IIFE missing');
must(html.includes("restoredFrom: '1e9db15'"), '1263 records the 1.2.59 restore commit');
must(html.includes('fingerSegFacet'), '1265 faceted finger segmentation missing');
must(html.includes('knuckleFacet'), '1265 faceted knuckles missing');
must(html.includes('thumbPadGeo'), '1265 thumb pad missing');
must(html.includes('nailFacet'), '1265 nail tips missing');
must(html.includes('paintPalm'), '1265 palm creases (procedural) missing');
must(html.includes('BAYER8') && html.includes('rampDither') && html.includes('makeTex'), '1265 procedural Bayer-dithered palettes missing');
must(html.includes('tendonGeo'), '1265 wrist tendons missing');
must(html.includes('rolledCuffGeo'), '1265 rolled linen cuff missing');
must(html.includes('share(') && html.includes('mergeGeos'), '1265 cached/merged geometry helpers missing');
must(html.includes('flatShading: true'), '1265 faceted shading missing');
must(html.includes('gold D-pad is left alone'), '1265 must record that the gold D-pad is left alone');
must(html.includes('__glxSingleHum'), 'single-hum flag missing');
must(html.includes("SET.rdist = touchMode ? 4 : 8"), 'mobile rdist default is not 4');
must(!html.includes("['dU', 'dL', 'dR'].forEach"), 'gold D-pad must stay untouched');
{
  const i = html.indexOf('GLX-HANDS1265');
  const slice = html.slice(i, i + 50000);
  must(!/\['dU'/.test(slice) && !/#dU/.test(slice) && !/#dL/.test(slice), '1265 must not touch the gold D-pad');
  must(!/enableKinds|NEW_FP_KINDS\s*=/.test(slice), '1265 must not re-enable NEW_FP_KINDS or 1260 kinds');
  must(!/HANDS1260|hands-1260|voxel arm|hands-1261|HANDS1261/.test(slice), '1265 must not switch to the 1.2.60 or 1.2.61 arm');
}

/* 1265 must sit after 1263 and 1264 so it wins runtime wraps. */
{
  const i1265 = html.indexOf('/* GLX-HANDS1265');
  const iH1263 = html.indexOf('/* GLX-HANDS1263');
  const i1264 = html.indexOf('/* GLX-TBOX1264');
  must(i1265 > iH1263 && i1265 > i1264, 'HANDS1265 must be after HANDS1263 and TBOX1264');
}

fs.writeFileSync(path.join(root, 'index.html'), html);
console.log('index.html', before, '->', html.length);

fs.writeFileSync(path.join(root, 'version.json'), '{"v":"1.2.65"}\n');

let credits = fs.readFileSync(path.join(root, 'CREDITS.md'), 'utf8');
const block = `## v1.2.65 Further pixel-sculpt detail on the classic hands

- Hands: further pixel-sculpt detail on the classic hands (the 1.2.59 \`__fpa\` path with the 1.2.57–1.2.58 sculpt, restored in 1.2.63 from \`1e9db15\`). Finer pixel-polygon facets on the existing hand, forearm and sleeve meshes: knuckle and finger segmentation, a thumb pad, nail tips, palm creases, and skin-tone shading in small faceted steps (lighter on top, warmer and darker in the creases and between the fingers), plus wrist tendons. The sleeve has a rolled linen cuff with fold facets. Geometry is cached and merged so there are no stutter spikes.
- The same objects, hierarchy, pivots, rig, per-item grips, hold offsets and every animation (swing, mine, place, idle, gun hip and ADS, torch) are kept. The 1.2.60 HANDS1260 path and the 1.2.61 voxel arm are not used. The first-person view-model stays hidden in third person. The gold D-pad is left alone.

`;
if (!credits.includes('## v1.2.65')) {
  credits = credits.replace('## v1.2.64 TARDIS floor, touch piloting, and raised scanner', block + '## v1.2.64 TARDIS floor, touch piloting, and raised scanner');
} else {
  const a = credits.indexOf('## v1.2.65');
  const b = credits.indexOf('## v1.2.64', a + 1);
  if (a >= 0 && b > a) credits = credits.slice(0, a) + block + credits.slice(b);
}
fs.writeFileSync(path.join(root, 'CREDITS.md'), credits);
console.log('CREDITS.md updated');

/* ---- tests: accept 1.2.65 in version OR-chains; do not loosen v1265 itself ---- */
function patchTests(dir) {
  for (const name of fs.readdirSync(dir)) {
    const fp = path.join(dir, name);
    const st = fs.statSync(fp);
    if (st.isDirectory()) { patchTests(fp); continue; }
    if (!/\.(mjs|cjs|js)$/.test(name)) continue;
    if (/^v1265-/.test(name)) continue;
    let t = fs.readFileSync(fp, 'utf8');
    const orig = t;
    t = t.replaceAll(
      'html.includes("const GAME_VERSION = \'1.2.64\';")',
      'html.includes("const GAME_VERSION = \'1.2.65\';") || html.includes("const GAME_VERSION = \'1.2.64\';")'
    );
    t = t.replaceAll(
      "ver.v === '1.2.64'",
      "ver.v === '1.2.65' || ver.v === '1.2.64'"
    );
    t = t.replaceAll(
      "'<!-- glencraft-build: b1264-v1.2.64 -->'",
      "'<!-- glencraft-build: b1265-v1.2.65 -->') || html.includes('<!-- glencraft-build: b1264-v1.2.64 -->'"
    );
    t = t.replace(/html\.slice\(notesStart, notesStart \+ 14000\)/g, 'html.slice(notesStart, notesStart + 26000)');
    t = t.replace(/html\.slice\(notesStart, notesStart \+ 18000\)/g, 'html.slice(notesStart, notesStart + 26000)');
    t = t.replace(/html\.slice\(notesStart, notesStart \+ 22000\)/g, 'html.slice(notesStart, notesStart + 26000)');
    t = t.replace(/html\.slice\(notesStart, notesStart \+ 7000\)/g, 'html.slice(notesStart, notesStart + 26000)');
    t = t.replace(/html\.slice\(notesStart, notesStart \+ 8000\)/g, 'html.slice(notesStart, notesStart + 26000)');
    t = t.replace(/html\.slice\(notesStart, notesStart \+ 10000\)/g, 'html.slice(notesStart, notesStart + 26000)');
    if (t !== orig) {
      for (let k = 0; k < 5; k++) {
        t = t.replaceAll("ver.v === '1.2.65' || ver.v === '1.2.65'", "ver.v === '1.2.65'");
        t = t.replaceAll('html.includes("const GAME_VERSION = \'1.2.65\';") || html.includes("const GAME_VERSION = \'1.2.65\';")',
                         'html.includes("const GAME_VERSION = \'1.2.65\';")');
        t = t.replaceAll("html.includes('<!-- glencraft-build: b1265-v1.2.65 -->') || html.includes('<!-- glencraft-build: b1265-v1.2.65 -->')",
                         "html.includes('<!-- glencraft-build: b1265-v1.2.65 -->')");
      }
      if (t !== orig) {
        fs.writeFileSync(fp, t);
        console.log('patched test', fp.slice(root.length + 1));
      }
    }
  }
}
patchTests(path.join(root, 'tests'));

console.log('build 1.2.65 done');

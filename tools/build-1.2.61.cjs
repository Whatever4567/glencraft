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
if (html.includes("const GAME_VERSION = '1.2.60';")) {
  html = replaceOnce(html, "const GAME_VERSION = '1.2.60';", "const GAME_VERSION = '1.2.61';", 'GAME_VERSION');
}
must(html.includes("const GAME_VERSION = '1.2.61';"), 'GAME_VERSION is not 1.2.61');

if (!html.includes('<!-- glencraft-build: b1261-v1.2.61 -->')) {
  must(html.includes('<!-- glencraft-build: b1260-v1.2.60 -->'), 'b1260 marker missing');
  html = replaceOnce(html,
    '<!-- glencraft-build: b1260-v1.2.60 -->',
    '<!-- glencraft-build: b1260-v1.2.60 -->\n<!-- glencraft-build: b1261-v1.2.61 -->',
    'build marker');
}

const NOTE = '{"v":"v1.2.61","d":"2026-11-13","notes":["The time box windows are much larger now: a six-pane window on each door, on every side, nearly as wide as the door and about a fifth of its height, with thick dark frames and a warm glow, like a real police box.","The shell is a very dark navy, almost black, and no longer a bright royal blue. The POLICE PUBLIC CALL BOX signs glow from inside, and the blue roof lamp sits on the roof and glows.","The base step, corner posts and roof are in proportion with the real box, and every side is complete.","Inside, the rotor room is a proper room: roundels lining the walls, a console in the middle, and a glowing column that rises into a lit opening in the ceiling. The huge blank disc is gone.","The extra up, down, left and right pad is gone on touch as well. The left stick flies you.","Pistols and muskets show in first person with the two-handed wrap.","First-person hands sit lower and more centred, with the palm facing up, the wrist low, and the linen sleeve cuff at the bottom of the screen. The hands are a detailed pixel-polygon sculpt, and a block rests in the open palm.","The box no longer hums twice while you are flying it.","Hard-refresh to load this build."]},';
if (!html.includes('"v":"v1.2.61"')) {
  html = replaceOnce(html,
    'window.PATCH_NOTES = [\n{"v":"v1.2.60"',
    'window.PATCH_NOTES = [\n' + NOTE + '\n{"v":"v1.2.60"',
    'PATCH_NOTES');
}

/* ---- silence v130's second hum when 1261 is providing the only one ---- */
const HUM_OLD = 'humOn(!!(f && f.pilot && T.inside))';
const HUM_NEW = 'humOn(!!(f && f.pilot && T.inside && !window.__glxSingleHum))';
if (html.includes(HUM_OLD)) {
  html = replaceOnce(html, HUM_OLD, HUM_NEW, 'v130 humOn');
}
must(html.includes(HUM_NEW) || html.includes('humOn(!!(f && f.pilot && T.inside && !window.__glxSingleHum))'), 'v130 hum not gated');

/* ---- inject 1261 IIFEs before the closing script (idempotent replace) ---- */
const tboxSrc = fs.readFileSync(path.join(root, 'tools/content-source/tbox-1261.js'), 'utf8').trim() + '\n';
const handsSrc = fs.readFileSync(path.join(root, 'tools/content-source/hands-1261.js'), 'utf8').trim() + '\n';
const INJECT_MARK = '/* GLX-TBOX1261 (v1.2.61):';
if (html.includes(INJECT_MARK)) {
  const i = html.indexOf(INJECT_MARK);
  const j = html.indexOf('</script>', i);
  must(j > i, 'cannot find </script> after existing TBOX1261');
  html = html.slice(0, i) + tboxSrc + handsSrc + html.slice(j);
} else {
  const k = html.lastIndexOf('</script>');
  must(k > 0, 'no closing script');
  html = html.slice(0, k) + '\n' + tboxSrc + handsSrc + html.slice(k);
}

must(html.includes("const GAME_VERSION = '1.2.61';"), 'version not bumped');
must(html.includes('"v":"v1.2.61"'), 'patch notes missing');
must(html.includes('GLX-TBOX1261'), 'tbox 1261 IIFE missing');
must(html.includes('GLX-HANDS1261'), 'hands 1261 IIFE missing');
must(html.includes('GLX-TBOX1260'), '1.2.60 tbox IIFE must stay');
must(html.includes('winH: 17.75'), 'larger windows missing');
must(html.includes('__glxSingleHum'), 'single-hum flag missing');
must(html.includes("const GAME_VERSION = '1.2.61';") && !html.includes("const GAME_VERSION = '1.2.61';\nconst GAME_VERSION"), 'version not duplicated?');

fs.writeFileSync(path.join(root, 'index.html'), html);
console.log('index.html', before, '->', html.length);

/* ---- version.json ---- */
fs.writeFileSync(path.join(root, 'version.json'), '{"v":"1.2.61"}\n');

/* ---- CREDITS.md ---- */
let credits = fs.readFileSync(path.join(root, 'CREDITS.md'), 'utf8');
if (!credits.includes('## v1.2.61')) {
  const block = `## v1.2.61 Police-box windows, dark navy, and first-person arm framing

- The police-box windows are resized to match a real Series TARDIS: a six-pane window on each door, on every side, about a fifth of the door height and nearly the width of each leaf, with thick dark frames and a warm unlit glow. The shell is a very dark navy (MeshBasic, so game lighting cannot wash it to royal blue). The signs glow from inside, the blue lamp sits on the roof, and the plinth, posts and roof stack follow the same plan as 1.2.60 with a taller, visible base step. No third-party meshes.
- The rotor-room ceiling is a lit gallery ring with a hole for the column, not a huge blank disc. Roundels line the walls. The 1.2.60 interior console and procedural hum stay; the older v130 in-flight hum is gated so the box only hums once.
- First-person arms are reframed (hand centre-to-lower-right, palm up, wrist low, linen cuff at the bottom edge, short mostly-vertical forearm) and rebuilt as a pixel-polygon voxel sculpt with per-item grips. The 1.2.59 torch-arm freeze and pickaxe rightward shift are kept. Pistol and musket meshes are forced visible with the two-handed wrap.
- The extra touch flight pad is hidden by button labels as well as grid style, so it stays gone on Safari and Chrome. The leftover gold arrow D-pad (up / left / right) is hidden on touch; drop is kept.

`;
  credits = credits.replace('## v1.2.60 TARDIS overhaul and sculpted hands', block + '## v1.2.60 TARDIS overhaul and sculpted hands');
  fs.writeFileSync(path.join(root, 'CREDITS.md'), credits);
  console.log('CREDITS.md updated');
}

/* ---- tests: accept 1.2.61 in version OR-chains (idempotent) ---- */
function patchTests(dir) {
  for (const name of fs.readdirSync(dir)) {
    const fp = path.join(dir, name);
    const st = fs.statSync(fp);
    if (st.isDirectory()) { patchTests(fp); continue; }
    if (!/\.(mjs|cjs|js)$/.test(name)) continue;
    let t = fs.readFileSync(fp, 'utf8');
    const orig = t;
    t = t.replaceAll(
      'html.includes("const GAME_VERSION = \'1.2.60\';")',
      'html.includes("const GAME_VERSION = \'1.2.61\';") || html.includes("const GAME_VERSION = \'1.2.60\';")'
    );
    t = t.replaceAll(
      "ver.v === '1.2.60'",
      "ver.v === '1.2.61' || ver.v === '1.2.60'"
    );
    t = t.replaceAll(
      "ver.v === '1.2.61' || ver.v === '1.2.60' || ver.v === '1.2.59'",
      "ver.v === '1.2.61' || ver.v === '1.2.60' || ver.v === '1.2.59'"
    );
    t = t.replaceAll(
      "'<!-- glencraft-build: b1260-v1.2.60 -->'",
      "'<!-- glencraft-build: b1261-v1.2.61 -->') || html.includes('<!-- glencraft-build: b1260-v1.2.60 -->'"
    );
    if (t !== orig) {
      /* de-dup if this build is run twice */
      t = t.replace(/html\.includes\("const GAME_VERSION = '1\.2\.61';"\)(?: \|\| html\.includes\("const GAME_VERSION = '1\.2\.61';"\))+/g,
        'html.includes("const GAME_VERSION = \'1.2.61\';")');
      t = t.replace(/html\.includes\("const GAME_VERSION = '1\.2\.61';"\) \|\| html\.includes\("const GAME_VERSION = '1\.2\.60';"\) \|\| html\.includes\("const GAME_VERSION = '1\.2\.61';"\) \|\| html\.includes\("const GAME_VERSION = '1\.2\.60';"\)/g,
        'html.includes("const GAME_VERSION = \'1.2.61\';") || html.includes("const GAME_VERSION = \'1.2.60\';")');
      t = t.replace(/ver\.v === '1\.2\.61' \|\| ver\.v === '1\.2\.60' \|\| ver\.v === '1\.2\.61' \|\| ver\.v === '1\.2\.60'/g,
        "ver.v === '1.2.61' || ver.v === '1.2.60'");
      t = t.replace(/html\.includes\('<!-- glencraft-build: b1261-v1\.2\.61 -->'\) \|\| html\.includes\('<!-- glencraft-build: b1261-v1\.2\.61 -->'\)/g,
        "html.includes('<!-- glencraft-build: b1261-v1.2.61 -->')");
      for (let k = 0; k < 4; k++) {
        t = t.replaceAll("ver.v === '1.2.61' || ver.v === '1.2.61'", "ver.v === '1.2.61'");
        t = t.replaceAll('html.includes("const GAME_VERSION = \'1.2.61\';") || html.includes("const GAME_VERSION = \'1.2.61\';")',
                         'html.includes("const GAME_VERSION = \'1.2.61\';")');
        t = t.replaceAll("html.includes('<!-- glencraft-build: b1261-v1.2.61 -->') || html.includes('<!-- glencraft-build: b1261-v1.2.61 -->')",
                         "html.includes('<!-- glencraft-build: b1261-v1.2.61 -->')");
      }
      if (t !== orig) {
        fs.writeFileSync(fp, t);
        console.log('patched test', fp.slice(root.length + 1));
      }
    }
  }
}
patchTests(path.join(root, 'tests'));

console.log('build 1.2.61 done');

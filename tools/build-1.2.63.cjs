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
if (html.includes("const GAME_VERSION = '1.2.62';") && !html.includes("const GAME_VERSION = '1.2.63';")) {
  html = replaceOnce(html, "const GAME_VERSION = '1.2.62';", "const GAME_VERSION = '1.2.63';", 'GAME_VERSION');
}
must(html.includes("const GAME_VERSION = '1.2.63';"), 'GAME_VERSION is not 1.2.63');

if (!html.includes('<!-- glencraft-build: b1263-v1.2.63 -->')) {
  must(html.includes('<!-- glencraft-build: b1262-v1.2.62 -->'), 'b1262 marker missing');
  html = replaceOnce(html,
    '<!-- glencraft-build: b1262-v1.2.62 -->',
    '<!-- glencraft-build: b1262-v1.2.62 -->\n<!-- glencraft-build: b1263-v1.2.63 -->',
    'build marker');
}

const NOTE = '{"v":"v1.2.63","d":"2026-11-13","notes":["Hands restored to the pre-1.2.60 version. First-person arms, including how they hold and aim guns, match the 1.2.59 release — the last version before 1.2.60 turned a newer hand rig back on. The 1.2.59 torch and pickaxe fixes stay. In third person the first-person arm stays hidden.","Hard-refresh to load this build."]},';
if (!html.includes('"v":"v1.2.63"')) {
  html = replaceOnce(html,
    'window.PATCH_NOTES = [\n{"v":"v1.2.62"',
    'window.PATCH_NOTES = [\n' + NOTE + '\n{"v":"v1.2.62"',
    'PATCH_NOTES');
} else {
  const reNote = /\{"v":"v1\.2\.63","d":"2026-11-13","notes":\[[\s\S]*?\]\},/;
  if (reNote.test(html)) html = html.replace(reNote, NOTE);
}

/* ---- keep 1.2.62 original-arm restore, shirt sides, door; never re-add voxel arm ---- */
must(!html.includes('/* GLX-HANDS1261'), 'HANDS1261 IIFE must stay removed');
must(html.includes('/* GLX-HANDS1260'), 'HANDS1260 must stay (original arm)');
must(html.includes('/* GLX-HANDS1262'), 'HANDS1262 must stay (original-arm restore)');
must(html.includes('/* GLX-TORSO1262'), 'TORSO1262 must stay');
must(html.includes('/* GLX-TBOX1262'), 'TBOX1262 must stay');
must(html.includes('/* GLX-PERF1261'), 'PERF1261 must stay');
must(html.includes('/* GLX-POP1261'), 'POP1261 must stay');
must(html.includes('/* GLX-TBOX1261'), 'TBOX1261 must stay');
must(html.includes('__fpVm1259'), '1.2.59/60 viewmodel must stay');

/* ---- inject 1263 IIFEs if present (torso confirm, arm offsets, door, perf) ---- */
const files = [
  'tools/content-source/tbox-1263.js',
  'tools/content-source/torso-1263.js',
  'tools/content-source/hands-1263.js',
  'tools/content-source/perf-1263.js'
].filter(f => fs.existsSync(path.join(root, f)));
if (files.length) {
  const bundled = files.map(f => fs.readFileSync(path.join(root, f), 'utf8').trim() + '\n').join('');
  const INJECT_MARK = '/* GLX-TBOX1263 (v1.2.63):';
  const ALT_MARK = files.map(f => {
    const t = fs.readFileSync(path.join(root, f), 'utf8');
    const m = t.match(/\/\* GLX-[A-Z0-9]+ \(v1\.2\.63\):/);
    return m && m[0];
  }).find(Boolean);
  const mark = html.includes(INJECT_MARK) ? INJECT_MARK : (ALT_MARK && html.includes(ALT_MARK) ? ALT_MARK : null);
  if (mark) {
    const i = html.indexOf(mark);
    const j = html.indexOf('</script>', i);
    must(j > i, 'cannot find </script> after existing 1263 IIFE');
    html = html.slice(0, i) + bundled + html.slice(j);
  } else {
    const k = html.lastIndexOf('</script>');
    must(k > 0, 'no closing script');
    html = html.slice(0, k) + '\n' + bundled + html.slice(k);
  }
}

must(html.includes("const GAME_VERSION = '1.2.63';"), 'version not bumped');
must(html.includes('"v":"v1.2.63"'), 'patch notes missing');
must(html.includes('GLX-TBOX1262'), 'tbox 1262 IIFE missing');
must(html.includes('GLX-TORSO1262'), 'torso 1262 IIFE missing');
must(html.includes('GLX-HANDS1262'), 'hands 1262 IIFE missing');
must(html.includes('GLX-HANDS1263'), 'hands 1263 IIFE missing');
must(html.includes("restoredFrom: '1e9db15'"), '1263 records the 1.2.59 restore commit');
must(html.includes('GLX-TBOX1261'), '1.2.61 tbox IIFE must stay');
must(html.includes('GLX-PERF1261'), '1.2.61 perf IIFE must stay');
must(html.includes('GLX-POP1261'), '1.2.61 pop-star IIFE must stay');
must(html.includes('GLX-TBOX1260'), '1.2.60 tbox IIFE must stay');
must(html.includes('winH: 17.75'), 'larger windows missing');
must(html.includes('__glxSingleHum'), 'single-hum flag missing');
must(html.includes("SET.rdist = touchMode ? 4 : 8"), 'mobile rdist default is not 4');
must(!html.includes("['dU', 'dL', 'dR'].forEach"), 'gold D-pad must stay untouched');
must(html.includes('__fpVm1259'), 'original viewmodel must stay');
must(html.includes("Remove the 1.2.61 voxel-arm"), '1262 original-arm restore must stay');
{
  const i = html.indexOf('GLX-HANDS1262');
  const slice = html.slice(i, i + 20000);
  must(!/Vox\.prototype\.cube/.test(slice), '1262 must not add a new voxel mesh builder');
}

fs.writeFileSync(path.join(root, 'index.html'), html);
console.log('index.html', before, '->', html.length);

fs.writeFileSync(path.join(root, 'version.json'), '{"v":"1.2.63"}\n');

let credits = fs.readFileSync(path.join(root, 'CREDITS.md'), 'utf8');
const block = `## v1.2.63 Hands restored to the pre-1.2.60 version

- First-person arms and gun holds are restored exactly as they were in 1.2.59 (commit \`1e9db15\`, the last release before the 1.2.60 merge). That is the 1.2.49 \`__fpa\` path with the 1.2.57–1.2.58 sculpt and the 1.2.59 torch-pose freeze and pickaxe rightward shift, including pistol and musket hip and ADS with the original gun models.
- The 1.2.60 sculpted-hands re-enable (\`GLX-HANDS1260\` turning \`NEW_FP_KINDS\` on for every item, plus two-handed gun wraps) and the 1.2.62 wrist-pose tweak (\`shiftPoses\` in \`GLX-HANDS1262\`) are undone for the arm/hands only, by \`GLX-HANDS1263\`. The 1.2.61 voxel arm stays removed.
- The first-person view-model stays hidden in third person (the 1.2.62 hide is kept).
- Everything else from 1.2.60–1.2.62 is kept: TARDIS shell and rotor room, doors, shirt torso sides, render-distance cap, pop-star setting, touch LT doors. The gold D-pad is untouched.

`;
if (!credits.includes('## v1.2.63')) {
  credits = credits.replace('## v1.2.62 Original arm restored, shirt sides, time-box door', block + '## v1.2.62 Original arm restored, shirt sides, time-box door');
} else {
  const a = credits.indexOf('## v1.2.63');
  const b = credits.indexOf('## v1.2.62', a + 1);
  if (a >= 0 && b > a) credits = credits.slice(0, a) + block + credits.slice(b);
}
fs.writeFileSync(path.join(root, 'CREDITS.md'), credits);
console.log('CREDITS.md updated');

/* ---- tests: accept 1.2.63 in version OR-chains ---- */
function patchTests(dir) {
  for (const name of fs.readdirSync(dir)) {
    const fp = path.join(dir, name);
    const st = fs.statSync(fp);
    if (st.isDirectory()) { patchTests(fp); continue; }
    if (!/\.(mjs|cjs|js)$/.test(name)) continue;
    let t = fs.readFileSync(fp, 'utf8');
    const orig = t;
    t = t.replaceAll(
      'html.includes("const GAME_VERSION = \'1.2.62\';")',
      'html.includes("const GAME_VERSION = \'1.2.63\';") || html.includes("const GAME_VERSION = \'1.2.62\';")'
    );
    t = t.replaceAll(
      "ver.v === '1.2.62'",
      "ver.v === '1.2.63' || ver.v === '1.2.62'"
    );
    t = t.replaceAll(
      "'<!-- glencraft-build: b1262-v1.2.62 -->'",
      "'<!-- glencraft-build: b1263-v1.2.63 -->') || html.includes('<!-- glencraft-build: b1262-v1.2.62 -->'"
    );
    t = t.replace(/html\.slice\(notesStart, notesStart \+ 14000\)/g, 'html.slice(notesStart, notesStart + 18000)');
    t = t.replace(/html\.slice\(notesStart, notesStart \+ 7000\)/g, 'html.slice(notesStart, notesStart + 18000)');
    t = t.replace(/html\.slice\(notesStart, notesStart \+ 8000\)/g, 'html.slice(notesStart, notesStart + 18000)');
    t = t.replace(/html\.slice\(notesStart, notesStart \+ 10000\)/g, 'html.slice(notesStart, notesStart + 18000)');
    if (t !== orig) {
      for (let k = 0; k < 5; k++) {
        t = t.replaceAll("ver.v === '1.2.63' || ver.v === '1.2.63'", "ver.v === '1.2.63'");
        t = t.replaceAll('html.includes("const GAME_VERSION = \'1.2.63\';") || html.includes("const GAME_VERSION = \'1.2.63\';")',
                         'html.includes("const GAME_VERSION = \'1.2.63\';")');
        t = t.replaceAll("html.includes('<!-- glencraft-build: b1263-v1.2.63 -->') || html.includes('<!-- glencraft-build: b1263-v1.2.63 -->')",
                         "html.includes('<!-- glencraft-build: b1263-v1.2.63 -->')");
      }
      if (t !== orig) {
        fs.writeFileSync(fp, t);
        console.log('patched test', fp.slice(root.length + 1));
      }
    }
  }
}
patchTests(path.join(root, 'tests'));

console.log('build 1.2.63 done');

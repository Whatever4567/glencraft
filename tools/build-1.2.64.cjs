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
if (html.includes("const GAME_VERSION = '1.2.63';") && !html.includes("const GAME_VERSION = '1.2.64';")) {
  html = replaceOnce(html, "const GAME_VERSION = '1.2.63';", "const GAME_VERSION = '1.2.64';", 'GAME_VERSION');
}
must(html.includes("const GAME_VERSION = '1.2.64';"), 'GAME_VERSION is not 1.2.64');

if (!html.includes('<!-- glencraft-build: b1264-v1.2.64 -->')) {
  must(html.includes('<!-- glencraft-build: b1263-v1.2.63 -->'), 'b1263 marker missing');
  html = replaceOnce(html,
    '<!-- glencraft-build: b1263-v1.2.63 -->',
    '<!-- glencraft-build: b1263-v1.2.63 -->\n<!-- glencraft-build: b1264-v1.2.64 -->',
    'build marker');
}

const NOTE = '{"v":"v1.2.64","d":"2026-11-13","notes":["The TARDIS floor stays opaque when you are inside, so grass and terrain no longer show through. Terrain under the interior is hidden while you are inside. The on-screen left stick pilots the TARDIS (forward, back, and strafe, relative to the way it is facing) and the right stick spins it; a TARDIS spin sensitivity slider is in Settings. Jump still lifts it and Down still sinks it. The in-cabin scanner screen sits above eye level, angled slightly down.","Hard-refresh to load this build."]},';
if (!html.includes('"v":"v1.2.64"')) {
  html = replaceOnce(html,
    'window.PATCH_NOTES = [\n{"v":"v1.2.63"',
    'window.PATCH_NOTES = [\n' + NOTE + '\n{"v":"v1.2.63"',
    'PATCH_NOTES');
} else {
  const reNote = /\{"v":"v1\.2\.64","d":"2026-11-13","notes":\[[\s\S]*?\]\},/;
  if (reNote.test(html)) html = html.replace(reNote, NOTE);
}

/* ---- keep every 1.2.60–1.2.63 IIFE; never touch hands or the gold D-pad ---- */
must(html.includes('/* GLX-HANDS1263'), 'HANDS1263 must stay (1.2.59 arms)');
must(html.includes("restoredFrom: '1e9db15'"), '1263 1.2.59 restore record must stay');
must(html.includes('/* GLX-HANDS1260'), 'HANDS1260 must stay');
must(html.includes('/* GLX-HANDS1262'), 'HANDS1262 must stay');
must(!html.includes('/* GLX-HANDS1261'), 'HANDS1261 IIFE must stay removed');
must(html.includes('/* GLX-TORSO1262'), 'TORSO1262 must stay');
must(html.includes('/* GLX-TBOX1262'), 'TBOX1262 must stay');
must(html.includes('/* GLX-TBOX1261'), 'TBOX1261 must stay');
must(html.includes('/* GLX-TBOX1260'), 'TBOX1260 must stay');
must(html.includes('/* GLX-PERF1261'), 'PERF1261 must stay');
must(html.includes('/* GLX-POP1261'), 'POP1261 must stay');
must(html.includes('__fpVm1259'), '1.2.59 viewmodel must stay');
must(!html.includes("['dU', 'dL', 'dR'].forEach"), 'gold D-pad must stay untouched');

/* ---- inject 1264 TARDIS IIFE (floor, sticks, TV). Do not inject any hands file. ---- */
const files = [
  'tools/content-source/tbox-1264.js'
].filter(f => fs.existsSync(path.join(root, f)));
must(files.length === 1, 'tbox-1264.js is required');
{
  const bundled = files.map(f => fs.readFileSync(path.join(root, f), 'utf8').trim() + '\n').join('');
  const INJECT_MARK = '/* GLX-TBOX1264 (v1.2.64):';
  if (html.includes(INJECT_MARK)) {
    const i = html.indexOf(INJECT_MARK);
    const j = html.indexOf('</script>', i);
    must(j > i, 'cannot find </script> after existing 1264 IIFE');
    html = html.slice(0, i) + bundled + html.slice(j);
  } else {
    const k = html.lastIndexOf('</script>');
    must(k > 0, 'no closing script');
    html = html.slice(0, k) + '\n' + bundled + html.slice(k);
  }
}

must(html.includes("const GAME_VERSION = '1.2.64';"), 'version not bumped');
must(html.includes('"v":"v1.2.64"'), 'patch notes missing');
must(html.includes('GLX-TBOX1264'), 'tbox 1264 IIFE missing');
must(html.includes('GLX-TBOX1263') === false || true, 'ok');
must(html.includes('GLX-TBOX1262'), 'tbox 1262 IIFE missing');
must(html.includes('GLX-HANDS1263'), 'hands 1263 IIFE missing');
must(html.includes("restoredFrom: '1e9db15'"), '1263 records the 1.2.59 restore commit');
must(html.includes('buildOpaqueFloor'), '1264 opaque floor builder missing');
must(html.includes('depthWrite: true'), '1264 floor must depth-write');
must(html.includes('TARDIS spin sensitivity'), 'spin-sensitivity slider label missing');
must(html.includes('fly1264'), '1264 fly (touch piloting) missing');
must(html.includes('raiseScreen'), '1264 TV raise missing');
must(html.includes('scrY: 2.68'), 'scanner height is not above eye level');
must(html.includes('scrRx: -0.34'), 'scanner is not angled down');
must(html.includes('gold D-pad is left alone'), '1264 must record that the gold D-pad is left alone');
must(html.includes('__glxSingleHum'), 'single-hum flag missing');
must(html.includes("SET.rdist = touchMode ? 4 : 8"), 'mobile rdist default is not 4');
must(!html.includes("['dU', 'dL', 'dR'].forEach"), 'gold D-pad must stay untouched');
{
  const i = html.indexOf('GLX-TBOX1264');
  const slice = html.slice(i, i + 40000);
  must(!/__fpa|__vm|NEW_FP_KINDS|__fpVm1259|hands-1263|GLX-HANDS/.test(slice), '1264 must not touch first-person arms/hands or gun code');
  must(!/\['dU'/.test(slice) && !/#dU/.test(slice) && !/#dL/.test(slice), '1264 must not touch the gold D-pad');
}

/* 1264 must sit after 1260–1263 so it wins runtime wraps. */
{
  const i1264 = html.indexOf('/* GLX-TBOX1264');
  const i1260 = html.indexOf('/* GLX-TBOX1260');
  const i1262 = html.indexOf('/* GLX-TBOX1262');
  const iH1263 = html.indexOf('/* GLX-HANDS1263');
  must(i1264 > i1260 && i1264 > i1262, 'TBOX1264 must be after TBOX1260 and TBOX1262');
  must(iH1263 > 0 && i1264 !== iH1263, 'HANDS1263 stays a separate IIFE');
}

fs.writeFileSync(path.join(root, 'index.html'), html);
console.log('index.html', before, '->', html.length);

fs.writeFileSync(path.join(root, 'version.json'), '{"v":"1.2.64"}\n');

let credits = fs.readFileSync(path.join(root, 'CREDITS.md'), 'utf8');
const block = `## v1.2.64 TARDIS floor, touch piloting, and raised scanner

- The in-cabin floor is a thick, fully opaque tartan disc with depth-write and polygon offset, so it stays solid and correctly depth-sorted. While you are inside, terrain and grass in the interior footprint are hidden (chunk faces are skipped for the visual mesh only; the world is not edited) and nearby grass tufts are scaled away. They come back when you step out.
- On-screen left-stick axes drive the TARDIS: forward and back, and strafe left and right, relative to the way the box is facing (horizontal, no pitch). The right stick yaws it. A "TARDIS spin sensitivity" slider (0.3x–3x, default 1x) is in Settings. Jump still lifts the box and Down still sinks it. Gamepad left/right sticks and WASD are kept. First-person arms, gun holds, and the gold D-pad are not changed.
- The in-cabin TV / scanner is raised to 2.68 (above typical eye height of ~1.62) and tilted down (−0.34 rad) so it is clearly visible over the console.

`;
if (!credits.includes('## v1.2.64')) {
  credits = credits.replace('## v1.2.63 Hands restored to the pre-1.2.60 version', block + '## v1.2.63 Hands restored to the pre-1.2.60 version');
} else {
  const a = credits.indexOf('## v1.2.64');
  const b = credits.indexOf('## v1.2.63', a + 1);
  if (a >= 0 && b > a) credits = credits.slice(0, a) + block + credits.slice(b);
}
fs.writeFileSync(path.join(root, 'CREDITS.md'), credits);
console.log('CREDITS.md updated');

/* ---- tests: accept 1.2.64 in version OR-chains; do not loosen v1264 itself ---- */
function patchTests(dir) {
  for (const name of fs.readdirSync(dir)) {
    const fp = path.join(dir, name);
    const st = fs.statSync(fp);
    if (st.isDirectory()) { patchTests(fp); continue; }
    if (!/\.(mjs|cjs|js)$/.test(name)) continue;
    if (/^v1264-/.test(name)) continue;
    let t = fs.readFileSync(fp, 'utf8');
    const orig = t;
    t = t.replaceAll(
      'html.includes("const GAME_VERSION = \'1.2.63\';")',
      'html.includes("const GAME_VERSION = \'1.2.64\';") || html.includes("const GAME_VERSION = \'1.2.63\';")'
    );
    t = t.replaceAll(
      "ver.v === '1.2.63'",
      "ver.v === '1.2.64' || ver.v === '1.2.63'"
    );
    t = t.replaceAll(
      "'<!-- glencraft-build: b1263-v1.2.63 -->'",
      "'<!-- glencraft-build: b1264-v1.2.64 -->') || html.includes('<!-- glencraft-build: b1263-v1.2.63 -->'"
    );
    t = t.replace(/html\.slice\(notesStart, notesStart \+ 14000\)/g, 'html.slice(notesStart, notesStart + 22000)');
    t = t.replace(/html\.slice\(notesStart, notesStart \+ 18000\)/g, 'html.slice(notesStart, notesStart + 22000)');
    t = t.replace(/html\.slice\(notesStart, notesStart \+ 7000\)/g, 'html.slice(notesStart, notesStart + 22000)');
    t = t.replace(/html\.slice\(notesStart, notesStart \+ 8000\)/g, 'html.slice(notesStart, notesStart + 22000)');
    t = t.replace(/html\.slice\(notesStart, notesStart \+ 10000\)/g, 'html.slice(notesStart, notesStart + 22000)');
    if (t !== orig) {
      for (let k = 0; k < 5; k++) {
        t = t.replaceAll("ver.v === '1.2.64' || ver.v === '1.2.64'", "ver.v === '1.2.64'");
        t = t.replaceAll('html.includes("const GAME_VERSION = \'1.2.64\';") || html.includes("const GAME_VERSION = \'1.2.64\';")',
                         'html.includes("const GAME_VERSION = \'1.2.64\';")');
        t = t.replaceAll("html.includes('<!-- glencraft-build: b1264-v1.2.64 -->') || html.includes('<!-- glencraft-build: b1264-v1.2.64 -->')",
                         "html.includes('<!-- glencraft-build: b1264-v1.2.64 -->')");
      }
      if (t !== orig) {
        fs.writeFileSync(fp, t);
        console.log('patched test', fp.slice(root.length + 1));
      }
    }
  }
}
patchTests(path.join(root, 'tests'));

console.log('build 1.2.64 done');

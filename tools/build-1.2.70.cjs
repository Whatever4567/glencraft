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

if (html.includes("const GAME_VERSION = '1.2.69';") && !html.includes("const GAME_VERSION = '1.2.70';")) {
  html = replaceOnce(html, "const GAME_VERSION = '1.2.69';", "const GAME_VERSION = '1.2.70';", 'GAME_VERSION');
}
must(html.includes("const GAME_VERSION = '1.2.70';"), 'GAME_VERSION is not 1.2.70');

if (!html.includes('<!-- glencraft-build: b1270-v1.2.70 -->')) {
  must(html.includes('<!-- glencraft-build: b1269-v1.2.69 -->'), 'b1269 marker missing');
  html = replaceOnce(html,
    '<!-- glencraft-build: b1269-v1.2.69 -->',
    '<!-- glencraft-build: b1269-v1.2.69 -->\n<!-- glencraft-build: b1270-v1.2.70 -->',
    'build marker');
}

const NOTE = '{"v":"v1.2.70","d":"2026-11-13","notes":["Hands: a solid sculpt pass on the classic arms. The skin is a lighter, warmer natural flesh tone (matching the v1262 refs), not dark wood-brown. The fingers are fleshy rather than claw-like: rounder padded tips, a subtler knuckle shade, a sparse specular highlight, and a limited palette. The forearm and cuff are slimmer and less blocky, with a taper and a bevelled, better-shaded sleeve cuff.","Grips still wrap the torch, pistol, sword, block and bucket. Every animation (swing, mine, place, idle, hip-fire, aim-down-sights) is left untouched. First-person hands stay hidden in third person, and the gold D-pad is left alone.","Hard-refresh to load this build."]},';
if (!html.includes('"v":"v1.2.70"')) {
  html = replaceOnce(html,
    'window.PATCH_NOTES = [\n{"v":"v1.2.69"',
    'window.PATCH_NOTES = [\n' + NOTE + '\n{"v":"v1.2.69"',
    'PATCH_NOTES');
} else {
  const reNote = /\{"v":"v1\.2\.70","d":"2026-11-13","notes":\[[\s\S]*?\]\},/;
  if (reNote.test(html)) html = html.replace(reNote, NOTE);
}

must(html.includes('/* GLX-EG1269'), 'EG1269 must stay');
must(html.includes('/* GLX-CASTLE1268'), 'CASTLE1268 must stay');
must(html.includes('/* GLX-MOBS1267'), 'MOBS1267 must stay');
must(html.includes('/* GLX-HANDS1266'), 'HANDS1266 must stay');
must(html.includes('/* GLX-HANDS1265'), 'HANDS1265 must stay');
must(html.includes('/* GLX-HANDS1263'), 'HANDS1263 must stay');
must(html.includes("restoredFrom: '1e9db15'"), '1263 restore must stay');
must(!html.includes('/* GLX-HANDS1261'), 'HANDS1261 must stay removed');
must(!html.includes("['dU', 'dL', 'dR'].forEach"), 'gold D-pad must stay untouched');

const files = ['tools/content-source/hands-1270.js'].filter(f => fs.existsSync(path.join(root, f)));
must(files.length === 1, 'hands-1270.js is required');
{
  const bundled = files.map(f => fs.readFileSync(path.join(root, f), 'utf8').trim() + '\n').join('');
  const INJECT_MARK = '/* GLX-HANDS1270 (v1.2.70):';
  if (html.includes(INJECT_MARK)) {
    const i = html.indexOf(INJECT_MARK);
    const j = html.indexOf('</script>', i);
    must(j > i, 'cannot find </script> after existing 1270 IIFE');
    html = html.slice(0, i) + bundled + html.slice(j);
  } else {
    const k = html.lastIndexOf('</script>');
    must(k > 0, 'no closing script');
    html = html.slice(0, k) + '\n' + bundled + html.slice(k);
  }
}

must(html.includes("const GAME_VERSION = '1.2.70';"), 'version not bumped');
must(html.includes('"v":"v1.2.70"'), 'patch notes missing');
must(html.includes('lighter, warmer natural flesh'), 'required skin phrase missing');
must(html.includes('fleshy rather than claw-like'), 'required fingers phrase missing');
must(html.includes('forearm and cuff are slimmer'), 'required forearm phrase missing');
must(html.includes('GLX-HANDS1270'), 'hands 1270 IIFE missing');
must(html.includes('gold D-pad is left alone'), '1270 must record that the gold D-pad is left alone');
{
  const i = html.indexOf('GLX-HANDS1270');
  const next = html.indexOf('\n/* GLX-', i + 10);
  const scr = html.indexOf('</script>', i);
  let end = i + 80000;
  if (next > i && next < end) end = next;
  if (scr > i && scr < end) end = scr;
  const slice = html.slice(i, end);
  must(!/\['dU'/.test(slice) && !/#dU/.test(slice), '1270 must not touch the gold D-pad');
  must(!/enableKinds|NEW_FP_KINDS\s*=/.test(slice), '1270 must not re-enable NEW_FP_KINDS');
  must(!/\bswingT\s*=/.test(slice) && !/\bmineT\s*=/.test(slice), '1270 must not write animation timers');
}

{
  const i1270 = html.indexOf('/* GLX-HANDS1270');
  const i1269 = html.indexOf('/* GLX-EG1269');
  must(i1270 > i1269, 'HANDS1270 must be after EG1269');
}

fs.writeFileSync(path.join(root, 'index.html'), html);
console.log('index.html', before, '->', html.length);

fs.writeFileSync(path.join(root, 'version.json'), '{"v":"1.2.70"}\n');

let credits = fs.readFileSync(path.join(root, 'CREDITS.md'), 'utf8');
const block = `## v1.2.70 A solid sculpt pass: lighter flesh, fleshy fingers, a slimmer sleeve

- A sculpt pass on the classic 1.2.59 \`__fpa\` path, the 1.2.57 meshes and the 1.2.66 fingers — the arm is not replaced, and no animation (swing, mine, place, idle, hip-fire, aim-down-sights) is touched.
- Skin is a lighter, warmer natural flesh tone matching the v1262 refs, not dark wood-brown. Fingers are fleshy rather than claw-like: rounder padded tips, a subtler knuckle shade, a sparse specular highlight, and a limited palette.
- The forearm and cuff are slimmer and less blocky, with a taper and a bevelled, better-shaded sleeve cuff. Grips still wrap the torch, pistol, sword, block and bucket.
- First-person hands stay hidden in third person. The gold D-pad is left alone.

`;
if (!credits.includes('## v1.2.70')) {
  credits = credits.replace('## v1.2.69 Egypt land', block + '## v1.2.69 Egypt land');
} else {
  const a = credits.indexOf('## v1.2.70');
  const b = credits.indexOf('## v1.2.69', a + 1);
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
    if (/^v1270-/.test(name)) continue;
    let t = fs.readFileSync(fp, 'utf8');
    const orig = t;
    t = t.replaceAll(
      'html.includes("const GAME_VERSION = \'1.2.69\';")',
      'html.includes("const GAME_VERSION = \'1.2.70\';") || html.includes("const GAME_VERSION = \'1.2.69\';")'
    );
    t = t.replaceAll(
      "ver.v === '1.2.69'",
      "ver.v === '1.2.70' || ver.v === '1.2.69'"
    );
    t = t.replaceAll(
      "'<!-- glencraft-build: b1269-v1.2.69 -->'",
      "'<!-- glencraft-build: b1270-v1.2.70 -->') || html.includes('<!-- glencraft-build: b1269-v1.2.69 -->'"
    );
    t = t.replace(/html\.slice\(notesStart, notesStart \+ 46000\)/g, 'html.slice(notesStart, notesStart + 52000)');
    if (t !== orig) {
      for (let k = 0; k < 5; k++) {
        t = t.replaceAll("ver.v === '1.2.70' || ver.v === '1.2.70'", "ver.v === '1.2.70'");
        t = t.replaceAll('html.includes("const GAME_VERSION = \'1.2.70\';") || html.includes("const GAME_VERSION = \'1.2.70\';")',
                         'html.includes("const GAME_VERSION = \'1.2.70\';")');
        t = t.replaceAll("html.includes('<!-- glencraft-build: b1270-v1.2.70 -->') || html.includes('<!-- glencraft-build: b1270-v1.2.70 -->')",
                         "html.includes('<!-- glencraft-build: b1270-v1.2.70 -->')");
      }
      if (t !== orig) {
        fs.writeFileSync(fp, t);
        console.log('patched test', fp.slice(root.length + 1));
      }
    }
  }
}
patchTests(path.join(root, 'tests'));

{
  const fp = path.join(root, 'tests/v1269-release.mjs');
  let t = fs.readFileSync(fp, 'utf8');
  if (t.includes('html.slice(i1269, i1269 + 80000)') && !t.includes('i1269End')) {
    t = t.replace(
      'const h1269 = html.slice(i1269, i1269 + 80000);',
      "const i1269End = (() => {\n  const next = html.indexOf('\\n/* GLX-', i1269 + 10);\n  const scr = html.indexOf('</script>', i1269);\n  let end = i1269 + 80000;\n  if (next > i1269 && next < end) end = next;\n  if (scr > i1269 && scr < end) end = scr;\n  return end;\n})();\nconst h1269 = html.slice(i1269, i1269End);"
    );
    fs.writeFileSync(fp, t);
    console.log('scoped v1269 IIFE slice');
  } else {
    console.log('v1269 IIFE slice already scoped or uses i1269End');
  }
}

console.log('build 1.2.70 done');

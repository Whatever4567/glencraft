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

if (html.includes("const GAME_VERSION = '1.2.70';") && !html.includes("const GAME_VERSION = '1.2.71';")) {
  html = replaceOnce(html, "const GAME_VERSION = '1.2.70';", "const GAME_VERSION = '1.2.71';", 'GAME_VERSION');
}
must(html.includes("const GAME_VERSION = '1.2.71';"), 'GAME_VERSION is not 1.2.71');

if (!html.includes('<!-- glencraft-build: b1271-v1.2.71 -->')) {
  must(html.includes('<!-- glencraft-build: b1270-v1.2.70 -->'), 'b1270 marker missing');
  html = replaceOnce(html,
    '<!-- glencraft-build: b1270-v1.2.70 -->',
    '<!-- glencraft-build: b1270-v1.2.70 -->\n<!-- glencraft-build: b1271-v1.2.71 -->',
    'build marker');
}

const NOTE = '{"v":"v1.2.71","d":"2026-11-13","notes":["Hands: a second sculpt pass. The open palm is narrower and thinner, with a slight cup and a bevel; the skin is a softer, desaturated natural pink-beige (less orange / terracotta), with a palm-centre shade and a rim light. The thumb is a proper 2-segment tapered digit angled off the palm, not a sphere. Finger cross-sections are rounder, with less ring segmentation, and the nails are slightly lighter at the tips. The cuff reads as a white / cream shirt sleeve: lighter, with fold shading, a soft hem line, and a slight flare.","A static view-model offset (not an animation change) lifts the pistol and torch so the knuckles and wrapped fingers show at the bottom right. Grips still wrap the torch, pistol, sword, block and bucket. Every animation (swing, mine, place, idle, hip-fire, aim-down-sights) is left untouched. First-person hands stay hidden in third person, and the gold D-pad is left alone.","Hard-refresh to load this build."]},';
if (!html.includes('"v":"v1.2.71"')) {
  html = replaceOnce(html,
    'window.PATCH_NOTES = [\n{"v":"v1.2.70"',
    'window.PATCH_NOTES = [\n' + NOTE + '\n{"v":"v1.2.70"',
    'PATCH_NOTES');
} else {
  const reNote = /\{"v":"v1\.2\.71","d":"2026-11-13","notes":\[[\s\S]*?\]\},/;
  if (reNote.test(html)) html = html.replace(reNote, NOTE);
}

must(html.includes('/* GLX-HANDS1270'), 'HANDS1270 must stay');
must(html.includes('/* GLX-EG1269'), 'EG1269 must stay');
must(html.includes('/* GLX-CASTLE1268'), 'CASTLE1268 must stay');
must(html.includes('/* GLX-MOBS1267'), 'MOBS1267 must stay');
must(html.includes('/* GLX-HANDS1266'), 'HANDS1266 must stay');
must(html.includes('/* GLX-HANDS1265'), 'HANDS1265 must stay');
must(html.includes('/* GLX-HANDS1263'), 'HANDS1263 must stay');
must(html.includes("restoredFrom: '1e9db15'"), '1263 restore must stay');
must(!html.includes('/* GLX-HANDS1261'), 'HANDS1261 must stay removed');
must(!html.includes("['dU', 'dL', 'dR'].forEach"), 'gold D-pad must stay untouched');

const files = ['tools/content-source/hands-1271.js'].filter(f => fs.existsSync(path.join(root, f)));
must(files.length === 1, 'hands-1271.js is required');
{
  const bundled = files.map(f => fs.readFileSync(path.join(root, f), 'utf8').trim() + '\n').join('');
  const INJECT_MARK = '/* GLX-HANDS1271 (v1.2.71):';
  if (html.includes(INJECT_MARK)) {
    const i = html.indexOf(INJECT_MARK);
    const j = html.indexOf('</script>', i);
    must(j > i, 'cannot find </script> after existing 1271 IIFE');
    html = html.slice(0, i) + bundled + html.slice(j);
  } else {
    const k = html.lastIndexOf('</script>');
    must(k > 0, 'no closing script');
    html = html.slice(0, k) + '\n' + bundled + html.slice(k);
  }
}

must(html.includes("const GAME_VERSION = '1.2.71';"), 'version not bumped');
must(html.includes('"v":"v1.2.71"'), 'patch notes missing');
must(html.includes('narrower and thinner'), 'required palm phrase missing');
must(html.includes('pink-beige'), 'required skin phrase missing');
must(html.includes('2-segment tapered digit'), 'required thumb phrase missing');
must(html.includes('white / cream shirt sleeve') || html.includes('white / cream'), 'required cuff phrase missing');
must(html.includes('GLX-HANDS1271'), 'hands 1271 IIFE missing');
must(html.includes('gold D-pad is left alone'), '1271 must record that the gold D-pad is left alone');
{
  const i = html.indexOf('GLX-HANDS1271');
  const next = html.indexOf('\n/* GLX-', i + 10);
  const scr = html.indexOf('</script>', i);
  let end = i + 80000;
  if (next > i && next < end) end = next;
  if (scr > i && scr < end) end = scr;
  const slice = html.slice(i, end);
  must(!/\['dU'/.test(slice) && !/#dU/.test(slice), '1271 must not touch the gold D-pad');
  must(!/enableKinds|NEW_FP_KINDS\s*=/.test(slice), '1271 must not re-enable NEW_FP_KINDS');
  must(!/\bswingT\s*=/.test(slice) && !/\bmineT\s*=/.test(slice), '1271 must not write animation timers');
}

{
  const i1271 = html.indexOf('/* GLX-HANDS1271');
  const i1270 = html.indexOf('/* GLX-HANDS1270');
  must(i1271 > i1270, 'HANDS1271 must be after HANDS1270');
}

fs.writeFileSync(path.join(root, 'index.html'), html);
console.log('index.html', before, '->', html.length);

fs.writeFileSync(path.join(root, 'version.json'), '{"v":"1.2.71"}\n');

let credits = fs.readFileSync(path.join(root, 'CREDITS.md'), 'utf8');
const block = `## v1.2.71 A second sculpt pass: a narrower palm, a real thumb, a cream cuff

- A second sculpt pass on the classic 1.2.59 \`__fpa\` path, the 1.2.57 meshes, the 1.2.66 fingers and the 1.2.70 flesh — the arm is not replaced, and no animation (swing, mine, place, idle, hip-fire, aim-down-sights) is touched.
- The open palm is narrower and thinner, with a slight cup and a bevel. Skin is a softer, desaturated natural pink-beige (less orange / terracotta), with a palm-centre shade and a rim light.
- The thumb is a proper 2-segment tapered digit angled off the palm, not a sphere. Finger cross-sections are rounder, with less ring segmentation, and the nails are slightly lighter at the tips.
- The cuff reads as a white / cream shirt sleeve: lighter, with fold shading, a soft hem line, and a slight flare rather than a box. A static view-model offset (not an animation change) lifts the pistol and torch so the knuckles and wrapped fingers show at the bottom right. Grips still wrap the torch, pistol, sword, block and bucket.
- First-person hands stay hidden in third person. The gold D-pad is left alone.

`;
if (!credits.includes('## v1.2.71')) {
  credits = credits.replace('## v1.2.70 A solid sculpt pass', block + '## v1.2.70 A solid sculpt pass');
} else {
  const a = credits.indexOf('## v1.2.71');
  const b = credits.indexOf('## v1.2.70', a + 1);
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
    if (/^v1271-/.test(name)) continue;
    let t = fs.readFileSync(fp, 'utf8');
    const orig = t;
    t = t.replaceAll(
      'html.includes("const GAME_VERSION = \'1.2.70\';")',
      'html.includes("const GAME_VERSION = \'1.2.71\';") || html.includes("const GAME_VERSION = \'1.2.70\';")'
    );
    t = t.replaceAll(
      "ver.v === '1.2.70'",
      "ver.v === '1.2.71' || ver.v === '1.2.70'"
    );
    t = t.replaceAll(
      "'<!-- glencraft-build: b1270-v1.2.70 -->'",
      "'<!-- glencraft-build: b1271-v1.2.71 -->') || html.includes('<!-- glencraft-build: b1270-v1.2.70 -->'"
    );
    t = t.replace(/html\.slice\(notesStart, notesStart \+ 52000\)/g, 'html.slice(notesStart, notesStart + 58000)');
    if (t !== orig) {
      for (let k = 0; k < 5; k++) {
        t = t.replaceAll("ver.v === '1.2.71' || ver.v === '1.2.71'", "ver.v === '1.2.71'");
        t = t.replaceAll('html.includes("const GAME_VERSION = \'1.2.71\';") || html.includes("const GAME_VERSION = \'1.2.71\';")',
                         'html.includes("const GAME_VERSION = \'1.2.71\';")');
        t = t.replaceAll("html.includes('<!-- glencraft-build: b1271-v1.2.71 -->') || html.includes('<!-- glencraft-build: b1271-v1.2.71 -->')",
                         "html.includes('<!-- glencraft-build: b1271-v1.2.71 -->')");
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
  const fp = path.join(root, 'tests/v1270-release.mjs');
  let t = fs.readFileSync(fp, 'utf8');
  if (t.includes('html.slice(i1270, i1270 + 80000)') && !t.includes('i1270End')) {
    t = t.replace(
      'const h1270 = html.slice(i1270, i1270 + 80000);',
      "const i1270End = (() => {\n  const next = html.indexOf('\\n/* GLX-', i1270 + 10);\n  const scr = html.indexOf('</script>', i1270);\n  let end = i1270 + 80000;\n  if (next > i1270 && next < end) end = next;\n  if (scr > i1270 && scr < end) end = scr;\n  return end;\n})();\nconst h1270 = html.slice(i1270, i1270End);"
    );
    fs.writeFileSync(fp, t);
    console.log('scoped v1270 IIFE slice');
  } else {
    console.log('v1270 IIFE slice already scoped or uses i1270End');
  }
}

console.log('build 1.2.71 done');

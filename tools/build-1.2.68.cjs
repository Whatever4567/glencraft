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

if (html.includes("const GAME_VERSION = '1.2.67';") && !html.includes("const GAME_VERSION = '1.2.68';")) {
  html = replaceOnce(html, "const GAME_VERSION = '1.2.67';", "const GAME_VERSION = '1.2.68';", 'GAME_VERSION');
}
must(html.includes("const GAME_VERSION = '1.2.68';"), 'GAME_VERSION is not 1.2.68');

if (!html.includes('<!-- glencraft-build: b1268-v1.2.68 -->')) {
  must(html.includes('<!-- glencraft-build: b1267-v1.2.67 -->'), 'b1267 marker missing');
  html = replaceOnce(html,
    '<!-- glencraft-build: b1267-v1.2.67 -->',
    '<!-- glencraft-build: b1267-v1.2.67 -->\n<!-- glencraft-build: b1268-v1.2.68 -->',
    'build marker');
}

const NOTE = '{"v":"v1.2.68","d":"2026-11-13","notes":["The Black Castle is home to 100 black skeletons that live around and inside it (they idle and patrol; they are not a daytime fire risk). Each white (mossy) skeleton castle has 50 white skeletons. You can kill them all. Some respawn slowly, but a garrison can never refill to its original lot: the respawn cap decays with the kill count, which is saved with the world. Only nearby skeletons in loaded chunks are simulated and drawn (a live cap, so phones stay smooth).","A path of modular kit pieces (3-wide gravel, stairs, lamp posts) and bridges (plank decks, rails, posts) now connects the human castle to the farmers. 25 humans live at the human castle. Some of them occasionally walk the path to visit the farmers, linger, and walk back. First-person hands and the gold D-pad are left alone.","Hard-refresh to load this build."]},';
if (!html.includes('"v":"v1.2.68"')) {
  html = replaceOnce(html,
    'window.PATCH_NOTES = [\n{"v":"v1.2.67"',
    'window.PATCH_NOTES = [\n' + NOTE + '\n{"v":"v1.2.67"',
    'PATCH_NOTES');
} else {
  const reNote = /\{"v":"v1\.2\.68","d":"2026-11-13","notes":\[[\s\S]*?\]\},/;
  if (reNote.test(html)) html = html.replace(reNote, NOTE);
}

must(html.includes('/* GLX-MOBS1267'), 'MOBS1267 must stay');
must(html.includes('/* GLX-HANDS1266'), 'HANDS1266 must stay');
must(html.includes('/* GLX-HANDS1263'), 'HANDS1263 must stay');
must(html.includes("restoredFrom: '1e9db15'"), '1263 restore must stay');
must(html.includes('/* GLX-TBOX1264'), 'TBOX1264 must stay');
must(!html.includes('/* GLX-HANDS1261'), 'HANDS1261 must stay removed');
must(!html.includes("['dU', 'dL', 'dR'].forEach"), 'gold D-pad must stay untouched');

const files = ['tools/content-source/castle-1268.js'].filter(f => fs.existsSync(path.join(root, f)));
must(files.length === 1, 'castle-1268.js is required');
{
  const bundled = files.map(f => fs.readFileSync(path.join(root, f), 'utf8').trim() + '\n').join('');
  const INJECT_MARK = '/* GLX-CASTLE1268 (v1.2.68):';
  if (html.includes(INJECT_MARK)) {
    const i = html.indexOf(INJECT_MARK);
    const j = html.indexOf('</script>', i);
    must(j > i, 'cannot find </script> after existing 1268 IIFE');
    html = html.slice(0, i) + bundled + html.slice(j);
  } else {
    const k = html.lastIndexOf('</script>');
    must(k > 0, 'no closing script');
    html = html.slice(0, k) + '\n' + bundled + html.slice(k);
  }
}

must(html.includes("const GAME_VERSION = '1.2.68';"), 'version not bumped');
must(html.includes('"v":"v1.2.68"'), 'patch notes missing');
must(html.includes('The Black Castle is home to 100 black skeletons'), 'required garrison phrase missing');
must(html.includes('connects the human castle to the farmers'), 'required path phrase missing');
must(html.includes('GLX-CASTLE1268'), 'castle 1268 IIFE missing');
must(html.includes('gold D-pad is left alone'), '1268 must record that the gold D-pad is left alone');
{
  const i = html.indexOf('GLX-CASTLE1268');
  const slice = html.slice(i, i + 80000);
  must(!/\['dU'/.test(slice) && !/#dU/.test(slice), '1268 must not touch the gold D-pad');
  must(!/enableKinds|NEW_FP_KINDS\s*=/.test(slice), '1268 must not re-enable NEW_FP_KINDS');
  must(!slice.includes('phalanxGeo') && !slice.includes('applyRestCurl'), '1268 must not edit the hand sculpt');
  must(!/Egypt|gold color portal|gold block portal/i.test(slice), '1268 must not include the Egypt dimension');
}
{
  const i1268 = html.indexOf('/* GLX-CASTLE1268');
  const i1267 = html.indexOf('/* GLX-MOBS1267');
  must(i1268 > i1267, 'CASTLE1268 must be after MOBS1267');
}

fs.writeFileSync(path.join(root, 'index.html'), html);
console.log('index.html', before, '->', html.length);

fs.writeFileSync(path.join(root, 'version.json'), '{"v":"1.2.68"}\n');

let credits = fs.readFileSync(path.join(root, 'CREDITS.md'), 'utf8');
const block = `## v1.2.68 Castle garrisons and a path to the farmers

- The Black Castle is home to 100 black skeletons that live around and inside it (idle and patrol; shaded so they do not burn in daylight). Each white (mossy) skeleton castle has 50 white skeletons. You can kill them all. Some respawn slowly, but a garrison can never refill to its original lot: the respawn cap decays with the kill count (\`max(floor(max*0.12), max - kills)\`), which is saved with the world (\`glen_garrison_\`). Only nearby skeletons in loaded chunks are simulated and drawn (live cap 28).
- A path of modular kit pieces (3-wide gravel, stairs, lamp posts) and bridges (plank decks, rails, posts over water and ravines) connects the human castle to the farmers. 25 humans live at the human castle. Some of them occasionally walk the path to visit the farmers, linger, and walk back. Only simulated in loaded chunks.
- First-person hands and the gold D-pad are left alone. The view-model stays hidden in third person. The Egypt dimension is not in this release.

`;
if (!credits.includes('## v1.2.68')) {
  credits = credits.replace('## v1.2.67 Wild wolves, Scottish dogs, and a hag upgrade', block + '## v1.2.67 Wild wolves, Scottish dogs, and a hag upgrade');
} else {
  const a = credits.indexOf('## v1.2.68');
  const b = credits.indexOf('## v1.2.67', a + 1);
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
    if (/^v1268-/.test(name)) continue;
    let t = fs.readFileSync(fp, 'utf8');
    const orig = t;
    t = t.replaceAll(
      'html.includes("const GAME_VERSION = \'1.2.67\';")',
      'html.includes("const GAME_VERSION = \'1.2.68\';") || html.includes("const GAME_VERSION = \'1.2.67\';")'
    );
    t = t.replaceAll(
      "ver.v === '1.2.67'",
      "ver.v === '1.2.68' || ver.v === '1.2.67'"
    );
    t = t.replaceAll(
      "'<!-- glencraft-build: b1267-v1.2.67 -->'",
      "'<!-- glencraft-build: b1268-v1.2.68 -->') || html.includes('<!-- glencraft-build: b1267-v1.2.67 -->'"
    );
    t = t.replace(/html\.slice\(notesStart, notesStart \+ 34000\)/g, 'html.slice(notesStart, notesStart + 40000)');
    if (t !== orig) {
      for (let k = 0; k < 5; k++) {
        t = t.replaceAll("ver.v === '1.2.68' || ver.v === '1.2.68'", "ver.v === '1.2.68'");
        t = t.replaceAll('html.includes("const GAME_VERSION = \'1.2.68\';") || html.includes("const GAME_VERSION = \'1.2.68\';")',
                         'html.includes("const GAME_VERSION = \'1.2.68\';")');
        t = t.replaceAll("html.includes('<!-- glencraft-build: b1268-v1.2.68 -->') || html.includes('<!-- glencraft-build: b1268-v1.2.68 -->')",
                         "html.includes('<!-- glencraft-build: b1268-v1.2.68 -->')");
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
  const fp = path.join(root, 'tests/v1267-release.mjs');
  let t = fs.readFileSync(fp, 'utf8');
  if (t.includes('html.slice(i1267, i1267 + 80000)') && !t.includes('i1267End')) {
    t = t.replace(
      'const h1267 = html.slice(i1267, i1267 + 80000);',
      "const i1267End = (() => {\n  const next = html.indexOf('\\n/* GLX-', i1267 + 10);\n  const scr = html.indexOf('</script>', i1267);\n  let end = i1267 + 80000;\n  if (next > i1267 && next < end) end = next;\n  if (scr > i1267 && scr < end) end = scr;\n  return end;\n})();\nconst h1267 = html.slice(i1267, i1267End);"
    );
    fs.writeFileSync(fp, t);
    console.log('scoped v1267 IIFE slice');
  } else {
    console.log('v1267 IIFE slice already scoped or uses i1267End');
  }
}

console.log('build 1.2.68 done');

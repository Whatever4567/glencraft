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

if (html.includes("const GAME_VERSION = '1.2.68';") && !html.includes("const GAME_VERSION = '1.2.69';")) {
  html = replaceOnce(html, "const GAME_VERSION = '1.2.68';", "const GAME_VERSION = '1.2.69';", 'GAME_VERSION');
}
must(html.includes("const GAME_VERSION = '1.2.69';"), 'GAME_VERSION is not 1.2.69');

if (!html.includes('<!-- glencraft-build: b1269-v1.2.69 -->')) {
  must(html.includes('<!-- glencraft-build: b1268-v1.2.68 -->'), 'b1268 marker missing');
  html = replaceOnce(html,
    '<!-- glencraft-build: b1268-v1.2.68 -->',
    '<!-- glencraft-build: b1268-v1.2.68 -->\n<!-- glencraft-build: b1269-v1.2.69 -->',
    'build marker');
}

const NOTE = '{"v":"v1.2.69","d":"2026-11-13","notes":["Egypt land is a new Earth-like dimension: sky, sun, sea and sand, with the old pyramid island at its heart (the sandstone pyramid and its gold capstone, the hall and galleries, the chest room, and the Great Sphinx). It is not in the Glencraft overworld.","Light a portal framed in gold blocks the same way you light a Nether portal; the portal surface reuses the Nether portal texture, recoloured gold, and takes you to the island. A return portal sits by the pyramid, and the pause menu can teleport you there.","The Egyptian people have moved out of Glencraft and live at the pyramid in Egypt land. The dimension is saved with the world, and if you quit while you are there you come back to Egypt land. First-person hands and the gold D-pad are left alone.","Hard-refresh to load this build."]},';
if (!html.includes('"v":"v1.2.69"')) {
  html = replaceOnce(html,
    'window.PATCH_NOTES = [\n{"v":"v1.2.68"',
    'window.PATCH_NOTES = [\n' + NOTE + '\n{"v":"v1.2.68"',
    'PATCH_NOTES');
} else {
  const reNote = /\{"v":"v1\.2\.69","d":"2026-11-13","notes":\[[\s\S]*?\]\},/;
  if (reNote.test(html)) html = html.replace(reNote, NOTE);
}

must(html.includes('/* GLX-CASTLE1268'), 'CASTLE1268 must stay');
must(html.includes('/* GLX-MOBS1267'), 'MOBS1267 must stay');
must(html.includes('/* GLX-HANDS1266'), 'HANDS1266 must stay');
must(html.includes('/* GLX-HANDS1263'), 'HANDS1263 must stay');
must(html.includes("restoredFrom: '1e9db15'"), '1263 restore must stay');
must(html.includes('/* GLX-TBOX1264'), 'TBOX1264 must stay');
must(!html.includes('/* GLX-HANDS1261'), 'HANDS1261 must stay removed');
must(!html.includes("['dU', 'dL', 'dR'].forEach"), 'gold D-pad must stay untouched');

const files = ['tools/content-source/egypt-1269.js'].filter(f => fs.existsSync(path.join(root, f)));
must(files.length === 1, 'egypt-1269.js is required');
{
  const bundled = files.map(f => fs.readFileSync(path.join(root, f), 'utf8').trim() + '\n').join('');
  const INJECT_MARK = '/* GLX-EG1269 (v1.2.69):';
  if (html.includes(INJECT_MARK)) {
    const i = html.indexOf(INJECT_MARK);
    const j = html.indexOf('</script>', i);
    must(j > i, 'cannot find </script> after existing 1269 IIFE');
    html = html.slice(0, i) + bundled + html.slice(j);
  } else {
    const k = html.lastIndexOf('</script>');
    must(k > 0, 'no closing script');
    html = html.slice(0, k) + '\n' + bundled + html.slice(k);
  }
}

must(html.includes("const GAME_VERSION = '1.2.69';"), 'version not bumped');
must(html.includes('"v":"v1.2.69"'), 'patch notes missing');
must(html.includes('Egypt land is a new Earth-like dimension'), 'required Egypt phrase missing');
must(html.includes('framed in gold blocks'), 'required gold portal phrase missing');
must(html.includes('The Egyptian people have moved out of Glencraft'), 'required NPC phrase missing');
must(html.includes('GLX-EG1269'), 'egypt 1269 IIFE missing');
must(html.includes('gold D-pad are left alone'), '1269 must record that the gold D-pad is left alone');
{
  const i = html.indexOf('GLX-EG1269');
  const slice = html.slice(i, i + 80000);
  must(!/\['dU'/.test(slice) && !/#dU/.test(slice), '1269 must not touch the gold D-pad');
  must(!/enableKinds|NEW_FP_KINDS\s*=/.test(slice), '1269 must not re-enable NEW_FP_KINDS');
  must(!slice.includes('phalanxGeo') && !slice.includes('applyRestCurl'), '1269 must not edit the hand sculpt');
}

{
  const i1269 = html.indexOf('/* GLX-EG1269');
  const i1268 = html.indexOf('/* GLX-CASTLE1268');
  must(i1269 > i1268, 'EG1269 must be after CASTLE1268');
}

fs.writeFileSync(path.join(root, 'index.html'), html);
console.log('index.html', before, '->', html.length);

fs.writeFileSync(path.join(root, 'version.json'), '{"v":"1.2.69"}\n');

let credits = fs.readFileSync(path.join(root, 'CREDITS.md'), 'utf8');
const block = `## v1.2.69 Egypt land

- Egypt land is a new Earth-like dimension (sky, sun, sea and sand) with the old pyramid island at its heart: the sandstone pyramid and its gold capstone, the hall and galleries, the chest room, and the Great Sphinx. The island is not in the Glencraft overworld.
- A portal framed in gold blocks, lit the same way as a Nether portal, takes you there. The portal surface reuses the Nether portal texture, recoloured gold. A return portal sits by the pyramid, and the pause menu can teleport you to Egypt land.
- The Egyptian people have moved out of Glencraft and live at the pyramid in Egypt land. The dimension is saved with the world, and if you quit while you are there you come back to Egypt land.
- First-person hands and the gold D-pad are left alone. The view-model stays hidden in third person.

`;
if (!credits.includes('## v1.2.69')) {
  credits = credits.replace('## v1.2.68 Castle garrisons and a path to the farmers', block + '## v1.2.68 Castle garrisons and a path to the farmers');
} else {
  const a = credits.indexOf('## v1.2.69');
  const b = credits.indexOf('## v1.2.68', a + 1);
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
    if (/^v1269-/.test(name)) continue;
    let t = fs.readFileSync(fp, 'utf8');
    const orig = t;
    t = t.replaceAll(
      'html.includes("const GAME_VERSION = \'1.2.68\';")',
      'html.includes("const GAME_VERSION = \'1.2.69\';") || html.includes("const GAME_VERSION = \'1.2.68\';")'
    );
    t = t.replaceAll(
      "ver.v === '1.2.68'",
      "ver.v === '1.2.69' || ver.v === '1.2.68'"
    );
    t = t.replaceAll(
      "'<!-- glencraft-build: b1268-v1.2.68 -->'",
      "'<!-- glencraft-build: b1269-v1.2.69 -->') || html.includes('<!-- glencraft-build: b1268-v1.2.68 -->'"
    );
    t = t.replace(/html\.slice\(notesStart, notesStart \+ 40000\)/g, 'html.slice(notesStart, notesStart + 46000)');
    if (t !== orig) {
      for (let k = 0; k < 5; k++) {
        t = t.replaceAll("ver.v === '1.2.69' || ver.v === '1.2.69'", "ver.v === '1.2.69'");
        t = t.replaceAll('html.includes("const GAME_VERSION = \'1.2.69\';") || html.includes("const GAME_VERSION = \'1.2.69\';")',
                         'html.includes("const GAME_VERSION = \'1.2.69\';")');
        t = t.replaceAll("html.includes('<!-- glencraft-build: b1269-v1.2.69 -->') || html.includes('<!-- glencraft-build: b1269-v1.2.69 -->')",
                         "html.includes('<!-- glencraft-build: b1269-v1.2.69 -->')");
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
  const fp = path.join(root, 'tests/v1268-release.mjs');
  let t = fs.readFileSync(fp, 'utf8');
  if (t.includes('html.slice(i1268, i1268 + 80000)') && !t.includes('i1268End')) {
    t = t.replace(
      'const h1268 = html.slice(i1268, i1268 + 80000);',
      "const i1268End = (() => {\n  const next = html.indexOf('\\n/* GLX-', i1268 + 10);\n  const scr = html.indexOf('</script>', i1268);\n  let end = i1268 + 80000;\n  if (next > i1268 && next < end) end = next;\n  if (scr > i1268 && scr < end) end = scr;\n  return end;\n})();\nconst h1268 = html.slice(i1268, i1268End);"
    );
    fs.writeFileSync(fp, t);
    console.log('scoped v1268 IIFE slice');
  } else {
    console.log('v1268 IIFE slice already scoped or uses i1268End');
  }
}

console.log('build 1.2.69 done');

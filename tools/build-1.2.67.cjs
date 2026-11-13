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

if (html.includes("const GAME_VERSION = '1.2.66';") && !html.includes("const GAME_VERSION = '1.2.67';")) {
  html = replaceOnce(html, "const GAME_VERSION = '1.2.66';", "const GAME_VERSION = '1.2.67';", 'GAME_VERSION');
}
must(html.includes("const GAME_VERSION = '1.2.67';"), 'GAME_VERSION is not 1.2.67');

if (!html.includes('<!-- glencraft-build: b1267-v1.2.67 -->')) {
  must(html.includes('<!-- glencraft-build: b1266-v1.2.66 -->'), 'b1266 marker missing');
  html = replaceOnce(html,
    '<!-- glencraft-build: b1266-v1.2.66 -->',
    '<!-- glencraft-build: b1266-v1.2.66 -->\n<!-- glencraft-build: b1267-v1.2.67 -->',
    'build marker');
}

const NOTE = '{"v":"v1.2.67","d":"2026-11-13","notes":["Wild wolves spawn naturally in packs. Hitting one angers the whole pack. Feed them bones (several tries, with heart particles) to tame them: their coat swaps to a Scottish collie look. LT (touch LT and controller LT) toggles sit when you are near or targeting your tamed dog; otherwise LT is unchanged (TARDIS doors). Sitting dogs stay still. Otherwise they follow you (teleporting if far) and bite only mobs that harmed you. They trot, sit, wag, tilt, bite and sniff, with bark, howl and growl sounds. Tamed dogs and sit state are saved.","Moss Hag Morag has a paler hag head with long grey hair and sunken, faintly glowing eyes, a quieter randomised voice (softer cackles and mutters, lower volume, with a cooldown; other mobs\' cackles are unchanged), and a black cat that appears with her and follows her. First-person hands and the gold D-pad are left alone.","Hard-refresh to load this build."]},';
if (!html.includes('"v":"v1.2.67"')) {
  html = replaceOnce(html,
    'window.PATCH_NOTES = [\n{"v":"v1.2.66"',
    'window.PATCH_NOTES = [\n' + NOTE + '\n{"v":"v1.2.66"',
    'PATCH_NOTES');
} else {
  const reNote = /\{"v":"v1\.2\.67","d":"2026-11-13","notes":\[[\s\S]*?\]\},/;
  if (reNote.test(html)) html = html.replace(reNote, NOTE);
}

must(html.includes('/* GLX-HANDS1266'), 'HANDS1266 must stay');
must(html.includes('/* GLX-HANDS1265'), 'HANDS1265 must stay');
must(html.includes('/* GLX-HANDS1263'), 'HANDS1263 must stay');
must(html.includes("restoredFrom: '1e9db15'"), '1263 1.2.59 restore record must stay');
must(html.includes('/* GLX-HANDS1260'), 'HANDS1260 must stay');
must(!html.includes('/* GLX-HANDS1261'), 'HANDS1261 IIFE must stay removed');
must(html.includes('/* GLX-TBOX1264'), 'TBOX1264 must stay');
must(html.includes('__fpVm1259'), '1.2.59 viewmodel must stay');
must(html.includes('__fpa'), '__fpa path must stay');
must(!html.includes("['dU', 'dL', 'dR'].forEach"), 'gold D-pad must stay untouched');

const files = ['tools/content-source/mobs-1267.js'].filter(f => fs.existsSync(path.join(root, f)));
must(files.length === 1, 'mobs-1267.js is required');
{
  const bundled = files.map(f => fs.readFileSync(path.join(root, f), 'utf8').trim() + '\n').join('');
  const INJECT_MARK = '/* GLX-MOBS1267 (v1.2.67):';
  if (html.includes(INJECT_MARK)) {
    const i = html.indexOf(INJECT_MARK);
    const j = html.indexOf('</script>', i);
    must(j > i, 'cannot find </script> after existing 1267 IIFE');
    html = html.slice(0, i) + bundled + html.slice(j);
  } else {
    const k = html.lastIndexOf('</script>');
    must(k > 0, 'no closing script');
    html = html.slice(0, k) + '\n' + bundled + html.slice(k);
  }
}

must(html.includes("const GAME_VERSION = '1.2.67';"), 'version not bumped');
must(html.includes('"v":"v1.2.67"'), 'patch notes missing');
must(html.includes('Wild wolves spawn naturally in packs'), 'required wolf patch-notes phrase missing');
must(html.includes('Moss Hag Morag has a paler hag head'), 'required hag patch-notes phrase missing');
must(html.includes('GLX-MOBS1267'), 'mobs 1267 IIFE missing');
must(html.includes('buildCanine'), 'canine kit missing');
must(html.includes('tryToggleSit'), 'LT sit missing');
must(html.includes('hagvoice'), 'hag voice missing');
must(html.includes('blackcat') || html.includes('Black Cat'), 'black cat missing');
must(html.includes('gold D-pad is left alone'), '1267 must record that the gold D-pad is left alone');
must(!html.includes("['dU', 'dL', 'dR'].forEach"), 'gold D-pad must stay untouched');
{
  const i = html.indexOf('GLX-MOBS1267');
  const slice = html.slice(i, i + 60000);
  must(!/\['dU'/.test(slice) && !/#dU/.test(slice), '1267 must not touch the gold D-pad');
  must(!/enableKinds|NEW_FP_KINDS\s*=/.test(slice), '1267 must not re-enable NEW_FP_KINDS');
  must(!/hands-1260|HANDS1260|hands-1261|HANDS1261|voxel arm/.test(slice), '1267 must not switch to the 1.2.60 or 1.2.61 arm');
  must(!/__fpa|hands-1266|HANDS1266|phalanxGeo/.test(slice.split('function')[0] + 'x') || !/__fpa\s*=/.test(slice), '1267 must not reassign __fpa');
  must(!slice.includes('function hands1266') && !slice.includes('curlFingers'), '1267 must not edit the hand sculpt');
}
{
  const i1267 = html.indexOf('/* GLX-MOBS1267');
  const i1266 = html.indexOf('/* GLX-HANDS1266');
  must(i1267 > i1266, 'MOBS1267 must be after HANDS1266');
}

/* This release must not include the later castle / Egypt work. */
{
  const i = html.indexOf('/* GLX-MOBS1267');
  const j = html.indexOf('</script>', i);
  const slice = html.slice(i, j);
  must(!/gold block/.test(slice) && !/Egypt land/.test(slice) && !/gold color portal/.test(slice), '1267 must not include the Egypt dimension');
  must(!/100 black skeletons/.test(slice) && !/garrison/.test(slice.toLowerCase()), '1267 must not include skeleton garrisons');
}

fs.writeFileSync(path.join(root, 'index.html'), html);
console.log('index.html', before, '->', html.length);

fs.writeFileSync(path.join(root, 'version.json'), '{"v":"1.2.67"}\n');

let credits = fs.readFileSync(path.join(root, 'CREDITS.md'), 'utf8');
const block = `## v1.2.67 Wild wolves, Scottish dogs, and a hag upgrade

- Wild wolves spawn naturally in packs. Hitting one angers the whole pack. Feed them bones (several tries, with heart particles) to tame them: their coat swaps from a grey-brown wolf to a Scottish collie look (black body, white blaze and ruff, tan legs). LT (touch LT and controller LT) toggles sit when you are near or targeting your tamed dog; otherwise LT is unchanged (TARDIS doors). Sitting dogs stay still. Otherwise they follow you (teleporting if far) and bite only mobs that harmed you. They trot, sit, wag, tilt, bite and sniff, with bark, howl and growl sounds (Web Audio). Tamed dogs and sit state are saved with the world.
- Moss Hag Morag has a paler hag head with long grey hair and sunken, faintly glowing eyes (blocky modular base with pixel shading: limited palette, dither, AO). Her laugh is replaced with a quieter randomised set of softer cackles and mutters, at lower volume and with a cooldown. Merry Mischanter and Sneerin' Swaddle keep their existing cackle. A black cat appears with her and follows her.
- First-person hands and the gold D-pad are left alone. The view-model stays hidden in third person. Skeleton garrisons, the human castle paths, and the Egypt dimension are not in this release.

`;
if (!credits.includes('## v1.2.67')) {
  credits = credits.replace('## v1.2.66 Sausage fingers sculpted toward realistic proportions', block + '## v1.2.66 Sausage fingers sculpted toward realistic proportions');
} else {
  const a = credits.indexOf('## v1.2.67');
  const b = credits.indexOf('## v1.2.66', a + 1);
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
    if (/^v1267-/.test(name)) continue;
    let t = fs.readFileSync(fp, 'utf8');
    const orig = t;
    t = t.replaceAll(
      'html.includes("const GAME_VERSION = \'1.2.66\';")',
      'html.includes("const GAME_VERSION = \'1.2.67\';") || html.includes("const GAME_VERSION = \'1.2.66\';")'
    );
    t = t.replaceAll(
      "ver.v === '1.2.66'",
      "ver.v === '1.2.67' || ver.v === '1.2.66'"
    );
    t = t.replaceAll(
      "'<!-- glencraft-build: b1266-v1.2.66 -->'",
      "'<!-- glencraft-build: b1267-v1.2.67 -->') || html.includes('<!-- glencraft-build: b1266-v1.2.66 -->'"
    );
    t = t.replace(/html\.slice\(notesStart, notesStart \+ 28000\)/g, 'html.slice(notesStart, notesStart + 34000)');
    t = t.replace(/html\.slice\(notesStart, notesStart \+ 30000\)/g, 'html.slice(notesStart, notesStart + 34000)');
    if (t !== orig) {
      for (let k = 0; k < 5; k++) {
        t = t.replaceAll("ver.v === '1.2.67' || ver.v === '1.2.67'", "ver.v === '1.2.67'");
        t = t.replaceAll('html.includes("const GAME_VERSION = \'1.2.67\';") || html.includes("const GAME_VERSION = \'1.2.67\';")',
                         'html.includes("const GAME_VERSION = \'1.2.67\';")');
        t = t.replaceAll("html.includes('<!-- glencraft-build: b1267-v1.2.67 -->') || html.includes('<!-- glencraft-build: b1267-v1.2.67 -->')",
                         "html.includes('<!-- glencraft-build: b1267-v1.2.67 -->')");
      }
      if (t !== orig) {
        fs.writeFileSync(fp, t);
        console.log('patched test', fp.slice(root.length + 1));
      }
    }
  }
}
patchTests(path.join(root, 'tests'));

/* v1266 IIFE slice should not include the following 1267 IIFE. The v1266 test already
   cuts at the next GLX- marker; keep that, and also scope any raw 40000-wide slice. */
{
  const fp = path.join(root, 'tests/v1266-release.mjs');
  let t = fs.readFileSync(fp, 'utf8');
  if (t.includes('html.slice(i1266, i1266 + 40000)') && !t.includes('i1266End')) {
    t = t.replace(
      'const h1266 = html.slice(i1266, i1266 + 40000);',
      "const i1266End = (() => {\n  const next = html.indexOf('\\n/* GLX-', i1266 + 10);\n  const scr = html.indexOf('</script>', i1266);\n  let end = i1266 + 40000;\n  if (next > i1266 && next < end) end = next;\n  if (scr > i1266 && scr < end) end = scr;\n  return end;\n})();\nconst h1266 = html.slice(i1266, i1266End);"
    );
    fs.writeFileSync(fp, t);
    console.log('scoped v1266 IIFE slice');
  } else {
    console.log('v1266 IIFE slice already scoped or uses i1266End');
  }
}

console.log('build 1.2.67 done');

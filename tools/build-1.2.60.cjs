#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');

function must(cond, msg) { if (!cond) throw new Error(msg); }
function replaceOnce(s, a, b, label) {
  const n = s.split(a).length - 1;
  must(n === 1, (label || a.slice(0, 40)) + ': expected 1 occurrence, got ' + n);
  return s.split(a).join(b);
}
function replaceAllCounted(s, a, b, expect, label) {
  const n = s.split(a).length - 1;
  must(n === expect, (label || a.slice(0, 40)) + ': expected ' + expect + ', got ' + n);
  return s.split(a).join(b);
}

let html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const before = html.length;

/* ---- version bump ---- */
html = replaceOnce(html, "const GAME_VERSION = '1.2.59';", "const GAME_VERSION = '1.2.60';", 'GAME_VERSION');
if (!html.includes('<!-- glencraft-build: b1260-v1.2.60 -->')) {
  html = replaceOnce(html,
    '<!-- glencraft-build: b1259-v1.2.59 -->',
    '<!-- glencraft-build: b1259-v1.2.59 -->\n<!-- glencraft-build: b1260-v1.2.60 -->',
    'build marker');
}

const NOTE = '{"v":"v1.2.60","d":"2026-11-13","notes":["The time box has a new police-box shell: panelled dark navy, framed six-pane windows, POLICE PUBLIC CALL BOX signs on every side, a phone panel on the left door, and a blue lamp on the roof. The old block-pile look is gone.","Inside is a tall rotor room, bigger on the inside, with roundels on the walls, a central console, and a glowing column that rises to the ceiling in purple and pink light.","The extra up, down, left and right pad is gone. The left stick flies you, the right stick turns and tilts, Jump rises, and Down sinks. In drive mode the hands are hidden and the arms sit at the bottom of the screen.","LS, or Sprint on touch, multiplies your speed by 10. Holding the stick keeps accelerating with no top speed. Speed and turning ease in, and the turn is quicker. The faster you go, the harsher the engines sound.","Flying up, down or sideways keeps you on the cabin floor instead of dumping you outside.","The box hums while you are in it or near it. A teleport is only the travel sound now. The blue screen is gone.","Both doors stay shut. Look at one and press LT (or right click / USE) to open or close that door on its own.","The sculpted first-person hands are back on for the empty hand, block, map, bucket, torch, sword, pick, pistol and rifle. A pistol and a rifle use a two-handed wrap, a block sits in an open palm, and a map and a bucket use the hold grip. The skin uses the real hand atlas and takes light.","Hard-refresh to load this build."]},';
if (!html.includes('"v":"v1.2.60"')) {
  html = replaceOnce(html,
    'window.PATCH_NOTES = [\n{"v":"v1.2.59"',
    'window.PATCH_NOTES = [\n' + NOTE + '\n{"v":"v1.2.59"',
    'PATCH_NOTES');
}

/* ---- turn sculpted hands back on in the injected 1259 VM and its source ---- */
function patchFpVm(s, label) {
  const oldKinds = `  const NEW_FP_KINDS = {
    empty: 0, p761: 0, p760: 0, pick: 0,
    sword: 0, claymore: 0,
    torch: 0, block: 0, bucket: 0, map: 0,
    pistol: 0, musket: 0
  };`;
  const newKinds = `  const NEW_FP_KINDS = {
    empty: 1, p761: 1, p760: 1, pick: 1,
    sword: 1, claymore: 1,
    torch: 1, block: 1, bucket: 1, map: 1,
    pistol: 1, musket: 1
  };`;
  must(s.includes(oldKinds) || s.includes(newKinds), label + ': NEW_FP_KINDS block missing');
  if (s.includes(oldKinds)) s = replaceOnce(s, oldKinds, newKinds, label + ' NEW_FP_KINDS');

  const oldCurl = `    if (k0 === 'empty') return { mode: 'open' };
    if (k0 === 'block') return { mode: 'cup' };
    if (k0 === 'map') return { mode: 'hold' };
    if (key === 'pistol' || key === 'pistolAds') return { mode: 'fist', trigger: true };
    if (key === 'musket' || key === 'musketAds') return { mode: 'fist' };
    return { mode: 'fist' };`;
  const newCurl = `    if (k0 === 'empty') return { mode: 'open' };
    if (k0 === 'block') return { mode: 'cup' };
    if (k0 === 'map' || k0 === 'bucket') return { mode: 'hold' };
    if (key === 'pistol' || key === 'pistolAds') return { mode: 'wrapPistol', trigger: true };
    if (key === 'musket' || key === 'musketAds') return { mode: 'wrapMusket' };
    return { mode: 'fist' };`;
  if (s.includes(oldCurl)) s = replaceOnce(s, oldCurl, newCurl, label + ' curlOptsFor');
  else must(s.includes("mode: 'wrapPistol'"), label + ': curlOptsFor not patched and wrapPistol missing');

  const Lpose = "      L: { wr: [-0.22, -0.22, -0.48], pitch: 25, yaw: 35, elev: 44, lenFore: 0.34, face: 'palmUnder', haft: [-0.90, 0.18, 0.05], curl: 1, sleeve: 'linen', hs: 1.18, rs: 0.88 },";
  const pistolOld = `      // Exact sword right fist (mesh, wr, dorsum, haft). Gun is adapted
      // to that fixed hand, not the reverse.
      two: 0, hs: 1.10,
      R: { wr: [0.28, -0.38, -0.44], pitch: 25, yaw: 35, elev: 44, lenFore: 0.34, face: 'dorsumAbove', faceY: 0.22, haft: [0.16, 0.98, -0.06], curl: 1, rs: 0.78, sleeve: 'linen' },
      item: { p: [0.00, 0.00, 0.00], r: [0.00, 0.00, 0.00], s: 1.00 }`;
  const pistolNew = `      // Exact sword right fist (mesh, wr, dorsum, haft). Gun is adapted
      // to that fixed hand, not the reverse.
      two: 1, hs: 1.10,
      R: { wr: [0.28, -0.38, -0.44], pitch: 25, yaw: 35, elev: 44, lenFore: 0.34, face: 'dorsumAbove', faceY: 0.22, haft: [0.16, 0.98, -0.06], curl: 1, rs: 0.78, sleeve: 'linen' },
` + Lpose + `
      item: { p: [0.00, 0.00, 0.00], r: [0.00, 0.00, 0.00], s: 1.00 }`;
  if (s.includes(pistolOld)) s = replaceOnce(s, pistolOld, pistolNew, label + ' pistol two');
  const musketOld = `      // Same sword right fist. Barrel is aimed independently of the
      // upward tunnel so the musket does not stand vertical.
      two: 0, hs: 1.10,
      R: { wr: [0.28, -0.38, -0.44], pitch: 25, yaw: 35, elev: 44, lenFore: 0.34, face: 'dorsumAbove', faceY: 0.22, haft: [0.16, 0.98, -0.06], curl: 1, sleeve: 'linen', rs: 0.78 },
      item: { p: [0.00, 0.00, 0.00], r: [0.00, 0.00, 0.00], s: 1.00 }`;
  const musketNew = `      // Same sword right fist. Barrel is aimed independently of the
      // upward tunnel so the musket does not stand vertical.
      two: 1, hs: 1.10,
      R: { wr: [0.28, -0.38, -0.44], pitch: 25, yaw: 35, elev: 44, lenFore: 0.34, face: 'dorsumAbove', faceY: 0.22, haft: [0.16, 0.98, -0.06], curl: 1, sleeve: 'linen', rs: 0.78 },
      L: { wr: [-0.22, -0.22, -0.50], pitch: 25, yaw: 35, elev: 44, lenFore: 0.34, face: 'palmUnder', haft: [-0.90, 0.18, 0.05], curl: 1, sleeve: 'linen', hs: 1.18, rs: 0.88 },
      item: { p: [0.00, 0.00, 0.00], r: [0.00, 0.00, 0.00], s: 1.00 }`;
  if (s.includes(musketOld)) s = replaceOnce(s, musketOld, musketNew, label + ' musket two');
  else must(s.includes('two: 1, hs: 1.10,') && s.includes("mode: 'wrapMusket'") || s.includes('L: { wr: [-0.22, -0.22, -0.50]'), label + ' musket two already or missing');
  return s;
}
html = patchFpVm(html, 'index.html');

const fpSrcPath = path.join(root, 'tools/pilot-model-source/fp-vm-1259.js');
let fpSrc = fs.readFileSync(fpSrcPath, 'utf8');
fpSrc = patchFpVm(fpSrc, 'fp-vm-1259.js');
fs.writeFileSync(fpSrcPath, fpSrc);

/* also bump the 1.2.56 comment so the allowlist text is honest */
html = html.replace(
  '  // 1272 hybrid (fpHybrid1272): the baked-fist / 1282 FP-gun rig is off\n  // for every item in 1.2.56.',
  '  // 1272 hybrid (fpHybrid1272): the sculpted first-person hands are on\n  // again in 1.2.60 for every item (they were off for every item in 1.2.56).'
);

/* ---- inject TARDIS + hands IIFEs before the closing script ---- */
const tboxSrc = fs.readFileSync(path.join(root, 'tools/content-source/tbox-1260.js'), 'utf8').trim() + '\n';
const handsSrc = fs.readFileSync(path.join(root, 'tools/content-source/hands-1260.js'), 'utf8').trim() + '\n';
const INJECT_MARK = '/* GLX-TBOX1260 (v1.2.60):';
if (html.includes(INJECT_MARK)) {
  const i = html.indexOf(INJECT_MARK);
  const j = html.indexOf('</script>', i);
  must(j > i, 'cannot find </script> after existing TBOX1260');
  html = html.slice(0, i) + tboxSrc + handsSrc + html.slice(j);
} else {
  const close = '\n</script>\n</body>\n</html>\n';
  const alt = '</script>\n</body>\n</html>';
  const k = html.lastIndexOf('</script>');
  must(k > 0, 'no closing script');
  /* insert just before the last </script> */
  html = html.slice(0, k) + '\n' + tboxSrc + handsSrc + html.slice(k);
}

must(html.includes("const GAME_VERSION = '1.2.60';"), 'version not bumped');
must(html.includes('"v":"v1.2.60"'), 'patch notes missing');
must(html.includes('GLX-TBOX1260'), 'tbox IIFE missing');
must(html.includes('GLX-HANDS1260'), 'hands IIFE missing');
must(html.includes('empty: 1, p761: 1, p760: 1, pick: 1'), 'NEW_FP_KINDS not enabled');
must(html.includes("mode: 'wrapPistol'"), 'wrapPistol grip missing');
must(html.includes('POLICE PUBLIC') || html.includes("fillText('POLICE'"), 'police sign missing');

fs.writeFileSync(path.join(root, 'index.html'), html);
console.log('index.html', before, '->', html.length);

/* ---- version.json ---- */
fs.writeFileSync(path.join(root, 'version.json'), '{"v":"1.2.60"}\n');

/* ---- CREDITS.md ---- */
let credits = fs.readFileSync(path.join(root, 'CREDITS.md'), 'utf8');
if (!credits.includes('## v1.2.60')) {
  const block = `## v1.2.60 TARDIS overhaul and sculpted hands

- The time box exterior is an original procedural police-box shell modelled on the Series 1-4 TARDIS plan (Bill Rudloff transcription, used for shape accuracy). Panelled dark navy, six-pane windows, POLICE PUBLIC CALL BOX signs, a phone panel, and a blue roof lamp. No third-party meshes or textures.
- The tall rotor-room interior (roundels, central console, glowing column, purple/pink lighting) is original Glencraft procedural art. The in-or-near hum and the speed-harsh engine are procedural Web Audio, as is the existing travel whoosh (the blue travel overlay is removed).
- Sculpted first-person hands already in the game (the 1.2.54–1.2.55 viewmodel and the 1.2.57 cube-arm sculpt, with the in-game hand atlas) are turned back on for every item. They were switched off in 1.2.56. The 1.2.59 torch-arm freeze and pickaxe rightward shift are kept. No third-party hand scans.

`;
  credits = credits.replace('## v1.2.59 Torch arm and first-person pickaxe', block + '## v1.2.59 Torch arm and first-person pickaxe');
  fs.writeFileSync(path.join(root, 'CREDITS.md'), credits);
  console.log('CREDITS.md updated');
}

/* ---- tests: accept 1.2.60 in version OR-chains; add the new build marker ---- */
function patchTests(dir) {
  for (const name of fs.readdirSync(dir)) {
    const fp = path.join(dir, name);
    const st = fs.statSync(fp);
    if (st.isDirectory()) { patchTests(fp); continue; }
    if (!/\.(mjs|cjs|js)$/.test(name)) continue;
    let t = fs.readFileSync(fp, 'utf8');
    const orig = t;
    /* prepend 1.2.60 ahead of a 1.2.59 GAME_VERSION check */
    t = t.replaceAll(
      'html.includes("const GAME_VERSION = \'1.2.59\';")',
      'html.includes("const GAME_VERSION = \'1.2.60\';") || html.includes("const GAME_VERSION = \'1.2.59\';")'
    );
    t = t.replaceAll(
      "ver.v === '1.2.59'",
      "ver.v === '1.2.60' || ver.v === '1.2.59'"
    );
    t = t.replaceAll(
      "ver.v === '1.2.57' || ver.v === '1.2.56'",
      "ver.v === '1.2.60' || ver.v === '1.2.59' || ver.v === '1.2.58' || ver.v === '1.2.57' || ver.v === '1.2.56'"
    );
    /* 1.2.58-leading chains that skipped 1.2.59 */
    t = t.replaceAll(
      'html.includes("const GAME_VERSION = \'1.2.58\';") || html.includes("const GAME_VERSION = \'1.2.57\';")',
      'html.includes("const GAME_VERSION = \'1.2.60\';") || html.includes("const GAME_VERSION = \'1.2.59\';") || html.includes("const GAME_VERSION = \'1.2.58\';") || html.includes("const GAME_VERSION = \'1.2.57\';")'
    );
    t = t.replaceAll(
      "'<!-- glencraft-build: b1252-held-rollback -->'",
      "'<!-- glencraft-build: b1260-v1.2.60 -->') || html.includes('<!-- glencraft-build: b1252-held-rollback -->'"
    );
    if (t !== orig) {
      /* avoid double-prepending if run twice */
      t = t.replace(/html\.includes\("const GAME_VERSION = '1\.2\.60';"\)(?: \|\| html\.includes\("const GAME_VERSION = '1\.2\.60';"\))+/g,
        'html.includes("const GAME_VERSION = \'1.2.60\';")');
      t = t.replace(/html\.includes\("const GAME_VERSION = '1\.2\.60';"\) \|\| html\.includes\("const GAME_VERSION = '1\.2\.59';"\) \|\| html\.includes\("const GAME_VERSION = '1\.2\.60';"\) \|\| html\.includes\("const GAME_VERSION = '1\.2\.59';"\)/g,
        'html.includes("const GAME_VERSION = \'1.2.60\';") || html.includes("const GAME_VERSION = \'1.2.59\';")');
      t = t.replace(/ver\.v === '1\.2\.60' \|\| ver\.v === '1\.2\.59' \|\| ver\.v === '1\.2\.58' \|\| ver\.v === '1\.2\.60' \|\| ver\.v === '1\.2\.59' \|\| ver\.v === '1\.2\.58'/g,
        "ver.v === '1.2.60' || ver.v === '1.2.59' || ver.v === '1.2.58'");
      fs.writeFileSync(fp, t);
      console.log('patched test', fp.slice(root.length + 1));
    }
  }
}
patchTests(path.join(root, 'tests'));

console.log('build 1.2.60 done');

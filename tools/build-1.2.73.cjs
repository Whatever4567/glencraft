#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');

function must(cond, msg) { if (!cond) throw new Error(msg); }
function replaceOnce(s, a, b, label) {
  const n = s.split(a).length - 1;
  must(n === 1, (label || a.slice(0, 80)) + ': expected 1 occurrence, got ' + n);
  return s.split(a).join(b);
}
function replaceAllIn(files, a, b, label) {
  for (const f of files) {
    const p = path.join(root, f);
    if (!fs.existsSync(p)) continue;
    let s = fs.readFileSync(p, 'utf8');
    const n = s.split(a).length - 1;
    if (n === 0) continue;
    must(n === 1, f + ' ' + (label || a.slice(0, 80)) + ': expected 1, got ' + n);
    fs.writeFileSync(p, s.split(a).join(b));
    console.log('patched', f, label || '');
  }
}

let html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const before = html.length;

if (html.includes("const GAME_VERSION = '1.2.72';") && !html.includes("const GAME_VERSION = '1.2.73';")) {
  html = replaceOnce(html, "const GAME_VERSION = '1.2.72';", "const GAME_VERSION = '1.2.73';", 'GAME_VERSION');
}
must(html.includes("const GAME_VERSION = '1.2.73';"), 'GAME_VERSION is not 1.2.73');

if (!html.includes('<!-- glencraft-build: b1273-v1.2.73 -->')) {
  must(html.includes('<!-- glencraft-build: b1272-v1.2.72 -->'), 'b1272 marker missing');
  html = replaceOnce(html,
    '<!-- glencraft-build: b1272-v1.2.72 -->',
    '<!-- glencraft-build: b1272-v1.2.72 -->\n<!-- glencraft-build: b1273-v1.2.73 -->',
    'build marker');
}

const NOTE = '{"v":"v1.2.73","d":"2026-11-13","notes":["Fix: the Highland pistol\\u2019s magazine sits in the grip, in hip fire and when you aim, on every gun that has a magazine.","Fix: letting go of the on-screen RT / Mine button stops the pickaxe (and other tools). The swing no longer keeps going after you take your finger off. The pickaxe arm is a connected sleeve and hand, not a floating stump.","Fix: aiming the Highland pistol no longer drives your arms through the gun, and aiming the Highland musket no longer leaves the arms as floating twisted pieces. Reloading the musket keeps the gun together \\u2014 it no longer explodes, spins apart, or vanishes.","New: the TARDIS cannot fly faster than 100,000 miles an hour (at the game\\u2019s scale of one block to one metre). If you are piloting it, your speed is shown in mph.","Change: Scottish dogs only turn up near trees, in small groups of at most three, spaced a few blocks apart, and much more rarely than before.","First-person hands stay hidden in third person, and the gold D-pad is left alone.","Hard-refresh to load this build."]},';
if (!html.includes('"v":"v1.2.73"')) {
  html = replaceOnce(html,
    'window.PATCH_NOTES = [\n{"v":"v1.2.72"',
    'window.PATCH_NOTES = [\n' + NOTE + '\n{"v":"v1.2.72"',
    'PATCH_NOTES');
} else {
  const reNote = /\{"v":"v1\.2\.73","d":"2026-11-13","notes":\[[\s\S]*?\]\},/;
  if (reNote.test(html)) html = html.replace(reNote, NOTE);
}

/* ---- (1) seat the pistol magazine fully in the well ---- */
const MAGFIX_OLD = "    if (bm.max.x > bf.min.x) return 0; const t = new THREE.Object3D(), par = M.parent; m.add(t); t.attach(M); M.position.x += 0.085; par.attach(M); m.remove(t); return 1; };";
const MAGFIX_NEW = "    const _cx = ((bf.min.x + bf.max.x) / 2) - ((bm.min.x + bm.max.x) / 2); const _ov = bm.max.x > bf.min.x + 0.002 && bm.min.x < bf.max.x - 0.002; if (_ov && Math.abs(_cx) < 0.012) return 1; const t = new THREE.Object3D(), par = M.parent; m.add(t); t.attach(M); M.position.x += _cx; par.attach(M); m.remove(t); return 1; };";
if (html.includes('M.position.x += 0.085')) {
  html = replaceOnce(html, MAGFIX_OLD, MAGFIX_NEW, 'magFix seat');
}
must(html.includes('M.position.x += _cx'), 'magFix does not align the magazine to the well');
must(!html.includes('M.position.x += 0.085'), 'old short magFix nudge is still present');

/* ---- (3) musket/rifle must not treat a nameless mesh as a magazine ---- */
html = replaceOnce(html,
  'u.mag = part(isP ? /magazine_loaded$/ : /^$/);',
  'u.mag = isP ? part(/magazine_loaded$/) : new THREE.Group();',
  'musket fake mag');
must(!html.includes("part(isP ? /magazine_loaded$/ : /^$/)"), 'empty-regex mag part() still used');

const C43_OLD = "        const magOut = rlT > 0 ? (rf < 0.25 ? rf / 0.25 : rf < 0.55 ? 1 - (rf - 0.25) / 0.3 : 0) : 0; u.mag.position.y = -0.12 * magOut; u.mag.visible = magOut < 0.98;";
const C43_NEW = "        const magOut = rlT > 0 ? (rf < 0.25 ? rf / 0.25 : rf < 0.55 ? 1 - (rf - 0.25) / 0.3 : 0) : 0; if (u.mag) { let _rm = false; try { u.mag.traverse(o => { if (o.isMesh && /magazine/i.test(o.name || '')) _rm = true; }); } catch (_) {} if (_rm) { u.mag.position.y = -0.12 * magOut; u.mag.visible = magOut < 0.98; } }";
html = replaceOnce(html, C43_OLD, C43_NEW, 'C43 real-mag only');
must(html.includes("if (o.isMesh && /magazine/i.test(o.name || '')) _rm = true"), 'C43 does not guard the magazine animation');

/* Keep the musket forearm visible in ADS so the arms stay attached. */
html = replaceOnce(html,
  "            if (kind === 'musket') p.fo.visible = false;",
  "            if (kind === 'musket') { p.fo.visible = true; p.fo.scale.set(s0.x * 0.85, s0.y * 0.72, s0.z * 0.85); }",
  'musket ADS forearm');

/* 1.2.70/1.2.71 sculpt flags are not leftover debris. */
const LEFT_OLD = "          const leftover = !u.sculpt1249 && !u.nail1249 && !u.sculptGeo1249 && !u.sleeve1257 && !u.tapered1257 && !u.folded1249 &&\n            (typ === 'BoxGeometry' || typ === 'CylinderGeometry' || typ === 'DodecahedronGeometry');";
const LEFT_NEW = "          const leftover = !u.sculpt1249 && !u.nail1249 && !u.sculptGeo1249 && !u.sleeve1257 && !u.tapered1257 && !u.folded1249 &&\n            !u.sculpt1270 && !u.sculpt1271 && !u.slim1270 && !u.slim1271 && !u.sculptKeep &&\n            (typ === 'BoxGeometry' || typ === 'CylinderGeometry' || typ === 'DodecahedronGeometry');";
html = replaceOnce(html, LEFT_OLD, LEFT_NEW, 'ADS leftover flags');

/* ---- (2) bMine also ends on lostpointercapture (window-level clear is in the IIFE) ---- */
html = replaceOnce(html,
  "  brk.addEventListener('pointerup', brkEnd); brk.addEventListener('pointercancel', brkEnd);",
  "  brk.addEventListener('pointerup', brkEnd); brk.addEventListener('pointercancel', brkEnd); brk.addEventListener('lostpointercapture', brkEnd);",
  'bMine lostpointercapture');

/* ---- (4) TARDIS 100,000 mph cap ---- */
const CAP1264 = "    /* 1.2.73: cap at 100,000 mph (1 block = 1 m \u2192 44704.0 blocks/s). Boost is also clamped by this ceiling. */\n" +
  "    const MAX_V1273 = 100000 * 1609.344 / 3600;\n" +
  "    let spd1273 = Math.hypot(F.v[0], F.v[1], F.v[2]);\n" +
  "    if (spd1273 > MAX_V1273 && spd1273 > 0) {\n" +
  "      const s1273 = MAX_V1273 / spd1273;\n" +
  "      F.v[0] *= s1273; F.v[1] *= s1273; F.v[2] *= s1273;\n" +
  "      spd1273 = MAX_V1273;\n" +
  "    }\n";
const SPEED1264_OLD = "    if (A) A.speed = Math.hypot(F.v[0], F.v[1], F.v[2]);";
const SPEED1264_NEW = CAP1264 +
  "    if (A) { A.speed = spd1273; A.speedMph = spd1273 * 3600 / 1609.344; }\n" +
  "    try { const _U = window.__tbox1260; if (_U) { _U.speed = spd1273; _U.speedMph = spd1273 * 3600 / 1609.344; } } catch (_) {}";
html = replaceOnce(html, SPEED1264_OLD, SPEED1264_NEW, 'fly1264 cap');

const SPEED1260_OLD = "    U.speed = Math.hypot(F.v[0], F.v[1], F.v[2]);";
const SPEED1260_NEW = "    const MAX_V1273 = 100000 * 1609.344 / 3600;\n" +
  "    let spd1273 = Math.hypot(F.v[0], F.v[1], F.v[2]);\n" +
  "    if (spd1273 > MAX_V1273 && spd1273 > 0) {\n" +
  "      const s1273 = MAX_V1273 / spd1273;\n" +
  "      F.v[0] *= s1273; F.v[1] *= s1273; F.v[2] *= s1273;\n" +
  "      spd1273 = MAX_V1273;\n" +
  "    }\n" +
  "    U.speed = spd1273; U.speedMph = spd1273 * 3600 / 1609.344;";
html = replaceOnce(html, SPEED1260_OLD, SPEED1260_NEW, 'fly1260 cap');
if (html.includes('accelerate with no top speed while the stick is held')) {
  html = replaceOnce(html,
    'accelerate with no top speed while the stick is held',
    'accelerate, then cap at 100,000 mph (1.2.73)',
    '1260 no-top-speed comment');
}

/* ---- (5) Scottish-dog / wild 1267 pack spawn ---- */
const SPAWN_OLD = "  function spawnPack() {\n" +
  "    const spot = findPackSpot();\n" +
  "    if (!spot) return null;\n" +
  "    const n = 3 + (Math.random() < 0.45 ? 1 : 0);\n" +
  "    const packId = 'w' + Date.now().toString(36) + Math.floor(Math.random() * 999);\n" +
  "    const out = [];\n" +
  "    for (let i = 0; i < n; i++) {\n" +
  "      const a = makeAnimal('wolf', { packId: packId });\n" +
  "      const ox = (Math.random() - 0.5) * 3.2, oz = (Math.random() - 0.5) * 3.2;\n" +
  "      placeAnimal(a, spot[0] + ox, groundAt(spot[0] + ox, spot[2] + oz), spot[2] + oz);\n" +
  "      a.ang = Math.random() * Math.PI * 2;\n" +
  "      a.g.rotation.y = a.ang;\n" +
  "      out.push(a);\n" +
  "    }\n" +
  "    U.packs++;\n" +
  "    U.on = 1;\n" +
  "    return out;\n" +
  "  }";
const SPAWN_NEW = "  function spawnPack() {\n" +
  "    /* 1.2.73: only near trees (log or leaves), groups of at most 3, 4-8 blocks apart. */\n" +
  "    function nearTree(x, y, z, radius) {\n" +
  "      radius = radius || 5;\n" +
  "      const gx = Math.floor(x), gy = Math.floor(y || 0), gz = Math.floor(z);\n" +
  "      const leafy = (typeof LEAFY !== 'undefined') ? LEAFY : null;\n" +
  "      const loggy = (typeof LOGGY !== 'undefined') ? LOGGY : null;\n" +
  "      const Tref = (typeof T !== 'undefined') ? T : {};\n" +
  "      for (let dx = -radius; dx <= radius; dx++) {\n" +
  "        for (let dz = -radius; dz <= radius; dz++) {\n" +
  "          if (dx * dx + dz * dz > radius * radius) continue;\n" +
  "          for (let dy = -3; dy <= 8; dy++) {\n" +
  "            let id = 0;\n" +
  "            try { id = (typeof getBlock === 'function' ? getBlock(gx + dx, gy + dy, gz + dz) : (typeof getB === 'function' ? getB(gx + dx, gy + dy, gz + dz) : 0)) | 0; } catch (_) {}\n" +
  "            if (!id) continue;\n" +
  "            if (loggy && loggy[id]) return true;\n" +
  "            if (leafy && leafy[id]) return true;\n" +
  "            if (Tref && (id === Tref.LOG || id === Tref.LEAVES)) return true;\n" +
  "          }\n" +
  "        }\n" +
  "      }\n" +
  "      return false;\n" +
  "    }\n" +
  "    function chunkCount(x, z) {\n" +
  "      const cx = Math.floor(x / 16), cz = Math.floor(z / 16);\n" +
  "      try {\n" +
  "        return mobs.filter(function (a) {\n" +
  "          if (!a || !a.__1267 || a.kind !== 'wolf' || a.tamed) return false;\n" +
  "          const p = a.g && a.g.position;\n" +
  "          if (!p) return false;\n" +
  "          return Math.floor(p.x / 16) === cx && Math.floor(p.z / 16) === cz;\n" +
  "        }).length;\n" +
  "      } catch (_) { return 0; }\n" +
  "    }\n" +
  "    let spot = null;\n" +
  "    for (let attempt = 0; attempt < 10; attempt++) {\n" +
  "      const s = findPackSpot();\n" +
  "      if (s && nearTree(s[0], s[1], s[2], 5) && chunkCount(s[0], s[2]) < 3) { spot = s; break; }\n" +
  "    }\n" +
  "    if (!spot) return null;\n" +
  "    const n = Math.min(3, 1 + Math.floor(Math.random() * 3));\n" +
  "    const packId = 'w' + Date.now().toString(36) + Math.floor(Math.random() * 999);\n" +
  "    const out = [];\n" +
  "    const used = [];\n" +
  "    for (let i = 0; i < n; i++) {\n" +
  "      let px = spot[0], pz = spot[2], ok = false;\n" +
  "      for (let t = 0; t < 20; t++) {\n" +
  "        const ang = (i / Math.max(1, n)) * Math.PI * 2 + (Math.random() - 0.5) * 0.6;\n" +
  "        const r = 4 + Math.random() * 4;\n" +
  "        px = spot[0] + Math.cos(ang) * r;\n" +
  "        pz = spot[2] + Math.sin(ang) * r;\n" +
  "        ok = used.every(function (u) { return Math.hypot(px - u[0], pz - u[1]) >= 4; });\n" +
  "        if (ok || !used.length) { ok = true; break; }\n" +
  "      }\n" +
  "      if (!ok && used.length) {\n" +
  "        const ang = (i / Math.max(1, n)) * Math.PI * 2;\n" +
  "        px = spot[0] + Math.cos(ang) * 6;\n" +
  "        pz = spot[2] + Math.sin(ang) * 6;\n" +
  "      }\n" +
  "      const a = makeAnimal('wolf', { packId: packId });\n" +
  "      placeAnimal(a, px, groundAt(px, pz), pz);\n" +
  "      a.ang = Math.random() * Math.PI * 2;\n" +
  "      a.g.rotation.y = a.ang;\n" +
  "      out.push(a);\n" +
  "      used.push([px, pz]);\n" +
  "    }\n" +
  "    U.packs++;\n" +
  "    U.on = 1;\n" +
  "    return out;\n" +
  "  }";
html = replaceOnce(html, SPAWN_OLD, SPAWN_NEW, 'spawnPack');
html = replaceOnce(html,
  'wildCount() < 7) spawnPack();',
  'wildCount() < 3 && Math.random() < 0.1) spawnPack();',
  'spawn rate and cap');
must(html.includes('nearTree'), 'spawnPack is not tree-restricted');
must(html.includes('Math.min(3, 1 + Math.floor(Math.random() * 3))'), 'pack size is not capped at 3');
must(html.includes('wildCount() < 3 && Math.random() < 0.1)'), 'spawn rate / cap not lowered');
must(!html.includes('wildCount() < 7) spawnPack()'), 'old wild cap of 7 is still used');

must(html.includes('/* GLX-HANDS1271'), 'HANDS1271 must stay');
must(html.includes('/* GLX-HANDS1270'), 'HANDS1270 must stay');
must(html.includes('/* GLX-HANDS1266'), 'HANDS1266 must stay');
must(html.includes('/* GLX-HANDS1263'), 'HANDS1263 must stay');
must(html.includes("restoredFrom: '1e9db15'"), '1263 restore must stay');
must(!html.includes('/* GLX-HANDS1261'), 'HANDS1261 must stay removed');
must(!html.includes("['dU', 'dL', 'dR'].forEach"), 'gold D-pad must stay untouched');
must(html.includes('/* GLX-FIX1272'), 'FIX1272 must stay');

const files = ['tools/content-source/fix-1273.js'].filter(f => fs.existsSync(path.join(root, f)));
must(files.length === 1, 'fix-1273.js is required');
{
  const bundled = files.map(f => fs.readFileSync(path.join(root, f), 'utf8').trim() + '\n').join('');
  const INJECT_MARK = '/* GLX-FIX1273 (v1.2.73):';
  if (html.includes(INJECT_MARK)) {
    const i = html.indexOf(INJECT_MARK);
    const j = html.indexOf('</script>', i);
    must(j > i, 'cannot find </script> after existing 1273 IIFE');
    html = html.slice(0, i) + bundled + html.slice(j);
  } else {
    const k = html.lastIndexOf('</script>');
    must(k > 0, 'no closing script');
    html = html.slice(0, k) + '\n' + bundled + html.slice(k);
  }
}

must(html.includes("const GAME_VERSION = '1.2.73';"), 'version not bumped');
must(html.includes('"v":"v1.2.73"'), 'patch notes missing');
must(html.includes('GLX-FIX1273'), 'fix 1273 IIFE missing');
must(html.includes('gold D-pad is left alone'), '1273 must record that the gold D-pad is left alone');
must(html.includes('lostpointercapture'), '1273 must clear RT on lostpointercapture');
must(html.includes('100000 * 1609.344 / 3600'), '1273 must cap TARDIS speed at 100,000 mph');
must(html.includes('tboxMph') || html.includes('speedMph'), '1273 must expose speed in mph');
{
  const i = html.indexOf('GLX-FIX1273');
  const scr = html.indexOf('</script>', i);
  const body = html.slice(i, scr > i ? scr : html.length);
  must(body.includes('attackTouch'), '1273 must clear attackTouch on RT release');
  must(body.includes('seatMag'), '1273 must seat the magazine');
  must(body.includes('MAX_V'), '1273 IIFE records the speed cap');
  must(!body.includes("['dU', 'dL', 'dR'].forEach"), '1273 must not touch the gold D-pad');
}

fs.writeFileSync(path.join(root, 'index.html'), html);
console.log('index.html', before, '->', html.length);

fs.writeFileSync(path.join(root, 'version.json'), '{"v":"1.2.73"}\n');
console.log('version.json written');

let credits = fs.readFileSync(path.join(root, 'CREDITS.md'), 'utf8');
const block = `## v1.2.73 Magazine in the gun, RT lets go, TARDIS cap, rare dogs

- Fix: the Highland pistol's magazine sits in the grip, in hip fire and when you aim, on every gun that has a magazine.
- Fix: letting go of the on-screen RT / Mine button stops the pickaxe (and other tools). The swing no longer keeps going after you take your finger off. The pickaxe arm is a connected sleeve and hand, not a floating stump.
- Fix: aiming the Highland pistol no longer drives your arms through the gun, and aiming the Highland musket no longer leaves the arms as floating twisted pieces. Reloading the musket keeps the gun together — it no longer explodes, spins apart, or vanishes.
- New: the TARDIS cannot fly faster than 100,000 miles an hour (at the game's scale of one block to one metre). If you are piloting it, your speed is shown in mph.
- Change: Scottish dogs only turn up near trees, in small groups of at most three, spaced a few blocks apart, and much more rarely than before.
- First-person hands stay hidden in third person. The gold D-pad is left alone.

`;
if (!credits.includes('## v1.2.73')) {
  credits = credits.replace('## v1.2.72 Actions only on real input', block + '## v1.2.72 Actions only on real input');
} else {
  const a = credits.indexOf('## v1.2.73');
  const b = credits.indexOf('## v1.2.72', a + 1);
  if (a >= 0 && b > a) credits = credits.slice(0, a) + block + credits.slice(b);
}
must(credits.includes('## v1.2.73'), 'CREDITS 1.2.73 missing');
fs.writeFileSync(path.join(root, 'CREDITS.md'), credits);
console.log('CREDITS.md updated');

/* Keep content-source in sync for the patched closed-over functions. */
(function syncSources() {
  const mobs = 'tools/content-source/mobs-1267.js';
  const t64 = 'tools/content-source/tbox-1264.js';
  const t60 = 'tools/content-source/tbox-1260.js';
  const grip = 'tools/content-source/grip-1222.js';
  const mp = path.join(root, mobs);
  if (fs.existsSync(mp)) {
    let s = fs.readFileSync(mp, 'utf8');
    if (s.includes(SPAWN_OLD)) s = s.split(SPAWN_OLD).join(SPAWN_NEW);
    if (s.includes('wildCount() < 7) spawnPack();')) {
      s = s.split('wildCount() < 7) spawnPack();').join('wildCount() < 3 && Math.random() < 0.1) spawnPack();');
    }
    fs.writeFileSync(mp, s);
    console.log('synced', mobs);
  }
  const p64 = path.join(root, t64);
  if (fs.existsSync(p64)) {
    let s = fs.readFileSync(p64, 'utf8');
    if (s.includes(SPEED1264_OLD)) s = s.split(SPEED1264_OLD).join(SPEED1264_NEW);
    fs.writeFileSync(p64, s);
    console.log('synced', t64);
  }
  const p60 = path.join(root, t60);
  if (fs.existsSync(p60)) {
    let s = fs.readFileSync(p60, 'utf8');
    if (s.includes(SPEED1260_OLD)) s = s.split(SPEED1260_OLD).join(SPEED1260_NEW);
    if (s.includes('accelerate with no top speed while the stick is held')) {
      s = s.split('accelerate with no top speed while the stick is held').join('accelerate, then cap at 100,000 mph (1.2.73)');
    }
    fs.writeFileSync(p60, s);
    console.log('synced', t60);
  }
  const pg = path.join(root, grip);
  if (fs.existsSync(pg)) {
    let s = fs.readFileSync(pg, 'utf8');
    if (s.includes(MAGFIX_OLD)) {
      s = s.split(MAGFIX_OLD).join(MAGFIX_NEW);
      fs.writeFileSync(pg, s);
      console.log('synced', grip);
    }
  }
})();

console.log('build 1.2.73 done');

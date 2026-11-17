#!/usr/bin/env node
/* Inject v1.2.96 Egypt-realm fixes into index.html and bump version pins. */
'use strict';
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const VER = process.env.GAME_VERSION || '1.2.96';
const BUILD = 'b1296-v' + VER;
const DATE = '2026-11-17';

function mustCount(hay, needle, n, label) {
  let c = 0, i = 0;
  while (true) {
    const j = hay.indexOf(needle, i);
    if (j < 0) break;
    c++; i = j + 1;
  }
  if (c !== n) throw new Error((label || needle.slice(0, 80)) + ': expected ' + n + ' hits, got ' + c);
  return c;
}
function replaceOnce(hay, from, to, label) {
  mustCount(hay, from, 1, label || from.slice(0, 80));
  return hay.replace(from, to);
}
function replaceAllN(hay, from, to, n, label) {
  mustCount(hay, from, n, label || from.slice(0, 80));
  return hay.split(from).join(to);
}

let html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
if (html.includes('GLX-EG1295')) throw new Error('GLX-EG1295 is already injected');

// 1. Paintings: c239 murals and c268 gallery art may build and show in Egypt.
html = replaceOnce(
  html,
  'if (!started || DIM.cur) { grp.visible = false; return r; }',
  "if (!started || (DIM.cur && DIM.cur !== 'egypt')) { grp.visible = false; return r; }",
  'c239 mural visibility'
);
html = replaceOnce(
  html,
  'setInterval(() => { try { if (!started || DIM.cur) { grp.visible = false; return; }\n    const o = window.__c239 && __c239.pyr',
  "setInterval(() => { try { if (!started || (DIM.cur && DIM.cur !== 'egypt')) { grp.visible = false; return; }\n    const o = window.__c239 && __c239.pyr",
  'c268 painting visibility'
);

// 2. Find the Egypt pyramid when the overworld MT_C is outside the 256-wide Egypt land.
html = replaceOnce(
  html,
  'function find() { const R = 160, x0 = MT_C[0], z0 = MT_C[1], ys = SEA + 18, ye = Math.min(H - 2, SEA + 45);',
  "function find() { try { if (typeof DIM !== 'undefined' && DIM.cur === 'egypt' && window.__egPyr) { const e = __egPyr(); if (e && e.L) return e; } } catch (_) {} const R = 160, x0 = MT_C[0], z0 = MT_C[1], ys = SEA + 18, ye = Math.min(H - 2, SEA + 45);",
  'c239 find egypt fallback'
);

// 3. Egyptians: visible and simulated only in Egypt.
html = replaceOnce(
  html,
  'for (const f of folk) { f.g.visible = !DIM.cur; if (!near || !live) continue;',
  "for (const f of folk) { f.g.visible = DIM.cur === 'egypt'; if (!near || !live) continue;",
  'c240 folk visibility'
);
html = replaceOnce(
  html,
  'P.z - (o.cz + 0.5)) < 70, live = !paused && !dead && !DIM.cur; dt = Math.min(dt || 0.016, 0.1);\n        for (const f of folk)',
  "P.z - (o.cz + 0.5)) < 70, live = !paused && !dead && DIM.cur === 'egypt'; dt = Math.min(dt || 0.016, 0.1);\n        for (const f of folk)",
  'c240 folk live flag'
);
html = replaceOnce(
  html,
  'if (o && o !== key && o.L) { key = o; spawn(o); }',
  "if (o && o !== key && o.L) { key = o; if (typeof DIM !== 'undefined' && DIM.cur === 'egypt') spawn(o); }",
  'c240 spawn only in egypt'
);
html = replaceOnce(
  html,
  'function idle(f, dt, near) { f.g.visible = !DIM.cur; if (!f.g.visible || f.dz) return;',
  "function idle(f, dt, near) { f.g.visible = DIM.cur === 'egypt'; if (!f.g.visible || f.dz) return;",
  'c259 idle visibility'
);
html = replaceOnce(
  html,
  'Math.hypot(P.x - o.cx, P.z - o.cz) < 80, live = !paused && !dead && !DIM.cur;',
  "Math.hypot(P.x - o.cx, P.z - o.cz) < 80, live = !paused && !dead && DIM.cur === 'egypt';",
  'c259 live flag'
);
html = replaceOnce(
  html,
  "if (o && o.L) spawn(o); }   /* v1.0.86: folk are kept if the pyramid scan blinks */",
  "if (o && o.L && typeof DIM !== 'undefined' && DIM.cur === 'egypt') spawn(o); }   /* v1.0.86: folk are kept if the pyramid scan blinks */",
  'c259 spawn only in egypt'
);
html = replaceOnce(
  html,
  'if (U.far > 2 || DIM.cur) { U.why = DIM.cur ? \'dim\' : \'far\'; stop(); }',
  "if (U.far > 2 || DIM.cur !== 'egypt') { U.why = (DIM.cur !== 'egypt') ? 'dim' : 'far'; stop(); }",
  'c259 dance stays in egypt'
);

// 4. Night sky stars may fade in in Egypt (NSKY used to hide in every dimension).
html = replaceOnce(
  html,
  "const off = !started || (typeof DIM !== 'undefined' && DIM.cur) || (window.__c295 && __c295.inside)",
  "const off = !started || (typeof DIM !== 'undefined' && DIM.cur && DIM.cur !== 'egypt') || (window.__c295 && __c295.inside)",
  'nsky allowed in egypt'
);

// 5. Agartha saucer: destination is the Egypt pyramid; never shown in the Glencraft overworld.
html = replaceOnce(
  html,
  "const here = DIM.cur === 'agartha' ? 'ag' : !DIM.cur ? 'ow' : null, p = U.pos, u = c.ufo();",
  "const here = (typeof window.__eg1295 !== 'undefined' && __eg1295.ufoHereTag) ? __eg1295.ufoHereTag() : (DIM.cur === 'egypt' ? 'egypt' : DIM.cur === 'agartha' ? 'ag' : null), p = U.pos, u = c.ufo();",
  'c304 show() here tag'
);
html = replaceAllN(html, "['ow', py.cx + .5", "['egypt', py.cx + .5", 10, 'c304 pyramid waypoints -> egypt');
html = replaceOnce(
  html,
  'U.on = () => { try { const a = A(); return !!(started && a && (a.M || big()) && a.AG && window.__c239 && __c239.pyr); } catch (_) { return false; } };',
  "U.on = () => { try { const a = A(); return !!(started && a && (a.M || big()) && a.AG && (window.__egPyr || (window.__c239 && __c239.pyr))); } catch (_) { return false; } };",
  'c304 U.on uses egypt pyr'
);
html = replaceOnce(
  html,
  'function zig(dt, p) { const py = __c239.pyr, e = PTS[PTS.length - 1];',
  'function zig(dt, p) { const py = (window.__egPyr && __egPyr()) || __c239.pyr, e = PTS[PTS.length - 1];',
  'c304 zig uses egypt pyr'
);
html = replaceOnce(
  html,
  'function buildP() { const py = __c239.pyr, po = window.__c332 && __c332.pole;',
  'function buildP() { const py = (window.__egPyr && __egPyr()) || __c239.pyr, po = window.__c332 && __c332.pole;',
  'c304 buildP uses egypt pyr'
);
html = replaceOnce(
  html,
  'function build() { const a = A(), M = a.M; if (!M || big()) return buildP(); const G = a.AG, py = __c239.pyr,',
  'function build() { const a = A(), M = a.M; if (!M || big()) return buildP(); const G = a.AG, py = (window.__egPyr && __egPyr()) || __c239.pyr,',
  'c304 build uses egypt pyr'
);

// 6. Bump version, notes, build marker.
html = replaceOnce(html, "const GAME_VERSION = '1.2.95';", "const GAME_VERSION = '" + VER + "';", 'GAME_VERSION');
html = replaceOnce(
  html,
  '<!-- glencraft-build: b1295-v1.2.95 -->',
  '<!-- glencraft-build: b1295-v1.2.95 -->\n<!-- glencraft-build: ' + BUILD + ' -->',
  'build marker'
);
const notesEntry = '{"v":"v' + VER + '","d":"' + DATE + '","notes":["The UFO paintings hang in the Egypt land pyramid again.","The Agartha saucer flies to the sand realm at night and no longer appears over Glencraft.","Egyptians only live at the temple in the sand realm.","Egypt land has its own desert sky: a deep blue day, orange and pink sunsets, and a clear starry night."]}';
html = replaceOnce(
  html,
  'window.PATCH_NOTES = [\n{"v":"v1.2.95"',
  'window.PATCH_NOTES = [\n' + notesEntry + ',\n{"v":"v1.2.95"',
  'PATCH_NOTES'
);

// 7. Inject the late IIFE just before the closing script tag.
const src = fs.readFileSync(path.join(root, 'tools/content-source/egypt-1295.js'), 'utf8').trim() + '\n';
const at = html.lastIndexOf('</script>');
if (at < 0) throw new Error('no closing script tag');
html = html.slice(0, at) + '\n' + src + html.slice(at);
if (!html.includes('GLX-EG1295') || !html.includes(src.trim())) throw new Error('inject failed');

fs.writeFileSync(path.join(root, 'index.html'), html);
fs.writeFileSync(path.join(root, 'version.json'), JSON.stringify({v: VER}) + '\n');

// 8. CREDITS
const creditsPath = path.join(root, 'CREDITS.md');
let credits = fs.readFileSync(creditsPath, 'utf8');
if (!credits.includes('## v' + VER)) {
  const block = [
    '## v' + VER + ' Egypt land paintings, saucer and sky',
    '',
    '- The player\'s UFO and alien paintings (`assets/art/user_p1-6.jpg`, drawn by the player) hang again in the pyramid gallery in Egypt land, together with the original hall murals. They had been hidden since Egypt became its own dimension in v1.2.69.',
    '- The Agartha saucer now flies to the sand realm at night and does not appear in the Glencraft overworld.',
    '- Egyptians only spawn and stay visible in the sand / temple realm.',
    '- Egypt land has its own desert sky and matching fog (deep blue day with a hot sun and a slight dust haze, orange-pink sunrise and sunset, a dark clear starry night). The Glencraft, Agartha and space skies are unchanged. The existing WebGL1 sky dome is re-tinted; no new heavy shaders.',
    '',
    ''
  ].join('\n');
  if (credits.includes('## v1.2.92 Controller inventory')) {
    credits = credits.replace('## v1.2.92 Controller inventory', block + '## v1.2.92 Controller inventory');
  } else {
    credits += '\n' + block;
  }
  fs.writeFileSync(creditsPath, credits);
}

// 9. Loosen / bump version pins in the release suites.
function bumpPins(file, fn) {
  const pth = path.join(root, 'tests', file);
  if (!fs.existsSync(pth)) return;
  let t = fs.readFileSync(pth, 'utf8');
  const before = t;
  t = fn(t);
  if (t !== before) fs.writeFileSync(pth, t);
}

function addVersionToList(t) {
  t = t.replace(/'1\.2\.95'\]/g, "'1.2.95', '1.2.96']");
  t = t.replace(/"const GAME_VERSION = '1\.2\.95';"\)/g,
    "\"const GAME_VERSION = '1.2.95';\") || html.includes(\"const GAME_VERSION = '1.2.96';\")");
  return t;
}
for (const f of [
  'v1282-release.mjs', 'v1283-release.mjs', 'v1284-torso.mjs', 'v1285-torso.mjs',
  'v1285-fp-hands.mjs', 'v1286-perf.mjs', 'v1240-reload-fp.mjs', 'v1240-held-items-fp-arms.mjs',
  'v1244-4k-like-1241.mjs', 'v1244-fp-procedural-arms.mjs'
]) bumpPins(f, addVersionToList);

// PATCH_NOTES index bounds shift by one now that 1.2.96 is first.
bumpPins('v1282-release.mjs', (t) => t.replace('k >= 0 && k <= 13 &&', 'k >= 0 && k <= 14 &&'));
bumpPins('v1283-release.mjs', (t) => t.replace('k >= 0 && k <= 12 &&', 'k >= 0 && k <= 13 &&'));
bumpPins('v1285-torso.mjs', (t) => t.replace('k >= 0 && k <= 10 &&', 'k >= 0 && k <= 11 &&'));

bumpPins('v1285-loading.mjs', (t) => {
  t = t.replace("ok(html.includes(\"const GAME_VERSION = '1.2.95';\"), 'GAME_VERSION is 1.2.95');",
    "ok(html.includes(\"const GAME_VERSION = '1.2.96';\"), 'GAME_VERSION is 1.2.96');\n" +
    "ok(!html.includes(\"const GAME_VERSION = '1.2.95';\"), 'GAME_VERSION is no longer 1.2.95');");
  t = t.replace(
    "ok(/\"v\"\\s*:\\s*\"v1\\.2\\.95\"/.test(html), '1.2.95 patch notes present');",
    "ok(/\"v\"\\s*:\\s*\"v1\\.2\\.96\"/.test(html), '1.2.96 patch notes present');\n" +
    "ok(/\"v\"\\s*:\\s*\"v1\\.2\\.95\"/.test(html), '1.2.95 patch notes present');"
  );
  t = t.replace(
    "ok(/green loading fluid/i.test(html), '1.2.94 notes mention the green loading fluid');",
    "ok(/green loading fluid/i.test(html), '1.2.94 notes mention the green loading fluid');\n" +
    "ok(/first-person pickaxe stays in your fist/i.test(html), '1.2.95 notes mention the pickaxe');\n" +
    "ok(/UFO paintings hang in the Egypt land pyramid/i.test(html), '1.2.96 notes mention the UFO paintings');\n" +
    "ok(/flies to the sand realm at night/i.test(html), '1.2.96 notes mention the saucer night route');\n" +
    "ok(/Egyptians only live at the temple/i.test(html), '1.2.96 notes mention Egyptians only in the sand realm');\n" +
    "ok(/own desert sky/i.test(html), '1.2.96 notes mention the desert sky');"
  );
  t = t.replace(
    "const st = html.indexOf('{\"v\":\"v1.2.95\"'), en = html.indexOf('{\"v\":\"v1.2.94\"', st);\n  ok(st > 0 && en > st && !/haggis|food|sausage|pie\\b|bread|meat|stew/i.test(html.slice(st, en)), '1.2.95 notes first, no food');",
    "const st = html.indexOf('{\"v\":\"v1.2.96\"'), en = html.indexOf('{\"v\":\"v1.2.95\"', st);\n  ok(st > 0 && en > st && !/haggis|food|sausage|pie\\b|bread|meat|stew/i.test(html.slice(st, en)), '1.2.96 notes first, no food');"
  );
  t = t.replace(
    "ok(JSON.parse(fs.readFileSync(new URL('../version.json', import.meta.url), 'utf8')).v === '1.2.95', 'version.json is 1.2.95');",
    "ok(JSON.parse(fs.readFileSync(new URL('../version.json', import.meta.url), 'utf8')).v === '1.2.96', 'version.json is 1.2.96');"
  );
  t = t.replace(
    "html.includes('<!-- glencraft-build: b1295-v1.2.95 -->'), '1.2.84–1.2.95 build markers stay');",
    "html.includes('<!-- glencraft-build: b1295-v1.2.95 -->') && html.includes('<!-- glencraft-build: b1296-v1.2.96 -->'), '1.2.84–1.2.96 build markers stay');"
  );
  return t;
});
bumpPins('v1289-loading.mjs', (t) => {
  t = t.replace('Released as 1.2.89. Version is 1.2.95.', 'Released as 1.2.89. Version is 1.2.96.');
  t = t.replace("ok(html.includes(\"const GAME_VERSION = '1.2.95';\"), 'GAME_VERSION is 1.2.95');",
    "ok(html.includes(\"const GAME_VERSION = '1.2.96';\"), 'GAME_VERSION is 1.2.96');");
  t = t.replace("ok(JSON.parse(fs.readFileSync(new URL('../version.json', import.meta.url), 'utf8')).v === '1.2.95', 'version.json is 1.2.95');",
    "ok(JSON.parse(fs.readFileSync(new URL('../version.json', import.meta.url), 'utf8')).v === '1.2.96', 'version.json is 1.2.96');");
  return t;
});

console.log('built', VER, BUILD, 'html bytes', fs.statSync(path.join(root, 'index.html')).size);

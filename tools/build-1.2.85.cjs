#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');

function must(cond, msg) { if (!cond) { console.error('FAIL:', msg); process.exit(1); } }
function replaceOnce(s, a, b, label) {
  const n = s.split(a).length - 1;
  must(n === 1, label + ': expected 1 match, got ' + n);
  return s.split(a).join(b);
}

let html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

if (html.includes("const GAME_VERSION = '1.2.84';") && !html.includes("const GAME_VERSION = '1.2.85';")) {
  html = replaceOnce(html, "const GAME_VERSION = '1.2.84';", "const GAME_VERSION = '1.2.85';", 'GAME_VERSION');
}
must(html.includes("const GAME_VERSION = '1.2.85';"), 'GAME_VERSION is not 1.2.85');

if (!html.includes('<!-- glencraft-build: b1285-v1.2.85 -->')) {
  must(html.includes('<!-- glencraft-build: b1284-v1.2.84 -->'), 'b1284 marker missing');
  html = replaceOnce(html,
    '<!-- glencraft-build: b1284-v1.2.84 -->',
    '<!-- glencraft-build: b1284-v1.2.84 -->\n<!-- glencraft-build: b1285-v1.2.85 -->',
    'build marker');
}

const NOTE = '{"v":"v1.2.85","d":"2026-11-15","notes":["Your shirt\'s original sides are back in third person: the stomach and waist wrap from the first Scottish model, not stitched-on panels.","The chest matches that original shape. Your chest, kilt and sporran stay hidden only from your own first-person camera, so nothing blocks your view when you look down.","First-person hands now match the rounded third-person look, with the same crease, knuckle and nail shading. Your current arm animations and grips stay as they are."]},';
if (!html.includes('"v":"v1.2.85"')) {
  html = replaceOnce(html,
    'window.PATCH_NOTES = [\n{"v":"v1.2.84"',
    'window.PATCH_NOTES = [\n' + NOTE + '\n{"v":"v1.2.84"',
    'PATCH_NOTES');
} else {
  const i = html.indexOf('{"v":"v1.2.85"');
  const j = html.indexOf('\n{"v":"v1.2.84"', i);
  must(i >= 0 && j > i, 'cannot re-place 1.2.85 note');
  html = html.slice(0, i) + NOTE + html.slice(j);
}

/* Replace the GLX-TORSO1262 IIFE with the 1.2.85 source. */
const torso = fs.readFileSync(path.join(root, 'tools/content-source/torso-1262.js'), 'utf8').trim() + '\n';
must(torso.includes('/* GLX-TORSO1262'), 'torso banner missing');
must(torso.includes("version: '1.2.85'") && torso.includes('V1SIDES: 1') && torso.includes('function buildV1SideGeo('), 'torso 1.2.85 v1 sides missing');
must(!torso.includes('SHOULDER'), 'shoulder WIP must not ship in 1.2.85 sides');
{
  const START = '/* GLX-TORSO1262';
  const i = html.indexOf(START);
  must(i >= 0, 'TORSO1262 missing from index');
  const re = /\n\}\)\(\);\n/g; re.lastIndex = i;
  const m = re.exec(html);
  must(m, 'TORSO1262 tail not found');
  html = html.slice(0, i) + torso + html.slice(m.index + m[0].length);
  while (html.startsWith('})();\n', i + torso.length)) {
    html = html.slice(0, i + torso.length) + html.slice(i + torso.length + '})();\n'.length);
  }
  must(html.includes(torso.trim()), 'torso source not in page after inject');
  must((html.split('(function torso1262()').length - 1) === 1, 'duplicate torso1262');
}


/* Inject or replace the first-person hand finish (t1210). */
{
  const src = fs.readFileSync(path.join(root, 'tools/content-source/hands-fp-1285.js'), 'utf8').trim() + '\n';
  must(src.includes('/* GLX-HANDSFP1285'), 'hands-fp-1285 banner missing');
  must(src.includes('function handsFp1285') && src.includes('aCrease1282') && src.includes('aNail1282') && src.includes('aKnk1282'), 'fp hand bake/shader missing');
  must(!src.includes('worldModel') && !src.includes('charModel'), 'fp hands must not patch TP world/char models');
  const START = '/* GLX-HANDSFP1285';
  const i = html.indexOf(START);
  if (i >= 0) {
    const re = /\n\}\)\(typeof window !== 'undefined' \? window : this\);\n/g;
    re.lastIndex = i;
    const m = re.exec(html);
    must(m, 'HANDSFP1285 tail not found');
    html = html.slice(0, i) + src + html.slice(m.index + m[0].length);
  } else {
    const tp = html.indexOf('/* GLX-HANDSTP1282');
    must(tp >= 0, 'HANDSTP1282 missing, cannot insert FP hands');
    const re = /\n\}\)\(\);\n/g; re.lastIndex = tp;
    const m = re.exec(html);
    must(m, 'HANDSTP1282 tail not found');
    html = html.slice(0, m.index + m[0].length) + src + html.slice(m.index + m[0].length);
  }
  must(html.includes(src.trim()), 'hands-fp-1285 not in page after inject');
  must((html.split('(function handsFp1285').length - 1) === 1, 'duplicate handsFp1285');
}

must(html.includes('/* GLX-SCULPT1280'), 'SCULPT1280 is in the build');
must(html.includes('/* GLX-SCULPT1281'), 'SCULPT1281 is in the build');
must(html.includes('/* GLX-SCULPT1282'), 'SCULPT1282 is in the build');
must(html.includes('GLX-PERF1282') && html.includes('_fresh1282 = 1;'), 'cullVm perf fix is in the build');
must(html.includes('hideArtefactsOnce'), 'sculpt1281 once-per-frame scan');
must(html.includes('__torso1282') && html.includes('KILT_FP: 1') && html.includes('V1SIDES: 1'), 'torso FP-only hide and v1 sides');
must((html.split('(function sculpt1280()').length - 1) === 1, 'one sculpt1280');
must((html.split('(function sculpt1281()').length - 1) === 1, 'one sculpt1281');
must(html.includes("version: '1.2.59-frame-torch'"), 'torch jitter frame marker stays');
must(html.includes('/* GLX-FIX1279 (v1.2.79):'), 'FIX1279 stays');
must(html.includes('<!-- glencraft-build: b1284-v1.2.84 -->'), '1.2.84 marker stays');
must(html.includes('<!-- glencraft-build: b1283-v1.2.83 -->'), '1.2.83 marker stays');
must(html.includes("+ '|t1264clip'") && !html.includes("prev.customProgramCacheKey() : '') + 't1264clip'"), 'tartan cache-key fix');
must(html.includes('/* GLX-HANDSTP1282'), 'TP hands');
must(html.includes('/* GLX-HANDSFP1285') && html.includes('__handsFp1285'), 'FP hands 1.2.85');
must(html.includes('/* GLX-HANDS1266') && html.includes('/* GLX-HANDS1271') && html.includes('const U = window.__fpa'), 'fpa sculpt chain stays');
must(html.includes('function hideSashBack(') && html.includes('SASH_BACK: 1'), 'sash-back hide stays');
must(html.includes('WIDEN: 0') && html.includes('FILL_GLOW: 0') && html.includes('BRIDGE: 0'), 'stitched bridges, glow and widen off');
must(html.includes('SHIRT_|_sewn_torso_with_open_throat'), 'v1 source mesh name embedded');
must(html.includes('<!-- glencraft-build: b1279-v1.2.79 -->'), '1.2.79 marker stays');
{
  const st = html.indexOf('{"v":"v1.2.85"');
  const en = html.indexOf('{"v":"v1.2.84"', st);
  must(st >= 0 && en > st, '1.2.85 note range');
  must(!/haggis|food|sausage|pie\b|bread|meat|stew/i.test(html.slice(st, en)), '1.2.85 notes have no food');
}
must(!/\}\n\{/.test(html.slice(html.indexOf('window.PATCH_NOTES = ['), html.indexOf('\n];', html.indexOf('window.PATCH_NOTES = [')))), 'PATCH_NOTES still missing commas');

fs.writeFileSync(path.join(root, 'index.html'), html);
fs.writeFileSync(path.join(root, 'version.json'), '{"v":"1.2.85"}\n');

let credits = fs.readFileSync(path.join(root, 'CREDITS.md'), 'utf8');
if (!credits.includes('## v1.2.85')) {
  must(credits.includes('## v1.2.84 Chest restored with volume'), 'CREDITS 1.2.84 heading missing');
  credits = replaceOnce(credits,
    '## v1.2.84 Chest restored with volume',
    '## v1.2.85 Original shirt sides\n\n- The 1.2.84 stitched side bridges and their side glow are replaced with the original 1.2.36 scottish-base-v1 shirt side and stomach geometry (SHIRT_|_sewn_torso_with_open_throat, plus the far-LOD visual_torso_outfit), skinned to the current torso bones and aligned to the current shirt so there are no gaps or z-fighting.\n- The 1.2.84 width/depth scale is off so the chest matches the original 1.2.36 shape. Sash-back hide and first-person-only torso hide are unchanged. Nothing on the player is deleted.\n\n## v1.2.84 Chest restored with volume',
    'CREDITS');
  fs.writeFileSync(path.join(root, 'CREDITS.md'), credits);
}

must(JSON.parse(fs.readFileSync(path.join(root, 'version.json'), 'utf8')).v === '1.2.85', 'version.json write');
console.log('build 1.2.85 ok, index bytes', html.length);

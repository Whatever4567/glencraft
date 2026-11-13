import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const html = fs.readFileSync(join(root, 'index.html'), 'utf8');
const ver = JSON.parse(fs.readFileSync(join(root, 'version.json'), 'utf8'));
const credits = fs.readFileSync(join(root, 'CREDITS.md'), 'utf8');
const src = fs.readFileSync(join(root, 'tools/content-source/hands-1271.js'), 'utf8');
let n = 0;
function ok(cond, msg) { n++; if (!cond) throw new Error('FAIL ' + n + ': ' + msg); }

ok(ver.v === '1.2.71', 'version.json is 1.2.71');
ok(html.includes("const GAME_VERSION = '1.2.71';"), 'GAME_VERSION is 1.2.71');
ok(html.includes('<!-- glencraft-build: b1271-v1.2.71 -->'), 'build marker');
ok(html.includes('"v":"v1.2.71"'), 'PATCH_NOTES entry');
ok(html.includes('narrower and thinner'), 'notes: narrower palm');
ok(html.includes('pink-beige'), 'notes: pink-beige skin');
ok(html.includes('palm-centre shade') || html.includes('palm-centre'), 'notes: palm-centre shade');
ok(html.includes('rim light'), 'notes: rim light');
ok(html.includes('2-segment tapered digit'), 'notes: 2-segment thumb');
ok(html.includes('not a sphere'), 'notes: thumb not a sphere');
ok(html.includes('rounder') && html.includes('ring segmentation'), 'notes: rounder fingers, less rings');
ok(html.includes('nails are slightly lighter') || html.includes('lighter at the tips'), 'notes: lighter nails');
ok(html.includes('white / cream shirt sleeve') || html.includes('cream shirt'), 'notes: cream cuff');
ok(html.includes('static view-model offset') || html.includes('static view-model'), 'notes: static VM offset');
ok(html.includes('Grips still wrap'), 'notes: grips wrap');
ok(html.includes('gold D-pad is left alone'), 'notes: D-pad left alone');
ok(credits.includes('## v1.2.71 A second sculpt pass'), 'CREDITS heading');
ok(credits.includes('pink-beige'), 'CREDITS skin');
ok(credits.includes('2-segment tapered digit'), 'CREDITS thumb');
ok(credits.includes('__fpa'), 'CREDITS still names __fpa');

ok(src.includes('function hands1271(WIN)'), 'IIFE is named hands1271(WIN)');
ok(src.includes("version: '1.2.71-palm'"), 'version string');
ok(src.includes('SKIN_RAMP'), 'has a skin ramp');
ok(src.includes('pink-beige') || src.includes('0.89, 0.76, 0.72'), 'pink-beige mid');
ok(src.includes('PALM_CENTRE') || src.includes('palm-centre') || src.includes('well'), 'palm-centre shade');
ok(src.includes('RIM') || src.includes('rim light') || src.includes('Rim light'), 'rim light');
ok(src.includes('2-segment') || src.includes('2-segment tapered'), '2-segment thumb in source');
ok(src.includes('hidden1271') || src.includes('pad1249'), 'hides the sphere pads');
ok(src.includes('RAD = 14') || src.includes('oval = 0.90'), 'rounder finger cross-section');
ok(src.includes('cuffGeo') && (src.includes('0.051') || src.includes('flare')), 'flared cuff');
ok(src.includes('LINEN_RAMP') && src.includes('0.995'), 'cream linen');
ok(src.includes('nudgeFrame') && src.includes('FRAME.pistol'), 'static FRAME nudge for pistol');
ok(src.includes('FRAME.torch') || src.includes('torch'), 'static FRAME nudge for torch');
ok(src.includes('pistolAds') === false || !src.includes('pistolAds'), 'does not rewrite pistol ADS offsets');
ok(!/\['dU'/.test(src) && !/#dU/.test(src), 'does not touch the gold D-pad');
ok(!/enableKinds|NEW_FP_KINDS\s*=/.test(src), 'does not re-enable NEW_FP_KINDS');
ok(!/\bswingT\s*=/.test(src) && !/\bmineT\s*=/.test(src) && !/\bplaceT\s*=/.test(src), 'does not write animation timers');
ok(!src.includes('applyRestCurl') || src.includes('1266'), 'does not replace the 1.2.66 rest-curl / animation path');
ok(src.includes('fingerAtlas') && src.includes('userData.f'), 'sculpts existing finger meshes, same rig');
ok(src.includes('palmAtlas'), 'replaces the existing palm mesh');
ok(src.includes('p.cuff'), 'sculpts the existing cuff object');
ok(!src.includes('function hands1271(W)') || src.includes('function hands1271(WIN)'), 'IIFE uses WIN');

ok(html.includes(src.trim()), 'hands-1271.js source is injected into the page');

const i1271 = html.indexOf('/* GLX-HANDS1271');
ok(i1271 > 0, 'GLX-HANDS1271 present');
const i1271End = (() => {
  const next = html.indexOf('\n/* GLX-', i1271 + 10);
  const scr = html.indexOf('</script>', i1271);
  let end = i1271 + 80000;
  if (next > i1271 && next < end) end = next;
  if (scr > i1271 && scr < end) end = scr;
  return end;
})();
const h1271 = html.slice(i1271, i1271End);
ok(h1271.includes('function hands1271(WIN)'), 'injected IIFE uses WIN');
ok(!/\['dU'/.test(h1271) && !/#dU/.test(h1271), 'injected IIFE does not touch the gold D-pad');

ok(html.includes('/* GLX-HANDS1270'), '1.2.70 flesh stays');
ok(html.includes('/* GLX-HANDS1266'), '1.2.66 finger sculpt stays');
ok(html.includes('/* GLX-HANDS1265'), '1.2.65 shading stays');
ok(html.includes('/* GLX-HANDS1263'), '1.2.63 arms restore stays');
ok(html.includes("restoredFrom: '1e9db15'"), '1263 restore stays');
ok(html.includes('/* GLX-EG1269'), '1.2.69 Egypt stays');
ok(html.includes('/* GLX-CASTLE1268'), '1.2.68 garrisons stay');
ok(!html.includes("['dU', 'dL', 'dR'].forEach"), 'gold D-pad still untouched globally');

console.log('all ok (' + n + ')');

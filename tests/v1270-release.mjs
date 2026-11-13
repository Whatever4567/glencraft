import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const html = fs.readFileSync(join(root, 'index.html'), 'utf8');
const ver = JSON.parse(fs.readFileSync(join(root, 'version.json'), 'utf8'));
const credits = fs.readFileSync(join(root, 'CREDITS.md'), 'utf8');
const src = fs.readFileSync(join(root, 'tools/content-source/hands-1270.js'), 'utf8');
let n = 0;
function ok(cond, msg) { n++; if (!cond) throw new Error('FAIL ' + n + ': ' + msg); }

ok(ver.v === '1.2.71' || ver.v === '1.2.70', 'version.json is 1.2.70');
ok(html.includes("const GAME_VERSION = '1.2.71';") || html.includes("const GAME_VERSION = '1.2.70';"), 'GAME_VERSION is 1.2.70');
ok(html.includes('<!-- glencraft-build: b1271-v1.2.71 -->') || html.includes('<!-- glencraft-build: b1270-v1.2.70 -->'), 'build marker');
ok(html.includes('"v":"v1.2.70"'), 'PATCH_NOTES entry');
ok(html.includes('lighter, warmer natural flesh'), 'notes: lighter warmer flesh');
ok(html.includes('fleshy rather than claw-like'), 'notes: fleshy fingers');
ok(html.includes('rounder padded tips'), 'notes: rounder tips');
ok(html.includes('knuckle shade'), 'notes: knuckle shade');
ok(html.includes('sparse specular'), 'notes: specular');
ok(html.includes('forearm and cuff are slimmer'), 'notes: slimmer forearm');
ok(html.includes('Grips still wrap'), 'notes: grips wrap');
ok(html.includes('gold D-pad is left alone'), 'notes: D-pad left alone');
ok(credits.includes('## v1.2.70 A solid sculpt pass'), 'CREDITS heading');
ok(credits.includes('lighter, warmer natural flesh'), 'CREDITS skin');
ok(credits.includes('__fpa'), 'CREDITS still names __fpa');

ok(src.includes('function hands1270(WIN)'), 'IIFE is named hands1270(WIN)');
ok(src.includes("version: '1.2.70-flesh'"), 'version string');
ok(src.includes('SKIN_RAMP'), 'has a skin ramp');
ok(src.includes('rounder') || src.includes('Hemispherical') || src.includes('padded tip'), 'round padded tips in source');
ok(src.includes('KN_SHADE') || src.includes('knuckle'), 'knuckle shade');
ok(src.includes('SPEC') && src.includes('0.987'), 'sparse specular');
ok(src.includes('sleeveGeo') && src.includes('0.044'), 'slimmer forearm radii');
ok(src.includes('cuffGeo') || src.includes('slimSleeve'), 'slimmer cuff');
ok(src.includes('bevel') || src.includes('Bevel'), 'bevel');
ok(!/\['dU'/.test(src) && !/#dU/.test(src), 'does not touch the gold D-pad');
ok(!/enableKinds|NEW_FP_KINDS\s*=/.test(src), 'does not re-enable NEW_FP_KINDS');
ok(!/\bswingT\s*=/.test(src) && !/\bmineT\s*=/.test(src) && !/\bplaceT\s*=/.test(src), 'does not write animation timers');
ok(!src.includes('applyRestCurl') || src.includes('1266'), 'does not replace the 1.2.66 rest-curl / animation path');
ok(src.includes('fingerAtlas') && src.includes('userData.f'), 'sculpts existing finger meshes, same rig');
ok(src.includes('p.fo') && src.includes('p.cuff'), 'slims existing forearm and cuff objects');

ok(html.includes(src.trim()), 'hands-1270.js source is injected into the page');

const i1270 = html.indexOf('/* GLX-HANDS1270');
ok(i1270 > 0, 'GLX-HANDS1270 present');
const i1270End = (() => {
  const next = html.indexOf('\n/* GLX-', i1270 + 10);
  const scr = html.indexOf('</script>', i1270);
  let end = i1270 + 80000;
  if (next > i1270 && next < end) end = next;
  if (scr > i1270 && scr < end) end = scr;
  return end;
})();
const h1270 = html.slice(i1270, i1270End);
ok(h1270.includes('function hands1270(WIN)'), 'injected IIFE uses WIN');
ok(!/\['dU'/.test(h1270) && !/#dU/.test(h1270), 'injected IIFE does not touch the gold D-pad');

ok(html.includes('/* GLX-HANDS1266'), '1.2.66 finger sculpt stays');
ok(html.includes('/* GLX-HANDS1265'), '1.2.65 shading stays');
ok(html.includes('/* GLX-HANDS1263'), '1.2.63 arms restore stays');
ok(html.includes("restoredFrom: '1e9db15'"), '1263 restore stays');
ok(html.includes('/* GLX-EG1269'), '1.2.69 Egypt stays');
ok(html.includes('/* GLX-CASTLE1268'), '1.2.68 garrisons stay');
ok(!html.includes("['dU', 'dL', 'dR'].forEach"), 'gold D-pad still untouched globally');

/* Mid of the new ramp should be clearly lighter than the old wood mid (~0.74, 0.56, 0.42). */
ok(src.includes('[0.87, 0.69, 0.56]') || src.includes('[0.90, 0.74, 0.61]'), 'skin mid is a light warm flesh');

console.log('all ok (' + n + ')');

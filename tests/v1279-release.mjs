import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const credits = fs.readFileSync(path.join(root, 'CREDITS.md'), 'utf8');
const ver = JSON.parse(fs.readFileSync(path.join(root, 'version.json'), 'utf8'));
const src = fs.readFileSync(path.join(root, 'tools/content-source/fix-1279.js'), 'utf8');
let n = 0;
function ok(cond, msg) { n++; if (!cond) { console.error('FAIL:', msg); process.exit(1); } }

ok(ver.v === '1.2.79', 'version.json is 1.2.79');
ok(html.includes("const GAME_VERSION = '1.2.79';"), 'GAME_VERSION is 1.2.79');
ok(html.includes('<!-- glencraft-build: b1279-v1.2.79 -->'), 'build marker');
ok(html.includes('<!-- glencraft-build: b1278-v1.2.78 -->'), '1.2.78 marker stays');
ok(html.includes('"v":"v1.2.79"'), 'PATCH_NOTES has 1.2.79');
ok(html.includes('Map is held in the hand: thumb on the sheet, tilted up so you can read it.'), 'note: map');
ok(html.includes('First person: your hands now have forearms and sleeves.'), 'note: forearms');
ok(html.includes('Third person: held items are in the right hand.'), 'note: right hand');
ok(credits.includes('## v1.2.79'), 'CREDITS 1.2.79');
{
  const st = html.indexOf('window.PATCH_NOTES = [');
  const en = html.indexOf('\n];', st);
  const arr = (new Function('return ' + html.slice(st + 'window.PATCH_NOTES = '.length, en + 2)))();
  ok(Array.isArray(arr) && arr[0].v === 'v1.2.79' && arr[1].v === 'v1.2.78', 'PATCH_NOTES parses, 1.2.79 first');
}
/* every inline script still parses */
{
  const re = /<script>([\s\S]*?)<\/script>/g; let m;
  while ((m = re.exec(html))) { let good = true; try { new Function(m[1]); } catch (_) { good = false; } ok(good, 'inline script parses'); }
}

ok(html.includes('/* GLX-FIX1279 (v1.2.79):'), 'FIX1279 injected');
ok((html.split('(function fix1279()').length - 1) === 1, 'one fix1279');
ok(html.lastIndexOf('/* GLX-FIX1279 (v1.2.79):') > html.lastIndexOf('/* GLX-FIX1278 (v1.2.78):'), '1279 runs after 1278');
for (const b of ['GLX-FIX1278 (v1.2.78)', 'GLX-FIX1277 (v1.2.77)', 'GLX-FIX1276 (v1.2.76)', 'GLX-FIX1275 (v1.2.75)', 'GLX-FIX1273', 'GLX-FIX1272', 'GLX-HANDS1271', 'GLX-HANDS1270', 'GLX-HANDS1266', 'GLX-HANDS1263'])
  ok(html.includes('/* ' + b), b + ' stays');
ok(!html.includes('/* GLX-FIX1274 (v1.2.74):'), 'FIX1274 stays removed');

/* 1.2.78 lag / ore / cave changes intact */
ok(html.includes('const SPAWN_RADIUS = 100'), 'SPAWN_RADIUS');
ok(html.includes('const DESPAWN_RADIUS = 150'), 'DESPAWN_RADIUS');
ok(html.includes('const ORE_DEPTH_MAX = -236'), 'ORE_DEPTH_MAX');
ok(html.includes('const DIAMOND_PEAK_Y = -200'), 'DIAMOND_PEAK_Y');

/* guns / tools / render distance untouched */
ok(html.includes("    pistol: {p: [0, -0.07, 0.05], axis: [0, -0.95, 0.30], palm: [0, 0.050, 0.018], align: 0}"), 'pistol GRIP');
ok(html.includes('    p761:   {p: [0, 0.02, 0], axis: [0, 1, 0], palm: [0, 0.058, 0.018], align: 0, errMax: 1.20},\n    pick:'), 'p761 GRIP');
ok(html.includes('applyPotionPath'), 'potion grip path');
ok(html.includes('const VF = () => clamp(SET.rdist, 3, 16) * 16;'), 'VF');
ok(html.includes('id="rdRange" data-testid="settings-rdist" min="3" max="16"'), 'slider');
ok(!html.includes("['dU', 'dL', 'dR'].forEach"), 'gold D-pad untouched');

/* source rules */
ok(!src.includes('H.apply = function') && !src.includes('H.repose = function'), 'no held-frame wraps');
ok(!src.includes('renderer.render ='), 'no renderer.render wrap');
ok(!src.includes('SET.rdist') && !src.includes('buildChunk'), 'no render-distance / meshing');
ok(!/alert\(|confirm\(/.test(src), 'no popups');
ok(!/isWeapon|GUN\[/.test(src), 'no gun code');

/* map in hand */
ok(src.includes('R.updateMatrixWorld = function'), 'map seated at view-model render time');
ok(src.includes('if (plane.parent !== R) R.add(plane);'), 'sheet in the hand pass');
ok(src.includes('__fix1276.on = 0'), '1276 palm seat turned off so it cannot fight');
ok(src.includes('new THREE.CanvasTexture(C.TX)') && src.includes('tex.needsUpdate = true'), 'live chart texture');
ok(src.includes("o.material = o.position.z > 0.0001 ? m.red : m.white"), 'player arrow kept');
ok(src.includes('isTp()') && src.includes('release(R, plane)'), 'released when not held / third person');
ok(src.includes('m.sheet.depthTest = true'), 'sheet depth-sorted against the hand');

/* forearms */
ok(src.includes("fa.name = 'Forearm1279'"), 'forearm mesh');
ok(src.includes('h.add(fa)'), 'forearm parented to the existing hand');
ok(src.includes('cuff ? cuff.material'), 'forearm uses the sleeve material');
ok(!/h\.remove\(|\.geometry = /.test(src), 'hand meshes not replaced');

/* third person right hand */
ok((html.split('GLX-TPR1279').length - 1) >= 7, 'TP right-hand edits present');
ok(html.includes("const side=slot?'R':'L'/* GLX-TPR1279 */,upper=r.bone('upper_arm.'+side)"), 'IK side swapped');
ok(html.includes("socket=find(p.near.root,'weapon_grip_slot'+(1-slot));"), 'grip follows the right socket');
ok(html.includes("const sk = p ? (slot === 1 ? 0 : 1) : slot;"), 'poseHeld uses the right-hand socket');
ok(html.includes("R = u.pilot ? V().set(rx, 0, rz) : V().set(-rx, 0, -rz);"), 'TP gun side is the right');
ok(html.includes("leg=u.legs[slot],knee=leg.userData.kn;") && html.includes("rotate('thigh.'+side,legPose)"), 'legs unchanged');

console.log('v1279 release checks passed:', n);

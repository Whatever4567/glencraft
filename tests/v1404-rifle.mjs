import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const src = fs.readFileSync(path.join(root, 'tools/content-source/rifle-1404.js'), 'utf8');
let n = 0, fail = 0;
function ok(cond, msg) { n++; if (!cond) { fail++; console.error('FAIL', msg); } else console.log('ok', msg); }

ok(src.includes('/* GLX-RIFLE1404') && src.includes('(function rifle1404'), 'source banner');
ok(html.includes(src.trim()), 'source inlined in index');
ok((html.split('(function rifle1404').length - 1) === 1, 'exactly one IIFE');
ok(html.includes('id="glx-rifle1404"'), 'script id');
ok(html.indexOf('id="glx-rifle1404"') > html.indexOf('id="glx-rifle1392"'), '1404 is after the 1.2.140 hide IIFE');
ok(html.includes('id="glx-tex1403"') && html.indexOf('id="glx-rifle1404"') > html.indexOf('id="glx-tex1403"'), 'rifle IIFE is after the 1.2.142 texture IIFE');
ok(html.indexOf('id="glx-rifle1404"') < html.lastIndexOf('</body>'), 'script is before body close');
ok(JSON.parse(fs.readFileSync(path.join(root, 'version.json'), 'utf8')).v === '1.2.143' && html.includes("const GAME_VERSION = '1.2.143';") || html.includes("const GAME_VERSION = '1.2.144';") || html.includes("const GAME_VERSION = '1.2.145';"), 'version is 1.2.143');
ok(src.includes('window.__noRifle1404') && src.includes('const off = () => !!W.__noRifle1404'), 'flag restores the previous look');
ok(src.includes('isGlbMusketMesh') && src.includes('layerMask') && src.includes('gun_rifle_'), 'shows the 1.2.1 GLB maps');
ok(src.includes('isFlintMusketMesh') && src.includes('hidFlint'), 'hides the flintlock musket instead of deleting it');
ok(src.includes('hardenMeshMats') && src.includes('isMeshStandardMaterial'), 'keeps or restores Standard PBR materials');
ok(src.includes('__noRifle1392') || src.includes('1.2.140 scope'), 'keeps the 1.2.140 scope-glass hide');
ok(html.includes('id="glx-rifle1392"') && html.includes('__noRifle1392'), '1.2.140 hide IIFE stays in the page');
ok(src.includes('__fpa') || src.includes('Does not change the __fpa rig'), 'keeps the existing arm rig');
ok(!src.includes('fireGun') && !src.includes('GUN['), 'does not touch the gun systems');
ok(!src.includes('.remove(') && !src.includes('dispose('), 'does not delete gun or arm geometry');

const notes = html.match(/window\.PATCH_NOTES = \[([\s\S]{0,2500})/);
const head = notes ? notes[1].slice(0, 2000).toLowerCase() : '';
ok(head.includes('1.2.143') && head.includes('__norifle1404'), 'patch notes mention 1.2.143 and the flag');
ok(head.includes('1.2.1') && (head.includes('texture') || head.includes('maps')), 'notes mention the 1.2.1 texture');
for (const w of ['pie','cake','bread','cook','food','eat','meal','snack','jam','honey','salt','sugar','tea','dinner','lunch','breakfast','fruit','berry','apple','sweet','tasty']) {
  ok(!new RegExp('\\b'+w+'\\b').test(head), 'no food word '+w+' in notes head');
}
console.log(fail ? 'FAILED '+fail+'/'+n : 'all '+n+' passed');
if (fail) process.exit(1);

import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const src = fs.readFileSync(path.join(root, 'tools/content-source/rifle-1392.js'), 'utf8');
let n = 0, fail = 0;
function ok(cond, msg) { n++; if (!cond) { fail++; console.error('FAIL', msg); } else console.log('ok', msg); }

ok(src.includes('/* GLX-RIFLE1392') && src.includes('(function rifle1392'), 'source banner');
ok(html.includes(src.trim()), 'source inlined in index');
ok((html.split('(function rifle1392').length - 1) === 1, 'exactly one IIFE');
ok(html.includes('id="glx-rifle1392"'), 'script id');
ok(html.indexOf('id="glx-rifle1392"') > html.indexOf('id="glx-arm1390"'), 'rifle IIFE is after the arm IIFE');
ok(html.includes('id="glx-tex1393"') && html.indexOf('id="glx-rifle1392"') > html.indexOf('id="glx-tex1393"'), 'rifle IIFE is after the 1.2.139 texture IIFE');
ok(html.indexOf('id="glx-rifle1392"') < html.lastIndexOf('</body>'), 'script is before body close');
ok(['1.2.140','1.2.141', '1.2.142','1.2.143', '1.2.144', '1.2.145', '1.2.146', '1.2.147', '1.2.148'].includes(JSON.parse(fs.readFileSync(path.join(root, 'version.json'), 'utf8')).v) && (html.includes("const GAME_VERSION = '1.2.140';") || html.includes("const GAME_VERSION = '1.2.141';") || html.includes("const GAME_VERSION = '1.2.142';") || html.includes("const GAME_VERSION = '1.2.143';") || html.includes("const GAME_VERSION = '1.2.144';") || html.includes("const GAME_VERSION = '1.2.145';") || html.includes("const GAME_VERSION = '1.2.146';") || html.includes("const GAME_VERSION = '1.2.147';") || html.includes("const GAME_VERSION = '1.2.148';")), 'version is 1.2.140+');
ok(src.includes('window.__noRifle1392') && src.includes('const off = () => !!W.__noRifle1392'), 'flag restores the previous look');
ok(src.includes('accesories_glass') && src.includes('lockHide') && src.includes('isScopeScreen'), 'hides leftover scope glass');
ok(src.includes('hideFpBodyGun') && src.includes('P.pitch < -0.5'), 'hides the extra look-down musket');
ok(src.includes('renderer.render') && src.includes('renderHook'), 'hides the musket just before render');
ok(src.includes('__fpa') || src.includes('Does not change the __fpa rig'), 'keeps the existing arm rig');
ok(!src.includes('new THREE.GLTFLoader') && !/\.glb/.test(src), 'does not swap in a new gun model');
ok(!src.includes('fireGun') && !src.includes('GUN['), 'does not touch the gun systems');
ok(html.includes('id="glx-fp1347"') || html.includes('__fp1347') || html.includes('fp1347'), 'keeps the flintlock texture patch');
ok(html.includes('id="glx-tex1393"') && html.includes('__noTex1393'), 'keeps the 1.2.139 grass texture patch');

const notes = html.match(/window\.PATCH_NOTES = \[([\s\S]{0,2500})/);
const head = notes ? notes[1].slice(0, 2000).toLowerCase() : '';
ok(head.includes('1.2.140') && head.includes('__norifle1392'), 'patch notes mention 1.2.140 and the flag');
for (const w of ['pie','cake','bread','cook','food','eat','meal','snack','jam','honey','salt','sugar','tea','dinner','lunch','breakfast','fruit','berry','apple','sweet','tasty']) {
  ok(!new RegExp('\\b'+w+'\\b').test(head), 'no food word '+w+' in notes head');
}
console.log(fail ? 'FAILED '+fail+'/'+n : 'all '+n+' passed');
if (fail) process.exit(1);

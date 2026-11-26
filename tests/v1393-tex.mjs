import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const src = fs.readFileSync(path.join(root, 'tools/content-source/tex-1393.js'), 'utf8');
let n = 0, fail = 0;
function ok(cond, msg) { n++; if (!cond) { fail++; console.error('FAIL', msg); } else console.log('ok', msg); }

ok(src.includes('/* GLX-TEX1393') && src.includes('(function tex1393'), 'source banner');
ok(html.includes(src.trim()), 'source inlined in index');
ok((html.split('(function tex1393').length - 1) === 1, 'exactly one IIFE');
ok(html.includes('id="glx-tex1393"'), 'script id');
ok(html.includes('id="glx-arm1390"'), 'does not remove the 1.2.138 arm IIFE');
ok(html.indexOf('id="glx-arm1390"') < html.indexOf('id="glx-tex1393"'), 'tex1393 is after arm1390');
ok(src.includes('WIN.__noTex1393'), 'flag restores live textures');
ok(src.includes("grass_top: 'assets/tex/grass_top-1393.webp'") && src.includes("dirt: 'assets/tex/dirt-1393.webp'"), 'maps new assets');
ok(src.includes('OLD[') && src.includes('restore'), 'keeps a copy of the live maps to restore');
ok(html.includes('const TEX = {') && html.includes('"grass_top"') && html.includes('"grass_side"') && html.includes('"dirt"'), 'original TEX keys stay');
ok(!src.includes('delete TEX') && !src.includes('delete texCache'), 'does not delete the old textures');
ok(!src.includes('fireGun') && !src.includes('GUN['), 'does not touch the gun systems');
ok(!src.includes('__noArm1390') && !src.includes('arm1390'), 'does not touch the arm patches');

const g = path.join(root, 'assets/tex/grass_top-1393.webp');
const d = path.join(root, 'assets/tex/dirt-1393.webp');
ok(fs.existsSync(g) && fs.statSync(g).size > 20000, 'grass_top-1393.webp present');
ok(fs.existsSync(d) && fs.statSync(d).size > 20000, 'dirt-1393.webp present');
ok(fs.existsSync(path.join(root, 'assets/tex/sheep2_2k.webp')), 'existing animal textures stay');

const py = spawnSync('python3', [path.join(root, 'tests/_v1393_inspect.py'), root], {encoding: 'utf8'});
ok(py.status === 0, 'pillow inspect ok: ' + String(py.stderr || py.stdout || '').slice(0, 200));
let info = {};
try { info = JSON.parse(py.stdout); } catch (e) { ok(false, 'inspect json ' + e + ' out=' + String(py.stdout).slice(0, 200)); }
const gt = info['grass_top-1393.webp'] || {};
const dt = info['dirt-1393.webp'] || {};
ok(gt.w === 1024 && gt.h === 1024, 'grass_top is 1024 (same size as live)');
ok(dt.w === 1024 && dt.h === 1024, 'dirt is 1024 (same size as live)');
ok(gt.stdev && gt.stdev[1] >= 12, 'new grass_top has richer green variation than the live slop (~10)');
ok(dt.stdev && dt.stdev[0] >= 12, 'new dirt has richer variation than the live dirt (~10)');
ok(gt.mean && gt.mean[1] > gt.mean[0] && gt.mean[1] > gt.mean[2], 'grass_top stays green, not black');
ok(dt.mean && dt.mean[0] > 20 && dt.mean[1] < 80, 'dirt stays brown soil, not black or green turf');
ok(info.seams_grass && info.seams_grass[0] < 40 && info.seams_grass[1] < 40, 'grass_top seams are tight: ' + JSON.stringify(info.seams_grass));
ok(info.seams_dirt && info.seams_dirt[0] < 40 && info.seams_dirt[1] < 40, 'dirt seams are tight: ' + JSON.stringify(info.seams_dirt));

const ver = JSON.parse(fs.readFileSync(path.join(root, 'version.json'), 'utf8')).v;
ok(/^\d+\.\d+\.\d+$/.test(ver), 'version.json is a version');
const notes = html.match(/window\.PATCH_NOTES = \[([\s\S]{0,2000})/);
const head = notes ? notes[1].slice(0, 1800).toLowerCase() : '';
if (head.includes('tex1393') || head.includes('__notex1393') || (ver !== '1.2.138' && html.includes('GLX-TEX1393'))) {
  ok(head.includes('__notex1393'), 'patch notes mention the flag');
  ok(html.includes("const GAME_VERSION = '" + ver + "';"), 'GAME_VERSION matches version.json');
} else {
  ok(true, 'notes not bumped yet (still ' + ver + ')');
}
for (const w of ['pie','cake','bread','cook','food','eat','meal','snack','jam','honey','salt','sugar','tea','dinner','lunch','breakfast','fruit','berry','apple','sweet','tasty']) {
  ok(!new RegExp('\\b' + w + '\\b').test(head), 'no food word ' + w + ' in notes head');
}

console.log(fail ? 'FAILED ' + fail + '/' + n : 'all ' + n + ' passed');
if (fail) process.exit(1);

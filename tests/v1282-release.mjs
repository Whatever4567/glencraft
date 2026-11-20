import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const credits = fs.readFileSync(path.join(root, 'CREDITS.md'), 'utf8');
const ver = JSON.parse(fs.readFileSync(path.join(root, 'version.json'), 'utf8'));
const torso = fs.readFileSync(path.join(root, 'tools/content-source/torso-1262.js'), 'utf8');
const frame = fs.readFileSync(path.join(root, 'tools/pilot-model-source/held-frame-1251.js'), 'utf8');
let n = 0;
function ok(cond, msg) { n++; if (!cond) { console.error('FAIL:', msg); process.exit(1); } }

const OKV = ['1.2.82', '1.2.83', '1.2.84', '1.2.85', '1.2.86', '1.2.87', '1.2.88', '1.2.89', '1.2.90', '1.2.91', '1.2.92', '1.2.93', '1.2.94', '1.2.95', '1.2.96', '1.2.97', '1.2.98', '1.2.99', '1.2.100', '1.2.101', '1.2.102', '1.2.103', '1.2.104', '1.2.105', '1.2.106', '1.2.107', '1.2.108', '1.2.109', '1.2.110', '1.2.111', '1.2.112', '1.2.113', '1.2.114'];
ok(OKV.includes(ver.v), 'version.json is 1.2.82+');
ok(OKV.some(v => html.includes("const GAME_VERSION = '" + v + "';")), 'GAME_VERSION is 1.2.82+');
ok(html.includes('<!-- glencraft-build: b1282-v1.2.82 -->'), 'build marker');
ok(html.includes('<!-- glencraft-build: b1281-v1.2.81 -->'), '1.2.81 marker stays');
const st = html.indexOf('{"v":"v1.2.82"'), en = html.indexOf('{"v":"v1.2.81"', st);
ok(st > 0 && en > st, 'PATCH_NOTES has 1.2.82 before 1.2.81');
ok(!/haggis|food|sausage roll|pie\b|bread|meat|stew/i.test(html.slice(st, en)), '1.2.82 notes have no food');
ok(credits.includes('## v1.2.82 Smooth first person, chest restored'), 'CREDITS 1.2.82');
{
  const s0 = html.indexOf('window.PATCH_NOTES = [');
  const e0 = html.indexOf('\n];', s0);
  const arr = (new Function('return ' + html.slice(s0 + 'window.PATCH_NOTES = '.length, e0 + 2)))();
  { const k = Array.isArray(arr) ? arr.findIndex(e => e.v === 'v1.2.82') : -1; ok(k >= 0 && k <= 32 && arr[k + 1].v === 'v1.2.81', 'PATCH_NOTES parses, 1.2.82 before 1.2.81'); }
}
{
  const re = /<script>([\s\S]*?)<\/script>/g; let m;
  while ((m = re.exec(html))) { let good = true; try { new Function(m[1]); } catch (_) { good = false; } ok(good, 'inline script parses'); }
}
// perf: cullVm updates matrices once, not per mesh
for (const [name, src] of [['index', html], ['held-frame source', frame]]) {
  ok(src.includes('let _fresh1282 = 0;') && src.includes('_fresh1282 = 1;') && src.includes('_fresh1282 = 0;\n    U.lastDump'), name + ': cullVm marks matrices fresh for the traverse');
  ok((src.match(/if \(!_fresh1282\) \{ cam\.updateMatrixWorld\(true\); mesh\.updateWorldMatrix\(true, false\); \}/g) || []).length === 2, name + ': screenCover + viewBox skip per-mesh camera updates inside cullVm');
}
ok(html.includes('function hideArtefactsOnce(on)') && html.includes('hideArtefactsOnce(!!PICK_KIND[kind])'), 'sculpt1281 full scan once per frame');
ok(html.includes('if (F._lock1282) return;'), 'sculpt1282 defines locked getters once');
ok(html.includes("version: '1.2.59-frame-torch'"), 'torch freeze stays');
// chest
ok((torso.includes('SIDES: 0') || (torso.includes('SIDES: 1') && torso.includes('BRIDGE: 1') && torso.includes('function buildBridgeGeo(')) || (torso.includes('SIDES: 1') && torso.includes('V1SIDES: 1') && torso.includes('function buildV1SideGeo('))) && torso.includes('if (!U.SIDES) { attachFpCull(mesh); return false; }'), 'no old procedural fill: off, the 1.2.84 edge bridge, or the 1.2.85 v1 sides');
ok(torso.includes('renderer.render.__torso1282') && torso.includes('cam === camera') && torso.includes('ownModel(m)'), 'torso hidden only for the local FP camera on your own model');
ok(!/mesh\.onBeforeRender = function/.test(torso), 'no onBeforeRender visibility trick (too late in r128)');
ok(html.includes(torso.trim()), 'torso source matches the page');
ok(!/geometry\.dispose|\.remove\(mesh\)|setDrawRange/.test(torso), 'torso code deletes no player geometry');
console.log('PASS', n, 'v1282-release checks');

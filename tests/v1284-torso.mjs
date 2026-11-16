// 1.2.84 (t1203) markers must stay present after later torso work.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
let n = 0;
function ok(c, m) { n++; if (!c) { console.error('FAIL:', m); process.exit(1); } }
ok(html.includes('function buildBridgeGeo(') && html.includes('function widenMesh(') && html.includes('function hideSashBack('), '1.2.84 helpers remain');
ok(/SX: 1\.38, SZF: 1\.34, SZB: 1\.18/.test(html), 'volume factors remain available');
ok(html.includes("/^(spine|pelvis)/.test(b.name || '')"), 'widen weighted by spine/pelvis skin weights only');
ok(html.includes('visual_torso_outfit00\\d'), 'widen / sash hide limited to the near-LOD shirt');
ok(html.includes('if (vBack1284 > 0.5) discard;'), 'sash back hidden by discard, not deleted');
ok(!/geometry\.dispose|\.remove\(mesh\)|setDrawRange|setIndex\(new[^)]*keep/.test(html.slice(html.indexOf('/* GLX-TORSO1262'), html.indexOf('})();\n', html.indexOf('/* GLX-TORSO1262')))), 'no player geometry deleted');
ok(html.includes('attachFpCull(side)') && html.includes('renderer.render.__torso1282'), 'fill hidden only in your own FP view');
ok(html.includes('Object.assign(U, window.__torso1262cfg || {})'), 'QA config hook');
const ver = JSON.parse(fs.readFileSync(path.join(root, 'version.json'), 'utf8'));
const credits = fs.readFileSync(path.join(root, 'CREDITS.md'), 'utf8');
ok(['1.2.84', '1.2.85', '1.2.86', '1.2.87', '1.2.88'].includes(ver.v) && (html.includes("const GAME_VERSION = '1.2.84';") || html.includes("const GAME_VERSION = '1.2.85';") || html.includes("const GAME_VERSION = '1.2.86';") || html.includes("const GAME_VERSION = '1.2.87';") || html.includes("const GAME_VERSION = '1.2.88';")), 'version 1.2.84+');
ok(html.includes('<!-- glencraft-build: b1284-v1.2.84 -->') && html.includes('<!-- glencraft-build: b1283-v1.2.83 -->'), 'build markers');
{ const st = html.indexOf('{"v":"v1.2.84"'), en = html.indexOf('{"v":"v1.2.83"', st);
  ok(st > 0 && en > st && !/haggis|food|sausage|pie\b|bread|meat|stew/i.test(html.slice(st, en)), '1.2.84 notes remain, no food');
  const s0 = html.indexOf('window.PATCH_NOTES = ['), e0 = html.indexOf('\n];', s0);
  const arr = (new Function('return ' + html.slice(s0 + 'window.PATCH_NOTES = '.length, e0 + 2)))();
  const k = arr.findIndex(e => e.v === 'v1.2.84');
  ok(k >= 0 && arr[k + 1].v === 'v1.2.83', 'PATCH_NOTES still has 1.2.84 before 1.2.83'); }
ok(credits.includes('## v1.2.84 Chest restored with volume'), 'CREDITS 1.2.84');
console.log('PASS', n, 'v1284-torso checks');

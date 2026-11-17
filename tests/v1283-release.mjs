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

const OKV = ['1.2.83', '1.2.84', '1.2.85', '1.2.86', '1.2.87', '1.2.88', '1.2.89', '1.2.90', '1.2.91', '1.2.92', '1.2.93', '1.2.94', '1.2.95', '1.2.96', '1.2.97', '1.2.98', '1.2.99', '1.2.100', '1.2.101', '1.2.102', '1.2.103', '1.2.104', '1.2.105'];
ok(OKV.includes(ver.v), 'version.json is 1.2.83+');
ok(OKV.some(v => html.includes("const GAME_VERSION = '" + v + "';")), 'GAME_VERSION is 1.2.83+');
ok(html.includes('<!-- glencraft-build: b1283-v1.2.83 -->'), 'build marker');
ok(html.includes('<!-- glencraft-build: b1282-v1.2.82 -->'), '1.2.82 marker stays');
const st = html.indexOf('{"v":"v1.2.83"'), en = html.indexOf('{"v":"v1.2.82"', st);
ok(st > 0 && en > st, 'PATCH_NOTES has 1.2.83 before 1.2.82');
ok(!/haggis|food|sausage|pie\b|bread|meat|stew/i.test(html.slice(st, en)), '1.2.83 notes have no food');
ok(credits.includes('## v1.2.83 Tartan colour, clear first-person view, finished hands'), 'CREDITS 1.2.83');
{
  const s0 = html.indexOf('window.PATCH_NOTES = [');
  const e0 = html.indexOf('\n];', s0);
  const arr = (new Function('return ' + html.slice(s0 + 'window.PATCH_NOTES = '.length, e0 + 2)))();
  { const k = Array.isArray(arr) ? arr.findIndex(e => e.v === 'v1.2.83') : -1; ok(k >= 0 && k <= 22 && arr[k + 1].v === 'v1.2.82', 'PATCH_NOTES parses, 1.2.83 before 1.2.82'); }
}
{
  const re = /<script>([\s\S]*?)<\/script>/g; let m;
  while ((m = re.exec(html))) { let good = true; try { new Function(m[1]); } catch (_) { good = false; } ok(good, 'inline script parses'); }
}
ok(html.includes(torso.trim()), 'torso source matches the page');
// tartan / skin colour: time-box clip keeps the previous program cache key
{
  const tbox = fs.readFileSync(new URL('../tools/content-source/tbox-1264.js', import.meta.url), 'utf8');
  ok(!html.includes("prev.customProgramCacheKey ? prev.customProgramCacheKey() : '') + 't1264clip'"), 'old key-dropping clip key gone');
  ok(tbox.includes("(prevKeyStr !== null ? prevKeyStr : prevKeyFn.call(this)) + '|t1264clip'") && html.includes("(prevKeyStr !== null ? prevKeyStr : prevKeyFn.call(this)) + '|t1264clip'"), 'clip keeps the previous cache key (page + source)');
}
// FP: kilt + sporran hidden only for your own FP camera
ok(torso.includes('KILT_FP: 1') && torso.includes('/visual_(kilt|sporran)_clothing/.test(n)'), 'kilt and sporran join the FP-only hide');
// TP hands (t1201): shading only, no geometry
{
  const hands = fs.readFileSync(new URL('../tools/content-source/hands-tp-1282.js', import.meta.url), 'utf8');
  ok(html.includes(hands.trim()), 'hands source matches the page');
  ok(!/new T\.(Mesh|SkinnedMesh|BoxGeometry)|geometry\.dispose|\.remove\(/.test(hands), 'hands add or delete no geometry');
  ok(hands.includes('prev.call(this, sh, r)') && hands.includes('m.onBeforeCompile[k] = prev[k]'), 'hands chain the existing shader patches (v15 armour look kept)');
}
console.log('PASS', n, 'v1283-release checks');

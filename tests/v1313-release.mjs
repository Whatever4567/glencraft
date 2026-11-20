import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const credits = fs.readFileSync(path.join(root, 'CREDITS.md'), 'utf8');
const ver = JSON.parse(fs.readFileSync(path.join(root, 'version.json'), 'utf8'));
const src = fs.readFileSync(path.join(root, 'tools/content-source/castles-1313.js'), 'utf8');
let n = 0;
function ok(cond, msg) { n++; if (!cond) { console.error('FAIL:', msg); process.exit(1); } }

ok(ver.v === '1.2.114', 'version.json is 1.2.114');
ok(html.includes("const GAME_VERSION = '1.2.114';"), 'GAME_VERSION is 1.2.114');
ok(html.includes('<!-- glencraft-build: b1314-v1.2.114 -->') && html.includes('<!-- glencraft-build: b1313-v1.2.113 -->'), '1.2.114 and 1.2.113 build markers');
ok(html.includes('<!-- glencraft-build: b1311-v1.2.111 -->'), '1.2.111 marker stays');
ok(html.includes('<!-- glencraft-build: b1310-v1.2.110 -->'), '1.2.110 marker stays');
const st = html.indexOf('{"v":"v1.2.114"'), s113 = html.indexOf('{"v":"v1.2.113"', st), s112 = html.indexOf('{"v":"v1.2.112"', s113), mid = html.indexOf('{"v":"v1.2.111"', s112), en = html.indexOf('{"v":"v1.2.110"', mid);
ok(st > 0 && s113 > st && s112 > s113 && mid > s112 && en > mid, 'PATCH_NOTES has 1.2.114 before 1.2.113 before 1.2.112 before 1.2.111 before 1.2.110');
ok(!/haggis|food|sausage|pie\b|bread|meat|stew/i.test(html.slice(st, mid)), '1.2.114 notes have no food');
ok(credits.includes('## v1.2.114 Clansman, Skeleton and Black Skeleton keeps'), 'CREDITS 1.2.114');
ok(credits.includes('## v1.2.111 New-world load and title wallpapers'), 'CREDITS 1.2.111 load notes stay');
{
  const s0 = html.indexOf('window.PATCH_NOTES = [');
  const e0 = html.indexOf('\n];', s0);
  const arr = (new Function('return ' + html.slice(s0 + 'window.PATCH_NOTES = '.length, e0 + 2)))();
  const k = Array.isArray(arr) ? arr.findIndex(e => e.v === 'v1.2.114') : -1;
  ok(k === 0 && arr[1] && arr[1].v === 'v1.2.113' && arr[2] && arr[2].v === 'v1.2.112' && arr[3] && arr[3].v === 'v1.2.111', 'PATCH_NOTES parses, 1.2.114 first then 1.2.113 and 1.2.112');
}
{
  const re = /<script>([\s\S]*?)<\/script>/g; let m, good = true, bad = 0;
  while ((m = re.exec(html))) { try { new Function(m[1]); } catch (_) { good = false; bad++; } }
  ok(good, 'inline scripts parse (' + bad + ' failed)');
}
ok(html.includes(src.trim()), 'castles-1313 source matches the page');
ok((html.split('(function c1313castles()').length - 1) === 1, 'one c1313castles module');
ok(!html.includes('function c1311castles()'), 'old style-alike c1311 IIFE is not in the page');
ok(html.includes('/* GLX-HANDSFP1285') || html.includes('__fpa'), '__fpa rig stays');
ok(html.includes('/* GLX-FIX1279 (v1.2.79):') || html.includes("version: '1.2.59-frame-torch'"), 'torch/pick jitter fixes stay');
console.log('PASS v1313-release', n);

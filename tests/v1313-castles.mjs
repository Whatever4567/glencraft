import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const src = fs.readFileSync(path.join(root, 'tools/content-source/castles-1313.js'), 'utf8');
let n = 0;
function ok(cond, msg) { n++; if (!cond) { console.error('FAIL:', msg); process.exit(1); } }

ok(src.includes('function c1313castles()') && html.includes('function c1313castles()'), 'c1313 hook present in source and page');
ok(src.includes('C.B.human = buildClansman') && src.includes("C.B.mossy = function (K) { return buildRuin(K, 'mossy'); }") && src.includes("C.B.black = function (K) { return buildRuin(K, 'black'); }"), 'overrides the C151 kind builders, does not replace the kit');
ok(src.includes('const C = window.__c151') && src.includes('C.ctx'), 'reuses the C151 kit');
ok(src.includes('const TARTAN') && src.includes('banner(') && src.includes('gateArch') && src.includes('portcullis') && src.includes('coneRoof') && src.includes('pyramid') && src.includes('terraces') && src.includes('T.HEATHER') || src.includes('HEATH'), 'Clansman: measured tartan, arch, cones, pyramids, heather terraces');
ok(src.includes('buildRuin') && src.includes('hillH') && src.includes('deadTree') && src.includes('T.COBWEB') && src.includes('skelProp') && src.includes('ladder('), 'Skeleton: shared ruin, measured crag, cobwebs, dead trees, battlement skeletons, ladder');
ok(src.includes('lavaVeins') && src.includes('rasterVein') && src.includes('T.LAVA') && src.includes('T.MAGMA') && src.includes('paths = [') && src.includes('blackPortal'), 'Black: same silhouette, traced lava-vein polylines, unfinished portal');
ok(src.includes('placeGold') && src.includes('__egypt1269') && src.includes('placeReturn'), 're-places the clan gold portal after the rebuild');
ok(src.includes('K.door') && src.includes('K.chest'), 'doors and chests still placed through the kit');
ok(src.includes('g9castles') && !/g9castles\s*=(?!=)/.test(src), 'does not move or reassign castle positions');
ok(src.includes('placedSet.delete') && src.includes('clearSite'), 'unlocks placedSet and expands the rebuild footprint, then restores the lock');
ok(src.includes('touchUp') && /masonry/i.test(src) && !/hillH\(/.test(src.slice(src.indexOf('function touchUp'))), 'last-generate touch-up is masonry-only');
ok(src.includes('seaY') && src.includes('SEA0'), 'sea-relative heights use the full sea-to-sky budget');
ok(!src.includes('window.alert') && !src.includes('toast(') && !/popup/i.test(src), 'no player popups');
ok(!src.includes('window.__c111 =') && !html.includes('window.__c111 = window.__c1313'), 'does not overwrite __c111 villager speech');
ok(html.includes('(function c151()') && html.includes('U.B.human = function'), 'original C151 builders remain in the page (upgrade, not a delete)');
ok(html.includes('__fpa') && html.includes('T.BLACKSTONE'), 'fpa rig and blackstone block stay');
console.log('PASS v1313-castles', n);

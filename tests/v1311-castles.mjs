import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const src = fs.readFileSync(path.join(root, 'tools/content-source/castles-1311.js'), 'utf8');
let n = 0;
function ok(cond, msg) { n++; if (!cond) { console.error('FAIL:', msg); process.exit(1); } }

ok(src.includes('function c1311castles()') && html.includes('function c1311castles()'), 'c111 hook present');
ok(src.includes('C.B.human = buildHuman') && src.includes("C.B.mossy = function (K) { return buildRuin(K, 'mossy'); }") && src.includes("C.B.black = function (K) { return buildRuin(K, 'black'); }"), 'overrides the C151 kind builders, does not replace the kit');
ok(src.includes('C.ctx') || html.includes('__c151.ctx') || src.includes('const C = window.__c151'), 'reuses the C151 kit');
ok(src.includes('coneRoof') && src.includes('tartan') && src.includes('portcullis') && src.includes('terraces') && src.includes('T.HEATHER'), 'Clansman: cone roof, tartan, portcullis, heather terraces');
ok(src.includes('buildRuin') && src.includes('deadTree') && src.includes('T.COBWEB') && src.includes('CH = 14'), 'Skeleton: shared ruin, cobwebs, dead trees, steeper crag');
ok(src.includes("kind === 'black'") && src.includes('lavaVeins') && src.includes('blackPortal') && src.includes('T.LAVA') && src.includes('T.MAGMA'), 'Black: same ruin silhouette, lava veins, unfinished portal');
ok(src.includes('placeGold') && src.includes('__egypt1269') && src.includes('placeReturn'), 're-places the clan gold portal after the rebuild');
ok(src.includes('K.door') && src.includes('K.chest'), 'doors and chests still placed through the kit');
ok(src.includes('g9castles') && !src.includes('g9castles =') && !/g9castles\s*=\s*\[/.test(src), 'does not move or reassign castle positions');
ok(!src.includes('window.alert') && !src.includes('toast(') && !/popup/i.test(src), 'no player popups');
ok(html.includes('(function c151()') && html.includes('U.B.human = function'), 'original C151 builders remain in the page (upgrade, not a delete)');
ok(html.includes('__fpa') && html.includes('T.BLACKSTONE'), 'fpa rig and blackstone block stay');
console.log('PASS v1311-castles', n);

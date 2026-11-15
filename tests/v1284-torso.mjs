// 1.2.84 WIP (t1203): shirt torso volume, closed sides, sash off the back. Static checks.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const torso = fs.readFileSync(path.join(root, 'tools/content-source/torso-1262.js'), 'utf8');
let n = 0;
function ok(c, m) { n++; if (!c) { console.error('FAIL:', m); process.exit(1); } }
ok(html.includes(torso.trim()), 'torso source matches the page');
ok(/SIDES: 1, KILT_FP: 1, BRIDGE: 1, WIDEN: 1, SASH_BACK: 1/.test(torso), 'bridge, widen and sash-back on');
ok(torso.includes('function buildBridgeGeo(') && torso.includes('function widenMesh(') && torso.includes('function hideSashBack('), 'helpers present');
ok(/SX: 1\.38, SZF: 1\.34, SZB: 1\.18/.test(torso), 'volume factors');
ok(torso.includes("/^(spine|pelvis)/.test(b.name || '')"), 'widen weighted by spine/pelvis skin weights only');
ok(torso.includes('visual_torso_outfit00\\d'), 'widen / sash hide limited to the near-LOD shirt');
ok(torso.includes('if (vBack1284 > 0.5) discard;'), 'sash back hidden by discard, not deleted');
ok(!/geometry\.dispose|\.remove\(mesh\)|setDrawRange|setIndex\(new[^)]*keep/.test(torso), 'no player geometry deleted');
ok(torso.includes('attachFpCull(side)') && torso.includes('renderer.render.__torso1282'), 'fill hidden only in your own FP view');
ok(torso.includes('Object.assign(U, window.__torso1262cfg || {})'), 'QA config hook');
console.log('PASS', n, 'v1284-torso checks');

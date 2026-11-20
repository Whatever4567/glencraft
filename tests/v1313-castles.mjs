import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const src = fs.readFileSync(path.join(root, 'tools/content-source/castles-1313.js'), 'utf8');
let n = 0;
function ok(cond, msg) { n++; if (!cond) { console.error('FAIL:', msg); process.exit(1); } }

ok(src.includes('function c1313castles()') && html.includes('function c1313castles()'), 'c1313 hook present in source and page');
ok(src.includes('C.B.human') && src.includes('C.B.mossy') && src.includes('C.B.black') && src.includes('buildFromModel'), 'overrides the C151 kind builders with the model stamper, does not replace the kit');
ok(src.includes('const C = window.__c151') && src.includes('C.ctx'), 'reuses the C151 kit');
ok(src.includes('ensureModels') && src.includes('stampModel') && src.includes('assets/castles/'), 'loads standalone voxel models from assets/castles and stamps them');
ok(src.includes('pickNaturalSites') && src.includes('isNewWorld') && src.includes('wrapPlacement'), 'new-world-only deterministic natural-terrain site picker');
ok(src.includes('waterNear') && src.includes('prom'), 'Clansman prefers a slope near water; skeleton keeps prefer high ground');
ok(!src.includes('function hillH') && !src.includes('function terraces') && !src.includes('prepareSite'), 'does not stamp custom isles, crags, hills or flattened pads');
ok(src.includes('foundations') && src.includes('edgeBlend') && src.includes('decorate'), 'foundations fill down to natural ground; only a gentle rim blend and small decorations around the footprint');
ok(src.includes('hideKeepFootprint') && src.includes('map-edge'), 'hides previously-raised edge-isle keeps on new worlds only');
ok(src.includes('placeGold') && src.includes('__egypt1269') && src.includes('placeReturn') && src.includes('SEA0'), 're-places the clan gold portal on solid ground at or above sea after the stamp');
ok(src.includes('K.door') && src.includes('K.chest') && src.includes('K.lamp'), 'doors, chests and lamps still placed through the kit');
ok(src.includes('placedSet.delete'), 'unlocks placedSet for the upscaled footprint, then restores the lock');
ok(src.includes('expandWorldH') && src.includes('CASTLE_SKY_H'), 'raises the sky on new worlds so the upscaled tips fit, never on old saves');
ok(!src.includes('window.alert') && !src.includes('toast(') && !/popup/i.test(src), 'no player popups');
ok(!src.includes('window.__c111 =') && !html.includes('window.__c111 = window.__c1313'), 'does not overwrite __c111 villager speech');
ok(html.includes('(function c151()') && html.includes('U.B.human = function'), 'original C151 builders remain in the page (upgrade, not a delete)');
ok(html.includes('__fpa') && html.includes('T.BLACKSTONE'), 'fpa rig and blackstone block stay');

for (const name of ['clansman', 'skeleton', 'black-skeleton']) {
  const bin = path.join(root, 'assets/castles', name + '.bin');
  ok(fs.existsSync(bin) && fs.statSync(bin).size > 10000, name + ' model bin is present');
  const buf = fs.readFileSync(bin);
  ok(buf.slice(0, 4).toString() === 'GC13', name + ' bin starts with GC13');
}

console.log('PASS v1313-castles', n);

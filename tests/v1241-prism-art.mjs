// 1.2.41 local candidate: shared cached prism / crystal-facet pass for
// tools, icons, block tiles, 3D icons and the listed mobs/NPCs.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {T} from './lib/pilot-native-r128.mjs';

const file = process.argv[2] || 'index.html';
const html = fs.readFileSync(file, 'utf8');
let n = 0;
const ok = (c, label) => { assert.ok(c, label); console.log('ok ' + (++n) + ' ' + label); };

ok(html.includes("const GAME_VERSION = '1.2.51';") || html.includes("const GAME_VERSION = '1.2.50';") || html.includes("const GAME_VERSION = '1.2.49';") || html.includes("const GAME_VERSION = '1.2.48';") || html.includes("const GAME_VERSION = '1.2.47';") || html.includes("const GAME_VERSION = '1.2.46';") || html.includes("const GAME_VERSION = '1.2.44';") || html.includes("const GAME_VERSION = '1.2.43';") || html.includes("const GAME_VERSION = '1.2.42';"), 'GAME_VERSION is 1.2.46+');
ok(html.includes('<!-- glencraft-build: b1251-visible-land -->') || html.includes('<!-- glencraft-build: b1250-held-popstar -->') || html.includes('<!-- glencraft-build: b1250-v1.2.50 -->') || html.includes('<!-- glencraft-build: b1249-v1.2.49 -->') || html.includes('<!-- glencraft-build: b1248-v1.2.48 -->') || html.includes('<!-- glencraft-build: b1247-v1.2.47 -->') || html.includes('<!-- glencraft-build: b1246-v1.2.46 -->') || html.includes('<!-- glencraft-build: b1244-v1.2.44 -->'), 'build marker is b1246 or b1244');
ok(html.includes('__prism1241') && html.includes('facetGeometry') && html.includes('prismMaterial') && html.includes('applyPrism'), 'shared prism helper is in the built index');
ok(html.includes('cached facet') || html.includes('shared, cached facet'), 'patch notes mention the shared cached facet pass');
ok(html.includes('prism / crystal-faceted') || html.includes("prism / crystal-faceted"), 'patch notes mention the prism look for tools and icons');

const helper = fs.readFileSync(new URL('../tools/visuals-source/prism-1241.js', import.meta.url), 'utf8');
const W = {THREE: T, QUALITY: '4k', HIGH: true};
new Function('window', 'THREE', 'document', 'Image', helper)(W, T, undefined, undefined);
const U = W.__prism1241;
ok(U && typeof U.facetGeometry === 'function' && typeof U.applyPrism === 'function' && typeof U.prismTile === 'function' && typeof U.prismIcon2d === 'function', 'helper exposes the shared geometry, material, icon and apply API');
ok(typeof U.buildTool === 'function' && typeof U.cutGemGeometry === 'function' && typeof U.chamferBoxGeometry === 'function', 'helper exposes cut-gem / chamfer builders');
ok(U.quality4k(), '4K UHD quality is detected');
ok(U.iconSize() === 1024, 'inventory icons use a 1024px canvas in 4K UHD');

const listed = ['sheep','haggis','pig','creeper','treeman','blackskel','skeleton','clansman','farmer','alien','paladien','egyptian','zombie','spider','ghost','nm11','nm22','wizard'];
ok(listed.every(k => U.LISTED[k]), 'every listed mob/NPC kind is in the shared dress list (' + listed.filter(k => !U.LISTED[k]).join(',') + ')');

// --- geometry cache and silhouette ---
{
  const geo = new T.BoxGeometry(0.2, 0.8, 0.2, 1, 1, 1);
  geo.computeBoundingBox();
  const before = geo.boundingBox.getSize(new T.Vector3()).clone();
  const a = U.facetGeometry(geo);
  const b = U.facetGeometry(geo);
  ok(a === b, 'facetGeometry returns the same cached object for the same input');
  ok(U.geoHits >= 1 && U.geoMiss >= 1, 'the geometry cache records a miss then a hit');
  if (!a.boundingBox) a.computeBoundingBox();
  const after = a.boundingBox.getSize(new T.Vector3());
  ok(Math.abs(after.x - before.x) < 1e-5 && Math.abs(after.y - before.y) < 1e-5 && Math.abs(after.z - before.z) < 1e-5, 'chamfering a box keeps its bounding-box silhouette');
  ok(a.userData && a.userData.prism1241, 'faceted geometry is tagged');
  ok(!a.index, 'faceted geometry is non-indexed so face normals stay flat');
  ok(U.uniqueNormals(a) > 6, 'a chamfered box has more than the 6 face normals of a cube (' + U.uniqueNormals(a) + ')');
}

// --- cut-gem heads, octagonal handles, triangle budget ---
{
  const pick = U.buildTool('pick', 'diamond');
  const purple = U.buildTool('p761', 'crystalpurple');
  const axe = U.buildTool('axe', 'iron');
  const sword = U.buildTool('sword', 'diamond');
  const shovel = U.buildTool('shovel', 'iron');
  const hoe = U.buildTool('hoe', 'iron');
  const flint = U.buildTool('flint', 'iron');
  const shears = U.buildTool('shears', 'iron');
  const musket = U.buildTool('musket', 'iron');
  const pistol = U.buildTool('pistol', 'iron');

  const meshCount = root => { let n = 0; root.traverse(o => { if (o.isMesh) n++; }); return n; };
  const maxUnique = root => {
    let m = 0;
    root.traverse(o => { if (o.isMesh && o.geometry) m = Math.max(m, U.uniqueNormals(o.geometry)); });
    return m;
  };
  ok(maxUnique(pick) >= 8, 'a pickaxe head exposes at least 8 unique facet normals (' + maxUnique(pick) + ')');
  ok(maxUnique(purple) >= 8, 'the purple crystal pickaxe is a cut gem, not a box (' + maxUnique(purple) + ' normals)');
  // thin elegant purple pick: head / handle thinner than the standard diamond pick
  const size = root => { root.updateMatrixWorld(true); return new T.Box3().setFromObject(root).getSize(new T.Vector3()); };
  const sp = size(pick), su = size(purple);
  ok(su.x < sp.x * 0.95 && su.z < sp.z * 0.95, 'the purple crystal pickaxe is thinner than a standard pick (purple ' + su.x.toFixed(3) + 'x' + su.z.toFixed(3) + ' vs ' + sp.x.toFixed(3) + 'x' + sp.z.toFixed(3) + ')');
  ok(meshCount(flint) >= 2 && U.countTris(flint) > 24, 'flint-and-steel is not a generic block (' + meshCount(flint) + ' meshes, ' + U.countTris(flint) + ' tris)');
  ok(meshCount(shears) >= 3 && U.countTris(shears) > 24, 'shears are not a generic block (' + meshCount(shears) + ' meshes, ' + U.countTris(shears) + ' tris)');
  const tPick = U.countTris(pick), tPurple = U.countTris(purple), tMusket = U.countTris(musket), tPistol = U.countTris(pistol);
  const tAxe = U.countTris(axe), tSword = U.countTris(sword), tShovel = U.countTris(shovel), tHoe = U.countTris(hoe), tFlint = U.countTris(flint), tShears = U.countTris(shears);
  console.log('tri budget tools', {tPick, tPurple, tAxe, tSword, tShovel, tHoe, tFlint, tShears, tMusket, tPistol});
  ok(tPick < U.BUDGET.tool && tPurple < U.BUDGET.tool && tAxe < U.BUDGET.tool && tSword < U.BUDGET.tool && tShovel < U.BUDGET.tool && tHoe < U.BUDGET.tool && tFlint < U.BUDGET.tool && tShears < U.BUDGET.tool, 'each rebuilt tool stays under the ' + U.BUDGET.tool + ' triangle budget');
  ok(tMusket < U.BUDGET.gun && tPistol < U.BUDGET.gun, 'faceted guns stay under the ' + U.BUDGET.gun + ' triangle budget');
  // a handful of held tools + drops is a rounding error next to an HD character
  const heldScene = tPick + tMusket + tPurple;
  ok(heldScene < 4000, 'a typical held-tool set is a few thousand tris, well below an HD character (' + heldScene + ')');
}

// --- material cache + colour identity ---
{
  const src = new T.MeshLambertMaterial({color: 0xb48a52});
  const m1 = U.prismMaterial(src, 'wood');
  const m2 = U.prismMaterial(src, 'wood');
  ok(m1 === m2, 'prismMaterial is cached for the same colour and hint');
  ok(m1.flatShading === true && m1.isMeshStandardMaterial, 'prism materials are flat-shaded standard materials');
  ok(m1.userData && m1.userData.prismRim1241, 'the shared fresnel / inner-depth rim is attached');
  const c = m1.color;
  ok(c.r > 0.5 && c.g > 0.3 && c.b < 0.5 && c.r > c.b, 'a wood-brown material keeps a warm brown identity');
}

// --- applyPrism on a tool-like mesh ---
{
  const g = new T.Group();
  const wood = new T.Mesh(new T.BoxGeometry(0.035, 0.46, 0.035), new T.MeshLambertMaterial({color: 0x6b4a2a}));
  wood.position.y = 0.12;
  const head = new T.Mesh(new T.BoxGeometry(0.34, 0.05, 0.05), new T.MeshLambertMaterial({color: 0x6ff0ea}));
  head.position.y = 0.33;
  g.add(wood, head);
  g.updateMatrixWorld(true);
  const box0 = new T.Box3().setFromObject(g).getSize(new T.Vector3());
  U.applyPrism(g, {hint: 'crystal', noShards: true});
  g.updateMatrixWorld(true);
  const box1 = new T.Box3().setFromObject(g).getSize(new T.Vector3());
  ok(wood.userData.prism1241Applied && head.userData.prism1241Applied, 'both handle and head receive the pass');
  ok(Math.abs(box1.x - box0.x) < 0.02 && Math.abs(box1.y - box0.y) < 0.02 && Math.abs(box1.z - box0.z) < 0.02, 'a held tool keeps its silhouette after the prism pass (dx=' + Math.abs(box1.x-box0.x).toFixed(4) + ')');
  const hc = head.material.color;
  ok(hc.b > 0.7 && hc.g > 0.7 && hc.b >= hc.r, 'the diamond / crystal head stays cyan, not recoloured');
  ok(U.uniqueNormals(head.geometry) >= 8, 'applyPrism turns a box pick head into a multi-facet gem');
}

// --- skinned meshes keep authored geometry ---
{
  const geo = new T.BoxGeometry(0.3, 0.5, 0.2);
  const mesh = new T.Mesh(geo, new T.MeshLambertMaterial({color: 0x6a8a58}));
  mesh.isSkinnedMesh = true;
  mesh.skeleton = {bones: []};
  const root = new T.Group(); root.add(mesh);
  const before = mesh.geometry;
  U.applyPrism(root, {kind: 'zombie', skinned: true});
  ok(mesh.geometry === before, 'skinned / HD mobs keep their authored geometry');
  ok(mesh.material && mesh.material.userData && mesh.material.userData.prism1241, 'skinned mobs still get the cached prism material');
}

// --- world tiles untouched; inventory icon 2D pass still available and cached ---
{
  ok(U.worldTilesUntouched === 1, 'helper marks world tiles as untouched (1.2.42)');
  ok(html.includes('worldTilesUntouched') && html.includes('intentionally empty: world tiles stay at 1.2.40'), 'built index keeps the world-tile no-op');
  ok(!/function restyleTexKey\(key\) \{[\s\S]{0,200}prismTile/.test(html), 'restyleTexKey no longer calls prismTile on texImg');
  ok(html.includes('U.restyleAllTiles = function () { return 0; }') || html.includes('U.restyleAllTiles = function () { return 0 }'), 'restyleAllTiles is a no-op');
  const {createCanvas} = (await import('node:module')).createRequire('/workspace/qa/tools/index.js')('@napi-rs/canvas');
  U.makeCanvas = (w, h) => createCanvas(w, h);
  // Inventory icon path still styles a canvas once and caches it.
  const c = createCanvas(64, 64);
  const g = c.getContext('2d');
  g.fillStyle = '#c0392b'; g.fillRect(8, 8, 48, 48);
  const a = U.prismIcon2d(c, 'item_test');
  const b = U.prismIcon2d(c, 'item_test');
  ok(a && a === b, 'inventory icon prism pass is cached for the same key');
  ok(typeof U.styleIconUrl === 'function' && typeof U.restyleIcons === 'function', 'inventory icon restyle API remains');
  // Simulate a tiny texImg atlas: restyleAllTiles must not mutate it.
  const fake = {grass: c};
  const prev = globalThis.texImg;
  globalThis.texImg = fake;
  const n = U.restyleAllTiles();
  ok(n === 0 && fake.grass === c, 'restyleAllTiles leaves a fake world texImg atlas unchanged');
  globalThis.texImg = prev;
}

// --- mob colour / silhouette identity ---
{
  const mob = new T.Group();
  const body = new T.Mesh(new T.BoxGeometry(0.5, 0.9, 0.3), new T.MeshLambertMaterial({color: 0x3a8a3a}));
  const head = new T.Mesh(new T.BoxGeometry(0.35, 0.35, 0.35), new T.MeshLambertMaterial({color: 0x2f6a2f}));
  head.position.y = 0.65;
  mob.add(body, head);
  mob.updateMatrixWorld(true);
  const s0 = new T.Box3().setFromObject(mob).getSize(new T.Vector3());
  U.applyPrism(mob, {kind: 'creeper'});
  mob.updateMatrixWorld(true);
  const s1 = new T.Box3().setFromObject(mob).getSize(new T.Vector3());
  const col = body.material.color;
  ok(col.g > col.r && col.g > col.b, 'a creeper-green body stays green');
  const gx = Math.abs(s1.x-s0.x)/s0.x, gy = Math.abs(s1.y-s0.y)/s0.y, gz = Math.abs(s1.z-s0.z)/s0.z;
  ok(gx < 0.18 && gy < 0.18 && gz < 0.18, 'a listed mob keeps its silhouette (growth ' + [gx,gy,gz].map(v=>(v*100).toFixed(1)+'%').join(', ') + ')');
  ok(U.uniqueNormals(body.geometry) > 6, 'a boxy mob body is chamfered into visible facets');
  const tMob = U.countTris(mob);
  ok(tMob < U.BUDGET.mobBox, 'a chamfered box mob stays under the ' + U.BUDGET.mobBox + ' triangle budget (' + tMob + ')');
}

ok(html.includes('World block tiles') || html.includes('shared block atlas'), '1.2.42 patch notes mention the world block atlas revert');
ok(html.includes('__weakBoot1242') || html.includes('touchMode ? 1.5'), '4K UHD pixel ratio is capped on weak/touch devices');
ok(html.includes('HIGH && touchMode') || html.includes("(HIGH && touchMode)"), 'adaptive quality guard also runs under 4K UHD on touch');
ok(!U.err, 'prism helper ran without error' + (U.err ? ': ' + U.err : ''));
console.log('PASS ' + n + ' v1241 prism-art checks');

// 1.2.40: every holdable tool/item faces forward at a sensible size, is visible
// in the hand, and keeps its material, in both first and third person. FP/swim
// arms are sourced from the new scottish-base-v2 character.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {T, load, builtRuntime, legacy} from './lib/pilot-native-r128.mjs';

const file = process.argv[2] || 'index.html';
const html = fs.readFileSync(file, 'utf8');
let n = 0;
const ok = (c, label) => { assert.ok(c, label); console.log('ok ' + (++n) + ' ' + label); };

ok(html.includes("const GAME_VERSION = '1.2.50';") || html.includes("const GAME_VERSION = '1.2.49';") || html.includes("const GAME_VERSION = '1.2.48';") || html.includes("const GAME_VERSION = '1.2.47';") || html.includes("const GAME_VERSION = '1.2.46';") || html.includes("const GAME_VERSION = '1.2.44';") || html.includes("const GAME_VERSION = '1.2.42';") || html.includes("const GAME_VERSION = '1.2.40';"), 'GAME_VERSION is 1.2.46+');
ok(html.includes('<!-- glencraft-build: b1250-held-popstar -->') || html.includes('<!-- glencraft-build: b1250-v1.2.50 -->') || html.includes('<!-- glencraft-build: b1249-v1.2.49 -->') || html.includes('<!-- glencraft-build: b1248-v1.2.48 -->') || html.includes('<!-- glencraft-build: b1247-v1.2.47 -->') || html.includes('<!-- glencraft-build: b1246-v1.2.46 -->') || html.includes('<!-- glencraft-build: b1244-v1.2.44 -->') || html.includes('<!-- glencraft-build: b1242-v1.2.42 -->') || html.includes('<!-- glencraft-build: b1240-v1.2.40 -->'), 'build marker is 1.2.46+');
ok(html.includes('Default graphics mode is now 4K UHD'), '1.2.39 graphics note kept');
ok(html.includes('every tool and held item faces forward') && html.includes('First-person and swimming arms now come from the new character'), '1.2.40 patch notes cover all held items and new arms');
ok(html.includes('__held1240') && html.includes('weapon_grip_slot') && html.includes('U.CATALOG'), 'held-item helper and full catalog are in the build');
ok(html.includes('visual_arm_slot0_hand') && html.includes('gear_chest_slot0') && html.includes('Held1240FpArms'), 'FP arms are sourced from the new character arm / armour regions');

const helper = fs.readFileSync(new URL('../tools/pilot-model-source/held-fp-1240.js', import.meta.url), 'utf8');
const W = {THREE: T};
new Function('window', helper)(W);
const H = W.__held1240;
ok(H && H.poseHeld && H.poseHeldFp && H.CATALOG && H.CATALOG.length >= 40, 'helper exposes 3p/1p posing and a catalog of every holdable (' + (H.CATALOG && H.CATALOG.length) + ')');

const dir = new URL('../assets/models/scottish-base-v2/', import.meta.url);
let eq = [0, 0, 0, 0, 0];
const tier = id => id >= 129 && id <= 132 ? 'diamond' : id >= 112 && id <= 115 ? 'gold' : id >= 108 && id <= 111 ? 'iron' : 'copper';
const R = builtRuntime({
  scottish: true, life: false, equipment: () => eq, tier, distance: () => 0,
  load: async name => {
    const far = name === 'pilot-far.glb';
    const [b, o] = await Promise.all([
      load(new URL(far ? 'scottish-far.glb' : 'scottish-base-with-jetpack.glb', dir)),
      load(new URL(far ? 'crystal-armour-far.glb' : 'crystal-armour.glb', dir))
    ]);
    return R.combineScottish(b, o, far);
  }
});
const B = legacy(eq);
const models = {base: B.build(false), armour: B.build(false)};
await Promise.all([R.attach(models.base), R.attach(models.armour)]);
eq = [129, 130, 131, 132, 0];
R.dressed(models.armour);
ok(!R.error && models.base.userData.pilot && models.armour.userData.pilot, 'base and armour characters attach');
ok(models.base.userData.pilot.near.root.getObjectByName('weapon_grip_slot1') &&
   models.armour.userData.pilot.near.root.getObjectByName('weapon_grip_slot0'), 'both outfits expose weapon_grip_slot0/1');

function aabb(root) {
  const box = new T.Box3();
  let any = false, tris = 0, mats = [];
  root.updateMatrixWorld(true);
  root.traverse(o => {
    if (!o.isMesh || o.visible === false) return;
    for (let p = o; p; p = p.parent) if (p.visible === false) return;
    const ge = o.geometry, ix = ge.index, pa = ge.attributes.position;
    if (!pa) return;
    tris += (ix ? ix.count : pa.count) / 3;
    if (!ge.boundingBox) ge.computeBoundingBox();
    const b = ge.boundingBox.clone().applyMatrix4(o.matrixWorld);
    if (!any) { box.copy(b); any = true; } else box.union(b);
    for (const m of [].concat(o.material || [])) if (m && m.color) mats.push(m.color.clone());
  });
  if (!any) return {empty: true, tris: 0, size: new T.Vector3(), center: new T.Vector3(), min: new T.Vector3(), max: new T.Vector3(), mats};
  return {empty: false, tris, size: box.getSize(new T.Vector3()), center: box.getCenter(new T.Vector3()), min: box.min.clone(), max: box.max.clone(), mats};
}

function isWoodColor(c) { return c.r > 0.25 && c.g > 0.12 && c.g < 0.7 && c.b < 0.4 && c.r > c.b + 0.05 && c.r >= c.g - 0.02; }
function isPurple(c) { return c.b > 0.4 && c.r > 0.35 && c.r > c.g; }
function isBlue(c) { return c.b > 0.45 && c.b > c.r && c.b >= c.g * 0.9; }
function isGrey(c) { return Math.abs(c.r - c.g) < 0.08 && Math.abs(c.g - c.b) < 0.08 && c.r > 0.45; }

const HEAD = {wood: [0xb08a55], stone: [0x8e9398, 0x9a9ea2], iron: [0xdfe3e8, 0x222226, 0xe2e5e8], gold: [0xf4c542, 0xf2c440], diamond: [0x6ff0ea, 0x5fe0dc], cobalt: [0x5a72e0, 0x6a84f0]};

function makeStandin(entry) {
  const g = new T.Group();
  const kind = entry.kind, mat = entry.mat;
  const wood = new T.MeshPhongMaterial({color: 0x6b4a2a});
  const headCol = {wood: 0xb08a55, stone: 0x8e9398, iron: 0xdfe3e8, gold: 0xf4c542, diamond: 0x6ff0ea, cobalt: 0x5a72e0, crystalpurple: 0xdfe3e8, crystalblue: 0xdfe3e8, metal: 0x888c92, glass: 0xe8f4ff, paper: 0xe8d6a8, plastic: 0x15161a, food: 0xc9a05a, item: 0xc0392b}[mat] || 0x888888;
  const head = new T.MeshPhongMaterial({color: headCol});
  if (H.HAFT.has(kind) || kind === 'p761' || kind === 'p760' || kind === 'pick' || kind === 'axe' || kind === 'shovel' || kind === 'hoe' || kind === 'sword' || kind === 'claymore' || kind === 'shears' || kind === 'flint' || kind === 'stick' || kind === 'key') {
    const handle = new T.Mesh(new T.CylinderGeometry(0.02, 0.022, 0.48, 8), wood);
    if (kind === 'stick') handle.material = wood;
    handle.position.y = 0.12; g.add(handle);
    if (kind !== 'stick' && kind !== 'flint' && kind !== 'key') {
      const blade = new T.Mesh(new T.BoxGeometry(kind === 'sword' || kind === 'claymore' ? 0.04 : 0.28, kind === 'sword' || kind === 'claymore' ? 0.42 : 0.05, 0.04), head);
      blade.position.y = kind === 'sword' || kind === 'claymore' ? 0.36 : 0.34; g.add(blade);
    }
    g.userData.tool = true; g.userData.kind = kind === 'p761' || kind === 'p760' ? 'pick' : (kind === 'claymore' ? 'sword' : kind);
    if (kind === 'p761') { g.userData.p761 = 1; g.scale.multiply(new T.Vector3(0.86, 1.12, 0.62)); }
    if (kind === 'p760') { g.userData.p760 = 1; }
  } else if (kind === 'pistol' || kind === 'musket') {
    const iron = new T.MeshPhongMaterial({color: 0x222226});
    const w = new T.MeshPhongMaterial({color: 0x5a3a1e});
    const long = kind === 'musket';
    const barrel = new T.Mesh(new T.BoxGeometry(long ? 0.72 : 0.18, 0.03, 0.03), iron);
    barrel.position.set(long ? 0.28 : 0.08, 0.02, 0); g.add(barrel);
    const grip = new T.Mesh(new T.BoxGeometry(long ? 0.22 : 0.03, long ? 0.06 : 0.1, 0.04), w);
    grip.position.set(long ? -0.18 : 0, long ? -0.02 : -0.04, 0); g.add(grip);
    g.userData.gun = kind === 'pistol' ? 212 : 213;
    g.rotation.set(0, Math.PI / 2, 0);
  } else if (kind === 'map') {
    g.userData.map = true;
  } else if (kind === 'block') {
    g.add(new T.Mesh(new T.BoxGeometry(0.16, 0.16, 0.16), new T.MeshLambertMaterial({color: 0x8a8a86})));
    g.userData.block = true;
  } else if (kind === 'bucket') {
    g.add(new T.Mesh(new T.CylinderGeometry(0.08, 0.06, 0.12, 10), wood));
    g.userData.bucket = true;
  } else if (kind === 'torch') {
    const st = new T.Mesh(new T.CylinderGeometry(0.02, 0.02, 0.2, 8), wood); g.add(st);
    g.userData.torch = true;
  } else if (kind === 'drink') {
    g.add(new T.Mesh(new T.CylinderGeometry(0.05, 0.04, 0.1, 10), new T.MeshPhongMaterial({color: headCol, transparent: true, opacity: 0.8})));
  } else if (kind === 'jetpack') {
    g.add(new T.Mesh(new T.BoxGeometry(0.2, 0.28, 0.12), new T.MeshPhongMaterial({color: mat === 'gold' ? 0xf2c440 : 0xd0d4d8})));
  } else if (kind === 'shield') {
    g.add(new T.Mesh(new T.BoxGeometry(0.22, 0.28, 0.03), new T.MeshLambertMaterial({color: 0x5a3a1e})));
    g.userData.shield = true;
  } else {
    g.add(new T.Mesh(new T.BoxGeometry(0.08, 0.1, 0.08), new T.MeshLambertMaterial({color: headCol})));
  }
  return g;
}

function unposedSize(root) {
  const parent = root.parent;
  const q = root.quaternion.clone(), p = root.position.clone();
  if (parent) parent.remove(root);
  root.quaternion.identity(); root.position.set(0, 0, 0); root.updateMatrixWorld(true);
  const b = aabb(root);
  root.quaternion.copy(q); root.position.copy(p);
  if (parent) parent.add(root);
  root.updateMatrixWorld(true);
  return b;
}
function sizeOk(entry, box, mesh) {
  if (box.empty || box.tris < 1) return 'empty';
  const measured = mesh ? unposedSize(mesh) : box;
  if (measured.empty) return 'empty';
  const size = measured.size;
  const k = entry.kind, y = size.y, len = size.length();
  if (k === 'musket') return len > 0.15 && len < 1.35 && y < 1.1 ? null : 'musket size ' + len.toFixed(3);
  if (k === 'pistol') return len > 0.06 && len < 0.7 ? null : 'pistol size ' + len.toFixed(3);
  if (k === 'map' || k === 'block' || k === 'drink' || k === 'item' || k === 'key' || k === 'remote' || k === 'torch' || k === 'bucket') {
    return len > 0.04 && len < 0.6 && y < 0.7 ? null : k + ' size ' + len.toFixed(3);
  }
  if (k === 'jetpack' || k === 'shield') return len > 0.08 && len < 0.8 ? null : k + ' size ' + len.toFixed(3);
  return y > 0.18 && y < 0.95 && size.x < 0.75 && size.z < 0.9 ? null : k + ' size y=' + y.toFixed(3) + ' xz=' + size.x.toFixed(3) + ',' + size.z.toFixed(3);
}

function itemAabbIn(mesh, space) {
  space.updateMatrixWorld(true);
  mesh.updateMatrixWorld(true);
  const inv = space.matrixWorld.clone().invert();
  const out = new T.Box3();
  let any = false;
  mesh.traverse(o => {
    if (!o.isMesh || !o.geometry) return;
    const ge = o.geometry;
    if (!ge.boundingBox) ge.computeBoundingBox();
    const b = ge.boundingBox;
    for (let i = 0; i < 8; i++) {
      const v = new T.Vector3(i & 1 ? b.max.x : b.min.x, i & 2 ? b.max.y : b.min.y, i & 4 ? b.max.z : b.min.z).applyMatrix4(o.matrixWorld).applyMatrix4(inv);
      if (!any) { out.min.copy(v); out.max.copy(v); any = true; } else out.expandByPoint(v);
    }
  });
  return out;
}
function forwardOk(entry, mesh, space) {
  if (!mesh || !space) return {ok: false, dx: 0, dy: 0, dz: 0};
  const lb = itemAabbIn(mesh, space);
  const dx = lb.max.x - lb.min.x, dy = lb.max.y - lb.min.y, dz = lb.max.z - lb.min.z;
  if (entry.kind === 'pistol' || entry.kind === 'musket') {
    return {ok: dz > dx * 0.9 && dz > dy * 0.55 && lb.max.z > Math.abs(lb.min.z) * 0.6 && lb.max.z > 0.04, dx, dy, dz, z0: lb.min.z, z1: lb.max.z};
  }
  if (entry.kind === 'sword' || entry.kind === 'claymore' || entry.kind === 'stick' || entry.kind === 'shears' || entry.kind === 'flint' || entry.kind === 'key') {
    return {ok: Math.max(dy, dz) > dx * 1.15, dx, dy, dz};
  }
  if (H.HAFT.has(entry.kind)) return {ok: dz > dx * 1.02, dx, dy, dz};
  return {ok: true, dx, dy, dz};
}

function materialOk(entry, box) {
  if (entry.kind === 'p761') return box.mats.some(isPurple) && !box.mats.filter(c => !isWoodColor(c)).every(isGrey);
  if (entry.kind === 'p760') return box.mats.some(isBlue);
  if (entry.mat === 'wood' && H.HAFT.has(entry.kind)) return box.mats.some(isWoodColor);
  if (entry.mat === 'gold') return box.mats.some(c => c.r > 0.7 && c.g > 0.5 && c.b < 0.45);
  if (entry.mat === 'diamond') return box.mats.some(c => c.g > 0.6 && c.b > 0.6);
  if (entry.mat === 'cobalt') return box.mats.some(c => c.b > 0.5 && c.b > c.r);
  // iron/stone/others: must not have been force-painted purple (unless crystal)
  if (entry.mat === 'iron' || entry.mat === 'stone') return !box.mats.some(isPurple);
  return box.mats.length > 0;
}

const cam = new T.PerspectiveCamera(70, 1, 0.05, 20);
const fpView = H.installFpOnCamera(cam, models.base.userData.pilot.near.root, false);
ok(fpView && fpView.parent === cam, 'FP arms install on the camera for first-person item checks');
H.applyFpIk(fpView, 'pickaxe');

let failures = [];
for (const outfit of ['base', 'armour']) {
  const model = models[outfit];
  model.position.set(0, 0, 0); model.rotation.set(0, 0, 0); model.updateMatrixWorld(true);
  R.sync(model);
  for (const entry of H.CATALOG) {
    const mesh3 = makeStandin(entry);
    const info = H.poseHeld(model, {mesh: mesh3, kind: entry.kind, heldId: entry.id});
    const box = aabb(mesh3);
    const sock = info && info.socket && info.socket.getWorldPosition(new T.Vector3());
    const sz = sizeOk(entry, box, mesh3);
    const fw = forwardOk(entry, mesh3, (info && info.socket) || model);
    const mat = materialOk(entry, box);
    const inHand = sock && !box.empty && box.center.distanceTo(sock) < (entry.kind === 'musket' ? 0.6 : 0.45);
    const visible = !box.empty && info && mesh3.parent === info.socket;
    if (!visible) failures.push(outfit + ' 3p ' + entry.name + ' not visible in the socket');
    if (sz) failures.push(outfit + ' 3p ' + entry.name + ' ' + sz);
    if (!fw.ok) failures.push(outfit + ' 3p ' + entry.name + ' not forward (dx=' + fw.dx.toFixed(3) + ' dz=' + fw.dz.toFixed(3) + ')');
    if (!mat) failures.push(outfit + ' 3p ' + entry.name + ' material mismatch (' + entry.mat + ')');
    if (!inHand) failures.push(outfit + ' 3p ' + entry.name + ' not in the hand (d=' + (sock && box.center.distanceTo(sock).toFixed(3)) + ')');

    // First person: same catalog, same socket pose, on the new character arms.
    const mesh1 = makeStandin(entry);
    H.applyFpIk(fpView, (entry.kind === 'pistol' || entry.kind === 'musket' || entry.kind === 'map') ? entry.kind : 'pickaxe');
    const fpInfo = H.poseHeldFp(fpView, mesh1, entry.kind, entry.id);
    fpView.updateMatrixWorld(true);
    const box1 = aabb(mesh1);
    const sz1 = sizeOk(entry, box1, mesh1);
    const fw1 = forwardOk(entry, mesh1, (fpInfo && fpInfo.socket) || fpView);
    const mat1 = materialOk(entry, box1);
    const camPos = mesh1.getWorldPosition(new T.Vector3());
    const inFront = !box1.empty && camPos.z < 0.05; // camera looks down -Z; socket is in front after Y180 + IK
    const vis1 = !box1.empty && fpInfo && (fpInfo.skipped === 'viewmodel' || mesh1.parent === fpInfo.socket);
    if (fpInfo && fpInfo.skipped === 'viewmodel') continue;
    if (!vis1) failures.push(outfit + ' 1p ' + entry.name + ' not visible in the FP socket');
    if (sz1) failures.push(outfit + ' 1p ' + entry.name + ' ' + sz1);
    if (!fw1.ok) failures.push(outfit + ' 1p ' + entry.name + ' not forward (dx=' + fw1.dx.toFixed(3) + ' dz=' + fw1.dz.toFixed(3) + ')');
    if (!mat1) failures.push(outfit + ' 1p ' + entry.name + ' material mismatch (' + entry.mat + ')');
    if (!inFront) failures.push(outfit + ' 1p ' + entry.name + ' not in front of the camera (z=' + (box1.empty ? 'empty' : camPos.z.toFixed(3)) + ')');
  }
}
ok(H.CATALOG.length >= 40, 'catalog iterates ' + H.CATALOG.length + ' holdable tools/items');
ok(failures.length === 0, failures.length ? ('all holdables ok in 1p and 3p, both outfits: ' + failures.slice(0, 8).join(' | ')) : 'all ' + H.CATALOG.length + ' holdables pass visibility, scale, forward orientation and material in first and third person on both outfits');
if (failures.length) {
  for (const f of failures) console.log('fail ' + f);
}

// FP arm source still comes from the new character, including armour and swim.
const fpBase = H.buildFpArms(models.base.userData.pilot.near.root);
const mats = new Set();
fpBase.traverse(o => { if (o.isMesh && o.visible) for (const m of [].concat(o.material || [])) if (m && m.name) mats.add(m.name); });
ok([...mats].some(n => /Linen|HeadSkin|eee6d6|Skin/i.test(n)), 'FP arm materials come from the new character (linen sleeve or skin), not the old beige box palette');
const fpArmour = H.buildFpArms(models.armour.userData.pilot.near.root);
H.setArmourArms(fpArmour, true);
const aMats = new Set(), aNames = new Set();
fpArmour.traverse(o => {
  if ((o.isMesh || o.isSkinnedMesh) && o.visible) {
    aNames.add(o.name || (o.parent && o.parent.name) || '');
    for (const m of [].concat(o.material || [])) if (m && m.name) aMats.add(m.name);
  }
});
ok([...aNames].some(n => /gear_chest_slot/.test(n)) && [...aMats].some(n => /ArmorTintable|Crystal_/i.test(n)), 'armoured FP arms include crystal vambrace/gauntlet materials');
H.applyFpIk(fpView, 'swim', 0.5);
ok(H.fpKind === 'swim', 'the same new arms are used for the swimming pose');
ok(helper.includes('hideProceduralFp'), 'procedural beige FPA and swim boxes are hidden once the new arms are on');

console.log('PASS ' + n + ' held-item (all tools/items, 1p+3p) and first-person arm checks');

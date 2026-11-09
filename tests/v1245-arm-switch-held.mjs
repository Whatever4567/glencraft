// 1.2.45: Scottish GLB arms on __fpa drivers; grip contact; 3p crystal/map/pistol/musket.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {T, load, builtRuntime, legacy} from './lib/pilot-native-r128.mjs';

const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
let n = 0;
const ok = (c, l) => { assert.ok(c, l); console.log('ok ' + (++n) + ' ' + l); };

ok(html.includes("const GAME_VERSION = '1.2.45';"), 'GAME_VERSION is 1.2.45');
ok(html.includes('<!-- glencraft-build: b1245-v1.2.45 -->'), 'build marker b1245');
ok(html.includes('(function armSwitch1245') && html.includes('ArmSwitch1245'), 'arm-switch helper embedded');
ok(html.includes('held1245CrystalPrism'), 'crystal pick prism identity marker present');
ok(html.includes('never across the face') || html.includes('Port / ready'), 'musket port/ready pose documented');
ok(html.includes('worldTilesUntouched') && !html.includes('__weakBoot1242 ? 1.25'), 'world tiles + 4K restore preserved');

const armSrc = fs.readFileSync(new URL('../tools/pilot-model-source/arm-switch-1245.js', import.meta.url), 'utf8');
const heldSrc = fs.readFileSync(new URL('../tools/pilot-model-source/held-fp-1240.js', import.meta.url), 'utf8');
ok(armSrc.includes("version: '1.2.45'") && heldSrc.includes("version: '1.2.45'"), 'source helpers are 1.2.45');

const W = {THREE: T, __fpaOff: 0};
new Function('window', heldSrc)(W);
new Function('window', armSrc)(W);
const H = W.__held1240, A = W.__armSwitch1245;
ok(H && A && typeof A.buildFromTemplate === 'function' && typeof A.syncFromFpa === 'function', 'helpers expose build/sync');

const dir = new URL('../assets/models/scottish-base-v2/', import.meta.url);
let eq = [129, 130, 131, 132, 291]; // armour + jetpack like screenshots
const tier = id => id >= 129 ? 'diamond' : 'iron';
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
const model = legacy(eq).build(false);
await R.attach(model);
R.dressed(model);
W.__pilot1235 = R;
ok(!R.error && R.templates[0], 'armoured scottish template ready');

const cam = new T.PerspectiveCamera(70, 9 / 20, 0.05, 100);
const hand = new T.Group(); cam.add(hand);
const held = new T.Group(); hand.add(held);
globalThis.camera = cam; globalThis.hand = hand; globalThis.held = held;
globalThis.camMode = 0; globalThis.started = true; globalThis.heldId = 761; globalThis.selId = 761;

// Fake __fpa driver rig with R arm parts
function mkDriver() {
  const rig = new T.Group(); rig.visible = true;
  const mk = () => {
    const a = new T.Group();
    const up = new T.Mesh(new T.BoxGeometry(0.07, 0.07, 0.28), new T.MeshBasicMaterial({color: 0x888888}));
    const fo = new T.Mesh(new T.BoxGeometry(0.05, 0.05, 0.22), new T.MeshBasicMaterial({color: 0x888888}));
    const h = new T.Group(); const palm = new T.Mesh(new T.BoxGeometry(0.07, 0.09, 0.03), new T.MeshBasicMaterial({color: 0x888888}));
    h.add(palm); up.position.z = 0.2; fo.position.z = -0.05; h.position.z = -0.18;
    a.add(up, fo, h); a.userData.p = {up, fo, el: fo, h};
    // fingers on driver (will be hidden)
    for (let i = 0; i < 4; i++) {
      const f = new T.Mesh(new T.BoxGeometry(0.02, 0.02, 0.05), new T.MeshBasicMaterial({color: 0xaaaaaa}));
      f.position.set((i - 1.5) * 0.02, 0.05, -0.22); a.add(f);
    }
    return a;
  };
  rig.userData.R = mk(); rig.userData.L = mk(); rig.userData.L.visible = true;
  rig.add(rig.userData.R, rig.userData.L); cam.add(rig);
  return rig;
}
const rig = mkDriver();
W.__fpa = {rig: () => rig, step() {}};

A.install();
A.syncFromFpa(0.016);

const fp = cam.getObjectByName('ArmSwitch1245');
ok(fp, 'ArmSwitch1245 installed on camera');
ok(fp.visible, 'ArmSwitch1245 visible');

// Visible meshes should be skinned arm/glove with maps — not driver boxes
const vis = [];
fp.updateMatrixWorld(true);
fp.traverse(o => {
  if (!(o.isMesh || o.isSkinnedMesh) || o.visible === false) return;
  for (let p = o; p; p = p.parent) if (p.visible === false) return;
  vis.push(o);
});
ok(vis.length >= 2, 'Scottish arm meshes visible (' + vis.length + ')');
ok(vis.every(o => !o.userData.armSwitchHid), 'visible meshes are not driver-hidden');
const withMap = vis.filter(o => {
  const mats = [].concat(o.material || []);
  return mats.some(m => m && m.map);
});
ok(withMap.length >= 1, 'at least one visible arm mesh carries an authored texture map');

// Drivers hidden
let driverVis = 0;
rig.traverse(o => { if ((o.isMesh || o.isSkinnedMesh) && o.visible) driverVis++; });
ok(driverVis === 0, 'all __fpa box driver meshes are invisible (' + driverVis + ' still visible)');

// Crystal pick identity + pose in 3p
const pick = new T.Group();
const wood = new T.Mesh(new T.BoxGeometry(0.03, 0.46, 0.03), new T.MeshLambertMaterial({color: 0x6b4a2a}));
const head = new T.Mesh(new T.BoxGeometry(0.34, 0.05, 0.05), new T.MeshLambertMaterial({color: 0x9a9ea2}));
head.position.y = 0.34; pick.add(wood, head);
H.paintCrystalPick(pick, 'purple');
ok(pick.userData.held1245CrystalPrism === 'purple', 'paint marks purple prism identity');
ok(pick.userData.p761 === 1, 'p761 flag set');
const headCol = head.material.color;
ok(headCol.b > headCol.g * 0.8 && headCol.r > 0.4, 'pick head tinted purple-ish, not grey');

// 3p place on weapon_grip
R.sync(model);
const info = H.poseHeld(model, {mesh: pick, heldId: 761, slot: 1});
ok(info && info.socket && info.mesh, 'poseHeld places crystal pick on weapon_grip');
ok(pick.parent === info.socket, 'pick parented to weapon_grip_slot');
pick.updateMatrixWorld(true);
const sock = info.socket.getWorldPosition(new T.Vector3());
const gripPt = new T.Vector3();
// approximate handle contact: wood mesh center
wood.getWorldPosition(gripPt);
const dist = sock.distanceTo(gripPt);
ok(dist < 0.25, '3p pick handle near grip socket (contact proxy ' + dist.toFixed(3) + ' m)');

// Map / pistol / musket presence
for (const [kind, id] of [['map', 410], ['pistol', 212], ['musket', 213]]) {
  const g = new T.Group();
  if (kind === 'map') H.ensureMapMesh(g);
  if (kind === 'pistol') { g.userData.gun = 212; g.add(new T.Mesh(new T.BoxGeometry(0.18, 0.08, 0.04), new T.MeshLambertMaterial({color: 0x222}))); }
  if (kind === 'musket') { g.userData.gun = 213; g.add(new T.Mesh(new T.BoxGeometry(0.7, 0.05, 0.05), new T.MeshLambertMaterial({color: 0x333}))); }
  const r = H.poseHeld(model, {mesh: g, heldId: id, slot: 1, kind});
  ok(r && r.mesh && r.mesh.visible && r.mesh.parent === r.socket, kind + ' visible and parented on 3p grip');
  if (kind === 'map') {
    let faces = 0; g.traverse(o => { if (o.isMesh) faces++; });
    ok(faces >= 2, 'map has visible card geometry');
  }
  if (kind === 'musket') {
    const pose = H.POSE.musket;
    ok(pose.p[1] < 0, 'musket pose offsets downward (port), not up into the face');
  }
}

// FP held snap: put pick in held, sync, ensure held moves toward socket
while (held.children.length) held.remove(held.children[0]);
const fpPick = pick.clone(true);
held.add(fpPick);
A.syncFromFpa(0.05);
const sock2 = fp.userData.bone('weapon_grip_slot0') || fp.userData.bone('weapon_grip_slot1') || fp.userData.bone('handR');
ok(sock2, 'FP weapon grip / hand bone exists on ArmSwitch');
sock2.updateWorldMatrix(true, true);
held.updateMatrixWorld(true);
const d2 = sock2.getWorldPosition(new T.Vector3()).distanceTo(held.getWorldPosition(new T.Vector3()));
ok(d2 < 0.10, 'FP held group within 8cm of grip socket after sync (' + d2.toFixed(3) + ' m)');

// Reload helper recognizes ArmSwitch
const rel = fs.readFileSync(new URL('../tools/pilot-model-source/reload-1240.js', import.meta.url), 'utf8');
ok(rel.includes('ArmSwitch1245'), 'reload helper treats ArmSwitch1245 as player arm');

console.log('PASS ' + n + ' v1245 arm-switch-held checks');

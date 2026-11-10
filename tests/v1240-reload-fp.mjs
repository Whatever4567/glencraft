// 1.2.40: first-person musket/pistol reload — no extra arm, no 360° flip
// (max angular step / shortest-path slerp), reload props stay small.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {T} from './lib/pilot-native-r128.mjs';

const file = process.argv[2] || 'index.html';
const html = fs.readFileSync(file, 'utf8');
let n = 0;
const ok = (c, label) => { assert.ok(c, label); console.log('ok ' + (++n) + ' ' + label); };

ok(html.includes("const GAME_VERSION = '1.2.56';") || html.includes("const GAME_VERSION = '1.2.55';") || html.includes("const GAME_VERSION = '1.2.54';") || html.includes("const GAME_VERSION = '1.2.53';") || html.includes("const GAME_VERSION = '1.2.52';") || html.includes("const GAME_VERSION = '1.2.51';") || html.includes("const GAME_VERSION = '1.2.50';") || html.includes("const GAME_VERSION = '1.2.49';") || html.includes("const GAME_VERSION = '1.2.48';") || html.includes("const GAME_VERSION = '1.2.47';") || html.includes("const GAME_VERSION = '1.2.46';") || html.includes("const GAME_VERSION = '1.2.44';") || html.includes("const GAME_VERSION = '1.2.42';") || html.includes("const GAME_VERSION = '1.2.40';"), 'GAME_VERSION is 1.2.46+');
ok(html.includes('__heldReload1240') && html.includes('slerpToward') && html.includes('MAX_PROP_R'), 'reload fixer is in the built index');
ok(html.includes('no duplicate arm') && html.includes('no 360') && html.includes('huge sphere'), 'patch notes cover musket flip / duplicate arm and the pistol sphere');
ok(html.includes('Held1240FpArms') && html.includes('setArmourArms'), 'gear-matching first-person arms stay in the build');

const helper = fs.readFileSync(new URL('../tools/pilot-model-source/reload-1240.js', import.meta.url), 'utf8');
const W = {THREE: T, __c43rf: 0};
new Function('window', 'THREE', 'camera', 'updateHand', 'updatePlayer', helper)(W, T, undefined, undefined, undefined);
const U = W.__heldReload1240;
ok(U && typeof U.slerpToward === 'function' && typeof U.clampProp === 'function', 'helper exposes slerp, clamp, and arm tools');
ok(U.MAX_ANG > 0 && U.MAX_ANG < Math.PI / 2, 'max angular step is a tight per-frame cap, not a half-turn');
ok(U.MAX_PROP_R > 0 && U.MAX_PROP_R < 0.25, 'reload-prop radius cap is smaller than a screen-filling orb');

// --- continuous rotation, no ±π flip ---
{
  const obj = new T.Object3D();
  obj.rotation.set(-0.5, 0, 0.35);
  obj.quaternion.setFromEuler(obj.rotation);
  U.slerpToward(obj, 0.016); // seed previous display pose
  const prev = obj.quaternion.clone();
  // A nearly-π backward flip in one frame — the musket briefly points at the camera.
  obj.rotation.set(-0.5 + Math.PI * 0.95, 0, 0.35);
  obj.quaternion.setFromEuler(obj.rotation);
  const raw = prev.angleTo(obj.quaternion);
  U.slerpToward(obj, 0.016);
  const step = prev.angleTo(obj.quaternion);
  ok(raw > Math.PI * 0.6, 'the unfixed pose jump is a large wrap (raw=' + raw.toFixed(3) + ')');
  ok(step > 0.2 && step <= U.MAX_ANG * 1.05 + 1e-6, 'one-frame rotation after a wrap is clamped to MAX_ANG (step=' + step.toFixed(3) + ')');
  ok(step < Math.PI * 0.9, 'the clamped step is not a half-turn flip');
}

{
  // Production bug: Euler interpolation walks the long way from a mid-reload dip
  // back to idle (a full backward 360° that points at the camera). We remember
  // idle and slerp the short path with a max angular step.
  const obj = new T.Object3D();
  const idle = new T.Euler(0.05, 0, 0);
  obj.rotation.copy(idle);
  obj.quaternion.setFromEuler(obj.rotation);
  U.rememberIdle(obj);
  U.slerpToward(obj, 0.016);
  obj.rotation.set(-0.55, 0.08, 0.5);
  obj.quaternion.setFromEuler(obj.rotation);
  U.slerpToward(obj, 0.016);
  let maxStep = 0, flipped = 0, pointedAtCamera = 0;
  const qPrev = obj.quaternion.clone();
  const qIdle = new T.Quaternion().setFromEuler(idle);
  let total = 0;
  for (let i = 0; i < 90; i++) {
    // Buggy long-path Euler: from -0.55 the long way around to 0.05 (~5.86 rad).
    const t = Math.min(1, (i + 1) / 40);
    const longX = -0.55 + t * (Math.PI * 2 - 0.55 + 0.05);
    obj.rotation.set(longX, 0.08 * (1 - t), 0.5 * (1 - t));
    obj.quaternion.setFromEuler(obj.rotation);
    U.slerpToIdle(obj, 0.016);
    const a = qPrev.angleTo(obj.quaternion);
    if (a > maxStep) maxStep = a;
    if (a > U.MAX_ANG * 1.05) flipped++;
    total += a;
    // Barrel +Z in viewmodel should not swing around to face the camera (+Z).
    const fwd = new T.Vector3(0, 0, 1).applyQuaternion(obj.quaternion);
    if (fwd.z < -0.35 && i > 4) pointedAtCamera++;
    qPrev.copy(obj.quaternion);
  }
  const leftover = obj.quaternion.angleTo(qIdle);
  ok(flipped === 0 && maxStep <= U.MAX_ANG * 1.05 + 1e-6,
     'reload-to-idle is a continuous short-path rotation (max step ' + maxStep.toFixed(3) + ' rad, flips ' + flipped + ')');
  ok(total > 0.2 && total < Math.PI && leftover < 0.2,
     'the path taken is the short arc, not a 360° flip (total ' + total.toFixed(3) + ', leftover ' + leftover.toFixed(3) + ')');
  ok(pointedAtCamera === 0, 'the musket never points at the camera on the way back to idle');
}

// --- no extra arm during reload ---
{
  const cam = new T.PerspectiveCamera(70, 16 / 9, 0.05, 50);
  const arms = new T.Group(); arms.name = 'Held1240FpArms';
  const sleeve = new T.Mesh(new T.BoxGeometry(0.08, 0.3, 0.08), new T.MeshStandardMaterial({color: 0xe8d9b8}));
  sleeve.name = 'visual_arm_slot0';
  const gauntlet = new T.Mesh(new T.BoxGeometry(0.09, 0.12, 0.09), new T.MeshStandardMaterial({color: 0x88c8e8}));
  gauntlet.name = 'gear_chest_slot0_1';
  arms.add(sleeve, gauntlet);
  cam.add(arms);
  const extra = new T.Group(); extra.name = 'GLX-FPA'; extra.userData.held1240ExtraArm = 1;
  const striped = new T.Mesh(new T.CylinderGeometry(0.05, 0.05, 0.4, 8), new T.MeshStandardMaterial({color: 0xaa2020}));
  striped.name = 'striped-sleeve';
  extra.add(striped);
  cam.add(extra);
  ok(U.countArmRoots(cam) >= 1, 'official first-person arms are present before the cleanup');
  const hid = U.hideExtraArms(cam);
  ok(hid >= 1 && extra.visible === false, 'the leftover / striped duplicate arm is hidden (' + hid + ')');
  ok(arms.visible !== false && sleeve.visible !== false, 'the player own arm stays visible');
}

// --- reload prop stays below a scale / screen-size threshold ---
{
  const cam = new T.PerspectiveCamera(70, 9 / 16, 0.05, 50);
  cam.position.set(0, 0, 0);
  const held = new T.Group(); held.name = 'held';
  cam.add(held);
  const sphere = new T.Mesh(new T.SphereGeometry(0.55, 16, 12), new T.MeshStandardMaterial({color: 0x1a1a1a, metalness: 0.8, roughness: 0.2}));
  sphere.name = 'reload-ball';
  sphere.position.set(0, -0.05, -0.2);
  held.add(sphere);
  cam.updateMatrixWorld(true);
  const before = U.worldRadius(sphere);
  ok(before > 0.4, 'the unfixed pistol sphere is huge (r=' + before.toFixed(3) + ')');
  U.clampProp(sphere);
  const after = U.worldRadius(sphere);
  ok(after <= U.MAX_PROP_R * 1.05, 'clamped reload prop is at most MAX_PROP_R (r=' + after.toFixed(3) + ')');
  // Projected screen size: radius / |z| should be well under half the frame.
  sphere.updateMatrixWorld(true);
  const z = Math.abs(sphere.getWorldPosition(new T.Vector3()).z) || 0.2;
  const ndcR = after / z; // rough, compared to tan(fov/2) ≈ 0.7
  ok(ndcR < 0.7, 'projected prop size stays below a half-screen threshold (ndcR=' + ndcR.toFixed(3) + ')');
}

{
  // Magazine baked-scale loss: a unit-scale metal orb instead of 0.0536.
  const g = new T.Group();
  const mag = new T.Mesh(new T.SphereGeometry(1, 12, 8), new T.MeshStandardMaterial({color: 0x222222, metalness: 1, roughness: 0.15}));
  mag.scale.setScalar(1);
  g.userData = {gun: 1, rig: new T.Object3D(), mag};
  g.add(g.userData.rig, mag);
  const held = new T.Group(); held.add(g);
  const cam = new T.PerspectiveCamera(70, 1, 0.05, 20);
  cam.add(held);
  W.camera = cam;
  W.held = held;
  W.__c43rf = 0.72;
  U.step(0.016);
  const r = U.worldRadius(mag);
  ok(r <= U.MAX_PROP_R * 1.05, 'a lost-scale magazine / ball is clamped in viewmodel space (r=' + r.toFixed(3) + ', clamped=' + U.clamped + ')');
  W.__c43rf = 0;
}

ok(!U.err, 'reload helper ran without error' + (U.err ? ': ' + U.err : ''));

console.log('PASS ' + n + ' v1240 reload checks');

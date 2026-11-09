// 1.2.45 CPU contact sheet — 9:20 portrait, ArmSwitch GLB arms + held items.
import fs from 'node:fs';
import {createRequire} from 'node:module';
import {T, load, builtRuntime, legacy} from '../tests/lib/pilot-native-r128.mjs';
const {createCanvas} = createRequire('/workspace/qa/tools/index.js')('@napi-rs/canvas');

const OUT = process.argv[2] || '/workspace/qa/held-1245';
fs.mkdirSync(OUT, {recursive: true});

const heldSrc = fs.readFileSync(new URL('./pilot-model-source/held-fp-1240.js', import.meta.url), 'utf8');
const armSrc = fs.readFileSync(new URL('./pilot-model-source/arm-switch-1245.js', import.meta.url), 'utf8');
const W = {THREE: T, __fpaOff: 0};
new Function('window', heldSrc)(W);
new Function('window', armSrc)(W);
const H = W.__held1240, A = W.__armSwitch1245;

const dir = new URL('../assets/models/scottish-base-v2/', import.meta.url);
let eq = [129, 130, 131, 132, 291];
const R = builtRuntime({
  scottish: true, life: false, equipment: () => eq,
  tier: id => id >= 129 ? 'diamond' : 'iron', distance: () => 0,
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
await R.attach(model); R.dressed(model); R.sync(model);
W.__pilot1235 = R;

function makeTool(kind) {
  const g = new T.Group();
  const wood = new T.MeshPhongMaterial({color: 0x6b4a2a});
  if (kind === 'pickaxe' || kind === 'p761') {
    const h = new T.Mesh(new T.BoxGeometry(0.03, 0.48, 0.03), wood); h.position.y = 0.12; g.add(h);
    const head = new T.Mesh(new T.BoxGeometry(0.28, 0.045, 0.045), new T.MeshPhongMaterial({color: 0x9a9ea2}));
    head.position.y = 0.34; g.add(head);
    if (kind === 'p761') H.paintCrystalPick(g, 'purple');
    g.userData.tool = true; g.userData.kind = 'pick';
  } else if (kind === 'sword') {
    const blade = new T.Mesh(new T.BoxGeometry(0.04, 0.42, 0.014), new T.MeshPhongMaterial({color: 0xdfe3e8}));
    blade.position.y = 0.28; g.add(blade);
    const grip = new T.Mesh(new T.BoxGeometry(0.03, 0.12, 0.03), wood); grip.position.y = -0.02; g.add(grip);
    g.userData.tool = true; g.userData.kind = 'sword';
  } else if (kind === 'torch') {
    const st = new T.Mesh(new T.CylinderGeometry(0.015, 0.018, 0.28, 8), wood); st.position.y = 0.08; g.add(st);
    const flame = new T.Mesh(new T.SphereGeometry(0.04, 8, 8), new T.MeshPhongMaterial({color: 0xffaa33, emissive: 0xff6600}));
    flame.position.y = 0.24; g.add(flame); g.userData.torch = 1;
  } else if (kind === 'bucket') {
    g.add(new T.Mesh(new T.CylinderGeometry(0.08, 0.06, 0.12, 12), wood));
    const bail = new T.Mesh(new T.TorusGeometry(0.07, 0.008, 6, 12, Math.PI), new T.MeshPhongMaterial({color: 0x888}));
    bail.rotation.x = Math.PI; bail.position.y = 0.06; g.add(bail); g.userData.bucket = 1;
  } else if (kind === 'map') {
    H.ensureMapMesh(g);
  } else if (kind === 'pistol') {
    g.add(new T.Mesh(new T.BoxGeometry(0.16, 0.07, 0.035), new T.MeshPhongMaterial({color: 0x2a2a2a})));
    g.userData.gun = 212;
  } else if (kind === 'musket') {
    g.add(new T.Mesh(new T.BoxGeometry(0.75, 0.04, 0.04), new T.MeshPhongMaterial({color: 0x3a2a1a})));
    g.userData.gun = 213;
  }
  return g;
}

function mkFpa(cam, two) {
  const rig = new T.Group(); rig.visible = true;
  // Match real __fpa: shoulder at arm root, el/fo at elbow, h at hand (LU=0.38, LF=0.36).
  const mk = (side) => {
    const a = new T.Group();
    a.position.set(side * 0.20, -0.30, -0.18);
    const mat = new T.MeshBasicMaterial({color: 0x777});
    const up = new T.Mesh(new T.BoxGeometry(0.06, 0.06, 0.06), mat);
    const el = new T.Mesh(new T.BoxGeometry(0.05, 0.05, 0.05), mat);
    const fo = new T.Mesh(new T.BoxGeometry(0.05, 0.05, 0.05), mat);
    const h = new T.Group();
    // Rest reach roughly along -Z / slightly down (camera space).
    const E = new T.Vector3(side * 0.04, -0.12, -0.32);
    const Ht = new T.Vector3(side * 0.02, -0.18, -0.58);
    up.position.set(0, 0, 0);
    el.position.copy(E); fo.position.copy(E); h.position.copy(Ht);
    a.add(up, el, fo, h);
    a.userData.p = {up, el, fo, h};
    a.visible = true;
    return a;
  };
  rig.userData.R = mk(1); rig.userData.L = mk(-1); rig.userData.L.visible = !!two;
  rig.add(rig.userData.R, rig.userData.L); cam.add(rig);
  return rig;
}

function skinVertex(o, ia, out /* Vector3 */) {
  const pos = o.geometry.attributes.position;
  const skinIndex = o.geometry.attributes.skinIndex;
  const skinWeight = o.geometry.attributes.skinWeight;
  out.fromBufferAttribute(pos, ia);
  if (!o.isSkinnedMesh || !skinIndex || !skinWeight || !o.skeleton) {
    return out.applyMatrix4(o.matrixWorld);
  }
  const bind = o.bindMatrix;
  const bx = out.clone().applyMatrix4(bind);
  const acc = new T.Vector3();
  const si = skinIndex.array, sw = skinWeight.array, item = skinIndex.itemSize;
  const bones = o.skeleton.bones, inv = o.skeleton.boneInverses;
  // boneMats cached on mesh for this frame
  let mats = o.userData._skinMats;
  if (!mats) {
    mats = o.userData._skinMats = [];
    for (let i = 0; i < bones.length; i++) {
      mats[i] = new T.Matrix4().multiplyMatrices(bones[i].matrixWorld, inv[i]);
    }
  }
  for (let k = 0; k < 4; k++) {
    const bi = si[ia * item + k];
    const w = sw[ia * item + k];
    if (!w) continue;
    acc.addScaledVector(bx.clone().applyMatrix4(mats[bi]), w);
  }
  return out.copy(acc);
}

function tintOf(o) {
  const col = (o.material && o.material.color) ? o.material.color : new T.Color(0x888);
  let r = col.r, g = col.g, b = col.b;
  const mn = (o.material && o.material.name) || '';
  const on = o.name || '';
  if (r > 0.95 && g > 0.95 && b > 0.95) {
    if (/Linen|eee6d6|GLOVE/i.test(mn + on)) { r = 0.89; g = 0.86; b = 0.8; }
    else if (/Skin|HeadSkin/i.test(mn + on)) { r = 0.71; g = 0.51; b = 0.38; }
    else if (/crystal|purple|a64/i.test(mn + on)) { r = 0.65; g = 0.3; b = 1; }
  }
  // Heuristic: articulated finger_0 (no _1) ≈ hand skin; _1 ≈ sleeve linen
  if (/GLOVE_.*finger_0$/.test(on) || /GLOVE_.*finger_0_0/.test(on)) { r = 0.72; g = 0.52; b = 0.4; }
  if (/GLOVE_.*finger_0_1/.test(on)) { r = 0.9; g = 0.87; b = 0.8; }
  if (/held1245CrystalPrism|crystal/i.test(on + mn)) { r = 0.55; g = 0.25; b = 0.95; }
  return {r, g, b};
}

function renderSoft(root, view, w, h, label) {
  const canvas = createCanvas(w, h);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#1a2228'; ctx.fillRect(0, 0, w, h);
  const light = new T.Vector3(0.35, 0.85, 0.45).normalize();
  const tris = [];
  root.updateMatrixWorld(true);
  // Invalidate skin mat caches then rebuild once per skinned mesh
  root.traverse(o => {
    if (o.isSkinnedMesh && o.skeleton) {
      o.skeleton.update();
      o.userData._skinMats = null;
    }
  });
  root.traverse(o => {
    if (!(o.isMesh || o.isSkinnedMesh) || o.visible === false) return;
    for (let p = o; p; p = p.parent) if (p.visible === false) return;
    const geo = o.geometry; if (!geo) return;
    const pos = geo.attributes.position; if (!pos) return;
    const {r, g, b} = tintOf(o);
    const idx = geo.index;
    const A = new T.Vector3(), B = new T.Vector3(), C = new T.Vector3();
    const emit = (ia, ib, ic) => {
      skinVertex(o, ia, A);
      skinVertex(o, ib, B);
      skinVertex(o, ic, C);
      const nrm = new T.Vector3().subVectors(B, A).cross(new T.Vector3().subVectors(C, A));
      if (nrm.lengthSq() < 1e-12) return; nrm.normalize();
      const nd = Math.max(0.22, nrm.dot(light));
      const pts = [A, B, C].map(v => {
        const p = v.clone().project(view);
        return [(p.x * 0.5 + 0.5) * w, (-p.y * 0.5 + 0.5) * h, p.z];
      });
      // discard if all behind or outside NDC deeply
      if (pts.every(p => p[2] < -1 || p[2] > 1)) return;
      if (pts.every(p => p[0] < -w || p[0] > 2 * w || p[1] < -h || p[1] > 2 * h)) return;
      const area = (pts[1][0] - pts[0][0]) * (pts[2][1] - pts[0][1]) - (pts[2][0] - pts[0][0]) * (pts[1][1] - pts[0][1]);
      if (area >= 0) return; // backface
      tris.push({
        pts,
        z: (pts[0][2] + pts[1][2] + pts[2][2]) / 3,
        r: Math.min(255, (r * 255 * nd) | 0),
        g: Math.min(255, (g * 255 * nd) | 0),
        b: Math.min(255, (b * 255 * nd) | 0)
      });
    };
    if (idx) for (let i = 0; i < idx.count; i += 3) emit(idx.getX(i), idx.getX(i + 1), idx.getX(i + 2));
    else for (let i = 0; i < pos.count; i += 3) emit(i, i + 1, i + 2);
  });
  tris.sort((a, b) => b.z - a.z);
  for (const t of tris) {
    ctx.beginPath();
    ctx.moveTo(t.pts[0][0], t.pts[0][1]);
    ctx.lineTo(t.pts[1][0], t.pts[1][1]);
    ctx.lineTo(t.pts[2][0], t.pts[2][1]);
    ctx.closePath();
    ctx.fillStyle = `rgb(${t.r},${t.g},${t.b})`;
    ctx.fill();
  }
  ctx.fillStyle = '#e8f0ff'; ctx.font = 'bold 20px system-ui'; ctx.fillText(label, 16, 28);
  ctx.fillStyle = '#9bb3c9'; ctx.font = '14px system-ui'; ctx.fillText('1.2.45 CPU · 9:20 · not GPU', 16, h - 16);
  return canvas;
}

const Wpx = 360, Hpx = 800; // 9:20
const cells = [];

// FP panels — true first-person camera looking -Z
for (const [kind, two, aim] of [
  ['p761', false, false], ['bucket', false, false], ['torch', false, false], ['map', false, false],
  ['sword', false, false], ['musket', true, false], ['musket', true, true],
  ['pistol', true, false], ['pistol', true, true]
]) {
  const cam = new T.PerspectiveCamera(70, 9 / 20, 0.05, 50);
  const hand = new T.Group(); cam.add(hand);
  const held = new T.Group(); hand.add(held);
  globalThis.camera = cam; globalThis.hand = hand; globalThis.held = held;
  globalThis.camMode = 0; globalThis.started = true;
  globalThis.heldId = kind === 'p761' ? 761 : kind === 'map' ? 410 : kind === 'pistol' ? 212 : kind === 'musket' ? 213 : 0;
  const rig = mkFpa(cam, two);
  if (aim) {
    const raise = (arm, side) => {
      const p = arm.userData.p;
      p.el.position.set(side * 0.03, -0.02, -0.28);
      p.fo.position.copy(p.el.position);
      p.h.position.set(side * 0.02, -0.04, -0.42);
    };
    raise(rig.userData.R, 1);
    if (rig.userData.L.visible) raise(rig.userData.L, -1);
  }
  W.__fpa = {rig: () => rig, step() {}};
  const tool = makeTool(kind);
  held.add(tool);
  // prepareItem if available (crystal prism etc.)
  try {
    if (H && H.prepareItem) H.prepareItem(tool, globalThis.heldId, kind === 'p761' ? 'p761' : kind);
    else if (H && H.poseHeld) { /* FP uses snap via ArmSwitch */ }
  } catch (_) {}
  A.fp = null;
  const old = cam.getObjectByName('ArmSwitch1245'); if (old) cam.remove(old);
  A.syncFromFpa(0.016); A.syncFromFpa(0.016); A.syncFromFpa(0.016);
  // Hide opposite-side glove meshes when L driver off
  const fp = cam.getObjectByName('ArmSwitch1245');
  if (fp && !two) {
    fp.traverse(o => {
      if ((o.isMesh || o.isSkinnedMesh) && /GLOVE_\|_L_/.test(o.name || '')) o.visible = false;
    });
  }
  // View = the FP camera itself (cam at origin looking -Z)
  const view = new T.PerspectiveCamera(70, 9 / 20, 0.05, 50);
  // Slight downward bias so the switchover arm + held item fill the lower half
  // like a phone FP screenshot (still camera-origin FP, not a third-person peek).
  view.position.set(0, 0.02, 0.04);
  view.lookAt(0.04, -0.22, -0.45);
  view.updateMatrixWorld(true);
  const label = 'FP ' + kind + (aim ? ' AIM' : (two ? ' hip' : ''));
  const c = renderSoft(cam, view, Wpx, Hpx, label);
  const file = `${OUT}/fp-${kind}${aim ? '-aim' : ''}.png`;
  fs.writeFileSync(file, c.toBuffer('image/png'));
  cells.push({file, label, canvas: c});
  console.log('wrote', file, 'tris~');
}

// 3p panels
for (const kind of ['p761', 'map', 'pistol', 'musket']) {
  const tool = makeTool(kind);
  H.poseHeld(model, {mesh: tool, heldId: kind === 'p761' ? 761 : kind === 'map' ? 410 : kind === 'pistol' ? 212 : 213, slot: 1, kind: kind === 'p761' ? 'p761' : kind});
  model.updateMatrixWorld(true);
  const view = new T.PerspectiveCamera(35, 9 / 20, 0.05, 50);
  view.position.set(0.9, 1.4, 1.8); view.lookAt(0, 1.0, 0);
  view.updateMatrixWorld(true);
  const c = renderSoft(model, view, Wpx, Hpx, '3p ' + kind + ' armour');
  const file = `${OUT}/tp-${kind}.png`;
  fs.writeFileSync(file, c.toBuffer('image/png'));
  cells.push({file, label: '3p ' + kind, canvas: c});
  console.log('wrote', file);
}

const cols = 4, rows = Math.ceil(cells.length / cols);
const sheet = createCanvas(cols * Wpx, rows * Hpx);
const sctx = sheet.getContext('2d');
sctx.fillStyle = '#0e1418'; sctx.fillRect(0, 0, sheet.width, sheet.height);
cells.forEach((c, i) => {
  const x = (i % cols) * Wpx, y = Math.floor(i / cols) * Hpx;
  sctx.drawImage(c.canvas, x, y);
});
fs.writeFileSync(`${OUT}/contact-sheet.png`, sheet.toBuffer('image/png'));
fs.writeFileSync(`${OUT}/SHEET.txt`, [
  '1.2.45 contact sheet (CPU diffuse+skinning, 9:20 portrait FP framing).',
  'FP: pickaxe, bucket, torch, map, sword, musket hip/aim, pistol hip/aim.',
  '3p armour: pickaxe, map, pistol, musket.',
  'ArmSwitch1245 = Scottish GLB arms IK-driven from __fpa hand targets; boxes hidden.',
  'Not a GPU/device capture.'
].join('\n'));
console.log('sheet', `${OUT}/contact-sheet.png`, 'cells', cells.length);

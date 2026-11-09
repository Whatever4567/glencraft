// CPU diffuse previews of 1.2.40 held items + first-person arms.
// Not a GPU screenshot; no PBR/specular/performance claims.
import fs from 'node:fs';
import {createRequire} from 'node:module';
import {T, load, builtRuntime, legacy} from '../tests/lib/pilot-native-r128.mjs';
const {createCanvas} = createRequire('/workspace/qa/tools/index.js')('@napi-rs/canvas');

const OUT = process.argv[2] || '/workspace/qa/held-1240';
fs.mkdirSync(OUT, {recursive: true});

const helper = fs.readFileSync(new URL('./pilot-model-source/held-fp-1240.js', import.meta.url), 'utf8');
const W = {THREE: T};
new Function('window', helper)(W);
const H = W.__held1240;

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
for (const m of Object.values(models)) { m.position.set(0, 0, 0); m.rotation.set(0, 0, 0); R.sync(m); m.updateMatrixWorld(true); }

function makeStandin(entry) {
  const g = new T.Group();
  const kind = entry.kind, mat = entry.mat;
  const wood = new T.MeshPhongMaterial({color: 0x6b4a2a});
  const headCol = {wood: 0xb08a55, stone: 0x8e9398, iron: 0xdfe3e8, gold: 0xf4c542, diamond: 0x6ff0ea, cobalt: 0x5a72e0, crystalpurple: 0xdfe3e8, crystalblue: 0xdfe3e8, metal: 0x888c92, glass: 0xe8f4ff, paper: 0xe8d6a8, plastic: 0x15161a, food: 0xc9a05a, item: 0xc0392b}[mat] || 0x888888;
  const head = new T.MeshPhongMaterial({color: headCol});
  if (H.HAFT && H.HAFT.has(kind) || ['pick','axe','shovel','hoe','sword','claymore','p760','p761','shears','flint','stick'].includes(kind)) {
    const handleLen = kind === 'claymore' ? 0.62 : kind === 'sword' ? 0.48 : kind === 'shears' || kind === 'flint' ? 0.22 : 0.48;
    const handle = new T.Mesh(new T.CylinderGeometry(0.012, 0.014, handleLen, 8), wood);
    handle.position.y = handleLen / 2; g.add(handle);
    const hx = kind === 'sword' || kind === 'claymore' ? 0.03 : kind === 'axe' ? 0.14 : 0.16;
    const hy = kind === 'sword' || kind === 'claymore' ? (kind === 'claymore' ? 0.28 : 0.22) : 0.05;
    const hz = kind === 'sword' || kind === 'claymore' ? 0.012 : 0.05;
    const blade = new T.Mesh(new T.BoxGeometry(hx, hy, hz), head);
    blade.position.set(kind === 'sword' || kind === 'claymore' ? 0 : 0.07, handleLen + hy * 0.2, 0);
    blade.userData.head = true;
    g.add(blade);
    if (kind === 'p761') { g.userData.p761 = true; g.scale.multiply(new T.Vector3(0.86, 1.12, 0.62)); }
    if (kind === 'p760') { g.userData.p760 = true; }
  } else if (kind === 'pistol' || kind === 'musket') {
    const iron = new T.MeshPhongMaterial({color: 0x888c92});
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
  } else if (kind === 'bucket') {
    g.add(new T.Mesh(new T.CylinderGeometry(0.08, 0.06, 0.12, 10), wood));
  } else if (kind === 'torch') {
    g.add(new T.Mesh(new T.CylinderGeometry(0.02, 0.02, 0.2, 8), wood));
  } else if (kind === 'drink') {
    g.add(new T.Mesh(new T.CylinderGeometry(0.05, 0.04, 0.1, 10), new T.MeshPhongMaterial({color: headCol, transparent: true, opacity: 0.8})));
  } else if (kind === 'jetpack') {
    g.add(new T.Mesh(new T.BoxGeometry(0.2, 0.28, 0.12), new T.MeshPhongMaterial({color: mat === 'gold' ? 0xf2c440 : 0xd0d4d8})));
  } else if (kind === 'shield') {
    g.add(new T.Mesh(new T.BoxGeometry(0.22, 0.28, 0.03), new T.MeshLambertMaterial({color: 0x5a3a1e})));
  } else {
    g.add(new T.Mesh(new T.BoxGeometry(0.08, 0.1, 0.08), new T.MeshLambertMaterial({color: headCol})));
  }
  return g;
}

const images = new Map();
const linear = x => x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
const srgb = x => x <= 0.0031308 ? 12.92 * x : 1.055 * x ** (1 / 2.4) - 0.055;
function aces(v) {
  const mul = (m, v) => m.map(row => row.reduce((a, x, j) => a + x * v[j], 0));
  v = mul([[0.59719, 0.35458, 0.04823], [0.076, 0.90834, 0.01566], [0.0284, 0.13383, 0.83777]], v.map(x => x * 1.05 / 0.6));
  v = v.map(x => (x * (x + 0.0245786) - 0.000090537) / (x * (0.983729 * x + 0.432951) + 0.238081));
  return mul([[1.60475, -0.53108, -0.07367], [-0.10208, 1.10813, -0.00605], [-0.00327, -0.07276, 1.07602]], v).map(x => Math.max(0, Math.min(1, x)));
}

function collectTris(root) {
  root.updateMatrixWorld(true);
  const out = [];
  root.traverse(o => {
    if (!o.isMesh) return;
    for (let p = o; p; p = p.parent) if (p.visible === false) return;
    const ge = o.geometry, pa = ge.attributes.position, na = ge.attributes.normal, ua = ge.attributes.uv, ca = ge.attributes.color, ix = ge.index, mat = o.material;
    if (!pa || (mat && mat.visible === false)) return;
    if (o.isSkinnedMesh && o.skeleton) o.skeleton.update();
    const pos = [], norm = [], uv = [], col = [], nmx = new T.Matrix3().getNormalMatrix(o.matrixWorld);
    for (let i = 0; i < pa.count; i++) {
      const p = new T.Vector3().fromBufferAttribute(pa, i);
      const n = na ? new T.Vector3().fromBufferAttribute(na, i) : new T.Vector3(0, 1, 0);
      if (o.isSkinnedMesh && o.boneTransform) {
        const p2 = p.clone().add(n);
        o.boneTransform(i, p2); o.boneTransform(i, p); n.copy(p2.sub(p));
      }
      pos.push(p.applyMatrix4(o.matrixWorld));
      norm.push(n.applyMatrix3(nmx).normalize());
      uv.push(ua ? [ua.getX(i), ua.getY(i)] : [0, 0]);
      col.push(ca ? [ca.getX(i), ca.getY(i), ca.getZ(i)] : [1, 1, 1]);
    }
    const mats = [].concat(mat || []);
    for (const m of mats) {
      if (m && m.map && m.map.image && !images.has(m.map)) {
        const c = m.map.image;
        if (c && c.getContext) images.set(m.map, {w: c.width, h: c.height, d: c.getContext('2d').getImageData(0, 0, c.width, c.height).data});
        else if (c && c.data && c.width) images.set(m.map, {w: c.width, h: c.height, d: c.data});
      }
    }
    const count = ix ? ix.count : pa.count;
    const matOf = k => {
      if (!Array.isArray(mat)) return mat;
      for (const gr of ge.groups || []) if (k >= gr.start && k < gr.start + gr.count) return mats[gr.materialIndex];
      return mats[0];
    };
    for (let k = 0; k < count; k += 3) {
      const ids = [0, 1, 2].map(j => ix ? ix.getX(k + j) : k + j);
      out.push({p: ids.map(i => pos[i]), n: ids.map(i => norm[i]), uv: ids.map(i => uv[i]), c: ids.map(i => col[i]), mat: matOf(k)});
    }
  });
  return out;
}

function paint(w, h, tris, project, bg, skipBack) {
  const cv = createCanvas(w, h), ctx = cv.getContext('2d'), im = ctx.createImageData(w, h), z = new Float32Array(w * h).fill(-1e9);
  for (let i = 0; i < w * h; i++) im.data.set(bg, i * 4);
  for (const t of tris) {
    if (!t.mat) continue;
    const v = t.p.map(project), [a, b, c] = v;
    const d = (b[1] - c[1]) * (a[0] - c[0]) + (c[0] - b[0]) * (a[1] - c[1]);
    if (Math.abs(d) < 1e-9) continue;
    if (skipBack) {
      const face = new T.Vector3().subVectors(t.p[1], t.p[0]).cross(new T.Vector3().subVectors(t.p[2], t.p[0]));
      const look = skipBack(face);
      if (look < 0 && t.mat.side !== T.DoubleSide) continue;
    }
    const xmin = Math.max(0, Math.floor(Math.min(a[0], b[0], c[0])));
    const xmax = Math.min(w - 1, Math.ceil(Math.max(a[0], b[0], c[0])));
    const ymin = Math.max(0, Math.floor(Math.min(a[1], b[1], c[1])));
    const ymax = Math.min(h - 1, Math.ceil(Math.max(a[1], b[1], c[1])));
    for (let y = ymin; y <= ymax; y++) for (let x = xmin; x <= xmax; x++) {
      const px = x + 0.5, py = y + 0.5;
      const w0 = ((b[1] - c[1]) * (px - c[0]) + (c[0] - b[0]) * (py - c[1])) / d;
      const w1 = ((c[1] - a[1]) * (px - c[0]) + (a[0] - c[0]) * (py - c[1])) / d;
      const w2 = 1 - w0 - w1;
      if (w0 < 0 || w1 < 0 || w2 < 0) continue;
      const zz = w0 * a[2] + w1 * b[2] + w2 * c[2], i = y * w + x;
      if (zz <= z[i]) continue;
      z[i] = zz;
      const ws = [w0, w1, w2];
      const normal = [0, 1, 2].map(k => ws.reduce((s, ww, j) => s + ww * t.n[j].getComponent(k), 0));
      const len = Math.hypot(...normal) || 1;
      const light = 0.38 + 0.62 * Math.max(0, (normal[0] / len) * -0.35 + (normal[1] / len) * 0.55 + (normal[2] / len) * 0.76);
      const rgba = [t.mat.color ? t.mat.color.r : 0.8, t.mat.color ? t.mat.color.g : 0.8, t.mat.color ? t.mat.color.b : 0.8];
      if (t.mat.vertexColors) for (let k = 0; k < 3; k++) rgba[k] *= ws.reduce((s, ww, j) => s + ww * t.c[j][k], 0);
      if (t.mat.map && images.has(t.mat.map)) {
        const m = images.get(t.mat.map);
        const u = ws.reduce((s, ww, j) => s + ww * t.uv[j][0], 0);
        const v = ws.reduce((s, ww, j) => s + ww * t.uv[j][1], 0);
        const ty = t.mat.map.flipY !== false ? 1 - v : v;
        const tx = Math.max(0, Math.min(m.w - 1, Math.floor(u * m.w)));
        const yy = Math.max(0, Math.min(m.h - 1, Math.floor(ty * m.h)));
        const k = (yy * m.w + tx) * 4;
        for (let c = 0; c < 3; c++) rgba[c] *= t.mat.map.encoding === T.sRGBEncoding ? linear(m.d[k + c] / 255) : m.d[k + c] / 255;
      }
      const toned = aces(rgba.map(c => c * light));
      for (let k = 0; k < 3; k++) im.data[i * 4 + k] = Math.min(255, Math.max(0, srgb(toned[k]) * 255));
      im.data[i * 4 + 3] = 255;
    }
  }
  ctx.putImageData(im, 0, 0);
  return {cv, ctx};
}

function render3p(tris, w, h, ang, label) {
  const ca = Math.cos(ang), sa = Math.sin(ang), scale = h / 2.05, cx = w / 2, cy = h / 2 + 0.92 * scale;
  const project = p => [cx + (p.x * ca - p.z * sa) * scale, cy - p.y * scale, p.x * sa + p.z * ca];
  const {cv, ctx} = paint(w, h, tris, project, [232, 234, 238, 255], face => face.x * sa + face.z * ca);
  ctx.fillStyle = '#1c2430';
  ctx.font = '13px sans-serif';
  ctx.fillText(label, 10, 20);
  return cv;
}

function render1p(tris, w, h, label) {
  // Camera at origin looking down -Z. Frame the arms/item in front of the camera.
  const scale = h / 0.85, cx = w / 2, cy = h * 0.55;
  const project = p => [cx + p.x * scale, cy - p.y * scale, -p.z];
  const {cv, ctx} = paint(w, h, tris, project, [196, 214, 230, 255], face => -face.z);
  ctx.fillStyle = '#1c2430';
  ctx.font = '13px sans-serif';
  ctx.fillText(label, 10, 20);
  return cv;
}

function clearHeld(root) {
  const sock = root.getObjectByName && root.getObjectByName('weapon_grip_slot1');
  const sockets = [];
  root.traverse(o => { if (o.name === 'weapon_grip_slot1' || o.name === 'weapon_grip_slot0') sockets.push(o); });
  for (const s of sockets) {
    const kids = s.children.slice();
    for (const ch of kids) if (!ch.isBone) s.remove(ch);
  }
}

const bodyCache = {};
function bodyTris(outfit) {
  if (!bodyCache[outfit]) {
    clearHeld(models[outfit]);
    bodyCache[outfit] = collectTris(models[outfit]);
  }
  return bodyCache[outfit];
}

function entryOf(idOrKind) {
  return H.CATALOG.find(e => e.id === idOrKind || e.kind === idOrKind || e.name === idOrKind);
}

const FEATURE = [
  {id: 761, name: 'Purple crystal pickaxe'},
  {id: 760, name: 'Blue crystal pickaxe'},
  {id: 257 /* or wood pick */, wait: true}
];

// resolve feature list from catalog
const featureIds = [761, 760, 270, 271, 272, 273, 274, 185, 217, 410, 212, 213, 11, 67, 39, 186];
// catalog ids may differ — pick by name/kind
function pickFeatures() {
  const want = [
    'Purple crystal pickaxe', 'Blue crystal pickaxe', 'Wood pickaxe', 'Diamond pickaxe',
    'Wood sword', 'Claymore', 'Map', 'Highland pistol', 'Highland musket',
    'Stick', 'Torch', 'Bucket', 'Targe'
  ];
  const out = [];
  for (const name of want) {
    const e = H.CATALOG.find(x => x.name === name) || H.CATALOG.find(x => name.toLowerCase().includes(x.kind));
    if (e) out.push(e);
  }
  // fallback kinds
  if (!out.find(e => e.kind === 'map')) { const e = H.CATALOG.find(x => x.kind === 'map'); if (e) out.push(e); }
  if (!out.find(e => e.kind === 'pistol')) { const e = H.CATALOG.find(x => x.kind === 'pistol'); if (e) out.push(e); }
  if (!out.find(e => e.kind === 'musket')) { const e = H.CATALOG.find(x => x.kind === 'musket'); if (e) out.push(e); }
  return out;
}

const features = pickFeatures();
console.log('features', features.map(e => e.name + '#' + e.id).join(', '));
console.log('catalog', H.CATALOG.length);

// 3p feature portraits, both outfits, three-quarter
const TW = 420, TH = 620, ANG = Math.PI / 6;
for (const outfit of ['base', 'armour']) {
  const body = bodyTris(outfit);
  for (const entry of features) {
    const mesh = makeStandin(entry);
    clearHeld(models[outfit]);
    H.poseHeld(models[outfit], {mesh, kind: entry.kind, heldId: entry.id});
    models[outfit].updateMatrixWorld(true);
    const itemTris = collectTris(mesh);
    const cv = render3p(body.concat(itemTris), TW, TH, ANG, '1.2.40 3p ' + outfit + ' · ' + entry.name + ' (CPU diffuse)');
    const slug = entry.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    fs.writeFileSync(OUT + '/3p-' + outfit + '-' + slug + '.png', cv.toBuffer('image/png'));
    clearHeld(models[outfit]);
  }
  console.log('wrote 3p features for', outfit);
}

// All-holdables 3p contact sheet (armour, three-quarter)
const cols = 8, rows = Math.ceil(H.CATALOG.length / cols);
const cw = 200, ch = 300;
const sheet = createCanvas(cols * cw, rows * ch + 28);
const sctx = sheet.getContext('2d');
sctx.fillStyle = '#e8eaee';
sctx.fillRect(0, 0, cols * cw, rows * ch + 28);
sctx.fillStyle = '#1c2430';
sctx.font = '16px sans-serif';
sctx.fillText('1.2.40 all holdables · third person · armour · CPU diffuse, not a GPU capture', 12, 20);
const armourBody = bodyTris('armour');
H.CATALOG.forEach((entry, i) => {
  const mesh = makeStandin(entry);
  clearHeld(models.armour);
  H.poseHeld(models.armour, {mesh, kind: entry.kind, heldId: entry.id});
  models.armour.updateMatrixWorld(true);
  const itemTris = collectTris(mesh);
  const tile = render3p(armourBody.concat(itemTris), cw, ch, ANG, entry.name);
  const x = (i % cols) * cw, y = 28 + Math.floor(i / cols) * ch;
  sctx.drawImage(tile, x, y);
  clearHeld(models.armour);
  if ((i + 1) % 8 === 0) console.log('sheet', i + 1, '/', H.CATALOG.length);
});
fs.writeFileSync(OUT + '/3p-armour-all-holdables.png', sheet.toBuffer('image/png'));
console.log('wrote all-holdables 3p sheet');

// First-person views
const cam = new T.PerspectiveCamera(70, 1, 0.05, 20);
const fpBase = H.installFpOnCamera(cam, models.base.userData.pilot.near.root, false);
const camA = new T.PerspectiveCamera(70, 1, 0.05, 20);
const fpArmour = H.installFpOnCamera(camA, models.armour.userData.pilot.near.root, true);

function renderFpSet(fp, outfit, entries, kindFor, prefix) {
  for (const entry of entries) {
    const ik = kindFor(entry);
    H.applyFpIk(fp, ik);
    clearHeld(fp);
    const mesh = makeStandin(entry);
    const info = H.poseHeldFp(fp, mesh, entry.kind, entry.id);
    fp.updateMatrixWorld(true);
    if (info && info.skipped === 'viewmodel') {
      // still pose it for the preview so we can see the socket item plus arms
      H.placeItem(info.socket, mesh, entry.kind, entry.id);
      fp.updateMatrixWorld(true);
    }
    const tris = collectTris(fp);
    const cv = render1p(tris, 640, 420, '1.2.40 1p ' + outfit + ' · ' + entry.name + ' (CPU diffuse)');
    const slug = entry.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    fs.writeFileSync(OUT + '/' + prefix + '-' + slug + '.png', cv.toBuffer('image/png'));
    clearHeld(fp);
  }
}

const fpFeatures = features;
renderFpSet(fpBase, 'base', fpFeatures, e => (e.kind === 'pistol' || e.kind === 'musket' || e.kind === 'map') ? e.kind : 'pickaxe', '1p-base');
console.log('wrote 1p base features');
renderFpSet(fpArmour, 'armour', fpFeatures, e => (e.kind === 'pistol' || e.kind === 'musket' || e.kind === 'map') ? e.kind : 'pickaxe', '1p-armour');
console.log('wrote 1p armour features');

// Swim pose on both outfits, empty hands
H.applyFpIk(fpBase, 'swim', 0.5);
clearHeld(fpBase);
fs.writeFileSync(OUT + '/1p-base-swim.png', render1p(collectTris(fpBase), 640, 420, '1.2.40 1p base · swim (CPU diffuse)').toBuffer('image/png'));
H.applyFpIk(fpArmour, 'swim', 0.5);
clearHeld(fpArmour);
fs.writeFileSync(OUT + '/1p-armour-swim.png', render1p(collectTris(fpArmour), 640, 420, '1.2.40 1p armour · swim (CPU diffuse)').toBuffer('image/png'));
console.log('wrote swim');

// 1p all-holdables contact sheet (armour arms)
const fcols = 7, frows = Math.ceil(H.CATALOG.length / fcols);
const fw = 240, fh = 170;
const fsheet = createCanvas(fcols * fw, frows * fh + 28);
const fctx = fsheet.getContext('2d');
fctx.fillStyle = '#c4d6e6';
fctx.fillRect(0, 0, fcols * fw, frows * fh + 28);
fctx.fillStyle = '#1c2430';
fctx.font = '16px sans-serif';
fctx.fillText('1.2.40 all holdables · first person · armour arms · CPU diffuse, not a GPU capture', 12, 20);
H.CATALOG.forEach((entry, i) => {
  const ik = (entry.kind === 'pistol' || entry.kind === 'musket' || entry.kind === 'map') ? entry.kind : 'pickaxe';
  H.applyFpIk(fpArmour, ik);
  clearHeld(fpArmour);
  const mesh = makeStandin(entry);
  const info = H.poseHeldFp(fpArmour, mesh, entry.kind, entry.id);
  fpArmour.updateMatrixWorld(true);
  if (info && info.skipped === 'viewmodel') H.placeItem(info.socket, mesh, entry.kind, entry.id);
  fpArmour.updateMatrixWorld(true);
  const tile = render1p(collectTris(fpArmour), fw, fh, entry.name);
  fctx.drawImage(tile, (i % fcols) * fw, 28 + Math.floor(i / fcols) * fh);
  clearHeld(fpArmour);
  if ((i + 1) % 7 === 0) console.log('1p sheet', i + 1, '/', H.CATALOG.length);
});
fs.writeFileSync(OUT + '/1p-armour-all-holdables.png', fsheet.toBuffer('image/png'));
console.log('PASS previews written to ' + OUT);

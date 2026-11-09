// CPU diffuse comparison sheets for the 1.2.41 prism / crystal-facet candidate.
// Not a GPU screenshot; the armour-style fresnel rim is approximated in software.
import fs from 'node:fs';
import {createRequire} from 'node:module';
import {T, load} from '../tests/lib/pilot-native-r128.mjs';
import {GLTFLoader} from '/workspace/glencraft-anatomy-tools/node_modules/three/examples/jsm/loaders/GLTFLoader.js';
import {MeshoptDecoder} from '/workspace/glencraft-anatomy-tools/node_modules/three/examples/jsm/libs/meshopt_decoder.module.js';
async function loadMob(url) {
  await MeshoptDecoder.ready;
  const L = new GLTFLoader();
  L.setMeshoptDecoder(MeshoptDecoder);
  L.register(p => { p.loadTexture = () => Promise.resolve(null); p.assignTexture = () => Promise.resolve(null); return {name: 'notex'}; });
  const file = typeof url === 'string' ? url : (url.pathname || url.href);
  const b = fs.readFileSync(file);
  const ab = b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength);
  return new Promise((res, rej) => L.parse(ab, '', g => res(g), rej));
}

const {createCanvas} = createRequire('/workspace/qa/tools/index.js')('@napi-rs/canvas');

const OUT = process.argv[2] || '/workspace/qa/prism-1241';
fs.mkdirSync(OUT, {recursive: true});

const heldSrc = fs.readFileSync(new URL('./pilot-model-source/held-fp-1240.js', import.meta.url), 'utf8');
const prismSrc = fs.readFileSync(new URL('./visuals-source/prism-1241.js', import.meta.url), 'utf8');
const W = {THREE: T, QUALITY: '4k', HIGH: true};
new Function('window', heldSrc)(W);
new Function('window', 'THREE', prismSrc)(W, T);
const H = W.__held1240, U = W.__prism1241;
U.makeCanvas = (w, h) => createCanvas(w, h);

const linear = x => x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
const srgb = x => x <= 0.0031308 ? 12.92 * x : 1.055 * x ** (1 / 2.4) - 0.055;
function aces(v) {
  const mul = (m, v) => m.map(row => row.reduce((a, x, j) => a + x * v[j], 0));
  v = mul([[0.59719, 0.35458, 0.04823], [0.076, 0.90834, 0.01566], [0.0284, 0.13383, 0.83777]], v.map(x => x * 1.05 / 0.6));
  v = v.map(x => (x * (x + 0.0245786) - 0.000090537) / (x * (0.983729 * x + 0.432951) + 0.238081));
  return mul([[1.60475, -0.53108, -0.07367], [-0.10208, 1.10813, -0.00605], [-0.00327, -0.07276, 1.07602]], v).map(x => Math.max(0, Math.min(1, x)));
}
const images = new Map();
function collectTris(root) {
  root.updateMatrixWorld(true);
  const out = [];
  root.traverse(o => {
    if (!o.isMesh) return;
    for (let p = o; p; p = p.parent) if (p.visible === false) return;
    const ge = o.geometry, pa = ge.attributes.position, na = ge.attributes.normal, ua = ge.attributes.uv, ix = ge.index, mat = o.material;
    if (!pa || (mat && mat.visible === false)) return;
    const pos = [], norm = [], uv = [], nmx = new T.Matrix3().getNormalMatrix(o.matrixWorld);
    for (let i = 0; i < pa.count; i++) {
      const p = new T.Vector3().fromBufferAttribute(pa, i);
      const n = na ? new T.Vector3().fromBufferAttribute(na, i) : new T.Vector3(0, 1, 0);
      pos.push(p.applyMatrix4(o.matrixWorld));
      norm.push(n.applyMatrix3(nmx).normalize());
      uv.push(ua ? [ua.getX(i), ua.getY(i)] : [0, 0]);
    }
    const ca = ge.attributes.color;
    const count = ix ? ix.count : pa.count;
    for (let k = 0; k < count; k += 3) {
      const ids = [0, 1, 2].map(j => ix ? ix.getX(k + j) : k + j);
      const col = ca ? ids.map(i => [ca.getX(i), ca.getY(i), ca.getZ(i)]) : null;
      out.push({p: ids.map(i => pos[i]), n: ids.map(i => norm[i]), uv: ids.map(i => uv[i]), col, mat: Array.isArray(mat) ? mat[0] : mat, prism: !!(o.userData && (o.userData.prism1241Applied || o.userData.prismBuilt)) || !!(o.material && o.material.userData && o.material.userData.prism1241)});
    }
  });
  return out;
}
function paint(w, h, tris, project, bg, lookZ) {
  const cv = createCanvas(w, h), ctx = cv.getContext('2d'), im = ctx.createImageData(w, h), z = new Float32Array(w * h).fill(-1e9);
  for (let i = 0; i < w * h; i++) im.data.set(bg, i * 4);
  for (const t of tris) {
    if (!t.mat) continue;
    const v = t.p.map(project), [a, b, c] = v;
    const d = (b[1] - c[1]) * (a[0] - c[0]) + (c[0] - b[0]) * (a[1] - c[1]);
    if (Math.abs(d) < 1e-9) continue;
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
      const nx = normal[0] / len, ny = normal[1] / len, nz = normal[2] / len;
      // Warm key (upper-left-front) + cool rim (back-right) so cut facets read.
      const kx = -0.48, ky = 0.72, kz = 0.50, kn = Math.hypot(kx, ky, kz);
      const rx = 0.58, ry = 0.22, rz = -0.78, rn = Math.hypot(rx, ry, rz);
      const ndk = Math.max(0, (nx * kx + ny * ky + nz * kz) / kn);
      const ndr = Math.max(0, (nx * rx + ny * ry + nz * rz) / rn);
      const amb = 0.20, keyI = 1.00, rimI = 0.70;
      let lr = amb + keyI * ndk * 1.00 + rimI * ndr * 0.45;
      let lg = amb + keyI * ndk * 0.95 + rimI * ndr * 0.72;
      let lb = amb + keyI * ndk * 0.88 + rimI * ndr * 1.00;
      const rgba = [t.mat.color ? t.mat.color.r : 0.8, t.mat.color ? t.mat.color.g : 0.8, t.mat.color ? t.mat.color.b : 0.8];
      if (t.col) {
        // per-facet vertex colour is a brightness / tint multiplier
        const wc = [0, 1, 2].map(ch => ws.reduce((s, ww, j) => s + ww * t.col[j][ch], 0));
        rgba[0] *= wc[0]; rgba[1] *= wc[1]; rgba[2] *= wc[2];
      }
      if (t.mat.emissive) {
        rgba[0] += t.mat.emissive.r * (t.mat.emissiveIntensity || 1) * 0.45;
        rgba[1] += t.mat.emissive.g * (t.mat.emissiveIntensity || 1) * 0.45;
        rgba[2] += t.mat.emissive.b * (t.mat.emissiveIntensity || 1) * 0.45;
      }
      if (t.prism) {
        const qx = (nx < 0 ? -1 : 1) * Math.floor(Math.abs(nx) * 3 + 0.51);
        const qy = (ny < 0 ? -1 : 1) * Math.floor(Math.abs(ny) * 3 + 0.51);
        const qz = (nz < 0 ? -1 : 1) * Math.floor(Math.abs(nz) * 3 + 0.51);
        const qlen = Math.hypot(qx, qy, qz) || 1;
        const fh = Math.sin((qx / qlen) * 12.9898 + (qy / qlen) * 78.233 + (qz / qlen) * 45.164) * 43758.5453;
        const facet = 0.70 + 0.54 * (fh - Math.floor(fh));
        lr *= facet; lg *= facet; lb *= facet;
        const ang = 0.7, vx = Math.sin(ang), vy = 0.28, vz = Math.cos(ang);
        const vl = Math.hypot(vx, vy, vz);
        const ndv = Math.abs((nx * vx + ny * vy + nz * vz) / vl);
        const crF = Math.pow(1 - Math.min(1, ndv), 1.45);
        rgba[0] *= 0.72 + 0.12 * (1 - crF) + 0.34 * crF;
        rgba[1] *= 0.72 + 0.12 * (1 - crF) + 0.34 * crF;
        rgba[2] *= 0.82 + 0.10 * (1 - crF) + 0.28 * crF;
        rgba[0] += crF * 0.42 * 0.55;
        rgba[1] += crF * 0.42 * 0.75;
        rgba[2] += crF * 0.42 * 1.00;
      }
      const toned = aces([Math.max(0, rgba[0] * lr), Math.max(0, rgba[1] * lg), Math.max(0, rgba[2] * lb)]);
      for (let k = 0; k < 3; k++) im.data[i * 4 + k] = Math.min(255, Math.max(0, srgb(toned[k]) * 255));
      im.data[i * 4 + 3] = 255;
    }
  }
  ctx.putImageData(im, 0, 0);
  return {cv, ctx};
}
function renderIso(root, w, h, label, bg) {
  const box = new T.Box3().setFromObject(root);
  const size = box.getSize(new T.Vector3()), center = box.getCenter(new T.Vector3());
  const span = Math.max(size.x, size.y, size.z, 0.2);
  const scale = (Math.min(w, h) * 0.80) / span;
  const cx = w / 2, cy = h / 2 + span * 0.08 * scale;
  const ang = 0.7, ca = Math.cos(ang), sa = Math.sin(ang);
  const project = p => {
    const x = p.x - center.x, y = p.y - center.y, z = p.z - center.z;
    return [cx + (x * ca - z * sa) * scale, cy - y * scale, x * sa + z * ca];
  };
  const {cv, ctx} = paint(w, h, collectTris(root), project, bg || [236, 232, 226, 255], 1);
  return cv;
}
function makeStandin(entry) {
  const g = new T.Group();
  const kind = entry.kind, mat = entry.mat;
  const wood = new T.MeshLambertMaterial({color: 0x6b4a2a});
  const headCol = {wood: 0xb08a55, stone: 0x8e9398, iron: 0xdfe3e8, gold: 0xf4c542, diamond: 0x6ff0ea, cobalt: 0x5a72e0, crystalpurple: 0xc46ad8, crystalblue: 0x6aa8f0, metal: 0x888c92, glass: 0xe8f4ff, paper: 0xe8d6a8, plastic: 0x15161a, food: 0xc9a05a, item: 0xc0392b}[mat] || 0x888888;
  const head = new T.MeshLambertMaterial({color: headCol});
  const addHandle = (len = 0.48) => { const s = new T.Mesh(new T.BoxGeometry(0.035, len, 0.035), wood); s.position.y = 0.12; g.add(s); };
  if (kind === 'sword' || kind === 'claymore') {
    const blade = new T.Mesh(new T.BoxGeometry(0.05, kind === 'claymore' ? 0.62 : 0.46, 0.018), head); blade.position.y = 0.3; g.add(blade);
    g.add(new T.Mesh(new T.BoxGeometry(0.17, 0.035, 0.04), wood));
    const grip = new T.Mesh(new T.BoxGeometry(0.035, 0.13, 0.035), wood); grip.position.y = -0.075; g.add(grip);
  } else if (kind === 'pick' || kind === 'p760' || kind === 'p761') {
    addHandle();
    const h = new T.Mesh(new T.BoxGeometry(0.34, 0.05, 0.05), head); h.position.y = 0.33; g.add(h);
    for (const sx of [-1, 1]) { const e = new T.Mesh(new T.BoxGeometry(0.06, 0.07, 0.05), head); e.position.set(sx * 0.18, 0.3, 0); g.add(e); }
  } else if (kind === 'axe') {
    addHandle(0.5);
    const h = new T.Mesh(new T.BoxGeometry(0.13, 0.15, 0.03), head); h.position.set(-0.07, 0.29, 0); g.add(h);
  } else if (kind === 'hoe') {
    addHandle(0.5);
    const h = new T.Mesh(new T.BoxGeometry(0.15, 0.04, 0.05), head); h.position.set(-0.06, 0.34, 0); g.add(h);
  } else if (kind === 'shovel') {
    addHandle(0.44);
    const h = new T.Mesh(new T.BoxGeometry(0.11, 0.15, 0.025), head); h.position.y = 0.4; g.add(h);
  } else if (kind === 'stick') {
    addHandle(0.46);
  } else if (kind === 'pistol' || kind === 'musket') {
    const stock = new T.Mesh(new T.BoxGeometry(kind === 'musket' ? 0.55 : 0.22, 0.06, 0.04), wood); stock.position.set(0.1, 0.1, 0); g.add(stock);
    const bar = new T.Mesh(new T.BoxGeometry(kind === 'musket' ? 0.5 : 0.18, 0.03, 0.03), head); bar.position.set(0.28, 0.14, 0); g.add(bar);
  } else {
    g.add(new T.Mesh(new T.BoxGeometry(0.12, 0.16, 0.08), head));
  }
  g.userData.kind = kind;
  return g;
}

function pairSheet(items, renderOne, cellW, cellH, cols, title) {
  const rows = Math.ceil(items.length / cols);
  const header = 36;
  const cv = createCanvas(cols * cellW * 2 + 16, header + rows * cellH + 8);
  const ctx = cv.getContext('2d');
  ctx.fillStyle = '#e8e4dc'; ctx.fillRect(0, 0, cv.width, cv.height);
  ctx.fillStyle = '#1c2430'; ctx.font = 'bold 16px sans-serif';
  ctx.fillText(title, 12, 24);
  ctx.font = '11px sans-serif';
  items.forEach((it, i) => {
    const r = (i / cols | 0), c = i % cols;
    const x = 8 + c * cellW * 2, y = header + r * cellH;
    const before = renderOne(it, false), after = renderOne(it, true);
    ctx.drawImage(before, x, y, cellW, cellH);
    ctx.drawImage(after, x + cellW, y, cellW, cellH);
    ctx.font = '11px sans-serif';
    ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(0,0,0,0.7)'; ctx.fillStyle = '#f4f7fb';
    ctx.strokeText('before', x + 6, y + 14); ctx.fillText('before', x + 6, y + 14);
    ctx.strokeText('after', x + cellW + 6, y + 14); ctx.fillText('after', x + cellW + 6, y + 14);
    ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.fillStyle = '#1c2430';
    const label = it.name || it.kind || '';
    ctx.strokeText(label, x + 6, y + cellH - 8); ctx.fillText(label, x + 6, y + cellH - 8);
  });
  return cv;
}

function save(cv, name) {
  fs.writeFileSync(OUT + '/' + name, cv.toBuffer('image/png'));
  console.log('wrote', name, cv.width + 'x' + cv.height);
}

// ---- tools 3D ----
const tools = H.CATALOG.filter(e => ['pick','p760','p761','axe','sword','claymore','shovel','hoe','stick','flint','shears','pistol','musket'].includes(e.kind));
save(pairSheet(tools, (e, after) => {
  const g = after ? U.buildTool(e.kind, e.mat, e.id) : makeStandin(e);
  return renderIso(g, 240, 240, e.name, [28, 32, 40, 255]);
}, 240, 240, 4, '1.2.41 tools — 3D held models (CPU, key + rim light, not GPU). Left before (box), right cut-gem / crystal-facet.'), 'tools-before-after.png');

// ---- icons + tiles (2D) ----
function paintToolIcon(kind, col) {
  const c = createCanvas(256, 256), g = c.getContext('2d');
  g.translate(128, 128); g.scale(4, 4); g.lineJoin = 'round'; g.lineCap = 'round';
  g.rotate(Math.PI / 4);
  g.fillStyle = '#5b3d22'; g.fillRect(-3.5, -18, 7, 44); g.fillStyle = '#8a6239'; g.fillRect(-3.5, -18, 2.5, 44);
  g.fillStyle = col; g.strokeStyle = '#1b1b1b'; g.lineWidth = 2;
  if (kind === 'pick') { g.beginPath(); g.moveTo(-24, -14); g.quadraticCurveTo(0, -30, 24, -14); g.lineTo(20, -10); g.quadraticCurveTo(0, -22, -20, -10); g.closePath(); g.fill(); g.stroke(); }
  if (kind === 'axe') { g.beginPath(); g.moveTo(2, -24); g.lineTo(20, -28); g.quadraticCurveTo(24, -14, 20, -2); g.lineTo(2, -6); g.closePath(); g.fill(); g.stroke(); }
  if (kind === 'sword') { g.fillRect(-4, -30, 8, 38); g.strokeRect(-4, -30, 8, 38); g.fillStyle = '#4a2f1a'; g.fillRect(-12, 8, 24, 5); }
  if (kind === 'shovel') { g.beginPath(); g.ellipse(0, -22, 9, 12, 0, 0, 7); g.fill(); g.stroke(); }
  return c;
}
function paintTile(kind) {
  const c = createCanvas(128, 128), g = c.getContext('2d');
  if (kind === 'grass') { g.fillStyle = '#4f9a32'; g.fillRect(0, 0, 128, 128); for (let i = 0; i < 400; i++) { g.fillStyle = i % 2 ? '#3e8226' : '#62b03c'; g.fillRect(Math.random() * 128, Math.random() * 128, 3, 3); } }
  else if (kind === 'dirt') { g.fillStyle = '#7a5232'; g.fillRect(0, 0, 128, 128); for (let i = 0; i < 300; i++) { g.fillStyle = i % 2 ? '#5e3e24' : '#a07450'; g.fillRect(Math.random() * 128, Math.random() * 128, 3, 3); } }
  else if (kind === 'stone') { g.fillStyle = '#8e9398'; g.fillRect(0, 0, 128, 128); for (let i = 0; i < 200; i++) { g.fillStyle = i % 2 ? '#6e7378' : '#a8adb2'; g.fillRect(Math.random() * 128, Math.random() * 128, 4, 3); } }
  else if (kind === 'planks') { g.fillStyle = '#9a6a36'; g.fillRect(0, 0, 128, 128); g.fillStyle = 'rgba(60,34,12,.55)'; for (let y = 0; y < 128; y += 32) g.fillRect(0, y, 128, 4); }
  else if (kind === 'diamond') { g.fillStyle = '#6ff0ea'; g.fillRect(0, 0, 128, 128); g.fillStyle = 'rgba(255,255,255,.4)'; g.beginPath(); g.moveTo(20, 20); g.lineTo(70, 10); g.lineTo(50, 60); g.fill(); }
  else if (kind === 'gold') { g.fillStyle = '#f2c440'; g.fillRect(0, 0, 128, 128); g.fillStyle = 'rgba(255,240,180,.5)'; g.fillRect(10, 10, 40, 20); }
  else { g.fillStyle = '#888'; g.fillRect(0, 0, 128, 128); }
  return c;
}
const iconItems = [
  {name: 'Wood pickaxe', kind: 'pick', col: '#b48a52'},
  {name: 'Iron pickaxe', kind: 'pick', col: '#e2e5e8'},
  {name: 'Gold pickaxe', kind: 'pick', col: '#f2c440'},
  {name: 'Diamond pickaxe', kind: 'pick', col: '#6ff0ea'},
  {name: 'Iron axe', kind: 'axe', col: '#e2e5e8'},
  {name: 'Diamond sword', kind: 'sword', col: '#6ff0ea'},
  {name: 'Gold sword', kind: 'sword', col: '#f2c440'},
  {name: 'Iron shovel', kind: 'shovel', col: '#e2e5e8'}
];
save(pairSheet(iconItems, (e, after) => {
  const c = paintToolIcon(e.kind, e.col);
  const src = after ? U.prismIcon2d(c, 'icon-' + e.name) : c;
  const out = createCanvas(220, 220), ctx = out.getContext('2d');
  ctx.fillStyle = '#d8d0c4'; ctx.fillRect(0, 0, 220, 220);
  ctx.drawImage(src, 22, 22, 176, 176);
  return out;
}, 220, 220, 4, '1.2.41 inventory icons (2D facet pass, 4K budget). Left before, right after.'), 'icons-before-after.png');

const tiles = ['grass', 'dirt', 'stone', 'planks', 'diamond', 'gold'].map(k => ({name: k, kind: k}));
save(pairSheet(tiles, (e, after) => {
  const c = paintTile(e.kind);
  const src = after ? U.prismTile(c, 'tile-' + e.kind) : c;
  const out = createCanvas(200, 200), ctx = out.getContext('2d');
  ctx.fillStyle = '#c8c0b4'; ctx.fillRect(0, 0, 200, 200);
  ctx.drawImage(src, 20, 28, 160, 160);
  return out;
}, 200, 200, 3, '1.2.41 block tiles (shared 2D facet pass). Left before, right after.'), 'tiles-before-after.png');

// iso "3D icons" of cubes with the styled tiles as faces
function isoBlock(tile, label) {
  const S = 220, c = createCanvas(S, S), g = c.getContext('2d');
  g.fillStyle = '#d8d0c4'; g.fillRect(0, 0, S, S);
  const PJ = (x, y, z) => [S / 2 + (x - z) * S * 0.36, S * 0.55 + (x + z) * S * 0.205 - y * S * 0.42];
  const face = (img, O, A, B, dark) => {
    g.save(); g.beginPath(); g.moveTo(O[0], O[1]); g.lineTo(A[0], A[1]); g.lineTo(A[0] + B[0] - O[0], A[1] + B[1] - O[1]); g.lineTo(B[0], B[1]); g.closePath(); g.clip();
    g.setTransform((A[0] - O[0]) / img.width, (A[1] - O[1]) / img.width, (B[0] - O[0]) / img.height, (B[1] - O[1]) / img.height, O[0], O[1]);
    g.drawImage(img, 0, 0, img.width, img.height);
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.fillStyle = 'rgba(0,0,0,' + dark + ')'; g.fillRect(0, 0, S, S); g.restore();
  };
  face(tile, PJ(0, 1, 0), PJ(1, 1, 0), PJ(0, 1, 1), 0);
  face(tile, PJ(0, 1, 1), PJ(1, 1, 1), PJ(0, 0, 1), .18);
  face(tile, PJ(1, 1, 1), PJ(1, 1, 0), PJ(1, 0, 1), .34);
  return c;
}
save(pairSheet(tiles, (e, after) => {
  const t = paintTile(e.kind);
  const src = after ? U.prismTile(t, 'iso-' + e.kind) : t;
  return isoBlock(src, e.name + ' 3D icon');
}, 220, 220, 3, '1.2.41 3D block icons (iso cubes using the prism tiles). Left before, right after.'), 'icons-3d-before-after.png');

// ---- mobs ----
function boxMan(parts) {
  const g = new T.Group();
  for (const p of parts) {
    const m = new T.Mesh(new T.BoxGeometry(p.s[0], p.s[1], p.s[2]), new T.MeshLambertMaterial({color: p.c, transparent: !!p.op, opacity: p.op || 1}));
    m.position.set(p.p[0], p.p[1], p.p[2]);
    g.add(m);
  }
  return g;
}
const procedural = [
  {name: 'Creeper', kind: 'creeper', g: () => boxMan([{s:[0.5,0.9,0.3],p:[0,0.45,0],c:0x3a8a3a},{s:[0.4,0.4,0.4],p:[0,1.05,0],c:0x2f6a2f}])},
  {name: 'Treeman', kind: 'treeman', g: () => boxMan([{s:[0.45,1.1,0.35],p:[0,0.55,0],c:0x5a3a22},{s:[0.7,0.5,0.7],p:[0,1.3,0],c:0x4a7a38}])},
  {name: 'Farmer', kind: 'farmer', g: () => boxMan([{s:[0.35,0.7,0.22],p:[0,0.55,0],c:0x3a5a8a},{s:[0.28,0.3,0.28],p:[0,1.05,0],c:0xe8c8a0},{s:[0.32,0.12,0.32],p:[0,1.22,0],c:0x6b4a2a}])},
  {name: 'Alien', kind: 'alien', g: () => boxMan([{s:[0.25,0.7,0.18],p:[0,0.55,0],c:0x8fb08a},{s:[0.42,0.45,0.35],p:[0,1.15,0],c:0x7da87a}])},
  {name: 'Egyptian', kind: 'egyptian', g: () => boxMan([{s:[0.32,0.75,0.22],p:[0,0.55,0],c:0xf4efe0},{s:[0.28,0.32,0.28],p:[0,1.08,0],c:0xc4a07a},{s:[0.36,0.22,0.3],p:[0,1.28,0],c:0x2a5a9a}])},
  {name: 'Paladien (Agartha)', kind: 'paladien', g: () => boxMan([{s:[0.28,1.1,0.2],p:[0,0.7,0],c:0x9fd4ff},{s:[0.3,0.38,0.3],p:[0,1.4,0],c:0xf0d6c0},{s:[0.34,0.14,0.34],p:[0,1.62,0],c:0xffe45c}])},
  {name: 'Moss hag', kind: 'nm11', g: () => boxMan([{s:[0.4,0.7,0.3],p:[0,0.45,0],c:0x4a5a38},{s:[0.28,0.28,0.28],p:[0,0.95,0],c:0xc0b090},{s:[0.2,0.5,0.2],p:[0,1.3,0],c:0x2a3a20}])},
  {name: 'Raincloud', kind: 'nm22', g: () => boxMan([{s:[0.9,0.4,0.6],p:[0,1.1,0],c:0x4a5568},{s:[0.7,0.3,0.5],p:[0,1.35,0],c:0x6a7388}])},
  {name: 'Wizard', kind: 'wizard', g: () => boxMan([{s:[0.4,0.85,0.35],p:[0,0.5,0],c:0xc45a18},{s:[0.28,0.3,0.28],p:[0,1.05,0],c:0xe8c8a0},{s:[0.2,0.45,0.2],p:[0,1.4,0],c:0x8a2a10}])}
];

const glbKinds = [
  {name: 'Sheep', file: 'sheep2.glb', kind: 'sheep', s: 1.0},
  {name: 'Haggis', file: 'haggis.glb', kind: 'haggis', s: 1.0},
  {name: 'Pig', file: 'pig2.glb', kind: 'pig', s: 1.0},
  {name: 'Skeleton', file: 'skeleton.glb', kind: 'skeleton', s: 1.0},
  {name: 'Black skeleton', file: 'skeleton.glb', kind: 'blackskel', s: 1.0, tint: 0x3a3a40},
  {name: 'Zombie', file: 'zombie.glb', kind: 'zombie', s: 1.0},
  {name: 'Spider', file: 'spider.glb', kind: 'spider', s: 1.0},
  {name: 'Ghost', file: 'ghost.glb', kind: 'ghost', s: 1.0},
  {name: 'Clansman', file: 'clansman.glb', kind: 'clansman', s: 1.0}
];

const mobItems = [];
for (const e of procedural) mobItems.push({name: e.name, kind: e.kind, build: e.g, procedural: true});
for (const e of glbKinds) {
  try {
    const path = new URL('../assets/models/' + e.file, import.meta.url);
    const glb = await loadMob(path);
    mobItems.push({name: e.name, kind: e.kind, glb, tint: e.tint});
  } catch (err) {
    console.warn('skip', e.file, err && err.message);
    mobItems.push({name: e.name, kind: e.kind, build: () => boxMan([{s:[0.4,0.8,0.3],p:[0,0.4,0],c: e.tint || 0x888888}])});
  }
}

function prepMob(it, after) {
  let g;
  if (it.glb) {
    g = it.glb.scene ? it.glb.scene.clone(true) : it.glb.clone(true);
    if (it.tint) g.traverse(o => { if (o.isMesh && o.material && o.material.color) o.material = o.material.clone(), o.material.color.setHex(it.tint); });
  } else g = it.build();
  if (after) U.applyPrism(g, {kind: it.kind, skinned: !!it.glb});
  return g;
}

save(pairSheet(mobItems, (e, after) => {
  const g = prepMob(e, after);
  return renderIso(g, 240, 280, e.name, [30, 34, 42, 255]);
}, 240, 280, 3, '1.2.41 listed mobs / NPCs (CPU, key + rim light). GLBs keep authored mesh + textures path, plus per-facet brightness and rim. Left before, right prism. Not a GPU capture.'), 'mobs-before-after.png');

console.log('sheets in', OUT);

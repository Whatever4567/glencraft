globalThis.self = globalThis;
import fs from 'node:fs';
import {createRequire} from 'node:module';
import * as THREE from '/workspace/glencraft-anatomy-tools/node_modules/three/build/three.module.js';
import {GLTFLoader} from '/workspace/glencraft-anatomy-tools/node_modules/three/examples/jsm/loaders/GLTFLoader.js';
import {MeshoptDecoder} from '/workspace/glencraft-anatomy-tools/node_modules/three/examples/jsm/libs/meshopt_decoder.module.js';

const {createCanvas, loadImage} = createRequire('/workspace/qa/tools/index.js')('@napi-rs/canvas');
const OUT = process.argv[2] || '/workspace/qa/pig-1248';
fs.mkdirSync(OUT, {recursive: true});
const ROOT = new URL('../../', import.meta.url);

await MeshoptDecoder.ready;
const L = new GLTFLoader();
L.setMeshoptDecoder(MeshoptDecoder);
const buf = fs.readFileSync(new URL('../../assets/models/pig2.glb', import.meta.url));
const ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
const g = await new Promise((res, rej) => L.parse(ab, '', res, rej));
const texImg = await loadImage(new URL('../../assets/tex/pig2_2k.webp', import.meta.url).pathname);
const TW = texImg.width, TH = texImg.height;
const tcanvas = createCanvas(TW, TH);
tcanvas.getContext('2d').drawImage(texImg, 0, 0);
const tdata = tcanvas.getContext('2d').getImageData(0, 0, TW, TH).data;
function sampleTex(u, v) {
  u = u - Math.floor(u); v = 1 - (v - Math.floor(v));
  const x = Math.max(0, Math.min(TW - 1, Math.floor(u * TW)));
  const y = Math.max(0, Math.min(TH - 1, Math.floor(v * TH)));
  const i = (y * TW + x) * 4;
  return [tdata[i] / 255, tdata[i + 1] / 255, tdata[i + 2] / 255];
}

const scene = g.scene;
scene.updateMatrixWorld(true);
const bones = {};
scene.traverse(o => { if (o.isBone || (o.name && o.name.startsWith('Bone'))) bones[o.name] = o; });
function findBone(n) {
  let f = null; scene.traverse(o => { if (o.name === n) f = o; }); return f;
}

function pose(kind) {
  // reset
  scene.traverse(o => { if (o.userData._r0) o.rotation.copy(o.userData._r0); });
  scene.traverse(o => { if ((o.isBone || o.name) && !o.userData._r0 && o.rotation) o.userData._r0 = o.rotation.clone(); });
  const hips = ['Bone.010', 'Bone.013', 'Bone.004', 'Bone.007'].map(findBone);
  const knees = ['Bone.011', 'Bone.014', 'Bone.005', 'Bone.008'].map(findBone);
  const head = findBone('Bone.002');
  const root = findBone('Bone') || scene;
  if (kind === 'idle') {
    if (head) head.rotation.x = (head.userData._r0 ? head.userData._r0.x : 0) + 0.12;
  } else if (kind === 'walk') {
    const a = 0.55;
    // diagonal gait
    if (hips[0]) hips[0].rotation.x = (hips[0].userData._r0?.x || 0) + a;
    if (hips[2]) hips[2].rotation.x = (hips[2].userData._r0?.x || 0) + a;
    if (hips[1]) hips[1].rotation.x = (hips[1].userData._r0?.x || 0) - a;
    if (hips[3]) hips[3].rotation.x = (hips[3].userData._r0?.x || 0) - a;
    if (knees[0]) knees[0].rotation.x = (knees[0].userData._r0?.x || 0) + 0.25;
    if (knees[1]) knees[1].rotation.x = (knees[1].userData._r0?.x || 0) - 0.15;
  } else if (kind === 'wallow') {
    // roll whole scene group for a lie-down, but keep a wrapper
  }
  scene.updateMatrixWorld(true);
  scene.traverse(o => { if (o.isSkinnedMesh && o.skeleton) { o.skeleton.update(); o.updateMatrixWorld(true); } });
}

function worldPos(o, i, out, tmp, acc, w4, M) {
  const p = o.geometry.attributes.position, si = o.geometry.attributes.skinIndex, sw = o.geometry.attributes.skinWeight;
  out.set(p.getX(i), p.getY(i), p.getZ(i));
  if (o.isSkinnedMesh && si && sw && o.skeleton) {
    tmp.copy(out).applyMatrix4(o.bindMatrix);
    acc.set(0, 0, 0);
    for (let k = 0; k < 4; k++) {
      const w = sw.getComponent(i, k); if (!w) continue;
      const bi = si.getComponent(i, k);
      M.multiplyMatrices(o.skeleton.bones[bi].matrixWorld, o.skeleton.boneInverses[bi]);
      acc.addScaledVector(w4.copy(tmp).applyMatrix4(M), w);
    }
    out.copy(acc).applyMatrix4(o.bindMatrixInverse);
  }
  out.applyMatrix4(o.matrixWorld);
  return out;
}

function renderPose(kind, W = 640, H = 480) {
  pose(kind);
  const roll = kind === 'wallow' ? 1.35 : 0;
  const canv = createCanvas(W, H);
  const ctx = canv.getContext('2d');
  ctx.fillStyle = '#6aa04a';
  ctx.fillRect(0, 0, W, H);
  // sky
  const grd = ctx.createLinearGradient(0, 0, 0, H * 0.45);
  grd.addColorStop(0, '#8ec6f0'); grd.addColorStop(1, '#cfe8ff');
  ctx.fillStyle = grd; ctx.fillRect(0, 0, W, H * 0.42);
  ctx.fillStyle = '#6aa04a'; ctx.fillRect(0, H * 0.42, W, H);

  const zbuf = new Float32Array(W * H); zbuf.fill(1e9);
  const v0 = new THREE.Vector3(), v1 = new THREE.Vector3(), v2 = new THREE.Vector3();
  const t0 = new THREE.Vector3(), acc = new THREE.Vector3(), w4 = new THREE.Vector3(), M = new THREE.Matrix4();
  const n0 = new THREE.Vector3(), n1 = new THREE.Vector3(), n2 = new THREE.Vector3();
  // camera: look from front-right, slightly above
  const eye = new THREE.Vector3(1.6, 0.95, 1.7);
  const at = new THREE.Vector3(0, 0.35, 0);
  const up = new THREE.Vector3(0, 1, 0);
  const cam = new THREE.Matrix4().lookAt(eye, at, up);
  const view = cam.clone().invert();
  const fl = 2.4;

  const meshes = [];
  scene.traverse(o => { if (o.isMesh || o.isSkinnedMesh) meshes.push(o); });
  const tris = [];
  for (const o of meshes) {
    const pos = o.geometry.attributes.position, uv = o.geometry.attributes.uv, idx = o.geometry.index;
    const nvert = idx ? idx.count : pos.count;
    const getI = i => idx ? idx.getX(i) : i;
    for (let i = 0; i < nvert; i += 3) {
      const ia = getI(i), ib = getI(i + 1), ic = getI(i + 2);
      worldPos(o, ia, v0, t0, acc, w4, M);
      worldPos(o, ib, v1, t0, acc, w4, M);
      worldPos(o, ic, v2, t0, acc, w4, M);
      if (roll) {
        const cz = Math.cos(roll), sz = Math.sin(roll);
        const rot = (v) => { const y = v.y - 0.3, z = v.z; v.y = 0.3 + y * cz - z * sz; v.z = y * sz + z * cz; };
        rot(v0); rot(v1); rot(v2);
      }
      n0.copy(v1).sub(v0); n1.copy(v2).sub(v0); n2.copy(n0).cross(n1).normalize();
      const uva = uv ? [uv.getX(ia), uv.getY(ia)] : [0, 0];
      const uvb = uv ? [uv.getX(ib), uv.getY(ib)] : [0, 0];
      const uvc = uv ? [uv.getX(ic), uv.getY(ic)] : [0, 0];
      tris.push({
        p: [v0.clone(), v1.clone(), v2.clone()],
        uv: [uva, uvb, uvc],
        n: n2.clone(),
        z: (v0.z + v1.z + v2.z) / 3
      });
    }
  }

  function project(v) {
    const p = v.clone().applyMatrix4(view);
    const s = fl / Math.max(0.05, -p.z);
    return {x: W * 0.5 + p.x * s * H * 0.42, y: H * 0.58 - p.y * s * H * 0.42, z: -p.z, px: p};
  }

  const light = new THREE.Vector3(0.45, 0.75, 0.45).normalize();
  const img = ctx.getImageData(0, 0, W, H);
  const data = img.data;

  function edge(ax, ay, bx, by, cx, cy) { return (cx - ax) * (by - ay) - (cy - ay) * (bx - ax); }

  for (const t of tris) {
    const a = project(t.p[0]), b = project(t.p[1]), c = project(t.p[2]);
    if (a.z <= 0.05 || b.z <= 0.05 || c.z <= 0.05) continue;
    const area = edge(a.x, a.y, b.x, b.y, c.x, c.y);
    if (area <= 1) continue; // backface
    const minx = Math.max(0, Math.min(W - 1, Math.floor(Math.min(a.x, b.x, c.x))));
    const maxx = Math.max(0, Math.min(W - 1, Math.ceil(Math.max(a.x, b.x, c.x))));
    const miny = Math.max(0, Math.min(H - 1, Math.floor(Math.min(a.y, b.y, c.y))));
    const maxy = Math.max(0, Math.min(H - 1, Math.ceil(Math.max(a.y, b.y, c.y))));
    const ndl = Math.max(0.25, t.n.dot(light) * 0.7 + 0.35);
    const za = 1 / a.z, zb = 1 / b.z, zc = 1 / c.z;
    const ua = t.uv[0][0] * za, va = t.uv[0][1] * za;
    const ub = t.uv[1][0] * zb, vb = t.uv[1][1] * zb;
    const uc = t.uv[2][0] * zc, vc = t.uv[2][1] * zc;
    for (let y = miny; y <= maxy; y++) for (let x = minx; x <= maxx; x++) {
      const w0 = edge(b.x, b.y, c.x, c.y, x + 0.5, y + 0.5);
      const w1 = edge(c.x, c.y, a.x, a.y, x + 0.5, y + 0.5);
      const w2 = edge(a.x, a.y, b.x, b.y, x + 0.5, y + 0.5);
      if (w0 < 0 || w1 < 0 || w2 < 0) continue;
      const inv = 1 / (w0 + w1 + w2);
      const z = 1 / (w0 * inv * za + w1 * inv * zb + w2 * inv * zc);
      const pi = y * W + x;
      if (z >= zbuf[pi]) continue;
      zbuf[pi] = z;
      const u = z * (w0 * inv * ua + w1 * inv * ub + w2 * inv * uc);
      const v = z * (w0 * inv * va + w1 * inv * vb + w2 * inv * vc);
      const col = sampleTex(u, v);
      const o = pi * 4;
      data[o] = Math.max(0, Math.min(255, col[0] * ndl * 255));
      data[o + 1] = Math.max(0, Math.min(255, col[1] * ndl * 255));
      data[o + 2] = Math.max(0, Math.min(255, col[2] * ndl * 255));
      data[o + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  ctx.fillStyle = 'rgba(10,20,10,0.7)';
  ctx.fillRect(12, H - 40, 160, 28);
  ctx.fillStyle = '#f4f0e4';
  ctx.font = 'bold 20px sans-serif';
  ctx.fillText(kind, 22, H - 20);
  const dest = `${OUT}/pig-${kind}.png`;
  fs.writeFileSync(dest, canv.toBuffer('image/png'));
  console.log('wrote', dest);
  return dest;
}

const idle = renderPose('idle');
const walk = renderPose('walk');
const wallow = renderPose('wallow');
// contact sheet
const w = 640, h = 480;
const sheet = createCanvas(w * 3, h);
const sctx = sheet.getContext('2d');
for (const [i, p] of [idle, walk, wallow].entries()) {
  const im = await loadImage(p);
  sctx.drawImage(im, i * w, 0);
}
sctx.fillStyle = 'rgba(0,0,0,0.55)';
sctx.fillRect(0, 0, w * 3, 36);
sctx.fillStyle = '#fff';
sctx.font = 'bold 22px sans-serif';
sctx.fillText('Glencraft pigs 1.2.48  —  idle    walk (diagonal gait)    wallow (in mud, then they stand up)', 16, 26);
const sheetPath = `${OUT}/pig-poses.png`;
fs.writeFileSync(sheetPath, sheet.toBuffer('image/png'));
console.log('sheet', sheetPath);

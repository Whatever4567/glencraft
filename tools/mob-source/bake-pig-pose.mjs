// Bake a skinned pig GLB pose to a static mesh GLB at ~1-unit height, feet on y=0.
globalThis.self = globalThis;
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import * as THREE from '/workspace/glencraft-anatomy-tools/node_modules/three/build/three.module.js';
import {GLTFLoader} from '/workspace/glencraft-anatomy-tools/node_modules/three/examples/jsm/loaders/GLTFLoader.js';
import {MeshoptDecoder} from '/workspace/glencraft-anatomy-tools/node_modules/three/examples/jsm/libs/meshopt_decoder.module.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const SRC = process.argv[2] || path.join(ROOT, 'assets/models/pig2.glb');
const OUT = process.argv[3] || '/tmp/pig-work/pig2-idle.glb';
const CLIP = process.argv[4] || '';
const TIME = parseFloat(process.argv[5] || '0');
const TEX = process.argv[6] || ''; // unused; material color only

await MeshoptDecoder.ready;
const loader = new GLTFLoader();
loader.setMeshoptDecoder(MeshoptDecoder);
const buf = fs.readFileSync(SRC);
const ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
const gltf = await new Promise((res, rej) => loader.parse(ab, '', res, rej));
const scene = gltf.scene;
scene.updateMatrixWorld(true);
scene.traverse(o => { if (o.isSkinnedMesh && o.skeleton) { o.skeleton.update(); o.updateMatrixWorld(true); } });

if (CLIP) {
  const clip = gltf.animations.find(a => a.name.toLowerCase() === CLIP.toLowerCase());
  if (clip) {
    const mix = new THREE.AnimationMixer(scene);
    const act = mix.clipAction(clip);
    act.play(); act.paused = true; act.time = TIME;
    mix.update(0);
    scene.updateMatrixWorld(true);
    scene.traverse(o => { if (o.isSkinnedMesh && o.skeleton) o.skeleton.update(); });
  } else {
    console.warn('no clip', CLIP, 'have', gltf.animations.map(a => a.name));
  }
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

const v = new THREE.Vector3(), t = new THREE.Vector3(), acc = new THREE.Vector3(), w4 = new THREE.Vector3(), M = new THREE.Matrix4();
const nrm = new THREE.Vector3();
const positions = [], normals = [], uvs = [], colors = [];
const box = new THREE.Box3();
scene.traverse(o => {
  if (!o.isMesh || !o.geometry) return;
  const pos = o.geometry.attributes.position;
  const uv = o.geometry.attributes.uv;
  const nor = o.geometry.attributes.normal;
  const idx = o.geometry.index;
  const nvert = idx ? idx.count : pos.count;
  const getI = i => idx ? idx.getX(i) : i;
  for (let i = 0; i < nvert; i++) {
    const id = getI(i);
    worldPos(o, id, v, t, acc, w4, M);
    positions.push(v.x, v.y, v.z);
    box.expandByPoint(v);
    if (uv) uvs.push(uv.getX(id), uv.getY(id));
    else uvs.push(0, 0);
    if (nor) {
      nrm.set(nor.getX(id), nor.getY(id), nor.getZ(id)).transformDirection(o.matrixWorld).normalize();
      normals.push(nrm.x, nrm.y, nrm.z);
    } else normals.push(0, 1, 0);
  }
});
console.log('raw box', box.min.toArray(), box.max.toArray(), 'size', box.getSize(new THREE.Vector3()).toArray(), 'verts', positions.length / 3);

// Normalise: feet on y=0, height 1
const size = box.getSize(new THREE.Vector3());
const k = 1 / Math.max(1e-6, size.y);
const cx = (box.min.x + box.max.x) / 2;
const cz = (box.min.z + box.max.z) / 2;
for (let i = 0; i < positions.length; i += 3) {
  positions[i] = (positions[i] - cx) * k;
  positions[i + 1] = (positions[i + 1] - box.min.y) * k;
  positions[i + 2] = (positions[i + 2] - cz) * k;
}

const geo = new THREE.BufferGeometry();
geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
geo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
geo.computeVertexNormals();

function writeGlb(pos, nrm, uv, dest) {
  const pB = Buffer.from(new Float32Array(pos).buffer);
  const nB = Buffer.from(new Float32Array(nrm).buffer);
  const uB = Buffer.from(new Float32Array(uv).buffer);
  const parts = [pB, nB, uB];
  let bin = Buffer.concat(parts);
  while (bin.length % 4) bin = Buffer.concat([bin, Buffer.from([0])]);
  const acc = (off, len, typ, n, min, max) => {
    const a = {bufferView: views.length, componentType: 5126, count: n, type: typ};
    if (min) { a.min = min; a.max = max; }
    views.push({buffer: 0, byteOffset: off, byteLength: len, target: 34962});
    accs.push(a); return accs.length - 1;
  };
  const views = [], accs = [];
  const n = pos.length / 3;
  let min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < n; i++) for (let k = 0; k < 3; k++) {
    const v = pos[i * 3 + k]; if (v < min[k]) min[k] = v; if (v > max[k]) max[k] = v;
  }
  const aP = acc(0, pB.length, 'VEC3', n, min, max);
  const aN = acc(pB.length, nB.length, 'VEC3', n);
  const aU = acc(pB.length + nB.length, uB.length, 'VEC2', n);
  const json = {
    asset: {version: '2.0', generator: 'bake-pig-pose'},
    scene: 0, scenes: [{nodes: [0]}],
    nodes: [{mesh: 0, name: 'PigBake'}],
    meshes: [{primitives: [{attributes: {POSITION: aP, NORMAL: aN, TEXCOORD_0: aU}, material: 0}]}],
    materials: [{name: 'PigSkin', pbrMetallicRoughness: {baseColorFactor: [1,1,1,1], metallicFactor: 0.05, roughnessFactor: 0.55}}],
    accessors: accs, bufferViews: views, buffers: [{byteLength: bin.length}]
  };
  let js = Buffer.from(JSON.stringify(json));
  while (js.length % 4) js = Buffer.concat([js, Buffer.from([0x20])]);
  const total = 12 + 8 + js.length + 8 + bin.length;
  const out = Buffer.alloc(total);
  out.writeUInt32LE(0x46546C67, 0);
  out.writeUInt32LE(2, 4);
  out.writeUInt32LE(total, 8);
  out.writeUInt32LE(js.length, 12);
  out.writeUInt32LE(0x4E4F534A, 16);
  js.copy(out, 20);
  out.writeUInt32LE(bin.length, 20 + js.length);
  out.writeUInt32LE(0x004E4942, 24 + js.length);
  bin.copy(out, 28 + js.length);
  fs.mkdirSync(path.dirname(dest), {recursive: true});
  fs.writeFileSync(dest, out);
  console.log('wrote', dest, out.length, 'h', (max[1]-min[1]).toFixed(3));
}
const nrmAttr = geo.getAttribute('normal');
const nrmArr = [];
for (let i = 0; i < nrmAttr.count; i++) nrmArr.push(nrmAttr.getX(i), nrmAttr.getY(i), nrmAttr.getZ(i));
writeGlb(positions, nrmArr, uvs, OUT);

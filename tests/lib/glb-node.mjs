import fs from 'node:fs';
import * as THREE from '/workspace/glencraft-anatomy-tools/node_modules/three/build/three.module.js';
import {GLTFLoader} from '/workspace/glencraft-anatomy-tools/node_modules/three/examples/jsm/loaders/GLTFLoader.js';
import {MeshoptDecoder} from '/workspace/glencraft-anatomy-tools/node_modules/three/examples/jsm/libs/meshopt_decoder.module.js';
export async function loadGun(n) { await MeshoptDecoder.ready; const L = new GLTFLoader(); L.setMeshoptDecoder(MeshoptDecoder); L.register(p => { p.loadTexture = () => Promise.resolve(null); p.assignTexture = () => Promise.resolve(null); return {name: 'notex'}; });
  const b = fs.readFileSync('/workspace/gc-126/assets/guns/gun_' + n + '_2k.glb'); const ab = b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength);
  return new Promise((res, rej) => L.parse(ab, '', g => res(g.scene), rej)); }

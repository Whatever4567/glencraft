// v1.2.26: runs the game's own GLX-TP-HD block (the third person player builder, its armour fit and kilt hook) sliced from an index.html,
// with three r160 and a stand in 2D canvas (textures are made, not drawn). Real THREE geometry and transforms; no rendering.
import fs from 'node:fs'; import assert from 'node:assert';
const NM = '/workspace/glencraft-anatomy-tools/node_modules/three/';
const T = await import(NM + 'build/three.module.js');
export function load(file) {
  const html = fs.readFileSync(file, 'utf8'); const i = html.indexOf('/* GLX-TP-HD '), j = html.indexOf('/* GLX-', i + 8); assert(i > 0 && j > i, 'TP-HD block');
  const ctx2d = new Proxy({}, {get: (t, k) => k in t ? t[k] : () => ({addColorStop() {}}), set: (t, k, v) => { t[k] = v; return true; }});
  const canvases = []; const document = {createElement: () => { const c = {width: 0, height: 0, getContext: () => ctx2d}; canvases.push(c); return c; }};
  const G = {THREE: T, document, window: {}, performance, Math, console, setTimeout: () => 0, camera: new T.PerspectiveCamera(),
    playerTextures() {}, faceTexP: new T.Texture(), tartanTex: new T.Texture(), fitPiece: () => {}, updateWorldModel: () => {}, dressModel: () => {}, armour: [0, 0, 0, 0], buildPlayerModel: null};
  G.window = G; const names = Object.keys(G);
  const fn = new Function(...names, html.slice(i, j) + '\nreturn {build: buildPlayerModel, fit: fitPiece, dress: dressModel, U: window.__tph};');
  const r = fn(...names.map(k => G[k])); r.canvases = canvases; r.T = T; return r; }
export function stats(T, g) { g.updateMatrixWorld(true); let tris = 0, meshes = 0, lo = 0; const geos = new Set(), mats = new Set(), texs = new Set();
  g.traverse(o => { if (!o.isMesh) return; meshes++; const ge = o.geometry, n = (ge.index ? ge.index.count : ge.attributes.position.count) / 3; tris += n; geos.add(ge); (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => { mats.add(m); for (const k of ['map', 'bumpMap']) if (m[k]) texs.add(m[k]); }); });
  for (const [m, hi, l] of g.userData.lod || []) lo += (l.index ? l.index.count : l.attributes.position.count) / 3 - (hi.index ? hi.index.count : hi.attributes.position.count) / 3;
  let nodes = 0; g.traverse(() => nodes++); return {tris, trisFar: tris + lo, meshes, nodes, geos: geos.size, mats: mats.size, texs: texs.size}; }

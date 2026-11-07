// Node harness for the first person hands: runs the game's own hand rig (base hand graph, setHeld, updateHand), the HD pick model
// builder, the procedural guns plus the real GLB swap (C322), the viewmodel (C350), the HD arms with IK (FPA) and the grip modules.
// Not included: the other updateHand wrappers between the base and FPA (C5 wrist bridge, C71 bob, C145 musket aim), textures, rendering.
import fs from 'node:fs'; import assert from 'node:assert';
import * as THREE0 from '/workspace/glencraft-anatomy-tools/node_modules/three/build/three.module.js';
import {loadGun} from './glb-node.mjs';
const html = fs.readFileSync(new URL('../../index.html', import.meta.url), 'utf8');
const cut = (a, b, from) => { const i = html.indexOf(a, from || 0), j = html.indexOf(b, i + 10); assert(i > 0 && j > i, 'cut ' + a.slice(0, 40)); return html.slice(i, j); };
export async function make() {
  const THREE = Object.assign({}, THREE0);
  const MOD = {pistol: await loadGun('pistol'), rifle: await loadGun('rifle')};
  for (const n in MOD) MOD[n].traverse(o => { if (o.isMesh) { o.castShadow = false; o.frustumCulled = false; const m = o.material; if (m && /glass/i.test(m.name)) o.visible = false; } if (/_scope$/.test(o.name)) o.visible = false; });
  const ctx = new Proxy({}, {get: (t, k) => k === 'createLinearGradient' || k === 'createRadialGradient' ? () => ({addColorStop() {}}) : () => {}, set: () => true});
  const document = {createElement: () => ({width: 0, height: 0, getContext: () => ctx, style: {}}), head: {appendChild() {}}, body: {appendChild() {}, classList: {toggle() {}}}};
  const IT = {PISTOL: 300, MUSKET: 301}, PICK = 761;
  const inv = {[IT.PISTOL]: 1, [IT.MUSKET]: 1, [PICK]: 1};
  const G = {THREE, Math, JSON, Object, Array, Map, Set, Number, String, isFinite, performance, document, console,
    camera: new THREE.PerspectiveCamera(70, 1.6, 0.05, 1000), scene: new THREE.Scene(), renderer: {render() {}, initTexture() {}},
    P: {x: 0, y: 0, z: 0, yaw: 0, pitch: 0, onGround: true}, SET: {fov: 70, hd: 1, legs: 0, sfx: 1}, camMode: 0, started: true, dead: false, menuOpen: false, paused: false,
    IT, GUN: {[IT.PISTOL]: {reload: 1.6}, [IT.MUSKET]: {reload: 2.4}}, TOOL: {[PICK]: ['pick', 4, 50, 6]}, cnt: id => inv[id] || 0, selId: PICK, armour: [0, 0, 0, 0, 0], ARMOUR: {}, armourMat: () => null,
    gunReload: 0, gunReloadId: 0, sprinting: false, ironBuzz: 0, heldBy: null, bobPhase: 0, worldModel: null, DIM: {cur: null}, MODE: {}, flying: false, tartanTex: null, sfx() {},
    clamp: (v, a, b) => Math.max(a, Math.min(b, v)), updateWorldModel() {}, buildPlayerModel: () => null, dressModel() {}, __c340: {shots: 0, k: 0}, __c288: {aiming: false}};
  G.window = G; G.requestAnimationFrame = () => 0; G.setInterval = () => 0; G.setTimeout = () => 0; G.navigator = {userAgent: 'node'}; G.innerWidth = 1600; G.innerHeight = 1000; G.addEventListener = () => {};
  const graph = cut('const hand = new THREE.Group();\ncamera.add(hand);', '// a wee haggis') + '\nconst grabHaggis = new THREE.Group(); hand.add(grabHaggis);';
  const lets = cut('let swingT = 0, swingKind', '\n') + '\nlet heldId = null, heldMesh3p = null;';
  const handSys = cut('function setHeld(id) {', 'function updateWorldModel(dt, moved) {', html.indexOf('function setHeld(id) {', 17000 * 0 + html.indexOf('const handPose') - 4000));
  const hd = 'const T2 = {leather: null, brushed: null}; const X = {pale: new THREE.MeshPhongMaterial({color: 0xc8a070}), dark: new THREE.MeshPhongMaterial({color: 0x6a4a2a})}; const MATS = {};' +
    'function tierMats(mat) { return {head: new THREE.MeshPhongMaterial({color: 0xa64dff}), edge: new THREE.MeshPhongMaterial({color: 0xffffff}), dark: new THREE.MeshPhongMaterial({color: 0x442266}), wrap: new THREE.MeshPhongMaterial({color: 0x4a2e1b}), haft: X.pale, haftD: X.dark, fit: new THREE.MeshPhongMaterial({color: 0x5a5e64})}; }' +
    cut('  const ex = (pts, depth, bev, segs) => {', '  const bt = buildToolModel; buildToolModel = function (kind, mat) { if (KINDS.has(kind))');
  const guns = 'const M = new Proxy({}, {get: () => new THREE.MeshStandardMaterial()});' + cut('  const box = (p, m, w, h, d, x, y, z, rx) => {', '  const live = new Set();', html.indexOf('GLX-C43 (v0.9.43)'));
  const c322 = 'const __c322 = window.__c322 = {err: null, swapped: 0, ok: {}, load() {}}; { const U = __c322; const hd = () => true; const ERR = (w, e) => { if (!U.err) U.err = w + " " + String(e && e.stack || e).slice(0, 300); };' + cut('  const BB = new THREE.Box3(), V = new THREE.Vector3();', '  setInterval(() => { try { if (typeof started', html.indexOf('GLX-C322 (v1.1.99)')) + '}';
  const mim = `function makeItemMesh(id) { if (id === IT.PISTOL || id === IT.MUSKET) { const g = id === IT.PISTOL ? pistolMesh() : rifleMesh(); g.rotation.set(0, Math.PI / 2, 0); return g; }
    if (id === ${PICK}) { const g = buildHD('pick', 'crystalpurple'); g.userData.tool = true; g.userData.kind = 'pick'; g.scale.multiply(new THREE.Vector3(0.86, 1.12, 0.62)); g.userData.p761 = 1; return g; } return new THREE.Group(); }
    function updateHand0(dt, moving) {}`;
  const fpa = cut('/* GLX-FPA (v1.1.99)', '/* GLX-TP-HD');
  const rla = 'window.__rl = {t: 0, dur: 1, id: 0};';
  const vm = cut('/* GLX-C350', '/* GLX-');
  const vmEnd = html.indexOf('/* GLX-', html.indexOf('/* GLX-C350') + 10); const vmSrc = html.slice(html.indexOf('/* GLX-C350'), vmEnd);
  const grip = cut('/* GLX-GRIP1222', '/* GLX-AG1222');
  const hook = '{ const u0 = updateHand; updateHand = function () { const r = u0.apply(this, arguments); if (window.__hx) window.__hx(); return r; }; }';
  const body = graph + '\n' + lets + '\n' + handSys + '\n' + hook + '\n' + hd + '\n' + guns + '\n' + mim + '\n' + c322 + '\n' + grip + '\n' + rla + '\n' + fpa + '\n' + vmSrc +
    `\nthis.__h = {hand, held, armPivot, setHeld, swing, frame: dt => updateHand(dt, false), MOD: __c322, setSel: id => { selId = id; setHeld(id); }, set: (k, v) => { eval(k + ' = v'); }, get: k => eval(k)};`;
  // MOD for the swap
  G.__MOD = MOD;
  new Function('with(this){' + body.replace('const MOD = {}, want = {};', '') + '}').call(Object.assign(G, {MOD}));
  return {G, H: G.__h, MOD, IT, PICK};
}

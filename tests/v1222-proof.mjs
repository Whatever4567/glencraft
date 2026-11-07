import * as THREE from '/workspace/glencraft-anatomy-tools/node_modules/three/build/three.module.js';
import fs from 'fs'; import assert from 'assert';
const R = p => fs.readFileSync(new URL('../' + p, import.meta.url), 'utf8'); const html = R('index.html'); const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
for (const k of ['b1222-v1.2.22', "GAME_VERSION = '1.2.22'", '__gs1222.tool(held.children[0], camera, SR, 1)', '__gs1222.gun(g, camera, fw)', 'U.defer = (U.defer || 0) + 1', "U.why = !ring ? 'no ring'", '__ag1222.floorAt(', '__ag1222.mats()', 'U.scrG = g', '((T.parts && T.parts.TS) || scene).add(o)', 'bar.renderOrder = 5', 'U.roC = c']) assert.equal(html.split(k).length, 2, k);
for (const k of ['__hg1221', 'U.wrist = Math.min(ang, MX)', "setFromQuaternion(p.h.quaternion, 'YXZ')"]) assert(!html.includes(k), 'gone ' + k);
const notes = html.slice(html.indexOf("{\"v\":\"v1.2.22\""), html.indexOf("]}", html.indexOf("{\"v\":\"v1.2.22\"")) + 2); assert(!notes.includes("'"), 'no apostrophes');
// ---- grip sockets (real module source, real three) ----
const window = {}; new Function('THREE', 'window', R('tools/content-source/grip-1222.js'))(THREE, window); const GS = window.__gs1222;
const mk = () => { const held = new THREE.Group(), item = new THREE.Group(); held.add(item); const hm = new THREE.Mesh(new THREE.BoxGeometry(0.036, 0.62, 0.036)); hm.position.y = 0.31; item.add(hm);
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.12, 0.04)); head.position.set(0.06, 0.58, 0); item.add(head); item.rotation.z = -0.6; item.scale.setScalar(0.8); return {held, item}; };
const cam = new THREE.PerspectiveCamera(); cam.updateMatrixWorld(true); const S = V3(0.2, -0.36, 0.02); let worst = 0, worstAx = 0, n = 0;
const {held, item} = mk(); held.position.set(0.3, -0.3, -0.5);
for (let t = 0; t <= 1.0001; t += 0.05) { held.rotation.set(-1.2 * Math.sin(t * Math.PI), 0.3 * t, 0.4 * Math.sin(t * 6)); held.position.y = -0.3 - 0.1 * t; held.updateMatrixWorld(true);
  const f = GS.tool(item, cam, S, 1); assert(f, 'socket found'); for (const v of [f.G, f.x, f.y, f.z]) assert(isFinite(v.x + v.y + v.z));
  const det = new THREE.Matrix4().makeBasis(f.x, f.y, f.z).determinant(); assert(Math.abs(det - 1) < 1e-6, 'det ' + det);
  const b = item.localToWorld(V3(0, 0, 0)), h = item.localToWorld(V3(0, 0.62, 0)), ax = h.clone().sub(b).normalize(), truth = b.clone().lerp(h, 0.27);
  worst = Math.max(worst, f.G.distanceTo(truth)); worstAx = Math.max(worstAx, f.x.angleTo(ax));
  // hand frame from grip(): origin = G - 0.075 y - (r + 0.016) z, palm surface centre = origin + 0.05 y + 0.015 z ; distance from the handle axis
  const o = f.G.clone().addScaledVector(f.y, -0.075).addScaledVector(f.z, -(f.r + 0.016)), pc = o.clone().addScaledVector(f.y, 0.05).addScaledVector(f.z, 0.015);
  const d = pc.clone().sub(b), off = d.clone().addScaledVector(ax, -d.dot(ax)).length() - f.r; n++; if (Math.abs(off) > 0.03) throw Error('palm gap ' + off); }
assert(worst < 1e-6 && worstAx < 1e-6, 'grip follows handle ' + worst + ' ' + worstAx);
// single mesh item: no socket, falls back
const solo = new THREE.Group(); solo.add(new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.02))); assert.equal(GS.tool(solo, cam, S, 1), null);
// guns: right handed frame through recoil
const g = new THREE.Group(); g.add(new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.1, 0.4))); for (let t = 0; t < 1; t += 0.1) { g.rotation.set(0.3 * t, 0.1, -0.2 * t); g.updateMatrixWorld(true); const fw = V3(0, 0, -1).applyQuaternion(g.quaternion); const a = GS.gun(g, cam, fw);
  const z = a.rt.clone().negate(), x = a.up, y = V3(0, 0, 0).crossVectors(z, x); assert(Math.abs(new THREE.Matrix4().makeBasis(x, y, z).determinant() - 1) < 1e-6); assert(y.angleTo(fw) < 1e-6, 'fingers forward'); }
// ---- Agartha module (real source with stubs) ----
const W2 = {}; let flashA = 0.8; const fl = {style: {opacity: '0.4'}}; const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(); let rendered = [];
const pl = new THREE.PointLight(0xffffff, 6, 600); pl.position.set(0, 200, 0); scene.add(pl); const near = new THREE.PointLight(0xffa000, 2, 10); near.position.set(0, -98, 0); scene.add(near); camera.position.set(0, -99, 0);
const renderer = {render(s, c) { rendered.push([pl.intensity, near.intensity]); }, capabilities: {maxTextureSize: 8192, getMaxAnisotropy: () => 8}};
const ctx = {DIM: {cur: null}, P: {y: -99}, SEA: 64, H: 160, T: {WATER: 9, LAVA: 10}, PLANT: {}, world: [], idx: () => 0, started: true, crossGeo: new THREE.BufferGeometry()};
const earth = (x, y, z) => (y < -100 ? 1 : 0); W2.__c320 = {earth};
const doc = {getElementById: () => fl, createElement: () => ({getContext: () => new Proxy({}, {get: () => () => ({addColorStop() {}})}), width: 0, height: 0})};
const src = R('tools/content-source/agartha-1222.js'); const fn = new Function('THREE', 'window', 'document', 'renderer', 'scene', 'camera', 'ctx', 'setInterval', 'matchMedia', 'getFlash', 'setFlash', 'getUW', 'setUW',
  'with (ctx) { var updateWeather = getUW(); ' + src.replace(/flashA = 0;/, 'setFlash(0);').replace('if (flashA > 0)', 'if (getFlash() > 0)') + '; setUW(updateWeather); }');
let uw = () => { flashA = 1; }; fn(THREE, W2, doc, renderer, scene, camera, ctx, () => 0, () => ({matches: false}), () => flashA, v => { flashA = v; }, () => uw, v => { uw = v; });
uw(); assert.equal(flashA, 0, 'flash cut deep'); assert.equal(fl.style.opacity, '0'); const A = W2.__ag1222; A.isDeep() && (A.deep = 1); renderer.render(scene, camera);
assert.deepEqual(rendered.pop(), [0, 2], 'far flash light cut, near torch kept'); assert.equal(pl.intensity, 6, 'restored after frame');
ctx.P.y = 100; uw(); assert.equal(flashA, 1, 'surface keeps lightning');
assert.equal(A.floorAt(5, 5, -90), -100, 'floor found below'); assert.equal(A.floorAt(5, 5, -112), -100, 'floor found above');
W2.__agw = {L: {city: [100, 200, 40], FL: -100}}; const ring = A.ring(); assert(ring && ring.fb && ring.R === 20 && ring.Y === -100, 'fallback ring');
assert.equal(A.atlasSize(), 2048, 'desktop atlas 2048'); const bg = new THREE.BoxGeometry(1, 1, 1); A.remap(bg, ['skin', 'skin', 'nemes', 'skin', 'face', 'nemes']); const t = A.tile('face'); for (let i = 16; i < 20; i++) { const u = bg.attributes.uv.getX(i), v = bg.attributes.uv.getY(i); assert(u >= t[0] - 1e-9 && u <= t[2] + 1e-9 && v >= t[1] - 1e-9 && v <= t[3] + 1e-9, 'front face in face tile'); }
console.log(JSON.stringify({ok: true, gripSamples: n, gripErr: worst, axisErr: worstAx}));

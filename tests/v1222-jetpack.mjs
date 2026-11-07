// v1.2.22: white jetpack model (worn, held, dropped) + icon from the same cached model, gold untouched, flames aligned; settings LB/RB over all 5 tabs
import fs from 'node:fs'; import assert from 'node:assert';
import * as THREE0 from '/workspace/glencraft-anatomy-tools/node_modules/three/build/three.module.js';
import {parseHTML} from '/workspace/domtools/node_modules/linkedom/esm/index.js';
const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const cut = (a, b) => { const i = html.indexOf(a), j = html.indexOf(b, i + 10); assert(i > 0 && j > i, a); return html.slice(i, j); };
const c102 = cut('(function c102jet() {', '/* ===================== GLX-C102b'), jp = cut('/* GLX-JP1222', '/* GLX-C400');
let geoN = 0; class R { constructor() { this.n = 0; } setPixelRatio() {} setSize() {} setClearColor() {} render() { this.n++; } get domElement() { return {toDataURL: () => 'data:image/png;base64,NEW'}; } dispose() {} forceContextLoss() {} }
const THREE = new Proxy(THREE0, {get(t, k) { if (k === 'WebGLRenderer') return R; const v = t[k]; if (typeof k === 'string' && /Geometry$/.test(k)) return class extends v { constructor(...a) { super(...a); geoN++; } }; return v; }});
const {document} = parseHTML('<html><body></body></html>');
const ivs = []; const scene = new THREE0.Scene();
const newModel = () => { const torso = new THREE0.Group(); return {userData: {torso, armourParts: []}}; };
const G = {THREE, document, IT: {}, NAMES: {}, ARMOUR: {}, ARMOUR_COL: {}, MATCOL: {}, ICONS: {777: 'GOLD'}, drawIcon: () => 'OLD', RECIPES: [], rc: () => ({}), ORDER: [], CREATIVE_ALL: [],
  armour: [0, 0, 0, 0, 291], dressModel(m) { m.userData.armourParts.forEach(p => p.parent && p.parent.remove(p)); m.userData.armourParts = []; }, updatePlayer() {}, hurt() {}, requestAnimationFrame() {}, performance,
  P: {x: 0, y: 10, z: 0, vy: 0, yaw: 0, onGround: false}, jumpHeld: true, jumpHeldPad: false, keys: {}, swimming: false, MODE: {}, flying: false, heldBy: null, H: 200, moveAxis() {}, sprinting: false, AC: null,
  makeItemMesh: () => new THREE0.Group(), drops: [], scene, dropItem(id, n, x, y, z) { const m = new THREE0.Sprite(); m.position.set(x, y, z); scene.add(m); G.drops.push({id, n, m}); },
  setInterval: f => { ivs.push(f); return ivs.length; }, clearInterval() {}, setTimeout() {}, renderHotbar() {}, renderer: {}, touchMode: false, PERF: false, console};
G.window = G;
new Function('with(this){' + c102 + jp + '}').call(G); const U = G.__jp1222; assert.equal(U.err, null);
// worn: new model, shared geometry, flames under the nozzles
const m1 = newModel(); G.dressModel(m1); const parts = m1.userData.armourParts; const pack = parts.find(p => p.name === 'jetpack1222'); assert(pack, 'worn uses the new model');
const g0 = geoN; const m2 = newModel(); G.dressModel(m2); G.dressModel(m2); G.dressModel(m1); assert.equal(geoN, g0, 'no new geometry on repeated dressing'); assert.equal(U.builds, 1);
const fl = m1.userData.armourParts.filter(p => p.userData.jetFlame); assert.equal(fl.length, 2);
const noz = pack.children.filter(c => c.geometry.type === 'CylinderGeometry' && c.geometry.parameters.openEnded); assert.equal(noz.length, 2, 'twin nozzles');
for (const f of fl) { const n = m1.userData.armourParts.find(p => p.name === 'jetpack1222'); const top = f.position.y + 0.35, nozBottom = U.AT[1] + U.NOZ[0][1]; assert(Math.abs(top - nozBottom) < 1e-6, 'flame starts at the nozzle');
  assert(Math.abs(Math.abs(f.position.x) - 0.15) < 1e-6 && Math.abs(f.position.z + 0.4) < 1e-6, 'flame x/z match the old flames and the puff particles'); }
assert(pack.children.length >= 25, 'vents, straps, bands, gauge'); const white = pack.children[0].material; assert(white.color.getHex() === 0xffffff || white.color.getHex() === 0xf2f4f7, 'white body');
// flames still driven by the jet code
G.updatePlayer(0.016, 0, 0); G.updatePlayer(0.2, 0, 0); assert(fl.every(f => f.visible), 'boost shows the flames');
// gold path keeps the old model exactly
G.__gjSwap = 1; const mg = newModel(); G.dressModel(mg); G.__gjSwap = 0; assert(!mg.userData.armourParts.some(p => p.name === 'jetpack1222')); assert(mg.userData.armourParts.some(p => p.material && p.material.color && p.material.color.getHex() === 0x8a9098), 'gold swap still finds 0x8a9098');
assert(html.includes('window.__gjSwap = 1; try { return f.apply(self, args); } finally { armour[4] = GJ; window.__gjSwap = 0; }'));
const g1 = geoN; // held and dropped
const h = G.makeItemMesh(291); assert(h.userData.jp1222 && h.children[0].name === 'jetpack1222'); assert.equal(G.makeItemMesh(5).userData.jp1222, undefined);
G.dropItem(291, 1, 1, 2, 3); const d = G.drops.at(-1); assert(d.m.userData.jp1222 && d.m.position.y === 2 && !scene.children.some(o => o.isSprite)); assert.equal(geoN, g1, 'held/dropped share geometry');
G.dropItem(5, 1, 0, 0, 0); assert(G.drops.at(-1).m.isSprite, 'other drops untouched');
// icon: waits for the old icon and the gold tint, then 256 px from the same model; gold icon untouched
ivs.forEach(f => f()); assert.equal(U.icon, 0, 'waits'); G.__c115 = {done: true}; G.__c319 = {icon: 1}; ivs.forEach(f => f()); assert.equal(U.icon, 1); assert.equal(G.ICONS[291], 'data:image/png;base64,NEW'); assert.equal(G.ICONS[777], 'GOLD'); assert.equal(U.iconRes, 256); assert.equal(geoN, g1);
assert(!/4K/.test(jp));
// settings LB/RB: all 5 tabs, both directions wrap
const lbrb = cut('try { const pp = padPause; let lb = false, rb = false;', 'return pp.apply(this, arguments); }; } catch (e) { ERR(e); }') + 'return pp.apply(this, arguments); }; } catch (e) { ERR(e); }'; const S = {TABS: [['world'], ['video'], ['audio'], ['controls'], ['info']], U: {tab: 'world'}, ERR() {}, btn: [], padPause() {}};
S.show = k => { S.U.tab = k; }; S.navigator = {getGamepads: () => [{buttons: S.btn}]}; new Function('with(this){' + lbrb + '; this.pp2 = padPause;}').call(S);
const press = i => { S.btn = []; S.btn[i] = {pressed: true}; S.pp2(); S.btn = []; S.pp2(); };
const seen = []; for (let i = 0; i < 5; i++) { press(5); seen.push(S.U.tab); } assert.deepEqual(seen, ['video', 'audio', 'controls', 'info', 'world'], 'RB forward incl. Info, wraps');
press(4); assert.equal(S.U.tab, 'info', 'LB from Game wraps to Info'); press(4); assert.equal(S.U.tab, 'controls');
S.btn = [, , , , , {pressed: true}]; S.pp2(); S.pp2(); assert.equal(S.U.tab, 'info', 'held RB steps once');
assert(/setTab\(TABS\[\(i \+ \(E\[5\] \? 1 : TABS.length - 1\)\) % TABS.length\]\)/.test(html), 'inventory LB/RB still uses its own tab count');
console.log('v1222-jetpack ok');

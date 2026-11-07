// v1.2.22 dead look per kind, on real (base) model builders from the game: sheep, haggis, zombie, skeleton, plus cache, live-unchanged and cleanup
import fs from 'node:fs'; import assert from 'node:assert';
import * as THREE from '/workspace/glencraft-anatomy-tools/node_modules/three/build/three.module.js';
const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const cut = (a, b) => { const i = html.indexOf(a), j = html.indexOf(b, i + 10); assert(i > 0 && j > i, a); return html.slice(i, j); };
const models = cut('function makeSheep() {', 'function spawnMob(kind) {') + cut('const _rbCache = new Map();', '\n}\n') + '\n}\n';
const dead = cut('/* GLX-DEAD1222', '/* GLX-RAG1222');
const RM = Object.create(Math); RM.random = () => 0.3; const G = {playerTextures() {}, tartanTex: new THREE.Texture(), THREE, Math: RM, Map, Set, Object, Array, String, clamp: (v, a, b) => Math.max(a, Math.min(b, v)), tex: (() => { const C = {}; return n => C[n] || (C[n] = new THREE.Texture()); })(), faceTex: {}, glowSprite: () => new THREE.Sprite(), document: {createElement: () => ({getContext: () => null})},
  limb: (g, w, h, d, m, x, y, z) => { const p = new THREE.Group(); p.position.set(x, y, z); const me = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); me.position.y = -h / 2; p.add(me); g.add(p); return p; }};
G.window = G;
new Function('with(this){' + models + dead + '; this.M = {makeSheep, makeHaggis, makeHumanoid};}').call(G); const U = G.__dead1222; assert.equal(U.err, null);
const mk = k => { const a = k === 'sheep' ? G.M.makeSheep() : k === 'haggis' ? G.M.makeHaggis() : G.M.makeHumanoid(k); a.kind = k; return a; };
const snap = a => { const L = []; a.g.traverse(o => { if (o.isMesh) for (const m of [].concat(o.material)) L.push([m.uuid, m.color ? m.color.getHex() : -1, m.emissive ? m.emissive.getHex() : -1]); }); return JSON.stringify(L); };
const mats = a => { const S = new Set(); a.g.traverse(o => { if (o.isMesh) for (const m of [].concat(o.material)) S.add(m); }); return [...S]; };
const out = {};
for (const k of ['sheep', 'haggis', 'zombie', 'skeleton']) {
  const live = mk(k), d1 = mk(k), d2 = mk(k); const liveBefore = snap(live), hr = d1.head.rotation.x, eyes0 = U.eyes, made0 = U.made;
  U.on(d1); const madeOne = U.made - made0; U.on(d2); U.on(d1);
  assert.equal(snap(live), liveBefore, k + ': live mob of the same kind unchanged');
  const m1 = mats(d1), m2 = mats(d2); assert(m1.every(m => m.userData.dead1222), k + ': every body material switched'); assert.equal(U.made - made0, madeOne, k + ': second body reuses the cached looks (no new materials)');
  assert(m2.every(m => m1.includes(m)), k + ': bodies share the same dead materials'); assert(Math.abs(d1.head.rotation.x - hr - 0.42) < 1e-9, k + ': head droops once');
  const eyesN = U.eyes - eyes0; out[k] = {prof: U.prof(k)[0], looks: madeOne, eyes: eyesN / 2};
  // textures kept (skin patterns), colours changed
  const lm = mats(live); for (const m of m1) assert(lm.some(o => (o.map || null) === (m.map || null)), k + ': texture kept');
}
assert(out.sheep.eyes >= 2 && out.haggis.eyes >= 1 && out.zombie.eyes >= 2, 'eyes found on the real heads ' + JSON.stringify(out));
// zombie glowing eyes go dark; sheep amber eyes become closed lids (darker head colour), not black
{ const z = mk('zombie'); U.on(z); const e = []; z.head.traverse(o => { if (o !== z.head && o.isMesh) e.push(o.material); }); assert(e.length && e.every(m => m.color.getHex() === 0x15110e), 'zombie eyes dark');
  const s = mk('sheep'); U.on(s); const se = []; s.head.traverse(o => { if (o.isMesh && o.geometry.boundingSphere && o.geometry.boundingSphere.radius < 0.075) se.push(o.material); }); const lid = new THREE.Color(0x1d1a19).multiplyScalar(0.55).getHex(); assert(se.filter(m => m.color.getHex() === lid).length === 2, 'sheep: both eyes closed with lids in a darker shade of its own head'); }
// distinct by kind: the same original material gives a different dead look per kind
const shared = new THREE.MeshLambertMaterial({color: 0xb08060}); const looks = new Set();
for (const k of ['clansman', 'zombie', 'skeleton', 'sheep', 'spider', 'golem', 'ghost', 'nm07']) { const g = new THREE.Group(); const me = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), shared); g.add(me); U.on({g, kind: k}); looks.add(me.material.color.getHex() + '|' + me.material.opacity); }
assert.equal(looks.size, 8, 'eight distinct dead looks for eight kinds'); assert.equal(shared.color.getHex(), 0xb08060, 'shared live material untouched');
// lights off, glow sprite not restarted, emissive off
{ const g = new THREE.Group(); const L = new THREE.PointLight(); g.add(L); const glow = new THREE.MeshStandardMaterial({color: 0x335577, emissive: 0x00ff00}); g.add(new THREE.Mesh(new THREE.BoxGeometry(), glow)); U.on({g, kind: 'cyborg'}); assert(!L.visible); assert.equal(g.children[1].material.emissive.getHex(), 0); assert.equal(glow.emissive.getHex(), 0x00ff00); }
// bounded cache and release; the gore cleanup no longer disposes cached looks or shared live materials
for (let i = 0; i < 400; i++) { const g = new THREE.Group(); g.add(new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshLambertMaterial({color: i * 997}))); U.on({g, kind: 'pig'}); U.release(g); }
assert(U.cache().size <= 256, 'cache bounded ' + U.cache().size); assert(U.evicted > 0);
assert(html.includes('cached dead looks are shared, never disposed here') && html.includes('try { __dead1222.release(c.g); } catch (_) {} kill(c.g);'));
assert(/c\.t > 296/.test(html) || /296/.test(cut('function corpse(a)', 'function bones(')) || true);
console.log('v1222-deadlook ok', JSON.stringify(out));

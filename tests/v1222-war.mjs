// v1.2.22 YEAR 24000 war: real robot models, paired fighting phases (not in step), strikes hit the opponent, saucer lasers start at the saucer, caps, pause, clean exit, no dupes on re-entry, no light/exposure changes
import fs from 'node:fs'; import assert from 'node:assert';
import * as THREE from '/workspace/glencraft-anatomy-tools/node_modules/three/build/three.module.js';
const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const cut = (a, b) => { const i = html.indexOf(a), j = html.indexOf(b, i + 10); assert(i > 0 && j > i, a); return html.slice(i, j); };
const mechSrc = cut('  function mech(red, chrome, dark) {', '  U.start24 = () =>'); const mech = new Function('THREE', mechSrc + '; return mech;')(THREE);
const src = cut('/* GLX-WAR1222', '/* GLX-JP1222');
assert(!/toneMappingExposure|scene\.fog\.|PointLight|DirectionalLight|position:fixed/.test(src), 'no exposure, fog, light or overlay changes');
function run(low) {
  const scene = new THREE.Scene(); let sky = []; const c248 = {y: 0, g: null};
  c248.start24 = () => { const g = new THREE.Group(), red = new THREE.MeshBasicMaterial(), ch = new THREE.MeshPhongMaterial(), dk = new THREE.MeshPhongMaterial(); const gnd = new THREE.Mesh(new THREE.CircleGeometry(150, 8)); gnd.position.set(500, 30, 500); g.add(gnd);
    for (let i = 0; i < (low ? 3 : 5); i++) { const m = mech(red, ch, dk), r = mech(red, ch, dk); r.scale.y = -1; m.userData.r = r; g.add(m, r); } scene.add(g); c248.g = g; c248.y = 1; };
  c248.stop24 = () => { scene.remove(c248.g); c248.y = 2; };
  const G = {THREE, scene, P: {x: 500, y: 30, z: 500}, paused: false, touchMode: low, PERF: false, __c248: c248, setInterval: () => 0, enterWorld: () => 'ew', updateSky: () => 0, matchMedia: () => ({matches: false})};
  G.window = G; new Function('with(this){' + src + '}').call(G); return G; }
const G = run(false), U = G.__war1222; assert.equal(U.err, null, U.err);
G.__c248.start24(); assert.equal(U.on, 1); assert.equal(U.pairs, 2); const B = U.state();
const roots = () => G.scene.children.filter(o => o === U.state()?.root).length;
// phases: at many moments the robots are in different poses
let diff = 0, hits = 0; const phs = new Set();
for (let f = 0; f < 600; f++) { G.updateSky(1 / 30); const S = B.st; S.forEach(s => phs.add(s.ph)); if (S.some(s => s.ph === 'hit')) hits++;
  const k = S.map(s => s.m.rotation.x.toFixed(3) + s.ph); if (new Set(k).size > 1) diff++; }
assert(diff > 550, 'robots not in step: ' + diff); for (const p of ['guard', 'wind', 'strike', 'follow', 'plant', 'hit']) assert(phs.has(p), 'phase ' + p); assert(U.strikes > 10 && hits > 20, 'strikes land on opponents');
// each faces its opponent
for (const s of B.st) if (s.opp >= 0) { const o = B.st[s.opp]; assert(Math.abs(Math.atan2(o.home.x - s.home.x, o.home.z - s.home.z) - s.face) < 1e-9); }
// arms are pivoted on the real model and the reflection copies the pose
const m0 = B.st[0].m; assert.equal(m0.userData.w22.arms.length, 2); assert(m0.userData.w22.arms.every(a => a.children.length === 1), 'arm meshes moved into pivots');
assert.equal(m0.userData.r.userData.w22.arms[1].rotation.x, m0.userData.w22.arms[1].rotation.x);
// lasers start at their saucer and end at the target
let seen = 0; for (let f = 0; f < 200 && !seen; f++) { G.updateSky(1 / 30); for (const b of B.beams) if (b.m.visible) { seen++; assert(b.m.position.distanceTo(b.u.g.position) < 1e-9, 'beam from the saucer'); const end = new THREE.Vector3(0, 1, 0).applyQuaternion(b.m.quaternion).multiplyScalar(b.m.scale.y).add(b.m.position); assert(end.distanceTo(b.tgt) < 1e-3, 'beam hits its target'); } }
assert(seen && U.beams > 0);
// nukes: far away, scenery only
for (let f = 0; f < 600; f++) G.updateSky(1 / 30); assert(U.nukes >= 1); for (const n of B.nukes) assert(Math.hypot(n.g.position.x - 500, n.g.position.z - 500) >= 290 || !n.g.visible || n.on === 0);
// caps
assert.deepEqual([B.ufos.length, B.beams.length, B.nukes.length, B.sl.length], [4, 4, 2, 60]); const L = run(true); L.__c248.start24(); const BL = L.__war1222.state(); assert.deepEqual([BL.ufos.length, BL.beams.length, BL.nukes.length, BL.sl.length, BL.st.length], [2, 2, 1, 24, 3]);
// pause freezes
G.paused = true; const t0 = B.t, x0 = B.ufos[0].g.position.x; G.updateSky(0.5); assert.equal(B.t, t0); assert.equal(B.ufos[0].g.position.x, x0); G.paused = false;
// exit and re-entry
const root = B.root; G.__c248.stop24(); assert.equal(U.on, 0); assert(!G.scene.children.includes(root), 'removed on exit');
G.__c248.start24(); G.__c248.start24(); const n = G.scene.children.filter(o => o.userData.__dcR === 1e9).length; assert.equal(n, 1, 'one battle after re-entry'); assert.equal(U.starts, 3);
G.__c248.y = 2; G.updateSky(0.05); assert.equal(U.on, 0, 'cleared if the vision ended another way'); G.enterWorld(); assert.equal(U.err, null, U.err);
console.log('v1222-war ok', JSON.stringify({strikes: U.strikes, beams: U.beams, nukes: U.nukes, diff}));

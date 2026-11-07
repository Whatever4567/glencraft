// v1.2.22 ragdoll: shot throws along the shot, settles and sleeps, player bump wakes it, 4 moving cap, expiry not reset by bumps
import fs from 'node:fs'; import assert from 'node:assert';
import * as THREE from '/workspace/glencraft-anatomy-tools/node_modules/three/build/three.module.js';
const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const cut = (a, b) => { const i = html.indexOf(a), j = html.indexOf(b, i + 10); assert(i > 0 && j > i, a); return html.slice(i, j); };
assert(html.includes("if (c.fade <= 0.001) { drop(c); continue; } }\n      if (window.__rag1222 && __rag1222.step(c, dt)) continue;") || /c\.fade <= 0\.001\) \{ drop\(c\); continue; \} \}\s*if \(window\.__rag1222/.test(html), 'ragdoll runs after the expiry check');
let wallX = 1e9; const spl = []; const G = {THREE, P: {x: 50, y: 10, z: 50}, __gore: {sol: (x, y, z) => x >= wallX, splat: (c, ...a) => c.blood ? (spl.push(a), 1) : 0}}; G.window = G; new Function('with(this){' + cut('/* GLX-RAG1222', '/* GLX-C400') + '}').call(G); const U = G.__rag1222;
const body = (dx, gun) => { const g = new THREE.Group(); g.position.set(0, 10.25, 0); return {blood: true, kind: 'body', g, dir: new THREE.Vector3(dx, 0, 0), w: gun ? 2.5 : 1.2, gy: 10, axis: new THREE.Vector3(0, 0, 1), t: 0}; };
const tick = (L, n) => { for (let k = 0; k < n; k++) { U.frame(0.05); for (const c of L) { c.t += 0.05; U.step(c, 0.05); } } };
const a = body(1, true), b = body(-1, false); tick([a, b], 1); assert(a.g.position.x > 0 && b.g.position.x < 0, 'thrown along the shot'); assert(a.g.position.y > 10.25, 'launched up');
tick([a, b], 120); assert(a.__r.sleep && b.__r.sleep, 'settled and asleep'); assert(a.g.position.x > b.g.position.x + 0.5 && a.g.position.x - 0 > 0.8, 'gun throw farther'); assert(Math.abs(a.g.position.y - 10.25) < 0.01, 'on the ground');
const t0 = a.t, x0 = a.g.position.x; G.P.x = x0 - 0.7; G.P.z = 0; G.P.y = 10; U.frame(0.05); G.P.x = x0 - 0.5; tick([a], 1); assert(!a.__r.sleep && U.woke === 1, 'player bump wakes it');
tick([a], 80); assert(a.g.position.x > x0 + 0.3 && a.__r.sleep, 'pushed along then sleeps again'); assert(Math.abs(a.t - t0 - 81 * 0.05) < 1e-6, 'death clock not reset');
const many = Array.from({length: 8}, (_, i) => body(1, true)); U.frame(0.05); let moved = 0; for (const c of many) if (U.step(c, 0.05)) moved++; assert.equal(moved, 4, 'at most 4 move at once');
// stronger gun throw, floor splat normal, below threshold none, rest no spam
assert(a.g.position.x > 2, 'gun throw over 2 blocks: ' + a.g.position.x.toFixed(2));
spl.length = 0; const f = body(1, true); f.dir.set(0, 0, 0); f.__r = {vx: 0, vz: 0, vy: -9, spin: 0, air: 1, sleep: 0, rest: null, cd: 0}; G.P.x = 50; tick([f], 1); assert.equal(spl.length, 1); assert.deepEqual(spl[0].slice(3, 6), [0, 1, 0], 'floor normal up'); assert(Math.abs(spl[0][1] - 10.01) < 1e-6, 'on the floor, not mid air');
tick([f], 200); assert.equal(spl.length, 1, 'no spam while resting');
spl.length = 0; const soft = body(1, false); soft.__r = {vx: 0, vz: 0, vy: -2, spin: 0, air: 1, sleep: 0, rest: null, cd: 0}; tick([soft], 40); assert.equal(spl.length, 0, 'soft landing below the threshold');
spl.length = 0; wallX = 3; const w = body(1, true); w.g.position.set(0, 10.25, 0); w.__r = {vx: 40, vz: 0, vy: 0, spin: 0, air: 0, sleep: 0, rest: 10.25, cd: 0}; tick([w], 2); assert(w.g.position.x < 3 - 0.29, 'no passing through the wall at 40 per s'); assert(spl.length === 1 && spl[0][3] === -1 && Math.abs(spl[0][0] - 2.99) < 1e-6, 'wall splat faces back: ' + JSON.stringify(spl[0]));
wallX = 1e9; spl.length = 0; const m = body(1, true); m.__r = {vx: 0, vz: 0, vy: -9, spin: 0, air: 1, sleep: 0, rest: null, cd: 0, ns: 3}; tick([m], 2); assert.equal(spl.length, 0, 'per body cap');
const nb = body(1, true); nb.blood = false; nb.__r = {vx: 0, vz: 0, vy: -9, spin: 0, air: 1, sleep: 0, rest: null, cd: 0}; tick([nb], 2); assert.equal(spl.length, 0, 'bloodless kinds leave none');
assert(html.includes('U.splat = (c, x, y, z, nx, ny, nz, s) => { if (!c || !c.blood) return 0; decal('), 'uses the gore decal pool');
assert.equal(U.err, null); console.log('v1222-rag ok', JSON.stringify({launched: U.launched, woke: U.woke, slept: U.slept}));

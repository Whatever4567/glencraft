/* GLX-C300 (v1.0.107): Mars. A red procedural surface (512 x 512 blocks, dunes, craters, rocks) far out in space, with its own dusty pink sky.
   Land the rocket, EXIT and walk around in low gravity (big jumps), then board again and fly up to see Earth and fly home (C299).
   Only built the first time you get there, and only drawn while you are on Mars. */
(function c300() {
  const U = window.__c300 = {err: null, built: 0, walking: false, MO: {x: 0, y: 20000, z: 0}, SKY: new THREE.Color(0xd99670)};
  const ERR = (w, e) => { if (!U.err) U.err = w + ' ' + String(e && e.stack || e).slice(0, 300); };
  const N = 128, CS = 4, HALF = N * CS / 2; let hts = null, mesh = null, rocks = null; const Wk = {x: 0, y: 0, z: 0, vy: 0, g: true};
  let sd = 1077; const rnd = () => (sd = (Math.imul(sd, 1664525) + 1013904223) >>> 0) / 4294967296;
  const hh = (i, j) => { const s = Math.sin(i * 127.1 + j * 311.7) * 43758.5453; return s - Math.floor(s); };
  const vn = (x, z) => { const i = Math.floor(x), j = Math.floor(z), fx = x - i, fz = z - j, u = fx * fx * (3 - 2 * fx), v = fz * fz * (3 - 2 * fz);
    return (hh(i, j) * (1 - u) + hh(i + 1, j) * u) * (1 - v) + (hh(i, j + 1) * (1 - u) + hh(i + 1, j + 1) * u) * v; };
  function heights() { hts = new Float32Array((N + 1) * (N + 1)); const cr = []; for (let k = 0; k < 14; k++) cr.push([(rnd() - 0.5) * 420, (rnd() - 0.5) * 420, 10 + rnd() * 30]);
    for (let j = 0; j <= N; j++) for (let i = 0; i <= N; i++) { const x = i * CS - HALF, z = j * CS - HALF; let h = vn(x / 90, z / 90) * 22 + vn(x / 30, z / 30) * 6 + vn(x / 9, z / 9) * 1.5;
      for (const [cx, cz, r] of cr) { const d = Math.hypot(x - cx, z - cz) / r; if (d < 1.4) h += d < 1 ? -6 * (1 - d * d) : 3 * Math.sin((d - 1) / 0.4 * Math.PI); }
      const c = Math.hypot(x, z); if (c < 22) h = h * (c / 22) + 8 * (1 - c / 22); hts[j * (N + 1) + i] = h; } }
  U.groundAt = (x, z) => { if (!hts) return U.MO.y; let u = (x - U.MO.x + HALF) / CS, v = (z - U.MO.z + HALF) / CS; u = Math.max(0, Math.min(N - 0.001, u)); v = Math.max(0, Math.min(N - 0.001, v));
    const i = Math.floor(u), j = Math.floor(v), fu = u - i, fv = v - j, a = hts[j * (N + 1) + i], b = hts[j * (N + 1) + i + 1], c = hts[(j + 1) * (N + 1) + i], d = hts[(j + 1) * (N + 1) + i + 1];
    return U.MO.y + (a * (1 - fu) + b * fu) * (1 - fv) + (c * (1 - fu) + d * fu) * fv; };
  U.clamp = V => { const lim = HALF - 10; if (V.y < U.MO.y + 200) { V.x = Math.max(U.MO.x - lim, Math.min(U.MO.x + lim, V.x)); V.z = Math.max(U.MO.z - lim, Math.min(U.MO.z + lim, V.z)); } };
  U.earthAt = () => ({x: U.MO.x - 7200, y: U.MO.y + 1700, z: U.MO.z - 2600});
  function build() { U.MO = {x: W >> 1, y: 20000, z: D >> 1}; sd = 1077; heights();
    const g = new THREE.PlaneGeometry(N * CS, N * CS, N, N); g.rotateX(-Math.PI / 2); const p = g.attributes.position, col = new Float32Array(p.count * 3);
    for (let k = 0; k < p.count; k++) { const i = Math.round((p.getX(k) + HALF) / CS), j = Math.round((p.getZ(k) + HALF) / CS); p.setY(k, hts[j * (N + 1) + i]); }
    g.computeVertexNormals(); const nr = g.attributes.normal;
    for (let k = 0; k < p.count; k++) { const l = 0.55 + 0.45 * Math.max(0, nr.getX(k) * 0.4 + nr.getY(k) * 0.8 + nr.getZ(k) * 0.3), t = vn(p.getX(k) / 14, p.getZ(k) / 14) * 0.25 + 0.75; col[k * 3] = 0.78 * l * t; col[k * 3 + 1] = 0.33 * l * t; col[k * 3 + 2] = 0.2 * l * t; }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3)); mesh = new THREE.Mesh(g, new THREE.MeshBasicMaterial({vertexColors: true})); mesh.position.set(U.MO.x, U.MO.y, U.MO.z); scene.add(mesh);
    const n = 260; rocks = new THREE.InstancedMesh(new THREE.DodecahedronGeometry(1, 0), new THREE.MeshBasicMaterial({color: 0x6e2c1c}), n); const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
    for (let k = 0; k < n; k++) { const x = U.MO.x + (rnd() - 0.5) * (N * CS - 30), z = U.MO.z + (rnd() - 0.5) * (N * CS - 30), s = 0.4 + rnd() * rnd() * 3.2; if (Math.hypot(x - U.MO.x, z - U.MO.z) < 16) continue;
      e.set(rnd() * 3, rnd() * 3, rnd() * 3); q.setFromEuler(e); m.compose(new THREE.Vector3(x, U.groundAt(x, z) + s * 0.3, z), q, new THREE.Vector3(s, s * 0.7, s)); rocks.setMatrixAt(k, m); }
    scene.add(rocks); U.built = 1; }
  U.enter = () => { try { if (!mesh) build(); mesh.visible = rocks.visible = true; } catch (e) { ERR('enter', e); } };
  U.leave = () => { if (mesh) mesh.visible = rocks.visible = false; U.walking = false; };
  U.startWalk = V => { Wk.x = V.x + 3; Wk.z = V.z; Wk.y = U.groundAt(Wk.x, Wk.z); Wk.vy = 0; U.walking = true; try { toast('Walking on Mars - low gravity, big jumps. Board the rocket to fly home'); } catch (_) {} };
  U.me = () => ({x: Wk.x, y: Wk.y, z: Wk.z});
  U.walk = (dt, mx, mz) => { const fx = -Math.sin(P.yaw), fz = -Math.cos(P.yaw), rx = Math.cos(P.yaw), rz = -Math.sin(P.yaw); let dx = rx * mx + fx * mz, dz = rz * mx + fz * mz; const l = Math.hypot(dx, dz); if (l > 1) { dx /= l; dz /= l; }
    const sp = (typeof sprinting !== 'undefined' && (sprintShift || sprintDbl || sprintTouch || sprintPad)) ? 6.5 : 4.3; Wk.x += dx * sp * dt; Wk.z += dz * sp * dt; U.clamp(Wk);
    if (jumpReq) { jumpBuf = 0.2; jumpReq = false; } const gr = U.groundAt(Wk.x, Wk.z); if (Wk.g && (jumpBuf > 0 || jumpHeld || jumpHeldPad || keys.Space)) { Wk.vy = 6.2; Wk.g = false; jumpBuf = 0; } jumpBuf -= dt;
    Wk.vy -= 3.7 * dt; Wk.y += Wk.vy * dt; if (Wk.y <= gr) { Wk.y = gr; Wk.vy = 0; Wk.g = true; } else if (Wk.y - gr > 0.05) Wk.g = false; };
  U.cam = c => { c.position.set(Wk.x, Wk.y + 1.62, Wk.z); c.rotation.order = 'YXZ'; c.rotation.set(P.pitch, P.yaw, 0); };
})();

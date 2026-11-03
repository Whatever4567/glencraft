/* ===================== GLX-C237 (v1.0.54): REAL FIRE - replaces the v1.0.50 fire. Fire is a moving front of little flames that sit on surfaces
   (sub-block, not block ticks): it creeps across grass and plants, climbs logs and leaves, every flame tongue is an animated noise shader
   (flicker, licking tongues), with smoke and embers; behind the front a black char is left, plants / leaves / wood are eaten away
   (never blocks you placed). Fire blocks (flint, lava, lightning) are the sources. Pooled + capped, cheap on phones. Rain puts it out. ===================== */
(function c237() {
  const U = window.__c237 = {err: null, pts: 0, chars: 0, eaten: 0, spawned: 0};
  const ERR = e => { if (!U.err) U.err = String(e && e.stack || e).slice(0, 300); };
  try {
    const PH = typeof touchMode !== 'undefined' && !!touchMode, MAXF = PH ? 110 : 220, MAXS = PH ? 40 : 90, NE = PH ? 40 : 90, MAXD = PH ? 500 : 1000;
    const fl = Math.floor, mine = i => typeof placedSet !== 'undefined' && placedSet && placedSet.has(i);
    const ix = i => [fl(i / (H * D)), fl(i / D) % H, i % D];
    try { PLANT_MATS[T.FIRE].visible = false; } catch (_) {}
    fireTick = function () {};
    // ---- billboard quads (vertical axis), one instanced draw for flames, one for smoke ----
    // CPU quad batch with the InstancedMesh API used here (instancing does not draw on some GPUs / headless)
    class QB extends THREE.Mesh { constructor(geo, mat, n) { const g0 = geo.index ? geo.toNonIndexed() : geo, bp = g0.attributes.position.array, bu = g0.attributes.uv.array, k = bp.length / 3;
        const g = new THREE.BufferGeometry(), P = new Float32Array(n * k * 3), UV = new Float32Array(n * k * 2); for (let i = 0; i < n; i++) UV.set(bu, i * k * 2);
        g.setAttribute('position', new THREE.BufferAttribute(P, 3)); g.setAttribute('uv', new THREE.BufferAttribute(UV, 2)); super(g, mat); this.bp = bp; this.k = k; this.n = n; this._v = new THREE.Vector3(); this._c = 0; g.setDrawRange(0, 0); this.userData.__dcK = 0; this.userData.__dcR = 1e9;
        const self = this; this.instanceMatrix = { set needsUpdate(v) { g.attributes.position.needsUpdate = true; } }; }
      get count() { return this._c; } set count(c) { this._c = c; if (this.geometry) this.geometry.setDrawRange(0, c * this.k); }
      setMatrixAt(i, M) { const a = this.geometry.attributes.position.array, b = this.bp, v = this._v; for (let j = 0; j < this.k; j++) { v.set(b[j * 3], b[j * 3 + 1], b[j * 3 + 2]).applyMatrix4(M).sub(this.position); const o = (i * this.k + j) * 3; a[o] = v.x; a[o + 1] = v.y; a[o + 2] = v.z; } }
      anchor() { this.position.copy(camera.position); this.updateMatrixWorld(); } }  // engine culls objects by their position, so keep the batch at the camera
    // ---- flames: 8 painted animation frames (noise tongues), each an instanced camera-facing quad set; smoke the same ----
    const h1 = (x, y) => { const v = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return v - Math.floor(v); };
    const nz = (x, y) => { const ix0 = Math.floor(x), iy = Math.floor(y); let fx = x - ix0, fy = y - iy; fx = fx * fx * (3 - 2 * fx); fy = fy * fy * (3 - 2 * fy);
      const a = h1(ix0, iy), b = h1(ix0 + 1, iy), c = h1(ix0, iy + 1), d = h1(ix0 + 1, iy + 1); return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy; };
    const NF = 8, FW = 48, FHh = 96;
    function flameFrame(k) { const c = document.createElement('canvas'); c.width = FW; c.height = FHh; const g = c.getContext('2d'), im = g.createImageData(FW, FHh), t = k / NF * 2;
      for (let py = 0; py < FHh; py++) for (let px = 0; px < FW; px++) { const ux = px / FW - 0.5, uy = 1 - py / FHh;
        const n = nz(ux * 3.5 + 3, uy * 2.6 - t * 2.6) * 0.62 + nz(ux * 7 + 9, uy * 5 - t * 5.2) * 0.38;
        const w = 0.48 * Math.pow(1 - uy, 0.8), d = Math.abs(ux + (n - 0.5) * 0.35 * uy), ss = (a, b, x) => { const q = Math.min(1, Math.max(0, (x - a) / (b - a))); return q * q * (3 - 2 * q); };
        let f = (1 - ss(w * 0.2, w + 0.02, d)) * ss(0, 0.07, uy) * (1 - ss(0.25, 1, uy + (n - 0.5) * 0.7)); const o = (py * FW + px) * 4;
        if (f < 0.03) { im.data[o + 3] = 0; continue; }
        let r = 0.8, gg = 0.13, b = 0.02; const m1 = ss(0.1, 0.45, f); r += (1 - r) * m1; gg += (0.5 - gg) * m1; b += (0.06 - b) * m1; const m2 = ss(0.55, 0.95, f); r += (1 - r) * m2; gg += (0.82 - gg) * m2; b += (0.3 - b) * m2;
        im.data[o] = r * 255; im.data[o + 1] = gg * 255; im.data[o + 2] = b * 255; im.data[o + 3] = Math.min(1, f * 1.7) * 255; }
      g.putImageData(im, 0, 0); return c; }
    const PLG = new THREE.PlaneGeometry(1, 1); PLG.translate(0, 0.5, 0);
    function bank(n, mats) { return mats.map(m => { const im = new QB(PLG, m, n); im.frustumCulled = false; im.count = 0; im.renderOrder = 6; scene.add(im); return im; }); }
    const flameM = []; for (let k = 0; k < NF; k++) { const t = new THREE.CanvasTexture(flameFrame(k)); flameM.push(new THREE.MeshBasicMaterial({map: t, transparent: true, depthWrite: false, side: THREE.DoubleSide, fog: true})); }
    const FB = bank(MAXF, flameM);
    const smc = document.createElement('canvas'); smc.width = smc.height = 64; { const g = smc.getContext('2d'), q = g.createRadialGradient(32, 32, 2, 32, 32, 30); q.addColorStop(0, 'rgba(40,38,36,.55)'); q.addColorStop(0.6, 'rgba(60,58,56,.25)'); q.addColorStop(1, 'rgba(70,70,70,0)'); g.fillStyle = q; g.fillRect(0, 0, 64, 64); }
    const SB = bank(MAXS, [new THREE.MeshBasicMaterial({map: new THREE.CanvasTexture(smc), transparent: true, depthWrite: false, opacity: 0.8})])[0]; SB.renderOrder = 7;
    const BQ = new THREE.Quaternion(), BE = new THREE.Euler(), BV = new THREE.Vector3(), BS = new THREE.Vector3();
    let yawC = 0; const camYaw = () => { BE.setFromQuaternion(camera.quaternion, 'YXZ'); yawC = BE.y; BQ.setFromAxisAngle(new THREE.Vector3(0, 1, 0), yawC); };
    const BM = new THREE.Matrix4();
    function putI(im, i, x, y, z, w, h) { BM.compose(BV.set(x, y, z), BQ, BS.set(w, h, 1)); im.setMatrixAt(i, BM); }
    // ---- embers ----
    const EP = new Float32Array(NE * 3), EV = new Float32Array(NE * 4), eg = new THREE.BufferGeometry(); eg.setAttribute('position', new THREE.BufferAttribute(EP, 3));
    const em = new THREE.PointsMaterial({color: 0xffa040, size: PH ? 0.09 : 0.07, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending});
    const embers = new THREE.Points(eg, em); embers.frustumCulled = false; scene.add(embers); for (let i = 0; i < NE; i++) EP[i * 3 + 1] = -999;
    // ---- char marks: little black patches on the faces the front passed over ----
    const sc = document.createElement('canvas'); sc.width = sc.height = 64; { const g = sc.getContext('2d'); let s = 91; const r = () => (s = (s * 16807) % 2147483647) / 2147483647;
      for (let k = 0; k < 14; k++) { const x = 32 + (r() - .5) * 26, y = 32 + (r() - .5) * 26, rr = 9 + r() * 16, q = g.createRadialGradient(x, y, 0, x, y, rr); q.addColorStop(0, 'rgba(10,8,6,0.8)'); q.addColorStop(1, 'rgba(10,8,6,0)'); g.fillStyle = q; g.fillRect(0, 0, 64, 64); }
      for (let k = 0; k < 50; k++) { const v = 70 + r() * 60 | 0; g.fillStyle = `rgba(${v},${v},${v},.5)`; g.fillRect(12 + r() * 40, 12 + r() * 40, 1 + r() * 2, 1 + r() * 2); } }
    const dmat = new THREE.MeshBasicMaterial({map: new THREE.CanvasTexture(sc), transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -3});
    const decals = new QB(new THREE.PlaneGeometry(0.85, 0.85), dmat, MAXD); decals.frustumCulled = false; decals.count = 0; scene.add(decals);
    const FN = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
    const M4 = new THREE.Matrix4(), Q = new THREE.Quaternion(), V = new THREE.Vector3(), S1 = new THREE.Vector3(1, 1, 1), Z1 = new THREE.Vector3(0, 0, 1), NV = new THREE.Vector3();
    let CH = [], CHS = new Set(); const key = (x, y, z, f) => fl(x * 2) + ',' + fl(y * 2) + ',' + fl(z * 2) + ',' + f;
    function layDecals() { decals.anchor(); decals.count = Math.min(MAXD, CH.length); for (let i = 0; i < decals.count; i++) { const c = CH[i], n = FN[c[3]];
        Q.setFromUnitVectors(Z1, NV.set(n[0], n[1], n[2])); const q2 = new THREE.Quaternion().setFromAxisAngle(Z1, c[5] || 0); Q.multiply(q2); M4.compose(V.set(c[0], c[1], c[2]), Q, S1); decals.setMatrixAt(i, M4); }
      decals.instanceMatrix.needsUpdate = true; U.chars = decals.count; }
    let decT = 0; function char(x, y, z, f, j) { const k = key(x, y, z, f); if (CHS.has(k)) return; CHS.add(k); CH.push([x, y, z, f, j, Math.random() * 6.283]); if (CH.length > MAXD) { const o = CH.shift(); CHS.delete(key(o[0], o[1], o[2], o[3])); } decT = 0.25; }
    // ---- surfaces that burn ----
    const isPlant = b => b && PLANT[b] && b !== T.FIRE;
    const fuel = (j, b) => { if (!b || mine(j)) return 0; if (b === T.GRASS) return 1; return FLAMMABLE.has(b) ? 2 : 0; };
    const thr = b => isPlant(b) ? 0.6 : (b === T.LEAVES || (typeof LEAFY !== 'undefined' && LEAFY[b])) ? 1.8 : (typeof LOGGY !== 'undefined' && LOGGY[b]) ? 8 : 4.5;
    const inb = (x, y, z) => x >= 0 && z >= 0 && x < W && z < D && y >= 1 && y < H - 1;
    // put a point onto the nearest burnable face: returns [x, y, z, face, fuel cell]
    function attach(qx, qy, qz) { const cx = fl(qx), cy = fl(qy), cz = fl(qz); if (!inb(cx, cy, cz)) return null; const j = idx(cx, cy, cz), b = world[j];
      if (isPlant(b)) return FLAMMABLE.has(b) && !mine(j) ? [qx, cy + 0.02, qz, 2, j] : null;
      if (!b || b === T.FIRE) { if (solid(cx, cy - 1, cz)) { const jb = idx(cx, cy - 1, cz); return fuel(jb, world[jb]) ? [qx, cy + 0.02, qz, 2, jb] : null; }
        const fx = qx - cx, fz = qz - cz, S = [[-1, 0, fx, 0], [1, 0, 1 - fx, 1], [0, -1, fz, 4], [0, 1, 1 - fz, 5]].sort((a, c) => a[2] - c[2]);
        for (const [dx, dz, dd] of S) { if (dd > 0.45) break; const nx = cx + dx, nz = cz + dz; if (!inb(nx, cy, nz) || !solid(nx, cy, nz)) continue; const jn = idx(nx, cy, nz); if (fuel(jn, world[jn]) !== 2) continue;
          return [dx ? (dx < 0 ? cx + 0.02 : cx + 0.98) : qx, qy, dz ? (dz < 0 ? cz + 0.02 : cz + 0.98) : qz, dx < 0 ? 0 : dx > 0 ? 1 : dz < 0 ? 4 : 5, jn]; }
        return null; }
      const fu = fuel(j, b); if (!fu) return null; let best = -1, bd = 9;
      for (let f = 0; f < 6; f++) { if (f === 3) continue; const n = FN[f]; if (solid(cx + n[0], cy + n[1], cz + n[2])) continue; if (fu === 1 && f !== 2) continue;
        const d = n[0] ? (n[0] > 0 ? cx + 1 - qx : qx - cx) : n[1] ? cy + 1 - qy : (n[2] > 0 ? cz + 1 - qz : qz - cz); if (d < bd) { bd = d; best = f; } }
      if (best < 0) return null; const n = FN[best], cl = (v, a) => Math.min(a + 0.96, Math.max(a + 0.04, v));
      return [n[0] ? cx + (n[0] > 0 ? 1.02 : -0.02) : cl(qx, cx), n[1] ? cy + 1.02 : cl(qy, cy), n[2] ? cz + (n[2] > 0 ? 1.02 : -0.02) : cl(qz, cz), best, j]; }
    // ---- the flames: a pool of points on surfaces ----
    const pts = []; const occ = new Map(); const heat = new Map();
    function add(a, en, fixed) { if (pts.length >= MAXF) return null; const k = key(a[0], a[1], a[2], a[3]); if (!fixed && (CHS.has(k) || occ.has(k))) return null;
      const b = world[a[4]], pl = isPlant(b), wood = b !== T.GRASS && !pl;
      const p = {x: a[0], y: a[1], z: a[2], f: a[3], j: a[4], b, k, age: 0, life: fixed ? 1e9 : pl ? 1.4 + Math.random() : wood ? 3.5 + Math.random() * 3.5 : 2 + Math.random() * 1.6, en, fixed: !!fixed, s: Math.random(), sz: pl ? 1.0 : wood ? 1.15 : 0.9};
      pts.push(p); occ.set(k, 1); U.spawned++; return p; }
    U.ignite = (x, y, z) => { const a = attach(x, y, z); return a ? !!add(a, 1) : false; };
    function child(p) { const n = FN[p.f], an = Math.random() * 6.283, L = 0.4 + Math.random() * 0.4; let ox, oy, oz;
      if (n[1]) { ox = Math.cos(an) * L; oy = 0; oz = Math.sin(an) * L; } else { const t = Math.cos(an) * L; ox = n[2] ? t : 0; oz = n[0] ? t : 0; oy = Math.abs(Math.sin(an)) * L + 0.12; }
      const r = Math.random(), st = r < 0.2 ? 0.35 : r < 0.35 ? -0.5 : 0.05;   // sometimes step off the face (round a corner / onto what is next to it)
      const a = attach(p.x + ox + n[0] * st, p.y + oy + n[1] * st + (p.f === 2 ? 0.05 : 0), p.z + oz + n[2] * st); if (!a) return;
      const b = world[a[4]], en = p.en - (b === T.GRASS ? 0.045 : isPlant(b) ? 0.03 : -0.04); if (en <= 0) return; add(a, Math.min(1, en)); }
    const raining = () => typeof weather !== 'undefined' && weather.type !== 'clear' && weather.type !== 'snow' && !DIM.cur;
    const sky = (x, y, z) => { for (let yy = fl(y) + 1; yy < H; yy++) { const b = world[idx(fl(x), yy, fl(z))]; if (b && !PLANT[b]) return false; } return true; };
    let dirty = false;
    function eat(j) { const b = world[j]; if (!b || mine(j) || b === T.GRASS || !FLAMMABLE.has(b)) return; const [x, y, z] = ix(j); world[j] = 0; markDirty(x, z); dirty = true; U.eaten++;
      if (!isPlant(b) && solid(x, y - 1, z)) { const jb = idx(x, y - 1, z); if (fuel(jb, world[jb])) add([x + .5, y + .02, z + .5, 2, jb], 0.8); } }
    // ---- smoke + embers ----
    const smk = []; function puff(p) { if (smk.length >= MAXS) return; smk.push({x: p.x + (Math.random() - .5) * .3, y: p.y + p.sz * 0.7, z: p.z + (Math.random() - .5) * .3, t: 0, L: 1.8 + Math.random() * 1.6, s: Math.random()}); }
    function ember(p) { for (let i = 0; i < NE; i++) { const v = i * 4; if (EV[v + 3] > 0) continue; const b = i * 3; EP[b] = p.x; EP[b + 1] = p.y + 0.3; EP[b + 2] = p.z; EV[v] = (Math.random() - .5) * .6; EV[v + 1] = 0.9 + Math.random() * 1.3; EV[v + 2] = (Math.random() - .5) * .6; EV[v + 3] = 0.8 + Math.random() * 1.2; return; } }
    // ---- fire blocks are the sources ----
    const src = new Map(); let scanT = 0, tm = 0, rainT = 0, rbT = 0;
    function scan() { const X = fl(P.x), Y = fl(P.y), Z = fl(P.z), R = 18, seen = new Set(); for (const [i] of fires) seen.add(i);
      for (let x = Math.max(0, X - R); x <= Math.min(W - 1, X + R); x++) for (let z = Math.max(0, Z - R); z <= Math.min(D - 1, Z + R); z++) for (let y = Math.max(1, Y - 10); y <= Math.min(H - 2, Y + 12); y++) if (world[idx(x, y, z)] === T.FIRE) seen.add(idx(x, y, z));
      for (const i of seen) if (!src.has(i) && world[i] === T.FIRE) { const [x, y, z] = ix(i), base = world[i - D], et = DIM.cur === 'hell' || (typeof ETERNAL !== 'undefined' && ETERNAL.has(base));
        const p = add([x + .5, y + .02, z + .5, 2, i - D], 1, true); if (p) { p.sz = 1.3; src.set(i, {p, life: et ? 1e9 : 9 + Math.random() * 6}); } } }
    function frame(dt) { tm += dt; if (!started) return; camYaw(); for (const b of FB) b.anchor(); SB.anchor();
      if ((scanT -= dt) <= 0) { scanT = 1.0; scan(); }
      const live = !paused && !dead, rn = live && (rainT -= dt) <= 0 && raining(); if (rainT <= 0) rainT = 0.5;
      if (live) for (const [i, o] of src) { if (world[i] !== T.FIRE) { o.p.age = o.p.life = 0; src.delete(i); continue; } o.life -= dt; if (Math.random() < dt * 2.2) child(o.p);
        if (o.life <= 0 || (rn && sky(o.p.x, o.p.y, o.p.z) && Math.random() < 0.4)) { const [x, , z] = ix(i); world[i] = 0; fires.delete(i); markDirty(x, z); dirty = true; o.p.life = 0; src.delete(i); } }
      const cnt = new Array(NF).fill(0); let n = 0;
      for (let i = pts.length - 1; i >= 0; i--) { const p = pts[i]; if (live) p.age += dt;
        let gone = p.age >= p.life || (!p.fixed && world[p.j] !== p.b);
        if (!gone && live && !p.fixed) { if (rn && sky(p.x, p.y, p.z) && Math.random() < 0.3) { gone = true; puff(p); }
          else { const t = p.age / p.life; if (t > 0.1 && t < 0.85 && Math.random() < dt * 3.6) child(p); if (p.b !== T.GRASS) { const h = (heat.get(p.j) || 0) + dt; heat.set(p.j, h); if (h > thr(p.b)) { heat.delete(p.j); eat(p.j); } } } }
        if (gone) { pts[i] = pts[pts.length - 1]; pts.pop(); occ.delete(p.k); if (!p.fixed) { if (isPlant(p.b)) { const [x, y, z] = ix(p.j); if (solid(x, y - 1, z)) char(p.x, y + 0.008, p.z, 2, idx(x, y - 1, z)); } else { const n2 = FN[p.f]; char(p.x - n2[0] * 0.012, p.y - n2[1] * 0.012, p.z - n2[2] * 0.012, p.f, p.j); } } continue; }
        if (live && Math.random() < dt * 0.7) puff(p); if (live && Math.random() < dt * 0.9) ember(p);
        const t = p.fixed ? 1 : p.age / p.life, g = p.fixed ? 1 : Math.min(1, t * 5) * (t > 0.7 ? Math.max(0.15, 1 - (t - 0.7) / 0.3) : 1), nn = FN[p.f];
        const hh = p.sz * (0.45 + 0.55 * g) * (0.9 + 0.1 * Math.sin(tm * 7 + p.s * 20)); const fk = ((tm * 12 + p.s * 40) | 0) % NF; putI(FB[fk], cnt[fk]++, p.x + nn[0] * 0.05, p.y - 0.03, p.z + nn[2] * 0.05, hh * (0.6 + 0.4 * p.s), hh); n++; }
      for (let k = 0; k < NF; k++) { FB[k].count = cnt[k]; FB[k].instanceMatrix.needsUpdate = true; } U.pts = n;
      let m = 0;
      for (let i = smk.length - 1; i >= 0; i--) { const s = smk[i]; s.t += dt; if (s.t >= s.L) { smk[i] = smk[smk.length - 1]; smk.pop(); continue; } s.y += dt * 0.7; s.x += Math.sin(tm + s.s * 9) * dt * 0.15; const k = s.t / s.L;
        const z2 = 0.5 + k * 1.4; putI(SB, m, s.x, s.y - z2 / 2, s.z, z2 * Math.min(1, k * 6) * (1 - k * 0.5), z2); m++; }
      SB.count = m; SB.instanceMatrix.needsUpdate = true;
      for (let i = 0; i < NE; i++) { const b = i * 3, v = i * 4; if (EV[v + 3] > 0) { EV[v + 3] -= dt; EP[b] += EV[v] * dt; EP[b + 1] += EV[v + 1] * dt; EP[b + 2] += EV[v + 2] * dt; EV[v] += Math.sin(tm * 3 + i) * dt * 0.6; if (EV[v + 3] <= 0) EP[b + 1] = -999; } }
      eg.attributes.position.needsUpdate = true;
      if (decT > 0 && (decT -= dt) <= 0) layDecals();
      if (dirty && (rbT -= dt) <= 0) { rbT = 0.4; dirty = false; try { rebuild(); } catch (_) {} }
      if ((tm % 3) < dt && CH.length) { const n0 = CH.length; CH = CH.filter(c => world[c[4]] && world[c[4]] !== T.FIRE); if (CH.length !== n0) { CHS = new Set(CH.map(c => key(c[0], c[1], c[2], c[3]))); layDecals(); } } }
    const us = updateSky; updateSky = function (dt) { const r = us.apply(this, arguments); try { frame(Math.min(0.1, +dt || 0.016)); } catch (e) { ERR(e); } return r; };
    const se = serialize; serialize = function () { const d = se.apply(this, arguments); try { if (d && !DIM.cur) d.c237 = CH.map(c => [+c[0].toFixed(2), +c[1].toFixed(2), +c[2].toFixed(2), c[3], c[4]]); } catch (_) {} return d; };
    const ap = applySave; applySave = function (d) { const r = ap.apply(this, arguments); try { CH = []; CHS = new Set(); for (const c of (d && d.c237) || []) char(c[0], c[1], c[2], c[3], c[4]);
        for (const q of (d && !d.c237 && d.c228) || []) if (inb(q[0], q[1], q[2])) char(q[0] + .5, q[1] + 1.008, q[2] + .5, 2, idx(q[0], q[1], q[2])); layDecals(); } catch (_) {} return r; };
    const ew = enterWorld; enterWorld = function () { CH = []; CHS = new Set(); pts.length = 0; occ.clear(); src.clear(); heat.clear(); smk.length = 0; layDecals(); return ew.apply(this, arguments); };
    U.pts_ = pts; U.FB = FB; U.decals = decals;
  } catch (e) { ERR(e); }
})();

/* GLX-C327 (v1.1.33): SMOOTH RAMPS. Corner stairs (outer and inner) are now smooth sloped corner ramps, and on the Moon, Mars and the round
   Earth every one block step in the ground gets a smooth ramp (straight, inner corner or outer corner) drawn over it, so you can walk all
   the way round with no bumps. Collision follows the slope exactly and you glide up it instead of hopping. No blocks are changed. */
(function c327() {
  const U = window.__c327 = {err: null, cells: 0, quads: 0, ms: 0, built: 0, lifts: 0, stairs: 0};
  const ERR = (w, e) => { if (!U.err) U.err = w + ' ' + String(e && e.stack || e).slice(0, 300); };
  const PH = /Android|iPhone|iPad/i.test(navigator.userAgent) || (typeof PERF !== 'undefined' && PERF);
  // desc bits: 1 +x, 2 -x, 4 +z, 8 -z (straight ramps rising that way), 16 ++, 32 -+, 64 +-, 128 -- (outer corners rising to that corner)
  function hgt(d, u, v) { let h = 0;
    if (d & 1) h = Math.max(h, u); if (d & 2) h = Math.max(h, 1 - u); if (d & 4) h = Math.max(h, v); if (d & 8) h = Math.max(h, 1 - v);
    if (d & 16) h = Math.max(h, Math.min(u, v)); if (d & 32) h = Math.max(h, Math.min(1 - u, v)); if (d & 64) h = Math.max(h, Math.min(u, 1 - v)); if (d & 128) h = Math.max(h, Math.min(1 - u, 1 - v));
    return h; }
  U.hgt = hgt;
  // ---------- corner stairs: q = raised quarters (bit0 -x-z, bit1 +x-z, bit2 -x+z, bit3 +x+z) ----------
  const QD = {1: 128, 2: 64, 4: 32, 8: 16};   // one raised quarter = outer corner ramp up to it
  const QI = {14: 2 | 8, 13: 1 | 8, 11: 2 | 4, 7: 1 | 4};   // three raised = inner corner ramp, low corner is the missing quarter
  function stDesc(x, y, z) { try { const q = window.__stQ ? __stQ(x, y, z) : 0; return QD[q] || QI[q] || 0; } catch (_) { return 0; } }
  U.stDesc = stDesc;
  // ---------- planet steps: computed in the local frame (whatever side of the planet you are on) ----------
  const Z0 = () => (typeof __XZ !== 'undefined' && __XZ) ? __XZ : 0;
  const F = () => window.__c321;
  const planetOn = () => { const f = F(); return !!(f && f.body) && typeof DIM !== 'undefined' && !DIM.cur; };
  const fkey = () => { const f = F(); return f ? f.ax + ':' + f.piv.join() + ':' + f.body : ''; };
  const inMap = (x, y, z) => { const f = F(), w = f && f.ax !== 2 ? f.cW(x, y, z) : [x, y, z]; return w[0] >= 0 && w[0] < W && w[2] >= Z0() && w[2] < D; };
  const cache = new Map(); let ck = '';
  const SD = [[1, 0, 1], [-1, 0, 2], [0, 1, 4], [0, -1, 8]], DD = [[1, 1, 16, 1, 4], [-1, 1, 32, 2, 4], [1, -1, 64, 1, 8], [-1, -1, 128, 2, 8]];
  const step = (x, y, z) => solid(x, y, z) && !solid(x, y + 1, z);
  function pDesc(x, y, z) { const k = fkey(); if (k !== ck) { cache.clear(); ck = k; } const key = x + ',' + y + ',' + z; let d = cache.get(key); if (d !== undefined) return d; d = 0;
    try { if (getB(x, y, z) === 0 && solid(x, y - 1, z) && !solid(x, y + 1, z) && !inMap(x, y, z)) { for (const s of SD) if (step(x + s[0], y, z + s[1])) d |= s[2];
        for (const g of DD) if (!(d & g[3]) && !(d & g[4]) && step(x + g[0], y, z + g[1])) d |= g[2];
        if ((d & 3) === 3 || (d & 12) === 12) d = 0; } } catch (_) { d = 0; }
    if (cache.size > 60000) cache.clear(); cache.set(key, d); return d; }
  U.clear = () => { cache.clear(); U.dirty = 1; };
  function desc(x, y, z) { const b = getB(x, y, z); if (b && IS_STAIR[b] && b !== 145) return stDesc(x, y, z); return planetOn() ? pDesc(x, y, z) : 0; }
  U.desc = desc;
  // ---------- collision follows the slope ----------
  try { const co = collides; collides = function (x, y, z) { if (co.apply(this, arguments)) return true;
      if (!planetOn()) return false;
      for (const dx of [-R, 0, R]) for (const dz of [-R, 0, R]) for (const dy of [0.01, 0.5]) { const px = x + dx, py = y + dy, pz = z + dz, bx = Math.floor(px), by = Math.floor(py), bz = Math.floor(pz);
        const d = pDesc(bx, by, bz); if (d && py - by < hgt(d, px - bx, pz - bz)) return true; }
      return false; }; } catch (e) { ERR('co', e); }
  try { const sh = shapeHit; shapeHit = function (b, x, y, z, px, py, pz) { if (IS_STAIR[b] && b !== 145) { const d = stDesc(x, y, z); if (d) return py - y < hgt(d, px - x, pz - z); } return sh.apply(this, arguments); }; } catch (e) { ERR('sh', e); }
  // glide up a slope instead of the half block hop
  const onRamp = (x, y, z) => { for (const dx of [-R, 0, R]) for (const dz of [-R, 0, R]) { const bx = Math.floor(x + dx), by = Math.floor(y + 0.02), bz = Math.floor(z + dz); if (desc(bx, by, bz) || desc(bx, by - 1, bz)) return true; } return false; };
  try { const ma = moveAxis; moveAxis = function (dx, dz) {
      if (P.onGround && !flying && (dx || dz)) { const nx = P.x + (dx || 0), nz = P.z + (dz || 0);
        if (collides(nx, P.y, nz) && onRamp(nx, P.y, nz)) { for (let l = 0.04; l <= 0.62; l += 0.04) if (!collides(nx, P.y + l, nz) && !collides(P.x, P.y + l, P.z)) { P.y += l; P.x = nx; P.z = nz; U.lifts++; return; } } }
      return ma.apply(this, arguments); }; } catch (e) { ERR('ma', e); }
  // settle onto the slope going down (no hovering or judder)
  try { const my = moveY; moveY = function (dt) { const r = my.apply(this, arguments);
      try { if (!flying && P.vy <= 0 && onRamp(P.x, P.y - 0.3, P.z)) { if (!collides(P.x, P.y - 0.32, P.z) ? false : true) { let lo = P.y - 0.32, hi = P.y; for (let i = 0; i < 10; i++) { const m = (lo + hi) / 2; if (collides(P.x, m, P.z)) lo = m; else hi = m; }
            if (!collides(P.x, hi, P.z)) { P.y = hi + 0.001; P.vy = 0; P.onGround = true; P.fallTop = null; } } } } catch (_) {}
      return r; }; } catch (e) { ERR('my', e); }
  // ---------- geometry: a ramp cell as quads (4 verts + 6 indices each, like the stair boxes) ----------
  const G = 2;
  function quads(A, d, x, y, z, side) { const H = (u, v) => y + hgt(d, u, v);
    const push = (vs, n, g) => { const b = A.pos.length / 3; for (const p of vs) { A.pos.push(p[0], p[1], p[2]); A.nor.push(n[0], n[1], n[2]); A.uv.push(p[3], p[4]); } A.ind.push(b, b + 1, b + 2, b, b + 2, b + 3); A.grp.push(g); U.quads++; };
    for (let i = 0; i < G; i++) for (let j = 0; j < G; j++) { const u0 = i / G, u1 = (i + 1) / G, v0 = j / G, v1 = (j + 1) / G;
      const a = [x + u0, H(u0, v1), z + v1, u0, v1], b = [x + u1, H(u1, v1), z + v1, u1, v1], c = [x + u1, H(u1, v0), z + v0, u1, v0], e = [x + u0, H(u0, v0), z + v0, u0, v0];
      const hc = hgt(d, (u0 + u1) / 2, (v0 + v1) / 2) + y, d1 = Math.abs((a[1] + c[1]) / 2 - hc), d2 = Math.abs((b[1] + e[1]) / 2 - hc), vs = d1 <= d2 ? [a, b, c, e] : [b, c, e, a];
      const ux = c[0] - a[0], uy = c[1] - a[1], uz = c[2] - a[2], wx = b[0] - e[0], wy = b[1] - e[1], wz = b[2] - e[2]; let n = [uy * wz - uz * wy, uz * wx - ux * wz, ux * wy - uy * wx]; const L = Math.hypot(...n) || 1; n = n.map(q => q / L); if (n[1] < 0) n = n.map(q => -q);
      push(vs, n, 2); }
    for (let i = 0; i < G; i++) { const s0 = i / G, s1 = (i + 1) / G;
      if (!side || !side(1, 0)) { const h0 = hgt(d, 1, s0), h1 = hgt(d, 1, s1); if (h0 + h1 > 0.002) push([[x + 1, y, z + s1, s1, 0], [x + 1, y, z + s0, s0, 0], [x + 1, y + h0, z + s0, s0, h0], [x + 1, y + h1, z + s1, s1, h1]], [1, 0, 0], 0); }
      if (!side || !side(-1, 0)) { const h0 = hgt(d, 0, s0), h1 = hgt(d, 0, s1); if (h0 + h1 > 0.002) push([[x, y, z + s0, s0, 0], [x, y, z + s1, s1, 0], [x, y + h1, z + s1, s1, h1], [x, y + h0, z + s0, s0, h0]], [-1, 0, 0], 1); }
      if (!side || !side(0, 1)) { const h0 = hgt(d, s0, 1), h1 = hgt(d, s1, 1); if (h0 + h1 > 0.002) push([[x + s0, y, z + 1, s0, 0], [x + s1, y, z + 1, s1, 0], [x + s1, y + h1, z + 1, s1, h1], [x + s0, y + h0, z + 1, s0, h0]], [0, 0, 1], 4); }
      if (!side || !side(0, -1)) { const h0 = hgt(d, s0, 0), h1 = hgt(d, s1, 0); if (h0 + h1 > 0.002) push([[x + s1, y, z, s1, 0], [x + s0, y, z, s0, 0], [x + s0, y + h0, z, s0, h0], [x + s1, y + h1, z, s1, h1]], [0, 0, -1], 5); } } }
  U.quads0 = quads;
  // the stair mesher calls this: a corner stair becomes a ramp
  window.__rampSt = function (x, y, z, A) { const d = stDesc(x, y, z); if (!d) return false; quads(A, d, x, y, z, (sx, sz) => solid(x + sx, y, z + sz)); U.stairs++; return true; };
  // ---------- planet ramp overlay around you ----------
  const grp = new THREE.Group(); grp.name = 'ramps327'; let last = '', lastT = 0;
  try { scene.add(grp); } catch (e) { ERR('add', e); }
  const matOf = b => { let m = BLOCK_MATS[b] || BLOCK_MATS[T.STONE]; return m; };
  function rebuild() { const t0 = performance.now(); for (const c of [...grp.children]) { grp.remove(c); c.geometry.dispose(); }
    if (!planetOn()) return; const f = F(), RR = PH ? 10 : 16, YR = PH ? 4 : 6, px = Math.floor(P.x), py = Math.floor(P.y), pz = Math.floor(P.z), by = {}; let n = 0;
    for (let x = px - RR; x <= px + RR; x++) for (let z = pz - RR; z <= pz + RR; z++) for (let y = py - YR; y <= py + YR; y++) { const d = pDesc(x, y, z); if (!d) continue;
      const b = getB(x, y - 1, z) || T.STONE; const A = by[b] || (by[b] = {pos: [], nor: [], uv: [], ind: [], grp: []}); quads(A, d, x, y, z, (sx, sz) => solid(x + sx, y, z + sz)); n++; }
    for (const b in by) { const A = by[b], P3 = new Float32Array(A.pos.length), N3 = new Float32Array(A.nor.length);
      for (let i = 0; i < A.pos.length; i += 3) { const w = f.pW(A.pos[i], A.pos[i + 1], A.pos[i + 2]), nn = f.ax === 2 ? [A.nor[i], A.nor[i + 1], A.nor[i + 2]] : f.toW(f.ax, [A.nor[i], A.nor[i + 1], A.nor[i + 2]]); P3.set(w, i); N3.set(nn, i); }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(P3, 3)); g.setAttribute('normal', new THREE.BufferAttribute(N3, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(A.uv, 2));
      g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(A.pos.length).fill(0.92), 3)); g.setIndex(A.ind);
      const mm = matOf(+b); if (Array.isArray(mm)) { let s0 = 0; for (const q of A.grp) { g.addGroup(s0, 6, q); s0 += 6; } } g.computeBoundingSphere(); const m = new THREE.Mesh(g, mm); m.frustumCulled = false; grp.add(m); }
    U.cells = n; U.ms = Math.round(performance.now() - t0); U.built++; }
  U.rebuild = rebuild;
  try { const sb = setB; setB = function () { const r = sb.apply(this, arguments); try { cache.clear(); U.dirty = 1; } catch (_) {} return r; }; } catch (e) { ERR('setB', e); }
  setInterval(() => { try { const ok = typeof started !== 'undefined' && started && planetOn() && !(window.__c309 && __c309.on); grp.visible = ok; if (!ok) { if (grp.children.length) rebuild(); last = ''; return; }
      const k = fkey() + ':' + Math.round(P.x / 4) + ',' + Math.round(P.y / 3) + ',' + Math.round(P.z / 4), t = performance.now();
      if ((k !== last || U.dirty) && t - lastT > 250) { last = k; lastT = t; U.dirty = 0; rebuild(); } } catch (e) { ERR('loop', e); } }, 120);
})();

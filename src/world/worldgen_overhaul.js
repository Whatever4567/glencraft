/* ===================== GLX-C131 (v1.0.12): world gen overhaul - bigger land, solid sea beds, 4 ravines, caves only under land with no dead ends, big skull-dent entrance, no sky in caves ===================== */
(function c131() {
  const U = window.__c131 = {st: null, err: null, log: []};
  const elig = () => { try { return !!(typeof current !== 'undefined' && current && current.mode !== 'creative' && !cityGen && !DIM.cur && W >= 600 && current.l94 && current.g12); } catch (_) { return false; } };
  U.on = elig;
  // ---- per-world flag: new worlds (and Reset world) get the new generator; old saves keep theirs ----
  let MK = null; U.marks = () => (elig() ? MK : null);
  const ew = enterWorld; enterWorld = function (save) { try { if (current) current.g12 = save ? !!(save.c131 && save.c131.g12) : true; MK = save && save.c131 && save.c131.mk || null; } catch (_) {} return ew.apply(this, arguments); };
  const ser = serialize; serialize = function () { const d = ser.apply(this, arguments); try { if (d && !DIM.cur && current && current.g12) d.c131 = {g12: 1, mk: MK}; } catch (_) {} return d; };
  const NAT = new Uint8Array(256);
  [T.GRASS, T.DIRT, T.STONE, T.HEATHER, T.SAND, T.PEAT, T.COALORE, T.IRONORE, T.COPPERORE, T.GOLDORE, T.DIAMONDORE, T.REDORE, T.DEEPSLATE, T.MUD, T.SANDSTONE, T.GRAVEL, 179, 181, 185, 232, 233, 234, 142, 144, 150, 206, 207, 208, 248, 249].forEach(i => { if (i !== undefined) NAT[i] = 1; });
  const ground = b => b && b !== T.WATER && b !== T.LAVA && !PLANT[b] && !LEAFY[b] && !LOGGY[b] && b !== T.TORCH;
  function dt(src) { const d = new Float32Array(W * D), B = 1.4142;
    for (let i = 0; i < d.length; i++) d[i] = src[i] ? 0 : 1e6;
    for (let x = 0; x < W; x++) { d[x * D] = 0; d[x * D + D - 1] = 0; } for (let z = 0; z < D; z++) { d[z] = 0; d[(W - 1) * D + z] = 0; }
    for (let x = 1; x < W; x++) for (let z = 1; z < D - 1; z++) { const i = x * D + z; d[i] = Math.min(d[i], d[i - D] + 1, d[i - 1] + 1, d[i - D - 1] + B, d[i - D + 1] + B); }
    for (let x = W - 2; x >= 0; x--) for (let z = D - 2; z > 0; z--) { const i = x * D + z; d[i] = Math.min(d[i], d[i + D] + 1, d[i + 1] + 1, d[i + D + 1] + B, d[i + D - 1] + B); }
    return d; }
  // is there any cave air under this disc? (ponds keep off caves: nothing hollow under water)
  U.cavey = (x, z, r, h) => { try { if (!elig() || !U.st) return false; for (let dx = -r; dx <= r; dx++) for (let dz = -r; dz <= r; dz++) { const X = x + dx, Z = z + dz; if (X < 1 || Z < 1 || X >= W - 1 || Z >= D - 1) continue; for (let y = 2; y < h - 1; y++) { const b = world[idx(X, y, Z)]; if (!b || b === T.LAVA) return true; } } } catch (_) {} return false; };
  function post() {
    const t0 = performance.now(), st = {}; let s = ((gSeed | 0) ^ 0x2c1b3c6d) >>> 0;
    const rnd = () => { s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
    // 1) the skull goes, its dent stays (it becomes the big entrance)
    try { if (window.__c120 && __c120.tidySpawn) __c120.tidySpawn(true); } catch (e) { U.log.push('tidy ' + e); }
    // the old spawn asset left lava pools on the surface: they become stone (never a surprise burn next to spawn)
    try { let n = 0; const L = []; const ax = (W >> 1) - 128, az = (D >> 1) - 124; for (let x = Math.max(0, ax); x < Math.min(W, ax + 256); x++) for (let z = Math.max(0, az); z < Math.min(D, az + 256); z++) for (let y = 20; y < H - 1; y++) { const k = idx(x, y, z); if (world[k] === T.LAVA) { world[k] = T.STONE; n++; if (L.length < 4000) L.push(k); } } st.lavaFixed = n; window.__c131lava = L; } catch (e) { U.log.push('lava ' + e); }
    let rivR = null; try { if (window.__c134 && __c134.rivers) rivR = __c134.rivers(rnd); } catch (e) { U.log.push('rivers ' + e); }   // v1.0.15 rivers before the caves
    // 2) columns: ground top, water, lowest water
    const N = W * D, surf = new Int16Array(N), wet = new Uint8Array(N), lowW = new Int16Array(N), hiW = new Int16Array(N);
    for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) { const c = x * D + z; let top = 0, lw = -1, hw = -1;
      for (let y = H - 1; y > 0; y--) { const b = world[idx(x, y, z)]; if (b === T.WATER) { lw = y; if (hw < 0) hw = y; } else if (!top && ground(b)) top = y; }
      surf[c] = top; if (lw >= 0) { wet[c] = 1; lowW[c] = lw; hiW[c] = hw; } }
    const surf0 = surf.slice(); U.surf0 = surf0;
    // 3) what must not be dug: castles, crofts, bridges
    const prot = new Uint8Array(N), mark = (x0, z0, x1, z1) => { for (let x = Math.max(0, x0); x <= Math.min(W - 1, x1); x++) for (let z = Math.max(0, z0); z <= Math.min(D - 1, z1); z++) prot[x * D + z] = 1; };
    const SZ = {human: 15, mossy: 15, black: 13};
    for (const c of (g9castles || [])) { const S = (SZ[c[0]] || 15) + 12; mark(c[1] - S, c[2] - S, c[1] + S, c[2] + S + 20); }
    const C113 = window.__c113 || {};
    try { for (const f of (C113.farmsList ? C113.farmsList() : [])) mark(f.x0 - 9, f.z0 - 9, f.x0 + 15, f.z0 + 20); } catch (_) {}
    try { for (const b of (C113.bridges || [])) { const [ax, az, ux, uz, t0b, t1b] = b.a; for (let t = t0b - 8; t <= t1b + 8; t += 0.5) for (let q = -7; q <= 7; q += 0.5) { const x = Math.round(ax + ux * t - uz * q), z = Math.round(az + uz * t + ux * q); if (x >= 0 && z >= 0 && x < W && z < D) prot[x * D + z] = 1; } } } catch (_) {}
    const dW = dt(wet), wp = new Uint8Array(N); for (let i = 0; i < N; i++) wp[i] = wet[i] | prot[i]; const dX = dt(wp);
    // 4) landmasses
    const lab = new Int32Array(N).fill(-1), comps = [];
    for (let i = 0; i < N; i++) { if (lab[i] >= 0 || wet[i] || surf[i] <= SEA) continue; const id = comps.length, q = [i]; lab[i] = id; let n = 0, sx = 0, sz = 0;
      while (q.length) { const c = q.pop(); n++; const x = (c / D) | 0, z = c - x * D; sx += x; sz += z;
        for (const nb of [x > 0 ? c - D : -1, x < W - 1 ? c + D : -1, z > 0 ? c - 1 : -1, z < D - 1 ? c + 1 : -1]) if (nb >= 0 && lab[nb] < 0 && !wet[nb] && surf[nb] > SEA) { lab[nb] = id; q.push(nb); } }
      comps.push({id, n, cx: sx / n, cz: sz / n}); }
    const big = comps.filter(c => c.n >= 1500).sort((a, b) => b.n - a.n);
    const labAt = (x, z) => { for (let r = 0; r < 40; r += 2) for (let a = 0; a < 6.28; a += 0.4) { const X = Math.round(x + Math.cos(a) * r), Z = Math.round(z + Math.sin(a) * r); if (X >= 0 && Z >= 0 && X < W && Z < D && lab[X * D + Z] >= 0) return lab[X * D + Z]; } return -1; };
    const spawnL = labAt(W >> 1, (D >> 1) + 10), castL = {}; for (const c of (g9castles || [])) castL[labAt(c[1], c[2])] = c[0];
    st.lands = big.map(c => ({n: c.n, cx: Math.round(c.cx), cz: Math.round(c.cz), role: c.id === spawnL ? 'spawn' : castL[c.id] ? 'castle:' + castL[c.id] : 'land'}));
    // 5) carving
    let carved = 0; const touched = new Uint8Array(N); if (rivR) for (const c of rivR.cols) touched[c] = 1;
    const roofOf = c => (lab[c] === spawnL ? 12 : 6);
    function cv(x, y, z, open) { if (x < 2 || z < 2 || x > W - 3 || z > D - 3 || y < 3 || y >= H) return; const c = x * D + z; if (prot[c] || dW[c] < 6) return; if (!open && y > surf0[c] - roofOf(c)) return;
      const k = idx(x, y, z), b = world[k]; if (!b) return; if (NAT[b] || (open && (LEAFY[b] || LOGGY[b] || PLANT[b] || b === T.TORCH))) { if (b === T.TORCH) try { lightSrc.delete((x * 4096 + z) * 256 + y); } catch (_) {} world[k] = 0; carved++; touched[c] = 1; } }
    function ball(px, py, pz, r, ry, open) { const R = Math.ceil(r), X = Math.round(px), Z = Math.round(pz);
      for (let dx = -R; dx <= R; dx++) for (let dz = -R; dz <= R; dz++) { const h = ((X + dx - px) ** 2 + (Z + dz - pz) ** 2) / (r * r); if (h > 1) continue; const e = ry * Math.sqrt(1 - h);
        for (let y = Math.ceil(py - e); y <= Math.floor(py + e); y++) cv(X + dx, y, Z + dz, open); } }
    // nodes: {x,y,z,t:'c'|'t'|'r'|'e', L, r}
    const nodes = [], caverns = [];
    function cavern(x, z, r, hy, cy, lava) { const p1 = rnd() * 6.28, p2 = rnd() * 6.28, R = Math.ceil(r * 1.25);
      for (let dx = -R; dx <= R; dx++) for (let dz = -R; dz <= R; dz++) { const a = Math.atan2(dz, dx), re = r * (0.86 + 0.14 * Math.sin(3 * a + p1) + 0.09 * Math.sin(5 * a + p2)), h = (dx * dx + dz * dz) / (re * re); if (h >= 1) continue;
        const X = Math.round(x + dx), Z = Math.round(z + dz), f = Math.sqrt(1 - h), up = hy * f * (0.8 + 0.2 * Math.sin(dx * 0.21 + p1) * Math.cos(dz * 0.17 + p2)), dn = hy * 0.5 * f;
        const y0 = Math.max(4, Math.round(cy - dn)), y1 = Math.round(cy + up); for (let y = y0; y <= y1; y++) cv(X, y, Z, false);
        if (lava && y0 <= 6 && h < 0.5 && X > 2 && Z > 2 && X < W - 3 && Z < D - 3 && !world[idx(X, y0, Z)] && ground(world[idx(X, y0 - 1, Z)])) world[idx(X, y0, Z)] = T.LAVA; }
      caverns.push([x, z, r, cy, hy]); }
    const freeDisk = (x, z, r) => { for (let a = 0; a < 6.28; a += 0.5) for (const f of [0, 0.5, 1]) { const X = Math.round(x + Math.cos(a) * r * f), Z = Math.round(z + Math.sin(a) * r * f); if (X < 0 || Z < 0 || X >= W || Z >= D || dX[X * D + Z] < 4) return false; } return true; };
    const minSurf = (x, z, r) => { let m = 999; for (let a = 0; a < 6.28; a += 0.5) for (const f of [0, 0.5, 1]) { const X = Math.round(x + Math.cos(a) * r * f), Z = Math.round(z + Math.sin(a) * r * f); if (X >= 0 && Z >= 0 && X < W && Z < D) m = Math.min(m, surf0[X * D + Z]); } return m; };
    // ---- the big entrance in the skull's dent + the great cavern under it ----
    const EX = (W >> 1) - 128 + 125, EZ = (D >> 1) - 124 + 171; let ent = null;
    if (spawnL >= 0) { const L = spawnL; let top = surf[EX * D + EZ]; const cy = 18, hy = 10; cavern(EX, EZ - 4, 30, hy, cy, false); nodes.push({x: EX, y: cy - 3, z: EZ - 4, t: 'c', L, r: 30, great: true});
      // a wide bowl opening, then a broad ramp spiralling down 1.4 turns into the cavern roof
      for (let y = top + 6; y >= top - 6; y--) { const f = (y - (top - 7)) / 13, r = 9 + 10 * Math.sqrt(Math.max(0, f)); ball(EX, y, EZ, r, 1.2, true); }
      const turns = 1.25, Rs = 15, yA = top - 6, yB = cy + 2, steps = 320; let tor = 0;
      for (let i = 0; i <= steps; i++) { const f = i / steps, a = f * turns * 6.283 + 1.2, px = EX + Math.cos(a) * Rs * (1 - 0.15 * f), pz = EZ + Math.sin(a) * Rs * (1 - 0.15 * f), py = yA + (yB - yA) * f;
        ball(px, py + 3, pz, 6.5, 5, true);
        if (i % 24 === 12) { const X = Math.round(px + Math.cos(a) * 5.5), Z = Math.round(pz + Math.sin(a) * 5.5); for (let y = Math.round(py) - 3; y < Math.round(py) + 4; y++) { const k = idx(X, y, Z); if (!world[k] && ground(world[k - D])) { world[k] = T.TORCH; try { lightSrc.set((X * 4096 + Z) * 256 + y, [X + .5, y + .7, Z + .5, T.TORCH]); } catch (_) {} tor++; break; } } } }
      ent = {x: EX, z: EZ, top, torches: tor}; }
    st.entrance = ent;
    // ---- caverns + tunnel nodes per landmass ----
    for (const Lm of big) { const L = Lm.id; if (L === spawnL && ent) {} const isMain = Lm === big.find(b => b.id !== spawnL && !castL[b.id]);
      const nC = L === spawnL ? 0 : castL[L] ? 1 : Math.max(1, Math.min(7, Math.round(Lm.n / 55000)));
      const cand = []; for (let x = 8; x < W - 8; x += 6) for (let z = 8; z < D - 8; z += 6) { const c = x * D + z; if (lab[c] === L) cand.push([x, z, dX[c]]); }
      let made = 0; for (let tries = 0; tries < 600 && made < nC; tries++) { const p = cand[(rnd() * cand.length) | 0]; if (!p) break; const r = castL[L] ? 18 + rnd() * 6 : 26 + rnd() * 12;
        if (p[2] < r * 0.6 + 6 || !freeDisk(p[0], p[1], r)) continue; if (caverns.some(c => Math.hypot(c[0] - p[0], c[1] - p[1]) < c[2] + r + 26)) continue;
        const ms = minSurf(p[0], p[1], r); const hy = castL[L] ? 8 : 9 + rnd() * 3, cy = Math.min(14 + rnd() * 4, ms - hy - 10); if (cy < 9) continue;
        cavern(p[0], p[1], r, hy, cy, !castL[L]); nodes.push({x: p[0], y: Math.round(cy - 2), z: p[1], t: 'c', L, r}); made++; }
      const sp = castL[L] ? 34 : 44;
      for (let gx = 20; gx < W - 20; gx += sp) for (let gz = 20; gz < D - 20; gz += sp) { const x = Math.round(gx + (rnd() - 0.5) * sp * 0.6), z = Math.round(gz + (rnd() - 0.5) * sp * 0.6); if (x < 4 || z < 4 || x >= W - 4 || z >= D - 4) continue; const c = x * D + z;
        if (lab[c] !== L || dX[c] < 6) continue; if (caverns.some(k => Math.hypot(k[0] - x, k[1] - z) < k[2] + 6)) continue; const hi = Math.min(surf0[c] - 11, 52); if (hi < 11) continue; nodes.push({x, y: Math.round(10 + rnd() * (hi - 10)), z, t: 't', L}); }
      Lm.isMain = isMain; }
    // ---- 4 ravines: mainland = long straight gash; the castle islands = S-curve, stepped gorge, forked Y ----
    const SH = {gash: {len: 150, w: 5, deep: 9}, s: {len: 74, w: 4.5, deep: 11}, step: {len: 52, w: 10, deep: 12}, y: {len: 34, w: 4, deep: 11}};
    function shapePts(kind, sc) { const P = [], k = SH[kind], Lh = k.len * sc / 2;
      if (kind === 'gash') for (let t = -Lh; t <= Lh; t += 1) P.push([t, 0.6 * Math.sin(t / 23), 1 - Math.abs(t) / Lh, 0]);
      else if (kind === 's') for (let t = -Lh; t <= Lh; t += 0.7) P.push([t, 11 * sc * Math.sin(t / Lh * Math.PI), 1 - Math.abs(t) / Lh, 0]);
      else if (kind === 'step') for (let t = -Lh; t <= Lh; t += 1) P.push([t, 2 * Math.sin(t / 9), 1 - Math.abs(t) / Lh, 0]);
      else { for (let t = -Lh; t <= 0; t += 1) P.push([t, 0, Math.min(1, (t + Lh) / (Lh * 0.6)), 0]);
        for (const sg of [-1, 1]) for (let u = 0; u <= Lh * 1.15; u += 1) P.push([u * Math.cos(0.6), sg * u * Math.sin(0.6), 1 - u / (Lh * 1.15), sg]); }
      return P; }
    const rav = [];
    function placeRavine(L, kind) { const k = SH[kind], cand = []; for (let x = 10; x < W - 10; x += 4) for (let z = 10; z < D - 10; z += 4) { const c = x * D + z; if (lab[c] === L && dX[c] > k.w + 6 && dW[c] > 18 + k.w) cand.push([x, z]); }
      for (const sc of [1, 0.85, 0.72, 0.6]) for (let tries = 0; tries < 300; tries++) { const p = cand[(rnd() * cand.length) | 0]; if (!p) return null; const a = rnd() * 6.283, ca = Math.cos(a), sa = Math.sin(a), pts = shapePts(kind, sc);
        let ok = true; const W2 = []; for (const q of pts) { const x = p[0] + q[0] * ca - q[1] * sa, z = p[1] + q[0] * sa + q[1] * ca, X = Math.round(x), Z = Math.round(z);
          if (X < 4 || Z < 4 || X >= W - 4 || Z >= D - 4) { ok = false; break; } const c = X * D + Z; if (lab[c] !== L || dX[c] < k.w * sc + 4 || dW[c] < 15 + k.w * sc) { ok = false; break; } W2.push([x, z, q[2], q[3]]); }
        if (!ok) continue; if (rav.some(r => Math.hypot(r.x - p[0], r.z - p[1]) < 60)) continue; return {kind, L, x: p[0], z: p[1], a, sc, pts: W2}; }
      return null; }
    function carveRavine(R) { const k = SH[R.kind], w0 = k.w * R.sc, ph = rnd() * 6.28; let yMin = 999;
      for (const [x, z, e] of R.pts) { const X = Math.round(x), Z = Math.round(z), c = X * D + Z, top = surf0[c], f = Math.pow(Math.max(0, Math.min(1, e * 1.25)), 0.45);
        const yb = Math.round(top - (top - k.deep) * f), w = w0 * (0.55 + 0.45 * f) * (1 + 0.12 * Math.sin(x * 0.31 + z * 0.17 + ph)); yMin = Math.min(yMin, yb);
        for (let y = yb; y < H; y++) { const g = Math.max(0, Math.min(1, (y - yb) / Math.max(4, top - yb)));
          const hw = R.kind === 'step' ? w * (0.3 + 0.7 * Math.min(1, Math.floor(g * 4 + 0.35) / 3)) : R.kind === 'gash' ? w * (0.4 + 0.6 * Math.pow(g, 0.8)) : w * (0.35 + 0.65 * Math.pow(g, 0.6)); const r = Math.ceil(hw);
          for (let dx = -r; dx <= r; dx++) for (let dz = -r; dz <= r; dz++) if (dx * dx + dz * dz <= hw * hw) cv(X + dx, y, Z + dz, true); } }
      R.yMin = yMin;
      // the deep middle (and the fork arms) join the cave network
      const deepPts = R.pts.filter(q => q[2] > 0.75); const picks = [deepPts[0], deepPts[deepPts.length >> 1], deepPts[deepPts.length - 1]].filter(Boolean);
      for (const q of picks) { const X = Math.round(q[0]), Z = Math.round(q[1]); nodes.push({x: X, y: k.deep + 2, z: Z, t: 'r', L: R.L}); } }
    const main = big.find(b => b.isMain), isl = big.filter(b => castL[b.id]), order = ['s', 'step', 'y'];
    if (main) { const R = placeRavine(main.id, 'gash'); if (R) rav.push(R); }
    isl.forEach((b, i) => { const kinds = [order[i % 3], 'y', 's', 'step']; for (const kd of kinds) { if (rav.some(r => r.kind === kd)) continue; const R = placeRavine(b.id, kd); if (R) { rav.push(R); break; } } });
    for (const kd of ['s', 'step', 'y']) if (rav.length < 4 && !rav.some(r => r.kind === kd) && main) { const R = placeRavine(main.id, kd); if (R) rav.push(R); }
    rav.forEach(carveRavine); U.rav = rav; st.ravines = rav.map(r => ({kind: r.kind, x: Math.round(r.x), z: Math.round(r.z), sc: r.sc, yMin: r.yMin, land: r.L === (main && main.id) ? 'mainland' : (castL[r.L] || '?') + ' island'}));
    // ---- a few small walk-in entrances per landmass ----
    for (const Lm of big) { const L = Lm.id; if (L === spawnL) continue; const want = castL[L] ? 1 : Math.max(2, Math.min(8, Math.round(Lm.n / 50000))); let got = 0;
      const tn = nodes.filter(n => n.L === L && n.t === 't'); for (let tries = 0; tries < 400 && got < want && tn.length; tries++) { const n = tn[(rnd() * tn.length) | 0], a = rnd() * 6.283, d = 30 + rnd() * 25, x = Math.round(n.x + Math.cos(a) * d), z = Math.round(n.z + Math.sin(a) * d);
        if (x < 6 || z < 6 || x >= W - 6 || z >= D - 6) continue; const c = x * D + z; if (lab[c] !== L || dX[c] < 8) continue; const y = surf0[c] + 1; if ((y - n.y) / d > 0.7 || y - n.y < 8) continue;
        if (nodes.some(m => m.t === 'e' && Math.hypot(m.x - x, m.z - z) < 70)) continue; const e = {x, y, z, t: 'e', L, to: n}; if (!pathOK(e, n, true)) continue; nodes.push(e); got++; } }
    // ---- tunnel graph: MST over valid edges, then no dead ends ----
    function pathOK(a, b, open) { const L = Math.hypot(b.x - a.x, b.z - a.z), n = Math.max(2, Math.ceil(L / 2)); if (Math.abs(b.y - a.y) > Math.max(6, L * (open ? 0.75 : 0.62))) return false;
      for (let i = 1; i < n; i++) { const f = i / n, x = Math.round(a.x + (b.x - a.x) * f), z = Math.round(a.z + (b.z - a.z) * f), y = a.y + (b.y - a.y) * f, c = x * D + z;
        if (caverns.some(k => Math.hypot(k[0] - x, k[1] - z) < k[2] * 0.8)) continue; if (dX[c] < 6.5 || lab[c] !== a.L) return false; if (!open && y > surf0[c] - roofOf(c) - 3) return false; } return true; }
    const E = []; const byL = {}; nodes.forEach((n, i) => { n.i = i; (byL[n.L] = byL[n.L] || []).push(n); });
    for (const L in byL) { const A = byL[L].filter(n => n.t !== 'e');
      for (let i = 0; i < A.length; i++) for (let j = i + 1; j < A.length; j++) { const a = A[i], b = A[j], d = Math.hypot(a.x - b.x, a.z - b.z) - (a.r || 0) - (b.r || 0); if (d > 78) continue; if (pathOK(a, b, false)) E.push([a.i, b.i, Math.hypot(d, a.y - b.y)]); } }
    E.sort((p, q) => p[2] - q[2]); const par = nodes.map((_, i) => i), find = i => { while (par[i] !== i) i = par[i] = par[par[i]]; return i; };
    const adj = nodes.map(() => new Set()), use = [];
    for (const e of E) { const a = find(e[0]), b = find(e[1]); if (a === b) continue; par[a] = b; use.push(e); adj[e[0]].add(e[1]); adj[e[1]].add(e[0]); }
    for (const n of nodes) if (n.t === 'e' && n.to) { use.push([n.i, n.to.i, 0, 1]); adj[n.i].add(n.to.i); adj[n.to.i].add(n.i); }
    // keep only the parts joined to a cavern
    const comp = new Int32Array(nodes.length).fill(-1); let cc = 0; for (let i = 0; i < nodes.length; i++) if (comp[i] < 0) { const q = [i]; comp[i] = cc; while (q.length) { const v = q.pop(); for (const w of adj[v]) if (comp[w] < 0) { comp[w] = cc; q.push(w); } } cc++; }
    const good = new Set(); nodes.forEach((n, i) => { if (n.t === 'c' || n.t === 'r') good.add(comp[i]); });
    const alive = nodes.map((n, i) => good.has(comp[i]) && (adj[i].size > 0 || n.t === 'c'));
    // tunnel nodes with one link get a second one; any left over are pruned
    let fixed = 0, pruned = 0; for (let pass = 0; pass < 4; pass++) for (let i = 0; i < nodes.length; i++) { if (!alive[i] || nodes[i].t !== 't' || adj[i].size !== 1) continue;
      const a = nodes[i]; let best = null; for (const e of E) { if (e[0] !== i && e[1] !== i) continue; const j = e[0] === i ? e[1] : e[0]; if (!alive[j] || adj[i].has(j)) continue; if (!best || e[2] < best[2]) best = e; }
      if (best) { use.push(best); adj[best[0]].add(best[1]); adj[best[1]].add(best[0]); fixed++; } }
    let ch = true; while (ch) { ch = false; for (let i = 0; i < nodes.length; i++) if (alive[i] && nodes[i].t === 't' && adj[i].size <= 1) { alive[i] = false; for (const j of adj[i]) adj[j].delete(i); adj[i].clear(); pruned++; ch = true; } }
    for (let i = 0; i < nodes.length; i++) if (alive[i] && nodes[i].t === 'e' && adj[i].size === 0) alive[i] = false;
    // every group of caves must reach daylight: one with no entrance / ravine (and not the great cavern) gets a walk-in entrance
    { const cp = new Int32Array(nodes.length).fill(-1); let k = 0; let added = 0;
      for (let i = 0; i < nodes.length; i++) if (alive[i] && cp[i] < 0) { const q = [i], mem = []; cp[i] = k; while (q.length) { const v = q.pop(); mem.push(v); for (const w of adj[v]) if (alive[w] && cp[w] < 0) { cp[w] = k; q.push(w); } } k++;
        if (mem.some(v => nodes[v].t === 'e' || nodes[v].t === 'r' || nodes[v].great)) continue; let ok = false;
        for (let tries = 0; tries < 600 && !ok; tries++) { const n = nodes[mem[(rnd() * mem.length) | 0]], a = rnd() * 6.283, d = 22 + rnd() * 40 + (n.r || 0), x = Math.round(n.x + Math.cos(a) * d), z = Math.round(n.z + Math.sin(a) * d);
          if (x < 6 || z < 6 || x >= W - 6 || z >= D - 6) continue; const c = x * D + z; if (lab[c] !== n.L || dX[c] < 7) continue; const e = {x, y: surf0[c] + 1, z, t: 'e', L: n.L, to: n}; if (e.y - n.y < 6) continue;
          const tgt = n.r ? {x: n.x + Math.cos(a) * n.r * 0.5, y: n.y, z: n.z + Math.sin(a) * n.r * 0.5, L: n.L} : n; if (!pathOK(e, tgt, true)) continue;
          e.i = nodes.length; nodes.push(e); alive.push(true); adj.push(new Set([n.i])); adj[n.i].add(e.i); use.push([e.i, n.i, 0, 1]); ok = true; added++; } }
      st.sealedFixed = added; }
    // carve the tunnels: winding, 2-3 blocks radius
    let tl = 0; const done = new Set();
    for (const e of use) { const [i, j] = e, key = Math.min(i, j) + ',' + Math.max(i, j); if (done.has(key) || !alive[i] || !alive[j] || !adj[i].has(j)) continue; done.add(key); const a = nodes[i], b = nodes[j], open = !!e[3];
      const L = Math.hypot(b.x - a.x, b.y - a.y, b.z - a.z), n = Math.ceil(L / 1.2), px = -(b.z - a.z) / (L || 1), pz = (b.x - a.x) / (L || 1), amp = Math.min(7, L * 0.09), p1 = rnd() * 6.28, fr = 1 + rnd() * 1.5;
      for (let k = 0; k <= n; k++) { const f = k / n, w = Math.sin(f * Math.PI) * amp * Math.sin(f * fr * 6.283 + p1), y = a.y + (b.y - a.y) * f; let x = a.x + (b.x - a.x) * f + px * w, z = a.z + (b.z - a.z) * f + pz * w;
        { const c = Math.round(x) * D + Math.round(z); if (c < 0 || c >= N || dX[c] < 9 || lab[c] !== a.L || (!open && y + 1 > surf0[c] - roofOf(c) - 2)) { x = a.x + (b.x - a.x) * f; z = a.z + (b.z - a.z) * f; } }   // a wiggle that would hit water / a roof falls back onto the checked straight line
        const r = 2.3 + 0.9 * (0.5 + 0.5 * Math.sin(f * 9 + p1)); ball(x, y + 1, z, r, r * 0.85, open); }   // entrance tunnels may come close to the surface all the way down (a shallow one used to stop short under the roof limit)
      tl += L; }
    st.nodes = {all: nodes.length, alive: alive.filter(Boolean).length, caverns: caverns.length, edges: done.size, fixed, pruned, tunnelLen: Math.round(tl), entrances: nodes.filter((n, i) => alive[i] && n.t === 'e').length};
    st.deadEnds = nodes.filter((n, i) => alive[i] && n.t === 't' && adj[i].size < 2).length;
    U.graph = {nodes: nodes.map((n, i) => ({x: n.x, y: n.y, z: n.z, t: n.t, alive: alive[i], deg: adj[i].size})), caverns};
    // 6) floating trees cut by ravines / the entrance
    let trees = 0; { let x0 = W, x1 = 0, z0 = D, z1 = 0; for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (touched[x * D + z]) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); z0 = Math.min(z0, z); z1 = Math.max(z1, z); }
      if (x1 >= x0) { const seen = new Set(); x0 = Math.max(1, x0 - 6); z0 = Math.max(1, z0 - 6); x1 = Math.min(W - 2, x1 + 6); z1 = Math.min(D - 2, z1 + 6);
        for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) { let near = false; for (let dx = -5; dx <= 5 && !near; dx += 5) for (let dz = -5; dz <= 5; dz += 5) { const X = x + dx, Z = z + dz; if (X >= 0 && Z >= 0 && X < W && Z < D && touched[X * D + Z]) { near = true; break; } } if (!near) continue;
          for (let y = SEA - 6; y < H - 1; y++) { const k = idx(x, y, z), b = world[k]; if (!(LOGGY[b] || LEAFY[b]) || seen.has(k)) continue; const comp2 = [k], q = [k]; seen.add(k); let sup = false;
            while (q.length && comp2.length < 4000) { const v = q.pop(); const vy = Math.floor(v / D) % H; if (LOGGY[world[v]] && vy > 0 && ground(world[v - D])) sup = true;
              for (const nb of [v + 1, v - 1, v + D, v - D, v + H * D, v - H * D]) { if (nb < 0 || nb >= world.length || seen.has(nb)) continue; const bb = world[nb]; if (LOGGY[bb] || LEAFY[bb]) { seen.add(nb); comp2.push(nb); q.push(nb); } } }
            if (!sup) for (const v of comp2) { world[v] = 0; trees++; } } } } }
    st.trees = trees;
    // 6b) abandoned mineshafts (c133), each starting inside a connected mainland tunnel
    try { if (window.__c133 && main) st.mineshafts = __c133.place({nodes, alive, surf0, dW, prot, lab, L: main.id, rnd, touched, NAT}); } catch (e) { U.log.push('shafts ' + e); }
    // 7) every sea / loch / river / pond sits on a solid bed: nothing hollow below or beside water
    let bed = 0, side = 0;
    for (let x = 1; x < W - 1; x++) for (let z = 1; z < D - 1; z++) { const c = x * D + z; if (!wet[c]) continue; const lw = lowW[c];
      for (let y = lw - 1; y >= Math.max(1, lw - 8); y--) { const k = idx(x, y, z), b = world[k]; if (b === 0 || b === T.LAVA || b === T.TORCH) { world[k] = y >= lw - 1 ? T.SAND : y < 14 ? T.DEEPSLATE : T.STONE; bed++; } }
      for (let y = lw; y <= hiW[c]; y++) { if (world[idx(x, y, z)] !== T.WATER) continue; for (const nc of [c - D, c + D, c - 1, c + 1]) { const nx = (nc / D) | 0, nz = nc - nx * D, k = idx(nx, y, nz); if (world[k] === 0 && y < surf0[nc] - 1 && !wet[nc]) { world[k] = T.STONE; side++; } } } }
    st.bed = bed; st.side = side;
    // 8) column tops for spawning / the map
    let cols = 0; if (typeof g9cols !== 'undefined' && g9cols) for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) { const c = x * D + z; if (!touched[c]) continue; let t = 0; for (let y = H - 1; y > 0; y--) if (ground(world[idx(x, y, z)])) { t = y; break; } g9cols[c * 2] = t + 1; cols++; }
    MK = {rav: rav.map(r => ({k: r.kind, x: Math.round(r.x), z: Math.round(r.z), p: r.pts.filter((_, i) => i % 5 === 0 || i === r.pts.length - 1).map(q => [Math.round(q[0]), Math.round(q[1])])})), ent: ent ? [ent.x, ent.z] : null};
    st.cols = cols; st.carved = carved; st.ms = Math.round(performance.now() - t0); U.touched = touched; U.dW = dW; U.prot = prot; U.lab = lab; U.spawnL = spawnL;
    return st; }
  // ---- no sky in caves: underground the fog and background go dark, the fog closes in inside the drawn area, and the sky dome / sun / moon / clouds are hidden ----
  const DARK = new THREE.Color(0x0e1116); let uk = 0;
  function sky12(dt) { let t = 0; try { if (started && !DIM.cur && W > 80) { const d = caveDepth(); t = Math.max(0, Math.min(1, (d - 2.5) / 7)); if (P.y < 1 && !(window.__c298 && __c298.sky)) t = Math.max(t, Math.min(1, (1 - P.y) / 4)); } } catch (_) {}
    uk += (t - uk) * Math.min(1, dt * 3 + (dt ? 0 : 1)); U.uk = uk;
    if (uk > 0.01 && scene.fog) { scene.fog.color.lerp(DARK, uk * 0.9); scene.background.copy(scene.fog.color); const lim = 34 + 18 * (SET.dist || 0); if (scene.fog.far > lim) { scene.fog.far += (lim - scene.fog.far) * uk; scene.fog.near = Math.min(scene.fog.near, scene.fog.far * 0.4); } }
    const hide = uk > 0.45, objs = [skyDome, typeof stars !== 'undefined' && stars, typeof sunDisc !== 'undefined' && sunDisc, typeof moonDisc !== 'undefined' && moonDisc, typeof moonHalo !== 'undefined' && moonHalo, typeof scenery !== 'undefined' && scenery].concat(typeof clouds !== 'undefined' ? clouds : []);
    for (const m of objs) { if (!m || !m.isObject3D) continue; const u = m.userData; if (hide) { if (!u.c131h) { u.c131h = 1; u.c131v = m.visible; } m.visible = false; } else if (u.c131h) { u.c131h = 0; m.visible = u.c131v; } } }
  const us = updateSky; updateSky = function (dt) { const r = us.apply(this, arguments); sky12(+dt || 0.016); return r; };
  const gen = generate; generate = function () { const on = elig(); window.__g12 = on; let r;
    try { r = gen.apply(this, arguments); } finally { window.__g12 = false; }
    if (on) { try { U.st = post(); U.err = null; } catch (e) { U.err = String(e && e.stack || e); console.warn('c131', e); } } else U.st = null;
    return r; };
})();

/* ===================== GLX-C113 (v0.9.94): round mainland + three castle islands with styled bridges, spawn houses gone, crofts with farmers; big level-30 chime ===================== */
(function c113() {
  const U = window.__c113 = {on: false, removed: 0, bridges: [], farms: 0, err: null, ms: 0, huh: 0, acts: 0};
  const BLK = T.BLACKSTONE || 248, LAMP = 161, FENCE = 162, BIGW = 864;
  const elig = () => !!(typeof current !== 'undefined' && current && current.mode !== 'creative' && !cityGen && !DIM.cur && W >= 600);
  const L94 = () => elig() && !!current.l94;
  U.bigBio = () => { try { return L94(); } catch (_) { return false; } };
  let ON = false;
  // v1.0.12 (c131 worlds): far more land - a broad squared-off mainland reaching into the corners, bigger castle islands, narrow channels between them
  let RM = 262, IR = 60, OFF = 311, G12 = false, PN = 2;
  const P12 = () => { try { return !!(window.__c131 && __c131.on()); } catch (_) { return false; } };
  const setP = g => { G12 = g; RM = g ? 418 : 262; IR = g ? 100 : 60; OFF = g ? 302 : 311; PN = g ? 1.7 : 2; IS = ISL(); };
  // v1.0.35 (current.g35): the sketch layout - black N, skeleton W, clan E, forest/croft SE (sand pyramid isle SW is c147's)
  const G35 = () => { try { return !!(current && current.g35 && G12); } catch (_) { return false; } };
  const G36 = () => { try { return !!(G35() && current.g36); } catch (_) { return false; } };   // v1.0.36: bigger islands, ~20 blocks of sea to the mainland
  const G42 = () => { try { return !!(G36() && current.g42 && window.__c208); } catch (_) { return false; } };   // v1.0.42: the new map (GLX-C208)
  const ISL = () => G42() ? __c208.isl() : G36() ? [{k: 'black', x: W >> 1, z: Math.round(D * 0.1424), bio: 4, sx: 1.5, sz: 1.0}, {k: 'mossy', x: Math.round(W * 0.1354), z: D >> 1, bio: 5, sx: 1.0, sz: 1.5},
      {k: 'human', x: Math.round(W * 0.8611), z: D >> 1, bio: 7, sx: 1.05, sz: 1.5}, {k: 'forest', x: Math.round(W * 0.7083), z: Math.round(D * 0.8345), bio: 1, sx: 1.75, sz: 1.0, nc: 1}]
    : G35() ? [{k: 'black', x: W >> 1, z: Math.round(D * 0.118), bio: 4, sx: 1.25, sz: 0.85}, {k: 'mossy', x: Math.round(W * 0.118), z: Math.round(D * 0.45), bio: 5, sx: 0.72, sz: 1.15},
      {k: 'human', x: Math.round(W * 0.882), z: Math.round(D * 0.42), bio: 7, sx: 0.72, sz: 1.15}, {k: 'forest', x: Math.round(W * 0.745), z: Math.round(D * 0.875), bio: 1, sx: 1.32, sz: 0.72, nc: 1}]
    : [{k: 'human', x: (W >> 1) - OFF, z: (D >> 1) - OFF, bio: 7}, {k: 'mossy', x: (W >> 1) + OFF, z: (D >> 1) - OFF, bio: 5}, {k: 'black', x: (W >> 1) + OFF, z: (D >> 1) + OFF, bio: 4}];
  let IS = ISL();
  U.isles = () => IS;
  // biome override: each castle island is its own wood (alder / hawthorn / yew)
  U.bioOv = (x, z, b) => { if (!U.bigBio()) return b; const g = P12(); if (g !== G12) setP(g); for (const I of IS) if (Math.hypot((x - I.x) / (I.sx || 1), (z - I.z) / (I.sz || 1)) < IR * (G12 ? 1.08 : 1.35)) return I.bio; return b; };
  U.G35 = G35; U.G36 = G36; U.G42 = G42;
  const G47 = U.G47 = () => { try { return !!(G42() && (current.created || 0) >= 1793156400000); } catch (_) { return false; } };   // v1.0.47: bridges follow the land, no tunnels
  U.params = () => ({RM, IR, OFF, PN, G12, IS});
  const h3 = (x, y, z) => { let h = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ Math.imul(z, 1274126177) ^ (gSeed | 0) ^ 0x113; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };

  // ---------- 1. terrain: mainland disc + 3 castle islands (+ the sea mountain moved to the empty south-west corner) ----------
  const gh = g9height;
  // v1.0.12: the whole height map is worked out once per new world and gently smoothed (softer, rounder glen hills; no noisy steps)
  let HC = null;
  function buildHC() { if (G42()) __c208.init(); const n = W * D, hf = new Float32Array(n), gl = new Float32Array(n), mm = new Float32Array(n), lo = new Uint8Array(n);
    for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) { const r = rawH(x, z), i = x * D + z; hf[i] = r.hf; gl[i] = r.glen; mm[i] = r.mMask; lo[i] = (r.loch ? 1 : 0) | (r.sand ? 2 : 0) | (r.mar ? 4 : 0); }
    const tmp = new Float32Array(n), R = 2, blur = (src, dst, alongX) => { for (let a = 0; a < (alongX ? D : W); a++) { let acc = 0, cnt = 0; const L = alongX ? W : D, at = k => alongX ? src[k * D + a] : src[a * D + k];
        for (let k = -R; k <= R; k++) if (k >= 0 && k < L) { acc += at(k); cnt++; }
        for (let k = 0; k < L; k++) { const o = alongX ? k * D + a : a * D + k; dst[o] = acc / cnt; const out = k - R, inn = k + R + 1; if (out >= 0) { acc -= at(out); cnt--; } if (inn < L) { acc += at(inn); cnt++; } } } };
    for (let pass = 0; pass < 2; pass++) { blur(hf, tmp, true); blur(tmp, hf, false); }
    HC = {hf, gl, mm, lo, W, D}; }
  g9height = function (x, z) {
    if (!ON) return gh(x, z);
    if (HC && HC.W === W && (x | 0) === x && (z | 0) === z && x >= 0 && z >= 0 && x < W && z < D) { const i = x * D + z; return {h: Math.max(BASE + 4, Math.min(H - 5, Math.round(HC.hf[i]))), glen: HC.gl[i], mMask: HC.mm[i], loch: !!(HC.lo[i] & 1), sand: !!(HC.lo[i] & 2), mar: !!(HC.lo[i] & 4)}; }
    return rawH(x, z);
  };
  function rawH(x, z) {
    if (G42()) return __c208.rawH(x, z);
    let mtR = null; if (Math.abs(x - MT_C[0]) < MT_R * 1.5 && Math.abs(z - MT_C[1]) < MT_R * 1.5) mtR = gh(x, z);
    const wi = g9Island; g9Island = false; let r; try { r = gh(x, z); } finally { g9Island = wi; }
    const dx = x - (W >> 1), dz = z - (D >> 1), ang = Math.atan2(dz, dx);
    const wob = G12 ? 1 + 0.05 * g9fbm(Math.cos(ang) * 2.2 + 11, Math.sin(ang) * 2.2 - 7, 3) + 0.025 * g9fbm(x / 41, z / 41, 2)
      : 1 + 0.09 * g9fbm(Math.cos(ang) * 2.2 + 11, Math.sin(ang) * 2.2 - 7, 3) + 0.04 * g9fbm(x / 23, z / 23, 2);
    const d = G35() ? Math.hypot(dx / 1.0, (z - (D >> 1) - 8) / 1.06) / (232 * (W / 864) * (1 + 0.07 * g9fbm(Math.cos(ang) * 2.6 + 3, Math.sin(ang) * 2.6 + 9, 3) + 0.03 * g9fbm(x / 37, z / 37, 2))) : (G12 ? Math.pow(Math.pow(Math.abs(dx), PN) + Math.pow(Math.abs(dz), PN), 1 / PN) : Math.hypot(dx, dz)) / (RM * wob), m = 1 - sstep(0.72, 1.0, d);
    const sea = SEA - 6 - Math.min(10, (d - 1) * 30) + g9fbm(x / 30, z / 30, 2) * 2;
    let h = r.h * m + Math.min(r.h, sea) * (1 - m);
    if (m < 1) h = Math.min(h, SEA + 2 + (r.h - SEA - 2) * sstep(0.0, 0.55, m));
    let isl = false;
    for (const I of IS) { const ex = (x - I.x) / (I.sx || 1), ez = (z - I.z) / (I.sz || 1); if (Math.abs(ex) > IR * 1.4 || Math.abs(ez) > IR * 1.4) continue;
      const a2 = Math.atan2(ez, ex), wb = 1 + 0.1 * g9fbm(Math.cos(a2) * 2 + I.x / 50, Math.sin(a2) * 2 - 3, 2);
      const di = Math.hypot(ex, ez) / (IR * wb); if (di >= 1.25) continue;
      const mi = 1 - sstep(0.62, 1.0, di);
      let ih = SEA + 4 + Math.max(0, Math.min(9, (r.h - SEA - 3) * 0.35)); const c = sstep(0.5, 0.3, di); ih = ih * (1 - c) + (SEA + 6) * c;
      const si = SEA - 6 - Math.min(10, (di - 1) * 30);
      let hh = ih * mi + Math.min(ih, si) * (1 - mi); if (mi < 1) hh = Math.min(hh, SEA + 2 + (ih - SEA - 2) * sstep(0.0, 0.55, mi));
      if (G12 && di > 0.84) { const c = G36() ? sstep(0.84, 0.95, di) * (1 - sstep(1.0, 1.1, di)) : sstep(0.84, 0.95, di) * (1 - sstep(1.12, 1.24, di)); if (c > 0) { const lo = SEA - 5 + g9fbm(x / 17, z / 17, 2); h = h * (1 - c) + Math.min(h, lo) * c; } }   // a narrow channel all round each castle island
      if (hh > h) { h = hh; isl = true; } }
    let mt = false; if (mtR && mtR.mMask === 1 && mtR.h > h) { h = mtR.h; mt = true; }
    const inl = m > 0.98 && !isl && !mt;
    return {h: Math.max(BASE + 4, Math.min(H - 5, Math.round(h))), hf: h, glen: inl ? r.glen : 0, mMask: mt ? 1 : isl ? 0 : r.mMask * m, loch: !!(r.loch && inl)};
  }
  // castles: one on each island
  try { const cor = window.__c101.corners; window.__c101.corners = function () { if (!ON) return cor.apply(this, arguments); const o = {}; for (const I of IS) { if (I.nc) continue; let tx = I.x, tz = I.z; if (G12) { const ux = Math.sign(I.x - (W >> 1)), uz = Math.sign(I.z - (D >> 1)); tx += Math.round(ux * IR * 0.22); tz += Math.round(uz * IR * 0.22); }   // v1.0.12: towards the island's outer edge, still well inland
      o[I.k] = (x, z) => -Math.hypot(x - tx, z - tz) * 20; } return o; }; } catch (e) { U.err = 'corners ' + e; }

  // ---------- helpers ----------
  const inW = (x, z) => x > 1 && z > 1 && x < W - 2 && z < D - 2;
  const placed = i => placedSet && placedSet.has(i);
  const isGround = b => b && b !== T.WATER && !LEAFY[b] && !LOGGY[b] && PLANT[b] !== 1 && b !== T.TORCH && b !== T.COBWEB;
  const gtop = (x, z) => { for (let y = H - 2; y > 0; y--) if (isGround(world[idx(x, y, z)])) return y; return 0; };
  const put = (x, y, z, v) => { if (!inW(x, z) || y < 1 || y >= H - 1) return; const i = idx(x, y, z); if (placed(i)) return; const o = world[i];
    if (o === T.CHEST || o === T.BED || o === T.DOOR || o === T.FURNACE) { const k = keyOf(x, y, z); entMeta.delete(k); chests.delete(k); }
    world[i] = v; if (v === T.TORCH || v === LAMP || v === 216) lightSrc.set((x * 4096 + z) * 256 + y, [x + .5, y + (v === T.TORCH ? .7 : .5), z + .5, v]); };
  const get = (x, y, z) => world[idx(x, y, z)];

  // ---------- 2. the houses on the spawn island go (ships, the dome and the mine stay) ----------
  const NATS = new Set([0, 1, 2, 3, 4, 5, 6, 7, 9, 15, 49, 50, 51, 52, 60, 61, 62, 68, 69, 79, 91, 133, 142, 144, 146, 147, 181, 202, 206, 207, 208, 215, 238, 239, 240, 252, 253, 211, 8, 135, 136, 137, 138, 139, 143]);
  function removeSpawnHouses() {
    const I = window.__c101 && __c101.isl; if (!I) return 0;
    const seen = new Set(), boxes = []; let n = 0;
    for (let x = I.cx - I.R - 6; x <= I.cx + I.R + 6; x++) for (let z = I.cz - I.R - 6; z <= I.cz + I.R + 6; z++) { if (!inW(x, z)) continue;
      for (let y = SEA + 3; y < H - 1; y++) { const i = idx(x, y, z); if (world[i] !== T.PLANKS || seen.has(i)) continue;
        const st = [i]; seen.add(i); const c = {n: 0, ws: 0, x0: x, x1: x, y0: y, y1: y, z0: z, z1: z};
        while (st.length) { const q = st.pop(), qz = q % D, r = (q - qz) / D, qy = r % H, qx = (r - qy) / H; c.n++; if (world[q] === T.WSTONE) c.ws++;
          if (qx < c.x0) c.x0 = qx; if (qx > c.x1) c.x1 = qx; if (qy < c.y0) c.y0 = qy; if (qy > c.y1) c.y1 = qy; if (qz < c.z0) c.z0 = qz; if (qz > c.z1) c.z1 = qz;
          for (const [a, b, e] of [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]]) { const X = qx + a, Y = qy + b, Z = qz + e; if (Y < 1 || Y >= H - 1 || !inW(X, Z)) continue; const j = idx(X, Y, Z); if (seen.has(j) || NATS.has(world[j])) continue; seen.add(j); st.push(j); } }
        if (c.n >= 40 && c.y0 >= SEA + 3 && c.ws < c.n * 0.5) boxes.push(c); } }
    for (const c of boxes) {
      // ground level round it (30th percentile of the ring's tops)
      const ring = []; for (let x = c.x0 - 3; x <= c.x1 + 3; x++) for (let z = c.z0 - 3; z <= c.z1 + 3; z++) if (x < c.x0 - 1 || x > c.x1 + 1 || z < c.z0 - 1 || z > c.z1 + 1) { const t = gtop(x, z); if (t > SEA) ring.push(t); }
      ring.sort((a, b) => a - b); const gl = ring.length ? ring[Math.floor(ring.length * 0.3)] : c.y0 - 1;
      for (let x = c.x0 - 1; x <= c.x1 + 1; x++) for (let z = c.z0 - 1; z <= c.z1 + 1; z++) { if (!inW(x, z)) continue;
        for (let y = c.y0 - 1; y <= c.y1 + 2 && y < H - 1; y++) { const i = idx(x, y, z), b = world[i]; if (!b || placed(i)) continue;
          if (!NATS.has(b) || (b === T.LOG && y >= c.y0)) { put(x, y, z, T.AIR); lightSrc.delete((x * 4096 + z) * 256 + y); n++; } }
        let t = gtop(x, z); if (t < gl) { for (let y = t + 1; y <= gl; y++) put(x, y, z, y === gl ? T.GRASS : T.DIRT); }
        else if (get(x, t, z) === T.DIRT && !get(x, t + 1, z)) put(x, t, z, T.GRASS); } }
    // the spawn point stands on whatever is left
    try { const sp = __c101.sp; if (sp) { let sy = H - 2; while (sy > 1 && !isGround(get(sp[0], sy, sp[2]))) sy--; sp[1] = sy + 1; g9spawn = sp.slice(); } } catch (_) {}
    U.houses = boxes.length; return n;
  }

  // ---------- 3. bridges: spawn island -> mainland -> castle island, one per castle, each in its castle's style ----------
  const STY = {
    human: {deck: (x, y, z, ap) => ap <= 1.1 ? T.PLANKS : T.STONEBRICK, fill: () => T.STONEBRICK, pil: () => T.STONEBRICK,
      rail: () => FENCE, stair: () => 167, lampEvery: 12, lamp: (x, s, z) => { put(x, s, z, T.STONEBRICK); put(x, s + 1, z, T.STONEBRICK); put(x, s + 2, z, FENCE); put(x, s + 3, z, LAMP); }, gap: () => false},
    mossy: {deck: (x, y, z) => { const r = h3(x, y, z); return r < 0.45 ? T.MOSSYBRICK : r < 0.7 ? T.COBBLE : T.STONEBRICK; }, fill: (x, y, z) => h3(x, y, z) < 0.5 ? T.COBBLE : T.MOSSYBRICK, pil: (x, y, z) => h3(x, y, z) < 0.6 ? T.MOSSYBRICK : T.COBBLE,
      rail: (x, y, z) => { const r = h3(x, y + 7, z); return r < 0.35 ? 0 : r < 0.45 ? T.COBWEB : T.MOSSYBRICK; }, stair: () => 165, lampEvery: 26, lamp: (x, s, z) => { put(x, s, z, T.MOSSYBRICK); put(x, s + 1, z, T.MOSSYBRICK); put(x, s + 2, z, T.TORCH); put(x, s + 1, z + 1 < D ? z : z, T.MOSSYBRICK); },
      gap: (x, z, ap, wet) => wet && ap > 1.4 && h3(x, 3, z) < 0.14},
    black: {deck: (x, y, z, ap) => ap > 1.5 && h3(x, y, z) < 0.12 ? T.COBBLE : BLK, fill: () => BLK, pil: () => BLK,
      rail: (x, y, z) => h3(x, y + 5, z) < 0.3 ? 0 : BLK, stair: () => 166, lampEvery: 14, lamp: (x, s, z) => { put(x, s, z, BLK); put(x, s + 1, z, BLK); put(x, s + 2, z, T.MAGMA); put(x, s + 3, z, LAMP); },
      gap: (x, z, ap, wet) => wet && ap > 1.6 && h3(x, 9, z) < 0.07}
  };
  STY.sand = {deck: () => T.SANDSTONE, fill: () => T.SANDSTONE, pil: () => T.SANDSTONE, rail: (x, y, z) => h3(x, y, z) < 0.5 ? T.SANDSTONE : 150, stair: () => 167, lampEvery: 14,
    lamp: (x, s, z) => { put(x, s, z, T.SANDSTONE); put(x, s + 1, z, T.SANDSTONE); put(x, s + 2, z, FENCE); put(x, s + 3, z, LAMP); }, gap: () => false};
  U.bridgeOne = c => { const r = buildBridges([c]); U.bridges.push(...r); return r; };
  function buildBridges(list) {
    const I = (window.__c101 && __c101.isl) || {cx: W >> 1, cz: D >> 1, R: 30}, out = [], hw = 2, DK = SEA + 4; U.tun = 0; U.tunAt = [];
    const fo = IS.find(q => q.k === 'forest'), ext = G35() && fo ? [['forest', fo.x, fo.z, 1]] : [];
    for (const c of list || [...(g9castles || []), ...ext]) { const st = STY[c[0]] || (c[0] === 'sand' ? STY.sand : STY.human); if (!st || (c[3] && !c[1])) continue;
      const ax = I.cx + 0.5, az = I.cz + 0.5, bx = c[1] + 0.5, bz = c[2] + 0.5, L = Math.hypot(bx - ax, bz - az), ux = (bx - ax) / L, uz = (bz - az) / L, nx = -uz, nz = ux, N = Math.floor(L);
      const G = new Int16Array(N + 1), WET = new Uint8Array(N + 1);
      for (let t = 0; t <= N; t++) { const x = Math.floor(ax + ux * t), z = Math.floor(az + uz * t), g = gtop(x, z); G[t] = g; WET[t] = get(x, g + 1, z) === T.WATER || g < SEA ? 1 : 0; }
      const SEG = G42() && c[0] !== 'sand', segs = [];
      if (SEG) { let a = -1; for (let t = Math.round(I.R * 0.55); t <= N - 24; t++) { if (WET[t] && a < 0) a = t; if ((!WET[t] || t === N - 24) && a >= 0) { if (t - a >= 2) { const p = segs[segs.length - 1]; if (p && a - 5 - p[1] < 12) p[1] = Math.min(N - 3, t + 5); else segs.push([Math.max(0, a - 5), Math.min(N - 3, t + 5)]); } a = -1; } } }
      else { let t0 = -1; if (c[3]) { let w = -1; for (let t = N - 20; t > I.R * 0.55; t--) { if (WET[t]) w = t; else if (w > 0 && !WET[t] && !WET[t - 1] && !WET[t - 2] && G[t] > SEA) { t0 = Math.max(0, t - 5); break; } } }
      else for (let t = Math.round(I.R * 0.55); t < N; t++) if (WET[t]) { t0 = Math.max(0, t - 5); break; } if (t0 < 0) continue;
      let t1 = N - 24; if (c[3]) { t1 = -1; for (let t = t0 + 6; t < N - 3; t++) if (!WET[t] && !WET[t + 1] && !WET[t + 2] && G[t] > SEA) { t1 = Math.min(N - 3, t + 5); break; } if (t1 < 0) continue; }
      if (t1 > t0 + 10) segs.push([t0, t1]); }
      for (const [t0, t1] of segs) { if (t1 <= t0 + 6) continue;
      // v1.0.23: a level deck at DK; stair ramps only at the two ends; where the land rises well above the deck, a lined, lit tunnel goes through it (no more holes cut up the hillside)
      const S = new Int16Array(N + 1), E0 = Math.max(G[t0], SEA + 1), E1 = Math.max(G[t1], SEA + 1);
      for (let t = t0; t <= t1; t++) { let v = DK; const d0 = t - t0, d1 = t1 - t; if (d0 < Math.abs(E0 - DK)) v = E0 + Math.sign(DK - E0) * d0; if (d1 < Math.abs(E1 - DK) && (d1 < d0 || v === DK)) v = E1 + Math.sign(DK - E1) * d1; S[t] = v; }
      const F47 = G47(); if (F47) { // v1.0.47: never below the land across the deck; over water at deck height; ramps of 1 block per block; an embankment over low land
        for (let t = t0; t <= t1; t++) { let hi = -1e9; for (let k = -hw; k <= hw; k++) { const x = Math.floor(ax + ux * t + nx * k), z = Math.floor(az + uz * t + nz * k); if (!inW(x, z)) continue; const g = gtop(x, z); if (!(get(x, g + 1, z) === T.WATER || g < SEA)) hi = Math.max(hi, g); }
          S[t] = WET[t] ? Math.max(DK, hi) : Math.max(hi, SEA + 1); }
        for (let t = t0 + 1; t <= t1; t++) S[t] = Math.max(S[t], S[t - 1] - 1); for (let t = t1 - 1; t >= t0; t--) S[t] = Math.max(S[t], S[t + 1] - 1); }
      const TUN = new Uint8Array(N + 2); if (!F47) for (let t = t0; t <= t1; t++) { let lo = 1e9; for (let k = -2; k <= 2; k++) { const q = Math.min(t1, Math.max(t0, t + k)), x = Math.floor(ax + ux * q), z = Math.floor(az + uz * q); lo = Math.min(lo, gtop(x, z)); } if (lo >= S[t] + 7 && !WET[t]) TUN[t] = 1; }
      for (let t = t0 + 1; t < t1; t++) if (!TUN[t] && TUN[t - 1] && TUN[t + 1]) TUN[t] = 1;
      const SB = st.stair(), dom = Math.abs(ux) > Math.abs(uz), fUp = stairF(dom ? Math.sign(ux) : 0, dom ? 0 : Math.sign(uz)), fDn = stairF(dom ? -Math.sign(ux) : 0, dom ? 0 : -Math.sign(uz));
      const sideF = (px, pz) => { const ox = px * nx, oz = pz * nz, sd = Math.sign(px * nx + pz * nz) || 1, vx = nx * sd, vz = nz * sd; return Math.abs(vx) > Math.abs(vz) ? stairF(Math.sign(vx), 0) : stairF(0, Math.sign(vz)); };
      const stp = (x, y, z, f) => { put(x, y, z, SB); if (get(x, y, z) === SB) try { entMeta.set(keyOf(x, y, z), {face: f}); } catch (_) {} };
      const x0 = Math.floor(Math.min(ax + ux * t0, ax + ux * t1)) - 5, x1 = Math.ceil(Math.max(ax + ux * t0, ax + ux * t1)) + 5, z0 = Math.floor(Math.min(az + uz * t0, az + uz * t1)) - 5, z1 = Math.ceil(Math.max(az + uz * t0, az + uz * t1)) + 5;
      let cols = 0;
      for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) { if (!inW(x, z)) continue;
        const px = x + 0.5 - ax, pz = z + 0.5 - az, t = px * ux + pz * uz, ap = Math.abs(px * nx + pz * nz); if (t < t0 || t > t1 || ap > hw + 1.5) continue;
        const ti = Math.round(t), s = S[ti], g = gtop(x, z), wet = get(x, g + 1, z) === T.WATER || g < SEA, deck = ap <= hw + 0.5;
        if (TUN[ti]) { // tunnel: 5 wide, 4 high inside, stone-brick lined all round so no water or cave daylight gets in
          for (let y = s + 1; y <= s + 5; y++) { const ins = deck && y <= s + 4; put(x, y, z, ins ? T.AIR : st.fill(x, y, z)); }
          if (get(x, s + 6, z) === T.WATER || !get(x, s + 6, z)) put(x, s + 6, z, st.fill(x, s + 6, z));
          put(x, s, z, deck ? st.deck(x, s, z, ap) : st.fill(x, s, z)); if (!get(x, s - 1, z) || get(x, s - 1, z) === T.WATER) put(x, s - 1, z, st.fill(x, s - 1, z));
          if (deck && ap > hw - 0.5) stp(x, s + 4, z, sideF(-px, -pz) );   // arch corbels along the top corners
          if (deck && ap < 0.5 && ti % 8 === 0) put(x, s + 4, z, LAMP);
          if (deck && S[ti + 1] > s && ti < t1) stp(x, s + 1, z, fUp); else if (deck && ti > t0 && S[ti - 1] > s) stp(x, s + 1, z, fDn);
          cols++; continue; }
        if (F47 && !deck && g > s) continue;   // v1.0.47: never cut a notch into the bank beside the deck
        if (!deck && !(wet || s - g >= 2)) continue;
        // clear the way (trees, plants, a low rise) above the deck - only up to the land itself, never a slot up a hillside
        const top = deck ? Math.min(H - 2, s + 8) : Math.min(H - 2, s + 4);
        for (let y = s + 1; y <= top; y++) { const b = get(x, y, z); if (b && b !== T.WATER && (!F47 || deck || LEAFY[b] || LOGGY[b] || PLANT[b])) put(x, y, z, T.AIR); }
        if (st.gap(x, z, ap, wet)) continue;
        if (!wet) { if (g < s) for (let y = g + 1; y < s; y++) put(x, y, z, st.fill(x, y, z)); }
        else if (ti % 9 === 0 && ap >= 1.2) for (let y = g + 1; y < s; y++) put(x, y, z, st.pil(x, y, z));
        put(x, s, z, st.deck(x, s, z, ap)); cols++;
        if (deck) { if (ti < t1 && S[ti + 1] > s) stp(x, s + 1, z, fUp); else if (ti > t0 && S[ti - 1] > s) stp(x, s + 1, z, fDn); }
        else { const r = st.rail(x, s + 1, z); if (r) { if (r !== T.COBWEB && ti % 3 === 1 && S[ti - 1] === s && S[ti + 1] === s) stp(x, s + 1, z, sideF(px, pz)); else put(x, s + 1, z, r); } } }
      // portals: a stair-capped arch face over each tunnel mouth
      for (let t = t0 + 1; t < t1; t++) if (TUN[t] !== TUN[t - 1]) { const q = TUN[t] ? t : t - 1, out = TUN[t] ? -1 : 1; U.tun++; U.tunAt.push([Math.round(ax + ux * (q + out * 6)), S[q], Math.round(az + uz * (q + out * 6)), ux * -out, uz * -out, c[0]]);
        for (let k = -hw - 1; k <= hw + 1; k++) { const x = Math.floor(ax + ux * (q + out) + nx * k), z = Math.floor(az + uz * (q + out) + nz * k); if (!inW(x, z)) continue; const sq = S[q];
          if (Math.abs(k) === hw + 1) for (let y = sq + 1; y <= sq + 5; y++) put(x, y, z, st.fill(x, y, z)); else if (!get(x, sq + 5, z) || get(x, sq + 5, z) === T.WATER) stp(x, sq + 5, z, TUN[t] ? fUp : fDn); } }
      // lamps on both rails (not inside a tunnel)
      for (let t = t0 + 4; t < t1 - 2; t += st.lampEvery) { if (TUN[t]) continue; for (const sd of [-1, 1]) { const x = Math.floor(ax + ux * t + nx * sd * (hw + 1)), z = Math.floor(az + uz * t + nz * sd * (hw + 1)); if (inW(x, z)) st.lamp(x, S[t], z); } }
      out.push({k: c[0], from: [Math.round(ax + ux * t0), Math.round(az + uz * t0)], to: [Math.round(ax + ux * t1), Math.round(az + uz * t1)], len: t1 - t0, cols, a: [ax, az, ux, uz, t0, t1]}); } }
    return out;
  }

  // ---------- 4. crofts: a wee house with a bed, a field next to it, one farmer each ----------
  let FARMS = [];
  U.farmsList = () => FARMS; U.nearBridge = (x, z, r) => nearBridge(x, z, r);
  const nearBridge = (x, z, r) => U.bridges.some(b => { const [ax, az, ux, uz, t0, t1] = b.a, px = x - ax, pz = z - az, t = px * ux + pz * uz; return t > t0 - r && t < t1 + r && Math.abs(-px * uz + pz * ux) < r; });
  function buildFarms() {
    const I = (window.__c101 && __c101.isl) || {cx: W >> 1, cz: D >> 1, R: 30}, cand = [];
    for (let a = 0; a < 6.283; a += 0.05) for (let rr = G35() ? 96 : 172; rr < (G35() ? 440 : RM - 22); rr += 8) {
      const x0 = Math.round((W >> 1) + Math.cos(a) * rr) - 3, z0 = Math.round((D >> 1) + Math.sin(a) * rr) - 6;
      if (!inW(x0 - 5, z0 - 5) || !inW(x0 + 11, z0 + 16)) continue; if (Math.hypot(x0 + 3 - I.cx, z0 + 6 - I.cz) < I.R + 45) continue; if (nearBridge(x0 + 3, z0 + 6, 16)) continue;
      let lo = 1e9, hi = -1e9, bad = false; const tops = [];
      for (let x = x0 - 2; x <= x0 + 8 && !bad; x += 2) for (let z = z0 - 2; z <= z0 + 13; z += 2) { const t = gtop(x, z); if (get(x, t + 1, z) === T.WATER || t <= SEA + 1) { bad = true; break; } lo = Math.min(lo, t); hi = Math.max(hi, t); tops.push(t); }
      if (bad || hi - lo > 3) continue; let bon = 0;
      if (G35()) { const inI = IS.find(q => Math.hypot((x0 + 3 - q.x) / (q.sx || 1), (z0 + 6 - q.z) / (q.sz || 1)) < IR * 1.15); if (inI && !inI.nc) continue; if (inI) bon = -6; if (Math.hypot(x0 + 3 - MT_C[0], z0 + 6 - MT_C[1]) < 110) continue; }
      tops.sort((p, q) => p - q); cand.push({x0, z0, gy: tops[tops.length >> 1], sc: hi - lo + h3(x0, 1, z0) + bon}); }
    cand.sort((p, q) => p.sc - q.sc); const pick = [];
    for (const c of cand) { if (pick.length >= 8) break; if (pick.every(p => Math.hypot(p.x0 - c.x0, p.z0 - c.z0) > 75)) pick.push(c); }
    pick.forEach((c, i) => { try { croft(c.x0, c.z0, c.gy); c.i = i; } catch (e) { U.err = 'croft ' + e; } });
    return pick.map(c => ({x0: c.x0, z0: c.z0, gy: c.gy, i: c.i}));
  }
  function croft(x0, z0, gy) {
    for (let x = x0 - 4; x <= x0 + 10; x++) for (let z = z0 - 4; z <= z0 + 15; z++) for (let y = gy - 1; y < H - 2; y++) { const b = get(x, y, z); if (b && (LEAFY[b] || LOGGY[b] || PLANT[b] === 1)) put(x, y, z, T.AIR); }
    for (let x = x0 - 2; x <= x0 + 8; x++) for (let z = z0 - 2; z <= z0 + 13; z++) { const t = gtop(x, z);
      for (let y = Math.min(t + 1, gy); y <= gy; y++) put(x, y, z, y === gy ? T.GRASS : T.DIRT); for (let y = gy + 1; y <= Math.max(t, gy + 1); y++) put(x, y, z, T.AIR); put(x, gy, z, T.GRASS); }
    for (let x = x0; x <= x0 + 6; x++) for (let z = z0; z <= z0 + 5; z++) { put(x, gy, z, T.PLANKS); put(x, gy - 1, z, T.COBBLE);
      const edge = x === x0 || x === x0 + 6 || z === z0 || z === z0 + 5, corner = (x === x0 || x === x0 + 6) && (z === z0 || z === z0 + 5);
      for (let y = gy + 1; y <= gy + 3; y++) put(x, y, z, edge ? (corner ? T.LOG : T.WSTONE) : T.AIR); }
    put(x0 + 3, gy + 1, z0 + 5, T.AIR); put(x0 + 3, gy + 2, z0 + 5, T.AIR);   // doorway (open)
    for (const [x, z] of [[x0 + 2, z0], [x0 + 4, z0], [x0, z0 + 3], [x0 + 6, z0 + 3], [x0 + 5, z0 + 5]]) put(x, gy + 2, z, T.GLASS);
    for (let x = x0 - 1; x <= x0 + 7; x++) for (let z = z0 - 1; z <= z0 + 6; z++) put(x, gy + 4, z, T.PLANKS);
    for (let x = x0; x <= x0 + 6; x++) for (let z = z0 + 1; z <= z0 + 4; z++) put(x, gy + 5, z, T.PLANKS);
    for (let x = x0; x <= x0 + 6; x++) for (let z = z0 + 2; z <= z0 + 3; z++) put(x, gy + 6, z, T.LOG);
    // bed (foot at z0+2, head at z0+1, face 0), table, a torch
    put(x0 + 1, gy + 1, z0 + 2, T.BED); put(x0 + 1, gy + 1, z0 + 1, T.BED); entMeta.set(keyOf(x0 + 1, gy + 1, z0 + 2), {face: 0, bed: 'foot'}); entMeta.set(keyOf(x0 + 1, gy + 1, z0 + 1), {face: 0, bed: 'head'});
    put(x0 + 5, gy + 1, z0 + 1, T.TABLE); put(x0 + 5, gy + 1, z0 + 4, T.TORCH);
    // the field: 5x5 farmland, water in the middle, wheat at all stages
    for (let x = x0 + 1; x <= x0 + 5; x++) for (let z = z0 + 7; z <= z0 + 11; z++) { put(x, gy - 1, z, T.DIRT);
      if (x === x0 + 3 && z === z0 + 9) { put(x, gy, z, T.WATER); continue; }
      put(x, gy, z, T.FARM); const r = h3(x, 4, z); if (r < 0.25) continue; const v = r < 0.5 ? T.WHEAT0 : r < 0.72 ? T.WHEAT0 + 1 : T.WHEAT3; put(x, gy + 1, z, v); if (v !== T.WHEAT3) crops.set(x + ',' + (gy + 1) + ',' + z, {t: 25 + h3(x, 5, z) * 20}); }
    put(x0 + 3, gy, z0 + 6, T.GRAVEL);
  }

  // ---------- generate: on for new worlds and "Reset world" (old saves keep their land) ----------
  const gen = generate;
  generate = function () {
    if (!L94()) { ON = false; return gen.apply(this, arguments); }
    setP(P12()); IS = ISL(); ISL_C = [W >> 1, D >> 1]; ISL_R = 1; MT_C = G42() ? __c208.MT() : G36() ? [Math.round(W * 0.2384), Math.round(D * 0.7778)] : [(W >> 1) - 290, (D >> 1) + 290]; HOL_C = [MT_C[0] + Math.round(20 * MT_R / 58), MT_C[1] + 2];
    ON = true; HC = null; let r; try { if (G12) { const t = performance.now(); if (!gSeed) gSeed = window.__forceSeed || (Math.random() * 2 ** 31) | 0; G9P = g9perm(gSeed); buildHC(); U.hcMs = Math.round(performance.now() - t); } r = gen.apply(this, arguments); } finally { ON = false; HC = null; }
    const t0 = performance.now();
    try { U.removed = removeSpawnHouses(); } catch (e) { U.err = 'houses ' + (e && e.stack || e); }
    try { U.bridges = window.__g89 && __g89() ? [] : buildBridges(); } catch (e) { U.err = 'bridges ' + (e && e.stack || e); }
    try { FARMS = buildFarms(); U.farms = FARMS.length; } catch (e) { U.err = 'farms ' + (e && e.stack || e); }
    U.ms = Math.round(performance.now() - t0); U.on = true; fGen++;
    return r; };
  const ew = enterWorld; enterWorld = function (save) {
    try { if (current) current.l94 = save ? !!(save.c113 && save.c113.l94) : true; } catch (_) {}
    if (!save) { FARMS = []; U.bridges = []; } U.on = false; return ew.apply(this, arguments); };
  const ser = serialize; serialize = function () { const d = ser.apply(this, arguments); try { if (!DIM.cur && current && current.l94) d.c113 = {l94: 1, farms: FARMS, br: U.bridges.map(b => ({k: b.k, a: b.a}))}; } catch (_) {} return d; };
  const ap = applySave; applySave = function (d) { const r = ap.apply(this, arguments); try { if (d && !d.dim) { FARMS = (d.c113 && d.c113.farms) || []; U.bridges = (d.c113 && d.c113.br) || []; fGen++; } } catch (_) {} return r; };
  if (typeof window.c38GenCells === 'function') { const cg = window.c38GenCells; window.c38GenCells = function () { const f = FARMS, b = U.bridges, g = fGen; try { return cg.apply(this, arguments); } finally { FARMS = f; U.bridges = b; fGen = g; } }; }

  // ---------- 5. the farmers ----------
  var fGen = 0; let fBuilt = -1; const folk = []; U.folk = folk;
  const NAMES_F = ['Wullie', 'Jock', 'Rab', 'Tam', 'Davie', 'Eck', 'Dougie', 'Shug'];
  const FL = [{skin: '#e8b090', beard: '#b8561e', shirt: 0x5f7a3a, trous: 0x6a5030}, {skin: '#d9a07a', beard: '#6a4a2a', shirt: 0x3e5f86, trous: 0x4a3a28}, {skin: '#e0b8a0', beard: '#c8c4bc', shirt: 0x8a5a3a, trous: 0x3f4a36}];
  const fTex = new Map();
  function faceF(li, mood) { const k = li + mood; if (fTex.has(k)) return fTex.get(k); const L = FL[li % FL.length];
    const c = document.createElement('canvas'); c.width = c.height = 32; const g = c.getContext('2d'); const px = (x, y, w, h, col) => { g.fillStyle = col; g.fillRect(x, y, w, h); };
    px(0, 0, 32, 32, L.skin); px(0, 0, 32, 4, L.beard); px(2, 10, 3, 3, 'rgba(200,80,70,.35)'); px(27, 10, 3, 3, 'rgba(200,80,70,.35)');
    for (const ex of [8, 19]) { if (mood === 'sleep') { px(ex, 14, 5, 1, '#5a3a2a'); continue; } px(ex, 12, 5, 4, '#f4f1ea'); px(ex + 1, 12, 3, 4, '#2f6fb0'); px(ex + 2, 13, 1, 2, '#0c0e10'); }
    if (mood === 'confused') { px(7, 7, 7, 2, L.beard); px(19, 10, 7, 2, L.beard); } else { px(7, 10, 7, 2, L.beard); px(19, 10, 7, 2, L.beard); }
    px(14, 16, 4, 4, 'rgba(150,60,40,.35)');
    px(3, 20, 26, 12, L.beard); px(0, 14, 4, 18, L.beard); px(28, 14, 4, 18, L.beard);   // big bushy beard
    px(10, 22, 12, 4, '#c27a66');   // v1.0.28: lips you can see through the beard
    if (mood === 'confused') { px(13, 22, 6, 5, '#c27a66'); px(14, 23, 4, 3, '#2a0806'); } else if (mood !== 'sleep') px(11, 23, 10, 2, '#2a0806'); else px(13, 23, 6, 1, '#5a1a12');
    const t = new THREE.CanvasTexture(c); t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter; if (THREE.SRGBColorSpace) t.colorSpace = THREE.SRGBColorSpace; fTex.set(k, t); return t; }
  function makeFarmer(li) {
    const L = FL[li % FL.length], g = new THREE.Group(), M = o => new THREE.MeshLambertMaterial(o);
    const skin = M({color: new THREE.Color(L.skin)}), beard = M({color: new THREE.Color(L.beard)}), faceM = M({map: faceF(li, 'focused')}), shirt = M({color: L.shirt}), trous = M({color: L.trous}),
      boot = M({color: 0x2a1c12}), straw = M({color: 0xd8b860}), band = M({color: 0x7a2a1a}), wood = M({color: 0x8a6238}), iron = M({color: 0xb8bcc4});
    const box = (w, h, d, m, x, y, z, par) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(x, y, z); (par || g).add(b); return b; };
    const head = new THREE.Group(); head.position.y = 1.5; g.add(head);
    const hm = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), [skin, skin, beard, skin, faceM, beard]); hm.position.y = 0.25; head.add(hm);
    box(0.84, 0.05, 0.84, straw, 0, 0.52, 0, head); box(0.52, 0.18, 0.52, straw, 0, 0.62, 0, head); box(0.53, 0.05, 0.53, band, 0, 0.56, 0, head);   // straw hat
    box(0.07, 0.09, 0.05, skin, 0, 0.2, 0.27, head);
    box(0.52, 0.62, 0.3, shirt, 0, 1.17, 0); box(0.54, 0.4, 0.32, trous, 0, 0.98, 0.002); box(0.44, 0.32, 0.24, trous, 0, 0.64, 0);   // smock + dungaree bib
    box(0.06, 0.5, 0.02, trous, -0.16, 1.25, 0.16); box(0.06, 0.5, 0.02, trous, 0.16, 1.25, 0.16);   // braces
    const arms = [], legs = [];
    for (const sx of [-1, 1]) { const piv = new THREE.Group(); piv.position.set(sx * 0.35, 1.44, 0); g.add(piv); box(0.2, 0.5, 0.2, shirt, 0, -0.25, 0, piv); box(0.18, 0.18, 0.18, skin, 0, -0.58, 0, piv); arms.push(piv); }
    for (const sx of [-1, 1]) { const piv = new THREE.Group(); piv.position.set(sx * 0.12, 0.5, 0); g.add(piv); box(0.21, 0.36, 0.21, trous, 0, -0.18, 0, piv); box(0.23, 0.15, 0.3, boot, 0, -0.43, 0.03, piv); legs.push(piv); }
    // the hoe, in the right hand
    const hoe = new THREE.Group(); hoe.position.set(0, -0.6, 0.05); hoe.rotation.x = Math.PI / 2 - 0.25; arms[1].add(hoe);
    box(0.05, 1.1, 0.05, wood, 0, 0.25, 0, hoe); box(0.06, 0.06, 0.3, iron, 0, 0.78, 0.12, hoe); box(0.07, 0.16, 0.04, iron, 0, 0.7, 0.26, hoe);
    return {g, head, arms, legs, faceM};
  }
  function spawnFolk() {
    for (const f of folk) { try { scene.remove(f.m.g); } catch (_) {} } folk.length = 0;
    for (const F of FARMS) { const m = makeFarmer(F.i || 0); const f = {F, m, name: NAMES_F[(F.i || 0) % NAMES_F.length], who: {role: (F.i || 0) % 2 ? 'miner' : 'hunter', kind: 'farmer'}, st: 'idle', t: 1 + Math.random() * 3, wp: [], yaw: 0, walk: 0, mood: 'focused', moodT: 0, chatT: 6 + Math.random() * 10, task: null};
      const p = night() ? bedPos(F) : [F.x0 + 3.5, F.gy + 1, F.z0 + 6.6]; m.g.position.set(p[0], p[1], p[2]); if (night()) lie(f); scene.add(m.g); folk.push(f); }
    fBuilt = fGen; }
  const night = () => (typeof isNight !== 'undefined' && isNight) || (typeof daylight === 'number' && daylight < 0.3);
  const bedPos = F => [F.x0 + 1.5, F.gy + 1.56, F.z0 + 2.95];
  const inHouse = (f, p) => p.x > f.F.x0 + 0.3 && p.x < f.F.x0 + 6.7 && p.z > f.F.z0 + 0.3 && p.z < f.F.z0 + 5.6;
  const DIN = F => [F.x0 + 3.5, F.z0 + 4.2], DOUT = F => [F.x0 + 3.5, F.z0 + 6.6];
  function lie(f) { f.st = 'sleep'; const p = bedPos(f.F); f.m.g.position.set(p[0], p[1], p[2]); f.m.g.rotation.set(-Math.PI / 2, 0, 0); f.mood = 'sleep'; f.wp = []; }
  function stand(f) { f.m.g.rotation.set(0, f.yaw, 0); }
  function route(f, x, z) { const p = f.m.g.position, F = f.F, inside = inHouse(f, p), toIn = x > F.x0 + 0.3 && x < F.x0 + 6.7 && z > F.z0 + 0.3 && z < F.z0 + 5.6; f.wp = [];
    if (inside && !toIn) f.wp.push(DIN(F), DOUT(F)); else if (!inside && toIn) f.wp.push(DOUT(F), DIN(F)); f.wp.push([x, z]); }
  function groundY(x, z, y0) { const bx = Math.floor(x), bz = Math.floor(z); for (let y = Math.floor(y0) + 1; y > y0 - 4; y--) if (solid(bx, y - 1, bz) && !solid(bx, y, bz)) return y; return y0; }
  function fieldJob(F) { const order = []; for (let x = F.x0 + 1; x <= F.x0 + 5; x++) for (let z = F.z0 + 7; z <= F.z0 + 11; z++) if (!(x === F.x0 + 3 && z === F.z0 + 9)) order.push([x, z]);
    for (let i = order.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [order[i], order[j]] = [order[j], order[i]]; }
    for (const [x, z] of order) { const y = F.gy; if (placed(idx(x, y, z)) || placed(idx(x, y + 1, z))) continue; const b = get(x, y, z), a = get(x, y + 1, z);
      if (b === T.FARM && a === T.WHEAT3) return {x, z, k: 'harvest'}; if (b === T.FARM && !a) return {x, z, k: 'plant'}; if ((b === T.GRASS || b === T.DIRT) && !a) return {x, z, k: 'till'}; }
    return null; }
  function doJob(f) { const j = f.task, F = f.F; f.task = null; if (!j) return; const y = F.gy, b = get(j.x, y, j.z), a = get(j.x, y + 1, j.z); if (placed(idx(j.x, y, j.z)) || placed(idx(j.x, y + 1, j.z))) return;
    if (j.k === 'till' && (b === T.GRASS || b === T.DIRT) && !a) { setB(j.x, y, j.z, T.FARM); try { burst(j.x + .5, y + 1, j.z + .5, 0x6a4a2a, 6); } catch (_) {} }
    else if (j.k === 'plant' && b === T.FARM && !a) { setB(j.x, y + 1, j.z, T.WHEAT0); crops.set(j.x + ',' + (y + 1) + ',' + j.z, {t: 25 + Math.random() * 20}); try { burst(j.x + .5, y + 1.1, j.z + .5, 0x8ac040, 4); } catch (_) {} }
    else if (j.k === 'harvest' && a === T.WHEAT3) { setB(j.x, y + 1, j.z, T.WHEAT0); crops.set(j.x + ',' + (y + 1) + ',' + j.z, {t: 25 + Math.random() * 20}); try { burst(j.x + .5, y + 1.3, j.z + .5, 0xd8c050, 8); } catch (_) {} }
    else return; U.acts++; }
  const LIGHT_SAY = ['ochaye', 'hmmph', 'aye', 'ach', 'rright', 'hehheh', 'wheesht', 'oohaye', 'mumble'];
  const say = (k, f) => { try { if (window.__c100 && __c100.voice) __c100.voice(k, f.m.g.position, f.who); } catch (_) {} };
  function step(f, dt, dP) {
    const g = f.m.g, p = g.position, F = f.F;
    if (f.moodT > 0) { f.moodT -= dt; if (f.moodT <= 0 && f.mood === 'confused') f.mood = f.st === 'sleep' ? 'sleep' : 'focused'; }
    if (night()) { if (f.st !== 'sleep' && f.st !== 'tobed') { f.task = null; route(f, F.x0 + 2.5, F.z0 + 2.5); f.st = 'tobed'; } }
    else if (f.st === 'sleep' || f.st === 'tobed') { if (f.st === 'sleep') { g.position.set(F.x0 + 2.5, F.gy + 1, F.z0 + 2.5); } f.st = 'idle'; f.t = 1 + Math.random() * 2; f.mood = 'focused'; f.wp = []; stand(f); }
    if (f.st === 'sleep') { f.chatT -= dt; if (f.chatT <= 0) { f.chatT = 3.5 + Math.random() * 3.5; if (dP < 12) say(Math.random() < 0.5 ? 'yawn' : 'mumble', f); } return; }
    if (f.wp.length) { const [tx, tz] = f.wp[0], dx = tx - p.x, dz = tz - p.z, d = Math.hypot(dx, dz);
      if (d < 0.15) { f.wp.shift(); if (!f.wp.length) { if (f.st === 'tobed') { lie(f); return; } if (f.st === 'go') { f.st = 'act'; f.t = 1.6; } else { f.st = 'idle'; f.t = 2 + Math.random() * 4; } } }
      else { const sp = Math.min(d, 1.5 * dt); p.x += dx / d * sp; p.z += dz / d * sp; f.yaw = Math.atan2(dx, dz); p.y = groundY(p.x, p.z, p.y); f.walk += dt * 6;
        const sw = Math.sin(f.walk) * 0.6; f.m.legs[0].rotation.x = sw; f.m.legs[1].rotation.x = -sw; f.m.arms[0].rotation.x = -sw * 0.7; f.m.arms[1].rotation.x = sw * 0.4 - 0.2; } }
    else { f.m.legs[0].rotation.x = f.m.legs[1].rotation.x = 0; f.m.arms[0].rotation.x *= 0.85; }
    if (f.st === 'act') { f.t -= dt; const ph = 1.6 - f.t; f.m.arms[1].rotation.x = -1.3 + Math.abs(Math.sin(ph * 5.5)) * 1.1; g.rotation.x = 0; f.m.head.rotation.x = 0.35;
      if (f.task) f.yaw = Math.atan2(f.task.x + .5 - p.x, f.task.z + .5 - p.z);
      if (f.t <= 0) { doJob(f); f.m.head.rotation.x = 0; f.m.arms[1].rotation.x = 0; f.st = 'idle'; f.t = 1.5 + Math.random() * 3; } }
    else if (f.st === 'idle') { f.t -= dt; f.m.arms[1].rotation.x *= 0.9;
      if (dP < 5) { const yaw = Math.atan2(P.x - p.x, P.z - p.z); let dy = yaw - f.yaw; while (dy > Math.PI) dy -= 6.283; while (dy < -Math.PI) dy += 6.283; f.m.head.rotation.y = Math.max(-1, Math.min(1, dy)); } else f.m.head.rotation.y *= 0.9;
      if (f.t <= 0) { const j = Math.random() < 0.8 ? fieldJob(F) : null;
        if (j) { f.task = j; const sx = j.x + 0.5, sz = j.z - 0.25; route(f, sx, sz); f.st = 'go'; }
        else { route(f, F.x0 - 1 + Math.random() * 9, F.z0 + 6.3 + Math.random() * 6.5); f.st = 'wander'; } } }
    f.chatT -= dt; if (f.chatT <= 0) { f.chatT = 2 + Math.random() * 3; if (dP < 16) say(LIGHT_SAY[(Math.random() * LIGHT_SAY.length) | 0], f); }
    stand(f); }
  // "huh??" bubble
  let bub = null, bubF = null, bubT = 0; const v3 = new THREE.Vector3();
  function bubble(f, txt) { if (!bub) { bub = document.createElement('div'); bub.dataset.testid = 'farmer-bubble'; bub.style.cssText = 'position:fixed;left:0;top:0;z-index:40;pointer-events:none;padding:5px 10px;border-radius:10px;background:rgba(255,255,255,.95);color:#3a3020;font:bold 14px system-ui,sans-serif;box-shadow:0 2px 6px rgba(0,0,0,.35);transform:translate(-50%,-100%);display:none'; document.body.appendChild(bub); }
    bub.textContent = f.name + ': ' + txt; bubF = f; bubT = 2; U.bubble = bub.textContent; }
  function bubStep(dt) { if (!bub || bubT <= 0) return; bubT -= dt; if (bubT <= 0 || !bubF || screen !== 'game') { bub.style.display = 'none'; return; }
    v3.copy(bubF.m.g.position); v3.y += bubF.st === 'sleep' ? 1 : 2.5; v3.project(camera); if (v3.z > 1 || Math.abs(v3.x) > 1.1 || Math.abs(v3.y) > 1.1) { bub.style.display = 'none'; return; }
    bub.style.display = 'block'; bub.style.left = ((v3.x + 1) / 2 * innerWidth) + 'px'; bub.style.top = ((1 - v3.y) / 2 * innerHeight) + 'px'; }
  const dir = new THREE.Vector3(), cp = new THREE.Vector3();
  function aimFarmer(maxD) { if (!folk.length) return null; camera.getWorldDirection(dir); camera.getWorldPosition(cp); let best = null, bd = maxD;
    for (const f of folk) { if (!f.m.g.visible) continue; const q = f.m.g.position, ox = q.x - cp.x, oy = q.y + (f.st === 'sleep' ? 0.3 : 1.1) - cp.y, oz = q.z - cp.z, al = ox * dir.x + oy * dir.y + oz * dir.z; if (al <= 0 || al > bd) continue;
      const px = ox - dir.x * al, py = oy - dir.y * al, pz = oz - dir.z * al; if (px * px + py * py * 0.4 + pz * pz < 0.36) { bd = al; best = f; } } return best ? {f: best, d: bd} : null; }
  U.aim = aimFarmer;
  function huh(f) { U.huh++; if (f.st === 'sleep') { say('mumble', f); bubble(f, 'zzz... huh?'); return; } f.mood = 'confused'; f.moodT = 1.8; f.st = 'idle'; f.t = 2.5; f.wp = []; f.task = null; f.yaw = Math.atan2(P.x - f.m.g.position.x, P.z - f.m.g.position.z); say('huh', f); bubble(f, 'Huh??'); }
  U.huhF = huh;
  const ui0 = useItem; useItem = function () {
    try { if (!menuOpen && !paused && !dead && started && folk.length) { const h = aimFarmer(4.5); if (h) { let m = null; try { m = reachMob(4); } catch (_) {} let md = 1e9; if (m && m.g) md = Math.hypot(m.g.position.x - P.x, m.g.position.z - P.z); if (h.d < md) { huh(h.f); return; } } } } catch (e) { U.err = 'use ' + e; }
    return ui0.apply(this, arguments); };
  const um = updateMobs; updateMobs = function (dt) { const r = um.apply(this, arguments);
    try { if (fBuilt !== fGen && started) spawnFolk();
      const show = started && !DIM.cur;
      for (const f of folk) { const g = f.m.g; if (g.parent !== scene) scene.add(g); const dP = Math.hypot(g.position.x - P.x, g.position.z - P.z); g.visible = show && dP < 96; if (!g.visible || dP > 72 || paused) continue;
        step(f, Math.min(dt, 0.1), dP); const mood = f.mood || 'focused'; if (f.shown !== mood) { f.shown = mood; f.m.faceM.map = faceF(f.F.i || 0, mood); f.m.faceM.needsUpdate = true; } }
      bubStep(dt); } catch (e) { if (!U.err) U.err = 'folk ' + (e && e.stack || e); }
    return r; };

  // ---------- 6. level-up: a big bright chime at level 30, a softer short one every 5 levels ----------
  function bigChime(big) {
    U.chime = big ? 'big' : 'soft'; if (!AC) return; if (AC.state === 'suspended') { try { AC.resume(); } catch (_) {} }
    const out = outNode(big ? 0.6 : 0.38, 0), t0 = AC.currentTime + 0.01;
    // a short shimmer tail: feedback delay through a gentle low-pass
    const dl = AC.createDelay(0.5), fb = AC.createGain(), lp = AC.createBiquadFilter(), wet = AC.createGain(); dl.delayTime.value = big ? 0.13 : 0.1; fb.gain.value = big ? 0.42 : 0.3; lp.type = 'lowpass'; lp.frequency.value = 5200; wet.gain.value = 0.45;
    dl.connect(lp); lp.connect(fb); fb.connect(dl); lp.connect(wet); wet.connect(out);
    const bell = (f, t, a, dur) => { for (const [m, k, type] of [[1, 1, 'sine'], [2, 0.32, 'triangle'], [2.76, 0.16, 'sine'], [5.4, 0.06, 'sine']]) { const o = AC.createOscillator(), g = AC.createGain(); o.type = type; o.frequency.setValueAtTime(f * m, t); o.detune.setValueAtTime((Math.random() - 0.5) * 8, t);
        const d = dur / (m > 1 ? 0.6 + m * 0.4 : 1); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(a * k, t + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, t + d); o.connect(g); g.connect(out); g.connect(dl); o.start(t); o.stop(t + d + 0.05); } };
    // rising G major sparkle: G5 B5 D6 G6 B6 D7 G7, then a couple of twinkles on top
    const N = big ? [784, 988, 1175, 1568, 1976, 2349, 3136] : [1175, 1568, 1976, 2349], sp = big ? 0.065 : 0.055;
    N.forEach((f, i) => bell(f, t0 + i * sp, (big ? 0.17 : 0.12) * (1 - i * 0.04), i === N.length - 1 ? (big ? 0.9 : 0.55) : 0.4));
    const tw = t0 + N.length * sp; if (big) { [2637, 3520, 3136, 4186].forEach((f, i) => bell(f, tw + 0.05 + i * 0.07, 0.05, 0.35)); bell(1568, tw, 0.08, 1.0); bell(1976, tw, 0.06, 1.0); }
    else bell(3136, tw + 0.04, 0.035, 0.3);
    setTimeout(() => { try { fb.disconnect(); lp.disconnect(); dl.disconnect(); wet.disconnect(); } catch (_) {} }, big ? 3000 : 2000);
    window.__lastChime = performance.now(); U.chime = big ? 'big' : 'soft';
  }
  U.chimeTest = bigChime;
  const lc = levelChime; levelChime = function (vol) {
    try { if (arguments.length === 0 && typeof xpState === 'function') { const L = xpState().lvl; if (L > 0 && L % 30 === 0) return bigChime(true); if (L > 0 && L % 5 === 0) return bigChime(false); } } catch (_) {}
    U.chime = 'small'; return lc.apply(this, arguments); };
})();

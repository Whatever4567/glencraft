/* ===================== GLX-C192 (v1.0.36): the mainland river - two meandering arms that wind round the mainland, cross and rejoin (loops), varying width, sloped grassy banks, reeds, side ponds, outlets to the sea and the inner loch (new worlds only) ===================== */
(function c192() {
  const U = window.__c192 = {st: null, err: null};
  const on = () => { try { return !(window.__g89 && __g89()) && !!(current && current.g36 && current.g35 && !DIM.cur && W >= 600 && window.__c113 && __c113.G36 && __c113.G36()); } catch (_) { return false; } };
  const NATL = new Uint8Array(256);
  [T.GRASS, T.DIRT, T.STONE, T.SAND, T.GRAVEL, T.MUD, T.HEATHER, T.PEAT, T.BRGRASS, T.COALORE, T.IRONORE, T.COPPERORE, T.DEEPSLATE, T.SNOW, T.SANDSTONE, 179, 181, 185, 232, 233, 234, 142, 144, 248, 249].forEach(i => { if (i) NATL[i] = 1; });
  const tree = b => b && (LEAFY[b] || LOGGY[b]);
  function carve(seal) {
    const t0 = performance.now(); let s = ((gSeed | 0) ^ 0x51a7e) >>> 0;
    const rnd = () => { s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
    const N = W * D, cx = W >> 1, cz = (D >> 1) + 8, top = new Int16Array(N), ok = new Uint8Array(N);
    for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) { const c = x * D + z; for (let y = H - 2; y > 0; y--) { const b = world[idx(x, y, z)]; if (!b || PLANT[b] || tree(b)) continue; top[c] = y; ok[c] = NATL[b] ? 1 : 0; break; } }
    // centre lines: [x, z, half-width]
    const pts = [], ph = [rnd() * 6.28, rnd() * 6.28, rnd() * 6.28, rnd() * 6.28, rnd() * 6.28], at = (R, th) => [cx + R * Math.cos(th), cz + R * 1.06 * Math.sin(th)];
    for (let arm = 0; arm < 2; arm++) for (let i = 0, M = 1400; i < M; i++) { const th = i / M * 6.2832;
      const R = arm ? 163 - 20 * Math.sin(4 * th + ph[0] + 0.7) + 7 * Math.sin(7 * th + ph[2]) : 163 + 20 * Math.sin(4 * th + ph[0]) + 8 * Math.sin(9 * th + ph[1]);
      const w = (arm ? 1.4 : 1.8) + 2.6 * (0.5 + 0.5 * Math.sin(3 * th + ph[3] + arm * 2)) + 0.8 * Math.max(0, Math.sin(11 * th + ph[4])); pts.push([...at(R, th), w]); }
    // outlets (kept clear of the bridge lines): four to the open sea, two to the inner loch
    const deg = Math.PI / 180, outs = [[28, 150, 236], [160, 150, 236], [225, 150, 236], [315, 150, 236], [112, 108, 160], [245, 108, 160]];
    const g42 = window.__c208 && __c208.on();
    for (const [a, r0, r1i] of outs) { const r1 = g42 && r1i > 200 ? __c208.coastR(top, at, a, r0) : r1i; for (let R = r0; R <= r1; R += 0.7) { const th = (a + 4 * Math.sin(R / 9 + a)) * deg; pts.push([...at(R, th), 2 + 1.2 * Math.sin(R / 13 + a)]); } }
    // side ponds hung off the arms, plus a couple of lone ones
    const ponds = [];
    for (let k = 0; k < 8; k++) { const th = rnd() * 6.2832, side = rnd() < 0.5 ? -1 : 1, R = 163 + 20 * Math.sin(4 * th + ph[0]) + 8 * Math.sin(9 * th + ph[1]) + side * (8 + rnd() * 6), r = 4.5 + rnd() * 4.5; ponds.push([...at(R, th), r]); }
    for (let k = 0; k < 3; k++) { const th = rnd() * 6.2832; ponds.push([...at(140 + rnd() * 50, th), 4 + rnd() * 3]); }
    for (const p of ponds) pts.push(p);
    // signed distance to the water edge (negative = in the water)
    const sd = new Float32Array(N).fill(99), B = 15;
    for (const [px, pz, r] of pts) { const R = Math.ceil(r + B), X0 = Math.round(px), Z0 = Math.round(pz);
      for (let dx = -R; dx <= R; dx++) for (let dz = -R; dz <= R; dz++) { const X = X0 + dx, Z = Z0 + dz; if (X < 3 || Z < 3 || X >= W - 3 || Z >= D - 3) continue; const v = Math.hypot(X + 0.5 - px, Z + 0.5 - pz) - r, c = X * D + Z; if (v < sd[c]) sd[c] = v; } }
    const st = {water: 0, bank: 0, reeds: 0, trees: 0, skip: 0}, keep = c => { const x = (c / D) | 0, z = c - x * D; return Math.hypot(x - (W >> 1), z - (D >> 1)) < 112; };
    const nb = (x, z) => { try { return __c113.nearBridge ? __c113.nearBridge(x, z, 4) : false; } catch (_) { return false; } }, cut = [], clearUp = (X, Z, from) => { for (let y = from; y < H - 1; y++) { const k = idx(X, y, Z), b = world[k]; if (!b) { if (y > from + 3 && !world[idx(X, y + 1, Z)] && !world[idx(X, y + 2, Z)]) break; continue; } if (tree(b)) cut.push([X, y, Z]); world[k] = 0; } };
    for (let x = 3; x < W - 3; x++) for (let z = 3; z < D - 3; z++) { const c = x * D + z, v = sd[c]; if (v > B) continue; const tp = top[c]; if (tp < SEA - 1 || keep(c)) continue;
      if (nb(x, z)) { if (v > 0 || tp > SEA + 8) continue; let fine = true; for (let y = SEA - 3; y <= SEA + 3; y++) { const b = world[idx(x, y, z)]; if (b && !NATL[b] && !PLANT[b] && b !== T.WATER) { fine = false; break; } } if (!fine) { st.skip++; continue; }   // under a bridge deck: water below, deck kept
        for (let y = SEA + 1; y <= SEA + 3; y++) world[idx(x, y, z)] = 0; for (let y = SEA - 1; y <= SEA; y++) world[idx(x, y, z)] = T.WATER; world[idx(x, SEA - 2, z)] = T.GRAVEL; st.under = (st.under || 0) + 1; continue; }
      if (!ok[c]) { st.skip++; continue; }
      if (v <= 0) { const dep = v < -2.5 ? 3 : v < -1.2 ? 2 : 1, bed = SEA - dep; clearUp(x, z, SEA + 1);
        for (let y = bed + 1; y <= SEA; y++) world[idx(x, y, z)] = T.WATER; world[idx(x, bed, z)] = rnd() < 0.5 ? T.SAND : rnd() < 0.6 ? T.GRAVEL : (T.MUD || T.DIRT);
        for (let y = bed - 1; y >= Math.max(2, bed - (seal ? 8 : 4)); y--) { const k = idx(x, y, z); if (!world[k] || world[k] === T.WATER || world[k] === T.LAVA) world[k] = T.STONE; }
        top[c] = bed; st.water++; continue; }
      const hb = SEA + 1 + Math.floor(v * 0.72 + 0.6 * Math.sin(x * 0.37 + z * 0.23));
      if (tp > hb) { clearUp(x, z, hb + 1); world[idx(x, hb, z)] = v < 1.6 ? T.SAND : T.GRASS; if (world[idx(x, hb - 1, z)] === T.STONE) world[idx(x, hb - 1, z)] = T.DIRT; top[c] = hb; st.bank++; } }
    // trees the river cut into: take the rest of each one away (no floating canopies)
    const seen = new Set();
    for (const [X0, Y0, Z0] of cut) for (const [dx, dy, dz] of [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]]) { const q = [[X0 + dx, Y0 + dy, Z0 + dz]];
      while (q.length && seen.size < 60000) { const [x, y, z] = q.pop(); if (Math.abs(x - X0) > 5 || Math.abs(z - Z0) > 5 || y < 1 || y >= H - 1) continue; const k = idx(x, y, z); if (seen.has(k) || !tree(world[k])) continue; seen.add(k); world[k] = 0; st.trees++;
        q.push([x + 1, y, z], [x - 1, y, z], [x, y + 1, z], [x, y - 1, z], [x, y, z + 1], [x, y, z - 1]); } }
    // reeds along the low banks
    const RD = T.REEDS || 239;
    for (let x = 3; x < W - 3; x++) for (let z = 3; z < D - 3; z++) { const c = x * D + z, v = sd[c]; if (v <= 0 || v > 2.6 || keep(c)) continue; const tp = top[c]; if (tp < SEA || tp > SEA + 2) continue; const b = world[idx(x, tp, z)];
      if ((b === T.GRASS || b === T.SAND || b === T.DIRT) && !world[idx(x, tp + 1, z)] && rnd() < 0.42) { world[idx(x, tp + 1, z)] = RD; st.reeds++; } }
    st.ms = Math.round(performance.now() - t0); U.st = st; return st; }
  U.carve = carve;
  // survival worlds: before c134's hill rivers and c131's caves (so tributaries join it and no cave runs under it); creative: after the rest, with a deeper seal
  let done = false;
  const hook = () => { const C = window.__c134; if (!C || C.__c192) return; const r0 = C.rivers; C.rivers = function () { try { if (on()) { carve(false); done = true; } } catch (e) { U.err = String(e && e.stack || e); } return r0.apply(this, arguments); }; C.__c192 = 1; };
  hook();
  const gen = generate; generate = function () { done = false; hook(); const r = gen.apply(this, arguments); try { if (!done && on()) carve(true); } catch (e) { U.err = String(e && e.stack || e); } return r; };
})();

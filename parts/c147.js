/* ===================== GLX-C147 (v1.0.23): the pyramid island is its own island - a round sand isle with a clear sea channel all round it (solid seabed), and big ore-rich caverns under the pyramid reached by sloping cave mouths ===================== */
(function c147() {
  const U = window.__c147 = {st: null};
  const N = (x, z) => x * D + z, inW = (x, z) => x > 2 && z > 2 && x < W - 3 && z < D - 3;
  const gw = (x, y, z) => (inW(x, z) && y >= 0 && y < H) ? world[idx(x, y, z)] : 0;
  const setW = (x, y, z, v) => { if (y > 0 && y < H - 1 && inW(x, z)) world[idx(x, y, z)] = v; };
  const solid = b => b && b !== T.WATER && b !== T.LAVA && !PLANT[b] && !LEAFY[b] && b !== T.TORCH;
  const col = (x, z, h, kind) => { try { if (g9cols && g9cols.length > N(x, z) * 2 + 1) { g9cols[N(x, z) * 2] = h + 1; g9cols[N(x, z) * 2 + 1] = kind; } } catch (_) {} };
  // 1) shape: everything inside r(a) is island, the ring r(a)..r(a)+CH becomes open sea with a sand bed; caves under it are filled
  U.shape = function (cx, cz, rnd, st, r0) {
    const R0 = r0 || 60, CH = 18, p1 = rnd() * 6.28, p2 = rnd() * 6.28, rA = a => R0 * (1 + 0.07 * Math.sin(3 * a + p1) + 0.04 * Math.sin(5 * a + p2));
    const isle = new Set(), tops = new Map(), ring = []; let farm = 0;
    const span = Math.ceil(R0 * 1.12 + CH + 3);
    for (let x = cx - span; x <= cx + span; x++) for (let z = cz - span; z <= cz + span; z++) { if (!inW(x, z)) continue; const d = Math.hypot(x - cx, z - cz), r = rA(Math.atan2(z - cz, x - cx));
      if (d < r) { isle.add(N(x, z)); tops.set(N(x, z), SEA + 1);
        // nothing hollow or wet under the island (the caverns are cut fresh below)
        for (let y = SEA - 11; y > 2; y--) { const b = world[idx(x, y, z)]; if (!b || b === T.WATER || b === T.LAVA) world[idx(x, y, z)] = T.STONE; } }
      else if (d < r + CH && !(window.__g89 && __g89())) { ring.push(N(x, z));
        for (let y = H - 2; y > SEA; y--) world[idx(x, y, z)] = 0;
        for (let y = SEA; y >= SEA - 5; y--) world[idx(x, y, z)] = T.WATER;
        { const b = world[idx(x, SEA - 6, z)]; if (b !== T.WATER && !solid(b)) world[idx(x, SEA - 6, z)] = T.SAND; else if (solid(b)) world[idx(x, SEA - 6, z)] = T.SAND; }
        for (let y = SEA - 7; y >= SEA - 16; y--) { const b = world[idx(x, y, z)]; if (!b || b === T.LAVA) world[idx(x, y, z)] = T.STONE; }
        col(x, z, SEA - 6, 5); }
      else if (d < r + CH + 3) for (let y = SEA; y >= SEA - 7; y--) { const b = world[idx(x, y, z)]; if (!b || b === T.LAVA) world[idx(x, y, z)] = T.STONE; } }   // seal cave mouths facing the channel
    const inRing = (x, z) => { const d = Math.hypot(x - cx, z - cz), r = rA(Math.atan2(z - cz, x - cx)); return d < r + CH + 1; };
    try { for (const M of [entMeta, chests]) for (const k of [...M.keys()]) { const [x, y, z] = String(k).split(',').map(Number); if (inRing(x, z) && !isle.has(N(x, z))) M.delete(k); } } catch (_) {}
    try { for (const k of [...lightSrc.keys()]) { const v = lightSrc.get(k); if (v && inRing(Math.floor(v[0]), Math.floor(v[2])) && world[idx(Math.floor(v[0]), Math.floor(v[1]), Math.floor(v[2]))] !== v[3]) lightSrc.delete(k); } } catch (_) {}
    try { const fl = window.__c113 && __c113.farmsList ? __c113.farmsList() : []; for (let i = fl.length - 1; i >= 0; i--) { const f = fl[i]; if (Math.hypot(f.x0 + 3 - cx, f.z0 + 6 - cz) < R0 * 1.12 + CH + 12) { fl.splice(i, 1); farm++; } } } catch (_) {}
    try { for (const k of ring) { const x = (k / D) | 0; markDirty(x, k - x * D); } } catch (_) {}
    st.ring = ring.length; st.farmGone = farm; st.R0 = R0; st.CH = CH; U.geo = {cx, cz, R0, CH, p1, p2}; U.rA = rA;
    return {isle, tops, rA}; };
  // 2) caverns under the pyramid: a few big overlapping bubbles at y ~8-20, ore-rich walls, torches; sloping cave mouths from the sand down into them
  U.cavPts = () => U.cav && U.cav.pts;
  U.caverns = function (px, pz, B, ty, isle, rnd, st, op) { op = op || {};
    const g = U.geo; if (!g) return; const inside = (x, z, m) => Math.hypot(x - g.cx, z - g.cz) < U.rA(Math.atan2(z - g.cz, x - g.cx)) - m;
    const cy = SEA - 27, cells = new Set(), K = (x, y, z) => (x * H + y) * D + z, blobs = [[px, cy, pz, 13, 6, 12], ...(op.extra || [])];
    for (let i = 0; i < 4; i++) { const a = rnd() * 6.28, r = 9 + rnd() * 9; blobs.push([Math.round(px + Math.cos(a) * r), cy - 1 + Math.round(rnd() * 3), Math.round(pz + Math.sin(a) * r), 8 + rnd() * 5, 4 + rnd() * 2.5, 8 + rnd() * 5]); }
    const top = op.top || ty - 4;   // keep a thick roof under the tomb floor
    for (const [bx, by, bz, rx, ry, rz] of blobs) for (let x = Math.floor(bx - rx); x <= bx + rx; x++) for (let z = Math.floor(bz - rz); z <= bz + rz; z++) { if (!inside(x, z, 9)) continue;
      for (let y = Math.max(4, Math.floor(by - ry * 0.55)); y <= Math.min(top, by + ry); y++) { const q = ((x - bx) / rx) ** 2 + ((y - by) / ry) ** 2 + ((z - bz) / rz) ** 2; if (q <= 1) cells.add(K(x, y, z)); } }
    // cave mouths: three sloping 3x3 tunnels from the sand into the cavern (no straight drops)
    let mouths = 0; const MO = [];
    for (const a0 of op.at || (op.noMouth ? [] : [0.35, 2.2, 4.1])) { const a = op.at ? Math.atan2(-a0[3], -a0[2]) : a0 + rnd() * 0.5, r0 = B + 9; let x = op.at ? a0[0] : px + Math.cos(a) * r0, z = op.at ? a0[1] : pz + Math.sin(a) * r0; const sx = Math.round(x), sz = Math.round(z); if (!inside(sx, sz, 6)) continue;
      let y = SEA + 1; for (let yy = H - 2; yy > 2; yy--) if (solid(gw(sx, yy, sz))) { y = yy + 1; break; } const dx = -Math.cos(a), dz = -Math.sin(a); MO.push([sx, y, sz]); mouths++;
      for (let k = 0; k < 80 && y > cy; k++) { for (let ox = -1; ox <= 1; ox++) for (let oz = -1; oz <= 1; oz++) for (let oy = 0; oy <= 2; oy++) { const X = Math.round(x) + ox, Z = Math.round(z) + oz; if (inside(X, Z, 3)) cells.add(K(X, y + oy, Z)); }
        x += dx; z += dz; y--; } }
    const ORE = y => { const r = rnd(); if (y < 12) return r < 0.14 ? T.DIAMONDORE : r < 0.3 ? T.GOLDORE : r < 0.42 ? (T.RUBYORE || T.REDORE) : r < 0.52 ? T.REDORE : r < 0.75 ? T.IRONORE : T.COALORE; return r < 0.06 ? T.DIAMONDORE : r < 0.2 ? T.GOLDORE : r < 0.3 ? (T.RUBYORE || T.REDORE) : r < 0.6 ? T.IRONORE : r < 0.7 ? (T.COPPERORE || T.IRONORE) : T.COALORE; };
    const ORES = new Set([T.COALORE, T.IRONORE, T.GOLDORE, T.DIAMONDORE, T.REDORE, T.RUBYORE, T.COPPERORE, T.SILVERORE, T.LAZORE]); let ores = 0, torches = 0, sealed = 0;
    for (const k of cells) world[k] = 0;
    for (const k of cells) { const x = Math.floor(k / (H * D)), y = Math.floor(k / D) % H, z = k % D;
      for (const [dx, dy, dz] of [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]]) { const X = x + dx, Y = y + dy, Z = z + dz; if (cells.has(K(X, Y, Z))) continue; const b = gw(X, Y, Z);
        if (b === T.WATER || b === T.LAVA) { setW(X, Y, Z, T.STONE); sealed++; }
        else if (solid(b) && b !== T.CHEST && b !== T.SAND && !ORES.has(b) && Y < SEA - 6 && rnd() < 0.16) { setW(X, Y, Z, ORE(Y)); ores++; } }
      // a torch now and then on the floor so it's never pitch black
      if (y < cy && solid(gw(x, y - 1, z)) && !gw(x, y, z) && ((x * 31 + z * 17) % 41 === 0)) { setW(x, y, z, T.TORCH); try { lightSrc.set((x * 4096 + z) * 256 + y, [x + .5, y + .7, z + .5, T.TORCH]); } catch (_) {} torches++; } }
    for (const [x, y, z] of MO) for (let ox = -2; ox <= 2; ox++) for (let oz = -2; oz <= 2; oz++) if (Math.max(Math.abs(ox), Math.abs(oz)) === 2 && !gw(x + ox, y, z + oz) && solid(gw(x + ox, y - 1, z + oz))) setW(x + ox, y, z + oz, T.SANDSTONE);   // a low sandstone lip round each mouth
    try { for (let x = px - 40; x <= px + 40; x += 4) for (let z = pz - 40; z <= pz + 40; z += 4) markDirty(x, z); } catch (_) {}
    Object.assign(st, {cav: cells.size, ores, torches, mouths, sealed}); U.cav = {cy, mouths: MO, n: cells.size, pts: []};
    for (const k of cells) { if (U.cav.pts.length > 40) break; const x = Math.floor(k / (H * D)), y = Math.floor(k / D) % H, z = k % D; if ((x * 7 + z * 13) % 23 === 0 && solid(gw(x, y - 1, z)) && !gw(x, y, z) && !gw(x, y + 1, z)) U.cav.pts.push([x + .5, y, z + .5]); }
  };
})();

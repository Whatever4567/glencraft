/* ===================== GLX-C214 (v1.0.45): lusher new glens - more tall grass, bushy bushes, flower patches, bluebell-and-heather "lavender" meadows, round oaks, wisteria-style
   blossom trees (green crowns hung with purple blossom), and the rare pink blossom tree from v0.8.0 (the original plantBlossom shape, restored). New worlds and Reset world only:
   it is gated on the world's birth date and seeded from the world seed, so older glens and anything you placed are never touched. ===================== */
(function c214() {
  const U = window.__c214 = {runs: 0, ms: 0, n: {}, err: null};
  const BORN = 1793149200000;   // worlds born from v1.0.45 on
  const on = () => { try { return !!(current && (current.created || 0) >= BORN) && genVer === GEN9 && W > 200; } catch (_) { return false; } };
  U.on = on;
  function deco() { const t0 = performance.now(), rnd = g9rng((gSeed ^ 0x1045bead) >>> 0), n = U.n = {grass: 0, bush: 0, flowers: 0, meadow: 0, oak: 0, wisteria: 0, pink: 0};
    const A = T.AIR, GR = T.GRASS, HD = H * D, at = (x, y, z) => world[x * HD + y * D + z], set = (x, y, z, b) => { world[x * HD + y * D + z] = b; };
    const topY = (x, z) => { for (let y = Math.min(H - 2, (g9cols ? g9cols[(x * D + z) * 2] : H - 2) + 2); y > 1; y--) { const b = at(x, y, z); if (b !== A && !PLANT[b]) return y; } return -1; };
    const okGround = (x, z) => { if (x < 4 || z < 4 || x >= W - 4 || z >= D - 4) return -1; const y = topY(x, z); if (y < SEA + 1 || y > H - 20) return -1; if (at(x, y, z) !== GR) return -1; const a = at(x, y + 1, z); return a === A || a === T.TALLGRASS ? y : -1; };
    const free = (x0, y0, z0, x1, y1, z1) => { for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) for (let y = y0; y <= y1; y++) { if (x < 1 || z < 1 || x >= W - 1 || z >= D - 1 || y >= H - 1) return false; const b = at(x, y, z); if (b !== A && !PLANT[b]) return false; } return true; };
    const put = (x, y, z, b) => { if (x < 1 || z < 1 || x >= W - 1 || z >= D - 1 || y < 1 || y >= H - 1) return; const c = at(x, y, z); if (c === A || PLANT[c]) set(x, y, z, b); };
    const LN = []; try { if ((current.created || 0) >= 1793156400000) { const I = (window.__c101 && __c101.isl) || {cx: W >> 1, cz: D >> 1}; for (const c of g9castles || []) LN.push([I.cx + 0.5, I.cz + 0.5, c[1] + 0.5, c[2] + 0.5]); for (const c of g9castles || []) LN.push([W >> 1, D >> 1, c[1] + 0.5, c[2] + 0.5]); } } catch (_) {}
    // v1.0.47: no trees in a bridge / road corridor (the bridges and roads run from spawn out to each castle)
    const inLane = (x, z) => { for (const [ax, az, bx, bz] of LN) { const dx = bx - ax, dz = bz - az, L2 = dx * dx + dz * dz || 1, t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / L2)), ex = ax + dx * t - x, ez = az + dz * t - z; if (ex * ex + ez * ez < 64) return true; } return false; };
    const near = (x, z) => { if (Math.abs(x - (W >> 1)) < 12 && Math.abs(z - (D >> 1)) < 12) return true; if (inLane(x, z)) return true; try { for (const c of g9castles || []) if (Math.hypot(c[1] - x, c[2] - z) < 42) return true; } catch (_) {} return false; };
    // round oak: short trunk, a ball of leaves
    const oak = (x, y, z) => { const th = 4 + ((rnd() * 2) | 0), R = 2.6 + rnd() * 0.6; if (!free(x, y + 1, z, x, y + 2, z) || !free(x - 3, y + 3, z - 3, x + 3, y + th + 3, z + 3)) return 0; for (let k = 1; k <= th; k++) set(x, y + k, z, T.LOG); const cy = y + th + 0.5;
      for (let dx = -3; dx <= 3; dx++) for (let dy = -2; dy <= 3; dy++) for (let dz = -3; dz <= 3; dz++) { const d = Math.hypot(dx, (dy - 0.3) * 1.15, dz); if (d <= R && (d < R - 0.6 || rnd() > 0.25)) put(x + dx, Math.round(cy + dy), z + dz, T.LEAVES); } set(x, y, z, T.DIRT); return 1; };
    // wisteria-style: green crown with purple blossom hanging in curtains
    const wist = (x, y, z) => { const th = 5, R = 3.2; if (!free(x - 4, y + 2, z - 4, x + 4, y + th + 3, z + 4)) return 0; for (let k = 1; k <= th; k++) set(x, y + k, z, 191); const cy = y + th + 1;
      for (let dx = -4; dx <= 4; dx++) for (let dy = -1; dy <= 2; dy++) for (let dz = -4; dz <= 4; dz++) { const d = Math.hypot(dx, dy * 1.6, dz); if (d <= R) put(x + dx, cy + dy, z + dz, 192); }
      for (let dx = -3; dx <= 3; dx++) for (let dz = -3; dz <= 3; dz++) { const d = Math.hypot(dx, dz); if (d < 2 || d > 3.4 || rnd() < 0.35) continue; const L = 1 + ((rnd() * 3) | 0); for (let k = 1; k <= L; k++) put(x + dx, cy - 1 - k, z + dz, 192); } set(x, y, z, T.DIRT); return 1; };
    // the rare pink blossom tree, exactly the v0.8.0 shape: 4-5 logs, a round ball of blossom (radius 2.7-3.1)
    const pink = (x, y, z) => { const th = 4 + ((rnd() * 2) | 0); if (!free(x - 3, y + 1, z - 3, x + 3, y + th + 3, z + 3)) return 0; for (let k = 1; k <= th; k++) set(x, y + k, z, T.LOG);
      for (let dx = -3; dx <= 3; dx++) for (let dy = -1; dy <= 3; dy++) for (let dz = -3; dz <= 3; dz++) { const d = Math.hypot(dx, dy * 1.4, dz); if (d > 2.7 + rnd() * 0.4) continue; put(x + dx, y + th + dy, z + dz, T.BLOSSOM); } set(x, y, z, T.DIRT); U.pinkAt = U.pinkAt || []; U.pinkAt.push([x, y, z]); return 1; };
    const bush = (x, y, z) => { const r = 1 + (rnd() < 0.4 ? 1 : 0); for (let dx = -r; dx <= r; dx++) for (let dz = -r; dz <= r; dz++) for (let dy = 1; dy <= r + 1; dy++) if (Math.hypot(dx, (dy - 1) * 1.3, dz) <= r + 0.35 && rnd() > 0.15) { const gy = topY(x + dx, z + dz); if (Math.abs(gy - y) <= 1) put(x + dx, gy + dy, z + dz, T.LEAVES); } return 1; };
    const FL = [T.DANDELION, T.DAFFODIL, T.BLUEBELL, T.THISTLE];
    const flowers = (x, z, meadow) => { const kind = FL[(rnd() * 3) | 0], R = 3 + rnd() * 3; let c = 0; for (let dx = -6; dx <= 6; dx++) for (let dz = -6; dz <= 6; dz++) { const d = Math.hypot(dx, dz); if (d > R || rnd() > (meadow ? 0.7 : 0.5) * (1 - d / (R + 1))) continue;
        const y = okGround(x + dx, z + dz); if (y < 0) continue; if (meadow) { if (rnd() < 0.45) { set(x + dx, y, z + dz, T.HEATHER); set(x + dx, y + 1, z + dz, A); } else set(x + dx, y + 1, z + dz, rnd() < 0.8 ? T.BLUEBELL : T.THISTLE); } else set(x + dx, y + 1, z + dz, rnd() < 0.85 ? kind : FL[(rnd() * 4) | 0]); c++; } return c; };
    // big features on a jittered 9-block grid, flower patches on a 15-block grid
    for (let gx = 0; gx < W / 9; gx++) for (let gz = 0; gz < D / 9; gz++) { const x = gx * 9 + ((rnd() * 7) | 0) + 1, z = gz * 9 + ((rnd() * 7) | 0) + 1, r = rnd(); if (x >= W - 4 || z >= D - 4) continue;
      const kd = g9cols ? g9cols[(x * D + z) * 2 + 1] : 0; if (kd !== 0 && kd !== 1) continue; const y = okGround(x, z); if (y < 0 || near(x, z)) continue;
      if (r < 0.003) n.pink += pink(x, y, z); else if (r < 0.03) n.wisteria += wist(x, y, z); else if (r < 0.17) n.oak += oak(x, y, z); else if (r < 0.3) n.bush += bush(x, y, z); }
    for (let gx = 0; gx < W / 15; gx++) for (let gz = 0; gz < D / 15; gz++) { const x = gx * 15 + ((rnd() * 13) | 0), z = gz * 15 + ((rnd() * 13) | 0), r = rnd(); if (x >= W - 6 || z >= D - 6 || x < 6 || z < 6) continue; if (r < 0.03) n.meadow += flowers(x, z, true) ? 1 : 0; else if (r < 0.12) n.flowers += flowers(x, z, false) ? 1 : 0; }
    // more tall grass on open meadow
    for (let x = 4; x < W - 4; x++) for (let z = 4; z < D - 4; z++) { if (rnd() > 0.14) continue; const y = okGround(x, z); if (y >= 0 && at(x, y + 1, z) === A) { set(x, y + 1, z, T.TALLGRASS); n.grass++; } }
    // the pink tree is rare but there is always at least one in a new glen, somewhere on open grass away from spawn
    for (let k = 0; k < 400 && !n.pink; k++) { const x = 30 + ((rnd() * (W - 60)) | 0), z = 30 + ((rnd() * (D - 60)) | 0), y = okGround(x, z); if (y >= 0 && !near(x, z)) n.pink += pink(x, y, z); }
    U.ms = Math.round(performance.now() - t0); U.runs++; }
  const ge = generate; generate = function () { const r = ge.apply(this, arguments); try { if (on()) { U.pinkAt = []; deco(); dirtyAll = true; } } catch (e) { if (!U.err) U.err = String(e && e.stack || e); } return r; };
})();

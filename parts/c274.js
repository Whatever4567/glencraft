/* GLX-C274 (v1.0.90): caves for the Highlands map - each world seed gets its own cave network (winding worm tunnels of changing width,
   chambers, a few deep lava / water halls), walk-in cave mouths at the foot of the mountains that lead down into it, and the random
   pits and gaps in open ground are filled in so a cave is a discovery, not a hole you fall in. New / reset g89 worlds only. */
(function c274() {
  const U = window.__c274 = {err: null, ms: 0, filled: 0, worms: 0, cells: 0, mouths: [], halls: 0};
  const ERR = (w, e) => { if (!U.err) U.err = w + ' ' + String(e && e.stack || e).slice(0, 300); };
  const on = () => !!(window.__g89 && __g89());
  let NAT = null;
  const nat = b => { if (!NAT) { NAT = new Uint8Array(256); for (const v of [T.STONE, T.DEEPSLATE, T.DIRT, T.GRAVEL, T.COALORE, T.IRONORE, T.COPPERORE, T.GOLDORE, T.REDORE, T.DIAMONDORE, T.SILVERORE, T.GRASS, T.HEATHER, T.PEAT, T.MUD, T.SAND, 156, 178]) if (v !== undefined) NAT[v] = 1; } return !!NAT[b]; };
  const inB = (x, y, z) => x > 2 && z > 2 && y > 2 && x < W - 3 && z < D - 3 && y < H - 2;
  const tops = () => { const t = new Int16Array(W * D); for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) { const c = x * H * D + z; let y = H - 2; for (; y > 1; y--) { const b = world[c + y * D]; if (b && !PLANT[b] && !LEAFY[b] && !LOGGY[b]) break; } t[x * D + z] = y; } return t; };
  const inside = (x, z, m) => window.__c273 ? __c273.edgeQ(x, z) < __c273.RE() - m : true;
  // 1) fill pits: a column far below nearly all of its neighbours (not a ravine, not water) is filled back up to the ground
  function pits(tp) { let n = 0;
    for (let p = 0; p < 2; p++) for (let x = 3; x < W - 3; x++) for (let z = 3; z < D - 3; z++) { const t = tp[x * D + z]; if (!inside(x, z, 8)) continue;
      const hs = []; for (const [dx, dz] of [[2, 0], [-2, 0], [0, 2], [0, -2], [2, 2], [-2, -2], [2, -2], [-2, 2]]) hs.push(tp[(x + dx) * D + z + dz]);
      hs.sort((a, b) => a - b); const med = hs[4]; if (t >= med - 2 || hs[1] < med - 2) continue;
      const c = x * H * D + z; if (world[c + (t + 1) * D] === T.WATER || world[c + t * D] === T.WATER || med <= SEA) continue;
      let ok = true; for (let y = t + 1; y <= med; y++) { const b = world[c + y * D]; if (b && !PLANT[b]) { ok = false; break; } } if (!ok) continue;
      const g = world[c + med * D + 0] || T.GRASS;
      for (let y = t + 1; y <= med; y++) world[c + y * D] = y === med ? T.GRASS : y >= med - 3 ? T.DIRT : T.STONE; tp[x * D + z] = med; n++; if (g) {} }
    U.filled = n; }
  // 2) the seed's own cave network
  function worms(tp, rnd) { let cells = 0;
    const carve = (cx, cy, cz, r, keep) => { const R = Math.ceil(r); for (let dx = -R; dx <= R; dx++) for (let dy = -R; dy <= R; dy++) for (let dz = -R; dz <= R; dz++) { if (dx * dx + dy * dy * 1.3 + dz * dz > r * r) continue;
        const x = Math.round(cx + dx), y = Math.round(cy + dy), z = Math.round(cz + dz); if (!inB(x, y, z) || !inside(x, z, 12)) continue; if (keep && y > tp[x * D + z] - keep) continue;
        const i = idx(x, y, z), b = world[i]; if (!nat(b)) continue; world[i] = y <= 6 ? T.LAVA : 0; cells++; } };
    U.carve = carve;
    const NW = 34 + Math.floor(rnd() * 20), pts = [];
    for (let w = 0; w < NW; w++) { let x = 40 + rnd() * (W - 80), z = 40 + rnd() * (D - 80); if (!inside(x, z, 30) || Math.hypot(x - (W >> 1), z - (D >> 1)) < 60) continue;
      let y = 12 + rnd() * (SEA - 18), a = rnd() * 6.283, p = (rnd() - .5) * 0.4, r = 1.6 + rnd() * 1.4; const L = 80 + rnd() * 160, style = rnd();
      for (let s = 0; s < L; s++) { a += (rnd() - .5) * (style < 0.3 ? 0.5 : 0.22); p = Math.max(-0.5, Math.min(0.5, p + (rnd() - .5) * 0.15)); r = Math.max(1.3, Math.min(3.6, r + (rnd() - .5) * 0.35));
        x += Math.cos(a); z += Math.sin(a); y += p * 0.6; if (y < 8) p = Math.abs(p); const tt = tp[Math.round(x) * D + Math.round(z)] || 60; if (y > tt - 7) { p = -Math.abs(p) - 0.1; y = tt - 7; }
        carve(x, y, z, r, 5); if (s % 25 === 12) pts.push([x, y, z]);
        if (rnd() < 0.006) { carve(x, y + 1, z, 5 + rnd() * 4, 5); U.halls++; } } U.worms++; }
    // a few deep halls, some flooded, the deepest with lava
    for (let i = 0; i < 6; i++) { const x = 60 + rnd() * (W - 120), z = 60 + rnd() * (D - 120); if (!inside(x, z, 40)) continue; const y = 10 + rnd() * 14, r = 6 + rnd() * 4; carve(x, y, z, r, 6); carve(x + 5, y - 1, z - 4, r * 0.7, 6); U.halls++;
      const fill = i % 3 === 0 ? T.WATER : i % 3 === 1 && y < 18 ? T.LAVA : 0; if (fill) for (let dx = -r - 4; dx <= r + 4; dx++) for (let dz = -r - 4; dz <= r + 4; dz++) { const X = Math.round(x + dx), Z = Math.round(z + dz); for (let Y = Math.round(y - r); Y <= Math.round(y - r * 0.4); Y++) if (inB(X, Y, Z) && !world[idx(X, Y, Z)] && world[idx(X, Y - 1, Z)]) world[idx(X, Y, Z)] = fill; } }
    U.cells = cells; return pts; }
  // 3) walk-in cave mouths at the foot of mountains, sloping down into the network
  function mouths(tp, rnd, pts) { let n = 0, tries = 0; const want = 22 + Math.floor(rnd() * 10);
    while (n < want && tries++ < 6000) { const x = 30 + Math.floor(rnd() * (W - 60)), z = 30 + Math.floor(rnd() * (D - 60)); if (!inside(x, z, 30) || Math.hypot(x - (W >> 1), z - (D >> 1)) < 70) continue;
      const g = tp[x * D + z]; if (g <= SEA + 1 || world[idx(x, g + 1, z)] === T.WATER) continue;
      let best = -1, bd = 0; for (let k = 0; k < 8; k++) { const a = k / 8 * 6.283, X = Math.round(x + Math.cos(a) * 7), Z = Math.round(z + Math.sin(a) * 7), h = tp[X * D + Z] - g; if (h > bd) { bd = h; best = a; } }
      if (bd < 7 || U.mouths.some(m => Math.hypot(m[0] - x, m[2] - z) < 60)) continue;
      // tunnel: level into the hillside, then winding down
      let cx = x, cy = g + 2, cz = z, a = best; const C = U.carve; let target = null, td = 1e9; for (const p of pts) { const d = Math.hypot(p[0] - x, p[2] - z); if (d < td && d < 90) { td = d; target = p; } }
      for (let s = 0; s < 70; s++) { if (s > 10 && target) { const ta = Math.atan2(target[2] - cz, target[0] - cx); let da = ((ta - a + 9.42) % 6.283) - 3.14; a += Math.max(-0.12, Math.min(0.12, da)); }
        a += (rnd() - .5) * 0.2; cx += Math.cos(a); cz += Math.sin(a); if (s > 8) cy -= 0.55; C(cx, cy, cz, s < 3 ? 2.3 : 1.9, 0);
        if (target && Math.hypot(target[0] - cx, target[1] - cy, target[2] - cz) < 3) break; if (cy < 10) break; }
      // the mouth: mossy, a lantern just inside
      for (let dx = -3; dx <= 3; dx++) for (let dy = -1; dy <= 4; dy++) for (let dz = -3; dz <= 3; dz++) { const X = Math.round(x + Math.cos(best) * 2) + dx, Y = g + dy, Z = Math.round(z + Math.sin(best) * 2) + dz; if (!inB(X, Y, Z)) continue; const b = world[idx(X, Y, Z)]; if ((b === T.STONE || b === T.DIRT) && rnd() < 0.4) world[idx(X, Y, Z)] = T.MOSSYCOBBLE || T.COBBLE || b; }
      const LX = Math.round(x + Math.cos(best) * 6), LZ = Math.round(z + Math.sin(best) * 6); let LY = g + 3; while (LY > 2 && !world[idx(LX, LY - 1, LZ)]) LY--; if (!world[idx(LX, LY, LZ)]) world[idx(LX, LY, LZ)] = 161;
      U.mouths.push([x, g + 1, z, +best.toFixed(2)]); n++; } }
  const gen = generate; generate = function () { const r = gen.apply(this, arguments); try { if (on()) { const t0 = performance.now(); U.mouths = []; U.halls = 0; U.worms = 0;
        let s = ((gSeed | 0) ^ 0x2740c) >>> 0; const rnd = () => { s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
        let tp = tops(); pits(tp); const pts = worms(tp, rnd); mouths(tp, rnd, pts);
        try { tp = tops(); for (let i = 0; i < W * D; i++) g9cols[i * 2] = tp[i] + 1; } catch (_) {}
        try { dirtyAll = true; } catch (_) {} U.ms = Math.round(performance.now() - t0); } } catch (e) { ERR('gen', e); } return r; };
})();

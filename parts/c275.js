/* GLX-C275 (v1.0.90): winding paths for the Highlands map - gravel tracks that meander from the spawn meadow out to each castle, the
   pyramid desert and the volcano, curving round lochs. They keep an easy slope: where a hill or cave is in the way the path cuts
   through it (a trench, or a lit tunnel when it is deep) instead of going over it; over caves the floor is made solid. g89 worlds only. */
(function c275() {
  const U = window.__c275 = {err: null, ms: 0, paths: [], cut: 0, tun: 0, cols: 0};
  const ERR = (w, e) => { if (!U.err) U.err = w + ' ' + String(e && e.stack || e).slice(0, 300); };
  const on = () => !!(window.__g89 && __g89());
  const inB = (x, z) => x > 3 && z > 3 && x < W - 4 && z < D - 4;
  const mine = i => typeof placedSet !== 'undefined' && placedSet && placedSet.has(i);
  const soft = b => !b || PLANT[b] || LEAFY[b] || LOGGY[b];
  const gtop = (x, z) => { const c = x * H * D + z; for (let y = H - 2; y > 1; y--) { const b = world[c + y * D]; if (b && !soft(b)) return y; } return 0; };
  const OKB = new Set(); const okb = b => { if (!OKB.size) for (const v of [T.STONE, T.DEEPSLATE, T.DIRT, T.GRASS, T.HEATHER, T.PEAT, T.MUD, T.SAND, T.GRAVEL, T.COALORE, T.IRONORE, T.COPPERORE, 156, 178]) if (v !== undefined) OKB.add(v); return !b || OKB.has(b) || PLANT[b] || LEAFY[b] || LOGGY[b]; };
  // the route: a meandering line (two sine waves + noise, tapered at both ends), pushed sideways off water
  function route(ax, az, bx, bz, ph) { const L = Math.hypot(bx - ax, bz - az), N = Math.ceil(L), ux = (bx - ax) / L, uz = (bz - az) / L, nx = -uz, nz = ux, pts = [];
    const amp = Math.min(38, L * 0.09);
    for (let t = 0; t <= N; t++) { const f = t / N, tap = Math.sin(Math.PI * f), off = tap * (amp * Math.sin(f * 6.283 * 1.3 + ph) + amp * 0.45 * Math.sin(f * 6.283 * 3.1 + ph * 2.3) + 10 * g9fbm(t / 40 + ph, ph, 2) * 3.3);
      let x = ax + ux * t + nx * off, z = az + uz * t + nz * off;
      for (let k = 0, s = 1; k < 30; k++, s = -s) { const X = Math.round(x + nx * s * k), Z = Math.round(z + nz * s * k); if (!inB(X, Z)) continue; const g = gtop(X, Z); if (g >= SEA && world[idx(X, g + 1, Z)] !== T.WATER) { x += nx * s * k; z += nz * s * k; break; } }
      pts.push([x, z]); }
    // smooth the line (no kinks), then resample at ~0.5 blocks
    for (let p = 0; p < 4; p++) for (let i = 1; i < pts.length - 1; i++) { pts[i][0] = (pts[i - 1][0] + pts[i][0] * 2 + pts[i + 1][0]) / 4; pts[i][1] = (pts[i - 1][1] + pts[i][1] * 2 + pts[i + 1][1]) / 4; }
    return pts; }
  function lay(pts) { const N = pts.length, G = new Float32Array(N), S = new Float32Array(N);
    for (let i = 0; i < N; i++) G[i] = gtop(Math.round(pts[i][0]), Math.round(pts[i][1]));
    for (let i = 0; i < N; i++) { let s = 0, k = 0; for (let q = Math.max(0, i - 5); q <= Math.min(N - 1, i + 5); q++) { s += G[q]; k++; } S[i] = Math.min(s / k, G[i] + 1.5); S[i] = Math.max(S[i], SEA); }
    for (let i = 1; i < N; i++) S[i] = Math.min(S[i], S[i - 1] + 0.5); for (let i = N - 2; i >= 0; i--) S[i] = Math.min(S[i], S[i + 1] + 0.5);
    for (let i = 1; i < N; i++) S[i] = Math.max(S[i], S[i - 1] - 0.5, SEA); for (let i = N - 2; i >= 0; i--) S[i] = Math.max(S[i], S[i + 1] - 0.5, SEA);
    const done = new Set(); let lampT = 0;
    for (let i = 0; i < N; i++) { const [px, pz] = pts[i], a = i < N - 1 ? Math.atan2(pts[i + 1][1] - pz, pts[i + 1][0] - px) : 0, nx = -Math.sin(a), nz = Math.cos(a), s = Math.round(S[i]), deep = G[i] - s;
      for (let o = -1.5; o <= 1.5; o += 0.5) { const x = Math.round(px + nx * o), z = Math.round(pz + nz * o), k = x * 4096 + z; if (done.has(k) || !inB(x, z)) continue; done.add(k);
        let ok = true; for (let y = s - 2; y <= s + 4; y++) if (!okb(world[idx(x, y, z)]) && world[idx(x, y, z)] !== T.WATER) { ok = false; break; } if (!ok) continue;
        const edge = Math.abs(o) > 1.1, r = (x * 73856093 ^ z * 19349663) >>> 0;
        for (let y = s - 1; y >= s - 3; y--) { const i2 = idx(x, y, z); if (!mine(i2) && (!world[i2] || soft(world[i2]))) world[i2] = y === s - 1 ? T.COBBLE : T.STONE; }   // solid under the path (over caves)
        const fi = idx(x, s, z); if (!mine(fi)) world[fi] = edge ? (r % 3 ? T.COBBLE : T.GRAVEL) : (r % 6 ? T.GRAVEL : T.COBBLE);
        const tunnel = deep > 6.5; for (let y = s + 1; y <= s + 4; y++) { const i2 = idx(x, y, z); if (mine(i2)) continue; const b = world[i2]; if (b && b !== T.WATER) { world[i2] = 0; if (!edge || y < s + 4) U.cut++; } }
        if (tunnel) { for (let y = s + 5; y <= s + 6; y++) { const i2 = idx(x, y, z); if (!world[i2] && !mine(i2)) world[i2] = T.STONE; } U.tun++; }
        U.cols++; }
      // lamps: posts beside the path in the open, wall lanterns in tunnels
      if ((lampT += 1) >= 22) { lampT = 0; const x = Math.round(px + nx * 2.6), z = Math.round(pz + nz * 2.6); if (inB(x, z)) { if (deep > 6.5) { const i2 = idx(Math.round(px), s + 4, Math.round(pz)); if (!world[i2]) world[i2] = 161; }
          else { const g = gtop(x, z); if (Math.abs(g - s) <= 1 && !world[idx(x, g + 1, z)] && !world[idx(x, g + 2, z)] && !world[idx(x, g + 3, z)] && okb(world[idx(x, g, z)])) { world[idx(x, g + 1, z)] = 162; world[idx(x, g + 2, z)] = 162; world[idx(x, g + 3, z)] = 161; } } } } } }
  U.lay = lay; U.route = route;
  function run() { const t0 = performance.now(), cx = W >> 1, cz = D >> 1, T2 = [];
    try { for (const c of (typeof g9castles !== 'undefined' && g9castles) || []) if (c && c.length >= 3) T2.push([String(c[0]), c[1], c[2], 34]); } catch (_) {}
    try { const m = __c273.MT(); T2.push(['desert', m[0], m[1], 70]); const v = __c273.volc(); T2.push(['volcano', v[0], v[1], 36]); } catch (_) {}
    let ph = (gSeed % 1000) / 159;
    for (const [k, x, z, stop] of T2) { const L = Math.hypot(x - cx, z - cz); if (L < 80) continue; const ux = (x - cx) / L, uz = (z - cz) / L, ax = cx + ux * 26, az = cz + uz * 26, bx = x - ux * stop, bz = z - uz * stop;
      try { const p = route(ax, az, bx, bz, ph += 1.7); lay(p); U.paths.push([k, p.length]); } catch (e) { ERR('path ' + k, e); } }
    try { const tp = g9cols; for (const [k] of U.paths) {} } catch (_) {}
    U.ms = Math.round(performance.now() - t0); }
  const gen = generate; generate = function () { const r = gen.apply(this, arguments); try { if (on()) { U.paths = []; U.cut = U.tun = U.cols = 0; run(); try { dirtyAll = true; } catch (_) {} } } catch (e) { ERR('gen', e); } return r; };
})();

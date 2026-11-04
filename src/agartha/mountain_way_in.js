/* GLX-MTN (v1.1.63): AGARTHA WAY IN THROUGH A MOUNTAIN (item 37). The biggest natural hill on the map (not a volcano) gets a big tunnel
   mouth cut into its lower side. The tunnel runs into a HUGE open hall hollowed out inside the hill (about 60 blocks across, 26 high),
   lit by glowing rock, with a glowing pad in the middle that takes you down to the Agartha city. Carved once per world from the spot,
   and never touches blocks you placed. */
(function () {
  const U = window.__mtn = {err: null, M: null, sent: 0, carved: 0, ms: 0};
  const ERR = (w, e) => { if (!U.err) U.err = w + ' ' + String(e && e.stack || e).slice(0, 300); };
  const HRX = 30, HRY = 13, TW = 4, TH = 7;
  const LAMP = () => T.GLOWROCK || T.LAMP, HS = (x, y, z) => (((x * 73856093) ^ (y * 19349663) ^ (z * 83492791)) >>> 0) % 997;
  function topOf(x, z) { for (let y = H - 1; y > 0; y--) { const b = world[idx(x, y, z)]; if (b && b !== T.WATER && b !== T.LEAVES) return [y, b]; } return [0, 0]; }
  const OKT = () => new Set([T.GRASS, T.STONE, T.SNOW, T.PACKSNOW, T.DIRT, T.GRAVEL, T.COBBLE, T.MOSSY, T.ANDESITE, T.GRANITE].filter(Boolean));
  const NB = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
  const PTS = [[0, 0], [14, 0], [-14, 0], [0, 14], [0, -14], [22, 22], [-22, -22], [22, -22], [-22, 22]];
  function find() { const ok = OKT(); let best = null; const cx = W >> 1, cz = D >> 1;
    for (let x = 48; x < W - 48; x += 8) for (let z = 48; z < D - 48; z += 8) { if (Math.hypot(x - cx, z - cz) < 70) continue; let mn = 999, good = true;
      for (const [dx, dz] of PTS) { const t = topOf(x + dx, z + dz); if (!ok.has(t[1])) { good = false; break; } mn = Math.min(mn, t[0]); }
      if (good && (!best || mn > best.mn)) best = {x, z, mn}; }
    U.best = best; if (!best || best.mn < SEA + 18) return null;
    // the way out: the direction where the ground falls away fastest (and is not sea)
    let bd = null; for (let i = 0; i < 16; i++) { const a = i / 16 * 6.283, ux = Math.cos(a), uz = Math.sin(a), x = Math.round(best.x + ux * 60), z = Math.round(best.z + uz * 60);
      if (x < 2 || z < 2 || x > W - 3 || z > D - 3) continue; const t = topOf(x, z); if (t[1] === 0 || world[idx(x, t[0] + 1, z)] === T.WATER || t[0] < SEA) continue; if (!bd || t[0] < bd.g) bd = {ux, uz, g: t[0]}; }
    if (!bd) return null; best.ux = bd.ux; best.uz = bd.uz; best.HY = Math.max(8, Math.min(HRY, Math.floor((best.mn - 6 - (SEA - 14)) / 2))); best.F = Math.min(SEA + 2, best.mn - 6 - 2 * best.HY); best.g = bd.g; return best; }
  function carve(M) { const ps = typeof placedSet !== 'undefined' ? placedSet : null, cols = new Set(); let n = 0;
    const set = (x, y, z, v) => { if (v === 0) seal(x, y, z); if (x < 1 || z < 1 || x >= W - 1 || z >= D - 1 || y < 1 || y >= H - 1) return; const i = idx(x, y, z); if (ps && ps.has(i)) return; if (world[i] === v) return; if (v === 0 && !world[i]) return; world[i] = v; n++; cols.add(x + ',' + z); };
    const F = M.F, HY = M.HY || HRY, CY = F + HY - 1, seal = (x, y, z) => { for (const [a, b, c] of NB) { const X = x + a, Y = y + b, Z = z + c; if (X < 1 || Z < 1 || X >= W - 1 || Z >= D - 1 || Y < 1 || Y >= H - 1) continue; const i = idx(X, Y, Z), v = world[i]; if ((v === T.WATER || v === T.LAVA) && !(ps && ps.has(i))) { world[i] = T.STONE; n++; } } };
    for (let x = -HRX - 1; x <= HRX + 1; x++) for (let z = -HRX - 1; z <= HRX + 1; z++) { const d2 = x * x + z * z; if (d2 > (HRX + 1) ** 2) continue;
      for (let y = F; y <= CY + HY + 1; y++) { const e = d2 / (HRX * HRX) + ((y - CY) ** 2) / (HY * HY), X = M.x + x, Z = M.z + z;
        if (y >= F && y <= CY && d2 < HRX * HRX * (1 - 1 / (HY * HY))) { set(X, y, Z, 0); continue; } if (e < 1) { set(X, y, Z, 0); continue; } if (e < 1.15 && HS(X, y, Z) % 23 === 0 && world[idx(X, y, Z)]) set(X, y, Z, LAMP()); }
      if (!world[idx(M.x + x, F - 1, M.z + z)]) set(M.x + x, F - 1, M.z + z, T.STONE); if (x * x + z * z <= 4) set(M.x + x, F - 1, M.z + z, LAMP()); else if (HS(x, 0, z) % 61 === 0) set(M.x + x, F - 1, M.z + z, LAMP()); }
    // the tunnel out to the hillside, with a lamp every 8 blocks and a wide mouth
    for (let s = HRX - 4; s < HRX + 140; s++) { const cx = M.x + M.ux * s, cz = M.z + M.uz * s, f = F + Math.max(0, s - HRX) * 0.4; let open = 0;
      for (let t = -TW - 1; t <= TW + 1; t++) { const X = Math.round(cx - M.uz * t), Z = Math.round(cz + M.ux * t); if (X < 1 || Z < 1 || X >= W - 1 || Z >= D - 1) { open = 2; continue; }
        const top = topOf(X, Z)[0], fy = Math.round(f); if (top < fy + 1) open++;
        for (let h = 0; h < TH + 2; h++) { const r = Math.hypot(t / (TW + 0.5), Math.max(0, h - TH * 0.4) / (TH * 0.6)); if (r < 1) set(X, fy + h, Z, 0); } if (!world[idx(X, fy - 1, Z)]) set(X, fy - 1, Z, T.STONE);
        if (Math.abs(t) === TW && s % 8 === 0) set(X, fy + 3, Z, LAMP()); }
      if (open >= 2 * TW) { U.mouth = [Math.round(cx), Math.round(f), Math.round(cz), s]; break; } }
    for (const c of cols) { const [x, z] = c.split(',').map(Number); try { markDirty(x, z); } catch (_) {} } U.carved = n; }
  let lastW = null;
  setInterval(() => { try { if (typeof started === 'undefined' || !started || DIM.cur) return;
      if (world !== lastW) { lastW = world; const t0 = performance.now(); const K = 'glen_mtn_' + (typeof current !== 'undefined' && current ? current.id : 'x'); let m = null; try { m = JSON.parse(localStorage.getItem(K) || 'null'); } catch (_) {} if (!m) { m = find(); if (m) try { localStorage.setItem(K, JSON.stringify(m)); } catch (_) {} } U.M = m; if (m) carve(m); U.ms = Math.round(performance.now() - t0); }
      const M = U.M; if (M && !paused && !dead) { if (Math.abs(P.x - M.x - 0.5) < 1.6 && Math.abs(P.z - M.z - 0.5) < 1.6 && Math.abs(P.y - M.F) < 1.6) { U.pad = (U.pad || 0) + 1;
        if (U.pad === 5 && window.__c332 && __c332.toCity()) { U.sent++; try { toast('Down through the mountain to Agartha'); } catch (_) {} } } else U.pad = 0; } } catch (e) { ERR('tick', e); } }, 200);
})();

/* ===================== GLX-C155 (v1.0.26): bridge tidy - after all world generation, no lamp post floats off a broken bridge and no cut tree (logs / leaves) hangs over a bridge or tunnel ===================== */
(function c155() {
  const U = window.__c155 = {st: null, err: null, load: null};
  const STACK = new Set([161, 216, 160, 162, T.TORCH, T.MAGMA, T.STONEBRICK, T.MOSSYBRICK, T.BLACKSTONE || 248].filter(v => v !== undefined));
  const LITE = new Set([161, 216, T.TORCH].filter(v => v !== undefined));
  const fluid = b => b === T.WATER || b === T.LAVA;
  const firm = b => b && !fluid(b) && !LEAFY[b] && !LOGGY[b] && PLANT[b] !== 1 && b !== T.TORCH && b !== 161 && b !== 160 && b !== 162 && b !== T.COBWEB;
  const at = (x, y, z) => (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) ? 0 : world[idx(x, y, z)];
  function tidy(opt) { opt = opt || {}; const dry = !!opt.dry, st = {lamps: 0, logs: 0, leaves: 0};
    const br = (window.__c113 && __c113.bridges) || []; if (!br.length) return st;
    const placed = typeof placedSet !== 'undefined' ? placedSet : new Set(), mine = i => placed.has(i);
    const del = (x, y, z) => { const i = idx(x, y, z); if (mine(i)) return false; if (opt.log && opt.log.length < 4000) opt.log.push([x, y, z, world[i]]); if (!dry) { world[i] = T.AIR; try { entMeta.delete(keyOf(x, y, z)); } catch (_) {} try { lightSrc.delete((x * 4096 + z) * 256 + y); } catch (_) {} } return true; };
    for (const b of br) { const a = b.a; if (!a || a.length < 6) continue; const [ax, az, ux, uz, t0, t1] = a, nx = -uz, nz = ux, RW = 12, M = 7;
      const pts = [[t0 - 6, -RW], [t0 - 6, RW], [t1 - 2, -RW], [t1 - 2, RW]].map(([t, k]) => [ax + ux * t + nx * k, az + uz * t + nz * k]);
      const X0 = Math.max(1, Math.floor(Math.min(...pts.map(p => p[0]))) - M), X1 = Math.min(W - 2, Math.ceil(Math.max(...pts.map(p => p[0]))) + M);
      const Z0 = Math.max(1, Math.floor(Math.min(...pts.map(p => p[1]))) - M), Z1 = Math.min(D - 2, Math.ceil(Math.max(...pts.map(p => p[1]))) + M);
      const inC = (x, z) => { const px = x + 0.5 - ax, pz = z + 0.5 - az, t = px * ux + pz * uz; return t >= t0 - 6 && t <= t1 - 2 && Math.abs(px * nx + pz * nz) <= RW; };
      const Y0 = Math.max(1, SEA - 4), Y1 = H - 2, SX = X1 - X0 + 1, SY = Y1 - Y0 + 1, SZ = Z1 - Z0 + 1, li = (x, y, z) => ((x - X0) * SY + (y - Y0)) * SZ + (z - Z0);
      // 1) lamp posts / lanterns: walk down the post; it must stand on something firm or hang from / lean on the deck, else it goes
      for (let x = X0; x <= X1; x++) for (let z = Z0; z <= Z1; z++) { if (!inC(x, z)) continue;
        for (let y = Y0; y <= Y1; y++) { const v = at(x, y, z); if (!LITE.has(v) || mine(idx(x, y, z))) continue;
          if (v === T.TORCH) { let m = {}; try { m = entMeta.get(keyOf(x, y, z)) || {}; } catch (_) {}
            if (m.wall ? firm(at(x + m.wall[0], y, z + m.wall[1])) : m.ceil ? firm(at(x, y + 1, z)) : false) continue; }
          else if (firm(at(x, y + 1, z))) continue;   // a lantern hanging from a tunnel roof
          let yb = y; while (yb - 1 > 0 && y - yb < 5 && STACK.has(at(x, yb - 1, z)) && !LITE.has(at(x, yb - 1, z))) yb--;
          let ok = firm(at(x, yb - 1, z));
          if (!ok) for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (firm(at(x + dx, yb, z + dz))) { ok = true; break; }
          if (ok) continue;
          for (let yy = y; yy >= yb; yy--) st.lamps += del(x, yy, z) ? 1 : 0; } }
      // 2) trees: a log is held up by firm ground below it or by a held log next to it; leaves stay while they touch a held tree (or a firm block right under a bush)
      const L = new Uint8Array(SX * SY * SZ), q = []; // 1 = tree block, 2 = held
      for (let x = X0; x <= X1; x++) for (let y = Y0; y <= Y1; y++) for (let z = Z0; z <= Z1; z++) { const v = world[idx(x, y, z)]; if (LEAFY[v] || LOGGY[v]) L[li(x, y, z)] = 1; }
      const edge = (x, z) => x === X0 || x === X1 || z === Z0 || z === Z1;
      for (let x = X0; x <= X1; x++) for (let y = Y0; y <= Y1; y++) for (let z = Z0; z <= Z1; z++) { const j = li(x, y, z); if (!L[j]) continue; const v = world[idx(x, y, z)];
        if ((LOGGY[v] && (firm(at(x, y - 1, z)) || y === Y0 || [[1, 0, 0], [-1, 0, 0], [0, 0, 1], [0, 0, -1], [0, 1, 0]].some(([a1, b1, c1]) => firm(at(x + a1, y + b1, z + c1))))) || edge(x, z) || mine(idx(x, y, z))) { L[j] = 2; q.push(x, y, z, 0); } }
      for (let h = 0; h < q.length; h += 4) { const x = q[h], y = q[h + 1], z = q[h + 2], d = q[h + 3], isLog = LOGGY[world[idx(x, y, z)]];
        for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) for (let dz = -1; dz <= 1; dz++) { if (!dx && !dy && !dz) continue; const X = x + dx, Y = y + dy, Z = z + dz;
          if (X < X0 || X > X1 || Y < Y0 || Y > Y1 || Z < Z0 || Z > Z1) continue; const j = li(X, Y, Z); if (L[j] !== 1) continue; const nv = world[idx(X, Y, Z)];
          if (LOGGY[nv]) { if (!isLog && Math.abs(dx) + Math.abs(dy) + Math.abs(dz) > 1) continue; L[j] = 2; q.push(X, Y, Z, 0); }
          else { if (!isLog && Math.abs(dx) + Math.abs(dy) + Math.abs(dz) > 1) continue; L[j] = 2; q.push(X, Y, Z, 0); } } }
      for (let x = X0; x <= X1; x++) for (let z = Z0; z <= Z1; z++) { if (!inC(x, z)) continue; for (let y = Y0; y <= Y1; y++) { const j = li(x, y, z); if (L[j] !== 1) continue;
        const v = world[idx(x, y, z)]; if (LEAFY[v] && firm(at(x, y - 1, z))) continue; if (del(x, y, z)) { if (LOGGY[v]) st.logs++; else st.leaves++; } } } }
    if (!dry && (st.lamps + st.logs + st.leaves) && opt.redraw) dirtyAll = true;
    return st; }
  U.tidy = tidy;
  const gen = generate; generate = function () { const r = gen.apply(this, arguments); try { if (!DIM.cur) { const was = c37busy; c37busy = true; try { U.st = tidy(); } finally { c37busy = was; } } } catch (e) { U.err = String(e && e.stack || e); } return r; };
  // existing worlds: tidy once on load (never touches your own blocks)
  const ap = applySave; applySave = function (d) { const r = ap.apply(this, arguments); try { if (d && !d.dim && !d.c155) { U.load = tidy({redraw: 1}); } } catch (e) { U.err = String(e && e.stack || e); } return r; };
  const se = serialize; serialize = function () { const d = se.apply(this, arguments); try { if (!DIM.cur) d.c155 = 1; } catch (_) {} return d; };
})();

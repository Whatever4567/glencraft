/* ===================== GLX-C39 (v0.9.42): settle pass - nothing generated floats (lamps, posts, lanterns, plants, doors, fences, loose structure bits, castle/ruin foundations) ===================== */
(function c39() {
  const HD = H * D;
  const isFluid = b => b === T.WATER || b === T.LAVA;
  const ATT = new Uint8Array(256); [T.TORCH, T.DOOR, T.DOORTOP, T.FENCE, T.LPOST, T.LAMP, T.RAILING, 226].forEach(t => { if (t !== undefined) ATT[t] = 1; });
  for (let b = 1; b < 256; b++) if (PLANT[b] === 1) ATT[b] = 1;
  const GROUND = new Uint8Array(256); ['GRASS', 'DIRT', 'STONE', 'SAND', 'GRAVEL', 'DEEPSLATE', 'COALORE', 'IRONORE', 'COPPERORE', 'GOLDORE', 'REDORE', 'DIAMONDORE', 'SILVERORE', 'CAIRNGORMORE', 'PEAT', 'MUD', 'SNOW', 'CLAY', 'BEDROCK', 'ICE', 'OBSIDIAN', 'HEATHER', 'FARM'].forEach(n => { if (T[n] !== undefined) GROUND[T[n]] = 1; });
  window.c39Settle = function (opt) {
    opt = opt || {}; const dry = !!opt.dry, reg = opt.region || null, W0 = W, H0 = H, D0 = D, hd = H0 * D0;
    const inReg = (x, z) => !reg || reg.some(r => Math.hypot(r[0] - x, r[1] - z) < r[2]);
    const placed = typeof placedSet !== 'undefined' ? placedSet : new Set();
    const st = {clusters: 0, clusterBlocks: 0, foundations: 0, torches: 0, lamps: 0, plants: 0, doors: 0, fences: 0};
    const at = (x, y, z) => (x < 0 || z < 0 || x >= W0 || z >= D0 || y < 0 || y >= H0) ? 0 : world[(x * H0 + y) * D0 + z];
    const sol = (x, y, z) => { if (y < 0) return true; const b = at(x, y, z); return b !== 0 && !isFluid(b) && !ATT[b] && b !== T.LEAVES && b !== T.COBWEB; };
    const set = (x, y, z, v) => { if (!dry) world[(x * H0 + y) * D0 + z] = v; };
    // 1) structure components (everything solid that is not plain terrain): supported if touching terrain
    const seen = new Uint8Array(world.length), q = new Int32Array(1 << 21);
    for (let x = 0; x < W0; x++) for (let y = 1; y < H0; y++) { const b0 = (x * H0 + y) * D0; for (let z = 0; z < D0; z++) {
      const i = b0 + z, b = world[i]; if (!b || seen[i] || GROUND[b] || isFluid(b) || ATT[b]) continue;
      if (!inReg(x, z)) { seen[i] = 1; continue; }
      let h = 0, t = 0, sup = false, mine = false, minY = 1e9; const comp = []; q[t++] = i; seen[i] = 1;
      while (h < t) { const j = q[h++]; comp.push(j); const cx = (j / hd) | 0, cy = ((j % hd) / D0) | 0, cz = j % D0; if (cy < minY) minY = cy; if (placed.has(j)) mine = true;
        for (const [dx, dy, dz] of [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]]) { const nx = cx + dx, ny = cy + dy, nz = cz + dz;
          if (nx < 0 || nz < 0 || nx >= W0 || nz >= D0 || ny < 0 || ny >= H0) continue; const k = (nx * H0 + ny) * D0 + nz, nb = world[k];
          if (GROUND[nb] && (dy <= 0)) sup = true; if (ny === 0) sup = true;
          if (nb && !seen[k] && !GROUND[nb] && !isFluid(nb) && !ATT[nb] && t < q.length) { seen[k] = 1; q[t++] = k; } } }
      if (mine) continue;
      if (!sup) {
        if (comp.length <= 120) { st.clusters++; st.clusterBlocks += comp.length; if (!dry) for (const j of comp) { world[j] = 0; } }
        else { // a big structure in the air: build its foundation down to the ground
          for (const j of comp) { const cx = (j / hd) | 0, cy = ((j % hd) / D0) | 0, cz = j % D0; if (cy > minY + 1 || at(cx, cy - 1, cz)) continue;
            const fill = world[j] === T.LEAVES || world[j] === T.LOG ? 0 : (T.COBBLE); if (!fill) continue; st.foundations++;
            for (let y = cy - 1, n = 0; y > 0 && n < 48 && !sol(cx, y, cz); y--, n++) set(cx, y, cz, fill); }
        }
      } else if (comp.length > 120) {   // supported structure whose ground course hangs over dips: fill pillars down
        for (const j of comp) { const cx = (j / hd) | 0, cy = ((j % hd) / D0) | 0, cz = j % D0; const b = world[j]; if (cy > minY + 1 || b === T.LEAVES || b === T.LOG || !(b === T.STONEBRICK || b === T.COBBLE || b === T.MOSSYBRICK || b === T.PLANKS || b === T.BRICK || b === 228 || b === T.SANDSTONE)) continue;
          if (at(cx, cy - 1, cz) !== 0 && !isFluid(at(cx, cy - 1, cz))) continue; let n = 0; while (n < 12 && !sol(cx, cy - 1 - n, cz)) n++; if (n >= 12) continue;
          st.foundations++; for (let k = 1; k <= n; k++) set(cx, cy - k, cz, b === T.PLANKS ? T.COBBLE : b); }
      }
    } }
    // 2) attachables, bottom-up so a post can rest on a fixed post
    for (let y = 1; y < H0 - 1; y++) for (let x = 0; x < W0; x++) { const b0 = (x * H0 + y) * D0; for (let z = 0; z < D0; z++) {
      const i = b0 + z, b = world[i]; if (!b || !ATT[b] || placed.has(i) || !inReg(x, z)) continue;
      const below = at(x, y - 1, z), sb = sol(x, y - 1, z);
      if (b === T.TORCH) { const k = keyOf(x, y, z), m = entMeta.get(k) || {}; if (m.wall ? sol(x + m.wall[0], y, z + m.wall[1]) : m.ceil ? sol(x, y + 1, z) : sb) continue;
        st.torches++; if (dry) continue; let w = null; for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (sol(x + dx, y, z + dz)) { w = [dx, dz]; break; }
        const keep = m.lamp ? {lamp: 1} : {};
        if (w) entMeta.set(k, Object.assign({face: 0, wall: w}, keep)); else if (sb) entMeta.set(k, Object.assign({face: 0}, keep)); else if (sol(x, y + 1, z)) entMeta.set(k, Object.assign({face: 0, ceil: 1}, keep));
        else { let g = y - 1; while (g > 0 && at(x, g, z) === 0 && y - g < 8) g--; world[i] = 0; entMeta.delete(k); if (sol(x, g, z) && at(x, g + 1, z) === 0) { world[(x * H0 + g + 1) * D0 + z] = T.TORCH; if (m.lamp) entMeta.set(keyOf(x, g + 1, z), {face: 0, lamp: 1}); } }
        continue; }
      if (b === T.LPOST || b === T.LAMP) { if (sb || below === T.LPOST || below === T.LAMP || (b === T.LAMP && sol(x, y + 1, z))) continue;
        st.lamps++; if (dry) continue; let n = 0; while (n < 10 && at(x, y - 1 - n, z) === 0) n++;
        if (n < 10 && sol(x, y - 1 - n, z)) for (let k = 1; k <= n; k++) world[(x * H0 + y - k) * D0 + z] = T.LPOST; else world[i] = 0; continue; }
      if (b === T.DOOR) { if (sb) continue; st.doors++; if (!dry) { world[i] = 0; if (at(x, y + 1, z) === T.DOORTOP) world[(x * H0 + y + 1) * D0 + z] = 0; doorState.delete(keyOf(x, y, z)); } continue; }
      if (b === T.DOORTOP) { if (below === T.DOOR) continue; st.doors++; set(x, y, z, 0); continue; }
      if (b === T.FENCE || b === T.RAILING || b === 226) { if (sb || ATT[below]) continue; let side = false; for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nb = at(x + dx, y, z + dz); if (sol(x + dx, y, z + dz) || (ATT[nb] && !PLANT[nb])) side = true; } if (side) continue; st.fences++; set(x, y, z, 0); continue; }
      if (PLANT[b] === 1) { if (sb || below === T.LEAVES || (b === T.WATER)) continue; if (isFluid(below) && (b === T.LILYPAD)) continue; st.plants++; set(x, y, z, 0); continue; }
    } }
    if (!dry && typeof markDirty === 'function') dirtyAll = true;
    st.total = st.clusters + st.foundations + st.torches + st.lamps + st.plants + st.doors + st.fences;
    return st;
  };
  // run after every generation step (this wrapper is outermost)
  const ge = generate;
  generate = function () { const r = ge.apply(this, arguments); try { if (!DIM.cur) { const was = c37busy; c37busy = true; const s = c39Settle(); c37busy = was; window.__settle = s; console.log('[settle] ' + JSON.stringify(s)); } } catch (e) { console.warn('settle', e); } return r; };
  if (typeof c2Generate === 'function') { const cg = c2Generate; c2Generate = function () { const r = cg.apply(this, arguments); try { c39Settle(); } catch (e) {} return r; }; }
  // existing worlds: settle once, only around generated castles (never near your builds)
  const ap = applySave;
  applySave = function (d) { const r = ap.apply(this, arguments);
    try { if (d && !d.dim && !d.settled42 && genVer === GEN9 && typeof g9castles !== 'undefined' && g9castles.length) { const reg = g9castles.map(c => [c[1], c[2], c[0] === 'citadel' ? 44 : 36]); const s = c39Settle({region: reg}); window.__settle = s; console.log('[settle-load] ' + JSON.stringify(s)); } } catch (e) { console.warn('settle-load', e); }
    return r; };
  const se = serialize; serialize = function () { const d = se.apply(this, arguments); d.settled42 = 1; return d; };
})();

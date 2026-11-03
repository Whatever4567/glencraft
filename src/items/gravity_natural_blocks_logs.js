/* ===================== GLX-C193 (v1.0.37): gravity for natural blocks - logs, leaves and loose terrain with nothing holding them up fall; floating trees from world generation are cleared ===================== */
// Why trees floated: they are planted early in generation, then later passes (the mainland river banks, island re-shaping, park / castle clearings, tunnels) lowered the
// ground under some of them, and a few were planted on another tree's canopy. A final pass now removes every tree piece that rests on nothing.
// Gravity is cheap: it only looks at the blocks next to one you broke / blew up, with a 1500-block flood limit (a hill always hits the limit, so it never moves).
(function c193() {
  const U = window.__c193 = {q: 0, comps: 0, fell: 0, cleaned: null, err: null, ms: 0};
  const TERR = new Uint8Array(256);
  ['GRASS', 'DIRT', 'STONE', 'SAND', 'GRAVEL', 'DEEPSLATE', 'COALORE', 'IRONORE', 'COPPERORE', 'GOLDORE', 'REDORE', 'DIAMONDORE', 'SILVERORE', 'CAIRNGORMORE', 'RUBYORE', 'LAPISORE', 'PEAT', 'MUD', 'SNOW', 'CLAY', 'MOSS', 'SANDSTONE', 'RSAND', 'BRGRASS', 'PODZOL', 'COARSEDIRT']
    .forEach(n => { if (T[n] !== undefined) TERR[T[n]] = 1; });
  [77, 150, 198, 202].forEach(b => { TERR[b] = 1; });
  const isTree = b => !!(LOGGY[b] || LEAFY[b]);
  const pl = i => !!(placedSet && placedSet.has(i));
  const N6 = [[1, 0, 0], [-1, 0, 0], [0, 0, 1], [0, 0, -1], [0, -1, 0], [0, 1, 0]];
  // flood the natural piece that contains (x,y,z). opts.ign(x,y,z) = a log whose ground support is ignored (a felled 2x2 trunk)
  function comp(x, y, z, LIM, opts) { LIM = LIM || 1500; const st = [idx(x, y, z)], seen = new Set(st), mem = []; let sup = false, logs = 0, leaves = 0, terr = 0, rest = false;
    const ign = opts && opts.ign, bx = opts && opts.box, inBox = (X, Y, Z) => !bx || (Y > bx[1] && Math.abs(X - bx[0]) <= bx[3] && Math.abs(Z - bx[2]) <= bx[3]), cheap = isTree(world[st[0]]);   // from a tree: earth next to a log holds it (no flood into the hill)
    while (st.length) { const i = st.pop(), b = world[i]; if (!b || pl(i) || !(isTree(b) || TERR[b])) continue;
      const cx = Math.floor(i / (H * D)), cy = Math.floor(i / D) % H, cz = i % D; mem.push(i);
      const isLog = !!LOGGY[b], isLeaf = !isLog && !!LEAFY[b], isT = !!TERR[b]; if (isLog) logs++; else if (isLeaf) leaves++; else terr++;
      if (mem.length > LIM || cy <= 2) { sup = true; break; }
      for (let k = 0; k < 6; k++) { const d = N6[k], X = cx + d[0], Y = cy + d[1], Z = cz + d[2]; if (X < 0 || Z < 0 || X >= W || Z >= D || Y < 0 || Y >= H) continue;
        const j = idx(X, Y, Z), nb = world[j]; if (!nb) continue;
        const mov = !pl(j) && (isTree(nb) || TERR[nb]);
        const join = mov && (isLeaf ? isTree(nb) : isLog ? (cheap ? isTree(nb) : true) : (TERR[nb] || LOGGY[nb]));
        if (join && !inBox(X, Y, Z)) continue;
        if (join) { if (!seen.has(j)) { seen.add(j); st.push(j); } continue; }
        if (!solid(X, Y, Z) || (isTree(nb) && !pl(j)) || (isLeaf && TERR[nb] && k !== 4)) continue;
        if (isT) sup = true; else if (isLog && k < 5 && !(ign && k === 4 && ign(cx, cy, cz))) sup = true; else if (isLeaf && k === 4) rest = true;
        if (sup) { U.why = [cx, cy, cz, k, nb]; break; } }
      if (sup) break;
      if (!isT) for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) for (let dz = -1; dz <= 1; dz++) { if ((dx !== 0) + (dy !== 0) + (dz !== 0) < 2) continue;
        const X = cx + dx, Y = cy + dy, Z = cz + dz; if (X < 0 || Z < 0 || X >= W || Z >= D || Y < 0 || Y >= H) continue; const j = idx(X, Y, Z); if (!seen.has(j) && isTree(world[j]) && !pl(j) && inBox(X, Y, Z)) { seen.add(j); st.push(j); } } }
    if (!sup && !logs && !terr && rest) sup = true;
    if (opts && opts.nosup) sup = mem.length > LIM;
    return {sup, mem, logs, leaves, terr, seen}; }
  U.comp = comp; U.TERR = TERR;
  // take a piece out of the world (water refills below sea level), fix the column caches, return its blocks
  function lift(mem) { const out = [], cols = new Set();
    for (const i of mem) { const x = Math.floor(i / (H * D)), y = Math.floor(i / D) % H, z = i % D, b = world[i]; out.push([x, y, z, b]);
      let wet = false; if (y <= SEA) for (const d of N6) { const X = x + d[0], Y = y + d[1], Z = z + d[2]; if (X >= 0 && Z >= 0 && X < W && Z < D && Y >= 0 && Y < H && world[idx(X, Y, Z)] === T.WATER && d[1] >= 0) wet = true; }
      world[i] = wet ? T.WATER : 0; cols.add(x * 4096 + z);
      if (y + 1 < H) { const a = i + D; if (PLANT[world[a]] === 1 && !pl(a)) world[a] = 0; } }
    for (const c of cols) { const X = Math.floor(c / 4096), Z = c % 4096; markDirty(X, Z); fixCol(X, Z); }
    return out; }
  function fixCol(X, Z) { try { if (typeof g9cols !== 'undefined' && g9cols && g9cols.length === W * D * 2) { let t = 0; for (let y = H - 2; y > 0; y--) { const v = world[idx(X, y, Z)]; if (v && v !== T.WATER && !LEAFY[v] && !LOGGY[v] && PLANT[v] !== 1) { t = y; break; } }
      const ci = (X * D + Z) * 2; g9cols[ci] = t + 1; g9cols[ci + 1] = t + 1 <= SEA ? 5 : 0; } } catch (_) {} }
  U.lift = lift; U.fixCol = fixCol;
  // ---- the queue: cells that just became empty; each frame a few ms of checks ----
  const Q = []; U.queue = (x, y, z) => { if (x > 0 && z > 0 && x < W - 1 && z < D - 1 && y > 0 && y < H - 1) { Q.push(idx(x, y, z)); U.q++; } };
  function pump() { if (!Q.length || !started || DIM.cur) return; const t0 = performance.now(), done = new Set();
    while (Q.length && performance.now() - t0 < 4) { const i = Q.shift(); const x = Math.floor(i / (H * D)), y = Math.floor(i / D) % H, z = i % D;
      for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) for (let dz = -1; dz <= 1; dz++) { if (Math.abs(dx) + Math.abs(dy) + Math.abs(dz) > (dy > 0 ? 2 : 1)) continue;
        const X = x + dx, Y = y + dy, Z = z + dz; if (X < 1 || Z < 1 || X >= W - 1 || Z >= D - 1 || Y < 1 || Y >= H - 1) continue; const j = idx(X, Y, Z), b = world[j];
        if (done.has(j) || !b || pl(j) || !(isTree(b) || TERR[b])) continue;
        const c = comp(X, Y, Z); U.comps++; for (const m of c.seen) done.add(m);
        if (!c.sup && c.mem.length) { U.fell++; const blocks = lift(c.mem); try { window.__c196 && __c196.drop(blocks, c); } catch (e) { U.err = String(e); } } } }
    U.ms = Math.max(U.ms, performance.now() - t0); }
  U.pump = pump;
  try { const uf = updateFalling; updateFalling = function (dt) { const r = uf.apply(this, arguments); try { pump(); } catch (e) { U.err = String(e); } return r; }; } catch (e) { U.err = String(e); }
  try { const ba = breakAt; breakAt = function (x, y, z) { const r = ba.apply(this, arguments); try { if (!DIM.cur && !solid(x, y, z)) U.queue(x, y, z); } catch (_) {} return r; }; } catch (e) { U.err = String(e); }
  try { const ex = explode; explode = function (cx, cy, cz, r) { const res = ex.apply(this, arguments); try { if (!DIM.cur) { const R = Math.ceil((r || 3) + 1);
        for (let k = 0; k < 40; k++) { const a = Math.random() * 6.283, e = Math.acos(2 * Math.random() - 1), x = Math.floor(cx + Math.sin(e) * Math.cos(a) * R), y = Math.floor(cy + Math.cos(e) * R), z = Math.floor(cz + Math.sin(e) * Math.sin(a) * R); U.queue(x, y, z); }
        U.queue(Math.floor(cx), Math.floor(cy), Math.floor(cz)); } } catch (_) {} return res; }; } catch (e) { U.err = String(e); }
  // ---- floating-tree cleanup: after generation (new worlds) and once for older saves ----
  function cleanTrees() { const t0 = performance.now(), vis = new Uint8Array(W * H * D); let n = 0, blocks = 0;
    for (let x = 1; x < W - 1; x++) for (let z = 1; z < D - 1; z++) for (let y = SEA - 8; y < H - 1; y++) { const i = idx(x, y, z), b = world[i]; if (vis[i] || !isTree(b) || pl(i)) continue;
      const c = comp(x, y, z, 3000); for (const m of c.seen) vis[m] = 1;
      if (c.sup || c.terr) continue; n++; blocks += c.mem.length; lift(c.mem); }
    return U.cleaned = {n, blocks, ms: Math.round(performance.now() - t0)}; }
  U.cleanTrees = cleanTrees;
  let fixed = false;
  try { const ew = enterWorld; enterWorld = function (save) { const r = ew.apply(this, arguments);
      try { fixed = !!(save && save.c193 && save.c193.trees); if (!DIM.cur && !fixed && world && W * H * D === world.length) { cleanTrees(); fixed = true; } } catch (e) { U.err = 'clean ' + e; } return r; }; } catch (e) { U.err = String(e); }
  try { const se = serialize; serialize = function () { const d = se.apply(this, arguments); try { if (d && typeof d === 'object' && !DIM.cur) d.c193 = {trees: fixed ? 1 : 0}; } catch (_) {} return d; }; } catch (e) { U.err = String(e); }
})();

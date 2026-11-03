/* ===================== GLX-C180 (v1.0.34): a water pool near spawn, small lava pools and flowing streams in the caves ===================== */
// Runs once per world seed (current worlds the first time they load, new worlds and Reset world straight after making the land).
// Only natural blocks are changed and never within 4 blocks of anything you built. Streams use the river ripples (c134) so they flow.
(function c180() {
  const U = window.__c180 = {err: null, done: null, pool: null, lava: [], streams: [], S: []};
  const solidB = b => b && b !== T.WATER && b !== T.LAVA && !(PLANT[b] === 1) && !LEAFY[b] && !LOGGY[b];
  const ground = b => b === T.GRASS || b === T.HEATHER || b === T.DIRT || b === T.SAND || b === T.PEAT;
  const rock = b => b === T.STONE || b === T.DEEPSLATE || b === T.DIRT || b === T.GRAVEL || b === T.COBBLE || b === T.SAND || b === T.PEAT;
  const G = (x, y, z) => (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) ? -1 : world[idx(x, y, z)];
  const P_ = (x, y, z, v) => { if (x < 0 || z < 0 || x >= W || z >= D || y < 1 || y >= H) return; const i = idx(x, y, z); world[i] = v; try { FLV.delete(i); } catch (_) {} U.ch.add(Math.floor(x / CH) * 64 + Math.floor(z / CH)); };
  const mine = (x, y, z) => { try { return placedSet.has(idx(x, y, z)); } catch (_) { return false; } };
  const nearBuild = (x, y, z, r, up) => { if (!placedSet || !placedSet.size) return false; for (let dx = -r; dx <= r; dx++) for (let dz = -r; dz <= r; dz++) for (let dy = -r; dy <= (up || r); dy++) if (mine(x + dx, y + dy, z + dz)) return true; return false; };
  // ---------------- 1) water pool near spawn ----------------
  function pool() { const sp = (typeof g9spawn !== 'undefined' && g9spawn) || (typeof g9findSpawn === 'function' ? g9findSpawn() : null) || [Math.floor(P.x), 0, Math.floor(P.z)], R = Math.random;
    for (let tries = 0; tries < 900; tries++) { const a = R() * 6.283, dist = 9 + R() * (8 + tries / 30), x = Math.round(sp[0] + Math.cos(a) * dist), z = Math.round(sp[2] + Math.sin(a) * dist);
      if (x < 12 || z < 12 || x >= W - 12 || z >= D - 12) continue; const h = groundTop(x, z); if (h <= SEA + 1 || !ground(G(x, h, z))) continue;
      const rad = 3 + R() * 1.6, ext = Math.ceil(rad * 1.3) + 2, p1 = R() * 6.28, p2 = R() * 6.28; let bad = false; const cells = [];
      for (let dx = -ext; dx <= ext && !bad; dx++) for (let dz = -ext; dz <= ext; dz++) { const X = x + dx, Z = z + dz, d = Math.hypot(dx, dz), th = Math.atan2(dz, dx), lim = rad * (1 + 0.22 * Math.sin(2 * th + p1) + 0.12 * Math.sin(3 * th + p2));
        const t = groundTop(X, Z), b = G(X, t, Z);
        if (d <= lim) { if (t !== h || !ground(b) || G(X, h + 2, Z) !== T.AIR || mine(X, h, Z)) { bad = true; break; } cells.push([X, Z, d / lim]); }
        else if (d <= lim + 2) { if (t < h || t > h + 2 || b === T.WATER || b === T.LAVA) { bad = true; break; } } }
      if (bad || cells.length < 22 || Math.hypot(x - sp[0], z - sp[2]) < rad + 4 || nearBuild(x, h, z, ext + 3, 6)) continue;
      const set = new Set(cells.map(c => c[0] * 4096 + c[1])), dep = f => f < 0.45 ? 3 : f < 0.8 ? 2 : 1;
      for (const [X, Z, f] of cells) { const k = dep(f); for (let y = h + 1; y <= h + 3; y++) { const ab = G(X, y, Z); if (ab && (PLANT[ab] === 1 || ab === T.SNOW)) P_(X, y, Z, T.AIR); }
        for (let y = h; y > h - k; y--) P_(X, y, Z, T.WATER); P_(X, h - k, Z, R() < 0.3 ? T.GRAVEL : T.SAND); if (!solidB(G(X, h - k - 1, Z))) P_(X, h - k - 1, Z, T.STONE);
        for (const [ax, az] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = X + ax, nz = Z + az; if (set.has(nx * 4096 + nz)) continue; for (let y = h; y > h - k; y--) if (!solidB(G(nx, y, nz))) P_(nx, y, nz, T.DIRT);
          if (G(nx, h, nz) === T.GRASS && R() < 0.35) P_(nx, h, nz, T.SAND); } }
      // a deeper cell next to a shallow one needs a wall too
      for (const [X, Z, f] of cells) { const k = dep(f); for (const [ax, az] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = X + ax, nz = Z + az; if (!set.has(nx * 4096 + nz)) continue; for (let y = h - 1; y > h - k; y--) if (!solidB(G(nx, y, nz)) && G(nx, y, nz) !== T.WATER) P_(nx, y, nz, T.SAND); } }
      U.pool = [x, h, z, cells.length]; return true; }
    return false; }
  // ---------------- 2) caves: lava pools + streams ----------------
  function floorAt(x, z, y0, y1) { for (let y = y0; y >= y1; y--) { if (G(x, y, z) === T.AIR && rock(G(x, y - 1, z)) && G(x, y + 1, z) === T.AIR) return y; } return -1; }
  function caveSpot(R) { for (let t = 0; t < 40; t++) { const x = 20 + Math.floor(R() * (W - 40)), z = 20 + Math.floor(R() * (D - 40)), top = groundTop(x, z); if (top < SEA + 2 || G(x, top, z) === T.WATER) continue;
      const y = floorAt(x, z, top - 8, 6); if (y < 0) continue; let roof = false; for (let k = 2; k < 14; k++) if (solidB(G(x, y + k, z))) { roof = true; break; } if (roof) return [x, y, z]; } return null; }
  function lavaPool(x, y, z, R) { const r = 1.4 + R() * 1.4, e = Math.ceil(r) + 1, cells = [];
    for (let dx = -e; dx <= e; dx++) for (let dz = -e; dz <= e; dz++) { const X = x + dx, Z = z + dz, d = Math.hypot(dx, dz); const fl = G(X, y, Z) === T.AIR && rock(G(X, y - 1, Z));
      if (d <= r) { if (!fl || G(X, y + 1, Z) === T.WATER || mine(X, y - 1, Z)) return false; cells.push([X, Z]); } }
    if (cells.length < 5 || nearBuild(x, y, z, 5)) return false; const set = new Set(cells.map(c => c[0] * 4096 + c[1]));
    for (const [X, Z] of cells) { P_(X, y - 1, Z, T.LAVA); if (!solidB(G(X, y - 2, Z))) P_(X, y - 2, Z, T.STONE);
      for (const [ax, az] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = X + ax, nz = Z + az; if (!set.has(nx * 4096 + nz) && !solidB(G(nx, y - 1, nz))) P_(nx, y - 1, nz, T.STONE); } }
    U.lava.push([x, y, z, cells.length]); return true; }
  const code = (fx, fz) => (Math.round(Math.atan2(fz, fx) / (Math.PI / 4)) + 8) % 8;
  function stream(x, y, z, R) { const D4 = [[1, 0], [0, 1], [-1, 0], [0, -1]]; let dir = Math.floor(R() * 4), path = [[x, y, z]]; const seen = new Set([x * 4096 + z]), len = 30 + Math.floor(R() * 70);
    for (let s = 0; s < len; s++) { let ok = null; const order = R() < 0.18 ? [(dir + 1) % 4, dir, (dir + 3) % 4] : R() < 0.5 ? [dir, (dir + 1) % 4, (dir + 3) % 4] : [dir, (dir + 3) % 4, (dir + 1) % 4];
      for (const dd of order) { const nx = x + D4[dd][0], nz = z + D4[dd][1]; if (seen.has(nx * 4096 + nz) || nx < 8 || nz < 8 || nx >= W - 8 || nz >= D - 8) continue; const ny = floorAt(nx, nz, y + 1, y - 2); if (ny < 0 || mine(nx, ny - 1, nz)) continue; ok = [nx, ny, nz, dd]; break; }
      if (!ok) break; [x, y, z, dir] = ok; seen.add(x * 4096 + z); path.push([x, y, z]); }
    if (path.length < 14 || nearBuild(path[0][0], path[0][1], path[0][2], 5)) return false;
    const set = new Set(path.map(p => p[0] * 4096 + p[2]));
    path.forEach(([X, Y, Z], i) => { P_(X, Y - 1, Z, T.WATER); if (!solidB(G(X, Y - 2, Z))) P_(X, Y - 2, Z, T.STONE);
      for (const [ax, az] of D4) { const nx = X + ax, nz = Z + az; if (set.has(nx * 4096 + nz)) continue; if (!solidB(G(nx, Y - 1, nz)) && G(nx, Y - 1, nz) !== T.WATER) P_(nx, Y - 1, nz, T.STONE); }
      const n = path[Math.min(path.length - 1, i + 1)], p = path[Math.max(0, i - 1)]; U.S.push(X, Z, code(n[0] - p[0], n[2] - p[2])); });
    U.streams.push([path[0][0], path[0][1], path[0][2], path.length]); return true; }
  function caves() { let s = (gSeed ^ 0x5bd1e995) >>> 0; const R = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
    const nL = Math.max(4, Math.round(W * D / 45000)), nS = Math.max(3, Math.round(W * D / 110000)); let a = 0, b = 0;
    for (let t = 0; t < nL * 6 && a < nL; t++) { const p = caveSpot(R); if (p && !U.lava.some(q => Math.hypot(q[0] - p[0], q[2] - p[2]) < 40) && lavaPool(p[0], p[1], p[2], R)) a++; }
    for (let t = 0; t < nS * 8 && b < nS; t++) { const p = caveSpot(R); if (p && !U.lava.some(q => Math.hypot(q[0] - p[0], q[2] - p[2]) < 8) && stream(p[0], p[1], p[2], R)) b++; } }
  function riv() { try { const C = window.__c134; if (!C || !C.RIV) return; for (let i = 0; i < U.S.length; i += 3) C.RIV.set(U.S[i] * D + U.S[i + 1], U.S[i + 2]); } catch (_) {} }
  U.run = function (force) { const t0 = performance.now(); U.ch = new Set(); const d = U.done || (U.done = {});
    if (force || d.pool !== gSeed) { try { pool(); } catch (e) { U.err = 'pool ' + e; } d.pool = gSeed; }
    if (force || d.cave !== gSeed) { U.lava = []; U.streams = []; U.S = []; try { caves(); } catch (e) { U.err = 'caves ' + (e && e.stack || e); } d.cave = gSeed; riv(); }
    for (const c of U.ch) { try { dirtyCh.add(c); } catch (_) {} }
    U.ms = Math.round(performance.now() - t0); try { if (U.ch.size && typeof saveWorld === 'function') saveWorld(true); } catch (_) {} };
  const ap = applySave; applySave = function (d) { const r = ap.apply(this, arguments); try { if (d && !d.dim) { U.done = Object.assign({}, d.c180 || {}); U.S = (d.c180 && d.c180.s) || []; riv(); } } catch (_) {} return r; };
  const ew = enterWorld; enterWorld = function (save) { U.done = save ? Object.assign({}, save.c180 || {}) : {}; U.S = save && save.c180 && save.c180.s || []; const r = ew.apply(this, arguments); riv(); return r; };
  const ser = serialize; serialize = function () { const d = ser.apply(this, arguments); try { if (d && !DIM.cur && U.done) d.c180 = {pool: U.done.pool, cave: U.done.cave, s: U.S}; } catch (_) {} return d; };
  setInterval(() => { try { if (!started || DIM.cur || !U.done || typeof world === 'undefined' || !world || genVer < GEN9 || W < 400 || !gSeed) return; if (typeof cityGen !== 'undefined' && cityGen) return; if (typeof c37busy !== 'undefined' && c37busy) return;
      if (U.done.pool !== gSeed || U.done.cave !== gSeed) U.run(); } catch (e) { U.err = 'tick ' + e; } }, 900);
})();

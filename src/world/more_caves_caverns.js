/* GLX-C372 (v1.1.74, item 50): about three times as many caves. Each world gets dozens of extra big open caverns under the land,
   joined to each other by winding tunnels, and the deepest ones have long lava trenches in the floor. They are carved the same way each time the world loads,
   from the world seed, from natural rock only (never a block you placed), never under the sea, lakes or rivers, and any water or lava next to
   a new cave is sealed with stone so nothing floods. */
(function c372() {
  const U = window.__c372 = {err: null, n: 0, cells: 0};
  const ERR = (w, e) => { if (!U.err) U.err = w + ' ' + String(e && e.stack || e).slice(0, 200); };
  const NAT = () => new Set([T.STONE, T.DIRT, T.GRAVEL, T.DEEPSLATE, T.ANDESITE, T.GRANITE, T.DIORITE, T.TUFF, T.COALORE, T.IRONORE, T.COPPERORE, T.CLAY, T.WSTONE, T.MOSS].filter(Boolean));
  let lastW = null;
  function surf(x, z) { for (let y = H - 2; y > 0; y--) { const b = world[idx(x, y, z)]; if (b && !(PLANT && PLANT[b]) && !LEAFY[b]) return [y, b]; } return [0, 0]; }
  function wet(x, z, r) { for (let a = -r; a <= r; a += 4) for (let b = -r; b <= r; b += 4) { const X = x + a, Z = z + b; if (X < 0 || Z < 0 || X >= W || Z >= D) return true; const s = surf(X, Z); if (s[1] === T.WATER || s[0] < SEA + 2) return true; } return false; }
  function run() { const nat = NAT(), pl = (() => { try { return placedSet; } catch (_) { return null; } })(); let seed = 9173; for (const ch of String(current.id)) seed = (seed * 31 + ch.charCodeAt(0)) % 2147483647;
    const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647, dirty = new Set(), out = [];
    const open = (x, y, z, lava) => { if (x < 1 || z < 1 || x >= W - 1 || z >= D - 1 || y < 2 || y >= H - 2) return; const i = idx(x, y, z); if (pl && pl.has(i)) return; const b = world[i]; if (!b || !nat.has(b)) return;
      world[i] = lava ? T.LAVA : 0; U.cells++; dirty.add(Math.floor(x / CH) + ',' + Math.floor(z / CH)); };
    const seal = (x, y, z) => { for (const [a, b, c] of [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, 0, 1], [0, 0, -1]]) { const X = x + a, Y = y + b, Z = z + c; if (X < 0 || Z < 0 || X >= W || Z >= D || Y >= H) continue; const i = idx(X, Y, Z); if ((world[i] === T.WATER) && !(pl && pl.has(i))) world[i] = T.STONE; } };
    const PH = /Android|iPhone|iPad/i.test(navigator.userAgent), N = PH ? 30 : 42;
    for (let t = 0; t < 900 && out.length < N; t++) { const x = 40 + Math.floor(rnd() * (W - 80)), z = 40 + Math.floor(rnd() * (D - 80)); if (out.some(c => Math.hypot(c.x - x, c.z - z) < 50)) continue;
      const s = surf(x, z); if (s[0] < SEA + 14 || wet(x, z, 24)) continue; const rx = 9 + rnd() * 9, ry = 5 + rnd() * 4, rz = 9 + rnd() * 9, cy = Math.max(8 + ry, Math.min(s[0] - 12 - ry, 10 + rnd() * (s[0] - 30)));
      if (cy + ry > s[0] - 9) continue; out.push({x, z, cy: Math.round(cy), rx, ry, rz, lava: cy < 22 && rnd() < 0.5}); }
    for (const c of out) { for (let a = -Math.ceil(c.rx); a <= c.rx; a++) for (let b = -Math.ceil(c.rz); b <= c.rz; b++) for (let y = -Math.ceil(c.ry); y <= c.ry; y++) {
        const n = 0.82 + 0.18 * Math.sin((c.x + a) * 0.31) * Math.cos((c.z + b) * 0.27 + y * 0.4); if ((a * a) / (c.rx * c.rx) + (y * y) / (c.ry * c.ry) * (y < 0 ? 1.6 : 1) + (b * b) / (c.rz * c.rz) > n) continue;
        const X = c.x + a, Y = c.cy + y, Z = c.z + b; const lv = c.lava && y < -c.ry * 0.45 && Math.abs(b + Math.sin(a * 0.2) * 3) < 2.2; open(X, Y, Z, lv); seal(X, Y, Z); } U.n++; }
    // winding tunnels between neighbours
    for (let i = 0; i + 1 < out.length; i++) { const a = out[i]; let b = null, bd = 1e9; for (let j = i + 1; j < out.length; j++) { const d = Math.hypot(out[j].x - a.x, out[j].z - a.z); if (d < bd) { bd = d; b = out[j]; } } if (!b || bd > 170) continue;
      const st = Math.ceil(bd); for (let s = 0; s <= st; s++) { const f = s / st, x = Math.round(a.x + (b.x - a.x) * f + Math.sin(f * 9 + i) * 6), z = Math.round(a.z + (b.z - a.z) * f + Math.cos(f * 7 + i) * 6), y = Math.round(a.cy + (b.cy - a.cy) * f + Math.sin(f * 5) * 3);
        const sy = surf(x, z); if (sy[1] === T.WATER || y > sy[0] - 6) continue; for (let p = -2; p <= 2; p++) for (let q = -2; q <= 2; q++) for (let r = -1; r <= 2; r++) if (p * p + q * q + r * r < 6) { open(x + p, y + r, z + q, false); seal(x + p, y + r, z + q); } } }
    for (const k of dirty) { const [cx, cz] = k.split(',').map(Number); markDirty(cx * CH + 1, cz * CH + 1); } U.list = out.length; }
  setInterval(() => { try { if (typeof started === 'undefined' || !started || DIM.cur || typeof current === 'undefined' || !current || world === lastW) return; lastW = world;
      const t = performance.now(); run(); U.ms = Math.round(performance.now() - t); } catch (e) { ERR('run', e); } }, 1500);
})();

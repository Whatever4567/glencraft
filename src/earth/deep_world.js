/* GLX-DEEP (v1.1.84): ONE NEW DEEP WORLD. Everything under the UK, from 40 blocks below the sea down to the bottom, now comes from this
   one file. It replaces the old layer, ore, formation and hollow Earth code, which all fought each other.
   - Every layer is stacked floors of huge open caverns: about 28 blocks of air with only about 9 blocks of rock between floors,
     big rock pillars holding the roof up, stalactites and stalagmites, and holes in the floors so you can drop down.
   - No sideways ravines. No water or lava floors: only small water pools in the top layers and small lava pools lower down.
   - The rock only ever gets darker and harder as you go down: limestone, lush moss caves, deepslate, blackstone and magma,
     obsidian and geodes, the abyss, then the core. There is no stone below the obsidian.
   - The centre of the Earth (about 1000 to 1450 down) is the biggest open cave of all, with giant pillars and glowing sunstone.
     Under its floor is solid rock for ever: no void and no painted ball.
   Nothing is stored except what you change. */
(function deepWorld() {
  const U = window.__dw = {err: null, on: 0, n: 0};
  const ERR = (w, e) => { if (!U.err) U.err = w + ' ' + String(e && e.stack || e).slice(0, 240); };
  const S = Math.sin, F = Math.floor;
  const h3 = (x, y, z) => { let h = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ Math.imul(z, 2147483647); h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
  const n2 = (x, z, s) => 0.5 * S(x * 0.011 + s) * S(z * 0.013 - s * 1.3) + 0.3 * S(x * 0.031 - z * 0.027 + s * 2.1) + 0.2 * S(x * 0.077 + z * 0.069 - s);
  // bands by depth below the sea: [from, to] (the soundscape reads these)
  const B = [[40, 170, 105, 14], [170, 320, 245, 14], [320, 480, 400, 14], [480, 640, 560, 14], [640, 820, 730, 14], [820, 1000, 910, 14], [1000, 1460, 1230, 200]];
  const band = d => { for (let i = 0; i < B.length; i++) if (d < B[i][1]) return i; return B.length - 1; };
  window.__c334 = {B, band, deep: null, dw: 1};
  const TOP = 60, PV = 37, CORE = 1000, CROOF = 1010;
  let M = null; const mats = () => M || (M = {
    rock: [[T.STONE, T.WSTONE || T.STONE], [T.STONE, T.MOSSYCOBBLE || T.STONE], [T.DEEPSLATE || T.STONE, T.DSCOBBLE || T.DEEPSLATE || T.STONE], [T.BLACKSTONE || T.OBSIDIAN, T.MOONBASALT || T.BLACKSTONE || T.OBSIDIAN],
      [T.OBSIDIAN, T.HELLROCK || T.OBSIDIAN], [T.OBSIDIAN, T.BASALTCOL || 200], [T.OBSIDIAN, T.BASALTCOL || 200]],
    floor: [T.GRAVEL || T.STONE, T.MOSS || T.GRASS, T.DSTILE || T.DEEPSLATE || T.STONE, T.MAGMA || T.BLACKSTONE, T.CRYVIOLET || T.OBSIDIAN, T.GLOWROCK || T.OBSIDIAN, T.SUNSTONE || 184],
    floor2: [T.FLOW || 47, T.GLOWGRASS || T.MOSS || T.GRASS, T.ECHO || 128, T.RED || 46, T.GEODE || 190, T.CRYCYAN || T.OBSIDIAN, T.RED || 46],
    glow: [T.GLOWROCK || T.LAMP, T.CAP || 100, T.CRYCYAN || T.GLOWROCK, T.MAGMA || T.GLOWROCK, T.CRYVIOLET || T.GLOWROCK, T.GLOWROCK || T.LAMP, T.SUNSTONE || 184],
    ore: [[T.COALORE, T.IRONORE, T.COPPERORE], [T.COPPERORE, T.LAZORE, T.IRONORE], [T.SILVERORE, T.DIAMONDORE, T.REDORE], [T.GOLDORE, T.RUBYORE, T.REDORE], [T.COBALTORE, T.DIAMONDORE, T.RUBYORE], [T.DIAMONDORE, T.GOLDORE], [T.DIAMONDORE, T.GOLDORE, T.COBALTORE]].map(a => a.filter(Boolean)),
    pool: [T.WATER, T.WATER, T.WATER, T.LAVA, T.LAVA, T.LAVA, T.LAVA]});
  function rock(i, x, y, z, surf) { const m = mats(), r = h3(x, y, z);
    if (r < 0.014) { const o = m.ore[i]; if (o.length && h3(x >> 1, y >> 1, z >> 1) < 0.5) return o[F(r * 1000) % o.length]; }
    if (surf) { const q = h3(x, 7, z); return q < 0.04 ? m.glow[i] : q < 0.45 ? m.floor[i] : q < 0.7 ? m.floor2[i] : m.rock[i][0]; }
    if (r > 0.995) return m.glow[i];
    return ((x >> 3) + (y >> 2) + (z >> 3)) & 1 ? m.rock[i][0] : m.rock[i][1]; }
  // one level of the stacked caverns: k counts down from the top, h is how far into the level (0 = its roof)
  function level(x, y, z, d) { const k = F((d - TOP) / PV), h = d - TOP - k * PV, i = band(d);
    const slab = 5 + 3 * (0.5 + 0.5 * n2(x, z, k * 1.7)) | 0, fb = 2 + (3 * (0.5 + 0.5 * n2(z, x, k * 2.3 + 5)) | 0), flo = PV - fb;   // rock: roof slab plus floor bump, about 7 to 12
    const holeN = n2(x * 2.1, z * 2.1, k * 3.1 + 9), hole = holeN > 0.72;
    const wall = n2(x * 0.45, z * 0.45, k * 0.9 + 3) < -0.62;   // a few giant rock masses break the caverns into big halls
    if (wall) return rock(i, x, y, z, false);
    // pillars: one chance per 40 x 40 cell
    const cx = F(x / 40), cz = F(z / 40), ph = h3(cx, k, cz); if (ph < 0.45) { const px = cx * 40 + 8 + F(h3(cz, k, cx) * 24), pz = cz * 40 + 8 + F(h3(cx + 3, k, cz) * 24), pr = 2.5 + ph * 7;
      const dd = Math.hypot(x - px, z - pz); if (dd < pr + Math.max(0, 3 - Math.min(h, PV - h)) * 0.9) return rock(i, x, y, z, false); }
    if (h < slab) { if (hole && h >= 0) return 0; return rock(i, x, y, z, false); }
    if (h >= flo) { if (hole) return 0;
      // pools: one chance per 48 x 48 cell, never in a hole
      const qx = F(x / 48), qz = F(z / 48), qh = h3(qx, k + 11, qz); if (qh < 0.16 && h < flo + 2) { const ox = qx * 48 + 12 + F(h3(qz, k, qx + 5) * 24), oz = qz * 48 + 12 + F(h3(qx, k + 2, qz) * 24), r = 2.5 + qh * 22; if (Math.hypot(x - ox, z - oz) < r) return mats().pool[i]; }
      return rock(i, x, y, z, h < flo + 1); }
    // stalactites and stalagmites
    const s = h3(x, k + 40, z); if (s < 0.03) { const len = 1 + F(s * 230); if (h - slab < len || flo - h <= len) return rock(i, x, y, z, false); }
    return 0; }
  // the centre of the Earth: one giant cave
  function core(x, y, z, d) { const i = 6;
    if (d < CROOF + 4 * (0.5 + 0.5 * n2(x, z, 77))) return rock(i, x, y, z, false);
    const fl = 1440 - 18 * (0.5 + 0.5 * n2(x * 0.5, z * 0.5, 31)) - 10 * Math.abs(n2(x * 1.7, z * 1.7, 13));
    // giant pillars, one chance per 150 x 150 cell, flared at both ends
    const cx = F(x / 150), cz = F(z / 150), ph = h3(cx, 99, cz); if (ph < 0.5) { const px = cx * 150 + 30 + F(h3(cz, 98, cx) * 90), pz = cz * 150 + 30 + F(h3(cx, 97, cz) * 90), t = Math.min(d - CROOF, fl - d) / 60;
      const pr = 9 + ph * 26 + Math.max(0, 1 - t) * 18; if (Math.hypot(x - px, z - pz) < pr) return rock(i, x, y, z, false); }
    if (d >= fl) { if (d < fl + 2) { const qx = F(x / 64), qz = F(z / 64), qh = h3(qx, 123, qz); if (qh < 0.2) { const ox = qx * 64 + 16 + F(h3(qz, 5, qx) * 32), oz = qz * 64 + 16 + F(h3(qx, 6, qz) * 32); if (Math.hypot(x - ox, z - oz) < 4 + qh * 30) return T.LAVA; } }
      return rock(i, x, y, z, d < fl + 1); }
    // big glowing stalactites of sunstone from the roof
    const s = h3(x >> 1, 321, z >> 1); if (s < 0.02) { const len = 4 + F(s * 2000); if (d - CROOF < len) return T.SUNSTONE || T.GLOWROCK; }
    return 0; }
  function gen(x, y, z, d) { try { U.n++; if (d < TOP) return rock(0, x, y, z, false); if (d >= CORE) return core(x, y, z, d);
      if (d >= CORE - 8) return rock(5, x, y, z, false); return level(x, y, z, d); } catch (e) { ERR('gen', e); return T.STONE; } }
  U.gen = gen; window.__c334.deep = (x, y, z, d) => gen(x, y, z, d);
  // v1.1.87: the snowy island spiral is gone; the way down to Agartha is in agartha/agartha_underground.js
  function hook() { const e = window.__c320; if (!e || !e.flat || !e.fearth || e.fearth.dw) return; if (window.__c341 && !e.fearth.c347) return; const f0 = e.fearth;
    const f = function (x, y, z) { const a = y - SEA; if (a < -40) { if (window.__ukb && __ukb.out(x, z)) return 0; return gen(x, y, z, -a); }
      return f0.apply(this, arguments); };
    for (const k in f0) f[k] = f0[k]; f.c347 = f0.c347; f.top = f0.top; f.dw = 1; e.fearth = f; e.hol = null; e.pit = null; U.on++;
    try { if (window.__c324 && __c324.cache) __c324.cache.clear(); e.dirty = 1; e.edgeClr && e.edgeClr(); } catch (_) {} }
  setInterval(() => { try { hook(); } catch (er) { ERR('hook', er); } }, 300);
  // older code still asks the hollow Earth module where things are: answer for it
  const PO = {x: 432, z: -400, top: SEA + 4, lat: 90, n: [0, 1, 0]}; window.__c332 = {err: null, pole: PO, SH: () => PO, PY: () => null, inner: () => false, ig: () => 2, towers: () => [], where: () => { try { const d = SEA - P.y; return DIM.cur ? '' : d > 330 ? 'deep' : ''; } catch (_) { return ''; } }, toCity: () => { try { return !!(window.__agr && __agr.go()); } catch (_) { return false; } }};
})();

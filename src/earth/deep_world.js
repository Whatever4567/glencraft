/* GLX-DEEP (v1.1.98): ONE DEEP WORLD under the UK. Stacked open caverns from ~40 below the sea down to a bedrock floor at world Y -237.
   Layers (compressed into that range): shallow gray stone, lush giant mushrooms, deep dark slate, volcanic basalt / magma,
   purple crystal geodes, then an extra-tall hell chamber with flames. No sideways ravines. No water floors (small lava pools lower down only).
   Agartha stamp (-50..-2) and the surface stay owned by their own hooks. Player edits overlay generation and are never wiped here. */
(function deepWorld() {
  const U = window.__dw = {err: null, on: 0, n: 0, floorY: -237, ver: '1.1.98'};
  const ERR = (w, e) => { if (!U.err) U.err = w + ' ' + String(e && e.stack || e).slice(0, 240); };
  const S = Math.sin, F = Math.floor;
  const h3 = (x, y, z) => { let h = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ Math.imul(z, 2147483647); h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
  const n2 = (x, z, s) => 0.5 * S(x * 0.011 + s) * S(z * 0.013 - s * 1.3) + 0.3 * S(x * 0.031 - z * 0.027 + s * 2.1) + 0.2 * S(x * 0.077 + z * 0.069 - s);
  const FLOOR = U.floorY; // world Y bedrock floor
  // bands by depth below the sea: [from, to, mid, half] — fitted so the deepest air sits just above Y -237
  // 0 shallow gray, 1 lush, 2 deep dark, 3 volcanic, 4 purple crystals, 5 hell (tall)
  const B = [[40, 78, 59, 12], [78, 120, 99, 14], [120, 160, 140, 14], [160, 200, 180, 14], [200, 228, 214, 12], [228, 290, 255, 28]];
  const band = d => { for (let i = 0; i < B.length; i++) if (d < B[i][1]) return i; return B.length - 1; };
  window.__c334 = {B, band, deep: null, dw: 1, floorY: FLOOR};
  const TOP = 40;
  // Per-level height: hell (i=5) is taller so the eye has room
  const PV_OF = i => (i === 5 ? 52 : 36);
  let M = null; const mats = () => M || (M = {
    rock: [[T.STONE, T.WSTONE || T.STONE], [T.STONE, T.MOSSYCOBBLE || T.STONE], [T.DEEPSLATE || T.STONE, T.DSCOBBLE || T.DEEPSLATE || T.STONE],
      [T.BLACKSTONE || T.OBSIDIAN, T.MOONBASALT || T.BLACKSTONE || T.OBSIDIAN], [T.OBSIDIAN, T.BASALTCOL || 200],
      [T.HELLROCK || T.OBSIDIAN, T.BLACKSTONE || T.OBSIDIAN]],
    floor: [T.GRAVEL || T.STONE, T.MOSS || T.GRASS, T.DSTILE || T.DEEPSLATE || T.STONE, T.MAGMA || T.BLACKSTONE, T.CRYVIOLET || T.GEODE || 190, T.RED || 46],
    floor2: [T.FLOW || 47, T.GLOWGRASS || T.MOSS || T.GRASS, T.ECHO || 128, T.RED || 46, T.GEODE || 190, T.MAGMA || T.RED || 46],
    glow: [T.GLOWROCK || T.LAMP, T.CAP || 100, T.CRYCYAN || T.GLOWROCK, T.MAGMA || T.GLOWROCK, T.CRYVIOLET || T.GLOWROCK, T.RED || 46],
    ore: [[T.COALORE, T.IRONORE, T.COPPERORE], [T.COPPERORE, T.LAZORE, T.IRONORE], [T.SILVERORE, T.DIAMONDORE, T.REDORE],
      [T.GOLDORE, T.RUBYORE, T.REDORE], [T.COBALTORE, T.DIAMONDORE, T.RUBYORE], [T.DIAMONDORE, T.GOLDORE]].map(a => a.filter(Boolean)),
    pool: [0, 0, 0, T.LAVA, 0, T.LAVA]});
  function rock(i, x, y, z, surf) { const m = mats(), r = h3(x, y, z);
    if (r < 0.014) { const o = m.ore[i]; if (o && o.length && h3(x >> 1, y >> 1, z >> 1) < 0.5) return o[F(r * 1000) % o.length]; }
    if (surf) { const q = h3(x, 7, z); return q < 0.04 ? m.glow[i] : q < 0.45 ? m.floor[i] : q < 0.7 ? m.floor2[i] : m.rock[i][0]; }
    if (r > 0.995) return m.glow[i];
    return ((x >> 3) + (y >> 2) + (z >> 3)) & 1 ? m.rock[i][0] : m.rock[i][1]; }
  // lush: occasional giant mushroom stem / cap columns in open air
  function lushProp(x, y, z, h, slab, flo, i) {
    if (i !== 1) return null;
    const cx = F(x / 28), cz = F(z / 28), ph = h3(cx, 44, cz);
    if (ph > 0.22) return null;
    const px = cx * 28 + 6 + F(h3(cz, 45, cx) * 16), pz = cz * 28 + 6 + F(h3(cx, 46, cz) * 16);
    const dd = Math.hypot(x - px, z - pz);
    const stemH = 8 + F(ph * 40); const capR = 3 + ph * 5;
    if (dd < 1.2 && h >= slab && h < slab + stemH) return T.MUSHSTEM || T.LOG || T.PLANKS;
    if (h >= slab + stemH - 1 && h <= slab + stemH + 1 && dd < capR) return T.CAP || 100;
    return null;
  }
  function level(x, y, z, d) {
    // Map depth into a layer index and height within that layer using variable PV
    let rem = d - TOP, i = 0, pv = PV_OF(0);
    while (i < 5 && rem >= pv) { rem -= pv; i++; pv = PV_OF(i); }
    if (i > 5) i = 5;
    const h = rem, PV = pv;
    const slab = 4 + 3 * (0.5 + 0.5 * n2(x, z, i * 1.7)) | 0, fb = 2 + (3 * (0.5 + 0.5 * n2(z, x, i * 2.3 + 5)) | 0), flo = PV - fb;
    const holeN = n2(x * 2.1, z * 2.1, i * 3.1 + 9), hole = holeN > 0.72;
    const wall = n2(x * 0.45, z * 0.45, i * 0.9 + 3) < -0.62;
    if (wall) return rock(i, x, y, z, false);
    const cx = F(x / 40), cz = F(z / 40), ph = h3(cx, i, cz);
    if (ph < 0.45) { const px = cx * 40 + 8 + F(h3(cz, i, cx) * 24), pz = cz * 40 + 8 + F(h3(cx + 3, i, cz) * 24), pr = 2.5 + ph * 7;
      const dd = Math.hypot(x - px, z - pz); if (dd < pr + Math.max(0, 3 - Math.min(h, PV - h)) * 0.9) return rock(i, x, y, z, false); }
    if (h < slab) { if (hole && h >= 0) return 0; return rock(i, x, y, z, false); }
    if (h >= flo) {
      if (hole) return 0;
      const qx = F(x / 48), qz = F(z / 48), qh = h3(qx, i + 11, qz);
      if (qh < 0.16 && h < flo + 2) {
        const ox = qx * 48 + 12 + F(h3(qz, i, qx + 5) * 24), oz = qz * 48 + 12 + F(h3(qx, i + 2, qz) * 24), r = 2.5 + qh * 22;
        if (Math.hypot(x - ox, z - oz) < r && mats().pool[i]) return mats().pool[i];
      }
      // hell floor: more red-hot rock / magma for flames
      if (i === 5 && h < flo + 1) { const q = h3(x, 9, z); if (q < 0.35) return T.RED || 46; if (q < 0.55) return T.MAGMA || T.BLACKSTONE; }
      return rock(i, x, y, z, h < flo + 1);
    }
    const lp = lushProp(x, y, z, h, slab, flo, i); if (lp != null) return lp;
    // purple crystal spikes in layer 4 open air near floor/roof
    if (i === 4) { const s = h3(x, 77, z); if (s < 0.04) { const len = 2 + F(s * 180); if (h - slab < len || flo - h <= len) return T.CRYVIOLET || T.GEODE || 190; } }
    const s = h3(x, i + 40, z); if (s < 0.03) { const len = 1 + F(s * 230); if (h - slab < len || flo - h <= len) return rock(i, x, y, z, false); }
    return 0;
  }
  function gen(x, y, z, d) {
    try {
      U.n++;
      // Bedrock natural floor at world Y <= -237 (edits still overlay via the streamer)
      if (y <= FLOOR) return T.BEDROCK || T.HBEDROCK || 211;
      if (d < TOP) return rock(0, x, y, z, false);
      // Never generate past the floor: clamp depth so hell sits above bedrock
      const sea = (typeof SEA === 'number' ? SEA : 41);
      const maxD = sea - FLOOR - 1; // depth of first air/rock above bedrock
      if (d > maxD) return T.BEDROCK || T.HBEDROCK || 211;
      return level(x, y, z, d);
    } catch (e) { ERR('gen', e); return T.STONE; }
  }
  U.gen = gen; window.__c334.deep = (x, y, z, d) => gen(x, y, z, d);
  function hook() {
    const e = window.__c320; if (!e || !e.flat || !e.fearth || e.fearth.dw) return;
    if (window.__c341 && !e.fearth.c347) return;
    const f0 = e.fearth;
    const f = function (x, y, z) {
      if (y <= FLOOR) { if (window.__ukb && __ukb.out(x, z)) return 0; return T.BEDROCK || T.HBEDROCK || 211; }
      const a = y - SEA;
      if (a < -40) { if (window.__ukb && __ukb.out(x, z)) return 0; return gen(x, y, z, -a); }
      return f0.apply(this, arguments);
    };
    for (const k in f0) f[k] = f0[k]; f.c347 = f0.c347; f.top = f0.top; f.dw = 1; f.floorY = FLOOR; e.fearth = f; e.hol = null; e.pit = null; U.on++;
    try { if (window.__c324 && __c324.cache) __c324.cache.clear(); e.dirty = 1; e.edgeClr && e.edgeClr(); } catch (_) {}
  }
  setInterval(() => { try { hook(); } catch (er) { ERR('hook', er); } }, 300);
  // Soft-lock bedrock against mining (natural floor only; still a real block id for saves)
  try {
    const BR = () => T.BEDROCK || T.HBEDROCK || 211;
    const boot = setInterval(() => {
      try {
        const id = BR(); if (!id || typeof HARD === 'undefined') return;
        HARD[id] = 600; MC_HARD[id] = 600; REQ[id] = 99; try { NEEDS_PICK.add(id); } catch (_) {}
        if (!NAMES[id]) NAMES[id] = 'Bedrock';
        clearInterval(boot);
      } catch (_) {}
    }, 400);
  } catch (_) {}
  const PO = {x: 432, z: -400, top: SEA + 4, lat: 90, n: [0, 1, 0]};
  window.__c332 = {err: null, pole: PO, SH: () => PO, PY: () => null, inner: () => false, ig: () => 2, towers: () => [],
    where: () => { try { const d = SEA - P.y; return DIM.cur ? '' : d > 180 ? 'deep' : ''; } catch (_) { return ''; } },
    toCity: () => { try { return !!(window.__agr && __agr.go()); } catch (_) { return false; } }};
})();

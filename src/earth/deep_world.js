/* GLX-DEEP (v1.1.98d): ONE DEEP WORLD under the UK down to a natural bedrock floor at world Y -237.
   Layers: shallow gray (stalactites), lush giant mushrooms, deep dark, volcanic basalt/lava pillars, purple crystals,
   then an EXTRA-TALL hell chamber with a roomy carved landmark for the giant eye. Agartha stamp Y -50..-2 untouched.
   Natural bedrock only. Columns that already have player edits below the floor are grandfathered so those builds stay
   reachable (air shaft / no sealing bedrock); edits still win via getB. No world wipe. */
(function deepWorld() {
  const U = window.__dw = {err: null, on: 0, n: 0, floorY: -237, ver: '1.1.98d'};
  const ERR = (w, e) => { if (!U.err) U.err = w + ' ' + String(e && e.stack || e).slice(0, 240); };
  const S = Math.sin, F = Math.floor;
  const h3 = (x, y, z) => { let h = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ Math.imul(z, 2147483647); h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
  const n2 = (x, z, s) => 0.5 * S(x * 0.011 + s) * S(z * 0.013 - s * 1.3) + 0.3 * S(x * 0.031 - z * 0.027 + s * 2.1) + 0.2 * S(x * 0.077 + z * 0.069 - s);
  const FLOOR = U.floorY;
  // Landmark hell chamber centre (Scotland mainland, well below Agartha Y range)
  const HX = U.hellX = 432, HZ = U.hellZ = 180, HR = U.hellR = 48;
  // bands by depth below sea (fitted above Y -237). Hell band is the tallest.
  const B = [[40, 72, 56, 12], [72, 110, 91, 14], [110, 148, 129, 14], [148, 186, 167, 14], [186, 214, 200, 12], [214, 290, 250, 36]];
  const band = d => { for (let i = 0; i < B.length; i++) if (d < B[i][1]) return i; return B.length - 1; };
  window.__c334 = {B, band, deep: null, dw: 1, floorY: FLOOR, hellX: HX, hellZ: HZ, hellR: HR};
  const TOP = 40;
  // Hell layer ~70 tall for the giant eye clearance; others ~32-36
  const PV_OF = i => (i === 5 ? 70 : 34);
  // Grandfather columns from saved edits below the natural floor (includes air/removal edits).
  // Per-column min edit Y + clearance; seal only below that. No fixed absolute seal. No per-frame full scan.
  const CLEAR = 12; // air/open clearance below deepest edit in a column
  const DROP_MARGIN = 48; // drops may fall a bit below the open shaft
  const legacy = U.legacy = new Set();
  const colMin = U.colMin = new Map(); // colKey -> min Y of any edit (incl. air)
  const colKey = (x, z) => (x | 0) + ',' + (z | 0);
  function refreshBounds() {
    let mn = FLOOR;
    for (const y of colMin.values()) if (y < mn) mn = y;
    U.minLegacyY = colMin.size ? mn : null;
    // Natural floor stays -237; open legacy shafts seal at minY-CLEAR; drops cull below that - margin
    U.sealFloorY = colMin.size ? (mn - CLEAR) : FLOOR;
    U.dropFloorY = (colMin.size ? (mn - CLEAR - DROP_MARGIN) : FLOOR) - 8;
    try { window.__c334.dropFloorY = U.dropFloorY; window.__c334.sealFloorY = U.sealFloorY; window.__c334.minLegacyY = U.minLegacyY; } catch (_) {}
  }
  function noteLegacy(x, y, z) {
    if (!(y < FLOOR)) return;
    const ck = colKey(x, z);
    legacy.add(ck);
    const prev = colMin.has(ck) ? colMin.get(ck) : Infinity;
    if (y < prev) colMin.set(ck, y);
    refreshBounds();
  }
  function rebuildLegacy() {
    try {
      legacy.clear(); colMin.clear();
      const e = window.__c320; if (!e || !e.edits) { refreshBounds(); return; }
      for (const [k, v] of e.edits) { // v may be 0 (air/removal) — still preserves access
        const p = k.split(','); const y = +p[1];
        if (y < FLOOR) { const ck = p[0] + ',' + p[2]; legacy.add(ck); const prev = colMin.has(ck) ? colMin.get(ck) : Infinity; if (y < prev) colMin.set(ck, y); }
      }
      U.legacyN = legacy.size; refreshBounds();
    } catch (e) { ERR('legacy', e); }
  }
  U.rebuildLegacy = rebuildLegacy; U.noteLegacy = noteLegacy;
  // Incremental update on place/break — avoid rescanning all edits every setB
  try {
    const s0 = setB;
    setB = function (x, y, z, v) {
      const r = s0.apply(this, arguments);
      try { const yi = Math.floor(y); if (yi < FLOOR) noteLegacy(Math.floor(x), yi, Math.floor(z)); } catch (_) {}
      return r;
    };
  } catch (_) {}
  setInterval(() => { try { const e = window.__c320; if (!e) return; if (e._dwLeg !== e.edits.size) { e._dwLeg = e.edits.size; rebuildLegacy(); } } catch (_) {} }, 2000);
  function legacyOpen(x, y, z) {
    const ck = colKey(x, z); if (!legacy.has(ck)) return false;
    const minY = colMin.get(ck); if (minY == null) return false;
    return y >= minY - CLEAR; // open from clearance below deepest edit up through the floor
  }
  function legacySealAt(x, z) {
    const ck = colKey(x, z); if (!legacy.has(ck)) return FLOOR;
    const minY = colMin.get(ck); return (minY == null ? FLOOR : minY - CLEAR);
  }
  U.legacyOpen = legacyOpen; U.legacySealAt = legacySealAt;

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
  function lushProp(x, y, z, h, slab, flo, i) {
    if (i !== 1) return null;
    const cx = F(x / 26), cz = F(z / 26), ph = h3(cx, 44, cz);
    if (ph > 0.28) return null;
    const px = cx * 26 + 5 + F(h3(cz, 45, cx) * 14), pz = cz * 26 + 5 + F(h3(cx, 46, cz) * 14);
    const dd = Math.hypot(x - px, z - pz);
    const stemH = 10 + F(ph * 50); const capR = 4 + ph * 6;
    if (dd < 1.35 && h >= slab && h < slab + stemH) return T.MUSHSTEM || T.LOG || T.PLANKS;
    if (h >= slab + stemH - 1 && h <= slab + stemH + 2 && dd < capR) return T.CAP || 100;
    // hanging vines
    if (dd < capR + 1 && h > slab + 2 && h < slab + stemH && h3(x, y, z) < 0.08) return T.VINE || T.LEAVES || 0;
    return null;
  }
  // Absolute hell chamber carve (extra-tall open dome around landmark)
  function hellLandmark(x, y, z, d) {
    const dx = x - HX, dz = z - HZ, rr = Math.hypot(dx, dz);
    if (rr > HR + 8) return null;
    const sea = (typeof SEA === 'number' ? SEA : 41);
    const roofY = FLOOR + 62, floorY = FLOOR + 1;
    if (y > roofY || y < floorY) return null;
    // Domed hall: taller in the centre
    const dome = roofY - (rr * rr) / (HR * 1.6);
    if (y > dome) return rock(5, x, y, z, false);
    // Ring of basalt / hellrock pillars
    const ang = Math.atan2(dz, dx), spoke = Math.abs(((ang / (Math.PI / 6)) % 1) - 0.5);
    if (rr > HR - 6 && rr < HR - 2 && spoke < 0.12) return T.BASALTCOL || T.BLACKSTONE || T.OBSIDIAN;
    // Flame rivers on the floor
    if (y <= floorY + 1) {
      const river = Math.abs(S(ang * 3) * 10 + n2(x, z, 9) * 4);
      if (river < 3.5 || rr < 8) return (h3(x, 3, z) < 0.45 ? (T.LAVA || T.MAGMA) : (T.RED || 46));
      return rock(5, x, y, z, true);
    }
    // Open air for the eye
    if (y < dome - 1) return 0;
    return rock(5, x, y, z, false);
  }
  function level(x, y, z, d) {
    let rem = d - TOP, i = 0, pv = PV_OF(0);
    while (i < 5 && rem >= pv) { rem -= pv; i++; pv = PV_OF(i); }
    if (i > 5) i = 5;
    // Hell landmark overrides local stacked carve when inside the hall
    if (i === 5) { const hl = hellLandmark(x, y, z, d); if (hl !== null) return hl; }
    const h = rem, PV = pv;
    const slab = 4 + 3 * (0.5 + 0.5 * n2(x, z, i * 1.7)) | 0, fb = 2 + (3 * (0.5 + 0.5 * n2(z, x, i * 2.3 + 5)) | 0), flo = PV - fb;
    const holeN = n2(x * 2.1, z * 2.1, i * 3.1 + 9), hole = holeN > 0.72;
    const wall = n2(x * 0.45, z * 0.45, i * 0.9 + 3) < -0.62;
    if (wall) return rock(i, x, y, z, false);
    const cx = F(x / 40), cz = F(z / 40), ph = h3(cx, i, cz);
    if (ph < 0.45) { const px = cx * 40 + 8 + F(h3(cz, i, cx) * 24), pz = cz * 40 + 8 + F(h3(cx + 3, i, cz) * 24), pr = 2.5 + ph * 7;
      const dd = Math.hypot(x - px, z - pz); if (dd < pr + Math.max(0, 3 - Math.min(h, PV - h)) * 0.9) return rock(i, x, y, z, false); }
    // Volcanic layer: thicker basalt pillars
    if (i === 3 && ph < 0.55) { const px = cx * 40 + 10 + F(h3(cz, 3, cx) * 20), pz = cz * 40 + 10 + F(h3(cx, 4, cz) * 20);
      if (Math.hypot(x - px, z - pz) < 3 + ph * 4) return T.BASALTCOL || T.BLACKSTONE || rock(i, x, y, z, false); }
    if (h < slab) { if (hole && h >= 0) return 0; return rock(i, x, y, z, false); }
    if (h >= flo) {
      if (hole) return 0;
      const qx = F(x / 48), qz = F(z / 48), qh = h3(qx, i + 11, qz);
      if (qh < 0.16 && h < flo + 2) {
        const ox = qx * 48 + 12 + F(h3(qz, i, qx + 5) * 24), oz = qz * 48 + 12 + F(h3(qx, i + 2, qz) * 24), r = 2.5 + qh * 22;
        if (Math.hypot(x - ox, z - oz) < r && mats().pool[i]) return mats().pool[i];
      }
      if (i === 5 && h < flo + 1) { const q = h3(x, 9, z); if (q < 0.35) return T.RED || 46; if (q < 0.55) return T.MAGMA || T.BLACKSTONE; }
      return rock(i, x, y, z, h < flo + 1);
    }
    const lp = lushProp(x, y, z, h, slab, flo, i); if (lp != null) return lp;
    if (i === 4) { const s = h3(x, 77, z); if (s < 0.05) { const len = 2 + F(s * 200); if (h - slab < len || flo - h <= len) return T.CRYVIOLET || T.GEODE || 190; } }
    const s = h3(x, i + 40, z); if (s < 0.03) { const len = 1 + F(s * 230); if (h - slab < len || flo - h <= len) return rock(i, x, y, z, false); }
    return 0;
  }
  function gen(x, y, z, d) {
    try {
      U.n++;
      // Natural bedrock at/below world floor, except grandfathered legacy shafts (dynamic seal under deepest edit).
      if (y <= FLOOR) {
        if (legacyOpen(x, y, z)) return 0; // air — edits overlay exact cells via getB; never zero saved blocks
        return T.BEDROCK || T.HBEDROCK || 211;
      }
      if (d < TOP) return rock(0, x, y, z, false);
      const sea = (typeof SEA === 'number' ? SEA : 41);
      const maxD = sea - FLOOR - 1;
      if (d > maxD) {
        if (legacyOpen(x, y, z)) return 0;
        return T.BEDROCK || T.HBEDROCK || 211;
      }
      return level(x, y, z, d);
    } catch (e) { ERR('gen', e); return T.STONE; }
  }
  U.gen = gen; window.__c334.deep = (x, y, z, d) => gen(x, y, z, d);
  function hook() {
    const e = window.__c320; if (!e || !e.flat || !e.fearth || e.fearth.dw) return;
    if (window.__c341 && !e.fearth.c347) return;
    const f0 = e.fearth;
    const f = function (x, y, z) {
      if (y <= FLOOR) {
        if (window.__ukb && __ukb.out(x, z)) return 0;
        if (legacyOpen(x, y, z)) return 0;
        return T.BEDROCK || T.HBEDROCK || 211;
      }
      const a = y - SEA;
      if (a < -40) { if (window.__ukb && __ukb.out(x, z)) return 0; return gen(x, y, z, -a); }
      return f0.apply(this, arguments);
    };
    for (const k in f0) f[k] = f0[k]; f.c347 = f0.c347; f.top = f0.top; f.dw = 1; f.floorY = FLOOR; e.fearth = f; e.hol = null; e.pit = null; U.on++;
    try { if (window.__c324 && __c324.cache) __c324.cache.clear(); e.dirty = 1; e.edgeClr && e.edgeClr(); } catch (_) {}
    rebuildLegacy();
  }
  setInterval(() => { try { hook(); } catch (er) { ERR('hook', er); } }, 300);
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
  // Keep heat shimmer hard-off if an older wrap re-enables it
  try { setInterval(() => { const el = document.getElementById('l567shim'); if (el) { el.style.opacity = '0'; el.style.display = 'none'; } }, 2000); } catch (_) {}
  const PO = {x: 432, z: -400, top: SEA + 4, lat: 90, n: [0, 1, 0]};
  window.__c332 = {err: null, pole: PO, SH: () => PO, PY: () => null, inner: () => false, ig: () => 2, towers: () => [],
    where: () => { try { const d = SEA - P.y; return DIM.cur ? '' : d > 180 ? 'deep' : ''; } catch (_) { return ''; } },
    toCity: () => { try { return !!(window.__agr && __agr.go()); } catch (_) { return false; } }};
})();

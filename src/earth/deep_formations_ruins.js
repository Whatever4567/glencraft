/* GLX-C373 (v1.1.75, items 51 and 52): the deep layers are full of things to find. Every cavern band now has its own natural formations,
   spread with slow noise so no two areas look the same: stalactite forests and stalagmites, hourglass pillars and stone arches in every layer,
   flowstone in the limestone caves, giant glowcap mushrooms in the lush caves, echo slate spikes and deep chasms in the deep dark, lavafalls and
   red hot floors in the magma layer, crystal geodes in the molten depths, and red hot vents in the core. Each layer also has its own ancient
   ruins, all new designs: an old stone bridge with gate towers (limestone), a standing stone circle with an altar (lush), a gallery of stone
   guardians with crystal eyes (deep dark), a stepped fire temple with a lava moat (magma), a crystal obelisk shrine (molten), and a hall of
   gold capped columns (core). Everything is worked out on the fly from the spot, nothing is stored but what you change, and all of it can be dug. */
(function c373() {
  const U = window.__c373 = {err: null, on: 0};
  const S = Math.sin, A = Math.abs, F = Math.floor, hy = Math.hypot;
  const h3 = (x, y, z) => { let h = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ Math.imul(z, 2147483647); h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
  let t = null, B = null;
  const nat = v => v && v !== t.LAVA && v !== t.WATER;
  // ---------- 51: formations, only in the open air of a cavern (or carved into its walls for geodes) ----------
  function form(v, u, w, d, i, b, th) {
    const top = d - (b[2] - th), bot = (b[2] + th) - d, dens = 0.35 + 0.65 * (0.5 + 0.5 * S(u * 0.0041 + i * 3) * S(w * 0.0037 - i * 2));
    const ROCK = [t.WSTONE || t.STONE, t.MOSS || t.STONE, t.DEEPSLATE, t.BLACKSTONE || t.STONE, t.OBSIDIAN, t.STONE, t.OBSIDIAN][i];
    if (i === 4) { const gx = F(u / 40), gy = F(d / 40), gz = F(w / 40), g = h3(gx, gy + 77, gz); if (g < 0.35) { const R = 6 + g * 10, q = hy(u - gx * 40 - 20, d - gy * 40 - 20, w - gz * 40 - 20);
        if (q < R) return q < R - 2.6 ? 0 : q < R - 1.2 ? (h3(u, d, w) < 0.3 ? t.CRYCYAN || t.GLOWROCK : t.CRYVIOLET || t.OBSIDIAN) : t.OBSIDIAN; } }
    if (i === 2 && v && bot > -26 && bot < 0 && dens > 0.6) { const l = (((u * 0.6 + w * 0.8 + S(w * 0.05) * 6) % 140) + 140) % 140 - 70; if (A(l) < 1.6 + 0.04 * (26 + bot)) return 0; }
    if (v) { if ((i === 3 || i === 6) && bot > -1.5 && bot <= 0 && nat(v) && S(u * 0.11 + i) * S(w * 0.13 - i) > 0.28) return U.RED || t.MAGMA; return v; }
    if (top < 0 || bot < 0) return v;
    if (i === 3) { const cu = F(u / 36), cw = F(w / 36), g = h3(cu, cw, 331); if (g < 0.3 * dens && hy(u - cu * 36 - 18, w - cw * 36 - 18) < 1.1) return t.LAVA; }
    if (i === 1) { const cu = F(u / 22), cw = F(w / 22), g = h3(cu, cw, 141); if (g < 0.4 * dens) { const mu = cu * 22 + 6 + F(h3(cw, cu, 9) * 10), mw = cw * 22 + 6 + F(h3(cu, cw, 8) * 10), r = hy(u - mu, w - mw), Hm = 6 + g * 25;
        if (r < 1.4 && bot < Hm) return t.BIRCHLOG || t.LOG; const cr = 3.5 + g * 9, e = hy(r / cr, (bot - Hm) / 2.2); if (e < 1 && bot > Hm - 1.5) return e > 0.6 ? (U.CAP || t.GLOWROCK) : 0; } }
    // stalactites and stalagmites
    { const cu = F(u / 4), cw = F(w / 4), g = h3(cu, cw, i * 13 + 1); if (g < 0.24 * dens) { const r = hy(u - cu * 4 - 1.5 - h3(cw, cu, 3), w - cw * 4 - 1.5 - h3(cu, cw, 4)), L = th * (0.12 + g * 3);
        if (top < L && r < 1.7 * (1 - top / L)) return i === 0 ? (U.FLOW || ROCK) : i === 2 ? (U.ECHO || ROCK) : ROCK; } }
    { const cu = F(u / 5), cw = F(w / 5), g = h3(cu, cw, i * 13 + 2); if (g < 0.16 * dens) { const r = hy(u - cu * 5 - 2 - h3(cw, cu, 5), w - cw * 5 - 2 - h3(cu, cw, 6)), L = th * (0.08 + g * 3);
        if (bot < L && r < 1.5 * (1 - bot / L)) return i === 0 ? (U.FLOW || ROCK) : i === 2 ? (U.ECHO || ROCK) : i === 3 ? (t.MOONBASALT || ROCK) : ROCK; } }
    // hourglass pillars
    { const cu = F(u / 30), cw = F(w / 30), g = h3(cu, cw, i * 13 + 3); if (g < 0.3 * dens) { const tf = (d - b[2]) / th, r = hy(u - cu * 30 - 15, w - cw * 30 - 15); if (r < 1.8 + 4.5 * tf * tf) return ROCK; } }
    // arches
    { const cu = F(u / 70), cw = F(w / 70), g = h3(cu, cw, i * 13 + 4); if (g < 0.25 * dens) { const R = Math.min(th * 0.9, 15), ru = hy(u - cu * 70 - 35, bot); if (A(w - cw * 70 - 35) < 2.2 && A(ru - R) < 1.8) return ROCK; } }
    return v; }
  // ---------- 52: ruins, one chance per 180 block region of each band ----------
  const GS = 180;
  function ruin(u, w, d, i, b) { if (i === 5) return undefined; const ru = F(u / GS), rw = F(w / GS), hs = h3(ru, rw, i + 100); if (hs > 0.45) return undefined;
    const lu = u - (ru * GS + 50 + F(h3(rw, ru, i + 101) * 80)), lw = w - (rw * GS + 50 + F(h3(ru, rw, i + 102) * 80)); if (A(lu) > 40 || A(lw) > 40) return undefined;
    const h = (b[2] + b[3] * 0.5) - d, hf = F(h), q = h3(u, d, w), au = A(lu), aw = A(lw), m = Math.max(au, aw), r = hy(lu, lw);
    if (i === 0) { // old stone bridge with two gate towers
      if (aw > 3 && !(au > 32 && au <= 38 && aw <= 3)) return undefined; const SB = q < 0.25 ? t.MOSSYBRICK : t.STONEBRICK;
      if (au > 32 && au <= 38) { if (h < 0) return h > -30 ? SB : undefined; const e = au === 33 || au === 38 || aw === 3; if (h < 12) return e && !(hf < 4 && aw < 2) ? SB : 0; if (h < 13) return (au + aw) & 1 ? SB : 0; return undefined; }
      if (au > 32) return undefined; if (h < 0) return A(((lu + 600) % 12) - 6) < 1.6 && h > -40 ? SB : (h > -1 ? SB : undefined); if (h < 1) return SB; if (h < 2 && aw === 3) return lu % 3 ? SB : 0; return h < 9 ? 0 : undefined; }
    if (i === 1) { // standing stone circle with an altar
      if (r > 17) return undefined; if (h < 0) return h > -8 ? (t.MOSSYCOBBLE || t.COBBLE) : undefined; if (h < 1) return q < 0.5 ? t.MOSSYBRICK : t.MOSS || t.COBBLE;
      if (r < 3 && h < 2) return t.MOSSYCOBBLE || t.COBBLE; if (r < 1.5 && h < 3) return t.GLOWROCK;
      const a = Math.atan2(lw, lu), k = Math.round(a / (Math.PI / 5)), sa = k * Math.PI / 5, sx = Math.cos(sa) * 13, sz = Math.sin(sa) * 13;
      if (hy(lu - sx, lw - sz) < 1.5 && h < 7 + (k & 1)) return t.MOSSYBRICK; if (A(r - 13) < 1.2 && h >= 7 && h < 8 && (((k % 10) + 10) % 10) < 4 && q < 0.85) return t.STONEBRICK; return h < 12 ? 0 : undefined; }
    if (i === 2) { // gallery of stone guardians with crystal eyes
      if (au > 30 || aw > 12) return undefined; if (h < 0) return h > -8 ? t.DSBRICK || t.DEEPSLATE : undefined; if (h < 1) return t.DSTILE || t.DEEPSLATE;
      const k = Math.round((lu + 24) / 16), sx = lu - (k * 16 - 24), sz = aw - 8; if (k >= 0 && k <= 3 && A(sx) <= 4 && A(sz) <= 3) { const G = t.DSBRICK || t.DEEPSLATE, ax = A(sx), az = A(sz);
        if (h < 2) return ax <= 2 && az <= 2 ? G : 0; if (h < 8) return ax >= 0.5 && ax <= 2 && az <= 1 ? G : 0; if (h < 14) return ax <= 2.5 && az <= 1.5 ? G : ax <= 3.5 && az <= 1 && h > 9 ? G : 0;
        if (h < 17) { if (ax <= 1.5 && az <= 1.5) return hf === 15 && az > 1 && sz < 0 && ax > 0.4 && ax < 1.4 ? t.CRYCYAN || t.GLOWROCK : G; return 0; } }
      return h < 20 ? 0 : undefined; }
    if (i === 3) { // stepped fire temple with a lava moat
      if (m > 29) return undefined; if (h < 0) return h > -10 ? t.BLACKSTONE || t.STONE : undefined; if (m >= 26) return h < 1 ? t.LAVA : h < 26 ? 0 : undefined;
      const tp = Math.min(16, 24 - m); if (h < tp) return hf === tp - 1 && m % 4 === 3 ? (U.RED || t.MAGMA) : (q < 0.2 ? t.HELLBRICK || t.BLACKSTONE : t.BLACKSTONE || t.STONE);
      if (m <= 4 && h < tp + 6) { if (au === 3 && aw === 3) return t.HELLBRICK || t.BLACKSTONE; if (h < tp + 1 && m <= 1) return U.RED || t.MAGMA; if (hf === tp + 5 && m <= 3) return t.BLACKSTONE; return 0; }
      return h < 26 ? 0 : undefined; }
    if (i === 4) { // crystal obelisk shrine
      if (r > 16) return undefined; if (h < 0) return h > -8 ? t.OBSIDIAN : undefined; if (h < 1) return A(r - 9) < 0.8 || (au < 0.8 && r < 14) || (aw < 0.8 && r < 14) ? t.CRYVIOLET || t.GLOWROCK : t.OBSIDIAN;
      const wd = 2.6 - h / 14; if (h < 30 && au <= wd && aw <= wd) return t.OBSIDIAN; if (h >= 30 && h < 34 && m <= 3 - (h - 30) * 0.8) return t.CRYVIOLET || t.GLOWROCK;
      for (const [sx, sz] of [[10, 10], [-10, 10], [10, -10], [-10, -10]]) { const rr = hy(lu - sx, lw - sz); if (rr < 2 * (1 - h / 12)) return t.CRYCYAN || t.GLOWROCK; } return h < 36 ? 0 : undefined; }
    if (i === 6) { // hall of gold capped columns
      if (au > 31 || aw > 10) return undefined; if (h < 0) return h > -8 ? t.OBSIDIAN : undefined; if (h < 1) return (au % 12 === 3 && aw < 1) ? (U.RED || t.MAGMA) : ((F(lu / 3) + F(lw / 3)) & 1 ? t.GOLDBLOCK || t.OBSIDIAN : t.OBSIDIAN);
      const cu = lu - Math.round(lu / 6) * 6; if (aw >= 7 && aw <= 9 && hy(cu, aw - 8) < 1.4 && h < 18) return h >= 17 ? t.GOLDBLOCK || t.GLOWROCK : t.OBSIDIAN; if (h >= 18 && h < 20 && aw <= 9.5) return t.OBSIDIAN; return h < 18 ? 0 : undefined; }
    return undefined; }
  const iv = setInterval(() => { try { const c = window.__c334; if (!c || !c.deep || !c.deep.c368 || typeof T === 'undefined') return; clearInterval(iv); if (c.deep.c373) return; t = T; B = c.B; const d0 = c.deep;
    const w = function (x, y, z, d, dx, dy, dz) { let v = d0(x, y, z, d, dx, dy, dz); try { if (d < 40 || v === t.WATER) return v; const i = c.band(d), b = B[i]; if (!b[3] && i !== 5) return v;
        let u = x, ww = z; if (dx !== undefined) { const ax = A(dx), ay = A(dy), az = A(dz), k = ax >= ay && ax >= az ? 0 : ay >= az ? 1 : 2; u = k === 0 ? y : x; ww = k === 2 ? y : z; }
        if (b[3] && A(d - b[2]) < b[3] + 45) { const s = ruin(u, ww, d, i, b); if (s !== undefined) return s; }
        if (!b[3] || A(d - b[2]) > b[3] + 30) return v; const th = b[3] * (0.55 + 0.45 * S(x * 0.013 + z * 0.011 + i) * S(y * 0.017 - x * 0.009 + 2 * i)); return form(v, u, ww, d, i, b, th); } catch (e) { if (!U.err) U.err = String(e && e.stack || e).slice(0, 240); return v; } };
    w.c368 = 1; w.c373 = 1; c.deep = w; U.on = 1; try { if (window.__c324 && __c324.cache) __c324.cache.clear(); if (window.__c320) __c320.dirty = 1; } catch (_) {} } catch (e) { U.err = String(e); } }, 300);
})();

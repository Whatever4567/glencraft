/* GLX-C334 (v1.1.37): THE LAYERS OF THE EARTH. Dig down anywhere and the rock changes as you go, each layer with a big open cavern band
   and winding tunnels: shallow limestone caves with underground streams, lush caves with moss and blue glow grass, the deep dark of
   deepslate with cyan crystals and old brick ruins, magma and basalt caverns with lava seas and basalt columns, the molten depths with
   purple crystal fields, and the abyssal shell of obsidian and violet glow. Below that is the hollow inside of the Earth with its own sun.
   v1.1.38: each layer has its own buildings in its caverns: village ruins and a stone skull in the shallow caves, giant mushrooms and
   overgrown ruins in the lush caves, dark towers with lit windows in the deep dark, blackstone cathedrals with bridges over lava rivers and
   lavafalls in the magma layer, crystal clusters on the walls, and a giant glowing eye with gold steps in the abyssal shell.
   All of it is worked out on the fly from the spot (nothing stored but what you change) and every block can be dug. */
(function c334() {
  const U = window.__c334 = {err: null};
  const S = Math.sin, h3 = (x, y, z) => { let h = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ Math.imul(z, 2147483647); h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
  // bands: depth from, to, cavern middle, cavern half height
  const B = U.B = [[40, 150, 100, 12], [150, 270, 210, 17], [270, 400, 335, 19], [400, 540, 470, 23], [540, 690, 615, 21], [690, 790, 0, 0], [790, 930, 860, 17]];
  U.band = d => { for (let i = 0; i < B.length; i++) if (d < B[i][1]) return i; return B.length - 1; };
  // ---------- buildings, one chance per 96 block region of each cavern band ----------
  const G = 96, HS = [14, 26, 34, 40, 0, 0, 26];
  function bld(x, y, z, d, i, dx, dy, dz) { const hs = HS[i]; if (!hs) return undefined; const ax = Math.abs(dx), ay = Math.abs(dy), az = Math.abs(dz), k = ax >= ay && ax >= az ? 0 : ay >= az ? 1 : 2;
    const u = k === 0 ? y : x, v = k === 2 ? y : z, ru = Math.floor(u / G), rv = Math.floor(v / G), hr = h3(ru, rv, i * 7 + k); if (hr > (i === 6 ? 0.25 : 0.55)) return undefined;
    const cu = ru * G + 30 + Math.floor(h3(rv, ru, i) * 36), cv = rv * G + 30 + Math.floor(h3(ru + 9, rv, i) * 36), lu = u - cu, lv = v - cv, rr = Math.hypot(lu, lv), RF = i === 6 ? 22 : 20;
    if (rr > RF) return undefined; const fl = B[i][2] + B[i][3] * 0.55, h = fl - d; if (h < 0 || h >= hs) return undefined;
    const t = T, q = h3(x, y, z), au = Math.abs(lu), av = Math.abs(lv), hf = Math.floor(h);
    if (i === 0) { // village ruins and a stone skull
      const sk = Math.hypot(lu + 10, h - 6, lv) ; if (sk < 5.5) { const eye = h > 6 && h < 8.5 && Math.abs(lv) > 0.8 && Math.abs(lv) < 3.2 && lu > -11; return eye || (h < 3 && lu > -9 && Math.abs(lv) < 2 && (Math.round(lv) & 1)) ? 0 : t.WSTONE || t.STONE; }
      for (const [hx, hz] of [[4, -8], [8, 6], [-2, 9]]) { const ou = Math.abs(lu - hx), ov = Math.abs(lv - hz); if (ou <= 3 && ov <= 3 && (ou === 3 || ov === 3) && hf < 4 - (q < 0.4 ? 2 : 0) && !(hf < 2 && (ou === 0 || ov === 0))) return q < 0.3 ? t.MOSSYBRICK : t.COBBLE; }
      return 0; }
    if (i === 1) { // giant mushrooms and overgrown ruins
      for (const [mx, mz, mh] of [[0, 0, 18], [-11, 7, 12], [9, -9, 14]]) { const od = Math.hypot(lu - mx, lv - mz); if (od < 1.6 && h < mh) return t.BIRCHLOG || t.LOG; const cd = Math.hypot(lu - mx, (h - mh) * 2.2, lv - mz);
        if (h >= mh - 1 && cd < 7 && cd > 5.2) return q < 0.12 ? t.GLOWROCK : (t.WOOLPURPLE || t.WOOL); }
      if ((au === 15 || av === 15) && au <= 15 && av <= 15 && hf < 6 - Math.floor(q * 4)) return q < 0.5 ? t.MOSSYBRICK : t.MOSS; return 0; }
    if (i === 2) { // dark ancient-city towers with lit windows
      for (const [tx, tz, th] of [[0, 0, 32], [-12, 6, 24], [10, -10, 28], [9, 11, 20]]) { const ou = Math.abs(lu - tx), ov = Math.abs(lv - tz); if (ou <= 3 && ov <= 3 && h < th) { const edge = ou === 3 || ov === 3;
          if (!edge) return h < 1 ? t.DSTILE || t.DEEPSLATE : 0; return hf % 4 === 2 && (ou === 3 ? ov : ou) === 1 ? t.GLOWROCK : t.DSBRICK || t.DEEPSLATE; } }
      return h < 1 ? t.DSTILE || t.DEEPSLATE : 0; }
    if (i === 3) { // blackstone cathedral, lava river with a bridge, lavafalls
      if (Math.abs(lv - 13) < 3) { if (h < 1) return t.LAVA; if (au < 2 && hf === 1) return t.BLACKSTONE; return 0; }
      if (Math.hypot(lu + 14, lv + 12) < 1 || Math.hypot(lu - 15, lv + 6) < 1) return t.LAVA;
      if (au <= 7 && av <= 11 && lv < 10) { const roof = 22 + (7 - au) * 1.4; if (h > roof) return 0; const edge = au === 7 || av === 11;
        if ((au === 7 || au === 6) && av % 5 === 0 && h < roof + 8 - au) return t.BLACKSTONE; if (!edge) return h < 1 ? t.HELLBRICK || t.BLACKSTONE : h > roof - 1.2 ? t.BLACKSTONE : 0;
        if (hf > 3 && hf < 16 && (av % 4 === 2 || au % 4 === 2)) return q < 0.5 ? t.GLOWROCK : t.GLASS; if (hf < 7 && au < 2 && lv < -10) return 0; return t.BLACKSTONE; }
      for (const [sx, sz] of [[-5, -9], [5, -9]]) if (Math.hypot(lu - sx, lv - sz) < Math.max(0, 2.5 - (h - 22) * 0.12)) return t.BLACKSTONE;
      return h < 1 ? t.BLACKSTONE : 0; }
    if (i === 6) { // the giant glowing eye with gold steps up to it
      const ed = Math.hypot(lu, h - 16, lv * 0.5); if (Math.hypot(lu, h - 16, lv) < 9) { const p = Math.hypot(lu, h - 16); return p < 3 ? (t.GLOWGRASS || t.MOSS) : p < 7 ? (t.MAGMA) : (t.GLOWROCK); }
      if (lv < -2 && lv > -18 && au < 3 && h < (-lv - 2) * 0.55 + 1) return t.GOLDBLOCK || t.GLOWROCK; void ed; return 0; }
    return undefined; }
  function deep(x, y, z, d, dx, dy, dz) { const T_ = T, i = U.band(d), b = B[i]; if (dx !== undefined) { const s0 = bld(x, y, z, d, i, dx, dy, dz); if (s0 !== undefined) return s0; }
    // winding tunnels (well under the sea floor)
    const tw = d > 64 && Math.abs(S(x * 0.031 + y * 0.017 + 1) * S(z * 0.029 - y * 0.023 + 2) + 0.5 * S(x * 0.071 - z * 0.063 + y * 0.05)) < 0.04;
    let open = -9, fl = false;
    if (b[3]) { const th = b[3] * (0.55 + 0.45 * S(x * 0.013 + z * 0.011 + i) * S(y * 0.017 - x * 0.009 + 2 * i)); open = th - Math.abs(d - b[2]); fl = d > b[2];
      if (open > 0 && S(x * 0.23 + i) * S(z * 0.19 - i) > 0.86) open = -1; }   // stone columns hold the roof up
    if (open > 0 || tw) { if (open > 0 && fl && open < 2.2) { if (i === 0 || i === 1) return T_.WATER; if (i === 3 || i === 4) return T_.LAVA; } return 0; }
    const sk = open > -1.3, r = h3(x, y, z);
    switch (i) {
      case 0: if (sk && fl && r < 0.15) return T_.GRAVEL; return ((x >> 3) + (y >> 2) + (z >> 3)) & 1 ? T_.STONE : (T_.WSTONE || T_.STONE);
      case 1: if (sk) return fl ? (r < 0.25 ? T_.MUD || T_.DIRT : T_.GLOWGRASS || T_.MOSS) : T_.MOSS || T_.STONE; return r < 0.1 ? T_.MOSSYCOBBLE || T_.COBBLE : T_.STONE;
      case 2: if (sk && r < 0.09) return r < 0.03 ? T_.CRYVIOLET || T_.GLOWROCK : T_.CRYCYAN || T_.GLOWROCK; if (sk && fl && ((x & 15) < 2 || (z & 15) < 2) && S(x * 0.05) * S(z * 0.05) > 0.3) return T_.DSBRICK || T_.DEEPSLATE; return r < 0.3 ? T_.DSCOBBLE || T_.DEEPSLATE : T_.DEEPSLATE;
      case 3: if (sk && r < 0.05) return T_.MAGMA; if (S(x * 0.37) * S(z * 0.41) > 0.7) return T_.MOONBASALT || T_.BLACKSTONE; return r < 0.08 ? T_.MAGMA : T_.BLACKSTONE || T_.STONE;
      case 4: if (sk && fl && r < 0.35) return T_.CRYVIOLET || T_.OBSIDIAN; if (sk && r < 0.12) return r < 0.04 ? T_.CRYCYAN || T_.OBSIDIAN : T_.CRYVIOLET || T_.OBSIDIAN; return r < 0.25 ? T_.OBSIDIAN : T_.HELLROCK || T_.BLACKSTONE;
      case 5: return ((x * 7 + y * 13 + z * 5) & 15) ? T_.DEEPSLATE : T_.STONE;
      default: if (sk && r < 0.2) return r < 0.07 ? T_.GLOWROCK : T_.CRYVIOLET || T_.OBSIDIAN; return r < 0.04 ? T_.CRYVIOLET || T_.OBSIDIAN : T_.OBSIDIAN; } }
  U.deep = deep;
})();

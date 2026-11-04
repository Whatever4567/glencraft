/* ===================== GLX-C220 (v1.0.46): going into a house or a cave never turns the world to night.
   The old "underground" test (open-sky rays) counted any closed room or cave mouth as deep cave, and the cave look then darkened the fog and sky background, hid the sky dome,
   sun and far landscape - so through a door or cave mouth broad day looked like night. Now that cave look only switches on when you are really underground: a thick roof of rock
   (4+ solid blocks above your head) AND no opening to the open sky anywhere in sight. Houses, huts, overhangs and cave mouths keep the outside sky, sun, fog and light exactly as they
   are outside; only the rain sound reacts to shelter. Inside darkness comes from the per-block light as before (30% floor). ===================== */
(function c220() {
  const U = window.__c220 = {sees: 0, roof: 0, raw: 0, out: 0, n: 0, ms: 0, err: null};
  if (typeof caveDepth !== 'function') return;
  const SEE = (b) => b === T.AIR || b === T.WATER || b === T.GLASS || (typeof LEAFY !== 'undefined' && LEAFY[b]) || (typeof PLANT !== 'undefined' && PLANT[b] === 1);
  const DIRS = []; for (const e of [-0.18, 0, 0.2, 0.5, 0.95]) for (let a = 0; a < 24; a++) { const az = a / 24 * Math.PI * 2, ce = Math.cos(e); DIRS.push([Math.cos(az) * ce, Math.sin(e), Math.sin(az) * ce]); }
  DIRS.push([0, 1, 0]);
  const at = (x, y, z) => (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) ? T.AIR : world[idx(x, y, z)];
  function scan() { const t0 = performance.now(), ex = P.x, ey = P.y + 1.6, ez = P.z, px = Math.floor(ex), pz = Math.floor(ez), top = skyTop(px, pz);
    if (ey < 0 || ex < 0 || ez < 0 || ex >= W || ez >= D) { U.roof = 99; U.sees = 0; U.out = ey < 0 ? 0 : 1; U.n++; return; }   /* v1.1.81: below Y0 or off the old map you are simply underground or outside, no 121 ray march */
    // roof thickness straight above the eye (solid cells up to the column top)
    let roof = 0; for (let y = Math.floor(ey) + 1; y < Math.min(H, top + 1); y++) if (!SEE(at(px, y, pz))) roof++;
    // can you see the open sky (a cell above its column's top) from here?
    let sees = 0; for (const [dx, dy, dz] of DIRS) { for (let s = 0.6; s <= 28; s += 0.6) { const x = Math.floor(ex + dx * s), y = Math.floor(ey + dy * s), z = Math.floor(ez + dz * s);
        if (x < 0 || z < 0 || x >= W || z >= D || y >= H - 1) { sees++; break; } if (!SEE(at(x, y, z))) break; if (y >= skyTop(x, z)) { sees++; break; } } if (sees >= 2) break; }
    U.roof = roof; U.sees = sees; U.out = sees >= 2 || roof < 4 ? 1 : 0; U.n++; U.ms = Math.round((performance.now() - t0) * 100) / 100; }
  let T0 = 0;
  const cd = caveDepth; caveDepth = function () { const v = cd.apply(this, arguments); U.raw = v; if (!(v > 0) || DIM.cur) return v;
    try { const now = performance.now(); if (now - T0 > 200) { T0 = now; scan(); } } catch (e) { if (!U.err) U.err = String(e && e.stack || e); return v; }
    return U.out ? 0 : v; };
})();

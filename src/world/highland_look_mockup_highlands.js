/* GLX-C281 (v1.0.91): the Highland look from the mockup for new Highlands worlds - tall blocky pine forests on the hills and glens,
   a few pines mixed in with the OG oaks round spawn, purple heather moors, leafy juniper bushes with bluebells and ferns. Runs once
   when a new world is generated (gated on g89 like the rest of the new terrain); saved worlds are never touched. */
(function c281() {
  const U = window.__c281 = {err: null, pines: 0, heather: 0, bushes: 0, ms: 0};
  const on = () => !!(window.__g89 && __g89());
  const gtop = (x, z) => { const c = x * H * D + z; for (let y = H - 2; y > 1; y--) { const b = world[c + y * D]; if (b && !PLANT[b]) return y; } return 0; };
  function dress() { const t0 = performance.now(), cx = W >> 1, cz = D >> 1; let s = ((gSeed | 0) ^ 0x281) >>> 0; const r = () => (s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296;
    const fb = (x, z, f) => { try { return Math.max(-1, Math.min(1, g9fbm(x * f, z * f, 3) * 3.3)); } catch (_) { return Math.sin(x * f * 7.1) * Math.cos(z * f * 6.3); } };
    const C = window.__c273, RE = C && C.RE ? C.RE() : W * 0.46, MT = C && C.MT ? C.MT() : [0, 0], VO = C && C.volc ? C.volc() : [0, 0];
    const LOG = T.PINELOG || T.LOG, LF = T.PINELEAVES || T.LEAVES, BU = T.JUNIPERLEAVES || T.LEAVES, HE = T.HEATHER, GR = T.GRASS, GV = T.GRAVEL;
    const okG = (x, z, g) => world[idx(x, g, z)] === GR && !world[idx(x, g + 1, z)] && g > SEA + 1;
    const nearPath = (x, z, g) => { for (const [dx, dz] of [[2, 0], [-2, 0], [0, 2], [0, -2], [3, 3], [-3, -3], [3, -3], [-3, 3]]) if (world[idx(x + dx, gtop(x + dx, z + dz), z + dz)] === GV) return true; return false; };
    const away = (x, z) => { const q = Math.pow(Math.pow(Math.abs(x - cx), 3) + Math.pow(Math.abs(z - cz), 3), 1 / 3); return q < RE - 8 && Math.hypot(x - MT[0], z - MT[1]) > 150 * W / 864 && Math.hypot(x - VO[0], z - VO[1]) > 70; };
    function pine(x, z, g) { const th = 9 + Math.floor(r() * 7); for (let y = 0; y <= th + 2; y++) for (let dx = -3; dx <= 3; dx++) for (let dz = -3; dz <= 3; dz++) { if (y < 3 && (dx || dz)) continue; const b = world[idx(x + dx, g + 1 + y, z + dz)]; if (b && !PLANT[b]) return false; }
      world[idx(x, g, z)] = T.DIRT; for (let y = 1; y <= th; y++) world[idx(x, g + y, z)] = LOG;
      // stepped cone: wide skirts low down, narrowing to a spike - the blocky Highland pine silhouette
      for (let y = 3; y <= th + 1; y++) { const f = (th + 1 - y) / (th - 2), rad = y > th ? 0 : Math.max(1, Math.round(f * 3.1 - ((y & 1) ? 0.8 : 0)));
        for (let dx = -rad; dx <= rad; dx++) for (let dz = -rad; dz <= rad; dz++) { if (dx * dx + dz * dz > rad * rad + 1) continue; const i = idx(x + dx, g + y, z + dz); if (!world[i] || PLANT[world[i]]) world[i] = LF; } }
      world[idx(x, g + th + 1, z)] = LF; world[idx(x, g + th + 2, z)] = LF; return true; }
    let n = 0, h = 0, b = 0;
    // pine forests: clustered by noise, thicker on the hills, none on the open spawn meadow
    for (let k = 0; k < 26000 && n < 320; k++) { const x = 6 + Math.floor(r() * (W - 12)), z = 6 + Math.floor(r() * (D - 12)), ds = Math.hypot(x - cx, z - cz);
      if (!away(x, z)) continue; const f = fb(x + 911, z - 377, 0.012) + (ds < 115 ? -0.9 : 0) + (ds < 60 ? -9 : 0); if (f < 0.12 && !(ds > 60 && ds < 115 && r() < 0.03)) continue;
      const g = gtop(x, z); if (!okG(x, z, g) || g > SEA + 52 || nearPath(x, z, g)) continue; if (pine(x, z, g)) n++; }
    // heather moors + juniper bushes with bluebells and ferns
    for (let x = 4; x < W - 4; x += 1) for (let z = 4; z < D - 4; z += 1) { const ds = Math.hypot(x - cx, z - cz); if (ds < 40 || !away(x, z)) continue;
      const m = fb(x - 1203, z + 555, 0.02); if (m < 0.36) continue; const g = gtop(x, z); if (world[idx(x, g, z)] !== GR) continue;
      if (r() < 0.75) { world[idx(x, g, z)] = HE; h++; }
      if (m > 0.4 && r() < 0.012 && !world[idx(x, g + 1, z)] && !nearPath(x, z, g)) { for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) for (let dy = 1; dy <= 2; dy++) { if (dy === 2 && (dx && dz)) continue; const i = idx(x + dx, g + dy, z + dz); if (!world[i] || PLANT[world[i]]) world[i] = BU; } b++; }
      else if (!world[idx(x, g + 1, z)] && r() < 0.05) world[idx(x, g + 1, z)] = r() < 0.6 ? T.BLUEBELL : T.FERN; }
    U.pines = n; U.heather = h; U.bushes = b; U.ms = Math.round(performance.now() - t0); }
  const gen = generate; generate = function () { const res = gen.apply(this, arguments); try { if (on()) { dress(); try { dirtyAll = true; } catch (_) {} } } catch (e) { U.err = String(e && e.stack || e).slice(0, 300); } return res; };
})();

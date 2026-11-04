/* GLX-C368 (v1.1.69, item 38): the deep layers are bigger, richer and drier.
   Every cavern band is much taller, so each layer is an enormous open cave world. There are about three times as many winding
   tunnels, joining the layers into one connected world. Each layer has its own ores in small veins. The old puddles on the cavern
   floors are gone: water stays only in a few streams in the limestone caves, and the lava seas stay in the magma and molten layers. */
(function c368() {
  const U = window.__c368 = {err: null, on: 0};
  const S = Math.sin, h3 = (x, y, z) => { let h = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ Math.imul(z, 2147483647); h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
  const ORES = () => [[T.COALORE, T.IRONORE, T.COPPERORE], [T.COPPERORE, T.LAZORE, T.IRONORE], [T.SILVERORE, T.DIAMONDORE, T.REDORE],
    [T.GOLDORE, T.RUBYORE, T.REDORE], [T.COBALTORE, T.DIAMONDORE, T.RUBYORE], [T.IRONORE, T.COALORE], [T.DIAMONDORE, T.GOLDORE, T.COBALTORE]].map(a => a.filter(Boolean));
  let OR = null;
  const t = setInterval(() => { try { const c = window.__c334; if (!c || !c.deep || typeof T === 'undefined') return; clearInterval(t); if (c.deep.c368) return;
    const HG = [20, 28, 30, 36, 34, 0, 30]; for (let i = 0; i < c.B.length; i++) if (HG[i]) c.B[i][3] = HG[i];
    OR = ORES(); const d0 = c.deep;
    const w = function (x, y, z, d, dx, dy, dz) { let v = d0(x, y, z, d, dx, dy, dz); const i = c.band(d);
      if (v === T.WATER && !(i === 0 && S(x * 0.021 + z * 0.017) * S(z * 0.013 - x * 0.006 + 1) > 0.55)) v = 0;
      if (!v || v === T.LAVA || v === T.WATER) return v;
      if (d > 64) { const a = S(x * 0.043 - y * 0.031 + 5) * S(z * 0.047 + y * 0.027 + 3) + 0.5 * S(x * 0.083 + z * 0.077 - y * 0.06), b = S(z * 0.037 + y * 0.041 + 7) * S(x * 0.039 - y * 0.035 + 9);
        if (Math.abs(a) < 0.05 || Math.abs(b) < 0.035) return 0; }
      const o = OR[i]; if (o && o.length) { const r = h3(x >> 1, y >> 1, z >> 1); if (r < 0.022) { const k = h3(x, y, z); if (k < 0.6) return o[Math.floor(r / 0.022 * o.length)]; } }
      return v; };
    w.c368 = 1; c.deep = w; U.on = 1;
    try { if (window.__c324 && __c324.cache) __c324.cache.clear(); if (window.__c320) __c320.dirty = 1; } catch (_) {} } catch (e) { U.err = String(e); } }, 300);
})();

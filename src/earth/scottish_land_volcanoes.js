/* GLX-C342 (v1.1.48): SCOTTISH LAND, NOT DESERT, AND THE UK VOLCANOES. The pyramid desert is gone (Scotland has no desert): its land is laid
   as Highland ground like the rest, the pyramid way down to Agartha is closed (the hole on the North island is the only way in), and the
   saucer night trip now flies to the lava crater on Ardnamurchan. Weathered old volcanoes stand at the real volcanic sites of the UK and
   Ireland: Arthur's Seat and the Lothian and Fife laws, Skye, Mull, Rum, Ardnamurchan, Arran, Staffa and the Giant's Causeway basalt
   columns, St Kilda, Antrim, the Lake District, Snowdonia, Dartmoor and the Midlands hills. Two craters hold lava. No clouds, and no
   painted map picture sits over the real land when you fly up (GLX-C339 no longer adds it). */
(function c342() {
  const U = window.__c342 = {err: null, n: 0, ufo: 0};
  const ERR = (w, e) => { if (!U.err) U.err = w + ' ' + String(e && e.stack || e).slice(0, 240); };
  const A = () => window.__c341, C9 = () => window.__c339;
  // lat, lon, radius (blocks), height (blocks), kind: h hill, c crag, k columns, v crater with lava
  const V = [[55.944, -3.162, 30, 20, 'c'], [55.949, -3.2, 10, 10, 'c'], [56.077, -2.641, 9, 18, 'c'], [56.05, -2.72, 14, 16, 'h'], [55.963, -2.67, 16, 13, 'h'], [56.23, -2.93, 16, 15, 'h'],
    [56.03, -4.2, 55, 16, 'h'], [56.2, -3.7, 60, 15, 'h'], [55.94, -4.57, 9, 12, 'c'], [57.22, -6.22, 70, 36, 'c'], [57.51, -6.18, 36, 26, 'c'], [56.42, -6.02, 48, 30, 'v'],
    [56.435, -6.34, 10, 8, 'k'], [57.0, -6.33, 34, 28, 'c'], [56.72, -6.1, 40, 18, 'v'], [55.6, -5.2, 40, 26, 'c'], [55.25, -5.12, 9, 18, 'h'], [57.81, -8.58, 16, 24, 'c'],
    [55.24, -6.51, 24, 7, 'k'], [54.88, -6.1, 18, 16, 'h'], [55.0, -6.3, 70, 9, 'h'], [54.45, -3.21, 50, 30, 'c'], [54.53, -3.02, 40, 26, 'h'], [53.07, -4.08, 55, 34, 'c'],
    [52.7, -3.91, 36, 24, 'c'], [50.57, -3.92, 70, 14, 'h'], [50.6, -4.16, 10, 10, 'c'], [52.72, -1.25, 26, 9, 'h'], [52.43, -2.6, 24, 11, 'h'], [52.67, -2.55, 16, 12, 'h'],
    [55.70, -4.88, 24, 18, 'v'],[55.66, -4.53, 24, 18, 'v'],[55.77, -4.27, 24, 18, 'v'],[55.90, -4.02, 24, 18, 'v'],[55.64, -3.73, 24, 18, 'v'],[55.70, -3.34, 24, 18, 'v'],[55.79, -2.92, 24, 18, 'v'],[55.38, -4.30, 24, 18, 'v'],[55.18, -4.65, 24, 18, 'v'],[55.14, -4.07, 24, 18, 'v'],[54.99, -5.07, 24, 18, 'v'],[55.31, -2.96, 24, 18, 'v'],[55.09, -2.86, 24, 18, 'v'],[55.14, -2.48, 24, 18, 'v'],[55.38, -2.77, 24, 18, 'v'],[54.99, -6.23, 24, 18, 'v'],[54.86, -5.94, 24, 18, 'v'],[54.66, -5.69, 24, 18, 'v'],[54.47, -6.52, 24, 18, 'v'],[54.60, -5.94, 24, 18, 'v'],[53.88, -6.23, 24, 18, 'v'],[53.82, -4.69, 24, 18, 'v'],[54.21, -3.44, 24, 18, 'v'],[54.31, -3.25, 24, 18, 'v'],[53.04, -4.02, 24, 18, 'v'],[52.81, -4.21, 24, 18, 'v'],[52.59, -3.92, 24, 18, 'v'],[51.68, -4.98, 24, 18, 'v'],[52.91, -2.09, 24, 18, 'v'],[52.52, -1.80, 24, 18, 'v'],[52.29, -2.48, 24, 18, 'v'],[52.20, -0.75, 24, 18, 'v'],[50.51, -4.21, 24, 18, 'v'],[50.64, -3.73, 24, 18, 'v'],[56.55, -4.98, 24, 18, 'v'],[56.29, -3.25, 24, 18, 'v'],[57.596, -13.687, 6, 12, 'c'], [53.26, -1.91, 5, 0, 's'], [53.14, -1.56, 5, 0, 's'], [51.38, -2.36, 5, 0, 's']];
  let VX = null;
  const xz = (lat, lon) => { const c = C9(); return [(W >> 1) + (lon - c.LON0) * c.K * Math.cos(lat * Math.PI / 180), (D >> 1) - (lat - c.LAT0) * c.K]; };
  const hs = (i, j) => { const s = Math.sin(i * 127.1 + j * 311.7 + 7.1) * 43758.5453; return s - Math.floor(s); };
  const ss = t => t * t * (3 - 2 * t);
  function vxs() { if (VX) return VX; const c = C9(); if (!c || !c.K || c.LAT0 === undefined) return []; VX = V.map(([la, lo, r, h, k]) => { const [x, z] = xz(la, lo), q = c.K / 300; return {x, z, r: r * q, h, k, la, lo}; }); U.n = VX.length; return VX; }
  U.craters = () => vxs().filter(v => v.k === 'v'); U.list = () => vxs().map(v => [v.k, Math.round(v.x), Math.round(v.z), v.r]);
  function hT(x, z) { const h = A().hT0(x, z); let g = h[0], kind = 0, L = h[2];
    for (const v of vxs()) { const dx = x - v.x, dz = z - v.z, d2 = dx * dx + dz * dz; if (d2 > v.r * v.r) continue; const d = Math.sqrt(d2) / v.r, base = Math.max(1, g);
      let t = ss(1 - d), add;
      if (v.k === 's') { if (Math.max(1, h[0]) > 1) { g = Math.max(1, h[0]); kind = d < 0.55 ? 'w' : 'r'; } continue; }
      if (v.k === 'k') { const cx = Math.floor((x + (Math.floor(z / 2) & 1)) / 2), cz = Math.floor(z / 2); add = Math.round(v.h * ss(Math.min(1, (1 - d) * 1.6)) * (0.6 + 0.4 * hs(cx, cz))); }
      else if (v.k === 'c') { const n = hs(Math.floor(x / 3), Math.floor(z / 3)); add = Math.round(v.h * Math.pow(t, 0.7) * (0.8 + 0.3 * n)); if (dx > 0) add = Math.round(add * (0.75 + 0.25 * (1 - d))); }
      else if (v.k === 'v') { add = Math.round(v.h * (d < 0.3 ? ss(d / 0.3) * 0.75 : ss((1 - d) / 0.7))); }
      else add = Math.round(v.h * t * (0.9 + 0.15 * hs(Math.floor(x / 4), Math.floor(z / 4))));
      const ng = base + add; if (ng > g || (v.k === 'v' && d < 0.3)) { g = ng; L = Math.max(L, 0.7); kind = v.k === 'v' && d < 0.22 ? 'l' : (v.k === 'k' || v.k === 'v' || (v.k === 'c' && d < 0.55)) ? 'b' : (v.k === 'c' ? 'r' : kind); if (kind === 'l') g = base + Math.round(v.h * 0.35); } }
    return [g, h[1], L, kind]; }
  // hook into the Scotland rebuild and the land outside the map
  try { const a = A(); a.hT0 = a.hT; a.hT = hT; } catch (e) { ERR('ht', e); }
  let lay0 = null;
  setInterval(() => { try { const e = window.__c320; if (!e || !e.flat || !A()) return;
      if (!e.g342) { e.g342 = 1; const g0 = e.ground; e.ground = function (x, y, z) { if (!e.flat) return g0.apply(this, arguments); const h = hT(x, z), g = h[0];
          const kind = h[3] === 'w' ? 16 : h[3] === 'l' ? 15 : h[3] === 'b' ? 12 : h[3] === 'r' ? 11 : g <= 0 ? 0 : g <= 2 && h[2] < 0.62 ? 0 : h[1] > 0.5 && g > 40 ? 2 : h[1] > 0.4 && g > 12 ? 10 : 1; return [g, kind]; };
        lay0 = e.layer; e.layer = function (r, dd, kind, x, y, z) { if (kind === 12) return dd < 1 ? (T.BLACKSTONE || T.STONE) : (T.DEEPSLATE || T.STONE); if (kind === 16) return dd < 1 ? T.WATER : T.STONE; if (kind === 15) return dd < 1 ? T.LAVA : (T.DEEPSLATE || T.STONE);
          if (kind === 11) return T.STONE; if (kind === 10) return dd < 1 ? (T.HEATHER || T.GRASS) : dd < 4 ? T.DIRT : T.STONE; return lay0.apply(this, arguments); };
        try { const c = C9(); c.fresh && c.fresh(); } catch (_) {} } } catch (er) { ERR('gr', er); } }, 700);
  // the saucer flies to the Ardnamurchan crater; no pyramid way down to Agartha
  setInterval(() => { try { const P9 = window.__c239; if (!P9 || !started || DIM.cur) return; const v = vxs().find(q => q.la === 56.72); if (!v) return;
      if (!P9.pyr || !P9.pyr.volcano || !(U.ufo % 5)) { const cx = Math.round(v.x), cz = Math.round(v.z); let cy = SEA + 4; try { for (let y = H - 2; y > 0; y--) { const b = getB(cx, y, cz); if (b) { cy = y + 1; break; } } } catch (_) {}
        P9.pyr = {cx, cz, cy, hy: 0, volcano: 1}; U.ufo++; try { if (window.__c332 && __c332.PY) { /* findPY needs the pyramid's L(): none, so the pyramid hole is gone */ } } catch (_) {} } } catch (e) { ERR('ufo', e); } }, 2000);
  // no clouds
  (function nc() { requestAnimationFrame(nc); try { if (typeof cloudMat !== 'undefined' && cloudMat) { cloudMat.opacity = 0; cloudMat.visible = false; } if (typeof clouds !== 'undefined' && clouds) for (const c of clouds) if (c) c.visible = false; for (const n of ['clouds', 'cloud', 'cloudLayer', 'cloudGroup']) { const o = scene.getObjectByName(n); if (o) o.visible = false; } } catch (_) {} })();
})();

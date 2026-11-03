/* GLX-C339 (v1.1.44): THE UK. Earth is now just Great Britain and Ireland on a normal flat world, with Glencraft laid onto Scotland and its spawn
   unchanged, then open sea all round and a field of sea ice past it. No globe, no disc, no dome. Agartha and the saucer home are on a small
   snowy island far north of Scotland. Under the land the diggable layers, the caves and Agartha are still there, and under them the hollow
   Earth. The Moon and Mars are still round and work exactly as before. */
(function c339() {
  const U = window.__c339 = {err: null, px: 0, tex: 0};
  const ERR = (w, e) => { if (!U.err) U.err = w + ' ' + String(e && e.stack || e).slice(0, 300); };
  const K = U.K = 300, LAT0 = U.LAT0 = 57.45, LON0 = U.LON0 = -3.75, RD = U.RD = 1e9, WT = 0, WH = 0, IR = U.IR = 2600, OR = U.OR = 3100, UZ = 885;
  const E = () => window.__c320, big = () => { try { return !!(window.__c317 && __c317.on()); } catch (_) { return false; } };
  let PX = 0, PZ = 0; const e3flat = () => { const e = E(); return !!(e && e.flat); };
  // map spot -> latitude and longitude (polar map, magnified round Glencraft)
  function fll(x, z) { const lat = LAT0 - (z - (D >> 1)) / K, lon = LON0 + (x - (W >> 1)) / (K * Math.cos(lat * Math.PI / 180));
    if (lat < 49.85 || lat > 61.2 || lon < -11 || lon > 2.2 || (lat < 51.1 && lon > 1.45)) return [0, -150]; return [lat, lon]; }
  const dU = (x, z) => Math.hypot(x + 0.5 - (W >> 1), z + 0.5 - ((D >> 1) + UZ));
  U.fll = fll; U.col = (x, z) => col(x, z);; U.fresh = () => { GC.clear(); const e = E(); try { e && e.edgeClr && e.edgeClr(); } catch (_) {} try { __c324.cache.clear(); } catch (_) {} if (e) e.dirty = 1; }; U.fe = (x, y, z) => fearth(x, y, z);
  const GC = new Map(); const col = (x, z) => { const k = x * 131072 + z; let g = GC.get(k); if (!g) { g = E().ground(x, SEA, z, 0, 1, 0); GC.set(k, g); if (GC.size > 300000) GC.clear(); } return g; };
  const DS = () => T.DEEPSLATE || T.STONE, ICE = () => T.PACKSNOW || T.ICE || T.SNOW;
  function hollow(x, y, z, d) { if (d < 1000) return DS(); const C2 = window.__c332, ig = C2 && C2.ig ? C2.ig(x, SEA, z, 0) : 2, top = 1200 - ig;
    if (d < top) return d > 1200 ? T.WATER : 0; const dd = d - top; if (d > 1450) return 0;
    if (dd < 1) { const sh = C2 && C2.SH && C2.SH(); if (sh && Math.abs(x - sh.x - 14) <= 1 && Math.abs(z - sh.z) <= 1) return T.GLOWROCK || T.LAMP; return ig < 0.6 ? T.SAND : T.GRASS; } return dd < 4 ? (ig < 0.6 ? T.SAND : T.DIRT) : dd > 60 ? DS() : T.STONE; }
  function fearth(x, y, z) { try { const e = E(), a = y - SEA, dP = Math.hypot(x + 0.5 - PX, z + 0.5 - PZ);
      if (dP >= RD) return dP < RD + WT && a < WH && a > -60 ? ICE() : 0;
      { const u = dU(x, z); if (u > OR) return 0; if (a < 0 && a >= -2 && u > IR) return ICE(); }
      if (a >= -40 && a < 40 && e.pit) { const q = e.pit(x, y, z); if (q !== undefined) return q; }
      if (a > 32) return 0;
      if (a >= -40) { const g = col(x, z); if (a < g[0]) return e.layer(e.R, g[0] - a, g[1], x, y, z); return a < 0 ? T.WATER : 0; }
      const d = -a; if (d < 930 && e.hol) return e.hol(x, y, z, 0, e.R - d, 0, e.R - d); return hollow(x, y, z, d); } catch (er) { ERR('fe', er); return 0; } }
  // v1.1.52: the old far sea disc, ice ring mesh and painted land plane are deleted (the real block sea and land are drawn by earth_chunk_streaming)
  setInterval(() => { try { const e = E(); if (!e) return; const f = big(); if (f) { PX = W >> 1; PZ = -400; e.FP = [PX, PZ]; U.px = PX; }
      if (e.flat !== f) { e.flat = f; e.fll = fll; e.fearth = fearth; GC.clear(); try { e.edgeClr && e.edgeClr(); } catch (_) {} try { __c324.cache.clear(); } catch (_) {} e.dirty = 1; }
      const a = typeof started !== "undefined" && started && f; try { const b = __c317.FAR.getObjectByName('earth326'); if (b) b.material.visible = !f; if (U.hid !== f || (U.hk = (U.hk || 0) + 1) % 8 === 0) { U.hid = f; const NM = U.NM || (U.NM = new Set(['sea320', 'floor320', 'seaBall320', 'floorBall320', 'dome309'])); scene.traverse(o => { if (o.material && NM.has(o.name)) o.material.visible = !f; }); } if (typeof seaRing !== 'undefined' && seaRing) seaRing.children.forEach(o => { o.material.visible = !f; }); } catch (_) {}
      if (a && !U.safe) { U.safe = 1; const w = window.__c321 ? __c321.pw() : P, off = !(w.x >= 0 && w.x < W && w.z >= 0 && w.z < D); if (off && w.y < SEA - 1500 && !(window.__c332 && __c332.where() === 'city')) { try { __c321.leave(); } catch (_) {} P.x = (W >> 1) + 0.5; P.z = (D >> 1) + 0.5; P.y = groundTop(W >> 1, D >> 1) + 1; P.vy = 0; P.fallTop = null; U.moved = 1; } } } catch (er) { ERR('loop', er); } }, 250);
})();

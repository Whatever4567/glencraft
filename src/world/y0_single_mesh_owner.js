/* GLX-C396 (v1.1.96): Y0-1 SINGLE MESH OWNER. Deep chunk fill used to copy getB for wy<=1 into the deep
   mesh while the surface chunk mesh already drew those layers, so Y0-1 flashed or left holes. While the
   deep mesher runs (__c317mesh), getB reports air for in-bounds Y0-1 so deep never dual-draws them.
   Surface keeps Y0-1. getB/collision stay agreed outside that pass. The Y0 underside seal (__YB) stays. */
(function c396() {
  const U = window.__c396 = {err: null, skip: 0, on: 0};
  const ERR = (w, e) => { if (!U.err) U.err = w + ' ' + String(e && e.stack || e).slice(0, 240); };
  try {
    const gb = getB;
    getB = function (x, y, z) {
      try {
        if (window.__c317mesh && window.__c320 && __c320.flat && y >= 0 && y <= 1) {
          const Z0 = (typeof __XZ !== 'undefined' && __XZ) ? __XZ : 0;
          if (x >= 0 && x < W && z < D && z >= Z0) { U.skip++; return T.AIR; }
        }
      } catch (_) {}
      return gb.apply(this, arguments);
    };
    U.on = 1;
  } catch (e) { ERR('gb', e); }
  try { if (!window.__YB) window.__YB = (x, z) => { try { const b = getB(x, -1, z); return b || T.STONE; } catch (_) { return T.STONE; } }; } catch (_) {}
})();
